import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchPipelines, defaultPipeline, stageTint, type ApiPipeline } from './pipelinesApi';

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
