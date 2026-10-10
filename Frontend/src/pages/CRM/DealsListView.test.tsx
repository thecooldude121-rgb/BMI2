import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

/**
 * Group A item 4, slice 2b — the Deals LIST pages on the server. It used to
 * flatten whatever the board had loaded (50 deals) and filter, sort, count and
 * "page" it in the browser — with no page controls at all.
 */
const api = vi.hoisted(() => ({ fetchDealsPage: vi.fn(), fetchUsers: vi.fn() }));
vi.mock('../../utils/dealsApi', async () => ({ ...(await vi.importActual<object>('../../utils/dealsApi')), fetchDealsPage: api.fetchDealsPage }));
vi.mock('../../utils/usersApi', async () => ({ ...(await vi.importActual<object>('../../utils/usersApi')), fetchUsers: api.fetchUsers }));
vi.mock('../../utils/pipelinesApi', async () => ({
  ...(await vi.importActual<object>('../../utils/pipelinesApi')),
  fetchPipelines: vi.fn().mockResolvedValue([]),
}));

// jsdom has no ResizeObserver; the list measures its sticky header with one.
class NoopResize { observe() {} unobserve() {} disconnect() {} }
vi.stubGlobal('ResizeObserver', NoopResize);

import DealsListView from './DealsListView';
import { DEFAULT_COLUMN_ORDER, DEFAULT_VISIBLE_COLUMNS, type ColumnKey } from '../../utils/dealsColumns';

const row = (k: number) => ({
  id: `D${k}`, name: `Deal ${k}`, value: '1000', currency: 'USD', base_amount_usd: '1000', stage: 'prospecting',
  pipeline_id: 'new-business', company_name: 'Kora', probability: 20, created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z',
});
const stages = [
  { id: 'prospecting', name: 'Prospecting', color: '#ccc', deals: [] },
  { id: 'qualified', name: 'Qualified', color: '#ccc', deals: [] },
];

function Harness(props: { serverQuery?: Record<string, string> }) {
  const [visibleColumns, setVisibleColumns] = React.useState<Set<ColumnKey>>(new Set(DEFAULT_VISIBLE_COLUMNS));
  const [columnOrder, setColumnOrder] = React.useState<ColumnKey[]>([...DEFAULT_COLUMN_ORDER]);
  const [activeKpiFilter, setActiveKpiFilter] = React.useState<'closingWeek' | 'stalled' | null>(null);
  return (
    <MemoryRouter>
      <DealsListView
        stages={stages as never} onDealClick={() => {}}
        visibleColumns={visibleColumns} setVisibleColumns={setVisibleColumns}
        columnOrder={columnOrder} setColumnOrder={setColumnOrder}
        activeKpiFilter={activeKpiFilter} setActiveKpiFilter={setActiveKpiFilter}
        serverQuery={props.serverQuery ?? { pipeline_id: 'new-business' }}
        stageIds={{ prospecting: 's1', qualified: 's2' }}
        stageTotals={{ prospecting: 58, qualified: 2 }}
      />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  api.fetchUsers.mockResolvedValue([{ id: 7, first_name: 'Dee', last_name: 'Admin', displayName: 'Dee Admin' }]);
  api.fetchDealsPage.mockImplementation(async (q: { offset: number; limit: number }) => ({
    deals: Array.from({ length: Math.min(q.limit, 60 - q.offset) }, (_, k) => row(q.offset + k)), total: 60, limit: q.limit, offset: q.offset,
  }));
});
const lastQuery = () => api.fetchDealsPage.mock.calls[api.fetchDealsPage.mock.calls.length - 1][0];

describe('Deals list — one server page at a time', () => {
  it('asks the server for page 1 under the board\'s filters, and shows the SERVER total', async () => {
    render(<Harness serverQuery={{ pipeline_id: 'new-business', search: 'kora' }} />);
    expect(await screen.findByText('Showing 1–25 of 60')).toBeInTheDocument();
    expect(lastQuery()).toMatchObject({ pipeline_id: 'new-business', search: 'kora', limit: 25, offset: 0, sort: 'expected_close_date', dir: 'asc' });
    expect(screen.getByTestId('list-total')).toHaveTextContent('60');
  });

  it('Next asks for the next page; the pager reflects it', async () => {
    render(<Harness />);
    await screen.findByText('Showing 1–25 of 60');
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Showing 26–50 of 60')).toBeInTheDocument();
    expect(lastQuery()).toMatchObject({ offset: 25 });
  });

  it('one Stage and one Owner (from the roster) go to the server; a narrower query starts at page 1', async () => {
    render(<Harness />);
    await screen.findByText('Showing 1–25 of 60');
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByText('Showing 26–50 of 60');
    await userEvent.click(screen.getByRole('button', { name: /^Stage/ }));
    await userEvent.click(screen.getByRole('radio', { name: /Qualified/ }));
    await waitFor(() => expect(lastQuery()).toMatchObject({ stage_id: 's2', offset: 0 }));
    await userEvent.click(screen.getByRole('button', { name: /^Owner/ }));
    await userEvent.click(screen.getByRole('radio', { name: 'Dee Admin' }));
    await waitFor(() => expect(lastQuery()).toMatchObject({ stage_id: 's2', assigned_to: 'Dee Admin' }));
  });

  it('a server-sortable column sorts on the server; one the server cannot sort does nothing', async () => {
    render(<Harness />);
    await screen.findByText('Showing 1–25 of 60');
    await userEvent.click(screen.getByText('Amount'));
    await waitFor(() => expect(lastQuery()).toMatchObject({ sort: 'base_amount_usd', dir: 'asc' }));
    const calls = api.fetchDealsPage.mock.calls.length;
    await userEvent.click(screen.getByText('Account Name'));
    await new Promise(r => setTimeout(r, 50));
    expect(api.fetchDealsPage.mock.calls.length).toBe(calls);
  });

  it('a failed load is an error with a retry — never "no deals match"', async () => {
    api.fetchDealsPage.mockRejectedValueOnce(new Error('Failed to load deals (HTTP 500)'));
    render(<Harness />);
    expect(await screen.findByRole('alert')).toHaveTextContent('The deals could not load — Failed to load deals (HTTP 500)');
    expect(screen.queryByText(/No deals match/)).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Showing 1–25 of 60')).toBeInTheDocument();
  });

  it('figures that need the whole set are "Coming soon", not computed over one page', async () => {
    render(<Harness />);
    await screen.findByText('Showing 1–25 of 60');
    expect(screen.getByText(/Total value, win rate, closing this week/)).toBeInTheDocument();
    for (const f of ['Source', 'Deal age', 'Velocity']) expect(screen.getByTitle(`${f} filter is coming soon`)).toBeInTheDocument();
    expect(screen.queryByText('Weighted Forecast')).toBeNull();   // the old card's label
  });
});
