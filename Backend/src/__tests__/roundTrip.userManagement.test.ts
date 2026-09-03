import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, addUserWithRole, TestWorkspace } from './helpers';

/**
 * User management — round trip. Settings item 2.
 *
 * Listing the workspace's people, deactivating softly, and invites.
 */
describe('User management — round trip', () => {
  let ws: TestWorkspace;          // the workspace admin, from setupWorkspace
  let manager: TestWorkspace;
  let sales: TestWorkspace;

  beforeAll(async () => {
    ws = await setupWorkspace('usermgmt');
    manager = await addUserWithRole(ws, 'manager');
    sales = await addUserWithRole(ws, 'sales');
  });

  afterAll(async () => {
    await pool.query('DELETE FROM workspace_invites WHERE workspace_id = $1', [ws.tenantId]);
    await teardownWorkspace(ws);
  });

  const roster = async () => {
    const r = await pool.query(
      'SELECT id, role, is_active FROM users WHERE tenant_id = $1 ORDER BY id', [ws.tenantId]);
    return r.rows;
  };

  // ── Listing ───────────────────────────────────────────────────────────────

  it('lists the workspace members, scoped to the caller\'s workspace', async () => {
    const other = await setupWorkspace('usermgmt-other');
    try {
      const res = await request(app).get('/api/v1/users').set(auth(ws));
      expect(res.status, JSON.stringify(res.body)).toBe(200);

      const ids = res.body.data.map((u: { id: number }) => String(u.id));
      expect(ids).toContain(String(ws.userId));
      expect(ids).toContain(String(manager.userId));
      // Nobody from another workspace, ever.
      expect(ids).not.toContain(String(other.userId));

      // Cross-check the count against Postgres rather than trusting the payload.
      const mine = await pool.query(
        'SELECT COUNT(*)::int AS n FROM users WHERE tenant_id = $1 AND is_active = true', [ws.tenantId]);
      expect(res.body.data.length).toBe(mine.rows[0].n);
    } finally {
      await teardownWorkspace(other);
    }
  });

  it('the DEFAULT still returns active users only, so existing callers are unaffected', async () => {
    const victim = await addUserWithRole(ws, 'sales');
    await request(app).post(`/api/v1/users/${victim.userId}/deactivate`).set(auth(ws));

    const res = await request(app).get('/api/v1/users').set(auth(ws));
    const ids = res.body.data.map((u: { id: number }) => String(u.id));
    expect(ids, 'a deactivated user must not appear in the default list').not.toContain(String(victim.userId));
    expect(res.body.data.every((u: { is_active: boolean }) => u.is_active)).toBe(true);

    // ...and include_inactive=true shows them, because the screen that manages
    // deactivation cannot be the one screen that hides deactivated people.
    const all = await request(app).get('/api/v1/users?include_inactive=true').set(auth(ws));
    expect(all.status).toBe(200);
    const allIds = all.body.data.map((u: { id: number }) => String(u.id));
    expect(allIds).toContain(String(victim.userId));
    expect(all.body.data.find((u: { id: number }) => String(u.id) === String(victim.userId)).is_active).toBe(false);

    await request(app).post(`/api/v1/users/${victim.userId}/reactivate`).set(auth(ws));
  });

  it('only the literal string "true" opts in — a stray value does not widen the list', async () => {
    const victim = await addUserWithRole(ws, 'sales');
    await request(app).post(`/api/v1/users/${victim.userId}/deactivate`).set(auth(ws));
    for (const q of ['include_inactive=1', 'include_inactive=yes', 'include_inactive=']) {
      const res = await request(app).get(`/api/v1/users?${q}`).set(auth(ws));
      const ids = res.body.data.map((u: { id: number }) => String(u.id));
      expect(ids, `"${q}" must not include inactive users`).not.toContain(String(victim.userId));
    }
    await request(app).post(`/api/v1/users/${victim.userId}/reactivate`).set(auth(ws));
  });

  // ── Deactivation: the happy path ──────────────────────────────────────────

  it('deactivate is SOFT — is_active flips to false and the row survives', async () => {
    const victim = await addUserWithRole(ws, 'sales');
    const before = await pool.query('SELECT COUNT(*)::int AS n FROM users WHERE tenant_id = $1', [ws.tenantId]);

    const res = await request(app).post(`/api/v1/users/${victim.userId}/deactivate`).set(auth(ws));
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.data.is_active).toBe(false);

    // Read the row back: flipped, not deleted.
    const row = await pool.query('SELECT is_active, email FROM users WHERE id = $1', [victim.userId]);
    expect(row.rows[0].is_active).toBe(false);
    expect(row.rows[0].email).toBe(victim.email);
    const after = await pool.query('SELECT COUNT(*)::int AS n FROM users WHERE tenant_id = $1', [ws.tenantId]);
    expect(after.rows[0].n, 'nothing may be hard deleted').toBe(before.rows[0].n);

    // And it is reversible.
    const back = await request(app).post(`/api/v1/users/${victim.userId}/reactivate`).set(auth(ws));
    expect(back.status).toBe(200);
    expect((await pool.query('SELECT is_active FROM users WHERE id = $1', [victim.userId])).rows[0].is_active).toBe(true);
  });

  // ── GUARD 1, on its own ───────────────────────────────────────────────────

  /**
   * Self-deactivation is refused EVEN WHEN OTHER ADMINS EXIST. If this were
   * folded into the last-admin condition it would pass here, because the
   * workspace is in no danger — and an admin would be able to lock themselves
   * out one click at a time.
   */
  it('GUARD 1: you cannot deactivate yourself, even with other admins present', async () => {
    const secondAdmin = await addUserWithRole(ws, 'admin');
    try {
      // Prove the precondition: the workspace is NOT down to its last admin.
      const others = await pool.query(
        `SELECT COUNT(*)::int AS n FROM users
          WHERE tenant_id = $1 AND is_active = true AND role IN ('admin','manager') AND id <> $2`,
        [ws.tenantId, ws.userId]);
      expect(others.rows[0].n, 'precondition: other admins/managers exist').toBeGreaterThan(0);

      const res = await request(app).post(`/api/v1/users/${ws.userId}/deactivate`).set(auth(ws));
      expect(res.status, JSON.stringify(res.body)).toBe(409);
      expect(res.body.message).toBe('You cannot deactivate your own account');
      expect(res.body.message).not.toMatch(/Internal Server Error/);

      // Still active.
      const row = await pool.query('SELECT is_active FROM users WHERE id = $1', [ws.userId]);
      expect(row.rows[0].is_active).toBe(true);
    } finally {
      await pool.query('DELETE FROM users WHERE id = $1', [secondAdmin.userId]);
    }
  });

  it('GUARD 1 applies to an ordinary member deactivating themselves too', async () => {
    // A manager may call this endpoint, so the self-guard must hold for them.
    const res = await request(app).post(`/api/v1/users/${manager.userId}/deactivate`).set(auth(manager));
    expect(res.status, JSON.stringify(res.body)).toBe(409);
    expect(res.body.message).toBe('You cannot deactivate your own account');
    expect((await pool.query('SELECT is_active FROM users WHERE id = $1', [manager.userId])).rows[0].is_active).toBe(true);
  });

  // ── GUARD 2, on its own ───────────────────────────────────────────────────

  /**
   * The last-admin guard fires when the target is SOMEBODY ELSE, proving it is
   * not merely the self-check wearing a different message.
   *
   * Constructing this needs care. Normally an admin calling the endpoint is
   * themselves an active privileged member, so removing anyone else always
   * leaves at least one — the two guards would only ever overlap. The reachable
   * case is a caller whose token still says admin while their stored role no
   * longer does: `protect` reads the role from the JWT, so a role changed
   * mid-session still passes requireRole while its holder is correctly no
   * longer counted as an active admin. That is exactly the situation where the
   * workspace could be emptied of admins by someone who is not one, so it is
   * the right scenario to pin.
   */
  it('GUARD 2: cannot deactivate the last admin/manager, even when it is NOT yourself', async () => {
    const isolated = await setupWorkspace('lastadmin');
    try {
      const lastManager = await addUserWithRole(isolated, 'manager');
      // The workspace admin's token stays privileged; their stored role does not.
      await pool.query(`UPDATE users SET role = 'sales' WHERE id = $1`, [isolated.userId]);
      // Everyone else must be inactive so `lastManager` really is the last one.
      await pool.query(
        `UPDATE users SET is_active = false WHERE tenant_id = $1 AND id <> $2 AND id <> $3`,
        [isolated.tenantId, lastManager.userId, isolated.userId]);

      const privileged = await pool.query(
        `SELECT COUNT(*)::int AS n FROM users
          WHERE tenant_id = $1 AND is_active = true AND role IN ('admin','manager')`,
        [isolated.tenantId]);
      expect(privileged.rows[0].n, 'precondition: exactly one privileged member').toBe(1);

      const res = await request(app)
        .post(`/api/v1/users/${lastManager.userId}/deactivate`).set(auth(isolated));

      // Not self — the caller is a different user.
      expect(String(lastManager.userId)).not.toBe(String(isolated.userId));
      expect(res.status, JSON.stringify(res.body)).toBe(409);
      expect(res.body.message).toBe('Cannot deactivate the last admin or manager in this workspace');

      const row = await pool.query('SELECT is_active FROM users WHERE id = $1', [lastManager.userId]);
      expect(row.rows[0].is_active, 'the last manager must survive').toBe(true);
    } finally {
      await teardownWorkspace(isolated);
    }
  });

  it('GUARD 2 does not fire for an ordinary member — only privileged roles are counted', async () => {
    const ordinary = await addUserWithRole(ws, 'sales');
    const res = await request(app).post(`/api/v1/users/${ordinary.userId}/deactivate`).set(auth(ws));
    expect(res.status, 'deactivating a sales user is never the last-admin case').toBe(200);
    expect((await pool.query('SELECT is_active FROM users WHERE id = $1', [ordinary.userId])).rows[0].is_active).toBe(false);
  });

  it('an admin CAN deactivate another admin while one remains', async () => {
    const spare = await addUserWithRole(ws, 'admin');
    const res = await request(app).post(`/api/v1/users/${spare.userId}/deactivate`).set(auth(ws));
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect((await pool.query('SELECT is_active FROM users WHERE id = $1', [spare.userId])).rows[0].is_active).toBe(false);
  });

  // ── RBAC and isolation ────────────────────────────────────────────────────

  it('a sales user cannot deactivate anyone, and the target stays active', async () => {
    const victim = await addUserWithRole(ws, 'sales');
    const res = await request(app).post(`/api/v1/users/${victim.userId}/deactivate`).set(auth(sales));
    expect(res.status, JSON.stringify(res.body)).toBe(403);
    expect(res.body.message).toMatch(/Insufficient permissions/);
    expect((await pool.query('SELECT is_active FROM users WHERE id = $1', [victim.userId])).rows[0].is_active).toBe(true);
  });

  it('tenant isolation: a user in another workspace is 404, not 403, and is untouched', async () => {
    const other = await setupWorkspace('usermgmt-iso');
    try {
      const res = await request(app).post(`/api/v1/users/${other.userId}/deactivate`).set(auth(ws));
      // 404 rather than 403: existence in another workspace must not be disclosed.
      expect(res.status, JSON.stringify(res.body)).toBe(404);
      const row = await pool.query('SELECT is_active FROM users WHERE id = $1', [other.userId]);
      expect(row.rows[0].is_active).toBe(true);
    } finally {
      await teardownWorkspace(other);
    }
  });

  // ── Invites ───────────────────────────────────────────────────────────────

  describe('invites (log transport — no mail is delivered)', () => {
    it('creates a real invite row and reports email_sent HONESTLY as false', async () => {
      const email = `invitee.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;
      const res = await request(app).post('/api/v1/invites').set(auth(ws))
        .send({ email, role: 'sales' });
      expect(res.status, JSON.stringify(res.body)).toBe(201);

      // The whole point: the log transport did not deliver, and says so.
      expect(res.body.email_sent, 'log transport delivers nothing').toBe(false);
      expect(res.body.accept_url, 'an admin needs a way to pass the link on').toBeTruthy();
      expect(res.body.accept_url).toMatch(/\/register\?invite=/);
      expect(res.body.note).toMatch(/does not deliver mail/i);

      // A real row, scoped to this workspace, with the token stored HASHED.
      const row = await pool.query(
        'SELECT email, role, token_hash, workspace_id, accepted_at, revoked_at FROM workspace_invites WHERE id = $1',
        [res.body.invite.id]);
      expect(row.rows[0].email).toBe(email);
      expect(row.rows[0].role).toBe('sales');
      expect(row.rows[0].workspace_id).toBe(ws.tenantId);
      expect(row.rows[0].accepted_at).toBeNull();
      expect(row.rows[0].revoked_at).toBeNull();

      // The raw token from the URL must NOT be what is stored.
      const rawToken = String(res.body.accept_url).split('invite=')[1];
      expect(rawToken).toBeTruthy();
      expect(row.rows[0].token_hash).not.toBe(rawToken);
      expect(row.rows[0].token_hash.length).toBe(64);   // sha256 hex
    });

    it('negative: a malformed email and an unassignable role are refused, nothing created', async () => {
      const before = await pool.query('SELECT COUNT(*)::int AS n FROM workspace_invites WHERE workspace_id = $1', [ws.tenantId]);

      const badEmail = await request(app).post('/api/v1/invites').set(auth(ws)).send({ email: 'not-an-email' });
      expect(badEmail.status).toBe(400);
      expect(badEmail.body.message).toMatch(/valid email/);

      const badRole = await request(app).post('/api/v1/invites').set(auth(ws))
        .send({ email: `role.${Date.now()}@example.com`, role: 'superuser' });
      expect(badRole.status).toBe(400);
      expect(badRole.body.message).toMatch(/role must be one of/);

      const after = await pool.query('SELECT COUNT(*)::int AS n FROM workspace_invites WHERE workspace_id = $1', [ws.tenantId]);
      expect(after.rows[0].n).toBe(before.rows[0].n);
    });

    it('negative: inviting an existing member is a clean 409', async () => {
      const res = await request(app).post('/api/v1/invites').set(auth(ws))
        .send({ email: sales.email, role: 'sales' });
      expect(res.status, JSON.stringify(res.body)).toBe(409);
      expect(res.body.message).toMatch(/already a member/);
      expect(res.body.message).not.toMatch(/Internal Server Error/);
    });

    it('re-inviting supersedes the open invite rather than leaving two live', async () => {
      const email = `resend.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;
      const first = await request(app).post('/api/v1/invites').set(auth(ws)).send({ email });
      const second = await request(app).post('/api/v1/invites').set(auth(ws)).send({ email });
      expect(second.status, JSON.stringify(second.body)).toBe(201);

      const live = await pool.query(
        `SELECT COUNT(*)::int AS n FROM workspace_invites
          WHERE workspace_id = $1 AND lower(email) = lower($2)
            AND accepted_at IS NULL AND revoked_at IS NULL`,
        [ws.tenantId, email]);
      expect(live.rows[0].n, 'exactly one invite may be live for an address').toBe(1);

      const superseded = await pool.query('SELECT revoked_at FROM workspace_invites WHERE id = $1', [first.body.invite.id]);
      expect(superseded.rows[0].revoked_at).toBeTruthy();
    });

    it('a sales user cannot invite, list or revoke', async () => {
      const before = await pool.query('SELECT COUNT(*)::int AS n FROM workspace_invites WHERE workspace_id = $1', [ws.tenantId]);
      expect((await request(app).post('/api/v1/invites').set(auth(sales)).send({ email: `x.${Date.now()}@example.com` })).status).toBe(403);
      expect((await request(app).get('/api/v1/invites').set(auth(sales))).status).toBe(403);
      const after = await pool.query('SELECT COUNT(*)::int AS n FROM workspace_invites WHERE workspace_id = $1', [ws.tenantId]);
      expect(after.rows[0].n).toBe(before.rows[0].n);
    });

    it('invites are workspace-scoped: another workspace never sees them', async () => {
      const email = `scoped.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;
      const mine = await request(app).post('/api/v1/invites').set(auth(ws)).send({ email });
      expect(mine.status).toBe(201);

      const other = await setupWorkspace('invite-iso');
      try {
        const list = await request(app).get('/api/v1/invites').set(auth(other));
        expect(list.status).toBe(200);
        const ids = (list.body.data ?? list.body.invites ?? []).map((r: { id: string }) => r.id);
        expect(ids).not.toContain(mine.body.invite.id);
      } finally {
        await pool.query('DELETE FROM workspace_invites WHERE workspace_id = $1', [other.tenantId]);
        await teardownWorkspace(other);
      }
    });
  });
});
