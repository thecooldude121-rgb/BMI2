import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';

/**
 * H1 (2026-10-13). The Add Lead form's WIRE payload (copied from
 * AddLeadPage.handleSubmit, lesson 1) — checked against the row in Postgres,
 * not against the response. A new lead's score is UNKNOWN (NULL): createLead
 * used to write `score ?? 0`, and the form sent a fabricated 50.
 */
describe('POST /leads — the Add Lead payload, end to end', () => {
  let ws: TestWorkspace;
  beforeAll(async () => { ws = await setupWorkspace('addlead'); });
  afterAll(async () => { await teardownWorkspace(ws); });

  it('stores value, currency, notes, priority, city, country and the chosen user; score stays NULL', async () => {
    const res = await request(app).post('/api/v1/leads').set(auth(ws)).send({
      first_name: 'Asha', last_name: 'Iyer', full_name: 'Asha Iyer', email: 'asha@kora.example',
      company: 'Kora', source: 'Website', assigned_to_user_id: Number(ws.userId),
      value: 2200000, currency: 'INR', priority: 'high', city: 'Pune', country: 'India',
      stage: 'new', tags: ['summit'], notes: 'Met at the summit', email_opt_in: true, call_opt_in: true,
    });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    const row = (await pool.query(
      `SELECT score, value::float AS value, currency, notes, priority, city, country, assigned_to_user_id, assigned_to
         FROM leads WHERE id = $1 AND tenant_id = $2`, [res.body.data.id, ws.tenantId])).rows[0];
    expect(row).toMatchObject({
      score: null, value: 2200000, currency: 'INR', notes: 'Met at the summit', priority: 'high',
      city: 'Pune', country: 'India', assigned_to_user_id: Number(ws.userId),
    });
    expect(row.assigned_to).not.toMatch(/^\d+$/); // a name, never a bare id
  });

  it('an explicit score is still stored (unknown is only the DEFAULT)', async () => {
    const res = await request(app).post('/api/v1/leads').set(auth(ws))
      .send({ first_name: 'Ben', email: 'ben@kora.example', company: 'Kora', source: 'Manual', stage: 'new', score: 72 });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    const row = (await pool.query('SELECT score FROM leads WHERE id = $1 AND tenant_id = $2', [res.body.data.id, ws.tenantId])).rows[0];
    expect(row.score).toBe(72);
  });
});
