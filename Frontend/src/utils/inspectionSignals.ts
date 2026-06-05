/**
 * inspectionSignals.ts — pipeline inspection analytics for Manager Mode.
 *
 * All signals are computed purely from the in-memory stages data — no API
 * calls, no backend round-trips.  The output drives both the ManagerInspectionBar
 * summary panel and the per-card badge overlays.
 *
 * To add a new signal:
 *   1. Add the threshold constant below.
 *   2. Add the computed array to InspectionSignals.
 *   3. Populate it in computeInspectionSignals().
 *   4. Add a badge case to getInspectionBadge().
 */

import type { DealCard } from '../components/Deal/DealKanbanCard';
import { daysFromNow } from './dateUtils';

// ── Thresholds ────────────────────────────────────────────────────────────────

const NO_ACTIVITY_DAYS      = 7;      // daysSinceContact ≥ this → "no activity"
const NO_NEXT_STEP_DAYS     = 3;      // no nextStep + stale contact → "no next step"
const HIGH_RISK_MIN_AMOUNT  = 50_000; // amount ≥ this + at-risk/stalled → "high risk $"

// ── Types ─────────────────────────────────────────────────────────────────────

/** Per-owner summary used in the Rep Overview row. */
export interface OwnerStats {
  owner: string;
  total: number;
  stalled: number;
  noActivity: number;
  overdue: number;
  noNextStep: number;
  nextStepOverdue: number;
  totalValue: number;
  /** Total flagged issues — drives sort order and warning badge count. */
  flagCount: number;
}

/** All inspection signals derived from the pipeline state. */
export interface InspectionSignals {
  /** Active deals with no contact for NO_ACTIVITY_DAYS+ days. */
  noActivity: DealCard[];
  /** Active deals whose close date has already passed. */
  overdueClose: DealCard[];
  /** Active deals with no next step and a stale contact. */
  noNextStep: DealCard[];
  /** Active deals whose next step due date has passed and is not marked done. */
  nextStepOverdue: DealCard[];
  /** High-value deals that are at-risk or stalled. */
  highRiskHighValue: DealCard[];
  /** Per-owner breakdown for the rep filter row, sorted by flagCount desc. */
  byOwner: OwnerStats[];
  /** Top 3 risky high-value deals sorted by amount desc — shown as a quick list. */
  topRiskyDeals: DealCard[];
  /** All unique active deal owners (for the rep picker). */
  allOwners: string[];
}

// ── Badge descriptor ──────────────────────────────────────────────────────────

/** The inspection badge to show on a card in manager mode.  Null = no badge. */
export interface InspectionBadge {
  /** Text shown on the badge chip. */
  label: string;
  /** Tailwind classes for background and text. */
  style: string;
  /** Short tooltip explaining the signal. */
  title: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns today's date as YYYY-MM-DD for due-date comparisons. */
function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

// ── Main computation ──────────────────────────────────────────────────────────

/**
 * Compute all inspection signals from the current in-memory pipeline state.
 *
 * @param stages      — the full PipelineStage[] array from component state.
 * @param filterOwner — when set to a non-empty string, signals are scoped
 *                      to that owner only (used when a rep chip is active).
 */
export function computeInspectionSignals(
  stages: { id: string; deals: DealCard[] }[],
  filterOwner = '',
): InspectionSignals {
  // Dedup across stages; exclude closed deals from actionable signals
  const allDealsMap = new Map<string, DealCard>();
  stages.forEach(s => s.deals.forEach(d => allDealsMap.set(d.id, d)));
  const allDeals = Array.from(allDealsMap.values());

  const activeDeals = allDeals.filter(
    d => !['closed-won', 'closed-lost'].includes(d.stage)
  );

  const scoped = filterOwner
    ? activeDeals.filter(d => d.owner === filterOwner)
    : activeDeals;

  const today = todayISO();

  // ── Signal: no recent activity ──────────────────────────────────────────
  const noActivity = scoped
    .filter(d => d.daysSinceContact >= NO_ACTIVITY_DAYS)
    .sort((a, b) => b.daysSinceContact - a.daysSinceContact);

  // ── Signal: overdue close date ──────────────────────────────────────────
  const overdueClose = scoped
    .filter(d => {
      if (!d.closeDate) return false;
      return (daysFromNow(d.closeDate) ?? 0) < 0;
    })
    .sort((a, b) => (daysFromNow(a.closeDate) ?? 0) - (daysFromNow(b.closeDate) ?? 0));

  // ── Signal: no next step ────────────────────────────────────────────────
  const noNextStep = scoped
    .filter(d => !d.nextStep?.trim() && d.daysSinceContact >= NO_NEXT_STEP_DAYS)
    .sort((a, b) => b.amount - a.amount);

  // ── Signal: next step overdue ───────────────────────────────────────────
  // A next step is set, has a due date that has passed, and is not yet done.
  const nextStepOverdue = scoped
    .filter(d =>
      d.nextStep?.trim() &&
      d.nextStepDueDate &&
      d.nextStepDueDate < today &&
      d.nextStepStatus !== 'done'
    )
    .sort((a, b) => (a.nextStepDueDate ?? '').localeCompare(b.nextStepDueDate ?? ''));

  // ── Signal: high-risk, high-value ───────────────────────────────────────
  const highRiskHighValue = scoped
    .filter(d =>
      d.amount >= HIGH_RISK_MIN_AMOUNT &&
      (d.health === 'at-risk' || d.health === 'stalled' || d.daysSinceContact >= 5)
    )
    .sort((a, b) => b.amount - a.amount);

  // ── Per-owner summary ────────────────────────────────────────────────────
  const ownerMap = new Map<string, OwnerStats>();

  activeDeals.forEach(d => {
    const key = d.owner || 'Unassigned';
    if (!ownerMap.has(key)) {
      ownerMap.set(key, {
        owner: key, total: 0, stalled: 0, noActivity: 0,
        overdue: 0, noNextStep: 0, nextStepOverdue: 0, totalValue: 0, flagCount: 0,
      });
    }
    const s = ownerMap.get(key)!;
    s.total++;
    s.totalValue += d.amount;

    const isNoActivity      = d.daysSinceContact >= NO_ACTIVITY_DAYS;
    const isOverdue         = d.closeDate ? (daysFromNow(d.closeDate) ?? 0) < 0 : false;
    const isNoStep          = !d.nextStep?.trim() && d.daysSinceContact >= NO_NEXT_STEP_DAYS;
    const isStepOverdue     = Boolean(
      d.nextStep?.trim() && d.nextStepDueDate && d.nextStepDueDate < today && d.nextStepStatus !== 'done'
    );
    const isStalled         = d.health === 'stalled' || d.daysSinceContact >= 5;

    if (isNoActivity)  { s.noActivity++;      s.flagCount++; }
    if (isOverdue)     { s.overdue++;         s.flagCount++; }
    if (isNoStep)      { s.noNextStep++;      s.flagCount++; }
    if (isStepOverdue) { s.nextStepOverdue++; s.flagCount++; }
    if (isStalled)       s.stalled++;
  });

  const byOwner = Array.from(ownerMap.values())
    .sort((a, b) => b.flagCount - a.flagCount);

  return {
    noActivity,
    overdueClose,
    noNextStep,
    nextStepOverdue,
    highRiskHighValue,
    byOwner,
    topRiskyDeals: highRiskHighValue.slice(0, 3),
    allOwners: byOwner.map(o => o.owner),
  };
}

// ── Per-card badge ─────────────────────────────────────────────────────────────

/**
 * Returns the highest-priority inspection badge for a card.  Priority:
 *   1. overdue close date    (missed deadline — most urgent)
 *   2. next step overdue     (committed action past its due date)
 *   3. stalled / no activity (momentum lost)
 *   4. no next step          (deal drifting)
 *   5. at-risk               (trending bad)
 *
 * Only one badge is shown per card to avoid noise.
 */
export function getInspectionBadge(deal: DealCard): InspectionBadge | null {
  if (['closed-won', 'closed-lost'].includes(deal.stage)) return null;

  const today    = todayISO();
  const daysLeft = deal.closeDate ? daysFromNow(deal.closeDate) : null;

  if (daysLeft !== null && daysLeft < 0) {
    const daysOver = Math.abs(daysLeft);
    return {
      label: `📅 ${daysOver}d late`,
      style: 'bg-red-100 text-red-700 border border-red-200',
      title: `Close date was ${daysOver} day${daysOver !== 1 ? 's' : ''} ago`,
    };
  }

  if (
    deal.nextStep?.trim() &&
    deal.nextStepDueDate &&
    deal.nextStepDueDate < today &&
    deal.nextStepStatus !== 'done'
  ) {
    const overdueDays = Math.abs(daysFromNow(deal.nextStepDueDate) ?? 0);
    return {
      label: `⏰ Step ${overdueDays}d late`,
      style: 'bg-orange-100 text-orange-700 border border-orange-200',
      title: `Next step "${deal.nextStep}" was due ${overdueDays}d ago`,
    };
  }

  if (deal.daysSinceContact >= NO_ACTIVITY_DAYS || deal.health === 'stalled') {
    const days = deal.daysSinceContact;
    return {
      label: `⏱ ${days}d silent`,
      style: 'bg-amber-100 text-amber-800 border border-amber-200',
      title: `No contact for ${days} days — deal may be going cold`,
    };
  }

  if (!deal.nextStep?.trim() && deal.daysSinceContact >= NO_NEXT_STEP_DAYS) {
    return {
      label: '⚠ No step',
      style: 'bg-slate-100 text-slate-700 border border-slate-200',
      title: 'No next step defined — deal is drifting',
    };
  }

  if (deal.health === 'at-risk') {
    return {
      label: '🔴 At risk',
      style: 'bg-orange-100 text-orange-700 border border-orange-200',
      title: 'Deal flagged at risk',
    };
  }

  return null;
}
