import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';

/**
 * POST /leads/duplicate-check — slice 6b. Lead duplicate checks compared
 * against 50 preloaded leads; this matches candidate rows against EVERY lead in
 * the caller's workspace, in one request for a whole import.
 */
describe('POST /leads/duplicate-check', () => {
  let ws: TestWorkspace;
  let other: TestWorkspace;
  const ids: Record<string, number> = {};
  beforeAll(async () => {
    ws = await setupWorkspace('leaddup');
    other = await setupWorkspace('leaddup-other');
    const ins = async (t: string, fn: string, ln: string, email: string | null, phone: string | null, company: string | null) =>
      (await pool.query(`INSERT INTO leads (first_name, last_name, email, phone, company, stage, tenant_id) VALUES ($1,$2,$3,$4,$5,'new',$6) RETURNING id`,
        [fn, ln, email, phone, company, t])).rows[0].id as number;
    ids.ana = await ins(ws.tenantId, 'Ana', 'Ray', 'Ana@Kora.example', '+91 80-1234 5678', 'Kora');
    ids.bo = await ins(ws.tenantId, 'Bo', 'Lin', 'bo@lumen.example', null, 'Lumen');
    ids.foreign = await ins(other.tenantId, 'Zed', 'Q', 'zed@x.example', '+1 555 000 1111', 'Acme');
    // 10,000 more, so the batch is measured against a real-sized workspace.
    await pool.query(
      `INSERT INTO leads (first_name, last_name, email, phone, company, stage, tenant_id)
       SELECT 'L' || g, 'N' || g, 'l' || g || '@bulk.example', '+44 20 ' || lpad(g::text, 8, '0'), 'Co ' || (g % 300), 'new', $1
         FROM generate_series(1, 10000) g`, [ws.tenantId]);
  });
  afterAll(async () => { await teardownWorkspace(ws); await teardownWorkspace(other); });

  const check = (rows: unknown[], extra: Record<string, unknown> = {}) =>
    request(app).post('/api/v1/leads/duplicate-check').set(auth(ws)).send({ rows, ...extra });

  it('matches by email (case-insensitive), phone digits, and company + last name — in row order', async () => {
    const res = await check([
      { email: 'ana@kora.EXAMPLE' },
      { phone: '918012345678' },
      { company: 'lumen', last_name: 'LIN' },
      { email: 'nobody@nowhere.example' },
    ]);
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.data.map((d: any) => [d.index, d.match?.id ?? null, d.match?.matched_on ?? null])).toEqual([
      [0, ids.ana, 'email'], [1, ids.ana, 'phone'], [2, ids.bo, 'company_last_name'], [3, null, null],
    ]);
  });

  it("never matches another workspace's lead, and exclude_id leaves the lead being edited out", async () => {
    const res = await check([{ email: 'zed@x.example' }, { phone: '15550001111' }]);
    expect(res.body.data.every((d: any) => d.match === null)).toBe(true);
    const self = await check([{ email: 'ana@kora.example' }], { exclude_id: ids.ana });
    expect(self.body.data[0].match).toBeNull();
  });

  it('a 1,000-row import against 10,000 leads is one quick request', async () => {
    const rows = Array.from({ length: 1000 }, (_, k) => ({ email: `l${k + 1}@bulk.example` }));
    const t0 = Date.now();
    const res = await check(rows);
    const ms = Date.now() - t0;
    expect(res.status).toBe(200);
    expect(res.body.data.filter((d: any) => d.match).length).toBe(1000);
    expect(ms).toBeLessThan(5000);
  });

  it('refuses a missing, empty or oversized batch, and a bad exclude_id (400)', async () => {
    for (const body of [{}, { rows: [] }, { rows: Array.from({ length: 1001 }, () => ({})) }, { rows: [{}], exclude_id: 'x' }]) {
      const res = await request(app).post('/api/v1/leads/duplicate-check').set(auth(ws)).send(body);
      expect(res.status, JSON.stringify(body).slice(0, 60)).toBe(400);
    }
  });
});
