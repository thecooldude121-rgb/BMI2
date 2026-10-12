import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';

/**
 * Group A item 4, slice 5b — GET /deals/report: the totals behind the Reports
 * page's eight cards, which were computed in the browser from the 500 newest
 * deals. Filters as the cards declare them: the close-date range applies to
 * every card but aging; the owner applies to all. Money: trusted USD only.
 */
describe('deals report', () => {
  let ws: TestWorkspace;
  let other: TestWorkspace;
  const TODAY = '2031-03-15';
  const st: Record<string, string> = {};

  const deal = (o: {
    name: string; stage: string; value: number; currency?: string; base?: number | null; close?: string | null;
    user?: boolean; ownerName?: string | null; source?: string | null; priority?: string | null; ageDays?: number;
  }) => pool.query(
    `INSERT INTO deals (name, value, currency, base_amount_usd, stage_id, expected_close_date, assigned_to_user_id, assigned_to,
                        source, priority, created_at, pipeline_id, tenant_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, NOW() - make_interval(days => $11), 'new-business', $12)`,
    [o.name, o.value, o.currency ?? 'USD', o.base === undefined ? o.value : o.base, st[o.stage], o.close ?? null,
      o.user ? ws.userId : null, o.ownerName ?? null, o.source ?? null, o.priority ?? null, o.ageDays ?? 1, ws.tenantId]);

  beforeAll(async () => {
    ws = await setupWorkspace('dealsreport');
    other = await setupWorkspace('dealsreport-other');
    for (const r of (await pool.query('SELECT id, slug FROM pipeline_stages WHERE tenant_id = $1', [ws.tenantId])).rows) st[r.slug] = r.id;
    // Won
    await deal({ name: 'W1', stage: 'closed-won', value: 1000, user: true, source: 'referral', close: '2031-03-10' });
    await deal({ name: 'W2', stage: 'closed-won', value: 2000, ownerName: 'Legacy Rep', source: 'referral', close: '2031-04-20' });
    await deal({ name: 'W3', stage: 'closed-won', value: 125000, currency: 'INR', base: null, source: null, close: '2031-03-12' });
    // Lost
    await deal({ name: 'L1', stage: 'closed-lost', value: 100, user: true, close: '2031-03-11' });
    // Open
    await deal({ name: 'O1', stage: 'proposal', value: 500, user: true, priority: 'high', close: '2031-03-18', ageDays: 10 });
    await deal({ name: 'O2', stage: 'qualified', value: 700, ownerName: 'Legacy Rep', priority: 'High', close: null, ageDays: 45 });
    await deal({ name: 'O3', stage: 'proposal', value: 300, priority: 'low', close: '2031-05-01', ageDays: 100 });
    // Excluded
    await pool.query(`INSERT INTO deals (name, value, currency, base_amount_usd, stage_id, is_test, pipeline_id, tenant_id) VALUES ('T', 9, 'USD', 9, $1, true, 'new-business', $2)`, [st['closed-won'], ws.tenantId]);
    const theirs = (await pool.query(`SELECT id FROM pipeline_stages WHERE tenant_id = $1 AND slug = 'closed-won'`, [other.tenantId])).rows[0].id;
    await pool.query(`INSERT INTO deals (name, value, currency, base_amount_usd, stage_id, source, pipeline_id, tenant_id) VALUES ('F', 99999, 'USD', 99999, $1, 'referral', 'new-business', $2)`, [theirs, other.tenantId]);
    // Leads for the funnel
    for (const [stage, n] of [['qualified', 3], ['won', 2], ['converted', 4], ['lost', 1], ['disqualified', 2]] as const) {
      for (let i = 0; i < n; i++) {
        // A converted lead must carry converted_at (migration 059's CHECK).
        await pool.query(`INSERT INTO leads (first_name, last_name, email, stage, converted_at, tenant_id)
                          VALUES ($1, 'Lead', $2, $3::text, CASE WHEN $3::text = 'converted' THEN NOW() END, $4)`,
          [`L ${stage} ${i}`, `l-${stage}-${i}-${Date.now()}@rp.example`, stage, ws.tenantId]);
      }
    }
  });
  afterAll(async () => {
    for (const w of [ws, other]) {
      await pool.query('DELETE FROM deal_stage_history WHERE tenant_id = $1', [w.tenantId]);
      await pool.query('DELETE FROM deals WHERE tenant_id = $1', [w.tenantId]);
      await pool.query('DELETE FROM lead_stage_history WHERE tenant_id = $1', [w.tenantId]);
      await pool.query('DELETE FROM leads WHERE tenant_id = $1', [w.tenantId]);
      await teardownWorkspace(w);
    }
  });
  const get = (q: Record<string, string>) => request(app).get('/api/v1/deals/report').query({ today: TODAY, ...q }).set(auth(ws));
  const me = () => `id:${ws.userId}`;

  it('unfiltered: every card\'s totals, trusted USD only, test and other workspaces excluded', async () => {
    const res = await get({});
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    const d = res.body.data;
    expect(d.outcome).toEqual({ won: 3, lost: 1 });
    expect(d.won_by_owner).toEqual([
      { key: 'name:Legacy Rep', label: 'Legacy Rep', unresolved: true, value_usd: 2000, unconverted: 0, count: 1 },
      { key: me(), label: 'Round Tripper', unresolved: false, value_usd: 1000, unconverted: 0, count: 1 },
      { key: 'name:Unassigned', label: 'Unassigned', unresolved: true, value_usd: 0, unconverted: 1, count: 1 },
    ]);
    expect(d.open_by_stage.map((r: { name: string; count: number; value_usd: number }) => [r.name, r.count, r.value_usd]))
      .toEqual([['Qualified', 1, 700], ['Proposal', 2, 800]]);
    expect(d.won_by_source).toEqual([
      { source: 'referral', value_usd: 3000, unconverted: 0, count: 2 },
      { source: null, value_usd: 0, unconverted: 1, count: 1 },
    ]);
    expect(Object.fromEntries(d.aging.map((a: { bucket: string; count: number }) => [a.bucket, a.count])))
      .toEqual({ 'under-30': 1, '30-60': 1, 'over-90': 1 });
    expect(d.high_priority).toEqual({
      all: { count: 2, value_usd: 1200, unconverted: 0 },
      open: { count: 2, value_usd: 1200, unconverted: 0 },
      closing_7d: 1, open_no_close: 1,
    });
    expect(d.excluded_no_close_date).toBe(0);
    // Owner options come from ALL deals, including names that match no user.
    expect(d.owners.map((o: { key: string }) => o.key).sort()).toEqual([me(), 'name:Legacy Rep', 'name:Unassigned'].sort());
  });

  it('a close-date range narrows every card except aging, and counts what it excluded', async () => {
    const d = (await get({ close_from: '2031-03-01', close_to: '2031-03-31' })).body.data;
    expect(d.outcome).toEqual({ won: 2, lost: 1 });          // W2 closes in April
    expect(d.open_by_stage.map((r: { count: number }) => r.count)).toEqual([1]); // only O1
    expect(d.excluded_no_close_date).toBe(1);                // O2
    expect(d.aging.reduce((n: number, a: { count: number }) => n + a.count, 0)).toBe(3); // unchanged
  });

  it('an owner key narrows every card, aging included', async () => {
    const d = (await get({ owner: me() })).body.data;
    expect(d.outcome).toEqual({ won: 1, lost: 1 });
    expect(d.won_by_owner.map((r: { key: string }) => r.key)).toEqual([me()]);
    expect(d.aging.reduce((n: number, a: { count: number }) => n + a.count, 0)).toBe(1);
    const legacy = (await get({ owner: 'name:Legacy Rep', close_from: '2031-03-01', close_to: '2031-03-31' })).body.data;
    expect(legacy.excluded_no_close_date).toBe(1);
    expect(legacy.outcome).toEqual({ won: 0, lost: 0 });
  });

  it('a rep NAMED with the same digits as a user id stays a separate owner', async () => {
    await deal({ name: 'Digits', stage: 'closed-won', value: 50, ownerName: String(ws.userId) });
    try {
      const d = (await get({})).body.data;
      const keys = d.won_by_owner.map((r: { key: string }) => r.key);
      expect(keys).toContain(me());
      expect(keys).toContain(`name:${ws.userId}`);
      expect(d.won_by_owner.find((r: { key: string }) => r.key === me()).count).toBe(1);
    } finally {
      await pool.query(`DELETE FROM deals WHERE tenant_id = $1 AND name = 'Digits'`, [ws.tenantId]);
    }
  });

  it('refuses bad days, half a range and malformed owner keys', async () => {
    for (const q of [{ today: 'x' }, { close_from: '2031-03-01' }, { close_from: '2031-02-30', close_to: '2031-03-01' }, { owner: 'bob' }]) {
      expect((await get(q as Record<string, string>)).status, JSON.stringify(q)).toBe(400);
    }
  });

  it('GET /leads/summary carries every stage\'s count for the funnel', async () => {
    const res = await request(app).get('/api/v1/leads/summary').set(auth(ws));
    expect(res.status).toBe(200);
    expect(res.body.data.by_stage).toEqual({ qualified: 3, won: 2, converted: 4, lost: 1, disqualified: 2 });
  });

  it('at 10,000 deals the per-owner and outcome totals match SQL', async () => {
    const big = await setupWorkspace('dealsreport-10k');
    try {
      const ids = (await pool.query(`SELECT id FROM pipeline_stages WHERE tenant_id = $1 ORDER BY position`, [big.tenantId])).rows.map(r => r.id);
      await pool.query(
        `INSERT INTO deals (name, value, currency, base_amount_usd, stage_id, assigned_to, pipeline_id, tenant_id)
         SELECT 'S' || g, g, 'USD', g, ($2::uuid[])[1 + (g % array_length($2::uuid[], 1))], 'Rep ' || (g % 7), 'new-business', $1
           FROM generate_series(1, 10000) g`, [big.tenantId, ids]);
      const d = (await request(app).get('/api/v1/deals/report').query({ today: TODAY }).set(auth(big))).body.data;
      const sql = (await pool.query(
        `SELECT count(*) FILTER (WHERE ps.stage_type = 'won')::int AS won, count(*) FILTER (WHERE ps.stage_type = 'lost')::int AS lost,
                COALESCE(sum(d.base_amount_usd) FILTER (WHERE ps.stage_type = 'won'), 0)::float8 AS won_usd
           FROM deals d JOIN pipeline_stages ps ON ps.id = d.stage_id WHERE d.tenant_id = $1`, [big.tenantId])).rows[0];
      expect(d.outcome).toEqual({ won: sql.won, lost: sql.lost });
      expect(d.won_by_owner.reduce((n: number, r: { value_usd: number }) => n + r.value_usd, 0)).toBe(sql.won_usd);
      expect(d.won_by_owner).toHaveLength(7);
    } finally {
      await pool.query('DELETE FROM deals WHERE tenant_id = $1', [big.tenantId]);
      await teardownWorkspace(big);
    }
  }, 60_000);
});
