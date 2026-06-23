import { describe, it, expect } from 'vitest';
import { evaluateCondition, applyAdvancedFilter } from './leadFilterEngine';
import type { Lead } from '../types/lead';
import type { FilterCondition, AdvancedFilter } from '../types/leadFilter';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const base: Lead = {
  id:                 '1',
  first_name:         'Alice',
  last_name:          'Smith',
  full_name:          'Alice Smith',
  email:              'alice@acme.com',
  phone:              '',
  company:            'Acme Corp',
  position:           'VP Sales',
  status:             'new',
  source:             'Website',
  score:              75,
  ai_score:           75,
  created_at:         new Date(Date.now() - 3 * 86_400_000).toISOString(), // 3 days ago
  last_contact_date:  null,
  next_follow_up_date:null,
  country:            'India',
  city:               'Mumbai',
  enriched_at:        null,
  notes:              '',
} as unknown as Lead;

const noDupes = new Set<string>();
const withDupes = new Set(['acme.com']);

function cond(overrides: Partial<FilterCondition>): FilterCondition {
  return {
    id:       'test',
    fieldId:  'status',
    operator: 'is',
    value:    null,
    ...overrides,
  };
}

// ── Enum tests ────────────────────────────────────────────────────────────────

describe('status — enum', () => {
  it('is: match', () => {
    expect(evaluateCondition(base, cond({ fieldId: 'status', operator: 'is', value: 'new' }), noDupes)).toBe(true);
  });
  it('is: no match', () => {
    expect(evaluateCondition(base, cond({ fieldId: 'status', operator: 'is', value: 'lost' }), noDupes)).toBe(false);
  });
  it('is_not', () => {
    expect(evaluateCondition(base, cond({ fieldId: 'status', operator: 'is_not', value: 'lost' }), noDupes)).toBe(true);
  });
  it('is_any_of: hit', () => {
    expect(evaluateCondition(base, cond({ fieldId: 'status', operator: 'is_any_of', value: ['new', 'contacted'] }), noDupes)).toBe(true);
  });
  it('is_none_of: hit', () => {
    expect(evaluateCondition(base, cond({ fieldId: 'status', operator: 'is_none_of', value: ['lost', 'converted'] }), noDupes)).toBe(true);
  });
});

// ── Numeric tests ─────────────────────────────────────────────────────────────

describe('score — numeric', () => {
  it('greater_than', () => {
    expect(evaluateCondition(base, cond({ fieldId: 'score', operator: 'greater_than', value: 70 }), noDupes)).toBe(true);
  });
  it('less_than', () => {
    expect(evaluateCondition(base, cond({ fieldId: 'score', operator: 'less_than', value: 70 }), noDupes)).toBe(false);
  });
  it('between: inside', () => {
    expect(evaluateCondition(base, cond({ fieldId: 'score', operator: 'between', value: [60, 80] }), noDupes)).toBe(true);
  });
  it('between: outside', () => {
    expect(evaluateCondition(base, cond({ fieldId: 'score', operator: 'between', value: [80, 100] }), noDupes)).toBe(false);
  });
});

// ── Date tests ────────────────────────────────────────────────────────────────

describe('lead_age — date', () => {
  it('within_last_n_days: 3-day-old lead matches within 5 days', () => {
    expect(evaluateCondition(base, cond({ fieldId: 'lead_age', operator: 'within_last_n_days', value: 5 }), noDupes)).toBe(true);
  });
  it('before_n_days_ago: 3-day-old does NOT exceed 10 days', () => {
    expect(evaluateCondition(base, cond({ fieldId: 'lead_age', operator: 'before_n_days_ago', value: 10 }), noDupes)).toBe(false);
  });
  it('date_is_empty: false for lead with created_at', () => {
    expect(evaluateCondition(base, cond({ fieldId: 'lead_age', operator: 'date_is_empty', value: null }), noDupes)).toBe(false);
  });
  it('date_is_empty: true when no last_contact_date', () => {
    expect(evaluateCondition(base, cond({ fieldId: 'last_contact_age', operator: 'date_is_empty', value: null }), noDupes)).toBe(true);
  });
});

// ── Text tests ────────────────────────────────────────────────────────────────

describe('company — text', () => {
  it('contains', () => {
    expect(evaluateCondition(base, cond({ fieldId: 'company', operator: 'contains', value: 'acme' }), noDupes)).toBe(true);
  });
  it('not_contains', () => {
    expect(evaluateCondition(base, cond({ fieldId: 'company', operator: 'not_contains', value: 'xyz' }), noDupes)).toBe(true);
  });
  it('starts_with: hit', () => {
    expect(evaluateCondition(base, cond({ fieldId: 'company', operator: 'starts_with', value: 'acme' }), noDupes)).toBe(true);
  });
  it('starts_with: miss', () => {
    expect(evaluateCondition(base, cond({ fieldId: 'company', operator: 'starts_with', value: 'corp' }), noDupes)).toBe(false);
  });
  it('text_is_empty: false', () => {
    expect(evaluateCondition(base, cond({ fieldId: 'company', operator: 'text_is_empty', value: null }), noDupes)).toBe(false);
  });
});

// ── Boolean tests ─────────────────────────────────────────────────────────────

describe('boolean fields', () => {
  it('enrichment_status is_false when enriched_at is null', () => {
    expect(evaluateCondition(base, cond({ fieldId: 'enrichment_status', operator: 'is_false', value: null }), noDupes)).toBe(true);
  });
  it('enrichment_status is_true when enriched_at is set', () => {
    const enriched = { ...base, enriched_at: new Date().toISOString() } as unknown as Lead;
    expect(evaluateCondition(enriched, cond({ fieldId: 'enrichment_status', operator: 'is_true', value: null }), noDupes)).toBe(true);
  });
  it('duplicate_risk is_true when domain in set', () => {
    expect(evaluateCondition(base, cond({ fieldId: 'duplicate_risk', operator: 'is_true', value: null }), withDupes)).toBe(true);
  });
  it('duplicate_risk is_false when domain not in set', () => {
    expect(evaluateCondition(base, cond({ fieldId: 'duplicate_risk', operator: 'is_false', value: null }), noDupes)).toBe(true);
  });
});

// ── applyAdvancedFilter ───────────────────────────────────────────────────────

describe('applyAdvancedFilter', () => {
  it('empty filter returns all leads', () => {
    const filter: AdvancedFilter = { groups: [] };
    expect(applyAdvancedFilter([base], filter, noDupes)).toHaveLength(1);
  });

  it('single group AND: both conditions must match', () => {
    const filter: AdvancedFilter = {
      groups: [{
        id: 'g1', name: 'G1', logic: 'AND',
        conditions: [
          cond({ id: 'c1', fieldId: 'status', operator: 'is', value: 'new' }),
          cond({ id: 'c2', fieldId: 'score',  operator: 'greater_than', value: 80 }),
        ],
      }],
    };
    // score is 75, not > 80 → no match
    expect(applyAdvancedFilter([base], filter, noDupes)).toHaveLength(0);
  });

  it('single group OR: either condition matches', () => {
    const filter: AdvancedFilter = {
      groups: [{
        id: 'g1', name: 'G1', logic: 'OR',
        conditions: [
          cond({ id: 'c1', fieldId: 'status', operator: 'is', value: 'lost' }),
          cond({ id: 'c2', fieldId: 'score',  operator: 'greater_than', value: 70 }),
        ],
      }],
    };
    // status is not lost but score 75 > 70 → match
    expect(applyAdvancedFilter([base], filter, noDupes)).toHaveLength(1);
  });

  it('empty group is a no-op (skipped)', () => {
    const filter: AdvancedFilter = {
      groups: [{ id: 'g1', name: 'G1', logic: 'AND', conditions: [] }],
    };
    expect(applyAdvancedFilter([base], filter, noDupes)).toHaveLength(1);
  });
});
