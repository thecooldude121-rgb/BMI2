import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, addUserWithRole, TestWorkspace } from './helpers';
import { INDUSTRIES } from '../utils/industries';

/**
 * Industry vocabulary. Migration 045.
 *
 * WHAT THESE PIN:
 *  1. The vocabulary is SERVED, and the served list is exactly the database
 *     constraint — the two places that must agree are compared here, so a
 *     change to one without the other fails a test instead of a customer.
 *  2. Every writer of companies.industry (create, update, CSV import) validates
 *     with a clean 400 / per-row reason. Without that, the CHECK would surface
 *     as a masked 500 — errorHandler maps no 23514.
 *  3. Case and whitespace are corrected; unknown values are refused, never
 *     coerced to 'Other'.
 *  4. The workspace's OWN industry (tenants.settings.business_industry) uses
 *     the same list and is a separate field from any account's industry.
 */
describe('Industry vocabulary (migration 045)', () => {
  let ws: TestWorkspace;
  let sales: TestWorkspace;
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const create = (body: Record<string, unknown>) =>
    request(app).post('/api/v1/companies').set(auth(ws)).send(body);

  const storedIndustry = async (id: string) =>
    (await pool.query('SELECT industry FROM companies WHERE id = $1 AND tenant_id = $2', [id, ws.tenantId]))
      .rows[0]?.industry;

  beforeAll(async () => {
    ws = await setupWorkspace('industries');
    sales = await addUserWithRole(ws, 'sales');
  });

  afterAll(async () => {
    await teardownWorkspace(ws);
    const left = await pool.query('SELECT COUNT(*)::int AS n FROM companies WHERE tenant_id = $1', [ws.tenantId]);
    if (left.rows[0].n !== 0) throw new Error(`Cleanup failed: ${left.rows[0].n} companies remain`);
  });

  // ── 1. Served, and identical to the constraint ────────────────────────────

  it('GET /companies/industries serves the vocabulary, including the target market\'s own', async () => {
    const res = await request(app).get('/api/v1/companies/industries').set(auth(sales));
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.data).toEqual([...INDUSTRIES]);
    for (const v of ['IT Services', 'EdTech', 'Other']) expect(res.body.data).toContain(v);
  });

  it('the served list is EXACTLY companies_industry_check — the two cannot drift', async () => {
    const def = (await pool.query(
      `SELECT pg_get_constraintdef(oid) AS d FROM pg_constraint
        WHERE conrelid = 'companies'::regclass AND conname = 'companies_industry_check'`)).rows[0]?.d as string;
    expect(def, 'constraint missing').toBeTruthy();
    const inCheck = [...def.matchAll(/'((?:[^']|'')+)'::(?:character varying|text)/g)].map(m => m[1].replace(/''/g, "'"));
    expect([...inCheck].sort()).toEqual([...INDUSTRIES].sort());
  });

  // ── 2 & 3. Every writer validates ─────────────────────────────────────────

  it('create: case and whitespace are corrected to the canonical value', async () => {
    const res = await create({ name: `Canon ${stamp}`, industry: '  it services ' });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(await storedIndustry(res.body.data.id)).toBe('IT Services');
  });

  it('create: an unknown industry is a 400 naming the field, and nothing is written', async () => {
    const name = `Unknown ${stamp}`;
    const res = await create({ name, industry: 'Space Mining' });
    expect(res.status, JSON.stringify(res.body)).toBe(400);
    expect(res.body.message).toMatch(/^industry must be one of: /);
    const n = await pool.query('SELECT COUNT(*)::int AS n FROM companies WHERE tenant_id = $1 AND name = $2', [ws.tenantId, name]);
    expect(n.rows[0].n).toBe(0);
  });

  it('create: blank and absent both store NULL — never "" and never "Other"', async () => {
    const blank = await create({ name: `Blank ${stamp}`, industry: '   ' });
    expect(blank.status).toBe(201);
    expect(await storedIndustry(blank.body.data.id)).toBeNull();
    const absent = await create({ name: `Absent ${stamp}` });
    expect(absent.status).toBe(201);
    expect(await storedIndustry(absent.body.data.id)).toBeNull();
  });

  it('update: refuses an unknown value and leaves the stored one; corrects case; null clears', async () => {
    const made = await create({ name: `Update ${stamp}`, industry: 'Retail' });
    const id = made.body.data.id;

    const bad = await request(app).put(`/api/v1/companies/${id}`).set(auth(ws)).send({ industry: 'Pharma' });
    expect(bad.status, JSON.stringify(bad.body)).toBe(400);
    expect(bad.body.message).toMatch(/^industry must be one of: /);
    expect(await storedIndustry(id)).toBe('Retail');

    const cased = await request(app).put(`/api/v1/companies/${id}`).set(auth(ws)).send({ industry: 'edtech' });
    expect(cased.status).toBe(200);
    expect(await storedIndustry(id)).toBe('EdTech');

    const cleared = await request(app).put(`/api/v1/companies/${id}`).set(auth(ws)).send({ industry: null });
    expect(cleared.status).toBe(200);
    expect(await storedIndustry(id)).toBeNull();
  });

  it('CSV import: an unknown industry fails THAT row with a reason; the good row is created', async () => {
    const rows = [
      { name: `Import Bad ${stamp}`, industry: 'Pharma' },
      { name: `Import Good ${stamp}`, industry: 'fintech' },
    ];
    const res = await request(app).post('/api/v1/companies/import').set(auth(ws)).send({ rows });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.data.created).toBe(1);
    expect(res.body.data.failed).toBe(1);
    expect(res.body.data.rows[0].reason).toMatch(/"Pharma" is not a recognised industry/);

    const good = await pool.query(
      'SELECT industry FROM companies WHERE tenant_id = $1 AND name = $2', [ws.tenantId, rows[1].name]);
    expect(good.rows[0].industry).toBe('FinTech');
    const bad = await pool.query(
      'SELECT COUNT(*)::int AS n FROM companies WHERE tenant_id = $1 AND name = $2', [ws.tenantId, rows[0].name]);
    expect(bad.rows[0].n).toBe(0);
  });

  it('THE DATABASE refuses an off-list industry written around the API', async () => {
    await expect(pool.query(
      `INSERT INTO companies (name, industry, tenant_id) VALUES ($1, 'Pharma', $2)`,
      [`Direct ${stamp}`, ws.tenantId],
    )).rejects.toMatchObject({ code: '23514' });
  });

  // ── 4. The workspace's own industry ───────────────────────────────────────

  it('business_industry: set by an admin, same vocabulary, normalised, and cleared by null', async () => {
    const unset = await request(app).get('/api/v1/workspace').set(auth(ws));
    expect(unset.body.data.business_industry).toBeNull();

    const set = await request(app).put('/api/v1/workspace').set(auth(ws)).send({ business_industry: 'it services' });
    expect(set.status, JSON.stringify(set.body)).toBe(200);
    expect(set.body.data.business_industry).toBe('IT Services');
    const row = await pool.query(`SELECT settings->>'business_industry' AS v FROM tenants WHERE id = $1`, [ws.tenantId]);
    expect(row.rows[0].v).toBe('IT Services');

    const bad = await request(app).put('/api/v1/workspace').set(auth(ws)).send({ business_industry: 'Space Mining' });
    expect(bad.status).toBe(400);
    expect(bad.body.message).toMatch(/^business_industry must be one of: /);

    const bySales = await request(app).put('/api/v1/workspace').set(auth(sales)).send({ business_industry: 'EdTech' });
    expect(bySales.status).toBe(403);

    const cleared = await request(app).put('/api/v1/workspace').set(auth(ws)).send({ business_industry: null });
    expect(cleared.body.data.business_industry).toBeNull();
  });
});
