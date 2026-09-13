import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, addUserWithRole, TestWorkspace } from './helpers';

/**
 * GET /targets/projection against real Postgres, fed by deals moved through
 * the REAL stage-transition endpoint — so the close times the projection reads
 * are the deal_stage_history rows the product actually writes.
 *
 * The one thing done by SQL is BACKDATING: a closure has to be months old to
 * be history, and no endpoint writes the past. Only `changed_at` and
 * `created_at` are moved; the rows themselves come from the API.
 *
 * CLOCK-INDEPENDENT on purpose. The endpoint uses the real clock, so the
 * period is "the current quarter", computed here the same way, and every date
 * is relative to it. A test hardcoded to Q3 2026 would start failing on 1 Oct.
 */

const DAY = 86_400_000;
const now = new Date();
const q = Math.floor(now.getUTCMonth() / 3);
const QSTART = new Date(Date.UTC(now.getUTCFullYear(), q * 3, 1));
const QEND = new Date(Date.UTC(now.getUTCFullYear(), q * 3 + 3, 1));
const PERIOD = `Q${q + 1} ${now.getUTCFullYear()}`;
const iso = (d: Date) => d.toISOString().slice(0, 10);

describe('Projection — real history through the real endpoints', () => {
  let ws: TestWorkspace;
  let rep: TestWorkspace;
  let other: TestWorkspace;
  let n = 0;

  const createDeal = async (as: TestWorkspace, body: Record<string, unknown>) => {
    const res = await request(app).post('/api/v1/deals').set(auth(as)).send({
      name: `Proj ${Date.now()}-${++n}`, currency: 'USD', stage: 'prospecting', ...body,
    });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    return res.body.data.id as string;
  };

  /**
   * Close a deal through the real endpoint, then move its history back in time:
   * closed `closedDaysBeforeQuarter` days before this quarter began, created
   * `cycleDays` before that.
   */
  const closeDeal = async (
    as: TestWorkspace, ownerId: string, outcome: 'won' | 'lost', value: number,
    closedDaysBeforeQuarter: number, cycleDays = 60, extra: Record<string, unknown> = {},
  ) => {
    const id = await createDeal(as, { value, assigned_to_user_id: Number(ownerId), ...extra });
    const move = await request(app).post(`/api/v1/deals/${id}/stage-transition`).set(auth(as))
      .send({ to_stage: outcome === 'won' ? 'closed-won' : 'closed-lost' });
    expect(move.status, JSON.stringify(move.body)).toBe(200);
    const closedAt = new Date(QSTART.getTime() - closedDaysBeforeQuarter * DAY);
    await pool.query('UPDATE deal_stage_history SET changed_at = $2 WHERE deal_id = $1', [id, closedAt]);
    await pool.query('UPDATE deals SET created_at = $2 WHERE id = $1',
      [id, new Date(closedAt.getTime() - cycleDays * DAY)]);
    return id;
  };

  const projectionFor = async (userId: string) => {
    const res = await request(app).get(`/api/v1/targets/projection?period=${encodeURIComponent(PERIOD)}`).set(auth(ws));
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    const row = res.body.data.find((r: { user_id: number }) => r.user_id === Number(userId));
    expect(row, 'rep missing from projection').toBeDefined();
    return { row, body: res.body };
  };

  beforeAll(async () => {
    ws = await setupWorkspace('projection');
    rep = await addUserWithRole(ws, 'sales');
    other = await setupWorkspace('projection-other');
    const quota = await request(app).put('/api/v1/quotas').set(auth(ws))
      .send({ user_id: Number(rep.userId), period_label: PERIOD, quota_amount: 100000, currency: 'USD' });
    expect(quota.status, JSON.stringify(quota.body)).toBe(200);
  });

  afterAll(async () => {
    await pool.query('DELETE FROM quotas WHERE tenant_id = ANY($1::uuid[])', [[ws.tenantId, other.tenantId]]);
    await teardownWorkspace(other);
    await teardownWorkspace(ws);
    const left = await pool.query(
      'SELECT COUNT(*)::int AS n FROM deals WHERE tenant_id = ANY($1::uuid[])', [[ws.tenantId, other.tenantId]]);
    if (left.rows[0].n !== 0) throw new Error(`Cleanup failed: ${left.rows[0].n} deals remain`);
  });

  it('LIVE-LIKE: two dated closures and one undated -> "not enough historical data yet", nothing projected', async () => {
    await closeDeal(ws, rep.userId, 'won', 50000, 30);
    await closeDeal(ws, rep.userId, 'lost', 50000, 40);
    // Created directly in a won stage: createDeal writes no history, so this
    // deal is closed with NO recorded close time — the state of live D005.
    await createDeal(ws, { value: 55000, stage: 'closed-won', assigned_to_user_id: Number(rep.userId) });

    // Twelve closures in ANOTHER workspace, ten of them wins. If the loader's
    // tenant predicate slipped, these alone would clear the bar.
    for (let i = 0; i < 12; i++) {
      await closeDeal(other, other.userId, i < 10 ? 'won' : 'lost', 70000, 20 + i);
    }

    const { row, body } = await projectionFor(rep.userId);
    expect(row.status).toBe('not_enough_data');
    expect(row.win_rate.value).toBeNull();
    expect(row.required_pipeline).toBeNull();
    expect(row.coverage_ratio).toBeNull();
    expect(row.required_coverage_ratio).toBeNull();
    expect(row.required_qualified_leads).toBeNull();
    expect(row.status_reason).toMatch(/^Not enough historical data yet: 2 deals closed with a recorded close date/);
    expect(row.status_reason).toMatch(/1 more closed deal has no recorded close date/);
    expect(row.excluded.closed_without_close_date).toBe(1);
    expect(body.rules.MIN_CLOSED_FOR_WIN_RATE).toBe(10);
  });

  it('test-flagged deals never count toward the history', async () => {
    for (let i = 0; i < 8; i++) {
      await closeDeal(ws, rep.userId, 'won', 50000, 50 + i, 60, { is_test: true });
    }
    const { row } = await projectionFor(rep.userId);
    expect(row.status).toBe('not_enough_data');
    expect(row.win_rate.sample_size).toBe(2);
  });

  it('with ten dated closures the figures are computed — and match an independent SQL count', async () => {
    // 3 more wins and 5 more losses: 4 won / 6 lost in total, all the rep's.
    for (const [outcome, value, days] of [
      ['won', 60000, 60], ['won', 70000, 70], ['won', 80000, 80],
      ['lost', 10000, 90], ['lost', 10000, 100], ['lost', 10000, 110], ['lost', 10000, 120], ['lost', 10000, 130],
    ] as const) {
      await closeDeal(ws, rep.userId, outcome, value, days);
    }

    // Open pipeline for this quarter. The negotiation deal closes on the
    // quarter's FIRST DAY: read as local midnight in Asia/Kolkata it would
    // fall into the previous quarter and this test would see 150000.
    await createDeal(ws, { value: 150000, assigned_to_user_id: Number(rep.userId),
      expected_close_date: iso(new Date(QEND.getTime() - DAY)) });
    await createDeal(ws, { value: 100000, stage: 'negotiation', assigned_to_user_id: Number(rep.userId),
      expected_close_date: iso(QSTART) });
    // Left out, each for a stated reason:
    await createDeal(ws, { value: 999999, assigned_to_user_id: Number(rep.userId) });                   // no close date
    await createDeal(ws, { value: 50000, currency: 'AED', assigned_to_user_id: Number(rep.userId),
      expected_close_date: iso(QSTART) });                                                               // other currency
    await createDeal(ws, { value: 777777, assigned_to_user_id: Number(rep.userId),
      expected_close_date: iso(QEND) });                                                                 // next quarter

    // THE INDEPENDENT CHECK: count from Postgres directly, not via the service.
    const sql = await pool.query(
      `SELECT ps.stage_type, COUNT(*)::int AS n
         FROM deals d
         JOIN pipeline_stages ps ON ps.id = d.stage_id AND ps.tenant_id = d.tenant_id
         JOIN deal_stage_history h ON h.deal_id = d.id AND h.tenant_id = d.tenant_id AND h.to_stage = ps.slug
        WHERE d.tenant_id = $1 AND d.is_test = false AND ps.stage_type IN ('won', 'lost')
          AND h.changed_at > NOW() - INTERVAL '365 days'
        GROUP BY ps.stage_type`, [ws.tenantId]);
    const counts = Object.fromEntries(sql.rows.map(r => [r.stage_type, r.n]));
    expect(counts).toEqual({ won: 4, lost: 6 });

    const { row } = await projectionFor(rep.userId);
    expect(row.win_rate.value).toBe(counts.won / (counts.won + counts.lost));   // 0.4
    expect(row.win_rate.basis).toBe('rep');
    expect(row.required_pipeline).toBe(250000);                                // 100000 / 0.4
    expect(row.pipeline.value).toBe(250000);                                   // 150000 + 100000
    expect(row.status).toBe('on_track');
    expect(row.coverage_ratio).toBe(2.5);
    expect(row.pipeline.stages.map((s: { slug: string; value: number }) => [s.slug, s.value]))
      .toEqual([['prospecting', 150000], ['negotiation', 100000]]);
    expect(row.excluded.open_deals_without_close_date).toBe(1);
    expect(row.excluded.open_deals_other_currency).toEqual({ AED: { count: 1, value: 50000 } });

    // Win rate is trustworthy; deal size is NOT yet (4 won < 5), and says so.
    expect(row.average_deal_size.value).toBeNull();
    expect(row.required_qualified_leads).toBeNull();
    expect(row.required_qualified_leads_reason).toMatch(/4 won deals in USD/);
    expect(row.sales_cycle_days.value).toBeNull();
  });

  it('a person with no quota is reported as no_quota, not as zero', async () => {
    const { row } = await projectionFor(ws.userId);
    expect(row.status).toBe('no_quota');
    expect(row.attained).toBeNull();
    expect(row.required_pipeline).toBeNull();
  });

  it('refuses an unparseable period rather than guessing one', async () => {
    const res = await request(app).get('/api/v1/targets/projection?period=this%20quarter').set(auth(ws));
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/calendar quarter/);
  });
});
