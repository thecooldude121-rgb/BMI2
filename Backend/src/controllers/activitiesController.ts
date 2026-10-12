import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireTenantId } from '../middleware/tenant';
import { foreignIdsInTenant, ScopedTable } from '../utils/tenantScope';
import { pageParams, orderBy, listEnvelope, escapeLike, ListQueryError } from '../utils/listQuery';

/** When an activity happened, or is planned to. */
const OCCURRED = 'COALESCE(a.completed_at, a.scheduled_at, a.created_at)';
/** GET /activities ?sort= keys -> SQL (allowlist). */
const ACTIVITY_SORTS: Record<string, string> = {
  occurred_at: OCCURRED, created_at: 'a.created_at', scheduled_at: 'a.scheduled_at', type: 'a.type',
};

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

/*
 * Timestamps need no special handling here any more.
 *
 * Phase 3 (14/n) wrapped these columns in
 * `$n::timestamptz AT TIME ZONE current_setting('TimeZone')` because
 * scheduled_at / completed_at / created_at were `timestamp WITHOUT time zone`:
 * the driver dropped the offset from any ISO instant a client sent, storing the
 * UTC hour as though it were local. An activity logged at 14:32 came out with
 * created_at 14:32 and completed_at 09:02.
 *
 * Migration 021 converted every timestamp column in the schema to timestamptz,
 * which removes the cause, so the wrapper is gone and the parameters are passed
 * straight through. A timestamptz column stores the instant a client sent,
 * whatever offset it carried, and NOW() agrees with it.
 */

/**
 * Exactly one parent must be supplied — and it must live in the caller's
 * workspace. Each of these four columns is an FK to its parent's GLOBAL primary
 * key, so Postgres will happily accept an activity in workspace A whose
 * contact_id names a contact in workspace B; the timeline then rendered that
 * contact's name. The table each column points at is recorded here so the
 * check and the "exactly one parent" rule cannot drift apart.
 */
const PARENTS = ['lead_id', 'deal_id', 'contact_id', 'company_id'] as const;
const PARENT_TABLE: Record<typeof PARENTS[number], ScopedTable> = {
  lead_id: 'leads',
  deal_id: 'deals',
  contact_id: 'contacts',
  company_id: 'companies',
};

// Scoped by tenant as well as id. The id comes from the caller's own verified
// token so this cannot leak today, but "every query filters by workspace" only
// holds as an invariant if it has no exceptions — an unscoped lookup is the one
// a later refactor copies.
/**
 * The caller's display name, for attribution on a record they create.
 *
 * NO QUERY. `protect` already read this account to check is_active and
 * token_version, and attaches first_name/last_name to req.user — so this reads
 * what is already in hand. Before that read existed, each of the four
 * controllers needing a name issued its own `SELECT ... FROM users`, which is
 * why protect's new lookup is net zero here rather than an extra round trip.
 *
 * One of those four copies (dealsController) was missing its `tenant_id`
 * predicate and matched on id alone — a cross-workspace read waiting for two
 * workspaces to share an id. Consolidating removes that as well as the queries.
 */
const resolveActorName = (req: AuthRequest): string => {
  const name = [req.user?.first_name, req.user?.last_name].filter(Boolean).join(' ').trim();
  return name || req.user?.email || 'Unknown';
};

/** Planned and its time has passed / not yet come — the page's Overdue and Upcoming. */
const STATE_SQL: Record<string, string> = {
  overdue: `a.status = 'planned' AND a.scheduled_at < NOW()`,
  upcoming: `a.status = 'planned' AND a.scheduled_at >= NOW()`,
};
/** ?linked= — which kind of record the activity hangs off. */
const LINKED_COLUMN: Record<string, string> = { lead: 'a.lead_id', deal: 'a.deal_id', contact: 'a.contact_id', company: 'a.company_id' };

/** An ISO 8601 instant, or a 400 naming the field. Raw values used to reach SQL and come back a masked 500. */
function instant(v: unknown, field: string): string {
  const s = String(v ?? '');
  if (!s || Number.isNaN(Date.parse(s))) throw new ListQueryError(`${field} must be an ISO 8601 timestamp`);
  return s;
}

/**
 * The FROM + WHERE every activity read shares (the list and the summary, slice
 * 4b), so a tile's number and the list's total are computed over the same set.
 */
function activityFilter(req: AuthRequest, tenantId: string): { from: string; params: unknown[] } {
  const { type, status, assigned_to, upcoming, search, occurred_after, occurred_before, state, linked } = req.query;
  let from = `
      FROM activities a
      -- Every one of these four FKs references its parent's GLOBAL primary key,
      -- so an activity in this workspace can name a parent in another one. The
      -- WHERE below scopes the activities table; without the tenant predicate on
      -- each JOIN the parent NAMES came from whichever workspace owned the parent.
      -- A join is a read.
      LEFT JOIN contacts  c  ON a.contact_id = c.id  AND c.tenant_id  = a.tenant_id
      LEFT JOIN companies co ON a.company_id = co.id AND co.tenant_id = a.tenant_id
      LEFT JOIN deals     d  ON a.deal_id    = d.id  AND d.tenant_id  = a.tenant_id
      LEFT JOIN leads     l  ON a.lead_id    = l.id  AND l.tenant_id  = a.tenant_id
      WHERE a.tenant_id = $1`;
  const params: unknown[] = [tenantId];
  const add = (sql: string, v: unknown) => { params.push(v); from += ` AND ${sql.replace('?', `$${params.length}`)}`; };

  for (const p of PARENTS) {
    const v = req.query[p];
    if (v) add(`a.${p} = ?`, v);
  }
  if (type)        add('a.type = ?', type);
  if (status)      add('a.status = ?', status);
  if (assigned_to) add('a.assigned_to = ?', assigned_to);
  // Scheduled in the future and not yet done — the "what's next" view.
  if (upcoming === 'true') from += ` AND a.scheduled_at >= NOW() AND a.status = 'planned'`;
  if (state !== undefined && state !== '') {
    const sql = STATE_SQL[String(state)];
    if (!sql) throw new ListQueryError(`state must be one of: ${Object.keys(STATE_SQL).join(', ')}`);
    from += ` AND ${sql}`;
  }
  if (linked !== undefined && linked !== '') {
    const col = LINKED_COLUMN[String(linked)];
    if (!col) throw new ListQueryError(`linked must be one of: ${Object.keys(LINKED_COLUMN).join(', ')}`);
    from += ` AND ${col} IS NOT NULL`;
  }
  if (search) add('a.subject ILIKE ?', `%${escapeLike(String(search))}%`);
  // A time range over when it happened (or is planned). INSTANTS: the browser
  // sends its own local midnights, because "today" is the viewer's day.
  if (occurred_after)  add(`${OCCURRED} >= ?::timestamptz`, instant(occurred_after, 'occurred_after'));
  if (occurred_before) add(`${OCCURRED} <  ?::timestamptz`, instant(occurred_before, 'occurred_before'));
  return { from, params };
}

/**
 * GET /api/v1/activities
 * Filters: lead_id | deal_id | contact_id | company_id, type, status,
 *          assigned_to, state=overdue|upcoming, linked=lead|deal|contact|company,
 *          search, occurred_after / occurred_before (ISO instants),
 *          upcoming=true (legacy), sort, dir, limit, offset
 */
export const getActivities = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const page = pageParams(req.query as Record<string, unknown>);
    // Upcoming reads ascending (soonest first); history reads descending.
    const order = orderBy(req.query as Record<string, unknown>, ACTIVITY_SORTS,
      req.query.upcoming === 'true' ? 'a.scheduled_at ASC' : `${OCCURRED} DESC`, 'a.id');

    // Join the parent names so a timeline does not need N extra requests to
    // render "Call with Acme Corp".
    const selectPart = `
      SELECT a.*,
             c.first_name || ' ' || COALESCE(c.last_name, '') AS contact_name,
             co.name  AS company_name,
             d.name   AS deal_name,
             l.name   AS lead_name`;
    const { from, params } = activityFilter(req, tenantId);
    const total = await pool.query(`SELECT COUNT(*)::int AS n ${from}`, params);
    const n = params.length;
    const result = await pool.query(
      `${selectPart} ${from} ORDER BY ${order} LIMIT $${n + 1} OFFSET $${n + 2}`,
      [...params, page.limit, page.offset],
    );
    res.json(listEnvelope(result.rows, total.rows[0].n, page));
  } catch (error) { next(error); }
};

/**
 * GET /api/v1/activities/summary?day_from=&day_to=&week_from=&week_to= (+ the list filters)
 *
 * The Activities page's six tiles, counted by the server under the SAME filters
 * as the list (slice 4b). They were counted from the 200 rows the page had
 * loaded. The day and week are the VIEWER'S, sent as their local midnights
 * (instants), the same decision as the Tasks buckets (Venkat, 2026-10-11);
 * "overdue" is planned work whose scheduled instant has passed, which needs no
 * calendar at all.
 */
export const getActivitiesSummary = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const bounds = ['day_from', 'day_to', 'week_from', 'week_to'].map(f => instant(req.query[f], f));
    const { from, params } = activityFilter(req, tenantId);
    const base = params.length;
    params.push(...bounds);
    const [df, dt, wf, wt] = [1, 2, 3, 4].map(k => `$${base + k}::timestamptz`);
    const today = `${OCCURRED} >= ${df} AND ${OCCURRED} < ${dt}`;
    const r = await pool.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE ${today})::int AS today,
              COUNT(*) FILTER (WHERE ${OCCURRED} >= ${wf} AND ${OCCURRED} < ${wt})::int AS this_week,
              COUNT(*) FILTER (WHERE ${STATE_SQL.overdue})::int AS overdue,
              COUNT(*) FILTER (WHERE a.type = 'meeting' AND ${today})::int AS meetings_today,
              COUNT(*) FILTER (WHERE a.type = 'call' AND ${today})::int AS calls_today
         ${from}`,
      params,
    );
    res.json({ success: true, data: r.rows[0] });
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
       -- Scoped for the same reason as getActivities: see the comment there.
       LEFT JOIN contacts  c  ON a.contact_id = c.id  AND c.tenant_id  = a.tenant_id
       LEFT JOIN companies co ON a.company_id = co.id AND co.tenant_id = a.tenant_id
       LEFT JOIN deals     d  ON a.deal_id    = d.id  AND d.tenant_id  = a.tenant_id
       LEFT JOIN leads     l  ON a.lead_id    = l.id  AND l.tenant_id  = a.tenant_id
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

    const badRef = await foreignIdsInTenant(
      supplied.map(([field, value]) => ({
        field,
        table: PARENT_TABLE[field as typeof PARENTS[number]],
        value,
      })),
      tenantId,
    );
    if (badRef) { res.status(400).json({ success: false, message: badRef }); return; }

    const actor = resolveActorName(req);
    const resolvedStatus = status || 'planned';

    const result = await pool.query(
      `INSERT INTO activities
         (subject, type, direction, status, priority, description, outcome,
          duration, scheduled_at, completed_at, created_by, assigned_to,
          lead_id, deal_id, contact_id, company_id, tenant_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,
               -- completed_at defaults to now when the caller logs something
               -- already done, so a logged call is never left without a time.
               -- The fallback is decided in JS rather than with a CASE WHEN on
               -- the status parameter: reusing that placeholder makes it both an
               -- insert value for a varchar column and a text comparison, and
               -- Postgres resolves ONE type per parameter -- "inconsistent
               -- types deduced for parameter $4".
               COALESCE($10::timestamptz, ${resolvedStatus === 'completed' ? 'NOW()' : 'NULL'}),
               $11,$12,$13,$14,$15,$16,$17)
       RETURNING *`,
      [
        String(subject).trim(), type || 'note', direction || null, resolvedStatus,
        priority || 'medium', description || null, outcome || null,
        duration ?? null, scheduled_at || null, completed_at || null,
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
