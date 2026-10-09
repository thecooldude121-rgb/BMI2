import { pool } from './database';

/** How long /health waits for the database before calling it unreachable. */
export const DB_HEALTH_TIMEOUT_MS = 2000;

export interface DatabaseHealth { ok: boolean; latency_ms: number | null }

/**
 * A real round trip to Postgres — SELECT 1 — bounded by a timeout, because a
 * pool that cannot get a connection waits rather than failing and /health must
 * answer either way. The error is logged here and NEVER returned: /health is
 * unauthenticated, and a driver message can name hosts, ports and users.
 */
export async function checkDatabase(timeoutMs = DB_HEALTH_TIMEOUT_MS): Promise<DatabaseHealth> {
  const started = Date.now();
  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      pool.query('SELECT 1'),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`no answer within ${timeoutMs} ms`)), timeoutMs); }),
    ]);
    return { ok: true, latency_ms: Date.now() - started };
  } catch (err) {
    console.error('[health] database check failed:', (err as Error).message);
    return { ok: false, latency_ms: null };
  } finally {
    if (timer) clearTimeout(timer);
  }
}
