/**
 * dealNextBestAction.ts — deterministic Next Best Action engine for deal cards.
 *
 * Pure rule-based utility: no React, no LLM, no API calls.
 * Rules fire in priority order — first match wins.
 * Stage name is the proxy for activity type (e.g. "Proposal Sent" + 8d gap
 * → "proposal sent N days ago and no follow-up"). No real activity log needed.
 */

export type NBAUrgency = 'high' | 'medium' | 'low';

export interface NextBestAction {
  text: string;        // full sentence for expanded panel
  shortLabel: string;  // max 6 words for inline table display
  urgency: NBAUrgency;
}

// Structural subset of the Deal interface in DealsListView.tsx.
// TypeScript's structural typing means Deal satisfies DealForNBA automatically.
export interface DealForNBA {
  stage?: string;
  closeDate?: string;
  daysSinceContact?: number;
  lastActivity?: string;
  contactName?: string;
  nextStep?: string;
  nextStepDueDate?: string;
  aiScore?: number;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function daysBetween(dateA: Date, dateB: Date): number {
  return Math.round(Math.abs(dateA.getTime() - dateB.getTime()) / 86_400_000);
}

function daysAgo(dateStr: string): number {
  return daysBetween(new Date(dateStr), new Date());
}

function daysUntil(dateStr: string): number {
  return Math.round((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

function isClosedStage(stage: string): boolean {
  const lower = stage.toLowerCase();
  return lower.includes('closed') || lower.includes('won') || lower.includes('lost');
}

function getDaysSinceContact(deal: DealForNBA): number | null {
  if (typeof deal.daysSinceContact === 'number') return deal.daysSinceContact;
  if (deal.lastActivity) return daysAgo(deal.lastActivity);
  return null;
}

// ── Main function ─────────────────────────────────────────────────────────────

export function getNextBestAction(deal: DealForNBA): NextBestAction {
  const stage = deal.stage ?? '';
  const isClosed = stage ? isClosedStage(stage) : false;
  const daysSinceContact = getDaysSinceContact(deal);
  const closeDateDaysUntil = deal.closeDate ? daysUntil(deal.closeDate) : null;
  const hasContact = !!(deal.contactName?.trim());
  const hasNextStep = !!(deal.nextStep?.trim());
  const aiScore = deal.aiScore ?? null;

  // Closed deals — no action needed
  if (isClosed) {
    const isWon = stage.toLowerCase().includes('won');
    return {
      text: isWon
        ? 'Deal closed won — no further action needed'
        : 'Deal closed lost — consider archiving or running a loss analysis',
      shortLabel: isWon ? 'Closed won' : 'Closed lost',
      urgency: 'low',
    };
  }

  // PRIORITY 1 — Close date has passed
  if (closeDateDaysUntil !== null && closeDateDaysUntil < 0) {
    const daysOver = Math.abs(closeDateDaysUntil);
    return {
      text: `Close date passed ${daysOver} day${daysOver !== 1 ? 's' : ''} ago — mark won, lost, or reschedule`,
      shortLabel: 'Close date passed',
      urgency: 'high',
    };
  }

  // PRIORITY 2 — No primary contact linked
  if (!hasContact) {
    return {
      text: `Add a primary contact before advancing this deal beyond ${stage || 'current stage'}`,
      shortLabel: 'No contact linked',
      urgency: 'high',
    };
  }

  // PRIORITY 3 — Stalled (≥7d no contact) in a late stage (Proposal or beyond)
  const LATE_STAGE_KEYWORDS = ['proposal', 'negotiation', 'closing', 'decision', 'contract'];
  const isLateStage = LATE_STAGE_KEYWORDS.some(kw => stage.toLowerCase().includes(kw));
  if (daysSinceContact !== null && daysSinceContact >= 7 && isLateStage) {
    return {
      text: `Follow up within 24h — in ${stage} but no contact for ${daysSinceContact} day${daysSinceContact !== 1 ? 's' : ''}`,
      shortLabel: `No contact ${daysSinceContact}d — follow up`,
      urgency: 'high',
    };
  }

  // PRIORITY 4 — Closing within 7 days with stale contact (3+ days)
  if (closeDateDaysUntil !== null && closeDateDaysUntil >= 0 && closeDateDaysUntil <= 7) {
    if (daysSinceContact !== null && daysSinceContact >= 3) {
      return {
        text: `Confirm close plan — closing in ${closeDateDaysUntil} day${closeDateDaysUntil !== 1 ? 's' : ''}, last contact was ${daysSinceContact} days ago`,
        shortLabel: `Closing in ${closeDateDaysUntil}d — confirm plan`,
        urgency: 'high',
      };
    }
    return {
      text: `Closing in ${closeDateDaysUntil} day${closeDateDaysUntil !== 1 ? 's' : ''} — ensure all stakeholders are aligned`,
      shortLabel: `Closing in ${closeDateDaysUntil}d`,
      urgency: 'medium',
    };
  }

  // PRIORITY 5 — Overdue next step
  if (deal.nextStepDueDate) {
    const nextStepDaysUntil = daysUntil(deal.nextStepDueDate);
    if (nextStepDaysUntil < 0) {
      const daysLate = Math.abs(nextStepDaysUntil);
      return {
        text: `Next step was due ${daysLate} day${daysLate !== 1 ? 's' : ''} ago — complete or reschedule it`,
        shortLabel: `Next step ${daysLate}d overdue`,
        urgency: 'medium',
      };
    }
  }

  // PRIORITY 6 — No next step defined
  if (!hasNextStep) {
    return {
      text: 'Set a next step to keep this deal moving forward',
      shortLabel: 'Set a next step',
      urgency: 'medium',
    };
  }

  // PRIORITY 7 — High win score, healthy deal — positive signal
  if (aiScore !== null && aiScore >= 70) {
    const closingSuffix = closeDateDaysUntil !== null
      ? ` — closes in ${closeDateDaysUntil} day${closeDateDaysUntil !== 1 ? 's' : ''}`
      : '';
    return {
      text: `Strong win signal (score: ${aiScore})${closingSuffix} — keep momentum and confirm close plan`,
      shortLabel: 'Strong signal — keep momentum',
      urgency: 'low',
    };
  }

  // PRIORITY 8 — Fallback: deal appears on track
  const closingSuffix = closeDateDaysUntil !== null
    ? ` before the ${deal.closeDate} close date`
    : '';
  return {
    text: `Deal is on track — check in with ${deal.contactName ?? 'the contact'}${closingSuffix}`,
    shortLabel: 'On track — check in',
    urgency: 'low',
  };
}
