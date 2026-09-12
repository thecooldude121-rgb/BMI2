import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireTenantId } from '../middleware/tenant';
import { idInTenant } from '../utils/tenantScope';

/**
 * GET /api/v1/forecast/snapshots?period=Q2+2026
 * Returns all snapshots for the given period, ordered by snapshot_date DESC.
 */
export const getSnapshots = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const { period } = req.query;
    if (!period) {
      res.status(400).json({ success: false, message: 'period query param is required (e.g. "Q2 2026")' });
      return;
    }
    const result = await pool.query(
      // `user_id` joins the response alongside `rep_name` (migration 043).
      // Both are returned on purpose: the id is the identity a client should
      // match a snapshot to a rep by, and the name is what that rep was CALLED
      // on the snapshot date - a recorded fact the id cannot reconstruct,
      // since resolving it later yields today's name.
      // `snapshot_date::text` — A CALENDAR DATE HAS NO TIMEZONE, and sending it
      // as one corrupts it. node-pg maps a Postgres `date` to a JS Date at
      // LOCAL midnight, which `res.json()` then serialises as a UTC-shifted
      // ISO string: local midnight 2026-09-08 in IST becomes
      // "2026-09-07T18:30:00.000Z", so the client rendered the previous day.
      // Casting to text sends "2026-09-08" and the date survives the trip.
      `SELECT id, period_label, snapshot_date::text AS snapshot_date, user_id, rep_name,
              pipeline, best_case, commit, closed, deal_count, created_at
       FROM forecast_snapshots
       WHERE period_label = $1 AND tenant_id = $2
       ORDER BY snapshot_date DESC, rep_name ASC`,
      [period, tenantId],
    );
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
};

/**
 * POST /api/v1/forecast/snapshots
 * Body: { period_label, reps: [{ user_id?, rep_name, pipeline, best_case, commit, closed, deal_count }] }
 *
 * Captures the current pipeline state for each rep as a snapshot for the period.
 *
 * `user_id` IS OPTIONAL, and that is not laziness (migration 043). The client
 * groups rep rows by COALESCE(assigned_to_user_id, assigned_to), so some rows
 * have no resolvable user - 20 of the 24 live deals carry only a name. Refusing
 * those would silently drop ~$1.39M of pipeline out of every snapshot; a
 * snapshot that omits the unattributed part of the forecast is not a snapshot
 * of the forecast. `rep_name` stays required and is the identity for exactly
 * those rows.
 *
 * Upserts on (tenant_id, period_label, snapshot_date, COALESCE(user_id, rep_name))
 * so re-running today overwrites, while historical dates are preserved.
 */
export const createSnapshot = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const { period_label, reps } = req.body;
    if (!period_label || !Array.isArray(reps) || reps.length === 0) {
      res.status(400).json({ success: false, message: 'period_label and a non-empty reps array are required' });
      return;
    }

    /*
     * TENANT VALIDATION FIRST, BEFORE ANY WRITE - the same pattern 039 and 042
     * use, and required for the same reason: users.id carries no tenant
     * component, so the foreign key alone is satisfied by another workspace's
     * colleague. Storing one would both leak that they exist and attribute a
     * forecast in this workspace to a stranger.
     *
     * Done here rather than inside the transaction for two reasons. It needs a
     * pool connection of its own, and acquiring one while already holding a
     * client from the same pool is how a small pool deadlocks under load. And
     * the WHOLE snapshot is refused if any rep is bad, rather than one row
     * being silently dropped - a partial snapshot reported as success is a
     * forecast record quietly missing a rep - so there is nothing to roll back.
     *
     * KEYED BY POSITION, NOT BY `rep_name`. Keying this map by the display name
     * was a live bug: two reps sharing one — exactly the case the re-keyed
     * index exists to support — collapsed to a single entry, so BOTH rows were
     * written against the SECOND rep's user id and the second then upserted
     * over the first. One row survived where two people had been snapshotted.
     *
     * That is the same defect this migration removes from the table,
     * reintroduced one layer up in the code that removes it, and it was caught
     * by the test for the very case it breaks rather than by review.
     */
    const resolvedUserIds = new Map<number, number>();
    for (let i = 0; i < reps.length; i++) {
      const { user_id, rep_name } = reps[i] ?? {};
      if (!rep_name) continue;
      if (user_id === undefined || user_id === null || user_id === '') continue;

      const parsed = Number(user_id);
      if (!Number.isInteger(parsed)) {
        res.status(400).json({ success: false, message: 'user_id must be a user id' });
        return;
      }
      if (!(await idInTenant('users', parsed, tenantId))) {
        // Names the field, never discloses that the row exists elsewhere.
        res.status(400).json({
          success: false,
          message: 'user_id does not name a user in this workspace',
        });
        return;
      }
      resolvedUserIds.set(i, parsed);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const inserted: any[] = [];
      for (let i = 0; i < reps.length; i++) {
        const { rep_name, pipeline = 0, best_case = 0, commit = 0, closed = 0, deal_count = 0 } = reps[i];
        if (!rep_name) continue;

        const userId = resolvedUserIds.get(i) ?? null;

        const row = await client.query(
          // The conflict target restates the functional unique index from 043,
          // which is how Postgres infers an expression index.
          `INSERT INTO forecast_snapshots
             (period_label, user_id, rep_name, pipeline, best_case, commit, closed, deal_count, tenant_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (tenant_id, period_label, snapshot_date, (COALESCE(user_id::text, rep_name)))
           DO UPDATE SET
             pipeline   = EXCLUDED.pipeline,
             best_case  = EXCLUDED.best_case,
             commit     = EXCLUDED.commit,
             closed     = EXCLUDED.closed,
             deal_count = EXCLUDED.deal_count,
             rep_name   = EXCLUDED.rep_name
           RETURNING *`,
          [period_label, userId, rep_name, pipeline, best_case, commit, closed, deal_count, tenantId],
        );
        inserted.push(row.rows[0]);
      }
      await client.query('COMMIT');
      res.status(201).json({ success: true, data: inserted, count: inserted.length });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) { next(error); }
};
