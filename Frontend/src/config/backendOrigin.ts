/**
 * The pure rule behind src/config/backend.ts — no `import.meta`, so Vite's own
 * config (Node) can apply the same check before the e2e server starts.
 */
export const LIVE_DEV_ORIGIN = 'http://localhost:5001';

export function resolveBackendOrigin(env: { MODE?: string; VITE_BACKEND_ORIGIN?: string }): string {
  const raw = env.VITE_BACKEND_ORIGIN?.trim();
  if (env.MODE === 'e2e') {
    if (!raw) {
      throw new Error('E2E frontend: VITE_BACKEND_ORIGIN is not set. It has no default in e2e mode — start the test servers with scripts/e2e-servers.sh.');
    }
    let port = '';
    try { port = new URL(raw).port; } catch {
      throw new Error(`E2E frontend: VITE_BACKEND_ORIGIN "${raw}" is not a URL.`);
    }
    if (port === '5001' || raw.replace(/\/+$/, '') === LIVE_DEV_ORIGIN) {
      throw new Error('E2E frontend: VITE_BACKEND_ORIGIN points at :5001, the live development backend. Use the test backend (:5002).');
    }
    return raw.replace(/\/+$/, '');
  }
  return (raw || LIVE_DEV_ORIGIN).replace(/\/+$/, '');
}
