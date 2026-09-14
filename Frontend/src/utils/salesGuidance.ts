/**
 * WHAT THE GUIDE PANEL IS ALLOWED TO SAY, and the evidence it must say it with.
 *
 * PURE, and separate from the component on purpose: every rule here is a claim
 * about a person's performance, and those are exactly the claims this project
 * requires to be inspectable. Keeping them out of JSX means each one can be
 * mutation-tested against a fixture rather than read off a rendered card.
 *
 * THE ONE RULE THAT GOVERNS EVERY FUNCTION BELOW: a verdict is returned only
 * with the numbers that produced it. There is no code path that yields a label
 * on its own — `Diagnosis` has no shape without `evidence`, so a caller cannot
 * render "at risk" without rendering why. That is the same standard
 * ReportsPage's UNBACKED_REPORTS applies to a card it cannot compute.
 *
 * NOTHING HERE INVENTS A NUMBER. Every field is read from the projection
 * endpoint's payload, which itself returns null-plus-reason wherever the
 * history is too thin — see services/targetProjection.ts.
 */

export type ProjectionStatus =
  | 'attained' | 'missed' | 'on_track' | 'at_risk' | 'not_enough_data' | 'no_quota';

export interface Metric {
  value: number | null;
  basis: 'rep' | 'workspace' | null;
  sample_size: number;
  reason: string | null;
}

export interface ProjectionRow {
  user_id: number;
  name: string;
  email?: string;
  role?: string;
  manager_id?: number | null;
  status: ProjectionStatus;
  status_reason: string;
  quota: { amount: number; currency: string } | null;
  attained: number | null;
  remaining: number | null;
  win_rate: Metric & { won: number; lost: number };
  win_rate_workspace: Metric & { won: number; lost: number };
  sales_cycle_days: Metric;
  average_deal_size: Metric;
  pipeline: { value: number | null; deal_count: number; stages: unknown[] };
  required_pipeline: number | null;
  required_pipeline_reason: string | null;
  coverage_ratio: number | null;
  required_coverage_ratio: number | null;
  activity_targets: Record<string, number> | null;
}

export interface ActivityMeasurement {
  measurable: boolean;
  reason: string;
  activities_recorded: number;
}

/**
 * WHY someone is off pace. Deliberately NOT a single "problem" string:
 * a rep can be short on pipeline AND converting below the workspace, and
 * collapsing that to one cause would pick one arbitrarily.
 */
export type ProblemKind = 'pipeline' | 'conversion' | 'activity';

export interface Problem {
  kind: ProblemKind;
  /** One sentence. Always contains the numbers behind it. */
  evidence: string;
}

const pct = (n: number) => `${Math.round(n * 1000) / 10}%`;

const money = (amount: number, currency: string) =>
  `${currency} ${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

/**
 * A PIPELINE problem: the open pipeline expected to close in the period does
 * not cover what the win rate says is needed.
 *
 * Only ever returned when BOTH numbers are real. `required_pipeline` is null
 * whenever the win rate is unknown, and in that case the honest answer is
 * "not enough data", not "your pipeline is short".
 */
export function pipelineProblem(row: ProjectionRow): Problem | null {
  const have = row.pipeline?.value;
  const need = row.required_pipeline;
  if (have === null || have === undefined || need === null) return null;
  if (have >= need) return null;
  const currency = row.quota?.currency ?? '';
  const shortfall = Math.round((need - have) * 100) / 100;
  return {
    kind: 'pipeline',
    evidence:
      `${money(have, currency)} of pipeline expected to close, against ${money(need, currency)} needed `
      + `to win the remaining ${money(row.remaining ?? 0, currency)} — short by ${money(shortfall, currency)}`
      + (row.pipeline.deal_count ? ` across ${row.pipeline.deal_count} open deal${row.pipeline.deal_count === 1 ? '' : 's'}.` : '.'),
  };
}

/**
 * A CONVERSION problem: this person's OWN win rate is below the workspace's.
 *
 * Three guards, and each one removes a way of saying something untrue:
 *  - `basis` must be 'rep'. When the projection fell back to the workspace
 *    figure the two numbers ARE the same number, and comparing them would
 *    manufacture a difference of zero and call it a finding.
 *  - both values must be non-null. A null win rate is "not enough data".
 *  - the rep must actually be lower. Equal or better is not a problem.
 */
export function conversionProblem(row: ProjectionRow): Problem | null {
  const mine = row.win_rate;
  const ws = row.win_rate_workspace;
  if (mine?.basis !== 'rep') return null;
  if (mine.value === null || ws?.value === null || ws?.value === undefined) return null;
  if (mine.value >= ws.value) return null;
  return {
    kind: 'conversion',
    evidence:
      `Winning ${pct(mine.value)} of closed deals (${mine.won} won, ${mine.lost} lost) `
      + `against the workspace's ${pct(ws.value)} over ${ws.sample_size} closures.`,
  };
}

/**
 * An ACTIVITY problem cannot be computed today, and this function exists to
 * say so in ONE place rather than to guess.
 *
 * `measurable` is served by the API, which knows why (the activities table
 * records its actor as a free-text name). When it is false the honest output
 * is the target plus the gap in the data — never a shortfall, and never
 * silence, because silence over an unmeasured target reads as "you are fine".
 */
export function activityNote(
  row: ProjectionRow, measurement: ActivityMeasurement,
): { targets: Record<string, number> | null; measurable: boolean; note: string } | null {
  if (!row.activity_targets) return null;
  if (measurement.measurable) {
    // No branch computes attainment yet. Returning a verdict here without one
    // would be the fabrication this module exists to prevent, so the caller
    // gets the targets and an explicit "not calculated" either way.
    return { targets: row.activity_targets, measurable: true, note: '' };
  }
  return {
    targets: row.activity_targets,
    measurable: false,
    note: measurement.activities_recorded === 0
      ? 'No activity has been logged in this workspace at all, so this is not a record of what anyone did.'
      : `${measurement.activities_recorded} activities are recorded for this period, but they cannot be attributed to a person.`,
  };
}

/**
 * Every problem that can be SHOWN for one person, in the order a reader should
 * act on them. Empty for someone on pace, and empty for someone whose history
 * is too thin — those are different states and the caller must not collapse
 * them; `status` is what tells them apart.
 */
export function problemsFor(row: ProjectionRow): Problem[] {
  if (row.status !== 'at_risk' && row.status !== 'missed') return [];
  return [pipelineProblem(row), conversionProblem(row)].filter((p): p is Problem => p !== null);
}

export interface Rollup {
  total: number;
  byStatus: Record<ProjectionStatus, number>;
  /** Only the people with a real verdict against them. */
  offPace: ProjectionRow[];
  /** People whose status could not be computed — reported, never dropped. */
  notEnoughData: ProjectionRow[];
  noQuota: ProjectionRow[];
  /** Summed only over rows carrying a quota in this currency. */
  quotaTotals: { currency: string; quota: number; attained: number; count: number }[];
}

/**
 * A team or company roll-up.
 *
 * QUOTA TOTALS ARE PER CURRENCY and never converted — the same rule the
 * projection applies to deals. One summed "total quota" across INR and USD
 * rows would be a number with no unit, which is worse than three honest ones.
 *
 * `not_enough_data` and `no_quota` people are carried OUT as their own lists
 * rather than being filtered away, because a roll-up that silently omits the
 * people it could not assess overstates how much of the team it describes.
 */
export function rollup(rows: ProjectionRow[]): Rollup {
  const byStatus = {
    attained: 0, missed: 0, on_track: 0, at_risk: 0, not_enough_data: 0, no_quota: 0,
  } as Record<ProjectionStatus, number>;
  const totals = new Map<string, { currency: string; quota: number; attained: number; count: number }>();

  for (const r of rows) {
    if (byStatus[r.status] !== undefined) byStatus[r.status] += 1;
    if (r.quota) {
      const t = totals.get(r.quota.currency)
        ?? { currency: r.quota.currency, quota: 0, attained: 0, count: 0 };
      t.quota += r.quota.amount;
      t.attained += r.attained ?? 0;
      t.count += 1;
      totals.set(r.quota.currency, t);
    }
  }

  return {
    total: rows.length,
    byStatus,
    offPace: rows.filter(r => r.status === 'at_risk' || r.status === 'missed'),
    notEnoughData: rows.filter(r => r.status === 'not_enough_data'),
    noQuota: rows.filter(r => r.status === 'no_quota'),
    quotaTotals: [...totals.values()].sort((a, b) => a.currency.localeCompare(b.currency)),
  };
}

export const STATUS_LABEL: Record<ProjectionStatus, string> = {
  attained: 'Attained',
  on_track: 'On track',
  at_risk: 'At risk',
  missed: 'Missed',
  not_enough_data: 'Not enough data',
  no_quota: 'No quota set',
};

/**
 * Tailwind classes per status. `not_enough_data` and `no_quota` are GREY, not
 * amber or red: neither is a judgement about the person, and colouring an
 * absence of data as a warning is an accusation the data does not support.
 */
export const STATUS_CLASS: Record<ProjectionStatus, string> = {
  attained: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  on_track: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  at_risk: 'bg-amber-50 text-amber-800 border-amber-200',
  missed: 'bg-red-50 text-red-700 border-red-200',
  not_enough_data: 'bg-gray-50 text-gray-600 border-gray-200',
  no_quota: 'bg-gray-50 text-gray-600 border-gray-200',
};
