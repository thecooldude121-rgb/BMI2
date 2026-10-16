import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import request from 'supertest';
import { pool } from '../config/database';
import { createApp } from '../app';
import { loopbackServer } from './loopbackServer';
import { setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';
import { runScopedReportQuery, resetReportsPool, ReportsPoolUnavailable } from '../config/reportsDatabase';

/**
 * Reports replay step b (decided by Venkat 2026-10-15): MISSING reports settings
 * must stop only the reports feature, never the whole backend. Login and every
 * other route keep working; a report run refuses with ReportsPoolUnavailable;
 * and the refusal never falls back to the application connection.
 *
 * The reports pool is created lazily, on the first report run. These tests pin
 * that: an app built with REPORTS_DB_* unset serves health and a real login, and
 * the boot file never touches the reports module at all.
 */
describe('missing reports settings stop only reports', () => {
  const realUser = process.env.REPORTS_DB_USER;
  const realPass = process.env.REPORTS_DB_PASSWORD;
  let ws: TestWorkspace;
  let app: ReturnType<typeof loopbackServer>;

  beforeAll(async () => {
    await resetReportsPool();
    delete process.env.REPORTS_DB_USER;
    delete process.env.REPORTS_DB_PASSWORD;
    app = loopbackServer(createApp());
    ws = await setupWorkspace('rpt-optional'); // a REAL login, with the settings absent
  });

  afterAll(async () => {
    process.env.REPORTS_DB_USER = realUser;
    process.env.REPORTS_DB_PASSWORD = realPass;
    await resetReportsPool();
    await teardownWorkspace(ws);
  });

  it('the app builds, answers /health and signs a user in with no reports settings', async () => {
    const health = await request(app).get('/health');
    expect(health.status, JSON.stringify(health.body)).toBe(200);
    expect(ws.token).toBeTruthy();
    const me = await request(app).get('/api/v1/auth/me').set(auth(ws));
    expect(me.status, JSON.stringify(me.body)).toBe(200);
  });

  it('a report run refuses with ReportsPoolUnavailable, and the app keeps working afterwards', async () => {
    await expect(runScopedReportQuery('SELECT 1', [], ws.tenantId, 1000))
      .rejects.toSatisfy((e: unknown) => e instanceof ReportsPoolUnavailable && /are not set/.test(e.message));
    // Nothing ran on the application pool in its place: that pool would have
    // answered SELECT 1, so a fallback would have resolved instead of refusing.
    expect((await request(app).get('/api/v1/auth/me').set(auth(ws))).status).toBe(200);
    expect((await pool.query('SELECT 1 AS ok')).rows[0].ok).toBe(1);
  });

  it('the boot file never touches the reports module, so it cannot fail startup', () => {
    // If a startup check is ever wanted, it must log and carry on, not exit.
    const boot = fs.readFileSync(path.join(__dirname, '..', 'index.ts'), 'utf8');
    expect(boot).not.toMatch(/reportsDatabase|assertRowSecurityActive|REPORTS_DB_/);
  });
});
