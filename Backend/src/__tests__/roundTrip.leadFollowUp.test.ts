import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';

/**
 * Lead follow-ups (Group B item 11): a follow-up is a `tasks` row; the lead
 * exposes its earliest OPEN one, and "overdue" is one shared predicate used by
 * the summary count and the list filter alike.
 */
describe('Lead follow-ups (tasks of type follow-up)', () => {
  let ws: TestWorkspace;
  let other: TestWorkspace;
  let leadId: number;
  let lateId: number;
  let dates: { yesterday: string; tomorrow: string; nextWeek: string };

  const sqlDate = async (expr: string) =>
    (await pool.query(`SELECT to_char(${expr}, 'YYYY-MM-DD') AS d`)).rows[0].d as string;

  const followUp = (lead: number, due: string, extra: Record<string, unknown> = {}) =>
    request(app).post('/api/v1/tasks').set(auth(ws)).send({
      title: 'Follow up', type: 'follow-up', related_to_type: 'lead', related_to_id: String(lead), due_date: due, ...extra,
    });

  beforeAll(async () => {
    ws = await setupWorkspace('followup');
    other = await setupWorkspace('followup-other');
    dates = {
      yesterday: await sqlDate('CURRENT_DATE - 1'),
      tomorrow: await sqlDate('CURRENT_DATE + 1'),
      nextWeek: await sqlDate('CURRENT_DATE + 7'),
    };
    const mk = async (email: string) =>
      (await request(app).post('/api/v1/leads').set(auth(ws)).send({ first_name: 'F', email })).body.data.id as number;
    leadId = await mk('fu1@followup.example');
    lateId = await mk('fu2@followup.example');
  });
  afterAll(async () => {
    for (const w of [ws, other]) { await teardownWorkspace(w); }
  });

  const lead = async (id: number) => (await request(app).get(`/api/v1/leads/${id}`).set(auth(ws))).body.data;

  it('a lead with no follow-up says so (null), nothing invented', async () => {
    const l = await lead(leadId);
    expect(l.next_follow_up_date).toBeNull();
    expect(l.next_follow_up_task_id).toBeNull();
  });

  it('creating a follow-up task makes it the lead\'s next follow-up — the exact stored date, no day shift', async () => {
    const res = await followUp(leadId, dates.nextWeek);
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    const l = await lead(leadId);
    expect(l.next_follow_up_date).toBe(dates.nextWeek);
    expect(l.next_follow_up_task_id).toBe(res.body.data.id);
  });

  it('the EARLIEST open follow-up wins; completed and non-follow-up tasks are ignored', async () => {
    const earlier = await followUp(leadId, dates.tomorrow);
    await followUp(leadId, dates.yesterday, { status: 'completed' });
    await followUp(leadId, dates.yesterday, { type: 'call' });
    const l = await lead(leadId);
    expect(l.next_follow_up_date).toBe(dates.tomorrow);
    expect(l.next_follow_up_task_id).toBe(earlier.body.data.id);
  });

  it('completing it moves the lead on to the next open one', async () => {
    const l = await lead(leadId);
    const done = await request(app).put(`/api/v1/tasks/${l.next_follow_up_task_id}`).set(auth(ws)).send({ status: 'completed' });
    expect(done.status, JSON.stringify(done.body)).toBe(200);
    expect((await lead(leadId)).next_follow_up_date).toBe(dates.nextWeek);
  });

  it('overdue: the summary counts it and the list filter returns exactly it', async () => {
    await followUp(lateId, dates.yesterday);
    const summary = await request(app).get('/api/v1/leads/summary').set(auth(ws));
    expect(summary.body.data.overdue_follow_ups).toBe(1);
    const list = await request(app).get('/api/v1/leads').query({ insight: 'overdue', limit: 25 }).set(auth(ws));
    expect(list.status, JSON.stringify(list.body)).toBe(200);
    expect(list.body.data.map((r: { id: number }) => r.id)).toEqual([lateId]);
    expect(list.body.total).toBe(1);
    expect(list.body.data[0].next_follow_up_date).toBe(dates.yesterday);
  });

  it('a task in ANOTHER workspace pointing at this lead id is never counted', async () => {
    await pool.query(
      `INSERT INTO tasks (title, type, status, related_to_type, related_to_id, due_date, tenant_id)
       VALUES ('Theirs', 'follow-up', 'pending', 'lead', $1, CURRENT_DATE - 3, $2)`, [String(leadId), other.tenantId]);
    const l = await lead(leadId);
    expect(l.next_follow_up_date).toBe(dates.nextWeek);
    const summary = await request(app).get('/api/v1/leads/summary').set(auth(ws));
    expect(summary.body.data.overdue_follow_ups).toBe(1);
  });

  it('the tasks API refuses a follow-up for a lead outside the workspace (400)', async () => {
    const res = await request(app).post('/api/v1/tasks').set(auth(other)).send({
      title: 'x', type: 'follow-up', related_to_type: 'lead', related_to_id: String(leadId), due_date: dates.tomorrow,
    });
    expect(res.status).toBe(400);
  });
});
