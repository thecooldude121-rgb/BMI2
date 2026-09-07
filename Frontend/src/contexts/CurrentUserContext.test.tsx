import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

/**
 * CurrentUserContext, after it stopped being a hardcoded stub.
 *
 * WHAT THESE PROVE, stated plainly: that the context derives its user from the
 * real AuthContext session, and that the dev role override cannot apply in a
 * production build. They are unit tests around a React context — they do NOT
 * prove the browser end-to-end, and there is no database round trip here to
 * make, because this component talks to no API of its own.
 *
 * `useAuth` is mocked because the subject is the DERIVATION, not AuthContext's
 * own fetching, which has its own coverage.
 */
const mockUseAuth = vi.fn();
vi.mock('./AuthContext', () => ({ useAuth: () => mockUseAuth() }));

// eslint-disable-next-line import/first
import { CurrentUserProvider, useCurrentUser } from './CurrentUserContext';
// eslint-disable-next-line import/first
import { roleHas } from '../utils/permissions';

/**
 * An in-memory localStorage.
 *
 * jsdom does not expose one under this runner's document origin, and the
 * subject here is the OVERRIDE RULE, not browser storage semantics. The
 * provider reads and writes storage inside try/catch precisely so it survives
 * that, and a shim keeps these tests testing the rule rather than the
 * environment.
 */
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

/** Renders whatever the context currently holds. */
function Probe() {
  const { currentUser, isRoleOverridden } = useCurrentUser();
  return (
    <div>
      <span data-testid="id">{currentUser.id}</span>
      <span data-testid="name">{currentUser.name}</span>
      <span data-testid="role">{currentUser.role}</span>
      <span data-testid="overridden">{String(isRoleOverridden)}</span>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <CurrentUserProvider>
      <Probe />
    </CurrentUserProvider>,
  );
}

describe('CurrentUserContext', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage());
    mockUseAuth.mockReset();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('derives the signed-in user from the session, not a hardcoded stub', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '42', name: 'Priya Nair', email: 'priya@example.com', role: 'Manager' },
    });
    renderWithProvider();

    expect(screen.getByTestId('id').textContent).toBe('42');
    expect(screen.getByTestId('name').textContent).toBe('Priya Nair');
    // Capitalised session role is mapped down to the permission vocabulary.
    expect(screen.getByTestId('role').textContent).toBe('manager');
    // The old stub was John Smith / admin, for everyone.
    expect(screen.getByTestId('name').textContent).not.toBe('John Smith');
  });

  it.each([
    ['Admin', 'admin'],
    ['Manager', 'manager'],
    ['Sales', 'sales'],
  ])('maps the session role %s to %s', (sessionRole, expected) => {
    mockUseAuth.mockReturnValue({ user: { id: '1', name: 'X', email: 'x@e.com', role: sessionRole } });
    renderWithProvider();
    expect(screen.getByTestId('role').textContent).toBe(expected);
  });

  it('an unmapped session role (HR) is passed through lowercased, and roleHas denies it', () => {
    mockUseAuth.mockReturnValue({ user: { id: '9', name: 'Ess Aitch', email: 'hr@e.com', role: 'HR' } });
    renderWithProvider();
    // Deliberately NOT mapped to a sales tier — that would hand an HR account
    // lead-editing rights. It falls through and the permission model denies it.
    //
    // `hr` is no longer a CRM role at all (HRMS is a separate platform over
    // SSO), so this is now the fail-closed case for ANY unrecognised role
    // rather than a scenario the product can produce. Kept, and kept using
    // `hr`, because a stray row is still storable directly — users.role has no
    // CHECK constraint — and this asserts what the UI does when it meets one.
    expect(screen.getByTestId('role').textContent).toBe('hr');

    expect(roleHas('hr', 'leads.edit_fields')).toBe(false);
  });

  it('signed out is anonymous with no name and no permissions — not a default admin', () => {
    mockUseAuth.mockReturnValue({ user: null });
    renderWithProvider();

    expect(screen.getByTestId('id').textContent).toBe('');
    expect(screen.getByTestId('name').textContent).toBe('');
    expect(screen.getByTestId('role').textContent).toBe('anonymous');

    // The old default was role 'admin', so a logged-out render briefly offered
    // admin-only controls.
    expect(roleHas('anonymous', 'leads.delete')).toBe(false);
    expect(roleHas('anonymous', 'leads.view_own')).toBe(false);
  });

  it('a stale dev override in localStorage does NOT apply when DEV is false', () => {
    // The scenario: a developer used the switcher, then the same browser opens a
    // production build. localStorage does not know which build wrote the value.
    localStorage.setItem('bmi_dev_role_override', JSON.stringify('admin'));
    vi.stubEnv('DEV', false);
    try {
      mockUseAuth.mockReturnValue({ user: { id: '7', name: 'Sales Person', email: 's@e.com', role: 'Sales' } });
      renderWithProvider();

      expect(screen.getByTestId('role').textContent, 'the real role must win in production').toBe('sales');
      expect(screen.getByTestId('overridden').textContent).toBe('false');
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('the dev override DOES apply in a dev build, so the switcher still works', () => {
    localStorage.setItem('bmi_dev_role_override', JSON.stringify('admin'));
    vi.stubEnv('DEV', true);
    try {
      mockUseAuth.mockReturnValue({ user: { id: '7', name: 'Sales Person', email: 's@e.com', role: 'Sales' } });
      renderWithProvider();

      expect(screen.getByTestId('role').textContent).toBe('admin');
      // And it announces itself, so a masked role is never mistaken for the real one.
      expect(screen.getByTestId('overridden').textContent).toBe('true');
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
