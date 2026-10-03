import { Response, NextFunction } from 'express';
import type { PoolClient } from 'pg';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireTenantId } from '../middleware/tenant';
import { resolveActorName } from '../utils/actorName';
import { resolveStageForWrite } from '../utils/pipelineStages';
import { QUALIFIED_STAGES } from '../utils/leadQualification';
import { workspaceDefaultCurrency } from './workspaceController';

/**
 * POST /api/v1/leads/:id/convert — REAL lead conversion. Step 5, slice B.
 *
 * Body:
 *   contact: { mode: 'create', first_name?, last_name? } | { mode: 'link', contact_id }
 *   company: { mode: 'none' } | { mode: 'create', name? } | { mode: 'link', company_id }
 *   deal:    null | { name, value, currency?, expected_close_date?, pipeline_id? }
 *
 * Before this, the conversion wizard minted client-side ids (cnt_/acc_/deal_)
 * and showed "New records created successfully" over a database where nothing
 * had been created. Now ONE transaction creates or links every record, marks
 * the lead converted with references to what it became (migration 059) and
 * writes its stage history — all of it lands, or none of it does.
 *
 * RATIFIED 2026-10-03 (Venkat):
 *   - Only a lead in qualified / sales_accepted converts (409 otherwise), and a
 *     lead converts once (409).
 *   - A deal created here needs a real `value`. There is no default to 0.
 *   - If the lead's email already belongs to a contact, creating one is a 409
 *     naming that contact — NEVER an automatic link. Linking is the rep's
 *     explicit choice (`contact: { mode: 'link', contact_id }`).
 *   - Created records are owned by the converting user. Interim, until the
 *     owner model is settled; there is deliberately no owner field in the body.
 *
 * Every linked id is proven to belong to the caller's workspace inside the
 * transaction (and share-locked, so it cannot vanish before COMMIT): every FK
 * here references a global primary key, so Postgres alone would accept a
 * record from another workspace. A 400 names the field and never discloses
 * that the row exists elsewhere.
 */

class ConversionRefusal extends Error {
  constructor(public status: number, public body: Record<string, unknown>) {
    super(String(body.message));
  }
}
const refuse = (status: number, message: string, extra: Record<string, unknown> = {}): never => {
  throw new ConversionRefusal(status, { success: false, message, ...extra });
};

const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

type ContactSpec = { mode: 'create'; first_name?: string; last_name?: string } | { mode: 'link'; contact_id: string };
type CompanySpec = { mode: 'none' } | { mode: 'create'; name?: string } | { mode: 'link'; company_id: string };
interface DealSpec { name: string; value: number; currency?: string; expected_close_date?: string; pipeline_id?: string }

/** Shape checks that need no database. Throws ConversionRefusal (400). */
function parseBody(body: any): { contact: ContactSpec; company: CompanySpec; deal: DealSpec | null } {
  const contact = body?.contact ?? { mode: 'create' };
  const company = body?.company ?? { mode: 'none' };
  const deal = body?.deal ?? null;

  if (contact.mode !== 'create' && contact.mode !== 'link') refuse(400, "contact.mode must be 'create' or 'link'");
  if (contact.mode === 'link' && !text(contact.contact_id)) refuse(400, 'contact.contact_id is required to link a contact');

  if (!['none', 'create', 'link'].includes(company.mode)) refuse(400, "company.mode must be 'none', 'create' or 'link'");
  if (company.mode === 'link' && !text(company.company_id)) refuse(400, 'company.company_id is required to link a company');

  if (deal !== null) {
    if (typeof deal !== 'object') refuse(400, 'deal must be an object or null');
    if (!text(deal.name)) refuse(400, 'deal.name is required');
    // RATIFIED: no default to 0. An absent, blank or non-numeric value is
    // refused; an explicit 0 is a real value someone chose and is accepted.
    if (deal.value === undefined || deal.value === null || deal.value === '') {
      refuse(400, 'deal.value is required to create a deal');
    }
    const n = Number(deal.value);
    if (!Number.isFinite(n) || n < 0) refuse(400, 'deal.value must be a non-negative number');
    if (deal.expected_close_date && Number.isNaN(Date.parse(String(deal.expected_close_date)))) {
      refuse(400, 'deal.expected_close_date must be a date');
    }
  }
  return { contact, company, deal: deal === null ? null : { ...deal, value: Number(deal.value) } };
}

/** SELECT … FOR SHARE scoped to the workspace: proves ownership and pins the row. */
async function rowInTenant(
  db: PoolClient, table: 'contacts' | 'companies', id: string, tenantId: string, cols: string,
): Promise<any | null> {
  const r = await db.query(`SELECT ${cols} FROM ${table} WHERE id = $1 AND tenant_id = $2 FOR SHARE`, [id, tenantId]);
  return r.rows[0] ?? null;
}

export const convertLead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let client: PoolClient | null = null;
  try {
    const tenantId = requireTenantId(req);
    const spec = parseBody(req.body);
    const actorIdRaw = Number(req.user?.id);
    const actorId = Number.isInteger(actorIdRaw) && actorIdRaw > 0 ? actorIdRaw : null;
    const actorName = resolveActorName(req);

    client = await pool.connect();
    await client.query('BEGIN');

    // Lock the lead alone (lesson 11): two concurrent conversions serialise
    // here and the second sees 'converted'.
    const locked = await client.query('SELECT * FROM leads WHERE id = $1 AND tenant_id = $2 FOR UPDATE', [req.params.id, tenantId]);
    const lead = locked.rows[0];
    if (!lead) refuse(404, 'Lead not found');
    if (lead.stage === 'converted') {
      refuse(409, 'This lead has already been converted.', { code: 'LEAD_ALREADY_CONVERTED' });
    }
    if (!QUALIFIED_STAGES.includes(lead.stage)) {
      refuse(409, `Only a qualified or sales-accepted lead can be converted; this lead is ${lead.stage}.`, {
        code: 'LEAD_NOT_QUALIFIED',
      });
    }

    // ── Company ───────────────────────────────────────────────────────────
    let company: { id: string; name: string; created: boolean } | null = null;
    if (spec.company.mode === 'link') {
      const row = await rowInTenant(client, 'companies', text(spec.company.company_id), tenantId, 'id, name');
      if (!row) refuse(400, 'company.company_id does not name a company in this workspace');
      company = { id: row.id, name: row.name, created: false };
    } else if (spec.company.mode === 'create') {
      const name = text(spec.company.name) || text(lead.company);
      if (!name) refuse(400, 'company.name is required — this lead has no company name');
      const ins = await client.query('INSERT INTO companies (name, tenant_id) VALUES ($1, $2) RETURNING id, name', [name, tenantId]);
      company = { id: ins.rows[0].id, name: ins.rows[0].name, created: true };
    }

    // ── Contact ───────────────────────────────────────────────────────────
    let contact: { id: string; name: string; email: string; created: boolean };
    if (spec.contact.mode === 'link') {
      const row = await rowInTenant(client, 'contacts', text(spec.contact.contact_id), tenantId, 'id, first_name, last_name, email');
      if (!row) refuse(400, 'contact.contact_id does not name a contact in this workspace');
      contact = { id: row.id, name: `${row.first_name} ${row.last_name}`.trim(), email: row.email, created: false };
    } else {
      const firstName = text(spec.contact.first_name) || text(lead.first_name);
      const lastName = text(spec.contact.last_name) || text(lead.last_name);
      const email = text(lead.email);
      if (!firstName) refuse(400, 'contact.first_name is required — this lead has no first name');
      // contacts.last_name is NOT NULL and createContact requires it; a lead's
      // last name is optional. Refuse rather than store a blank one.
      if (!lastName) refuse(400, 'contact.last_name is required — this lead has no last name');

      // RATIFIED: an existing email is a 409, never an automatic link. The body
      // names the contact so the UI can offer "link to this contact" as an
      // explicit choice. Same workspace, so naming it discloses nothing.
      const dup = await client.query(
        'SELECT id, first_name, last_name FROM contacts WHERE tenant_id = $1 AND lower(email) = lower($2) LIMIT 1',
        [tenantId, email],
      );
      if (dup.rows[0]) {
        refuse(409, 'A contact with this email already exists in this workspace. Link the lead to that contact, or cancel.', {
          code: 'CONTACT_EMAIL_EXISTS',
          existing_contact: { id: dup.rows[0].id, name: `${dup.rows[0].first_name} ${dup.rows[0].last_name}`.trim() },
        });
      }
      const ins = await client.query(
        `INSERT INTO contacts
           (first_name, last_name, email, phone, position, company_id, owner_id, source, tenant_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'converted', $8)
         RETURNING id, first_name, last_name, email`,
        [firstName, lastName, email, lead.phone || null, lead.position || null, company?.id ?? null, actorId, tenantId],
      );
      contact = { id: ins.rows[0].id, name: `${ins.rows[0].first_name} ${ins.rows[0].last_name}`, email: ins.rows[0].email, created: true };
    }

    // ── Deal ──────────────────────────────────────────────────────────────
    let deal: { id: string; name: string } | null = null;
    if (spec.deal) {
      const pipelineSlug = text(spec.deal.pipeline_id) || 'new-business';
      const resolved = await resolveStageForWrite(tenantId, pipelineSlug, null, client);
      if (resolved.error || !resolved.stage) refuse(400, `deal.pipeline_id: ${resolved.error ?? 'no open stage'}`);
      const pipeline = await client.query('SELECT name FROM pipelines WHERE tenant_id = $1 AND slug = $2', [tenantId, pipelineSlug]);
      const currency = text(spec.deal.currency).toUpperCase() || (await workspaceDefaultCurrency(tenantId)) || 'USD';
      const ins = await client.query(
        `INSERT INTO deals
           (name, lead_id, value, currency, base_amount_usd, pipeline_id, pipeline_name, stage_id,
            probability, expected_close_date, assigned_to, assigned_to_user_id,
            company_id, company_name, contact_name, contact_email, tenant_id)
         VALUES ($1,$2,$3,$4,$3,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         RETURNING id, name`,
        [
          text(spec.deal.name), lead.id, spec.deal.value, currency, pipelineSlug,
          pipeline.rows[0]?.name ?? 'New Business', resolved.stage!.id,
          resolved.stage!.probability ?? 0, spec.deal.expected_close_date || null,
          actorName, actorId, company?.id ?? null, company?.name ?? (text(lead.company) || null),
          contact.name, contact.email, tenantId,
        ],
      );
      deal = { id: ins.rows[0].id, name: ins.rows[0].name };
      // The deal's first stage-history row, as createDeal writes (step 4).
      await client.query(
        `INSERT INTO deal_stage_history
           (deal_id, from_stage, to_stage, probability, probability_override, reason_code, changed_by, tenant_id)
         VALUES ($1, NULL, $2, $3, false, 'created', $4, $5)`,
        [deal.id, resolved.stage!.slug, resolved.stage!.probability ?? 0, actorName, tenantId],
      );
    }

    // ── The lead ──────────────────────────────────────────────────────────
    const updated = await client.query(
      `UPDATE leads
          SET stage = 'converted', converted_at = NOW(), converted_by_user_id = $1,
              converted_contact_id = $2, converted_company_id = $3, converted_deal_id = $4,
              updated_at = NOW()
        WHERE id = $5 AND tenant_id = $6
        RETURNING *`,
      [actorId, contact.id, company?.id ?? null, deal?.id ?? null, lead.id, tenantId],
    );
    await client.query(
      `INSERT INTO lead_stage_history
         (lead_id, from_stage, to_stage, changed_by_user_id, changed_by_name, tenant_id)
       VALUES ($1, $2, 'converted', $3, $4, $5)`,
      [lead.id, lead.stage, actorId, actorName, tenantId],
    );
    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: {
        lead: updated.rows[0],
        contact: { id: contact.id, name: contact.name, created: contact.created },
        company: company ? { id: company.id, name: company.name, created: company.created } : null,
        deal,
      },
    });
  } catch (error: any) {
    if (client) await client.query('ROLLBACK').catch(() => undefined);
    if (error instanceof ConversionRefusal) { res.status(error.status).json(error.body); return; }
    // Two conversions racing to create the same contact: the unique index is
    // the final word, and the answer is the same 409 as the pre-check.
    if (error?.code === '23505' && String(error?.constraint ?? '').includes('contacts')) {
      res.status(409).json({
        success: false, code: 'CONTACT_EMAIL_EXISTS',
        message: 'A contact with this email already exists in this workspace. Link the lead to that contact, or cancel.',
      });
      return;
    }
    next(error);
  } finally {
    client?.release();
  }
};
