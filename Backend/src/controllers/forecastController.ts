import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireTenantId } from '../middleware/tenant';
import { computeForecast, calendarDay, quarterOf } from '../utils/forecastTotals';

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
      // `unconverted` (069): deals left out of the USD sums. NULL on rows
      // recorded before snapshots were server-computed (2026-10-13), which
      // the browser summed and which may mix currencies.
      `SELECT id, period_label, snapshot_date::text AS snapshot_date, user_id, rep_name,
              pipeline, best_case, commit, closed, deal_count, unconverted, created_at
       FROM forecast_snapshots
       WHERE period_label = $1 AND tenant_id = $2
       ORDER BY snapshot_date DESC, rep_name ASC`,
      [period, tenantId],
    );
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
};

/**
 * GET /api/v1/forecast/summary?period=Q4+2026&today=YYYY-MM-DD
 * The quarter's forecast by category and by rep, from the server
 * (utils/forecastTotals). `today` is the viewer's day: undated deals count only
 * when it falls inside the quarter.
 */
export const getForecastSummary = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const period = String(req.query.period ?? '');
    quarterOf(period);
    const today = calendarDay(req.query.today, 'today');
    res.json({ success: true, data: await computeForecast(pool, tenantId, period, today) });
  } catch (error) { next(error); }
};

/**
 * POST /api/v1/forecast/snapshots   Body: { period_label: "Q4 2026", today: "YYYY-MM-DD" }
 *
 * THE SERVER COMPUTES THE SNAPSHOT (slice 5c, 2026-10-13). The browser used to
 * send per-rep figures it had summed from the 500 newest deals — native
 * amounts added across currencies — and they were stored as permanent forecast
 * history. A body carrying figures (`reps`) is now REFUSED rather than ignored,
 * so an old client fails loudly instead of believing it saved its numbers.
 *
 * One row per rep, identity by reference and display by capture (043):
 * `user_id` where ownership resolved, `rep_name` = the name on the day. The
 * amounts are USD; `unconverted` counts that rep's deals left out of them.
 * Upserts on (tenant_id, period_label, snapshot_date, COALESCE(user_id, rep_name)),
 * so re-running today overwrites and earlier dates are preserved. Everything is
 * computed and written inside ONE transaction.
 */
export const createSnapshot = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const { period_label, reps } = req.body ?? {};
    if (reps !== undefined) {
      res.status(400).json({
        success: false,
        message: 'Snapshots are computed by the server — send period_label and today, not figures',
      });
      return;
    }
    quarterOf(period_label);
    const today = calendarDay(req.body?.today, 'today');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const forecast = await computeForecast(client, tenantId, period_label, today);
      if (forecast.reps.length === 0) {
        await client.query('ROLLBACK');
        res.status(409).json({ success: false, message: 'There are no deals in this quarter to snapshot' });
        return;
      }
      const inserted: any[] = [];
      for (const r of forecast.reps) {
        const row = await client.query(
          // The conflict target restates the functional unique index from 043.
          `INSERT INTO forecast_snapshots
             (period_label, user_id, rep_name, pipeline, best_case, commit, closed, deal_count, unconverted, tenant_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (tenant_id, period_label, snapshot_date, (COALESCE(user_id::text, rep_name)))
           DO UPDATE SET
             pipeline = EXCLUDED.pipeline, best_case = EXCLUDED.best_case, commit = EXCLUDED.commit,
             closed = EXCLUDED.closed, deal_count = EXCLUDED.deal_count, unconverted = EXCLUDED.unconverted,
             rep_name = EXCLUDED.rep_name
           RETURNING id, period_label, snapshot_date::text AS snapshot_date, user_id, rep_name,
                     pipeline, best_case, commit, closed, deal_count, unconverted`,
          [period_label, r.user_id, r.label, r.pipeline.value_usd, r.best_case.value_usd, r.commit.value_usd,
            r.closed.value_usd, r.deal_count, r.unconverted, tenantId],
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
