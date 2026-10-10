import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';

/**
 * Group A item 4, slice 3b — each account row carries its own contact and
 * open-deal roll-ups, and GET /companies/summary feeds the tiles. Both used to
 * be joined / summed in the browser from capped lists (200 / 500 / 500).
 */
describe('Accounts: per-row roll-ups and the summary', () => {
  let ws: TestWorkspace;
  let a: string; let b: string;

  beforeAll(async () => {
    ws = await setupWorkspace('acctroll');
    const co = async (name: string) => (await pool.query(`INSERT INTO companies (name, tenant_id) VALUES ($1, $2) RETURNING id`, [name, ws.tenantId])).rows[0].id;
    a = await co('Alpha'); b = await co('Beta');
    for (let k = 0; k < 3; k++) {
      await pool.query(`INSERT INTO contacts (first_name, last_name, email, company_id, tenant_id) VALUES ('C', $1, $2, $3, $4)`, [`N${k}`, `c${k}.${Date.now()}@ar.example`, a, ws.tenantId]);
    }
    await pool.query(`INSERT INTO contacts (first_name, last_name, email, tenant_id) VALUES ('No', 'Account', $1, $2)`, [`noacct.${Date.now()}@ar.example`, ws.tenantId]);
    const st = async (slug: string) => (await pool.query(`SELECT s.id FROM pipeline_stages s JOIN pipelines p ON p.id = s.pipeline_id WHERE s.tenant_id = $1 AND p.slug = 'new-business' AND s.slug = $2`, [ws.tenantId, slug])).rows[0].id;
    const deal = (name: string, slug: string, x: { company?: string | null; value?: number; currency?: string; base?: number | null; test?: boolean; archived?: boolean } = {}) =>
      st(slug).then(stage => pool.query(
        `INSERT INTO deals (name, value, currency, base_amount_usd, stage_id, pipeline_id, tenant_id, company_id, is_test, is_archived)
         VALUES ($1,$2,$3,$4,$5,'new-business',$6,$7,$8,$9)`,
        [name, x.value ?? 1000, x.currency ?? 'USD', x.base === undefined ? (x.value ?? 1000) : x.base, stage, ws.tenantId,
         x.company === undefined ? a : x.company, x.test ?? false, x.archived ?? false]));
    await deal('Open USD', 'prospecting', { value: 1000 });
    await deal('Open INR unknown', 'qualified', { value: 125000, currency: 'INR', base: null });
    await deal('Won', 'closed-won', { value: 5000 });
    await deal('Test', 'prospecting', { test: true });
    await deal('Archived', 'prospecting', { archived: true });
    await deal('No account', 'prospecting', { company: null });
  });
  afterAll(async () => { await teardownWorkspace(ws); });

  it('each row carries contact_count and OPEN-deal roll-ups (won / test / archived excluded; unknown USD counted, not summed)', async () => {
    const res = await request(app).get('/api/v1/companies').query({ sort: 'name', dir: 'asc' }).set(auth(ws));
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    const byName = Object.fromEntries(res.body.data.map((r: { name: string }) => [r.name, r]));
    expect(byName.Alpha).toMatchObject({ contact_count: 3, open_deal_count: 2, open_deal_value_usd: 1000, open_deal_unconverted: 1 });
    expect(byName.Beta).toMatchObject({ contact_count: 0, open_deal_count: 0, open_deal_value_usd: 0, open_deal_unconverted: 0 });
  });

  it('GET /companies/summary: workspace-wide tiles from the server', async () => {
    const res = await request(app).get('/api/v1/companies/summary').set(auth(ws));
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.data).toEqual({
      accounts: 2, contacts_on_accounts: 3, open_deals_on_accounts: 2,
      open_value_usd_on_accounts: 1000, open_unconverted_on_accounts: 1, open_deals_without_account: 1,
    });
  });

  it('another workspace sees none of it', async () => {
    const other = await setupWorkspace('acctroll-other');
    try {
      const res = await request(app).get('/api/v1/companies/summary').set(auth(other));
      expect(res.body.data).toMatchObject({ accounts: 0, contacts_on_accounts: 0, open_deals_on_accounts: 0 });
    } finally { await teardownWorkspace(other); }
  });
});
