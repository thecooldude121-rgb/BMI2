import type { Lead } from '../types/lead';
import type {
  LeadDomain,
  LeadStatus,
  LeadSource,
  LeadPriority,
  LifecycleStage,
  NextActionType,
  ConsentStatus,
  EnrichmentStatus,
  QualificationChecklistItem,
} from '../types/leadDomain';

// ── Private mapping helpers ───────────────────────────────────────────────────
// All functions are pure with no side effects.

function mapStatus(status: string): LeadStatus {
  switch (status) {
    case 'new':                              return 'new';
    case 'contacted':
    case 'working':
    case 'nurturing':                        return 'contacted';
    case 'qualified':
    case 'converted':                        return 'qualified';
    default:                                 return 'lost';
  }
}

function mapLifecycleStage(status: string): LifecycleStage {
  switch (status) {
    case 'new':       return 'lead';
    case 'contacted': return 'mql';
    case 'qualified': return 'sql';
    case 'lost':      return 'lead';
    default:          return 'lead';
  }
}

function mapSource(raw: string): LeadSource {
  const s = (raw ?? '').toLowerCase();
  if (s.includes('lead gen') || s.includes('leadgen')) return 'Lead Gen';
  if (s.includes('hrms') || s === 'hr')                return 'HRMS';
  if (s.includes('website') || s.includes('web form')) return 'Website';
  return 'Manual';
}

function mapSourceType(source: LeadSource, raw: string): string {
  switch (source) {
    case 'Lead Gen': return 'Lead Generation Campaign';
    case 'HRMS':     return 'HR Management System';
    case 'Manual':   return 'Manually Added';
    case 'Website':  return 'Website Form';
    default:         return raw;
  }
}

function mapPriority(score: number): LeadPriority {
  if (score >= 80) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
}

function mapConversionReadiness(score: number): 'low' | 'medium' | 'high' {
  if (score >= 80) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

function mapScoreDriversPositive(score: number): string[] {
  if (score >= 80) return ['Strong company fit', 'High engagement signals', 'Decision-maker contact'];
  if (score >= 60) return ['Good company fit', 'Moderate engagement'];
  if (score >= 40) return ['Some engagement signals'];
  return [];
}

function mapScoreDriversNegative(score: number): string[] {
  if (score >= 80) return [];
  if (score >= 60) return ['Limited recent activity'];
  if (score >= 40) return ['Low engagement', 'No recent contact'];
  return ['Very low engagement', 'No qualification data', 'No recent contact'];
}

function mapScoreReason(score: number): string {
  if (score >= 80) return 'High-quality lead with strong fit indicators and active engagement.';
  if (score >= 60) return 'Moderate-quality lead showing some positive signals. Follow-up recommended.';
  if (score >= 40) return 'Low-quality lead with limited signals. Needs nurturing before qualification.';
  return 'Insufficient data to score this lead accurately.';
}

function mapNextActionType(status: string): NextActionType {
  switch (status) {
    case 'new':       return 'call';
    case 'contacted': return 'follow_up';
    case 'qualified': return 'demo';
    case 'lost':      return 'none';
    default:          return 'email';
  }
}

function mapConsentStatus(emailOptIn: boolean, callOptIn: boolean): ConsentStatus {
  if (emailOptIn && callOptIn) return 'full';
  if (emailOptIn)              return 'email_only';
  if (callOptIn)               return 'call_only';
  return 'none';
}

function mapEnrichmentStatus(aiScore: number | undefined): EnrichmentStatus {
  return (aiScore ?? 0) > 0 ? 'enriched' : 'pending';
}

function buildQualificationChecklist(lead: Lead): QualificationChecklistItem[] {
  return [
    { criterion: 'Has valid email',    passed: !!lead.email },
    { criterion: 'Has phone number',   passed: !!lead.phone },
    { criterion: 'Company identified', passed: !!lead.company },
    { criterion: 'Job title known',    passed: !!lead.position },
    { criterion: 'Score above 60',     passed: (lead.ai_score ?? 0) >= 60 },
    { criterion: 'Email opt-in given', passed: !!lead.email_opt_in },
  ];
}

// ── Public adapter ────────────────────────────────────────────────────────────

export function toLeadDomain(lead: Lead): LeadDomain {
  const firstName = lead.first_name || '';
  const lastName  = lead.last_name  || '';
  const fullName  = `${firstName} ${lastName}`.trim();

  const avatarInitials = (
    (firstName[0] ?? '') + (lastName[0] ?? '')
  ).toUpperCase();

  const overallScore    = lead.score ?? 0;
  const fitScore        = Math.round(overallScore * 0.35);
  const intentScore     = Math.round(overallScore * 0.30);
  const engagementScore = Math.round(overallScore * 0.20);
  const confidenceScore = Math.round(overallScore * 0.15);

  const source     = mapSource(lead.source ?? '');
  const sourceType = mapSourceType(source, lead.source ?? '');
  const title      = lead.position || '';

  const aiSummary =
    `${fullName} is a ${title || 'contact'} at ${lead.company || 'an unknown company'}. ` +
    `Lead score: ${lead.ai_score ?? 0}/100. ` +
    `Source: ${sourceType}. ` +
    `Status: ${lead.status ?? 'new'}.`;

  return {
    // Identity
    id:              lead.id,
    fullName,
    firstName,
    lastName,
    email:           lead.email        ?? '',
    phone:           lead.phone        ?? '',
    title,
    company:         lead.company      ?? '',
    website:         lead.website      ?? '',
    linkedinUrl:     lead.linkedin_url ?? '',
    avatarInitials,

    // Pipeline
    status:          mapStatus(lead.status),
    lifecycleStage:  mapLifecycleStage(lead.status),
    source,
    sourceType,
    priority:        mapPriority(overallScore),
    ownerId:         lead.owner_id,
    ownerName:       'Unassigned',
    territory:       '',

    // AI Scoring
    overallScore,
    fitScore,
    intentScore,
    engagementScore,
    confidenceScore,
    scoreReason:          mapScoreReason(overallScore),
    scoreDriversPositive: mapScoreDriversPositive(overallScore),
    scoreDriversNegative: mapScoreDriversNegative(overallScore),
    conversionReadiness:  mapConversionReadiness(overallScore),
    duplicateRisk:        'low',

    // Qualification
    qualificationChecklist: buildQualificationChecklist(lead),

    // AI Enrichment
    aiSummary,
    enrichmentStatus: mapEnrichmentStatus(lead.ai_score),

    // Consent
    consentStatus: mapConsentStatus(lead.email_opt_in, lead.call_opt_in),
    emailOptIn:    lead.email_opt_in,
    callOptIn:     lead.call_opt_in,

    // Timestamps
    createdAt:       new Date(lead.created_at),
    updatedAt:       new Date(lead.updated_at ?? lead.created_at),
    lastContactedAt: lead.last_contact_date ? new Date(lead.last_contact_date) : null,
    nextActionType:  mapNextActionType(lead.status),
    nextActionDue:   null,
  };
}
