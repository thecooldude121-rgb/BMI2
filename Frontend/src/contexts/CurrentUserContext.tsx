import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Role } from '../utils/permissions';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CurrentUser {
  id:   string;
  name: string;
  role: Role;
}

interface CurrentUserContextValue {
  currentUser: CurrentUser;
  setRole:     (role: Role) => void;
}

// ── Storage ───────────────────────────────────────────────────────────────────

const STORAGE_KEY   = 'bmi_current_user';
const DEFAULT_USER: CurrentUser = { id: 'user_1', name: 'John Smith', role: 'admin' };

function readUser(): CurrentUser {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_USER, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_USER;
}

// ── Context ───────────────────────────────────────────────────────────────────

const CurrentUserContext = createContext<CurrentUserContextValue>({
  currentUser: DEFAULT_USER,
  setRole:     () => {},
});

export function CurrentUserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser>(readUser);

  const setRole = useCallback((role: Role) => {
    setCurrentUser(prev => {
      const updated = { ...prev, role };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <CurrentUserContext.Provider value={{ currentUser, setRole }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser(): CurrentUserContextValue {
  return useContext(CurrentUserContext);
}
