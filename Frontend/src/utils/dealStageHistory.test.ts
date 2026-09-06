import { describe, it, expect } from 'vitest';
import { buildStageSpans } from './dealStageHistory';
import type { DealStageHistoryEntry } from './dealsApi';

const entry = (o: Partial<DealStageHistoryEntry> & { to_stage: string; changed_at: string }): DealStageHistoryEntry => ({
  id: o.id ?? Math.random().toString(36).slice(2),
  from_stage: o.from_stage ?? null,
  to_stage: o.to_stage,
  probability: o.probability ?? null,
  probability_override: o.probability_override ?? false,
  reason_code: o.reason_code ?? null,
  note: o.note ?? null,
  changed_by: o.changed_by ?? null,
  changed_at: o.changed_at,
});

const NOW = Date.parse('2026-01-20T00:00:00Z');

describe('buildStageSpans', () => {
  it('returns nothing when the deal has no recorded transitions', () => {
    // The honest answer for a deal nobody has moved since the audit trail
    // existed. The page must render an empty state, not a default ladder.
    expect(buildStageSpans([], NOW)).toEqual([]);
  });

  it('derives each stage duration from the gap to the next transition', () => {
    const spans = buildStageSpans([
      // Newest first, as the endpoint returns them.
      entry({ from_stage: 'qualified', to_stage: 'proposal', changed_at: '2026-01-10T00:00:00Z' }),
      entry({ from_stage: 'prospecting', to_stage: 'qualified', changed_at: '2026-01-04T00:00:00Z' }),
    ], NOW);

    // 'prospecting' is recovered from the earliest row's from_stage.
    expect(spans.map(s => s.name)).toEqual(['prospecting', 'qualified', 'proposal']);
    expect(spans[1].days).toBe(6);   // Jan 4 -> Jan 10
    expect(spans[2].days).toBe(10);  // Jan 10 -> now (Jan 20)
  });

  it('marks only the latest stage current and the rest completed', () => {
    const spans = buildStageSpans([
      entry({ from_stage: 'qualified', to_stage: 'proposal', changed_at: '2026-01-10T00:00:00Z' }),
      entry({ from_stage: 'prospecting', to_stage: 'qualified', changed_at: '2026-01-04T00:00:00Z' }),
    ], NOW);
    expect(spans.map(s => s.status)).toEqual(['completed', 'completed', 'current']);
    expect(spans[spans.length - 1].endedAt).toBe('');
  });

  it('gives the pre-audit stage no invented start date or duration', () => {
    // Nothing recorded when the deal entered its first stage, and created_at is
    // not a substitute — a deal can be created directly into a later stage.
    const spans = buildStageSpans([
      entry({ from_stage: 'prospecting', to_stage: 'qualified', changed_at: '2026-01-04T00:00:00Z' }),
    ], NOW);
    expect(spans[0]).toMatchObject({ name: 'prospecting', days: 0, startedAt: '' });
  });

  it('omits the pre-audit stage when the first transition has no from_stage', () => {
    const spans = buildStageSpans([
      entry({ from_stage: null, to_stage: 'prospecting', changed_at: '2026-01-04T00:00:00Z' }),
    ], NOW);
    expect(spans.map(s => s.name)).toEqual(['prospecting']);
  });

  it('carries attribution and the override flag through unchanged', () => {
    const spans = buildStageSpans([
      entry({
        from_stage: 'qualified', to_stage: 'proposal', changed_at: '2026-01-10T00:00:00Z',
        changed_by: 'Priya Nair', probability: 65, probability_override: true,
        reason_code: 'timeline-slip', note: 'Client pushed the review.',
      }),
    ], NOW);
    // spans[0] is the recovered pre-audit 'qualified' stage, which carries no
    // attribution by design; the transition itself is spans[1].
    expect(spans[1]).toMatchObject({
      changedBy: 'Priya Nair',
      probability: 65,
      probabilityOverride: true,
      reasonCode: 'timeline-slip',
      note: 'Client pushed the review.',
    });
  });

  it('never reports a negative duration when rows share a timestamp', () => {
    const spans = buildStageSpans([
      entry({ to_stage: 'proposal', changed_at: '2026-01-10T00:00:00Z' }),
      entry({ to_stage: 'qualified', changed_at: '2026-01-10T00:00:00Z' }),
    ], NOW);
    expect(spans.every(s => s.days >= 0)).toBe(true);
  });

  it('exposes no benchmark field — nothing computes one', () => {
    const spans = buildStageSpans([
      entry({ to_stage: 'proposal', changed_at: '2026-01-10T00:00:00Z' }),
    ], NOW);
    expect(spans[0]).not.toHaveProperty('benchmark');
  });
});
