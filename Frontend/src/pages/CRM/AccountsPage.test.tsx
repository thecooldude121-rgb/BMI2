import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

/**
 * Group A item 4, slice 3b — the Accounts list pages on the server.
 *
 * It read AccountsContext, which loaded 200 accounts / 500 contacts / 500 deals
 * ONCE per CRM session and joined them in the browser, then showed 3 at a time.
 * (Replaces accountsStaleData.test.tsx: its two lasting properties are kept —
 * the page asks the server on every mount, and a failed load says so with a
 * retry. Its "loaded at" timestamp tests described a cache that no longer exists.)
 */
const api = vi.hoisted(() => ({
  fetchAccountsPage: vi.fn(), fetchAccountsSummary: vi.fn(), deleteAccountViaAPI: vi.fn(), addToast: vi.fn(), fetchIndustries: vi.fn(),
}));
vi.mock('../../utils/accountsApi', async () => ({
  ...(await vi.importActual<object>('../../utils/accountsApi')),
  fetchAccountsPage: api.fetchAccountsPage, fetchAccountsSummary: api.fetchAccountsSummary, deleteAccountViaAPI: api.deleteAccountViaAPI,
}));
vi.mock('../../utils/industriesApi', () => ({ fetchIndustries: api.fetchIndustries }));
vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: vi.fn(), addToast: api.addToast }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 5, name: 'Dee', role: 'admin' }, logout: vi.fn() }) }));

import AccountsPage from './AccountsPage';

const acct = (k: number, extra: Record<string, unknown> = {}) => ({
  id: `C${k}`, name: `Account ${k}`, industry: 'Technology', contactCount: 3, openDealCount: 2,
  openDealValueUsd: 1500, openDealUnconverted: 1, ...extra,
});
const lastQuery = () => api.fetchAccountsPage.mock.calls[api.fetchAccountsPage.mock.calls.length - 1][0];

beforeEach(() => {
  vi.clearAllMocks();
  api.fetchIndustries.mockResolvedValue(['Technology', 'Healthcare']);
  api.fetchAccountsSummary.mockResolvedValue({
    accounts: 60, contacts_on_accounts: 140, open_deals_on_accounts: 33,
    open_value_usd_on_accounts: 250000, open_unconverted_on_accounts: 2, open_deals_without_account: 4,
  });
  api.fetchAccountsPage.mockImplementation(async (q: { offset: number; limit: number }) => ({
    accounts: Array.from({ length: Math.min(q.limit, 60 - q.offset) }, (_, k) => acct(q.offset + k)), total: 60,
  }));
});
const renderPage = () => render(
  <MemoryRouter initialEntries={['/crm/accounts']}>
    <Routes>
      <Route path="/crm/accounts" element={<AccountsPage />} />
      <Route path="/crm/accounts/new" element={<p>Create account page</p>} />
    </Routes>
  </MemoryRouter>);

describe('Accounts — one server page at a time', () => {
  it('asks the server on EVERY mount (it used to make zero requests on navigation)', async () => {
    const { unmount } = renderPage();
    await screen.findAllByText('Showing 1–25 of 60 accounts');
    unmount();
    renderPage();
    await screen.findAllByText('Showing 1–25 of 60 accounts');
    expect(api.fetchAccountsPage).toHaveBeenCalledTimes(2);
    expect(lastQuery()).toMatchObject({ limit: 25, offset: 0, sort: 'name', dir: 'asc' });
  });

  it('a failed load says so and offers a retry — never figures shown as current', async () => {
    api.fetchAccountsPage.mockRejectedValueOnce(new Error('Failed to load accounts (HTTP 500)'));
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to load accounts (HTTP 500)');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect((await screen.findAllByText('Showing 1–25 of 60 accounts')).length).toBeGreaterThan(0);
  });

  it('tiles come from the server summary; rows carry their own server counts', async () => {
    renderPage();
    await screen.findAllByText('Showing 1–25 of 60 accounts');
    const kpis = screen.getByTestId('accounts-kpis');
    expect(kpis).toHaveTextContent('60');
    expect(kpis).toHaveTextContent('33');
    expect(kpis).toHaveTextContent('+ 4 open with no account');
    expect(kpis).toHaveTextContent('$250,000');
    expect(kpis).toHaveTextContent('+ 2 not in USD');
    expect(kpis).toHaveTextContent('140');
    expect(screen.getAllByText('3 contacts').length).toBeGreaterThan(0);
    expect(screen.getAllByText('2 open').length).toBeGreaterThan(0);
  });

  it('Next asks the server for the next page; Industry runs on the server and returns to page 1', async () => {
    renderPage();
    await screen.findAllByText('Showing 1–25 of 60 accounts');
    await userEvent.click(screen.getAllByRole('button', { name: 'Next' })[0]);
    expect((await screen.findAllByText('Showing 26–50 of 60 accounts')).length).toBeGreaterThan(0);
    await waitFor(() => expect(screen.getByRole('option', { name: 'Healthcare' })).toBeInTheDocument());
    await userEvent.selectOptions(screen.getByLabelText('Industry'), 'Healthcare');
    await waitFor(() => expect(lastQuery()).toMatchObject({ industry: 'Healthcare', offset: 0 }));
  });

  it('Add Account opens the create page (it set state nothing rendered)', async () => {
    renderPage();
    await screen.findAllByText('Showing 1–25 of 60 accounts');
    await userEvent.click(screen.getByRole('button', { name: /Add Account/ }));
    expect(await screen.findByText('Create account page')).toBeInTheDocument();
  });

  it('select-all takes THIS page only; bulk delete reports each result and only what the server confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    api.deleteAccountViaAPI.mockImplementation(async (id: string) => { if (id === 'C1') throw new Error('Insufficient permissions'); });
    renderPage();
    await screen.findAllByText('Showing 1–25 of 60 accounts');
    await userEvent.click(screen.getByLabelText('Select all accounts on this page'));
    expect(screen.getByText('25 accounts selected on this page')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^Delete$/ }));
    await waitFor(() => expect(api.deleteAccountViaAPI).toHaveBeenCalledTimes(25));
    await waitFor(() => expect(api.addToast).toHaveBeenCalledWith('24 deleted, 1 not deleted — Insufficient permissions', 'warning'));
  });

  it('Size / Source filters and unsupported sorts are "Coming soon"', async () => {
    renderPage();
    await screen.findAllByText('Showing 1–25 of 60 accounts');
    expect(screen.getByTitle('Size filter is coming soon')).toBeInTheDocument();
    expect(screen.getByTitle('Source filter is coming soon')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Value (coming soon)' })).toBeDisabled();
  });
});
