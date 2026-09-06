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
   * THE FINDING THIS FILE ORIGINALLY OPENED, NOW CLOSED.
   *
   * Concurrent account imports used to duplicate: six simultaneous imports of
   * one company name produced six rows, ten trials out of ten, every request
   * reporting created=1. `companies` has no unique constraint on name, so the
   * importer's dedupe was a check-then-write with no database backstop, and
   * neither transaction could see the other's uncommitted insert.
   *
   * Closed with a per-name advisory lock (companiesController.lockAccountName),
   * NOT a unique index — two accounts may still legitimately share a name when
   * created deliberately and one at a time. See the test below this one, which
   * pins that sequential behaviour, and the throughput tests, which pin that
   * unrelated names are not serialized.
   *
   * The assertion is the SPECIFIC correct outcome, not merely "fewer rows":
   * exactly one creation, five skips, and the five skips must carry the same
   * "already exists" reason a sequential duplicate gets — including the id of
   * the row that won.
   */
  it('six concurrent imports of one account name create it exactly once, skipping the other five', async () => {
    const name = `Dedupe Race Co ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const responses = await Promise.all(Array.from({ length: 6 }, () =>
      request(app).post('/api/v1/companies/import').set(auth(ws)).send({ rows: [{ name }] })));

    for (const r of responses) {
      expect(r.status, JSON.stringify(r.body)).toBe(200);
      expect(r.body?.message ?? '').not.toMatch(/Internal Server Error/);
    }

    const created = responses.reduce((n, r) => n + r.body.data.created, 0);
    const skipped = responses.reduce((n, r) => n + r.body.data.skipped, 0);
    const failed = responses.reduce((n, r) => n + r.body.data.failed, 0);
    expect(created, 'exactly one request may create the account').toBe(1);
    expect(skipped, 'the other five must skip, not fail').toBe(5);
    expect(failed).toBe(0);

    // One row, verified in Postgres — the original finding was six.
    const stored = await pool.query(
      'SELECT id FROM companies WHERE tenant_id = $1 AND lower(name) = lower($2)',
      [ws.tenantId, name],
    );
    expect(stored.rows.length, `${stored.rows.length} copies of "${name}"`).toBe(1);
    const winnerId = stored.rows[0].id;

    // Each skip must give the sequential reason, naming the row that won —
    // not a bare count, and not a generic "could not be saved".
    const skips = responses.flatMap((r) => r.body.data.rows)
      .filter((row: { status: string }) => row.status === 'skipped');
    expect(skips.length).toBe(5);
    for (const row of skips) {
      expect(row.reason).toMatch(/already exists/i);
      expect(row.reason, 'the skip should name the surviving account').toContain(winnerId);
      expect(row.reason).not.toMatch(/could not be saved/i);
    }

    await pool.query('DELETE FROM companies WHERE tenant_id = $1', [ws.tenantId]);
  });

  /**
   * The behaviour the lock must NOT change: a sequential duplicate import skips
   * with the same reason. This is the baseline the concurrent test above is
   * measured against — "correct" means matching this, not merely avoiding
   * duplicates.
   */
  it('a sequential duplicate import still skips, and that is the outcome the lock preserves', async () => {
    const name = `Sequential Dupe Co ${Date.now()}`;
    const first = await request(app).post('/api/v1/companies/import').set(auth(ws)).send({ rows: [{ name }] });
    const second = await request(app).post('/api/v1/companies/import').set(auth(ws)).send({ rows: [{ name }] });

    expect(first.body.data.created).toBe(1);
    expect(first.body.data.skipped).toBe(0);
    expect(second.body.data.created).toBe(0);
    expect(second.body.data.skipped).toBe(1);
    expect(second.body.data.rows[0].reason).toMatch(/already exists/i);

    const stored = await pool.query(
      'SELECT COUNT(*)::int AS n FROM companies WHERE tenant_id = $1 AND lower(name) = lower($2)',
      [ws.tenantId, name]);
    expect(stored.rows[0].n).toBe(1);

    await pool.query('DELETE FROM companies WHERE tenant_id = $1', [ws.tenantId]);
  });

  /**
   * And the behaviour the lock must not COST: unrelated names must not queue
   * behind each other. Proven deterministically rather than by timing — the
   * test holds the advisory key for one name in its own transaction, then shows
   * that an import of a DIFFERENT name completes anyway while an import of the
   * SAME name is still waiting. A wall-clock comparison would be a guess; this
   * is a direct observation of the lock's scope.
   */
  it('the lock is scoped to one name: a different name proceeds while that name is held', async () => {
    const heldName = `Held Co ${Date.now()}`;
    const otherName = `Other Co ${Date.now()}`;
    const holder = await pool.connect();
    // Declared outside the try so `finally` can always settle it: an in-flight
    // request left blocked on the lock would hold a pooled connection for the
    // rest of the run.
    let blocked: ReturnType<typeof request> | undefined;
    try {
      await holder.query('BEGIN');
      // The same key formula as lockAccountName.
      await holder.query('SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))',
        [ws.tenantId, heldName.toLowerCase()]);

      // A different name must not be blocked by that.
      const other = await request(app).post('/api/v1/companies/import').set(auth(ws))
        .send({ rows: [{ name: otherName }] });
      expect(other.status, JSON.stringify(other.body)).toBe(200);
      expect(other.body.data.created, 'an unrelated name must not wait on a held key').toBe(1);

      // The held name must be blocked — still unresolved after a wait that the
      // unrelated import cleared in single-digit milliseconds.
      blocked = request(app).post('/api/v1/companies/import').set(auth(ws))
        .send({ rows: [{ name: heldName }] });
      const outcome = await Promise.race([
        blocked.then(() => 'completed'),
        new Promise((resolve) => setTimeout(() => resolve('still-waiting'), 1000)),
      ]);
      expect(outcome, 'an import of the held name should be waiting on the lock').toBe('still-waiting');

      // Releasing the key lets it finish.
      await holder.query('ROLLBACK');
      const finished = await blocked;
      blocked = undefined;
      expect(finished.status, JSON.stringify(finished.body)).toBe(200);
      expect(finished.body.data.created).toBe(1);
    } finally {
      // ROLLBACK BEFORE RELEASE, unconditionally. node-pg does not roll back a
      // client on release, so if any assertion above threw, this connection
      // would go back into the pool still inside its transaction and still
      // holding the advisory lock — and the next import of that name would
      // block until the 30s test timeout, in whichever later file hit it.
      // That is not hypothetical: it was leaking here before this finally was
      // written, and showed up as a rare timeout in roundTrip.idConcurrency,
      // which runs after this file.
      await holder.query('ROLLBACK').catch(() => undefined);
      holder.release();
      // Settle the blocked request too, so it cannot outlive the test.
      if (blocked) await blocked.then(() => undefined, () => undefined);
      await pool.query('DELETE FROM companies WHERE tenant_id = $1', [ws.tenantId]);
    }
  });

  it('eight concurrent imports of eight DISTINCT names all succeed without serializing', async () => {
    const stamp = Date.now();
    const responses = await Promise.all(Array.from({ length: 8 }, (_, n) =>
      request(app).post('/api/v1/companies/import').set(auth(ws))
        .send({ rows: [{ name: `Parallel Co ${stamp}-${n}` }] })));

    for (const r of responses) {
      expect(r.status, JSON.stringify(r.body)).toBe(200);
      expect(r.body.data.created, 'every distinct name must be created').toBe(1);
      expect(r.body.data.skipped).toBe(0);
    }
    const stored = await pool.query(
      'SELECT COUNT(*)::int AS n FROM companies WHERE tenant_id = $1 AND name LIKE $2',
      [ws.tenantId, `Parallel Co ${stamp}-%`]);
    expect(stored.rows[0].n).toBe(8);

    await pool.query('DELETE FROM companies WHERE tenant_id = $1', [ws.tenantId]);
  });

  /**
   * THE COST THE LOCK DOES INTRODUCE, pinned so it stays contained.
   *
   * Two imports whose files share names in OPPOSITE order can each hold what
   * the other wants; Postgres breaks the tie by aborting one statement with
   * 40P01. Confirmed as 40P01 directly rather than inferred.
   *
   * What must remain true: the per-row savepoint contains it, so the rest of
   * each import still commits, every name ends up with exactly one row, nothing
   * is duplicated or lost — and the aborted row reports CONTENTION rather than
   * rowErrorMessage's generic "This row could not be saved", which is what it
   * said before 40P01 was mapped.
   */
  it('imports sharing names in opposite order stay consistent, and a deadlocked row says why', async () => {
    const stamp = Date.now();
    const a = `Deadlock A ${stamp}`;
    const b = `Deadlock B ${stamp}`;

    const [r1, r2] = await Promise.all([
      request(app).post('/api/v1/companies/import').set(auth(ws)).send({ rows: [{ name: a }, { name: b }] }),
      request(app).post('/api/v1/companies/import').set(auth(ws)).send({ rows: [{ name: b }, { name: a }] }),
    ]);
    expect(r1.status, JSON.stringify(r1.body)).toBe(200);
    expect(r2.status, JSON.stringify(r2.body)).toBe(200);

    // Both names exist exactly once — no duplication, no loss.
    const stored = await pool.query(
      `SELECT name, COUNT(*)::int AS n FROM companies
        WHERE tenant_id = $1 AND name IN ($2, $3) GROUP BY name`,
      [ws.tenantId, a, b]);
    expect(stored.rows.length, `expected both names present: ${JSON.stringify(stored.rows)}`).toBe(2);
    for (const row of stored.rows) {
      expect(row.n, `"${row.name}" duplicated`).toBe(1);
    }

    // Any row that did not create must say why, and never with the generic
    // fallback — either it was a duplicate or it lost a deadlock.
    const unmade = [...r1.body.data.rows, ...r2.body.data.rows]
      .filter((row: { status: string }) => row.status !== 'created');
    for (const row of unmade) {
      expect(row.reason, `row ${row.index} gave no reason`).toBeTruthy();
      expect(row.reason, `generic fallback leaked: "${row.reason}"`).not.toMatch(/could not be saved/i);
      expect(row.reason).toMatch(/already exists|running at the same time/i);
    }

    await pool.query('DELETE FROM companies WHERE tenant_id = $1', [ws.tenantId]);
  });
});
