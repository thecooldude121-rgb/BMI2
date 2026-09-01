import type { DealStageHistoryEntry } from './dealsApi';

/**
 * Turning `deal_stage_history` rows into the stage-duration view the deal
 * detail page renders.
 *
 * WHAT THIS REPLACES
 * `ComprehensiveDealDetailPage` rendered a hardcoded five-row array —
 * "Prospecting 5 days (Nov 15 → Nov 20, benchmark 7)", "Qualified 12 days",
 * "Proposal 8 days" — identical for every deal anyone opened. The table it
 * should have been reading (migration 014) has existed the whole time.
 *
 * WHAT IS DELIBERATELY NOT HERE
 *   - `benchmark` / `benchmarkMin` / `benchmarkMax`. The invented version
 *     carried "benchmark 7 days" per stage. Nothing computes a benchmark: it
 *     would need a cohort of closed deals segmented by pipeline, and that
 *     analysis does not exist. The fields are dropped rather than defaulted.
 *   - Future stages as `pending` rows. The old array listed Negotiation and
 *     Closed-Won with `days: 0`, which reads as "this deal has reached the
 *     ladder and is partway up". History records what HAPPENED. A stage the
 *     deal has never entered is not a zero-length stay in it.
 *
 * DURATION IS DERIVED, NOT STORED, and that is correct: a row records the
 * moment of a transition, so the time spent in a stage is the gap to the next
 * transition. The stage the deal is in now has no closing row yet, so its
 * duration runs to `now` and it is marked `current`.
 */

export interface DealStageSpan {
  name: string;
  /** Whole days spent in this stage. For the current stage, days so far. */
  days: number;
  /** ISO instant the deal entered this stage; '' when it predates the audit trail. */
  startedAt: string;
  /** ISO instant it left. '' while it is still in this stage. */
  endedAt: string;
  status: 'completed' | 'current';
  /** Display name of whoever recorded the move INTO this stage, when known. */
  changedBy: string | null;
  /** Probability stored on the deal after the move, and whether a human set it. */
  probability: number | null;
  probabilityOverride: boolean;
  reasonCode: string | null;
  note: string | null;
}

const wholeDaysBetween = (fromIso: string, toMs: number): number => {
  const from = new Date(fromIso).getTime();
  if (!Number.isFinite(from)) return 0;
  return Math.max(0, Math.floor((toMs - from) / 86_400_000));
};

/**
 * @param entries  Rows from GET /deals/:id/stage-history, newest first (the
 *                 order the endpoint returns them in).
 * @param now      Injectable clock, so the current stage's duration is testable.
 */
export function buildStageSpans(
  entries: DealStageHistoryEntry[],
  now: number = Date.now(),
): DealStageSpan[] {
  if (!entries.length) return [];

  // The endpoint orders by changed_at DESC. Work forwards in time instead —
  // a stage's end is the next transition, which is easier to read ascending.
  const ascending = [...entries].sort(
    (a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime(),
  );

  const spans: DealStageSpan[] = [];

  // The stage the deal was in BEFORE the audit trail starts. `from_stage` on
  // the earliest row names it, and it is real information — but its start is
  // genuinely unknown, because nothing recorded when the deal entered it. Days
  // is 0 and startedAt is '' rather than a guess at the creation date: a deal
  // can be created directly into a later stage, so created_at is not reliably
  // when it entered this one.
  const earliest = ascending[0];
  if (earliest.from_stage) {
    spans.push({
      name: earliest.from_stage,
      days: 0,
      startedAt: '',
      endedAt: earliest.changed_at,
      status: 'completed',
      changedBy: null,
      probability: null,
      probabilityOverride: false,
      reasonCode: null,
      note: null,
    });
  }

  ascending.forEach((entry, idx) => {
    const next = ascending[idx + 1];
    const isCurrent = !next;
    const endMs = isCurrent ? now : new Date(next.changed_at).getTime();
    spans.push({
      name: entry.to_stage,
      days: wholeDaysBetween(entry.changed_at, endMs),
      startedAt: entry.changed_at,
      endedAt: isCurrent ? '' : next.changed_at,
      status: isCurrent ? 'current' : 'completed',
      changedBy: entry.changed_by,
      probability: entry.probability,
      probabilityOverride: entry.probability_override,
      reasonCode: entry.reason_code,
      note: entry.note,
    });
  });

  return spans;
}
