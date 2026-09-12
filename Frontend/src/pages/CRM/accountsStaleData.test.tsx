import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AccountsProvider } from '../../contexts/AccountsContext';
import AccountsPage from './AccountsPage';

/**
 * AccountsPage served data of unbounded age with nothing saying so.
 *
 * MEASURED, and the measurement is what decided the fix: navigating to this
 * page fired ZERO requests, while every other CRM page fired 2-14. That is not
 * a cache — `AccountsProvider` wraps the whole of CRMModule, so its single
 * `refreshAccounts()` runs once when the CRM module mounts and never again.
 * Arriving from Deals at 17:00 rendered figures fetched at 09:00.
 *
 * So there are two separate properties here, and they fail independently:
 *   1. The page asks again on mount (otherwise a timestamp is an admission with
 *      no remedy).
 *   2. The page renders the context's `error` and `loading`, which it
 *      destructured NEITHER of — the context tracks both and its own comment
 *      says the error exists to "distinguish broken from no accounts".
 */

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: vi.fn() }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 5, name: 'David Kumar', role: 'admin' }, logout: vi.fn(), loading: false }),
}));

const realFetch = global.fetch;
afterEach(() => { global.fetch = realFetch; vi.clearAllMocks(); });

const renderPage = () =>
  render(
    <MemoryRouter>
      <AccountsProvider>
        <AccountsPage />
      </AccountsProvider>
    </MemoryRouter>,
  );

describe('AccountsPage fetch state', () => {
  beforeEach(() => { global.fetch = vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))) as unknown as typeof fetch; });

  it('asks the API on mount — the page used to make zero requests', async () => {
    renderPage();
    // The count is what proved the original defect, so the count is asserted.
    await waitFor(() => expect((global.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0));
  });

  /**
   * THE ACTUAL SCENARIO, and the previous test cannot express it.
   *
   * `AccountsProvider` wraps all of CRMModule, so it fetches once on ITS mount
   * and stays mounted while the user moves between CRM pages. Rendering the
   * provider and the page together therefore proves nothing about the page:
   * removing the page's own mount effect left every other test in this file
   * green, because the provider's effect had already fired.
   *
   * This mounts the provider ONCE, lets it settle, then mounts the page
   * separately and asserts the call count MOVED — which is what "navigating in
   * from Deals refetches" actually means.
   */
  it('refetches when the PAGE mounts under an already-mounted provider', async () => {
    const Host = ({ showPage }: { showPage: boolean }) => (
      <MemoryRouter>
        <AccountsProvider>{showPage ? <AccountsPage /> : <div>elsewhere in the CRM</div>}</AccountsProvider>
      </MemoryRouter>
    );

    const { rerender } = render(<Host showPage={false} />);
    await waitFor(() => expect(screen.getByText(/elsewhere in the crm/i)).toBeInTheDocument());
    await waitFor(() => expect((global.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0));
    const afterProviderMount = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.length;

    rerender(<Host showPage />);

    await waitFor(() =>
      expect(
        (global.fetch as ReturnType<typeof vi.fn>).mock.calls.length,
        'the page mounted without asking the API — it is serving whatever the provider fetched, however old',
      ).toBeGreaterThan(afterProviderMount),
    );
  });

  it('says it could not load, rather than showing figures as current', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(/couldn't load accounts/i)).toBeInTheDocument());
    // Nothing ever loaded, so it must not claim the figures are merely stale.
    expect(screen.getByText(/nothing below was loaded from your data/i)).toBeInTheDocument();
    expect(screen.queryByText(/showing data loaded at/i)).toBeNull();
  });

  it('offers a retry', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(/couldn't load accounts/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('never stamps a load time from a failed load', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(/couldn't load accounts/i)).toBeInTheDocument());
    // A timestamp on a failure would relabel absent data as freshly fetched.
    expect(screen.queryByText(/showing data loaded at/i)).toBeNull();
  });
});

describe('AccountsPage on a successful load', () => {
  beforeEach(() => {
    global.fetch = vi.fn((url: unknown) => {
      const u = String(url);
      const body = u.includes('/companies') ? { data: [] } : { data: [] };
      return Promise.resolve(new Response(JSON.stringify(body), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      }));
    }) as unknown as typeof fetch;
  });

  it('states when the figures were loaded, instead of implying they are current', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(/showing data loaded at/i)).toBeInTheDocument());
    expect(screen.queryByText(/couldn't load accounts/i)).toBeNull();
  });

  /**
   * STALE-WHILE-REVALIDATE, which is why the context has `refreshing` as well as
   * `loading`. Reusing `loading` for a revisit would blank a populated page on
   * every navigation — the revalidation would be more disruptive than the
   * staleness it fixes.
   */
  it('does not blank the loaded page while revalidating', async () => {
    const Host = ({ showPage }: { showPage: boolean }) => (
      <MemoryRouter>
        <AccountsProvider>{showPage ? <AccountsPage /> : <div>elsewhere in the CRM</div>}</AccountsProvider>
      </MemoryRouter>
    );

    const { rerender } = render(<Host showPage={false} />);
    await waitFor(() => expect((global.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0));
    // Let the provider's first load finish, so `lastLoadedAt` is set.
    await waitFor(() => expect(screen.getByText(/elsewhere in the crm/i)).toBeInTheDocument());

    /**
     * The revalidation is held PENDING on purpose. An awaited `waitFor` would
     * simply outlast a blocking refetch and find the tiles back on screen — the
     * transient blank is the defect, so the test has to observe the page while
     * the request is still in flight. (A `waitFor` version of this test passed
     * against a mutation that set `loading` instead of `refreshing`.)
     */
    global.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch;
    rerender(<Host showPage />);

    // Mid-revalidation: the KPI tiles are still there and the first-load
    // skeleton is not.
    await waitFor(() => expect(screen.getByText(/total accounts/i)).toBeInTheDocument());
    expect(screen.queryByText(/loading accounts…/i)).toBeNull();
    expect(screen.getByText(/refreshing…/i)).toBeInTheDocument();
  });
});
