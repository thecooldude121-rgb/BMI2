import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import MeetingsPage from './MeetingsPage';

/**
 * Slice 6c — the Meetings list pages, searches, filters and counts on the
 * SERVER. It loaded the first 50 meetings and did all of that in the browser,
 * so meeting #51 could not be found and the tiles counted at most 50.
 */

type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;
let fetchMock: Mock<FetchFn>;
const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body } as Response);
const fail = (status: number, message: string) => ({ ok: false, status, json: async () => ({ success: false, message }) } as Response);

const row = (i: number) => ({
  id: `MTG${i}`, title: `Meeting ${i}`, date: null, duration: null, attendees: null, type: null,
  related_to_type: null, related_to_id: null, summary: null, notes: null, action_items: null,
  owner_id: null, owner_name: null, created_at: '2026-10-01T00:00:00Z', updated_at: null,
});

function server(opts: { total?: number; summary?: { total: number; unlinked: number } | 'fail' } = {}) {
  fetchMock = vi.fn(async (url: string) => {
    const u = new URL(String(url));
    if (u.pathname.endsWith('/meetings/summary')) {
      return opts.summary === 'fail' ? fail(500, 'down') : ok({ success: true, data: opts.summary ?? { total: 4312, unlinked: 977 } });
    }
    const offset = Number(u.searchParams.get('offset') ?? 0);
    const limit = Number(u.searchParams.get('limit') ?? 25);
    const total = opts.total ?? 4312;
    const n = Math.max(0, Math.min(limit, total - offset));
    return ok({ success: true, data: Array.from({ length: n }, (_, k) => row(offset + k + 1)), total, limit, offset });
  });
  vi.stubGlobal('fetch', fetchMock);
}

const listCalls = () => fetchMock.mock.calls
  .map(c => new URL(String(c[0])))
  .filter(u => u.pathname.endsWith('/meetings'));
const lastList = () => { const c = listCalls(); return c[c.length - 1]; };

beforeEach(() => { localStorage.setItem('authToken', 't'); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); localStorage.clear(); });

describe('Meetings list on the server (slice 6c)', () => {
  it('tiles are the summary over every meeting, not the rows on the page', async () => {
    server();
    render(<MemoryRouter><MeetingsPage /></MemoryRouter>);
    await waitFor(() => expect(screen.getByTestId('meetings-total')).toHaveTextContent('4,312'));
    expect(screen.getByTestId('meetings-unlinked')).toHaveTextContent('977');
    expect(screen.getAllByText(/^Meeting \d+$/)).toHaveLength(25);
    expect(screen.getByTestId('leads-showing')).toHaveTextContent('Showing 1–25 of 4,312 meetings');
  });

  it('Next asks the server for the next page', async () => {
    server();
    render(<MemoryRouter><MeetingsPage /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('Meeting 1')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(screen.getByText('Meeting 26')).toBeInTheDocument());
    expect(lastList().searchParams.get('offset')).toBe('25');
    expect(lastList().searchParams.get('limit')).toBe('25');
  });

  it('search, type and "not linked" are sent to the server, and return to page 1', async () => {
    server();
    render(<MemoryRouter><MeetingsPage /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('Meeting 1')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(lastList().searchParams.get('offset')).toBe('25'));

    await userEvent.type(screen.getByPlaceholderText(/Search titles/), 'acme');
    await waitFor(() => expect(lastList().searchParams.get('search')).toBe('acme'));
    expect(lastList().searchParams.get('offset')).toBe('0');

    await userEvent.click(screen.getByRole('button', { name: 'Internal' }));
    await waitFor(() => expect(lastList().searchParams.get('type')).toBe('internal'));

    await userEvent.click(screen.getByRole('button', { name: /Not linked to a record/ }));
    await waitFor(() => expect(lastList().searchParams.get('linked')).toBe('no'));
    expect(lastList().searchParams.get('type')).toBeNull();
  });

  it('a failed summary shows "—", never 0', async () => {
    server({ summary: 'fail' });
    render(<MemoryRouter><MeetingsPage /></MemoryRouter>);
    await waitFor(() => expect(screen.getByTestId('meetings-total')).toHaveTextContent('—'));
    expect(screen.getByTestId('meetings-unlinked')).toHaveTextContent('—');
    expect(screen.getByText(/Couldn.t load the counts/)).toBeInTheDocument();
  });

  it('a filter with no matches is not the empty-workspace state', async () => {
    server({ total: 0, summary: { total: 12, unlinked: 3 } });
    render(<MemoryRouter><MeetingsPage /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText(/No meeting notes yet/)).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Internal' }));
    await waitFor(() => expect(screen.getByText(/None of your 12 meetings match this filter/)).toBeInTheDocument());
    expect(screen.queryByText(/No meeting notes yet/)).not.toBeInTheDocument();
  });
});
