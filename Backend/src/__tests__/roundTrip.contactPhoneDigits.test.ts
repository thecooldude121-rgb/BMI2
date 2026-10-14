import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';

/**
 * GET /contacts?phone_digits= — slice 6b. The contact duplicate check used to
 * scan 500 preloaded contacts in the browser; it now asks the server, and a
 * same-phone match needs a digits-only comparison the text search cannot do.
 */
describe('GET /contacts?phone_digits=', () => {
  let ws: TestWorkspace;
  let other: TestWorkspace;
  beforeAll(async () => {
    ws = await setupWorkspace('phonedigits');
    other = await setupWorkspace('phonedigits-other');
    await pool.query(
      `INSERT INTO contacts (first_name, last_name, email, phone, tenant_id) VALUES
         ('Ana', 'Ray', 'ana@x.example', '+91 80-1234 5678', $1),
         ('Bo',  'Lin', 'bo@x.example',  '(080) 1234-5678',  $1),
         ('Cy',  'Ng',  'cy@x.example',  '+91 80 9999 0000', $1),
         ('Other', 'Tenant', 'o@y.example', '+91 80-1234 5678', $2)`,
      [ws.tenantId, other.tenantId],
    );
  });
  afterAll(async () => { await teardownWorkspace(ws); await teardownWorkspace(other); });

  it('matches on digits only, whatever the formatting — and never another workspace', async () => {
    const res = await request(app).get('/api/v1/contacts?phone_digits=918012345678').set(auth(ws));
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.data.map((c: { first_name: string }) => c.first_name)).toEqual(['Ana']);
    expect(res.body.total).toBe(1);
    const local = await request(app).get('/api/v1/contacts?phone_digits=08012345678').set(auth(ws));
    expect(local.body.data.map((c: { first_name: string }) => c.first_name)).toEqual(['Bo']);
  });

  it('refuses anything that is not 7-20 digits (400, never ignored)', async () => {
    for (const bad of ['123', 'abc1234567', '+918012345678']) {
      const res = await request(app).get(`/api/v1/contacts?phone_digits=${encodeURIComponent(bad)}`).set(auth(ws));
      expect(res.status, bad).toBe(400);
    }
  });
});
