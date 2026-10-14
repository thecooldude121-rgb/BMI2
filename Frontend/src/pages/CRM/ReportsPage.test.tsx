import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

/**
 * Group A item 4, slice 5b — /crm/reports reads server totals. Its headline
 * tiles and eight cards were summed in the browser from the 500 newest deals.
 */
const api = vi.hoisted(() => ({
  fetchDealsSummary: vi.fn(), fetchDealsReport: vi.fn(), fetchLeadSummary: vi.fn(), fetchContactsPage: vi.fn(),
}));
vi.mock('../../utils/dealsApi', async () => ({ ...(await vi.importActual<object>('../../utils/dealsApi')), fetchDealsSummary: api.fetchDealsSummary, fetchDealsReport: api.fetchDealsReport }));
vi.mock('../../utils/leadsApi', async () => ({ ...(await vi.importActual<object>('../../utils/leadsApi')), fetchLeadSummary: api.fetchLeadSummary }));
vi.mock('../../utils/contactsApi', async () => ({ ...(await vi.importActual<object>('../../utils/contactsApi')), fetchContactsPage: api.fetchContactsPage }));
vi.mock('../../components/CRM/CRMNavigation', () => ({ default: () => null }));

import ReportsPage from './ReportsPage';
import { localDay } from '../../utils/dates';

const t = (count: number, value_usd: number, unconverted = 0) => ({ count, value_usd, unconverted });
const SUMMARY = {
  as_of: localDay(new Date()), total: 1200, unstaged: 0,
  open: t(700, 2_000_000, 5), won: t(300, 900_000, 2), lost: { count: 200 },
  win_rate: { value: 0.6, won: 300, lost: 200, sample_size: 500 },
  closing_soon: { days: 7, ...t(10, 50_000) }, by_stage: [],
};
const REPORT = {
  as_of: localDay(new Date()), filters: { close_from: null, close_to: null, owner: null }, excluded_no_close_date: 0,
  owners: [{ key: 'id:5', label: 'Dee Admin', unresolved: false, count: 900 }, { key: 'name:John Smith', label: 'John Smith', unresolved: true, count: 15 }],
  won_by_owner: [{ key: 'id:5', label: 'Dee Admin', unresolved: false, ...t(300, 900_000) }],
  open_by_owner: [], outcome: { won: 300, lost: 200 }, open_by_stage: [], aging: [], won_by_source: [],
  high_priority: { all: t(0, 0), open: t(0, 0), closing_7d: 0, open_no_close: 0 },
};
const lastReport = () => api.fetchDealsReport.mock.calls[api.fetchDealsReport.mock.calls.length - 1][0];

beforeEach(() => {
  vi.clearAllMocks();
  api.fetchDealsSummary.mockResolvedValue(SUMMARY);
  api.fetchDealsReport.mockResolvedValue(REPORT);
  api.fetchLeadSummary.mockResolvedValue({ total: 20, by_stage: { won: 2, converted: 4, lost: 2 } });
  api.fetchContactsPage.mockResolvedValue({ contacts: [], total: 1500 });
});
const renderPage = () => render(<MemoryRouter><ReportsPage /></MemoryRouter>);

describe('/crm/reports — server totals', () => {
  it('headline tiles are the workspace summary: USD with "not in USD", win rate with its sample', async () => {
    renderPage();
    expect(await screen.findByText('$900K + 2 not in USD')).toBeInTheDocument();
    expect(screen.getByText('$2.00M + 5 not in USD')).toBeInTheDocument();
    // The tile, not the Win/Loss card (which also reads 60%).
    const tile = screen.getByText('300 won of 500 decided').closest('div')!.parentElement!;
    expect(tile).toHaveTextContent('60%');
    expect(api.fetchDealsSummary).toHaveBeenCalledWith(localDay(new Date()));
  });

  it('cards format the server report, and the funnel counts converted leads', async () => {
    renderPage();
    expect(await screen.findByText('Dee Admin: 300')).toBeInTheDocument();
    expect(screen.getByText('75% (6 of 8)')).toBeInTheDocument();
    expect(screen.getByText('Contacts: 1500')).toBeInTheDocument();
    // No figure is a sum over a capped list any more, so the banner is gone.
    expect(screen.queryByText(/lower bound/i)).toBeNull();
  });

  it('the date range and owner go to the server; owner options are the server\'s, unmatched names labelled', async () => {
    renderPage();
    await screen.findByText('Dee Admin: 300');
    expect(lastReport()).toEqual({ today: localDay(new Date()), close_from: undefined, close_to: undefined, owner: undefined });
    const owner = screen.getByLabelText('Owner:');
    expect(within(owner).getByText('John Smith (unmatched name) · 15')).toBeInTheDocument();
    await userEvent.selectOptions(owner, 'name:John Smith');
    await waitFor(() => expect(lastReport()).toMatchObject({ owner: 'name:John Smith' }));
    await userEvent.selectOptions(screen.getByLabelText('Expected close:'), 'this-month');
    const now = new Date();
    await waitFor(() => expect(lastReport()).toMatchObject({
      close_from: localDay(new Date(now.getFullYear(), now.getMonth(), 1)),
      close_to: localDay(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
      owner: 'name:John Smith',
    }));
    // The headline summary is deliberately not refetched by a filter.
    expect(api.fetchDealsSummary).toHaveBeenCalledTimes(1);
  });

  it('a failed report says so on the cards — never computed as zero — while the tiles still show', async () => {
    api.fetchDealsReport.mockRejectedValue(new Error('HTTP 500'));
    renderPage();
    // Wait until EVERYTHING else has loaded, so the assertion is about the
    // settled page, not a moment before the lead summary arrived.
    expect(await screen.findByText('$900K + 2 not in USD')).toBeInTheDocument();
    await waitFor(() => expect(api.fetchLeadSummary).toHaveBeenCalled());
    await new Promise(r => setTimeout(r, 20));
    expect(screen.getAllByText('Could not load this report — HTTP 500').length).toBeGreaterThanOrEqual(7);
    // An empty-data sentence would claim something about the data.
    expect(screen.queryByText(/No deals have been won yet/)).toBeNull();
    expect(screen.queryByText(/No deals have closed yet/)).toBeNull();
  });

  it('H2: the More menu is disabled "Coming soon" and no card claims there is no quota', async () => {
    const { container } = renderPage();
    await screen.findByText('$900K + 2 not in USD');
    await userEvent.click(screen.getByRole('button', { name: /More/ }));
    for (const label of ['Schedule Report Delivery', 'Export All Reports (PDF)', 'Report Settings', 'Manage Favorites', 'Archived Reports']) {
      expect(screen.getByRole('button', { name: new RegExp(`${label.replace(/[()]/g, '\\$&')} · Coming soon`) })).toBeDisabled();
    }
    expect(container.textContent).not.toMatch(/No quota has been entered/);
  });
});
