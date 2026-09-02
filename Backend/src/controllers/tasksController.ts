import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireTenantId } from '../middleware/tenant';
import { foreignIdsInTenant, ScopedTable } from '../utils/tenantScope';

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
const resolveActorName = async (req: AuthRequest): Promise<string> => {
  if (req.user?.id) {
    const row = await pool.query(
      'SELECT first_name, last_name FROM users WHERE id = $1 AND tenant_id = $2',
      [req.user.id, req.user.workspace_id],
    );
    if (row.rows[0]) return `${row.rows[0].first_name} ${row.rows[0].last_name}`.trim();
  }
  return req.user?.email || 'Unknown';
};

/**
 * GET /api/v1/tasks
 * Filters: status, priority, type, assigned_to, related_to_type,
 *          related_to_id, overdue=true, due_before, limit, offset
 */
export const getTasks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const {
      status, priority, type, assigned_to, related_to_type, related_to_id,
      overdue, due_before, limit = 50, offset = 0,
    } = req.query;

    let query = `SELECT ${TASK_COLUMNS} FROM tasks WHERE tenant_id = $1`;
    const params: any[] = [tenantId];
    let i = 2;

    if (status)          { query += ` AND status = $${i++}`;          params.push(status); }
    if (priority)        { query += ` AND priority = $${i++}`;        params.push(priority); }
    if (type)            { query += ` AND type = $${i++}`;            params.push(type); }
    if (assigned_to)     { query += ` AND assigned_to = $${i++}`;     params.push(assigned_to); }
    if (related_to_type) { query += ` AND related_to_type = $${i++}`; params.push(related_to_type); }
    if (related_to_id)   { query += ` AND related_to_id = $${i++}`;   params.push(related_to_id); }
    if (due_before)      { query += ` AND due_date <= $${i++}`;       params.push(due_before); }
    // Past due and not finished — the only definition of overdue that matters.
    if (overdue === 'true') {
      query += ` AND due_date < CURRENT_DATE AND status <> 'completed'`;
    }

    const safeLimit = Math.min(Math.max(parseInt(String(limit), 10) || 50, 1), 500);
    const safeOffset = Math.max(parseInt(String(offset), 10) || 0, 0);

    // Open tasks first, then soonest due. NULLS LAST so undated tasks do not
    // squat at the top of the list.
    query += ` ORDER BY (status = 'completed'), due_date ASC NULLS LAST, created_at DESC
               LIMIT $${i++} OFFSET $${i}`;
    params.push(safeLimit, safeOffset);

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows, count: result.rowCount });
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

    // tasks.id is a T001-style varchar with no default, like companies/contacts.
    // DELIBERATELY NOT SCOPED BY TENANT, and this is load-bearing.
    // tasks.id is a GLOBAL primary key (tasks_pkey PRIMARY KEY (id)), so ids must be
    // unique across every workspace. Adding `AND tenant_id = $n` here would make
    // the second workspace generate T001 again and every insert would fail with
    // a duplicate-key error. The scan for missing tenant filters flags this line;
    // it is a false positive.
    //
    // It IS a small information leak: the id a caller receives reveals the global
    // row count. The fix for that is a per-workspace sequence or a uuid, NOT a
    // tenant predicate.
    const maxResult = await pool.query(
      `SELECT MAX(CAST(SUBSTRING(id, 2) AS INTEGER)) AS max_num FROM tasks WHERE id ~ '^T[0-9]+$'`,
    );
    const id = `T${String((maxResult.rows[0].max_num || 0) + 1).padStart(3, '0')}`;

    const actor = await resolveActorName(req);
    const resolvedStatus = status || 'pending';

    const result = await pool.query(
      `INSERT INTO tasks
         (id, title, description, type, priority, status, assigned_to,
          related_to_type, related_to_id, due_date, completed_at, tenant_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING ${TASK_COLUMNS}`,
      [
        id, String(title).trim(), description || null,
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
