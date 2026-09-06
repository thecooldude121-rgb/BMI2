import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import type { Role } from '../utils/permissions';

/**
 * The signed-in user, in the shape the permission model uses.
 *
 * THIS USED TO BE A HARDCODED STUB. `DEFAULT_USER` was
 * `{ id: 'user_1', name: 'John Smith', role: 'admin' }`, read from localStorage
 * and never from the session — so every user's UI rendered as that admin
 * regardless of who had actually signed in, and `usePermissions` gated buttons
 * on a fictional person. It now derives from AuthContext, which holds the real
 * user returned by /auth/login and /auth/me.
 *
 * `role` is typed as a plain string rather than `Role`. That is deliberate: it
 * carries whatever the server says the role is, `users.role` has no CHECK
 * constraint, and `roleHas` fails closed on anything it does not recognise. A
 * narrower type here would force a cast at the boundary and lose that property.
 */
export interface CurrentUser {
  id:   string;
  name: string;
  role: string;
}

interface CurrentUserContextValue {
  currentUser: CurrentUser;
  /** Dev-only. Ignored entirely in a production build — see below. */
  setRole: (role: Role) => void;
  /** True when a dev override is masking the real session role. */
  isRoleOverridden: boolean;
}

/**
 * Signed out, or the session has not loaded yet. NOT a person: no name, no id,
 * and a role no permission set matches, so `roleHas` denies everything. The old
 * stub defaulted to `admin`, which meant a logged-out render briefly showed
 * admin-only controls.
 */
const ANONYMOUS: CurrentUser = { id: '', name: '', role: 'anonymous' };

/** How AuthContext's capitalised roles map onto the permission vocabulary. */
const ROLE_FROM_SESSION: Record<string, Role> = {
  Admin:   'admin',
  Manager: 'manager',
  Sales:   'sales',
  // 'HR' is deliberately absent. It is not a CRM persona, and mapping it to a
  // sales tier would hand an HR account lead-editing rights it was never meant
  // to have. Unmapped roles fall through to the raw lowercased value, which
  // roleHas does not recognise and therefore denies.
};

const CurrentUserContext = createContext<CurrentUserContextValue>({
  currentUser: ANONYMOUS,
  setRole: () => {},
  isRoleOverridden: false,
});

const OVERRIDE_KEY = 'bmi_dev_role_override';

export function CurrentUserProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  /**
   * The dev role override, for the DEV: switcher in the corner.
   *
   * Read from localStorage ONLY in a dev build. A developer who used the
   * switcher and later opened a production build on the same browser would
   * otherwise carry a stale 'admin' override into it — localStorage does not
   * know which build wrote it. `import.meta.env.DEV` is a compile-time
   * constant, so in production this branch and the state it feeds are dropped
   * by the bundler rather than merely skipped.
   */
  const [override, setOverride] = useState<Role | null>(() => {
    if (!import.meta.env.DEV) return null;
    try {
      const raw = localStorage.getItem(OVERRIDE_KEY);
      return raw ? (JSON.parse(raw) as Role) : null;
    } catch {
      return null;
    }
  });

  const setRole = useCallback((role: Role) => {
    if (!import.meta.env.DEV) return;   // no-op outside development
    setOverride(role);
    try { localStorage.setItem(OVERRIDE_KEY, JSON.stringify(role)); } catch { /* ignore */ }
  }, []);

  const currentUser = useMemo<CurrentUser>(() => {
    if (!user) return ANONYMOUS;

    const sessionRole = ROLE_FROM_SESSION[user.role] ?? String(user.role ?? '').toLowerCase();
    return {
      id:   user.id,
      name: user.name,
      // The override can only ever apply in a dev build: `override` is forced to
      // null above when import.meta.env.DEV is false.
      role: import.meta.env.DEV && override ? override : sessionRole,
    };
  }, [user, override]);

  const value = useMemo(
    () => ({ currentUser, setRole, isRoleOverridden: Boolean(import.meta.env.DEV && override) }),
    [currentUser, setRole, override],
  );

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser(): CurrentUserContextValue {
  return useContext(CurrentUserContext);
}
