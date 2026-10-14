import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';

/**
 * Weeks start on MONDAY everywhere (decided by Venkat 2026-10-13). The Leads
 * summary's imported_this_week used to start its week on SUNDAY
 * (date_trunc('week', CURRENT_DATE + 1) - 1 day), so a lead imported on Sunday
 * evening counted toward the NEXT week. Postgres' date_trunc('week') is Monday.
 */
describe('Leads summary — imported this week starts on Monday', () => {
  let ws: TestWorkspace;
  beforeAll(async () => { ws = await setupWorkspace('weekstart'); });
  afterAll(async () => { await teardownWorkspace(ws); });

  it('a lead imported late on the Sunday BEFORE this week is not this week; Monday 00:00 onwards is', async () => {
    await pool.query(
      `INSERT INTO leads (first_name, last_name, email, stage, source, created_at, tenant_id) VALUES
         ('Sun', 'Night', 'sun@week.example', 'new', 'Lead Gen', date_trunc('week', CURRENT_DATE) - interval '1 hour', $1),
         ('Mon', 'Start', 'mon@week.example', 'new', 'Lead Gen', date_trunc('week', CURRENT_DATE), $1)`,
      [ws.tenantId],
    );
    const res = await request(app).get('/api/v1/leads/summary').set(auth(ws));
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.data.imported_this_week).toBe(1);
  });
});
