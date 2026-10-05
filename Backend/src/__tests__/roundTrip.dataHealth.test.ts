import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, addUserWithRole, TestWorkspace } from './helpers';

/**
 * GET /workspace/data-health (Group B item 13): every figure is a count over
 * THIS workspace's rows. A second workspace with its own seed/test rows must
 * not move any number.
 */
describe('GET /workspace/data-health', () => {
  let ws: TestWorkspace;
  let other: TestWorkspace;

  const seed = async (w: TestWorkspace, n: number) => {
    const stage = (await pool.query('SELECT id FROM pipeline_stages WHERE tenant_id = $1 ORDER BY id LIMIT 1', [w.tenantId])).rows[0].id;
    const co = await pool.query(`INSERT INTO companies (name, tenant_id, is_seed) VALUES ('Seeded Co', $1, true) RETURNING id`, [w.tenantId]);
    await pool.query(`INSERT INTO companies (name, tenant_id, is_seed) VALUES ('Real Co', $1, false)`, [w.tenantId]);
    // deals: 1 seeded with account, 1 real without account, 1 test (hidden)
    await pool.query(`INSERT INTO deals (name, value, currency, stage_id, tenant_id, is_seed, is_test, company_id) VALUES ('S', 1, 'USD', $1, $2, true, false, $3)`, [stage, w.tenantId, co.rows[0].id]);
    await pool.query(`INSERT INTO deals (name, value, currency, stage_id, tenant_id, is_seed, is_test) VALUES ('R', 1, 'USD', $1, $2, false, false)`, [stage, w.tenantId]);
    await pool.query(`INSERT INTO deals (name, value, currency, stage_id, tenant_id, is_seed, is_test) VALUES ('T', 1, 'USD', $1, $2, false, true)`, [stage, w.tenantId]);
    for (let k = 0; k < n; k++) {
      await pool.query(`INSERT INTO leads (first_name, email, stage, status, score, tenant_id, is_seed) VALUES ('L', $1, 'new', 'active', 0, $2, $3)`,
        [`l${k}-${w.tenantId.slice(0, 6)}@dh.example`, w.tenantId, k === 0]);
    }
    await pool.query(`INSERT INTO contacts (first_name, last_name, email, tenant_id, is_seed) VALUES ('C', 'One', $1, $2, true)`, [`c-${w.tenantId.slice(0, 6)}@dh.example`, w.tenantId]);
  };

  beforeAll(async () => {
    ws = await setupWorkspace('datahealth');
    other = await setupWorkspace('datahealth-other');
    await seed(ws, 3);
    await seed(other, 5);
  });
  afterAll(async () => {
    for (const w of [ws, other]) { await pool.query('DELETE FROM contacts WHERE tenant_id = $1', [w.tenantId]); await teardownWorkspace(w); }
  });

  it('counts this workspace only, with test rows reported as hidden (not counted as deals)', async () => {
    const res = await request(app).get('/api/v1/workspace/data-health').set(auth(ws));
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.data).toEqual({
      deals: 2, deals_seed: 1, deals_without_account: 1, deals_test_hidden: 1,
      accounts: 2, accounts_seed: 1,
      leads: 3, leads_seed: 1, leads_unassigned: 3,
      contacts: 1, contacts_seed: 1,
    });
  });

  it('any role may read it (counts, no records)', async () => {
    const sales = await addUserWithRole(ws, 'sales');
    const res = await request(app).get('/api/v1/workspace/data-health').set(auth(sales));
    expect(res.status).toBe(200);
    expect(res.body.data.leads).toBe(3);
  });

  it('requires a session', async () => {
    expect((await request(app).get('/api/v1/workspace/data-health')).status).toBe(401);
  });
});
