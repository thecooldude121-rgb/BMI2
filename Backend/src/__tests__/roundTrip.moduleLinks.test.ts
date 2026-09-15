import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';
import { leadGenLink } from '../services/leadGen/link';

/**
 * The Connected Modules handshake (migrations 047, 048).
 *
 * Lead Gen has to deliver a credential to a system it cannot yet authenticate
 * to. The answer is the one this codebase already uses for people: a
 * short-lived single-use code, stored only as a hash, redeemed on the one
 * unauthenticated write. Every assertion re-reads Postgres.
 */
describe('Module links — the Lead Gen handshake', () => {
  let ws: TestWorkspace;
  const KEY_ENV = 'MODULE_LINK_ENCRYPTION_KEY';
  const originalKey = process.env[KEY_ENV];

  beforeAll(async () => {
    process.env[KEY_ENV] = 'd'.repeat(64);
    ws = await setupWorkspace('modlinks');
  });

  afterAll(async () => {
    await teardownWorkspace(ws);
    if (originalKey === undefined) delete process.env[KEY_ENV];
    else process.env[KEY_ENV] = originalKey;
  });

  beforeEach(async () => {
    await pool.query('DELETE FROM module_link_setup_codes WHERE tenant_id = $1', [ws.tenantId]);
    await pool.query('DELETE FROM module_links WHERE tenant_id = $1', [ws.tenantId]);
  });

  const mintCode = async (): Promise<string> => {
    const res = await request(app).post('/api/v1/module-links/lead-gen/setup-code').set(auth(ws));
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    return res.body.data.setup_code as string;
  };

  const redeem = (body: Record<string, unknown>) =>
    request(app).post('/api/v1/module-links/redeem').send(body);

  it('starts not connected, and says so without inventing a link', async () => {
    const res = await request(app).get('/api/v1/module-links').set(auth(ws));
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.data.connected).toBe(false);
    expect(res.body.data.connected_since).toBeNull();
    expect(res.body.data.pending_setup_code).toBeNull();
  });

  it('a setup code is returned once and is only ever stored as a hash', async () => {
    const code = await mintCode();
    expect(code.startsWith('mls_')).toBe(true);

    const { rows } = await pool.query(
      'SELECT code_hash, expires_at, consumed_at FROM module_link_setup_codes WHERE tenant_id = $1',
      [ws.tenantId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].code_hash, 'the code itself is never stored').not.toContain(code);
    expect(rows[0].code_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(rows[0].consumed_at).toBeNull();
    // Short-lived: comfortably under an hour.
    expect(new Date(rows[0].expires_at).getTime() - Date.now()).toBeLessThan(60 * 60 * 1000);

    // And the status endpoint cannot hand it back.
    const status = await request(app).get('/api/v1/module-links').set(auth(ws));
    expect(JSON.stringify(status.body)).not.toContain(code);
    expect(status.body.data.pending_setup_code).not.toBeNull();
  });

  /** The whole point: the caller has no session here. */
  it('redeeming needs no token, and establishes the link', async () => {
    const code = await mintCode();

    const res = await redeem({
      setup_code: code,
      base_url: 'https://leadgen.example',
      workspace_id: 'lg-ws-1',
      api_key: 'lgk_delivered-by-lead-gen',
    });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.success).toBe(true);
    // A redeem response is not a place to disclose which tenant a code belonged to.
    expect(JSON.stringify(res.body)).not.toContain(ws.tenantId);

    const { rows } = await pool.query(
      'SELECT base_url, api_key_encrypted, remote_workspace_id, is_active FROM module_links WHERE tenant_id = $1',
      [ws.tenantId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].base_url).toBe('https://leadgen.example');
    expect(rows[0].remote_workspace_id).toBe('lg-ws-1');
    expect(rows[0].is_active).toBe(true);
    expect(rows[0].api_key_encrypted, 'stored encrypted').not.toContain('lgk_delivered-by-lead-gen');

    // And it comes back usable through the real lookup.
    const link = await leadGenLink(ws.tenantId);
    expect(link?.apiKey).toBe('lgk_delivered-by-lead-gen');

    // The code is spent.
    const codes = await pool.query('SELECT consumed_at FROM module_link_setup_codes WHERE tenant_id = $1', [ws.tenantId]);
    expect(codes.rows[0].consumed_at).not.toBeNull();

    const status = await request(app).get('/api/v1/module-links').set(auth(ws));
    expect(status.body.data.connected).toBe(true);
    expect(status.body.data.connected_since).not.toBeNull();
    expect(status.body.data.pending_setup_code, 'consumed, so no longer pending').toBeNull();
  });

  /**
   * The security property, asserted as one: a used code, an expired code and a
   * code that never existed must be indistinguishable. Separate messages would
   * tell a prober which codes once existed.
   */
  it('used, expired and unknown codes all fail identically', async () => {
    const used = await mintCode();
    await redeem({ setup_code: used, base_url: 'https://leadgen.example', api_key: 'k1' });
    const reuse = await redeem({ setup_code: used, base_url: 'https://leadgen.example', api_key: 'k2' });

    await pool.query('DELETE FROM module_link_setup_codes WHERE tenant_id = $1', [ws.tenantId]);
    const expiredCode = await mintCode();
    await pool.query(
      `UPDATE module_link_setup_codes SET expires_at = NOW() - INTERVAL '1 minute' WHERE tenant_id = $1`,
      [ws.tenantId],
    );
    const expired = await redeem({ setup_code: expiredCode, base_url: 'https://leadgen.example', api_key: 'k3' });

    const unknown = await redeem({ setup_code: 'mls_never-existed', base_url: 'https://leadgen.example', api_key: 'k4' });

    for (const res of [reuse, expired, unknown]) {
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    }
    expect(reuse.body.message).toBe(expired.body.message);
    expect(expired.body.message).toBe(unknown.body.message);
    expect(reuse.body.message).toMatch(/invalid, expired, or already used/);

    // The reuse did not overwrite the link the first redemption made.
    const link = await leadGenLink(ws.tenantId);
    expect(link?.apiKey).toBe('k1');
  });

  it('a malformed base_url is refused without burning the code', async () => {
    const code = await mintCode();

    const bad = await redeem({ setup_code: code, base_url: 'http://169.254.169.254/latest', api_key: 'k' });
    expect(bad.status).toBe(400);
    expect(bad.body.message).toMatch(/https except for localhost/);

    // Still usable — a bad URL must not cost the admin a new code.
    const codes = await pool.query('SELECT consumed_at FROM module_link_setup_codes WHERE tenant_id = $1', [ws.tenantId]);
    expect(codes.rows[0].consumed_at).toBeNull();

    const good = await redeem({ setup_code: code, base_url: 'https://leadgen.example', api_key: 'k' });
    expect(good.status).toBe(200);
  });

  it('regenerating revokes the previous code rather than leaving two live', async () => {
    const first = await mintCode();
    const second = await mintCode();
    expect(second).not.toBe(first);

    const stale = await redeem({ setup_code: first, base_url: 'https://leadgen.example', api_key: 'k' });
    expect(stale.status, 'the superseded code is dead').toBe(400);

    const fresh = await redeem({ setup_code: second, base_url: 'https://leadgen.example', api_key: 'k' });
    expect(fresh.status).toBe(200);
  });

  it('disconnect clears the credential and revokes any outstanding code', async () => {
    const code = await mintCode();
    await redeem({ setup_code: code, base_url: 'https://leadgen.example', api_key: 'k' });
    const pending = await mintCode();

    const res = await request(app).delete('/api/v1/module-links/lead-gen').set(auth(ws));
    expect(res.status, JSON.stringify(res.body)).toBe(200);

    const link = await leadGenLink(ws.tenantId);
    expect(link, 'inactive links are not returned').toBeNull();

    const { rows } = await pool.query('SELECT api_key_encrypted, is_active FROM module_links WHERE tenant_id = $1', [ws.tenantId]);
    expect(rows[0].api_key_encrypted, 'the secret is what actually goes').toBeNull();
    expect(rows[0].is_active).toBe(false);

    // A code left live after a deliberate disconnect would let the link return.
    const stale = await redeem({ setup_code: pending, base_url: 'https://leadgen.example', api_key: 'k' });
    expect(stale.status).toBe(400);

    const status = await request(app).get('/api/v1/module-links').set(auth(ws));
    expect(status.body.data.connected).toBe(false);
  });

  it('reconnecting after a disconnect replaces the old row rather than failing', async () => {
    const first = await mintCode();
    await redeem({ setup_code: first, base_url: 'https://leadgen.example', api_key: 'old-key' });
    await request(app).delete('/api/v1/module-links/lead-gen').set(auth(ws));

    const second = await mintCode();
    const res = await redeem({ setup_code: second, base_url: 'https://leadgen-2.example', api_key: 'new-key' });
    expect(res.status, JSON.stringify(res.body)).toBe(200);

    const link = await leadGenLink(ws.tenantId);
    expect(link?.apiKey).toBe('new-key');
    expect(link?.baseUrl).toBe('https://leadgen-2.example');

    const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM module_links WHERE tenant_id = $1', [ws.tenantId]);
    expect(rows[0].n, 'one link per module per workspace').toBe(1);
  });

  it("a code installs the link into ITS OWN workspace, not the redeemer's choice", async () => {
    const other = await setupWorkspace('modlinks-b');
    try {
      const code = await mintCode(); // minted by ws
      await redeem({
        setup_code: code, base_url: 'https://leadgen.example', api_key: 'k',
        // A redeemer cannot aim the code somewhere else: the tenant comes off
        // the code's own row, never the body.
        tenant_id: other.tenantId, workspace_id: 'lg-ws',
      });

      expect(await leadGenLink(ws.tenantId)).not.toBeNull();
      expect(await leadGenLink(other.tenantId), "the other workspace is untouched").toBeNull();
    } finally {
      await teardownWorkspace(other);
    }
  });

  it('the administrative routes are closed to a non-administrative role', async () => {
    await pool.query(`UPDATE users SET role = 'sales' WHERE id = $1`, [ws.userId]);
    const salesLogin = await request(app).post('/api/v1/auth/login')
      .send({ email: ws.email, password: 'round-trip-test-password' });
    const salesAuth = { Authorization: `Bearer ${salesLogin.body.token}` };
    try {
      for (const call of [
        request(app).get('/api/v1/module-links').set(salesAuth),
        request(app).post('/api/v1/module-links/lead-gen/setup-code').set(salesAuth),
        request(app).delete('/api/v1/module-links/lead-gen').set(salesAuth),
      ]) {
        const res = await call;
        expect(res.status, JSON.stringify(res.body)).toBe(403);
      }
    } finally {
      await pool.query(`UPDATE users SET role = 'admin' WHERE id = $1`, [ws.userId]);
    }
  });
});
