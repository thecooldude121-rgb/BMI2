import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';

/**
 * Step 4 — data integrity (migration 060 + code). Approved 2026-10-03.
 *   - deals.company_id is a COMPOSITE reference: the DATABASE refuses a
 *     company from another workspace, not just the controller.
 *   - leads.assigned_to_user_id is dual-written with the owner name.
 *   - conversion writes the new deal's first stage-history row.
 */
describe('Step 4 integrity — round trip', () => {
  let ws: TestWorkspace;
  let other: TestWorkspace;

  beforeAll(async () => {
    ws = await setupWorkspace('step4');
    other = await setupWorkspace('step4-other');
  });
  afterAll(async () => { await teardownWorkspace(ws); await teardownWorkspace(other); });

  const uniq = () => `${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
  const userName = async (w: TestWorkspace) => {
    const r = await pool.query('SELECT first_name, last_name FROM users WHERE id = $1', [w.userId]);
    return `${r.rows[0].first_name} ${r.rows[0].last_name}`;
  };

  // ── Composite company reference ─────────────────────────────────────────

  it('the DATABASE refuses a deal pointing at another workspace\'s company — even bypassing the API', async () => {
    const theirs = await request(app).post('/api/v1/companies').set(auth(other)).send({ name: `Their Co ${uniq()}` });
    const deal = await request(app).post('/api/v1/deals').set(auth(ws)).send({ name: `D ${uniq()}`, value: 10 });
    expect(theirs.status).toBe(201);
    expect(deal.status, JSON.stringify(deal.body)).toBe(201);

    // A hand-typed UPDATE — the path a controller check cannot cover.
    await expect(
      pool.query('UPDATE deals SET company_id = $1 WHERE id = $2', [theirs.body.data.id, deal.body.data.id]),
    ).rejects.toMatchObject({ code: '23503' });   // foreign_key_violation
    const row = await pool.query('SELECT company_id FROM deals WHERE id = $1', [deal.body.data.id]);
    expect(row.rows[0].company_id).toBeNull();
  });

  it('…while a same-workspace company is accepted, and deleting it clears only company_id', async () => {
    const mine = await request(app).post('/api/v1/companies').set(auth(ws)).send({ name: `My Co ${uniq()}` });
    const deal = await request(app).post('/api/v1/deals').set(auth(ws))
      .send({ name: `D ${uniq()}`, value: 10, company_id: mine.body.data.id });
    expect(deal.status, JSON.stringify(deal.body)).toBe(201);
    await pool.query('DELETE FROM companies WHERE id = $1', [mine.body.data.id]);
    const row = await pool.query('SELECT company_id, tenant_id FROM deals WHERE id = $1', [deal.body.data.id]);
    expect(row.rows[0]).toEqual({ company_id: null, tenant_id: ws.tenantId });   // tenant_id NOT nulled with it
  });

  // ── Lead owner dual-write ───────────────────────────────────────────────

  it('a lead created with an owner NAME that matches a user stores that user\'s id too', async () => {
    const name = await userName(ws);
    const res = await request(app).post('/api/v1/leads').set(auth(ws))
      .send({ first_name: 'Own', email: `own.${uniq()}@example.com`, assigned_to: name });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    const row = await pool.query('SELECT assigned_to, assigned_to_user_id FROM leads WHERE id = $1', [res.body.data.id]);
    expect(row.rows[0]).toEqual({ assigned_to: name, assigned_to_user_id: ws.userId });
  });

  it('an owner name that matches nobody stores NULL for the id — unresolved, never guessed', async () => {
    const res = await request(app).post('/api/v1/leads').set(auth(ws))
      .send({ first_name: 'Ghost', email: `ghost.${uniq()}@example.com`, assigned_to: 'John Smith' });
    expect(res.status).toBe(201);
    const row = await pool.query('SELECT assigned_to_user_id FROM leads WHERE id = $1', [res.body.data.id]);
    expect(row.rows[0].assigned_to_user_id).toBeNull();
  });

  it('an explicit owner id from ANOTHER workspace is a 400 naming the field, and nothing is written', async () => {
    const before = await pool.query('SELECT COUNT(*)::int AS n FROM leads WHERE tenant_id = $1', [ws.tenantId]);
    const res = await request(app).post('/api/v1/leads').set(auth(ws))
      .send({ first_name: 'X', email: `x.${uniq()}@example.com`, assigned_to_user_id: other.userId });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('assigned_to_user_id does not name a user in this workspace');
    const after = await pool.query('SELECT COUNT(*)::int AS n FROM leads WHERE tenant_id = $1', [ws.tenantId]);
    expect(after.rows[0].n).toBe(before.rows[0].n);
  });

  it('changing the owner name on update re-resolves the id, so name and id never disagree', async () => {
    const created = await request(app).post('/api/v1/leads').set(auth(ws))
      .send({ first_name: 'Move', email: `move.${uniq()}@example.com`, assigned_to: await userName(ws) });
    const id = created.body.data.id;
    const upd = await request(app).put(`/api/v1/leads/${id}`).set(auth(ws)).send({ assigned_to: 'Nobody Here' });
    expect(upd.status, JSON.stringify(upd.body)).toBe(200);
    const row = await pool.query('SELECT assigned_to, assigned_to_user_id FROM leads WHERE id = $1', [id]);
    expect(row.rows[0]).toEqual({ assigned_to: 'Nobody Here', assigned_to_user_id: null });
  });

  // ── Conversion writes the deal's first history row ──────────────────────

  it('a deal created by conversion gets its "created" stage-history row', async () => {
    const lead = await request(app).post('/api/v1/leads').set(auth(ws))
      .send({ first_name: 'Conv', last_name: 'Hist', email: `convh.${uniq()}@example.com`, company: 'Contoso' });
    const id = lead.body.data.id;
    await request(app).post(`/api/v1/leads/${id}/calls`).set(auth(ws)).send({});
    await request(app).post(`/api/v1/leads/${id}/stage-transition`).set(auth(ws)).send({ to_stage: 'qualified' });
    const res = await request(app).post(`/api/v1/leads/${id}/convert`).set(auth(ws))
      .send({ contact: { mode: 'create' }, company: { mode: 'none' }, deal: { name: 'Conv deal', value: 5 } });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    const h = await pool.query(
      'SELECT from_stage, reason_code, tenant_id FROM deal_stage_history WHERE deal_id = $1', [res.body.data.deal.id]);
    expect(h.rows).toEqual([{ from_stage: null, reason_code: 'created', tenant_id: ws.tenantId }]);
  });
});
