import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, addUserWithRole, TestWorkspace } from './helpers';

/**
 * A workspace can never be emptied of admins — under concurrency, not just
 * sequentially.
 *
 * THE RACE THIS PINS, measured before the fix: two admins deactivating each
 * other simultaneously each read "one other privileged member remains" — A sees
 * B, B sees A — and both proceeded. SEVEN OF EIGHT TRIALS left the workspace
 * with zero active admins or managers: unable to invite, unable to change its
 * settings, unable to promote anyone, and with nothing in the product able to
 * undo it from the inside. Guard 2 was a check-then-write and its count was
 * stale by the time the write landed.
 *
 * Closed by holding a workspace-scoped advisory lock across the check and the
 * write, the same pattern already proven for the concurrent company-import
 * duplicate. Asserted across several trials rather than once, because a single
 * pass proved nothing here — one of the eight original trials passed by luck.
 */
describe('Workspace cannot be emptied of admins', () => {
  const created: TestWorkspace[] = [];
  afterAll(async () => { for (const ws of created) await teardownWorkspace(ws); });

  /** A workspace whose ONLY active privileged members are the two returned. */
  const twoAdminWorkspace = async (label: string) => {
    const ws = await setupWorkspace(label);
    created.push(ws);
    const a = await addUserWithRole(ws, 'admin');
    const b = await addUserWithRole(ws, 'admin');
    await pool.query(
      `UPDATE users SET is_active = false WHERE tenant_id = $1 AND id <> $2 AND id <> $3`,
      [ws.tenantId, a.userId, b.userId]);
    const count = await pool.query(
      `SELECT COUNT(*)::int AS n FROM users
        WHERE tenant_id = $1 AND is_active = true AND role = ANY(ARRAY['admin','manager']::varchar[])`,
      [ws.tenantId]);
    expect(count.rows[0].n, 'precondition: exactly two privileged members').toBe(2);
    return { ws, a, b };
  };

  const privilegedCount = async (tenantId: string): Promise<number> => {
    const r = await pool.query(
      `SELECT COUNT(*)::int AS n FROM users
        WHERE tenant_id = $1 AND is_active = true AND role = ANY(ARRAY['admin','manager']::varchar[])`,
      [tenantId]);
    return r.rows[0].n;
  };

  // Several trials: the pre-fix failure was 7-in-8, so one pass means nothing.
  for (const trial of [1, 2, 3, 4, 5]) {
    it(`trial ${trial}: two admins deactivating EACH OTHER at once leaves one standing`, async () => {
      const { ws, a, b } = await twoAdminWorkspace(`mutual-${trial}-${Date.now()}`);

      const [ra, rb] = await Promise.all([
        request(app).post(`/api/v1/users/${b.userId}/deactivate`).set(auth(a)),
        request(app).post(`/api/v1/users/${a.userId}/deactivate`).set(auth(b)),
      ]);

      // Neither may be a masked 500 — the interesting failure would be one of
      // them blowing up on the lock rather than waiting for it.
      for (const r of [ra, rb]) {
        expect(r.body?.message ?? '').not.toMatch(/Internal Server Error/);
        expect([200, 401, 409], `unexpected ${r.status}: ${JSON.stringify(r.body)}`).toContain(r.status);
      }

      // THE ASSERTION. Before the fix this was 0.
      const left = await privilegedCount(ws.tenantId);
      expect(left, `workspace emptied of admins: ${ra.status}/${rb.status}`).toBe(1);

      // And the survivor can still administer it — the point of the invariant.
      const survivor = (await pool.query(
        `SELECT id FROM users WHERE tenant_id = $1 AND is_active = true
           AND role = ANY(ARRAY['admin','manager']::varchar[])`, [ws.tenantId])).rows[0];
      expect([String(a.userId), String(b.userId)]).toContain(String(survivor.id));
    });
  }

  it('the loser is refused with the real reason, not a masked 500', async () => {
    const { ws, a, b } = await twoAdminWorkspace(`reason-${Date.now()}`);
    const [ra, rb] = await Promise.all([
      request(app).post(`/api/v1/users/${b.userId}/deactivate`).set(auth(a)),
      request(app).post(`/api/v1/users/${a.userId}/deactivate`).set(auth(b)),
    ]);

    const refused = [ra, rb].filter(r => r.status !== 200);
    expect(refused.length, 'exactly one of the two must be refused').toBe(1);
    // Either the guard caught it (409) or the loser's own session was already
    // revoked by the winner (401). Both are correct refusals; neither is a 500.
    const r = refused[0];
    if (r.status === 409) {
      expect(r.body.message).toBe('Cannot deactivate the last admin or manager in this workspace');
    } else {
      expect(r.status).toBe(401);
      expect(r.body.message).toMatch(/deactivated|no longer valid/i);
    }
    expect(await privilegedCount(ws.tenantId)).toBe(1);
  });

  it('deactivating two DIFFERENT ordinary members at once is not serialized into failure', async () => {
    // The lock is workspace-scoped, so unrelated deactivations queue behind each
    // other — they must still both succeed, not one be refused.
    const ws = await setupWorkspace(`ordinary-${Date.now()}`);
    created.push(ws);
    const x = await addUserWithRole(ws, 'sales');
    const y = await addUserWithRole(ws, 'sales');

    const [rx, ry] = await Promise.all([
      request(app).post(`/api/v1/users/${x.userId}/deactivate`).set(auth(ws)),
      request(app).post(`/api/v1/users/${y.userId}/deactivate`).set(auth(ws)),
    ]);
    expect(rx.status, JSON.stringify(rx.body)).toBe(200);
    expect(ry.status, JSON.stringify(ry.body)).toBe(200);

    const inactive = await pool.query(
      'SELECT COUNT(*)::int AS n FROM users WHERE id = ANY($1::int[]) AND is_active = false',
      [[x.userId, y.userId]]);
    expect(inactive.rows[0].n).toBe(2);
  });

  it('the lock is workspace-scoped: another workspace is not blocked by it', async () => {
    const one = await setupWorkspace(`scopeA-${Date.now()}`);
    const two = await setupWorkspace(`scopeB-${Date.now()}`);
    created.push(one, two);
    const inOne = await addUserWithRole(one, 'sales');
    const inTwo = await addUserWithRole(two, 'sales');

    // Simultaneous deactivations in DIFFERENT workspaces take different keys and
    // must both succeed.
    const [r1, r2] = await Promise.all([
      request(app).post(`/api/v1/users/${inOne.userId}/deactivate`).set(auth(one)),
      request(app).post(`/api/v1/users/${inTwo.userId}/deactivate`).set(auth(two)),
    ]);
    expect(r1.status, JSON.stringify(r1.body)).toBe(200);
    expect(r2.status, JSON.stringify(r2.body)).toBe(200);
  });
});
