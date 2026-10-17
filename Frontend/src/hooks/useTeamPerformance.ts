import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchMembers, WorkspaceMember } from '../utils/usersApi';
import { API_BASE } from '../config/backend';

/**
 * Per-person sales rollups for the Team pages.
 *
 * DELIBERATELY NOT A CONTEXT, and the reason is written down in
 * `useDashboardData.ts:26`: a context is what let sample data spread to
 * eighteen files unnoticed. Two pages consume this; both get it by calling the
 * hook and passing the result down as props.
 *
 * WHY THIS EXISTS NOW AND NOT BEFORE. The Team pages were blanked to "—" in
 * cd667e2 because three things were missing, all three named in that stopgap's
 * own comment. All three now exist:
 *   - `users.manager_id`            — migration 041 (the reporting line)
 *   - `quotas.user_id`              — migration 042 (quotas keyed on a person)
 *   - `deals.assigned_to_user_id`   — migration 039 (ownership as a reference)
 *
 * SLICE 5c (2026-10-13): THE DEAL FIGURES ARE THE SERVER'S. This hook fetched
 * the 500 newest deals and summed native amounts across currencies, so past
 * 500 every person's numbers were silently partial — next to real employees'
 * names. Now GET /users/performance returns each person's open / won / lost
 * by stage_type, in trusted USD with the rest counted as "not in USD", and
 * the win rate is won / (won + lost), all time (the 5a definition). Quotas
 * still come from GET /quotas, whose reads are scoped to the reporting line;
 * attainment is computed only for a USD quota, since won figures are USD.
 *
 * WHAT IT REFUSES TO DO
 * Every figure here is computed from a fetched row or is absent. There is no
 * fallback literal anywhere in this file: a member with no deals gets 0, a
 * member with no quota gets `quota: null` (which the UI must render as "not
 * entered", NOT as 0), and a win rate with no closed deals gets null rather
 * than 0% — "nobody has closed anything yet" and "everybody loses" are
 * different facts and must not share a rendering.
 */

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface RawQuota {
  user_id: number | string;
  period_label: string;
  quota_amount: number | string;
  currency?: string | null;
}

interface ServerTotals { count: number; value_usd: number; unconverted: number }
interface ServerRollup {
  open: ServerTotals; won: ServerTotals; lost: { count: number };
  win_rate: { value: number | null; won: number; lost: number; sample_size: number };
}

/** "$12K", plus "+ N not in USD" when some deals had no USD amount. */
export const withUnconverted = (usdText: string, unconverted: number): string =>
  unconverted > 0 ? `${usdText} + ${unconverted} not in USD` : usdText;

/** A quota in its own currency — "$" only when it IS USD. */
export const quotaText = (quota: number, currency: string | null, usd: (n: number) => string): string =>
  currency === 'USD' ? usd(quota)
  : currency ? `${currency} ${quota.toLocaleString()}`
  : `${quota.toLocaleString()} · currency not recorded`;

/** One person's numbers. Every field is fetched-or-null; none is defaulted. */
export interface MemberPerformance {
  member: WorkspaceMember;
  /** Open deals owned by this person — count and summed TRUSTED USD value. */
  openCount: number;
  openValue: number;
  /** Open deals whose amount is not in USD (counted, never added). */
  openUnconverted: number;
  wonCount: number;
  wonValue: number;
  wonUnconverted: number;
  lostCount: number;
  /**
   * won / (won + lost), or NULL when they have closed nothing at all. Null is
   * not 0: a rep with no closed deals has no win rate, and rendering 0% would
   * assert they lose every deal.
   */
  winRate: number | null;
  /** NULL when no quota row exists for the period — not 0. */
  quota: number | null;
  /** The quota's currency (ISO code), or null when not recorded. */
  quotaCurrency: string | null;
  /**
   * wonValue / quota as a percentage, or NULL when there is no quota to measure
   * against — or when the quota is not in USD, since wonValue is USD and this
   * server holds no exchange rates. Never Infinity: a zero quota yields null.
   */
  attainment: number | null;
  /** Direct reports, resolved from the real `manager_id` column (041). */
  directReports: WorkspaceMember[];
}

export interface TeamPerformance {
  members: MemberPerformance[];
  /** Team-level sums over the members above. */
  totals: {
    headcount: number;
    openCount: number;
    openValue: number;
    openUnconverted: number;
    wonValue: number;
    wonUnconverted: number;
    /** Team win rate over ALL closed deals, not a mean of per-rep rates. */
    winRate: number | null;
    /** Sum of entered quotas, or NULL when nobody has one. */
    quota: number | null;
    attainment: number | null;
    /** How many people actually have a quota row, for an honest caption. */
    membersWithQuota: number;
  };
  /**
   * DEALS THAT BELONG TO NOBODY RESOLVABLE, surfaced rather than dropped.
   *
   * 20 of 25 live deals still carry no `assigned_to_user_id` — 15 name "John
   * Smith", who was never a user, and 5 name nobody at all (migration 039).
   * They cannot appear in anyone's row, so without this the page's per-person
   * figures would sum to far less than the Deals page shows and nothing would
   * say why. That silent disagreement between two pages is the defect this
   * project has hit repeatedly; this is the honest version.
   */
  unattributed: { count: number; value: number; unconverted: number; names: string[] };
  loading: boolean;
  /** Distinguishes "backend unreachable" from "a genuinely empty workspace". */
  error: string | null;
  /** The quota period these numbers are measured against, e.g. "Q3 2026". */
  period: string;
  reload: () => void;
}

/** "Q3 2026" — the same label ForecastPage writes quotas under. */
export function currentQuotaPeriod(d = new Date()): string {
  return `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`;
}

/**
 * A LIST, or an empty one — never whatever the server actually sent.
 *
 * Every consumer here iterates these, and `for (const d of {})` is a TypeError
 * thrown from inside a `useMemo`, which white-screens the page rather than
 * degrading a column. A response of the wrong shape is exactly when a page
 * most needs to still render, so the shape is enforced at the boundary instead
 * of trusted. Found when this hook was added to Settings → Team, whose test
 * fixture answers unmatched URLs with `data: {}`.
 */
const asList = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

const num = (v: unknown): number => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
  return Number.isFinite(n) ? n : 0;
};

export interface TeamPerformanceOptions {
  /**
   * A roster the caller has ALREADY loaded, to reuse instead of fetching one.
   *
   * Why this exists: Settings → Team loads its own roster because it needs the
   * envelope fields this hook does not carry (`assignable_roles`,
   * `can_change_role`). Adding the hook there made the page request GET /users
   * TWICE per render pass — caught by that page's existing test suite
   * asserting exactly one call, not by review. Passing the roster in keeps it
   * at one.
   *
   * `undefined` means "fetch it yourself" (what /team does). An empty array is
   * a real roster that happens to be empty, and is NOT treated as absent.
   */
  members?: WorkspaceMember[];
}

export function useTeamPerformance(
  period = currentQuotaPeriod(),
  opts: TeamPerformanceOptions = {},
): TeamPerformance {
  const [members, setMembers]   = useState<WorkspaceMember[]>([]);
  const [rollups, setRollups]   = useState<Map<string, ServerRollup>>(new Map());
  const [orphans, setOrphans]   = useState<(ServerRollup & { names: string[] }) | null>(null);
  const [quotas, setQuotas]     = useState<RawQuota[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [token, setToken]       = useState(0);

  const reload = useCallback(() => setToken(n => n + 1), []);

  const suppliedMembers = opts.members;

  useEffect(() => {
    // Guards a state update after unmount, and an earlier slow response
    // overwriting a newer one — same pattern as useDashboardData.
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      // allSettled, not all: one failing endpoint should degrade one column,
      // not blank the page. A partial page that says what failed is more
      // useful than an error screen.
      const [membersRes, perfRes, quotasRes] = await Promise.allSettled([
        // Reuse a roster the caller already has; only fetch when there is none.
        suppliedMembers ? Promise.resolve(suppliedMembers) : fetchMembers(true),
        fetch(`${API_BASE}/users/performance`, { headers: authHeaders() })
          .then(r => { if (!r.ok) throw new Error(`performance ${r.status}`); return r.json(); })
          .then(j => (j && j.success && j.data ? j.data : { members: [], unattributed: null })),
        fetch(`${API_BASE}/quotas?period=${encodeURIComponent(period)}`, { headers: authHeaders() })
          .then(r => { if (!r.ok) throw new Error(`quotas ${r.status}`); return r.json(); })
          .then(j => (j.success ? asList<RawQuota>(j.data) : [])),
      ]);

      if (!active) return;

      const failed: string[] = [];

      if (membersRes.status === 'fulfilled') setMembers(asList<WorkspaceMember>(membersRes.value));
      else { setMembers([]); failed.push('the team roster'); }

      if (perfRes.status === 'fulfilled') {
        const rows = asList<ServerRollup & { user_id: number | string }>(perfRes.value.members);
        setRollups(new Map(rows.map(r => [String(r.user_id), r])));
        setOrphans(perfRes.value.unattributed ?? null);
      } else { setRollups(new Map()); setOrphans(null); failed.push('deal totals'); }

      if (quotasRes.status === 'fulfilled') setQuotas(quotasRes.value);
      else { setQuotas([]); failed.push('quotas'); }

      setError(failed.length ? `Could not load ${failed.join(', ')}.` : null);
      setLoading(false);
    };

    load();
    return () => { active = false; };
  }, [period, token, suppliedMembers]);

  return useMemo(() => {
    const quotaFor = (memberId: string): RawQuota | null =>
      quotas.find(q => String(q.user_id) === String(memberId)) ?? null;

    // Reports are resolved from the real column, and by id — never by matching
    // a manager's display name, which is what the deleted fixture did.
    const reportsOf = (memberId: string) =>
      members.filter(m => m.managerId != null && String(m.managerId) === String(memberId));

    const rows: MemberPerformance[] = members.map(member => {
      const r = rollups.get(String(member.id));
      const q = quotaFor(member.id);
      const quota = q ? num(q.quota_amount) : null;
      const quotaCurrency = q?.currency ? String(q.currency).toUpperCase() : null;
      const wonValue = r?.won.value_usd ?? 0;
      return {
        member,
        openCount: r?.open.count ?? 0,
        openValue: r?.open.value_usd ?? 0,
        openUnconverted: r?.open.unconverted ?? 0,
        wonCount: r?.won.count ?? 0,
        wonValue,
        wonUnconverted: r?.won.unconverted ?? 0,
        lostCount: r?.lost.count ?? 0,
        // Null, not 0, when nothing has closed — see the interface.
        winRate: r && r.win_rate.value !== null ? Math.round(r.win_rate.value * 100) : null,
        quota,
        quotaCurrency,
        // USD won against a USD quota only; a zero quota yields null.
        attainment: quota != null && quota > 0 && quotaCurrency === 'USD' ? Math.round((wonValue / quota) * 100) : null,
        directReports: reportsOf(member.id),
      };
    });

    const sum = (f: (r: MemberPerformance) => number) => rows.reduce((t, r) => t + f(r), 0);
    const wonCount = sum(r => r.wonCount);
    const lostCount = sum(r => r.lostCount);
    const wonValue = sum(r => r.wonValue);
    const withQuota = rows.filter(r => r.quota != null);
    // Team attainment only when every quota is in USD; null when nobody has one
    // (summing to 0 would read as "target: zero").
    const usdQuotas = withQuota.every(r => r.quotaCurrency === 'USD');
    const quotaSum  = withQuota.length ? withQuota.reduce((t, r) => t + (r.quota ?? 0), 0) : null;
    const teamClosed = wonCount + lostCount;

    return {
      members: rows,
      totals: {
        headcount: members.length,
        openCount: sum(r => r.openCount),
        openValue: sum(r => r.openValue),
        openUnconverted: sum(r => r.openUnconverted),
        wonValue,
        wonUnconverted: sum(r => r.wonUnconverted),
        winRate: teamClosed > 0 ? Math.round((wonCount / teamClosed) * 100) : null,
        quota: quotaSum,
        attainment: quotaSum != null && quotaSum > 0 && usdQuotas ? Math.round((wonValue / quotaSum) * 100) : null,
        membersWithQuota: withQuota.length,
      },
      unattributed: {
        count: orphans ? orphans.open.count + orphans.won.count + orphans.lost.count : 0,
        // Trusted USD over the unowned OPEN and WON deals (lost carries no value).
        value: orphans ? orphans.open.value_usd + orphans.won.value_usd : 0,
        unconverted: orphans ? orphans.open.unconverted + orphans.won.unconverted : 0,
        names: orphans?.names ?? [],
      },
      loading, error, period, reload,
    };
  }, [members, rollups, orphans, quotas, loading, error, period, reload]);
}
