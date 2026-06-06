import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';

/** GET /api/v1/quotas?period=Q2+2026 */
export const getQuotas = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { period } = req.query;
    if (!period) {
      res.status(400).json({ success: false, message: 'period query param is required (e.g. "Q2 2026")' });
      return;
    }
    const result = await pool.query(
      'SELECT id, rep_name, period_label, quota_amount FROM quotas WHERE period_label = $1 ORDER BY rep_name ASC',
      [period],
    );
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
};

/**
 * PUT /api/v1/quotas
 * Body: { rep_name: string, period_label: string, quota_amount: number }
 * Upserts — creates or replaces the quota for that rep/period pair.
 */
export const upsertQuota = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { rep_name, period_label, quota_amount } = req.body;
    if (!rep_name || !period_label || quota_amount === undefined) {
      res.status(400).json({ success: false, message: 'rep_name, period_label, and quota_amount are required' });
      return;
    }
    const amount = parseFloat(quota_amount);
    if (isNaN(amount) || amount < 0) {
      res.status(400).json({ success: false, message: 'quota_amount must be a non-negative number' });
      return;
    }
    const result = await pool.query(
      `INSERT INTO quotas (rep_name, period_label, quota_amount)
       VALUES ($1, $2, $3)
       ON CONFLICT (rep_name, period_label)
       DO UPDATE SET quota_amount = EXCLUDED.quota_amount, updated_at = NOW()
       RETURNING *`,
      [rep_name, period_label, amount],
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};
