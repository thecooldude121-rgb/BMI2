import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';

/**
 * Prefixed ids must never repeat. Postgres lpad() TRUNCATES, so
 * 'X' || LPAD(nextval(..)::text, 3, '0') issues X100 again at 1000. Migration
 * 033 fixed it for contacts / companies / deals / tasks; 049 reintroduced it for
 * meetings and 068 fixed that (found 2026-10-11 when the test database crossed
 * 999). The schema guard below catches the pattern in ANY future table.
 */
describe('prefixed id defaults', () => {
  let ws: TestWorkspace;
  beforeAll(async () => { ws = await setupWorkspace('iddefaults'); });
  afterAll(async () => {
    await pool.query('DELETE FROM meetings WHERE tenant_id = $1', [ws.tenantId]);
    await teardownWorkspace(ws);
  });

  it('no id column default pads a sequence value with lpad()', async () => {
    const r = await pool.query(
      `SELECT table_name, column_default FROM information_schema.columns
        WHERE table_schema = 'public' AND column_default ILIKE '%lpad(%nextval%'`);
    expect(r.rows).toEqual([]);
  });

  it('meetings keep distinct ids past MTG999', async () => {
    // Moves the shared test-database sequence forward only — never back.
    await pool.query(`SELECT setval('meetings_id_seq', GREATEST((SELECT last_value FROM meetings_id_seq), 1000))`);
    const ids: string[] = [];
    for (const title of ['After 999 a', 'After 999 b']) {
      const res = await request(app).post('/api/v1/meetings').set(auth(ws)).send({ title });
      expect(res.status, JSON.stringify(res.body)).toBe(201);
      ids.push(res.body.data.id);
    }
    expect(new Set(ids).size).toBe(2);
    for (const id of ids) expect(id).toMatch(/^MTG\d{4,7}$/);
  });
});
