import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

/**
 * Global search (Group B item 10): one request per settled term, results
 * grouped and navigable, and a FAILED search is never shown as "No matches".
 */
const api = vi.hoisted(() => ({ searchWorkspace: vi.fn() }));
vi.mock('../../utils/searchApi', async () => ({ ...(await vi.importActual<object>('../../utils/searchApi')), ...api }));

import GlobalSearch from './GlobalSearch';

const RESULT = {
  q: 'zep',
  leads: { rows: [{ id: 7, first_name: 'Zed', last_name: 'Zephyrine', email: 'zed@z.example', company: 'Zephyr', stage: 'new' }], has_more: false },
  contacts: { rows: [{ id: 'CT1', first_name: 'Zara', last_name: 'Z', email: 'zara@z.example', company: 'Zephyr' }], has_more: false },
  accounts: { rows: [{ id: 'C1', name: 'Zephyr Systems', domain: 'zephyr.example', industry: 'Technology' }], has_more: true },
  deals: { rows: [], has_more: false },
};

const renderSearch = () => render(
  <MemoryRouter initialEntries={['/crm/dashboard']}>
    <GlobalSearch />
    <Routes>
      <Route path="/crm/dashboard" element={<p>dashboard</p>} />
      <Route path="/crm/leads/:id" element={<p>lead page</p>} />
      <Route path="/crm/accounts/:id" element={<p>account page</p>} />
    </Routes>
  </MemoryRouter>,
);

beforeEach(() => { vi.clearAllMocks(); api.searchWorkspace.mockResolvedValue(RESULT); });

describe('GlobalSearch', () => {
  it('does not search under two characters', async () => {
    renderSearch();
    await userEvent.type(screen.getByRole('combobox'), 'z');
    expect(await screen.findByText('Type at least 2 characters.')).toBeInTheDocument();
    await new Promise(r => setTimeout(r, 350));
    expect(api.searchWorkspace).not.toHaveBeenCalled();
  });

  it('searches the settled term once and shows grouped results, with "more matches" when the server says so', async () => {
    renderSearch();
    await userEvent.type(screen.getByRole('combobox'), 'zep');
    expect(await screen.findByRole('option', { name: /Zed Zephyrine/ })).toBeInTheDocument();
    expect(api.searchWorkspace).toHaveBeenCalledTimes(1);
    expect(api.searchWorkspace.mock.calls[0][0]).toBe('zep');
    expect(screen.getByRole('group', { name: 'Accounts' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Deals' })).toBeNull();
    expect(screen.getByText(/more matches exist/i)).toBeInTheDocument();
  });

  it('Arrow keys + Enter open the highlighted record', async () => {
    renderSearch();
    const box = screen.getByRole('combobox');
    await userEvent.type(box, 'zep');
    await screen.findByRole('option', { name: /Zed Zephyrine/ });
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(await screen.findByText('account page')).toBeInTheDocument();
  });

  it('a failed search says so — never "No matches"', async () => {
    api.searchWorkspace.mockRejectedValue(new Error('500 Internal Server Error'));
    renderSearch();
    await userEvent.type(screen.getByRole('combobox'), 'zep');
    expect(await screen.findByRole('alert')).toHaveTextContent('Search failed');
    expect(screen.queryByText(/no leads, contacts/i)).toBeNull();
  });

  it('an empty result names the term it searched', async () => {
    api.searchWorkspace.mockResolvedValue({ ...RESULT, q: 'qqq', leads: { rows: [], has_more: false }, contacts: { rows: [], has_more: false }, accounts: { rows: [], has_more: false } });
    renderSearch();
    await userEvent.type(screen.getByRole('combobox'), 'qqq');
    expect(await screen.findByText(/No leads, contacts, accounts or deals match “qqq”/)).toBeInTheDocument();
  });

  it('Ctrl+K focuses the box from anywhere', async () => {
    renderSearch();
    await userEvent.keyboard('{Control>}k{/Control}');
    await waitFor(() => expect(screen.getByRole('combobox')).toHaveFocus());
  });
});
