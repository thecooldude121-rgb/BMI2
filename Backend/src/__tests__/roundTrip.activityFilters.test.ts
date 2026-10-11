import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';

/**
 * Group A item 4, slice 4b — the Activities page's filters and tiles run on the
 * server. The page loaded 200 activities, its five filter dropdowns and search
 * box filtered nothing, and its six tiles counted the loaded rows.
 *
 * "Today" / "this week" are the VIEWER'S, sent as local-midnight instants; the
 * tests use a fixed day far from the real clock so a server that consulted its
 * own calendar would put rows in the wrong tile.
 */
describe('activity filters and summary', () => {
  let ws: TestWorkspace;
  let other: TestWorkspace;
  let companyId: string;
  let contactId: string;
  // The viewer's day is 2031-03-15 in a UTC+05:30 zone.
  const DAY_FROM = '2031-03-14T18:30:00.000Z';
  const DAY_TO = '2031-03-15T18:30:00.000Z';
  const WEEK_FROM = '2031-03-08T18:30:00.000Z'; // Sun 9 Mar local
  const WEEK_TO = '2031-03-15T18:30:00.000Z';
  const BOUNDS = { day_from: DAY_FROM, day_to: DAY_TO, week_from: WEEK_FROM, week_to: WEEK_TO };
  const get = (path: string, q: Record<string, string | number> = {}) => request(app).get(path).query(q).set(auth(ws));

  beforeAll(async () => {
    ws = await setupWorkspace('actfilters');
    other = await setupWorkspace('actfilters-other');
    companyId = (await pool.query(`INSERT INTO companies (name, tenant_id) VALUES ('Kora', $1) RETURNING id`, [ws.tenantId])).rows[0].id;
    contactId = (await pool.query(
      `INSERT INTO contacts (first_name, last_name, email, tenant_id) VALUES ('Ana', 'Ray', $2, $1) RETURNING id`,
      [ws.tenantId, `ana-${Date.now()}@af.example`])).rows[0].id;
    const ins = (subject: string, type: string, status: string, at: { completed?: string; scheduled?: string }, who: string, parent: 'company' | 'contact') =>
      pool.query(
        `INSERT INTO activities (subject, type, status, completed_at, scheduled_at, assigned_to, company_id, contact_id, tenant_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [subject, type, status, at.completed ?? null, at.scheduled ?? null, who,
          parent === 'company' ? companyId : null, parent === 'contact' ? contactId : null, ws.tenantId]);
    await ins('Call today', 'call', 'completed', { completed: '2031-03-15T04:00:00Z' }, 'Dee Admin', 'company');
    await ins('Meeting today', 'meeting', 'completed', { completed: '2031-03-15T09:00:00Z' }, 'Dee Admin', 'contact');
    // 23:00 local on the 14th is 17:30Z — yesterday for the viewer, though the UTC date is also the 14th.
    await ins('Call yesterday late', 'call', 'completed', { completed: '2031-03-14T17:30:00Z' }, 'Sam Rep', 'company');
    // 00:30 local on the 15th is 19:00Z on the 14th — TODAY for the viewer, though its UTC date is the 14th.
    await ins('Email just after midnight', 'email', 'completed', { completed: '2031-03-14T19:00:00Z' }, 'Sam Rep', 'contact');
    await ins('Old note', 'note', 'completed', { completed: '2031-02-01T10:00:00Z' }, 'Sam Rep', 'company');
    // Planned in the past (overdue) and in the far future (upcoming) relative to the REAL now.
    await ins('Overdue follow-up call', 'call', 'planned', { scheduled: '2020-01-01T10:00:00Z' }, 'Dee Admin', 'company');
    await ins('Future demo', 'demo', 'planned', { scheduled: '2099-01-01T10:00:00Z' }, 'Sam Rep', 'contact');
    // Another workspace's activity on the same day must never be counted.
    const theirCo = (await pool.query(`INSERT INTO companies (name, tenant_id) VALUES ('Theirs', $1) RETURNING id`, [other.tenantId])).rows[0].id;
    await pool.query(
      `INSERT INTO activities (subject, type, status, completed_at, company_id, tenant_id)
       SELECT 'Foreign ' || g, 'call', 'completed', '2031-03-15T05:00:00Z', $1, $2 FROM generate_series(1, 5) g`,
      [theirCo, other.tenantId]);
  });
  afterAll(async () => {
    for (const t of [ws, other]) {
      await pool.query('DELETE FROM activities WHERE tenant_id = $1', [t.tenantId]);
      await teardownWorkspace(t);
    }
  });

  it('summary counts every tile from the viewer\'s day and week, never another workspace', async () => {
    const res = await get('/api/v1/activities/summary', BOUNDS);
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.data).toEqual({
      total: 7, today: 3, this_week: 4, overdue: 1, meetings_today: 1, calls_today: 1,
    });
  });

  it('the day boundary is the viewer\'s midnight, not the UTC date', async () => {
    const res = await get('/api/v1/activities', { occurred_after: DAY_FROM, occurred_before: DAY_TO });
    expect(res.body.data.map((a: { subject: string }) => a.subject).sort())
      .toEqual(['Call today', 'Email just after midnight', 'Meeting today']);
  });

  it('every filter narrows the list AND the summary to the same set', async () => {
    const cases: [Record<string, string>, number][] = [
      [{ type: 'call' }, 3],
      [{ status: 'planned' }, 2],
      [{ state: 'overdue' }, 1],
      [{ state: 'upcoming' }, 1],
      [{ assigned_to: 'Dee Admin' }, 3],
      [{ linked: 'contact' }, 3],
      [{ linked: 'company' }, 4],
      [{ search: 'call' }, 3],
      [{ type: 'call', assigned_to: 'Sam Rep' }, 1],
    ];
    for (const [f, n] of cases) {
      const list = await get('/api/v1/activities', { ...f, limit: 2 });
      expect(list.status, JSON.stringify(list.body)).toBe(200);
      expect(list.body.total, JSON.stringify(f)).toBe(n);
      const sum = await get('/api/v1/activities/summary', { ...BOUNDS, ...f });
      expect(sum.body.data.total, JSON.stringify(f)).toBe(n);
    }
  });

  it('refuses malformed instants, unknown state / linked values, and a summary without bounds', async () => {
    for (const [path, q] of [
      ['/api/v1/activities', { occurred_after: 'yesterday' }],
      ['/api/v1/activities', { state: 'late' }],
      ['/api/v1/activities', { linked: 'employee' }],
      ['/api/v1/activities/summary', {}],
      ['/api/v1/activities/summary', { ...BOUNDS, week_to: 'soon' }],
    ] as const) {
      const res = await get(path, q as Record<string, string>);
      expect(res.status, `${path} ${JSON.stringify(q)}`).toBe(400);
    }
  });

  it('at 10,000 activities the summary matches SQL', async () => {
    const big = await setupWorkspace('actfilters-10k');
    try {
      const co = (await pool.query(`INSERT INTO companies (name, tenant_id) VALUES ('Big', $1) RETURNING id`, [big.tenantId])).rows[0].id;
      await pool.query(
        `INSERT INTO activities (subject, type, status, completed_at, scheduled_at, company_id, tenant_id)
         SELECT 'Scale ' || g, CASE WHEN g % 3 = 0 THEN 'meeting' ELSE 'call' END,
                CASE WHEN g % 5 = 0 THEN 'planned' ELSE 'completed' END,
                CASE WHEN g % 5 = 0 THEN NULL ELSE TIMESTAMPTZ '2031-03-01T00:00:00Z' + g * interval '3 minutes' END,
                CASE WHEN g % 5 = 0 THEN TIMESTAMPTZ '2020-01-01T00:00:00Z' + g * interval '1 hour' END,
                $1, $2
           FROM generate_series(1, 10000) g`, [co, big.tenantId]);
      const sum = (await request(app).get('/api/v1/activities/summary').query(BOUNDS).set(auth(big))).body.data;
      const sql = (await pool.query(
        `SELECT count(*)::int AS total,
                count(*) FILTER (WHERE COALESCE(completed_at, scheduled_at, created_at) >= $2 AND COALESCE(completed_at, scheduled_at, created_at) < $3)::int AS today,
                count(*) FILTER (WHERE status = 'planned' AND scheduled_at < NOW())::int AS overdue
           FROM activities WHERE tenant_id = $1`, [big.tenantId, DAY_FROM, DAY_TO])).rows[0];
      expect(sum).toMatchObject(sql);
      expect(sum.total).toBe(10000);
      expect(sum.today).toBeGreaterThan(0);
    } finally {
      await pool.query('DELETE FROM activities WHERE tenant_id = $1', [big.tenantId]);
      await pool.query('DELETE FROM companies WHERE tenant_id = $1', [big.tenantId]);
      await teardownWorkspace(big);
    }
  }, 60_000);
});
