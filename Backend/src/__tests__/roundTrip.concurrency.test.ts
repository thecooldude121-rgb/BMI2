import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
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

    const deal = await pool.query('SELECT stage FROM deals WHERE id = $1', [id]);
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

    const deal = await pool.query('SELECT stage FROM deals WHERE id = $1', [id]);
    const hist = await pool.query(
      'SELECT from_stage, to_stage FROM deal_stage_history WHERE deal_id = $1 ORDER BY changed_at, id',
      [id],
    );

    // Whichever order the lock granted, the outcome must be COHERENT:
    // the stored stage is one of the two requested...
    expect(['negotiation', 'closed-won']).toContain(deal.rows[0].stage);
    // ...the trail is non-empty and its last entry agrees with the stored stage
    // (an audit trail disagreeing with the row is worse than no trail)...
    expect(hist.rows.length).toBeGreaterThanOrEqual(1);
    expect(hist.rows[hist.rows.length - 1].to_stage).toBe(deal.rows[0].stage);
    // ...and the chain is unbroken: each hop starts where the previous ended.
    let cursor = 'prospecting';
    for (const row of hist.rows) {
      expect(row.from_stage, `history chain broken: ${JSON.stringify(hist.rows)}`).toBe(cursor);
      cursor = row.to_stage;
    }
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
    const email = `raceemail.${Date.now()}@example.com`;
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
