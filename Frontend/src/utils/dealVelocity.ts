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

/*
 * STAGE ORDER COMES FROM THE WORKSPACE, not from this file.
 *
 * There used to be two constants here — ACTIVE_STAGES (four slugs) and
 * CLOSED_STAGES ('closed-won', 'closed-lost') — with a comment saying they
 * "must match deal.stage values exactly, update when pipeline stages change".
 * That was already false for live data:
 *
 *   - A Renewals or Partnerships deal matched NEITHER list. `CLOSED_STAGES` did
 *     not contain `renewal-won` or `partner-active`, so velocity was computed
 *     for deals that are already closed — for a metric this file's own comment
 *     calls "past-tense and not actionable".
 *   - `ACTIVE_STAGES.indexOf` returned -1 for every one of those stages, and the
 *     code took its "unknown stage" branch: stageProgress = 0.5, a hardcoded
 *     midpoint. So a renewals deal one step from renewal-won and one fresh out
 *     of renewal-review both scored exactly 50% progress.
 *
 * The caller now passes the stage's real metadata. When it cannot — the
 * pipelines have not loaded, or the stage is not in any pipeline — this returns
 * null rather than falling back to the old guess. Declining to rate a deal is
 * honest; rating it from a midpoint that means nothing is not.
 */
import type { StageMeta } from './pipelinesApi';

// ── Main function ─────────────────────────────────────────────────────────────

export function getDealVelocity(
  deal: DealForVelocity,
  stageMeta?: StageMeta | null,
): DealVelocity | null {
  // Guard: an unresolvable stage. Not an error — the pipelines may simply not
  // have loaded yet — but nothing below can be computed truthfully without it.
  if (!stageMeta) return null;

  // Guard: closed deals — velocity is past-tense and not actionable. By
  // stage_type, so it is right in every pipeline rather than only the default.
  if (stageMeta.stage_type !== 'open') return null;

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

  // Stage progress: position among the pipeline's OPEN stages, 1-indexed so the
  // first stage is not 0%. Terminal stages are excluded from the denominator —
  // they were from the old ACTIVE_STAGES too — so a four-open-stage pipeline and
  // a six-open-stage one both run 0 to 1.
  const stageProgress = stageMeta.openTotal > 0 && stageMeta.openIndex
    ? stageMeta.openIndex / stageMeta.openTotal
    : 0;

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
