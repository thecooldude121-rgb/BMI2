/**
 * dealState.ts — canonical deal-card state resolution utility.
 *
 * This module is the single source of truth for visual priority states on
 * Kanban deal cards.  Previously, four independent helper functions
 * (accentBorderColor, healthChip, closeDateDot, chipLabel) each partially
 * expressed the deal's condition, creating four competing signals with no
 * shared priority ordering.
 *
 * Architecture:
 *   resolveDealState(deal, closeDaysLeft, isClosed)
 *     → ResolvedDealState { primary, isHighValue, ... }
 *     → consumed by DealKanbanCard to drive ALL visual treatments
 *
 * State priority (highest to lowest):
 *   1. overdue           — close date already passed, deal still active
 *   2. stalled           — no contact for 7+ days, or health is 'stalled'
 *   3. at-risk           — health is 'at-risk', or closing in ≤7d with stale contact
 *   4. missing-next-step — no next-step status AND last activity > 3 days old
 *   5. high-confidence   — aiScore ≥ 80, healthy, not overdue
 *   6. normal            — everything else
 *
 * High-value is a MODIFIER (amount ≥ $100K) that stacks with any primary
 * state rather than replacing it.  A deal can be both stalled AND high-value.
 *
 * Visual language decisions:
 *   - Only 'overdue' and 'stalled' receive a card background tint.
 *     These are the two states that demand immediate action.  All others use
 *     border + chip only — less noise, faster scanning.
 *   - Tints are very subtle (4-6% opacity equivalent via Tailwind bg-{color}/30)
 *     — enough to distinguish a column at a glance without making the board
 *     look like a traffic light.
 *   - The chip uses a colored status dot rather than a fully saturated filled
 *     background for at-risk and below — lower visual weight.
 *   - High-value uses a typographic ◆ prefix on the amount, not a new border
 *     or chip, because it is informational (not urgent).
 *   - Left border is the first thing the eye hits on a 280px-wide card.
 *     It carries the primary urgency signal so the rep can triage a column
 *     before reading any text.
 */

import type { DealCard } from '../components/Deal/DealKanbanCard';

// ── State types ───────────────────────────────────────────────────────────────

/** Primary visual state — exactly one applies per card. */
export type PrimaryDealState =
  | 'overdue'           // close date passed, deal still active — needs immediate attention
  | 'stalled'           // no contact 7+ days or health=stalled — momentum lost
  | 'at-risk'           // health=at-risk or deadline near with stale contact — trending bad
  | 'missing-next-step' // no status/next step planned — deal is drifting
  | 'high-confidence'   // strong AI score + healthy — likely to close
  | 'normal';           // no special condition — default treatment

/**
 * Full resolved state passed to the card renderer.
 * Drives every visual treatment: border, chip, tint, icons.
 */
export interface ResolvedDealState {
  /** The dominant state — drives border color, chip style, and tint. */
  primary: PrimaryDealState;

  /**
   * High-value modifier — amount ≥ $100K.
   * Stacks with any primary state; adds ◆ prefix to the amount display.
   * Does not change border or chip so it doesn't create noise on urgent cards.
   */
  isHighValue: boolean;

  /** Human-readable chip label rendered inside the status pill. */
  chipLabel: string;

  /** Accessible description for aria-label and tooltip text. */
  description: string;
}

// ── Visual tokens ─────────────────────────────────────────────────────────────

/**
 * All visual tokens for a state in one place.
 * DealKanbanCard reads these directly — no inline color strings in JSX.
 *
 * Dark mode: the `dark` variants should be applied as Tailwind class strings
 * where the framework supports them.  For border colors (CSS custom property
 * territory) use the `darkBorder` token with a `dark:` class override.
 */
export interface StateTokens {
  /** Left border CSS color value. */
  borderColor: string;
  /** Tailwind classes for the chip background. */
  chipBg: string;
  /** Tailwind classes for the chip text. */
  chipText: string;
  /** Tailwind class for the colored dot inside the chip. */
  chipDot: string;
  /**
   * Optional very-subtle card background tint.
   * Only applied to 'overdue' and 'stalled' — the two states needing
   * immediate action.  Empty string = plain white card.
   */
  cardTint: string;
  /** Dark-mode override for borderColor (used as a CSS variable or class). */
  darkBorderColor: string;
}

export const STATE_TOKENS: Record<PrimaryDealState, StateTokens> = {
  overdue: {
    // Red — deadline missed.  Highest urgency.  Card gets a faint red tint so
    // the whole card reads "danger" without needing to parse the chip text.
    borderColor:     '#ef4444', // red-500
    chipBg:          'bg-red-50',
    chipText:        'text-red-700',
    chipDot:         'bg-red-500',
    cardTint:        'bg-red-50/40',
    darkBorderColor: '#fca5a5', // red-300 in dark contexts
  },
  stalled: {
    // Amber — momentum lost.  Faint amber card tint signals the deal needs a
    // nudge without being as loud as red.
    borderColor:     '#f59e0b', // amber-500
    chipBg:          'bg-amber-50',
    chipText:        'text-amber-700',
    chipDot:         'bg-amber-500',
    cardTint:        'bg-amber-50/40',
    darkBorderColor: '#fcd34d', // amber-300
  },
  'at-risk': {
    // Orange — between amber and red on the urgency ladder.
    // No card tint — the chip + border are sufficient.
    borderColor:     '#f97316', // orange-500
    chipBg:          'bg-orange-50',
    chipText:        'text-orange-700',
    chipDot:         'bg-orange-500',
    cardTint:        '',
    darkBorderColor: '#fdba74', // orange-300
  },
  'missing-next-step': {
    // Slate — neutral-warning.  Deal isn't actively sick but lacks direction.
    // Understated so it doesn't compete with genuine risk signals.
    borderColor:     '#94a3b8', // slate-400
    chipBg:          'bg-slate-50',
    chipText:        'text-slate-600',
    chipDot:         'bg-slate-400',
    cardTint:        '',
    darkBorderColor: '#94a3b8',
  },
  'high-confidence': {
    // Emerald — positive signal.  Restrained: no tint, subtle border.
    // Helps managers quickly spot deals worth prioritising attention.
    borderColor:     '#10b981', // emerald-500
    chipBg:          'bg-emerald-50',
    chipText:        'text-emerald-700',
    chipDot:         'bg-emerald-500',
    cardTint:        '',
    darkBorderColor: '#6ee7b7', // emerald-300
  },
  normal: {
    // Indigo-300 — present as a drag affordance cue but intentionally quiet.
    borderColor:     '#818cf8', // indigo-400
    chipBg:          'bg-gray-50',
    chipText:        'text-gray-600',
    chipDot:         'bg-gray-400',
    cardTint:        '',
    darkBorderColor: '#a5b4fc', // indigo-300
  },
};

// ── Resolution thresholds ─────────────────────────────────────────────────────
// Centralised so product/design can adjust criteria in one place.

const STALLED_DAYS       = 7;   // days without contact before "stalled"
const AT_RISK_CLOSE_DAYS = 7;   // days to close date that triggers at-risk (with stale contact)
const AT_RISK_STALE_DAYS = 3;   // days since contact that, combined with near close, = at-risk
const MISSING_STEP_DAYS  = 3;   // days since contact before "missing next step" applies
const HIGH_CONFIDENCE_AI = 80;  // aiScore threshold for high-confidence state
const HIGH_VALUE_AMOUNT  = 100_000; // deal value threshold for the high-value modifier

// ── Main resolver ─────────────────────────────────────────────────────────────

/**
 * Resolves the card's primary visual state and modifiers from deal data.
 *
 * @param deal         - The DealCard data object.
 * @param closeDaysLeft - Pre-computed days-from-now (null if no close date).
 *                        Pass the result of daysFromNow(deal.closeDate).
 * @param isClosed     - True if stage is 'closed-won' or 'closed-lost'.
 *
 * Priority order (first matching rule wins):
 *   1. overdue           closeDaysLeft < 0 (and not closed)
 *   2. stalled           daysSinceContact >= 7  OR  health === 'stalled'
 *   3. at-risk           health === 'at-risk'
 *                        OR (closeDaysLeft <= 7 AND daysSinceContact >= 3)
 *   4. missing-next-step !deal.status AND daysSinceContact >= 3
 *   5. high-confidence   aiScore >= 80 AND health === 'healthy' AND not overdue
 *   6. normal            (fallback)
 */
export function resolveDealState(
  deal: DealCard,
  closeDaysLeft: number | null,
  isClosed: boolean,
): ResolvedDealState {
  const isHighValue = deal.amount >= HIGH_VALUE_AMOUNT;

  // Closed stages get a simplified treatment — no urgency states apply.
  if (isClosed) {
    return {
      primary:     'normal',
      isHighValue,
      chipLabel:   deal.stage === 'closed-won' ? 'Won' : 'Lost',
      description: deal.stage === 'closed-won'
        ? `Deal won${isHighValue ? ' — high value' : ''}`
        : `Deal lost`,
    };
  }

  // ── Rule 1: Overdue ──────────────────────────────────────────────────────
  // Close date has passed and deal is still active.  The most visible failure
  // mode — the rep missed the self-imposed deadline.
  if (closeDaysLeft !== null && closeDaysLeft < 0) {
    const daysOver = Math.abs(closeDaysLeft);
    return {
      primary:     'overdue',
      isHighValue,
      chipLabel:   `Overdue ${daysOver}d`,
      description: `Close date was ${daysOver} day${daysOver !== 1 ? 's' : ''} ago — follow up immediately`,
    };
  }

  // ── Rule 2: Stalled ──────────────────────────────────────────────────────
  // No contact for 7+ days (momentum lost) or explicitly health=stalled.
  // Amber — needs a nudge but isn't catastrophically late.
  const isStalled = deal.daysSinceContact >= STALLED_DAYS || deal.health === 'stalled';
  if (isStalled) {
    return {
      primary:     'stalled',
      isHighValue,
      chipLabel:   `Stalled ${deal.daysSinceContact}d`,
      description: `No contact for ${deal.daysSinceContact} days — deal may be going cold`,
    };
  }

  // ── Rule 3: At Risk ──────────────────────────────────────────────────────
  // Explicit at-risk health flag, OR the deal is closing soon but contact
  // has been stale for 3+ days (danger combo: deadline near, rep silent).
  const isNearAndStale =
    closeDaysLeft !== null &&
    closeDaysLeft <= AT_RISK_CLOSE_DAYS &&
    deal.daysSinceContact >= AT_RISK_STALE_DAYS;

  if (deal.health === 'at-risk' || isNearAndStale) {
    const reason = deal.health === 'at-risk'
      ? 'Deal flagged at risk'
      : `Closing in ${closeDaysLeft}d but no contact for ${deal.daysSinceContact}d`;
    return {
      primary:     'at-risk',
      isHighValue,
      chipLabel:   'At Risk',
      description: reason,
    };
  }

  // ── Rule 4: Missing Next Step ────────────────────────────────────────────
  // The deal has no next step/status defined AND the rep hasn't been in touch
  // for 3+ days.  Not dangerous yet, but deal is drifting without direction.
  const hasNextStep = Boolean(deal.nextStep?.trim());
  if (!hasNextStep && deal.daysSinceContact >= MISSING_STEP_DAYS) {
    return {
      primary:     'missing-next-step',
      isHighValue,
      chipLabel:   'No Next Step',
      description: `No next step set — add a follow-up action to keep this deal moving`,
    };
  }

  // ── Rule 5: High Confidence ──────────────────────────────────────────────
  // Strong AI score + healthy health + not overdue = likely to close.
  // Shown with emerald so managers can quickly identify deals to fast-track.
  if (deal.aiScore >= HIGH_CONFIDENCE_AI && deal.health === 'healthy') {
    return {
      primary:     'high-confidence',
      isHighValue,
      chipLabel:   'High Confidence',
      description: `AI score ${deal.aiScore}/100 — strong close probability`,
    };
  }

  // ── Rule 6: Normal ───────────────────────────────────────────────────────
  // No active signal — chip is hidden; only the activity timestamp shows on the
  // right side of Zone 3.  description is used only in aria-label / title,
  // never rendered as inline text on the card.
  return {
    primary:     'normal',
    isHighValue,
    chipLabel:   '',
    description: 'Active deal — no issues flagged',
  };
}
