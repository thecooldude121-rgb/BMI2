import { describe, it, expect, beforeEach } from 'vitest';
import { getRules, resetRulesToDefaults } from './rulesStore';

/**
 * The fabricated seed rules (removed 2026-10-03) were SAVED into localStorage
 * by any browser that loaded them. These tests pin that the next read strips
 * them automatically — no "reset to defaults" click required — while a rule
 * the user created survives.
 */
const KEY = 'bmi_assignment_rules';

const rule = (id: string, priority: number) => ({
  id, name: id, description: '', enabled: true, priority,
  conditionGrouping: 'all', conditions: [],
  action: { mode: 'direct_user', userId: 'someone' },
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
});

describe('rulesStore — retired seed rules', () => {
  beforeEach(() => localStorage.clear());

  it('a fresh browser gets an empty list, not invented rules', () => {
    expect(getRules()).toEqual([]);
  });

  it('strips every old seed rule from a stale cache on load, and writes the cleaned list back', () => {
    const stale = [
      'rule_exec_referral', 'rule_enterprise_web', 'rule_high_score',
      'rule_hrms', 'rule_apac', 'rule_after_hours',
    ].map((id, i) => rule(id, i + 1));
    localStorage.setItem(KEY, JSON.stringify(stale));

    expect(getRules()).toEqual([]);
    // Persisted, not just filtered in memory: the cache itself is clean now.
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual([]);
  });

  it('keeps a rule the user created, and renumbers priority after the strip', () => {
    localStorage.setItem(KEY, JSON.stringify([
      rule('rule_exec_referral', 1),
      rule('k3j9x2abc', 2),          // user-created ids are generated
      rule('rule_hrms', 3),
    ]));

    const rules = getRules();
    expect(rules.map(r => r.id)).toEqual(['k3j9x2abc']);
    expect(rules[0].priority).toBe(1);
  });

  it('"reset to defaults" resets to empty', () => {
    localStorage.setItem(KEY, JSON.stringify([rule('k3j9x2abc', 1)]));
    resetRulesToDefaults();
    expect(getRules()).toEqual([]);
  });
});
