import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';

/**
 * Real authentication against POST /auth/login.
 *
 * WHAT WAS HERE
 * `login()` was commented `// Mock authentication` and returned true for any
 * non-empty email and password, setting a hardcoded user — "John Smith",
 * role Admin, a stock-photo avatar, id 000…0001. It never called the API and
 * never obtained a token. `user` was also INITIALISED to that same hardcoded
 * object, so the app booted already signed in and the /login route was
 * unreachable in normal use.
 *
 * The consequence was bigger than a fake identity: nothing in the frontend ever
 * wrote `authToken`, while seven API clients read it. So every request the
 * running app made went out with no Authorization header and came back
 * 401 "No token provided". Every page that needed data failed to load, and the
 * only way anyone saw real data was by pasting a token into localStorage by
 * hand — which is exactly how this went unnoticed for so long.
 *
 * SESSION MODEL
 * The JWT is the session. It is stored under `authToken` because that is the key
 * the API clients already read, and rehydrated on boot via GET /auth/me so a
 * refresh does not sign the user out. A token that the server rejects is
 * discarded rather than kept around looking valid.
 */

const API_BASE = 'http://localhost:5001/api/v1';
/** The single key the whole app uses for the session token. */
export const TOKEN_KEY = 'authToken';

export interface User {
  id: string;
  name: string; 
  email: string;
  role: 'Admin' | 'Sales' | 'Manager' | 'Unknown';
  avatar?: string;
  department?: string;
  /**
   * Workspace this session is scoped to. Informational for the UI only — the
   * API derives tenant scope from the token itself and never from anything the
   * client sends.
   */
  workspaceId?: string;
}

/**
 * The API stores lowercase roles; this UI's permission map uses capitalised ones.
 *
 * `hr: 'HR'` was here and is REMOVED DELIBERATELY — HRMS is a separate platform
 * over SSO, so HR is not a CRM role (see Backend utils/roles.ts). Verified zero
 * users held it in any workspace before removing.
 *
 * THIS MAP FAILS CLOSED. An unrecognised role becomes `'Unknown'`, which grants
 * nothing — see `rolePermissions` in `hasPermission`, where it maps to `[]`.
 *
 * It used to fall back to `'Sales'`, which was the wrong direction and was
 * found while removing `hr`: a stray role would have silently presented as a
 * real one, so the UI would offer CRM navigation to an account nobody had
 * granted it to. Harmless in terms of actual data access — the API is the
 * control, `requireRole` refuses any role it does not recognise and `rankOf`
 * ranks unknown roles 0 — but a UI that shows you a door the server will not
 * open is its own bug, and this project has been burned before by a display
 * layer that disagreed with the server.
 *
 * `users.role` has no CHECK constraint, so an arbitrary string IS storable
 * directly even though the API will no longer produce one. `'Unknown'` is what
 * the UI does when it meets one.
 */
const ROLE_MAP: Record<string, User['role']> = {
  admin: 'Admin', sales: 'Sales', manager: 'Manager',
};

export interface ApiUser {
  id: number | string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  role?: string | null;
  department?: string | null;
  avatar_url?: string | null;
  tenant_id?: string | null;
  workspace_id?: string | null;
}

function toUser(u: ApiUser): User {
  const name = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
  return {
    id: String(u.id),
    name: name || u.email,
    email: u.email,
    role: ROLE_MAP[String(u.role ?? '').toLowerCase()] ?? 'Unknown',
    // No avatar column value means no avatar. Absent, not a stock photo.
    avatar: u.avatar_url ?? undefined,
    department: u.department ?? undefined,
    workspaceId: u.workspace_id ?? u.tenant_id ?? undefined,
  };
}

export interface LoginResult {
  ok: boolean;
  /** Server-supplied message, shown verbatim so the user sees the real reason. */
  message?: string;
}

interface AuthContextType {
  user: User | null;
  /** True while the stored token is being validated on boot. */
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  /**
   * Adopt a user row the server just returned — after PATCH /auth/me, so the
   * name in the top bar matches the name that was saved. Takes the API shape
   * and maps it exactly the way login and the boot rehydrate do, so there is
   * one mapping and not three.
   */
  adoptUser: (apiUser: ApiUser) => void;
  /**
   * Replace the stored session token.
   *
   * REQUIRED after POST /auth/change-password. That endpoint bumps
   * `users.token_version`, which kills every token issued before it including
   * the one the request was made with, and hands back a fresh one. Not storing
   * it means the next request 401s, the boot rehydrate discards the token, and
   * the user is bounced to the login screen immediately after changing their
   * password. This is a client contract, not an optimisation.
   */
  applyReissuedToken: (token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Starts null — signed out until a token proves otherwise. `loading` keeps the
  // app from flashing the login screen while an existing token is checked.
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setLoading(false); return; }

    fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async res => {
        if (cancelled) return;
        if (!res.ok) {
          // Expired or invalid: drop it. Keeping it would leave the UI looking
          // signed in while every request 401s — the failure mode this replaces.
          localStorage.removeItem(TOKEN_KEY);
          setUser(null);
          return;
        }
        const json = await res.json();
        setUser(toUser(json.data ?? json.user ?? json));
      })
      .catch(() => { if (!cancelled) { /* offline: stay signed out, keep the token */ } })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.token) {
        return { ok: false, message: json.message || 'Could not sign in. Please try again.' };
      }

      localStorage.setItem(TOKEN_KEY, json.token);
      setUser(toUser(json.user));
      return { ok: true };
    } catch {
      // A network failure is not a wrong password, and must not be reported as one.
      return { ok: false, message: 'Could not reach the server. Check your connection and try again.' };
    }
  }, []);

  const adoptUser = useCallback((apiUser: ApiUser) => {
    setUser(toUser(apiUser));
  }, []);

  const applyReissuedToken = useCallback((token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('sessionData');
    if (localStorage.getItem('rememberMe') !== 'true') {
      localStorage.removeItem('userEmail');
    }
  }, []);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    const rolePermissions: Record<User['role'], string[]> = {
      Admin: ['all'],
      Manager: ['crm', 'analytics', 'integrations', 'calendar', 'settings', 'gamification', 'dashboard', 'team'],
      Sales: ['crm', 'calendar', 'integrations', 'dashboard', 'team'],
      // Fails closed: an unrecognised role gets no module at all, rather than
      // inheriting Sales' list. See ROLE_MAP above.
      Unknown: [],
    };
    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes('all') || userPermissions.includes(permission);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission, adoptUser, applyReissuedToken }}>
      {children}
    </AuthContext.Provider>
  );
};
