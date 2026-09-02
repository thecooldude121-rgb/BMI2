import { Response, NextFunction } from 'express';
import { PoolClient } from 'pg';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireTenantId } from '../middleware/tenant';
import { foreignIdsInTenant } from '../utils/tenantScope';
import {
  MAX_IMPORT_ROWS, runImport, created, skipped, failed,
  invalidEmail, tooLong, firstProblem,
} from '../utils/csvImport';

/**
 * Vocabularies. These MIRROR the CHECK constraints contacts_source_check and
 * contacts_status_check (migration 020) — the constraints are the authority.
 * They are duplicated here only so an invalid value comes back as a 400 naming
 * the allowed values, instead of a 500 from a constraint violation.
 *
 * If you change either list, change the constraint in a new migration and
 * verify with:
 *   SELECT pg_get_constraintdef(oid) FROM pg_constraint
 *    WHERE conrelid = 'contacts'::regclass AND contype = 'c';
 */
// 'import' (migration 029) is written by the CSV importer and is not offered in
// the Add Contact form's dropdown — a hand-keyed contact must not be able to
// claim it arrived in a bulk migration. It is accepted here because the
// importer posts it.
const SOURCES = ['lead-gen', 'hrms', 'converted', 'manual', 'website', 'referral', 'event', 'import'] as const;
const STATUSES = ['active', 'inactive', 'do-not-contact'] as const;

/**
 * Buying roles, matching contacts_buying_role_check (migration 026) and
 * config/contactRoles.ts on the frontend.
 *
 * NULL is a legitimate and expected value: it means nobody has assigned this
 * contact a role yet, and it must reach the UI as unknown. Do NOT give this a
 * default. The account detail page previously invented the value twice — once
 * by array index, then by hardcoding every contact to 'influencer' — and a
 * default here would reintroduce exactly that, one layer lower and looking
 * authoritative.
 */
const BUYING_ROLES = [
  'champion', 'decision-maker', 'economic-buyer', 'influencer',
  'technical-evaluator', 'user', 'legal-procurement', 'blocker-detractor',
] as const;

/** Columns a client may write, in the order used by the INSERT below. */
const WRITABLE = [
  'company_id', 'first_name', 'last_name', 'email', 'phone', 'mobile',
  'position', 'department', 'linkedin_url', 'is_primary',
  'street', 'city', 'state', 'postal_code', 'country', 'timezone',
  'notes', 'tags', 'source', 'status', 'owner_id', 'buying_role',
] as const;

const SELECT_COLUMNS = `
  c.*,
  co.name AS company_name,
  -- NULLIF so an unowned contact reports owner_name NULL, not ''. An empty
  -- string is a value, and the frontend would render it as a named owner with a
  -- blank name; absent is the truth here.
  NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), '') AS owner_name
`;
const FROM_JOINS = `
  FROM contacts c
  -- Both joins carry the tenant predicate. The users one always did; the
  -- companies one did not, and contacts_company_id_fkey references
  -- companies(id) globally — so a contact whose company_id pointed at another
  -- workspace's company rendered that company's NAME in this workspace's list,
  -- and matched it in the ?search= filter. A join is a read.
  LEFT JOIN companies co ON c.company_id = co.id AND co.tenant_id = c.tenant_id
  LEFT JOIN users u ON c.owner_id = u.id AND u.tenant_id = c.tenant_id
`;

/**
 * Validate the fields whose values are constrained. Returns an error message,
 * or null when everything present is acceptable.
 *
 * `tags` is checked because the column is text[]: pg would coerce a plain
 * string into a single-element array, so a client sending "a;b" would silently
 * store one tag named "a;b". That is how leads.tags became invisible for
 * months (migration 012) — reject it rather than store it wrong.
 */
function validate(body: Record<string, unknown>): string | null {
  if (body.source !== undefined && body.source !== null &&
      !SOURCES.includes(body.source as typeof SOURCES[number])) {
    return `source must be one of: ${SOURCES.join(', ')}`;
  }
  if (body.status !== undefined && body.status !== null &&
      !STATUSES.includes(body.status as typeof STATUSES[number])) {
    return `status must be one of: ${STATUSES.join(', ')}`;
  }
  // Explicit null is allowed and meaningful: it CLEARS the role back to
  // unassigned. That is a different operation from omitting the field, which
  // leaves it alone, and the UI needs both.
  if (body.buying_role !== undefined && body.buying_role !== null &&
      !BUYING_ROLES.includes(body.buying_role as typeof BUYING_ROLES[number])) {
    return `buying_role must be null or one of: ${BUYING_ROLES.join(', ')}`;
  }
  if (body.tags !== undefined && body.tags !== null && !Array.isArray(body.tags)) {
    return 'tags must be an array of strings';
  }
  if (Array.isArray(body.tags) && body.tags.some(t => typeof t !== 'string')) {
    return 'tags must be an array of strings';
  }
  return null;
}

/**
 * Every foreign id a client may send must name a row in the CALLER's workspace.
 *
 * owner_id was checked here from the start, and the reasoning was right:
 * without it a client could attach any user id in the database to its own
 * contact and the owner_name join would read that other workspace's user back
 * out — the same shape of cross-tenant leak createTag's ON CONFLICT had
 * (migration 010).
 *
 * company_id was NOT checked, and had exactly the same problem: contacts_
 * company_id_fkey references companies(id) globally, so a contact could name
 * another workspace's company and the list projected that company's name. Both
 * now go through the shared helper, so the next FK column added to WRITABLE is
 * checked by adding one line here rather than by remembering to write a new
 * function.
 */
async function foreignRefError(
  body: Record<string, unknown>,
  tenantId: string,
): Promise<string | null> {
  return foreignIdsInTenant(
    [
      { field: 'owner_id', table: 'users', value: body.owner_id },
      { field: 'company_id', table: 'companies', value: body.company_id },
    ],
    tenantId,
  );
}

export const getContacts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const { account_id, search, status, limit = 50, offset = 0 } = req.query;
    let query = `SELECT ${SELECT_COLUMNS} ${FROM_JOINS} WHERE c.tenant_id = $1`;
    const params: any[] = [tenantId];
    let i = 2;
    if (account_id) { query += ` AND c.company_id = $${i++}`; params.push(account_id); }
    if (status) { query += ` AND c.status = $${i++}`; params.push(status); }
    if (search) { query += ` AND (c.first_name ILIKE $${i} OR c.last_name ILIKE $${i} OR c.email ILIKE $${i} OR co.name ILIKE $${i})`; params.push(`%${search}%`); i++; }
    query += ` ORDER BY c.is_primary DESC, c.created_at DESC LIMIT $${i++} OFFSET $${i}`;
    params.push(limit, offset);
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows, count: result.rowCount });
  } catch (error) { next(error); }
};

export const getContactById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const result = await pool.query(
      `SELECT ${SELECT_COLUMNS} ${FROM_JOINS} WHERE c.id = $1 AND c.tenant_id = $2`,
      [req.params.id, tenantId],
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Contact not found' }); return; }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

export const createContact = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const { first_name, last_name, email } = req.body;
    if (!first_name || !last_name || !email) {
      res.status(400).json({ success: false, message: 'first_name, last_name, and email are required' });
      return;
    }
    const invalid = validate(req.body);
    if (invalid) { res.status(400).json({ success: false, message: invalid }); return; }

    const badRef = await foreignRefError(req.body, tenantId);
    if (badRef) { res.status(400).json({ success: false, message: badRef }); return; }

    // contacts.id is a CT001-style varchar with no DB default — generate it here,
    // matching the D001 scheme in dealsController.
    // DELIBERATELY NOT SCOPED BY TENANT, and this is load-bearing.
    // contacts.id is a GLOBAL primary key (contacts_pkey PRIMARY KEY (id)), so ids must be
    // unique across every workspace. Adding `AND tenant_id = $n` here would make
    // the second workspace generate CT001 again and every insert would fail with
    // a duplicate-key error. The scan for missing tenant filters flags this line;
    // it is a false positive.
    //
    // It IS a small information leak: the id a caller receives reveals the global
    // row count. The fix for that is a per-workspace sequence or a uuid, NOT a
    // tenant predicate.
    const maxResult = await pool.query(`SELECT MAX(CAST(SUBSTRING(id, 3) AS INTEGER)) AS max_num FROM contacts WHERE id ~ '^CT[0-9]+$'`);
    const id = `CT${String((maxResult.rows[0].max_num || 0) + 1).padStart(3, '0')}`;

    const cols = ['id', ...WRITABLE, 'tenant_id'];
    const values: any[] = [
      id,
      ...WRITABLE.map(c => {
        const v = req.body[c];
        if (v === undefined) {
          // Let the column defaults apply rather than writing NULL over them:
          // tags defaults to '{}' and status to 'active', both NOT NULL.
          if (c === 'tags') return [];
          if (c === 'status') return 'active';
          if (c === 'is_primary') return false;
          return null;
        }
        return v;
      }),
      tenantId,
    ];
    const placeholders = cols.map((_, n) => `$${n + 1}`).join(',');
    const inserted = await pool.query(
      `INSERT INTO contacts (${cols.join(',')}) VALUES (${placeholders}) RETURNING id`,
      values,
    );

    // Re-read through the same projection the list uses, so the client gets
    // company_name and owner_name on create instead of having to refetch.
    const result = await pool.query(
      `SELECT ${SELECT_COLUMNS} ${FROM_JOINS} WHERE c.id = $1 AND c.tenant_id = $2`,
      [inserted.rows[0].id, tenantId],
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

export const updateContact = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const invalid = validate(req.body);
    if (invalid) { res.status(400).json({ success: false, message: invalid }); return; }

    // A required column stays required on UPDATE. createContact rejects a
    // blank first_name/last_name/email, but this path wrote whatever arrived:
    // an explicit null hit the NOT NULL column and surfaced as a masked 500,
    // and an empty string was stored as a genuinely blank name. Omitting a
    // field still leaves it untouched — only an explicitly supplied blank is
    // rejected, so partial updates are unaffected.
    for (const f of ['first_name', 'last_name', 'email'] as const) {
      if (req.body[f] !== undefined && !String(req.body[f] ?? '').trim()) {
        res.status(400).json({ success: false, message: `${f} cannot be blank` });
        return;
      }
    }

    const badRef = await foreignRefError(req.body, tenantId);
    if (badRef) { res.status(400).json({ success: false, message: badRef }); return; }

    const updates: string[] = [];
    const params: any[] = [];
    let i = 1;
    WRITABLE.forEach(f => {
      if (req.body[f] !== undefined) { updates.push(`${f} = $${i++}`); params.push(req.body[f]); }
    });
    if (!updates.length) { res.status(400).json({ success: false, message: 'No fields to update' }); return; }
    updates.push(`updated_at = NOW()`);
    params.push(req.params.id, tenantId);
    const updated = await pool.query(
      `UPDATE contacts SET ${updates.join(', ')} WHERE id = $${i++} AND tenant_id = $${i} RETURNING id`,
      params,
    );
    if (!updated.rows[0]) { res.status(404).json({ success: false, message: 'Contact not found' }); return; }

    const result = await pool.query(
      `SELECT ${SELECT_COLUMNS} ${FROM_JOINS} WHERE c.id = $1 AND c.tenant_id = $2`,
      [updated.rows[0].id, tenantId],
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

export const deleteContact = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const result = await pool.query('DELETE FROM contacts WHERE id = $1 AND tenant_id = $2 RETURNING id', [req.params.id, tenantId]);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Contact not found' }); return; }
    res.json({ success: true, message: 'Contact deleted' });
  } catch (error) {
    // quotes.contact_id is ON DELETE NO ACTION, so a contact named by a quote
    // cannot be deleted. That is a legitimate refusal, not a server fault —
    // returning 500 would tell the user the app broke when in fact their
    // request was declined for a reason they can act on.
    if ((error as { code?: string }).code === '23503') {
      res.status(409).json({
        success: false,
        message: 'This contact is referenced by a quote and cannot be deleted. Set it to inactive instead.',
      });
      return;
    }
    next(error);
  }
};

/**
 * POST /api/v1/contacts/bulk
 * Body: { action: 'delete'|'status'|'owner'|'tag', contact_ids: string[],
 *         payload?: { status?, owner_id?, tag? } }
 *
 * Same reasoning as bulkUpdateDeals, which this deliberately mirrors: selecting
 * 40 contacts and reassigning them should either happen or not. Done as 40
 * requests from the browser it can half-succeed with no way to report which
 * half, and the contacts page previously "did" all of these with a setState and
 * a "✅ Contacts deleted successfully!" alert — the rows came back on refresh.
 *
 * Semantics, matching the deals endpoint:
 *   - One transaction. Any error rolls the whole batch back.
 *   - Ids not in the caller's tenant are reported in `not_found` rather than
 *     aborting the batch: one stale id must not discard 39 valid changes.
 */
const BULK_ACTIONS = ['delete', 'status', 'owner', 'tag'] as const;
type BulkAction = typeof BULK_ACTIONS[number];

export const bulkUpdateContacts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const client = await pool.connect();
  try {
    const tenantId = requireTenantId(req);
    const { action, contact_ids, payload } = req.body as {
      action: BulkAction;
      contact_ids: string[];
      payload?: { status?: string; owner_id?: number | null; tag?: string };
    };

    if (!BULK_ACTIONS.includes(action)) {
      res.status(400).json({ success: false, message: `action must be one of: ${BULK_ACTIONS.join(', ')}` });
      return;
    }
    if (!Array.isArray(contact_ids) || contact_ids.length === 0) {
      res.status(400).json({ success: false, message: 'contact_ids must be a non-empty array' });
      return;
    }
    if (contact_ids.length > 500) {
      res.status(400).json({ success: false, message: 'A bulk action is limited to 500 contacts at a time' });
      return;
    }
    if (action === 'status') {
      if (!payload?.status) {
        res.status(400).json({ success: false, message: 'payload.status is required for the status action' });
        return;
      }
      if (!STATUSES.includes(payload.status as typeof STATUSES[number])) {
        res.status(400).json({ success: false, message: `status must be one of: ${STATUSES.join(', ')}` });
        return;
      }
    }
    if (action === 'tag' && !payload?.tag?.trim()) {
      res.status(400).json({ success: false, message: 'payload.tag is required for the tag action' });
      return;
    }
    // owner_id null is meaningful here — it unassigns. Only a non-null value
    // needs the tenant check.
    if (action === 'owner') {
      if (payload?.owner_id === undefined) {
        res.status(400).json({ success: false, message: 'payload.owner_id is required for the owner action (null to unassign)' });
        return;
      }
      const badOwner = await foreignIdsInTenant(
        [{ field: 'owner_id', table: 'users', value: payload.owner_id }], tenantId);
      if (badOwner) { res.status(400).json({ success: false, message: badOwner }); return; }
    }

    await client.query('BEGIN');

    const existing = await client.query(
      'SELECT id FROM contacts WHERE id = ANY($1::varchar[]) AND tenant_id = $2 FOR UPDATE',
      [contact_ids, tenantId],
    );
    const foundIds: string[] = existing.rows.map(r => r.id);
    const notFound = contact_ids.filter(id => !foundIds.includes(id));

    if (foundIds.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({
        success: false,
        message: 'None of those contacts exist in your account',
        affected: 0, requested: contact_ids.length, not_found: notFound,
      });
      return;
    }

    let affected = 0;

    switch (action) {
      case 'delete': {
        const r = await client.query(
          'DELETE FROM contacts WHERE id = ANY($1::varchar[]) AND tenant_id = $2 RETURNING id',
          [foundIds, tenantId],
        );
        affected = r.rowCount ?? 0;
        break;
      }
      case 'status': {
        const r = await client.query(
          `UPDATE contacts SET status = $1, updated_at = NOW()
           WHERE id = ANY($2::varchar[]) AND tenant_id = $3 RETURNING id`,
          [payload!.status, foundIds, tenantId],
        );
        affected = r.rowCount ?? 0;
        break;
      }
      case 'owner': {
        const r = await client.query(
          `UPDATE contacts SET owner_id = $1, updated_at = NOW()
           WHERE id = ANY($2::varchar[]) AND tenant_id = $3 RETURNING id`,
          [payload!.owner_id, foundIds, tenantId],
        );
        affected = r.rowCount ?? 0;
        break;
      }
      case 'tag': {
        // Append without duplicating. contacts.tags is text[] NOT NULL '{}'.
        const r = await client.query(
          `UPDATE contacts
           SET tags = CASE WHEN $1 = ANY(tags) THEN tags ELSE array_append(tags, $1) END,
               updated_at = NOW()
           WHERE id = ANY($2::varchar[]) AND tenant_id = $3 RETURNING id`,
          [payload!.tag!.trim(), foundIds, tenantId],
        );
        affected = r.rowCount ?? 0;
        break;
      }
    }

    await client.query('COMMIT');
    res.json({
      success: true, action, affected,
      requested: contact_ids.length,
      not_found: notFound,
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    // A contact named by a quote blocks a bulk delete exactly as it blocks a
    // single one. Reported as a refusal, not a fault — and because the whole
    // batch is one transaction, nothing was deleted.
    if ((error as { code?: string }).code === '23503') {
      res.status(409).json({
        success: false,
        message: 'At least one of those contacts is referenced by a quote, so nothing was deleted. Set them to inactive instead.',
      });
      return;
    }
    next(error);
  } finally {
    client.release();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CSV import
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The shape the client posts per row. These are MAPPED field names, not raw CSV
 * headers: the alias table that turns "Email Address" into `email` lives in the
 * frontend next to the column-recognition UI that has to explain itself to the
 * user. The server's job is validation and insertion, and it validates what it
 * is given rather than trusting it.
 *
 * `company_name` and `owner_email` are import-only: they are resolved to
 * `company_id` / `owner_id` here and never written as-is.
 */
interface ContactImportRow {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  position?: string;
  department?: string;
  linkedin_url?: string;
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  timezone?: string;
  notes?: string;
  tags?: string[];
  source?: string;
  status?: string;
  company_name?: string;
  owner_email?: string;
}

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
/** '' means "the CSV had no value here" — write NULL, not an empty string. */
const orNull = (v: string): string | null => (v === '' ? null : v);

/**
 * Resolve a company by EXACT, case-insensitive name within the workspace.
 *
 * Exact-match-only is a deliberate choice over fuzzy matching, and the reasoning
 * is the inverse of the usual one: fuzzy matching would link more rows and would
 * sometimes link them to the WRONG company. An unlinked contact is visible and
 * one click to fix; a contact silently attached to the wrong Acme is neither
 * visible nor obviously wrong later. This is the same false-positive class that
 * was just corrected in utils/leadDuplicates.ts.
 *
 * A name matching two or more companies is ambiguous and resolves to nothing —
 * `companies` has no unique constraint on name (see the open design question in
 * HANDOFF.md), so duplicates are possible and guessing between them is exactly
 * the mis-link this function exists to avoid.
 */
async function resolveCompany(
  client: PoolClient,
  name: string,
  tenantId: string,
): Promise<{ id: string | null; warning?: string }> {
  const found = await client.query(
    'SELECT id FROM companies WHERE tenant_id = $1 AND lower(name) = lower($2) LIMIT 2',
    [tenantId, name],
  );
  if (found.rowCount === 0) {
    return { id: null, warning: `No account named "${name}" — imported without an account link` };
  }
  if ((found.rowCount ?? 0) > 1) {
    return { id: null, warning: `More than one account is named "${name}" — imported without an account link, link it by hand` };
  }
  return { id: found.rows[0].id };
}

/** Resolve an owner by email within the workspace. Absent is a warning, not an error. */
async function resolveOwner(
  client: PoolClient,
  email: string,
  tenantId: string,
): Promise<{ id: number | null; warning?: string }> {
  const found = await client.query(
    'SELECT id FROM users WHERE tenant_id = $1 AND lower(email) = lower($2) LIMIT 1',
    [tenantId, email],
  );
  if (found.rowCount === 0) {
    return { id: null, warning: `No user with the email ${email} — imported unassigned` };
  }
  return { id: found.rows[0].id };
}

/**
 * POST /contacts/import
 *
 * Body: { rows: ContactImportRow[], dry_run?: boolean }
 * Returns a per-row verdict — see utils/csvImport.ts for why every row gets one.
 */
export const importContacts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const client = await pool.connect();
  try {
    const tenantId = requireTenantId(req);
    const { rows, dry_run } = req.body as { rows?: unknown; dry_run?: unknown };

    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(400).json({ success: false, message: 'rows must be a non-empty array' });
      return;
    }
    if (rows.length > MAX_IMPORT_ROWS) {
      res.status(400).json({
        success: false,
        message: `An import is limited to ${MAX_IMPORT_ROWS} rows at a time; this request had ${rows.length}`,
      });
      return;
    }

    const summary = await runImport<ContactImportRow>(
      client,
      rows as ContactImportRow[],
      dry_run === true,
      async (row, _index, tx) => {
        const warnings: string[] = [];

        const first_name = str(row.first_name);
        const last_name  = str(row.last_name);
        const email      = str(row.email);

        // ── Required fields. contacts has all three NOT NULL. ──────────────
        const missing = [
          !first_name && 'first name',
          !last_name && 'last name',
          !email && 'email',
        ].filter(Boolean);
        if (missing.length) {
          return failed(`Missing required ${missing.length > 1 ? 'fields' : 'field'}: ${missing.join(', ')}`);
        }

        if (invalidEmail(email)) {
          return failed(`"${email}" is not a valid email address`);
        }

        // ── Column widths, checked before the insert so the reason names the
        //    field instead of arriving as a 22001 the user cannot read. ──────
        const lengthProblem = firstProblem(
          tooLong(first_name, 50, 'First name'),
          tooLong(last_name, 50, 'Last name'),
          tooLong(email, 150, 'Email'),
          tooLong(str(row.phone), 20, 'Phone'),
          tooLong(str(row.mobile), 20, 'Mobile'),
          tooLong(str(row.position), 100, 'Job title'),
          tooLong(str(row.department), 100, 'Department'),
          tooLong(str(row.linkedin_url), 200, 'LinkedIn URL'),
          tooLong(str(row.street), 200, 'Street'),
          tooLong(str(row.city), 100, 'City'),
          tooLong(str(row.state), 100, 'State'),
          tooLong(str(row.postal_code), 20, 'Postal code'),
          tooLong(str(row.country), 100, 'Country'),
          tooLong(str(row.timezone), 60, 'Timezone'),
        );
        if (lengthProblem) return failed(lengthProblem);

        // ── Constrained vocabularies. An invalid value is a row error rather
        //    than a silent coercion: rewriting a source the user supplied would
        //    record a provenance they did not state. ─────────────────────────
        const source = str(row.source);
        if (source && !SOURCES.includes(source as typeof SOURCES[number])) {
          return failed(`"${source}" is not a valid source. Use one of: ${SOURCES.join(', ')}`);
        }
        const status = str(row.status);
        if (status && !STATUSES.includes(status as typeof STATUSES[number])) {
          return failed(`"${status}" is not a valid status. Use one of: ${STATUSES.join(', ')}`);
        }

        if (row.tags !== undefined && !Array.isArray(row.tags)) {
          return failed('tags must be a list');
        }
        const tags = (row.tags ?? []).map(t => String(t).trim()).filter(Boolean);

        // ── Duplicates. This single lookup catches BOTH a contact already in
        //    the workspace AND an email repeated earlier in this same file,
        //    because rows inserted earlier in the transaction are visible here.
        //    Two mechanisms could disagree; one cannot. ───────────────────────
        const dup = await tx.query(
          'SELECT id FROM contacts WHERE tenant_id = $1 AND lower(email) = lower($2) LIMIT 1',
          [tenantId, email],
        );
        if (dup.rowCount) {
          return skipped(`A contact with the email ${email} already exists (${dup.rows[0].id})`);
        }

        // ── Optional references. Neither failing to resolve is fatal: the
        //    contact is real data and belongs in the CRM either way. ──────────
        let company_id: string | null = null;
        const companyName = str(row.company_name);
        if (companyName) {
          const resolved = await resolveCompany(tx, companyName, tenantId);
          company_id = resolved.id;
          if (resolved.warning) warnings.push(resolved.warning);
        }

        let owner_id: number | null = null;
        const ownerEmail = str(row.owner_email);
        if (ownerEmail) {
          const resolved = await resolveOwner(tx, ownerEmail, tenantId);
          owner_id = resolved.id;
          if (resolved.warning) warnings.push(resolved.warning);
        }

        // ── Id. Same MAX(id)+1 scheme as createContact, and the same known
        //    race across concurrent requests (CLAUDE.md: it shares one fix with
        //    the id-leak and they move together, so it is NOT addressed here).
        //    Inside this transaction it is at least self-consistent: rows this
        //    import already inserted are counted.
        //    Deliberately not scoped by tenant — contacts.id is a GLOBAL primary
        //    key, so scoping the scan would regenerate CT001 in a second
        //    workspace and every insert would collide.
        const maxResult = await tx.query(
          `SELECT MAX(CAST(SUBSTRING(id, 3) AS INTEGER)) AS max_num FROM contacts WHERE id ~ '^CT[0-9]+$'`,
        );
        const id = `CT${String((maxResult.rows[0].max_num || 0) + 1).padStart(3, '0')}`;

        const inserted = await tx.query(
          `INSERT INTO contacts (
             id, tenant_id, first_name, last_name, email, phone, mobile, position,
             department, linkedin_url, street, city, state, postal_code, country,
             timezone, notes, tags, source, status, company_id, owner_id
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
           RETURNING id`,
          [
            id, tenantId, first_name, last_name, email,
            orNull(str(row.phone)), orNull(str(row.mobile)), orNull(str(row.position)),
            orNull(str(row.department)), orNull(str(row.linkedin_url)),
            orNull(str(row.street)), orNull(str(row.city)), orNull(str(row.state)),
            orNull(str(row.postal_code)), orNull(str(row.country)), orNull(str(row.timezone)),
            orNull(str(row.notes)), tags,
            // 'import' (migration 029) is the default and the point of that
            // migration: it records how the contact actually arrived. A source
            // the CSV states explicitly wins, having been validated above.
            source || 'import',
            status || 'active',
            company_id, owner_id,
          ],
        );

        return created(inserted.rows[0].id, warnings);
      },
    );

    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    next(error);
  } finally {
    client.release();
  }
};
