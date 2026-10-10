import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

/**
 * Group A item 4, slice 3a — Contacts pages on the server. It fetched up to 200
 * contacts, filtered / sorted / counted them in the browser, and "Load More…"
 * had no handler, so contact #201 was unreachable.
 */
const api = vi.hoisted(() => ({ fetchContactsPage: vi.fn(), bulkUpdateContactsViaAPI: vi.fn() }));
vi.mock('../../utils/contactsApi', async () => ({ ...(await vi.importActual<object>('../../utils/contactsApi')), ...api }));
vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: vi.fn(), addToast: vi.fn() }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 5, name: 'Dee', role: 'admin' } }) }));

import ContactsPage from './ContactsPage';

const contact = (k: number) => ({
  id: `CT${k}`, name: `Person ${k}`, firstName: 'Person', lastName: String(k), email: `p${k}@x.example`,
  company: 'Kora', status: 'active', tags: [], source: 'manual', createdAt: '2026-10-01', updatedAt: '2026-10-01',
});
const lastQuery = () => api.fetchContactsPage.mock.calls[api.fetchContactsPage.mock.calls.length - 1][0];

beforeEach(() => {
  vi.clearAllMocks();
  api.fetchContactsPage.mockImplementation(async (q: { offset: number; limit: number }) => ({
    contacts: Array.from({ length: Math.min(q.limit, 60 - q.offset) }, (_, k) => contact(q.offset + k)), total: 60,
  }));
});
const renderPage = () => render(<MemoryRouter><ContactsPage /></MemoryRouter>);

describe('Contacts — one server page at a time', () => {
  it('asks for page 1 (25, newest-updated first) and shows the SERVER total', async () => {
    renderPage();
    expect(await screen.findByText('Showing 1–25 of 60 contacts')).toBeInTheDocument();
    expect(lastQuery()).toMatchObject({ limit: 25, offset: 0, sort: 'updated_at', dir: 'desc' });
    expect(screen.getByText('Total Contacts').parentElement).toHaveTextContent('60');
  });

  it('Next asks the server for the next page (the old "Load More" did nothing)', async () => {
    renderPage();
    await screen.findByText('Showing 1–25 of 60 contacts');
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Showing 26–50 of 60 contacts')).toBeInTheDocument();
    expect(lastQuery()).toMatchObject({ offset: 25 });
  });

  it('search, status and buying role run on the server, and each starts again at page 1', async () => {
    renderPage();
    await screen.findByText('Showing 1–25 of 60 contacts');
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByText('Showing 26–50 of 60 contacts');
    await userEvent.type(screen.getByPlaceholderText('Search by name, email, company...'), 'kora');
    await waitFor(() => expect(lastQuery()).toMatchObject({ search: 'kora', offset: 0 }));
    await userEvent.selectOptions(screen.getByLabelText('Buying role'), 'champion');
    await waitFor(() => expect(lastQuery()).toMatchObject({ buying_role: 'champion', search: 'kora' }));
    await userEvent.selectOptions(screen.getAllByRole('combobox')[0], 'inactive');
    await waitFor(() => expect(lastQuery()).toMatchObject({ status: 'inactive' }));
  });

  it('sort runs on the server; "Last Contact" (never set) is gone', async () => {
    renderPage();
    await screen.findByText('Showing 1–25 of 60 contacts');
    expect(screen.queryByText(/Last Contact \(Recent\)/)).toBeNull();
    await userEvent.selectOptions(screen.getByDisplayValue('Sort: Recently updated'), 'name');
    await waitFor(() => expect(lastQuery()).toMatchObject({ sort: 'name', dir: 'asc' }));
  });

  it('Source / Tags filters and the per-page count tiles are "Coming soon"; Active Deals is gone', async () => {
    renderPage();
    await screen.findByText('Showing 1–25 of 60 contacts');
    expect(screen.getByTitle('Source filter is coming soon')).toBeInTheDocument();
    expect(screen.getByTitle('Tags filter is coming soon')).toBeInTheDocument();
    expect(screen.getByText(/Counts by source and VIP contacts/)).toBeInTheDocument();
    expect(screen.queryByText('Active Deals')).toBeNull();
  });

  it('a bulk delete re-fetches the page and the server total', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    api.bulkUpdateContactsViaAPI.mockResolvedValue({ action: 'delete', affected: 1, requested: 1, not_found: [] });
    renderPage();
    await screen.findByText('Showing 1–25 of 60 contacts');
    const before = api.fetchContactsPage.mock.calls.length;
    await userEvent.click(screen.getAllByRole('checkbox')[1]);
    await userEvent.click(screen.getByRole('button', { name: /^Delete/ }));
    await waitFor(() => expect(api.bulkUpdateContactsViaAPI).toHaveBeenCalledWith('delete', ['CT0']));
    await waitFor(() => expect(api.fetchContactsPage.mock.calls.length).toBeGreaterThan(before));
  });
});
