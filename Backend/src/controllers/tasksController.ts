import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireTenantId } from '../middleware/tenant';
import { foreignIdsInTenant, ScopedTable } from '../utils/tenantScope';
import { pageParams, orderBy, listEnvelope, escapeLike, ListQueryError } from '../utils/listQuery';

/** GET /tasks ?sort= keys -> SQL (allowlist). */
const TASK_SORTS: Record<string, string> = {
  due_date: 'due_date', created_at: 'created_at', title: 'lower(title)', status: 'status',
  priority: "CASE priority WHEN 'high' THEN 3 WHEN 'medium' THEN 2 WHEN 'low' THEN 1 ELSE 0 END",
};

/**
 * Tasks.
 *
 * The `tasks` table holds 15 real rows and has never had a controller — the
 * CRM's TasksPage renders `useData()` sample data instead, and its "Add Task"
 * button has no handler at all, so there was no way to create one.
 *
 * Unlike `activities` (four nullable FKs), tasks use a polymorphic
 * related_to_type / related_to_id pair. That is the existing shape and the 15
 * rows depend on it, so it is preserved rather than migrated. The trade-off is
 * real and worth knowing: there is no FK, so deleting a lead leaves its tasks
 * pointing at nothing. Cleaning that up is future work — it needs either a
 * trigger or per-type FK columns like activities has.
 */

// Copied from the live CHECK constraints, verified against pg_constraint.
// Note these differ from the activities vocabularies — tasks use 'pending' /
// 'in-progress' (hyphen) and have no 'urgent' priority.
const VALID_TYPES = ['call', 'email', 'meeting', 'follow-up', 'other'] as const;
const VALID_STATUSES = ['pending', 'in-progress', 'completed'] as const;
const VALID_PRIORITIES = ['low', 'medium', 'high'] as const;
// 'contact' and 'company' were added by migration 030 so a task can name the
// person or account it is about, not only the deal.
const VALID_RELATED_TYPES = ['lead', 'deal', 'contact', 'company', 'employee'] as const;

/**
 * due_date is a DATE column, and the API emits it as YYYY-MM-DD (see the
 * to_char in TASK_COLUMNS below), so that is the canonical wire format. It is
 * also exactly what TaskFormModal's <input type="date"> produces, which is why
 * validating strictly here cannot break the real form.
 *
 * Before this, anything else went straight to Postgres: 'not-a-date' and
 * '2026-13-45' came back as a masked 500, and — worse — '03/11/2026' was
 * ACCEPTED and silently interpreted according to the server's DateStyle. That
 * is the same class of ambiguity as the timezone off-by-one this very column
 * already suffered, so it is now rejected rather than guessed at.
 *
 * omitted / null / '' all mean "no due date" and stay valid: createTask writes
 * `due_date || null`, and the form sends '' for a cleared date.
 */
const DUE_DATE_SHAPE = /^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/;
function dueDateError(v: unknown): string | null {
  if (v === undefined || v === null || v === '') return null;
  const m = DUE_DATE_SHAPE.exec(String(v));
  if (!m) return 'due_date must be a calendar date in YYYY-MM-DD format';
  const [, y, mo, d] = m;
  // Round-trip the parsed parts: this is what rejects 2026-13-45 and 2026-02-30,
  // which match the shape above but are not real days.
  const dt = new Date(`${y}-${mo}-${d}T00:00:00Z`);
  if (
    Number.isNaN(dt.getTime()) ||
    dt.getUTCFullYear() !== Number(y) ||
    dt.getUTCMonth() + 1 !== Number(mo) ||
    dt.getUTCDate() !== Number(d)
  ) {
    return `due_date "${String(v)}" is not a real calendar date`;
  }
  return null;
}

/**
 * Which table a related_to_type points at, for the workspace check on write.
 *
 * `employee` is deliberately absent and this is a KNOWN GAP, not an oversight:
 * the `employees` table has no `tenant_id` column at all (it is one of the
 * tables that predates workspace scoping), so there is nothing to check a
 * related_to_id against. A task in this workspace can therefore name any
 * employee row in the database.
 *
 * Impact today is limited to the reference itself: `tasks` is a polymorphic
 * related_to_type/related_to_id pair with no FK, and no query joins it, so
 * nothing of the employee's is projected — GET /tasks only ever returns this
 * workspace's task rows. It becomes a real leak the moment someone joins
 * `employees` to render a name. Scoping that table is the fix and it needs a
 * migration; until then this must not be joined.
 */
const RELATED_TABLE: Partial<Record<typeof VALID_RELATED_TYPES[number], ScopedTable>> = {
  lead: 'leads',
  deal: 'deals',
  // Added with migration 030. Both reference GLOBAL primary keys, so without an
  // entry here a task in workspace A could name workspace B's contact.
  contact: 'contacts',
  company: 'companies',
};

/**
 * The projection every task query uses.
 *
 * WHY due_date IS CAST TO TEXT — a real off-by-one found in live verification.
 *
 * `due_date` is a DATE: a calendar day with no time and no timezone. The pg
 * driver nonetheless parses it into a JS Date at LOCAL midnight, and res.json()
 * then serialises that with toISOString(). In IST (UTC+5:30) local midnight on
 * the 2nd is 18:30 UTC on the 1st, so the client received "2026-09-01..." for a
 * row Postgres holds as 2026-09-02 — every task due date rendered a day early,
 * and a task due today was bucketed as Overdue.
 *
 * to_char keeps it the string it already is in the database, so no timezone is
 * ever applied to a value that does not have one. Verified: Postgres 2026-09-02
 * now reaches the client as "2026-09-02".
 *
 * NOTE THIS IS THE NARROW FIX. The same defect affects all 13 DATE columns in
 * this database (deals.expected_close_date, leads.last_contact, invoices.due_date
 * and more) and the one-line global fix is a pg type parser for oid 1082 — see
 * the finding in HANDOFF.md. It is not applied here because it changes how every
 * date in the app serialises and that needs its own verification pass, not a
 * rider on the tasks page.
 */
const TASK_COLUMNS = `
  id, title, description, type, priority, status, assigned_to,
  related_to_type, related_to_id,
  to_char(due_date, 'YYYY-MM-DD') AS due_date,
  completed_at, created_at, updated_at
`;

/** Reject a related_to_id that names a record in another workspace. */
async function relatedRefError(
  body: Record<string, unknown>,
  tenantId: string,
): Promise<string | null> {
  const type = body.related_to_type as typeof VALID_RELATED_TYPES[number] | undefined;
  if (!type) return null;
  const table = RELATED_TABLE[type];
  if (!table) return null; // 'employee' — see RELATED_TABLE.
  return foreignIdsInTenant(
    [{ field: 'related_to_id', table, value: body.related_to_id }],
    tenantId,
  );
}

// Scoped by tenant as well as id -- see the note in activitiesController.
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

/**
 * THE BUCKETS (Group A item 4, slice 4a). The Tasks page's tabs and tiles, and
 * the calendar's overdue count, are ONE vocabulary defined here, so a tab and
 * the count on it cannot disagree.
 *
 * "Today" is the VIEWER'S calendar day, sent by the browser as `?today=` —
 * DECIDED by Venkat 2026-10-11 ("use the viewer's local date for
 * Today/Overdue, not the server's"). A task due on the 12th is due today for
 * someone in Kolkata at 01:00 on the 12th even though a server clock in another
 * zone still reads the 11th. So no bucket that depends on the day ever falls
 * back to CURRENT_DATE: without a valid `today` it is a 400.
 *
 * "Mine" is the caller's display name, because tasks.assigned_to is still free
 * text (the owner-FK migration is item 8). It is resolved from the TOKEN'S
 * user, never from a parameter.
 */
const OPEN = `status IS DISTINCT FROM 'completed'`;
export const TASK_BUCKETS = ['all', 'mine', 'open', 'overdue', 'today', 'upcoming', 'no_date', 'completed'] as const;
type TaskBucket = typeof TASK_BUCKETS[number];
const DAY_BUCKETS: readonly TaskBucket[] = ['overdue', 'today', 'upcoming'];

function bucketPredicate(b: TaskBucket, todayRef: string, meRef: string): string {
  switch (b) {
    case 'all':       return 'TRUE';
    case 'mine':      return `assigned_to = ${meRef}`;
    case 'open':      return OPEN;
    case 'overdue':   return `due_date < ${todayRef} AND ${OPEN}`;
    case 'today':     return `due_date = ${todayRef} AND ${OPEN}`;
    case 'upcoming':  return `due_date > ${todayRef} AND ${OPEN}`;
    case 'no_date':   return `due_date IS NULL AND ${OPEN}`;
    case 'completed': return `status = 'completed'`;
  }
}

const DAY_ONLY = /^\d{4}-\d{2}-\d{2}$/;
/** A strict YYYY-MM-DD that is a real calendar day, or a 400. */
function calendarDay(v: unknown, field: string): string {
  const s = String(v ?? '');
  if (!DAY_ONLY.test(s) || dueDateError(s)) {
    throw new ListQueryError(`${field} must be a calendar date in YYYY-MM-DD format`);
  }
  return s;
}

/**
 * The WHERE every task read shares (list, summary, by-day): workspace first,
 * then the optional filters. Returns the clause and its parameters so callers
 * can append their own.
 */
function taskFilter(req: AuthRequest, tenantId: string): { where: string; params: unknown[] } {
  const {
    status, priority, type, assigned_to, related_to_type, related_to_id,
    overdue, due_before, due_after, search,
  } = req.query;
  let where = `WHERE tenant_id = $1`;
  const params: unknown[] = [tenantId];
  const add = (sql: string, v: unknown) => { params.push(v); where += ` AND ${sql.replace('?', `$${params.length}`)}`; };

  if (status)          add('status = ?', status);
  if (priority)        add('priority = ?', priority);
  if (type)            add('type = ?', type);
  if (assigned_to)     add('assigned_to = ?', assigned_to);
  if (related_to_type === 'none') where += ' AND related_to_type IS NULL';
  else if (related_to_type) add('related_to_type = ?', related_to_type);
  if (related_to_id)   add('related_to_id = ?', related_to_id);
  if (due_before)      add('due_date <= ?', calendarDay(due_before, 'due_before'));
  // A date range (the calendar's visible days).
  if (due_after)       add('due_date >= ?', calendarDay(due_after, 'due_after'));
  if (search)          add('title ILIKE ?', `%${escapeLike(String(search))}%`);
  // The legacy filter, kept for compatibility: no screen sends it any more,
  // and it is the SERVER's day. Screens use ?bucket=overdue&today= instead.
  if (overdue === 'true') where += ` AND due_date < CURRENT_DATE AND ${OPEN}`;
  return { where, params };
}

/**
 * GET /api/v1/tasks
 * Filters: status, priority, type, assigned_to, related_to_type (or 'none'),
 *          related_to_id, due_after, due_before, search, overdue=true (legacy),
 *          bucket (one of TASK_BUCKETS; overdue/today/upcoming need ?today=),
 *          sort, dir, limit, offset
 */
export const getTasks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const page = pageParams(req.query as Record<string, unknown>);
    // Open tasks first, then soonest due. NULLS LAST so undated tasks do not
    // squat at the top of the list.
    const order = orderBy(req.query as Record<string, unknown>, TASK_SORTS,
      `(status = 'completed'), due_date ASC NULLS LAST, created_at DESC`, 'id');

    const { where: base, params } = taskFilter(req, tenantId);
    let where = base;
    const bucket = req.query.bucket;
    if (bucket !== undefined && bucket !== '') {
      if (!(TASK_BUCKETS as readonly string[]).includes(String(bucket))) {
        throw new ListQueryError(`bucket must be one of: ${TASK_BUCKETS.join(', ')}`);
      }
      const b = bucket as TaskBucket;
      let todayRef = 'NULL';
      if (DAY_BUCKETS.includes(b)) { params.push(calendarDay(req.query.today, 'today')); todayRef = `$${params.length}::date`; }
      let meRef = 'NULL';
      if (b === 'mine') { params.push(resolveActorName(req)); meRef = `$${params.length}`; }
      where += ` AND ${bucketPredicate(b, todayRef, meRef)}`;
    }

    const total = await pool.query(`SELECT COUNT(*)::int AS n FROM tasks ${where}`, params);
    const n = params.length;
    const result = await pool.query(
      `SELECT ${TASK_COLUMNS} FROM tasks ${where} ORDER BY ${order} LIMIT $${n + 1} OFFSET $${n + 2}`,
      [...params, page.limit, page.offset],
    );
    res.json(listEnvelope(result.rows, total.rows[0].n, page));
  } catch (error) { next(error); }
};

/**
 * GET /api/v1/tasks/summary?today=YYYY-MM-DD (+ the list filters)
 * Every bucket's count in ONE query, under the same filters as the list — so
 * the number on a tab is exactly the total the tab's list answers with.
 */
export const getTasksSummary = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const today = calendarDay(req.query.today, 'today');
    const { where, params } = taskFilter(req, tenantId);
    params.push(today);
    const todayRef = `$${params.length}::date`;
    params.push(resolveActorName(req));
    const meRef = `$${params.length}`;
    const cols = TASK_BUCKETS
      .map(b => `COUNT(*) FILTER (WHERE ${bucketPredicate(b, todayRef, meRef)})::int AS ${b}`)
      .join(', ');
    const r = await pool.query(`SELECT ${cols} FROM tasks ${where}`, params);
    // `as_of` echoes the day used; `today` is the bucket's COUNT.
    res.json({ success: true, data: { as_of: today, ...r.rows[0] } });
  } catch (error) { next(error); }
};

/**
 * GET /api/v1/tasks/by-day?from=YYYY-MM-DD&to=YYYY-MM-DD (+ the list filters)
 *
 * The calendar grid: for each day in the range that has tasks, its real count,
 * how many are open, and the first CHIPS_PER_DAY tasks (open first, then by
 * title). It replaced one 500-task fetch that ignored dates entirely, so at
 * scale a month could silently show none of its tasks. A cell's "+N more" is
 * the server's count, not the length of what was loaded. The range is capped
 * so one request cannot ask for years.
 */
const CHIPS_PER_DAY = 3;
const BY_DAY_MAX_SPAN = 62;
export const getTasksByDay = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const from = calendarDay(req.query.from, 'from');
    const to = calendarDay(req.query.to, 'to');
    const span = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000;
    if (span < 0) throw new ListQueryError('from must not be after to');
    if (span >= BY_DAY_MAX_SPAN) throw new ListQueryError(`the range may cover at most ${BY_DAY_MAX_SPAN} days`);

    const { where, params } = taskFilter(req, tenantId);
    params.push(from, to);
    const r = await pool.query(
      `WITH f AS (
         SELECT ${TASK_COLUMNS},
                ROW_NUMBER() OVER (PARTITION BY tasks.due_date ORDER BY (status = 'completed'), lower(title), id) AS rn,
                COUNT(*) OVER (PARTITION BY tasks.due_date)::int AS day_total,
                (COUNT(*) FILTER (WHERE ${OPEN}) OVER (PARTITION BY tasks.due_date))::int AS day_open
           FROM tasks ${where}
            AND tasks.due_date BETWEEN $${params.length - 1}::date AND $${params.length}::date
       )
       SELECT * FROM f WHERE rn <= ${CHIPS_PER_DAY} ORDER BY due_date, rn`,
      params,
    );
    const days: { day: string; total: number; open: number; tasks: unknown[] }[] = [];
    for (const row of r.rows) {
      const { rn: _rn, day_total, day_open, ...task } = row;
      let d = days[days.length - 1];
      if (!d || d.day !== task.due_date) { d = { day: task.due_date, total: day_total, open: day_open, tasks: [] }; days.push(d); }
      d.tasks.push(task);
    }
    const total = days.reduce((n, d) => n + d.total, 0);
    res.json({ success: true, data: { from, to, total, days } });
  } catch (error) { next(error); }
};

export const getTaskById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const result = await pool.query(
      `SELECT ${TASK_COLUMNS} FROM tasks WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, tenantId],
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Task not found' }); return; }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

export const createTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const {
      title, description, type, priority, status, assigned_to,
      related_to_type, related_to_id, due_date,
    } = req.body;

    if (!title || !String(title).trim()) {
      res.status(400).json({ success: false, message: 'title is required' });
      return;
    }
    const badDueDate = dueDateError(due_date);
    if (badDueDate) { res.status(400).json({ success: false, message: badDueDate }); return; }
    if (type && !VALID_TYPES.includes(type)) {
      res.status(400).json({ success: false, message: `type must be one of: ${VALID_TYPES.join(', ')}` });
      return;
    }
    if (status && !VALID_STATUSES.includes(status)) {
      res.status(400).json({ success: false, message: `status must be one of: ${VALID_STATUSES.join(', ')}` });
      return;
    }
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      res.status(400).json({ success: false, message: `priority must be one of: ${VALID_PRIORITIES.join(', ')}` });
      return;
    }
    if (related_to_type && !VALID_RELATED_TYPES.includes(related_to_type)) {
      res.status(400).json({ success: false, message: `related_to_type must be one of: ${VALID_RELATED_TYPES.join(', ')}` });
      return;
    }
    // The pair is meaningless half-supplied: a type with no id points nowhere,
    // an id with no type cannot be resolved.
    if ((related_to_type && !related_to_id) || (related_to_id && !related_to_type)) {
      res.status(400).json({
        success: false,
        message: 'related_to_type and related_to_id must be supplied together',
      });
      return;
    }

    const badRef = await relatedRefError(req.body, tenantId);
    if (badRef) { res.status(400).json({ success: false, message: badRef }); return; }

    // The id comes from the column DEFAULT (migration 031:
    // 'T' || LPAD(nextval('tasks_id_seq'), 3, '0')). The old MAX(id)+1 read the
    // maximum in one statement and inserted in another, racing across
    // concurrent requests — 7 of 10 writes lost at ten concurrent creates, each
    // as a masked 500. nextval() is atomic, so the id is simply omitted here.

    const actor = resolveActorName(req);
    const resolvedStatus = status || 'pending';

    const result = await pool.query(
      `INSERT INTO tasks
         (title, description, type, priority, status, assigned_to,
          related_to_type, related_to_id, due_date, completed_at, tenant_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING ${TASK_COLUMNS}`,
      [
        String(title).trim(), description || null,
        type || 'other', priority || 'medium', resolvedStatus,
        assigned_to || actor,
        related_to_type || null, related_to_id || null,
        due_date || null,
        resolvedStatus === 'completed' ? new Date().toISOString() : null,
        tenantId,
      ],
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

const UPDATABLE = [
  'title', 'description', 'type', 'priority', 'status', 'assigned_to',
  'related_to_type', 'related_to_id', 'due_date',
];

export const updateTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);

    const checks: [string, readonly string[]][] = [
      ['type', VALID_TYPES], ['status', VALID_STATUSES],
      ['priority', VALID_PRIORITIES], ['related_to_type', VALID_RELATED_TYPES],
    ];
    for (const [field, allowed] of checks) {
      const v = req.body[field];
      if (v !== undefined && v !== null && !allowed.includes(v)) {
        res.status(400).json({ success: false, message: `${field} must be one of: ${allowed.join(', ')}` });
        return;
      }
    }

    // createTask rejects a blank title; this path wrote it — an explicit null
    // hit tasks.title NOT NULL as a masked 500, and an empty string produced a
    // task with no title in the list.
    if (req.body.title !== undefined && !String(req.body.title ?? '').trim()) {
      res.status(400).json({ success: false, message: 'title cannot be blank' });
      return;
    }
    const badDueDate = dueDateError(req.body.due_date);
    if (badDueDate) { res.status(400).json({ success: false, message: badDueDate }); return; }

    const badRef = await relatedRefError(req.body, tenantId);
    if (badRef) { res.status(400).json({ success: false, message: badRef }); return; }

    const updates: string[] = [];
    const params: any[] = [];
    let i = 1;
    UPDATABLE.forEach(f => {
      if (req.body[f] === undefined) return;
      updates.push(`${f} = $${i++}`);
      // due_date is a nullable DATE, and '' is what a cleared <input type="date">
      // yields. createTask already coerces it with `due_date || null`; this loop
      // pushed it raw, so Postgres answered "invalid input syntax for type date"
      // and errorHandler masked it as a 500. Coerce it the same way the create
      // path does, so clearing a due date works through either endpoint.
      if (f === 'due_date' && req.body[f] === '') params.push(null);
      else params.push(req.body[f]);
    });

    // Completing a task stamps completed_at; reopening one clears it, so a
    // reopened task does not keep claiming it was finished.
    if (req.body.status === 'completed') {
      updates.push('completed_at = COALESCE(completed_at, NOW())');
    } else if (req.body.status !== undefined) {
      updates.push('completed_at = NULL');
    }

    if (!updates.length) { res.status(400).json({ success: false, message: 'No fields to update' }); return; }
    updates.push('updated_at = NOW()');
    params.push(req.params.id, tenantId);

    const result = await pool.query(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${i++} AND tenant_id = $${i} RETURNING ${TASK_COLUMNS}`,
      params,
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Task not found' }); return; }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

export const deleteTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND tenant_id = $2 RETURNING id',
      [req.params.id, tenantId],
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Task not found' }); return; }
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) { next(error); }
};
