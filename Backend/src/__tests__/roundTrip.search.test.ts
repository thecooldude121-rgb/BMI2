import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';

/**
 * Global search (Group B item 10). The workspace boundary is the point: a
 * second workspace holds records with the SAME names, and none may appear.
 */
describe('GET /search', () => {
  let ws: TestWorkspace;
  let other: TestWorkspace;

  const seed = async (w: TestWorkspace, tag: string, extra = false) => {
    const co = await pool.query(`INSERT INTO companies (name, domain, industry, tenant_id) VALUES ($1, $2, 'Technology', $3) RETURNING id`,
      [`Zephyr ${tag} Systems`, `zephyr-${tag}.example`, w.tenantId]);
    await pool.query(`INSERT INTO contacts (first_name, last_name, email, company_id, tenant_id) VALUES ('Zara', $1, $2, $3, $4)`,
      [`Zephyrson ${tag}`, `zara.${tag}@zephyr.example`, co.rows[0].id, w.tenantId]);
    await pool.query(`INSERT INTO leads (first_name, last_name, email, company, stage, status, score, tenant_id) VALUES ('Zed', 'Zephyrine', $1, $2, 'new', 'active', 0, $3)`,
      [`zed.${tag}@zephyr.example`, `Zephyr ${tag} Systems`, w.tenantId]);
    const stage = await pool.query('SELECT id FROM pipeline_stages WHERE tenant_id = $1 ORDER BY id LIMIT 1', [w.tenantId]);
    await pool.query(`INSERT INTO deals (name, value, currency, stage_id, tenant_id, is_test) VALUES ($1, 1000, 'USD', $2, $3, false)`,
      [`Zephyr ${tag} rollout`, stage.rows[0].id, w.tenantId]);
    if (extra) {
      await pool.query(`INSERT INTO deals (name, value, currency, stage_id, tenant_id, is_test) VALUES ('Zephyr hidden test deal', 1, 'USD', $1, $2, true)`,
        [stage.rows[0].id, w.tenantId]);
      await pool.query(`INSERT INTO leads (first_name, email, company, stage, status, score, tenant_id) VALUES ('Fifty', 'fifty@pct.example', '50% Off Ltd', 'new', 'active', 0, $1)`, [w.tenantId]);
      for (let k = 0; k < 6; k++) {
        await pool.query(`INSERT INTO leads (first_name, email, company, stage, status, score, tenant_id) VALUES ('Many', $1, 'Quokka Co', 'new', 'active', 0, $2)`,
          [`many${k}@quokka.example`, w.tenantId]);
      }
    }
  };

  beforeAll(async () => {
    ws = await setupWorkspace('search');
    other = await setupWorkspace('search-other');
    await seed(ws, 'mine', true);
    await seed(other, 'theirs');
  });
  afterAll(async () => {
    for (const w of [ws, other]) {
      await pool.query('DELETE FROM contacts WHERE tenant_id = $1', [w.tenantId]);
      await teardownWorkspace(w);
    }
  });

  const find = (q: string, w = ws) => request(app).get('/api/v1/search').query({ q }).set(auth(w));

  it('finds a match of each type in the caller\'s workspace, and NOTHING from another one', async () => {
    const res = await find('zephyr');
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    const d = res.body.data;
    expect(d.leads.rows.map((r: { email: string }) => r.email)).toEqual(['zed.mine@zephyr.example']);
    expect(d.contacts.rows.map((r: { email: string }) => r.email)).toEqual(['zara.mine@zephyr.example']);
    expect(d.accounts.rows.map((r: { name: string }) => r.name)).toEqual(['Zephyr mine Systems']);
    expect(d.deals.rows.map((r: { name: string }) => r.name)).toEqual(['Zephyr mine rollout']);
    expect(JSON.stringify(d)).not.toContain('theirs');
  });

  it('a contact\'s account name comes from its own workspace only', async () => {
    const d = (await find('Zara')).body.data;
    expect(d.contacts.rows[0].company).toBe('Zephyr mine Systems');
  });

  // A contact pointing at another workspace's account can no longer EXIST:
  // migration 064 made contacts.company_id a composite reference (see
  // roundTrip.contactCompanyScope). Search's join keeps its tenant match as
  // defence in depth.

  it('test-flagged deals are never returned', async () => {
    const d = (await find('hidden test')).body.data;
    expect(d.deals.rows).toHaveLength(0);
  });

  it('caps each type at 5 and says has_more, rather than inventing a total', async () => {
    const d = (await find('quokka')).body.data;
    expect(d.leads.rows).toHaveLength(5);
    expect(d.leads.has_more).toBe(true);
    expect(d.leads).not.toHaveProperty('total');
  });

  it('LIKE wildcards in the term match literally ("50%" is not "everything")', async () => {
    const d = (await find('50%')).body.data;
    expect(d.leads.rows.map((r: { company: string }) => r.company)).toEqual(['50% Off Ltd']);
    expect((await find('%_')).body.data.leads.rows).toHaveLength(0);
  });

  it.each([['a', /at least 2/], ['x'.repeat(101), /limited to 100/], ['', /at least 2/]])(
    'refuses a term of %#, with a 400', async (q, msg) => {
      const res = await find(q);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(msg);
    });

  it('requires a session', async () => {
    expect((await request(app).get('/api/v1/search').query({ q: 'zephyr' })).status).toBe(401);
  });
});
