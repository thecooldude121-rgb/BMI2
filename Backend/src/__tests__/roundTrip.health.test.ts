import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { checkDatabase } from '../config/dbHealth';
import { app } from './helpers';

/**
 * Group A item 2: /health makes a REAL round trip to Postgres. Before this it
 * reported only the migration state captured at boot, so it said "ok" with the
 * database down — and the sidebar's "Workspace connected" stayed hidden because
 * nothing could back it.
 */
describe('GET /health checks the database per request', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('database answering: 200, database.ok, a measured latency', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database.ok).toBe(true);
    expect(typeof res.body.database.latency_ms).toBe('number');
  });

  it('database refusing: 503 degraded — and the driver error is NOT disclosed', async () => {
    vi.spyOn(pool, 'query').mockRejectedValueOnce(new Error('connect ECONNREFUSED 10.1.2.3:5432 user=secret_admin') as never);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await request(app).get('/health');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.database).toEqual({ ok: false, latency_ms: null });
    expect(JSON.stringify(res.body)).not.toMatch(/ECONNREFUSED|10\.1\.2\.3|secret_admin/);
  });

  it('database hanging: the check gives up at its timeout instead of waiting forever', async () => {
    vi.spyOn(pool, 'query').mockReturnValueOnce(new Promise(() => {}) as never);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const started = Date.now();
    const r = await checkDatabase(100);
    expect(r).toEqual({ ok: false, latency_ms: null });
    expect(Date.now() - started).toBeLessThan(1000);
  });
});
