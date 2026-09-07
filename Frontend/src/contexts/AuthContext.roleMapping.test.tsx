import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import { AuthProvider, useAuth, TOKEN_KEY } from './AuthContext';

/**
 * AuthContext's role mapping, and specifically that it FAILS CLOSED.
 *
 * WHY THIS FILE EXISTS. `ROLE_MAP` used to fall back to `'Sales'`, so any role
 * string the UI did not recognise silently presented as a real, privileged-ish
 * role: CRM nav, deals, contacts. That was found while removing `hr` from the
 * CRM, and it is the display-layer twin of a bug this project has paid for
 * before — a UI that disagrees with the server about what you may do.
 *
 * WHAT THESE PROVE, precisely: that an unrecognised role becomes `'Unknown'`
 * and that `hasPermission` then grants NOTHING. They do NOT prove anything
 * about server-side enforcement, which is separate and already fail-closed
 * (`requireRole` refuses unrecognised roles; `rankOf` ranks them 0). This is a
 * display-layer assertion by design.
 *
 * The session is established the way the app really establishes one — a token
 * in storage and a GET /auth/me response — rather than by poking provider
 * state, so the mapping is exercised on the path a real sign-in takes.
 */

/** Every role this UI actually understands. Nothing unrecognised may become one. */
const KNOWN_ROLES = ['Admin', 'Sales', 'Manager'] as const;

const memoryStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => { store[k] = String(v); },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { store = {}; },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() { return Object.keys(store).length; },
  } as Storage;
};

/** Renders the mapped role plus the permission answers that matter. */
function Probe() {
  const { user, hasPermission } = useAuth();
  return (
    <div>
      <span data-testid="role">{user?.role ?? '(none)'}</span>
      <span data-testid="crm">{String(hasPermission('crm'))}</span>
      <span data-testid="dashboard">{String(hasPermission('dashboard'))}</span>
      <span data-testid="settings">{String(hasPermission('settings'))}</span>
      <span data-testid="all">{String(hasPermission('all'))}</span>
    </div>
  );
}

/** Signs in with whatever `role` the API claims to return. */
function renderWithApiRole(role: unknown) {
  localStorage.setItem(TOKEN_KEY, 'a-token');
  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      data: { id: 9, email: 'someone@example.com', first_name: 'Some', last_name: 'One', role },
    }),
  } as unknown as Response)));

  return render(<AuthProvider><Probe /></AuthProvider>);
}

describe('AuthContext role mapping — fails closed', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('maps the three roles the server issues', async () => {
    // The ordinary case the fail-closed path must not break.
    for (const [apiRole, expected] of [['admin', 'Admin'], ['sales', 'Sales'], ['manager', 'Manager']] as const) {
      const { unmount } = renderWithApiRole(apiRole);
      await waitFor(() => expect(screen.getByTestId('role').textContent).toBe(expected));
      unmount();
      localStorage.clear();
    }
  });

  it.each([
    ['hr'],            // the role just removed from the CRM — the concrete case
    ['HR'],            // and its capitalised form
    ['superuser'],     // something invented
    ['sdr'],           // a real word in the frontend permission model, but not a server role
    ['owner'],
    [''],              // empty string
    ['administrator'], // near-miss on a real role
  ])('an unrecognised role (%s) does NOT render as any known role', async (apiRole) => {
    renderWithApiRole(apiRole);

    await waitFor(() => expect(screen.getByTestId('role').textContent).not.toBe('(none)'));
    const rendered = screen.getByTestId('role').textContent;

    // THE ASSERTION: it is not silently one of the real roles. This is what
    // the `?? 'Sales'` fallback used to violate.
    expect(KNOWN_ROLES).not.toContain(rendered as typeof KNOWN_ROLES[number]);
    expect(rendered).toBe('Unknown');
  });

  it('grants an unrecognised role no modules at all', async () => {
    // Unlisted is not enough — the permission answer has to be no. A role that
    // rendered as "Unknown" but still answered true for 'crm' would be the same
    // bug wearing a different label.
    renderWithApiRole('hr');

    await waitFor(() => expect(screen.getByTestId('role').textContent).toBe('Unknown'));
    expect(screen.getByTestId('crm').textContent).toBe('false');
    expect(screen.getByTestId('dashboard').textContent).toBe('false');
    expect(screen.getByTestId('settings').textContent).toBe('false');
    expect(screen.getByTestId('all').textContent).toBe('false');
  });

  it('a missing role field is treated as unrecognised, not as a default', async () => {
    // `role` is optional on ApiUser, so absence is reachable without anyone
    // storing a junk string.
    renderWithApiRole(undefined);

    await waitFor(() => expect(screen.getByTestId('role').textContent).toBe('Unknown'));
    expect(screen.getByTestId('crm').textContent).toBe('false');
  });
});
