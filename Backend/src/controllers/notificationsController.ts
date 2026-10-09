import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireTenantId } from '../middleware/tenant';
import { FOLLOW_UP_JOIN } from '../utils/leadFollowUp';

/**
 * The signed-in person's own feed (Group A item 5). Every query is keyed on
 * BOTH the workspace from the token and the caller's user id: there is no
 * parameter that names another person, so another person's rows have no shape
 * in which they can be asked for. A row that is not yours is absent (404 on
 * mark-read), never a 403 — the same rule as targets visibility.
 */
function me(req: AuthRequest): number {
  const n = Number(req.user?.id);
  if (!Number.isInteger(n) || n <= 0) throw Object.assign(new Error('No user on this session'), { statusCode: 401 });
  return n;
}

const PAGE_MAX = 100;

/** GET /notifications?limit=&offset=&unread=true -> { data, total, unread_count, limit, offset } */
export const listNotifications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const userId = me(req);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '20'), 10) || 20, 1), PAGE_MAX);
    const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10) || 0, 0);
    const unreadOnly = req.query.unread === 'true';
    const filter = unreadOnly ? 'AND n.read_at IS NULL' : '';

    const [rows, counts] = await Promise.all([
      pool.query(
        `SELECT n.id, n.type, n.entity_type, n.entity_id, n.entity_name, n.detail, n.created_at, n.read_at,
                NULLIF(btrim(coalesce(a.first_name, '') || ' ' || coalesce(a.last_name, '')), '') AS actor_name
           FROM notifications n
           LEFT JOIN users a ON a.id = n.actor_user_id AND a.tenant_id = n.tenant_id
          WHERE n.tenant_id = $1 AND n.user_id = $2 ${filter}
          ORDER BY n.created_at DESC, n.id
          LIMIT $3 OFFSET $4`,
        [tenantId, userId, limit, offset]),
      pool.query(
        `SELECT count(*) FILTER (WHERE TRUE ${unreadOnly ? 'AND read_at IS NULL' : ''})::int AS total,
                count(*) FILTER (WHERE read_at IS NULL)::int AS unread
           FROM notifications WHERE tenant_id = $1 AND user_id = $2`,
        [tenantId, userId]),
    ]);
    res.json({
      success: true, data: rows.rows, total: counts.rows[0].total,
      unread_count: counts.rows[0].unread, limit, offset,
    });
  } catch (error) { next(error); }
};

/**
 * GET /notifications/due -> follow-ups on leads YOU OWN that are due today or
 * overdue. Read live from tasks, never stored: a stored copy would go stale the
 * moment the follow-up moved. Not part of the unread count (approved).
 * "Today" is the database's CURRENT_DATE, the same as the Leads Overdue KPI.
 */
export const dueFollowUps = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const userId = me(req);
    const r = await pool.query(
      `SELECT l.id AS lead_id,
              NULLIF(btrim(coalesce(l.first_name, '') || ' ' || coalesce(l.last_name, '')), '') AS lead_name,
              l.company, fu.due, fu.id AS task_id, (fu.due::date < CURRENT_DATE) AS overdue
         FROM leads l
         ${FOLLOW_UP_JOIN}
        WHERE l.tenant_id = $1 AND l.assigned_to_user_id = $2
          AND fu.due IS NOT NULL AND fu.due::date <= CURRENT_DATE
        ORDER BY fu.due ASC, l.id`,
      [tenantId, userId]);
    const overdue = r.rows.filter(x => x.overdue).length;
    res.json({
      success: true,
      data: { overdue_count: overdue, today_count: r.rows.length - overdue, items: r.rows.slice(0, 20) },
    });
  } catch (error) { next(error); }
};

/** POST /notifications/:id/read — your own row only; anything else is 404. */
export const markRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const userId = me(req);
    if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) { res.status(404).json({ success: false, message: 'Notification not found' }); return; }
    const r = await pool.query(
      `UPDATE notifications SET read_at = COALESCE(read_at, now())
        WHERE id = $1 AND tenant_id = $2 AND user_id = $3 RETURNING id, read_at`,
      [req.params.id, tenantId, userId]);
    if (!r.rows[0]) { res.status(404).json({ success: false, message: 'Notification not found' }); return; }
    res.json({ success: true, data: r.rows[0] });
  } catch (error) { next(error); }
};

/** POST /notifications/read-all -> { updated } */
export const markAllRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const userId = me(req);
    const r = await pool.query(
      `UPDATE notifications SET read_at = now() WHERE tenant_id = $1 AND user_id = $2 AND read_at IS NULL`,
      [tenantId, userId]);
    res.json({ success: true, data: { updated: r.rowCount ?? 0 } });
  } catch (error) { next(error); }
};
