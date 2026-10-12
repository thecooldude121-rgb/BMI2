import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ForecastPage from './ForecastPage';
import { localDay } from '../../utils/dates';

/**
 * Group A item 4, slice 5c — the Forecast page reads the SERVER's quarter and
 * never stores its own figures. It fetched 500 deals with no warning past the
 * cap, summed native amounts across currencies, and POSTed those per-rep sums
 * as permanent snapshots (toasting "saved" without checking the response).
 */
type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;
let fetchMock: Mock<FetchFn>;
const ok = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body } as Response);
const T = (count: number, value_usd: number, unconverted = 0) => ({ count, value_usd, unconverted });

const topDeal = (k: number) => ({
  id: `D${k}`, name: `Commit ${k}`, company_name: 'Kora', stage: 'negotiation', owner: 'Dee Admin',
  value: '1000', currency: 'USD', base_amount_usd: '1000', expected_close_date: '2099-01-01', category: 'commit',
});
const SUMMARY = {
  period: '', quarter_start: '', quarter_end: '', as_of: '', include_undated: true, top_per_category: 25,
  categories: { pipeline: T(2, 300), 'best-case': T(1, 400), commit: T(700, 2_500_000, 3), closed: T(5, 90_000) },
  reps: [{
    key: 'id:7', label: 'Dee Admin', user_id: 7, unresolved: false,
    pipeline: T(2, 300), best_case: T(1, 400), commit: T(700, 2_500_000, 3), closed: T(5, 90_000),
    deal_count: 708, unconverted: 3, commit_overdue: 0,
  }],
  top_deals: {
    pipeline: [], 'best-case': [], closed: [],
    commit: [...Array.from({ length: 24 }, (_, k) => topDeal(k)),
      { ...topDeal(99), name: 'Rupee commit', currency: 'INR', value: '125000', base_amount_usd: null }],
  },
};
let postBodies: unknown[] = [];

function server(opts: { summaryStatus?: number; snapshotStatus?: number; snapshots?: unknown[] } = {}) {
  postBodies = [];
  fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const u = String(url);
    if (u.includes('/forecast/summary')) {
      return opts.summaryStatus ? ok({ success: false, message: 'boom' }, opts.summaryStatus) : ok({ success: true, data: SUMMARY });
    }
    if (u.includes('/forecast/snapshots') && init?.method === 'POST') {
      postBodies.push(JSON.parse(String(init.body)));
      return opts.snapshotStatus
        ? ok({ success: false, message: 'There are no deals in this quarter to snapshot' }, opts.snapshotStatus)
        : ok({ success: true, data: [] }, 201);
    }
    if (u.includes('/forecast/snapshots')) return ok({ success: true, data: opts.snapshots ?? [] });
    if (u.includes('/quotas')) return ok({ success: true, data: [], editable_user_ids: [], visible_user_ids: [7] });
    return ok({ success: true, data: [] });
  });
  vi.stubGlobal('fetch', fetchMock);
}
const renderPage = () => render(<MemoryRouter><ForecastPage /></MemoryRouter>);
const summaryUrl = () => String(fetchMock.mock.calls.find(c => String(c[0]).includes('/forecast/summary'))![0]);

beforeEach(() => { localStorage.setItem('authToken', 't'); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); localStorage.clear(); });

describe('ForecastPage — the server\'s quarter', () => {
  it('asks for the quarter and the viewer\'s day; KPIs are server counts with "not in USD"', async () => {
    server();
    renderPage();
    await waitFor(() => expect(screen.getByTestId('kpi-commit')).toHaveTextContent('700 deals · 3 not in USD'));
    const now = new Date();
    const q = `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`;
    expect(summaryUrl()).toContain(`period=${encodeURIComponent(q).replace(/%20/g, '+')}`);
    expect(summaryUrl()).toContain(`today=${localDay(now)}`);
    expect(fetchMock.mock.calls.some(c => String(c[0]).includes('/deals?limit=500'))).toBe(false);
  });

  it('a category card shows the server total and says when it lists only the largest deals', async () => {
    server();
    renderPage();
    await waitFor(() => expect(screen.getByTestId('cat-total-commit')).toHaveTextContent('+ 3 not in USD'));
    expect(screen.getByText('Showing the 25 largest of 700 by USD value.')).toBeInTheDocument();
    expect(screen.getByText('INR 125,000 · not in USD')).toBeInTheDocument();
    // The rep row names its deals with no USD amount too.
    expect(screen.getByTestId('rep-deals-id:7')).toHaveTextContent('708 deals · 3 not in USD');
  });

  it('Take Snapshot sends the period and day — never figures — and says "saved" only after a 2xx', async () => {
    server();
    renderPage();
    await waitFor(() => expect(screen.getByTestId('kpi-commit')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /Take Snapshot/ }));
    await waitFor(() => expect(screen.getByText('Snapshot saved')).toBeInTheDocument());
    expect(postBodies).toHaveLength(1);
    expect(postBodies[0]).toEqual({ period_label: expect.stringMatching(/^Q[1-4] \d{4}$/), today: localDay(new Date()) });
    expect(postBodies[0]).not.toHaveProperty('reps');
  });

  it('a refused snapshot is shown, and nothing claims it was saved', async () => {
    server({ snapshotStatus: 409 });
    renderPage();
    await waitFor(() => expect(screen.getByTestId('kpi-commit')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /Take Snapshot/ }));
    expect(await screen.findByText(/The snapshot was not saved — There are no deals in this quarter to snapshot/)).toBeInTheDocument();
    expect(screen.queryByText('Snapshot saved')).toBeNull();
  });

  it('snapshots taken before server totals are labelled, not passed off as USD', async () => {
    server({ snapshots: [
      { user_id: 7, rep_name: 'Dee Admin', snapshot_date: '2026-09-24', pipeline: '1', best_case: '1', commit: '1000', closed: '0', unconverted: null },
    ] });
    renderPage();
    expect(await screen.findByText('· browser-summed')).toBeInTheDocument();
    expect(screen.getByText(/taken before 13 Oct 2026/)).toBeInTheDocument();
  });

  it('a failed load says so — the KPIs read "—", never $0', async () => {
    server({ summaryStatus: 500 });
    renderPage();
    expect(await screen.findByText(/The forecast could not load — boom/)).toBeInTheDocument();
    expect(screen.getByTestId('kpi-commit')).toHaveTextContent('—');
  });
});
