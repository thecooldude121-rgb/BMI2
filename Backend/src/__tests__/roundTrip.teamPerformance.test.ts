import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, addUserWithRole, TestWorkspace } from './helpers';

/**
 * Group A item 4, slice 5c — GET /users/performance: per-person rollups the
 * Team pages summed in the browser from the 500 newest deals (native amounts
 * across currencies). By stage_type, every pipeline; trusted USD only; win
 * rate won / (won + lost), all time, with its sample; unowned deals reported,
 * never dropped.
 */
describe('team performance rollups', () => {
  let ws: TestWorkspace;
  let rep: TestWorkspace;
  let other: TestWorkspace;
  const st: Record<string, string> = {};
  const deal = (name: string, stage: string, value: number, user: string | number | null, o: { currency?: string; base?: number | null; ownerName?: string; is_test?: boolean } = {}, t?: string, stageId?: string) =>
    pool.query(
      `INSERT INTO deals (name, value, currency, base_amount_usd, stage_id, assigned_to_user_id, assigned_to, is_test, pipeline_id, tenant_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'new-business',$9)`,
      [name, value, o.currency ?? 'USD', o.base === undefined ? value : o.base, stageId ?? st[stage], user, o.ownerName ?? null, o.is_test ?? false, t ?? ws.tenantId]);

  beforeAll(async () => {
    ws = await setupWorkspace('teamperf');
    other = await setupWorkspace('teamperf-other');
    rep = await addUserWithRole(ws, 'sales');
    for (const r of (await pool.query('SELECT id, slug FROM pipeline_stages WHERE tenant_id = $1', [ws.tenantId])).rows) st[r.slug] = r.id;
    await deal('Me open', 'proposal', 1000, ws.userId);
    await deal('Me open INR', 'qualified', 125000, ws.userId, { currency: 'INR', base: null });
    await deal('Me won', 'closed-won', 2000, ws.userId);
    await deal('Me lost', 'closed-lost', 100, ws.userId);
    await deal('Rep won', 'closed-won', 500, rep.userId);
    await deal('Rep test won', 'closed-won', 9999, rep.userId, { is_test: true });
    await deal('Orphan named', 'proposal', 700, null, { ownerName: 'John Smith' });
    await deal('Orphan blank', 'closed-won', 300, null);
    const theirStage = (await pool.query(`SELECT id FROM pipeline_stages WHERE tenant_id = $1 AND slug = 'closed-won'`, [other.tenantId])).rows[0].id;
    await deal('Foreign', 'closed-won', 50000, other.userId, {}, other.tenantId, theirStage);
  });
  afterAll(async () => {
    for (const w of [ws, other]) {
      await pool.query('DELETE FROM deal_stage_history WHERE tenant_id = $1', [w.tenantId]);
      await pool.query('DELETE FROM deals WHERE tenant_id = $1', [w.tenantId]);
      await teardownWorkspace(w);
    }
  });

  it('per person, by stage_type, trusted USD only, with the win rate and its sample', async () => {
    const res = await request(app).get('/api/v1/users/performance').set(auth(ws));
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    const byId = new Map(res.body.data.members.map((m: { user_id: number }) => [m.user_id, m]));
    expect(byId.get(Number(ws.userId))).toEqual({
      user_id: Number(ws.userId),
      open: { count: 2, value_usd: 1000, unconverted: 1 },
      won: { count: 1, value_usd: 2000, unconverted: 0 },
      lost: { count: 1 },
      win_rate: { value: 0.5, won: 1, lost: 1, sample_size: 2 },
    });
    // The test deal is excluded; a person with nothing decided has a null rate, never 0%.
    expect(byId.get(Number(rep.userId))).toMatchObject({ won: { count: 1, value_usd: 500 }, win_rate: { value: 1, sample_size: 1 } });
    // Another workspace's user never appears.
    expect(byId.has(Number(other.userId))).toBe(false);
  });

  it('deals owned by no user are reported with the names they carry', async () => {
    const d = (await request(app).get('/api/v1/users/performance').set(auth(ws))).body.data;
    expect(d.unattributed).toEqual({
      open: { count: 1, value_usd: 700, unconverted: 0 },
      won: { count: 1, value_usd: 300, unconverted: 0 },
      lost: { count: 0 },
      win_rate: { value: 1, won: 1, lost: 0, sample_size: 1 },
      names: ['John Smith'],
    });
  });

  it('a person with no decided deals has win rate null', async () => {
    const solo = await setupWorkspace('teamperf-solo');
    try {
      const s = (await pool.query(`SELECT id FROM pipeline_stages WHERE tenant_id = $1 AND slug = 'proposal'`, [solo.tenantId])).rows[0].id;
      await deal('Open only', 'proposal', 10, solo.userId, {}, solo.tenantId, s);
      const d = (await request(app).get('/api/v1/users/performance').set(auth(solo))).body.data;
      expect(d.members[0].win_rate).toEqual({ value: null, won: 0, lost: 0, sample_size: 0 });
    } finally {
      await pool.query('DELETE FROM deals WHERE tenant_id = $1', [solo.tenantId]);
      await teardownWorkspace(solo);
    }
  });

  it('at 10,000 deals the rollups match SQL', async () => {
    const big = await setupWorkspace('teamperf-10k');
    try {
      const ids = (await pool.query(`SELECT id FROM pipeline_stages WHERE tenant_id = $1 ORDER BY position`, [big.tenantId])).rows.map(r => r.id);
      await pool.query(
        `INSERT INTO deals (name, value, currency, base_amount_usd, stage_id, assigned_to_user_id, pipeline_id, tenant_id)
         SELECT 'S' || g, g, 'USD', g, ($2::uuid[])[1 + (g % array_length($2::uuid[], 1))], CASE WHEN g % 2 = 0 THEN $3::int END, 'new-business', $1
           FROM generate_series(1, 10000) g`, [big.tenantId, ids, big.userId]);
      const d = (await request(app).get('/api/v1/users/performance').set(auth(big))).body.data;
      const sql = (await pool.query(
        `SELECT count(*) FILTER (WHERE ps.stage_type = 'won' AND d.assigned_to_user_id IS NOT NULL)::int AS won,
                COALESCE(sum(d.base_amount_usd) FILTER (WHERE ps.stage_type = 'open' AND d.assigned_to_user_id IS NOT NULL), 0)::float8 AS open_usd,
                count(*) FILTER (WHERE d.assigned_to_user_id IS NULL)::int AS orphans
           FROM deals d JOIN pipeline_stages ps ON ps.id = d.stage_id WHERE d.tenant_id = $1`, [big.tenantId])).rows[0];
      expect(d.members[0].won.count).toBe(sql.won);
      expect(d.members[0].open.value_usd).toBe(sql.open_usd);
      const u = d.unattributed;
      expect(u.open.count + u.won.count + u.lost.count).toBe(sql.orphans);
    } finally {
      await pool.query('DELETE FROM deals WHERE tenant_id = $1', [big.tenantId]);
      await teardownWorkspace(big);
    }
  }, 60_000);
});
