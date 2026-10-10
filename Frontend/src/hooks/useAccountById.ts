import { useEffect, useState } from 'react';
import { fetchAccountByIdOrNull } from '../utils/accountsApi';
import type { EnhancedAccount } from '../types/accounts';

/**
 * Load ONE account from the server (Group A item 4, slice 3b). Detail, edit and
 * merge looked the id up in AccountsContext's capped list of 200, so any account
 * beyond it read as "not found". `account` is null when it does not exist,
 * undefined while loading; a failed request sets `error`, never "not found".
 */
export function useAccountById(id: string | undefined) {
  const [account, setAccount] = useState<EnhancedAccount | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!id) { setAccount(null); return; }
    let cancelled = false;
    setAccount(undefined);
    setError(null);
    fetchAccountByIdOrNull(id)
      .then(a => { if (!cancelled) setAccount(a); })
      .catch((e: Error) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [id]);
  return { account, loading: account === undefined && !error, error };
}
