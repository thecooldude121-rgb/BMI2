import { describe, it, expect } from 'vitest';
import { evaluateAssignmentRules } from './evaluationEngine';
import type { AssignmentRule, RuleCondition } from './types';
import { makeLead } from '../../__tests__/fixtures/leadFixtures';

// ── Helpers ────────────────────────────────────────────────────────────────────

function cond(
  field: RuleCondition['field'],
  op: RuleCondition['op'],
  value: unknown,
  id = 'c1',
): RuleCondition {
  return { id, field, op, value };
}

function rule(overrides: Partial<AssignmentRule> & { conditions: RuleCondition[] }): AssignmentRule {
  return {
    id: 'r1',
    name: 'Test Rule',
    description: '',
    enabled: true,
    priority: 1,
    conditionGrouping: 'all',
    action: { mode: 'direct_user', userId: 'user-99' },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const NO_TERRITORIES: [] = [];
const FIXED_NOW = new Date('2026-06-10T10:00:00.000Z'); // Tuesday, 10:00 UTC

// ── source field ───────────────────────────────────────────────────────────────

describe('evaluateAssignmentRules — source field', () => {
  it('source equals → matched, assigned to direct_user', () => {
    const lead = makeLead({ source: 'referral' });
    const rules = [rule({ conditions: [cond('source', 'equals', 'referral')] })];
    const result = evaluateAssignmentRules(lead, { rules, territories: NO_TERRITORIES, now: FIXED_NOW });
    expect(result.matched).toBe(true);
    expect(result.assignedUserId).toBe('user-99');
    expect(result.mode).toBe('direct_user');
  });

  it('source equals → no match when source differs', () => {
    const lead = makeLead({ source: 'website' });
    const rules = [rule({ conditions: [cond('source', 'equals', 'referral')] })];
    const result = evaluateAssignmentRules(lead, { rules, territories: NO_TERRITORIES, now: FIXED_NOW });
    expect(result.matched).toBe(false);
  });

  it('source not_equals → matched when source differs', () => {
    const lead = makeLead({ source: 'website' });
    const rules = [rule({ conditions: [cond('source', 'not_equals', 'cold_email')] })];
    const result = evaluateAssignmentRules(lead, { rules, territories: NO_TERRITORIES, now: FIXED_NOW });
    expect(result.matched).toBe(true);
  });

  it('source in → matched when source is in list', () => {
    const lead = makeLead({ source: 'partner' });
    const rules = [rule({ conditions: [cond('source', 'in', ['referral', 'partner'])] })];
    const result = evaluateAssignmentRules(lead, { rules, territories: NO_TERRITORIES, now: FIXED_NOW });
    expect(result.matched).toBe(true);
  });

  it('source not_in → matched when source is not in excluded list', () => {
    const lead = makeLead({ source: 'website' });
    const rules = [rule({ conditions: [cond('source', 'not_in', ['cold_email', 'spam'])] })];
    const result = evaluateAssignmentRules(lead, { rules, territories: NO_TERRITORIES, now: FIXED_NOW });
    expect(result.matched).toBe(true);
  });
});

// ── score field ────────────────────────────────────────────────────────────────

describe('evaluateAssignmentRules — score field', () => {
  it('score gte → matched when lead score meets threshold', () => {
    const lead = makeLead({ score: 80 });
    const rules = [rule({ conditions: [cond('score', 'gte', 75)] })];
    const result = evaluateAssignmentRules(lead, { rules, territories: NO_TERRITORIES, now: FIXED_NOW });
    expect(result.matched).toBe(true);
  });

  it('score gte → not matched when score below threshold', () => {
    const lead = makeLead({ score: 60 });
    const rules = [rule({ conditions: [cond('score', 'gte', 75)] })];
    const result = evaluateAssignmentRules(lead, { rules, territories: NO_TERRITORIES, now: FIXED_NOW });
    expect(result.matched).toBe(false);
  });

  it('score lte → matched when lead score is at or below limit', () => {
    const lead = makeLead({ score: 40 });
    const rules = [rule({ conditions: [cond('score', 'lte', 50)] })];
    const result = evaluateAssignmentRules(lead, { rules, territories: NO_TERRITORIES, now: FIXED_NOW });
    expect(result.matched).toBe(true);
  });

  it('score between → matched when score in range', () => {
    const lead = makeLead({ score: 60 });
    const rules = [rule({ conditions: [cond('score', 'between', [50, 75])] })];
    const result = evaluateAssignmentRules(lead, { rules, territories: NO_TERRITORIES, now: FIXED_NOW });
    expect(result.matched).toBe(true);
  });

  it('score between → not matched outside range', () => {
    const lead = makeLead({ score: 80 });
    const rules = [rule({ conditions: [cond('score', 'between', [50, 75])] })];
    const result = evaluateAssignmentRules(lead, { rules, territories: NO_TERRITORIES, now: FIXED_NOW });
    expect(result.matched).toBe(false);
  });

  it('falls back to ai_score when score is undefined (Partial<Lead>)', () => {
    // evaluateAssignmentRules accepts Partial<Lead>; when score is absent, ai_score is used
    const lead: Parameters<typeof evaluateAssignmentRules>[0] = { ai_score: 80 };
    const rules = [rule({ conditions: [cond('score', 'gte', 75)] })];
    const result = evaluateAssignmentRules(lead, { rules, territories: NO_TERRITORIES, now: FIXED_NOW });
    expect(result.matched).toBe(true);
  });
});

// ── tags field ─────────────────────────────────────────────────────────────────

describe('evaluateAssignmentRules — tags field', () => {
  it('tags contains → matched when tag present (case-insensitive)', () => {
    const lead = makeLead({ tags: ['Enterprise', 'High-Value'] });
    const rules = [rule({ conditions: [cond('tags', 'contains', 'enterprise')] })];
    const result = evaluateAssignmentRules(lead, { rules, territories: NO_TERRITORIES, now: FIXED_NOW });
    expect(result.matched).toBe(true);
  });

  it('tags not_contains → matched when tag absent', () => {
    const lead = makeLead({ tags: ['smb'] });
    const rules = [rule({ conditions: [cond('tags', 'not_contains', 'enterprise')] })];
    const result = evaluateAssignmentRules(lead, { rules, territories: NO_TERRITORIES, now: FIXED_NOW });
    expect(result.matched).toBe(true);
  });

  it('tags not_contains → not matched when tag present', () => {
    const lead = makeLead({ tags: ['enterprise'] });
    const rules = [rule({ conditions: [cond('tags', 'not_contains', 'enterprise')] })];
    const result = evaluateAssignmentRules(lead, { rules, territories: NO_TERRITORIES, now: FIXED_NOW });
    expect(result.matched).toBe(false);
  });
});

// ── conditionGrouping ──────────────────────────────────────────────────────────

describe('evaluateAssignmentRules — conditionGrouping', () => {
  it('grouping "all" requires all conditions to pass', () => {
    const lead = makeLead({ source: 'referral', score: 50 });
    const rules = [rule({
      conditionGrouping: 'all',
      conditions: [
        cond('source', 'equals', 'referral', 'c1'),
        cond('score', 'gte', 75, 'c2'),           // fails
      ],
    })];
    expect(evaluateAssignmentRules(lead, { rules, territories: NO_TERRITORIES, now: FIXED_NOW }).matched).toBe(false);
  });

  it('grouping "any" requires at least one condition to pass', () => {
    const lead = makeLead({ source: 'referral', score: 50 });
    const rules = [rule({
      conditionGrouping: 'any',
      conditions: [
        cond('source', 'equals', 'referral', 'c1'), // passes
        cond('score', 'gte', 75, 'c2'),              // fails
      ],
    })];
    expect(evaluateAssignmentRules(lead, { rules, territories: NO_TERRITORIES, now: FIXED_NOW }).matched).toBe(true);
  });
});

// ── rule priority ──────────────────────────────────────────────────────────────

describe('evaluateAssignmentRules — rule priority', () => {
  it('first matching rule wins', () => {
    const lead = makeLead({ source: 'referral', score: 90 });
    const rules = [
      rule({ id: 'r1', name: 'First', conditions: [cond('score', 'gte', 80)], action: { mode: 'direct_user', userId: 'user-A' } }),
      rule({ id: 'r2', name: 'Second', conditions: [cond('source', 'equals', 'referral')], action: { mode: 'direct_user', userId: 'user-B' } }),
    ];
    const result = evaluateAssignmentRules(lead, { rules, territories: NO_TERRITORIES, now: FIXED_NOW });
    expect(result.assignedUserId).toBe('user-A');
    expect(result.ruleId).toBe('r1');
  });

  it('disabled rules are skipped', () => {
    const lead = makeLead({ source: 'referral' });
    const rules = [
      rule({ id: 'r1', enabled: false, conditions: [cond('source', 'equals', 'referral')], action: { mode: 'direct_user', userId: 'user-A' } }),
      rule({ id: 'r2', enabled: true,  conditions: [cond('source', 'equals', 'referral')], action: { mode: 'direct_user', userId: 'user-B' } }),
    ];
    const result = evaluateAssignmentRules(lead, { rules, territories: NO_TERRITORIES, now: FIXED_NOW });
    expect(result.assignedUserId).toBe('user-B');
  });
});

// ── trace ─────────────────────────────────────────────────────────────────────

describe('evaluateAssignmentRules — trace', () => {
  it('trace includes an entry for each rule evaluated', () => {
    const lead = makeLead({ source: 'referral' });
    const rules = [
      rule({ id: 'r1', conditions: [cond('source', 'equals', 'other')], action: { mode: 'direct_user', userId: 'user-A' } }),
      rule({ id: 'r2', conditions: [cond('source', 'equals', 'referral')], action: { mode: 'direct_user', userId: 'user-B' } }),
    ];
    const result = evaluateAssignmentRules(lead, { rules, territories: NO_TERRITORIES, now: FIXED_NOW });
    expect(result.trace).toHaveLength(2);
    expect(result.trace[0].matched).toBe(false);
    expect(result.trace[1].matched).toBe(true);
  });
});

// ── fallback ──────────────────────────────────────────────────────────────────

describe('evaluateAssignmentRules — fallback', () => {
  it('returns matched=false and null userId when no rules match and no source routing', () => {
    const lead = makeLead({ source: 'unknown_xyzzy' });
    const result = evaluateAssignmentRules(lead, { rules: [], territories: NO_TERRITORIES, now: FIXED_NOW });
    expect(result.matched).toBe(false);
    expect(result.assignedUserId).toBeNull();
  });
});
