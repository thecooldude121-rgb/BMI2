import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';

/**
 * Round-trip regression suite — concurrent id generation.
 *
 * THIS TEST EXISTS BECAUSE THE RACE WAS REAL AND MEASURED, not theorised.
 * Before migration 031, all four of these tables generated their id in app
 * code with
 *     SELECT MAX(CAST(SUBSTRING(id, n) AS INTEGER)) + 1
 * in one statement and inserted it in another. Node yields to the event loop
 * at every await, so two concurrent creates read the same maximum, computed
 * the same id, and the second collided on the primary key — arriving at the
 * caller as an unhandled 23505 that errorHandler masks as a plain
 * "500 Internal Server Error". None of the four create paths was even inside
 * a transaction. Measured against the pre-fix code:
 *
 *     N=2  (one double-click)      5 of 10 trials lost a write
 *     N=3  (two or three users)   10 of 10 trials lost a write
 *     N=5                         30 of 50 writes lost
 *     N=10                        companies/deals/tasks created only 3 of 10
 *
 * The fix is a per-table sequence wired as the column DEFAULT, so the id is
 * produced inside the INSERT by nextval(), which is atomic and never returns
 * the same value twice.
 *
 * The assertion is deliberately absolute — ZERO lost writes and every id
 * distinct — because "usually fine" is exactly what the old code looked like
 * at N=1. If this test ever fails, an id is being generated in application
 * code again; look for a read-then-write pattern rather than relaxing the
 * count.
 */
describe('Concurrent creates — id generation cannot collide', () => {
  let ws: TestWorkspace;

  beforeAll(async () => { ws = await setupWorkspace('idrace'); });
  afterAll(async () => {
    // FK-safe order, then verify by re-counting rather than trusting DELETE.
    for (const t of ['tasks', 'deals', 'contacts', 'companies']) {
      await pool.query(`DELETE FROM ${t} WHERE tenant_id = $1`, [ws.tenantId]);
      const left = await pool.query(`SELECT COUNT(*)::int AS n FROM ${t} WHERE tenant_id = $1`, [ws.tenantId]);
      if (left.rows[0].n !== 0) throw new Error(`Cleanup failed: ${left.rows[0].n} rows remain in ${t}`);
    }
    await teardownWorkspace(ws);
  });

  /** Distinct, valid payloads for one entity — nothing here collides except the id. */
  const payloads: Record<string, (n: number, tag: string) => Record<string, unknown>> = {
    contacts:  (n, tag) => ({ first_name: `Race${n}`, last_name: 'Contact', email: `race.${tag}.${n}@example.com` }),
    companies: (n, tag) => ({ name: `Race Co ${tag} ${n}` }),
    deals:     (n, tag) => ({ name: `Race Deal ${tag} ${n}`, value: 1000 + n }),
    tasks:     (n, tag) => ({ title: `Race Task ${tag} ${n}` }),
  };

  const entities = Object.keys(payloads);

  // N=2 is a double-submit; N=3 two colleagues; 5 and 10 are load.
  for (const N of [2, 3, 5, 10]) {
    it.each(entities)(`${N} simultaneous %s creates all succeed with distinct ids`, async (entity) => {
      const tag = `${N}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const responses = await Promise.all(
        Array.from({ length: N }, (_, n) =>
          request(app).post(`/api/v1/${entity}`).set(auth(ws)).send(payloads[entity](n, tag)),
        ),
      );

      const lost = responses.filter(r => r.status !== 201);
      expect(
        lost.length,
        `${lost.length}/${N} ${entity} writes lost: ${JSON.stringify(lost.map(r => `${r.status} ${r.body?.message}`))}`,
      ).toBe(0);

      // No masked 500 may hide among them.
      for (const r of responses) {
        expect(r.body?.message ?? '').not.toMatch(/Internal Server Error/);
      }

      // Every id distinct, from the response...
      const ids = responses.map(r => r.body.data.id as string);
      expect(new Set(ids).size, `duplicate ids returned: ${JSON.stringify(ids)}`).toBe(N);

      // ...and, the real check, every row actually present in Postgres.
      const rows = await pool.query(
        `SELECT id FROM ${entity} WHERE id = ANY($1::varchar[]) AND tenant_id = $2`,
        [ids, ws.tenantId],
      );
      expect(rows.rows.length, 'every concurrent create must be a real row').toBe(N);

      await pool.query(`DELETE FROM ${entity} WHERE tenant_id = $1`, [ws.tenantId]);
    });
  }

  /**
   * The worst pre-fix case, and the reason this matters commercially: CSV
   * import is the documented migration path from Salesforce/HubSpot. Racing it
   * against a single form create used to make the import report
   * created=4 failed=1 — blaming the customer's file for an id collision.
   */
  it('a CSV import racing a form create loses no rows and blames nothing on the data', async () => {
    const tag = `csv-${Date.now()}`;
    const rows = Array.from({ length: 5 }, (_, n) => ({
      first_name: `Csv${n}`, last_name: 'Import', email: `csvrace.${tag}.${n}@example.com`,
    }));

    const [imported, formCreate] = await Promise.all([
      request(app).post('/api/v1/contacts/import').set(auth(ws)).send({ rows }),
      request(app).post('/api/v1/contacts').set(auth(ws))
        .send({ first_name: 'Form', last_name: 'Race', email: `formrace.${tag}@example.com` }),
    ]);

    expect(imported.status, JSON.stringify(imported.body)).toBe(200);
    expect(imported.body.data.created, JSON.stringify(imported.body.data.rows)).toBe(5);
    expect(imported.body.data.failed).toBe(0);
    expect(formCreate.status, JSON.stringify(formCreate.body)).toBe(201);

    // All six rows are really there, with six distinct ids.
    const all = await pool.query('SELECT id FROM contacts WHERE tenant_id = $1', [ws.tenantId]);
    expect(all.rows.length).toBe(6);
    expect(new Set(all.rows.map(r => r.id)).size).toBe(6);

    await pool.query('DELETE FROM contacts WHERE tenant_id = $1', [ws.tenantId]);
  });

  /**
   * REGRESSION GUARD FOR A BUG THAT ONLY APPEARS PAST THE 1000th ROW.
   *
   * Migration 031 generated ids with
   *     'C' || LPAD(nextval(...)::text, 3, '0')
   * on the assumption that SQL lpad behaves like JavaScript padStart. It does
   * not: lpad TRUNCATES when the input is longer than the target width, so
   *     lpad('999',3,'0') = '999'   but
   *     lpad('1000',3,'0') = '100'  and lpad('1007',3,'0') = '100' as well.
   * Every create past the 999th row therefore collided on the primary key —
   * permanently, not just under concurrency. Migration 033 replaced it with
   * next_prefixed_id(), which pads without truncating.
   *
   * A fresh database starts its sequences at 1, so nothing else in this suite
   * would ever reach the boundary. These two tests go there deliberately.
   */
  it('next_prefixed_id pads to three digits and then stops, never truncating', async () => {
    // A throwaway sequence, so the real table sequences are untouched.
    await pool.query('CREATE SEQUENCE IF NOT EXISTS rt_padding_probe_seq');
    try {
      await pool.query(`SELECT setval('rt_padding_probe_seq', 997, false)`);
      const res = await pool.query(
        `SELECT next_prefixed_id('C', 'rt_padding_probe_seq') AS id FROM generate_series(1, 6)`,
      );
      const ids = res.rows.map(r => r.id);
      expect(ids).toEqual(['C997', 'C998', 'C999', 'C1000', 'C1001', 'C1002']);
      // The failure mode this guards: 1000+ collapsing back onto 3 characters.
      expect(new Set(ids).size, `ids repeated: ${JSON.stringify(ids)}`).toBe(6);
    } finally {
      await pool.query('DROP SEQUENCE IF EXISTS rt_padding_probe_seq');
    }
  });

  it('creates past the 999th row get distinct ids through the real endpoint', async () => {
    // Push the live contacts sequence over the boundary and create through the
    // API, so the COLUMN DEFAULT is proven and not just the function. Sequences
    // only ever move forward, so raising it is harmless and needs no reset.
    const current = await pool.query(`SELECT last_value FROM contacts_id_seq`);
    const target = Math.max(Number(current.rows[0].last_value), 999);
    await pool.query(`SELECT setval('contacts_id_seq', $1, true)`, [target]);

    const made = await Promise.all(
      [0, 1, 2].map(n => request(app).post('/api/v1/contacts').set(auth(ws))
        .send({ first_name: `Boundary${n}`, last_name: 'Contact', email: `boundary.${n}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com` })),
    );
    for (const r of made) expect(r.status, JSON.stringify(r.body)).toBe(201);

    const ids = made.map(r => r.body.data.id as string);
    expect(new Set(ids).size, `collided past 999: ${JSON.stringify(ids)}`).toBe(3);
    // Every id must be longer than the truncated form would have been.
    for (const id of ids) expect(id).toMatch(/^CT\d{4,}$/);

    const rows = await pool.query(
      'SELECT id FROM contacts WHERE id = ANY($1::varchar[]) AND tenant_id = $2', [ids, ws.tenantId]);
    expect(rows.rows.length).toBe(3);
    await pool.query('DELETE FROM contacts WHERE tenant_id = $1', [ws.tenantId]);
  });

  it('the generated id keeps its human-readable prefix and zero padding', async () => {
    // Ids are user-visible and referenced by hand (HANDOFF.md names deal D053),
    // so the sequence must not have changed the format.
    const shapes: [string, Record<string, unknown>, RegExp][] = [
      ['contacts',  { first_name: 'Shape', last_name: 'Check', email: `shape.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com` }, /^CT\d{3,}$/],
      ['companies', { name: `Shape Co ${Date.now()}` },                                                    /^C\d{3,}$/],
      ['deals',     { name: `Shape Deal ${Date.now()}`, value: 1 },                                        /^D\d{3,}$/],
      ['tasks',     { title: 'Shape Task' },                                                               /^T\d{3,}$/],
    ];
    for (const [entity, payload, pattern] of shapes) {
      const res = await request(app).post(`/api/v1/${entity}`).set(auth(ws)).send(payload);
      expect(res.status, `${entity}: ${JSON.stringify(res.body)}`).toBe(201);
      expect(res.body.data.id, `${entity} id shape`).toMatch(pattern);

      // And the row Postgres holds carries that same id.
      const row = await pool.query(`SELECT id FROM ${entity} WHERE id = $1 AND tenant_id = $2`, [res.body.data.id, ws.tenantId]);
      expect(row.rows.length).toBe(1);
      await pool.query(`DELETE FROM ${entity} WHERE tenant_id = $1`, [ws.tenantId]);
    }
  });
});
