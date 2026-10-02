import type { AssignmentRule } from './types';

const STORAGE_KEY = 'bmi_assignment_rules';

function ts(): string { return new Date().toISOString(); }
function uid(): string { return Math.random().toString(36).slice(2, 11); }

/**
 * EMPTY ON PURPOSE (2026-10-03). Five seeded rules used to ship as this
 * workspace's routing configuration, naming invented people ("Sarah Johnson",
 * "Mike Chen") and an "HR Partner" queue. A first-time visitor saw them as
 * rules their admin had set up. An honest empty list beats an invented one.
 * Rules are still browser-local (localStorage) — there is no server-side
 * assignment-rules table — so a browser that loaded the old seed had it SAVED
 * there. load() strips those rules by id on the next read and writes the
 * cleaned list back, so nobody has to click "reset to defaults" to be rid of
 * them. Rules a user created have generated ids and are kept.
 */
const SEED_RULES: AssignmentRule[] = [];

/**
 * Ids of the fabricated seed rules shipped before 2026-10-03. They are
 * removed even if a user edited one (upsert keeps the id): every one of them
 * routed to an invented person or placeholder queue, so an edited copy is
 * still a rule pointing at nobody.
 */
const RETIRED_SEED_RULE_IDS = new Set([
  'rule_exec_referral', 'rule_enterprise_web', 'rule_high_score',
  'rule_hrms', 'rule_apac', 'rule_after_hours',
]);

function load(): AssignmentRule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const stored = JSON.parse(raw) as AssignmentRule[];
      const kept = stored.filter(r => !RETIRED_SEED_RULE_IDS.has(r.id));
      if (kept.length !== stored.length) {
        kept.forEach((r, i) => { r.priority = i + 1; });
        save(kept);
      }
      return kept;
    }
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
