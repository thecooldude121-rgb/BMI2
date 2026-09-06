import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, addUserWithRole, TestWorkspace } from './helpers';

/**
 * token_version — round trip. See TOKEN_VERSION_DESIGN.md.
 *
 * `protect` now reads the account on every request, so role, is_active and
 * token_version are live rather than a snapshot trusted for seven days. These
 * tests exercise each of the three findings that closed, plus the rollout
 * fallback and the scoping rule that keeps an admin from signing out their own
 * workspace.
 */
describe('token_version — live session state', () => {
  let ws: TestWorkspace;

  beforeAll(async () => { ws = await setupWorkspace('tokenver'); });
  afterAll(async () => { await teardownWorkspace(ws); });

  const versionOf = async (id: string | number): Promise<number> => {
    const r = await pool.query('SELECT token_version FROM users WHERE id = $1', [id]);
    return r.rows[0].token_version;
  };
  const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

  // ── FINDING 1: a deactivated user's token stops working immediately ───────

  it('REGRESSION: a deactivated user is refused at once, not when their token expires', async () => {
    const victim = await addUserWithRole(ws, 'sales');
    const victimToken = bearer(victim.token);

    // Works right up to the moment of deactivation.
    expect((await request(app).get('/api/v1/auth/me').set(victimToken)).status).toBe(200);
    expect(await versionOf(victim.userId)).toBe(0);

    const deactivate = await request(app).post(`/api/v1/users/${victim.userId}/deactivate`).set(auth(ws));
    expect(deactivate.status, JSON.stringify(deactivate.body)).toBe(200);

    // The same token, one request later. Before migration 036 this stayed
    // valid for up to seven days — deactivation was a control that controlled
    // nothing for a week.
    const after = await request(app).get('/api/v1/auth/me').set(victimToken);
    expect(after.status, "a deactivated user's token must be refused").toBe(401);
    expect(after.body.message).toMatch(/deactivated/i);

    // The message names the reason rather than sending them round a
    // re-authentication loop that cannot succeed.
    expect(after.body.message).not.toMatch(/Internal Server Error/);
    expect(await versionOf(victim.userId)).toBe(1);
  });

  it('a deactivated user cannot reach data endpoints either, not just /auth/me', async () => {
    const victim = await addUserWithRole(ws, 'sales');
    const victimToken = bearer(victim.token);
    await request(app).post(`/api/v1/users/${victim.userId}/deactivate`).set(auth(ws));

    for (const path of ['/api/v1/contacts', '/api/v1/deals', '/api/v1/workspace']) {
      const res = await request(app).get(path).set(victimToken);
      expect(res.status, `${path} must refuse a deactivated user`).toBe(401);
    }
  });

  it('reactivation does NOT bump, so it cannot invalidate the token about to be issued', async () => {
    const user = await addUserWithRole(ws, 'sales');
    await request(app).post(`/api/v1/users/${user.userId}/deactivate`).set(auth(ws));
    const afterDeactivate = await versionOf(user.userId);

    const res = await request(app).post(`/api/v1/users/${user.userId}/reactivate`).set(auth(ws));
    expect(res.status).toBe(200);
    // There was no live session to revoke — every token the account held is
    // already refused — so bumping would sign out nobody.
    expect(await versionOf(user.userId)).toBe(afterDeactivate);
  });

  // ── FINDING 2: the role is live ───────────────────────────────────────────

  it('REGRESSION: a role change takes effect on the next request, not in 7 days', async () => {
    const user = await addUserWithRole(ws, 'manager');
    const userToken = bearer(user.token);

    // A manager may list invites.
    expect((await request(app).get('/api/v1/invites').set(userToken)).status).toBe(200);

    // Demote in the database — there is no API path for this today, which is
    // why this finding was only ever reachable by direct SQL.
    await pool.query(`UPDATE users SET role = 'sales' WHERE id = $1`, [user.userId]);

    // The SAME token, which still carries role: 'manager' in its claim.
    const after = await request(app).get('/api/v1/invites').set(userToken);
    expect(after.status, 'the live role must win over the claim').toBe(403);
    expect(after.body.message).toMatch(/Insufficient permissions/);
  });

  it('a promotion is live too — the claim is not a ceiling', async () => {
    const user = await addUserWithRole(ws, 'sales');
    const userToken = bearer(user.token);
    expect((await request(app).get('/api/v1/invites').set(userToken)).status).toBe(403);

    await pool.query(`UPDATE users SET role = 'manager' WHERE id = $1`, [user.userId]);
    expect((await request(app).get('/api/v1/invites').set(userToken)).status).toBe(200);
  });

  // ── THE SCOPING RULE — the point of the whole change ─────────────────────

  /**
   * The guard against a bare `UPDATE users SET token_version = token_version + 1`
   * or one scoped by tenant instead of id. Either would sign out the entire
   * workspace, INCLUDING the admin doing the deactivating, and would present as
   * an outage rather than a bug.
   */
  it('deactivating another user bumps ONLY the target — the acting admin is untouched', async () => {
    const target = await addUserWithRole(ws, 'sales');
    const bystander = await addUserWithRole(ws, 'sales');

    const adminBefore = await versionOf(ws.userId);
    const targetBefore = await versionOf(target.userId);
    const bystanderBefore = await versionOf(bystander.userId);

    const res = await request(app).post(`/api/v1/users/${target.userId}/deactivate`).set(auth(ws));
    expect(res.status, JSON.stringify(res.body)).toBe(200);

    // Read every row, not just the target's.
    expect(await versionOf(target.userId), "the target's version must bump").toBe(targetBefore + 1);
    expect(await versionOf(ws.userId), "the acting admin's version must NOT move").toBe(adminBefore);
    expect(await versionOf(bystander.userId), "an uninvolved member must NOT move").toBe(bystanderBefore);

    // And the admin's own session still works — the failure this guards would
    // have logged them out mid-action.
    const stillAdmin = await request(app).get('/api/v1/auth/me').set(auth(ws));
    expect(stillAdmin.status, "the admin's own session must survive").toBe(200);
    expect((await request(app).get('/api/v1/users').set(auth(ws))).status).toBe(200);

    // The bystander's token still works too.
    expect((await request(app).get('/api/v1/auth/me').set(bearer(bystander.token))).status).toBe(200);
  });

  it('cross-tenant: an admin cannot bump a user in another workspace', async () => {
    const other = await setupWorkspace('tokenver-other');
    try {
      const before = await versionOf(other.userId);
      const res = await request(app).post(`/api/v1/users/${other.userId}/deactivate`).set(auth(ws));
      // 404, not 403 — existence in another workspace is not disclosed.
      expect(res.status).toBe(404);
      expect(await versionOf(other.userId), 'their version must not move').toBe(before);
      // And their session is unaffected.
      expect((await request(app).get('/api/v1/auth/me').set(auth(other))).status).toBe(200);
    } finally {
      await teardownWorkspace(other);
    }
  });

  it('concurrent deactivations of one user leave the version at +1, not +2 or +1-lost', async () => {
    const target = await addUserWithRole(ws, 'sales');
    const before = await versionOf(target.userId);

    // token_version + 1 is computed inside the UPDATE, so two of these cannot
    // read the same value and lose one — the read-then-write mistake this
    // project already paid for with MAX(id) + 1. The second request finds the
    // account already inactive and short-circuits without a second bump.
    const [a, b] = await Promise.all([
      request(app).post(`/api/v1/users/${target.userId}/deactivate`).set(auth(ws)),
      request(app).post(`/api/v1/users/${target.userId}/deactivate`).set(auth(ws)),
    ]);
    for (const r of [a, b]) {
      expect([200], JSON.stringify(r.body)).toContain(r.status);
      expect(r.body?.message ?? '').not.toMatch(/Internal Server Error/);
    }
    const after = await versionOf(target.userId);
    expect(after, `expected exactly one bump, got ${after - before}`).toBe(before + 1);
  });

  // ── THE ROLLOUT FALLBACK — nothing else exercises this ───────────────────

  /**
   * A token minted before migration 036 carries no `token_version` claim. The
   * rollout decision is that an absent claim reads as 0 and is COMPARED, so
   * pre-deploy tokens keep working (no global sign-out) while any actual
   * revocation refuses them immediately.
   *
   * No ordinary code path produces such a token any more, so this is signed by
   * hand — deliberately, because this is the one behaviour that only exists for
   * the deploy window and would otherwise ship untested.
   */
  it('a token with NO token_version claim is accepted while the row is still 0', async () => {
    const user = await addUserWithRole(ws, 'sales');
    expect(await versionOf(user.userId)).toBe(0);

    const legacyToken = jwt.sign(
      { id: user.userId, email: user.email, role: 'sales', workspace_id: ws.tenantId },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' },
    );

    const res = await request(app).get('/api/v1/auth/me').set(bearer(legacyToken));
    expect(res.status, 'a pre-036 token must keep working — no forced global re-login').toBe(200);
  });

  it('...and is refused the moment that user is actually revoked', async () => {
    const user = await addUserWithRole(ws, 'sales');
    const legacyToken = jwt.sign(
      { id: user.userId, email: user.email, role: 'sales', workspace_id: ws.tenantId },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' },
    );
    expect((await request(app).get('/api/v1/auth/me').set(bearer(legacyToken))).status).toBe(200);

    // Any revocation moves the row off 0.
    await pool.query('UPDATE users SET token_version = token_version + 1 WHERE id = $1', [user.userId]);

    const after = await request(app).get('/api/v1/auth/me').set(bearer(legacyToken));
    expect(after.status, 'the claimless token must not bypass revocation').toBe(401);
    expect(after.body.message).toMatch(/no longer valid/i);
  });

  // ── Other failure modes protect now covers ───────────────────────────────

  it('a token for a deleted account is refused', async () => {
    const doomed = await addUserWithRole(ws, 'sales');
    const doomedToken = bearer(doomed.token);
    expect((await request(app).get('/api/v1/auth/me').set(doomedToken)).status).toBe(200);

    await pool.query('DELETE FROM users WHERE id = $1', [doomed.userId]);
    const res = await request(app).get('/api/v1/auth/me').set(doomedToken);
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/no longer valid/i);
  });

  it('a fresh login issues a token carrying the CURRENT version', async () => {
    const user = await addUserWithRole(ws, 'sales');
    await pool.query('UPDATE users SET token_version = 5 WHERE id = $1', [user.userId]);

    // Log in for real and confirm the new token works against a row at 5 —
    // if signToken omitted the claim it would read as 0 and be refused.
    const login = await request(app).post('/api/v1/auth/login')
      .send({ email: user.email, password: 'round-trip-test-password' });
    expect(login.status, JSON.stringify(login.body)).toBe(200);

    const res = await request(app).get('/api/v1/auth/me').set(bearer(login.body.token));
    expect(res.status, 'a freshly minted token must match the current version').toBe(200);
  });

  it('attribution still works without the per-controller users query', async () => {
    // resolveActorName now reads the name protect already fetched. If that
    // wiring broke, created_by would fall back to the email or 'Unknown'.
    const contact = await request(app).post('/api/v1/contacts').set(auth(ws))
      .send({ first_name: 'Attr', last_name: 'Check', email: `attr.${Date.now()}.${Math.random()}@example.com` });
    expect(contact.status).toBe(201);

    const activity = await request(app).post('/api/v1/activities').set(auth(ws))
      .send({ subject: 'Attribution after 036', type: 'note', contact_id: contact.body.data.id });
    expect(activity.status, JSON.stringify(activity.body)).toBe(201);

    const row = await pool.query('SELECT created_by FROM activities WHERE id = $1', [activity.body.data.id]);
    expect(row.rows[0].created_by).toBe('Round Tripper');
  });
});
