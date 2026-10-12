import { describe, it, expect } from 'vitest';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import request from 'supertest';
import { app } from './helpers';

/**
 * The test server is bound to 127.0.0.1 (see loopbackServer.ts). Pins the fix
 * for the "Invalid authentication" flake AND the operating-system behaviour that
 * made it happen, so neither can silently regress.
 */
const listen = (host?: string, port = 0) => new Promise<http.Server>((resolve, reject) => {
  const s = http.createServer((_q, res) => res.end('decoy'));
  s.once('error', reject);
  s.listen(port, host, () => resolve(s));
});
const close = (s: http.Server) => new Promise<void>(r => s.close(() => r()));

describe('test server is bound to 127.0.0.1', () => {
  it('the shared app is a server listening on 127.0.0.1, so supertest reuses it', () => {
    const addr = app.address() as AddressInfo;
    expect(addr.address).toBe('127.0.0.1');
  });

  it('supertest requests reach THIS app (the health route answers in its own shape)', async () => {
    const res = await request(app).get('/health');
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('database');
    expect(res.body).not.toHaveProperty('request_id');
  });

  it('why it works: a port another process holds on 127.0.0.1 cannot be bound there again', async () => {
    const decoy = await listen('127.0.0.1');
    const port = (decoy.address() as AddressInfo).port;
    try {
      // The fix: binding 127.0.0.1 on a held port is refused, so the OS never
      // hands the test server a port someone else is answering on.
      await expect(listen('127.0.0.1', port)).rejects.toMatchObject({ code: 'EADDRINUSE' });
    } finally {
      await close(decoy);
    }
  });
});
