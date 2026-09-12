import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchMembers, WorkspaceMember } from '../utils/usersApi';
import {
  fetchPipelines, buildStageLookup, outcomeOf, EMPTY_STAGE_LOOKUP, StageLookup,
} from '../utils/pipelinesApi';

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
 * WHAT IT REFUSES TO DO
 * Every figure here is computed from a fetched row or is absent. There is no
 * fallback literal anywhere in this file: a member with no deals gets 0, a
 * member with no quota gets `quota: null` (which the UI must render as "not
 * entered", NOT as 0), and a win rate with no closed deals gets null rather
 * than 0% — "nobody has closed anything yet" and "everybody loses" are
 * different facts and must not share a rendering.
 */

const API_BASE = 'http://localhost:5001/api/v1';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * High enough not to be reached at current volumes (25 deals), low enough not
 * to pull the table into the browser — the same value and the same reasoning as
 * `LIST_LIMIT` in useDashboardData.
 *
 * `truncated` below is what makes this honest rather than merely convenient,
 * and it matters MORE here than on the dashboard: these are per-person numbers
 * next to real employees' names, so a silently understated pipeline is a wrong
 * number in a review conversation. The real fix is a server-side aggregate
 * endpoint (`GET /users/performance`), which is a backend change and so a
 * different unit of work.
 */
const DEAL_LIMIT = 500;

export interface RawDeal {
  id: string;
  name?: string | null;
  company_name?: string | null;
  value: number | string | null;
  stage: string | null;
  pipeline_id?: string | null;
  expected_close_date?: string | null;
  probability?: number | null;
  assigned_to_user_id?: number | string | null;
  assigned_to?: string | null;
}

interface RawQuota {
  user_id: number | string;
  period_label: string;
  quota_amount: number | string;
}

/** One person's numbers. Every field is fetched-or-null; none is defaulted. */
export interface MemberPerformance {
  member: WorkspaceMember;
  /** Open deals owned by this person — count and summed value. */
  openCount: number;
  openValue: number;
  wonCount: number;
  wonValue: number;
  lostCount: number;
  /**
   * won / (won + lost), or NULL when they have closed nothing at all. Null is
   * not 0: a rep with no closed deals has no win rate, and rendering 0% would
   * assert they lose every deal.
   */
  winRate: number | null;
  /** NULL when no quota row exists for the period — not 0. */
  quota: number | null;
  /**
   * wonValue / quota as a percentage, or NULL when there is no quota to measure
   * against. Never Infinity: a zero quota yields null, because "attained
   * infinitely" is not a number to show a person.
   */
  attainment: number | null;
  /** Direct reports, resolved from the real `manager_id` column (041). */
  directReports: WorkspaceMember[];
  /**
   * This person's OWN deals, carried so the member detail page can list them
   * instead of the invented `DEALS` fixture it used to render. Aggregates alone
   * were not enough: a page that shows a count but invents the rows behind it
   * is the hybrid case CLAUDE.md lesson 15 warns about — real headline numbers
   * vouching for fabricated detail.
   */
  deals: RawDeal[];
}

export interface TeamPerformance {
  members: MemberPerformance[];
  /** Team-level sums over the members above. */
  totals: {
    headcount: number;
    openCount: number;
    openValue: number;
    wonValue: number;
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
  unattributed: { count: number; value: number; names: string[] };
  loading: boolean;
  /** Distinguishes "backend unreachable" from "a genuinely empty workspace". */
  error: string | null;
  /** True when a list came back exactly at its limit, so sums are lower bounds. */
  truncated: boolean;
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
  const [deals, setDeals]       = useState<RawDeal[]>([]);
  const [quotas, setQuotas]     = useState<RawQuota[]>([]);
  const [lookup, setLookup]     = useState<StageLookup>(() => EMPTY_STAGE_LOOKUP);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
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
      const [membersRes, dealsRes, quotasRes, pipelinesRes] = await Promise.allSettled([
        // Reuse a roster the caller already has; only fetch when there is none.
        suppliedMembers ? Promise.resolve(suppliedMembers) : fetchMembers(true),
        fetch(`${API_BASE}/deals?limit=${DEAL_LIMIT}`, { headers: authHeaders() })
          .then(r => { if (!r.ok) throw new Error(`deals ${r.status}`); return r.json(); })
          .then(j => (j.success ? asList<RawDeal>(j.data) : [])),
        fetch(`${API_BASE}/quotas?period=${encodeURIComponent(period)}`, { headers: authHeaders() })
          .then(r => { if (!r.ok) throw new Error(`quotas ${r.status}`); return r.json(); })
          .then(j => (j.success ? asList<RawQuota>(j.data) : [])),
        fetchPipelines(),
      ]);

      if (!active) return;

      const failed: string[] = [];

      if (membersRes.status === 'fulfilled') setMembers(asList<WorkspaceMember>(membersRes.value));
      else { setMembers([]); failed.push('the team roster'); }

      if (dealsRes.status === 'fulfilled') {
        setDeals(dealsRes.value);
        setTruncated(dealsRes.value.length >= DEAL_LIMIT);
      } else { setDeals([]); setTruncated(false); failed.push('deals'); }

      if (quotasRes.status === 'fulfilled') setQuotas(quotasRes.value);
      else { setQuotas([]); failed.push('quotas'); }

      /*
       * The stage lookup decides won/lost. Without it every deal classifies as
       * open, which would silently zero every win rate — so a pipeline failure
       * is reported rather than absorbed.
       *
       * BUILT EAGERLY, INSIDE THE TRY, and that is not a style choice. `setLookup`
       * stores a function, so it must be set through a `() => value` wrapper —
       * but React treats that wrapper as a lazy UPDATER and calls it during the
       * state update. Building the lookup inside it therefore ran
       * `buildStageLookup` inside React's reducer, where a throw escapes this
       * error handling entirely and takes the whole page down instead of
       * degrading one column. A malformed payload did exactly that.
       *
       * Found by TeamManagement's existing test suite when this hook was added
       * to that page, not by review.
       */
      let nextLookup: StageLookup = EMPTY_STAGE_LOOKUP;
      if (pipelinesRes.status === 'fulfilled') {
        try {
          nextLookup = buildStageLookup(asList(pipelinesRes.value));
        } catch {
          // A response that is not the expected shape. Unresolvable stages
          // count as open, which understates a win rate rather than inflating
          // one — the same direction `outcomeOf` already fails in.
          failed.push('pipeline stages');
        }
      } else {
        failed.push('pipeline stages');
      }
      setLookup(() => nextLookup);

      setError(failed.length ? `Could not load ${failed.join(', ')}.` : null);
      setLoading(false);
    };

    load();
    return () => { active = false; };
  }, [period, token, suppliedMembers]);

  return useMemo(() => {
    const outcome = outcomeOf(lookup);

    const quotaFor = (memberId: string): number | null => {
      const row = quotas.find(q => String(q.user_id) === String(memberId));
      return row ? num(row.quota_amount) : null;
    };

    // Reports are resolved from the real column, and by id — never by matching
    // a manager's display name, which is what the deleted fixture did.
    const reportsOf = (memberId: string) =>
      members.filter(m => m.managerId != null && String(m.managerId) === String(memberId));

    const byOwner = new Map<string, RawDeal[]>();
    const orphans: RawDeal[] = [];
    for (const d of deals) {
      const owner = d.assigned_to_user_id;
      if (owner == null || String(owner) === '') { orphans.push(d); continue; }
      const key = String(owner);
      const bucket = byOwner.get(key);
      if (bucket) bucket.push(d); else byOwner.set(key, [d]);
    }

    const rows: MemberPerformance[] = members.map(member => {
      const mine = byOwner.get(String(member.id)) ?? [];

      let openCount = 0, openValue = 0, wonCount = 0, wonValue = 0, lostCount = 0;
      for (const d of mine) {
        const v = num(d.value);
        switch (outcome({ stage: d.stage, pipeline_id: d.pipeline_id })) {
          case 'won':  wonCount++;  wonValue += v; break;
          case 'lost': lostCount++;                break;
          default:     openCount++; openValue += v;
        }
      }

      const closed = wonCount + lostCount;
      const quota  = quotaFor(member.id);

      return {
        member,
        openCount, openValue, wonCount, wonValue, lostCount,
        // Null, not 0, when nothing has closed — see the interface.
        winRate: closed > 0 ? Math.round((wonCount / closed) * 100) : null,
        quota,
        // A zero quota yields null rather than Infinity or a huge percentage.
        attainment: quota != null && quota > 0 ? Math.round((wonValue / quota) * 100) : null,
        directReports: reportsOf(member.id),
        deals: mine,
      };
    });

    const openCount = rows.reduce((s, r) => s + r.openCount, 0);
    const openValue = rows.reduce((s, r) => s + r.openValue, 0);
    const wonValue  = rows.reduce((s, r) => s + r.wonValue, 0);
    const wonCount  = rows.reduce((s, r) => s + r.wonCount, 0);
    const lostCount = rows.reduce((s, r) => s + r.lostCount, 0);
    const withQuota = rows.filter(r => r.quota != null);
    // Null when nobody has a quota — summing to 0 would read as "target: zero".
    const quotaSum  = withQuota.length ? withQuota.reduce((s, r) => s + (r.quota ?? 0), 0) : null;
    const teamClosed = wonCount + lostCount;

    return {
      members: rows,
      totals: {
        headcount: members.length,
        openCount, openValue, wonValue,
        winRate: teamClosed > 0 ? Math.round((wonCount / teamClosed) * 100) : null,
        quota: quotaSum,
        attainment: quotaSum != null && quotaSum > 0 ? Math.round((wonValue / quotaSum) * 100) : null,
        membersWithQuota: withQuota.length,
      },
      unattributed: {
        count: orphans.length,
        value: orphans.reduce((s, d) => s + num(d.value), 0),
        // The names carried on unowned deals, so the caption can say WHOSE
        // attribution is missing rather than only how many.
        names: Array.from(new Set(
          orphans.map(d => (d.assigned_to ?? '').trim()).filter(Boolean),
        )).sort(),
      },
      loading, error, truncated, period, reload,
    };
  }, [members, deals, quotas, lookup, loading, error, truncated, period, reload]);
}
