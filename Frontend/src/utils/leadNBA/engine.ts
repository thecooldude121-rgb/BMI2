import type { Lead } from '../../types/lead';
import { computeLeadSLA } from '../leadSla';
import type { LeadSLAResult } from '../leadSla';
import { computeMultiFactorScore } from '../leadScoring/multiFactorScore';
import type { MultiFactorScore } from '../leadScoring/multiFactorScore';
// import type only — erased at runtime, breaking the circular dep with leadActions.ts
import type { ActionId, ActionVariant, LeadAction } from '../leadActions';

// ── Types ─────────────────────────────────────────────────────────────────────

export type NBAPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface NBAResult {
  action:   LeadAction;
  reason:   string;
  priority: NBAPriority;
}

export interface NBAOpts {
  isDuplicateRisk?: boolean;
  isOverdue?:       boolean;
  isUntouched?:     boolean;
  slaResult?:       LeadSLAResult;
  mfs?:             MultiFactorScore;
}

// ── Internal helper ───────────────────────────────────────────────────────────

function act(id: ActionId, label: string, variant: ActionVariant): LeadAction {
  return { id, label, variant };
}

// ── NBA engine — 12-step priority stack ───────────────────────────────────────

export function computeNBA(lead: Lead, opts: NBAOpts = {}): NBAResult {
  const now = new Date();

  const isOverdue = opts.isOverdue ?? (
    !!lead.next_follow_up_date && new Date(lead.next_follow_up_date) < now
  );

  const cutoff30d = new Date(now.getTime() - 30 * 86_400_000);
  const isUntouched = opts.isUntouched ?? (
    !lead.last_contact_date || new Date(lead.last_contact_date) < cutoff30d
  );

  const slaResult = opts.slaResult ?? computeLeadSLA(lead);
  const mfs       = opts.mfs       ?? computeMultiFactorScore(lead);

  // 1. Duplicate risk
  if (opts.isDuplicateRisk) {
    return {
      action:   act('merge_duplicate', 'Merge duplicate', 'default'),
      reason:   'Duplicate email domain detected — review and merge to maintain data quality.',
      priority: 'high',
    };
  }

  // 2. Converted but no deal linked yet
  if (lead.status === 'converted' && !lead.converted_to_deal_id) {
    return {
      action:   act('create_deal', 'Create deal', 'ready'),
      reason:   'Lead converted but no deal linked yet — create a deal to keep the pipeline moving.',
      priority: 'high',
    };
  }

  // 3. Converted with deal linked
  if (lead.status === 'converted') {
    return {
      action:   act('view_deal', 'View deal', 'teal'),
      reason:   'Lead is converted and has an active deal — no further action needed.',
      priority: 'low',
    };
  }

  // 4. SLA first-response breach
  if (slaResult.firstResponse.severity === 'breached') {
    return {
      action:   act('call_now', 'Call now', 'urgent'),
      reason:   'First-response SLA breached — every hour of delay reduces conversion odds.',
      priority: 'urgent',
    };
  }

  // 5. Overdue + untouched (30+ days without contact)
  if (isOverdue && isUntouched) {
    return {
      action:   act('contact_now', 'Contact now', 'urgent'),
      reason:   'Overdue and untouched for 30+ days — reach out immediately to prevent further decay.',
      priority: 'urgent',
    };
  }

  // 6. Follow-up date passed
  if (isOverdue) {
    return {
      action:   act('follow_up_now', 'Follow up now', 'warn'),
      reason:   'Follow-up date has passed — keep momentum with a timely touchpoint.',
      priority: 'high',
    };
  }

  // 7. New lead, never contacted → send first outreach
  if (lead.status === 'new' && !lead.last_contact_date) {
    return {
      action:   act('send_first_outreach', 'Send outreach', 'active'),
      reason:   'New lead with no contact logged — send a personalized first outreach.',
      priority: 'high',
    };
  }

  // 8. High fit + intent in active pipeline → book discovery call
  const inProgressStatuses: Array<Lead['status']> = ['new', 'contacted', 'working', 'nurturing'];
  if (
    inProgressStatuses.includes(lead.status) &&
    mfs.fitScore.score    >= 65 &&
    mfs.intentScore.score >= 50
  ) {
    return {
      action:   act('book_discovery', 'Book discovery', 'ready'),
      reason:   'High fit and strong intent signals — book a discovery call before momentum fades.',
      priority: 'high',
    };
  }

  // 9. Qualified + meets MFS conversion thresholds
  if (
    lead.status === 'qualified' &&
    mfs.fitScore.score    >= 60 &&
    mfs.intentScore.score >= 40 &&
    mfs.overallScore      >= 65
  ) {
    return {
      action:   act('convert_to_deal', 'Convert to deal', 'ready'),
      reason:   'Qualified lead meets scoring thresholds — move to deal stage now.',
      priority: 'high',
    };
  }

  // 10. Low data confidence → enrich profile
  if (mfs.confidenceScore.score < 40 && !lead.enriched_at) {
    return {
      action:   act('enrich', 'Enrich data', 'default'),
      reason:   'Low data confidence — enriching the profile will improve scoring accuracy.',
      priority: 'medium',
    };
  }

  // 11. Very low fit + intent + overall → deprioritise
  if (mfs.fitScore.score < 30 && mfs.intentScore.score < 25 && mfs.overallScore < 30) {
    if (lead.status === 'qualified') {
      return {
        action:   act('mark_disqualified', 'Disqualify', 'muted'),
        reason:   'Qualified lead with very low scores — disqualify to keep the pipeline clean.',
        priority: 'low',
      };
    }
    return {
      action:   act('mark_nurture', 'Move to nurture', 'muted'),
      reason:   'Low fit and intent scores — nurture long-term rather than push for conversion.',
      priority: 'low',
    };
  }

  // 12. Status-based defaults
  switch (lead.status) {
    case 'qualified':
      return {
        action:   act('complete_qualification', 'Complete qualification', 'active'),
        reason:   'Qualified lead — fill in data gaps to reach the deal-ready conversion threshold.',
        priority: 'medium',
      };
    case 'contacted':
    case 'working':
      return {
        action:   act('follow_up', 'Follow up', 'active'),
        reason:   'Keep momentum — schedule a timely follow-up touchpoint.',
        priority: 'medium',
      };
    case 'nurturing':
      return {
        action:   act('check_in', 'Check in', 'default'),
        reason:   'Periodic check-in to maintain relationship and watch for buying signals.',
        priority: 'low',
      };
    case 'new':
      return {
        action:   act('contact', 'Contact', 'default'),
        reason:   'New lead — initiate first contact.',
        priority: 'medium',
      };
    case 'lost':
    case 'unqualified':
      return {
        action:   act('revive', 'Revive', 'default'),
        reason:   'Consider reaching out to see if circumstances have changed.',
        priority: 'low',
      };
    default:
      return {
        action:   act('contact', 'Contact', 'default'),
        reason:   'Review lead details and take appropriate action.',
        priority: 'medium',
      };
  }
}
