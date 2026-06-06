import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';

/**
 * GET /api/v1/forecast/snapshots?period=Q2+2026
 * Returns all snapshots for the given period, ordered by snapshot_date DESC.
 */
export const getSnapshots = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { period } = req.query;
    if (!period) {
      res.status(400).json({ success: false, message: 'period query param is required (e.g. "Q2 2026")' });
      return;
    }
    const result = await pool.query(
      `SELECT id, period_label, snapshot_date, rep_name,
              pipeline, best_case, commit, closed, deal_count, created_at
       FROM forecast_snapshots
       WHERE period_label = $1
       ORDER BY snapshot_date DESC, rep_name ASC`,
      [period],
    );
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
};

/**
 * POST /api/v1/forecast/snapshots
 * Body: { period_label, reps: [{ rep_name, pipeline, best_case, commit, closed, deal_count }] }
 *
 * Captures the current pipeline state for each rep as a named snapshot for the period.
 * Upserts on (period_label, rep_name, snapshot_date) so re-running today overwrites,
 * but historical dates are preserved.
 */
export const createSnapshot = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { period_label, reps } = req.body;
    if (!period_label || !Array.isArray(reps) || reps.length === 0) {
      res.status(400).json({ success: false, message: 'period_label and a non-empty reps array are required' });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const inserted: any[] = [];
      for (const rep of reps) {
        const { rep_name, pipeline = 0, best_case = 0, commit = 0, closed = 0, deal_count = 0 } = rep;
        if (!rep_name) continue;
        const row = await client.query(
          `INSERT INTO forecast_snapshots
             (period_label, rep_name, pipeline, best_case, commit, closed, deal_count)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (period_label, rep_name, snapshot_date)
           DO UPDATE SET
             pipeline   = EXCLUDED.pipeline,
             best_case  = EXCLUDED.best_case,
             commit     = EXCLUDED.commit,
             closed     = EXCLUDED.closed,
             deal_count = EXCLUDED.deal_count
           RETURNING *`,
          [period_label, rep_name, pipeline, best_case, commit, closed, deal_count],
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
