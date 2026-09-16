import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';

/**
 * Service credentials (migration 054) — the machine credential that replaces
 * the borrowed admin JWT.
 *
 * The properties worth guarding are all about what a key CANNOT do, so most of
 * this file is negative: wrong scope, revoked, expired, another workspace, and
 * — the one that matters most — every route nobody opted in.
 */
describe('Service credentials', () => {
  let ws: TestWorkspace;
  const created: string[] = [];

  beforeAll(async () => { ws = await setupWorkspace('svccred'); });
  afterAll(async () => {
    await pool.query('DELETE FROM service_credentials WHERE tenant_id = $1', [ws.tenantId]);
    await teardownWorkspace(ws);
  });
  beforeEach(async () => {
    await pool.query('DELETE FROM service_credentials WHERE tenant_id = $1', [ws.tenantId]);
  });

  /** Issues a key through the real endpoint and returns the plaintext. */
  async function issue(scopes: string[], name = `cred-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`) {
    const res = await request(app).post('/api/v1/service-credentials').set(auth(ws))
      .send({ name, scopes });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    created.push(res.body.data.id);
    return { key: res.body.data.api_key as string, id: res.body.data.id as string, body: res.body };
  }

  const newContact = () => ({
    first_name: 'Svc', last_name: 'Created',
    email: `svc.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`,
    source: 'lead-gen', external_ref: `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  });

  // ── issuance ──────────────────────────────────────────────────────────────

  it('issues a key once, and stores only its hash', async () => {
    const { key, id, body } = await issue(['contacts:write']);
    expect(key.startsWith('bmk_')).toBe(true);
    expect(body.notice).toMatch(/cannot be shown again/);

    const { rows } = await pool.query('SELECT key_hash, key_prefix FROM service_credentials WHERE id = $1', [id]);
    expect(rows[0].key_hash, 'the key itself is never stored').not.toContain(key);
    expect(rows[0].key_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(key.startsWith(rows[0].key_prefix), 'the prefix identifies but cannot authenticate').toBe(true);

    // And no read path can hand it back.
    const list = await request(app).get('/api/v1/service-credentials').set(auth(ws));
    expect(JSON.stringify(list.body)).not.toContain(key);
    expect(JSON.stringify(list.body)).not.toContain(rows[0].key_hash);
  });

  it('refuses an unknown scope rather than issuing a key that means nothing', async () => {
    const res = await request(app).post('/api/v1/service-credentials').set(auth(ws))
      .send({ name: 'bad', scopes: ['contacts:write', 'everything'] });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/unknown scope\(s\): everything/);

    const empty = await request(app).post('/api/v1/service-credentials').set(auth(ws))
      .send({ name: 'bad2', scopes: [] });
    expect(empty.status).toBe(400);
  });

  // ── it actually authenticates the two endpoints Lead Gen calls ────────────

  it('a contacts:write key creates a contact, with either accepted header', async () => {
    const { key } = await issue(['contacts:write']);

    const bearer = await request(app).post('/api/v1/contacts')
      .set('Authorization', `Bearer ${key}`).send(newContact());
    expect(bearer.status, JSON.stringify(bearer.body)).toBe(201);

    const viaHeader = await request(app).post('/api/v1/contacts')
      .set('X-API-Key', key).send(newContact());
    expect(viaHeader.status, JSON.stringify(viaHeader.body)).toBe(201);

    // Written into the key's OWN workspace, taken from the credential and not
    // from anything the caller could supply.
    const { rows } = await pool.query(
      'SELECT tenant_id FROM contacts WHERE id = ANY($1::varchar[])',
      [[bearer.body.data.id, viaHeader.body.data.id]]);
    expect(rows.every((r: any) => r.tenant_id === ws.tenantId)).toBe(true);

    await pool.query('DELETE FROM contacts WHERE id = ANY($1::varchar[])',
      [[bearer.body.data.id, viaHeader.body.data.id]]);
  });

  it('a deals:read key reads deals', async () => {
    const { key } = await issue(['deals:read']);
    const res = await request(app).get('/api/v1/deals').set('Authorization', `Bearer ${key}`);
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('records last_used_at so an unused credential can be spotted', async () => {
    const { key, id } = await issue(['deals:read']);
    expect((await pool.query('SELECT last_used_at FROM service_credentials WHERE id=$1', [id])).rows[0].last_used_at).toBeNull();

    await request(app).get('/api/v1/deals').set('Authorization', `Bearer ${key}`);
    // Written fire-and-forget, so allow it a moment to land.
    await new Promise((r) => setTimeout(r, 150));
    expect((await pool.query('SELECT last_used_at FROM service_credentials WHERE id=$1', [id])).rows[0].last_used_at).not.toBeNull();
  });

  // ── scope is an allowlist, not a role ─────────────────────────────────────

  it('a key cannot use a scope it was not granted', async () => {
    const { key } = await issue(['deals:read']);
    const res = await request(app).post('/api/v1/contacts')
      .set('Authorization', `Bearer ${key}`).send(newContact());
    // 403 not 401: it authenticated fine, it just may not do this.
    expect(res.status, JSON.stringify(res.body)).toBe(403);
    expect(res.body.message).toMatch(/does not carry the "contacts:write" scope/);
  });

  /**
   * THE property that keeps a leaked key small. Only two routes opt in; every
   * other route `protect` guards must reject a key outright, including ones
   * added later by someone who never read serviceAuth.ts.
   */
  it('a valid key cannot reach any route that did not opt in', async () => {
    const { key } = await issue(['contacts:write', 'deals:read']);
    const bearer = { Authorization: `Bearer ${key}` };

    const blocked = [
      request(app).get('/api/v1/companies').set(bearer),
      request(app).get('/api/v1/contacts').set(bearer),
      request(app).get('/api/v1/users').set(bearer),
      request(app).get('/api/v1/module-links').set(bearer),
      request(app).post('/api/v1/service-credentials').set(bearer).send({ name: 'x', scopes: ['deals:read'] }),
      request(app).delete('/api/v1/contacts/CT001').set(bearer),
    ];
    for (const call of blocked) {
      const res = await call;
      // 401, because `protect` sees a bearer value that is not a JWT at all.
      expect([401, 403], `unexpectedly reachable: ${res.status}`).toContain(res.status);
      expect(res.status, 'must never succeed').not.toBe(200);
    }
  });

  it('a key cannot mint or rotate another key', async () => {
    const { key, id } = await issue(['contacts:write']);
    const res = await request(app).post(`/api/v1/service-credentials/${id}/rotate`)
      .set('Authorization', `Bearer ${key}`);
    expect([401, 403]).toContain(res.status);
  });

  // ── revoked, expired and unknown are one answer ──────────────────────────

  it('revoked, expired and unknown keys fail identically', async () => {
    const revoked = await issue(['contacts:write'], 'to-revoke');
    await request(app).delete(`/api/v1/service-credentials/${revoked.id}`).set(auth(ws)).expect(200);

    const expired = await issue(['contacts:write'], 'to-expire');
    await pool.query(`UPDATE service_credentials SET expires_at = NOW() - INTERVAL '1 minute' WHERE id = $1`, [expired.id]);

    const results = await Promise.all([
      request(app).post('/api/v1/contacts').set('X-API-Key', revoked.key).send(newContact()),
      request(app).post('/api/v1/contacts').set('X-API-Key', expired.key).send(newContact()),
      request(app).post('/api/v1/contacts').set('X-API-Key', 'bmk_never-existed').send(newContact()),
    ]);
    for (const r of results) expect(r.status).toBe(401);
    // One message, so a prober cannot learn which keys once existed.
    expect(results[0].body.message).toBe(results[1].body.message);
    expect(results[1].body.message).toBe(results[2].body.message);
    expect(results[0].body.message).toMatch(/Invalid or revoked API key/);
  });

  it('rotation kills the old key, keeps id and scopes', async () => {
    const first = await issue(['contacts:write'], 'rotating');
    const rot = await request(app).post(`/api/v1/service-credentials/${first.id}/rotate`).set(auth(ws));
    expect(rot.status, JSON.stringify(rot.body)).toBe(200);
    const second = rot.body.data.api_key as string;

    expect(second).not.toBe(first.key);
    expect(rot.body.data.id, 'same credential, new secret').toBe(first.id);
    expect(rot.body.data.scopes).toEqual(['contacts:write']);

    const old = await request(app).post('/api/v1/contacts').set('X-API-Key', first.key).send(newContact());
    expect(old.status, 'the previous key stops working immediately').toBe(401);

    const fresh = await request(app).post('/api/v1/contacts').set('X-API-Key', second).send(newContact());
    expect(fresh.status).toBe(201);
    await pool.query('DELETE FROM contacts WHERE id = $1', [fresh.body.data.id]);
  });

  // ── workspace scoping ────────────────────────────────────────────────────

  it("a key is confined to its own workspace", async () => {
    const other = await setupWorkspace('svccred-b');
    try {
      const { key } = await issue(['contacts:write']);
      const res = await request(app).post('/api/v1/contacts')
        .set('X-API-Key', key).send(newContact());
      expect(res.status).toBe(201);

      const { rows } = await pool.query('SELECT tenant_id FROM contacts WHERE id = $1', [res.body.data.id]);
      expect(rows[0].tenant_id, "never the other workspace").toBe(ws.tenantId);
      expect(rows[0].tenant_id).not.toBe(other.tenantId);
      await pool.query('DELETE FROM contacts WHERE id = $1', [res.body.data.id]);

      // And the other workspace cannot see this credential at all.
      const list = await request(app).get('/api/v1/service-credentials').set(auth(other));
      expect(list.body.data).toHaveLength(0);
    } finally {
      await teardownWorkspace(other);
    }
  });

  // ── the browser path is untouched ────────────────────────────────────────

  it('an ordinary session still works on both opted-in routes', async () => {
    const contact = await request(app).post('/api/v1/contacts').set(auth(ws)).send(newContact());
    expect(contact.status, JSON.stringify(contact.body)).toBe(201);
    await pool.query('DELETE FROM contacts WHERE id = $1', [contact.body.data.id]);

    const deals = await request(app).get('/api/v1/deals').set(auth(ws));
    expect(deals.status).toBe(200);

    // And no credential at all is still a 401, not an accidental open door.
    expect((await request(app).get('/api/v1/deals')).status).toBe(401);
    expect((await request(app).post('/api/v1/contacts').send(newContact())).status).toBe(401);
  });

  it('issuance is administrative — a sales role cannot mint a key', async () => {
    await pool.query(`UPDATE users SET role = 'sales' WHERE id = $1`, [ws.userId]);
    const login = await request(app).post('/api/v1/auth/login')
      .send({ email: ws.email, password: 'round-trip-test-password' });
    const salesAuth = { Authorization: `Bearer ${login.body.token}` };
    try {
      for (const call of [
        request(app).get('/api/v1/service-credentials').set(salesAuth),
        request(app).post('/api/v1/service-credentials').set(salesAuth).send({ name: 'n', scopes: ['deals:read'] }),
      ]) {
        expect((await call).status).toBe(403);
      }
    } finally {
      await pool.query(`UPDATE users SET role = 'admin' WHERE id = $1`, [ws.userId]);
    }
  });
});
