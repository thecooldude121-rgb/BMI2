import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, addUserWithRole, TestWorkspace } from './helpers';

/**
 * My profile — round trip. Settings item 4.
 *
 * PATCH /auth/me and POST /auth/change-password. Both act only on the account
 * the token names, so there is no :id and no role check.
 */
describe('My profile — round trip', () => {
  let ws: TestWorkspace;
  let colleague: TestWorkspace;

  beforeAll(async () => {
    ws = await setupWorkspace('profile');
    colleague = await addUserWithRole(ws, 'sales');
  });
  afterAll(async () => { await teardownWorkspace(ws); });

  /** Read the account straight from Postgres, never from a response body. */
  const row = async (id: string | number = ws.userId) => {
    const r = await pool.query(
      'SELECT first_name, last_name, email, password_hash, role FROM users WHERE id = $1', [id]);
    return r.rows[0];
  };

  // ── PATCH /auth/me ────────────────────────────────────────────────────────

  it('updates name and email, and Postgres holds exactly what was submitted', async () => {
    const email = `updated.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;
    const res = await request(app).patch('/api/v1/auth/me').set(auth(ws))
      .send({ first_name: 'Priya', last_name: 'Nair', email });
    expect(res.status, JSON.stringify(res.body)).toBe(200);

    const after = await row();
    expect(after.first_name).toBe('Priya');
    expect(after.last_name).toBe('Nair');
    expect(after.email).toBe(email);

    // The response must not carry the hash back to the client.
    expect(JSON.stringify(res.body)).not.toContain('password');
  });

  it('is a partial update — omitted fields are left alone', async () => {
    const before = await row();
    const res = await request(app).patch('/api/v1/auth/me').set(auth(ws)).send({ first_name: 'Solo' });
    expect(res.status).toBe(200);

    const after = await row();
    expect(after.first_name).toBe('Solo');
    expect(after.last_name).toBe(before.last_name);
    expect(after.email).toBe(before.email);
  });

  it('cannot change your own role by sending one — privilege escalation is not on offer', async () => {
    const before = await row();
    const res = await request(app).patch('/api/v1/auth/me').set(auth(colleague))
      .send({ first_name: 'Climber', role: 'admin', is_active: false, tenant_id: '00000000-0000-0000-0000-000000000000' });
    expect(res.status, JSON.stringify(res.body)).toBe(200);

    const after = await row(colleague.userId);
    expect(after.first_name).toBe('Climber');   // the writable field applied
    expect(after.role, 'role is not writable here').toBe('sales');
    expect((await row()).role).toBe(before.role);
  });

  it.each([
    ['first_name', '', /first_name cannot be blank/],
    ['last_name', '   ', /last_name cannot be blank/],
    ['email', '', /email cannot be blank/],
    ['email', 'not-an-email', /not a valid email/],
    ['first_name', 'x'.repeat(51), /50 characters or fewer/],
  ])('negative: %s = %j is rejected with the real reason, row unchanged', async (field, bad, pattern) => {
    const before = await row();
    const res = await request(app).patch('/api/v1/auth/me').set(auth(ws)).send({ [field]: bad });
    expect(res.status, JSON.stringify(res.body)).toBe(400);
    expect(res.body.message).toMatch(pattern);
    expect(res.body.message, 'the real reason, not a masked 500').not.toMatch(/Internal Server Error/);
    expect(await row()).toEqual(before);
  });

  it('negative: an empty body is refused rather than silently doing nothing', async () => {
    const res = await request(app).patch('/api/v1/auth/me').set(auth(ws)).send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/No fields to update/);
  });

  it('negative: taking a colleague\'s email is a clean 409, and neither account moves', async () => {
    const mineBefore = await row();
    const theirsBefore = await row(colleague.userId);

    const res = await request(app).patch('/api/v1/auth/me').set(auth(ws))
      .send({ email: colleague.email });
    expect(res.status, JSON.stringify(res.body)).toBe(409);
    expect(res.body.message).toMatch(/already uses that email/);
    expect(res.body.message).not.toMatch(/Internal Server Error/);

    expect((await row()).email).toBe(mineBefore.email);
    expect((await row(colleague.userId)).email).toBe(theirsBefore.email);
  });

  it('the SAME email is still free in a different workspace — the constraint is per workspace', async () => {
    const other = await setupWorkspace('profile-other');
    try {
      const shared = `shared.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;
      expect((await request(app).patch('/api/v1/auth/me').set(auth(ws)).send({ email: shared })).status).toBe(200);
      // A user in another workspace may take the same address.
      const theirs = await request(app).patch('/api/v1/auth/me').set(auth(other)).send({ email: shared });
      expect(theirs.status, JSON.stringify(theirs.body)).toBe(200);
    } finally {
      await teardownWorkspace(other);
    }
  });

  it('unauthenticated cannot edit a profile', async () => {
    expect((await request(app).patch('/api/v1/auth/me').send({ first_name: 'Nobody' })).status).toBe(401);
  });

  // ── POST /auth/change-password ────────────────────────────────────────────

  describe('change password', () => {
    /** A throwaway account per test, so one test's password cannot affect another. */
    const freshUser = async (password = 'round-trip-test-password') => {
      const u = await addUserWithRole(ws, 'sales');
      if (password !== 'round-trip-test-password') {
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2',
          [await bcrypt.hash(password, 10), u.userId]);
      }
      return u;
    };

    it('changes the password: the hash changes, and the NEW password actually logs in', async () => {
      const user = await freshUser();
      const before = await row(user.userId);

      const res = await request(app).post('/api/v1/auth/change-password').set(auth(user))
        .send({ current_password: 'round-trip-test-password', new_password: 'a-brand-new-password' });
      expect(res.status, JSON.stringify(res.body)).toBe(200);

      // The stored hash moved, and it is a hash — not the password.
      const after = await row(user.userId);
      expect(after.password_hash).not.toBe(before.password_hash);
      expect(after.password_hash).not.toContain('a-brand-new-password');
      expect(await bcrypt.compare('a-brand-new-password', after.password_hash)).toBe(true);

      // The real proof: log in with the new password through the real endpoint.
      const relogin = await request(app).post('/api/v1/auth/login')
        .send({ email: user.email, password: 'a-brand-new-password' });
      expect(relogin.status, JSON.stringify(relogin.body)).toBe(200);
      expect(relogin.body.token).toBeTruthy();

      // And the OLD password no longer works.
      const oldPw = await request(app).post('/api/v1/auth/login')
        .send({ email: user.email, password: 'round-trip-test-password' });
      expect(oldPw.status).toBe(401);
    });

    it('reports plainly that other sessions are NOT signed out', async () => {
      const user = await freshUser();
      const res = await request(app).post('/api/v1/auth/change-password').set(auth(user))
        .send({ current_password: 'round-trip-test-password', new_password: 'another-new-password' });
      expect(res.status).toBe(200);

      // Stated in the response rather than left to be assumed. Tokens are
      // stateless and `protect` never re-reads the account, so every other token
      // for this user stays valid until it expires on its own.
      expect(res.body.other_sessions_signed_out).toBe(false);

      // Demonstrated, not just claimed: the token minted BEFORE the change still
      // works afterwards. This is the already-recorded stale-token gap.
      const stillWorks = await request(app).get('/api/v1/auth/me').set(auth(user));
      expect(stillWorks.status, 'the pre-change token remains valid — known gap').toBe(200);
    });

    it('negative: a wrong current password is refused and the hash does not move', async () => {
      const user = await freshUser();
      const before = await row(user.userId);

      const res = await request(app).post('/api/v1/auth/change-password').set(auth(user))
        .send({ current_password: 'not-my-password', new_password: 'a-brand-new-password' });
      expect(res.status, JSON.stringify(res.body)).toBe(400);
      expect(res.body.message).toMatch(/Current password is incorrect/);
      expect(res.body.message).not.toMatch(/Internal Server Error/);

      expect((await row(user.userId)).password_hash).toBe(before.password_hash);
    });

    it.each([
      [{ new_password: 'x'.repeat(12) }, /current_password and new_password are required/],
      [{ current_password: 'round-trip-test-password' }, /current_password and new_password are required/],
      [{ current_password: 'round-trip-test-password', new_password: 'short' }, /at least 8 characters/],
      [{ current_password: 'round-trip-test-password', new_password: 'round-trip-test-password' }, /must be different/],
    ])('negative: %j is rejected, and the hash does not move', async (body, pattern) => {
      const user = await freshUser();
      const before = await row(user.userId);

      const res = await request(app).post('/api/v1/auth/change-password').set(auth(user)).send(body);
      expect(res.status, JSON.stringify(res.body)).toBe(400);
      expect(res.body.message).toMatch(pattern);
      expect((await row(user.userId)).password_hash).toBe(before.password_hash);
    });

    it('one user cannot change another\'s password — there is no id to point elsewhere', async () => {
      const victim = await freshUser();
      const before = await row(victim.userId);

      // Every shape of "act on someone else" the endpoint could be asked for.
      const res = await request(app).post('/api/v1/auth/change-password').set(auth(colleague))
        .send({ user_id: victim.userId, id: victim.userId, email: victim.email,
                current_password: 'round-trip-test-password', new_password: 'hijacked-password-1' });
      // It acts on the CALLER, so at most the caller's own password changed.
      expect((await row(victim.userId)).password_hash, "the victim's hash must not move").toBe(before.password_hash);
      expect([200, 400]).toContain(res.status);
    });

    it('the credential rate limit applies: repeated wrong guesses are throttled', async () => {
      const user = await freshUser();
      const before = await row(user.userId);

      const statuses: number[] = [];
      for (let attempt = 0; attempt < 8; attempt++) {
        const res = await request(app).post('/api/v1/auth/change-password').set(auth(user))
          .send({ current_password: `wrong-guess-${attempt}`, new_password: 'a-brand-new-password' });
        statuses.push(res.status);
        if (res.status === 429) {
          // Standard headers, which a DAST scan looks for.
          expect(res.headers['ratelimit-policy'] ?? res.headers['ratelimit']).toBeTruthy();
          break;
        }
      }
      expect(statuses, `expected a 429 among ${JSON.stringify(statuses)}`).toContain(429);
      // Throttled or not, nothing was changed by a wrong guess.
      expect((await row(user.userId)).password_hash).toBe(before.password_hash);
    });

    it('unauthenticated cannot change a password', async () => {
      const res = await request(app).post('/api/v1/auth/change-password')
        .send({ current_password: 'x', new_password: 'yyyyyyyy' });
      expect(res.status).toBe(401);
    });
  });
});
