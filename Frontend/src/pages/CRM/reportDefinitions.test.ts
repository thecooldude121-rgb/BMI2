import { describe, it, expect } from 'vitest';
import { REPORTS, ReportData, ReportDef, usd } from './reportDefinitions';
import type { DealsReport } from '../../utils/dealsApi';

/**
 * The report cards, tested WITHOUT A RENDER (slice 5b: they FORMAT the
 * server's totals now; the grouping, filtering and stage resolution they used
 * to do in the browser are pinned server-side in roundTrip.dealsReport).
 *
 * WHAT THESE PIN:
 *  1. NOTHING IS EVER 0 WHEN IT IS UNKNOWN — unavailable, never 0% / $0.
 *  2. NO ROW IS SILENTLY DROPPED — no source, unmatched owner, no created date,
 *     no close date each get a labelled row or caveat.
 *  3. MONEY IS USD ONLY, the rest stated as "not in USD".
 *  4. THE FUNNEL'S CONVERSION COUNTS CONVERTED LEADS (decided 2026-10-12).
 */

const t = (count: number, value_usd: number, unconverted = 0) => ({ count, value_usd, unconverted });

const EMPTY: DealsReport = {
  as_of: '2031-03-15', filters: { close_from: null, close_to: null, owner: null },
  excluded_no_close_date: 0, owners: [], won_by_owner: [], open_by_owner: [], outcome: { won: 0, lost: 0 },
  open_by_stage: [], aging: [], won_by_source: [],
  high_priority: { all: t(0, 0), open: t(0, 0), closing_7d: 0, open_no_close: 0 },
};

function data(report: Partial<DealsReport> = {}, over: Partial<ReportData> = {}): ReportData {
  return { report: { ...EMPTY, ...report }, leadsTotal: 0, leadsByStage: {}, contactCount: 0, dateFiltered: false, ...over };
}
const get = (id: string): ReportDef => {
  const r = REPORTS.find(x => x.id === id);
  if (!r) throw new Error(`no such report: ${id}`);
  return r;
};
const rows = (res: { rows?: Array<{ label: string; value: string }> }) => (res.rows ?? []).map(r => `${r.label} = ${r.value}`);

describe('the catalogue', () => {
  it('eight reports, unique ids, and each survives an empty workspace with a reason', () => {
    expect(REPORTS).toHaveLength(8);
    expect(new Set(REPORTS.map(r => r.id)).size).toBe(8);
    for (const r of REPORTS) {
      const res = r.compute(data());
      expect(Boolean(res.unavailable) || (res.rows ?? []).length > 0, r.id).toBe(true);
      expect(JSON.stringify(res), r.id).not.toMatch(/\$0\b|: 0%/);
    }
  });

  it('only Aging and the funnel ignore the close-date range (mirrors the server)', () => {
    expect(REPORTS.filter(r => !r.usesDateRange).map(r => r.id).sort()).toEqual(['aging-pipeline', 'lead-funnel']);
  });
});

describe('money', () => {
  it('shows USD, and names the deals with no USD amount instead of adding them', () => {
    expect(usd(t(3, 12_000))).toBe('$12K');
    expect(usd(t(3, 12_000, 2))).toBe('$12K + 2 not in USD');
  });
});

describe('win/loss', () => {
  it('is UNAVAILABLE with nothing decided — never 0%', () => {
    expect(get('win-loss').compute(data()).unavailable).toMatch(/no deals have closed/i);
  });
  it('divides by DECIDED deals', () => {
    const res = get('win-loss').compute(data({ outcome: { won: 1, lost: 3 } }));
    expect(rows(res)).toEqual(['Won: 1 = 25%', 'Lost: 3 = 75%', 'Of decided deals = 4']);
  });
});

describe('owners', () => {
  const owners = [
    { key: 'id:5', label: 'Dee Admin', unresolved: false, ...t(2, 3000) },
    { key: 'name:John Smith', label: 'John Smith', unresolved: true, ...t(1, 1000) },
    { key: 'name:Unassigned', label: 'Unassigned', unresolved: true, ...t(1, 0, 1) },
  ];
  it('sales by rep: an unmatched name keeps its own row; share is of USD won', () => {
    const res = get('sales-by-rep').compute(data({ won_by_owner: owners }));
    expect(rows(res)).toEqual([
      'Dee Admin: 2 = $3K · 75%',
      'John Smith (unmatched name): 1 = $1K · 25%',
      'Unassigned: 1 = $0 + 1 not in USD · 0%',
    ]);
    expect(res.rows![1].muted).toBe(true);
  });
  it('pipeline by owner formats open totals the same way', () => {
    const res = get('pipeline-by-owner').compute(data({ open_by_owner: owners.slice(0, 1) }));
    expect(rows(res)).toEqual(['Dee Admin: 2 = $3K']);
    expect(get('pipeline-by-owner').compute(data()).unavailable).toBeDefined();
  });
});

describe('pipeline health', () => {
  const stage = (pipeline_id: string, pipeline_name: string, name: string, n: number, v: number, u = 0) =>
    ({ pipeline_id, pipeline_name, stage_id: `${pipeline_id}-${name}`, name, position: 1, ...t(n, v, u) });
  it('totals the open stages; one pipeline needs no prefix', () => {
    const res = get('pipeline-health').compute(data({ open_by_stage: [stage('nb', 'New business', 'Qualified', 2, 2000), stage('nb', 'New business', 'Proposal', 1, 500, 1)] }));
    expect(rows(res)).toEqual(['Total open: 3 = $3K + 1 not in USD', 'Qualified: 2 = $2K', 'Proposal: 1 = $500 + 1 not in USD']);
  });
  it('names each stage by its pipeline when several have open deals, so two "Qualified" never merge', () => {
    const res = get('pipeline-health').compute(data({ open_by_stage: [stage('nb', 'New business', 'Qualified', 1, 100), stage('rn', 'Renewals', 'Qualified', 1, 200)] }));
    expect(rows(res).slice(1)).toEqual(['New business · Qualified: 1 = $100', 'Renewals · Qualified: 1 = $200']);
  });
});

describe('aging pipeline', () => {
  it('buckets in age order, reports undated deals, and always states the approximation', () => {
    const res = get('aging-pipeline').compute(data({ aging: [
      { bucket: 'over-90', ...t(1, 300) }, { bucket: 'under-30', ...t(2, 900) }, { bucket: 'undated', ...t(1, 0) },
    ] }));
    expect(rows(res)).toEqual(['Under 30 days: 2 = $900', 'Over 90 days: 1 = $300', 'No created date: 1 = —']);
    expect(res.caveat).toMatch(/created/);
  });
});

describe('revenue by source', () => {
  it('gives NO SOURCE its own muted row, never dropped', () => {
    const res = get('revenue-by-source').compute(data({ won_by_source: [{ source: 'referral', ...t(2, 3000) }, { source: null, ...t(1, 1000) }] }));
    expect(rows(res)).toEqual(['referral: 2 = $3K · 75%', 'No source recorded: 1 = $1K · 25%']);
    expect(res.rows![1].muted).toBe(true);
  });
});

describe('high priority deals', () => {
  it('says EXPECTED close, and states open deals with no close date', () => {
    const res = get('high-priority-deals').compute(data({ high_priority: { all: t(3, 1500), open: t(2, 1200), closing_7d: 1, open_no_close: 1 } }));
    expect(rows(res)).toEqual([
      'High priority: 3 = $2K', 'Still open: 2 = $1K', 'Expected close within the next 7 days = 1', 'No expected close date: 1 = —',
    ]);
  });
});

describe('lead conversion funnel', () => {
  it('Conversion counts CONVERTED leads: (won + converted) / (won + converted + lost)', () => {
    const res = get('lead-funnel').compute(data({}, {
      leadsTotal: 20, contactCount: 9,
      leadsByStage: { qualified: 3, won: 2, converted: 4, lost: 2, disqualified: 5 },
    }));
    expect(rows(res)).toEqual([
      'Leads: 20 = ', 'Contacts: 9 = ', 'Qualified: 3 = ', 'Converted: 4 = ', 'Won: 2 = ', 'Lost: 2 = ',
      'Disqualified: 5 = ', 'Conversion = 75% (6 of 8)',
    ]);
  });
  it('with nothing decided says so, never 0%; an unknown contact total is not 0', () => {
    const res = get('lead-funnel').compute(data({}, { leadsTotal: 4, leadsByStage: { new: 4 }, contactCount: null }));
    expect(rows(res)).toContain('Contacts: unknown = ');
    expect(rows(res)).toContain('Conversion = No leads decided yet');
  });
});

describe('date-filter honesty', () => {
  it('a date-filtered card carries the excluded-deal caveat; an unfiltered one never does', () => {
    const report = { outcome: { won: 1, lost: 1 }, excluded_no_close_date: 3 };
    expect(get('win-loss').compute(data(report, { dateFiltered: true })).caveat).toMatch(/3 deals have no expected close date/);
    expect(get('win-loss').compute(data(report, { dateFiltered: false })).caveat).toBeUndefined();
  });
});
