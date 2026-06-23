import type { Lead } from '../../types/lead';
import type { SLAConfig } from './config';
import { getSLAConfig } from './config';

// ── Types ─────────────────────────────────────────────────────────────────────

export type SLASeverity = 'healthy' | 'at_risk' | 'breached' | 'na';

export interface SLATrack {
  severity: SLASeverity;
  ageHours: number | null;    // hours elapsed / overdue
  limitHours: number | null;  // the threshold in hours
  pct: number | null;         // ageHours / limitHours (0–1+)
  resolvedAt: string | null;  // ISO string if already cleared
  escalate: boolean;
}

export interface LeadSLAResult {
  firstResponse: SLATrack;
  followUp: SLATrack;
  stale: SLATrack;
  overall: SLASeverity;  // worst of the three non-na tracks
  escalate: boolean;     // any track has escalate = true
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SEVERITY_RANK: Record<SLASeverity, number> = {
  na: 0, healthy: 1, at_risk: 2, breached: 3,
};

function worst(a: SLASeverity, b: SLASeverity): SLASeverity {
  return SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b;
}

function naTrack(): SLATrack {
  return { severity: 'na', ageHours: null, limitHours: null, pct: null, resolvedAt: null, escalate: false };
}

// ── Track evaluators ──────────────────────────────────────────────────────────

function computeFirstResponse(lead: Lead, now: Date, cfg: SLAConfig): SLATrack {
  // Resolved when first_contact_date is set
  if (lead.first_contact_date) {
    return {
      severity: 'healthy', ageHours: null, limitHours: null,
      pct: null, resolvedAt: lead.first_contact_date, escalate: false,
    };
  }
  // Only applies to new leads that haven't been contacted
  if (lead.status !== 'new') return naTrack();

  const limitHours = cfg.firstResponse.thresholds[lead.source ?? ''] ?? cfg.firstResponse.defaultHours;
  const ageHours = (now.getTime() - new Date(lead.created_at).getTime()) / 3_600_000;
  const pct = ageHours / limitHours;
  const escalate = ageHours >= limitHours * cfg.escalation.multiplier;

  let severity: SLASeverity;
  if (pct >= 1.0) severity = 'breached';
  else if (pct >= cfg.firstResponse.atRiskPct) severity = 'at_risk';
  else severity = 'healthy';

  return { severity, ageHours, limitHours, pct, resolvedAt: null, escalate };
}

function computeFollowUp(lead: Lead, now: Date, cfg: SLAConfig): SLATrack {
  if (!lead.next_follow_up_date) return naTrack();
  if (!cfg.stale.activeStatuses.includes(lead.status)) return naTrack();

  const followUpAt = new Date(lead.next_follow_up_date);
  const overdueHours = (now.getTime() - followUpAt.getTime()) / 3_600_000;
  const graceHours = cfg.followUp.graceHours;

  if (overdueHours <= 0) {
    // Upcoming — healthy
    return {
      severity: 'healthy', ageHours: overdueHours, limitHours: graceHours,
      pct: 0, resolvedAt: null, escalate: false,
    };
  }

  // Past due date
  const pct = overdueHours / graceHours;
  const escalate = overdueHours >= graceHours * cfg.escalation.multiplier;
  const severity: SLASeverity = overdueHours > graceHours ? 'breached' : 'at_risk';

  return { severity, ageHours: overdueHours, limitHours: graceHours, pct, resolvedAt: null, escalate };
}

function computeStale(lead: Lead, now: Date, cfg: SLAConfig): SLATrack {
  if (!cfg.stale.activeStatuses.includes(lead.status)) return naTrack();

  const refStr = lead.last_activity_date ?? lead.last_contact_date ?? lead.created_at;
  const daysSince = (now.getTime() - new Date(refStr).getTime()) / 86_400_000;
  const limitHours = cfg.stale.breachDays * 24;
  const ageHours = daysSince * 24;
  const pct = daysSince / cfg.stale.breachDays;
  const escalate = daysSince >= cfg.stale.breachDays * cfg.escalation.multiplier;

  let severity: SLASeverity;
  if (daysSince >= cfg.stale.breachDays) severity = 'breached';
  else if (daysSince >= cfg.stale.atRiskDays) severity = 'at_risk';
  else severity = 'healthy';

  return { severity, ageHours, limitHours, pct, resolvedAt: null, escalate };
}

// ── Public API ────────────────────────────────────────────────────────────────

export function computeLeadSLA(
  lead: Lead,
  now: Date = new Date(),
  config?: SLAConfig,
): LeadSLAResult {
  const cfg = config ?? getSLAConfig();
  const firstResponse = computeFirstResponse(lead, now, cfg);
  const followUp = computeFollowUp(lead, now, cfg);
  const stale = computeStale(lead, now, cfg);

  // overall = worst non-na severity
  let overall: SLASeverity = 'healthy';
  for (const t of [firstResponse, followUp, stale]) {
    if (t.severity !== 'na') overall = worst(overall, t.severity);
  }

  return {
    firstResponse,
    followUp,
    stale,
    overall,
    escalate: firstResponse.escalate || followUp.escalate || stale.escalate,
  };
}

export const HEALTHY_SLA_RESULT: LeadSLAResult = {
  firstResponse: naTrack(),
  followUp: naTrack(),
  stale: naTrack(),
  overall: 'healthy',
  escalate: false,
};
