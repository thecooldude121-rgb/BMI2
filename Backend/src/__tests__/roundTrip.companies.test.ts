import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';

/**
 * Round-trip regression suite — Accounts (companies).
 *
 * NOTE ON `billingAddress`: Prompt C names "billingAddress" as a field that
 * was once silently discarded on account edits. In the actual schema and
 * controller (companiesController.ts) there is no single `billingAddress`
 * column — it is a FRONTEND grouping (see Frontend/src/utils/accountsApi.ts
 * lines ~95-149) that maps 1:1 onto five real columns: street, city, state,
 * country, and zip_code (billingAddress.postalCode -> zip_code). This suite
 * submits exactly that mapped shape, matching what the real Account edit form
 * actually sends over the wire.
 */
describe('Accounts (companies) — round trip', () => {
  let ws: TestWorkspace;
  const createdIds: string[] = [];

  beforeAll(async () => { ws = await setupWorkspace('companies'); });

  afterAll(async () => {
    if (createdIds.length) {
      await pool.query('DELETE FROM companies WHERE id = ANY($1::varchar[])', [createdIds]);
      const after = await pool.query(
        'SELECT COUNT(*)::int AS n FROM companies WHERE id = ANY($1::varchar[])', [createdIds]);
      if (after.rows[0].n !== 0) throw new Error(`Cleanup failed: ${after.rows[0].n} test companies remain`);
    }
    await teardownWorkspace(ws);
  });

  it('create: a real POST creates a row Postgres actually holds', async () => {
    const name = `Acme Industries ${Date.now()}`;
    const res = await request(app).post('/api/v1/companies').set(auth(ws))
      .send({ name, industry: 'Technology', size: '51-200', website: 'https://acme.example' });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    const id = res.body.data.id;
    createdIds.push(id);

    const row = await pool.query('SELECT * FROM companies WHERE id = $1 AND tenant_id = $2', [id, ws.tenantId]);
    expect(row.rows[0]).toBeTruthy();
    expect(row.rows[0].name).toBe(name);
    expect(row.rows[0].industry).toBe('Technology');
    expect(row.rows[0].size).toBe('51-200');
    expect(row.rows[0].website).toBe('https://acme.example');
  });

  it('negative: create rejects an invalid size, nothing is created', async () => {
    const before = await pool.query('SELECT COUNT(*)::int AS n FROM companies WHERE tenant_id = $1', [ws.tenantId]);
    const res = await request(app).post('/api/v1/companies').set(auth(ws))
      .send({ name: `Bad Size Co ${Date.now()}`, size: 'gigantic' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/size must be one of/);
    const after = await pool.query('SELECT COUNT(*)::int AS n FROM companies WHERE tenant_id = $1', [ws.tenantId]);
    expect(after.rows[0].n).toBe(before.rows[0].n);
  });

  it('edit: billingAddress fields (street/city/state/country/zip_code) actually persist', async () => {
    const create = await request(app).post('/api/v1/companies').set(auth(ws)).send({ name: `Address Co ${Date.now()}` });
    expect(create.status).toBe(201);
    const id = create.body.data.id;
    createdIds.push(id);

    // What the real Account edit form sends, per accountsApi.ts's billingAddress -> column mapping.
    const res = await request(app).put(`/api/v1/companies/${id}`).set(auth(ws)).send({
      street: '221B Baker Street', city: 'Bengaluru', state: 'Karnataka',
      country: 'India', zip_code: '560001',
    });
    expect(res.status, JSON.stringify(res.body)).toBe(200);

    const row = await pool.query(
      'SELECT street, city, state, country, zip_code FROM companies WHERE id = $1', [id]);
    expect(row.rows[0]).toEqual({
      street: '221B Baker Street', city: 'Bengaluru', state: 'Karnataka',
      country: 'India', zip_code: '560001',
    });
  });

  it('no-op edit: saving other fields unchanged does not disturb an existing address', async () => {
    const create = await request(app).post('/api/v1/companies').set(auth(ws)).send({ name: `Stable Address Co ${Date.now()}` });
    const id = create.body.data.id;
    createdIds.push(id);
    await request(app).put(`/api/v1/companies/${id}`).set(auth(ws)).send({
      street: 'MG Road', city: 'Pune', state: 'Maharashtra', country: 'India', zip_code: '411001',
    });

    const noop = await request(app).put(`/api/v1/companies/${id}`).set(auth(ws)).send({ phone: '+91-20-0000000' });
    expect(noop.status).toBe(200);

    const row = await pool.query('SELECT street, city, state, country, zip_code, phone FROM companies WHERE id = $1', [id]);
    expect(row.rows[0].street).toBe('MG Road');
    expect(row.rows[0].city).toBe('Pune');
    expect(row.rows[0].state).toBe('Maharashtra');
    expect(row.rows[0].zip_code).toBe('411001');
    expect(row.rows[0].phone).toBe('+91-20-0000000');
  });

  /**
   * FLAGGED, NOT ASSUMED: read directly from companiesController.ts, `updateCompany`
   * applies NO validation before writing `size` — only `createCompany` checks it
   * against VALID_SIZES. The database DOES enforce `companies_size_check`
   * (migration 000_baseline_schema.sql), so an invalid size on UPDATE should hit
   * a raw Postgres 23514 rather than the clean 400 `createCompany` gives.
   *
   * This test asserts the CORRECT behavior (a clean 400, row unchanged) per
   * Prompt C's instruction not to write tests against known-wrong behavior.
   * If this fails, it is very likely to fail with a 500 instead of 400 — that
   * is a real bug (inconsistent validation between create and update), not a
   * flaw in the test. Report it; do not loosen this assertion to match a 500.
   */
  it('negative (predicted from source, needs live confirmation): update rejects an invalid size cleanly, row unchanged', async () => {
    const create = await request(app).post('/api/v1/companies').set(auth(ws))
      .send({ name: `Update Size Co ${Date.now()}`, size: '11-50' });
    const id = create.body.data.id;
    createdIds.push(id);

    const res = await request(app).put(`/api/v1/companies/${id}`).set(auth(ws)).send({ size: 'gigantic' });
    expect(res.status, JSON.stringify(res.body)).toBe(400);
    expect(res.body.message).toMatch(/size must be one of/);

    const row = await pool.query('SELECT size FROM companies WHERE id = $1', [id]);
    expect(row.rows[0].size).toBe('11-50'); // unchanged
  });

  it('tenant isolation: workspace B cannot read or edit workspace A\'s account', async () => {
    const wsB = await setupWorkspace('companies-b');
    try {
      const create = await request(app).post('/api/v1/companies').set(auth(ws)).send({ name: `Isolated Co ${Date.now()}` });
      const id = create.body.data.id;
      createdIds.push(id);

      const readAsB = await request(app).get(`/api/v1/companies/${id}`).set(auth(wsB));
      expect(readAsB.status).toBe(404);

      const editAsB = await request(app).put(`/api/v1/companies/${id}`).set(auth(wsB)).send({ name: 'Hijacked Co' });
      expect(editAsB.status).toBe(404);

      const row = await pool.query('SELECT name FROM companies WHERE id = $1', [id]);
      expect(row.rows[0].name).toMatch(/^Isolated Co/);
    } finally {
      await teardownWorkspace(wsB);
    }
  });
});
