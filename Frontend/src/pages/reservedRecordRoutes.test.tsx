import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ComprehensiveDealDetailPage from './Deal/ComprehensiveDealDetailPage';
import EnhancedAccountDetailView from './Accounts/EnhancedAccountDetailView';

/**
 * "+ New Deal" and "+ New Account" pointed at `/crm/deals/new` and
 * `/accounts/new`. Neither had a route, so both fell through to the id route and
 * the detail pages went looking for a record called "new" — producing "Could not
 * load deal — Deal not found" and "Account not found" from the two most
 * prominent create affordances in the product.
 *
 * These tests mount the DETAIL pages at a reserved id ON PURPOSE, with no static
 * route declared, because that is the broken arrangement. Declaring
 * `/deals/new` fixes the two links; the guard is what stops the whole class,
 * including in `/accounts/*`, whose route table has only `/` and `/:accountId`
 * and therefore has nowhere else to catch it.
 *
 * The detail components are heavy — contexts, fetches, a dozen hooks. They are
 * never mounted here: the guard returns a redirect before the inner component
 * exists. If the guard regresses, these tests do not merely fail, they fail
 * loudly by trying to mount the real page.
 */

// The negative case mounts the REAL detail page, which needs these. They are
// mocked rather than wrapped in real providers because what that page renders
// with no API behind it is not what is being tested — only whether it was
// reached at all.
vi.mock('../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: vi.fn() }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 5, name: 'David Kumar', role: 'admin' }, logout: vi.fn(), loading: false }),
}));

vi.mock('../contexts/AccountsContext', () => ({
  useAccounts: () => ({ getAccountById: () => undefined, deleteAccount: vi.fn(), loading: false, error: null }),
  AccountsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const renderAt = (path: string, idRoute: string, Detail: React.ComponentType, createRoute: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={idRoute} element={<Detail />} />
        <Route path={createRoute} element={<p>CREATE FORM</p>} />
      </Routes>
    </MemoryRouter>,
  );

describe('a reserved segment never reads as a record id', () => {
  it.each(['new', 'add', 'create', 'New'])(
    'the deal detail page redirects /crm/deals/%s to the create form',
    (segment) => {
      renderAt(`/crm/deals/${segment}`, '/crm/deals/:id', ComprehensiveDealDetailPage, '/crm/deals/new');

      expect(screen.getByText('CREATE FORM')).toBeInTheDocument();
      // The exact strings the two broken menu items used to produce.
      expect(screen.queryByText(/deal not found/i)).toBeNull();
      expect(screen.queryByText(/could not load deal/i)).toBeNull();
    },
  );

  it.each(['new', 'add', 'create'])(
    'the account detail page redirects /accounts/%s to the create form',
    (segment) => {
      renderAt(`/accounts/${segment}`, '/accounts/:accountId', EnhancedAccountDetailView, '/crm/accounts/new');

      expect(screen.getByText('CREATE FORM')).toBeInTheDocument();
      expect(screen.queryByText(/account not found/i)).toBeNull();
    },
  );

  it('does NOT redirect a real deal id — the guard must not swallow records', () => {
    renderAt('/crm/deals/D052', '/crm/deals/:id', ComprehensiveDealDetailPage, '/crm/deals/new');
    // Reaching the real detail page is the pass condition; what it renders with
    // no API behind it is not this test's business.
    expect(screen.queryByText('CREATE FORM')).toBeNull();
  });
});
