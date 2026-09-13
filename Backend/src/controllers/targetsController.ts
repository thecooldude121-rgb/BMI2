import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireTenantId } from '../middleware/tenant';
import {
  ACTIVITY_TARGET_KEYS, ACTIVITY_TARGET_MAX, SENIORITY_LEVELS, PERIOD_QUERY_MESSAGE,
  authorizeTargetWrite, canSetTargetsFor, parsePeriodLabel, repsSetOwnTargets,
} from '../utils/targets';
import { PROJECTION_RULES, projectTarget } from '../services/targetProjection';
import { loadProjectionDeals } from '../services/targetProjectionData';

/**
 * Per-user sales targets — the Settings half. Migration 044.
 *
 *   GET /targets?period=Q3+2026      the roster with each person's profile and
 *                                    their quota for that period, plus the
 *                                    rules the UI needs, served
 *   PUT /targets/:userId/profile     seniority, ramp start, territory, product line
 *
 * Per-PERIOD targets (quota, currency, activity targets) are written through
 * PUT /quotas, which is the single write path for them — deliberately not
 * duplicated here.
 *
 * READS ARE OPEN TO EVERY AUTHENTICATED ROLE, matching GET /quotas and GET
 * /users today. Whether a sales rep should see a colleague's quota is the same
 * row-level-visibility question middleware/auth.ts records as an open product
 * decision; answering it here, for one endpoint, would make targets the one
 * place with a different policy.
 */

const TEXT_MAX = 100; // territory / product_line are VARCHAR(100)
const DATE_SHAPE = /^\d{4}-\d{2}-\d{2}$/;

/** GET /api/v1/targets?period=Q3+2026 */
export const getTargets = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const period = parsePeriodLabel(req.query.period);
    if (!period) {
      res.status(400).json({ success: false, message: PERIOD_QUERY_MESSAGE });
      return;
    }

    const [rows, selfOn] = await Promise.all([
      pool.query(
        `SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.manager_id,
                NULLIF(btrim(COALESCE(m.first_name, '') || ' ' || COALESCE(m.last_name, '')), '')
                  AS manager_name,
                p.seniority, p.ramp_start_date::text AS ramp_start_date,
                p.territory, p.product_line,
                q.quota_amount, q.currency, q.activity_targets
           FROM users u
           -- Every join is TENANT-MATCHED, per the project rule. The profile's
           -- composite FK already makes a cross-workspace profile impossible;
           -- the predicate is kept so this query is correct on its own terms.
           LEFT JOIN users m
             ON m.id = u.manager_id AND m.tenant_id = u.tenant_id
           LEFT JOIN user_sales_profiles p
             ON p.user_id = u.id AND p.tenant_id = u.tenant_id
           LEFT JOIN quotas q
             ON q.user_id = u.id AND q.tenant_id = u.tenant_id AND q.period_label = $2
          WHERE u.tenant_id = $1 AND u.is_active = true
          ORDER BY u.first_name, u.last_name`,
        [tenantId, period.label],
      ),
      repsSetOwnTargets(tenantId),
    ]);

    const actor = { id: Number(req.user?.id), role: String(req.user?.role ?? '') };

    res.json({
      success: true,
      data: rows.rows.map(r => ({
        user_id: Number(r.id),
        name: [r.first_name, r.last_name].filter(Boolean).join(' ').trim() || r.email,
        email: r.email,
        role: r.role,
        manager_id: r.manager_id === null ? null : Number(r.manager_id),
        manager_name: r.manager_name,
        // null when nothing has been recorded — not a profile of nulls
        // pretending to be one, and never defaulted.
        profile: r.seniority === null && r.ramp_start_date === null
          && r.territory === null && r.product_line === null
          ? null
          : {
              seniority: r.seniority,
              ramp_start_date: r.ramp_start_date,
              territory: r.territory,
              product_line: r.product_line,
            },
        // null when no quota is set for this period. A quota of 0 is a real,
        // different value and comes back as 0.
        quota: r.quota_amount === null
          ? null
          : {
              quota_amount: Number(r.quota_amount),
              currency: r.currency,
              activity_targets: r.activity_targets ?? {},
            },
        can_edit: canSetTargetsFor(
          actor,
          { id: Number(r.id), role: r.role, manager_id: r.manager_id === null ? null : Number(r.manager_id) },
          selfOn,
        ),
      })),
      period: { label: period.label, start: period.start.toISOString(), end: period.end.toISOString() },
      // The vocabularies and the toggle, served so the UI never keeps its own.
      seniority_levels: SENIORITY_LEVELS,
      activity_target_keys: ACTIVITY_TARGET_KEYS,
      activity_target_max: ACTIVITY_TARGET_MAX,
      reps_set_own_targets: selfOn,
    });
  } catch (error) { next(error); }
};

/**
 * GET /api/v1/targets/projection?period=Q3+2026
 *
 * The pipeline-coverage projection for every active person in the workspace,
 * computed by services/targetProjection.ts from real closed-deal history. No
 * UI consumes this yet — the Sales Intelligence Guide panel is later work —
 * so the response carries the rules it was computed under, making every null
 * explainable from the payload alone.
 */
export const getProjection = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const period = parsePeriodLabel(req.query.period);
    if (!period) { res.status(400).json({ success: false, message: PERIOD_QUERY_MESSAGE }); return; }

    const [users, deals] = await Promise.all([
      pool.query(
        `SELECT u.id, u.first_name, u.last_name, u.email, q.quota_amount, q.currency
           FROM users u
           LEFT JOIN quotas q
             ON q.user_id = u.id AND q.tenant_id = u.tenant_id AND q.period_label = $2
          WHERE u.tenant_id = $1 AND u.is_active = true
          ORDER BY u.first_name, u.last_name`,
        [tenantId, period.label],
      ),
      loadProjectionDeals(tenantId),
    ]);

    const now = new Date();
    res.json({
      success: true,
      period: { label: period.label, start: period.start.toISOString(), end: period.end.toISOString() },
      generated_at: now.toISOString(),
      rules: PROJECTION_RULES,
      data: users.rows.map(u => ({
        name: [u.first_name, u.last_name].filter(Boolean).join(' ').trim() || u.email,
        ...projectTarget({
          userId: Number(u.id), now, period,
          quota: u.quota_amount === null ? null : { amount: Number(u.quota_amount), currency: u.currency },
          ...deals,
        }),
      })),
    });
  } catch (error) { next(error); }
};

type ProfileField = 'seniority' | 'ramp_start_date' | 'territory' | 'product_line';

/**
 * Validate a partial profile body. Returns the columns to write (a present key
 * with null CLEARS the value; an absent key is left alone) or a message.
 */
function validateProfile(
  body: Record<string, unknown>,
): { ok: true; values: Partial<Record<ProfileField, string | null>> } | { ok: false; message: string } {
  const values: Partial<Record<ProfileField, string | null>> = {};

  if (body.seniority !== undefined) {
    if (body.seniority === null || body.seniority === '') values.seniority = null;
    else if (!(SENIORITY_LEVELS as readonly string[]).includes(String(body.seniority))) {
      return { ok: false, message: `seniority must be one of: ${SENIORITY_LEVELS.join(', ')}` };
    } else values.seniority = String(body.seniority);
  }

  if (body.ramp_start_date !== undefined) {
    if (body.ramp_start_date === null || body.ramp_start_date === '') values.ramp_start_date = null;
    else {
      const s = String(body.ramp_start_date);
      const d = new Date(`${s}T00:00:00Z`);
      // Round-trip check rejects 2026-02-30, which Date would silently roll
      // into March. The year bound is the D043 lesson: 262026 was storable.
      if (!DATE_SHAPE.test(s) || Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) {
        return { ok: false, message: 'ramp_start_date must be a date in YYYY-MM-DD form' };
      }
      const year = d.getUTCFullYear();
      if (year < 2000 || year > 2100) {
        return { ok: false, message: 'ramp_start_date must fall between 2000 and 2100' };
      }
      values.ramp_start_date = s;
    }
  }

  for (const field of ['territory', 'product_line'] as const) {
    if (body[field] === undefined) continue;
    if (body[field] === null) { values[field] = null; continue; }
    if (typeof body[field] !== 'string') return { ok: false, message: `${field} must be text` };
    const s = (body[field] as string).trim();
    // Blank is "not recorded", which is NULL — never an empty string that
    // would group as a category of its own.
    if (!s) { values[field] = null; continue; }
    if (s.length > TEXT_MAX) return { ok: false, message: `${field} must be ${TEXT_MAX} characters or fewer` };
    values[field] = s;
  }

  return { ok: true, values };
}

/** PUT /api/v1/targets/:userId/profile */
export const upsertProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);

    const v = validateProfile(req.body ?? {});
    if (!v.ok) { res.status(400).json({ success: false, message: v.message }); return; }
    const fields = Object.keys(v.values) as ProfileField[];
    if (!fields.length) {
      res.status(400).json({
        success: false,
        message: 'No fields to update — send any of seniority, ramp_start_date, territory, product_line',
      });
      return;
    }

    const authz = await authorizeTargetWrite(
      tenantId, { id: Number(req.user?.id), role: String(req.user?.role ?? '') }, req.params.userId,
    );
    if (!authz.ok) { res.status(authz.status).json({ success: false, message: authz.message }); return; }

    // Column names come from the fixed ProfileField list above, never from the
    // request, so interpolating them is not an injection point.
    const params: unknown[] = [authz.subject.id, tenantId, ...fields.map(f => v.values[f])];
    const cols = fields.join(', ');
    const placeholders = fields.map((_, n) => `$${n + 3}`).join(', ');
    const sets = fields.map(f => `${f} = EXCLUDED.${f}`).join(', ');

    const result = await pool.query(
      `INSERT INTO user_sales_profiles (user_id, tenant_id, ${cols})
       VALUES ($1, $2, ${placeholders})
       ON CONFLICT (user_id) DO UPDATE SET ${sets}, updated_at = NOW()
         -- Belt and braces: the composite FK already ties a profile to its
         -- user's workspace, so a conflicting row in another tenant cannot
         -- exist. If it somehow did, this refuses to touch it.
         WHERE user_sales_profiles.tenant_id = EXCLUDED.tenant_id
       RETURNING user_id, seniority, ramp_start_date::text AS ramp_start_date, territory, product_line`,
      params,
    );
    if (!result.rows[0]) {
      // Only reachable through the WHERE above, i.e. a row that should not exist.
      res.status(409).json({ success: false, message: 'That profile could not be updated' });
      return;
    }
    res.json({ success: true, data: { ...result.rows[0], user_id: Number(result.rows[0].user_id) } });
  } catch (error) { next(error); }
};
