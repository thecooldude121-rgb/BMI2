import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';

/**
 * Two races not covered elsewhere.
 *
 *  A. Bulk DELETE /documents racing single DELETE /documents/:id on the SAME id.
 *     Worth checking because the single form's status semantics changed: it used
 *     to answer 200 with deleted: 0 for a row it did not delete, and now 404s.
 *     Under a race, "did not delete it" and "it is not there" become the same
 *     observation, so the two paths must still agree on what happened.
 *
 *  B. Two concurrent CSV imports on overlapping data. import-vs-form-create is
 *     already covered in roundTrip.idConcurrency; this is import-vs-import,
 *     which is the shape that exposed the migration-031 id collision, and the
 *     shape a customer produces by double-clicking Import.
 *
 * Same rigor as roundTrip.idConcurrency: real endpoints, real concurrency via
 * Promise.all, every assertion re-read from Postgres, cleanup re-counted.
 */
describe('Bulk-vs-single and import-vs-import races', () => {
  let ws: TestWorkspace;

  beforeAll(async () => { ws = await setupWorkspace('races'); });

  afterAll(async () => {
    for (const t of ['documents', 'contacts', 'companies']) {
      await pool.query(`DELETE FROM ${t} WHERE tenant_id = $1`, [ws.tenantId]);
      const left = await pool.query(`SELECT COUNT(*)::int AS n FROM ${t} WHERE tenant_id = $1`, [ws.tenantId]);
      if (left.rows[0].n !== 0) throw new Error(`Cleanup failed: ${left.rows[0].n} rows left in ${t}`);
    }
    await teardownWorkspace(ws);
  });

  const newDocument = async (label: string): Promise<string> => {
    const res = await request(app).post('/api/v1/documents').set(auth(ws))
      .send({ name: `${label} ${Date.now()}-${Math.random().toString(36).slice(2, 7)}.pdf` });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    return res.body.data.id;
  };

  // ── A. bulk delete vs single delete ──────────────────────────────────────

  it('bulk and single delete of the SAME document: exactly one reports the deletion, and the row is gone', async () => {
    const id = await newDocument('Contested doc');

    const [bulk, single] = await Promise.all([
      request(app).delete('/api/v1/documents').set(auth(ws)).send({ ids: [id] }),
      request(app).delete(`/api/v1/documents/${id}`).set(auth(ws)),
    ]);

    // Neither may be a masked 500 — the interesting failure would be one of
    // them blowing up rather than reporting a miss.
    for (const r of [bulk, single]) {
      expect(r.body?.message ?? '').not.toMatch(/Internal Server Error/);
      expect([200, 404], `unexpected status ${r.status}: ${JSON.stringify(r.body)}`).toContain(r.status);
    }

    // Exactly one of them actually removed it. The bulk form reports a count;
    // the single form reports 200 when it deleted the row and 404 when it did
    // not, so "deleted by me" is expressible in both dialects.
    const bulkDeleted = bulk.status === 200 ? Number(bulk.body.deleted ?? 0) : 0;
    const singleDeleted = single.status === 200 ? 1 : 0;
    expect(
      bulkDeleted + singleDeleted,
      `both or neither claimed the delete: bulk=${bulk.status}/${JSON.stringify(bulk.body)} single=${single.status}`,
    ).toBe(1);

    // And whichever won, the row is gone exactly once — verified in Postgres.
    const gone = await pool.query('SELECT COUNT(*)::int AS n FROM documents WHERE id = $1', [id]);
    expect(gone.rows[0].n).toBe(0);
  });

  it('bulk delete overlapping a single delete across several documents loses and duplicates nothing', async () => {
    const ids = await Promise.all([0, 1, 2, 3].map(n => newDocument(`Overlap ${n}`)));

    // The bulk request asks for all four; the single requests target two of
    // them at the same moment.
    const [bulk, s1, s2] = await Promise.all([
      request(app).delete('/api/v1/documents').set(auth(ws)).send({ ids }),
      request(app).delete(`/api/v1/documents/${ids[1]}`).set(auth(ws)),
      request(app).delete(`/api/v1/documents/${ids[3]}`).set(auth(ws)),
    ]);

    for (const r of [bulk, s1, s2]) {
      expect(r.body?.message ?? '').not.toMatch(/Internal Server Error/);
    }
    expect(bulk.status).toBe(200);

    // Each document must be claimed by exactly one caller: the bulk count plus
    // the singles that reported success must total four, never five.
    const singlesWon = [s1, s2].filter(r => r.status === 200).length;
    expect(
      Number(bulk.body.deleted) + singlesWon,
      `documents double-counted or lost: bulk deleted ${bulk.body.deleted}, singles won ${singlesWon}`,
    ).toBe(4);

    // All four gone, regardless of who won which.
    const left = await pool.query(
      'SELECT COUNT(*)::int AS n FROM documents WHERE id = ANY($1::uuid[])', [ids]);
    expect(left.rows[0].n).toBe(0);
  });

  it('a single delete losing the race reports 404, never a false 200', async () => {
    const id = await newDocument('Loser doc');

    // Delete it first, then race two singles against the already-gone row —
    // the deterministic version of losing.
    const first = await request(app).delete(`/api/v1/documents/${id}`).set(auth(ws));
    expect(first.status).toBe(200);

    const [a, b] = await Promise.all([
      request(app).delete(`/api/v1/documents/${id}`).set(auth(ws)),
      request(app).delete(`/api/v1/documents/${id}`).set(auth(ws)),
    ]);
    for (const r of [a, b]) {
      expect(r.status, JSON.stringify(r.body)).toBe(404);
      expect(r.body.success).toBe(false);
    }
  });

  // ── B. import vs import ──────────────────────────────────────────────────

  it('two concurrent imports of DISTINCT contacts both fully succeed with distinct ids', async () => {
    // The direct analogue of the migration-031 collision, at import scale: two
    // imports generating ids at the same moment.
    const stamp = Date.now();
    const batchA = Array.from({ length: 5 }, (_, n) => ({
      first_name: `A${n}`, last_name: 'ImportA', email: `impa.${stamp}.${n}@example.com`,
    }));
    const batchB = Array.from({ length: 5 }, (_, n) => ({
      first_name: `B${n}`, last_name: 'ImportB', email: `impb.${stamp}.${n}@example.com`,
    }));

    const [ra, rb] = await Promise.all([
      request(app).post('/api/v1/contacts/import').set(auth(ws)).send({ rows: batchA }),
      request(app).post('/api/v1/contacts/import').set(auth(ws)).send({ rows: batchB }),
    ]);

    expect(ra.status, JSON.stringify(ra.body)).toBe(200);
    expect(rb.status, JSON.stringify(rb.body)).toBe(200);
    expect(ra.body.data.created, JSON.stringify(ra.body.data.rows)).toBe(5);
    expect(rb.body.data.created, JSON.stringify(rb.body.data.rows)).toBe(5);
    expect(ra.body.data.failed).toBe(0);
    expect(rb.body.data.failed).toBe(0);

    // Ten real rows with ten distinct ids — the id-collision check.
    const rows = await pool.query(
      `SELECT id FROM contacts WHERE tenant_id = $1 AND (email LIKE $2 OR email LIKE $3)`,
      [ws.tenantId, `impa.${stamp}.%`, `impb.${stamp}.%`],
    );
    expect(rows.rows.length).toBe(10);
    expect(new Set(rows.rows.map(r => r.id)).size).toBe(10);

    await pool.query('DELETE FROM contacts WHERE tenant_id = $1', [ws.tenantId]);
  });

  it('two concurrent imports of the SAME contacts create each row once and report the rest honestly', async () => {
    // The double-clicked Import. Both requests carry identical rows, and each
    // transaction cannot see the other's uncommitted inserts, so the pre-insert
    // duplicate check passes in both and contacts_tenant_email_key decides.
    const stamp = Date.now();
    const rows = Array.from({ length: 4 }, (_, n) => ({
      first_name: `Same${n}`, last_name: 'Import', email: `same.${stamp}.${n}@example.com`,
    }));

    const [ra, rb] = await Promise.all([
      request(app).post('/api/v1/contacts/import').set(auth(ws)).send({ rows }),
      request(app).post('/api/v1/contacts/import').set(auth(ws)).send({ rows }),
    ]);

    expect(ra.status, JSON.stringify(ra.body)).toBe(200);
    expect(rb.status, JSON.stringify(rb.body)).toBe(200);

    // THE POINT: four emails in, four contacts out. Never eight, never fewer.
    const stored = await pool.query(
      'SELECT email FROM contacts WHERE tenant_id = $1 AND email LIKE $2',
      [ws.tenantId, `same.${stamp}.%`],
    );
    expect(stored.rows.length, 'each email must exist exactly once').toBe(4);
    expect(new Set(stored.rows.map(r => r.email)).size).toBe(4);

    // Across the two responses every row is accounted for, and the total
    // created equals what actually landed.
    const created = ra.body.data.created + rb.body.data.created;
    expect(created, `reported created=${created} but 4 rows exist`).toBe(4);
    expect(ra.body.data.total).toBe(4);
    expect(rb.body.data.total).toBe(4);

    // And the rows that did not create must say WHY, in the caller's terms —
    // not "This row could not be saved", the generic fallback in
    // rowErrorMessage, and not a blank reason.
    const unmade = [...ra.body.data.rows, ...rb.body.data.rows]
      .filter((r: { status: string }) => r.status !== 'created');
    expect(unmade.length).toBe(4);
    for (const row of unmade) {
      expect(['skipped', 'failed']).toContain(row.status);
      expect(row.reason, `row ${row.index} gave no reason`).toBeTruthy();
      expect(row.reason).toMatch(/already exists/i);
      expect(row.reason, 'the generic fallback would hide the real cause').not.toMatch(/could not be saved/i);
    }

    await pool.query('DELETE FROM contacts WHERE tenant_id = $1', [ws.tenantId]);
  });

  it('a dry-run import racing a real import of the same rows leaves only the real one behind', async () => {
    const stamp = Date.now();
    const rows = Array.from({ length: 3 }, (_, n) => ({
      first_name: `Dry${n}`, last_name: 'Race', email: `dryrace.${stamp}.${n}@example.com`,
    }));

    const [dry, real] = await Promise.all([
      request(app).post('/api/v1/contacts/import').set(auth(ws)).send({ rows, dry_run: true }),
      request(app).post('/api/v1/contacts/import').set(auth(ws)).send({ rows }),
    ]);
    expect(dry.status, JSON.stringify(dry.body)).toBe(200);
    expect(real.status, JSON.stringify(real.body)).toBe(200);
    expect(dry.body.data.dry_run).toBe(true);

    // Exactly three rows: the dry run must have committed nothing, whichever
    // order they interleaved in.
    const stored = await pool.query(
      'SELECT COUNT(*)::int AS n FROM contacts WHERE tenant_id = $1 AND email LIKE $2',
      [ws.tenantId, `dryrace.${stamp}.%`],
    );
    expect(stored.rows[0].n).toBe(3);

    await pool.query('DELETE FROM contacts WHERE tenant_id = $1', [ws.tenantId]);
  });

  /**
   * Concurrent ACCOUNT imports. What holds today: the count each request
   * reports matches what actually landed in Postgres, so the response never
   * lies about its own work.
   *
   * What does NOT hold is deduplication — see the next test. That is an open
   * finding, and this test deliberately does NOT assert one row per name,
   * because it would be asserting behaviour the system does not have.
   *
   * NOTE ON AN EARLIER VERSION OF THIS TEST, because the mistake is instructive:
   * it grouped by name and compared `new Set(names).size` with
   * `stored.rows.length`. Both sides are computed AFTER the GROUP BY, so
   * duplicates collapse into one row each and the assertion passes whether
   * there are two rows or twelve. It passed ten runs in a row while the system
   * was duplicating every time. An assertion has to be able to fail.
   */
  it('two concurrent account imports report counts that match what actually landed', async () => {
    const stamp = Date.now();
    const rows = [{ name: `Race Import Co ${stamp}` }, { name: `Race Import Co Two ${stamp}` }];

    const [ra, rb] = await Promise.all([
      request(app).post('/api/v1/companies/import').set(auth(ws)).send({ rows }),
      request(app).post('/api/v1/companies/import').set(auth(ws)).send({ rows }),
    ]);
    expect(ra.status, JSON.stringify(ra.body)).toBe(200);
    expect(rb.status, JSON.stringify(rb.body)).toBe(200);

    // Row-level count, NOT grouped — this is what the old version got wrong.
    const stored = await pool.query(
      'SELECT COUNT(*)::int AS n FROM companies WHERE tenant_id = $1', [ws.tenantId]);
    const totalReported = ra.body.data.created + rb.body.data.created;
    expect(stored.rows[0].n, `reported ${totalReported} created but ${stored.rows[0].n} rows exist`)
      .toBe(totalReported);

    await pool.query('DELETE FROM companies WHERE tenant_id = $1', [ws.tenantId]);
  });

  /**
   * ████ OPEN FINDING — NOT FIXED, AWAITING A DECISION ████
   *
   * Concurrent account imports DUPLICATE. Reproduced 10 trials out of 10 with
   * six simultaneous imports of one company name: six rows created, every
   * request reporting created=1.
   *
   * Cause: `companies` has NO unique constraint on name (recorded in
   * CLAUDE.md), so the importer's dedupe is a check-then-write with no
   * database backstop — resolveCompany/the duplicate SELECT cannot see another
   * transaction's uncommitted inserts, so every concurrent import passes the
   * check and inserts. Contacts run the same code path safely because
   * contacts_tenant_email_key exists; the control in this file's contact tests
   * is correct every time.
   *
   * Severity: this is the double-clicked Import on the documented
   * Salesforce/HubSpot migration path. Not data loss, and the reports are
   * honest about what each request did — but the deduplication the importer
   * advertises, and which the sequential tests in roundTrip.csvImport verify,
   * provides no protection concurrently. A customer re-submitting an accounts
   * CSV silently gets duplicate accounts.
   *
   * Fix is a decision, not a detail: a UNIQUE index on
   * companies(tenant_id, lower(name)) would settle it in the database the way
   * contacts already is, but `companies` deliberately permits same-named
   * accounts today (see the open design question in HANDOFF.md), so that is a
   * product call. Advisory locking around the import is the alternative.
   *
   * The assertion below is the CORRECT behaviour and is left unloosened.
   * `it.fails` records that it does not hold, rather than leaving the suite
   * permanently red or asserting the bug as if it were the spec. When the
   * duplication is fixed, THIS WRAPPER FAILS — convert it to a plain `it`.
   */
  it.fails('concurrent account imports of one name should create it exactly once', async () => {
    const name = `Dedupe Race Co ${Date.now()}`;
    const responses = await Promise.all(Array.from({ length: 6 }, () =>
      request(app).post('/api/v1/companies/import').set(auth(ws)).send({ rows: [{ name }] })));
    for (const r of responses) expect(r.status, JSON.stringify(r.body)).toBe(200);

    const stored = await pool.query(
      'SELECT COUNT(*)::int AS n FROM companies WHERE tenant_id = $1 AND name = $2',
      [ws.tenantId, name],
    );
    try {
      expect(stored.rows[0].n, `${stored.rows[0].n} copies of "${name}" created`).toBe(1);
    } finally {
      await pool.query('DELETE FROM companies WHERE tenant_id = $1', [ws.tenantId]);
    }
  });
});
