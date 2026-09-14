import { describe, it, expect } from 'vitest';
import {
  pipelineProblem, conversionProblem, activityNote, problemsFor, rollup,
  STATUS_CLASS, type ProjectionRow, type ActivityMeasurement,
} from './salesGuidance';

/**
 * The rules that decide what the guide panel is allowed to SAY about a person.
 *
 * These are performance verdicts, so the cases that matter most are the ones
 * where a verdict must NOT be produced: a comparison against a figure that is
 * really the same figure, a shortfall computed from a null, an activity
 * judgement with nothing behind it. Each of those has its own test, because
 * each is a way of accusing somebody on no evidence.
 */

const metric = (over: Partial<ProjectionRow['win_rate']> = {}) => ({
  value: null as number | null, basis: null as 'rep' | 'workspace' | null,
  sample_size: 0, reason: null as string | null, won: 0, lost: 0, ...over,
});

const row = (over: Partial<ProjectionRow> = {}): ProjectionRow => ({
  user_id: 1, name: 'Sam Okafor', status: 'at_risk',
  status_reason: 'Pipeline is short.',
  quota: { amount: 100000, currency: 'INR' },
  attained: 20000, remaining: 80000,
  win_rate: metric({ value: 0.25, basis: 'rep', sample_size: 12, won: 3, lost: 9 }),
  win_rate_workspace: metric({ value: 0.4, basis: 'workspace', sample_size: 40, won: 16, lost: 24 }),
  sales_cycle_days: { value: 30, basis: 'rep', sample_size: 6, reason: null },
  average_deal_size: { value: 20000, basis: 'rep', sample_size: 6, reason: null },
  pipeline: { value: 100000, deal_count: 4, stages: [] },
  required_pipeline: 320000,
  required_pipeline_reason: null,
  coverage_ratio: 1.25, required_coverage_ratio: 4,
  activity_targets: null,
  ...over,
});

describe('pipelineProblem — only when both numbers are real', () => {
  it('reports the shortfall with all three figures in it', () => {
    const p = pipelineProblem(row());
    expect(p).not.toBeNull();
    expect(p!.kind).toBe('pipeline');
    expect(p!.evidence).toContain('INR 100,000');   // what they have
    expect(p!.evidence).toContain('INR 320,000');   // what is needed
    expect(p!.evidence).toContain('INR 220,000');   // the gap, computed
    expect(p!.evidence).toContain('4 open deals');
  });

  it('is silent when the pipeline covers what is needed', () => {
    expect(pipelineProblem(row({ pipeline: { value: 400000, deal_count: 5, stages: [] } }))).toBeNull();
  });

  it('is silent when required_pipeline is null — that is "not enough data", not a gap', () => {
    // The projection nulls this whenever the win rate is unknown. Treating a
    // null as zero would report every new rep as infinitely short.
    expect(pipelineProblem(row({ required_pipeline: null }))).toBeNull();
  });

  it('is silent when the pipeline value itself is null (no quota currency to measure in)', () => {
    expect(pipelineProblem(row({ pipeline: { value: null, deal_count: 0, stages: [] } }))).toBeNull();
  });
});

describe('conversionProblem — never compares a number with itself', () => {
  it('reports a rep below the workspace, with both rates and both samples', () => {
    const p = conversionProblem(row());
    expect(p).not.toBeNull();
    expect(p!.evidence).toContain('25%');
    expect(p!.evidence).toContain('3 won, 9 lost');
    expect(p!.evidence).toContain('40%');
    expect(p!.evidence).toContain('40 closures');
  });

  it('IS SILENT when the win rate fell back to the workspace figure', () => {
    // With basis 'workspace', win_rate and win_rate_workspace are THE SAME
    // NUMBER, so there is no difference to report.
    expect(conversionProblem(row({
      win_rate: metric({ value: 0.4, basis: 'workspace', sample_size: 40, won: 16, lost: 24 }),
    }))).toBeNull();
  });

  it('is silent on basis ALONE, even if the two figures somehow disagree', () => {
    /*
     * THIS TEST EXISTS BECAUSE MUTATION TESTING FOUND THE ONE ABOVE TO BE
     * VACUOUS. Deleting the `basis !== 'rep'` guard did not fail it: with equal
     * values the `>=` guard returned null anyway, so the case passed for the
     * wrong reason and proved nothing about the guard it was written for.
     *
     * A payload where basis is 'workspace' and the two values differ is
     * INCONSISTENT — the server cannot produce it today — and that is exactly
     * why it belongs here. The property is structural: a figure that is not
     * this person's own is never compared against the workspace, whatever the
     * numbers happen to say. Without the guard this returns a finding about a
     * rep whose own win rate was never measured.
     */
    expect(conversionProblem(row({
      win_rate: metric({ value: 0.1, basis: 'workspace', sample_size: 40, won: 4, lost: 36 }),
    }))).toBeNull();
  });

  it('is silent when the rep matches or beats the workspace', () => {
    expect(conversionProblem(row({
      win_rate: metric({ value: 0.4, basis: 'rep', sample_size: 12, won: 5, lost: 7 }),
    }))).toBeNull();
    expect(conversionProblem(row({
      win_rate: metric({ value: 0.6, basis: 'rep', sample_size: 12, won: 7, lost: 5 }),
    }))).toBeNull();
  });

  it('is silent when either rate is null', () => {
    expect(conversionProblem(row({ win_rate: metric({ value: null, basis: 'rep' }) }))).toBeNull();
    expect(conversionProblem(row({ win_rate_workspace: metric({ value: null }) }))).toBeNull();
  });
});

describe('problemsFor — a verdict only where there is one to give', () => {
  it('returns nothing for someone on track, however thin their history', () => {
    expect(problemsFor(row({ status: 'on_track' }))).toEqual([]);
    expect(problemsFor(row({ status: 'attained' }))).toEqual([]);
  });

  it('returns NOTHING for not_enough_data and no_quota — those are not failures', () => {
    // The distinction the panel must never blur: "we cannot tell" is not "you
    // are behind". Both statuses carry their own wording elsewhere.
    expect(problemsFor(row({ status: 'not_enough_data' }))).toEqual([]);
    expect(problemsFor(row({ status: 'no_quota' }))).toEqual([]);
  });

  it('can return BOTH kinds — they are separate problems, not one ranked cause', () => {
    expect(problemsFor(row()).map(p => p.kind)).toEqual(['pipeline', 'conversion']);
  });
});

describe('activityNote — targets shown, attainment never invented', () => {
  const notMeasurable: ActivityMeasurement = {
    measurable: false, reason: 'no user reference on activities', activities_recorded: 0,
  };

  it('returns null when no targets are set — nothing to say', () => {
    expect(activityNote(row(), notMeasurable)).toBeNull();
  });

  it('returns the targets and says attainment is not calculated', () => {
    const n = activityNote(row({ activity_targets: { calls_per_week: 40 } }), notMeasurable);
    expect(n).not.toBeNull();
    expect(n!.measurable).toBe(false);
    expect(n!.targets).toEqual({ calls_per_week: 40 });
  });

  it('distinguishes "nothing is logged here" from "this person did nothing"', () => {
    const none = activityNote(row({ activity_targets: { calls_per_week: 40 } }), notMeasurable);
    expect(none!.note).toMatch(/No activity has been logged in this workspace at all/);

    const some = activityNote(
      row({ activity_targets: { calls_per_week: 40 } }),
      { ...notMeasurable, activities_recorded: 12 },
    );
    expect(some!.note).toMatch(/cannot be attributed to a person/);
    expect(some!.note).toContain('12');
  });
});

describe('rollup — counts everyone, sums only like with like', () => {
  const people: ProjectionRow[] = [
    row({ user_id: 1, name: 'A', status: 'at_risk' }),
    row({ user_id: 2, name: 'B', status: 'on_track' }),
    row({ user_id: 3, name: 'C', status: 'not_enough_data' }),
    row({ user_id: 4, name: 'D', status: 'no_quota', quota: null, attained: null }),
    row({ user_id: 5, name: 'E', status: 'attained', quota: { amount: 50000, currency: 'USD' }, attained: 60000 }),
  ];

  it('buckets every status and keeps the unassessable people as their own lists', () => {
    const r = rollup(people);
    expect(r.total).toBe(5);
    expect(r.byStatus.at_risk).toBe(1);
    expect(r.offPace.map(x => x.name)).toEqual(['A']);
    expect(r.notEnoughData.map(x => x.name)).toEqual(['C']);
    expect(r.noQuota.map(x => x.name)).toEqual(['D']);
    // The people it could not assess are still counted in the total, so the
    // panel cannot describe 3 people while claiming to describe 5.
    expect(r.offPace.length + r.notEnoughData.length + r.noQuota.length).toBeLessThan(r.total);
  });

  it('NEVER sums across currencies — one row per currency', () => {
    const r = rollup(people);
    expect(r.quotaTotals.map(t => t.currency)).toEqual(['INR', 'USD']);
    const inr = r.quotaTotals.find(t => t.currency === 'INR')!;
    expect(inr.count).toBe(3);            // A, B, C carry INR quotas
    expect(inr.quota).toBe(300000);
    const usd = r.quotaTotals.find(t => t.currency === 'USD')!;
    expect(usd.quota).toBe(50000);
    expect(usd.attained).toBe(60000);
  });

  it('a person with no quota contributes to no currency total', () => {
    const r = rollup([people[3]]);
    expect(r.quotaTotals).toEqual([]);
  });
});

describe('status colour is not a judgement where there is no judgement', () => {
  it('greys out not_enough_data and no_quota rather than warning on them', () => {
    expect(STATUS_CLASS.not_enough_data).toContain('gray');
    expect(STATUS_CLASS.no_quota).toContain('gray');
    expect(STATUS_CLASS.at_risk).toContain('amber');
    expect(STATUS_CLASS.missed).toContain('red');
  });
});
