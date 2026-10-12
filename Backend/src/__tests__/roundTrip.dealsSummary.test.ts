import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';

/**
 * Group A item 4, slice 5a — GET /deals/summary: workspace-wide totals the
 * dashboards and Reports counted in the browser from the 500 newest deals.
 * Open / won / lost by stage_type across every pipeline; USD summed only where
 * trustworthy (the rest counted "not in USD"); win rate = won / (won + lost),
 * all time, with its sample; closing soon = the viewer's next 7 days.
 */
describe('deals summary', () => {
  let ws: TestWorkspace;
  let other: TestWorkspace;
  const TODAY = '2031-03-15';
  const stage: Record<string, string> = {};
  let renewWon: string;

  const deal = (t: string, name: string, stageId: string, value: number, currency: string, base: number | null,
    extra: { close?: string; is_test?: boolean; is_archived?: boolean; pipeline?: string } = {}) =>
    pool.query(
      `INSERT INTO deals (name, value, currency, base_amount_usd, stage_id, expected_close_date, is_test, is_archived, pipeline_id, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [name, value, currency, base, stageId, extra.close ?? null, extra.is_test ?? false, extra.is_archived ?? false, extra.pipeline ?? 'new-business', t]);

  beforeAll(async () => {
    ws = await setupWorkspace('dealsummary');
    other = await setupWorkspace('dealsummary-other');
    for (const r of (await pool.query('SELECT id, slug FROM pipeline_stages WHERE tenant_id = $1', [ws.tenantId])).rows) stage[r.slug] = r.id;
    // A second pipeline, so "across all pipelines" is actually exercised.
    const p = (await pool.query(
      `INSERT INTO pipelines (name, slug, is_default, is_active, tenant_id) VALUES ('Renewals', 'renewals', false, true, $1) RETURNING id`,
      [ws.tenantId])).rows[0].id;
    renewWon = (await pool.query(
      `INSERT INTO pipeline_stages (pipeline_id, tenant_id, slug, name, stage_type, probability, color, position)
       VALUES ($1, $2, 'renewed', 'Renewed', 'won', 100, '#10B981', 1) RETURNING id`, [p, ws.tenantId])).rows[0].id;

    const t = ws.tenantId;
    await deal(t, 'Open USD soon', stage.proposal, 1000, 'USD', 1000, { close: '2031-03-21' });   // today + 6: in
    await deal(t, 'Open USD later', stage.qualified, 2000, 'USD', 2000, { close: '2031-03-22' }); // today + 7: out
    await deal(t, 'Open USD past', stage.prospecting, 300, 'USD', 300, { close: '2031-03-14' });  // yesterday: out
    await deal(t, 'Open INR unknown', stage.negotiation, 125000, 'INR', null, { close: '2031-03-15' }); // soon, not in USD
    await deal(t, 'Won USD', stage['closed-won'], 500, 'USD', 500);
    await deal(t, 'Won AED converted', stage['closed-won'], 3670, 'AED', 1000);
    await deal(t, 'Renewal won', renewWon, 700, 'USD', 700, { pipeline: 'renewals' });
    await deal(t, 'Lost 1', stage['closed-lost'], 100, 'USD', 100);
    await deal(t, 'Lost 2', stage['closed-lost'], 100, 'USD', 100);
    // Excluded everywhere:
    await deal(t, 'Test deal', stage['closed-won'], 9999, 'USD', 9999, { is_test: true });
    await deal(t, 'Archived deal', stage.proposal, 9999, 'USD', 9999, { is_archived: true });
    const theirs = (await pool.query(`SELECT id FROM pipeline_stages WHERE tenant_id = $1 AND slug = 'closed-won'`, [other.tenantId])).rows[0].id;
    await deal(other.tenantId, 'Foreign won', theirs, 50000, 'USD', 50000);
  });
  afterAll(async () => {
    for (const w of [ws, other]) {
      await pool.query('DELETE FROM deal_stage_history WHERE tenant_id = $1', [w.tenantId]);
      await pool.query('DELETE FROM deals WHERE tenant_id = $1', [w.tenantId]);
      await teardownWorkspace(w);
    }
  });
  const get = (q: Record<string, string>) => request(app).get('/api/v1/deals/summary').query(q).set(auth(ws));

  it('totals by stage_type across pipelines; USD only where trusted; test, archived and other workspaces excluded', async () => {
    const res = await get({ today: TODAY });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    const d = res.body.data;
    expect(d).toMatchObject({
      as_of: TODAY, total: 9, unstaged: 0,
      open: { count: 4, value_usd: 3300, unconverted: 1 },
      won: { count: 3, value_usd: 2200, unconverted: 0 },
      lost: { count: 2 },
    });
  });

  it('win rate is won / (won + lost), all pipelines, with its sample', async () => {
    const d = (await get({ today: TODAY })).body.data;
    expect(d.win_rate).toEqual({ value: 3 / 5, won: 3, lost: 2, sample_size: 5 });
  });

  it('closing soon is the viewer\'s next 7 calendar days (today .. today + 6), open deals only', async () => {
    const d = (await get({ today: TODAY })).body.data;
    expect(d.closing_soon).toEqual({ days: 7, count: 2, value_usd: 1000, unconverted: 1 });
    // A different viewer day moves the window: from the 16th the 22nd is in and the 15th is out.
    const next = (await get({ today: '2031-03-16' })).body.data;
    expect(next.closing_soon).toMatchObject({ count: 2, value_usd: 3000, unconverted: 0 });
  });

  it('by_stage covers every pipeline, in order, and sums back to the totals', async () => {
    const d = (await get({ today: TODAY })).body.data;
    const rows = d.by_stage as { pipeline_id: string; slug: string; stage_type: string; count: number; value_usd: number; unconverted: number }[];
    expect(rows.map(r => `${r.pipeline_id}/${r.slug}`)).toEqual([
      'new-business/prospecting', 'new-business/qualified', 'new-business/proposal', 'new-business/negotiation',
      'new-business/closed-won', 'new-business/closed-lost', 'renewals/renewed',
    ]);
    const sum = (t: string, k: 'count' | 'value_usd' | 'unconverted') => rows.filter(r => r.stage_type === t).reduce((n, r) => n + r[k], 0);
    expect(sum('open', 'count')).toBe(d.open.count);
    expect(sum('open', 'value_usd')).toBe(d.open.value_usd);
    expect(sum('won', 'count')).toBe(d.won.count);
    expect(sum('lost', 'count')).toBe(d.lost.count);
  });

  it('no decided deals -> win rate null, not 0%', async () => {
    const res = await request(app).get('/api/v1/deals/summary').query({ today: TODAY }).set(auth(other));
    expect(res.body.data.win_rate).toEqual({ value: 1, won: 1, lost: 0, sample_size: 1 });
    const empty = await setupWorkspace('dealsummary-empty');
    try {
      const e = await request(app).get('/api/v1/deals/summary').query({ today: TODAY }).set(auth(empty));
      expect(e.body.data.win_rate).toEqual({ value: null, won: 0, lost: 0, sample_size: 0 });
      expect(e.body.data.total).toBe(0);
    } finally { await teardownWorkspace(empty); }
  });

  it('refuses a missing or malformed ?today=', async () => {
    for (const q of [{}, { today: '15/03/2031' }, { today: '2031-02-30' }]) {
      expect((await get(q as Record<string, string>)).status, JSON.stringify(q)).toBe(400);
    }
  });

  it('GET /deals?stage_type=open lists open deals across pipelines, by USD value; unknown types are a 400', async () => {
    const res = await request(app).get('/api/v1/deals').query({ stage_type: 'open', sort: 'base_amount_usd', dir: 'desc', limit: 3 }).set(auth(ws));
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.total).toBe(4);
    expect(res.body.data.map((x: { name: string }) => x.name)).toEqual(['Open USD later', 'Open USD soon', 'Open USD past']);
    const won = await request(app).get('/api/v1/deals').query({ stage_type: 'won' }).set(auth(ws));
    expect(won.body.total).toBe(3);
    expect((await request(app).get('/api/v1/deals').query({ stage_type: 'closed' }).set(auth(ws))).status).toBe(400);
  });

  it('at 10,000 deals the summary matches SQL', async () => {
    const big = await setupWorkspace('dealsummary-10k');
    try {
      const st = (await pool.query('SELECT id, stage_type FROM pipeline_stages WHERE tenant_id = $1 ORDER BY position', [big.tenantId])).rows;
      await pool.query(
        `INSERT INTO deals (name, value, currency, base_amount_usd, stage_id, tenant_id)
         SELECT 'Scale ' || g, g, CASE WHEN g % 4 = 0 THEN 'INR' ELSE 'USD' END,
                CASE WHEN g % 4 = 0 THEN NULL ELSE g END,
                ($2::uuid[])[1 + (g % array_length($2::uuid[], 1))], $1
           FROM generate_series(1, 10000) g`, [big.tenantId, st.map(r => r.id)]);
      const d = (await request(app).get('/api/v1/deals/summary').query({ today: TODAY }).set(auth(big))).body.data;
      const sql = (await pool.query(
        `SELECT count(*) FILTER (WHERE ps.stage_type = 'open')::int AS open,
                count(*) FILTER (WHERE ps.stage_type = 'won')::int AS won,
                count(*) FILTER (WHERE ps.stage_type = 'lost')::int AS lost,
                COALESCE(sum(d.base_amount_usd) FILTER (WHERE ps.stage_type = 'open' AND d.currency = 'USD'), 0)::float8 AS open_usd,
                count(*) FILTER (WHERE ps.stage_type = 'open' AND d.base_amount_usd IS NULL)::int AS open_unconv
           FROM deals d JOIN pipeline_stages ps ON ps.id = d.stage_id WHERE d.tenant_id = $1`, [big.tenantId])).rows[0];
      expect(d.total).toBe(10000);
      expect(d.open).toEqual({ count: sql.open, value_usd: sql.open_usd, unconverted: sql.open_unconv });
      expect(d.won.count).toBe(sql.won);
      expect(d.lost.count).toBe(sql.lost);
    } finally {
      await pool.query('DELETE FROM deals WHERE tenant_id = $1', [big.tenantId]);
      await teardownWorkspace(big);
    }
  }, 60_000);
});
