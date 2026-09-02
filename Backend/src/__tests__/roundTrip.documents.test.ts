import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';

/**
 * Documents — Phase 4.
 *
 * SCOPE, stated precisely. Live `documents` is 0 rows, so the POPULATED
 * DOCUMENTS TIMELINE AS RENDERED remains unproven, exactly as the activity
 * timeline does — that needs the UI and real usage data, and seeding rows to
 * force the render would break the no-fabricated-data rule to satisfy a
 * verification rule. See PROMPT_C_SUMMARY.md.
 *
 * What IS provable, and is proven here, is the documents API round trip: a
 * record this test creates and deletes inside one run is test data, not
 * fabricated product data, and is re-read from Postgres and re-counted away.
 * The honest EMPTY state is also asserted, since that is what the timeline
 * actually shows today and an empty list is a correct result, not a gap.
 *
 * Only the metadata path (POST /documents) is exercised. POST /documents/upload
 * writes to S3-compatible storage, which is not configured in this suite; its
 * validation boundary is tested, its storage side effect is not.
 */
describe('Documents — round trip', () => {
  let ws: TestWorkspace;
  let dealId: string;
  const docIds: string[] = [];

  beforeAll(async () => {
    ws = await setupWorkspace('docs');
    const deal = await request(app).post('/api/v1/deals').set(auth(ws))
      .send({ name: `Docs Deal ${Date.now()}`, value: 7500 });
    if (deal.status !== 201) throw new Error(`deal fixture failed: ${JSON.stringify(deal.body)}`);
    dealId = deal.body.data.id;
  });

  afterAll(async () => {
    await pool.query('DELETE FROM documents WHERE tenant_id = $1', [ws.tenantId]);
    const left = await pool.query('SELECT COUNT(*)::int AS n FROM documents WHERE tenant_id = $1', [ws.tenantId]);
    if (left.rows[0].n !== 0) throw new Error(`Cleanup failed: ${left.rows[0].n} documents remain`);
    await pool.query('DELETE FROM deals WHERE tenant_id = $1', [ws.tenantId]);
    await teardownWorkspace(ws);
  });

  it('the honest empty state: a workspace with no documents returns an empty list, not an error', async () => {
    const res = await request(app).get('/api/v1/documents').set(auth(ws));
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(0);
  });

  /**
   * ████ KNOWN BUG — REPORTED, NOT FIXED, NOT LOOSENED ████
   *
   * `documents.uploaded_by` is varchar(10) (migration 017), and createDocument
   * writes resolveActorName(req) into it — `first_name last_name`, or the
   * user's email as a fallback. Almost every real value overflows: this suite's
   * own actor "Round Tripper" is 13 characters. Postgres answers "value too
   * long for type character varying(10)" and errorHandler masks it as a bare
   * 500, so POST /documents fails for essentially every real user.
   *
   * Proven, not inferred: a 13-character uploaded_by is refused at the column
   * while a 7-character one passes the same insert. Pre-existing — the last
   * commits to touch documentsController and migration 017 all predate this
   * work — and it cannot be worked around by a client, because uploaded_by is
   * derived server-side and can neither be supplied nor shortened by a caller.
   *
   * The assertion below is the CORRECT behaviour (201) and is deliberately
   * unchanged. `it.fails` records that it does not hold today rather than
   * loosening it to match the bug or leaving the suite permanently red. When
   * the column is widened, THIS WRAPPER FAILS — that is the intent: change it
   * back to a plain `it`, do not delete it.
   *
   * Fix is a one-line migration widening the column to VARCHAR(255), matching
   * activities.created_by. Deferred to an explicit decision.
   */
  it.fails('create: a document record round-trips, and is readable back through the API', async () => {
    const payload = {
      name: `Proposal ${Date.now()}.pdf`,
      file_url: 'https://example.invalid/proposal.pdf',
      file_size: 20480,
      file_type: 'application/pdf',
      module: 'deal',
      record_id: dealId,
      category: 'proposal',
      description: 'Round-trip test record',
    };
    const res = await request(app).post('/api/v1/documents').set(auth(ws)).send(payload);
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    const id = res.body.data.id;
    docIds.push(id);

    const row = await pool.query('SELECT * FROM documents WHERE id = $1 AND tenant_id = $2', [id, ws.tenantId]);
    expect(row.rows[0], 'the document must actually exist in Postgres').toBeTruthy();
    expect(row.rows[0].name).toBe(payload.name);
    expect(row.rows[0].file_type).toBe(payload.file_type);
    expect(Number(row.rows[0].file_size)).toBe(payload.file_size);
    expect(row.rows[0].module).toBe('deal');
    expect(row.rows[0].record_id).toBe(dealId);
    expect(row.rows[0].version).toBe(1);
    expect(row.rows[0].uploaded_by, 'attributed to the real actor').toBe('Round Tripper');

    // And it now appears on the deal's document list — the timeline query.
    const listed = await request(app).get(`/api/v1/documents?module=deal&record_id=${dealId}`).set(auth(ws));
    expect(listed.status).toBe(200);
    expect(listed.body.data.some((d: { id: string }) => d.id === id)).toBe(true);
  });

  it('negative: a missing name is rejected with the real reason, nothing created', async () => {
    const before = await pool.query('SELECT COUNT(*)::int AS n FROM documents WHERE tenant_id = $1', [ws.tenantId]);
    const res = await request(app).post('/api/v1/documents').set(auth(ws)).send({ file_url: 'https://example.invalid/x.pdf' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/name is required/);
    expect(res.body.message).not.toMatch(/Internal Server Error/);
    const after = await pool.query('SELECT COUNT(*)::int AS n FROM documents WHERE tenant_id = $1', [ws.tenantId]);
    expect(after.rows[0].n).toBe(before.rows[0].n);
  });

  it('negative: module without record_id (and vice versa) is refused rather than half-linked', async () => {
    const onlyModule = await request(app).post('/api/v1/documents').set(auth(ws))
      .send({ name: 'Orphan link.pdf', module: 'deal' });
    expect(onlyModule.status).toBe(400);
    expect(onlyModule.body.message).toMatch(/must be supplied together/);

    const onlyRecord = await request(app).post('/api/v1/documents').set(auth(ws))
      .send({ name: 'Orphan link 2.pdf', record_id: dealId });
    expect(onlyRecord.status).toBe(400);
    expect(onlyRecord.body.message).toMatch(/must be supplied together/);
  });

  it('negative: an invalid module is rejected with the allowed list', async () => {
    const res = await request(app).post('/api/v1/documents').set(auth(ws))
      .send({ name: 'Bad module.pdf', module: 'telepathy', record_id: dealId });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/module must be one of/);
  });

  it('negative: a parent record from another workspace is refused, naming the field only', async () => {
    const wsB = await setupWorkspace('docs-foreign');
    try {
      const dealB = await request(app).post('/api/v1/deals').set(auth(wsB))
        .send({ name: `Foreign Deal ${Date.now()}`, value: 100 });
      expect(dealB.status).toBe(201);

      const before = await pool.query('SELECT COUNT(*)::int AS n FROM documents WHERE tenant_id = $1', [ws.tenantId]);
      const res = await request(app).post('/api/v1/documents').set(auth(ws))
        .send({ name: 'Cross tenant.pdf', module: 'deal', record_id: dealB.body.data.id });
      expect(res.status).toBe(400);
      expect(res.body.message).not.toMatch(/exists|another workspace/i);
      const after = await pool.query('SELECT COUNT(*)::int AS n FROM documents WHERE tenant_id = $1', [ws.tenantId]);
      expect(after.rows[0].n).toBe(before.rows[0].n);
    } finally {
      await pool.query('DELETE FROM deals WHERE tenant_id = $1', [wsB.tenantId]);
      await teardownWorkspace(wsB);
    }
  });

  it('negative: POST /documents/upload with no file is a clean 400, not a 500', async () => {
    const res = await request(app).post('/api/v1/documents/upload').set(auth(ws));
    expect(res.status, JSON.stringify(res.body)).toBe(400);
    expect(res.body.message).toMatch(/file is required/);
    expect(res.body.message).not.toMatch(/Internal Server Error/);
  });

  /**
   * FIXTURE INSERTED DIRECTLY, and this is a workaround for the bug above, not
   * a shortcut of convenience: POST /documents cannot currently create a row at
   * all, so a test whose subject is ISOLATION would otherwise be untestable.
   * Stated explicitly per the project's rule that a substituted step is
   * declared, never silent. What it leaves unproven is only the create path,
   * which the red test above already owns; isolation itself is exercised
   * through the real API on both sides of the boundary.
   */
  it('tenant isolation: workspace B cannot read, list or delete workspace A\'s document', async () => {
    const seeded = await pool.query(
      `INSERT INTO documents (name, module, record_id, uploaded_by, tenant_id)
       VALUES ($1, 'deal', $2, 'RT', $3) RETURNING id`,
      [`Isolated doc ${Date.now()}.pdf`, dealId, ws.tenantId],
    );
    const id = seeded.rows[0].id;
    docIds.push(id);

    const wsB = await setupWorkspace('docs-b');
    try {
      // Not readable.
      expect((await request(app).get(`/api/v1/documents/${id}`).set(auth(wsB))).status).toBe(404);

      // Not listable.
      const list = await request(app).get('/api/v1/documents').set(auth(wsB));
      expect(list.status).toBe(200);
      expect(list.body.data.some((d: { id: string }) => d.id === id)).toBe(false);

      // AND NOT DESTROYABLE — the assertion that actually matters. B's delete
      // is refused at the query (DELETE ... AND tenant_id = $2 matches nothing),
      // so A's document survives. The misleading 200 that comes back with it is
      // a separate, non-destructive defect; see the next test.
      const attempt = await request(app).delete(`/api/v1/documents/${id}`).set(auth(wsB));
      expect(attempt.body.deleted, 'workspace B must delete nothing').toBe(0);

      const row = await pool.query('SELECT COUNT(*)::int AS n FROM documents WHERE id = $1', [id]);
      expect(row.rows[0].n, "workspace A's document must still exist").toBe(1);
    } finally {
      await teardownWorkspace(wsB);
    }
  });

  /**
   * ████ SECOND KNOWN BUG — REPORTED, NOT FIXED ████
   *
   * DELETE /documents/:id returns 200 for an id that is not in the caller's
   * workspace (or does not exist), where every other single-resource endpoint
   * in this API returns 404 — getDocumentById does, and so do contacts,
   * companies, deals and tasks.
   *
   * Cause: routes.delete('/') and routes.delete('/:id') share one handler, so
   * the single form inherits BULK semantics and reports partial success instead
   * of not-found. To its credit the body is honest — { deleted: 0, requested: 1 }
   * plus "0 of 1 deleted; the rest were not found in this tenant" — and the
   * query is correctly tenant-scoped, so NOTHING IS DESTROYED and this is not a
   * cross-tenant hole. The test above proves that separately and passes.
   *
   * It is still worth fixing, and it is the very pattern this suite exists for:
   * a client that checks `res.ok` and not the body will report "document
   * deleted" for another workspace's file. 200 with deleted: 0 is a success
   * status with no write behind it.
   *
   * Assertion left as the correct 404. Not loosened, not fixed.
   */
  it.fails('single-id delete of a foreign or missing document should be 404, not 200', async () => {
    const missing = await request(app).delete(`/api/v1/documents/${'0'.repeat(8)}-0000-0000-0000-000000000000`).set(auth(ws));
    expect(missing.status).toBe(404);
  });

  // Same directly-inserted fixture, same declared reason — the subject is DELETE.
  it('delete removes the row, verified by re-counting rather than by the 200', async () => {
    const seeded = await pool.query(
      `INSERT INTO documents (name, uploaded_by, tenant_id) VALUES ($1, 'RT', $2) RETURNING id`,
      [`Deletable ${Date.now()}.pdf`, ws.tenantId],
    );
    const id = seeded.rows[0].id;

    const del = await request(app).delete(`/api/v1/documents/${id}`).set(auth(ws));
    expect(del.status, JSON.stringify(del.body)).toBe(200);

    const gone = await pool.query('SELECT COUNT(*)::int AS n FROM documents WHERE id = $1', [id]);
    expect(gone.rows[0].n).toBe(0);
  });
});
