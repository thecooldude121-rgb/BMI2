import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';

/**
 * Where "Settings" actually goes.
 *
 * This is the smallest possible test and it guards the exact bug CLAUDE.md
 * records as lesson 5: a fix verified at one route while the navigation pointed
 * at another. Three Settings screens were wired to the real API over three
 * checkpoints — workspace preferences, the team roster, your profile and
 * password — and every one of them lived at `/crm/settings` while both entry
 * points in the chrome, the sidebar and the profile menu, sent users to
 * `/settings`: the dead Supabase tree, where none of that exists and nothing
 * saves. The work was invisible from the product for three commits.
 *
 * A route constant is exactly the kind of thing that gets reverted by a careless
 * merge and produces no type error and no failing test, so it gets one here.
 */

afterEach(() => vi.restoreAllMocks());

describe('the Settings entry points land on the wired module', () => {
  it('the sidebar links to /crm/settings, not the dead /settings tree', () => {
    render(
      <MemoryRouter initialEntries={['/crm/dashboard']}>
        <Sidebar />
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: /settings/i });
    expect(link).toHaveAttribute('href', '/crm/settings');
    // Stated as its own assertion because "/settings" is a PREFIX of
    // "/crm/settings" — a naive contains-check would pass on the broken value.
    expect(link.getAttribute('href')).not.toBe('/settings');
  });
});

describe('/settings redirects rather than rendering a second Settings page', () => {
  /** The redirect exactly as App.tsx declares it. */
  const Harness = ({ start }: { start: string }) => (
    <MemoryRouter initialEntries={[start]}>
      <Routes>
        <Route path="/settings" element={<Navigate to="/crm/settings" replace />} />
        <Route path="/crm/settings" element={<div>real settings module</div>} />
        <Route path="/settings/integrations" element={<div>integrations page</div>} />
      </Routes>
    </MemoryRouter>
  );

  it('an old bookmark to /settings arrives at the real module', () => {
    render(<Harness start="/settings" />);
    expect(screen.getByText('real settings module')).toBeInTheDocument();
  });

  it('the three /settings/* subroutes are NOT swept up by the redirect', () => {
    // Deliberate: they are not part of the roles hub, nothing links to them, and
    // whether they belong under /crm is a separate decision. A redirect declared
    // as a wildcard would have silently taken them too.
    render(<Harness start="/settings/integrations" />);
    expect(screen.getByText('integrations page')).toBeInTheDocument();
    expect(screen.queryByText('real settings module')).not.toBeInTheDocument();
  });
});
