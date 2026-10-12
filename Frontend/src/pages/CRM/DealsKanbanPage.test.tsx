import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

/**
 * Group A item 4, slice 2a — the Deals board pages per COLUMN on the server.
 * It made one capped request (50 deals) and summed native amounts across
 * currencies; a dedupe pass hid real deals sharing a name; "delete" removed a
 * card and toasted "deleted" without calling the server.
 */
const api = vi.hoisted(() => ({
  fetchDealsPage: vi.fn(), fetchDealStageSummary: vi.fn(), deleteDealViaAPI: vi.fn(), transitionDealStage: vi.fn(),
}));
vi.mock('../../utils/dealsApi', async () => ({ ...(await vi.importActual<object>('../../utils/dealsApi')), ...api }));
vi.mock('../../utils/pipelinesApi', async () => ({
  ...(await vi.importActual<object>('../../utils/pipelinesApi')),
  fetchPipelines: vi.fn().mockResolvedValue([{
    id: 'p1', slug: 'new-business', name: 'New business', description: null, is_default: true, is_active: true,
    stages: [
      { id: 's1', pipeline_id: 'p1', slug: 'prospecting', name: 'Prospecting', probability: 20, color: '#6B7280', position: 1, stage_type: 'open', archived_at: null },
      { id: 's2', pipeline_id: 'p1', slug: 'qualified', name: 'Qualified', probability: 40, color: '#3B82F6', position: 2, stage_type: 'open', archived_at: null },
    ],
  }]),
}));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 7, name: 'Dee Admin', role: 'Admin' } }) }));

// jsdom has no IntersectionObserver; the column's infinite scroll only observes.
class NoopObserver { observe() {} disconnect() {} unobserve() {} takeRecords() { return []; } }
vi.stubGlobal('IntersectionObserver', NoopObserver);

import DealsKanbanPage from './DealsKanbanPage';

const row = (id: string, name: string, extra: Record<string, unknown> = {}) => ({
  id, name, value: '1000', currency: 'USD', base_amount_usd: '1000', stage: 'prospecting', pipeline_id: 'new-business',
  company_name: 'Kora', probability: 20, created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z', ...extra,
});
const page = (rows: unknown[], total: number) => ({ deals: rows, total, limit: 20, offset: 0 });
const summary = (prospecting: number, extra: Partial<{ value_usd: number; unconverted: number }> = {}) => ({
  pipeline_id: 'new-business', unplaced: 0,
  stages: [
    { stage_id: 's1', slug: 'prospecting', name: 'Prospecting', position: 1, stage_type: 'open', archived_at: null, count: prospecting, value_usd: extra.value_usd ?? 12345, unconverted: extra.unconverted ?? 0 },
    { stage_id: 's2', slug: 'qualified', name: 'Qualified', position: 2, stage_type: 'open', archived_at: null, count: 0, value_usd: 0, unconverted: 0 },
  ],
});
const firstPage = Array.from({ length: 20 }, (_, k) => row(`D${k}`, `Deal ${k}`));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  api.fetchDealStageSummary.mockResolvedValue(summary(45, { unconverted: 1 }));
  api.fetchDealsPage.mockImplementation(async (q: { stage_id: string; offset: number }) => {
    if (q.stage_id === 's2') return page([], 0);
    if (q.offset === 0) return page(firstPage, 45);
    return page(Array.from({ length: 20 }, (_, k) => row(`E${k}`, `More ${k}`)), 45);
  });
});
const renderBoard = () => render(<MemoryRouter><DealsKanbanPage /></MemoryRouter>);
const cards = () => screen.queryAllByLabelText(/^Deal: /);

describe('Deals board — server-paged columns', () => {
  it('fetches each column from the server (pipeline + stage id + sort), 20 at a time', async () => {
    renderBoard();
    await waitFor(() => expect(cards()).toHaveLength(20));
    expect(api.fetchDealsPage).toHaveBeenCalledWith(expect.objectContaining({
      pipeline_id: 'new-business', stage_id: 's1', limit: 20, offset: 0, sort: 'expected_close_date', dir: 'asc',
    }));
    expect(api.fetchDealsPage).toHaveBeenCalledWith(expect.objectContaining({ stage_id: 's2' }));
  });

  it('the header is the SERVER total in USD (not the loaded page), and says what was not converted', async () => {
    renderBoard();
    await waitFor(() => expect(cards()).toHaveLength(20));
    expect(screen.getByText('45')).toBeInTheDocument();
    const value = screen.getByTestId('column-value-prospecting');
    expect(value).toHaveTextContent(/\$12K/);   // formatAmountUSD is compact
    expect(value).toHaveTextContent('+ 1 not in USD');
  });

  it('"Load more" fetches the next page from the server at the right offset', async () => {
    renderBoard();
    await waitFor(() => expect(cards()).toHaveLength(20));
    await userEvent.click(screen.getByRole('button', { name: /Load more/ }));
    await waitFor(() => expect(cards()).toHaveLength(40));
    expect(api.fetchDealsPage).toHaveBeenCalledWith(expect.objectContaining({ stage_id: 's1', offset: 20 }));
  });

  it('two real deals with the same name, company and stage BOTH show (the dedupe that hid one is gone)', async () => {
    api.fetchDealsPage.mockImplementation(async (q: { stage_id: string }) =>
      q.stage_id === 's1' ? page([row('D1', 'Twin'), row('D2', 'Twin')], 2) : page([], 0));
    api.fetchDealStageSummary.mockResolvedValue(summary(2));
    renderBoard();
    await waitFor(() => expect(screen.getAllByLabelText(/^Deal: Twin/)).toHaveLength(2));
  });

  it('search runs on the server — for the columns AND the headers', async () => {
    renderBoard();
    await waitFor(() => expect(cards()).toHaveLength(20));
    await userEvent.type(screen.getByPlaceholderText('Search deals...'), 'kora');
    await waitFor(() => expect(api.fetchDealsPage).toHaveBeenCalledWith(expect.objectContaining({ search: 'kora', stage_id: 's1' })));
    expect(api.fetchDealStageSummary).toHaveBeenCalledWith(expect.objectContaining({ search: 'kora' }));
  });
});

describe('Deals board — delete is real', () => {
  const openDelete = async () => {
    renderBoard();
    await waitFor(() => expect(cards()).toHaveLength(20));
    fireEvent.contextMenu(screen.getByLabelText(/^Deal: Deal 3,/));
    await userEvent.click(screen.getByText('Delete Deal'));
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
  };

  it('calls the server, and the card leaves + "deleted" shows only after it confirms', async () => {
    let resolve!: () => void;
    api.deleteDealViaAPI.mockImplementation(() => new Promise<void>(r => { resolve = r; }));
    await openDelete();
    expect(api.deleteDealViaAPI).toHaveBeenCalledWith('D3');
    expect(screen.getByLabelText(/^Deal: Deal 3,/)).toBeInTheDocument();
    expect(screen.queryByText(/"Deal 3" deleted/)).toBeNull();
    resolve();
    await waitFor(() => expect(screen.queryByLabelText(/^Deal: Deal 3,/)).toBeNull());
    expect(screen.getByText('"Deal 3" deleted')).toBeInTheDocument();
  });

  it('a refusal (e.g. 403 for sales) is shown and the card stays', async () => {
    api.deleteDealViaAPI.mockRejectedValue(new Error('Insufficient permissions'));
    await openDelete();
    expect(await screen.findByText(/"Deal 3" was not deleted — Insufficient permissions/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Deal: Deal 3,/)).toBeInTheDocument();
  });
});

describe('Deals board — what the server cannot run yet is "Coming soon"', () => {
  it('close date / value / source / account filters are disabled; owner offers only All and Me', async () => {
    renderBoard();
    await waitFor(() => expect(cards()).toHaveLength(20));
    await userEvent.click(screen.getByRole('button', { name: /^Filter/ }));
    for (const f of ['Close date', 'Value', 'Source', 'Account']) {
      expect(screen.getByLabelText(`${f} (coming soon)`)).toBeDisabled();
    }
    const owner = screen.getByLabelText('Owner');
    expect(within(owner).queryByText('Unassigned')).toBeNull();
    expect(within(owner).getByText('Assigned to me')).toBeInTheDocument();
  });

  it('Inspect, Calendar view and the pipeline signals are disabled and labelled', async () => {
    renderBoard();
    await waitFor(() => expect(cards()).toHaveLength(20));
    expect(screen.getByTitle('Manager inspection is coming soon')).toBeDisabled();
    expect(screen.getByTitle('Calendar view is coming soon')).toBeDisabled();
    expect(screen.getByTitle(/signals are coming soon/)).toBeInTheDocument();
  });
});
