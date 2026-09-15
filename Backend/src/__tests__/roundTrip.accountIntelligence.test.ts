import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';
import { encryptSecret } from '../utils/secretBox';
import { LEAD_GEN_MODULE } from '../services/leadGen/link';

/**
 * GET /companies/:id/account-intelligence — the endpoint the account page panel
 * calls.
 *
 * Only `fetch` to Lead Gen is stubbed. The company row, the module link and the
 * encrypted credential are all real, because the property worth guarding is
 * that the four states this can be in stay DISTINCT: an account with no signals
 * and a workspace with no Lead Gen connection must never render the same.
 */
describe('Account intelligence endpoint', () => {
  let ws: TestWorkspace;
  let companyId: string;
  const KEY_ENV = 'MODULE_LINK_ENCRYPTION_KEY';
  const originalKey = process.env[KEY_ENV];

  beforeAll(async () => {
    process.env[KEY_ENV] = 'e'.repeat(64);
    ws = await setupWorkspace('acctintel');
    const c = await pool.query(
      `INSERT INTO companies (name, domain, tenant_id) VALUES ($1,$2,$3) RETURNING id`,
      ['Northwind Systems', 'northwindsystems.example', ws.tenantId],
    );
    companyId = c.rows[0].id;
  });

  afterAll(async () => {
    await pool.query('DELETE FROM companies WHERE tenant_id = $1', [ws.tenantId]);
    await teardownWorkspace(ws);
    if (originalKey === undefined) delete process.env[KEY_ENV];
    else process.env[KEY_ENV] = originalKey;
  });

  beforeEach(async () => {
    await pool.query('DELETE FROM module_links WHERE tenant_id = $1', [ws.tenantId]);
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  const connect = () =>
    pool.query(
      `INSERT INTO module_links (tenant_id, module, base_url, api_key_encrypted, is_active)
       VALUES ($1,$2,'https://leadgen.test',$3,TRUE)`,
      [ws.tenantId, LEAD_GEN_MODULE, encryptSecret('lgk_key')],
    );

  const stubLeadGen = (status: number, body: unknown) => {
    const calls: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: any) => {
      calls.push(String(url));
      return { ok: status >= 200 && status < 300, status, json: async () => body } as any;
    }));
    return calls;
  };

  it('reports not_linked when the workspace has no Lead Gen connection', async () => {
    const res = await request(app).get(`/api/v1/companies/${companyId}/account-intelligence`).set(auth(ws));
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.data.status).toBe('not_linked');
    expect(res.body.data.signals).toEqual([]);
  });

  it('returns the signals when connected', async () => {
    await connect();
    const calls = stubLeadGen(200, [
      { id: 's1', source: 'sample', category: 'funding', headline: 'Raises Series B', url: null, published_at: '2026-09-10T00:00:00.000Z' },
      { id: 's2', source: 'sample', category: 'hiring', headline: 'Hiring 14 engineers', url: 'https://e.example/a', published_at: '2026-09-01T00:00:00.000Z' },
    ]);

    const res = await request(app).get(`/api/v1/companies/${companyId}/account-intelligence`).set(auth(ws));
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.signals.map((s: any) => s.id)).toEqual(['s1', 's2']);
    expect(res.body.data.company_domain).toBe('northwindsystems.example');
    // The domain came off the company row, not from the client.
    expect(calls[0]).toContain('company_domain=northwindsystems.example');
  });

  /**
   * The workspace's credential must not become a lookup service. A caller can
   * name a company id, never a domain — so the only domains reachable are ones
   * this workspace already has an account for.
   */
  it('ignores any domain the caller tries to supply', async () => {
    await connect();
    const calls = stubLeadGen(200, []);
    await request(app)
      .get(`/api/v1/companies/${companyId}/account-intelligence?company_domain=someone-else.example`)
      .set(auth(ws));
    expect(calls[0]).toContain('company_domain=northwindsystems.example');
    expect(calls[0]).not.toContain('someone-else.example');
  });

  it('an account with no domain is its own state, not an empty signal list', async () => {
    await connect();
    const noDomain = await pool.query(
      `INSERT INTO companies (name, tenant_id) VALUES ('No Domain Ltd',$1) RETURNING id`, [ws.tenantId]);
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const res = await request(app)
      .get(`/api/v1/companies/${noDomain.rows[0].id}/account-intelligence`).set(auth(ws));
    expect(res.body.data.status).toBe('no_domain');
    expect(fetchSpy, 'nothing to ask about, so nothing is asked').not.toHaveBeenCalled();
  });

  it('connected with nothing recorded is ok-and-empty, distinct from not_linked', async () => {
    await connect();
    stubLeadGen(200, []);
    const res = await request(app).get(`/api/v1/companies/${companyId}/account-intelligence`).set(auth(ws));
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.signals).toEqual([]);
  });

  it('an upstream failure is an error state, never an empty list', async () => {
    await connect();
    stubLeadGen(500, { error: 'boom' });
    const res = await request(app).get(`/api/v1/companies/${companyId}/account-intelligence`).set(auth(ws));
    expect(res.status, 'the page must still render').toBe(200);
    expect(res.body.data.status).toBe('error');
    expect(res.body.data.message).toMatch(/Couldn't load account intelligence/);
  });

  it("another workspace's company is a 404, not a read", async () => {
    const other = await setupWorkspace('acctintel-b');
    try {
      await connect();
      const fetchSpy = vi.fn();
      vi.stubGlobal('fetch', fetchSpy);
      const res = await request(app)
        .get(`/api/v1/companies/${companyId}/account-intelligence`).set(auth(other));
      expect(res.status).toBe(404);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      await teardownWorkspace(other);
    }
  });
});
