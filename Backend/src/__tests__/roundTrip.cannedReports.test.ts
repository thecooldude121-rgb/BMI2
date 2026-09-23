import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';
import { CANNED_REPORTS, CANNED_PREFIX } from '../services/reports/canned';
import { resetReportsPool } from '../config/reportsDatabase';

/**
 * CANNED REPORTS, AND THE DISCLOSURE FIXES THEY FORCED. P3 Phase 6.
 *
 * The reports themselves are a small feature. Running them against real data at
 * volume is what mattered, and it exposed three defects in the provenance block
 * Phase 3 built — all three are pinned here:
 *
 *   1. The disclosure said unlinked rows "are not counted". Every join is a
 *      LEFT JOIN, so they ARE counted, in a NULL bucket the reader can see.
 *      The sentence was false.
 *   2. Coverage was computed only from `definition.joins`, so a dimension
 *      reached through a SUPPORT SOURCE reported no gap at all — live, that hid
 *      17 of 18 deals landing in one unlabelled bucket.
 *   3. "Based on 1 rows".
 */
describe('Canned reports', () => {
  let ws: TestWorkspace;
  let other: TestWorkspace;
  let companyId: string;

  const get = (as: TestWorkspace, path: string) =>
    request(app).get(path).set(auth(as));

  const seedDeal = async (
    w: TestWorkspace, name: string, value: number,
    opts: { seed?: boolean; test?: boolean; company?: string | null } = {},
  ) => {
    await pool.query(
      `INSERT INTO deals (name, value, currency, source, tenant_id, stage_id, is_seed, is_test, company_id)
       VALUES ($1, $2, 'USD', 'referral', $3,
               (SELECT id FROM pipeline_stages WHERE tenant_id = $3 ORDER BY position LIMIT 1),
               $4, $5, $6)`,
      [name, value, w.tenantId, !!opts.seed, !!opts.test, opts.company ?? null],
    );
  };

  beforeAll(async () => {
    ws = await setupWorkspace('canned');
    other = await setupWorkspace('canned-other');

    const co = await request(app).post('/api/v1/companies')
      .set(auth(ws)).send({ name: 'Canned Co', industry: 'Technology' });
    companyId = co.body.data.id;

    // Two linked to an account, two not — so a dimension gap is measurable.
    await seedDeal(ws, 'linked A', 100, { company: companyId });
    await seedDeal(ws, 'linked B', 200, { company: companyId });
    await seedDeal(ws, 'orphan C', 300, {});
    await seedDeal(ws, 'orphan D', 400, {});
    await seedDeal(other, 'theirs', 9999, {});
  });

  afterAll(async () => {
    const tenants = [ws.tenantId, other.tenantId];
    await pool.query('DELETE FROM deals WHERE tenant_id = ANY($1::uuid[])', [tenants]);
    await teardownWorkspace(other);
    await teardownWorkspace(ws);
    await resetReportsPool();
  });

  // ── The catalogue ────────────────────────────────────────────────────────

  it('GET /reports serves the canned catalogue alongside saved reports', async () => {
    const res = await get(ws, '/api/v1/reports');
    expect(res.status).toBe(200);
    const ids = res.body.canned.map((r: { id: string }) => r.id);
    expect(ids).toContain(`${CANNED_PREFIX}revenue-by-industry`);
    expect(ids).toContain(`${CANNED_PREFIX}pipeline-by-owner`);
    // The workspace has saved none of its own.
    expect(res.body.data).toEqual([]);
  });

  it('a canned report is viewable by anyone and editable by nobody', async () => {
    const res = await get(ws, `/api/v1/reports/${CANNED_PREFIX}revenue-by-industry`);
    expect(res.status).toBe(200);
    expect(res.body.data.is_canned).toBe(true);
    expect(res.body.data.abilities).toEqual({
      can_view: true, can_edit: false, can_delete: false, can_share: false,
    });
    // No owner, and not a fabricated one — the UI says "Built in".
    expect(res.body.data.owner_name).toBeNull();
    expect(res.body.data.caveat).toBeTruthy();
  });

  it('every canned definition actually compiles', async () => {
    /*
     * These ship with the product, so a broken one is broken for every
     * workspace at once — and it would surface as a 409 on a report the user
     * cannot edit, which is a dead end. Walked rather than spot-checked so a
     * newly added report is covered without anyone remembering to add a test.
     */
    for (const r of CANNED_REPORTS) {
      const res = await get(ws, `/api/v1/reports/${r.id}/run`);
      expect(res.status, `${r.id} did not run: ${JSON.stringify(res.body)}`).toBe(200);
      expect(res.body.provenance).toBeTruthy();
    }
  });

  it('an unknown canned id is a 404, not a 500 from a bad UUID cast', async () => {
    const res = await get(ws, `/api/v1/reports/${CANNED_PREFIX}no-such-report`);
    expect(res.status).toBe(404);
  });

  // ── Canned ids on write paths ────────────────────────────────────────────

  it('every write path refuses a canned id BEFORE it reaches Postgres', async () => {
    /*
     * `saved_reports.id` is a UUID column, so an unguarded `canned:...` reaches
     * the driver as 22P02 and errorHandler masks it as a bare 500 — "invalid
     * input syntax for type uuid" where the honest answer is "not an editable
     * report". 404 matches what a viewer already gets from PATCH, whose WHERE
     * carries canEditPredicate.
     */
    const id = `${CANNED_PREFIX}revenue-by-industry`;
    const calls = [
      request(app).patch(`/api/v1/reports/${id}`).set(auth(ws)).send({ name: 'mine now' }),
      request(app).delete(`/api/v1/reports/${id}`).set(auth(ws)),
      request(app).get(`/api/v1/reports/${id}/grants`).set(auth(ws)),
      request(app).put(`/api/v1/reports/${id}/grants`).set(auth(ws)).send({ user_id: 1, level: 'view' }),
      request(app).delete(`/api/v1/reports/${id}/grants/1`).set(auth(ws)),
    ];
    for (const c of calls) {
      const res = await c;
      expect(res.status, `got ${res.status}: ${JSON.stringify(res.body)}`).toBe(404);
    }
  });

  // ── Tenancy ──────────────────────────────────────────────────────────────

  it('a canned report is scoped to the caller\'s workspace like any other run', async () => {
    const mine = await get(ws, `/api/v1/reports/${CANNED_PREFIX}pipeline-by-owner`.concat('/run'));
    expect(mine.status).toBe(200);
    // 4 visible deals here; the other workspace's 9999 must not appear.
    expect(mine.body.provenance.rows_matched).toBe(4);
    const values = JSON.stringify(mine.body.rows);
    expect(values).not.toContain('9999');
  });

  // ── The three disclosure defects this phase found ────────────────────────

  it('unlinked rows are described as GROUPED, not as "not counted"', async () => {
    /*
     * THE FALSE SENTENCE. Two of the four deals have no account, and the
     * result plainly contains a row for them — so saying they are not counted
     * misdescribes the very table it sits under.
     */
    const res = await request(app).post('/api/v1/reports/run').set(auth(ws)).send({
      definition: {
        v: 1, base: 'deals', joins: ['companies'],
        dimensions: [{ field: 'companies.industry' }],
        metrics: [{ agg: 'count' }],
      },
    });
    expect(res.status).toBe(200);

    const d: string = res.body.provenance.disclosure;
    expect(d).not.toMatch(/not counted/i);
    expect(d).toMatch(/grouped under "Not recorded" rather than dropped/);

    // And the row it describes is really there.
    const nullBucket = res.body.rows.find((r: Record<string, unknown>) => r.dim_0 === null);
    expect(nullBucket, 'the NULL bucket the sentence describes must exist').toBeTruthy();
  });

  it('a dimension reached through a SUPPORT SOURCE reports its gap', async () => {
    /*
     * `deals.owner_name` resolves through the `users` support source, which is
     * not a join — so before Phase 6 this returned `coverage: []` while every
     * row fell into one bucket. No deal here has a linked user.
     */
    const res = await request(app).post('/api/v1/reports/run').set(auth(ws)).send({
      definition: {
        v: 1, base: 'deals',
        dimensions: [{ field: 'deals.owner_name' }],
        metrics: [{ agg: 'count' }],
      },
    });
    expect(res.status).toBe(200);

    const cov = res.body.provenance.coverage;
    expect(cov).toHaveLength(1);
    expect(cov[0].kind).toBe('dimension');
    expect(cov[0].key).toBe('deals.owner_name');
    expect(cov[0].matched).toBe(0);
    expect(cov[0].of).toBe(4);
    expect(res.body.provenance.disclosure).toMatch(/4 of 4 have no owner \(linked user\) recorded/i);
  });

  it('a join gap and a dimension gap measuring the same rows are stated once', async () => {
    // Otherwise "2 of 4 have no accounts linked" AND "2 of 4 have no industry
    // recorded" both render, reading as four problem rows instead of two.
    const res = await request(app).post('/api/v1/reports/run').set(auth(ws)).send({
      definition: {
        v: 1, base: 'deals', joins: ['companies'],
        dimensions: [{ field: 'companies.industry' }],
        metrics: [{ agg: 'count' }],
      },
    });
    const cov = res.body.provenance.coverage;
    expect(cov).toHaveLength(1);
    expect(cov[0].kind).toBe('dimension');

    const matches = (res.body.provenance.disclosure.match(/grouped under/g) ?? []).length;
    expect(matches).toBe(1);
  });

  it('a join gap LARGER than its dimension gap is still reported separately', async () => {
    /*
     * The counts only coincide because every account here has an industry. They
     * are different facts — "linked to no account" versus "linked to an account
     * with no industry" have different fixes — so the suppression must be
     * conditional, not unconditional.
     */
    await pool.query(
      `INSERT INTO companies (name, industry, tenant_id) VALUES ('No Industry Co', NULL, $1)`,
      [ws.tenantId],
    );
    const co = await pool.query(
      `SELECT id FROM companies WHERE tenant_id = $1 AND name = 'No Industry Co'`, [ws.tenantId],
    );
    await seedDeal(ws, 'linked but blank', 500, { company: co.rows[0].id });

    const res = await request(app).post('/api/v1/reports/run').set(auth(ws)).send({
      definition: {
        v: 1, base: 'deals', joins: ['companies'],
        dimensions: [{ field: 'companies.industry' }],
        metrics: [{ agg: 'count' }],
      },
    });
    const cov = res.body.provenance.coverage;
    // 5 deals: 3 linked to an account (one of which has no industry), 2 orphans.
    const join = cov.find((c: { kind: string }) => c.kind === 'join');
    const dim = cov.find((c: { kind: string }) => c.kind === 'dimension');
    expect(join, 'the join gap is smaller than the dimension gap, so it survives').toBeTruthy();
    expect(dim).toBeTruthy();
    expect(join.matched).toBe(3);
    expect(dim.matched).toBe(2);

    /*
     * AND THE JOIN BRANCH'S WORDING IS ASSERTED HERE, because this is the only
     * case that reaches it — everywhere else the join entry is suppressed as
     * subsumed. Mutation-testing caught that: reverting the join branch to the
     * old false "and are not counted" passed the whole suite, since no test
     * produced a surviving join entry with a gap.
     */
    const d: string = res.body.provenance.disclosure;
    expect(d).not.toMatch(/not counted/i);
    expect(d).toMatch(/have no accounts linked, and are grouped under "Not recorded" rather than dropped/);
    // Both gaps are stated, because they are different problems.
    expect(d).toMatch(/have no industry recorded, and are grouped under "Not recorded" rather than dropped/);

    await pool.query(`DELETE FROM deals WHERE tenant_id = $1 AND name = 'linked but blank'`, [ws.tenantId]);
    await pool.query(`DELETE FROM companies WHERE tenant_id = $1 AND name = 'No Industry Co'`, [ws.tenantId]);
  });

  // ── Money ────────────────────────────────────────────────────────────────

  it('warns when a SUM adds unlike currencies together', async () => {
    /*
     * Live, `deals` holds 17 USD rows and one AED row, so `SUM(value)` returned
     * 1,237,000 of nothing and reported it as confidently as any correct
     * figure. There are no exchange rates in this system — the projection work
     * already refused to invent one ("reported by currency, never converted")
     * — so the only honest move is to measure the spread and say so.
     */
    await pool.query(
      `UPDATE deals SET currency = 'AED' WHERE tenant_id = $1 AND name = 'orphan D'`,
      [ws.tenantId],
    );

    const res = await request(app).post('/api/v1/reports/run').set(auth(ws)).send({
      definition: {
        v: 1, base: 'deals',
        dimensions: [{ field: 'deals.source' }],
        metrics: [{ agg: 'sum', field: 'deals.value' }],
      },
    });
    expect(res.status).toBe(200);
    expect(res.body.provenance.currencies.sort()).toEqual(['AED', 'USD']);
    expect(res.body.provenance.disclosure).toMatch(/span 2 currencies/);
    expect(res.body.provenance.disclosure).toMatch(/WITHOUT conversion/);
  });

  it('does NOT warn when the report already groups BY currency', async () => {
    // Grouping by currency is the fix, so warning anyway would train readers to
    // ignore the warning — which costs more than never having had it.
    const res = await request(app).post('/api/v1/reports/run').set(auth(ws)).send({
      definition: {
        v: 1, base: 'deals',
        dimensions: [{ field: 'deals.source' }, { field: 'deals.currency' }],
        metrics: [{ agg: 'sum', field: 'deals.value' }],
      },
    });
    expect(res.status).toBe(200);
    expect(res.body.provenance.disclosure).not.toMatch(/span \d+ currencies/);
  });

  it('both shipped reports group by currency, so neither can print a unitless total', async () => {
    for (const r of CANNED_REPORTS) {
      const dims = (r.definition.dimensions ?? []).map(d => d.field);
      const sumsMoney = (r.definition.metrics ?? []).some(
        m => (m.agg === 'sum' || m.agg === 'avg') && m.field === 'deals.value');
      if (sumsMoney) {
        expect(dims, `${r.id} sums money without grouping by currency`)
          .toContain('deals.currency');
      }
    }
  });

  it('a COUNT is never warned about, because counting cannot mix units', async () => {
    const res = await request(app).post('/api/v1/reports/run').set(auth(ws)).send({
      definition: {
        v: 1, base: 'deals',
        dimensions: [{ field: 'deals.source' }],
        metrics: [{ agg: 'count' }],
      },
    });
    expect(res.body.provenance.currencies).toBeNull();
    expect(res.body.provenance.disclosure).not.toMatch(/currencies/);

    await pool.query(
      `UPDATE deals SET currency = 'USD' WHERE tenant_id = $1 AND name = 'orphan D'`,
      [ws.tenantId],
    );
  });

  it('says "1 row", not "1 rows" — in the SEEDED branch, which was the broken one', async () => {
    /*
     * The other two branches pluralised correctly all along, which is exactly
     * how "Based on 1 rows" survived to reach live data: the bug was in the
     * branch that only fires when some rows are seeded AND some are not. So
     * this test needs a seeded row, not merely a single row.
     */
    await seedDeal(ws, 'lonely seeded', 700, { seed: true });

    const res = await request(app).post('/api/v1/reports/run').set(auth(ws)).send({
      definition: {
        v: 1, base: 'deals',
        dimensions: [{ field: 'deals.name' }],
        metrics: [{ agg: 'count' }],
        filters: [{ field: 'deals.name', op: 'eq', value: 'lonely seeded' }],
      },
    });
    expect(res.status).toBe(200);
    expect(res.body.provenance.rows_matched).toBe(1);
    expect(res.body.provenance.rows_seeded).toBe(1);
    expect(res.body.provenance.disclosure).toMatch(/Based on 1 row, and it is seeded demo data\./);
    expect(res.body.provenance.disclosure).not.toMatch(/1 rows/);
    // "1 of them" for a single row was the other half of the same clumsiness.
    expect(res.body.provenance.disclosure).not.toMatch(/of them/);

    await pool.query(`DELETE FROM deals WHERE tenant_id = $1 AND name = 'lonely seeded'`, [ws.tenantId]);
  });
});
