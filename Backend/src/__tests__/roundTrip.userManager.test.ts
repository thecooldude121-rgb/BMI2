import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import {
  app, setupWorkspace, teardownWorkspace, auth, addUserWithRole, TestWorkspace,
} from './helpers';

/**
 * The CRM's own reporting line. Migration 041.
 *
 * WHY EACH OF THESE EXISTS, since a reporting line looks harmless:
 *
 *  1. It is set and read back, and the roster carries the manager's NAME —
 *     the client should not have to resolve an id to render a row.
 *  2. Null clears it, and absent is NOT null. The top of a hierarchy has no
 *     manager, so clearing is a real operation; omitting the field is a
 *     malformed request and must not be read as "clear it".
 *  3. TENANT ISOLATION ON THE WRITE. users.id is a global primary key, so the
 *     foreign key alone is satisfied by someone else's colleague.
 *  4. TENANT ISOLATION ON THE READ. Both halves are needed, per the project
 *     rule — a planted cross-workspace manager_id must not render a name.
 *  5. NO CYCLES, direct or indirect. A -> B -> A satisfies the FK and the
 *     self-check, and makes any recursive rollup non-terminating. This is the
 *     guard the database cannot express, so it is the one most worth pinning.
 *  6. YOU CANNOT RESTRUCTURE SOMEONE ABOVE YOU — the same "reach above
 *     yourself" shape the role-change endpoint's guard 2 exists to stop.
 */
describe('Reporting line — users.manager_id (migration 041)', () => {
  let ws: TestWorkspace;          // admin
  let other: TestWorkspace;       // a second workspace
  let rep: TestWorkspace;
  let lead: TestWorkspace;
  let manager: TestWorkspace;

  const nameOf = async (id: string | number) => (
    await pool.query(
      `SELECT NULLIF(btrim(COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')), '') AS n
         FROM users WHERE id = $1`, [id])
  ).rows[0]?.n as string | null;

  const setManager = (targetId: string | number, managerId: unknown, as: TestWorkspace = ws) =>
    request(app).patch(`/api/v1/users/${targetId}/manager`).set(auth(as)).send({ manager_id: managerId });

  const managerIdOf = async (id: string | number) => (
    await pool.query('SELECT manager_id FROM users WHERE id = $1', [id])
  ).rows[0]?.manager_id as number | null;

  beforeAll(async () => {
    ws = await setupWorkspace('mgr');
    other = await setupWorkspace('mgr-other');
    rep = await addUserWithRole(ws, 'sales');
    lead = await addUserWithRole(ws, 'sales');
    manager = await addUserWithRole(ws, 'manager');
  });

  afterAll(async () => {
    // Clear the edges first: ON DELETE SET NULL handles it, but teardown is
    // clearer when the rows it deletes are not pointing at each other.
    await pool.query('UPDATE users SET manager_id = NULL WHERE tenant_id = $1', [ws.tenantId]);
    await teardownWorkspace(other);
    await teardownWorkspace(ws);
  });

  it('sets a manager, and GET /users carries the manager NAME as well as the id', async () => {
    const res = await setManager(rep.userId, Number(manager.userId));
    expect(res.status, JSON.stringify(res.body)).toBe(200);

    const expected = await nameOf(manager.userId);
    expect(res.body.data.manager_name).toBe(expected);
    expect(Number(await managerIdOf(rep.userId))).toBe(Number(manager.userId));

    const roster = await request(app).get('/api/v1/users').set(auth(ws));
    expect(roster.status).toBe(200);
    const row = roster.body.data.find((u: { id: number }) => Number(u.id) === Number(rep.userId));
    expect(Number(row.manager_id)).toBe(Number(manager.userId));
    expect(row.manager_name).toBe(expected);
    // The rule is served, not mirrored — same as assignable_roles.
    expect(row.can_change_manager).toBe(true);
  });

  it('an explicit null clears it — the top of a hierarchy has no manager', async () => {
    await setManager(rep.userId, Number(manager.userId));
    const res = await setManager(rep.userId, null);
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(await managerIdOf(rep.userId)).toBeNull();
    expect(res.body.data.manager_name).toBeNull();
  });

  it('an ABSENT manager_id is a 400, not a silent clear', async () => {
    await setManager(rep.userId, Number(manager.userId));
    const res = await request(app)
      .patch(`/api/v1/users/${rep.userId}/manager`).set(auth(ws)).send({});
    expect(res.status, JSON.stringify(res.body)).toBe(400);
    expect(res.body.message).toContain('manager_id is required');
    // The existing edge survives.
    expect(Number(await managerIdOf(rep.userId))).toBe(Number(manager.userId));
    await setManager(rep.userId, null);
  });

  it('a manager from ANOTHER workspace is refused 400, naming the field only', async () => {
    const res = await setManager(rep.userId, Number(other.userId));
    expect(res.status, JSON.stringify(res.body)).toBe(400);
    expect(res.body.message).toContain('manager_id');
    // Must not disclose that the row exists somewhere else.
    expect(res.body.message).not.toMatch(/another workspace|other workspace|exists/i);
    expect(await managerIdOf(rep.userId)).toBeNull();
  });

  it('the roster join is tenant-scoped: a planted cross-workspace manager renders no name', async () => {
    // Both halves of the project rule — the write creates the bad row, the join
    // is what leaks it. Plant the edge directly, bypassing the validated write.
    await pool.query('UPDATE users SET manager_id = $1 WHERE id = $2',
      [Number(other.userId), rep.userId]);
    try {
      const roster = await request(app).get('/api/v1/users').set(auth(ws));
      const row = roster.body.data.find((u: { id: number }) => Number(u.id) === Number(rep.userId));
      expect(Number(row.manager_id)).toBe(Number(other.userId));   // the id is on the row
      expect(row.manager_name).toBeNull();                         // but no name is projected
    } finally {
      await pool.query('UPDATE users SET manager_id = NULL WHERE id = $1', [rep.userId]);
    }
  });

  it('refuses a DIRECT cycle with 409 — the guard the database cannot express', async () => {
    await setManager(rep.userId, Number(manager.userId));
    const res = await setManager(manager.userId, Number(rep.userId));
    expect(res.status, JSON.stringify(res.body)).toBe(409);
    expect(res.body.message).toMatch(/reporting loop/i);
    expect(await managerIdOf(manager.userId)).toBeNull();
    await setManager(rep.userId, null);
  });

  it('refuses an INDIRECT cycle too — A -> B -> C -> A, three hops', async () => {
    // rep reports to lead, lead reports to manager. Making manager report to
    // rep closes the loop, and only a walk up the whole line can see it.
    await setManager(rep.userId, Number(lead.userId));
    await setManager(lead.userId, Number(manager.userId));

    const res = await setManager(manager.userId, Number(rep.userId));
    expect(res.status, JSON.stringify(res.body)).toBe(409);
    expect(await managerIdOf(manager.userId)).toBeNull();

    await setManager(rep.userId, null);
    await setManager(lead.userId, null);
  });

  it('refuses self-management before Postgres has to', async () => {
    const res = await setManager(rep.userId, Number(rep.userId));
    // 409 from the application guard, not a 23514 surfacing as a 500.
    expect(res.status, JSON.stringify(res.body)).toBe(409);
    expect(JSON.stringify(res.body)).not.toMatch(/users_manager_not_self_check|23514/);
    expect(await managerIdOf(rep.userId)).toBeNull();
  });

  it('the database CHECK still backstops self-management if the guard were removed', async () => {
    await expect(
      pool.query('UPDATE users SET manager_id = id WHERE id = $1', [rep.userId]),
    ).rejects.toThrow(/users_manager_not_self_check/);
  });

  it('a MANAGER cannot restructure an admin — no reaching above yourself', async () => {
    const res = await setManager(ws.userId, Number(rep.userId), manager);
    expect(res.status, JSON.stringify(res.body)).toBe(403);
    expect(await managerIdOf(ws.userId)).toBeNull();
  });

  it('a SALES user cannot reach the endpoint at all', async () => {
    const res = await setManager(lead.userId, Number(manager.userId), rep);
    expect([401, 403]).toContain(res.status);
    expect(await managerIdOf(lead.userId)).toBeNull();
  });

  it('a user in another workspace is 404, indistinguishable from not existing', async () => {
    const res = await setManager(other.userId, Number(manager.userId));
    expect(res.status).toBe(404);
  });

  it('a no-op writes nothing and does not report a change that did not happen', async () => {
    await setManager(rep.userId, Number(manager.userId));
    const before = await pool.query('SELECT updated_at FROM users WHERE id = $1', [rep.userId]);
    const res = await setManager(rep.userId, Number(manager.userId));
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/No change/i);
    const after = await pool.query('SELECT updated_at FROM users WHERE id = $1', [rep.userId]);
    expect(after.rows[0].updated_at).toEqual(before.rows[0].updated_at);
    await setManager(rep.userId, null);
  });

  /*
   * THE PERMISSION FLAGS TRAVEL WITH EVERY MEMBER RESPONSE.
   *
   * This pins a bug found by clicking through the UI, not by any test, and it
   * was ALREADY TRUE FOR ROLES before this migration: no PATCH response carried
   * `can_change_role` or `can_change_manager`. The client patches its roster
   * from the mutation response and reads an absent flag as false — correctly,
   * so an older server is never read as permitting something — so changing
   * somebody's manager made BOTH their "Change" links vanish until a refetch.
   *
   * Adding a second control on the same row is what made it visible. Asserting
   * it on every response shape, including the no-ops, is what stops it coming
   * back.
   */
  it('every member response carries the permission flags, including no-ops', async () => {
    const set = await setManager(rep.userId, Number(manager.userId));
    expect(set.status).toBe(200);
    expect(set.body.data.can_change_manager).toBe(true);
    expect(set.body.data.can_change_role).toBe(true);

    // The no-op path returns a different object — it must be just as complete,
    // or patching the roster with it blanks what is on screen.
    const noop = await setManager(rep.userId, Number(manager.userId));
    expect(noop.status).toBe(200);
    expect(noop.body.message).toMatch(/No change/i);
    expect(noop.body.data.can_change_manager).toBe(true);
    expect(noop.body.data.can_change_role).toBe(true);
    expect(Number(noop.body.data.manager_id)).toBe(Number(manager.userId));
    // And the NAME: a no-op that omitted it would be read as "no manager".
    expect(noop.body.data.manager_name).toBe(await nameOf(manager.userId));

    // The role endpoint too, since the same omission was there first.
    const role = await request(app).patch(`/api/v1/users/${rep.userId}/role`)
      .set(auth(ws)).send({ role: 'manager' });
    expect(role.status, JSON.stringify(role.body)).toBe(200);
    expect(role.body.data.can_change_role).toBe(true);
    expect(role.body.data.can_change_manager).toBe(true);

    await request(app).patch(`/api/v1/users/${rep.userId}/role`)
      .set(auth(ws)).send({ role: 'sales' });
    await setManager(rep.userId, null);
  });

  it('deleting a manager orphans their reports rather than deleting them', async () => {
    // ON DELETE SET NULL. Deleting a manager must not take their team with them.
    const doomed = await addUserWithRole(ws, 'manager');
    await setManager(rep.userId, Number(doomed.userId));
    expect(Number(await managerIdOf(rep.userId))).toBe(Number(doomed.userId));

    await pool.query('DELETE FROM users WHERE id = $1', [doomed.userId]);

    const survived = await pool.query('SELECT id, manager_id FROM users WHERE id = $1', [rep.userId]);
    expect(survived.rowCount).toBe(1);
    expect(survived.rows[0].manager_id).toBeNull();
  });
});
