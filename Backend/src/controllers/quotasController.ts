import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireTenantId } from '../middleware/tenant';
import {
  authorizeTargetWrite, editableTargetUserIds, parsePeriodLabel, readableTargetUserIds,
  targetReadFilter, validateActivityTargets, PERIOD_LABEL_MESSAGE, type ActivityTargets,
} from '../utils/targets';

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
 *
 * MIGRATION 044 — targets:
 *   - Each quota carries a `currency` and `activity_targets`. PUT /quotas stays
 *     the ONE write path for per-period targets; the Settings targets screen
 *     and ForecastPage's quota cell both write through it.
 *   - GET /quotas IS NOW FILTERED. It used to return every quota in the
 *     workspace to any authenticated caller, so a rep could read their
 *     colleagues' and their manager's compensation targets. A caller now sees
 *     their own row, the rows of everyone beneath them in the reporting line
 *     (to any depth), and — for an admin — all of them. Rows are OMITTED rather
 *     than redacted or refused: the rule lives in utils/targets.ts
 *     (canReadTargetsOf), applied through targetReadFilter so GET /targets and
 *     the projection cannot drift away from it.
 *   - PUT /quotas IS NOW AUTHORISED. It was open to every authenticated role,
 *     so a sales rep could set anybody's quota — including their manager's.
 *     The rule lives in utils/targets.ts (canSetTargetsFor) and is served back
 *     on GET as `editable_user_ids`, so ForecastPage offers the edit control
 *     only where the server will accept it.
 *   - period_label must parse as a calendar quarter. A quota under a label the
 *     projection cannot bound is a quota nothing can ever be measured against.
 */

const CURRENCY_SHAPE = /^[A-Z]{3}$/;

/** GET /api/v1/quotas?period=Q2+2026 */
export const getQuotas = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const { period } = req.query;
    if (!period) {
      res.status(400).json({ success: false, message: 'period query param is required (e.g. "Q2 2026")' });
      return;
    }
    const actor = { id: Number(req.user?.id), role: String(req.user?.role ?? '') };
    const [result, editable, canRead, visible] = await Promise.all([
      pool.query(
        `SELECT q.id, q.user_id, q.period_label, q.quota_amount, q.currency, q.activity_targets,
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
      ),
      editableTargetUserIds(tenantId, actor),
      targetReadFilter(tenantId, actor),
      readableTargetUserIds(tenantId, actor),
    ]);
    res.json({
      success: true,
      data: result.rows.filter(r => canRead(Number(r.user_id))),
      // Whose quota THIS caller may set. Served, not re-derived client-side:
      // absent or empty means the client offers no edit control at all.
      editable_user_ids: editable,
      // Whose quota this caller may SEE. Without it an absent row is ambiguous
      // — "no quota set" and "not yours to see" are the same absence — and a
      // client merging this against its own rep list would state the first
      // while the second is true. See readableTargetUserIds.
      visible_user_ids: visible,
    });
  } catch (error) { next(error); }
};

/**
 * PUT /api/v1/quotas
 * Body: { user_id: number, period_label: string, quota_amount: number,
 *         currency?: string, activity_targets?: object | null }
 *
 * Upserts — creates or replaces the quota for that user/period pair, scoped to
 * the caller's tenant. The conflict target is the re-keyed
 * UNIQUE (tenant_id, user_id, period_label) from migration 042; the old key
 * included `rep_name`, which meant two users sharing a display name shared one
 * quota row.
 *
 * `currency` and `activity_targets` are OPTIONAL and PARTIAL: omitted, an
 * existing row keeps what it had, so ForecastPage's quota cell (which sends
 * only an amount) cannot wipe the activity targets set in Settings. On a NEW
 * row an omitted currency takes the workspace default, else USD — the same
 * rule createDeal applies, so a quota and the deals it is measured against
 * start in the same currency. `activity_targets: null` clears them.
 */
export const upsertQuota = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const { user_id, period_label, quota_amount, currency, activity_targets } = req.body;

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

    const period = parsePeriodLabel(period_label);
    if (!period) {
      res.status(400).json({ success: false, message: PERIOD_LABEL_MESSAGE });
      return;
    }

    const amount = parseFloat(quota_amount);
    if (isNaN(amount) || amount < 0) {
      res.status(400).json({ success: false, message: 'quota_amount must be a non-negative number' });
      return;
    }

    let cur: string | null = null;
    if (currency !== undefined && currency !== null) {
      cur = String(currency).trim().toUpperCase();
      if (!CURRENCY_SHAPE.test(cur)) {
        res.status(400).json({ success: false, message: 'currency must be a three-letter ISO 4217 code, e.g. "INR"' });
        return;
      }
    }

    // undefined = leave as is; null = clear; object = validate and replace.
    let targets: ActivityTargets | null = null;
    const targetsProvided = activity_targets !== undefined;
    if (targetsProvided && activity_targets !== null) {
      const v = validateActivityTargets(activity_targets);
      if (!v.ok) { res.status(400).json({ success: false, message: v.message }); return; }
      targets = v.value;
    }

    /*
     * TENANT VALIDATION ON THE WRITE, then the permission rule. The subject is
     * resolved inside the caller's workspace, so a user in another workspace is
     * the same 400 as one that does not exist — the message names the FIELD and
     * never says the user exists elsewhere (same rule as login's single
     * failure message). Only then is "may you set THIS person's target" asked.
     */
    const authz = await authorizeTargetWrite(
      tenantId, { id: Number(req.user?.id), role: String(req.user?.role ?? '') }, userId,
    );
    if (!authz.ok) {
      res.status(authz.status).json({ success: false, message: authz.message });
      return;
    }

    const result = await pool.query(
      `INSERT INTO quotas (user_id, period_label, quota_amount, tenant_id, currency, activity_targets)
       VALUES ($1, $2, $3, $4,
               COALESCE($5::varchar,
                        (SELECT NULLIF(settings->>'default_currency', '') FROM tenants WHERE id = $4),
                        'USD'),
               COALESCE($6::jsonb, '{}'::jsonb))
       ON CONFLICT (tenant_id, user_id, period_label)
       DO UPDATE SET quota_amount     = EXCLUDED.quota_amount,
                     currency         = CASE WHEN $5::varchar IS NULL THEN quotas.currency
                                             ELSE EXCLUDED.currency END,
                     activity_targets = CASE WHEN $7::boolean THEN EXCLUDED.activity_targets
                                             ELSE quotas.activity_targets END,
                     updated_at       = NOW()
       RETURNING id, user_id, period_label, quota_amount, currency, activity_targets`,
      [userId, period.label, amount, tenantId, cur,
       targetsProvided ? JSON.stringify(targets ?? {}) : null, targetsProvided],
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
