import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ForecastPage from './ForecastPage';

/**
 * FORECAST PAGE — what the reporting-line read rule does to this screen.
 *
 * GET /quotas now returns only the quotas the viewer may see, and that turns
 * two previously-safe pieces of this page into potential lies:
 *
 *  1. A missing quota row used to mean ONE thing — nobody has set one. It can
 *     now also mean "not yours to see", and the cell said "Not set" for both.
 *     `visible_user_ids` is what tells them apart, so these tests assert the
 *     component reads the SERVED field rather than inferring from absence.
 *  2. The gap-to-goal banner divides a deal-derived team projection by a
 *     quota total. Deals are not filtered and quotas now are, so for a manager
 *     or a rep those two numbers describe different populations and the
 *     percentage is meaningless rather than merely smaller.
 *
 * Both figures come from the mocked server envelope only. If the component
 * ever starts deriving visibility from the quota rows it happened to receive,
 * the "hidden, not unset" case fails.
 */

type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;
let fetchMock: Mock<FetchFn>;

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body } as Response);

/** Mid-quarter, so the fixture deals always land inside the quarter on screen. */
const inThisQuarter = (): string => {
  const now = new Date();
  const q = Math.floor(now.getUTCMonth() / 3);
  return new Date(Date.UTC(now.getUTCFullYear(), q * 3 + 1, 15)).toISOString().slice(0, 10);
};

/**
 * Two owned deals. `forecast_category` is explicit so the rows do not depend on
 * the workspace's stage configuration — the category rule is not what is under
 * test here.
 */
const DEALS = [
  {
    id: 'D001', name: 'Alpha', value: '100000', stage: 'negotiation',
    forecast_category: 'commit', expected_close_date: inThisQuarter(),
    assigned_to: 'Sam Okafor', assigned_to_user_id: 2,
  },
  {
    id: 'D002', name: 'Beta', value: '50000', stage: 'negotiation',
    forecast_category: 'commit', expected_close_date: inThisQuarter(),
    assigned_to: 'Lee Chen', assigned_to_user_id: 3,
  },
];

const T = (count: number, value_usd: number) => ({ count, value_usd, unconverted: 0 });
type FixtureDeal = Omit<typeof DEALS[number], 'assigned_to_user_id'> & { assigned_to_user_id: number | null };
const SUMMARY_FROM = (deals: FixtureDeal[]) => ({
  period: 'Q', quarter_start: '', quarter_end: '', as_of: '', include_undated: true, top_per_category: 25,
  categories: { pipeline: T(0, 0), 'best-case': T(0, 0), closed: T(0, 0),
    commit: T(deals.length, deals.reduce((n, d) => n + Number(d.value), 0)) },
  reps: deals.map(d => ({
    key: d.assigned_to_user_id != null ? `id:${d.assigned_to_user_id}` : `name:${d.assigned_to}`,
    label: d.assigned_to, user_id: d.assigned_to_user_id, unresolved: d.assigned_to_user_id == null,
    pipeline: T(0, 0), best_case: T(0, 0), closed: T(0, 0), commit: T(1, Number(d.value)),
    deal_count: 1, unconverted: 0, commit_overdue: 0,
  })),
  top_deals: { pipeline: [], 'best-case': [], closed: [], commit: deals.map(d => ({
    id: d.id, name: d.name, company_name: null, stage: d.stage, owner: d.assigned_to, value: d.value,
    currency: 'USD', base_amount_usd: d.value, expected_close_date: d.expected_close_date, category: 'commit' })) },
});

/**
 * @param visible  the ids GET /quotas says this viewer may SEE
 * @param quotas   the quota rows it actually returns (only ever visible ones)
 */
function server(visible: number[], quotas: { user_id: number; quota_amount: string }[]) {
  fetchMock = vi.fn(async (url: string) => {
    const u = String(url);
    // Slice 5c: the page reads the SERVER's forecast, not a deal list. The
    // summary carries the two commit deals above as two reps.
    if (u.includes('/forecast/summary')) return ok({ success: true, data: SUMMARY_FROM(DEALS) });
    if (u.includes('/quotas')) {
      return ok({
        success: true,
        data: quotas.map(q => ({ ...q, rep_name: null })),
        editable_user_ids: [],
        visible_user_ids: visible,
      });
    }
    if (u.includes('/forecast/snapshots')) return ok({ success: true, data: [] });
    if (u.includes('/pipelines')) return ok({ success: true, data: [] });
    return ok({ success: true, data: [] });
  });
  vi.stubGlobal('fetch', fetchMock);
}

const renderPage = () => render(<MemoryRouter><ForecastPage /></MemoryRouter>);

beforeEach(() => { localStorage.setItem('authToken', 'test-token'); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); localStorage.clear(); });

describe('ForecastPage — a quota you may not see is not a quota that is unset', () => {
  it('renders "Not visible" for a rep outside the viewer\'s reporting line', async () => {
    // The viewer may see user 2 (who has no quota) and NOT user 3 (who does).
    server([2], []);
    renderPage();

    await waitFor(() => expect(screen.getByText('Not visible')).toBeInTheDocument());
    // User 2 IS visible and has no quota, so "Not set" is the honest word for
    // that row — both states must be reachable, or the test proves nothing.
    expect(screen.getByText('Not set')).toBeInTheDocument();
  });

  it('says "Not set" and never "Not visible" when the viewer can see everyone', async () => {
    server([2, 3], []);
    renderPage();

    await waitFor(() => expect(screen.getAllByText('Not set')).toHaveLength(2));
    expect(screen.queryByText('Not visible')).not.toBeInTheDocument();
  });

  it('does NOT infer visibility from the rows it received — an empty list is not "all hidden"', async () => {
    // Every id visible, no quotas set anywhere. A component that treated
    // "no row came back" as "hidden" would print Not visible twice here.
    server([2, 3], []);
    renderPage();

    await waitFor(() => expect(screen.getAllByText('Not set')).toHaveLength(2));
  });
});

describe('ForecastPage — the gap banner compares like with like or says nothing', () => {
  const bannerText = /Team (is on track|projects)/;
  const scopeNote = /No team gap-to-goal shown/;

  it('suppresses the team gap and explains why when some quotas are hidden', async () => {
    server([2], [{ user_id: 2, quota_amount: '200000' }]);
    renderPage();

    await waitFor(() => expect(screen.getByText(scopeNote)).toBeInTheDocument());
    expect(screen.queryByText(bannerText)).not.toBeInTheDocument();
    // The note names how many people it cannot account for, rather than
    // implying the total is merely small.
    expect(screen.getByText(/1 person on this forecast has a quota you cannot see/)).toBeInTheDocument();
  });

  it('shows the banner unchanged when every quota on the forecast is visible', async () => {
    server([2, 3], [
      { user_id: 2, quota_amount: '200000' },
      { user_id: 3, quota_amount: '100000' },
    ]);
    renderPage();

    await waitFor(() => expect(screen.getByText(bannerText)).toBeInTheDocument());
    expect(screen.queryByText(scopeNote)).not.toBeInTheDocument();
  });

  it('an unowned deal line does not count as a hidden quota', async () => {
    // A row with no user id can never carry a quota, so it must not suppress
    // the banner — otherwise the live workspace, where 20 of 24 deals have no
    // resolved owner, would never show one again.
    fetchMock = vi.fn(async (url: string) => {
      const u = String(url);
      if (u.includes('/forecast/summary')) {
        return ok({
          success: true,
          data: SUMMARY_FROM([
            DEALS[0],
            { ...DEALS[1], assigned_to: 'John Smith', assigned_to_user_id: null },
          ]),
        });
      }
      if (u.includes('/quotas')) {
        return ok({
          success: true,
          data: [{ user_id: 2, quota_amount: '200000', rep_name: null }],
          editable_user_ids: [], visible_user_ids: [2],
        });
      }
      return ok({ success: true, data: [] });
    });
    vi.stubGlobal('fetch', fetchMock);
    renderPage();

    await waitFor(() => expect(screen.getByText(bannerText)).toBeInTheDocument());
    expect(screen.queryByText(scopeNote)).not.toBeInTheDocument();
    // The unowned line is still on screen, labelled honestly as it was before.
    expect(screen.getByText('No owner')).toBeInTheDocument();
  });
});
