const STORAGE_KEY = 'bmi_round_robin_state';

type State = Record<string, number>;

function load(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as State;
  } catch { /* ignore */ }
  return {};
}

function save(state: State): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

export function getNextUserId(ruleId: string, userIds: string[], peek = false): string {
  if (userIds.length === 0) return 'unassigned';
  const state = load();
  const idx = (state[ruleId] ?? 0) % userIds.length;
  if (!peek) {
    state[ruleId] = (idx + 1) % userIds.length;
    save(state);
  }
  return userIds[idx];
}

export function resetRuleState(ruleId: string): void {
  const state = load();
  delete state[ruleId];
  save(state);
}

export function resetAllState(): void {
  save({});
}

export function getCurrentIndex(ruleId: string): number {
  return load()[ruleId] ?? 0;
}

export function expandByWeights(userIds: string[], weights: Record<string, number>): string[] {
  return userIds.flatMap(id => Array(Math.max(1, Math.round(weights[id] ?? 1))).fill(id));
}
