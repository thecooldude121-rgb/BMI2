import type { Period } from '../utils/targets';

/**
 * Pipeline-coverage projection for one person's target in one period.
 *
 * PURE: no database, no clock. Everything it needs is passed in, including
 * `now`, so every branch — including the "not enough history" branches — is
 * testable without seeding a year of deals. The loader is
 * services/targetProjectionData.ts.
 *
 * THE MATHS, and nothing else:
 *   win rate            = won / (won + lost), over deals closed in the trailing
 *                         LOOKBACK_DAYS with a RECORDED close time
 *   required pipeline   = remaining quota / win rate
 *   required qualified  = required pipeline / average won deal size
 *   sales cycle         = mean(closed_at - created_at) over won deals
 *   status              = attained | missed | on_track | at_risk
 *                         | not_enough_data | no_quota
 *
 * THE RULE THIS FILE EXISTS TO KEEP: when the history is too thin to trust a
 * figure, that figure is NULL and carries a reason naming exactly what is
 * missing. It never falls back to a default rate, a benchmark, or an estimate.
 * A projected number built on two closed deals is a fabricated number with
 * extra steps.
 */

export const PROJECTION_RULES = {
  /** Closures older than this do not describe current performance. */
  LOOKBACK_DAYS: 365,
  /** A win rate needs this many deals closed (won + lost) with a recorded date... */
  MIN_CLOSED_FOR_WIN_RATE: 10,
  /** ...and at least one win, or the required pipeline is a division by zero. */
  MIN_WINS_FOR_WIN_RATE: 1,
  /** A mean cycle length needs this many won deals with both dates recorded. */
  MIN_WON_FOR_CYCLE: 5,
  /** A mean deal size needs this many won deals in the quota's currency. */
  MIN_WON_FOR_DEAL_SIZE: 5,
} as const;

const DAY_MS = 86_400_000;

export interface ClosedDeal {
  dealId: string;
  ownerId: number | null;
  outcome: 'won' | 'lost';
  value: number;
  currency: string;
  /** When it moved into its current won/lost stage, from deal_stage_history. */
  closedAt: Date;
  createdAt: Date | null;
}

export interface OpenDeal {
  dealId: string;
  ownerId: number | null;
  value: number;
  currency: string;
  stageSlug: string;
  stageName: string;
  stagePosition: number;
  /** UTC midnight of expected_close_date, or null when none is recorded. */
  expectedCloseDate: Date | null;
}

export interface ProjectionInput {
  userId: number;
  now: Date;
  period: Period;
  quota: { amount: number; currency: string } | null;
  /** Every closure in the workspace that HAS a recorded close time. */
  closed: ClosedDeal[];
  /** Closed deals (by stage) with NO recorded close time — counted, never placed. */
  untimedClosed: { ownerId: number | null; outcome: 'won' | 'lost' }[];
  /** Every open, unarchived deal in the workspace. */
  open: OpenDeal[];
}

export type Basis = 'rep' | 'workspace';

export interface Metric {
  value: number | null;
  /** Whose history produced the value: this person's own, or the workspace's. */
  basis: Basis | null;
  sample_size: number;
  /** Non-null exactly when value is null: what is missing, specifically. */
  reason: string | null;
}

export type ProjectionStatus =
  | 'attained' | 'missed' | 'on_track' | 'at_risk' | 'not_enough_data' | 'no_quota';

export interface Projection {
  user_id: number;
  status: ProjectionStatus;
  status_reason: string;
  quota: { amount: number; currency: string } | null;
  attained: number | null;
  remaining: number | null;
  win_rate: Metric & { won: number; lost: number };
  sales_cycle_days: Metric;
  average_deal_size: Metric;
  /** Open deals expected to close in the period, in the quota's currency. */
  pipeline: {
    value: number | null;
    deal_count: number;
    stages: { slug: string; name: string; position: number; count: number; value: number }[];
  };
  required_pipeline: number | null;
  required_pipeline_reason: string | null;
  coverage_ratio: number | null;
  required_coverage_ratio: number | null;
  required_qualified_leads: number | null;
  required_qualified_leads_reason: string | null;
  /** Could a deal created today close inside the period, at the mean cycle? */
  new_pipeline_can_close_in_period: boolean | null;
  /** Everything left out, so nothing is silently dropped. */
  excluded: {
    open_deals_without_close_date: number;
    open_deals_other_currency: Record<string, { count: number; value: number }>;
    won_in_period_other_currency: Record<string, { count: number; value: number }>;
    closed_without_close_date: number;
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const inRange = (d: Date, start: Date, end: Date) => d >= start && d < end;

function addTo(bucket: Record<string, { count: number; value: number }>, cur: string, value: number) {
  const b = bucket[cur] ?? (bucket[cur] = { count: 0, value: 0 });
  b.count += 1;
  b.value = round2(b.value + value);
}

/**
 * Prefer this person's own history; fall back to the workspace's, LABELLED;
 * otherwise null with the reason from the workspace-level attempt (the larger
 * sample — if even that is too small, the rep's certainly is).
 */
function pick<T extends { value: number | null; sample_size: number; reason: string | null }>(
  rep: T, workspace: T,
): T & { basis: Basis | null } {
  if (rep.value !== null) return { ...rep, basis: 'rep' };
  if (workspace.value !== null) return { ...workspace, basis: 'workspace' };
  return { ...workspace, basis: null };
}

function untimedNote(n: number): string {
  return n > 0
    ? ` ${plural(n, 'more closed deal')} ${n === 1 ? 'has' : 'have'} no recorded close date, so ${n === 1 ? 'it' : 'they'} cannot be placed in time and ${n === 1 ? 'is' : 'are'} not counted.`
    : '';
}

function winRateOf(list: ClosedDeal[], untimed: number, scope: string) {
  const won = list.filter(d => d.outcome === 'won').length;
  const lost = list.length - won;
  const closed = won + lost;
  const { MIN_CLOSED_FOR_WIN_RATE: minClosed, MIN_WINS_FOR_WIN_RATE: minWins, LOOKBACK_DAYS } = PROJECTION_RULES;
  if (closed < minClosed) {
    return {
      value: null, won, lost, sample_size: closed,
      reason: `Not enough historical data yet: ${plural(closed, 'deal')} closed with a recorded close date in the last ${LOOKBACK_DAYS} days ${scope} (${minClosed} needed).${untimedNote(untimed)}`,
    };
  }
  if (won < minWins) {
    return {
      value: null, won, lost, sample_size: closed,
      reason: `Not enough historical data yet: ${plural(closed, 'deal')} closed in the last ${LOOKBACK_DAYS} days ${scope}, but none was won — a 0% win rate would make the required pipeline infinite.`,
    };
  }
  return { value: won / closed, won, lost, sample_size: closed, reason: null };
}

function cycleOf(list: ClosedDeal[], scope: string) {
  const days = list
    .filter(d => d.outcome === 'won' && d.createdAt !== null && d.closedAt >= (d.createdAt as Date))
    .map(d => (d.closedAt.getTime() - (d.createdAt as Date).getTime()) / DAY_MS);
  const min = PROJECTION_RULES.MIN_WON_FOR_CYCLE;
  if (days.length < min) {
    return {
      value: null, sample_size: days.length,
      reason: `Not enough historical data yet: ${plural(days.length, 'won deal')} with both a created date and a recorded close date in the last ${PROJECTION_RULES.LOOKBACK_DAYS} days ${scope} (${min} needed).`,
    };
  }
  return { value: Math.round((days.reduce((a, b) => a + b, 0) / days.length) * 10) / 10, sample_size: days.length, reason: null };
}

function dealSizeOf(list: ClosedDeal[], currency: string, scope: string) {
  const values = list.filter(d => d.outcome === 'won' && d.currency === currency).map(d => d.value);
  const min = PROJECTION_RULES.MIN_WON_FOR_DEAL_SIZE;
  if (values.length < min) {
    return {
      value: null, sample_size: values.length,
      reason: `Not enough historical data yet: ${plural(values.length, 'won deal')} in ${currency} closed in the last ${PROJECTION_RULES.LOOKBACK_DAYS} days ${scope} (${min} needed).`,
    };
  }
  return { value: round2(values.reduce((a, b) => a + b, 0) / values.length), sample_size: values.length, reason: null };
}

export function projectTarget(input: ProjectionInput): Projection {
  const { userId, now, period, quota } = input;
  const windowStart = new Date(now.getTime() - PROJECTION_RULES.LOOKBACK_DAYS * DAY_MS);

  const inWindow = input.closed.filter(d => d.closedAt > windowStart && d.closedAt <= now);
  const mineInWindow = inWindow.filter(d => d.ownerId === userId);
  const untimedAll = input.untimedClosed.length;
  const untimedMine = input.untimedClosed.filter(d => d.ownerId === userId).length;

  // ── Historical metrics: rep first, workspace labelled, else null + reason ──
  const wrRep = winRateOf(mineInWindow, untimedMine, 'for this person');
  const wrWs = winRateOf(inWindow, untimedAll, 'across the workspace');
  const winRate = pick(wrRep, wrWs);

  const cycle = pick(cycleOf(mineInWindow, 'for this person'), cycleOf(inWindow, 'across the workspace'));

  const dealSize = quota
    ? pick(dealSizeOf(mineInWindow, quota.currency, 'for this person'),
           dealSizeOf(inWindow, quota.currency, 'across the workspace'))
    : { value: null, basis: null, sample_size: 0,
        reason: 'No quota is set for this period, so there is no currency to measure deal size in.' };

  // ── What was actually won in the period, in the quota's currency ──────────
  const excluded: Projection['excluded'] = {
    open_deals_without_close_date: 0,
    open_deals_other_currency: {},
    won_in_period_other_currency: {},
    closed_without_close_date: untimedMine,
  };
  let attained: number | null = null;
  if (quota) {
    attained = 0;
    for (const d of input.closed) {
      if (d.ownerId !== userId || d.outcome !== 'won' || !inRange(d.closedAt, period.start, period.end)) continue;
      if (d.currency === quota.currency) attained = round2(attained + d.value);
      else addTo(excluded.won_in_period_other_currency, d.currency, d.value);
    }
  }

  // ── Open pipeline expected to close in the period ─────────────────────────
  const stages = new Map<string, { slug: string; name: string; position: number; count: number; value: number }>();
  let pipelineValue = 0;
  let pipelineCount = 0;
  for (const d of input.open) {
    if (d.ownerId !== userId) continue;
    if (d.expectedCloseDate === null) { excluded.open_deals_without_close_date += 1; continue; }
    if (!inRange(d.expectedCloseDate, period.start, period.end)) continue;
    if (!quota || d.currency !== quota.currency) {
      addTo(excluded.open_deals_other_currency, d.currency, d.value);
      continue;
    }
    pipelineValue = round2(pipelineValue + d.value);
    pipelineCount += 1;
    const s = stages.get(d.stageSlug) ?? { slug: d.stageSlug, name: d.stageName, position: d.stagePosition, count: 0, value: 0 };
    s.count += 1;
    s.value = round2(s.value + d.value);
    stages.set(d.stageSlug, s);
  }
  const pipeline = {
    value: quota ? pipelineValue : null,
    deal_count: pipelineCount,
    stages: [...stages.values()].sort((a, b) => a.position - b.position),
  };

  const base = {
    user_id: userId,
    quota,
    attained,
    win_rate: winRate,
    sales_cycle_days: cycle,
    average_deal_size: dealSize,
    pipeline,
    excluded,
  };
  const daysLeft = Math.max(0, (period.end.getTime() - Math.max(now.getTime(), period.start.getTime())) / DAY_MS);
  const canCloseInPeriod = cycle.value === null || now >= period.end ? null : daysLeft >= cycle.value;

  const empty = {
    required_pipeline: null, coverage_ratio: null, required_coverage_ratio: null,
    required_qualified_leads: null,
  };

  if (!quota) {
    return {
      ...base, ...empty, status: 'no_quota', remaining: null,
      status_reason: `No quota is set for ${period.label}.`,
      required_pipeline_reason: `No quota is set for ${period.label}.`,
      required_qualified_leads_reason: `No quota is set for ${period.label}.`,
      new_pipeline_can_close_in_period: canCloseInPeriod,
    };
  }

  const remaining = round2(Math.max(0, quota.amount - (attained as number)));
  const money = (n: number) => `${quota.currency} ${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

  if ((attained as number) >= quota.amount) {
    return {
      ...base, ...empty, status: 'attained', remaining: 0,
      status_reason: `Won ${money(attained as number)} against a quota of ${money(quota.amount)} in ${period.label}.`,
      required_pipeline: 0, required_pipeline_reason: null,
      required_qualified_leads: 0, required_qualified_leads_reason: null,
      new_pipeline_can_close_in_period: canCloseInPeriod,
    };
  }

  if (now >= period.end) {
    return {
      ...base, ...empty, status: 'missed', remaining,
      status_reason: `${period.label} has ended: won ${money(attained as number)} against a quota of ${money(quota.amount)}.`,
      required_pipeline_reason: `${period.label} has ended.`,
      required_qualified_leads_reason: `${period.label} has ended.`,
      new_pipeline_can_close_in_period: null,
    };
  }

  // ── Everything below needs a win rate. Without one: say so, compute nothing.
  if (winRate.value === null) {
    return {
      ...base, ...empty, status: 'not_enough_data', remaining,
      status_reason: winRate.reason as string,
      required_pipeline_reason: winRate.reason,
      required_qualified_leads_reason: winRate.reason,
      new_pipeline_can_close_in_period: canCloseInPeriod,
    };
  }

  const requiredPipeline = round2(remaining / winRate.value);
  const requiredCoverage = Math.round((1 / winRate.value) * 100) / 100;
  const coverage = remaining > 0 ? Math.round((pipelineValue / remaining) * 100) / 100 : null;
  const onTrack = pipelineValue >= requiredPipeline;
  const pct = `${Math.round(winRate.value * 1000) / 10}%`;
  const basisLabel = winRate.basis === 'rep' ? "this person's" : "the workspace's";

  return {
    ...base,
    status: onTrack ? 'on_track' : 'at_risk',
    status_reason: onTrack
      ? `Pipeline of ${money(pipelineValue)} expected to close in ${period.label} covers the ${money(requiredPipeline)} needed to win the remaining ${money(remaining)} at ${basisLabel} ${pct} win rate.`
      : `Pipeline of ${money(pipelineValue)} expected to close in ${period.label} is ${money(round2(requiredPipeline - pipelineValue))} short of the ${money(requiredPipeline)} needed to win the remaining ${money(remaining)} at ${basisLabel} ${pct} win rate.`,
    remaining,
    required_pipeline: requiredPipeline,
    required_pipeline_reason: null,
    coverage_ratio: coverage,
    required_coverage_ratio: requiredCoverage,
    required_qualified_leads: dealSize.value === null ? null : Math.ceil(requiredPipeline / dealSize.value),
    required_qualified_leads_reason: dealSize.value === null ? dealSize.reason : null,
    new_pipeline_can_close_in_period: canCloseInPeriod,
  };
}
