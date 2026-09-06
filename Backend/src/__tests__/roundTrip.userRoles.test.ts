import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, addUserWithRole, auth, TestWorkspace } from './helpers';

/**
 * PATCH /api/v1/users/:id/role — round trip against real Postgres.
 *
 * Every test here drives the endpoint through a REAL login (setupWorkspace and
 * addUserWithRole both sign in for real and use the token they get back), and
 * reads the result back out of the database rather than trusting the response
 * body. A 200 says the request succeeded; only the row says the role changed.
 */
describe('Role change', () => {
  let ws: TestWorkspace;            // the owning admin
  const roleOf = async (id: string) =>
    (await pool.query('SELECT role FROM users WHERE id = $1', [id])).rows[0]?.role;
  const versionOf = async (id: string) =>
    (await pool.query('SELECT token_version FROM users WHERE id = $1', [id])).rows[0]?.token_version;

  beforeAll(async () => { ws = await setupWorkspace('roles'); });
  afterAll(async () => { await teardownWorkspace(ws); });

  const setRole = (caller: TestWorkspace, targetId: string, role: string) =>
    request(app).patch(`/api/v1/users/${targetId}/role`).set(auth(caller)).send({ role });

  /**
   * Does this token pass an ADMIN-ONLY gate?
   *
   * `POST /pipelines/:id/stages` is `requireRole('admin')` — the
   * stage-configuration screen this whole gap was blocking. Probed with an empty
   * body ON PURPOSE: a non-admin is refused 403 by the middleware before the
   * controller runs, an admin gets 400 from validation, and NOTHING IS WRITTEN
   * either way. Checking a role must not have the side effect of creating a
   * stage.
   */
  const adminOnlyProbe = async (token: string): Promise<number> => {
    const list = await request(app).get('/api/v1/pipelines').set({ Authorization: `Bearer ${token}` });
    // A 401 here means the token itself was rejected, which is an answer too.
    if (list.status !== 200) return list.status;
    const pipelineId = list.body.data[0].id;
    const res = await request(app).post(`/api/v1/pipelines/${pipelineId}/stages`)
      .set({ Authorization: `Bearer ${token}` }).send({});
    return res.status;
  };

  // ── The happy path ────────────────────────────────────────────────────────

  it('an admin promotes a sales user to admin, and the row actually changes', async () => {
    const sales = await addUserWithRole(ws, 'sales');
    const before = await versionOf(sales.userId);

    const res = await setRole(ws, sales.userId, 'admin');
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.data.role).toBe('admin');

    // The database, not the response body.
    expect(await roleOf(sales.userId)).toBe('admin');

    // And their existing sessions end, so the browser's cached "sales" view of
    // what it may do cannot outlive the change.
    expect(await versionOf(sales.userId)).toBe(before + 1);
  });

  it('the promoted user can immediately reach an admin-only endpoint, and their old token cannot', async () => {
    const sales = await addUserWithRole(ws, 'sales');
    const oldToken = sales.token;

    // Before: refused by the admin-only gate.
    expect(await adminOnlyProbe(oldToken)).toBe(403);

    const res = await setRole(ws, sales.userId, 'admin');
    expect(res.status, JSON.stringify(res.body)).toBe(200);

    // The OLD token is now refused outright — token_version moved.
    expect(await adminOnlyProbe(oldToken)).toBe(401);

    // Signing in again gets the new role, and the admin-only route opens.
    const login = await request(app).post('/api/v1/auth/login')
      .send({ email: sales.email, password: 'round-trip-test-password' });
    expect(login.status).toBe(200);
    // 400 (validation), not 403 (the gate) — the admin-only door is open.
    expect(await adminOnlyProbe(login.body.token)).toBe(400);
  });

  it('a demotion takes effect on the very next request, with no re-login needed', async () => {
    // The server reads the role from the row, not the claim, so a demoted
    // admin's still-valid session loses access immediately. Proven by demoting
    // WITHOUT touching their token — the 401 in the test above comes from
    // token_version, which would mask this.
    const victim = await addUserWithRole(ws, 'admin');
    await pool.query('UPDATE users SET role = $2 WHERE id = $1', [victim.userId, 'sales']);

    expect(await adminOnlyProbe(victim.token)).toBe(403);
  });

  // ── Guard 1: never assign a role above your own ───────────────────────────

  it('a MANAGER cannot promote anyone to admin — 403, and the row is untouched', async () => {
    const manager = await addUserWithRole(ws, 'manager');
    const sales   = await addUserWithRole(ws, 'sales');

    const res = await setRole(manager, sales.userId, 'admin');
    expect(res.status, JSON.stringify(res.body)).toBe(403);
    expect(res.body.message).toMatch(/at or below your own/i);
    expect(res.body.assignable_roles).not.toContain('admin');

    expect(await roleOf(sales.userId)).toBe('sales');
  });

  it('a manager CAN assign roles at or below their own', async () => {
    const manager = await addUserWithRole(ws, 'manager');
    const sales   = await addUserWithRole(ws, 'sales');

    const res = await setRole(manager, sales.userId, 'manager');
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(await roleOf(sales.userId)).toBe('manager');
  });

  // ── Guard 2: never act on someone above your own role ─────────────────────

  it('a manager cannot DEMOTE an admin — the same escalation from the other end', async () => {
    // Guard 1 stops a manager minting an admin. Without guard 2 they could
    // instead delete the ceiling above them by demoting the admin to sales,
    // which is a role they ARE allowed to assign.
    const manager = await addUserWithRole(ws, 'manager');
    const admin   = await addUserWithRole(ws, 'admin');

    const res = await setRole(manager, admin.userId, 'sales');
    expect(res.status, JSON.stringify(res.body)).toBe(403);
    expect(res.body.message).toMatch(/cannot change the role of a admin/i);
    expect(await roleOf(admin.userId)).toBe('admin');
  });

  // ── Guard 3: the last admin or manager standing ───────────────────────────

  it('the LAST privileged member cannot demote themselves out of the workspace', async () => {
    // Its own workspace: the shared one always has the owning admin in it, so
    // "last" could never be reached there.
    const solo = await setupWorkspace('roles-solo');
    try {
      await addUserWithRole(solo, 'sales');   // present, and deliberately NOT privileged

      const res = await setRole(solo, solo.userId, 'sales');
      expect(res.status, JSON.stringify(res.body)).toBe(409);
      expect(res.body.message).toMatch(/last admin or manager/i);

      // Still an admin, and still able to act — the guard has to leave the
      // workspace administrable, not merely refuse the request.
      expect(await roleOf(solo.userId)).toBe('admin');
      expect(await adminOnlyProbe(solo.token)).toBe(400);
    } finally {
      await teardownWorkspace(solo);
    }
  });

  it('the last privileged member cannot be demoted by anyone else either', async () => {
    const solo = await setupWorkspace('roles-solo2');
    try {
      const other = await addUserWithRole(solo, 'admin');
      // Now demote the ORIGINAL admin — allowed, because `other` remains.
      const first = await setRole(other, solo.userId, 'sales');
      expect(first.status, JSON.stringify(first.body)).toBe(200);

      // `other` is now the only one left, and cannot be demoted by themselves.
      const second = await setRole(other, other.userId, 'sales');
      expect(second.status, JSON.stringify(second.body)).toBe(409);
      expect(await roleOf(other.userId)).toBe('admin');
    } finally {
      await teardownWorkspace(solo);
    }
  });

  it('an admin may be moved to MANAGER even when they are the only admin — still privileged', async () => {
    // The guard protects the privileged SET, not the admin role specifically.
    // Refusing this would be a false positive that traps a workspace.
    const solo = await setupWorkspace('roles-solo3');
    try {
      const res = await setRole(solo, solo.userId, 'manager');
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      expect(await roleOf(solo.userId)).toBe('manager');
    } finally {
      await teardownWorkspace(solo);
    }
  });

  it('demotion and deactivation cannot empty a workspace by racing each other', async () => {
    // The two endpoints break the SAME invariant and are the reason both take
    // the same workspace-keyed advisory lock. Two admins, each removing the
    // other's privilege simultaneously: without the shared lock both read "one
    // other privileged member remains" and both proceed.
    const solo = await setupWorkspace('roles-race');
    try {
      const a = await addUserWithRole(solo, 'admin');
      const b = await addUserWithRole(solo, 'admin');
      // Exactly two privileged members: demote the workspace's original admin.
      const prep = await setRole(a, solo.userId, 'sales');
      expect(prep.status, JSON.stringify(prep.body)).toBe(200);

      const [demote, deactivate] = await Promise.all([
        request(app).patch(`/api/v1/users/${b.userId}/role`).set(auth(a)).send({ role: 'sales' }),
        request(app).post(`/api/v1/users/${a.userId}/deactivate`).set(auth(b)),
      ]);
      for (const r of [demote, deactivate]) {
        expect(r.body?.message ?? '').not.toMatch(/Internal Server Error/);
      }

      // Whatever order the lock granted, one must have been refused.
      const left = await pool.query(
        `SELECT COUNT(*)::int AS n FROM users
          WHERE tenant_id = $1 AND is_active = true AND role = ANY($2::varchar[])`,
        [solo.tenantId, ['admin', 'manager']],
      );
      expect(left.rows[0].n, `workspace left with ${left.rows[0].n} privileged members`).toBeGreaterThanOrEqual(1);
    } finally {
      await teardownWorkspace(solo);
    }
  });

  // ── GET /users carries the rules the picker renders from ──────────────────

  it('GET /users tells an ADMIN they may assign every role, and whom they may touch', async () => {
    const res = await request(app).get('/api/v1/users?include_inactive=true').set(auth(ws));
    expect(res.status).toBe(200);
    expect(res.body.assignable_roles).toEqual(['sales', 'manager', 'hr', 'admin']);
    // An admin may act on everyone, including themselves — self-demotion is
    // legal while somebody else is privileged, so the control must render.
    expect(res.body.data.every((u: any) => u.can_change_role === true)).toBe(true);
  });

  it('GET /users never offers a MANAGER the admin role, and marks admins untouchable', async () => {
    const manager = await addUserWithRole(ws, 'manager');
    const admin   = await addUserWithRole(ws, 'admin');

    const res = await request(app).get('/api/v1/users?include_inactive=true').set(auth(manager));
    expect(res.status).toBe(200);

    // THE POINT. The picker is populated from this, so a manager cannot be
    // shown an option the server would answer 403 to.
    expect(res.body.assignable_roles).not.toContain('admin');
    expect(res.body.assignable_roles).toEqual(['sales', 'manager', 'hr']);

    const rowFor = (id: string) => res.body.data.find((u: any) => String(u.id) === String(id));
    expect(rowFor(admin.userId).can_change_role).toBe(false);   // above them
    expect(rowFor(manager.userId).can_change_role).toBe(true);  // themselves
  });

  it('GET /users offers a SALES user nothing at all — the route is open, the action is not', async () => {
    const sales = await addUserWithRole(ws, 'sales');
    const res = await request(app).get('/api/v1/users').set(auth(sales));
    // The roster itself still loads: assignment pickers depend on it.
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.assignable_roles).toEqual([]);
    expect(res.body.data.every((u: any) => u.can_change_role === false)).toBe(true);
  });

  // ── Validation, scoping and no-ops ────────────────────────────────────────

  it('rejects a role the app does not understand, before looking anything up', async () => {
    const sales = await addUserWithRole(ws, 'sales');
    for (const role of ['owner', 'ADMIN ', '', 'superuser']) {
      const res = await setRole(ws, sales.userId, role);
      expect(res.status, `role=${JSON.stringify(role)} -> ${res.status}`).toBe(400);
    }
    expect(await roleOf(sales.userId)).toBe('sales');
  });

  it('a user in ANOTHER workspace is 404, not 403 — indistinguishable from not existing', async () => {
    const other = await setupWorkspace('roles-other');
    try {
      const res = await setRole(ws, other.userId, 'sales');
      expect(res.status, JSON.stringify(res.body)).toBe(404);
      expect(await roleOf(other.userId)).toBe('admin');
    } finally {
      await teardownWorkspace(other);
    }
  });

  it('a SALES user cannot reach the endpoint at all', async () => {
    const sales  = await addUserWithRole(ws, 'sales');
    const victim = await addUserWithRole(ws, 'sales');
    const res = await setRole(sales, victim.userId, 'manager');
    expect(res.status).toBe(403);
    expect(await roleOf(victim.userId)).toBe('sales');
  });

  it('setting the role someone already has writes nothing and does not sign them out', async () => {
    const sales = await addUserWithRole(ws, 'sales');
    const before = await versionOf(sales.userId);

    const res = await setRole(ws, sales.userId, 'sales');
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.message).toMatch(/already a sales/i);

    // The point: a double-submitted form must not bump token_version twice and
    // sign somebody out for a change that did not happen.
    expect(await versionOf(sales.userId)).toBe(before);
  });
});
