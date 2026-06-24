// Pure TypeScript — zero React imports, zero side effects.
import type { Lead } from '../types/lead';
import { computeLeadSLA, getSLAConfig } from './leadSla';
import type { LeadSLAResult } from './leadSla';

// ── Types ─────────────────────────────────────────────────────────────────────

export type SortMode =
  | 'priority'
  | 'score_high_low'
  | 'score_low_high'
  | 'recently_active'
  | 'most_engaged'
  | 'newest'
  | 'oldest'
  | 'closest_to_qualification'
  | 'highest_duplicate_risk'
  | 'sla_breach_first'
  | 'escalation_first'
  | 'ready_to_convert_first';

export type SortMeta = {
  mode:        SortMode;
  label:       string;
  description: string;
  group:       'smart' | 'score' | 'time' | 'pipeline';
};

export const SORT_OPTIONS: SortMeta[] = [
  // ── Smart ─────────────────────────────────────────────────────────────────
  {
    mode:        'priority',
    label:       'Priority (Recommended)',
    description: 'Leads ranked by composite priority — combining fit score, urgency, inactivity, and conversion readiness.',
    group:       'smart',
  },
  {
    mode:        'most_engaged',
    label:       'Most Engaged',
    description: 'Leads with the highest combination of recent contact and AI score — your most invested relationships.',
    group:       'smart',
  },
  {
    mode:        'sla_breach_first',
    label:       'SLA Breach First',
    description: 'Leads that have breached any SLA track (first-response, follow-up, or stale) appear at the top.',
    group:       'smart',
  },
  {
    mode:        'escalation_first',
    label:       'Escalation Required First',
    description: 'Leads flagged for manager escalation (SLA exceeded by 2×) appear at the top.',
    group:       'smart',
  },
  {
    mode:        'ready_to_convert_first',
    label:       'Ready to Convert',
    description: 'Qualified leads with score ≥ 60 appear first — the pipeline is warm, close them.',
    group:       'smart',
  },
  // ── Score ─────────────────────────────────────────────────────────────────
  {
    mode:        'score_high_low',
    label:       'Score (High to Low)',
    description: 'Leads ordered by AI score from highest to lowest.',
    group:       'score',
  },
  {
    mode:        'score_low_high',
    label:       'Score (Low to High)',
    description: 'Leads ordered by AI score from lowest to highest.',
    group:       'score',
  },
  // ── Time ──────────────────────────────────────────────────────────────────
  {
    mode:        'newest',
    label:       'Newest First',
    description: 'Most recently created leads appear first.',
    group:       'time',
  },
  {
    mode:        'oldest',
    label:       'Oldest First',
    description: 'Leads created longest ago appear first.',
    group:       'time',
  },
  {
    mode:        'recently_active',
    label:       'Recently Active',
    description: 'Leads sorted by most recent contact date — keep momentum with active conversations.',
    group:       'time',
  },
  // ── Pipeline ──────────────────────────────────────────────────────────────
  {
    mode:        'closest_to_qualification',
    label:       'Closest to Qualification',
    description: 'Leads ordered by pipeline stage — Qualified → Contacted → New → Lost. Tiebreaker: AI score.',
    group:       'pipeline',
  },
  {
    mode:        'highest_duplicate_risk',
    label:       'Highest Duplicate Risk',
    description: 'Leads sharing an email domain with other leads appear first — review and merge.',
    group:       'pipeline',
  },
];

// ── Internal helpers ──────────────────────────────────────────────────────────

function daysSince(dateStr: string | null | undefined): number {
  if (!dateStr) return 9999;
  return (Date.now() - new Date(dateStr).getTime()) / 86_400_000;
}

function daysUntil(dateStr: string | null | undefined): number {
  if (!dateStr) return 9999;
  return (new Date(dateStr).getTime() - Date.now()) / 86_400_000;
}

function overdueBonus(lead: Lead): number {
  if (!lead.next_follow_up_date) return 0;
  const days = daysUntil(lead.next_follow_up_date);
  if (days <= 0) return 100;
  if (days >= 7)  return 0;
  return Math.round((1 - days / 7) * 100);
}

function inactivityPenalty(lead: Lead): number {
  if (!lead.last_contact_date) return 100;
  const days = daysSince(lead.last_contact_date);
  return Math.min(100, Math.round((days / 30) * 100));
}

function conversionBonus(lead: Lead): number {
  return lead.status === 'qualified' && (lead.ai_score ?? 0) >= 60 ? 100 : 0;
}

export function priorityScore(lead: Lead): number {
  const score = lead.ai_score ?? lead.score ?? 0;
  return (
    score                * 0.40 +
    overdueBonus(lead)   * 0.30 +
    inactivityPenalty(lead) * 0.20 +
    conversionBonus(lead) * 0.10
  );
}

function statusOrder(status: string | undefined): number {
  switch (status) {
    case 'sales_accepted':    return 1;
    case 'qualified':         return 2;
    case 'engaged':           return 3;
    case 'attempting_contact': return 4;
    case 'enriching':         return 5;
    case 'assigned':          return 6;
    case 'new':               return 7;
    case 'nurture':           return 8;
    case 'converted':         return 9;
    case 'disqualified':      return 10;
    case 'lost':              return 11;
    default:                  return 12;
  }
}

function engagementScore(lead: Lead): number {
  const recencyScore = 100 - inactivityPenalty(lead);
  const aiScore = lead.ai_score ?? lead.score ?? 0;
  return recencyScore * 0.60 + aiScore * 0.40;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function sortLeads(
  leads: Lead[],
  mode: SortMode,
  duplicateEmailDomainSet: Set<string>,
  slaMap?: ReadonlyMap<string, LeadSLAResult>,
): Lead[] {
  // Pre-compute SLA results for SLA-aware sort modes when no map is provided
  let resolvedSLAMap = slaMap;
  if (!resolvedSLAMap && (mode === 'sla_breach_first' || mode === 'escalation_first')) {
    const cfg = getSLAConfig();
    const now = new Date();
    resolvedSLAMap = new Map(leads.map(l => [l.id, computeLeadSLA(l, now, cfg)]));
  }

  return [...leads].sort((a, b) => {
    switch (mode) {
      case 'priority':
        return priorityScore(b) - priorityScore(a);

      case 'score_high_low':
        return (b.ai_score ?? b.score ?? 0) - (a.ai_score ?? a.score ?? 0);

      case 'score_low_high':
        return (a.ai_score ?? a.score ?? 0) - (b.ai_score ?? b.score ?? 0);

      case 'recently_active': {
        if (!a.last_contact_date && !b.last_contact_date) return 0;
        if (!a.last_contact_date) return 1;
        if (!b.last_contact_date) return -1;
        return (
          new Date(b.last_contact_date).getTime() -
          new Date(a.last_contact_date).getTime()
        );
      }

      case 'most_engaged':
        return engagementScore(b) - engagementScore(a);

      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();

      case 'closest_to_qualification': {
        const stageDiff = statusOrder(a.status) - statusOrder(b.status);
        if (stageDiff !== 0) return stageDiff;
        return (b.ai_score ?? b.score ?? 0) - (a.ai_score ?? a.score ?? 0);
      }

      case 'highest_duplicate_risk': {
        const aDomain = a.email?.split('@')[1] ?? '';
        const bDomain = b.email?.split('@')[1] ?? '';
        const aRisk = duplicateEmailDomainSet.has(aDomain) ? 1 : 0;
        const bRisk = duplicateEmailDomainSet.has(bDomain) ? 1 : 0;
        if (bRisk !== aRisk) return bRisk - aRisk;
        return (b.ai_score ?? b.score ?? 0) - (a.ai_score ?? a.score ?? 0);
      }

      case 'sla_breach_first': {
        const aBreached = resolvedSLAMap?.get(a.id)?.overall === 'breached' ? 1 : 0;
        const bBreached = resolvedSLAMap?.get(b.id)?.overall === 'breached' ? 1 : 0;
        if (bBreached !== aBreached) return bBreached - aBreached;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }

      case 'escalation_first': {
        const aEsc = resolvedSLAMap?.get(a.id)?.escalate ? 1 : 0;
        const bEsc = resolvedSLAMap?.get(b.id)?.escalate ? 1 : 0;
        if (bEsc !== aEsc) return bEsc - aEsc;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }

      case 'ready_to_convert_first': {
        const aReady = conversionBonus(a) > 0 ? 1 : 0;
        const bReady = conversionBonus(b) > 0 ? 1 : 0;
        if (bReady !== aReady) return bReady - aReady;
        return (b.ai_score ?? b.score ?? 0) - (a.ai_score ?? a.score ?? 0);
      }

      default:
        return 0;
    }
  });
}

export function getSortDescription(mode: SortMode): string {
  return SORT_OPTIONS.find(o => o.mode === mode)?.description ?? '';
}
