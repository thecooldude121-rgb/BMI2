import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';

/**
 * Step 5 slice A — server-side lead pagination AT 10,000 LEADS (the PRD's
 * Definition of Done: "lists must work correctly at 10,000 records").
 *
 * The Leads page used to receive the API's default 50 rows and page those in
 * the browser with no total: lead #51 onwards was invisible, silently. Every
 * assertion here checks the API against an INDEPENDENT SQL count over the same
 * seeded rows — not against itself.
 */
const N = 10_000;

describe('Lead pagination — 10,000 leads', () => {
  let ws: TestWorkspace;
  let other: TestWorkspace;

  beforeAll(async () => {
    ws = await setupWorkspace('leadpage');
    other = await setupWorkspace('leadpage-other');
    // One set-based insert: deterministic variety across stage, source, score,
    // company, age and last contact. ~1s rather than 10,000 round trips.
    await pool.query(
      `INSERT INTO leads (first_name, last_name, email, company, position, stage, source, score,
                          created_at, last_contact, tenant_id)
       SELECT 'Lead' || g, 'N' || (g % 97), 'lead' || g || '@seed.example',
              CASE WHEN g % 10 = 0 THEN NULL ELSE 'Company ' || (g % 250) END,
              CASE WHEN g % 3 = 0 THEN 'CTO' ELSE 'Manager' END,
              (ARRAY['new','assigned','contacted','engaged','qualified','sales_accepted','nurture','disqualified','lost','proposal'])[1 + g % 10],
              (ARRAY['Website','Lead Gen','HRMS','Manual','Referral'])[1 + g % 5],
              g % 101,
              NOW() - make_interval(mins => g),
              CASE WHEN g % 4 = 0 THEN NULL ELSE (CURRENT_DATE - (g % 60)) END,
              $1
         FROM generate_series(1, ${N}) g`,
      [ws.tenantId],
    );
    // Noise in another workspace that must never be counted.
    await pool.query(
      `INSERT INTO leads (first_name, email, stage, source, score, tenant_id)
       SELECT 'Other' || g, 'other' || g || '@seed.example', 'qualified', 'Website', 90, $1
         FROM generate_series(1, 500) g`, [other.tenantId]);
  }, 60_000);

  afterAll(async () => { await teardownWorkspace(ws); await teardownWorkspace(other); }, 60_000);

  const list = (qs: string) => request(app).get(`/api/v1/leads?${qs}`).set(auth(ws));
  const sqlCount = async (where: string, params: unknown[] = []) =>
    (await pool.query(`SELECT COUNT(*)::int AS n FROM leads WHERE tenant_id = $1 AND ${where}`, [ws.tenantId, ...params])).rows[0].n;

  it('returns the REAL total (10,000), not the size of the page', async () => {
    const res = await list('limit=20');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(N);
    expect(res.body.data).toHaveLength(20);
    expect(res.body).toMatchObject({ count: 20, limit: 20, offset: 0 });
  });

  it('walking every page returns each of the 10,000 leads EXACTLY once (stable order, nothing skipped or repeated)', async () => {
    const seen = new Set<number>();
    let dupes = 0;
    for (let offset = 0; offset < N; offset += 500) {
      const res = await list(`limit=500&offset=${offset}&sort=newest`);
      expect(res.status).toBe(200);
      for (const row of res.body.data) { if (seen.has(row.id)) dupes++; seen.add(row.id); }
    }
    expect(dupes).toBe(0);
    expect(seen.size).toBe(N);
  }, 60_000);

  it('…and the same holds for a sort with many ties (score has only 101 distinct values)', async () => {
    const seen = new Set<number>();
    for (let offset = 0; offset < N; offset += 500) {
      const res = await list(`limit=500&offset=${offset}&sort=score_high_low`);
      for (const row of res.body.data) seen.add(row.id);
    }
    expect(seen.size).toBe(N);
  }, 60_000);

  it.each([
    ['status group', 'status=__qualified__', `stage IN ('qualified','sales_accepted')`],
    ['attempting_contact includes DB "contacted"', 'status=attempting_contact', `stage IN ('attempting_contact','contacted')`],
    ['source substring', 'source=lead', `source ILIKE '%lead%'`],
    ['score band', 'score_band=60-79', `coalesce(score,0) >= 60 AND coalesce(score,0) < 80`],
    ['search', 'search=Company%2042', `company ILIKE '%Company 42%' OR email ILIKE '%Company 42%' OR (coalesce(first_name,'')||' '||coalesce(last_name,'')) ILIKE '%Company 42%'`],
    ['insight: untouched', 'insight=untouched', `(last_contact IS NULL OR last_contact < CURRENT_DATE - 30)`],
    ['kanban lane stages', 'stages=nurture,disqualified', `stage IN ('nurture','disqualified')`],
  ])('filter total matches an independent SQL count — %s', async (_label, qs, where) => {
    const res = await list(`limit=10&${qs}`);
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.total).toBe(await sqlCount(where));
    expect(res.body.total).toBeGreaterThan(0);
  });

  it('the advanced filter runs in SQL: (score > 80 OR source is HRMS) AND company is empty', async () => {
    const filter = encodeURIComponent(JSON.stringify({ groups: [
      { id: 'a', name: 'a', logic: 'OR', conditions: [
        { id: '1', fieldId: 'score', operator: 'greater_than', value: 80 },
        { id: '2', fieldId: 'source', operator: 'is', value: 'HRMS' },
      ] },
      { id: 'b', name: 'b', logic: 'AND', conditions: [{ id: '3', fieldId: 'company', operator: 'text_is_empty', value: null }] },
    ] }));
    const res = await list(`limit=10&filter=${filter}`);
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.total).toBe(await sqlCount(`(coalesce(score,0) > 80 OR source = 'HRMS') AND coalesce(btrim(company),'') = ''`));
  });

  it('a filter on a field with no column is REFUSED (400), never silently ignored', async () => {
    const filter = encodeURIComponent(JSON.stringify({ groups: [
      { id: 'a', name: 'a', logic: 'AND', conditions: [{ id: '1', fieldId: 'duplicate_risk', operator: 'is_true', value: null }] },
    ] }));
    const res = await list(`filter=${filter}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/not available yet/);
    expect((await list('sort=priority')).status).toBe(400);
  });

  it('the summary counts match independent SQL over all 10,000', async () => {
    const res = await request(app).get('/api/v1/leads/summary').set(auth(ws));
    expect(res.status).toBe(200);
    const d = res.body.data;
    expect(d.total).toBe(N);
    expect(d.hot).toBe(await sqlCount('coalesce(score,0) >= 80'));
    expect(d.ready_to_convert).toBe(await sqlCount(`stage IN ('qualified','sales_accepted')`));
    expect(d.new_unworked).toBe(await sqlCount(`stage IN ('new','assigned') AND last_contact IS NULL`));
    expect(d.untouched).toBe(await sqlCount('(last_contact IS NULL OR last_contact < CURRENT_DATE - 30)'));
  });

  it('another workspace\'s leads are never counted or returned', async () => {
    const res = await list('limit=500&status=__qualified__');
    expect(res.body.data.every((r: { tenant_id: string }) => r.tenant_id === ws.tenantId)).toBe(true);
    const summary = await request(app).get('/api/v1/leads/summary').set(auth(ws));
    expect(summary.body.data.total).toBe(N);
  });

  it('a deep page at 10,000 rows answers quickly (index-backed), well under the 2s budget', async () => {
    const t0 = Date.now();
    const res = await list('limit=20&offset=9900&status=__closed__&sort=newest');
    expect(res.status).toBe(200);
    expect(Date.now() - t0).toBeLessThan(1000);
  });

  it('limit is capped at 500 and the legacy default stays 50', async () => {
    expect((await list('limit=99999')).body.data).toHaveLength(500);
    expect((await list('')).body.data).toHaveLength(50);
  });
});
