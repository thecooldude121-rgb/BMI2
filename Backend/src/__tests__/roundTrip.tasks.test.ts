import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';

/**
 * Round-trip regression suite — Tasks.
 *
 * The Overdue/Today/Upcoming BUCKETING logic itself lives client-side in
 * Frontend/src/utils/dates.ts (localDay / dateOnly) — the backend only offers
 * an `overdue=true` filter. Bucketing therefore has TWO separate regression
 * tests, deliberately kept apart:
 *   1. Here: the API returns due_date as an exact "YYYY-MM-DD" string with no
 *      timezone-driven drift, whatever timezone this test runs in.
 *   2. Frontend/src/utils/dates.test.ts: localDay/dateOnly bucket correctly
 *      given that exact string, independent of the API.
 * Faking the *server's* system clock to prove "today" in IST specifically is
 * out of scope for this API-level suite; see the frontend test for that.
 */
describe('Tasks — round trip', () => {
  let ws: TestWorkspace;
  const taskIds: string[] = [];

  beforeAll(async () => { ws = await setupWorkspace('tasks'); });

  afterAll(async () => {
    if (taskIds.length) {
      await pool.query('DELETE FROM tasks WHERE id = ANY($1::varchar[])', [taskIds]);
      const after = await pool.query('SELECT COUNT(*)::int AS n FROM tasks WHERE id = ANY($1::varchar[])', [taskIds]);
      if (after.rows[0].n !== 0) throw new Error(`Cleanup failed: ${after.rows[0].n} test tasks remain`);
    }
    await teardownWorkspace(ws);
  });

  it('create: a real POST creates a task Postgres actually holds, due_date exact with no drift', async () => {
    const dueDate = '2026-11-03';
    const res = await request(app).post('/api/v1/tasks').set(auth(ws)).send({
      title: 'Follow up with prospect', type: 'call', priority: 'high', due_date: dueDate,
    });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    const id = res.body.data.id;
    taskIds.push(id);

    // Both the API response AND a direct re-read must agree on the exact date.
    expect(res.body.data.due_date).toBe(dueDate);
    const row = await pool.query(`SELECT to_char(due_date, 'YYYY-MM-DD') AS d, title, type, priority FROM tasks WHERE id = $1 AND tenant_id = $2`, [id, ws.tenantId]);
    expect(row.rows[0].d).toBe(dueDate);
    expect(row.rows[0].title).toBe('Follow up with prospect');
    expect(row.rows[0].type).toBe('call');
    expect(row.rows[0].priority).toBe('high');
  });

  it('edit: completing a task stamps completed_at; reopening clears it', async () => {
    const create = await request(app).post('/api/v1/tasks').set(auth(ws)).send({ title: 'Send proposal' });
    const id = create.body.data.id;
    taskIds.push(id);

    const complete = await request(app).put(`/api/v1/tasks/${id}`).set(auth(ws)).send({ status: 'completed' });
    expect(complete.status).toBe(200);
    const afterComplete = await pool.query('SELECT status, completed_at FROM tasks WHERE id = $1', [id]);
    expect(afterComplete.rows[0].status).toBe('completed');
    expect(afterComplete.rows[0].completed_at).toBeTruthy();

    const reopen = await request(app).put(`/api/v1/tasks/${id}`).set(auth(ws)).send({ status: 'pending' });
    expect(reopen.status).toBe(200);
    const afterReopen = await pool.query('SELECT status, completed_at FROM tasks WHERE id = $1', [id]);
    expect(afterReopen.rows[0].status).toBe('pending');
    expect(afterReopen.rows[0].completed_at).toBeNull();
  });

  it('negative: an invalid status/priority/type is rejected, row unchanged', async () => {
    const create = await request(app).post('/api/v1/tasks').set(auth(ws)).send({ title: 'Valid task', priority: 'medium' });
    const id = create.body.data.id;
    taskIds.push(id);

    const res = await request(app).put(`/api/v1/tasks/${id}`).set(auth(ws)).send({ priority: 'urgent' }); // tasks has no 'urgent', unlike activities
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/priority must be one of/);
    const row = await pool.query('SELECT priority FROM tasks WHERE id = $1', [id]);
    expect(row.rows[0].priority).toBe('medium');
  });

  it('negative: related_to_id from another workspace is rejected', async () => {
    const wsB = await setupWorkspace('tasks-foreign');
    try {
      const dealB = await request(app).post('/api/v1/deals').set(auth(wsB)).send({ name: 'Other WS Deal', value: 5000 });
      const foreignDealId = dealB.body.data.id;

      const res = await request(app).post('/api/v1/tasks').set(auth(ws)).send({
        title: 'Should not save', related_to_type: 'deal', related_to_id: foreignDealId,
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/related_to_id does not name a deal/);
    } finally {
      await pool.query('DELETE FROM deals WHERE tenant_id = $1', [wsB.tenantId]);
      await teardownWorkspace(wsB);
    }
  });

  it('bucket inputs: server-side overdue=true matches CURRENT_DATE and excludes completed tasks', async () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

    const overdueOpen = await request(app).post('/api/v1/tasks').set(auth(ws)).send({ title: 'Overdue open', due_date: yesterday });
    const overdueDone = await request(app).post('/api/v1/tasks').set(auth(ws)).send({ title: 'Overdue but done', due_date: yesterday });
    const future = await request(app).post('/api/v1/tasks').set(auth(ws)).send({ title: 'Future task', due_date: tomorrow });
    taskIds.push(overdueOpen.body.data.id, overdueDone.body.data.id, future.body.data.id);
    await request(app).put(`/api/v1/tasks/${overdueDone.body.data.id}`).set(auth(ws)).send({ status: 'completed' });

    const res = await request(app).get('/api/v1/tasks?overdue=true').set(auth(ws));
    expect(res.status).toBe(200);
    const ids: string[] = res.body.data.map((t: { id: string }) => t.id);
    expect(ids).toContain(overdueOpen.body.data.id);
    expect(ids).not.toContain(overdueDone.body.data.id); // completed tasks are never overdue
    expect(ids).not.toContain(future.body.data.id);
  });

  /**
   * CREATE-VS-UPDATE ASYMMETRY: createTask rejects a blank title, updateTask
   * wrote it — an explicit null hit tasks.title NOT NULL as a masked 500, an
   * empty string produced a task with no title in the list.
   */
  it.each([[null], [''], ['   ']])('negative: blanking title on update (%j) is rejected, row unchanged', async (bad) => {
    const create = await request(app).post('/api/v1/tasks').set(auth(ws)).send({ title: 'Keep this title' });
    expect(create.status).toBe(201);
    const id = create.body.data.id;
    taskIds.push(id);

    const res = await request(app).put(`/api/v1/tasks/${id}`).set(auth(ws)).send({ title: bad });
    expect(res.status, JSON.stringify(res.body)).toBe(400);
    expect(res.body.message).toMatch(/title cannot be blank/);
    expect(res.body.message).not.toMatch(/Internal Server Error/);

    const row = await pool.query('SELECT title FROM tasks WHERE id = $1', [id]);
    expect(row.rows[0].title).toBe('Keep this title');
  });

  it('tenant isolation: workspace B cannot read or edit workspace A\'s task', async () => {
    const wsB = await setupWorkspace('tasks-b');
    try {
      const create = await request(app).post('/api/v1/tasks').set(auth(ws)).send({ title: 'Isolated task' });
      const id = create.body.data.id;
      taskIds.push(id);

      const readAsB = await request(app).get(`/api/v1/tasks/${id}`).set(auth(wsB));
      expect(readAsB.status).toBe(404);
      const editAsB = await request(app).put(`/api/v1/tasks/${id}`).set(auth(wsB)).send({ title: 'Hijacked' });
      expect(editAsB.status).toBe(404);

      const row = await pool.query('SELECT title FROM tasks WHERE id = $1', [id]);
      expect(row.rows[0].title).toBe('Isolated task');
    } finally {
      await teardownWorkspace(wsB);
    }
  });
});
