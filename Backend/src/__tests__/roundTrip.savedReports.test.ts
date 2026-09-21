import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, addUserWithRole, TestWorkspace } from './helpers';
import { DEFINITION_VERSION, type ReportDefinition } from '../services/reports/types';

/**
 * SAVED REPORTS — persistence, and the two-level sharing model. P3 Phase 2.
 *
 * WHAT THESE PIN, hardest first:
 *  1. ENFORCEMENT IS QUERY-LEVEL. An unauthorised write matches zero rows and
 *     answers 404 — it is not attempted and then rejected. The tests assert the
 *     row is UNCHANGED afterwards, not merely that the status was 404.
 *  2. 404 NEVER 403. The API does not disclose that a report exists in a
 *     workspace, or under an owner, you cannot see.
 *  3. edit implies view, and edit-without-view is unrepresentable.
 *  4. A definition is valid iff it COMPILES. The validator is the Phase 0
 *     builder, so a definition that saves is one that runs.
 *  5. Cross-workspace grants cannot be stored, at the DATABASE.
 */
describe('Saved reports — persistence and sharing', () => {
  let ws: TestWorkspace;          // owner (admin)
  let viewer: TestWorkspace;      // granted view
  let editor: TestWorkspace;      // granted edit
  let stranger: TestWorkspace;    // no grant
  let other: TestWorkspace;       // a different workspace
  let reportId: string;

  const good = (over: Partial<ReportDefinition> = {}): ReportDefinition => ({
    v: DEFINITION_VERSION,
    base: 'deals',
    dimensions: [{ field: 'deals.source' }],
    metrics: [{ agg: 'sum', field: 'deals.value' }],
    ...over,
  });

  const create = (as: TestWorkspace, body: Record<string, unknown>) =>
    request(app).post('/api/v1/reports').set(auth(as)).send(body);

  const stored = async (id: string) => (await pool.query(
    'SELECT * FROM saved_reports WHERE id = $1', [id])).rows[0];

  beforeAll(async () => {
    ws = await setupWorkspace('reports');
    other = await setupWorkspace('reports-other');
    viewer = await addUserWithRole(ws, 'sales');
    editor = await addUserWithRole(ws, 'sales');
    stranger = await addUserWithRole(ws, 'sales');

    const made = await create(ws, {
      name: 'Pipeline by source', category: 'Sales Performance', definition: good(),
    });
    if (made.status !== 201) throw new Error(`fixture: ${JSON.stringify(made.body)}`);
    reportId = made.body.data.id;

    for (const [who, level] of [[viewer, 'view'], [editor, 'edit']] as const) {
      const r = await request(app).put(`/api/v1/reports/${reportId}/grants`).set(auth(ws))
        .send({ user_id: Number(who.userId), level });
      if (r.status !== 200) throw new Error(`grant fixture: ${JSON.stringify(r.body)}`);
    }
  });

  afterAll(async () => {
    const tenants = [ws.tenantId, other.tenantId];
    await pool.query('DELETE FROM saved_reports WHERE tenant_id = ANY($1::uuid[])', [tenants]);
    const left = await pool.query(
      `SELECT (SELECT COUNT(*) FROM saved_reports WHERE tenant_id = ANY($1::uuid[]))
            + (SELECT COUNT(*) FROM saved_report_grants WHERE tenant_id = ANY($1::uuid[])) AS n`,
      [tenants]);
    if (Number(left.rows[0].n) !== 0) throw new Error(`Cleanup failed: ${left.rows[0].n} rows remain`);
    await teardownWorkspace(other);
    await teardownWorkspace(ws);
  });

  // ── 1. Validation is compilation ─────────────────────────────────────────

  it('stores a report, and the definition round-trips through Postgres', async () => {
    const row = await stored(reportId);
    expect(row.name).toBe('Pipeline by source');
    expect(row.definition.base).toBe('deals');
    expect(Number(row.owner_id)).toBe(Number(ws.userId));
  });

  it('refuses a definition the BUILDER cannot compile, with the builder\'s own message', async () => {
    const res = await create(ws, { name: 'Bad field', definition: good({ dimensions: [{ field: 'deals.nope' }] }) });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Unknown field/);

    const none = await pool.query(
      'SELECT COUNT(*)::int AS n FROM saved_reports WHERE tenant_id = $1 AND name = $2',
      [ws.tenantId, 'Bad field']);
    expect(none.rows[0].n).toBe(0);
  });

  it('refuses an unjoinable module combination, and an unknown base', async () => {
    expect((await create(ws, { name: 'x1', definition: good({ base: 'companies', joins: ['activities'] }) })).status).toBe(400);
    expect((await create(ws, { name: 'x2', definition: good({ base: 'employees' }) })).status).toBe(400);
  });

  it('THE DATABASE refuses a definition naming an unlisted base, not only the API', async () => {
    // Migration 056's CHECK — mutation M6 from the design. A controller guard
    // binds one writer; this binds every writer.
    await expect(pool.query(
      `INSERT INTO saved_reports (tenant_id, name, definition, owner_id)
       VALUES ($1, 'db-check', '{"v":1,"base":"employees"}'::jsonb, $2)`,
      [ws.tenantId, ws.userId],
    )).rejects.toThrow(/saved_reports_definition_shape_check/);
  });

  it('THE DATABASE refuses a definition with no version', async () => {
    await expect(pool.query(
      `INSERT INTO saved_reports (tenant_id, name, definition, owner_id)
       VALUES ($1, 'db-check-2', '{"base":"deals"}'::jsonb, $2)`,
      [ws.tenantId, ws.userId],
    )).rejects.toThrow(/saved_reports_definition_shape_check/);
  });

  // ── 2. Who can see it ────────────────────────────────────────────────────

  it('the owner, the viewer and the editor all see it; a stranger does not', async () => {
    for (const who of [ws, viewer, editor]) {
      const res = await request(app).get('/api/v1/reports').set(auth(who));
      expect(res.status).toBe(200);
      expect(res.body.data.map((r: { id: string }) => r.id), who.email).toContain(reportId);
    }
    const none = await request(app).get('/api/v1/reports').set(auth(stranger));
    expect(none.body.data.map((r: { id: string }) => r.id)).not.toContain(reportId);
  });

  it('a stranger gets 404, NOT 403 — existence is not disclosed', async () => {
    const res = await request(app).get(`/api/v1/reports/${reportId}`).set(auth(stranger));
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Report not found');
    expect(JSON.stringify(res.body)).not.toContain('Pipeline by source');
  });

  it('another WORKSPACE gets 404 too', async () => {
    const res = await request(app).get(`/api/v1/reports/${reportId}`).set(auth(other));
    expect(res.status).toBe(404);
  });

  // ── 3. The two levels ────────────────────────────────────────────────────

  it('serves the abilities rather than making the client derive them', async () => {
    const asOwner = await request(app).get(`/api/v1/reports/${reportId}`).set(auth(ws));
    expect(asOwner.body.data.abilities).toEqual(
      { can_view: true, can_edit: true, can_delete: true, can_share: true });

    const asEditor = await request(app).get(`/api/v1/reports/${reportId}`).set(auth(editor));
    expect(asEditor.body.data.abilities).toEqual(
      { can_view: true, can_edit: true, can_delete: false, can_share: false });

    const asViewer = await request(app).get(`/api/v1/reports/${reportId}`).set(auth(viewer));
    expect(asViewer.body.data.abilities).toEqual(
      { can_view: true, can_edit: false, can_delete: false, can_share: false });
  });

  it('an EDITOR may change the definition', async () => {
    const res = await request(app).patch(`/api/v1/reports/${reportId}`).set(auth(editor))
      .send({ description: 'edited by the editor' });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect((await stored(reportId)).description).toBe('edited by the editor');
  });

  it('a VIEWER may NOT — and the row is unchanged, because the predicate is in the UPDATE', async () => {
    const before = await stored(reportId);
    const res = await request(app).patch(`/api/v1/reports/${reportId}`).set(auth(viewer))
      .send({ description: 'viewer should not manage this' });
    expect(res.status).toBe(404);
    const after = await stored(reportId);
    expect(after.description).toBe(before.description);
    expect(after.updated_at).toEqual(before.updated_at);
  });

  it('an EDITOR may NOT delete, and may NOT re-share', async () => {
    const del = await request(app).delete(`/api/v1/reports/${reportId}`).set(auth(editor));
    expect(del.status).toBe(404);
    expect(await stored(reportId)).toBeDefined();

    const share = await request(app).put(`/api/v1/reports/${reportId}/grants`).set(auth(editor))
      .send({ user_id: Number(stranger.userId), level: 'view' });
    expect(share.status).toBe(404);
    const grants = await pool.query(
      'SELECT COUNT(*)::int AS n FROM saved_report_grants WHERE report_id = $1', [reportId]);
    expect(grants.rows[0].n).toBe(2);
  });

  it('edit-without-view is UNREPRESENTABLE: one row, one level', async () => {
    // The schema allows exactly one grant row per (report, user), so there is
    // no state in which someone holds edit but not view.
    const pk = await pool.query(
      `SELECT pg_get_constraintdef(oid) AS def FROM pg_constraint
        WHERE conrelid='saved_report_grants'::regclass AND contype='p'`);
    expect(pk.rows[0].def).toBe('PRIMARY KEY (report_id, user_id)');

    const levels = await pool.query(
      `SELECT pg_get_constraintdef(oid) AS def FROM pg_constraint
        WHERE conname = 'saved_report_grants_level_check'`);
    expect(levels.rows[0].def).toMatch(/view.*edit|edit.*view/);
  });

  it('re-granting at a different level UPDATES rather than failing', async () => {
    await request(app).put(`/api/v1/reports/${reportId}/grants`).set(auth(ws))
      .send({ user_id: Number(viewer.userId), level: 'edit' });
    let level = await pool.query(
      'SELECT level FROM saved_report_grants WHERE report_id = $1 AND user_id = $2',
      [reportId, viewer.userId]);
    expect(level.rows[0].level).toBe('edit');

    // Put it back, so later assertions about the viewer still hold.
    await request(app).put(`/api/v1/reports/${reportId}/grants`).set(auth(ws))
      .send({ user_id: Number(viewer.userId), level: 'view' });
    level = await pool.query(
      'SELECT level FROM saved_report_grants WHERE report_id = $1 AND user_id = $2',
      [reportId, viewer.userId]);
    expect(level.rows[0].level).toBe('view');
  });

  it('refuses an unknown level and a self-grant', async () => {
    expect((await request(app).put(`/api/v1/reports/${reportId}/grants`).set(auth(ws))
      .send({ user_id: Number(viewer.userId), level: 'admin' })).status).toBe(400);
    expect((await request(app).put(`/api/v1/reports/${reportId}/grants`).set(auth(ws))
      .send({ user_id: Number(ws.userId), level: 'edit' })).status).toBe(400);
  });

  // ── 4. Cross-workspace grants ────────────────────────────────────────────

  it('refuses a grantee from another workspace, naming only the field', async () => {
    const res = await request(app).put(`/api/v1/reports/${reportId}/grants`).set(auth(ws))
      .send({ user_id: Number(other.userId), level: 'view' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('user_id does not name a user in this workspace');
    expect(JSON.stringify(res.body)).not.toMatch(/exists|another workspace/i);
  });

  it('THE DATABASE refuses it too, via the composite FK', async () => {
    await expect(pool.query(
      `INSERT INTO saved_report_grants (report_id, user_id, tenant_id, level)
       VALUES ($1, $2, $3, 'view')`,
      [reportId, other.userId, ws.tenantId],
    )).rejects.toThrow(/saved_report_grants_user_fkey/);
  });

  // ── 5. Lifecycle ─────────────────────────────────────────────────────────

  it('a duplicate name in one workspace is a 409, and is fine across workspaces', async () => {
    expect((await create(ws, { name: 'Pipeline by source', definition: good() })).status).toBe(409);
    expect((await create(other, { name: 'Pipeline by source', definition: good() })).status).toBe(201);
  });

  it('deleting a report CASCADES its grants away', async () => {
    const made = await create(ws, { name: 'Disposable', definition: good() });
    const id = made.body.data.id;
    await request(app).put(`/api/v1/reports/${id}/grants`).set(auth(ws))
      .send({ user_id: Number(viewer.userId), level: 'view' });

    const del = await request(app).delete(`/api/v1/reports/${id}`).set(auth(ws));
    expect(del.status).toBe(200);
    const grants = await pool.query(
      'SELECT COUNT(*)::int AS n FROM saved_report_grants WHERE report_id = $1', [id]);
    expect(grants.rows[0].n).toBe(0);
  });

  it('revoking a grant removes the viewer\'s access entirely', async () => {
    const made = await create(ws, { name: 'Revocable', definition: good() });
    const id = made.body.data.id;
    await request(app).put(`/api/v1/reports/${id}/grants`).set(auth(ws))
      .send({ user_id: Number(stranger.userId), level: 'view' });
    expect((await request(app).get(`/api/v1/reports/${id}`).set(auth(stranger))).status).toBe(200);

    await request(app).delete(`/api/v1/reports/${id}/grants/${stranger.userId}`).set(auth(ws));
    expect((await request(app).get(`/api/v1/reports/${id}`).set(auth(stranger))).status).toBe(404);
  });

  it('serves the registry with the list, so no client keeps its own copy', async () => {
    const res = await request(app).get('/api/v1/reports').set(auth(ws));
    expect(res.body.modules.map((m: { key: string }) => m.key)).toContain('deals');
    expect(res.body.modules.map((m: { key: string }) => m.key)).not.toContain('employees');
    expect(res.body.fields.some((f: { key: string }) => f.key === 'companies.industry')).toBe(true);
    expect(res.body.grant_levels).toEqual(['view', 'edit']);
  });

  it('requires authentication', async () => {
    expect((await request(app).get('/api/v1/reports')).status).toBe(401);
    expect((await request(app).post('/api/v1/reports').send({ name: 'x' })).status).toBe(401);
  });
});
