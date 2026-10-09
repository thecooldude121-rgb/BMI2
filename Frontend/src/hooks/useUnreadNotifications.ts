import { useCallback, useEffect, useState } from 'react';
import { fetchNotifications } from '../utils/notificationsApi';

export const UNREAD_POLL_MS = 60_000;

/**
 * The bell's unread count, from the server (never counted in the browser).
 * Polled every 60 s while the tab is visible and on focus; `null` until the
 * first answer or after a failure, so the badge never shows a guessed number.
 * Due follow-ups are NOT included (approved 2026-10-10).
 */
export function useUnreadNotifications(intervalMs = UNREAD_POLL_MS) {
  const [count, setCount] = useState<number | null>(null);
  const refresh = useCallback(async () => {
    if (document.visibilityState === 'hidden') return;
    try { setCount((await fetchNotifications({ limit: 1 })).unread_count); }
    catch { setCount(null); }
  }, []);
  useEffect(() => {
    refresh();
    const id = setInterval(refresh, intervalMs);
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible); };
  }, [refresh, intervalMs]);
  return { count, refresh, setCount };
}
