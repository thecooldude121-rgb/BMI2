/**
 * dealHealthDrivers.ts — explainable AI health driver model.
 *
 * Decouples the score (backend win probability) from its explanation
 * (client-computed observable signals).  The score is authoritative;
 * the drivers are the "why", computed purely from DealCard fields.
 *
 * Rules:
 *   - Pure function — no React, no side-effects, fully unit-testable.
 *   - No delta numbers — drivers describe facts, not arithmetic.
 *   - Both risks AND positives are surfaced.
 *   - Actions appear only on risks, kept to ≤4 words.
 *   - Impact tiers drive display priority: high → medium → low.
 */

import type { DealCard } from '../components/Deal/DealKanbanCard';
import { computeCommitteeCoverage } from './dealCommittee';

// ── Public types ──────────────────────────────────────────────────────────────

export type DriverImpact    = 'high' | 'medium' | 'low';
export type DriverSentiment = 'risk' | 'positive';

export interface HealthDriver {
  id: string;
  /** Sales-friendly label — e.g. "12 days without contact". */
  label: string;
  sentiment: DriverSentiment;
  impact: DriverImpact;
  /** Suggested action (risks only). ≤5 words. */
  action?: string;
}

export type ScoreTier = 'strong' | 'fair' | 'weak';

export interface DealHealthExplanation {
  score: number;
  tier: ScoreTier;
  tierLabel: string;
  /** One-sentence summary of the deal's dominant condition. */
  headline: string;
  risks: HealthDriver[];
  positives: HealthDriver[];
  /** Highest-priority risk, or null when the deal is clean. */
  topRisk: HealthDriver | null;
  /** True when any risk has impact='high' → drives the amber dot on the card. */
  hasHighRisk: boolean;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

const IMPACT_ORDER: Record<DriverImpact, number> = { high: 0, medium: 1, low: 2 };

function sortByImpact(drivers: HealthDriver[]): HealthDriver[] {
  return [...drivers].sort((a, b) => IMPACT_ORDER[a.impact] - IMPACT_ORDER[b.impact]);
}

function resolveTier(score: number): { tier: ScoreTier; tierLabel: string } {
  if (score >= 75) return { tier: 'strong', tierLabel: 'Strong momentum'   };
  if (score >= 50) return { tier: 'fair',   tierLabel: 'Needs attention'   };
  return                  { tier: 'weak',   tierLabel: 'At risk — act now' };
}

function buildHeadline(topRisk: HealthDriver | null, tier: ScoreTier): string {
  if (topRisk?.impact === 'high') {
    switch (topRisk.id) {
      case 'no-activity':       return `${topRisk.label} — re-engage now`;
      case 'close-overdue':     return 'Close date has passed — update or push to close';
      case 'stalled':           return 'Deal has gone cold — schedule a touchpoint';
      case 'next-step-overdue': return 'Committed next step is overdue';
      case 'competitor':          return 'Competitor in play — strengthen your position';
      case 'no-next-step':        return 'No next step — deal is drifting without direction';
      case 'no-decision-maker':   return 'No decision maker engaged — critical gap in the buying committee';
      case 'blocker-no-champion': return 'Blocker present with no champion — high internal risk';
    }
  }
  switch (tier) {
    case 'strong': return 'Solid momentum — keep the cadence going';
    case 'fair':   return 'A few gaps to address before this deal slips';
    case 'weak':   return 'Multiple risk signals — immediate attention needed';
  }
}

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Compute the full health explanation for a deal card.
 *
 * @param deal         DealCard from the pipeline board.
 * @param closeDaysLeft Pre-computed daysFromNow(deal.closeDate). Null = no date set.
 */
export function explainDealHealth(
  deal: DealCard,
  closeDaysLeft: number | null,
): DealHealthExplanation {
  const risks:     HealthDriver[] = [];
  const positives: HealthDriver[] = [];
  const today = new Date().toISOString().split('T')[0];
  const dsc   = deal.daysSinceContact;

  // ── 1. Activity recency ──────────────────────────────────────────────────
  if (dsc >= 14) {
    risks.push({
      id: 'no-activity', sentiment: 'risk', impact: 'high',
      label: `${dsc} days without contact`,
      action: 'Log a touchpoint',
    });
  } else if (dsc >= 7) {
    risks.push({
      id: 'no-activity', sentiment: 'risk', impact: 'medium',
      label: `${dsc} days without contact`,
      action: 'Log a touchpoint',
    });
  } else if (dsc === 0) {
    positives.push({
      id: 'recent-activity', sentiment: 'positive', impact: 'medium',
      label: 'Active today',
    });
  } else if (dsc <= 3) {
    positives.push({
      id: 'recent-activity', sentiment: 'positive', impact: 'low',
      label: `Active ${dsc} day${dsc > 1 ? 's' : ''} ago`,
    });
  }

  // ── 2. Next step presence ────────────────────────────────────────────────
  const hasStep = Boolean(deal.nextStep?.trim());
  if (!hasStep && dsc >= 3) {
    risks.push({
      id: 'no-next-step', sentiment: 'risk', impact: 'high',
      label: 'No next step defined',
      action: 'Add a next step',
    });
  } else if (hasStep) {
    positives.push({
      id: 'has-next-step', sentiment: 'positive', impact: 'low',
      label: 'Next step committed',
    });
  }

  // ── 3. Next step overdue ─────────────────────────────────────────────────
  if (hasStep && deal.nextStepDueDate && deal.nextStepDueDate < today && deal.nextStepStatus !== 'done') {
    risks.push({
      id: 'next-step-overdue', sentiment: 'risk', impact: 'high',
      label: 'Next step is overdue',
      action: 'Mark done or reschedule',
    });
  }

  // ── 4. Close date ────────────────────────────────────────────────────────
  if (closeDaysLeft !== null) {
    if (closeDaysLeft < 0) {
      risks.push({
        id: 'close-overdue', sentiment: 'risk', impact: 'high',
        label: 'Close date has passed',
        action: 'Update close date',
      });
    } else if (closeDaysLeft <= 7) {
      positives.push({
        id: 'closing-soon', sentiment: 'positive', impact: 'medium',
        label: 'Closing this week',
      });
    } else if (closeDaysLeft <= 30) {
      positives.push({
        id: 'closing-month', sentiment: 'positive', impact: 'low',
        label: 'Closing this month',
      });
    }
  }

  // ── 5. Deal health enum ──────────────────────────────────────────────────
  if (deal.health === 'stalled') {
    risks.push({
      id: 'stalled', sentiment: 'risk', impact: 'high',
      label: 'Deal has gone cold',
      action: 'Re-engage immediately',
    });
  } else if (deal.health === 'at-risk') {
    risks.push({
      id: 'at-risk', sentiment: 'risk', impact: 'medium',
      label: 'Flagged at risk',
      action: 'Review deal status',
    });
  } else if (deal.health === 'healthy') {
    positives.push({
      id: 'healthy', sentiment: 'positive', impact: 'low',
      label: 'Deal health good',
    });
  }

  // ── 6. Buying-committee coverage ─────────────────────────────────────────
  // Role-aware signals replace the old generic contactCount check.
  const cov = computeCommitteeCoverage(deal.stakeholders);

  if (cov.all.length === 0) {
    risks.push({
      id: 'no-stakeholders', sentiment: 'risk', impact: 'medium',
      label: 'No stakeholders mapped',
      action: 'Add buying committee',
    });
  } else if (cov.isSingleThreaded) {
    risks.push({
      id: 'single-thread', sentiment: 'risk', impact: 'medium',
      label: 'Single contact — not multi-threaded',
      action: 'Add more stakeholders',
    });
  }

  if (!cov.hasDecisionMaker && cov.all.length > 0) {
    risks.push({
      id: 'no-decision-maker', sentiment: 'risk', impact: 'high',
      label: 'No decision maker engaged',
      action: 'Identify the DM',
    });
  }

  if (!cov.hasChampion && cov.all.length > 0) {
    risks.push({
      id: 'no-champion', sentiment: 'risk', impact: 'medium',
      label: 'No internal champion identified',
      action: 'Find an internal advocate',
    });
  }

  if (cov.hasBlockerWithoutChampion) {
    risks.push({
      id: 'blocker-no-champion', sentiment: 'risk', impact: 'high',
      label: 'Blocker present — no champion to counter',
      action: 'Neutralise or find advocate',
    });
  } else if (cov.blockers.length > 0) {
    risks.push({
      id: 'blocker', sentiment: 'risk', impact: 'medium',
      label: `${cov.blockers.length > 1 ? `${cov.blockers.length} blockers` : 'Blocker'} identified`,
      action: 'Develop counter-strategy',
    });
  }

  if (cov.coverageLabel === 'Strong') {
    positives.push({
      id: 'strong-committee', sentiment: 'positive', impact: 'medium',
      label: `${cov.all.length} stakeholders — all critical roles covered`,
    });
  } else if (cov.all.length > 1 && !cov.isSingleThreaded) {
    positives.push({
      id: 'multi-thread', sentiment: 'positive', impact: 'low',
      label: `${cov.all.length} stakeholders engaged`,
    });
  }

  // ── 7. Competitor presence ───────────────────────────────────────────────
  const compCount = deal.competitorCount ?? 0;
  if (compCount > 0) {
    risks.push({
      id: 'competitor', sentiment: 'risk', impact: 'high',
      label: `${compCount} competitor${compCount > 1 ? 's' : ''} in play`,
      action: 'Strengthen differentiation',
    });
  }

  // ── 8. HRMS connection ───────────────────────────────────────────────────
  if (deal.isHRMS) {
    positives.push({
      id: 'hrms', sentiment: 'positive', impact: 'medium',
      label: 'Embedded in customer systems',
    });
  }

  // ── 9. Strategic value ───────────────────────────────────────────────────
  if (deal.amount >= 100_000) {
    positives.push({
      id: 'high-value', sentiment: 'positive', impact: 'low',
      label: 'Strategic deal — high priority',
    });
  }

  const sortedRisks     = sortByImpact(risks);
  const sortedPositives = sortByImpact(positives);
  const topRisk         = sortedRisks[0] ?? null;
  const hasHighRisk     = sortedRisks.some(r => r.impact === 'high');
  const { tier, tierLabel } = resolveTier(deal.aiScore);

  return {
    score:    deal.aiScore,
    tier,
    tierLabel,
    headline: buildHeadline(topRisk, tier),
    risks:    sortedRisks,
    positives: sortedPositives,
    topRisk,
    hasHighRisk,
  };
}
