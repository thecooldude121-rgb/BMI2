import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, addUserWithRole, TestWorkspace } from './helpers';
import { DEFINITION_VERSION, type ReportDefinition } from '../services/reports/types';

/**
 * DRAFT REPORTS (migration 072) — decided by Venkat 2026-10-17 ("Real draft
 * state"). A draft is private to its owner: hidden from grantees and from admins
 * (even when ownerless), not shareable until saved, and status moves one way
 * only, draft -> saved. Anything a caller may not see is 404, never 403.
 */
describe('Saved reports — drafts', () => {
  let admin: TestWorkspace;   // workspace admin
  let owner: TestWorkspace;   // sales, makes the drafts
  let other: TestWorkspace;   // sales, never owns anything
  const def: ReportDefinition = {
    v: DEFINITION_VERSION, base: 'deals', dimensions: [{ field: 'deals.source' }], metrics: [{ agg: 'count' }],
  };
  let n = 0;
  const create = (as: TestWorkspace, body: Record<string, unknown>) =>
    request(app).post('/api/v1/reports').set(auth(as)).send({ name: `Draft probe ${Date.now()}-${n++}`, definition: def, ...body });
  const row = async (id: string) => (await pool.query('SELECT * FROM saved_reports WHERE id = $1', [id])).rows[0];
  const listIds = async (as: TestWorkspace) =>
    ((await request(app).get('/api/v1/reports').set(auth(as))).body.data as { id: string }[]).map(r => r.id);

  beforeAll(async () => {
    admin = await setupWorkspace('rpt-drafts');
    owner = await addUserWithRole(admin, 'sales');
    other = await addUserWithRole(admin, 'sales');
  });
  afterAll(async () => { await teardownWorkspace(admin); });

  it('status is draft or saved; omitted means saved; anything else is a 400', async () => {
    const d = await create(owner, { status: 'draft' });
    expect(d.status, JSON.stringify(d.body)).toBe(201);
    expect(d.body.data.status).toBe('draft');
    const s = await create(owner, {});
    expect(s.body.data.status).toBe('saved');
    const bad = await create(owner, { status: 'published' });
    expect(bad.status).toBe(400);
    expect(bad.body.message).toMatch(/status must be one of: draft, saved/);
    expect((await request(app).get('/api/v1/reports').set(auth(owner))).body.statuses).toEqual(['draft', 'saved']);
  });

  it('a draft is the owner\'s alone: listed, opened and run by them, 404 to everyone else including an admin', async () => {
    const id = (await create(owner, { status: 'draft' })).body.data.id;
    expect(await listIds(owner)).toContain(id);
    const mine = await request(app).get(`/api/v1/reports/${id}`).set(auth(owner));
    expect(mine.body.data.abilities).toEqual({ can_view: true, can_edit: true, can_delete: true, can_share: false, can_transfer: false });
    expect((await request(app).get(`/api/v1/reports/${id}/run`).set(auth(owner))).status).toBe(200);
    for (const as of [other, admin]) {
      expect(await listIds(as)).not.toContain(id);
      expect((await request(app).get(`/api/v1/reports/${id}`).set(auth(as))).status).toBe(404);
      expect((await request(app).get(`/api/v1/reports/${id}/run`).set(auth(as))).status).toBe(404);
    }
  });

  it('a draft cannot be shared (409 to its owner, naming why), and the row gains no grant', async () => {
    const id = (await create(owner, { status: 'draft' })).body.data.id;
    const res = await request(app).put(`/api/v1/reports/${id}/grants`).set(auth(owner)).send({ user_id: Number(other.userId), level: 'view' });
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/Save this report before sharing it/);
    expect((await pool.query('SELECT 1 FROM saved_report_grants WHERE report_id = $1', [id])).rowCount).toBe(0);
  });

  it('even a grant row that somehow exists on a draft gives nobody access', async () => {
    const id = (await create(owner, { status: 'draft' })).body.data.id;
    await pool.query(
      `INSERT INTO saved_report_grants (report_id, tenant_id, user_id, level, granted_by) VALUES ($1, $2, $3, 'edit', $4)`,
      [id, admin.tenantId, other.userId, owner.userId]);
    expect(await listIds(other)).not.toContain(id);
    expect((await request(app).get(`/api/v1/reports/${id}`).set(auth(other))).status).toBe(404);
    expect((await request(app).get(`/api/v1/reports/${id}/run`).set(auth(other))).status).toBe(404);
    const before = await row(id);
    expect((await request(app).patch(`/api/v1/reports/${id}`).set(auth(other)).send({ name: 'Hijacked' })).status).toBe(404);
    expect(await row(id)).toEqual(before);
  });

  it('draft -> saved: then it can be shared and the grantee sees it', async () => {
    const id = (await create(owner, { status: 'draft' })).body.data.id;
    const saved = await request(app).patch(`/api/v1/reports/${id}`).set(auth(owner)).send({ status: 'saved' });
    expect(saved.status, JSON.stringify(saved.body)).toBe(200);
    expect(saved.body.data.status).toBe('saved');
    expect(saved.body.data.abilities.can_share).toBe(true);
    expect((await request(app).put(`/api/v1/reports/${id}/grants`).set(auth(owner)).send({ user_id: Number(other.userId), level: 'view' })).status).toBe(200);
    expect(await listIds(other)).toContain(id);
  });

  it('saved -> draft is refused: 409 to someone who may edit it, 404 to anyone else, row unchanged', async () => {
    const id = (await create(owner, {})).body.data.id;
    await request(app).put(`/api/v1/reports/${id}/grants`).set(auth(owner)).send({ user_id: Number(other.userId), level: 'edit' });
    const before = await row(id);
    const asOwner = await request(app).patch(`/api/v1/reports/${id}`).set(auth(owner)).send({ status: 'draft' });
    expect(asOwner.status).toBe(409);
    expect(asOwner.body.message).toMatch(/cannot go back to being a draft/);
    expect((await request(app).patch(`/api/v1/reports/${id}`).set(auth(other)).send({ status: 'draft' })).status).toBe(409);
    expect((await request(app).patch(`/api/v1/reports/${id}`).set(auth(admin)).send({ status: 'draft' })).status).toBe(404);
    expect(await row(id)).toEqual(before);
  });

  it('an OWNERLESS draft is not the admin\'s either: no view, delete, transfer or candidates', async () => {
    const goner = await addUserWithRole(admin, 'sales');
    const id = (await create(goner, { status: 'draft' })).body.data.id;
    const deact = await request(app).post(`/api/v1/users/${goner.userId}/deactivate`).set(auth(admin));
    expect(deact.status, JSON.stringify(deact.body)).toBe(200);
    const before = await row(id);
    expect(await listIds(admin)).not.toContain(id);
    expect((await request(app).get(`/api/v1/reports/${id}`).set(auth(admin))).status).toBe(404);
    expect((await request(app).delete(`/api/v1/reports/${id}`).set(auth(admin))).status).toBe(404);
    expect((await request(app).get(`/api/v1/reports/${id}/transfer-candidates`).set(auth(admin))).status).toBe(404);
    expect((await request(app).post(`/api/v1/reports/${id}/transfer`).set(auth(admin)).send({ to_user_id: Number(other.userId) })).status).toBe(404);
    expect(await row(id)).toEqual(before);
    expect((await pool.query('SELECT 1 FROM saved_report_transfers WHERE report_id = $1', [id])).rowCount).toBe(0);
  });

  it('an over-long name or category is a 400 naming the field, not a masked 500', async () => {
    const long = await create(owner, { name: 'x'.repeat(256) });
    expect(long.status).toBe(400);
    expect(long.body.message).toBe('name must be at most 255 characters');
    const cat = await create(owner, { category: 'c'.repeat(101) });
    expect(cat.status).toBe(400);
    expect(cat.body.message).toBe('category must be at most 100 characters');
    const ok = (await create(owner, {})).body.data.id;
    const patchLong = await request(app).patch(`/api/v1/reports/${ok}`).set(auth(owner)).send({ name: 'y'.repeat(256) });
    expect(patchLong.status).toBe(400);
    expect((await create(owner, { name: 'z'.repeat(255) })).status).toBe(201);
  });
});
