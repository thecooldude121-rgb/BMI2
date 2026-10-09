import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';

/**
 * Engagement counts (scoring fix, 2026-10-10): calls, meetings and emails sent
 * are COUNTED from what was logged — through both the composer's /activities
 * and the per-type /calls | /emails | /meetings endpoints — instead of being
 * hardcoded to 0 in the browser. Opens, clicks and page views have no source
 * and are not served at all.
 */
describe('lead engagement counts come from logged activity', () => {
  let ws: TestWorkspace;
  let other: TestWorkspace;
  beforeAll(async () => { ws = await setupWorkspace('engage'); other = await setupWorkspace('engage-other'); });
  afterAll(async () => { await teardownWorkspace(ws); await teardownWorkspace(other); });

  const newLead = async () =>
    (await request(app).post('/api/v1/leads').set(auth(ws)).send({ first_name: 'E', email: `e.${Date.now()}.${Math.random().toString(36).slice(2, 6)}@engage.example` })).body.data.id as number;
  const counts = async (id: number) => {
    const d = (await request(app).get(`/api/v1/leads/${id}`).set(auth(ws))).body.data;
    return { calls: d.call_count, meetings: d.meeting_count, sent: d.email_sent_count };
  };
  const activity = (id: number, body: Record<string, unknown>) =>
    request(app).post(`/api/v1/leads/${id}/activities`).set(auth(ws)).send({ subject: 'x', ...body });

  it('a lead with nothing logged is a REAL zero from the server', async () => {
    expect(await counts(await newLead())).toEqual({ calls: 0, meetings: 0, sent: 0 });
  });

  it('composer activities: only completed calls / meetings and non-inbound completed emails count', async () => {
    const id = await newLead();
    await activity(id, { type: 'call', status: 'completed' });
    await activity(id, { type: 'call', status: 'planned' });
    await activity(id, { type: 'meeting', status: 'completed' });
    await activity(id, { type: 'meeting', status: 'planned' });
    await activity(id, { type: 'email', status: 'completed', direction: 'outbound' });
    await activity(id, { type: 'email', status: 'completed' });
    await activity(id, { type: 'email', status: 'completed', direction: 'inbound' });
    await activity(id, { type: 'note', status: 'completed' });
    expect(await counts(id)).toEqual({ calls: 1, meetings: 1, sent: 2 });
  });

  it('the per-type endpoints count too: any logged call, a sent outbound email, a COMPLETED meeting', async () => {
    const id = await newLead();
    expect((await request(app).post(`/api/v1/leads/${id}/calls`).set(auth(ws)).send({ outcome: 'no-answer' })).status).toBe(201);
    const send = (status: string) => request(app).post(`/api/v1/leads/${id}/emails`).set(auth(ws))
      .send({ from_email: 'rep@engage.example', to_emails: ['e@engage.example'], subject: 'Hi', status });
    expect((await send('sent')).status).toBe(201);
    await send('draft');
    await request(app).post(`/api/v1/leads/${id}/meetings`).set(auth(ws)).send({ title: 'Demo', scheduled_at: '2026-12-01T10:00:00Z' });
    await pool.query(
      `INSERT INTO lead_meetings (lead_id, title, scheduled_at, status, created_by, tenant_id) VALUES ($1, 'Done', now(), 'completed', '', $2)`,
      [id, ws.tenantId]);
    expect(await counts(id)).toEqual({ calls: 1, meetings: 1, sent: 1 });
  });

  it('the list serves the same counts as the detail, and nothing for opens / clicks / page views', async () => {
    const id = await newLead();
    await activity(id, { type: 'call', status: 'completed' });
    const list = await request(app).get('/api/v1/leads').query({ limit: 100 }).set(auth(ws));
    const row = list.body.data.find((r: { id: number }) => r.id === id);
    expect(row).toMatchObject({ call_count: 1, meeting_count: 0, email_sent_count: 0 });
    for (const k of ['email_opens_count', 'email_clicks_count', 'page_views_count']) expect(row).not.toHaveProperty(k);
  });

  it('write responses (create, update, stage move) carry the counts too — the client never has to guess', async () => {
    const created = await request(app).post('/api/v1/leads').set(auth(ws)).send({ first_name: 'W', email: `w.${Date.now()}@engage.example`, company: 'Kora', phone: '+91 1' });
    expect(created.body.data).toMatchObject({ call_count: 0, meeting_count: 0, email_sent_count: 0 });
    const id = created.body.data.id;
    await activity(id, { type: 'call', status: 'completed' });
    const put = await request(app).put(`/api/v1/leads/${id}`).set(auth(ws)).send({ company: 'Kora Ltd' });
    expect(put.body.data.call_count).toBe(1);
    const mv = await request(app).post(`/api/v1/leads/${id}/stage-transition`).set(auth(ws)).send({ to_stage: 'qualified' });
    expect(mv.status, JSON.stringify(mv.body)).toBe(200);
    expect(mv.body.data.call_count).toBe(1);
  });

  it('rows from ANOTHER workspace naming this lead id are never counted', async () => {
    const id = await newLead();
    await pool.query(`INSERT INTO lead_calls (lead_id, direction, created_by, tenant_id) VALUES ($1, 'outbound', '', $2)`, [id, other.tenantId]);
    await pool.query(`INSERT INTO activities (lead_id, subject, type, status, created_by, assigned_to, tenant_id) VALUES ($1, 'x', 'call', 'completed', '', '', $2)`, [id, other.tenantId]);
    expect((await counts(id)).calls).toBe(0);
  });
});
