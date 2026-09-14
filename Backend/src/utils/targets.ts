import { pool } from '../config/database';
import { canActOn, rankOf } from './roles';
import { chainAbove, loadManagerEdges, type ManagerEdge } from './reportingLine';

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

// ── Who may set, and who may see, whose targets ───────────────────────────

export interface TargetActor { id: number; role: string }

export interface TargetSubject {
  id: number;
  role: string;
  /**
   * The ids ABOVE this person in the reporting line, nearest first — exactly
   * `chainAbove(edges, subject.id)`. `managerChain[0]` is their `manager_id`;
   * an empty array means they report to nobody in this workspace.
   *
   * The chain rather than the single column is what makes both rules below
   * transitive, and it is the SAME array for both, so "may set" and "may see"
   * can never come to disagree about who oversees whom.
   */
  managerChain: number[];
}

/**
 * WHO MAY SET WHOSE TARGETS — confirmed policy, not a default:
 *
 *   admin    — anyone in the workspace, themselves included.
 *   manager  — anyone in their SUBTREE: the people who report to them directly
 *              and, transitively, everyone below those people. A VP with three
 *              layers beneath them sets targets for all three.
 *   anyone   — THEMSELVES, but only when the workspace has turned on
 *              `reps_set_own_targets`. Off by default. This applies to a
 *              manager's own targets too: "a user sets their own depending on
 *              permission" is about every user, not only sales.
 *
 * canActOn is applied on top, so a manager can never set targets for somebody
 * who outranks them even if a reporting line says that person is beneath them
 * (users.role and users.manager_id are set independently, so that line can
 * exist).
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
    return subject.managerChain.includes(Number(actor.id)) && canActOn(role, subject.role);
  }
  return false;
}

/**
 * WHO MAY SEE WHOSE TARGETS — confirmed policy. Quota, activity targets and the
 * projection are compensation-adjacent, so the three GETs are no longer open to
 * every authenticated user in the workspace:
 *
 *   yourself — always. Reading your own target needs no toggle; the toggle
 *              governs WRITING it, and a target you cannot see is one you
 *              cannot work to.
 *   above    — everyone in your management chain, to the top. The same relation
 *              the write rule uses, read the other way.
 *   admin    — everyone in the workspace.
 *
 * TWO DELIBERATE ASYMMETRIES WITH THE WRITE RULE, both load-bearing:
 *
 *  - No `canActOn` here. The rule as decided is chain membership, and a
 *    lower-ranked person can only be above someone if an admin or manager put
 *    them there — an administrative act, not an escalation a caller can perform.
 *    Refusing the read would also hide a subordinate's quota from the person
 *    who is accountable for it purely because of a role/reporting mismatch.
 *  - The self case is not gated on `reps_set_own_targets`, per above.
 *
 * An unrecognised role sees NOTHING, its own row included — the same closed
 * failure as canSetTargetsFor and as AuthContext's 'Unknown' mapping. It is
 * unreachable through the API (requireRole and rankOf both refuse), but
 * `users.role` has no CHECK constraint, so it is storable directly.
 */
export function canReadTargetsOf(actor: TargetActor, subject: Pick<TargetSubject, 'id' | 'managerChain'>): boolean {
  const role = (actor.role ?? '').toLowerCase();
  if (rankOf(role) === 0) return false;
  if (Number(actor.id) === Number(subject.id)) return true;
  if (role === 'admin') return true;
  return subject.managerChain.includes(Number(actor.id));
}

/**
 * A reusable "may this caller see this person's targets" predicate, built from
 * ONE read of the workspace's reporting graph.
 *
 * Every list endpoint filters with this rather than asking per row, so the
 * three GETs cannot drift apart, and a filtered list discloses nothing: a row
 * you may not see is absent, never present-but-redacted and never a 403 that
 * confirms the person exists.
 */
export async function targetReadFilter(
  tenantId: string,
  actor: TargetActor,
): Promise<(subjectId: number) => boolean> {
  const edges = await loadManagerEdges(tenantId);
  const cache = new Map<number, boolean>();
  return (subjectId: number): boolean => {
    const id = Number(subjectId);
    const hit = cache.get(id);
    if (hit !== undefined) return hit;
    const ok = canReadTargetsOf(actor, { id, managerChain: chainAbove(edges, id) });
    cache.set(id, ok);
    return ok;
  };
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
    'SELECT id, role FROM users WHERE id = $1 AND tenant_id = $2',
    [id, tenantId],
  );
  const row = r.rows[0];
  if (!row) {
    return { ok: false, status: 400, message: 'user_id does not name a user in this workspace' };
  }
  const [edges, selfOn] = await Promise.all([loadManagerEdges(tenantId), repsSetOwnTargets(tenantId)]);
  const subject: TargetSubject = {
    id: Number(row.id),
    role: row.role,
    managerChain: chainAbove(edges, Number(row.id)),
  };
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
      ? 'You can set targets only for people in your reporting line — someone who reports to you, directly or through another manager.'
      : 'Only a manager or admin can set targets for someone else.',
  };
}

/**
 * The ids of everyone in the workspace whose targets `actor` may set — served
 * alongside GET /quotas and GET /targets so no client re-derives the rule.
 */
export async function editableTargetUserIds(tenantId: string, actor: TargetActor): Promise<number[]> {
  const [users, edges, selfOn] = await Promise.all([
    // The SUBJECTS are active users only — an offer to edit a deactivated
    // account is an offer to do nothing. The EDGES are every user (see
    // loadManagerEdges): a deactivated middle manager must not sever a subtree.
    pool.query(
      'SELECT id, role FROM users WHERE tenant_id = $1 AND is_active = true',
      [tenantId],
    ),
    loadManagerEdges(tenantId),
    repsSetOwnTargets(tenantId),
  ]);
  return users.rows
    .map(u => ({ id: Number(u.id), role: u.role, managerChain: chainAbove(edges, Number(u.id)) }))
    .filter(s => canSetTargetsFor(actor, s, selfOn))
    .map(s => s.id);
}

/**
 * The ids of everyone ACTIVE in the workspace whose targets `actor` may see.
 *
 * Served by GET /quotas, and the reason is specific rather than symmetric with
 * `editable_user_ids`: that response is merged CLIENT-SIDE against a rep list
 * built from deals, so an absent quota row is ambiguous — "none is set" and
 * "you may not see it" look identical, and ForecastPage would print "Not set"
 * over somebody's real quota. GET /targets needs no such field: its rows ARE
 * the visible people, so nothing there is ambiguous.
 *
 * It discloses nothing new — GET /users already serves the roster and the
 * reporting line to every authenticated caller. This says which of those people
 * you may read a TARGET for, not that any target exists.
 */
export async function readableTargetUserIds(tenantId: string, actor: TargetActor): Promise<number[]> {
  const [users, edges] = await Promise.all([
    pool.query('SELECT id FROM users WHERE tenant_id = $1 AND is_active = true', [tenantId]),
    loadManagerEdges(tenantId),
  ]);
  return users.rows
    .map(u => Number(u.id))
    .filter(id => canReadTargetsOf(actor, { id, managerChain: chainAbove(edges, id) }));
}

/** Re-exported so a caller needing both rules imports one module, not two. */
export { chainAbove, loadManagerEdges, type ManagerEdge };
