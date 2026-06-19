/**
 * dealVelocity.ts — Deal Velocity indicator engine.
 *
 * Measures pace of deal progress vs the time budget defined by
 * (createdAt → closeDate). Separate from Win Score (probability) and
 * Relationship Risk (human connection) — velocity answers:
 * "Is this deal moving fast enough relative to its own deadline?"
 *
 * Algorithm: velocityRatio = stageProgress / timeConsumed
 *   stageProgress  = position_of_current_stage / total_active_stages (0–1)
 *   timeConsumed   = daysInPipeline / totalBudgetDays (0–1+)
 *   ratio > 1.1    → Ahead
 *   ratio 0.7–1.1  → On Track
 *   ratio < 0.7    → Slipping
 *
 * Pure function — no React, no API calls, fully unit-testable.
 */

export type VelocityRating = 'ahead' | 'on-track' | 'slipping' | 'new' | 'unknown';

export interface DealVelocity {
  rating: VelocityRating;
  stageProgress: number;    // 0.0–1.0: how far through active pipeline stages
  timeConsumed: number;     // 0.0–1.0+: proportion of close-date budget used
  velocityRatio: number;    // stageProgress / timeConsumed
  daysInPipeline: number;
  totalBudgetDays: number;
  label: string;            // "Ahead" | "On Track" | "Slipping" | "New"
}

// Minimum shape required. Matches the Deal interface in DealsListView.tsx.
export interface DealForVelocity {
  stage?: string;
  createdAt?: string;
  closeDate?: string;
}

// ── Stage order ───────────────────────────────────────────────────────────────
// STAGE_ORDER must match deal.stage values exactly — update when pipeline stages change.

const ACTIVE_STAGES = ['prospecting', 'qualified', 'proposal', 'negotiation'];
const CLOSED_STAGES = new Set(['closed-won', 'closed-lost']);

// ── Main function ─────────────────────────────────────────────────────────────

export function getDealVelocity(deal: DealForVelocity): DealVelocity | null {
  const stage = (deal.stage ?? '').toLowerCase();

  // Guard: closed deals — velocity is past-tense and not actionable
  if (CLOSED_STAGES.has(stage)) return null;

  // Guard: missing required fields
  if (!deal.createdAt || !deal.closeDate) return null;

  const created  = new Date(deal.createdAt);
  const closeDate = new Date(deal.closeDate);
  const today    = new Date();

  // Guard: invalid dates
  if (isNaN(created.getTime()) || isNaN(closeDate.getTime())) return null;

  // Guard: close date must be after creation
  if (closeDate <= created) return null;

  const totalBudgetDays = Math.max(1, Math.round(
    (closeDate.getTime() - created.getTime()) / 86_400_000
  ));
  const daysInPipeline = Math.max(0, Math.round(
    (today.getTime() - created.getTime()) / 86_400_000
  ));

  // Guard: deal too new (< 5 days) — ratio is statistically noisy
  if (daysInPipeline < 5) {
    return {
      rating: 'new',
      stageProgress: 0,
      timeConsumed: 0,
      velocityRatio: 0,
      daysInPipeline,
      totalBudgetDays,
      label: 'New',
    };
  }

  // Stage progress: position in active pipeline (1-indexed, so first stage ≠ 0%)
  const stageIndex = ACTIVE_STAGES.indexOf(stage);
  const stageProgress = stageIndex === -1
    ? 0.5  // unknown stage — assume midpoint rather than erroring
    : (stageIndex + 1) / ACTIVE_STAGES.length;

  // Time consumed: may exceed 1.0 for overdue deals — correct slipping behavior
  const timeConsumed = daysInPipeline / totalBudgetDays;

  // Velocity ratio — the core signal
  const velocityRatio = timeConsumed === 0 ? 1 : stageProgress / timeConsumed;

  const rating: VelocityRating = velocityRatio > 1.1 ? 'ahead'
    : velocityRatio >= 0.7      ? 'on-track'
    : 'slipping';

  const label = rating === 'ahead' ? 'Ahead'
    : rating === 'on-track'        ? 'On Track'
    : 'Slipping';

  return {
    rating,
    stageProgress,
    timeConsumed,
    velocityRatio,
    daysInPipeline,
    totalBudgetDays,
    label,
  };
}
