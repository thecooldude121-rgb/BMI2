import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';

/**
 * Data-correctness slice (2026-10-06). (1) DATE columns reach clients as the
 * plain 'YYYY-MM-DD' Postgres stores — they arrived a day early as a shifted
 * timestamp from the IST server. (2) A lead's last contact is the calendar day
 * of the touch in the WORKSPACE's time zone — it was the UTC date.
 */
describe('date-only values are calendar days, end to end', () => {
  let ws: TestWorkspace;

  beforeAll(async () => { ws = await setupWorkspace('dateonly'); });
  afterAll(async () => {
    await pool.query(`UPDATE tenants SET settings = settings - 'timezone' WHERE id = $1`, [ws.tenantId]);
    await teardownWorkspace(ws);
  });

  it('the driver returns a DATE as the stored string, never a Date object', async () => {
    const r = await pool.query(`SELECT '2026-05-28'::date AS d`);
    expect(r.rows[0].d).toBe('2026-05-28');
  });

  it('a task\'s due date round-trips through the API unchanged — including RETURNING * on create', async () => {
    const res = await request(app).post('/api/v1/tasks').set(auth(ws)).send({ title: 'T', due_date: '2026-05-28' });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(res.body.data.due_date).toBe('2026-05-28');
  });

  it('a deal\'s expected close date is served as "YYYY-MM-DD"', async () => {
    const stage = (await pool.query('SELECT id FROM pipeline_stages WHERE tenant_id = $1 ORDER BY id LIMIT 1', [ws.tenantId])).rows[0].id;
    const d = (await pool.query(
      `INSERT INTO deals (name, value, currency, stage_id, tenant_id, expected_close_date) VALUES ('D', 1, 'USD', $1, $2, '2026-12-31') RETURNING id`,
      [stage, ws.tenantId])).rows[0].id;
    const res = await request(app).get(`/api/v1/deals/${d}`).set(auth(ws));
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    const body = JSON.stringify(res.body);
    expect(body).toContain('"2026-12-31"');
    expect(body).not.toContain('2026-12-30T');
  });

  it('a logged touch records the day in the WORKSPACE time zone (here UTC+14, a different day from UTC)', async () => {
    await pool.query(`UPDATE tenants SET settings = jsonb_set(coalesce(settings, '{}'), '{timezone}', '"Pacific/Kiritimati"') WHERE id = $1`, [ws.tenantId]);
    const lead = (await request(app).post('/api/v1/leads').set(auth(ws)).send({ first_name: 'Z', email: 'z@dateonly.example' })).body.data.id;
    // 12:00 UTC on 1 Jan 2026 is already 02:00 on 2 Jan in Kiritimati.
    await request(app).post(`/api/v1/leads/${lead}/activities`).set(auth(ws))
      .send({ subject: 'Call', type: 'call', status: 'completed', completed_at: '2026-01-01T12:00:00Z' });
    const r = (await pool.query('SELECT last_contact FROM leads WHERE id = $1', [lead])).rows[0];
    expect(r.last_contact).toBe('2026-01-02');
    // …and the API serves exactly that day.
    const api = await request(app).get(`/api/v1/leads/${lead}`).set(auth(ws));
    expect(api.body.data.last_contact).toBe('2026-01-02');
  });

  it('with no workspace time zone, the database\'s zone decides (never the UTC slice)', async () => {
    await pool.query(`UPDATE tenants SET settings = settings - 'timezone' WHERE id = $1`, [ws.tenantId]);
    const lead = (await request(app).post('/api/v1/leads').set(auth(ws)).send({ first_name: 'Y', email: 'y@dateonly.example' })).body.data.id;
    // 20:00 UTC on 1 Jan: in Asia/Kolkata (UTC+5:30) that is 01:30 on 2 Jan.
    await request(app).post(`/api/v1/leads/${lead}/activities`).set(auth(ws))
      .send({ subject: 'Call', type: 'call', status: 'completed', completed_at: '2026-01-01T20:00:00Z' });
    const expected = (await pool.query(`SELECT ('2026-01-01T20:00:00Z'::timestamptz AT TIME ZONE current_setting('TimeZone'))::date::text AS d`)).rows[0].d;
    expect((await pool.query('SELECT last_contact FROM leads WHERE id = $1', [lead])).rows[0].last_contact).toBe(expected);
  });
});
