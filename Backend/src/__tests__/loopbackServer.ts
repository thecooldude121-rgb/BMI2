import http from 'node:http';
import { beforeAll, afterAll } from 'vitest';
import type { Express } from 'express';

/**
 * ONE test server per test file, bound to 127.0.0.1 — the fix for the suite's
 * long-running "Invalid authentication" flake (diagnosed 2026-10-13, see
 * CLAUDE.md "Suite stability").
 *
 * `request(app)` with a bare Express app makes supertest call `app.listen(0)`
 * for EVERY request: a fresh random port bound on `::` (all interfaces), then a
 * request to `http://127.0.0.1:<port>`. On macOS a process already bound to
 * 127.0.0.1:<port> takes that connection instead — the VS Code helper answered
 * with the captured `authentication_error` envelope, pgAdmin with an HTML 401
 * (read as `{}`). Binding 127.0.0.1 ourselves means the OS can only assign a
 * port no one else holds on that address, and supertest reuses this server
 * rather than binding its own (it only listens when `address()` is null).
 *
 * Registers its own beforeAll / afterAll in whichever test file imports it, so
 * the server is listening before the file's first request and closed after.
 */
export function loopbackServer(app: Express): http.Server {
  const server = http.createServer(app);
  beforeAll(() => new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  }));
  afterAll(() => new Promise<void>(resolve => server.close(() => resolve())));
  return server;
}
