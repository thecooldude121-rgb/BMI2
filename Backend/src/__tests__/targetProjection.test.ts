import { describe, it, expect } from 'vitest';
import { projectTarget, PROJECTION_RULES, type ClosedDeal, type OpenDeal, type ProjectionInput } from '../services/targetProjection';
import { parsePeriodLabel } from '../utils/targets';

/**
 * The projection's maths, pure — no database, a fixed clock.
 *
 * THE HARD REQUIREMENT these pin above all: when the real closed-deal history
 * is too thin, EVERY projected figure is null and the reason says what is
 * missing. The "insufficient" cases below assert on all of them at once, so
 * no single field can quietly start returning a number built on two deals.
 *
 * roundTrip.projection.test.ts drives the same function through the real
 * endpoint against Postgres; this file covers the branches cheaply.
 */

const REP = 7;
const OTHER = 8;
const Q3 = parsePeriodLabel('Q3 2026')!;
const NOW = new Date('2026-08-15T00:00:00Z');     // inside Q3
const DAY = 86_400_000;
const daysAgo = (n: number) => new Date(NOW.getTime() - n * DAY);

let seq = 0;
const closed = (outcome: 'won' | 'lost', o: Partial<ClosedDeal> = {}): ClosedDeal => ({
  dealId: `D${++seq}`, ownerId: REP, outcome, value: 50000, currency: 'USD',
  closedAt: daysAgo(100), createdAt: daysAgo(160), ...o,
});
const many = (n: number, outcome: 'won' | 'lost', o: Partial<ClosedDeal> = {}) =>
  Array.from({ length: n }, () => closed(outcome, o));

const open = (value: number, o: Partial<OpenDeal> = {}): OpenDeal => ({
  dealId: `O${++seq}`, ownerId: REP, value, currency: 'USD',
  stageSlug: 'proposal', stageName: 'Proposal', stagePosition: 3,
  expectedCloseDate: new Date('2026-09-15T00:00:00Z'), ...o,
});

const input = (o: Partial<ProjectionInput> = {}): ProjectionInput => ({
  userId: REP, now: NOW, period: Q3, quota: { amount: 100000, currency: 'USD' },
  closed: [], untimedClosed: [], open: [], ...o,
});

/** Every figure that would be a projection. All must be null when data is short. */
const projected = (p: ReturnType<typeof projectTarget>) => ({
  win_rate: p.win_rate.value,
  required_pipeline: p.required_pipeline,
  coverage_ratio: p.coverage_ratio,
  required_coverage_ratio: p.required_coverage_ratio,
  required_qualified_leads: p.required_qualified_leads,
});
const ALL_NULL = {
  win_rate: null, required_pipeline: null, coverage_ratio: null,
  required_coverage_ratio: null, required_qualified_leads: null,
};

describe('projectTarget — not enough history means no number, ever', () => {
  it('9 dated closures (one short of the bar): not_enough_data, and NOTHING projected', () => {
    const p = projectTarget(input({ closed: [...many(4, 'won'), ...many(5, 'lost')], open: [open(900000)] }));
    expect(p.status).toBe('not_enough_data');
    expect(projected(p)).toEqual(ALL_NULL);
    expect(p.status_reason).toMatch(/^Not enough historical data yet: 9 deals closed with a recorded close date in the last 365 days across the workspace \(10 needed\)\./);
    // The pipeline itself is a FACT, not a projection, and is still reported.
    expect(p.pipeline.value).toBe(900000);
  });

  it('exactly 10 dated closures clears the bar', () => {
    const p = projectTarget(input({ closed: [...many(4, 'won'), ...many(6, 'lost')] }));
    expect(p.win_rate.value).toBe(0.4);
    expect(p.status).not.toBe('not_enough_data');
  });

  it('10 closures and NO wins: not_enough_data — a 0% rate would make required pipeline infinite', () => {
    const p = projectTarget(input({ closed: many(10, 'lost') }));
    expect(p.status).toBe('not_enough_data');
    expect(projected(p)).toEqual(ALL_NULL);
    expect(p.status_reason).toMatch(/none was won/);
  });

  it('closures older than the lookback window do not count toward the bar', () => {
    const recent = [...many(4, 'won'), ...many(3, 'lost')];
    const stale = many(3, 'lost', { closedAt: daysAgo(PROJECTION_RULES.LOOKBACK_DAYS + 1) });
    const p = projectTarget(input({ closed: [...recent, ...stale] }));
    expect(p.status).toBe('not_enough_data');
    expect(p.win_rate.sample_size).toBe(7);
  });

  it('undated closures are NOT counted, and the reason says how many were left out', () => {
    const p = projectTarget(input({
      closed: [closed('won'), closed('lost')],
      untimedClosed: [{ ownerId: REP, outcome: 'won' }, { ownerId: OTHER, outcome: 'lost' }],
    }));
    expect(p.status).toBe('not_enough_data');
    expect(p.status_reason).toMatch(/2 deals closed with a recorded close date/);
    expect(p.status_reason).toMatch(/2 more closed deals have no recorded close date, so they cannot be placed in time and are not counted\./);
    expect(p.excluded.closed_without_close_date).toBe(1);   // this rep's own
  });

  it('with no quota there is nothing to project against — no_quota, not zeros', () => {
    const p = projectTarget(input({ quota: null, closed: [...many(5, 'won'), ...many(5, 'lost')], open: [open(1)] }));
    expect(p.status).toBe('no_quota');
    expect(p.attained).toBeNull();
    expect(p.remaining).toBeNull();
    expect(p.pipeline.value).toBeNull();
    expect(p.required_pipeline).toBeNull();
    expect(p.required_pipeline_reason).toBe('No quota is set for Q3 2026.');
  });
});

describe('projectTarget — the maths when the history is there', () => {
  const tenClosed = [...many(4, 'won', { ownerId: OTHER }), ...many(6, 'lost', { ownerId: OTHER })];

  it('required pipeline = remaining ÷ win rate; covered pipeline is on_track', () => {
    const p = projectTarget(input({ closed: tenClosed, open: [open(150000), open(100000)] }));
    expect(p.win_rate.value).toBe(0.4);
    expect(p.win_rate.basis).toBe('workspace');       // the rep has no history of their own
    expect(p.remaining).toBe(100000);
    expect(p.required_pipeline).toBe(250000);          // 100000 / 0.4
    expect(p.pipeline.value).toBe(250000);
    expect(p.coverage_ratio).toBe(2.5);
    expect(p.required_coverage_ratio).toBe(2.5);
    expect(p.status).toBe('on_track');
    expect(p.status_reason).toMatch(/at the workspace's 40% win rate/);
  });

  it('pipeline short of the requirement is at_risk, and says by how much', () => {
    const p = projectTarget(input({ closed: tenClosed, open: [open(200000)] }));
    expect(p.status).toBe('at_risk');
    expect(p.status_reason).toMatch(/USD 50,000 short of the USD 250,000 needed/);
  });

  it('the rep\'s OWN history is preferred once it meets the bar', () => {
    const mine = [...many(5, 'won'), ...many(5, 'lost')];
    const p = projectTarget(input({ closed: [...tenClosed, ...mine] }));
    expect(p.win_rate.basis).toBe('rep');
    expect(p.win_rate.value).toBe(0.5);
  });

  it('won in the period counts toward attainment; meeting quota is attained', () => {
    const inQ3 = closed('won', { value: 120000, closedAt: new Date('2026-08-01T00:00:00Z') });
    const p = projectTarget(input({ closed: [inQ3] }));
    expect(p.attained).toBe(120000);
    expect(p.status).toBe('attained');
    expect(p.remaining).toBe(0);
  });

  it('after the period ends short of quota it is missed — no win rate needed to say so', () => {
    const p = projectTarget(input({
      now: new Date('2026-10-05T00:00:00Z'),
      closed: [closed('won', { value: 30000, closedAt: new Date('2026-09-01T00:00:00Z') })],
    }));
    expect(p.status).toBe('missed');
    expect(p.attained).toBe(30000);
    expect(p.remaining).toBe(70000);
    expect(p.required_pipeline).toBeNull();
  });

  it('other currencies are EXCLUDED and reported, never converted', () => {
    const p = projectTarget(input({
      closed: [...tenClosed, closed('won', { value: 40000, currency: 'AED', closedAt: new Date('2026-08-02T00:00:00Z') })],
      open: [open(250000), open(50000, { currency: 'AED' })],
    }));
    expect(p.attained).toBe(0);
    expect(p.excluded.won_in_period_other_currency).toEqual({ AED: { count: 1, value: 40000 } });
    expect(p.pipeline.value).toBe(250000);
    expect(p.excluded.open_deals_other_currency).toEqual({ AED: { count: 1, value: 50000 } });
  });

  it('open deals with no expected close date, or closing outside the period, are not pipeline for it', () => {
    const p = projectTarget(input({
      closed: tenClosed,
      open: [open(100000), open(500000, { expectedCloseDate: null }),
             open(700000, { expectedCloseDate: new Date('2026-10-01T00:00:00Z') })],   // first day of Q4
    }));
    expect(p.pipeline.value).toBe(100000);
    expect(p.excluded.open_deals_without_close_date).toBe(1);
  });

  it('required qualified leads needs 5 won deals in the quota currency; below that it says so', () => {
    const p4 = projectTarget(input({ closed: tenClosed }));      // 4 won
    expect(p4.required_qualified_leads).toBeNull();
    expect(p4.required_qualified_leads_reason).toMatch(/4 won deals in USD .* \(5 needed\)/);

    const withSizes = [
      ...[40000, 50000, 60000, 70000, 80000].map(v => closed('won', { ownerId: OTHER, value: v })),
      ...many(5, 'lost', { ownerId: OTHER }),
    ];
    const p = projectTarget(input({ closed: withSizes }));
    expect(p.average_deal_size.value).toBe(60000);
    expect(p.required_pipeline).toBe(200000);                   // 100000 / 0.5
    expect(p.required_qualified_leads).toBe(4);                 // ceil(200000 / 60000)
  });

  it('sales cycle is the mean of created→won, and needs 5 such deals', () => {
    const wins = [30, 40, 50, 60, 70].map(len => closed('won', {
      ownerId: OTHER, closedAt: daysAgo(10), createdAt: daysAgo(10 + len),
    }));
    const p = projectTarget(input({ closed: [...wins, ...many(5, 'lost', { ownerId: OTHER })] }));
    expect(p.sales_cycle_days.value).toBe(50);
    // 47 days remain in Q3 from 15 Aug; a 50-day cycle cannot close inside it.
    expect(p.new_pipeline_can_close_in_period).toBe(false);

    const few = projectTarget(input({ closed: [...wins.slice(0, 4), ...many(6, 'lost')] }));
    expect(few.sales_cycle_days.value).toBeNull();
    expect(few.sales_cycle_days.reason).toMatch(/4 won deals with both a created date and a recorded close date/);
    expect(few.new_pipeline_can_close_in_period).toBeNull();
  });
});
