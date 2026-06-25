import type { Lead } from '../types/lead';
import { computeMultiFactorScore } from './leadScoring/multiFactorScore';
import type { MultiFactorScore } from './leadScoring/multiFactorScore';

// ── Shared thresholds ─────────────────────────────────────────────────────────
// Single source of truth — also imported by leadNBA/engine.ts.
// Edit here to update both the readiness model and the NBA conversion step.

export const DEAL_CONVERSION_THRESHOLDS = {
  fitScore:    60,
  intentScore: 40,
  overallScore: 65,
} as const;

// ── Types ─────────────────────────────────────────────────────────────────────

export type ConversionReadinessState =
  | 'not_ready'
  | 'needs_enrichment'
  | 'needs_qualification'
  | 'ready_for_contact'
  | 'ready_for_account_contact'
  | 'ready_for_deal';

export interface ChecklistItem {
  label: string;
  met:   boolean;
}

export interface ConversionReadinessResult {
  state:     ConversionReadinessState;
  label:     string;
  checklist: ChecklistItem[];
  /** Sentences describing what's blocking the next higher state. Empty = nothing blocking. */
  reasons:   string[];
}

// ── Engine ────────────────────────────────────────────────────────────────────

export function computeConversionReadiness(
  lead: Lead,
  mfs?: MultiFactorScore,
): ConversionReadinessResult {
  const m = mfs ?? computeMultiFactorScore(lead);
  const T = DEAL_CONVERSION_THRESHOLDS;

  const fit        = m.fitScore.score;
  const intent     = m.intentScore.score;
  const overall    = m.overallScore;
  const confidence = m.confidenceScore.score;

  const isQualified = lead.is_qualified || lead.status === 'qualified' || lead.status === 'sales_accepted';
  const hasContact  = !!(lead.email || lead.phone || lead.mobile);
  const hasCompany  = !!(lead.company?.trim());
  const isEnriched  = !!lead.enriched_at;
  const isTerminal  = lead.status === 'lost' || lead.status === 'disqualified';

  // Source-adjusted overall score already reflects playbook weight bias applied in
  // computeMultiFactorScore → getEffectiveWeights. A single overall gate lets
  // source-specific trust calibration flow through (e.g. Referral: high fit compensates
  // for lower intent because fit is weighted more in the blend).
  const meetsDealThreshold = overall >= T.overallScore;

  // Build unified checklist (same items for every state — met/unmet varies)
  const checklist: ChecklistItem[] = [
    { label: 'Formally qualified',            met: isQualified               },
    { label: 'Email or phone on file',        met: hasContact                },
    { label: 'Company identified',            met: hasCompany                },
    { label: `Fit score ≥ ${T.fitScore}`,     met: fit     >= T.fitScore     },
    { label: `Intent score ≥ ${T.intentScore}`, met: intent >= T.intentScore },
    { label: `Overall score ≥ ${T.overallScore}`, met: overall >= T.overallScore },
    { label: 'Data confidence adequate',      met: confidence >= 40          },
  ];

  // ── Priority stack (highest wins) ─────────────────────────────────────────

  // Converted leads: treat as deal-ready (badge hidden via status check in component)
  if (lead.status === 'converted') {
    return { state: 'ready_for_deal', label: 'Converted', checklist, reasons: [] };
  }

  // Sales-accepted: guaranteed at least ready_for_account_contact — skip lower checks
  if (lead.status === 'sales_accepted' && !meetsDealThreshold) {
    const gap: string[] = [];
    if (fit     < T.fitScore)    gap.push(`fit to ${T.fitScore} (now ${fit})`);
    if (intent  < T.intentScore) gap.push(`intent to ${T.intentScore} (now ${intent})`);
    if (overall < T.overallScore) gap.push(`overall to ${T.overallScore} (now ${overall})`);
    return {
      state:     'ready_for_account_contact',
      label:     'Sales accepted',
      checklist,
      reasons:   gap.length > 0 ? [`To unlock deal creation, raise: ${gap.join(', ')}.`] : [],
    };
  }

  // Terminal: lost / disqualified, or very poor fit with no qualification
  if (isTerminal || (fit < 25 && !isQualified)) {
    return {
      state:     'not_ready',
      label:     'Not ready',
      checklist,
      reasons:   isTerminal
        ? ['Lead is disqualified or lost. Reassess fit before converting.']
        : ['ICP fit score is below 25. Verify this is the right persona before investing more.'],
    };
  }

  // Ready for deal: qualified + contact info + company + MFS thresholds
  if (isQualified && hasContact && hasCompany && meetsDealThreshold) {
    return { state: 'ready_for_deal', label: 'Ready for deal', checklist, reasons: [] };
  }

  // Ready for account + contact: qualified + contact info + company (deal threshold not yet met)
  if (isQualified && hasContact && hasCompany) {
    const gap: string[] = [];
    if (fit     < T.fitScore)    gap.push(`fit to ${T.fitScore} (now ${fit})`);
    if (intent  < T.intentScore) gap.push(`intent to ${T.intentScore} (now ${intent})`);
    if (overall < T.overallScore) gap.push(`overall to ${T.overallScore} (now ${overall})`);
    return {
      state:     'ready_for_account_contact',
      label:     'Ready for account + contact',
      checklist,
      reasons:   gap.length > 0
        ? [`To unlock deal creation, raise: ${gap.join(', ')}.`]
        : [],
    };
  }

  // Ready for contact: qualified + contact info (company missing)
  if (isQualified && hasContact) {
    return {
      state:     'ready_for_contact',
      label:     'Ready for contact',
      checklist,
      reasons:   ['Add a company name to also create an account record.'],
    };
  }

  // Ready for contact but missing contact info
  if (isQualified && !hasContact) {
    return {
      state:     'ready_for_contact',
      label:     'Ready for contact',
      checklist,
      reasons:   ['Add an email or phone number to complete contact creation.'],
    };
  }

  // Needs qualification: decent ICP fit, not yet formally qualified
  if (!isQualified && fit >= 40 && overall >= 40) {
    const also: string[] = [];
    if (!hasContact) also.push('add email or phone');
    if (!hasCompany) also.push('add company name');
    return {
      state:     'needs_qualification',
      label:     'Needs qualification',
      checklist,
      reasons:   [
        'Formally qualify this lead — mark it as Qualified to proceed with conversion.',
        ...also.map(s => `Also: ${s}.`),
      ],
    };
  }

  // Needs enrichment: low data confidence, not yet enriched
  if (confidence < 40 && !isEnriched) {
    return {
      state:     'needs_enrichment',
      label:     'Needs enrichment',
      checklist,
      reasons:   ['Enrich the profile to improve data confidence and unlock qualification scoring.'],
    };
  }

  // Default: not ready
  return {
    state:     'not_ready',
    label:     'Not ready',
    checklist,
    reasons:   ['This lead does not yet meet the minimum criteria for conversion.'],
  };
}
