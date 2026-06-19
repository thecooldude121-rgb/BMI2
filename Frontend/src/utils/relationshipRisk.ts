/**
 * relationshipRisk.ts — Relationship Risk indicator engine.
 *
 * Measures the strength of the human relationship between the rep and the
 * account contacts. Separate from Win Score (deal health), which measures
 * close probability. A deal can have high win probability but a fragile
 * relationship, or vice versa.
 *
 * Pure function — no React, no API calls, fully unit-testable.
 * Each signal is a named, boolean check — no hidden weighting.
 */

export type RelationshipTier = 'strong' | 'fair' | 'weak';

export interface RelationshipSignal {
  label: string;
  passed: boolean;
  detail?: string;
}

export interface RelationshipRisk {
  tier: RelationshipTier;
  signals: RelationshipSignal[];
  actionSuggestion: string;
}

// Minimum shape required. Matches the Deal interface in DealsListView.tsx.
export interface DealForRelationship {
  contactName?: string;
  daysSinceContact?: number;
  lastActivity?: string;
  stakeholderCount?: number;
  hasChampion?: boolean;
  lastMeetingDaysAgo?: number | null;
  stage?: string;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function daysAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function getDaysSinceContact(deal: DealForRelationship): number | null {
  if (typeof deal.daysSinceContact === 'number') return deal.daysSinceContact;
  if (deal.lastActivity) return daysAgo(deal.lastActivity);
  return null;
}

const LATE_STAGE_KEYWORDS = ['proposal', 'negotiation', 'closing', 'decision', 'contract'];

function isLateStage(stage: string | undefined): boolean {
  if (!stage) return false;
  const lower = stage.toLowerCase();
  return LATE_STAGE_KEYWORDS.some(kw => lower.includes(kw));
}

// ── Main function ─────────────────────────────────────────────────────────────

export function getRelationshipRisk(deal: DealForRelationship): RelationshipRisk {
  const signals: RelationshipSignal[] = [];

  // Signal 1 — Primary contact exists
  const hasContact = !!(deal.contactName?.trim());
  signals.push({
    label: 'Primary contact linked',
    passed: hasContact,
    detail: hasContact
      ? deal.contactName
      : 'No contact linked to this deal',
  });

  // Signal 2 — Days since last contact (≤7d = healthy, >7d = risk)
  const daysSince = getDaysSinceContact(deal);
  const contactPassed = daysSince !== null && daysSince <= 7;
  signals.push({
    label: 'Recent contact',
    passed: contactPassed,
    detail: daysSince === null
      ? 'No contact activity recorded'
      : daysSince <= 3
        ? `Last contact ${daysSince}d ago`
        : daysSince <= 7
          ? `Last contact ${daysSince}d ago`
          : `No contact for ${daysSince} days`,
  });

  // Signal 3 — Multi-threaded (2+ stakeholders)
  const stakeCount = deal.stakeholderCount ?? 0;
  const multiThreaded = stakeCount >= 2;
  signals.push({
    label: 'Multi-threaded (2+ stakeholders)',
    passed: multiThreaded,
    detail: stakeCount === 0
      ? 'No stakeholders tracked'
      : stakeCount === 1
        ? 'Single contact — not multi-threaded'
        : `${stakeCount} stakeholders tracked`,
  });

  // Signal 4 — Champion identified
  const champExists = deal.hasChampion ?? false;
  signals.push({
    label: 'Champion identified',
    passed: champExists,
    detail: champExists
      ? 'Internal champion identified'
      : 'No champion identified at account',
  });

  // Signal 5 — Last meeting recency (late-stage deals only; ≤14d = healthy)
  if (isLateStage(deal.stage)) {
    const meetDays = deal.lastMeetingDaysAgo;
    const meetingPassed = meetDays !== null && meetDays !== undefined && meetDays <= 14;
    signals.push({
      label: 'Recent meeting',
      passed: meetingPassed,
      detail: meetDays === null || meetDays === undefined
        ? 'No meeting logged in late stage'
        : meetDays <= 14
          ? `Last meeting ${meetDays}d ago`
          : `No meeting in ${meetDays} days (late stage)`,
    });
  }

  // Tier: 0 failures = strong, 1 failure = fair, 2+ failures = weak
  const failCount = signals.filter(s => !s.passed).length;
  const tier: RelationshipTier = failCount === 0
    ? 'strong'
    : failCount === 1
      ? 'fair'
      : 'weak';

  // Action suggestion — first failing signal drives the recommendation
  const firstFail = signals.find(s => !s.passed);
  const actionSuggestion: string = (() => {
    if (!firstFail) return 'Relationship is healthy — maintain regular check-ins';
    switch (firstFail.label) {
      case 'Primary contact linked':
        return 'Link a primary contact to this deal immediately';
      case 'Recent contact':
        return `Reach out to ${deal.contactName || 'the contact'} today`;
      case 'Multi-threaded (2+ stakeholders)':
        return 'Identify and add a second stakeholder at this account';
      case 'Champion identified':
        return 'Identify and confirm an internal champion at this account';
      case 'Recent meeting':
        return 'Schedule a meeting — no face time in a late-stage deal is a risk';
      default:
        return 'Review relationship signals and take action';
    }
  })();

  return { tier, signals, actionSuggestion };
}
