/**
 * WHERE THE BACKEND IS — the one place the frontend learns it (2026-10-18).
 *
 * Before this, 27 files each hardcoded 'http://localhost:5001'. My end-to-end
 * checks ran a second frontend (:5174) and rerouted its requests to a test
 * backend (:5002) with a script injected into the page; when that page reloaded,
 * the injection was gone and a request reached Venkat's own backend on :5001.
 *
 * Two modes:
 *   - every normal build (`vite`, `vite build`, tests): VITE_BACKEND_ORIGIN if set,
 *     else http://localhost:5001 — what `./scripts/dev.sh` runs.
 *   - `vite --mode e2e` (the test frontend, started by `scripts/e2e-servers.sh`):
 *     VITE_BACKEND_ORIGIN is REQUIRED, has NO default, and may not be :5001. A
 *     missing or wrong value throws when the app loads — a blank page with the
 *     reason, never a quiet fall-back to the live backend.
 *
 * The value is fixed at build time, so a page reload cannot lose it.
 */
import { resolveBackendOrigin } from './backendOrigin';

export { LIVE_DEV_ORIGIN, resolveBackendOrigin } from './backendOrigin';
export const BACKEND_ORIGIN = resolveBackendOrigin(import.meta.env);
export const API_BASE = `${BACKEND_ORIGIN}/api/v1`;
