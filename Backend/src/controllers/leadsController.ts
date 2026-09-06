import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireTenantId } from '../middleware/tenant';

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
  'position', 'industry', 'stage', 'status', 'score', 'source',
  'assigned_to', 'notes', 'tags', 'custom_fields',
];

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

export const getLeads = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    // `owner_id` is accepted as an alias for the live `assigned_to` column;
    // leadsApi.ts sends that param name.
    const { stage, owner_id, assigned_to, search, limit = 50, offset = 0 } = req.query;
    const owner = assigned_to ?? owner_id;

    let query = `SELECT * FROM leads WHERE tenant_id = $1`;
    const params: any[] = [tenantId];
    let i = 2;

    if (stage) { query += ` AND stage = $${i++}`;       params.push(stage); }
    if (owner) { query += ` AND assigned_to = $${i++}`; params.push(owner); }
    if (search) {
      query += ` AND (first_name ILIKE $${i} OR last_name ILIKE $${i} OR email ILIKE $${i} OR company ILIKE $${i})`;
      params.push(`%${search}%`);
      i++;
    }

    // Coerce and cap pagination — these came straight off the query string, so
    // `?limit=abc` was a 500 and `?limit=999999` an unbounded scan.
    const safeLimit = Math.min(Math.max(parseInt(String(limit), 10) || 50, 1), 500);
    const safeOffset = Math.max(parseInt(String(offset), 10) || 0, 0);

    query += ` ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i}`;
    params.push(safeLimit, safeOffset);

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows, count: result.rowCount });
  } catch (error) { next(error); }
};

export const getLeadById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const result = await pool.query('SELECT * FROM leads WHERE id = $1 AND tenant_id = $2', [req.params.id, tenantId]);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Lead not found' }); return; }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

export const createLead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const {
      first_name, last_name, email, phone, company, position,
      industry, stage, status, score, source, owner_id, assigned_to,
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
    if (stage && !VALID_STAGES.includes(stage)) {
      res.status(400).json({ success: false, message: `stage must be one of: ${VALID_STAGES.join(', ')}` });
      return;
    }
    if (status && !VALID_STATUSES.includes(status)) {
      res.status(400).json({ success: false, message: `status must be one of: ${VALID_STATUSES.join(', ')}` });
      return;
    }

    const result = await pool.query(
      `INSERT INTO leads
         (first_name, last_name, email, phone, company, position,
          industry, stage, status, score, source, assigned_to, notes,
          tags, custom_fields, tenant_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
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
        assigned_to || owner_id || null,
        notes    || null,
        // tags is text[] since migration 012 — pass the array through and let
        // the driver map it. It was JSON.stringify'd into a text column before,
        // which disagreed with both the existing rows and the frontend reader.
        Array.isArray(tags) ? tags : [],
        custom_fields ? JSON.stringify(custom_fields) : '{}',
        tenantId,
      ]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

export const updateLead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);

    if (req.body.stage !== undefined && !VALID_STAGES.includes(req.body.stage)) {
      res.status(400).json({ success: false, message: `stage must be one of: ${VALID_STAGES.join(', ')}` });
      return;
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

    // Accept `owner_id` as an alias for the live assigned_to column.
    if (req.body.assigned_to === undefined && req.body.owner_id !== undefined) {
      updates.push(`assigned_to = $${i++}`);
      params.push(req.body.owner_id || null);
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
