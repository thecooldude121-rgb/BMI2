import type { AssignmentRule } from './types';

const STORAGE_KEY = 'bmi_assignment_rules';

function ts(): string { return new Date().toISOString(); }
function uid(): string { return Math.random().toString(36).slice(2, 11); }

const SEED_RULES: AssignmentRule[] = [
  {
    id: 'rule_exec_referral',
    name: 'Executive Referrals → Account Manager',
    description: 'Referrals from executive-level contacts get direct Account Manager attention with a follow-up call.',
    enabled: true,
    priority: 1,
    conditionGrouping: 'all',
    conditions: [
      { id: uid(), field: 'source', op: 'equals', value: 'Referral' },
      { id: uid(), field: 'persona', op: 'in', value: ['Executive'] },
    ],
    action: { mode: 'direct_user', userId: 'account_manager' },
    followUpTask: { enabled: true, type: 'call', dueInHours: 24, title: 'Welcome call — executive referral' },
    createdAt: ts(),
    updatedAt: ts(),
  },
  {
    id: 'rule_enterprise_web',
    name: 'Enterprise Website Leads → Senior SDR',
    description: 'High-score inbound web leads from large companies go to Sarah Johnson.',
    enabled: true,
    priority: 2,
    conditionGrouping: 'all',
    conditions: [
      { id: uid(), field: 'source', op: 'equals', value: 'Website' },
      { id: uid(), field: 'score', op: 'gte', value: 70 },
      { id: uid(), field: 'company_size', op: 'in', value: ['201-1000', '1001+'] },
    ],
    action: { mode: 'direct_user', userId: 'user2' },
    createdAt: ts(),
    updatedAt: ts(),
  },
  {
    id: 'rule_high_score',
    name: 'Hot Leads (Score ≥ 85) → Weighted SDR Team',
    description: 'Very high-scoring leads from any source are distributed across the SDR team with senior bias.',
    enabled: true,
    priority: 3,
    conditionGrouping: 'all',
    conditions: [
      { id: uid(), field: 'score', op: 'gte', value: 85 },
    ],
    action: {
      mode: 'weighted_round_robin',
      userIds: ['user1', 'user2', 'user3'],
      weights: { user1: 2, user2: 2, user3: 1 },
    },
    createdAt: ts(),
    updatedAt: ts(),
  },
  {
    id: 'rule_hrms',
    name: 'HRMS Leads → HR Partner Round Robin',
    description: 'All leads from HR/recruiting systems rotate between HR Partner and Mike Chen.',
    enabled: true,
    priority: 4,
    conditionGrouping: 'all',
    conditions: [
      { id: uid(), field: 'source', op: 'equals', value: 'HRMS' },
    ],
    action: { mode: 'round_robin', userIds: ['hr_partner', 'user3'] },
    createdAt: ts(),
    updatedAt: ts(),
  },
  {
    id: 'rule_apac',
    name: 'APAC Territory → Regional Queue',
    description: 'Leads from APAC are placed in the regional queue for manual claiming.',
    enabled: true,
    priority: 5,
    conditionGrouping: 'all',
    conditions: [
      { id: uid(), field: 'territory', op: 'in', value: ['APAC'] },
    ],
    action: { mode: 'queue', userIds: ['queue_unassigned'] },
    createdAt: ts(),
    updatedAt: ts(),
  },
  {
    id: 'rule_after_hours',
    name: 'After-Hours Leads → SDR Round Robin',
    description: 'Leads that arrive outside business hours are queued for the morning SDR round robin.',
    enabled: false,
    priority: 6,
    conditionGrouping: 'all',
    conditions: [
      {
        id: uid(),
        field: 'business_hours',
        op: 'equals',
        value: { startHour: 9, endHour: 18, days: [1, 2, 3, 4, 5], timezone: 'America/New_York' },
      },
    ],
    action: { mode: 'round_robin', userIds: ['sdr_team', 'user1', 'user2'] },
    createdAt: ts(),
    updatedAt: ts(),
  },
];

function load(): AssignmentRule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AssignmentRule[];
  } catch { /* ignore */ }
  return SEED_RULES.map(r => ({
    ...r,
    conditions: r.conditions.map(c => ({ ...c, id: uid() })),
  }));
}

function save(rules: AssignmentRule[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(rules)); } catch { /* ignore */ }
}

export function getRules(): AssignmentRule[] {
  return load();
}

export function upsertRule(rule: AssignmentRule): void {
  const list = load();
  const idx = list.findIndex(r => r.id === rule.id);
  const now = ts();
  const updated = { ...rule, updatedAt: now };
  if (idx >= 0) {
    list[idx] = updated;
  } else {
    list.push({ ...updated, createdAt: now, priority: list.length + 1 });
  }
  save(list);
}

export function deleteRule(id: string): void {
  const list = load().filter(r => r.id !== id);
  list.forEach((r, i) => { r.priority = i + 1; });
  save(list);
}

export function reorderRules(orderedIds: string[]): void {
  const map = new Map(load().map(r => [r.id, r]));
  const reordered = orderedIds.map((id, i) => {
    const rule = map.get(id);
    if (!rule) return null;
    return { ...rule, priority: i + 1, updatedAt: ts() };
  }).filter(Boolean) as AssignmentRule[];
  save(reordered);
}

export function toggleRule(id: string, enabled: boolean): void {
  const list = load();
  const rule = list.find(r => r.id === id);
  if (rule) { rule.enabled = enabled; rule.updatedAt = ts(); }
  save(list);
}

export function resetRulesToDefaults(): void {
  save(SEED_RULES.map(r => ({
    ...r,
    conditions: r.conditions.map(c => ({ ...c, id: uid() })),
  })));
}

export function createBlankRule(): AssignmentRule {
  return {
    id: uid(),
    name: '',
    description: '',
    enabled: true,
    priority: getRules().length + 1,
    conditionGrouping: 'all',
    conditions: [],
    action: { mode: 'direct_user' },
    createdAt: ts(),
    updatedAt: ts(),
  };
}

export function newConditionId(): string { return uid(); }
