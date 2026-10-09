import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';

/**
 * Group A item 3. The Lead detail score is recalculated from the lead's stored
 * fields, and the panel says when those inputs last changed (leads.updated_at).
 * last_contact is one of the inputs, so recording a contact must move
 * updated_at — and a touch that does NOT move last_contact must not.
 */
describe('score inputs: recording a contact moves updated_at only when last_contact moves', () => {
  let ws: TestWorkspace;
  beforeAll(async () => { ws = await setupWorkspace('scoreinputs'); });
  afterAll(async () => { await teardownWorkspace(ws); });

  const row = async (id: number) =>
    (await pool.query('SELECT last_contact, updated_at FROM leads WHERE id = $1', [id])).rows[0];

  it('first contact sets last_contact AND bumps updated_at; a same-day repeat changes neither', async () => {
    const id = (await request(app).post('/api/v1/leads').set(auth(ws)).send({ first_name: 'S', email: `s.${Date.now()}@scoreinputs.example` })).body.data.id;
    await pool.query(`UPDATE leads SET updated_at = now() - interval '3 days' WHERE id = $1`, [id]);
    const before = await row(id);

    const call = await request(app).post(`/api/v1/leads/${id}/calls`).set(auth(ws)).send({ outcome: 'connected' });
    expect(call.status, JSON.stringify(call.body)).toBeLessThan(300);
    const after = await row(id);
    expect(after.last_contact).not.toBeNull();
    expect(new Date(after.updated_at).getTime()).toBeGreaterThan(new Date(before.updated_at).getTime());

    await pool.query(`UPDATE leads SET updated_at = now() - interval '1 day' WHERE id = $1`, [id]);
    const pinned = await row(id);
    await request(app).post(`/api/v1/leads/${id}/calls`).set(auth(ws)).send({ outcome: 'connected' });
    const again = await row(id);
    expect(again.last_contact).toBe(after.last_contact);
    expect(new Date(again.updated_at).getTime()).toBe(new Date(pinned.updated_at).getTime());
  });

  it('an older touch never moves last_contact backwards (or updated_at)', async () => {
    const id = (await request(app).post('/api/v1/leads').set(auth(ws)).send({ first_name: 'T', email: `t.${Date.now()}@scoreinputs.example` })).body.data.id;
    await request(app).post(`/api/v1/leads/${id}/calls`).set(auth(ws)).send({ outcome: 'connected' });
    await pool.query(`UPDATE leads SET updated_at = now() - interval '1 day' WHERE id = $1`, [id]);
    const before = await row(id);
    await request(app).post(`/api/v1/leads/${id}/activities`).set(auth(ws))
      .send({ subject: 'Old call', type: 'call', status: 'completed', completed_at: '2020-01-01T10:00:00Z' });
    const after = await row(id);
    expect(after.last_contact).toBe(before.last_contact);
    expect(new Date(after.updated_at).getTime()).toBe(new Date(before.updated_at).getTime());
  });
});
