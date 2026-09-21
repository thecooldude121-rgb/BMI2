import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, addUserWithRole, TestWorkspace } from './helpers';
import { DEFINITION_VERSION, MAX_ROWS, type ReportDefinition } from '../services/reports/types';
import { resetReportsPool } from '../config/reportsDatabase';

/**
 * RUNNING REPORTS, AND DISCLOSING WHAT THEY WERE COMPUTED FROM. P3 Phase 3.
 *
 * WHAT THESE PIN:
 *  1. PROVENANCE IS NEVER ABSENT. Every run carries it, including an empty one.
 *  2. SEEDED IS DISCLOSED, NOT HIDDEN — and where it cannot be measured it is
 *     NULL with the sentence saying so, never 0.
 *  3. Coverage and provenance are DIFFERENT numbers and both render. This is
 *     the Wave 6 requirement, in a test.
 *  4. The result is tenant-scoped through RLS, and running someone else's saved
 *     report is a 404.
 *  5. Truncation is DETECTED, and the 50% threshold is computed server-side.
 */
describe('Report run + provenance', () => {
  let ws: TestWorkspace;
  let other: TestWorkspace;
  let stranger: TestWorkspace;
  let companyId: string;

  const def = (over: Partial<ReportDefinition> = {}): ReportDefinition => ({
    v: DEFINITION_VERSION,
    base: 'deals',
    dimensions: [{ field: 'deals.source' }],
    metrics: [{ agg: 'sum', field: 'deals.value' }, { agg: 'count' }],
    ...over,
  });

  const runAdHoc = (as: TestWorkspace, definition: unknown) =>
    request(app).post('/api/v1/reports/run').set(auth(as)).send({ definition });

  const seedDeal = async (
    ws2: TestWorkspace, name: string, value: number, opts: { seed?: boolean; test?: boolean; company?: string | null } = {},
  ) => {
    await pool.query(
      `INSERT INTO deals (name, value, currency, source, tenant_id, stage_id, is_seed, is_test, company_id)
       VALUES ($1, $2, 'USD', 'referral', $3,
               (SELECT id FROM pipeline_stages WHERE tenant_id = $3 ORDER BY position LIMIT 1),
               $4, $5, $6)`,
      [name, value, ws2.tenantId, !!opts.seed, !!opts.test, opts.company ?? null],
    );
  };

  beforeAll(async () => {
    ws = await setupWorkspace('runrep');
    other = await setupWorkspace('runrep-other');
    stranger = await addUserWithRole(ws, 'sales');

    const co = await request(app).post('/api/v1/companies').set(auth(ws)).send({ name: 'RunRep Co' });
    companyId = co.body.data.id;

    // 3 seeded + 1 real + 1 test. Two of the four visible carry a company.
    await seedDeal(ws, 'seeded A', 100, { seed: true, company: companyId });
    await seedDeal(ws, 'seeded B', 200, { seed: true, company: companyId });
    await seedDeal(ws, 'seeded C', 300, { seed: true });
    await seedDeal(ws, 'real D',   400, { seed: false });
    await seedDeal(ws, 'test E',   999, { test: true });
    // And one in the other workspace, which must never appear.
    await seedDeal(other, 'theirs', 5000, {});
  });

  afterAll(async () => {
    const tenants = [ws.tenantId, other.tenantId];
    await pool.query('DELETE FROM saved_reports WHERE tenant_id = ANY($1::uuid[])', [tenants]);
    await pool.query('DELETE FROM deals WHERE tenant_id = ANY($1::uuid[])', [tenants]);
    await teardownWorkspace(other);
    await teardownWorkspace(ws);
    await resetReportsPool();
  });

  // ── 1. Provenance is never absent ────────────────────────────────────────

  it('every run carries a provenance block with the full shape', async () => {
    const res = await runAdHoc(ws, def());
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    const p = res.body.provenance;
    for (const k of ['rows_returned','rows_matched','rows_seeded','rows_real','seeded_share',
                     'mostly_seeded','excluded_test','coverage','truncated','row_limit','disclosure']) {
      expect(p, `missing ${k}`).toHaveProperty(k);
    }
  });

  it('an EMPTY result still carries provenance, rather than omitting it', async () => {
    const res = await runAdHoc(ws, def({
      filters: [{ field: 'deals.source', op: 'eq', value: 'no-such-source' }],
    }));
    expect(res.status).toBe(200);
    expect(res.body.rows).toHaveLength(0);
    expect(res.body.provenance.rows_matched).toBe(0);
    expect(res.body.provenance.disclosure).toBeTruthy();
  });

  // ── 2. Seeded is disclosed ───────────────────────────────────────────────

  it('counts seeded vs real, excludes test rows, and REPORTS the exclusion', async () => {
    const res = await runAdHoc(ws, def());
    const p = res.body.provenance;
    expect(p.rows_matched).toBe(4);        // 3 seeded + 1 real; the test row is out
    expect(p.rows_seeded).toBe(3);
    expect(p.rows_real).toBe(1);
    expect(p.excluded_test).toBe(1);       // reported, not merely applied
    expect(p.seeded_share).toBeCloseTo(0.75, 5);
  });

  it('crosses the 50% threshold and says so in a SERVER-COMPOSED sentence', async () => {
    const res = await runAdHoc(ws, def());
    const p = res.body.provenance;
    expect(p.mostly_seeded).toBe(true);
    expect(p.disclosure).toContain('3 of them seeded demo data');
    expect(p.disclosure).toContain('1 real');
    expect(p.disclosure).toContain('1 test record excluded');
  });

  it('reports seeded as NULL, not 0, where the module cannot measure it', async () => {
    // `activities` has no is_seed column. A 0 would claim "none of this is
    // seeded", which is a different statement from "not recorded".
    const res = await runAdHoc(ws, {
      v: DEFINITION_VERSION, base: 'activities',
      dimensions: [{ field: 'activities.type' }], metrics: [{ agg: 'count' }],
    });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.provenance.rows_seeded).toBeNull();
    expect(res.body.provenance.rows_real).toBeNull();
    expect(res.body.provenance.seeded_share).toBeNull();
    expect(res.body.provenance.mostly_seeded).toBe(false);
    expect(res.body.provenance.disclosure).toMatch(/not recorded for this module/);
  });

  // ── 3. Coverage and provenance are different numbers ─────────────────────

  it('reports JOIN COVERAGE separately from the seeded share — the Wave 6 rule', async () => {
    const res = await runAdHoc(ws, def({
      joins: ['companies'],
      dimensions: [{ field: 'companies.industry' }],
    }));
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    const p = res.body.provenance;

    // Coverage: 2 of 4 visible deals carry a company_id.
    expect(p.coverage).toHaveLength(1);
    expect(p.coverage[0]).toMatchObject({ join: 'companies', matched: 2, of: 4 });
    // Provenance: 3 of 4 are seeded. TWO DIFFERENT NUMBERS, both present.
    expect(p.rows_seeded).toBe(3);
    expect(p.disclosure).toContain('2 of 4 have no accounts linked and are not counted');
    expect(p.disclosure).toContain('seeded demo data');
  });

  // ── 4. Tenant scoping and grants ─────────────────────────────────────────

  it('never includes another workspace\'s rows — the other deal is 5000 and must not appear', async () => {
    const res = await runAdHoc(ws, def());
    const total = res.body.rows.reduce((n: number, r: Record<string, string>) => n + Number(r.metric_0), 0);
    expect(total).toBe(1000);               // 100+200+300+400, not 6000
    expect(res.body.provenance.rows_matched).toBe(4);
  });

  it('running a SAVED report requires view, and a stranger gets 404', async () => {
    const made = await request(app).post('/api/v1/reports').set(auth(ws))
      .send({ name: 'Runnable', definition: def() });
    const id = made.body.data.id;

    const asOwner = await request(app).get(`/api/v1/reports/${id}/run`).set(auth(ws));
    expect(asOwner.status, JSON.stringify(asOwner.body)).toBe(200);
    expect(asOwner.body.report).toMatchObject({ id, name: 'Runnable' });
    expect(asOwner.body.provenance.rows_matched).toBe(4);

    const asStranger = await request(app).get(`/api/v1/reports/${id}/run`).set(auth(stranger));
    expect(asStranger.status).toBe(404);
    // The definition is never handed over, so there is nothing to run.
    expect(asStranger.body).not.toHaveProperty('rows');

    const asOtherWorkspace = await request(app).get(`/api/v1/reports/${id}/run`).set(auth(other));
    expect(asOtherWorkspace.status).toBe(404);
  });

  it('a VIEWER grant is enough to run it', async () => {
    const made = await request(app).post('/api/v1/reports').set(auth(ws))
      .send({ name: 'Shared runnable', definition: def() });
    const id = made.body.data.id;
    await request(app).put(`/api/v1/reports/${id}/grants`).set(auth(ws))
      .send({ user_id: Number(stranger.userId), level: 'view' });

    const res = await request(app).get(`/api/v1/reports/${id}/run`).set(auth(stranger));
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.provenance).toBeTruthy();
  });

  // ── 5. Limits ────────────────────────────────────────────────────────────

  it('reports the row cap, and truncated=false when nothing was cut', async () => {
    const res = await runAdHoc(ws, def());
    expect(res.body.provenance.row_limit).toBe(MAX_ROWS);
    expect(res.body.provenance.truncated).toBe(false);
    expect(res.body.provenance.disclosure).not.toContain('Cut off');
  });

  it('DETECTS truncation rather than assuming it, and says so', async () => {
    // limit 1 with two distinct groups: the builder asks for 2, gets 2, and
    // knows it was cut. A plain LIMIT 1 returning 1 row could not tell.
    const res = await runAdHoc(ws, def({
      base: 'deals', dimensions: [{ field: 'deals.name' }],
      metrics: [{ agg: 'count' }], limit: 1,
    }));
    expect(res.status).toBe(200);
    expect(res.body.rows).toHaveLength(1);
    expect(res.body.provenance.truncated).toBe(true);
    expect(res.body.provenance.row_limit).toBe(1);
    expect(res.body.provenance.disclosure).toContain('Cut off at 1 rows');
  });

  it('refuses a bad definition with 400 and the builder\'s message', async () => {
    const res = await runAdHoc(ws, def({ dimensions: [{ field: 'deals.nope' }] }));
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Unknown field/);
  });

  it('a SAVED report that no longer compiles is 409, not 400 — the caller did nothing wrong', async () => {
    const made = await request(app).post('/api/v1/reports').set(auth(ws))
      .send({ name: 'Will rot', definition: def() });
    const id = made.body.data.id;
    // Simulate a registry change by writing a definition the builder rejects.
    // The DB CHECK only constrains `base`, so a bad FIELD can be stored.
    await pool.query(
      `UPDATE saved_reports SET definition = jsonb_set(definition, '{dimensions}', '[{"field":"deals.gone"}]')
        WHERE id = $1`, [id]);

    const res = await request(app).get(`/api/v1/reports/${id}/run`).set(auth(ws));
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/can no longer run/);
  });

  it('requires authentication', async () => {
    expect((await request(app).post('/api/v1/reports/run').send({ definition: def() })).status).toBe(401);
  });
});
