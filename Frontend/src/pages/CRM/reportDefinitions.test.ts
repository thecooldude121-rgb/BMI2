import { describe, it, expect } from 'vitest';
import { REPORTS, ReportData, ReportDef, dealsForReport } from './reportDefinitions';
import { DashboardDeal } from '../../hooks/useDashboardData';
import { buildStageLookup, outcomeOf } from '../../utils/pipelinesApi';

/**
 * The report compute functions, tested WITHOUT A RENDER.
 *
 * That is the payoff of phase (c): these were 68 hardcoded rows inside JSX,
 * untestable except through a browser. As functions they can be asserted
 * directly, which is how the null-versus-zero rules below get pinned at all.
 *
 * WHAT THESE PIN, in priority order:
 *  1. NOTHING IS EVER 0 WHEN IT IS UNKNOWN. A win rate with no closed deals,
 *     revenue with nothing won, pipeline with nothing open — each returns
 *     `unavailable`, never a zero that reads as a measurement.
 *  2. NO ROW IS SILENTLY DROPPED. Deals with no source, no close date, no
 *     created date or an unrecognised stage each get an explicit row, because
 *     dropping them is how a breakdown comes to disagree with its own total.
 *  3. OWNERSHIP USES THE SHARED COALESCE GROUPING, so an unresolved name is
 *     its own row rather than being pooled into "Unassigned".
 *  4. WON/LOST IS ASKED OF THE PIPELINE CONFIG, including the ambiguous-slug
 *     case that `pipeline_id` was widened into the type to fix.
 */

const PIPELINES = [
  {
    id: 'p1', name: 'Sales', slug: 'sales', is_default: true, archived_at: null,
    stages: [
      { id: 's1', name: 'Qualified', slug: 'qualified', stage_type: 'open', color: 'blue', position: 1, archived_at: null },
      { id: 's2', name: 'Proposal',  slug: 'proposal',  stage_type: 'open', color: 'blue', position: 2, archived_at: null },
      { id: 's3', name: 'Won',       slug: 'won',       stage_type: 'won',  color: 'green', position: 3, archived_at: null },
      { id: 's4', name: 'Lost',      slug: 'lost',      stage_type: 'lost', color: 'red',  position: 4, archived_at: null },
    ],
  },
  /*
   * A SECOND PIPELINE THAT REUSES THE SLUG `won`. This is the case that made
   * widening DashboardDeal with `pipeline_id` necessary: `buildStageLookup`
   * resolves a slug without a pipeline only when it is unique across all of
   * them, so without the id a deal here classifies as OPEN and its revenue
   * silently disappears.
   */
  {
    id: 'p2', name: 'Renewals', slug: 'renewals', is_default: false, archived_at: null,
    stages: [
      { id: 'r1', name: 'Up for renewal', slug: 'up-for-renewal', stage_type: 'open', color: 'blue', position: 1, archived_at: null },
      // Same slug as the Sales pipeline's, DIFFERENT display name — so a card
      // that resolves a stage without the pipeline id cannot name it.
      { id: 'r3', name: 'Renewal qualified', slug: 'qualified', stage_type: 'open', color: 'blue', position: 2, archived_at: null },
      { id: 'r2', name: 'Renewed',        slug: 'won',            stage_type: 'won',  color: 'green', position: 2, archived_at: null },
    ],
  },
];

const lookup = buildStageLookup(PIPELINES as never);

const deal = (d: Partial<DashboardDeal>): DashboardDeal => ({
  id: d.id ?? Math.random().toString(36).slice(2),
  pipeline_id: 'sales',
  ...d,
});

function data(deals: DashboardDeal[], over: Partial<ReportData> = {}): ReportData {
  return {
    deals,
    leads: [],
    contactCount: 0,
    outcome: outcomeOf(lookup),
    stageOf: lookup,
    excludedNoCloseDate: 0,
    dateFiltered: false,
    ...over,
  };
}

const get = (id: string): ReportDef => {
  const r = REPORTS.find(x => x.id === id);
  if (!r) throw new Error(`no such report: ${id}`);
  return r;
};

const labels = (res: { rows?: Array<{ label: string }> }) => (res.rows ?? []).map(r => r.label);

describe('report definitions — the catalogue', () => {
  it('every report has a unique id and a compute function', () => {
    const ids = REPORTS.map(r => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of REPORTS) expect(typeof r.compute).toBe('function');
  });

  it('every report survives empty data without throwing, and reports a reason', () => {
    // The state a brand-new workspace is in. A compute function that threw
    // here would take the whole page down, which is what `asList`-style
    // boundary bugs did on the Team pages.
    for (const r of REPORTS) {
      const res = r.compute(data([]));
      expect(res, r.id).toBeDefined();
      // Either an honest sentence, or rows — never a silent empty card.
      const hasContent = Boolean(res.unavailable) || (res.rows ?? []).length > 0;
      expect(hasContent, `${r.id} rendered nothing at all`).toBe(true);
    }
  });
});

describe('win/loss', () => {
  it('is UNAVAILABLE with no closed deals — never 0%', () => {
    const res = get('win-loss').compute(data([deal({ stage: 'qualified' })]));
    expect(res.unavailable).toMatch(/no deals have closed/i);
    expect(JSON.stringify(res)).not.toContain('0%');
  });

  it('divides by DECIDED deals, not by all deals', () => {
    const res = get('win-loss').compute(data([
      deal({ stage: 'won' }), deal({ stage: 'lost' }),
      deal({ stage: 'qualified' }), deal({ stage: 'proposal' }),
    ]));
    // 1 of 2 decided = 50%. Dividing by all four would give 25%.
    expect(res.rows?.[0]).toMatchObject({ label: 'Won: 1', value: '50%' });
    expect(labels(res)).toContain('Of decided deals');
  });

  it('classifies a won deal in a SECOND pipeline that shares the `won` slug', () => {
    // Without `pipeline_id` on the deal this resolves to null and counts as
    // open, so the win silently vanishes. This is the widening, pinned.
    const res = get('win-loss').compute(data([
      deal({ stage: 'won', pipeline_id: 'renewals' }),
      deal({ stage: 'lost', pipeline_id: 'sales' }),
    ]));
    expect(res.rows?.[0]).toMatchObject({ label: 'Won: 1' });
  });
});

describe('sales by rep and pipeline by owner — shared COALESCE grouping', () => {
  it('gives an UNRESOLVED NAME its own row rather than pooling it', () => {
    const res = get('sales-by-rep').compute(data([
      deal({ stage: 'won', value: 100, assigned_to_user_id: 1, assigned_to: 'Alex Rodriguez' }),
      deal({ stage: 'won', value: 300, assigned_to_user_id: null, assigned_to: 'John Smith' }),
      deal({ stage: 'won', value: 100, assigned_to_user_id: null, assigned_to: null }),
    ]));
    const l = labels(res);
    expect(l).toContain('Alex Rodriguez');
    // Named but unmatched — visible, and marked as such.
    expect(l.some(x => x.startsWith('John Smith') && x.includes('unmatched'))).toBe(true);
    // Genuinely ownerless is a separate row again.
    expect(l).toContain('Unassigned');
  });

  it('sorts the ownerless row LAST even when it is the largest', () => {
    const res = get('pipeline-by-owner').compute(data([
      deal({ stage: 'qualified', value: 10, assigned_to_user_id: null, assigned_to: null }),
      deal({ stage: 'qualified', value: 10, assigned_to_user_id: null, assigned_to: null }),
      deal({ stage: 'qualified', value: 10, assigned_to_user_id: 1, assigned_to: 'Alex Rodriguez' }),
    ]));
    const l = labels(res);
    expect(l[l.length - 1]).toMatch(/^Unassigned/);
  });

  it('sales-by-rep sums WON and pipeline-by-owner sums OPEN — the only difference', () => {
    const deals = [
      deal({ stage: 'won',       value: 500, assigned_to_user_id: 1, assigned_to: 'Alex' }),
      deal({ stage: 'qualified', value: 900, assigned_to_user_id: 1, assigned_to: 'Alex' }),
    ];
    expect(get('sales-by-rep').compute(data(deals)).rows?.[0].value).toContain('$500');
    expect(get('pipeline-by-owner').compute(data(deals)).rows?.[0].value).toContain('$900');
  });

  it('does not collide a user id with a rep literally named the same digits', () => {
    const res = get('pipeline-by-owner').compute(data([
      deal({ stage: 'qualified', value: 10, assigned_to_user_id: 5, assigned_to: 'Real User' }),
      deal({ stage: 'qualified', value: 20, assigned_to_user_id: null, assigned_to: '5' }),
    ]));
    expect(res.rows).toHaveLength(2);
  });
});

describe('revenue by source', () => {
  it('gives deals with NO SOURCE their own row instead of dropping them', () => {
    // 15 of the 24 live deals record no source. Dropping them would make the
    // percentages add to a fraction of the real total while looking whole.
    const res = get('revenue-by-source').compute(data([
      deal({ stage: 'won', value: 100, source: 'referral' }),
      deal({ stage: 'won', value: 300, source: null }),
    ]));
    const l = labels(res);
    expect(l).toContain('referral');
    expect(l.some(x => x.startsWith('No source recorded: 1'))).toBe(true);
    // And the shares still account for everything.
    expect(res.rows?.find(r => r.label === 'referral')?.value).toContain('25%');
  });

  it('is UNAVAILABLE when nothing is won, rather than an empty breakdown', () => {
    const res = get('revenue-by-source').compute(data([deal({ stage: 'qualified', source: 'referral' })]));
    expect(res.unavailable).toMatch(/no deals have been won/i);
  });
});

describe('pipeline health', () => {
  it('names stages from the workspace config and orders them by position', () => {
    const res = get('pipeline-health').compute(data([
      deal({ stage: 'proposal', value: 200 }),
      deal({ stage: 'qualified', value: 100 }),
    ]));
    const l = labels(res);
    expect(l[0]).toBe('Total open');
    // Config order, not insertion order: Qualified is position 1.
    expect(l[1]).toBe('Qualified: 1');
    expect(l[2]).toBe('Proposal: 1');
  });

  it('names an ambiguous stage slug per PIPELINE, not globally', () => {
    /*
     * `qualified` exists in both pipelines with different display names.
     * `buildStageLookup` resolves a bare slug only when it is unique, so
     * without `deal.pipeline_id` this row would be "Stage not recognised" and
     * its value would vanish from the breakdown while the total above stayed
     * correct — a card disagreeing with itself.
     */
    const res = get('pipeline-health').compute(data([
      deal({ stage: 'qualified', value: 100, pipeline_id: 'sales' }),
      deal({ stage: 'qualified', value: 200, pipeline_id: 'renewals' }),
    ]));
    const l = labels(res);
    expect(l).toContain('Qualified: 1');
    expect(l).toContain('Renewal qualified: 1');
    expect(l.some(x => x.startsWith('Stage not recognised'))).toBe(false);
  });

  it('surfaces an UNRECOGNISED stage instead of quietly omitting it', () => {
    const res = get('pipeline-health').compute(data([
      deal({ stage: 'qualified', value: 100 }),
      deal({ stage: 'not-a-stage', value: 900 }),
    ]));
    expect(labels(res).some(x => x.startsWith('Stage not recognised: 1'))).toBe(true);
  });
});

describe('aging pipeline', () => {
  const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

  it('buckets by age since creation and always states the approximation', () => {
    const res = get('aging-pipeline').compute(data([
      deal({ stage: 'qualified', value: 10, created_at: daysAgo(5) }),
      deal({ stage: 'qualified', value: 20, created_at: daysAgo(45) }),
      deal({ stage: 'qualified', value: 30, created_at: daysAgo(200) }),
    ]));
    expect(labels(res)).toEqual(expect.arrayContaining([
      'Under 30 days: 1', '30–60 days: 1', 'Over 90 days: 1',
    ]));
    // The caveat is not optional — it is what stops this being read as
    // stage-aging, which is what the label implies.
    expect(res.caveat).toMatch(/created.*stage history/is);
  });

  it('reports deals with no created date rather than bucketing them as new', () => {
    const res = get('aging-pipeline').compute(data([
      deal({ stage: 'qualified', value: 10, created_at: null }),
    ]));
    expect(labels(res).some(x => x.startsWith('No created date: 1'))).toBe(true);
  });

  it('ignores the date filter, because age is measured from creation', () => {
    expect(get('aging-pipeline').usesDateRange).toBe(false);
  });
});

describe('high priority deals', () => {
  it('counts only High, and says EXPECTED close rather than closing', () => {
    const soon = new Date(Date.now() + 3 * 86_400_000).toISOString();
    const res = get('high-priority-deals').compute(data([
      deal({ stage: 'qualified', value: 100, priority: 'High', expected_close_date: soon }),
      deal({ stage: 'qualified', value: 900, priority: 'Medium' }),
    ]));
    expect(labels(res)).toContain('High priority: 1');
    // "Closing this week" would assert an actual close date, which no deal has.
    const joined = labels(res).join(' ');
    expect(joined).toContain('Expected close within 7 days');
    expect(joined).not.toMatch(/\bclosing\b/i);
  });

  it('is UNAVAILABLE when nothing is high priority', () => {
    const res = get('high-priority-deals').compute(data([deal({ priority: 'Medium' })]));
    expect(res.unavailable).toMatch(/no deals are marked high priority/i);
  });
});

describe('lead conversion funnel', () => {
  it('reads the STAGE vocabulary that leadsApi maps onto `status`', () => {
    const res = get('lead-funnel').compute(data([], {
      leads: [{ status: 'qualified' }, { status: 'won' }, { status: 'won' }, { status: 'lost' }],
      contactCount: 20,
    }));
    const l = labels(res);
    expect(l).toContain('Leads: 4');
    expect(l).toContain('Contacts: 20');
    expect(l).toContain('Qualified: 1');
    expect(l).toContain('Won: 2');
    // 2 won of 3 decided.
    expect(res.rows?.find(r => r.label === 'Conversion')?.value).toBe('67%');
  });

  it('says so rather than showing 0% when no lead has been decided', () => {
    const res = get('lead-funnel').compute(data([], { leads: [{ status: 'qualified' }] }));
    expect(res.rows?.find(r => r.label === 'Conversion')?.value).toMatch(/no leads decided/i);
  });
});

describe('date-filter honesty', () => {
  it('every date-filtered report carries the excluded-deal caveat', () => {
    const withExclusions = data([deal({ stage: 'won', value: 100, source: 'referral', priority: 'High' })], {
      dateFiltered: true, excludedNoCloseDate: 5,
    });
    const dateAware = REPORTS.filter(r => r.usesDateRange);
    expect(dateAware.length).toBeGreaterThan(0);
    for (const r of dateAware) {
      const res = r.compute(withExclusions);
      // Either it could not compute at all, or it admits what was excluded.
      if (!res.unavailable) {
        expect(res.caveat, `${r.id} hid 5 excluded deals`).toMatch(/no expected close date/i);
      }
    }
  });

  it('reports that ignore the date filter never claim to be date-filtered', () => {
    for (const r of REPORTS.filter(x => !x.usesDateRange)) {
      const res = r.compute(data([deal({ stage: 'qualified', created_at: new Date().toISOString() })], {
        dateFiltered: true, excludedNoCloseDate: 5,
      }));
      expect(res.caveat ?? '', r.id).not.toMatch(/excluded from this date range/i);
    }
  });
});

describe('dealsForReport — a report only receives the filters it declares', () => {
  const inRange  = deal({ id: 'in',  expected_close_date: '2026-09-15', assigned_to_user_id: 1, assigned_to: 'Alex' });
  const outRange = deal({ id: 'out', expected_close_date: '2027-09-15', assigned_to_user_id: 1, assigned_to: 'Alex' });
  const noDate   = deal({ id: 'none', expected_close_date: null, assigned_to_user_id: 2, assigned_to: 'Sam' });
  const all = [inRange, outRange, noDate];
  const bounds = { from: new Date('2026-09-01'), to: new Date('2026-09-30T23:59:59') };
  const ownerKeyOf = (d: typeof inRange) =>
    d.assigned_to_user_id != null ? `id:${d.assigned_to_user_id}` : `name:${d.assigned_to}`;

  it('applies the date range to a report that uses it', () => {
    const got = dealsForReport({ usesDateRange: true, usesOwner: false }, all,
      { bounds, ownerKey: 'all', ownerKeyOf });
    expect(got.map(d => d.id)).toEqual(['in']);
  });

  it('DOES NOT apply the date range to a report that does not use it', () => {
    /*
     * The bug this function exists to prevent. Aging Pipeline measures age from
     * creation, so a close-date range says nothing about it — yet every card
     * used to receive the filtered set and its totals moved from 22 deals /
     * $1.56M to 10 / $567K when a quarter was picked. It type-checked, and the
     * only symptom was a number that looked plausible.
     */
    const got = dealsForReport({ usesDateRange: false, usesOwner: false }, all,
      { bounds, ownerKey: 'all', ownerKeyOf });
    expect(got.map(d => d.id)).toEqual(['in', 'out', 'none']);
  });

  it('excludes a deal with NO close date from a date-filtered report', () => {
    const got = dealsForReport({ usesDateRange: true, usesOwner: false }, [noDate],
      { bounds, ownerKey: 'all', ownerKeyOf });
    // Excluded, not treated as in-range — and the count travels as a caveat.
    expect(got).toEqual([]);
  });

  it('treats an unparseable close date as missing rather than in-range', () => {
    const bad = deal({ id: 'bad', expected_close_date: 'not-a-date' });
    const got = dealsForReport({ usesDateRange: true, usesOwner: false }, [bad],
      { bounds, ownerKey: 'all', ownerKeyOf });
    expect(got).toEqual([]);
  });

  it('applies the owner filter only to a report that uses it', () => {
    const withOwner = dealsForReport({ usesDateRange: false, usesOwner: true }, all,
      { bounds: null, ownerKey: 'id:1', ownerKeyOf });
    expect(withOwner.map(d => d.id)).toEqual(['in', 'out']);

    const without = dealsForReport({ usesDateRange: false, usesOwner: false }, all,
      { bounds: null, ownerKey: 'id:1', ownerKeyOf });
    expect(without).toHaveLength(3);
  });

  it('every REPORT that declares usesDateRange:false is unaffected by a range', () => {
    for (const r of REPORTS.filter(x => !x.usesDateRange)) {
      const got = dealsForReport(r, all, { bounds, ownerKey: 'all', ownerKeyOf });
      expect(got, r.id).toHaveLength(all.length);
    }
  });
});
