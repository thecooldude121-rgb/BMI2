import type {
  AssignmentRule, AssignmentResult, RuleTrace, ConditionTrace,
  RuleCondition, ConditionField, TerritoryDefinition, FollowUpTaskConfig,
} from './types';
import { PERSONA_PRESETS } from './types';
import { getRules } from './rulesStore';
import { getTerritories, matchTerritory } from './territoryStore';
import { getNextUserId, expandByWeights } from './roundRobinStore';
import { TEAM_MEMBERS, ROUTING_TABLE } from '../leadOwnerRouting';
import type { Lead } from '../../types/lead';

// ── Condition evaluation ──────────────────────────────────────────────────────

function matchPersona(position: string, presets: string[]): boolean {
  const pos = position.toLowerCase();
  for (const preset of presets) {
    const keywords = PERSONA_PRESETS[preset] ?? [];
    if (keywords.some(k => pos.includes(k.toLowerCase()))) return true;
  }
  return false;
}

function isBizHours(value: unknown, now: Date): boolean {
  const v = value as { startHour: number; endHour: number; days: number[]; timezone: string };
  if (!v || typeof v !== 'object') return false;
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: v.timezone || 'UTC',
      hour: 'numeric', weekday: 'long', hour12: false,
    });
    const parts = fmt.formatToParts(now);
    const hourStr = parts.find(p => p.type === 'hour')?.value ?? '0';
    const weekday = parts.find(p => p.type === 'weekday')?.value ?? '';
    const hour = parseInt(hourStr, 10);
    const DAY: Record<string, number> = {
      Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
      Thursday: 4, Friday: 5, Saturday: 6,
    };
    const day = DAY[weekday] ?? 0;
    return hour >= v.startHour && hour < v.endHour && v.days.includes(day);
  } catch {
    return false;
  }
}

function evalCondition(
  cond: RuleCondition,
  lead: Partial<Lead>,
  territories: TerritoryDefinition[],
  now: Date,
): ConditionTrace {
  const base: Pick<ConditionTrace, 'conditionId' | 'field' | 'op' | 'expected'> = {
    conditionId: cond.id,
    field: cond.field,
    op: cond.op,
    expected: cond.value,
  };

  function ok(actual: unknown, reason: string): ConditionTrace {
    return { ...base, actual, passed: true, reason };
  }
  function fail(actual: unknown, reason: string): ConditionTrace {
    return { ...base, actual, passed: false, reason };
  }

  switch (cond.field) {
    case 'source': {
      const actual = lead.source ?? '';
      const expected = cond.value as string | string[];
      if (cond.op === 'equals') {
        return actual === expected
          ? ok(actual, `source "${actual}" = "${expected}"`)
          : fail(actual, `source "${actual}" ≠ "${expected}"`);
      }
      if (cond.op === 'not_equals') {
        return actual !== expected
          ? ok(actual, `source "${actual}" ≠ "${expected}"`)
          : fail(actual, `source "${actual}" = "${expected}" (excluded)`);
      }
      if (cond.op === 'in') {
        const arr = expected as string[];
        return arr.includes(actual)
          ? ok(actual, `source "${actual}" ∈ [${arr.join(', ')}]`)
          : fail(actual, `source "${actual}" ∉ [${arr.join(', ')}]`);
      }
      if (cond.op === 'not_in') {
        const arr = expected as string[];
        return !arr.includes(actual)
          ? ok(actual, `source "${actual}" ∉ [${arr.join(', ')}]`)
          : fail(actual, `source "${actual}" ∈ excluded list`);
      }
      return fail(actual, `unsupported op ${cond.op}`);
    }

    case 'score': {
      const actual = lead.score ?? lead.ai_score ?? 0;
      if (cond.op === 'gte') {
        const n = cond.value as number;
        return actual >= n ? ok(actual, `score ${actual} ≥ ${n}`) : fail(actual, `score ${actual} < ${n}`);
      }
      if (cond.op === 'lte') {
        const n = cond.value as number;
        return actual <= n ? ok(actual, `score ${actual} ≤ ${n}`) : fail(actual, `score ${actual} > ${n}`);
      }
      if (cond.op === 'between') {
        const [lo, hi] = cond.value as [number, number];
        return actual >= lo && actual <= hi
          ? ok(actual, `score ${actual} ∈ [${lo}, ${hi}]`)
          : fail(actual, `score ${actual} ∉ [${lo}, ${hi}]`);
      }
      return fail(actual, `unsupported op ${cond.op}`);
    }

    case 'territory': {
      const names = cond.value as string[];
      const country = lead.country ?? '';
      const city = lead.city ?? '';
      const matched = matchTerritory(territories, names, country, city);
      if (cond.op === 'in') {
        return matched
          ? ok(`${country}${city ? '/' + city : ''}`, `country/city matches territory ${names.join(' or ')}`)
          : fail(`${country}${city ? '/' + city : ''}`, `country "${country}" not in territory ${names.join(', ')}`);
      }
      if (cond.op === 'not_in') {
        return !matched
          ? ok(`${country}${city ? '/' + city : ''}`, `not in excluded territory`)
          : fail(`${country}${city ? '/' + city : ''}`, `in excluded territory`);
      }
      return fail(null, `unsupported op ${cond.op}`);
    }

    case 'persona': {
      const presets = cond.value as string[];
      const pos = lead.position ?? '';
      if (!pos) return fail('(no position)', `no position set on lead`);
      const matched = matchPersona(pos, presets);
      if (cond.op === 'in') {
        return matched
          ? ok(pos, `"${pos}" matches persona ${presets.join(' or ')}`)
          : fail(pos, `"${pos}" does not match persona ${presets.join(', ')}`);
      }
      if (cond.op === 'not_in') {
        return !matched
          ? ok(pos, `"${pos}" excluded from personas`)
          : fail(pos, `"${pos}" matches excluded persona`);
      }
      return fail(pos, `unsupported op ${cond.op}`);
    }

    case 'company_size': {
      const actual = lead.company_size ?? '';
      const arr = cond.value as string[];
      if (cond.op === 'in') {
        return arr.includes(actual)
          ? ok(actual, `company_size "${actual}" ∈ [${arr.join(', ')}]`)
          : fail(actual, `company_size "${actual}" ∉ [${arr.join(', ')}]`);
      }
      if (cond.op === 'not_in') {
        return !arr.includes(actual)
          ? ok(actual, `company_size not in excluded list`)
          : fail(actual, `company_size "${actual}" is in excluded list`);
      }
      return fail(actual, `unsupported op ${cond.op}`);
    }

    case 'business_hours': {
      const inBiz = isBizHours(cond.value, now);
      // cond.value is BusinessHoursValue; a rule fires when it IS in biz hours
      return inBiz
        ? ok(now.toLocaleTimeString(), `current time is within business hours`)
        : fail(now.toLocaleTimeString(), `current time is outside business hours`);
    }

    case 'tags': {
      const tags = lead.tags ?? [];
      const target = (cond.value as string).toLowerCase();
      const has = tags.some(t => t.toLowerCase().includes(target));
      if (cond.op === 'contains') {
        return has ? ok(tags.join(', '), `tags contain "${target}"`) : fail(tags.join(', '), `tags do not contain "${target}"`);
      }
      if (cond.op === 'not_contains') {
        return !has ? ok(tags.join(', '), `tags do not contain "${target}"`) : fail(tags.join(', '), `tags contain excluded "${target}"`);
      }
      return fail(tags.join(', '), `unsupported op ${cond.op}`);
    }

    case 'availability': {
      // Stub — always passes
      return ok('(stub)', 'Availability check not yet implemented — always passes');
    }

    default:
      return { ...base, actual: null, passed: false, reason: `Unknown field: ${cond.field}` };
  }
}

// ── Assignment computation ────────────────────────────────────────────────────

function computeAssignment(
  rule: AssignmentRule,
  peek: boolean,
): { userId: string | null; mode: typeof rule.action.mode } {
  const { action } = rule;

  switch (action.mode) {
    case 'direct_user':
      return { userId: action.userId ?? null, mode: 'direct_user' };

    case 'round_robin': {
      const ids = action.userIds ?? [];
      const userId = getNextUserId(rule.id, ids, peek);
      return { userId, mode: 'round_robin' };
    }

    case 'weighted_round_robin': {
      const ids = action.userIds ?? [];
      const weights = action.weights ?? {};
      const expanded = expandByWeights(ids, weights);
      const userId = getNextUserId(rule.id + '_w', expanded, peek);
      return { userId, mode: 'weighted_round_robin' };
    }

    case 'queue':
      return { userId: (action.userIds ?? ['queue_unassigned'])[0], mode: 'queue' };

    default:
      return { userId: null, mode: 'direct_user' };
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function evaluateAssignmentRules(
  lead: Partial<Lead>,
  options: { rules?: AssignmentRule[]; territories?: TerritoryDefinition[]; now?: Date; peek?: boolean } = {},
): AssignmentResult {
  const rules = (options.rules ?? getRules()).filter(r => r.enabled);
  const territories = options.territories ?? getTerritories();
  const now = options.now ?? new Date();
  const peek = options.peek ?? false;

  const trace: RuleTrace[] = [];

  for (const rule of rules) {
    if (!rule.enabled) {
      trace.push({ ruleId: rule.id, ruleName: rule.name, enabled: false, grouping: rule.conditionGrouping, conditionResults: [], matched: false, skipReason: 'Rule is disabled' });
      continue;
    }

    const condResults = rule.conditions.map(c => evalCondition(c, lead, territories, now));
    const allPassed = rule.conditionGrouping === 'all'
      ? condResults.every(r => r.passed)
      : condResults.some(r => r.passed);

    trace.push({
      ruleId: rule.id, ruleName: rule.name, enabled: true,
      grouping: rule.conditionGrouping, conditionResults: condResults, matched: allPassed,
    });

    if (allPassed) {
      const { userId, mode } = computeAssignment(rule, peek);
      const member = TEAM_MEMBERS.find(m => m.id === userId);
      const condSummary = condResults.map(r => r.reason).join(` ${rule.conditionGrouping === 'all' ? 'AND' : 'OR'} `);
      return {
        matched: true,
        ruleId: rule.id,
        ruleName: rule.name,
        assignedUserId: userId,
        assignedUserLabel: member?.label ?? userId ?? null,
        mode,
        followUpTask: rule.followUpTask?.enabled ? rule.followUpTask : null,
        reason: `Matched rule "${rule.name}": ${condSummary}`,
        trace,
      };
    }
  }

  // Fallback: source routing table
  const src = lead.source ?? '';
  const fallback = ROUTING_TABLE[src] ?? null;
  const fallbackUser = fallback ? TEAM_MEMBERS.find(m => m.id === fallback.id) : null;

  return {
    matched: !!fallback,
    ruleId: null,
    ruleName: null,
    assignedUserId: fallback?.id ?? null,
    assignedUserLabel: fallbackUser?.label ?? null,
    mode: fallback ? 'direct_user' : null,
    followUpTask: null,
    reason: fallback
      ? `No rules matched — fallback routing: source "${src}" → ${fallback.label}`
      : `No rules matched and no source routing for "${src}" — lead will be unassigned`,
    trace,
  };
}
