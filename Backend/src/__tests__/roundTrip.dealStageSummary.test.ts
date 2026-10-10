import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, addUserWithRole, auth, TestWorkspace } from './helpers';

/**
 * Group A item 4, slice 2a — the Deals board pages per COLUMN on the server.
 * GET /deals/stage-summary gives each column's real count and USD value under
 * the same filters; GET /deals?pipeline_id=&stage_id= is one column's page.
 * Currency: only trustworthy base_amount_usd is summed; a native amount stored
 * as "USD" is counted as unconverted, never added to dollars.
 */
describe('Deals board: per-stage summary and per-column pages', () => {
  let ws: TestWorkspace;
  let other: TestWorkspace;
  let sales: TestWorkspace;
  let stage: Record<string, string> = {};
  let renewalsStage: string;

  const deal = (name: string, slug: string, extra: Record<string, unknown> = {}) =>
    pool.query(
      `INSERT INTO deals (name, value, currency, base_amount_usd, stage_id, pipeline_id, tenant_id, assigned_to_user_id, is_test)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [name, extra.value ?? 1000, extra.currency ?? 'USD', extra.base === undefined ? (extra.value ?? 1000) : extra.base,
       extra.stage_id ?? stage[slug], extra.pipeline_id ?? 'new-business', ws.tenantId, extra.owner ?? null, extra.is_test ?? false]);
  const summary = async (q: Record<string, string | number> = {}, as: TestWorkspace = ws) => {
    const r = await request(app).get('/api/v1/deals/stage-summary').query(q).set(auth(as));
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    return r.body.data as { stages: { slug: string; count: number; value_usd: number; unconverted: number }[]; unplaced: number };
  };
  const bySlug = (d: Awaited<ReturnType<typeof summary>>, slug: string) => d.stages.find(s => s.slug === slug)!;

  beforeAll(async () => {
    ws = await setupWorkspace('stagesum');
    other = await setupWorkspace('stagesum-other');
    sales = await addUserWithRole(ws, 'sales');
    for (const r of (await pool.query(
      `SELECT s.slug, s.id FROM pipeline_stages s JOIN pipelines p ON p.id = s.pipeline_id WHERE s.tenant_id = $1 AND p.slug = 'new-business'`, [ws.tenantId])).rows) stage[r.slug] = r.id;
    const pl = (await pool.query(`INSERT INTO pipelines (name, slug, tenant_id) VALUES ('Renewals', 'renewals', $1) RETURNING id`, [ws.tenantId])).rows[0].id;
    renewalsStage = (await pool.query(`INSERT INTO pipeline_stages (pipeline_id, name, slug, position, tenant_id) VALUES ($1, 'Renew', 'renew', 1, $2) RETURNING id`, [pl, ws.tenantId])).rows[0].id;

    await deal('USD A', 'prospecting', { value: 1000 });
    await deal('USD B', 'prospecting', { value: 2500, owner: sales.userId });
    await deal('AED converted', 'prospecting', { value: 36725, currency: 'AED', base: 10000 });
    await deal('INR as USD (bad base)', 'prospecting', { value: 125000, currency: 'INR', base: 125000 });
    await deal('Qualified USD', 'qualified', { value: 700 });
    await deal('Test row', 'qualified', { is_test: true });
    await deal('Renewal', 'renew', { stage_id: renewalsStage, pipeline_id: 'renewals' });
    await deal('Stray stage', 'renew', { stage_id: renewalsStage, pipeline_id: 'new-business' });
    // Another workspace: never counted.
    const os = (await pool.query(`SELECT s.id FROM pipeline_stages s WHERE s.tenant_id = $1 AND s.slug = 'prospecting'`, [other.tenantId])).rows[0].id;
    await pool.query(`INSERT INTO deals (name, value, currency, base_amount_usd, stage_id, pipeline_id, tenant_id) VALUES ('Theirs', 9999, 'USD', 9999, $1, 'new-business', $2)`, [os, other.tenantId]);
  });
  afterAll(async () => {
    await pool.query('DELETE FROM deals WHERE tenant_id = ANY($1::uuid[])', [[ws.tenantId, other.tenantId]]);
    await pool.query(`DELETE FROM pipeline_stages WHERE id = $1`, [renewalsStage]);
    await pool.query(`DELETE FROM pipelines WHERE tenant_id = $1 AND slug = 'renewals'`, [ws.tenantId]);
    await teardownWorkspace(ws); await teardownWorkspace(other);
  });

  it('one row per stage of the pipeline, in position order, with real counts (test rows and other pipelines excluded)', async () => {
    const s = await summary({ pipeline_id: 'new-business' });
    expect(s.stages.map(x => x.slug)).toEqual(['prospecting', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost']);
    expect(bySlug(s, 'prospecting').count).toBe(4);
    expect(bySlug(s, 'qualified').count).toBe(1);
    expect(bySlug(s, 'proposal').count).toBe(0);
  });

  it('USD value sums ONLY trustworthy bases; a native amount stored as USD is "unconverted", never added', async () => {
    const p = bySlug(await summary(), 'prospecting');
    expect(p.value_usd).toBe(1000 + 2500 + 10000);   // NOT + 125000
    expect(p.unconverted).toBe(1);
    const q = bySlug(await summary(), 'qualified');
    expect(q).toMatchObject({ value_usd: 700, unconverted: 0 }); // the test-flagged row is not counted
  });

  it('a deal in this pipeline sitting in another pipeline\'s stage is counted as unplaced', async () => {
    expect((await summary()).unplaced).toBe(1);
    // ...and GET /deals?unplaced=true lists exactly that deal, so the banner can name it.
    const list = await request(app).get('/api/v1/deals').query({ pipeline_id: 'new-business', unplaced: 'true' }).set(auth(ws));
    expect(list.body.total).toBe(1);
    expect(list.body.data.map((d: { name: string }) => d.name)).toEqual(['Stray stage']);
    expect((await request(app).get('/api/v1/deals').query({ unplaced: 'true' }).set(auth(ws))).status).toBe(400);
    const r = await summary({ pipeline_id: 'renewals' });
    expect(r.stages.map(x => [x.slug, x.count])).toEqual([['renew', 1]]);
  });

  it('the same filters as the columns: search and owner narrow the headers', async () => {
    expect(bySlug(await summary({ search: 'AED' }), 'prospecting')).toMatchObject({ count: 1, value_usd: 10000 });
    expect(bySlug(await summary({ assigned_to_user_id: sales.userId }), 'prospecting')).toMatchObject({ count: 1, value_usd: 2500 });
  });

  it('another workspace sees none of it', async () => {
    const s = await summary({}, other);
    expect(bySlug(s, 'prospecting').count).toBe(1);
  });

  it('GET /deals?stage_id= is one column: its total matches the header, pages walk it', async () => {
    const col = await request(app).get('/api/v1/deals').query({ pipeline_id: 'new-business', stage_id: stage.prospecting, limit: 2, sort: 'name', dir: 'asc' }).set(auth(ws));
    expect(col.status).toBe(200);
    expect(col.body.total).toBe(4);
    expect(col.body.data).toHaveLength(2);
    const next = await request(app).get('/api/v1/deals').query({ pipeline_id: 'new-business', stage_id: stage.prospecting, limit: 2, offset: 2, sort: 'name', dir: 'asc' }).set(auth(ws));
    const ids = [...col.body.data, ...next.body.data].map((d: { id: string }) => d.id);
    expect(new Set(ids).size).toBe(4);
    expect((await request(app).get('/api/v1/deals').query({ stage_id: 'nope' }).set(auth(ws))).status).toBe(400);
    expect((await request(app).get('/api/v1/deals').query({ stage_id: stage.prospecting }).set(auth(other))).body.total).toBe(0);
  });

  it('deleting a deal is refused for sales (403) and works for an admin — the board must report which', async () => {
    const id = (await deal('To delete', 'proposal')).rows[0].id;
    expect((await request(app).delete(`/api/v1/deals/${id}`).set(auth(sales))).status).toBe(403);
    expect((await pool.query('SELECT 1 FROM deals WHERE id = $1', [id])).rowCount).toBe(1);
    expect((await request(app).delete(`/api/v1/deals/${id}`).set(auth(ws))).status).toBe(200);
    expect((await pool.query('SELECT 1 FROM deals WHERE id = $1', [id])).rowCount).toBe(0);
  });
});
