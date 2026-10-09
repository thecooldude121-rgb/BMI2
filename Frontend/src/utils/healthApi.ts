/**
 * GET /health (Group A item 2). Unauthenticated and outside /api/v1, on the
 * same origin as every other API call. The server answers 200 only when the
 * migrations are in order AND Postgres answered a SELECT 1 just now.
 */
const HEALTH_URL = 'http://localhost:5001/health';

export type ConnectionState = 'connected' | 'degraded' | 'unreachable';

/** Never throws: every outcome is one of the three states. */
export async function checkConnection(timeoutMs = 5000): Promise<ConnectionState> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(HEALTH_URL, { signal: ctrl.signal, cache: 'no-store' });
    const body = await res.json().catch(() => null);
    // Connected means the server SAID the database answered — a 200 alone is not enough.
    if (res.ok && body?.database?.ok === true) return 'connected';
    return 'degraded';
  } catch {
    return 'unreachable';
  } finally {
    clearTimeout(timer);
  }
}
