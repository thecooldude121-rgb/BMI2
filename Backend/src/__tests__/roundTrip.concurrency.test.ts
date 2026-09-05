import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { Client } from 'pg';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';

/**
 * Concurrency coverage — Phase 4.
 *
 * Distinct from roundTrip.idConcurrency.test.ts, which covers id GENERATION
 * under load. This file covers concurrent writes to the SAME EXISTING row:
 * the double-submit and two-users-at-once cases a real CRM sees constantly.
 *
 * transitionDealStage is the interesting one, because it is the only write path
 * in the codebase that already takes a row lock —
 *     BEGIN; SELECT ... FOR UPDATE; ... COMMIT
 * (dealsController). These tests check that the lock actually delivers what it
 * promises: no lost or duplicated audit rows, and a final state that is one of
 * the submitted ones rather than a blend of both.
 */
describe('Concurrent writes to the same row', () => {
  let ws: TestWorkspace;
  const dealIds: string[] = [];

  beforeAll(async () => { ws = await setupWorkspace('conc'); });

  afterAll(async () => {
    await pool.query('DELETE FROM deal_stage_history WHERE tenant_id = $1', [ws.tenantId]);
    for (const t of ['tasks', 'deals', 'contacts']) {
      await pool.query(`DELETE FROM ${t} WHERE tenant_id = $1`, [ws.tenantId]);
      const left = await pool.query(`SELECT COUNT(*)::int AS n FROM ${t} WHERE tenant_id = $1`, [ws.tenantId]);
      if (left.rows[0].n !== 0) throw new Error(`Cleanup failed: ${left.rows[0].n} rows left in ${t}`);
    }
    await teardownWorkspace(ws);
  });

  const newDeal = async (stage = 'prospecting'): Promise<string> => {
    const res = await request(app).post('/api/v1/deals').set(auth(ws))
      .send({ name: `Conc Deal ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, value: 5000, stage });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    dealIds.push(res.body.data.id);
    return res.body.data.id;
  };

  it('a DOUBLE-SUBMIT of the same stage move writes exactly one history row, not two', async () => {
    const id = await newDeal('prospecting');

    // The same request twice, simultaneously — a double-clicked Move Stage.
    const [a, b] = await Promise.all([
      request(app).post(`/api/v1/deals/${id}/stage-transition`).set(auth(ws)).send({ to_stage: 'negotiation' }),
      request(app).post(`/api/v1/deals/${id}/stage-transition`).set(auth(ws)).send({ to_stage: 'negotiation' }),
    ]);

    // Neither may be a masked 500.
    for (const r of [a, b]) {
      expect(r.status, JSON.stringify(r.body)).toBe(200);
      expect(r.body?.message ?? '').not.toMatch(/Internal Server Error/);
    }

    const deal = await pool.query(`SELECT ps.slug AS stage FROM deals d LEFT JOIN pipeline_stages ps ON ps.id = d.stage_id AND ps.tenant_id = d.tenant_id WHERE d.id = $1`, [id]);
    expect(deal.rows[0].stage).toBe('negotiation');

    // The point of the test. The second request finds the deal ALREADY in the
    // target stage (the first holds the row lock until commit) and short-circuits
    // as a no-op, so the audit trail records the move once. Two rows would mean
    // the trail double-counts a single user action.
    const hist = await pool.query('SELECT from_stage, to_stage FROM deal_stage_history WHERE deal_id = $1', [id]);
    expect(hist.rows.length, `expected 1 history row, got ${JSON.stringify(hist.rows)}`).toBe(1);
    expect(hist.rows[0].from_stage).toBe('prospecting');
    expect(hist.rows[0].to_stage).toBe('negotiation');
  });

  it('two DIFFERENT simultaneous stage moves leave a consistent deal and a matching trail', async () => {
    const id = await newDeal('prospecting');

    const [a, b] = await Promise.all([
      request(app).post(`/api/v1/deals/${id}/stage-transition`).set(auth(ws)).send({ to_stage: 'negotiation' }),
      request(app).post(`/api/v1/deals/${id}/stage-transition`).set(auth(ws)).send({ to_stage: 'closed-won' }),
    ]);
    for (const r of [a, b]) {
      expect(r.status, JSON.stringify(r.body)).toBe(200);
      expect(r.body?.message ?? '').not.toMatch(/Internal Server Error/);
    }

    const deal = await pool.query(`SELECT ps.slug AS stage FROM deals d LEFT JOIN pipeline_stages ps ON ps.id = d.stage_id AND ps.tenant_id = d.tenant_id WHERE d.id = $1`, [id]);
    const hist = await pool.query(
      'SELECT from_stage, to_stage FROM deal_stage_history WHERE deal_id = $1',
      [id],
    );

    // Whichever order the lock granted, the outcome must be COHERENT.
    // The stored stage is one of the two requested — never a blend, never a
    // stage nobody asked for.
    expect(['negotiation', 'closed-won']).toContain(deal.rows[0].stage);
    expect(hist.rows.length).toBeGreaterThanOrEqual(1);

    // The trail must form an unbroken chain from the starting stage to the
    // stage the deal actually holds.
    //
    // NOTE ON ORDERING, learned the hard way — this test was flaky before it
    // was written this way. `changed_at` defaults to now(), and in Postgres
    // now() IS transaction_timestamp(): the transaction's START time, not its
    // commit time. Two near-simultaneous transitions can therefore commit in
    // the opposite order to their timestamps, and `id` is a random uuid so it
    // breaks no tie. Ordering the rows in SQL and walking them assumes an order
    // the data does not carry. So the chain is RECONSTRUCTED by following
    // from_stage -> to_stage links instead, which is order-independent and
    // tests the real invariant.
    const hops = new Map<string, string>();
    for (const row of hist.rows) {
      expect(hops.has(row.from_stage), `two transitions out of ${row.from_stage}`).toBe(false);
      hops.set(row.from_stage, row.to_stage);
    }
    let cursor = 'prospecting';
    const visited = new Set<string>([cursor]);
    while (hops.has(cursor)) {
      const next = hops.get(cursor)!;
      expect(visited.has(next), `history loops at ${next}: ${JSON.stringify(hist.rows)}`).toBe(false);
      visited.add(next);
      cursor = next;
    }
    // Following every hop from the start must land exactly on the stored stage,
    // and consume the whole trail — a row left over would be a transition that
    // is not part of this deal's actual history.
    expect(cursor, `chain from prospecting ended at ${cursor}, deal is ${deal.rows[0].stage}: ${JSON.stringify(hist.rows)}`)
      .toBe(deal.rows[0].stage);
    expect(visited.size - 1, `unreachable history rows: ${JSON.stringify(hist.rows)}`).toBe(hist.rows.length);
  });

  it('a stage move that WAITS on a lock records the stage it actually waited for', async () => {
    // Deterministic version of the race above, which found this by luck of
    // scheduling and would not have found it every run.
    //
    // The bug: the locking SELECT used to join pipeline_stages and project
    // ps.slug. When it blocks, Postgres re-runs the plan through EvalPlanQual
    // once the blocker commits — re-fetching the LOCKED relation but reusing the
    // already-read tuple from the other side of the join. So d.stage_id was the
    // new value while ps was the old row, the join matched nothing, and the slug
    // came back NULL. deal_stage_history then recorded from_stage = null for a
    // deal that unambiguously had a stage, breaking the chain the test above
    // walks. Locking the deal alone and resolving the slug in a second statement
    // is what fixes it, and this pins that.
    const id = await newDeal('prospecting');
    const target = await pool.query(
      `SELECT id FROM pipeline_stages WHERE tenant_id = $1 AND slug = 'qualified' LIMIT 1`,
      [ws.tenantId],
    );

    // A dedicated connection, NOT one borrowed from the app's pool: if the
    // holder took a pooled connection the request could end up waiting for a
    // free connection rather than for the row lock, and the test would pass
    // without ever exercising the contended path.
    const holder = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'bmi_crm',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
    });
    await holder.connect();
    let pending: Promise<request.Response>;
    let blocked = false;
    try {
      await holder.query('BEGIN');
      await holder.query('UPDATE deals SET stage_id = $1 WHERE id = $2 AND tenant_id = $3',
        [target.rows[0].id, id, ws.tenantId]);

      // Fires while the holder still has the row locked, so the controller's
      // own SELECT ... FOR UPDATE blocks inside the transaction.
      //
      // The trailing .then() is load-bearing, not style. A supertest Test is
      // LAZY: it only dispatches when it is awaited or then'd, so assigning it
      // to a variable and awaiting it after the COMMIT sends the request when
      // there is no lock left to block on. That is how the first draft of this
      // test passed against the very code it was written to fail on.
      pending = request(app).post(`/api/v1/deals/${id}/stage-transition`)
        .set(auth(ws)).send({ to_stage: 'negotiation' }).then(r => r);

      // WAIT FOR THE BLOCK TO BE OBSERVABLE, rather than sleeping a guessed
      // interval. A fixed sleep that is fractionally too short releases the lock
      // before the SELECT ever reaches it — the request then reads the committed
      // row with no contention at all and the test passes without testing
      // anything. pg_stat_activity says whether the wait is real.
      //
      // Polled through the app pool, NOT through `holder`. pg_stat_activity is
      // a statistics snapshot, and Postgres caches it per transaction
      // (stats_fetch_consistency defaults to 'cache'), so polling from the
      // connection that is holding the lock open returns the same pre-block
      // snapshot every iteration and reports "not blocked" forever.
      for (let i = 0; i < 100 && !blocked; i++) {
        const waiting = await pool.query(
          `SELECT count(*)::int AS n FROM pg_stat_activity
            WHERE datname = current_database() AND wait_event_type = 'Lock'
              AND query ILIKE '%FOR UPDATE%'`);
        blocked = waiting.rows[0].n > 0;
        if (!blocked) await new Promise(r => setTimeout(r, 50));
      }
      await holder.query('COMMIT');
    } finally {
      await holder.end();
    }
    expect(blocked, 'the stage move never blocked on the row lock, so this test proved nothing').toBe(true);

    const res = await pending!;
    expect(res.status, JSON.stringify(res.body)).toBe(200);

    const hist = await pool.query(
      'SELECT from_stage, to_stage FROM deal_stage_history WHERE deal_id = $1', [id]);
    expect(hist.rows.length).toBe(1);
    expect(hist.rows[0].from_stage).toBe('qualified');
    expect(hist.rows[0].to_stage).toBe('negotiation');
  });

  it('concurrent edits to the same deal leave one valid row, never a blend or a 500', async () => {
    const id = await newDeal();

    const responses = await Promise.all([
      request(app).put(`/api/v1/deals/${id}`).set(auth(ws)).send({ value: 1111 }),
      request(app).put(`/api/v1/deals/${id}`).set(auth(ws)).send({ value: 2222 }),
      request(app).put(`/api/v1/deals/${id}`).set(auth(ws)).send({ value: 3333 }),
    ]);
    for (const r of responses) {
      expect(r.status, JSON.stringify(r.body)).toBe(200);
      expect(r.body?.message ?? '').not.toMatch(/Internal Server Error/);
    }

    // Last-write-wins is acceptable here; a value that was never submitted is not.
    const row = await pool.query('SELECT value FROM deals WHERE id = $1', [id]);
    expect(['1111.00', '2222.00', '3333.00']).toContain(row.rows[0].value);
  });

  it('a double-submitted task completion stamps completed_at once and does not drift', async () => {
    const create = await request(app).post('/api/v1/tasks').set(auth(ws)).send({ title: 'Concurrent complete' });
    expect(create.status).toBe(201);
    const id = create.body.data.id;

    const [a, b] = await Promise.all([
      request(app).put(`/api/v1/tasks/${id}`).set(auth(ws)).send({ status: 'completed' }),
      request(app).put(`/api/v1/tasks/${id}`).set(auth(ws)).send({ status: 'completed' }),
    ]);
    for (const r of [a, b]) expect(r.status, JSON.stringify(r.body)).toBe(200);

    const row = await pool.query('SELECT status, completed_at FROM tasks WHERE id = $1', [id]);
    expect(row.rows[0].status).toBe('completed');
    expect(row.rows[0].completed_at).toBeTruthy();

    // COALESCE(completed_at, NOW()) means the first stamp wins: a second
    // completion must not move the timestamp, or "when was this finished"
    // changes every time someone clicks again.
    const firstStamp = row.rows[0].completed_at;
    const again = await request(app).put(`/api/v1/tasks/${id}`).set(auth(ws)).send({ status: 'completed' });
    expect(again.status).toBe(200);
    const after = await pool.query('SELECT completed_at FROM tasks WHERE id = $1', [id]);
    expect(after.rows[0].completed_at).toEqual(firstStamp);
  });

  it('a duplicate-email create submitted twice at once yields exactly one row', async () => {
    const email = `raceemail.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;
    const [a, b] = await Promise.all([
      request(app).post('/api/v1/contacts').set(auth(ws)).send({ first_name: 'Race', last_name: 'A', email }),
      request(app).post('/api/v1/contacts').set(auth(ws)).send({ first_name: 'Race', last_name: 'B', email }),
    ]);

    const codes = [a.status, b.status].sort();
    // One creates; the other must be refused as a conflict, not a masked 500.
    // This is the check-then-write race the 23505 catch was written to cover.
    expect(codes, JSON.stringify([a.body, b.body])).toEqual([201, 409]);

    const rows = await pool.query('SELECT COUNT(*)::int AS n FROM contacts WHERE tenant_id = $1 AND email = $2', [ws.tenantId, email]);
    expect(rows.rows[0].n).toBe(1);
  });
});
