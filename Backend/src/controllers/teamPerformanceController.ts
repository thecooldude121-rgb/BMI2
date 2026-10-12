import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireTenantId } from '../middleware/tenant';
import { TRUSTED_USD } from '../utils/accountRollups';

/**
 * GET /api/v1/users/performance — per-person deal rollups for the Team pages
 * (Group A item 4, slice 5c). `useTeamPerformance` fetched the 500 newest
 * deals and summed native amounts across currencies in the browser; its own
 * comment named this endpoint as the real fix.
 *
 *   - One row per user who owns at least one deal (by assigned_to_user_id):
 *     open / won (count, trusted USD, unconverted) and lost, by stage_type
 *     across every pipeline; win rate = won / (won + lost), all time, with
 *     its sample — the 5a definition.
 *   - `unattributed`: deals owned by NO user (a name that matches nobody, or
 *     nothing), with the names they carry, so the per-person rows never sum
 *     to less than the workspace while saying nothing.
 * Quotas are NOT here: they stay behind GET /quotas, whose reads are scoped to
 * the reporting line. Deals are workspace-wide, like GET /deals. Test and
 * archived deals are excluded.
 */
export const getTeamPerformance = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const base = `
      FROM deals d
      JOIN pipeline_stages ps ON ps.id = d.stage_id AND ps.tenant_id = d.tenant_id
     WHERE d.tenant_id = $1 AND d.is_test = false AND d.is_archived = false`;
    const totals = (cond: string, prefix: string) => `
      (count(*) FILTER (WHERE ${cond}))::int AS ${prefix}_count,
      COALESCE(sum(d.base_amount_usd) FILTER (WHERE ${cond} AND ${TRUSTED_USD('d')}), 0)::float8 AS ${prefix}_value_usd,
      (count(*) FILTER (WHERE ${cond} AND NOT ${TRUSTED_USD('d')}))::int AS ${prefix}_unconverted`;
    const cols = `${totals(`ps.stage_type = 'open'`, 'open')}, ${totals(`ps.stage_type = 'won'`, 'won')},
      (count(*) FILTER (WHERE ps.stage_type = 'lost'))::int AS lost_count`;
    const [byUser, orphans, names] = await Promise.all([
      // The user must belong to this workspace: the deal's FK is composite
      // (migration 039), and the join below restates the tenant match anyway.
      pool.query(`SELECT d.assigned_to_user_id AS user_id, ${cols} ${base}
                    AND d.assigned_to_user_id IS NOT NULL
                    AND EXISTS (SELECT 1 FROM users u WHERE u.id = d.assigned_to_user_id AND u.tenant_id = d.tenant_id)
                  GROUP BY 1`, [tenantId]),
      pool.query(`SELECT ${cols} ${base} AND d.assigned_to_user_id IS NULL`, [tenantId]),
      pool.query(`SELECT DISTINCT btrim(d.assigned_to) AS name ${base}
                    AND d.assigned_to_user_id IS NULL AND NULLIF(btrim(d.assigned_to), '') IS NOT NULL
                  ORDER BY 1`, [tenantId]),
    ]);
    const shape = (r: any) => ({
      open: { count: r.open_count, value_usd: r.open_value_usd, unconverted: r.open_unconverted },
      won: { count: r.won_count, value_usd: r.won_value_usd, unconverted: r.won_unconverted },
      lost: { count: r.lost_count },
      win_rate: {
        value: r.won_count + r.lost_count > 0 ? r.won_count / (r.won_count + r.lost_count) : null,
        won: r.won_count, lost: r.lost_count, sample_size: r.won_count + r.lost_count,
      },
    });
    res.json({
      success: true,
      data: {
        members: byUser.rows.map(r => ({ user_id: r.user_id, ...shape(r) })),
        unattributed: { ...shape(orphans.rows[0]), names: names.rows.map(r => r.name) },
      },
    });
  } catch (error) { next(error); }
};
