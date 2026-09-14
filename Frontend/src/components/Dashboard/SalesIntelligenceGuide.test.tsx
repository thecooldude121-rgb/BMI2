import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import SalesIntelligenceGuide from './SalesIntelligenceGuide';

/**
 * The three role views, rendered from a mocked server envelope only.
 *
 * WHAT THESE PIN, in order of how badly each would hurt if it broke:
 *  1. No verdict renders without its numbers. Every status assertion below
 *     also asserts the evidence beside it.
 *  2. "Not enough data" and "no quota" are their own states and are never
 *     dropped from a roll-up, nor coloured as failures.
 *  3. A failed load renders an error, NOT an empty roster — an empty roster
 *     reads as "nobody is off pace", which is a false all-clear.
 *  4. The component issues ONE request, to the already-scoped projection
 *     endpoint, and never a roster query of its own.
 */

const mockUser = { id: 2, role: 'Sales' as string, name: 'Sam Okafor' };
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;
let fetchMock: Mock<FetchFn>;

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body } as Response);

const metric = (over: Record<string, unknown> = {}) => ({
  value: null, basis: null, sample_size: 0, reason: null, won: 0, lost: 0, ...over,
});

const person = (over: Record<string, unknown> = {}) => ({
  user_id: 2, name: 'Sam Okafor', status: 'at_risk',
  status_reason: 'Pipeline of INR 100,000 is INR 220,000 short of the INR 320,000 needed.',
  quota: { amount: 100000, currency: 'INR' }, attained: 20000, remaining: 80000,
  win_rate: metric({ value: 0.25, basis: 'rep', sample_size: 12, won: 3, lost: 9 }),
  win_rate_workspace: metric({ value: 0.4, basis: 'workspace', sample_size: 40, won: 16, lost: 24 }),
  sales_cycle_days: { value: 30, basis: 'rep', sample_size: 6, reason: null },
  average_deal_size: { value: 20000, basis: 'rep', sample_size: 6, reason: null },
  pipeline: { value: 100000, deal_count: 4, stages: [] },
  required_pipeline: 320000, required_pipeline_reason: null,
  coverage_ratio: 1.25, required_coverage_ratio: 4,
  activity_targets: null,
  ...over,
});

function server(data: Record<string, unknown>[], measurement?: Record<string, unknown>) {
  fetchMock = vi.fn(async () => ok({
    success: true,
    data,
    period: { label: 'Q3 2026' },
    generated_at: '2026-09-14T00:00:00.000Z',
    activity_measurement: measurement ?? {
      measurable: false,
      reason: 'the activities table records who acted only as a free-text name',
      activities_recorded: 0,
    },
  }));
  vi.stubGlobal('fetch', fetchMock);
}

beforeEach(() => { mockUser.id = 2; mockUser.role = 'Sales'; });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('Individual (AE / rep) view', () => {
  it('shows their own status WITH the arithmetic behind it', async () => {
    server([person()]);
    render(<SalesIntelligenceGuide />);

    await waitFor(() => expect(screen.getByText('At risk')).toBeInTheDocument());
    // The verdict never stands alone.
    expect(screen.getByText(/INR 220,000 short of the INR 320,000 needed/)).toBeInTheDocument();
  });

  it('separates a PIPELINE gap from a CONVERSION gap — different call-outs', async () => {
    server([person()]);
    render(<SalesIntelligenceGuide />);

    await waitFor(() => expect(screen.getByText('Pipeline coverage gap')).toBeInTheDocument());
    expect(screen.getByText('Conversion below the workspace')).toBeInTheDocument();
    // Each carries its own numbers, not a shared summary.
    expect(screen.getByText(/short by INR 220,000/)).toBeInTheDocument();
    expect(screen.getByText(/3 won, 9 lost/)).toBeInTheDocument();
  });

  it('shows activity targets and says attainment is NOT calculated, with the reason', async () => {
    server([person({ activity_targets: { calls_per_week: 40, meetings_per_week: 5 } })]);
    render(<SalesIntelligenceGuide />);

    await waitFor(() => expect(screen.getByText(/Attainment is not calculated/)).toBeInTheDocument());
    // The shared label map from targetsApi, not a second spelling here.
    expect(screen.getByText(/Calls \/ week/)).toBeInTheDocument();
    expect(screen.getByText('40')).toBeInTheDocument();
    expect(screen.getByText(/No activity has been logged in this workspace at all/)).toBeInTheDocument();
    // Crucially: no shortfall is claimed anywhere.
    expect(screen.queryByText(/behind on calls/i)).not.toBeInTheDocument();
  });

  it('renders not_enough_data as its own state, not as a failure', async () => {
    server([person({
      status: 'not_enough_data',
      status_reason: 'Not enough historical data yet: 2 deals closed with a recorded close date (10 needed).',
      required_pipeline: null,
    })]);
    render(<SalesIntelligenceGuide />);

    await waitFor(() => expect(screen.getByText('Not enough data')).toBeInTheDocument());
    expect(screen.getByText(/2 deals closed with a recorded close date \(10 needed\)/)).toBeInTheDocument();
    expect(screen.queryByText('Pipeline coverage gap')).not.toBeInTheDocument();
  });

  it('renders no_quota as its own state', async () => {
    server([person({ status: 'no_quota', quota: null, attained: null, status_reason: 'No quota is set for Q3 2026.' })]);
    render(<SalesIntelligenceGuide />);

    await waitFor(() => expect(screen.getByText('No quota set')).toBeInTheDocument());
    expect(screen.getByText('No quota is set for Q3 2026.')).toBeInTheDocument();
  });

  it('says so plainly when the rep has no row at all', async () => {
    server([person({ user_id: 99, name: 'Someone Else' })]);
    render(<SalesIntelligenceGuide />);
    await waitFor(() => expect(screen.getByText(/No target is recorded for you/)).toBeInTheDocument());
  });
});

describe('Manager view', () => {
  beforeEach(() => { mockUser.id = 10; mockUser.role = 'Manager'; });

  it('rolls up the reporting line and names who is off pace, and why', async () => {
    server([
      person({ user_id: 10, name: 'Priya Nair', status: 'on_track', status_reason: 'Pipeline covers what is needed.' }),
      person({ user_id: 2, name: 'Sam Okafor' }),
      person({ user_id: 3, name: 'Lee Chen', status: 'on_track', status_reason: 'Pipeline covers what is needed.' }),
    ]);
    render(<SalesIntelligenceGuide />);

    await waitFor(() => expect(screen.getByText(/2 people in your reporting line/)).toBeInTheDocument());
    expect(screen.getByText('Off pace (1)')).toBeInTheDocument();
    expect(screen.getByText('Sam Okafor')).toBeInTheDocument();
    // The problem KIND is labelled, and the evidence is on the row.
    expect(screen.getByText('pipeline')).toBeInTheDocument();
    expect(screen.getByText('conversion')).toBeInTheDocument();
    expect(screen.getByText(/short by INR 220,000/)).toBeInTheDocument();
  });

  it('shows the manager\'s own target separately from the roll-up', async () => {
    server([
      person({ user_id: 10, name: 'Priya Nair', status: 'at_risk' }),
      person({ user_id: 2, name: 'Sam Okafor', status: 'on_track', status_reason: 'Covered.' }),
    ]);
    render(<SalesIntelligenceGuide />);

    await waitFor(() => expect(screen.getByText('Your own target')).toBeInTheDocument());
    // The manager is not counted as one of their own reports.
    expect(screen.getByText(/1 person in your reporting line/)).toBeInTheDocument();
  });

  it('counts the people it could NOT assess instead of dropping them', async () => {
    server([
      person({ user_id: 10, name: 'Priya Nair', status: 'on_track', status_reason: 'Covered.' }),
      person({ user_id: 2, name: 'Sam Okafor', status: 'not_enough_data', status_reason: 'Too few closures.' }),
      person({ user_id: 3, name: 'Lee Chen', status: 'no_quota', quota: null, attained: null, status_reason: 'None set.' }),
    ]);
    render(<SalesIntelligenceGuide />);

    await waitFor(() => expect(screen.getByText(/Nobody with a measurable target is off pace/)).toBeInTheDocument());
    // ...and immediately, how much of the team that statement does not cover.
    expect(screen.getByText(/no quota set for Q3 2026/)).toBeInTheDocument();
    expect(screen.getByText('Lee Chen', { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/not enough closed-deal/)).toBeInTheDocument();
  });
});

describe('Admin / CEO view', () => {
  beforeEach(() => { mockUser.id = 1; mockUser.role = 'Admin'; });

  it('aggregates company-wide and totals quotas PER CURRENCY', async () => {
    server([
      person({ user_id: 1, name: 'Admin', quota: { amount: 100000, currency: 'INR' }, attained: 50000, status: 'on_track', status_reason: 'Covered.' }),
      person({ user_id: 2, name: 'Sam Okafor' }),
      person({ user_id: 3, name: 'Lee Chen', quota: { amount: 40000, currency: 'USD' }, attained: 10000, status: 'on_track', status_reason: 'Covered.' }),
    ]);
    render(<SalesIntelligenceGuide />);

    await waitFor(() => expect(screen.getByText(/3 people across the workspace/)).toBeInTheDocument());
    // Two separate totals, never one summed figure across currencies.
    expect(screen.getByText(/INR · 2 quotas/)).toBeInTheDocument();
    expect(screen.getByText(/USD · 1 quota/)).toBeInTheDocument();
    expect(screen.getByText('Off pace (1)')).toBeInTheDocument();
  });

  it('includes the admin\'s own row in the company-wide count', async () => {
    server([person({ user_id: 1, name: 'Admin', status: 'on_track', status_reason: 'Covered.' })]);
    render(<SalesIntelligenceGuide />);
    await waitFor(() => expect(screen.getByText(/1 person across the workspace/)).toBeInTheDocument());
  });
});

describe('failure and scoping', () => {
  it('renders an error rather than an empty all-clear when the load fails', async () => {
    fetchMock = vi.fn(async () => ({ ok: false, status: 500, json: async () => ({ message: 'boom' }) } as Response));
    vi.stubGlobal('fetch', fetchMock);
    render(<SalesIntelligenceGuide />);

    await waitFor(() => expect(screen.getByText(/nothing is shown here rather than an all-clear/)).toBeInTheDocument());
    expect(screen.queryByText(/is off pace/)).not.toBeInTheDocument();
  });

  it('makes exactly ONE request, to the scoped projection endpoint', async () => {
    server([person()]);
    render(<SalesIntelligenceGuide />);
    await waitFor(() => expect(screen.getByText('At risk')).toBeInTheDocument());

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain('/targets/projection');
    // No roster query of its own: the endpoint above is already scoped to the
    // people this caller may see, and a second path is a second place to
    // forget that.
    expect(fetchMock.mock.calls.some(c => String(c[0]).includes('/users'))).toBe(false);
  });

  it('treats a server that omits activity_measurement as NOT measurable', async () => {
    fetchMock = vi.fn(async () => ok({
      success: true, data: [person({ activity_targets: { calls_per_week: 40 } })],
      period: { label: 'Q3 2026' },
    }));
    vi.stubGlobal('fetch', fetchMock);
    render(<SalesIntelligenceGuide />);

    await waitFor(() => expect(screen.getByText(/Attainment is not calculated/)).toBeInTheDocument());
  });
});
