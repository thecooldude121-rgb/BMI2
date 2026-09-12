import { describe, it, expect } from 'vitest';
import { groupActivities, groupingCoverage } from './activityGrouping';
import type { ActivityRecord } from './activitiesApi';

/**
 * `activities` is 0 rows in every tenant of the live database, so these fixtures
 * are the ONLY place this behaviour is provable. That is stated in the module
 * doc and repeated here: a live check of the three grouped views can confirm
 * they render and that their empty states are right, and nothing more.
 */
const rec = (over: Partial<ActivityRecord> = {}): ActivityRecord => ({
  id: 'A1', subject: 's', type: 'call', direction: null, status: null, priority: null,
  description: null, outcome: null, duration: null, scheduled_at: null, completed_at: null,
  created_by: null, assigned_to: 'David Kumar', created_at: '2026-09-01T00:00:00Z',
  updated_at: null, lead_id: null, deal_id: null, contact_id: null, company_id: null,
  ...over,
});

describe('groupActivities', () => {
  it('buckets only the values present, never the whole vocabulary', () => {
    const records = [rec({ type: 'call' }), rec({ type: 'email' }), rec({ type: 'call' })];
    const groups = groupActivities('type', records, ['a', 'b', 'c']);

    // ACTIVITY_TYPES has twelve entries. Two were used, so two buckets.
    expect(groups.map(g => g.label)).toEqual(['call', 'email']);
    expect(groups.map(g => g.items.length)).toEqual([2, 1]);
  });

  it('orders by count descending, then label A-Z for ties', () => {
    const records = [
      rec({ type: 'note' }), rec({ type: 'note' }), rec({ type: 'note' }),
      rec({ type: 'email' }), rec({ type: 'call' }),
    ];
    const groups = groupActivities('type', records, [1, 2, 3, 4, 5]);
    expect(groups.map(g => `${g.label}:${g.items.length}`)).toEqual(['note:3', 'call:1', 'email:1']);
  });

  it('gives absence its own labelled bucket instead of dropping the rows', () => {
    const records = [rec({ type: 'call' }), rec({ type: null }), rec({ type: null })];
    const groups = groupActivities('type', records, ['a', 'b', 'c']);

    const absent = groups.find(g => g.isUnattributed);
    expect(absent?.label).toBe('No type recorded');
    expect(absent?.items).toEqual(['b', 'c']);
    // Every row is accounted for — the group counts must agree with the input.
    expect(groups.reduce((n, g) => n + g.items.length, 0)).toBe(3);
  });

  it('sorts the unattributed bucket LAST even when it is the largest', () => {
    const records = [rec({ type: 'call' }), rec({ type: null }), rec({ type: null }), rec({ type: null })];
    const groups = groupActivities('type', records, [1, 2, 3, 4]);
    expect(groups[groups.length - 1]?.isUnattributed).toBe(true);
    expect(groups[groups.length - 1]?.items.length).toBe(3);
  });

  it('does not file an untyped activity under the display model\'s fallback', () => {
    // ActivitiesPage maps `type: (r.type ?? 'note')`. Grouping on that would put
    // this row in a "note" bucket and report a type nobody chose.
    const groups = groupActivities('type', [rec({ type: null })], ['a']);
    expect(groups.map(g => g.label)).toEqual(['No type recorded']);
    expect(groups.some(g => g.label === 'note')).toBe(false);
  });

  it('groups owners by name and labels the absent one Unassigned', () => {
    const records = [
      rec({ assigned_to: 'David Kumar' }), rec({ assigned_to: 'John Smith' }),
      rec({ assigned_to: '   ' }), rec({ assigned_to: null }),
    ];
    const groups = groupActivities('owner', records, [1, 2, 3, 4]);
    expect(groups.map(g => g.label)).toEqual(['David Kumar', 'John Smith', 'Unassigned']);
    // Whitespace is absence, not a person named "   ".
    expect(groups[groups.length - 1]?.items).toEqual([3, 4]);
  });

  it('keys accounts on company_id, so a shared display name is NOT one bucket', () => {
    const records = [
      rec({ company_id: 'C001', company_name: 'Acme Ltd' }),
      rec({ company_id: 'C002', company_name: 'Acme Ltd' }),
    ];
    const groups = groupActivities('account', records, ['a', 'b']);

    // This is the defect migration 043 removed from forecast_snapshots: two
    // records sharing a display name must not collapse into one identity.
    expect(groups).toHaveLength(2);
    expect(groups.map(g => g.key).sort()).toEqual(['account:C001', 'account:C002']);
    // …and the LABELS must disambiguate, or the page shows "Acme Ltd" twice and
    // reads as a rendering bug. Found in the live render, not in this test.
    expect(groups.map(g => g.label).sort()).toEqual(['Acme Ltd (C001)', 'Acme Ltd (C002)']);
  });

  it('does NOT append an id when the account name is unique', () => {
    const records = [
      rec({ company_id: 'C001', company_name: 'Acme Ltd' }),
      rec({ company_id: 'C002', company_name: 'Globex' }),
    ];
    const groups = groupActivities('account', records, ['a', 'b']);
    expect(groups.map(g => g.label).sort()).toEqual(['Acme Ltd', 'Globex']);
  });

  it('falls back to the id when an account has no name, rather than showing blank', () => {
    const groups = groupActivities('account', [rec({ company_id: 'C009', company_name: null })], ['a']);
    expect(groups[0].label).toBe('C009');
  });

  it('puts an activity with no company in No account linked, never rolled up by name', () => {
    const records = [
      rec({ deal_id: 'D052', deal_name: 'TechCorp Inc – Enterprise Plan', company_id: null }),
      rec({ company_id: 'C001', company_name: 'Acme Ltd' }),
    ];
    const groups = groupActivities('account', records, ['deal-activity', 'company-activity']);

    expect(groups.map(g => g.label)).toEqual(['Acme Ltd', 'No account linked']);
    expect(groups[groups.length - 1]?.items).toEqual(['deal-activity']);
  });

  it('returns no groups at all for an empty set — the live case today', () => {
    expect(groupActivities('type', [], [])).toEqual([]);
    expect(groupActivities('owner', [], [])).toEqual([]);
    expect(groupActivities('account', [], [])).toEqual([]);
  });

  it('skips a record with no paired item rather than mis-pairing', () => {
    const records = [rec({ type: 'call' }), rec({ type: 'email' })];
    const groups = groupActivities('type', records, ['only-one']);
    expect(groups.map(g => g.label)).toEqual(['call']);
    expect(groups[0].items).toEqual(['only-one']);
  });
});

describe('groupingCoverage', () => {
  it('reports what a grouping could and could not attribute', () => {
    const records = [
      rec({ company_id: 'C001', company_name: 'Acme Ltd' }),
      rec({ company_id: 'C001', company_name: 'Acme Ltd' }),
      rec({ company_id: null }),
      rec({ company_id: null }),
      rec({ company_id: null }),
    ];
    const groups = groupActivities('account', records, [1, 2, 3, 4, 5]);
    expect(groupingCoverage(groups)).toEqual({ attributed: 2, unattributed: 3, total: 5, buckets: 1 });
  });

  it('counts zero without dividing by it', () => {
    expect(groupingCoverage(groupActivities('type', [], []))).toEqual({
      attributed: 0, unattributed: 0, total: 0, buckets: 0,
    });
  });
});
