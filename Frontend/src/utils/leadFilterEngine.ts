// Pure filter engine — zero React imports, zero side effects.
import type { Lead } from '../types/lead';
import type {
  AdvancedFilter,
  FilterCondition,
  FilterFieldId,
  FilterGroup,
  FilterOperator,
} from '../types/leadFilter';
import { computeLeadSLA } from './leadSla';
import type { LeadSLAResult } from './leadSla';
import { computeConversionReadiness } from './conversionReadiness';
import type { ConversionReadinessState } from './conversionReadiness';
import { computeMultiFactorScore } from './leadScoring/multiFactorScore';
import { findDuplicates, computeRisk } from './leadDuplicates';
import type { DuplicateRisk } from './leadDuplicates';

const READY_STATES = new Set<ConversionReadinessState>([
  'ready_for_contact',
  'ready_for_account_contact',
  'ready_for_deal',
]);

// ── Date helpers ──────────────────────────────────────────────────────────────

function daysSince(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  return (Date.now() - new Date(dateStr).getTime()) / 86_400_000;
}

function toDate(dateStr: string | null | undefined): Date | null {
  return dateStr ? new Date(dateStr) : null;
}

// ── Field resolution ──────────────────────────────────────────────────────────

function isDateField(fieldId: FilterFieldId): boolean {
  return fieldId === 'lead_age' || fieldId === 'last_contact_age' || fieldId === 'next_action_due';
}

function getDateValue(lead: Lead, fieldId: FilterFieldId): Date | null {
  if (fieldId === 'lead_age')          return toDate(lead.created_at);
  if (fieldId === 'last_contact_age')  return toDate(lead.last_contact_date);
  if (fieldId === 'next_action_due')   return toDate(lead.next_follow_up_date);
  return null;
}

function getDaysValue(lead: Lead, fieldId: FilterFieldId): number | null {
  if (fieldId === 'lead_age')          return daysSince(lead.created_at);
  if (fieldId === 'last_contact_age')  return daysSince(lead.last_contact_date);
  if (fieldId === 'next_action_due')   return daysSince(lead.next_follow_up_date);
  return null;
}

// ── Core evaluator ────────────────────────────────────────────────────────────

export function evaluateCondition(
  lead: Lead,
  condition: FilterCondition,
  duplicateEmailDomainSet: Set<string>,
  slaMap?: ReadonlyMap<string, LeadSLAResult>,
  candidateMap?: ReadonlyMap<string, { risk: DuplicateRisk }[]>,
): boolean {
  const { fieldId, operator, value } = condition;
  const now = new Date();

  // ── Boolean-ish ───────────────────────────────────────────────────────────

  if (fieldId === 'enrichment_status') {
    const enriched = lead.enriched_at != null;
    return operator === 'is_true' ? enriched : !enriched;
  }

  if (fieldId === 'conversion_readiness') {
    const mfs   = computeMultiFactorScore(lead);
    const state = computeConversionReadiness(lead, mfs).state;

    const matchesValue = (v: string): boolean =>
      v === 'any_ready' ? READY_STATES.has(state) : state === (v as ConversionReadinessState);

    if (operator === 'is')        return matchesValue(value as string);
    if (operator === 'is_not')    return !matchesValue(value as string);
    if (operator === 'is_any_of') return (value as string[]).some(matchesValue);
    if (operator === 'is_none_of') return !(value as string[]).some(matchesValue);
    return false;
  }

  if (fieldId === 'duplicate_risk') {
    const candidates = candidateMap?.get(lead.id);
    const risk: DuplicateRisk | 'none' = candidates && candidates.length > 0
      ? computeRisk(candidates as import('./leadDuplicates').DuplicateCandidate[])
      : 'none';
    // Legacy boolean operators
    if (operator === 'is_true')  return risk !== 'none';
    if (operator === 'is_not')   return risk === 'none';
    // Risk-level operators
    if (operator === 'is')       return risk === (value as string);
    if (operator === 'is_any_of') return (value as string[]).includes(risk);
    return false;
  }

  // ── SLA fields ────────────────────────────────────────────────────────────

  if (
    fieldId === 'sla_first_response' ||
    fieldId === 'sla_follow_up' ||
    fieldId === 'sla_stale' ||
    fieldId === 'sla_escalation'
  ) {
    const result = slaMap?.get(lead.id) ?? computeLeadSLA(lead);

    if (fieldId === 'sla_escalation') {
      return operator === 'is_true' ? result.escalate : !result.escalate;
    }

    const track =
      fieldId === 'sla_first_response' ? result.firstResponse :
      fieldId === 'sla_follow_up'      ? result.followUp :
                                         result.stale;
    const sev = track.severity;
    if (operator === 'is')     return sev === (value as string);
    if (operator === 'is_not') return sev !== (value as string);
    return false;
  }

  // ── Date-derived ──────────────────────────────────────────────────────────

  if (isDateField(fieldId)) {
    const rawDate = getDateValue(lead, fieldId);
    const daysAgo = getDaysValue(lead, fieldId);

    switch (operator as FilterOperator) {
      case 'date_is_empty':        return rawDate === null;
      case 'is_overdue':           return rawDate !== null && rawDate < now;
      case 'within_last_n_days':   return daysAgo !== null && daysAgo <= (value as number);
      case 'before_n_days_ago':    return daysAgo !== null && daysAgo > (value as number);
      case 'after_date':
        return rawDate !== null && rawDate > new Date(value as string);
      case 'before_date':
        return rawDate !== null && rawDate < new Date(value as string);
      default: return false;
    }
  }

  // ── Numeric: score ────────────────────────────────────────────────────────

  if (fieldId === 'score') {
    const score = lead.ai_score ?? lead.score ?? 0;
    if (operator === 'is_empty') return lead.ai_score == null && lead.score === 0;
    if (value == null) return false;
    switch (operator as FilterOperator) {
      case 'equals':                return score === (value as number);
      case 'not_equals':            return score !== (value as number);
      case 'greater_than':          return score >  (value as number);
      case 'greater_than_or_equal': return score >= (value as number);
      case 'less_than':             return score <  (value as number);
      case 'less_than_or_equal':    return score <= (value as number);
      case 'between': {
        const [lo, hi] = value as [number, number];
        return score >= lo && score <= hi;
      }
      default: return false;
    }
  }

  // ── Enum: status, source ──────────────────────────────────────────────────

  if (fieldId === 'status' || fieldId === 'source') {
    const fieldVal = fieldId === 'status' ? lead.status : (lead.source ?? '');
    if (value == null) return false;
    switch (operator as FilterOperator) {
      case 'is':        return fieldVal === (value as string);
      case 'is_not':    return fieldVal !== (value as string);
      case 'is_any_of': return (value as string[]).includes(fieldVal);
      case 'is_none_of':return !(value as string[]).includes(fieldVal);
      default: return false;
    }
  }

  // ── Enum: disqualified_reason, lost_reason ────────────────────────────────

  if (fieldId === 'disqualified_reason' || fieldId === 'lost_reason') {
    const fieldVal =
      fieldId === 'disqualified_reason'
        ? (lead.disqualified_reason ?? '')
        : (lead.lost_reason ?? '');
    if (value == null) return false;
    switch (operator as FilterOperator) {
      case 'is':        return fieldVal === (value as string);
      case 'is_not':    return fieldVal !== (value as string);
      case 'is_any_of': return (value as string[]).includes(fieldVal);
      case 'is_none_of':return !(value as string[]).includes(fieldVal);
      case 'is_empty':  return fieldVal === '';
      default: return false;
    }
  }

  // ── Text: company, position, country, city ────────────────────────────────

  if (
    fieldId === 'company' || fieldId === 'position' ||
    fieldId === 'country' || fieldId === 'city'
  ) {
    const rawStr =
      fieldId === 'company'  ? (lead.company  ?? '') :
      fieldId === 'position' ? (lead.position ?? '') :
      fieldId === 'country'  ? (lead.country  ?? '') :
                               (lead.city     ?? '');

    const lower = rawStr.toLowerCase();

    switch (operator as FilterOperator) {
      case 'text_is_empty':  return rawStr.trim() === '';
      case 'is':             return rawStr === (value as string);
      case 'is_not':         return rawStr !== (value as string);
      case 'is_any_of':
        return Array.isArray(value) && (value as string[]).includes(rawStr);
      case 'contains':
        return value != null && lower.includes((value as string).toLowerCase());
      case 'not_contains':
        return value != null && !lower.includes((value as string).toLowerCase());
      case 'starts_with':
        return value != null && lower.startsWith((value as string).toLowerCase());
      default: return false;
    }
  }

  return false;
}

// ── Group evaluator ───────────────────────────────────────────────────────────

function matchesGroup(
  lead: Lead,
  group: FilterGroup,
  duplicateEmailDomainSet: Set<string>,
  slaMap?: ReadonlyMap<string, LeadSLAResult>,
  candidateMap?: ReadonlyMap<string, { risk: DuplicateRisk }[]>,
): boolean {
  if (group.conditions.length === 0) return true;
  const evaluate = (c: FilterCondition) =>
    evaluateCondition(lead, c, duplicateEmailDomainSet, slaMap, candidateMap);
  return group.logic === 'AND'
    ? group.conditions.every(evaluate)
    : group.conditions.some(evaluate);
}

// ── Public API ────────────────────────────────────────────────────────────────

export function applyAdvancedFilter(
  leads: Lead[],
  filter: AdvancedFilter,
  duplicateEmailDomainSet: Set<string>,
  slaMap?: ReadonlyMap<string, LeadSLAResult>,
  candidateMap?: ReadonlyMap<string, { risk: DuplicateRisk }[]>,
): Lead[] {
  const active = filter.groups.filter(g => g.conditions.length > 0);
  if (active.length === 0) return leads;
  return leads.filter(lead =>
    active.every(group => matchesGroup(lead, group, duplicateEmailDomainSet, slaMap, candidateMap))
  );
}
