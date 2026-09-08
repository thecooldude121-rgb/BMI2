import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireTenantId } from '../middleware/tenant';
import { idInTenant } from '../utils/tenantScope';

/**
 * Quotas, keyed by USER rather than by display name. Migration 042.
 *
 * WHAT CHANGED AND WHAT DID NOT:
 *   - `GET /quotas` still returns a `rep_name` field. It is PROJECTED from the
 *     joined user now rather than stored, so the response shape a client sees
 *     is unchanged even though the column is gone. Same play as
 *     `ps.slug AS stage` (037/038) and `assigned_to` (039).
 *   - `PUT /quotas` now takes `user_id` and NOT `rep_name`. That is a real
 *     breaking change, made deliberately rather than papered over — see the
 *     note at the foot of the migration for why resolving a name server-side
 *     (as 039 does for deals) was rejected here.
 */

/** GET /api/v1/quotas?period=Q2+2026 */
export const getQuotas = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const { period } = req.query;
    if (!period) {
      res.status(400).json({ success: false, message: 'period query param is required (e.g. "Q2 2026")' });
      return;
    }
    const result = await pool.query(
      `SELECT q.id, q.user_id, q.period_label, q.quota_amount,
              -- The rep's NAME, projected from the joined user so the response
              -- keeps the field clients already read. NULLIF collapses a
              -- name-less account to null rather than to a stray space.
              NULLIF(btrim(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), '')
                AS rep_name,
              u.email AS rep_email
         FROM quotas q
         -- INNER JOIN, and tenant-matched. users.id is a global primary key, so
         -- without the predicate a quota carrying another workspace's user_id
         -- would render that person's name here. INNER rather than LEFT because
         -- user_id is NOT NULL and CASCADEs on delete: a quota with no
         -- resolvable user in this workspace is not a row to show with a blank
         -- name, it is a row that should not exist.
         JOIN users u ON u.id = q.user_id AND u.tenant_id = q.tenant_id
        WHERE q.period_label = $1 AND q.tenant_id = $2
        ORDER BY u.first_name ASC, u.last_name ASC`,
      [period, tenantId],
    );
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
};

/**
 * PUT /api/v1/quotas
 * Body: { user_id: number, period_label: string, quota_amount: number }
 *
 * Upserts — creates or replaces the quota for that user/period pair, scoped to
 * the caller's tenant. The conflict target is the re-keyed
 * UNIQUE (tenant_id, user_id, period_label) from migration 042; the old key
 * included `rep_name`, which meant two users sharing a display name shared one
 * quota row.
 */
export const upsertQuota = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const { user_id, period_label, quota_amount } = req.body;

    if (user_id === undefined || user_id === null || !period_label || quota_amount === undefined) {
      res.status(400).json({
        success: false,
        message: 'user_id, period_label, and quota_amount are required',
      });
      return;
    }

    const userId = Number(user_id);
    if (!Number.isInteger(userId)) {
      res.status(400).json({ success: false, message: 'user_id must be a user id' });
      return;
    }

    const amount = parseFloat(quota_amount);
    if (isNaN(amount) || amount < 0) {
      res.status(400).json({ success: false, message: 'quota_amount must be a non-negative number' });
      return;
    }

    /*
     * TENANT VALIDATION ON THE WRITE — the same pattern migration 039 uses for
     * `assigned_to_user_id`, and required for the same reason: users.id carries
     * no tenant component, so the foreign key alone is satisfied by somebody
     * else's colleague. Setting a quota against another workspace's user would
     * both leak that they exist and put a row in this workspace that the read
     * join then refuses to resolve.
     *
     * The message names the FIELD and stops there. It does not say the user
     * exists elsewhere — same rule as every other foreign id here, and the same
     * reason login returns one message for a bad password and an unknown email.
     */
    if (!(await idInTenant('users', userId, tenantId))) {
      res.status(400).json({
        success: false,
        message: 'user_id does not name a user in this workspace',
      });
      return;
    }

    const result = await pool.query(
      `INSERT INTO quotas (user_id, period_label, quota_amount, tenant_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (tenant_id, user_id, period_label)
       DO UPDATE SET quota_amount = EXCLUDED.quota_amount, updated_at = NOW()
       RETURNING id, user_id, period_label, quota_amount`,
      [userId, period_label, amount, tenantId],
    );

    /*
     * The rep's name, resolved the same tenant-matched way GET does, so the
     * client can render the saved row without a refetch.
     *
     * RETURNING cannot join — the same limitation that produced the
     * `assigned_to: null` gap in 039, which a test caught rather than a review.
     * Resolving it here keeps this response the same shape as the list's rows.
     */
    const rep = await pool.query(
      `SELECT NULLIF(btrim(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')), '') AS rep_name,
              email AS rep_email
         FROM users WHERE id = $1 AND tenant_id = $2`,
      [userId, tenantId],
    );

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        rep_name: rep.rows[0]?.rep_name ?? null,
        rep_email: rep.rows[0]?.rep_email ?? null,
      },
    });
  } catch (error) { next(error); }
};
