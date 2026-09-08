import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import {
  app, setupWorkspace, teardownWorkspace, auth, addUserWithRole, TestWorkspace,
} from './helpers';

/**
 * Quotas keyed by user rather than by display name. Migration 042.
 *
 * There were NO quota tests before this — the endpoints existed and nothing
 * exercised them, which is part of why a name-keyed table survived this long.
 *
 * WHAT THESE PIN:
 *  1. The API STILL RETURNS `rep_name`, projected from the joined user. The
 *     column is gone; the response shape a client reads is not. Same play as
 *     `ps.slug AS stage` and `assigned_to`.
 *  2. `PUT` takes `user_id`, and a `rep_name` body is REFUSED rather than
 *     quietly ignored — an ignored field is how a caller comes to believe it
 *     saved something.
 *  3. TENANT ISOLATION ON THE WRITE. users.id has no tenant component, so the
 *     FK alone accepts another workspace's user.
 *  4. TENANT ISOLATION ON THE READ. Both halves, per the project rule: a
 *     planted cross-workspace quota must not render its user's name.
 *  5. THE RE-KEYED UNIQUE. One quota per user per period, and a second write
 *     UPDATES rather than duplicating — the old key included rep_name, so two
 *     people sharing a name shared a row.
 *  6. ON DELETE CASCADE. A quota without its person is meaningless, unlike a
 *     deal, which outlives its owner and reverts to unowned in 039.
 */
describe('Quotas — keyed by user (migration 042)', () => {
  let ws: TestWorkspace;
  let other: TestWorkspace;
  let rep: TestWorkspace;
  const PERIOD = `Q9 2099`;   // far-future label, so it cannot collide with real data

  const nameOf = async (id: string | number) => (
    await pool.query(
      `SELECT NULLIF(btrim(COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')), '') AS n
         FROM users WHERE id = $1`, [id])
  ).rows[0]?.n as string | null;

  const put = (body: Record<string, unknown>, as: TestWorkspace = ws) =>
    request(app).put('/api/v1/quotas').set(auth(as)).send(body);

  const list = (period = PERIOD, as: TestWorkspace = ws) =>
    request(app).get(`/api/v1/quotas?period=${encodeURIComponent(period)}`).set(auth(as));

  beforeAll(async () => {
    ws = await setupWorkspace('quotas');
    other = await setupWorkspace('quotas-other');
    rep = await addUserWithRole(ws, 'sales');
  });

  afterAll(async () => {
    await pool.query('DELETE FROM quotas WHERE tenant_id = ANY($1::uuid[])',
      [[ws.tenantId, other.tenantId]]);
    const left = await pool.query(
      'SELECT COUNT(*)::int AS n FROM quotas WHERE tenant_id = ANY($1::uuid[])',
      [[ws.tenantId, other.tenantId]]);
    if (left.rows[0].n !== 0) throw new Error(`Cleanup failed: ${left.rows[0].n} quotas remain`);
    await teardownWorkspace(other);
    await teardownWorkspace(ws);
  });

  it('stores a quota against a user and still reports rep_name', async () => {
    const res = await put({ user_id: Number(rep.userId), period_label: PERIOD, quota_amount: 250000 });
    expect(res.status, JSON.stringify(res.body)).toBe(200);

    const expected = await nameOf(rep.userId);
    // THE CONTRACT: a name comes back, under the key clients already read.
    expect(res.body.data.rep_name).toBe(expected);
    expect(Number(res.body.data.user_id)).toBe(Number(rep.userId));
    expect(parseFloat(res.body.data.quota_amount)).toBe(250000);

    const got = await list();
    expect(got.status).toBe(200);
    const row = got.body.data.find((r: { user_id: number }) => Number(r.user_id) === Number(rep.userId));
    expect(row.rep_name).toBe(expected);
    expect(parseFloat(row.quota_amount)).toBe(250000);
  });

  it('upserts rather than duplicating — one quota per user per period', async () => {
    await put({ user_id: Number(rep.userId), period_label: PERIOD, quota_amount: 250000 });
    const second = await put({ user_id: Number(rep.userId), period_label: PERIOD, quota_amount: 400000 });
    expect(second.status).toBe(200);
    expect(parseFloat(second.body.data.quota_amount)).toBe(400000);

    const rows = await pool.query(
      'SELECT COUNT(*)::int AS n FROM quotas WHERE tenant_id = $1 AND user_id = $2 AND period_label = $3',
      [ws.tenantId, rep.userId, PERIOD]);
    expect(rows.rows[0].n).toBe(1);
  });

  it('REFUSES a rep_name body — an ignored field is how a caller believes it saved', async () => {
    const res = await put({ rep_name: 'Alex Rodriguez', period_label: PERIOD, quota_amount: 1000 });
    expect(res.status, JSON.stringify(res.body)).toBe(400);
    expect(res.body.message).toContain('user_id');
  });

  it('a user from ANOTHER workspace is refused 400, naming the field only', async () => {
    const res = await put({ user_id: Number(other.userId), period_label: PERIOD, quota_amount: 1000 });
    expect(res.status, JSON.stringify(res.body)).toBe(400);
    expect(res.body.message).toContain('user_id');
    // Must not disclose that the user exists somewhere else.
    expect(res.body.message).not.toMatch(/another workspace|other workspace|exists/i);

    const rows = await pool.query(
      'SELECT COUNT(*)::int AS n FROM quotas WHERE tenant_id = $1 AND user_id = $2',
      [ws.tenantId, other.userId]);
    expect(rows.rows[0].n).toBe(0);
  });

  it('the read join is tenant-scoped: a planted cross-workspace quota is not listed', async () => {
    // Both halves of the project rule — the write creates the bad row, the join
    // is what leaks it. Plant it directly, bypassing the validated write path.
    await pool.query(
      `INSERT INTO quotas (user_id, period_label, quota_amount, tenant_id)
       VALUES ($1, $2, $3, $4)`,
      [Number(other.userId), PERIOD, 999999, ws.tenantId]);
    try {
      const got = await list();
      expect(got.status).toBe(200);
      // The INNER tenant-matched join refuses to resolve it, so it does not
      // appear at all — rather than appearing with a blank name.
      const leaked = got.body.data.find(
        (r: { user_id: number }) => Number(r.user_id) === Number(other.userId));
      expect(leaked).toBeUndefined();
      expect(JSON.stringify(got.body)).not.toContain('999999');
    } finally {
      await pool.query('DELETE FROM quotas WHERE tenant_id = $1 AND user_id = $2',
        [ws.tenantId, other.userId]);
    }
  });

  it('quotas are workspace-scoped: another workspace never sees them', async () => {
    await put({ user_id: Number(rep.userId), period_label: PERIOD, quota_amount: 400000 });
    const theirs = await list(PERIOD, other);
    expect(theirs.status).toBe(200);
    expect(theirs.body.data).toHaveLength(0);
  });

  it('rejects a negative or non-numeric amount', async () => {
    for (const bad of [-1, 'abc']) {
      const res = await put({ user_id: Number(rep.userId), period_label: PERIOD, quota_amount: bad });
      expect(res.status, `${bad}: ${JSON.stringify(res.body)}`).toBe(400);
      expect(res.body.message).toContain('quota_amount');
    }
    // Zero IS valid — a rep with no target is different from an unset quota.
    const zero = await put({ user_id: Number(rep.userId), period_label: PERIOD, quota_amount: 0 });
    expect(zero.status).toBe(200);
    expect(parseFloat(zero.body.data.quota_amount)).toBe(0);
  });

  it('requires the period query param on GET rather than returning everything', async () => {
    const res = await request(app).get('/api/v1/quotas').set(auth(ws));
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('period');
  });

  it('deleting a user CASCADES their quota away', async () => {
    // user_id is NOT NULL, so SET NULL is unavailable and RESTRICT would block
    // deleting a person until someone hunted down their quota rows. A quota
    // without its person is meaningless — unlike a deal, which reverts to
    // unowned in 039.
    const doomed = await addUserWithRole(ws, 'sales');
    await put({ user_id: Number(doomed.userId), period_label: PERIOD, quota_amount: 123456 });

    const before = await pool.query('SELECT COUNT(*)::int AS n FROM quotas WHERE user_id = $1', [doomed.userId]);
    expect(before.rows[0].n).toBe(1);

    await pool.query('DELETE FROM users WHERE id = $1', [doomed.userId]);

    const after = await pool.query('SELECT COUNT(*)::int AS n FROM quotas WHERE user_id = $1', [doomed.userId]);
    expect(after.rows[0].n).toBe(0);
  });

  it('the rep_name column is GONE, not merely unused', async () => {
    // Migration 042 dropped it. A lingering column would let a future writer
    // reintroduce name-keyed identity without touching the API.
    const cols = await pool.query(
      `SELECT COUNT(*)::int AS n FROM information_schema.columns
        WHERE table_name = 'quotas' AND column_name = 'rep_name'`);
    expect(cols.rows[0].n).toBe(0);
  });
});
