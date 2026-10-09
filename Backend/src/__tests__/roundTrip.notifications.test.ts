import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, addUserWithRole, auth, TestWorkspace } from './helpers';

/**
 * Group A item 5 — the internal notifications feed (migration 065). Approved
 * event list (2026-10-10): lead assigned to you, deal assigned to you, stage
 * change on a deal you own, lead you own converted; never about your own
 * action; written in the same transaction as the change. Due/overdue follow-ups
 * on leads you own are read live and are NOT in the unread count.
 */
describe('notifications feed', () => {
  let a: TestWorkspace;      // admin, the actor
  let b: TestWorkspace;      // sales, the owner who should hear about things
  let other: TestWorkspace;  // a different workspace
  let dates: { yesterday: string; today: string; tomorrow: string };

  const mine = async (who: TestWorkspace, type?: string) =>
    (await pool.query(
      `SELECT * FROM notifications WHERE tenant_id = $1 AND user_id = $2 ${type ? 'AND type = $3' : ''} ORDER BY created_at`,
      type ? [who.tenantId, who.userId, type] : [who.tenantId, who.userId])).rows;
  const uniq = () => `${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
  const newLead = (as: TestWorkspace, extra: Record<string, unknown> = {}) =>
    request(app).post('/api/v1/leads').set(auth(as)).send({ first_name: 'Nia', last_name: 'Okafor', email: `n.${uniq()}@example.com`, company: 'Kora', ...extra });
  const newDeal = (as: TestWorkspace, extra: Record<string, unknown> = {}) =>
    request(app).post('/api/v1/deals').set(auth(as)).send({ name: `Deal ${uniq()}`, value: 1000, currency: 'USD', stage: 'prospecting', ...extra });

  beforeAll(async () => {
    a = await setupWorkspace('notif');
    b = await addUserWithRole(a, 'sales');
    other = await setupWorkspace('notif-other');
    const d = async (e: string) => (await pool.query(`SELECT to_char(${e}, 'YYYY-MM-DD') AS d`)).rows[0].d as string;
    dates = { yesterday: await d('CURRENT_DATE - 1'), today: await d('CURRENT_DATE'), tomorrow: await d('CURRENT_DATE + 1') };
    // Atomicity probe: a notification for a record named BOOM fails inside the
    // writer's transaction, so the change it reports must roll back with it.
    await pool.query(`CREATE OR REPLACE FUNCTION rt_notif_boom() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF NEW.entity_name = 'BOOM' THEN RAISE EXCEPTION 'boom'; END IF; RETURN NEW; END $$`);
    await pool.query(`CREATE TRIGGER rt_notif_boom BEFORE INSERT ON notifications FOR EACH ROW EXECUTE FUNCTION rt_notif_boom()`);
    // The other direction: a deal change that fails only AT COMMIT (a deferred
    // check) must not leave its notification behind.
    await pool.query(`CREATE OR REPLACE FUNCTION rt_deal_commit_boom() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF NEW.name = 'COMMIT-BOOM' THEN RAISE EXCEPTION 'commit boom'; END IF; RETURN NEW; END $$`);
    await pool.query(`CREATE CONSTRAINT TRIGGER rt_deal_commit_boom AFTER UPDATE ON deals
      DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION rt_deal_commit_boom()`);
  });
  afterAll(async () => {
    await pool.query('DROP TRIGGER IF EXISTS rt_notif_boom ON notifications');
    await pool.query('DROP TRIGGER IF EXISTS rt_deal_commit_boom ON deals');
    await pool.query('DROP FUNCTION IF EXISTS rt_deal_commit_boom()');
    await pool.query('DROP FUNCTION IF EXISTS rt_notif_boom()');
    await teardownWorkspace(a);
    await teardownWorkspace(other);
  });

  it('lead assigned to you (create and update) — the actor is told nothing; a no-op re-assign adds nothing', async () => {
    const c = await newLead(a, { assigned_to_user_id: b.userId });
    expect(c.status, JSON.stringify(c.body)).toBe(201);
    const rows = await mine(b, 'lead_assigned');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ entity_type: 'lead', entity_id: String(c.body.data.id), entity_name: 'Nia Okafor', actor_user_id: Number(a.userId), read_at: null });
    expect(await mine(a)).toHaveLength(0);

    await request(app).put(`/api/v1/leads/${c.body.data.id}`).set(auth(a)).send({ assigned_to_user_id: b.userId });
    expect(await mine(b, 'lead_assigned')).toHaveLength(1);

    const u = await newLead(a);
    const put = await request(app).put(`/api/v1/leads/${u.body.data.id}`).set(auth(a)).send({ assigned_to_user_id: b.userId });
    expect(put.status, JSON.stringify(put.body)).toBe(200);
    expect(await mine(b, 'lead_assigned')).toHaveLength(2);
  });

  it('assigning something to YOURSELF is never a notification', async () => {
    const before = (await mine(b)).length;
    await newLead(b, { assigned_to_user_id: b.userId });
    await newDeal(b, { assigned_to_user_id: b.userId });
    expect(await mine(b)).toHaveLength(before);
  });

  it('deal assigned to you, then every stage path tells the owner: transition, PUT and bulk', async () => {
    const d = await newDeal(a, { assigned_to_user_id: b.userId });
    expect(d.status, JSON.stringify(d.body)).toBe(201);
    const id = d.body.data.id;
    expect((await mine(b, 'deal_assigned')).map(r => r.entity_id)).toContain(id);

    const t = await request(app).post(`/api/v1/deals/${id}/stage-transition`).set(auth(a)).send({ to_stage: 'qualified' });
    expect(t.status, JSON.stringify(t.body)).toBe(200);
    let stage = (await mine(b, 'deal_stage_changed')).filter(r => r.entity_id === id);
    expect(stage).toHaveLength(1);
    expect(stage[0].detail.from_stage).toBeTruthy();
    expect(stage[0].detail.to_stage).toBeTruthy();
    expect(stage[0].detail.from_stage).not.toBe(stage[0].detail.to_stage);

    const p = await request(app).put(`/api/v1/deals/${id}`).set(auth(a)).send({ stage: 'prospecting' });
    expect(p.status, JSON.stringify(p.body)).toBe(200);
    const bulk = await request(app).post('/api/v1/deals/bulk').set(auth(a)).send({ action: 'stage', deal_ids: [id], payload: { stage: 'qualified' } });
    expect(bulk.status, JSON.stringify(bulk.body)).toBe(200);
    stage = (await mine(b, 'deal_stage_changed')).filter(r => r.entity_id === id);
    expect(stage).toHaveLength(3);
  });

  it('the owner moving their own deal hears nothing', async () => {
    const d = await newDeal(b, { assigned_to_user_id: b.userId });
    const before = (await mine(b)).length;
    await request(app).post(`/api/v1/deals/${d.body.data.id}/stage-transition`).set(auth(b)).send({ to_stage: 'qualified' });
    expect(await mine(b)).toHaveLength(before);
  });

  it('bulk owner change by NAME notifies the resolved new owner', async () => {
    const d = await newDeal(a);
    const r = await request(app).post('/api/v1/deals/bulk').set(auth(a)).send({ action: 'owner', deal_ids: [d.body.data.id], payload: { owner: 'Role sales' } });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect((await mine(b, 'deal_assigned')).map(x => x.entity_id)).toContain(d.body.data.id);
  });

  it('a lead you own converted by someone else tells you — scoped to the owner, nobody else', async () => {
    const c = await newLead(a, { assigned_to_user_id: b.userId, phone: '+91 9' });
    const id = c.body.data.id;
    await request(app).post(`/api/v1/leads/${id}/calls`).set(auth(a)).send({ outcome: 'connected' });
    expect((await request(app).post(`/api/v1/leads/${id}/stage-transition`).set(auth(a)).send({ to_stage: 'qualified' })).status).toBe(200);
    const conv = await request(app).post(`/api/v1/leads/${id}/convert`).set(auth(a)).send({
      contact: { mode: 'create' }, company: { mode: 'create' }, deal: { name: 'Kora — Platform', value: 5000, currency: 'INR' },
    });
    expect(conv.status, JSON.stringify(conv.body)).toBe(201);
    const rows = (await mine(b, 'lead_converted')).filter(r => r.entity_id === String(id));
    expect(rows).toHaveLength(1);
    expect(rows[0].detail.deal_id).toBeTruthy();
    expect(await mine(a, 'lead_converted')).toHaveLength(0);
  });

  it('ATOMIC: if the notification cannot be written, the change it reports is rolled back too', async () => {
    const d = await newDeal(a, { name: 'BOOM' });
    expect(d.status).toBe(201); // no owner yet -> no notification -> no boom
    const put = await request(app).put(`/api/v1/deals/${d.body.data.id}`).set(auth(a)).send({ assigned_to_user_id: b.userId });
    expect(put.status).toBe(500);
    const row = (await pool.query('SELECT assigned_to_user_id FROM deals WHERE id = $1', [d.body.data.id])).rows[0];
    expect(row.assigned_to_user_id).toBeNull();
  });

  it('ATOMIC, other direction: a change that fails at COMMIT leaves no notification behind', async () => {
    const d = await newDeal(a, { name: 'COMMIT-BOOM' });
    expect(d.status).toBe(201);
    const put = await request(app).put(`/api/v1/deals/${d.body.data.id}`).set(auth(a)).send({ assigned_to_user_id: b.userId });
    expect(put.status).toBe(500);
    expect((await pool.query('SELECT assigned_to_user_id FROM deals WHERE id = $1', [d.body.data.id])).rows[0].assigned_to_user_id).toBeNull();
    expect((await mine(b)).filter(r => r.entity_id === d.body.data.id)).toHaveLength(0);
  });

  it('GET /notifications: your own rows, newest first, with counts from the server; unread filter', async () => {
    const res = await request(app).get('/api/v1/notifications').set(auth(b));
    expect(res.status).toBe(200);
    const all = await mine(b);
    expect(res.body.total).toBe(all.length);
    expect(res.body.unread_count).toBe(all.length);
    // Who did it, resolved inside the workspace (the admin fixture is 'Round Tripper').
    expect(res.body.data.every((r: { actor_name: string }) => r.actor_name === 'Round Tripper')).toBe(true);
    const times = res.body.data.map((r: { created_at: string }) => Date.parse(r.created_at));
    expect([...times].sort((x, y) => y - x)).toEqual(times);
    const empty = await request(app).get('/api/v1/notifications').set(auth(a));
    expect(empty.body).toMatchObject({ total: 0, unread_count: 0, data: [] });
  });

  it('mark read: only your own (another person\'s or another workspace\'s id is 404); read-all', async () => {
    const first = (await mine(b))[0];
    expect((await request(app).post(`/api/v1/notifications/${first.id}/read`).set(auth(a))).status).toBe(404);
    expect((await request(app).post(`/api/v1/notifications/${first.id}/read`).set(auth(other))).status).toBe(404);
    expect((await request(app).get('/api/v1/notifications').set(auth(other))).body.total).toBe(0);
    const ok = await request(app).post(`/api/v1/notifications/${first.id}/read`).set(auth(b));
    expect(ok.status).toBe(200);
    const after = await request(app).get('/api/v1/notifications').query({ unread: 'true' }).set(auth(b));
    expect(after.body.unread_count).toBe((await mine(b)).length - 1);
    expect(after.body.data.map((r: { id: string }) => r.id)).not.toContain(first.id);
    const all = await request(app).post('/api/v1/notifications/read-all').set(auth(b));
    expect(all.body.data.updated).toBe((await mine(b)).length - 1);
    expect((await request(app).get('/api/v1/notifications').set(auth(b))).body.unread_count).toBe(0);
  });

  it('GET /notifications/due: follow-ups on leads YOU own, due today or overdue; never in the unread count', async () => {
    const mk = async (owner: TestWorkspace | null, due: string) => {
      const l = await newLead(a, owner ? { assigned_to_user_id: owner.userId } : {});
      await request(app).post('/api/v1/tasks').set(auth(a)).send({
        title: 'Follow up', type: 'follow-up', related_to_type: 'lead', related_to_id: String(l.body.data.id), due_date: due });
      return l.body.data.id;
    };
    const late = await mk(b, dates.yesterday);
    const now = await mk(b, dates.today);
    await mk(b, dates.tomorrow);
    await mk(null, dates.yesterday);
    await mk(a, dates.yesterday);
    const unreadBefore = (await request(app).get('/api/v1/notifications').set(auth(b))).body.unread_count;
    const due = await request(app).get('/api/v1/notifications/due').set(auth(b));
    expect(due.status).toBe(200);
    expect(due.body.data.overdue_count).toBe(1);
    expect(due.body.data.today_count).toBe(1);
    expect(due.body.data.items.map((i: { lead_id: number }) => i.lead_id)).toEqual([late, now]);
    expect(due.body.data.items[0]).toMatchObject({ due: dates.yesterday, overdue: true });
    expect((await request(app).get('/api/v1/notifications').set(auth(b))).body.unread_count).toBe(unreadBefore);
  });
});
