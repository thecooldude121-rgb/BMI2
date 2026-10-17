import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, addUserWithRole, TestWorkspace } from './helpers';
import { DEFINITION_VERSION, type ReportDefinition } from '../services/reports/types';

/**
 * OWNERLESS SAVED REPORTS — decided by Venkat 2026-10-16 (reports replay step c).
 *
 * A report is ownerless when it has no owner (070 clears owner_id when the user is
 * deleted) or its owner is deactivated. A workspace admin may view, delete, or
 * transfer it to an active member of the same workspace; the new owner gets full
 * rights; each transfer is recorded. While the owner is active, an admin does NOT
 * see their private report. Everything an admin may not do is ABSENT (404), never
 * a 403, and a refused write leaves the row unchanged.
 */
describe('Saved reports — ownerless reports', () => {
  let ws: TestWorkspace;          // the workspace admin
  let other: TestWorkspace;       // an admin of ANOTHER workspace
  let manager: TestWorkspace;     // privileged, but not an admin
  let member: TestWorkspace;      // an active member — the transfer target
  const def: ReportDefinition = {
    v: DEFINITION_VERSION, base: 'deals', dimensions: [{ field: 'deals.source' }], metrics: [{ agg: 'count' }],
  };
  let n = 0;
  const reportFor = async (owner: TestWorkspace) => {
    const r = await request(app).post('/api/v1/reports').set(auth(owner))
      .send({ name: `Ownerless probe ${Date.now()}-${n++}`, definition: def });
    if (r.status !== 201) throw new Error(`fixture: ${JSON.stringify(r.body)}`);
    return r.body.data.id as string;
  };
  const row = async (id: string) => (await pool.query('SELECT * FROM saved_reports WHERE id = $1', [id])).rows[0];
  const get = (as: TestWorkspace, id: string) => request(app).get(`/api/v1/reports/${id}`).set(auth(as));
  const del = (as: TestWorkspace, id: string) => request(app).delete(`/api/v1/reports/${id}`).set(auth(as));
  const transfer = (as: TestWorkspace, id: string, to: number | string) =>
    request(app).post(`/api/v1/reports/${id}/transfer`).set(auth(as)).send({ to_user_id: Number(to) });
  const candidates = (as: TestWorkspace, id: string) =>
    request(app).get(`/api/v1/reports/${id}/transfer-candidates`).set(auth(as));
  const listIds = async (as: TestWorkspace) =>
    ((await request(app).get('/api/v1/reports').set(auth(as))).body.data as { id: string }[]).map(r => r.id);
  const deactivate = async (who: TestWorkspace) => {
    const r = await request(app).post(`/api/v1/users/${who.userId}/deactivate`).set(auth(ws));
    if (r.status !== 200) throw new Error(`deactivate fixture: ${JSON.stringify(r.body)}`);
  };

  beforeAll(async () => {
    ws = await setupWorkspace('rpt-ownerless');
    other = await setupWorkspace('rpt-ownerless-other');
    manager = await addUserWithRole(ws, 'manager');
    member = await addUserWithRole(ws, 'sales');
  });

  afterAll(async () => {
    await teardownWorkspace(ws);
    await teardownWorkspace(other);
  });

  it('while the owner is ACTIVE, an admin cannot see, delete or transfer their private report', async () => {
    const owner = await addUserWithRole(ws, 'sales');
    const id = await reportFor(owner);
    const before = await row(id);

    expect((await get(ws, id)).status).toBe(404);
    expect(await listIds(ws)).not.toContain(id);
    expect((await del(ws, id)).status).toBe(404);
    expect((await transfer(ws, id, member.userId)).status).toBe(404);
    expect((await candidates(ws, id)).status).toBe(404);
    expect(await row(id)).toEqual(before);
  });

  it('DEACTIVATED owner: the admin may view and transfer it — but not edit it or change its grants', async () => {
    const owner = await addUserWithRole(ws, 'sales');
    const id = await reportFor(owner);
    await request(app).put(`/api/v1/reports/${id}/grants`).set(auth(owner)).send({ user_id: Number(member.userId), level: 'view' });
    await deactivate(owner);

    const seen = await get(ws, id);
    expect(seen.status, JSON.stringify(seen.body)).toBe(200);
    expect(seen.body.data.ownerless).toBe(true);
    expect(seen.body.data.abilities).toEqual(
      { can_view: true, can_edit: false, can_delete: true, can_share: false, can_transfer: true });
    expect(await listIds(ws)).toContain(id);

    // View, delete, transfer — and nothing more.
    const before = await row(id);
    expect((await request(app).patch(`/api/v1/reports/${id}`).set(auth(ws)).send({ name: 'Hijacked' })).status).toBe(404);
    expect((await request(app).put(`/api/v1/reports/${id}/grants`).set(auth(ws)).send({ user_id: Number(manager.userId), level: 'edit' })).status).toBe(404);
    expect(await row(id)).toEqual(before);

    // Admins only: a manager, and the grantee themselves, get nothing extra.
    expect((await get(manager, id)).status).toBe(404);
    expect((await transfer(manager, id, manager.userId)).status).toBe(404);
    expect((await transfer(member, id, member.userId)).status).toBe(404);
    expect((await get(member, id)).body.data.abilities.can_transfer).toBe(false);

    // The picker: ACTIVE members of THIS workspace only.
    const c = await candidates(ws, id);
    expect(c.status).toBe(200);
    const ids = (c.body.data as { id: number }[]).map(p => p.id);
    expect(ids).toEqual(expect.arrayContaining([Number(ws.userId), Number(manager.userId), Number(member.userId)]));
    expect(ids).not.toContain(Number(owner.userId));       // deactivated
    expect(ids).not.toContain(Number(other.userId));       // another workspace

    // The server re-checks what the picker offers.
    expect((await transfer(ws, id, owner.userId)).body.message).toMatch(/to_user_id does not name an active member/);
    expect((await transfer(ws, id, other.userId)).status).toBe(400);
    expect(await row(id)).toEqual(before);

    // The transfer, and its record.
    const t = await transfer(ws, id, member.userId);
    expect(t.status, JSON.stringify(t.body)).toBe(200);
    expect(Number((await row(id)).owner_id)).toBe(Number(member.userId));
    const rec = (await pool.query('SELECT * FROM saved_report_transfers WHERE report_id = $1', [id])).rows;
    expect(rec).toHaveLength(1);
    expect(rec[0]).toMatchObject({
      tenant_id: ws.tenantId,
      from_user_id: Number(owner.userId),
      to_user_id: Number(member.userId),
      transferred_by: Number(ws.userId),
    });
    expect(rec[0].from_user_name).toBeTruthy();
    expect(rec[0].to_user_name).toBeTruthy();
    expect(rec[0].transferred_by_name).toBeTruthy();
    expect(rec[0].transferred_at).toBeInstanceOf(Date);
    // The new owner's old grant is gone — an owner has everything.
    expect((await pool.query('SELECT 1 FROM saved_report_grants WHERE report_id = $1 AND user_id = $2', [id, member.userId])).rowCount).toBe(0);

    // Full rights for the new owner…
    expect((await get(member, id)).body.data.abilities).toEqual(
      { can_view: true, can_edit: true, can_delete: true, can_share: true, can_transfer: false });
    expect((await request(app).put(`/api/v1/reports/${id}/grants`).set(auth(member)).send({ user_id: Number(manager.userId), level: 'view' })).status).toBe(200);
    // …and the report is private to the admin again, because its owner is active.
    expect((await get(ws, id)).status).toBe(404);
    expect((await transfer(ws, id, ws.userId)).status).toBe(404);
  });

  it('DELETED owner (070 cleared owner_id): the admin may delete it, or transfer it with no "from"', async () => {
    const goner = await addUserWithRole(ws, 'sales');
    const toDelete = await reportFor(goner);
    const toKeep = await reportFor(goner);
    await pool.query('DELETE FROM users WHERE id = $1 AND tenant_id = $2', [goner.userId, ws.tenantId]);
    expect((await row(toDelete)).owner_id).toBeNull();

    const seen = await get(ws, toKeep);
    expect(seen.status).toBe(200);
    expect(seen.body.data).toMatchObject({ owner_id: null, ownerless: true });

    const t = await transfer(ws, toKeep, member.userId);
    expect(t.status, JSON.stringify(t.body)).toBe(200);
    expect(t.body.transfer).toMatchObject({ from_user_id: null, from_user_name: null, to_user_id: Number(member.userId) });

    const d = await del(ws, toDelete);
    expect(d.status, JSON.stringify(d.body)).toBe(200);
    expect(await row(toDelete)).toBeUndefined();
  });

  it('an admin of ANOTHER workspace gets 404 on everything, and the row is unchanged', async () => {
    const goner = await addUserWithRole(ws, 'sales');
    const id = await reportFor(goner);
    await deactivate(goner);
    const before = await row(id);

    expect((await get(other, id)).status).toBe(404);
    expect(await listIds(other)).not.toContain(id);
    expect((await del(other, id)).status).toBe(404);
    expect((await transfer(other, id, other.userId)).status).toBe(404);
    expect((await transfer(other, id, member.userId)).status).toBe(404);
    expect((await candidates(other, id)).status).toBe(404);
    expect(await row(id)).toEqual(before);
    expect((await pool.query('SELECT 1 FROM saved_report_transfers WHERE report_id = $1', [id])).rowCount).toBe(0);
  });

  it('a transfer record survives the report and the people it names', async () => {
    const goner = await addUserWithRole(ws, 'sales');
    const target = await addUserWithRole(ws, 'sales');
    const id = await reportFor(goner);
    await deactivate(goner);
    expect((await transfer(ws, id, target.userId)).status).toBe(200);
    await del(target, id);
    await pool.query('DELETE FROM users WHERE id = ANY($1::int[]) AND tenant_id = $2', [[goner.userId, target.userId], ws.tenantId]);
    const rec = (await pool.query(
      'SELECT * FROM saved_report_transfers WHERE tenant_id = $1 AND to_user_name IS NOT NULL AND report_id IS NULL AND to_user_id IS NULL',
      [ws.tenantId])).rows;
    expect(rec.length).toBeGreaterThanOrEqual(1);
    expect(rec[0].report_name).toMatch(/Ownerless probe/);
  });
});
