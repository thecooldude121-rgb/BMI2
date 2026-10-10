import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';

/**
 * Group A item 4, slice 1 — the five non-lead list endpoints page honestly:
 * `limit` is clamped to 500 (deals / contacts / companies passed it raw into
 * SQL), every response carries `total` = COUNT(*) over the same filters (it
 * carried only the page size), and `?sort=` is an allowlist that refuses an
 * unknown key with a 400. Verified at 10,000 rows per table, against
 * independent SQL counts.
 */
type Spec = { path: string; table: string; seed: (tenant: string, n: number, offset?: number) => Promise<void>; search: { q: string; expect: number }; sort: string };

describe('list endpoints: clamp, real total, allowlisted sort', () => {
  let ws: TestWorkspace;
  let other: TestWorkspace;
  let stageId: string;

  const specs: Spec[] = [
    { path: '/api/v1/deals', table: 'deals', sort: 'name',
      seed: async (t, n, o = 0) => { await pool.query(
        `INSERT INTO deals (name, value, currency, stage_id, tenant_id)
         SELECT 'Deal ' || lpad((g + $3)::text, 6, '0'), g, 'USD', $1, $2 FROM generate_series(1, $4) g`,
        [t === ws.tenantId ? stageId : otherStage, t, o, n]); },
      search: { q: 'Deal 00000', expect: 9 } },
    { path: '/api/v1/contacts', table: 'contacts', sort: 'name',
      seed: async (t, n, o = 0) => { await pool.query(
        `INSERT INTO contacts (first_name, last_name, email, tenant_id)
         SELECT 'C', 'Person ' || lpad((g + $2)::text, 6, '0'), 'p' || (g + $2) || '@lt-' || $4::text || '.example', $1::uuid
           FROM generate_series(1, $3) g`, [t, o, n, t.slice(0, 8)]); },
      search: { q: 'Person 00000', expect: 9 } },
    { path: '/api/v1/companies', table: 'companies', sort: 'name',
      seed: async (t, n, o = 0) => { await pool.query(
        `INSERT INTO companies (name, tenant_id) SELECT 'Co ' || lpad((g + $2)::text, 6, '0'), $1 FROM generate_series(1, $3) g`, [t, o, n]); },
      search: { q: 'Co 00000', expect: 9 } },
    { path: '/api/v1/tasks', table: 'tasks', sort: 'title',
      seed: async (t, n, o = 0) => { await pool.query(
        `INSERT INTO tasks (title, tenant_id) SELECT 'Task ' || lpad((g + $2)::text, 6, '0'), $1 FROM generate_series(1, $3) g`, [t, o, n]); },
      search: { q: 'Task 00000', expect: 9 } },
    { path: '/api/v1/activities', table: 'activities', sort: 'created_at',
      seed: async (t, n, o = 0) => { await pool.query(
        `INSERT INTO activities (subject, type, status, tenant_id, created_at)
         SELECT 'Act ' || lpad((g + $2)::text, 6, '0'), 'call', 'completed', $1, now() - g * interval '1 second'
           FROM generate_series(1, $3) g`, [t, o, n]); },
      search: { q: 'Act 00000', expect: 9 } },
  ];
  let otherStage: string;
  const N = 10_000;

  beforeAll(async () => {
    ws = await setupWorkspace('listtotals');
    other = await setupWorkspace('listtotals-other');
    stageId = (await pool.query('SELECT id FROM pipeline_stages WHERE tenant_id = $1 ORDER BY position LIMIT 1', [ws.tenantId])).rows[0].id;
    otherStage = (await pool.query('SELECT id FROM pipeline_stages WHERE tenant_id = $1 ORDER BY position LIMIT 1', [other.tenantId])).rows[0].id;
    for (const s of specs) {
      await s.seed(ws.tenantId, N);
      await s.seed(other.tenantId, 25, N); // another workspace's rows must never be counted
    }
  }, 120_000);
  afterAll(async () => {
    for (const t of [ws, other]) {
      for (const s of [...specs].reverse()) await pool.query(`DELETE FROM ${s.table} WHERE tenant_id = $1`, [t.tenantId]);
      await teardownWorkspace(t);
    }
  }, 120_000);

  for (const s of specs) {
    describe(s.path, () => {
      const get = (q: Record<string, string | number>) => request(app).get(s.path).query(q).set(auth(ws));
      const sqlTotal = async () => (await pool.query(`SELECT count(*)::int AS n FROM ${s.table} WHERE tenant_id = $1`, [ws.tenantId])).rows[0].n;

      it('total is the filtered set at 10,000 rows (matches SQL); count is the page', async () => {
        const res = await get({ limit: 25 });
        expect(res.status, JSON.stringify(res.body).slice(0, 300)).toBe(200);
        expect(res.body.total).toBe(await sqlTotal());
        expect(res.body.total).toBe(N);
        expect(res.body).toMatchObject({ count: 25, limit: 25, offset: 0 });
        expect(res.body.data).toHaveLength(25);
      });

      it('limit is CLAMPED to 500 (no unbounded query); garbage falls back to the default', async () => {
        const big = await get({ limit: 100_000_000 });
        expect(big.status).toBe(200);
        expect(big.body.limit).toBe(500);
        expect(big.body.data).toHaveLength(500);
        const junk = await get({ limit: 'abc', offset: 'xyz' });
        expect(junk.status).toBe(200);
        expect(junk.body).toMatchObject({ limit: 50, offset: 0 });
      });

      it('a search narrows total and data together', async () => {
        const res = await get({ search: s.search.q, limit: 500 });
        expect(res.body.total).toBe(s.search.expect);
        expect(res.body.data).toHaveLength(s.search.expect);
      });

      it('allowlisted sort orders the page; an unknown key or direction is a 400, never ignored', async () => {
        const asc = await get({ sort: s.sort, dir: 'asc', limit: 5 });
        expect(asc.status, JSON.stringify(asc.body)).toBe(200);
        const desc = await get({ sort: s.sort, dir: 'desc', limit: 5 });
        expect(asc.body.data[0].id).not.toBe(desc.body.data[0].id);
        const bad = await get({ sort: 'password_hash' });
        expect(bad.status).toBe(400);
        expect(bad.body.message).toMatch(/sort must be one of/);
        expect((await get({ sort: s.sort, dir: 'sideways' })).status).toBe(400);
      });

      it('walking every page returns each row exactly once', async () => {
        const seen = new Set<string>();
        for (let offset = 0; offset < N; offset += 500) {
          const res = await get({ limit: 500, offset, sort: s.sort, dir: 'asc' });
          for (const r of res.body.data) seen.add(String(r.id));
        }
        expect(seen.size).toBe(N);
      }, 60_000);
    });
  }
});
