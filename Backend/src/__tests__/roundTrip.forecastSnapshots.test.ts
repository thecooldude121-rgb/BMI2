import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import {
  app, setupWorkspace, teardownWorkspace, auth, addUserWithRole, TestWorkspace,
} from './helpers';

/**
 * Forecast: GET /forecast/summary and SERVER-COMPUTED snapshots (slice 5c,
 * 2026-10-13), on top of migration 043's identity rules.
 *
 * The page fetched the 500 newest deals, summed them in the browser (native
 * amounts across currencies) and POSTed those per-rep figures as permanent
 * snapshots. Now both the page and a snapshot come from utils/forecastTotals.
 *
 * WHAT THESE PIN:
 *  1. The page's category rules, on the server: explicit forecast_category
 *     wins; won -> closed; lost dropped; negotiation -> commit; proposal ->
 *     best case; else pipeline. Quarter by expected close; undated only when
 *     the viewer's day is in the quarter, and never as closed.
 *  2. Trusted USD only; the rest counted as unconverted, per rep and per category.
 *  3. A snapshot is the summary, written by the server. Figures in the body are
 *     REFUSED, so an old client cannot store capped numbers.
 *  4. From 043: user_id AND rep_name; an unattributed rep is still recorded; two
 *     people sharing a display name get separate rows; a re-snapshot the same
 *     day upserts; deleting a user keeps the row and nulls the reference;
 *     workspace-scoped. forecast_quotas stays dropped.
 */
describe('Forecast summary and server-computed snapshots', () => {
  let ws: TestWorkspace;
  let other: TestWorkspace;
  let twinA: TestWorkspace;
  let twinB: TestWorkspace;
  const PERIOD = 'Q1 2031';
  const INSIDE = '2031-02-15';
  const AFTER = '2031-05-01';
  const st: Record<string, string> = {};

  const deal = (o: { name: string; stage: string; value: number; currency?: string; base?: number | null;
    close?: string | null; user?: string | number | null; ownerName?: string | null; fc?: string | null }, t = ws.tenantId) =>
    pool.query(
      `INSERT INTO deals (name, value, currency, base_amount_usd, stage_id, expected_close_date, assigned_to_user_id,
                          assigned_to, forecast_category, pipeline_id, tenant_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'new-business',$10)`,
      [o.name, o.value, o.currency ?? 'USD', o.base === undefined ? o.value : o.base, st[o.stage], o.close ?? null,
        o.user ?? null, o.ownerName ?? null, o.fc ?? null, t]);
  const summary = (today = INSIDE, as: TestWorkspace = ws) =>
    request(app).get('/api/v1/forecast/summary').query({ period: PERIOD, today }).set(auth(as));
  const snap = (body: Record<string, unknown>, as: TestWorkspace = ws) =>
    request(app).post('/api/v1/forecast/snapshots').set(auth(as)).send(body);
  const list = (as: TestWorkspace = ws) =>
    request(app).get(`/api/v1/forecast/snapshots?period=${encodeURIComponent(PERIOD)}`).set(auth(as));

  beforeAll(async () => {
    ws = await setupWorkspace('fcst');
    other = await setupWorkspace('fcst-other');
    twinA = await addUserWithRole(ws, 'sales');
    twinB = await addUserWithRole(ws, 'sales');
    // Two people with the SAME display name — the case 043's re-key exists for.
    await pool.query(`UPDATE users SET first_name = 'Sam', last_name = 'Rao' WHERE id = ANY($1::int[])`, [[twinA.userId, twinB.userId]]);
    for (const r of (await pool.query('SELECT id, slug FROM pipeline_stages WHERE tenant_id = $1', [ws.tenantId])).rows) st[r.slug] = r.id;

    const me = ws.userId;
    await deal({ name: 'Neg', stage: 'negotiation', value: 1000, close: '2031-02-01', user: me });          // commit
    await deal({ name: 'Prop', stage: 'proposal', value: 400, close: '2031-03-01', user: me });             // best case
    await deal({ name: 'Qual', stage: 'qualified', value: 300, close: '2031-01-20', user: me });            // pipeline
    await deal({ name: 'Won', stage: 'closed-won', value: 2000, close: '2031-01-10', user: me });           // closed
    await deal({ name: 'Lost', stage: 'closed-lost', value: 9999, close: '2031-01-11', user: me });         // dropped
    await deal({ name: 'Explicit', stage: 'qualified', value: 50, close: '2031-02-02', user: me, fc: 'Commit' }); // commit (explicit)
    await deal({ name: 'INR commit', stage: 'negotiation', value: 125000, currency: 'INR', base: null, close: '2031-02-03', user: me });
    await deal({ name: 'Next quarter', stage: 'negotiation', value: 7777, close: '2031-04-02', user: me }); // out
    await deal({ name: 'Undated', stage: 'qualified', value: 600, close: null, ownerName: 'Legacy Rep' });  // pipeline only while INSIDE
    await deal({ name: 'Undated won', stage: 'closed-won', value: 800, close: null, ownerName: 'Legacy Rep' }); // never (closed, undated)
    await deal({ name: 'Twin A', stage: 'negotiation', value: 111, close: '2031-02-10', user: twinA.userId });
    await deal({ name: 'Twin B', stage: 'negotiation', value: 222, close: '2031-02-11', user: twinB.userId });
    await pool.query(`INSERT INTO deals (name, value, currency, base_amount_usd, stage_id, expected_close_date, is_test, pipeline_id, tenant_id)
                      VALUES ('Test', 5555, 'USD', 5555, $1, '2031-02-01', true, 'new-business', $2)`, [st.negotiation, ws.tenantId]);
    const theirs = (await pool.query(`SELECT id FROM pipeline_stages WHERE tenant_id = $1 AND slug = 'negotiation'`, [other.tenantId])).rows[0].id;
    await pool.query(`INSERT INTO deals (name, value, currency, base_amount_usd, stage_id, expected_close_date, pipeline_id, tenant_id)
                      VALUES ('Foreign', 50000, 'USD', 50000, $1, '2031-02-01', 'new-business', $2)`, [theirs, other.tenantId]);
  });

  afterAll(async () => {
    for (const w of [ws, other]) {
      await pool.query('DELETE FROM forecast_snapshots WHERE tenant_id = $1', [w.tenantId]);
      await pool.query('DELETE FROM deal_stage_history WHERE tenant_id = $1', [w.tenantId]);
      await pool.query('DELETE FROM deals WHERE tenant_id = $1', [w.tenantId]);
    }
    const left = await pool.query('SELECT COUNT(*)::int AS n FROM forecast_snapshots WHERE tenant_id = ANY($1::uuid[])', [[ws.tenantId, other.tenantId]]);
    if (left.rows[0].n !== 0) throw new Error(`Cleanup failed: ${left.rows[0].n} snapshots remain`);
    await teardownWorkspace(other);
    await teardownWorkspace(ws);
  });

  it('forecast_quotas is DROPPED, not merely unused', async () => {
    const t = await pool.query(`SELECT to_regclass('public.forecast_quotas') AS t`);
    expect(t.rows[0].t).toBeNull();
  });

  it('categories follow the page\'s rules, in the quarter, trusted USD only', async () => {
    const res = await summary();
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    const d = res.body.data;
    expect(d).toMatchObject({ quarter_start: '2031-01-01', quarter_end: '2031-03-31', include_undated: true });
    expect(d.categories).toEqual({
      commit: { count: 5, value_usd: 1000 + 50 + 111 + 222, unconverted: 1 },
      'best-case': { count: 1, value_usd: 400, unconverted: 0 },
      pipeline: { count: 2, value_usd: 300 + 600, unconverted: 0 },
      closed: { count: 1, value_usd: 2000, unconverted: 0 },
    });
  });

  it('per rep, with the inspection inputs, and undated deals only while the viewer is in the quarter', async () => {
    const d = (await summary()).body.data;
    const mine = d.reps.find((r: { key: string }) => r.key === `id:${ws.userId}`);
    expect(mine).toMatchObject({
      user_id: Number(ws.userId), unresolved: false, deal_count: 6, unconverted: 1,
      commit: { count: 3, value_usd: 1050, unconverted: 1 }, closed: { count: 1, value_usd: 2000, unconverted: 0 },
    });
    expect(mine.commit_overdue).toBe(3); // three commit deals closed before 2031-02-15
    expect(d.reps.find((r: { key: string }) => r.key === 'name:Legacy Rep')).toMatchObject({ unresolved: true, user_id: null });
    const later = (await summary(AFTER)).body.data;
    expect(later.include_undated).toBe(false);
    expect(later.reps.find((r: { key: string }) => r.key === 'name:Legacy Rep')).toBeUndefined();
    expect(later.categories.pipeline).toEqual({ count: 1, value_usd: 300, unconverted: 0 });
  });

  it('top deals per category are served (biggest USD first), so the cards list real rows', async () => {
    const d = (await summary()).body.data;
    expect(d.top_deals.commit.map((x: { name: string }) => x.name)).toEqual(['Neg', 'Twin B', 'Twin A', 'Explicit', 'INR commit']);
  });

  it('a snapshot IS the summary, written by the server: USD sums plus unconverted, user_id and rep_name', async () => {
    const res = await snap({ period_label: PERIOD, today: INSIDE });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    const rows = (await list()).body.data as { user_id: number | null; rep_name: string; commit: string; closed: string; unconverted: number; deal_count: number }[];
    const mine = rows.find(r => r.user_id === Number(ws.userId))!;
    expect(parseFloat(mine.commit)).toBe(1050);
    expect(parseFloat(mine.closed)).toBe(2000);
    expect(mine.unconverted).toBe(1);
    expect(mine.deal_count).toBe(6);
    expect(mine.rep_name).toBe('Round Tripper');
    // An unattributed rep is RECORDED, by name, not dropped.
    expect(rows.find(r => r.user_id === null && r.rep_name === 'Legacy Rep')).toBeDefined();
    // Two people sharing a display name: two rows.
    expect(rows.filter(r => r.rep_name === 'Sam Rao').map(r => r.user_id).sort()).toEqual([Number(twinA.userId), Number(twinB.userId)].sort());
  });

  it('figures in the body are REFUSED — an old client cannot store capped numbers', async () => {
    const res = await snap({ period_label: PERIOD, today: INSIDE, reps: [{ rep_name: 'X', commit: 1 }] });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/computed by the server/);
  });

  it('re-snapshotting the same day UPDATES (no duplicates) and picks up the change', async () => {
    const before = (await list()).body.data.length;
    await deal({ name: 'Late add', stage: 'negotiation', value: 5, close: '2031-03-30', user: ws.userId });
    try {
      expect((await snap({ period_label: PERIOD, today: INSIDE })).status).toBe(201);
      const rows = (await list()).body.data;
      expect(rows.length).toBe(before);
      expect(parseFloat(rows.find((r: { user_id: number }) => r.user_id === Number(ws.userId)).commit)).toBe(1055);
    } finally {
      await pool.query(`DELETE FROM deals WHERE tenant_id = $1 AND name = 'Late add'`, [ws.tenantId]);
    }
  });

  it('snapshots are workspace-scoped, and an empty quarter is a 409 rather than an empty write', async () => {
    expect((await list(other)).body.data).toHaveLength(0);
    const empty = await request(app).post('/api/v1/forecast/snapshots').set(auth(other)).send({ period_label: 'Q3 2031', today: INSIDE });
    expect(empty.status).toBe(409);
  });

  it('deleting a user KEEPS the snapshot and nulls the reference', async () => {
    await pool.query('UPDATE deals SET assigned_to_user_id = NULL WHERE assigned_to_user_id = $1', [twinA.userId]);
    await pool.query('DELETE FROM users WHERE id = $1', [twinA.userId]);
    const kept = await pool.query(
      `SELECT user_id, rep_name FROM forecast_snapshots WHERE tenant_id = $1 AND rep_name = 'Sam Rao' AND user_id IS NULL`, [ws.tenantId]);
    expect(kept.rowCount).toBe(1);
  });

  it('refuses a missing period, a malformed period or day', async () => {
    expect((await request(app).get('/api/v1/forecast/snapshots').set(auth(ws))).status).toBe(400);
    expect((await request(app).get('/api/v1/forecast/summary').query({ period: 'Q5 2031', today: INSIDE }).set(auth(ws))).status).toBe(400);
    expect((await request(app).get('/api/v1/forecast/summary').query({ period: PERIOD, today: '15/02/2031' }).set(auth(ws))).status).toBe(400);
    expect((await snap({ period_label: PERIOD })).status).toBe(400);
  });

  it('at 10,000 deals the category totals match SQL', async () => {
    const big = await setupWorkspace('fcst-10k');
    try {
      const ids = (await pool.query(`SELECT id, slug FROM pipeline_stages WHERE tenant_id = $1 ORDER BY position`, [big.tenantId])).rows.map(r => r.id);
      await pool.query(
        `INSERT INTO deals (name, value, currency, base_amount_usd, stage_id, expected_close_date, assigned_to, pipeline_id, tenant_id)
         SELECT 'S' || g, g, 'USD', g, ($2::uuid[])[1 + (g % array_length($2::uuid[], 1))], DATE '2031-01-01' + (g % 90), 'Rep ' || (g % 5), 'new-business', $1
           FROM generate_series(1, 10000) g`, [big.tenantId, ids]);
      const d = (await request(app).get('/api/v1/forecast/summary').query({ period: PERIOD, today: INSIDE }).set(auth(big))).body.data;
      const sql = (await pool.query(
        `SELECT count(*) FILTER (WHERE ps.slug = 'negotiation')::int AS commit, count(*) FILTER (WHERE ps.stage_type = 'won')::int AS closed,
                count(*) FILTER (WHERE ps.slug = 'proposal')::int AS best, count(*) FILTER (WHERE ps.stage_type = 'open' AND ps.slug NOT IN ('negotiation','proposal'))::int AS pipe
           FROM deals d JOIN pipeline_stages ps ON ps.id = d.stage_id
          WHERE d.tenant_id = $1 AND d.expected_close_date BETWEEN '2031-01-01' AND '2031-03-31'`, [big.tenantId])).rows[0];
      expect(d.categories.commit.count).toBe(sql.commit);
      expect(d.categories.closed.count).toBe(sql.closed);
      expect(d.categories['best-case'].count).toBe(sql.best);
      expect(d.categories.pipeline.count).toBe(sql.pipe);
      expect(d.reps).toHaveLength(5);
    } finally {
      await pool.query('DELETE FROM deals WHERE tenant_id = $1', [big.tenantId]);
      await teardownWorkspace(big);
    }
  }, 60_000);
});
