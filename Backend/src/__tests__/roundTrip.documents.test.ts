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
   * REGRESSION GUARD. This failed outright until migration 032.
   *
   * `documents.uploaded_by` was VARCHAR(10) while createDocument writes
   * resolveActorName(req) into it — "first_name last_name", or the user's email
   * as a fallback. Almost every real value overflowed, Postgres answered "value
   * too long for type character varying(10)", and errorHandler masked it as a
   * bare 500, so POST /documents failed for essentially every real user. No
   * client could avoid it: uploaded_by is derived server-side.
   *
   * The measured ceilings are why the column is now 255 and not 100: the name
   * path reaches 101 characters (two VARCHAR(50) fields plus a space) and the
   * email fallback reaches 150 (users.email is VARCHAR(150)). This test's own
   * actor, "Round Tripper", is 13 — enough to break the old column, which is
   * how the bug surfaced.
   *
   * The assertion was never loosened while the bug stood; it was wrapped in
   * `it.fails` and is now a plain `it` again.
   */
  it('create: a document record round-trips, and is readable back through the API', async () => {
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
    // The exact value that used to overflow VARCHAR(10) — stored in full, not
    // truncated. 13 characters, so a silent truncation would show up here too.
    expect(row.rows[0].uploaded_by, 'attributed to the real actor').toBe('Round Tripper');
    expect(row.rows[0].uploaded_by.length).toBe(13);

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

  /*
   * THE UPLOAD BUG, PINNED AT THE BOUNDARY IT FAILED AT.
   *
   * The upload form sent CAPITALISED modules — 'Deal', 'Account', 'Contact' —
   * because `related_entity_type` was an untyped string and nothing normalised
   * it. `VALID_MODULES.includes('Deal')` is false, so every upload carrying a
   * related record was rejected with a message that named an internal field
   * and gave the user no way to know the client had sent the wrong case.
   *
   * This case is now unreachable from the form (`DocumentModule` is a union of
   * the lowercase values, so 'Deal' does not compile), but the SERVER contract
   * is what actually rejected it, and a future client can still get this wrong.
   * Tested against every module rather than just the reported one, because the
   * bug report named Contact and the defect was in all of them.
   */
  it("negative: a CAPITALISED module is refused — 'Deal' is not 'deal'", async () => {
    for (const bad of ['Deal', 'Account', 'Contact', 'Activity', 'Lead', 'DEAL']) {
      const res = await request(app).post('/api/v1/documents').set(auth(ws))
        .send({ name: `Cased ${bad}.pdf`, module: bad, record_id: dealId });
      expect(res.status, `module '${bad}' should be refused: ${JSON.stringify(res.body)}`).toBe(400);
      expect(res.body.message).toMatch(/module must be one of/);
    }
  });

  it("the same request with a LOWERCASE module and a real id succeeds", async () => {
    // The other half of the proof: nothing else about the payload was wrong,
    // so the casing was the whole difference between 400 and 201.
    const res = await request(app).post('/api/v1/documents').set(auth(ws))
      .send({ name: `Cased ok ${Date.now()}.pdf`, module: 'deal', record_id: dealId });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(res.body.data.module).toBe('deal');
    expect(res.body.data.record_id).toBe(dealId);
  });

  it('negative: a lowercase module with a FABRICATED record_id is still refused', async () => {
    /*
     * The second blocker, which sat behind the first. The picker offered
     * hardcoded ids — deal_acme_001, contact_john_smith, account_acme — none
     * of which exists in any workspace. So fixing the casing alone moved the
     * failure one validation down rather than fixing the upload, which is why
     * the picker had to start fetching real records.
     */
    for (const fake of ['deal_acme_001', 'deal_bigco_001', 'deal_health_001']) {
      const res = await request(app).post('/api/v1/documents').set(auth(ws))
        .send({ name: 'Fabricated parent.pdf', module: 'deal', record_id: fake });
      expect(res.status, `${fake}: ${JSON.stringify(res.body)}`).toBe(400);
      expect(res.body.message).toMatch(/does not name a deal in this workspace/);
      // Names the field only — never that the row exists somewhere else.
      expect(res.body.message).not.toMatch(/exists|another workspace/i);
    }
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

  it('tenant isolation: workspace B cannot read, list or delete workspace A\'s document', async () => {
    // Created through the REAL endpoint. This briefly used a direct pool insert
    // while the VARCHAR(10) bug made POST /documents unusable; that workaround
    // was removed the moment migration 032 landed, because a fixture that
    // bypasses the API is exactly the "never proven through the real endpoint"
    // gap this suite exists to close.
    const create = await request(app).post('/api/v1/documents').set(auth(ws))
      .send({ name: `Isolated doc ${Date.now()}.pdf`, module: 'deal', record_id: dealId });
    expect(create.status, JSON.stringify(create.body)).toBe(201);
    const id = create.body.data.id;
    docIds.push(id);

    const wsB = await setupWorkspace('docs-b');
    try {
      // Not readable.
      expect((await request(app).get(`/api/v1/documents/${id}`).set(auth(wsB))).status).toBe(404);

      // Not listable.
      const list = await request(app).get('/api/v1/documents').set(auth(wsB));
      expect(list.status).toBe(200);
      expect(list.body.data.some((d: { id: string }) => d.id === id)).toBe(false);

      // AND NOT DESTROYABLE — the assertion that actually matters. B's delete is
      // refused at the query (DELETE ... AND tenant_id = $2 matches nothing), so
      // A's document survives. It now also reports 404 rather than the old
      // misleading 200 with deleted: 0, so B cannot even tell the id exists.
      const attempt = await request(app).delete(`/api/v1/documents/${id}`).set(auth(wsB));
      expect(attempt.status, JSON.stringify(attempt.body)).toBe(404);

      const row = await pool.query('SELECT COUNT(*)::int AS n FROM documents WHERE id = $1', [id]);
      expect(row.rows[0].n, "workspace A's document must still exist").toBe(1);

      // And A can still delete it — the 404 for B is scoping, not a broken route.
      const byOwner = await request(app).delete(`/api/v1/documents/${id}`).set(auth(ws));
      expect(byOwner.status, JSON.stringify(byOwner.body)).toBe(200);
      const gone = await pool.query('SELECT COUNT(*)::int AS n FROM documents WHERE id = $1', [id]);
      expect(gone.rows[0].n).toBe(0);
    } finally {
      await teardownWorkspace(wsB);
    }
  });

  /**
   * REGRESSION GUARD. This returned 200 until the fix in documentsController.
   *
   * DELETE /documents/:id shares its handler with the bulk DELETE /documents,
   * so the single form inherited bulk partial-success semantics and answered
   * 200 with deleted: 0 for an id in another workspace — where getDocumentById
   * and every other :id endpoint (contacts, companies, deals, tasks) return
   * 404. Nothing was ever destroyed, since the DELETE carries
   * `AND tenant_id = $2`, and the body did say deleted: 0; but a client
   * checking res.ok rather than the body would report having deleted a document
   * it never touched — a success status with no write behind it.
   *
   * The bulk form's semantics are deliberately unchanged, which the next test
   * pins.
   */
  it('single-id delete of a foreign or missing document is 404, not a false 200', async () => {
    const missing = await request(app)
      .delete('/api/v1/documents/00000000-0000-0000-0000-000000000000').set(auth(ws));
    expect(missing.status, JSON.stringify(missing.body)).toBe(404);
    expect(missing.body.success).toBe(false);
    expect(missing.body.message).toMatch(/not found/i);
  });

  /**
   * The other half of that fix: the BULK form must keep reporting counts. A
   * caller passing an array is asking "how many of these went?", so a request
   * whose ids match nothing is a 200 with deleted: 0 — not a 404. The fix keys
   * off req.params.id rather than ids.length, precisely so fixing the single
   * path could not silently change this one.
   */
  it('bulk delete keeps its partial-success semantics and does NOT 404 on zero matches', async () => {
    const res = await request(app).delete('/api/v1/documents').set(auth(ws))
      .send({ ids: ['00000000-0000-0000-0000-000000000000'] });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.deleted).toBe(0);
    expect(res.body.requested).toBe(1);
    expect(res.body.message).toMatch(/0 of 1 deleted/);
  });

  it('delete removes the row, verified by re-counting rather than by the 200', async () => {
    const create = await request(app).post('/api/v1/documents').set(auth(ws))
      .send({ name: `Deletable ${Date.now()}.pdf` });
    expect(create.status, JSON.stringify(create.body)).toBe(201);
    const id = create.body.data.id;

    const del = await request(app).delete(`/api/v1/documents/${id}`).set(auth(ws));
    expect(del.status, JSON.stringify(del.body)).toBe(200);

    const gone = await pool.query('SELECT COUNT(*)::int AS n FROM documents WHERE id = $1', [id]);
    expect(gone.rows[0].n).toBe(0);
  });
});

/**
 * A malformed :id must be a 404, not a 500 leaking Postgres text.
 *
 * documents.id is a UUID. Before this, /documents/doc_acme_proposal_v2 raised
 * 22P02 and errorHandler passed it through as a 500 whose body was the driver's
 * own message — the browser rendered
 * 'invalid input syntax for type uuid: "doc_acme_proposal_v2"' to the user.
 * Found by loading a stale fixture id in a real browser after wiring the detail
 * page, not by any test.
 */
describe('Documents — malformed id', () => {
  let ws: TestWorkspace;

  beforeAll(async () => { ws = await setupWorkspace('docs-badid'); });
  afterAll(async () => { await teardownWorkspace(ws); });

  it('answers 404 for a non-uuid id, with no database internals in the body', async () => {
    const res = await request(app)
      .get('/api/v1/documents/doc_acme_proposal_v2')
      .set(auth(ws));

    expect(res.status, JSON.stringify(res.body)).toBe(404);
    expect(res.body.message).toBe('Document not found');
    // The failure mode this pins: driver text reaching the caller.
    expect(JSON.stringify(res.body)).not.toMatch(/invalid input syntax|uuid|22P02/i);
  });

  it('still answers 404 for a well-formed uuid that does not exist', async () => {
    const res = await request(app)
      .get('/api/v1/documents/00000000-0000-0000-0000-000000000000')
      .set(auth(ws));
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Document not found');
  });
});
