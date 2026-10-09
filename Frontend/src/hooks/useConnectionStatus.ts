import { useEffect, useState } from 'react';
import { checkConnection, type ConnectionState } from '../utils/healthApi';

export const CONNECTION_POLL_MS = 30_000;

/**
 * Polls /health every 30 s while the tab is visible, and re-checks at once
 * when the tab becomes visible again or the browser comes back online.
 * `null` until the first answer — the UI shows nothing rather than guessing.
 */
export function useConnectionStatus(intervalMs = CONNECTION_POLL_MS): ConnectionState | null {
  const [state, setState] = useState<ConnectionState | null>(null);

  useEffect(() => {
    let live = true;
    let inFlight = false;
    const run = async () => {
      if (inFlight || document.visibilityState === 'hidden') return;
      inFlight = true;
      const s = await checkConnection();
      inFlight = false;
      if (live) setState(s);
    };
    run();
    const id = setInterval(run, intervalMs);
    const onVisible = () => { if (document.visibilityState === 'visible') run(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', run);
    return () => {
      live = false;
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', run);
    };
  }, [intervalMs]);

  return state;
}
