import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';

/**
 * Group A item 4, slice 4a — the Tasks page and the Calendar on the server.
 *
 * The Tasks page loaded 500 tasks once and counted every tab and tile from
 * them; the Calendar loaded the same 500 regardless of the month on screen.
 * Now: GET /tasks?bucket= lists one tab, GET /tasks/summary counts every tab
 * under the same filters, GET /tasks/by-day fills the visible weeks.
 *
 * "Today" is the VIEWER'S day, sent as ?today= (decided by Venkat 2026-10-11),
 * so these tests pick dates nowhere near the real clock: a bucket that quietly
 * used CURRENT_DATE would put every row in the wrong bucket here.
 */
describe('task buckets, summary and calendar days', () => {
  let ws: TestWorkspace;
  let other: TestWorkspace;
  const TODAY = '2031-03-15';
  const get = (path: string, q: Record<string, string | number> = {}) =>
    request(app).get(path).query(q).set(auth(ws));

  // [title, due, status, assigned_to, related_to_type]
  const rows: [string, string | null, string, string, string | null][] = [
    ['Overdue mine', '2031-03-10', 'pending', 'Round Tripper', null],
    ['Overdue other', '2031-03-14', 'in-progress', 'Someone Else', null],
    ['Overdue done', '2031-03-01', 'completed', 'Round Tripper', null],
    ['Today mine', TODAY, 'pending', 'Round Tripper', null],
    ['Today done', TODAY, 'completed', 'Someone Else', null],
    ['Upcoming other', '2031-03-20', 'pending', 'Someone Else', null],
    ['Upcoming mine', '2031-04-02', 'in-progress', 'Round Tripper', null],
    ['Undated open', null, 'pending', 'Someone Else', null],
    ['Undated done', null, 'completed', 'Someone Else', null],
  ];

  beforeAll(async () => {
    ws = await setupWorkspace('taskbuckets');
    other = await setupWorkspace('taskbuckets-other');
    for (const [title, due, status, who] of rows) {
      await pool.query(
        `INSERT INTO tasks (title, due_date, status, assigned_to, tenant_id) VALUES ($1, $2, $3, $4, $5)`,
        [title, due, status, who, ws.tenantId],
      );
    }
    // Another workspace's tasks on the same days, assigned to the same NAME:
    // none may be counted, listed or drawn.
    await pool.query(
      `INSERT INTO tasks (title, due_date, status, assigned_to, tenant_id)
       SELECT 'Foreign ' || g, DATE '2031-03-15' + (g % 5) - 2, 'pending', 'Round Tripper', $1 FROM generate_series(1, 20) g`,
      [other.tenantId],
    );
  });
  afterAll(async () => {
    for (const t of [ws, other]) {
      await pool.query('DELETE FROM meetings WHERE tenant_id = $1', [t.tenantId]);
      await pool.query('DELETE FROM tasks WHERE tenant_id = $1', [t.tenantId]);
      await teardownWorkspace(t);
    }
  });

  it('summary counts every bucket from the viewer\'s day, never another workspace', async () => {
    const res = await get('/api/v1/tasks/summary', { today: TODAY });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.data).toEqual({
      as_of: TODAY, all: 9, mine: 4, open: 6, overdue: 2, today: 1, upcoming: 2, no_date: 1, completed: 3,
    });
    const d = res.body.data;
    expect(d.overdue + d.today + d.upcoming + d.no_date).toBe(d.open);
  });

  it('moving the viewer\'s day moves the rows: the server clock is never consulted', async () => {
    const tomorrow = (await get('/api/v1/tasks', { bucket: 'overdue', today: '2031-03-16' })).body;
    expect(tomorrow.data.map((t: { title: string }) => t.title).sort())
      .toEqual(['Overdue mine', 'Overdue other', 'Today mine']);
    const early = (await get('/api/v1/tasks', { bucket: 'upcoming', today: '2031-03-09' })).body;
    expect(early.total).toBe(5); // everything open and dated is still ahead
  });

  it('each tab\'s list total equals the summary count, under the same filters', async () => {
    for (const filter of [{}, { search: 'mine' }, { priority: 'medium' }]) {
      const sum = (await get('/api/v1/tasks/summary', { today: TODAY, ...filter })).body.data;
      for (const b of ['all', 'mine', 'open', 'overdue', 'today', 'upcoming', 'no_date', 'completed']) {
        const list = await get('/api/v1/tasks', { bucket: b, today: TODAY, limit: 5, ...filter });
        expect(list.status, `${b} ${JSON.stringify(list.body)}`).toBe(200);
        expect(list.body.total, `${b} under ${JSON.stringify(filter)}`).toBe(sum[b]);
      }
    }
  });

  it('"mine" is the token\'s user, and cannot be pointed at someone else', async () => {
    const res = await get('/api/v1/tasks', { bucket: 'mine', assigned_to: 'Someone Else' });
    expect(res.body.total).toBe(0); // the filter narrows mine, it does not replace it
    const mine = await get('/api/v1/tasks', { bucket: 'mine' });
    expect(mine.body.data.every((t: { assigned_to: string }) => t.assigned_to === 'Round Tripper')).toBe(true);
    expect(mine.body.total).toBe(4);
  });

  it('refuses a day-based bucket or a summary without a real ?today=', async () => {
    for (const q of [
      ['/api/v1/tasks/summary', {}],
      ['/api/v1/tasks/summary', { today: '15/03/2031' }],
      ['/api/v1/tasks/summary', { today: '2031-02-30' }],
      ['/api/v1/tasks', { bucket: 'overdue' }],
      ['/api/v1/tasks', { bucket: 'today', today: 'tomorrow' }],
      ['/api/v1/tasks', { bucket: 'later', today: TODAY }],
      ['/api/v1/tasks', { due_after: 'soon' }],
    ] as const) {
      const res = await get(q[0], q[1] as Record<string, string>);
      expect(res.status, `${q[0]} ${JSON.stringify(q[1])}`).toBe(400);
    }
    // Buckets that do not depend on the day need no ?today=.
    expect((await get('/api/v1/tasks', { bucket: 'completed' })).body.total).toBe(3);
  });

  it('related_to_type=none lists only tasks linked to no record', async () => {
    const res = await get('/api/v1/tasks', { related_to_type: 'none' });
    expect(res.body.total).toBe(9);
  });

  it('by-day: real per-day counts, open counts and at most 3 chips per day', async () => {
    // Five more tasks on TODAY so the day overflows its chips.
    await pool.query(
      `INSERT INTO tasks (title, due_date, status, tenant_id)
       SELECT 'Extra ' || g, $2::date, 'pending', $1 FROM generate_series(1, 5) g`,
      [ws.tenantId, TODAY],
    );
    try {
      const res = await get('/api/v1/tasks/by-day', { from: '2031-03-01', to: '2031-03-31' });
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      const days = res.body.data.days as { day: string; total: number; open: number; tasks: { title: string; status: string }[] }[];
      const sql = await pool.query(
        `SELECT to_char(due_date, 'YYYY-MM-DD') AS day, count(*)::int AS total,
                count(*) FILTER (WHERE status <> 'completed')::int AS open
           FROM tasks WHERE tenant_id = $1 AND due_date BETWEEN '2031-03-01' AND '2031-03-31'
          GROUP BY 1 ORDER BY 1`, [ws.tenantId]);
      expect(days.map(d => ({ day: d.day, total: d.total, open: d.open }))).toEqual(sql.rows);
      expect(res.body.data.total).toBe(sql.rows.reduce((n: number, r: { total: number }) => n + r.total, 0));
      const today = days.find(d => d.day === TODAY)!;
      expect(today.total).toBe(7);
      expect(today.tasks).toHaveLength(3);
      // Open before completed, so a crowded day never hides its open work behind done work.
      expect(today.tasks.every(t => t.status !== 'completed')).toBe(true);
      // Nothing outside the range (2031-04-02) and nothing undated.
      expect(days.some(d => d.day < '2031-03-01' || d.day > '2031-03-31')).toBe(false);
    } finally {
      await pool.query(`DELETE FROM tasks WHERE tenant_id = $1 AND title LIKE 'Extra %'`, [ws.tenantId]);
    }
  });

  it('by-day refuses a reversed, oversized or malformed range', async () => {
    expect((await get('/api/v1/tasks/by-day', { from: '2031-03-31', to: '2031-03-01' })).status).toBe(400);
    expect((await get('/api/v1/tasks/by-day', { from: '2031-01-01', to: '2031-03-31' })).status).toBe(400);
    expect((await get('/api/v1/tasks/by-day', { from: '2031-03-01' })).status).toBe(400);
    // 42 days — the six-week grid — is allowed.
    expect((await get('/api/v1/tasks/by-day', { from: '2031-02-23', to: '2031-04-05' })).status).toBe(200);
  });

  it('meetings: a time window, ascending order, a real total, 400 on garbage', async () => {
    await pool.query(
      `INSERT INTO meetings (title, date, tenant_id) VALUES
         ('In window B', '2031-03-20T10:00:00Z', $1), ('In window A', '2031-03-05T09:00:00Z', $1),
         ('Before', '2031-02-20T10:00:00Z', $1), ('At the end bound', '2031-04-01T00:00:00Z', $1)`,
      [ws.tenantId],
    );
    await pool.query(`INSERT INTO meetings (title, date, tenant_id) VALUES ('Foreign', '2031-03-10T10:00:00Z', $1)`, [other.tenantId]);
    const res = await get('/api/v1/meetings', {
      date_from: '2031-03-01T00:00:00Z', date_to: '2031-04-01T00:00:00Z', order: 'asc', limit: 1,
    });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.data.map((m: { title: string }) => m.title)).toEqual(['In window A']);
    expect((await get('/api/v1/meetings', { date_from: 'next week' })).status).toBe(400);
  });

  it('at 10,000 tasks: summary and calendar days match SQL; a cell carries 3 chips, not its whole day', async () => {
    const big = await setupWorkspace('taskbuckets-10k');
    try {
      await pool.query(
        `INSERT INTO tasks (title, due_date, status, assigned_to, tenant_id)
         SELECT 'Scale ' || g, DATE '2031-03-01' + (g % 40),
                CASE WHEN g % 7 = 0 THEN 'completed' ELSE 'pending' END,
                CASE WHEN g % 3 = 0 THEN 'Round Tripper' ELSE 'Other' END, $1
           FROM generate_series(1, 10000) g`, [big.tenantId]);
      const sum = (await request(app).get('/api/v1/tasks/summary').query({ today: TODAY }).set(auth(big))).body.data;
      const sql = (await pool.query(
        `SELECT count(*)::int AS all,
                count(*) FILTER (WHERE status <> 'completed' AND due_date < $2)::int AS overdue,
                count(*) FILTER (WHERE status <> 'completed' AND due_date = $2)::int AS today,
                count(*) FILTER (WHERE status <> 'completed' AND due_date > $2)::int AS upcoming,
                count(*) FILTER (WHERE assigned_to = 'Round Tripper')::int AS mine
           FROM tasks WHERE tenant_id = $1`, [big.tenantId, TODAY])).rows[0];
      expect(sum).toMatchObject(sql);
      expect(sum.all).toBe(10000);
      const days = (await request(app).get('/api/v1/tasks/by-day').query({ from: '2031-03-01', to: '2031-04-11' }).set(auth(big))).body.data;
      expect(days.total).toBe(10000);
      expect(days.days).toHaveLength(40);
      expect(days.days.every((d: { tasks: unknown[]; total: number }) => d.tasks.length === 3 && d.total === 250)).toBe(true);
    } finally {
      await pool.query('DELETE FROM tasks WHERE tenant_id = $1', [big.tenantId]);
      await teardownWorkspace(big);
    }
  }, 60_000);
});
