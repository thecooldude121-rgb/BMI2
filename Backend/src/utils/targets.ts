import { pool } from '../config/database';
import { canActOn, rankOf } from './roles';

/**
 * ONE PLACE THAT ANSWERS "who may set this person's targets", and the
 * vocabularies the targets UI is allowed to offer.
 *
 * Every rule here is SERVED to the client (GET /targets, GET /quotas) rather
 * than re-derived in it — the same arrangement as `rolesAssignableBy`, and for
 * the reason CLAUDE.md records at length: the client-side copy of the invite
 * rule had already drifted before anyone noticed.
 */

/**
 * Mirrors user_sales_profiles_seniority_check (migration 044). Seniority is NOT
 * role: role decides permissions and has its own guarded endpoint; seniority
 * describes experience and decides nothing.
 */
export const SENIORITY_LEVELS = ['junior', 'mid', 'senior', 'lead'] as const;

/** The keys quotas.activity_targets may hold. Anything else is a 400. */
export const ACTIVITY_TARGET_KEYS = ['calls_per_week', 'meetings_per_week', 'emails_per_week'] as const;
export type ActivityTargetKey = (typeof ACTIVITY_TARGET_KEYS)[number];
export type ActivityTargets = Partial<Record<ActivityTargetKey, number>>;

/**
 * Upper bound on any weekly activity target. Not a business rule — a typo
 * guard, in the spirit of the D043 date bound: 1,000 calls a week is already
 * ~25 an hour. A value above it is a slipped key, not a target.
 */
export const ACTIVITY_TARGET_MAX = 1000;

// ── Periods ───────────────────────────────────────────────────────────────

export interface Period {
  label: string;
  /** Inclusive, 00:00 UTC on the first day of the quarter. */
  start: Date;
  /** EXCLUSIVE, 00:00 UTC on the first day of the next quarter. */
  end: Date;
}

const QUARTER_LABEL = /^Q([1-4]) (\d{4})$/;

/**
 * "Q3 2026" -> its calendar bounds, or null.
 *
 * The label is the format ForecastPage's getQuarterBounds() already writes, so
 * every quota that exists was stored in it. CALENDAR quarters, in UTC: the
 * workspace has no fiscal-year setting (GeneralPreferences labels that as not
 * stored), so a fiscal offset would be invented. Year bounded to 2000-2100 —
 * the D043 lesson again.
 */
export function parsePeriodLabel(label: unknown): Period | null {
  if (typeof label !== 'string') return null;
  const m = QUARTER_LABEL.exec(label.trim());
  if (!m) return null;
  const q = Number(m[1]);
  const year = Number(m[2]);
  if (year < 2000 || year > 2100) return null;
  const start = new Date(Date.UTC(year, (q - 1) * 3, 1));
  const end = new Date(Date.UTC(year, q * 3, 1));
  return { label: `Q${q} ${year}`, start, end };
}

export const PERIOD_LABEL_MESSAGE = 'period_label must be a calendar quarter like "Q3 2026"';
export const PERIOD_QUERY_MESSAGE = 'period must be a calendar quarter like "Q3 2026"';

// ── Activity targets ──────────────────────────────────────────────────────

/**
 * Validate a client-supplied activity_targets document.
 *
 * A key sent as null is DROPPED (cleared) rather than stored as null, so the
 * stored document only ever holds real integers. An unknown key is refused by
 * name rather than silently ignored — an ignored field is how a caller comes to
 * believe it saved something.
 */
export function validateActivityTargets(
  input: unknown,
): { ok: true; value: ActivityTargets } | { ok: false; message: string } {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, message: 'activity_targets must be an object such as { "calls_per_week": 40 }' };
  }
  const value: ActivityTargets = {};
  for (const [key, raw] of Object.entries(input as Record<string, unknown>)) {
    if (!(ACTIVITY_TARGET_KEYS as readonly string[]).includes(key)) {
      return {
        ok: false,
        message: `activity_targets.${key} is not a recognised target. Use: ${ACTIVITY_TARGET_KEYS.join(', ')}`,
      };
    }
    if (raw === null) continue;
    const n = typeof raw === 'number' ? raw : Number.NaN;
    if (!Number.isInteger(n) || n < 0 || n > ACTIVITY_TARGET_MAX) {
      return {
        ok: false,
        message: `activity_targets.${key} must be a whole number from 0 to ${ACTIVITY_TARGET_MAX}`,
      };
    }
    value[key as ActivityTargetKey] = n;
  }
  return { ok: true, value };
}

// ── Who may set whose targets ─────────────────────────────────────────────

export interface TargetActor { id: number; role: string }
export interface TargetSubject { id: number; role: string; manager_id: number | null }

/**
 * The rule, as agreed for this feature:
 *
 *   admin    — anyone in the workspace, themselves included.
 *   manager  — their DIRECT reports (users.manager_id, migration 041).
 *   anyone   — THEMSELVES, but only when the workspace has turned on
 *              `reps_set_own_targets`. Off by default. This applies to a
 *              manager's own targets too: "a user sets their own depending on
 *              permission" is about every user, not only sales.
 *
 * canActOn is applied on top, so a manager can never set targets for somebody
 * who outranks them even if a reporting line says that person reports to them
 * (users.role and users.manager_id are set independently, so that line can
 * exist).
 *
 * Direct reports only, NOT the whole subtree. That was an explicit choice over
 * the transitive option; if it changes, it changes here and nowhere else.
 *
 * An unrecognised role may set nothing — rankOf ranks it 0.
 */
export function canSetTargetsFor(
  actor: TargetActor,
  subject: TargetSubject,
  repsSetOwnTargets: boolean,
): boolean {
  const role = (actor.role ?? '').toLowerCase();
  if (rankOf(role) === 0) return false;
  const isSelf = Number(actor.id) === Number(subject.id);

  if (role === 'admin') return canActOn(role, subject.role);
  if (isSelf) return repsSetOwnTargets;
  if (role === 'manager') {
    return subject.manager_id !== null
      && Number(subject.manager_id) === Number(actor.id)
      && canActOn(role, subject.role);
  }
  return false;
}

/** The workspace toggle. Absent means OFF — the safe default, never assumed on. */
export async function repsSetOwnTargets(tenantId: string): Promise<boolean> {
  const r = await pool.query(
    `SELECT (settings->>'reps_set_own_targets') = 'true' AS on FROM tenants WHERE id = $1`,
    [tenantId],
  );
  return r.rows[0]?.on === true;
}

export type TargetAuthorization =
  | { ok: true; subject: TargetSubject }
  | { ok: false; status: 400 | 403; message: string };

/**
 * Resolve the subject INSIDE the caller's workspace and decide.
 *
 * A user in another workspace is indistinguishable from one that does not
 * exist, and both get the existing 400 wording that names the field only —
 * never "exists elsewhere".
 *
 * The 403 messages differ by case on purpose: unlike an existence probe, the
 * caller already knows who they are and who they asked about, so saying WHY is
 * actionable and discloses nothing.
 */
export async function authorizeTargetWrite(
  tenantId: string,
  actor: TargetActor,
  subjectId: unknown,
): Promise<TargetAuthorization> {
  const id = Number(subjectId);
  if (!Number.isInteger(id)) {
    return { ok: false, status: 400, message: 'user_id must be a user id' };
  }
  const r = await pool.query(
    'SELECT id, role, manager_id FROM users WHERE id = $1 AND tenant_id = $2',
    [id, tenantId],
  );
  const row = r.rows[0];
  if (!row) {
    return { ok: false, status: 400, message: 'user_id does not name a user in this workspace' };
  }
  const subject: TargetSubject = {
    id: Number(row.id),
    role: row.role,
    manager_id: row.manager_id === null ? null : Number(row.manager_id),
  };
  const selfOn = await repsSetOwnTargets(tenantId);
  if (canSetTargetsFor(actor, subject, selfOn)) return { ok: true, subject };

  if (Number(actor.id) === subject.id) {
    return {
      ok: false, status: 403,
      message: 'This workspace does not let people set their own targets. Ask your manager or an admin to set them.',
    };
  }
  return {
    ok: false, status: 403,
    message: actor.role === 'manager'
      ? 'You can set targets only for people who report directly to you.'
      : 'Only a manager or admin can set targets for someone else.',
  };
}

/**
 * The ids of everyone in the workspace whose targets `actor` may set — served
 * alongside GET /quotas and GET /targets so no client re-derives the rule.
 */
export async function editableTargetUserIds(tenantId: string, actor: TargetActor): Promise<number[]> {
  const [users, selfOn] = await Promise.all([
    pool.query(
      'SELECT id, role, manager_id FROM users WHERE tenant_id = $1 AND is_active = true',
      [tenantId],
    ),
    repsSetOwnTargets(tenantId),
  ]);
  return users.rows
    .map(u => ({ id: Number(u.id), role: u.role, manager_id: u.manager_id === null ? null : Number(u.manager_id) }))
    .filter(s => canSetTargetsFor(actor, s, selfOn))
    .map(s => s.id);
}
