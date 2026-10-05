import { Response, NextFunction } from 'express';
import { profileFieldsError, normalizeProfileFields } from '../utils/leadProfileFields';
import { FOLLOW_UP_JOIN, FOLLOW_UP_COLUMNS, OVERDUE_FOLLOW_UP } from '../utils/leadFollowUp';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireTenantId } from '../middleware/tenant';
import { resolveActorName } from '../utils/actorName';
import { buildLeadListQuery, FilterError } from '../utils/leadListQuery';
import { foreignIdsInTenant, userIdForName, userNameForId } from '../utils/tenantScope';
import { PRIVILEGED_ROLES } from '../utils/roles';
import {
  OVERRIDE_TARGET, isGatedMove, unmetCriteria, evaluateQualification,
} from '../utils/leadQualification';

// Columns that exist in the LIVE leads table. Verified against
// information_schema, not against migrate.ts — the previous comment here
// claimed it matched migrate.ts, which described a different database entirely
// and is why POST/PUT /leads returned 500 for every request.
//
// `assigned_to` is the live owner column. It is a VARCHAR holding a display
// name ("John Smith"), not a FK to users — the same shape deals uses. The API
// still accepts `owner_id` as an alias so existing callers keep working.
// TODO(Phase 2): normalise owner to users.id. Storing display names means
// renaming a user silently orphans every record assigned to them.
const UPDATABLE_FIELDS = [
  'first_name', 'last_name', 'email', 'phone', 'company',
  'position', 'industry', 'status', 'score', 'source',
  'assigned_to', 'assigned_to_user_id', 'notes', 'tags', 'custom_fields',
];
// assigned_to_user_id (migration 060) is DUAL-WRITTEN with the display name, the
// deals/039 rule: an explicit id must belong to the caller's workspace (400
// otherwise); a name resolves to a user only on an exact, unique match, and an
// unresolvable name stores NULL — an unresolved owner, never a guessed one.
// `stage` is deliberately ABSENT (ratified 2026-10-03): every stage change goes
// through POST /leads/:id/stage-transition, which enforces the qualification
// gate and writes lead_stage_history. See updateLead for how an unchanged
// `stage` in a full-object save is tolerated.

// The live CHECK constraints. `stage` is the pipeline position; `status` is a
// separate lifecycle flag — they are NOT the same vocabulary, and note that
// leadsApi.ts maps the frontend's "status" concept onto `stage`.
// Kept here so a bad value returns 400 with the allowed set, rather than a raw
// Postgres constraint violation.
// Must stay in lockstep with leads_stage_check (migration 025). If this list is
// ever wider than the constraint, the API accepts a value Postgres then rejects,
// which surfaces as a 500 carrying a stack trace instead of a clean 400.
const VALID_STAGES = [
  'new', 'contacted', 'qualified', 'proposal', 'won', 'lost',
  'assigned', 'enriching', 'attempting_contact', 'engaged',
  'sales_accepted', 'nurture', 'disqualified', 'converted',
] as const;
const VALID_STATUSES = ['active', 'inactive', 'nurturing'] as const;

/**
 * Mirrors leads_score_check — CHECK (score >= 0 AND score <= 100) — and the
 * column's INTEGER type. The constraint is the authority; this exists only so
 * a bad value comes back as a 400 naming the range instead of a masked 500
 * from the constraint violation, which is what 'abc', -5, 150 and even 55.5
 * all produced on both create and update.
 *
 * omitted / null stay valid: createLead writes `score ?? 0`.
 */
function scoreError(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const n = Number(v);
  if (v === '' || !Number.isFinite(n)) return 'score must be a whole number between 0 and 100';
  if (!Number.isInteger(n)) return 'score must be a whole number between 0 and 100';
  if (n < 0 || n > 100) return 'score must be between 0 and 100';
  return null;
}

/** The caller's users.id, or null for a caller without one. */
function actorId(req: AuthRequest): number | null {
  const n = Number(req.user?.id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * GET /api/v1/leads — SERVER-SIDE pagination with a real total (step 5 slice A).
 *
 * Response: { data, count (rows in this page), total (all matching), limit, offset }.
 * Filters, search, sort and the advanced filter are translated to SQL by
 * utils/leadListQuery, so the database pages over EVERY lead. The Leads page
 * used to receive the API's default 50 rows (it sent no limit) and filter /
 * sort / page those in the browser with no total — anything past row 50 was
 * invisible, silently.
 *
 * Order always ends in the id, so pages are stable: no lead is skipped or
 * repeated between pages of the same query.
 */
export const getLeads = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const q = req.query as Record<string, string | undefined>;
    // Legacy params kept: `stage` (exact DB stage), `owner_id` / `assigned_to`
    // (owner NAME). New params go through the builder.
    let built;
    try {
      built = buildLeadListQuery(tenantId, {
        status: q.status, source: q.source, score_band: q.score_band, search: q.search,
        assigned_to_user_id: q.assigned_to_user_id, insight: q.insight, filter: q.filter,
        sort: q.sort, stages: q.stages,
      });
    } catch (e) {
      if (e instanceof FilterError) { res.status(400).json({ success: false, message: e.message }); return; }
      throw e;
    }
    let where = built.where;
    const params = [...built.params];
    if (q.stage) { params.push(q.stage); where += ` AND l.stage = $${params.length}`; }
    const ownerName = q.assigned_to ?? q.owner_id;
    if (ownerName) { params.push(ownerName); where += ` AND l.assigned_to = $${params.length}`; }

    // Coerce and cap pagination — these came straight off the query string, so
    // `?limit=abc` was a 500 and `?limit=999999` an unbounded scan.
    const safeLimit = Math.min(Math.max(parseInt(String(q.limit ?? 50), 10) || 50, 1), 500);
    const safeOffset = Math.max(parseInt(String(q.offset ?? 0), 10) || 0, 0);

    const total = await pool.query(`SELECT COUNT(*)::int AS n FROM leads l WHERE ${where}`, params);
    const page = await pool.query(
      `SELECT l.*, ${FOLLOW_UP_COLUMNS} FROM leads l ${FOLLOW_UP_JOIN} WHERE ${where}
        ORDER BY ${built.orderBy}
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, safeLimit, safeOffset],
    );
    res.json({
      success: true, data: page.rows, count: page.rowCount,
      total: total.rows[0].n, limit: safeLimit, offset: safeOffset,
    });
  } catch (error) { next(error); }
};

/**
 * GET /api/v1/leads/summary — the Leads page's KPI figures, computed over ALL
 * matching leads in SQL (step 5 slice A). They used to be computed in the
 * browser over the ≤50 rows it had loaded. Accepts assigned_to_user_id (the
 * "own leads" display filter) so the figures match the list the user sees.
 * Week boundaries follow the page's own definitions (imported: week starting
 * Sunday; source quality: week starting Monday), in the database's time zone.
 */
export const getLeadSummary = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    let built;
    try {
      built = buildLeadListQuery(tenantId, { assigned_to_user_id: req.query.assigned_to_user_id as string | undefined });
    } catch (e) {
      if (e instanceof FilterError) { res.status(400).json({ success: false, message: e.message }); return; }
      throw e;
    }
    const r = await pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE l.created_at::date = CURRENT_DATE)::int AS new_today,
         COUNT(*) FILTER (WHERE coalesce(l.score, 0) >= 80)::int AS hot,
         COUNT(*) FILTER (WHERE l.created_at >= date_trunc('week', CURRENT_DATE + 1) - interval '1 day'
                           AND (l.source ILIKE '%lead gen%' OR l.source ILIKE '%hrms%' OR l.source ILIKE '%apollo%'))::int AS imported_this_week,
         COUNT(*) FILTER (WHERE l.stage IN ('new', 'assigned') AND l.last_contact IS NULL)::int AS new_unworked,
         COUNT(*) FILTER (WHERE l.stage IN ('new', 'assigned') AND l.last_contact IS NULL
                           AND l.created_at >= NOW() - interval '7 days')::int AS new_unworked_this_week,
         COUNT(*) FILTER (WHERE l.stage IN ('new', 'assigned') AND l.last_contact IS NULL
                           AND l.created_at >= NOW() - interval '14 days' AND l.created_at < NOW() - interval '7 days')::int AS new_unworked_last_week,
         COUNT(*) FILTER (WHERE l.last_contact IS NULL OR l.last_contact < CURRENT_DATE - 30)::int AS untouched,
         COUNT(*) FILTER (WHERE l.stage IN ('qualified', 'sales_accepted'))::int AS ready_to_convert,
         COUNT(*) FILTER (WHERE ${OVERDUE_FOLLOW_UP})::int AS overdue_follow_ups
       FROM leads l WHERE ${built.where}`,
      built.params,
    );
    const week = await pool.query(
      `SELECT coalesce(l.source, 'Unknown') AS source, COUNT(*)::int AS n, AVG(coalesce(l.score, 0)) AS avg
         FROM leads l
        WHERE ${built.where} AND l.created_at >= date_trunc('week', CURRENT_DATE)
        GROUP BY 1 ORDER BY avg DESC, n DESC`,
      built.params,
    );
    const weeklyLeads = week.rows.reduce((t, x) => t + x.n, 0);
    const top = week.rows[0];
    res.json({
      success: true,
      data: {
        ...r.rows[0],
        source_quality_week: {
          top_source: top ? top.source : null,
          top_source_avg_score: top ? Math.round(Number(top.avg)) : 0,
          top_source_count: top ? top.n : 0,
          weekly_leads: weeklyLeads,
        },
      },
    });
  } catch (error) { next(error); }
};

export const getLeadById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const result = await pool.query(
      `SELECT l.*, ${FOLLOW_UP_COLUMNS} FROM leads l ${FOLLOW_UP_JOIN} WHERE l.id = $1 AND l.tenant_id = $2`,
      [req.params.id, tenantId]);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Lead not found' }); return; }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

export const createLead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const {
      first_name, last_name, email, phone, company, position,
      industry, stage, status, score, source, owner_id, assigned_to, assigned_to_user_id,
      notes, tags, custom_fields,
    } = req.body;

    if (!first_name || !String(first_name).trim()) {
      res.status(400).json({ success: false, message: 'first_name is required' });
      return;
    }
    // leads.email is NOT NULL in the live schema, so an omitted email was a
    // raw 23502 rather than a useful message.
    if (!email || !String(email).trim()) {
      res.status(400).json({ success: false, message: 'email is required' });
      return;
    }
    const badScore = scoreError(score);
    if (badScore) { res.status(400).json({ success: false, message: badScore }); return; }
    // Migration 063 profile fields (and the estimated value + currency).
    const badProfile = profileFieldsError(req.body);
    if (badProfile) { res.status(400).json({ success: false, message: badProfile }); return; }
    const profile = normalizeProfileFields(req.body);
    if (stage && !VALID_STAGES.includes(stage)) {
      res.status(400).json({ success: false, message: `stage must be one of: ${VALID_STAGES.join(', ')}` });
      return;
    }
    if (status && !VALID_STATUSES.includes(status)) {
      res.status(400).json({ success: false, message: `status must be one of: ${VALID_STATUSES.join(', ')}` });
      return;
    }
    // A lead is converted BY conversion, which creates its contact/account/deal;
    // creating one already "converted" would assert records that do not exist.
    if (stage === 'converted') {
      res.status(400).json({ success: false, message: 'A lead cannot be created as converted. Convert an existing lead instead.' });
      return;
    }
    // The qualification gate applies at creation too, with no override — a new
    // lead has no last contact yet, so in practice it cannot START qualified.
    if (stage && isGatedMove(null, stage)) {
      const failed = unmetCriteria({ email, phone, company, last_contact: null });
      if (failed.length) {
        res.status(409).json({
          success: false,
          code: 'QUALIFICATION_CRITERIA_UNMET',
          message: `A lead cannot be created as ${stage}: ${failed.map(c => c.label.toLowerCase()).join('; ')} is not met.`,
          unmet_criteria: failed,
        });
        return;
      }
    }

    const badOwner = await foreignIdsInTenant(
      [{ field: 'assigned_to_user_id', table: 'users', value: assigned_to_user_id }], tenantId);
    if (badOwner) { res.status(400).json({ success: false, message: badOwner }); return; }
    const ownerName: string | null = assigned_to || owner_id || null;
    const resolvedOwnerId: number | null =
      (assigned_to_user_id ?? null) !== null ? Number(assigned_to_user_id) : await userIdForName(ownerName, tenantId);
    const resolvedOwnerName: string | null =
      ownerName ?? (resolvedOwnerId !== null ? await userNameForId(resolvedOwnerId, tenantId) : null);

    const client = await pool.connect();
    try {
    await client.query('BEGIN');
    // Profile columns are appended only when supplied; column names come from
    // the module's allowlist, never from the request.
    const profileCols = Object.keys(profile);
    const profilePlaceholders = profileCols.map((_, k) => `$${18 + k}`);
    const result = await client.query(
      `INSERT INTO leads
         (first_name, last_name, email, phone, company, position,
          industry, stage, status, score, source, assigned_to, notes,
          tags, custom_fields, tenant_id, assigned_to_user_id${profileCols.map(c => `, ${c}`).join('')})
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17${profilePlaceholders.map(ph => `, ${ph}`).join('')})
       RETURNING *`,
      [
        String(first_name).trim(),
        last_name ? String(last_name).trim() : null,
        String(email).trim(),
        phone    || null,
        company  || null, position || null,
        industry || null,
        stage    || 'new',
        status   || 'active',   // lifecycle flag, not the pipeline stage
        score    ?? 0,
        source   || null,
        resolvedOwnerName,
        notes    || null,
        // tags is text[] since migration 012 — pass the array through and let
        // the driver map it. It was JSON.stringify'd into a text column before,
        // which disagreed with both the existing rows and the frontend reader.
        Array.isArray(tags) ? tags : [],
        custom_fields ? JSON.stringify(custom_fields) : '{}',
        tenantId,
        resolvedOwnerId,
        ...profileCols.map(c => profile[c]),
      ]
    );
    // The lead's first stage is history too (from_stage NULL), so a timeline
    // starts at creation rather than at the first move.
    await client.query(
      `INSERT INTO lead_stage_history
         (lead_id, from_stage, to_stage, changed_by_user_id, changed_by_name, tenant_id)
       VALUES ($1, NULL, $2, $3, $4, $5)`,
      [result.rows[0].id, result.rows[0].stage, actorId(req), resolveActorName(req), tenantId],
    );
    await client.query('COMMIT');
    res.status(201).json({ success: true, data: result.rows[0] });
    } catch (e) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw e;
    } finally {
      client.release();
    }
  } catch (error) { next(error); }
};

export const updateLead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);

    // STAGE IS NOT EDITABLE HERE (ratified 2026-10-03). A body naming the lead's
    // CURRENT stage is accepted and ignored, because edit forms send the whole
    // lead back; a body that would CHANGE it is refused, so the gate and the
    // history in POST /leads/:id/stage-transition cannot be side-stepped.
    if (req.body.stage !== undefined) {
      const cur = await pool.query('SELECT stage FROM leads WHERE id = $1 AND tenant_id = $2', [req.params.id, tenantId]);
      if (!cur.rows[0]) { res.status(404).json({ success: false, message: 'Lead not found' }); return; }
      if (req.body.stage !== cur.rows[0].stage) {
        res.status(400).json({
          success: false,
          code: 'STAGE_NOT_EDITABLE',
          message: 'A lead\'s stage cannot be changed by editing the lead. Use POST /leads/:id/stage-transition.',
        });
        return;
      }
    }
    if (req.body.status !== undefined && !VALID_STATUSES.includes(req.body.status)) {
      res.status(400).json({ success: false, message: `status must be one of: ${VALID_STATUSES.join(', ')}` });
      return;
    }

    // createLead rejects a blank first_name or email (leads.email is NOT NULL);
    // this path wrote whatever arrived, so an explicit null reached the column
    // as a masked 500. Omitting a field still leaves it untouched.
    for (const f of ['first_name', 'email'] as const) {
      if (req.body[f] !== undefined && !String(req.body[f] ?? '').trim()) {
        res.status(400).json({ success: false, message: `${f} cannot be blank` });
        return;
      }
    }

    const badScore = scoreError(req.body.score);
    if (badScore) { res.status(400).json({ success: false, message: badScore }); return; }
    const badProfile = profileFieldsError(req.body);
    if (badProfile) { res.status(400).json({ success: false, message: badProfile }); return; }

    // Owner dual-write (migration 060). `owner_id` is the legacy alias for the
    // NAME column. A name change without an explicit id re-resolves the id, so
    // the two never disagree; an explicit id must be in this workspace.
    if (req.body.assigned_to === undefined && req.body.owner_id !== undefined) {
      req.body.assigned_to = req.body.owner_id || null;
    }
    const badOwner = await foreignIdsInTenant(
      [{ field: 'assigned_to_user_id', table: 'users', value: req.body.assigned_to_user_id }], tenantId);
    if (badOwner) { res.status(400).json({ success: false, message: badOwner }); return; }
    if (req.body.assigned_to !== undefined && req.body.assigned_to_user_id === undefined) {
      req.body.assigned_to_user_id = await userIdForName(req.body.assigned_to, tenantId);
    }

    const updates: string[] = [];
    const params: any[] = [];
    let i = 1;

    UPDATABLE_FIELDS.forEach(f => {
      if (req.body[f] === undefined) return;
      const v = req.body[f];
      updates.push(`${f} = $${i++}`);
      // tags is text[]; custom_fields is JSONB. Everything else passes through.
      if (f === 'tags') params.push(Array.isArray(v) ? v : []);
      else if (f === 'custom_fields') params.push(JSON.stringify(v ?? {}));
      else params.push(v);
    });

    // (`owner_id` was folded into assigned_to above, before the owner resolution.)

    // Migration 063 profile fields + estimated value / currency (allowlisted).
    for (const [col, v] of Object.entries(normalizeProfileFields(req.body))) {
      updates.push(`${col} = $${i++}`);
      params.push(v);
    }

    if (!updates.length) {
      res.status(400).json({ success: false, message: 'No valid fields to update' });
      return;
    }

    // Always bump updated_at
    updates.push(`updated_at = NOW()`);
    params.push(req.params.id, tenantId);

    const result = await pool.query(
      `UPDATE leads SET ${updates.join(', ')} WHERE id = $${i++} AND tenant_id = $${i} RETURNING *`,
      params
    );

    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Lead not found' }); return; }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

export const deleteLead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const result = await pool.query('DELETE FROM leads WHERE id = $1 AND tenant_id = $2 RETURNING id', [req.params.id, tenantId]);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Lead not found' }); return; }
    res.json({ success: true, message: 'Lead deleted' });
  } catch (error) { next(error); }
};

/**
 * POST /api/v1/leads/:id/stage-transition   body: { to_stage, override?, reason? }
 *
 * THE ONE PATH A LEAD'S STAGE CHANGES THROUGH (ratified 2026-10-03). Modelled
 * on POST /deals/:id/stage-transition: lock the row, validate the target, write
 * the lead and its history row in one transaction.
 *
 * The qualification gate (utils/leadQualification) applies when a lead ENTERS
 * the qualifying lane. Failing it is a 409 naming each unmet criterion, plus
 * `can_override` so the client renders the server's rule rather than its own.
 * Overriding needs `override: true`, a `reason`, a manager or admin (403
 * otherwise — the rule that used to be a hidden button), and lands only on
 * 'qualified'. The override and the criteria it overrode are recorded.
 *
 * 'converted' is not reachable here: conversion creates the contact / account
 * / deal, so it is its own endpoint. A converted lead is terminal.
 */
export const transitionLeadStage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const client = await pool.connect();
  try {
    const tenantId = requireTenantId(req);
    const { to_stage, override, reason } = req.body ?? {};

    if (!to_stage || !VALID_STAGES.includes(to_stage)) {
      res.status(400).json({ success: false, message: `to_stage must be one of: ${VALID_STAGES.join(', ')}` });
      return;
    }
    if (override !== undefined && typeof override !== 'boolean') {
      res.status(400).json({ success: false, message: 'override must be true or false' });
      return;
    }
    if (to_stage === 'converted') {
      res.status(409).json({
        success: false,
        code: 'USE_CONVERSION',
        message: 'A lead becomes converted by converting it, which creates its contact and deal — not by a stage move.',
      });
      return;
    }

    await client.query('BEGIN');
    // Lock the lead alone (lesson 11: never FOR UPDATE across a join).
    const locked = await client.query(
      'SELECT * FROM leads WHERE id = $1 AND tenant_id = $2 FOR UPDATE',
      [req.params.id, tenantId],
    );
    const lead = locked.rows[0];
    if (!lead) {
      await client.query('ROLLBACK');
      res.status(404).json({ success: false, message: 'Lead not found' });
      return;
    }
    const fromStage: string | null = lead.stage ?? null;

    if (fromStage === 'converted') {
      await client.query('ROLLBACK');
      res.status(409).json({ success: false, code: 'LEAD_CONVERTED', message: 'A converted lead cannot change stage.' });
      return;
    }
    if (fromStage === to_stage) {
      await client.query('ROLLBACK');
      res.json({ success: true, data: lead, message: 'Lead is already in that stage' });
      return;
    }

    const callerRole = String(req.user?.role ?? '');
    const mayOverride = PRIVILEGED_ROLES.includes(callerRole);
    let overridden: string[] = [];

    if (isGatedMove(fromStage, to_stage)) {
      const failed = unmetCriteria(lead);
      if (failed.length) {
        if (override !== true) {
          await client.query('ROLLBACK');
          res.status(409).json({
            success: false,
            code: 'QUALIFICATION_CRITERIA_UNMET',
            message: `This lead does not meet the qualification criteria: ${failed.map(c => c.label.toLowerCase()).join('; ')}.`,
            unmet_criteria: failed,
            criteria: evaluateQualification(lead),
            can_override: mayOverride,
          });
          return;
        }
        if (!mayOverride) {
          await client.query('ROLLBACK');
          res.status(403).json({
            success: false,
            message: 'Only a manager or admin can override the qualification criteria.',
          });
          return;
        }
        if (to_stage !== OVERRIDE_TARGET) {
          await client.query('ROLLBACK');
          res.status(400).json({ success: false, message: `An override can only move a lead to ${OVERRIDE_TARGET}.` });
          return;
        }
        if (typeof reason !== 'string' || !reason.trim()) {
          await client.query('ROLLBACK');
          res.status(400).json({ success: false, message: 'reason is required to override the qualification criteria' });
          return;
        }
        overridden = failed.map(c => c.id);
      }
    }

    const updated = await client.query(
      'UPDATE leads SET stage = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING *',
      [to_stage, lead.id, tenantId],
    );
    await client.query(
      `INSERT INTO lead_stage_history
         (lead_id, from_stage, to_stage, qualification_override, unmet_criteria,
          reason, changed_by_user_id, changed_by_name, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        lead.id, fromStage, to_stage, overridden.length > 0, overridden,
        typeof reason === 'string' && reason.trim() ? reason.trim() : null,
        actorId(req), resolveActorName(req), tenantId,
      ],
    );
    await client.query('COMMIT');
    res.json({ success: true, data: updated.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    next(error);
  } finally {
    client.release();
  }
};

/** GET /api/v1/leads/:id/stage-history — newest first, tenant-scoped. */
export const getLeadStageHistory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const lead = await pool.query('SELECT id FROM leads WHERE id = $1 AND tenant_id = $2', [req.params.id, tenantId]);
    if (!lead.rows[0]) { res.status(404).json({ success: false, message: 'Lead not found' }); return; }
    const result = await pool.query(
      `SELECT id, lead_id, from_stage, to_stage, qualification_override, unmet_criteria,
              reason, changed_by_user_id, changed_by_name, changed_at
         FROM lead_stage_history
        WHERE lead_id = $1 AND tenant_id = $2
        ORDER BY changed_at DESC`,
      [req.params.id, tenantId],
    );
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
};
