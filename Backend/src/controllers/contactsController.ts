import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireTenantId } from '../middleware/tenant';

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
const SOURCES = ['lead-gen', 'hrms', 'converted', 'manual', 'website', 'referral', 'event'] as const;
const STATUSES = ['active', 'inactive', 'do-not-contact'] as const;

/** Columns a client may write, in the order used by the INSERT below. */
const WRITABLE = [
  'company_id', 'first_name', 'last_name', 'email', 'phone', 'mobile',
  'position', 'department', 'linkedin_url', 'is_primary',
  'street', 'city', 'state', 'postal_code', 'country', 'timezone',
  'notes', 'tags', 'source', 'status', 'owner_id',
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
  LEFT JOIN companies co ON c.company_id = co.id
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
  if (body.tags !== undefined && body.tags !== null && !Array.isArray(body.tags)) {
    return 'tags must be an array of strings';
  }
  if (Array.isArray(body.tags) && body.tags.some(t => typeof t !== 'string')) {
    return 'tags must be an array of strings';
  }
  return null;
}

/**
 * An owner_id must name a user in the CALLER's tenant. Without this check a
 * client could attach any user id in the database to its own contact, and the
 * owner_name join would then read that other tenant's user back out — the same
 * shape of cross-tenant leak that createTag's ON CONFLICT had (migration 010).
 */
async function ownerIsInTenant(ownerId: unknown, tenantId: string): Promise<boolean> {
  const result = await pool.query(
    'SELECT 1 FROM users WHERE id = $1 AND tenant_id = $2',
    [ownerId, tenantId],
  );
  return result.rowCount === 1;
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

    if (req.body.owner_id != null && !(await ownerIsInTenant(req.body.owner_id, tenantId))) {
      res.status(400).json({ success: false, message: 'owner_id does not name a user in this tenant' });
      return;
    }

    // contacts.id is a CT001-style varchar with no DB default — generate it here,
    // matching the D001 scheme in dealsController.
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

    if (req.body.owner_id != null && !(await ownerIsInTenant(req.body.owner_id, tenantId))) {
      res.status(400).json({ success: false, message: 'owner_id does not name a user in this tenant' });
      return;
    }

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
      if (payload.owner_id !== null && !(await ownerIsInTenant(payload.owner_id, tenantId))) {
        res.status(400).json({ success: false, message: 'owner_id does not name a user in this tenant' });
        return;
      }
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
