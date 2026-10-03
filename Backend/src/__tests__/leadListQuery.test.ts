import { describe, it, expect } from 'vitest';
import { buildLeadListQuery, FilterError } from '../utils/leadListQuery';

/**
 * The lead-list SQL builder (step 5 slice A). Pure: these pin that request
 * values never reach the SQL text, and that anything unrecognised is REFUSED
 * rather than silently dropped (an ignored filter returns a list that looks
 * filtered and is not).
 */
const T = '00000000-0000-0000-0000-000000000001';
const adv = (conditions: unknown[], logic = 'AND') => JSON.stringify({ groups: [{ id: 'g', name: 'g', logic, conditions }] });

describe('buildLeadListQuery', () => {
  it('always scopes to the tenant as $1', () => {
    const q = buildLeadListQuery(T, {});
    expect(q.where.startsWith('l.tenant_id = $1')).toBe(true);
    expect(q.params[0]).toBe(T);
  });

  it('never interpolates request values into the SQL — search, source and filter values are parameters', () => {
    const evil = "x'; DROP TABLE leads; --";
    const q = buildLeadListQuery(T, {
      search: evil, source: evil,
      filter: adv([{ fieldId: 'company', operator: 'contains', value: evil }]),
    });
    expect(q.where).not.toContain('DROP TABLE');
    expect(q.params.filter(v => typeof v === 'string' && v.includes('DROP TABLE'))).toHaveLength(3);
  });

  it('escapes LIKE wildcards so "%" and "_" match literally', () => {
    const q = buildLeadListQuery(T, { search: '50%_off' });
    expect(q.params).toContain('%50\\%\\_off%');
  });

  it('mirrors the client status migration: attempting_contact includes DB "contacted"', () => {
    const q = buildLeadListQuery(T, { status: 'attempting_contact' });
    expect(q.where).toContain(`l.stage IN ('attempting_contact', 'contacted')`);
  });

  it('expands a chip group into its statuses', () => {
    const q = buildLeadListQuery(T, { status: '__qualified__' });
    expect(q.params).toEqual([T, 'qualified', 'sales_accepted']);
  });

  it('combines advanced-filter groups with AND and conditions with the group logic', () => {
    const f = JSON.stringify({ groups: [
      { id: 'a', name: 'a', logic: 'OR', conditions: [
        { fieldId: 'score', operator: 'greater_than', value: 80 },
        { fieldId: 'source', operator: 'is', value: 'Website' },
      ] },
      { id: 'b', name: 'b', logic: 'AND', conditions: [{ fieldId: 'company', operator: 'text_is_empty', value: null }] },
    ] });
    const q = buildLeadListQuery(T, { filter: f });
    expect(q.where).toMatch(/\(coalesce\(l\.score, 0\) > \$2 OR coalesce\(l\.source, ''\) = \$3\) AND \(btrim\(coalesce\(l\.company, ''\)\) = ''\)/);
  });

  it.each([
    ['a field with no column', adv([{ fieldId: 'sla_stale', operator: 'is', value: 'breached' }]), /sla_stale is not available yet/],
    ['an unknown operator', adv([{ fieldId: 'score', operator: 'regex', value: 1 }]), /not supported/],
    ['bad JSON', '{nope', /valid JSON/],
    ['a bad group logic', adv([{ fieldId: 'score', operator: 'equals', value: 1 }], 'XOR'), /AND or OR/],
    ['a non-numeric score', adv([{ fieldId: 'score', operator: 'equals', value: 'high' }]), /needs a number/],
  ])('REFUSES %s rather than ignoring it', (_label, filter, msg) => {
    expect(() => buildLeadListQuery(T, { filter })).toThrow(FilterError);
    expect(() => buildLeadListQuery(T, { filter })).toThrow(msg);
  });

  it('refuses a sort that is not real SQL yet, and an unknown insight', () => {
    expect(() => buildLeadListQuery(T, { sort: 'priority' })).toThrow(/not available yet/);
    expect(() => buildLeadListQuery(T, { insight: 'slaBreach' })).toThrow(/not available yet/);
  });

  it('every SQL sort ends in the id, so pages are stable', () => {
    for (const s of ['newest', 'oldest', 'score_high_low', 'score_low_high', 'recently_active']) {
      expect(buildLeadListQuery(T, { sort: s }).orderBy).toMatch(/l\.id (ASC|DESC)$/);
    }
  });
});
