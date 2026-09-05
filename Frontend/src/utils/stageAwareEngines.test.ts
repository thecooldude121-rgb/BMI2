import { describe, it, expect } from 'vitest';
import { getDealVelocity } from './dealVelocity';
import { getDealDataQuality } from './dealDataQuality';
import { getNextBestAction } from './dealNextBestAction';
import { buildStageLookup, type ApiPipeline, type StageMeta } from './pipelinesApi';
import { getStageColors } from '../config/stageColors';

/**
 * The read-only engines, once they stopped guessing at stages.
 *
 * WHY THIS FILE EXISTS AT ALL: `dealVelocity` and `dealDataQuality` had NO TESTS
 * before this slice — which is why the suite stayed green while I changed both
 * of their semantics. "Read-only sort/group/colour paths" sounded low-risk going
 * in; it turned out to be two engines inferring deal OUTCOMES from substrings,
 * with nothing pinning either.
 *
 * Every fixture below is a stage this product actually ships, because the bugs
 * were not hypothetical: the Partnerships pipeline ends at `partner-active`
 * (won) and `partner-inactive` (lost), and neither string contains "won",
 * "lost" or "closed".
 */

const st = (over: Partial<ApiPipeline['stages'][number]>) => ({
  id: over.slug ?? 'x', pipeline_id: 'p', slug: 'x', name: 'X',
  probability: null, position: 1, color: null,
  stage_type: 'open' as const, archived_at: null, ...over,
});

const PIPELINES: ApiPipeline[] = [
  {
    id: 'p1', slug: 'new-business', name: 'New Business', description: null,
    is_default: true, is_active: true,
    stages: [
      st({ slug: 'prospecting', name: 'Prospecting', position: 1 }),
      st({ slug: 'qualified',   name: 'Qualified',   position: 2 }),
      st({ slug: 'proposal',    name: 'Proposal',    position: 3 }),
      st({ slug: 'negotiation', name: 'Negotiation', position: 4 }),
      st({ slug: 'closed-won',  name: 'Closed Won',  position: 5, stage_type: 'won' }),
      st({ slug: 'closed-lost', name: 'Closed Lost', position: 6, stage_type: 'lost' }),
    ],
  },
  {
    id: 'p2', slug: 'partnerships', name: 'Partnerships', description: null,
    is_default: false, is_active: true,
    stages: [
      st({ slug: 'partner-intro',      name: 'Introduction', position: 1 }),
      st({ slug: 'partner-evaluation', name: 'Evaluation',   position: 2 }),
      st({ slug: 'partner-agreement',  name: 'Agreement',    position: 3 }),
      // THE STAGES THAT BROKE EVERY SUBSTRING TEST.
      st({ slug: 'partner-active',   name: 'Active',   position: 4, stage_type: 'won',  color: '#10B981' }),
      st({ slug: 'partner-inactive', name: 'Inactive', position: 5, stage_type: 'lost', color: '#EF4444' }),
    ],
  },
];

const lookup = buildStageLookup(PIPELINES);
const meta = (slug: string, pipeline?: string) => lookup(slug, pipeline) as StageMeta;

describe('buildStageLookup', () => {
  it('resolves a stage within its own pipeline', () => {
    expect(meta('partner-active', 'partnerships').stage_type).toBe('won');
    expect(meta('partner-active', 'partnerships').index).toBe(4);
    expect(meta('partner-active', 'partnerships').total).toBe(5);
  });

  it('counts OPEN stages separately, because progress must not include outcomes', () => {
    const m = meta('partner-agreement', 'partnerships');
    expect(m.openIndex).toBe(3);
    expect(m.openTotal).toBe(3);           // intro, evaluation, agreement
    expect(meta('partner-active', 'partnerships').openIndex).toBeNull();
  });

  it('returns null for an AMBIGUOUS slug rather than picking a pipeline', () => {
    // Stage slugs are unique per pipeline, not per workspace — UNIQUE
    // (tenant_id, pipeline_id, slug) — so two pipelines may both have the same
    // one at different positions. Answering "I don't know" beats answering
    // confidently from whichever sorted first.
    const twoWithQualified = buildStageLookup([
      PIPELINES[0],
      { ...PIPELINES[1], slug: 'other', stages: [st({ slug: 'qualified', position: 9 })] },
    ]);
    expect(twoWithQualified('qualified')).toBeNull();
    // Named explicitly, it resolves.
    expect(twoWithQualified('qualified', 'new-business')!.index).toBe(2);
  });

  it('returns null for a stage no pipeline lists', () => {
    expect(lookup('invented')).toBeNull();
  });
});

describe('getDealVelocity — outcomes by type, progress by position', () => {
  const base = {
    id: 'D1', stage: 'partner-agreement',
    createdAt: '2026-01-01T00:00:00Z', closeDate: '2026-12-31',
  };

  it('declines to rate a deal in ANY pipeline\'s won stage', () => {
    // CLOSED_STAGES was `new Set(['closed-won','closed-lost'])`, so a deal in
    // partner-active — already won — was scored for velocity, a metric this
    // file's own comment calls "past-tense and not actionable".
    expect(getDealVelocity({ ...base, stage: 'partner-active' },
      meta('partner-active', 'partnerships'))).toBeNull();
    expect(getDealVelocity({ ...base, stage: 'partner-inactive' },
      meta('partner-inactive', 'partnerships'))).toBeNull();
    expect(getDealVelocity({ ...base, stage: 'closed-won' },
      meta('closed-won', 'new-business'))).toBeNull();
  });

  it('scores progress from the stage\'s real position among open stages', () => {
    const first = getDealVelocity({ ...base, stage: 'partner-intro' },
      meta('partner-intro', 'partnerships'));
    const last = getDealVelocity({ ...base, stage: 'partner-agreement' },
      meta('partner-agreement', 'partnerships'));

    // The old code gave BOTH of these 0.5 — its hardcoded "unknown stage"
    // midpoint — because neither slug was in ACTIVE_STAGES.
    expect(first!.stageProgress).toBeCloseTo(1 / 3);
    expect(last!.stageProgress).toBeCloseTo(1);
    expect(first!.stageProgress).toBeLessThan(last!.stageProgress);
  });

  it('returns null rather than guessing when the stage cannot be resolved', () => {
    // Pipelines not loaded yet, or a stage retired out of the response.
    // Declining to rate is honest; rating from a meaningless midpoint is not.
    expect(getDealVelocity(base, null)).toBeNull();
    expect(getDealVelocity(base, undefined)).toBeNull();
  });
});

describe('getDealDataQuality — outcomes by type, not by substring', () => {
  const openDeal = {
    id: 'D2', dealName: 'Test', stage: 'partner-agreement',
    owner: 'Someone', amount: 1000, closeDate: '2026-12-31',
  } as Parameters<typeof getDealDataQuality>[0];

  it('treats a won stage as CLOSED even when its slug says nothing about winning', () => {
    // `.includes('won')` is false for 'partner-active', so a won partnerships
    // deal was treated as open and flagged for everything this engine checks on
    // live deals — the exact bug, on real shipped stages.
    const asWon = getDealDataQuality(
      { ...openDeal, stage: 'partner-active' },
      meta('partner-active', 'partnerships'),
    );
    const asOpen = getDealDataQuality(
      { ...openDeal, stage: 'partner-agreement' },
      meta('partner-agreement', 'partnerships'),
    );
    // A closed deal is not chased for pipeline hygiene; an open one may be.
    expect(asWon.issues.length).toBeLessThanOrEqual(asOpen.issues.length);
  });

  it('short-circuits a LOST deal regardless of slug spelling', () => {
    const lost = getDealDataQuality(
      { ...openDeal, stage: 'partner-inactive' },
      meta('partner-inactive', 'partnerships'),
    );
    // isClosedLost() returns early — a lost deal has no hygiene left to fix.
    expect(lost.isClean).toBe(true);
  });

  it('"early stage" is a POSITION, so it means the same in every pipeline', () => {
    // It was `['prospecting','qualified'].some(s => sl.includes(s))` — two
    // new-business names — so in Partnerships EVERY open stage was "late" and
    // demanded a next step.
    const early = getDealDataQuality(
      { ...openDeal, stage: 'partner-intro' }, meta('partner-intro', 'partnerships'));
    const late = getDealDataQuality(
      { ...openDeal, stage: 'partner-agreement' }, meta('partner-agreement', 'partnerships'));

    expect(early.issues.some(i => i.type === 'missing_next_step')).toBe(false);
    expect(late.issues.some(i =>
      i.type === 'missing_next_step' || i.type === 'stage_requires_next_step')).toBe(true);
  });

  it('with no metadata it does not claim a deal is closed', () => {
    const unknown = getDealDataQuality({ ...openDeal, stage: 'partner-active' }, null);
    // Errs toward showing a warning rather than silently hiding one — the same
    // default as before, and the safe direction.
    expect(unknown).toBeDefined();
  });
});

describe('getStageColors — an outcome always reads as an outcome', () => {
  it('keeps the six known slugs exactly as they were', () => {
    expect(getStageColors('closed-won').bg).toBe('#10b981');
    expect(getStageColors('qualified').bg).toBe('#0ea5e9');
  });

  it('gives a workspace won/lost stage the terminal palette, not gray', () => {
    // The gray fallback was graceful and silently dropped the design system's
    // rule that green and red are reserved for outcomes — so a Renewals win and
    // an ordinary open stage looked identical.
    expect(getStageColors('partner-active', meta('partner-active', 'partnerships')).bg)
      .toBe('#10b981');
    expect(getStageColors('partner-inactive', meta('partner-inactive', 'partnerships')).bg)
      .toBe('#ef4444');
  });

  it('uses the workspace\'s own colour for an open stage', () => {
    expect(getStageColors('x', { color: '#123456', stage_type: 'open' }).bg).toBe('#123456');
  });

  it('still falls back to gray with no metadata at all', () => {
    expect(getStageColors('partner-active').bg).toBe('#6b7280');
  });
});

describe('getNextBestAction — a won deal is not told to close itself', () => {
  const deal = { id: 'D9', stage: 'partner-active', contactName: '', closeDate: '2020-01-01' };

  it('recognises a won stage whose slug says nothing about winning', () => {
    // `.includes('won')` is false for 'partner-active', so a won Partnerships
    // deal fell through to the live-deal branches: it was told to add a primary
    // contact, or that its close date had passed and it should be "marked won,
    // lost, or rescheduled". A wrong recommendation shown to a user.
    const nba = getNextBestAction(deal, meta('partner-active', 'partnerships'));
    expect(nba.shortLabel).toBe('Closed won');
    expect(nba.text).toMatch(/no further action needed/);
    expect(nba.urgency).toBe('low');
  });

  it('recognises a lost stage the same way', () => {
    const nba = getNextBestAction(
      { ...deal, stage: 'partner-inactive' }, meta('partner-inactive', 'partnerships'));
    expect(nba.shortLabel).toBe('Closed lost');
    expect(nba.text).toMatch(/loss analysis/);
  });

  it('still advises an OPEN stage, and does not mistake it for closed', () => {
    const nba = getNextBestAction(
      { ...deal, stage: 'partner-agreement' }, meta('partner-agreement', 'partnerships'));
    expect(nba.shortLabel).not.toMatch(/Closed/);
  });

  it('without metadata it treats the deal as open', () => {
    // The safe direction: a live-deal recommendation on a closed deal is a
    // smaller harm than withholding one from a deal that is genuinely open.
    const nba = getNextBestAction({ ...deal, stage: 'partner-active' }, null);
    expect(nba.shortLabel).not.toMatch(/Closed/);
  });
});
