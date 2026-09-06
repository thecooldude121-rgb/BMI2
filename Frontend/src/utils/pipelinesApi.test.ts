import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchPipelines, defaultPipeline, stageTint, findPipeline, terminalStage,
  stageIndex, stageHex, type ApiPipeline,
} from './pipelinesApi';

/**
 * The pipelines client — Phase B.
 *
 * The board's columns now come from here instead of a six-element literal, so
 * the two things that must not go wrong are: a failed request must not look like
 * an empty workspace, and the choice of which pipeline to open on must be the
 * workspace's default rather than whatever happened to sort first.
 */

const stage = (over: Partial<ApiPipeline['stages'][number]> = {}) => ({
  id: 's1', pipeline_id: 'p1', slug: 'qualified', name: 'Qualified',
  probability: 40, position: 2, color: '#3B82F6',
  stage_type: 'open' as const, archived_at: null, ...over,
});

const pipeline = (over: Partial<ApiPipeline> = {}): ApiPipeline => ({
  id: 'p1', slug: 'new-business', name: 'New Business', description: null,
  is_default: true, is_active: true, stages: [stage()], ...over,
});

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (k === 'authToken' ? 'test-token' : null),
    setItem: () => {}, removeItem: () => {}, clear: () => {}, key: () => null, length: 0,
  } as unknown as Storage);
  fetchMock = vi.fn(async () => ({
    ok: true, status: 200,
    json: async () => ({ success: true, data: [pipeline()] }),
  } as Response));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('fetchPipelines', () => {
  it('calls GET /pipelines with the auth header and returns the stages', async () => {
    const list = await fetchPipelines();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:5001/api/v1/pipelines');
    expect(((init as RequestInit).headers as Record<string, string>).Authorization)
      .toBe('Bearer test-token');
    expect(list[0].stages[0].slug).toBe('qualified');
  });

  it('asks for archived stages only when told to', async () => {
    await fetchPipelines();
    expect(fetchMock.mock.calls[0][0]).not.toMatch(/include_archived/);
    await fetchPipelines(true);
    expect(fetchMock.mock.calls[1][0]).toMatch(/\?include_archived=true$/);
  });

  it('THROWS on failure rather than returning an empty list', async () => {
    // The predecessor in dealsApi did `return []` on error, so a broken board and
    // a workspace with no pipelines were the same value. An empty list is a claim
    // about the workspace; a failed request is a claim about the request.
    fetchMock.mockImplementation(async () => ({
      ok: false, status: 500,
      json: async () => ({ success: false, message: 'Database unavailable' }),
    } as Response));

    await expect(fetchPipelines()).rejects.toThrow('Database unavailable');
  });

  it('throws when the server answers 200 with success:false', async () => {
    fetchMock.mockImplementation(async () => ({
      ok: true, status: 200,
      json: async () => ({ success: false, message: 'Not authorised' }),
    } as Response));
    await expect(fetchPipelines()).rejects.toThrow('Not authorised');
  });
});

describe('defaultPipeline', () => {
  it('picks the workspace default, not the first in the array', async () => {
    const chosen = defaultPipeline([
      pipeline({ slug: 'partnerships', is_default: false }),
      pipeline({ slug: 'new-business', is_default: true }),
    ]);
    expect(chosen!.slug).toBe('new-business');
  });

  it('falls back to the first when none is marked default', () => {
    const chosen = defaultPipeline([
      pipeline({ slug: 'renewals', is_default: false }),
      pipeline({ slug: 'partnerships', is_default: false }),
    ]);
    expect(chosen!.slug).toBe('renewals');
  });

  it('returns null for an empty list rather than inventing a pipeline', () => {
    // A workspace with no pipeline cannot hold a deal at all, so the board must
    // say that — not render an empty skeleton that reads as "no deals yet".
    expect(defaultPipeline([])).toBeNull();
  });
});

describe('stageTint', () => {
  it('maps the stored hex to a real Tailwind class', () => {
    // Interpolating hex into a class name silently produces no background,
    // because Tailwind compiles only the classes it can see at build time.
    expect(stageTint({ color: '#3B82F6', stage_type: 'open' })).toBe('bg-sky-50');
    expect(stageTint({ color: '#10B981', stage_type: 'won' })).toBe('bg-emerald-50');
  });

  it('is case-insensitive about the stored hex', () => {
    expect(stageTint({ color: '#3b82f6', stage_type: 'open' })).toBe('bg-sky-50');
  });

  it('keeps won/lost semantics when the colour is unknown or missing', () => {
    // A workspace that picks an off-palette colour must not lose the meaning of
    // a terminal stage — green and red are reserved for outcomes by the design
    // system, and that rule has to survive an arbitrary hex.
    expect(stageTint({ color: '#123456', stage_type: 'won' })).toBe('bg-emerald-50');
    expect(stageTint({ color: null, stage_type: 'lost' })).toBe('bg-red-50');
  });

  it('falls back to a neutral tint for an unknown colour on an open stage', () => {
    expect(stageTint({ color: '#123456', stage_type: 'open' })).toBe('bg-slate-50');
    expect(stageTint({ color: null, stage_type: 'open' })).toBe('bg-slate-50');
  });
});

/**
 * The deal detail page's helpers — Phase B slice 2.
 *
 * These replace five parallel hardcoded maps (STAGE_LADDER and STAGE_MAP on the
 * page; ORDERED_STAGES, STAGE_KEY_MAP and STAGE_HEX in the hero), every one of
 * them keyed on a stage number 1-6 and therefore only ever correct for the
 * new-business ladder. The Renewals fixture below is what each of them got wrong.
 */
const renewals: ApiPipeline = {
  id: 'p2', slug: 'renewals', name: 'Renewals', description: null,
  is_default: false, is_active: true,
  stages: [
    stage({ id: 'r1', slug: 'renewal-review', name: 'Under Review', position: 1, probability: 60 }),
    stage({ id: 'r2', slug: 'renewal-quoted', name: 'Quoted', position: 2, probability: 75 }),
    stage({ id: 'r3', slug: 'renewal-negotiation', name: 'Negotiating', position: 3, probability: 85 }),
    stage({ id: 'r4', slug: 'renewal-won', name: 'Renewed', position: 4, stage_type: 'won', color: '#10B981' }),
    stage({ id: 'r5', slug: 'renewal-lost', name: 'Churned', position: 5, stage_type: 'lost', color: '#EF4444' }),
  ],
};

describe('findPipeline', () => {
  it('finds a deal\'s pipeline by slug', () => {
    expect(findPipeline([pipeline(), renewals], 'renewals')!.name).toBe('Renewals');
  });
  it('returns null for an unknown or absent slug rather than guessing', () => {
    expect(findPipeline([pipeline()], 'renewals')).toBeNull();
    expect(findPipeline([pipeline()], null)).toBeNull();
  });
});

describe('terminalStage', () => {
  it('finds the pipeline\'s OWN won stage, not the literal closed-won', () => {
    // The bug this replaces: "Mark as Won" wrote 'closed-won' for every deal, so
    // a Renewals deal was sent a stage that does not exist in its pipeline.
    expect(terminalStage(renewals, 'won')!.slug).toBe('renewal-won');
    expect(terminalStage(renewals, 'lost')!.slug).toBe('renewal-lost');
  });

  it('skips a RETIRED outcome stage', () => {
    const retired: ApiPipeline = {
      ...renewals,
      stages: renewals.stages.map(s =>
        s.slug === 'renewal-won' ? { ...s, archived_at: '2026-09-01T00:00:00Z' } : s),
    };
    // Retiring a stage must stop new deals reaching it, outcome or not.
    expect(terminalStage(retired, 'won')).toBeNull();
  });

  it('returns null when the pipeline has no such outcome, rather than falling back', () => {
    // Migration 037 reports pipelines in this state precisely because deals in
    // them cannot be closed. The caller must say so, not pick something.
    const noOutcome: ApiPipeline = { ...renewals, stages: renewals.stages.slice(0, 3) };
    expect(terminalStage(noOutcome, 'won')).toBeNull();
    expect(terminalStage(null, 'won')).toBeNull();
  });
});

describe('stageIndex', () => {
  it('numbers a stage by its position in ITS pipeline', () => {
    // The old STAGE_MAP had no entry for renewal-quoted, so it fell through to a
    // default of { number: 1 } and the page rendered "Stage 1 of 6" with
    // Prospecting highlighted — a stage not in this deal's pipeline at all.
    expect(stageIndex(renewals, 'renewal-quoted')).toBe(2);
    expect(stageIndex(renewals, 'renewal-lost')).toBe(5);
  });

  it('returns null for a stage the pipeline does not list', () => {
    // A stage retired since the deal last moved. Null so the caller can show the
    // slug rather than claiming the deal is in stage 1.
    expect(stageIndex(renewals, 'closed-won')).toBeNull();
    expect(stageIndex(null, 'renewal-quoted')).toBeNull();
  });
});

describe('stageHex', () => {
  it('uses the stored colour', () => {
    expect(stageHex(renewals.stages[3])).toBe('#10B981');
  });
  it('keeps outcome semantics when no colour is stored', () => {
    expect(stageHex({ color: null, stage_type: 'won' })).toBe('#10B981');
    expect(stageHex({ color: null, stage_type: 'lost' })).toBe('#EF4444');
    expect(stageHex({ color: null, stage_type: 'open' })).toBe('#6B7280');
  });
  it('is safe on a missing stage', () => {
    expect(stageHex(null)).toBe('#6B7280');
  });
});
