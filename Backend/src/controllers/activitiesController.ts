import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireTenantId } from '../middleware/tenant';

/**
 * Activities — the CRM timeline.
 *
 * The `activities` table has existed all along with no controller. Every
 * activity feed in the app (ActivitiesPage, ActivityDetailPage, the deal and
 * contact timelines) renders inline fixtures.
 *
 * An activity hangs off exactly one record: a lead, deal, contact or company.
 * That is four nullable FK columns rather than a single polymorphic pair, which
 * keeps referential integrity — a deleted deal takes its activities with it,
 * which `related_to_type`/`related_to_id` (used by `tasks`) cannot express.
 *
 * NOTE ON OVERLAP: leadSubController already exposes lead-scoped activities at
 * /leads/:leadId/activities and writes the same table. This controller is the
 * general one; both must stay consistent. Prefer this one for new work.
 */

// Copied from the live CHECK constraints (pg_constraint on activities), not from
// any TS type — those disagree with the database in several places in this repo.
// Validated here so a bad value is a 400 naming the allowed set, rather than a
// raw Postgres constraint violation.
const VALID_TYPES = [
  'call', 'email', 'meeting', 'task', 'note', 'sms', 'whatsapp',
  'linkedin', 'demo', 'proposal', 'document', 'visit',
] as const;
const VALID_STATUSES = ['planned', 'completed', 'cancelled', 'no_show', 'rescheduled'] as const;
const VALID_DIRECTIONS = ['inbound', 'outbound'] as const;
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

/** Exactly one parent must be supplied. */
const PARENTS = ['lead_id', 'deal_id', 'contact_id', 'company_id'] as const;

const resolveActorName = async (req: AuthRequest): Promise<string> => {
  if (req.user?.id) {
    const row = await pool.query('SELECT first_name, last_name FROM users WHERE id = $1', [req.user.id]);
    if (row.rows[0]) return `${row.rows[0].first_name} ${row.rows[0].last_name}`.trim();
  }
  return req.user?.email || 'Unknown';
};

/**
 * GET /api/v1/activities
 * Filters: lead_id | deal_id | contact_id | company_id, type, status,
 *          assigned_to, upcoming=true, limit, offset
 */
export const getActivities = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const { type, status, assigned_to, upcoming, limit = 50, offset = 0 } = req.query;

    // Join the parent names so a timeline does not need N extra requests to
    // render "Call with Acme Corp".
    let query = `
      SELECT a.*,
             c.first_name || ' ' || COALESCE(c.last_name, '') AS contact_name,
             co.name  AS company_name,
             d.name   AS deal_name,
             l.name   AS lead_name
      FROM activities a
      LEFT JOIN contacts  c  ON a.contact_id = c.id
      LEFT JOIN companies co ON a.company_id = co.id
      LEFT JOIN deals     d  ON a.deal_id    = d.id
      LEFT JOIN leads     l  ON a.lead_id    = l.id
      WHERE a.tenant_id = $1`;
    const params: any[] = [tenantId];
    let i = 2;

    for (const p of PARENTS) {
      const v = req.query[p];
      if (v) { query += ` AND a.${p} = $${i++}`; params.push(v); }
    }
    if (type)        { query += ` AND a.type = $${i++}`;        params.push(type); }
    if (status)      { query += ` AND a.status = $${i++}`;      params.push(status); }
    if (assigned_to) { query += ` AND a.assigned_to = $${i++}`; params.push(assigned_to); }
    // Scheduled in the future and not yet done — the "what's next" view.
    if (upcoming === 'true') {
      query += ` AND a.scheduled_at >= NOW() AND a.status = 'planned'`;
    }

    const safeLimit = Math.min(Math.max(parseInt(String(limit), 10) || 50, 1), 500);
    const safeOffset = Math.max(parseInt(String(offset), 10) || 0, 0);

    // Upcoming reads ascending (soonest first); history reads descending.
    query += upcoming === 'true'
      ? ` ORDER BY a.scheduled_at ASC LIMIT $${i++} OFFSET $${i}`
      : ` ORDER BY COALESCE(a.completed_at, a.scheduled_at, a.created_at) DESC LIMIT $${i++} OFFSET $${i}`;
    params.push(safeLimit, safeOffset);

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows, count: result.rowCount });
  } catch (error) { next(error); }
};

export const getActivityById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const result = await pool.query(
      `SELECT a.*,
              c.first_name || ' ' || COALESCE(c.last_name, '') AS contact_name,
              co.name AS company_name, d.name AS deal_name, l.name AS lead_name
       FROM activities a
       LEFT JOIN contacts  c  ON a.contact_id = c.id
       LEFT JOIN companies co ON a.company_id = co.id
       LEFT JOIN deals     d  ON a.deal_id    = d.id
       LEFT JOIN leads     l  ON a.lead_id    = l.id
       WHERE a.id = $1 AND a.tenant_id = $2`,
      [req.params.id, tenantId],
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Activity not found' }); return; }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

export const createActivity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const {
      subject, type, direction, status, priority, description, outcome,
      duration, scheduled_at, completed_at, assigned_to,
      lead_id, deal_id, contact_id, company_id,
    } = req.body;

    if (!subject || !String(subject).trim()) {
      res.status(400).json({ success: false, message: 'subject is required' });
      return;
    }
    if (type && !VALID_TYPES.includes(type)) {
      res.status(400).json({ success: false, message: `type must be one of: ${VALID_TYPES.join(', ')}` });
      return;
    }
    if (status && !VALID_STATUSES.includes(status)) {
      res.status(400).json({ success: false, message: `status must be one of: ${VALID_STATUSES.join(', ')}` });
      return;
    }
    if (direction && !VALID_DIRECTIONS.includes(direction)) {
      res.status(400).json({ success: false, message: `direction must be one of: ${VALID_DIRECTIONS.join(', ')}` });
      return;
    }
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      res.status(400).json({ success: false, message: `priority must be one of: ${VALID_PRIORITIES.join(', ')}` });
      return;
    }

    // An activity with no parent is invisible — it appears on no timeline and
    // can only be found by listing every activity. Reject it rather than
    // silently creating an orphan.
    const parents = { lead_id, deal_id, contact_id, company_id };
    const supplied = Object.entries(parents).filter(([, v]) => v != null && v !== '');
    if (supplied.length === 0) {
      res.status(400).json({
        success: false,
        message: 'An activity must be linked to exactly one of: lead_id, deal_id, contact_id, company_id',
      });
      return;
    }
    if (supplied.length > 1) {
      res.status(400).json({
        success: false,
        message: `An activity must link to exactly one record, but got ${supplied.map(([k]) => k).join(' and ')}`,
      });
      return;
    }

    const actor = await resolveActorName(req);
    // completed_at defaults to now when the caller logs something already done,
    // so a logged call is not left with an empty timestamp.
    const resolvedStatus = status || 'planned';
    const resolvedCompletedAt =
      completed_at ?? (resolvedStatus === 'completed' ? new Date().toISOString() : null);

    const result = await pool.query(
      `INSERT INTO activities
         (subject, type, direction, status, priority, description, outcome,
          duration, scheduled_at, completed_at, created_by, assigned_to,
          lead_id, deal_id, contact_id, company_id, tenant_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING *`,
      [
        String(subject).trim(), type || 'note', direction || null, resolvedStatus,
        priority || 'medium', description || null, outcome || null,
        duration ?? null, scheduled_at || null, resolvedCompletedAt,
        actor, assigned_to || actor,
        lead_id ?? null, deal_id ?? null, contact_id ?? null, company_id ?? null,
        tenantId,
      ],
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

const UPDATABLE = [
  'subject', 'type', 'direction', 'status', 'priority', 'description',
  'outcome', 'duration', 'scheduled_at', 'completed_at', 'assigned_to',
];

export const updateActivity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);

    if (req.body.type !== undefined && !VALID_TYPES.includes(req.body.type)) {
      res.status(400).json({ success: false, message: `type must be one of: ${VALID_TYPES.join(', ')}` });
      return;
    }
    if (req.body.status !== undefined && !VALID_STATUSES.includes(req.body.status)) {
      res.status(400).json({ success: false, message: `status must be one of: ${VALID_STATUSES.join(', ')}` });
      return;
    }
    if (req.body.direction !== undefined && req.body.direction !== null
        && !VALID_DIRECTIONS.includes(req.body.direction)) {
      res.status(400).json({ success: false, message: `direction must be one of: ${VALID_DIRECTIONS.join(', ')}` });
      return;
    }
    if (req.body.priority !== undefined && !VALID_PRIORITIES.includes(req.body.priority)) {
      res.status(400).json({ success: false, message: `priority must be one of: ${VALID_PRIORITIES.join(', ')}` });
      return;
    }

    const updates: string[] = [];
    const params: any[] = [];
    let i = 1;
    UPDATABLE.forEach(f => {
      if (req.body[f] !== undefined) { updates.push(`${f} = $${i++}`); params.push(req.body[f]); }
    });

    // Completing an activity stamps completed_at unless the caller set it, so
    // "when did this happen" is always answerable.
    if (req.body.status === 'completed' && req.body.completed_at === undefined) {
      updates.push(`completed_at = COALESCE(completed_at, NOW())`);
    }

    if (!updates.length) { res.status(400).json({ success: false, message: 'No fields to update' }); return; }
    updates.push('updated_at = NOW()');
    params.push(req.params.id, tenantId);

    const result = await pool.query(
      `UPDATE activities SET ${updates.join(', ')} WHERE id = $${i++} AND tenant_id = $${i} RETURNING *`,
      params,
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Activity not found' }); return; }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

export const deleteActivity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const result = await pool.query(
      'DELETE FROM activities WHERE id = $1 AND tenant_id = $2 RETURNING id',
      [req.params.id, tenantId],
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Activity not found' }); return; }
    res.json({ success: true, message: 'Activity deleted' });
  } catch (error) { next(error); }
};
