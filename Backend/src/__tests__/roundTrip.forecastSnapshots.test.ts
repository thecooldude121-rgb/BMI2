import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import {
  app, setupWorkspace, teardownWorkspace, auth, addUserWithRole, TestWorkspace,
} from './helpers';

/**
 * Forecast snapshots after migration 043.
 *
 * There were NO forecast tests before this — the endpoints existed and nothing
 * exercised them, which is the same reason a name-keyed `quotas` survived to
 * 042 and a structurally unscopable `forecast_quotas` survived to now.
 *
 * WHAT THESE PIN:
 *  1. `forecast_quotas` IS GONE, not merely unused. A lingering table invites
 *     the next writer to store a tenant-less, HRMS-keyed quota in it.
 *  2. A snapshot carries BOTH `user_id` and `rep_name`, and they mean
 *     different things: identity by reference, display by capture.
 *  3. AN UNATTRIBUTED ROW IS STILL RECORDED. This is the one most worth
 *     having: making `user_id` required would silently drop 20 of the 24 live
 *     deals (~$1.39M) out of every snapshot, and a snapshot missing part of
 *     the forecast is not a snapshot of the forecast.
 *  4. TENANT ISOLATION ON THE WRITE, both that it is refused and that the
 *     whole snapshot is refused — a partial write reported as success is a
 *     forecast record quietly missing a rep.
 *  5. TWO PEOPLE SHARING A DISPLAY NAME GET SEPARATE ROWS. The old
 *     UNIQUE (tenant_id, period_label, rep_name, snapshot_date) merged them.
 *     This is the defect the re-key exists to fix.
 *  6. ON DELETE SET NULL, the OPPOSITE of `quotas`, because history must
 *     outlive the person it describes.
 */
describe('Forecast snapshots — rep identity by reference (migration 043)', () => {
  let ws: TestWorkspace;
  let other: TestWorkspace;
  let rep: TestWorkspace;
  const PERIOD = 'Q9 2099';   // far-future, cannot collide with real data

  const post = (body: Record<string, unknown>, as: TestWorkspace = ws) =>
    request(app).post('/api/v1/forecast/snapshots').set(auth(as)).send(body);

  const list = (period = PERIOD, as: TestWorkspace = ws) =>
    request(app).get(`/api/v1/forecast/snapshots?period=${encodeURIComponent(period)}`).set(auth(as));

  const nameOf = async (id: string | number) => (
    await pool.query(
      `SELECT NULLIF(btrim(COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')), '') AS n
         FROM users WHERE id = $1`, [id])
  ).rows[0]?.n as string | null;

  const rowsFor = async (tenantId: string) => (
    await pool.query(
      'SELECT user_id, rep_name, commit FROM forecast_snapshots WHERE tenant_id = $1 AND period_label = $2',
      [tenantId, PERIOD])
  ).rows;

  beforeAll(async () => {
    ws = await setupWorkspace('fcst');
    other = await setupWorkspace('fcst-other');
    rep = await addUserWithRole(ws, 'sales');
  });

  afterAll(async () => {
    await pool.query('DELETE FROM forecast_snapshots WHERE tenant_id = ANY($1::uuid[])',
      [[ws.tenantId, other.tenantId]]);
    const left = await pool.query(
      'SELECT COUNT(*)::int AS n FROM forecast_snapshots WHERE tenant_id = ANY($1::uuid[])',
      [[ws.tenantId, other.tenantId]]);
    if (left.rows[0].n !== 0) throw new Error(`Cleanup failed: ${left.rows[0].n} snapshots remain`);
    await teardownWorkspace(other);
    await teardownWorkspace(ws);
  });

  it('forecast_quotas is DROPPED, not merely unused', async () => {
    const t = await pool.query(
      `SELECT COUNT(*)::int AS n FROM information_schema.tables WHERE table_name = 'forecast_quotas'`);
    expect(t.rows[0].n).toBe(0);
  });

  it('stores user_id and returns it alongside the captured rep_name', async () => {
    const expected = await nameOf(rep.userId);
    const res = await post({
      period_label: PERIOD,
      reps: [{ user_id: Number(rep.userId), rep_name: expected, commit: 1000, pipeline: 5000 }],
    });
    expect(res.status, JSON.stringify(res.body)).toBe(201);

    const got = await list();
    expect(got.status).toBe(200);
    const row = got.body.data.find((r: { rep_name: string }) => r.rep_name === expected);
    expect(Number(row.user_id)).toBe(Number(rep.userId));
    // BOTH fields, meaning different things.
    expect(row.rep_name).toBe(expected);
    expect(parseFloat(row.commit)).toBe(1000);
  });

  it('RECORDS AN UNATTRIBUTED ROW rather than dropping it', async () => {
    // The live case: 20 of 24 deals carry only a name. A required user_id
    // would take ~$1.39M of pipeline out of every snapshot silently.
    const res = await post({
      period_label: PERIOD,
      reps: [{ rep_name: 'John Smith', commit: 2500, pipeline: 9000 }],
    });
    expect(res.status, JSON.stringify(res.body)).toBe(201);

    const rows = await rowsFor(ws.tenantId);
    const orphan = rows.find(r => r.rep_name === 'John Smith');
    expect(orphan).toBeDefined();
    expect(orphan.user_id).toBeNull();
    expect(parseFloat(orphan.commit)).toBe(2500);
  });

  it('re-snapshotting the same rep on the same day UPDATES rather than duplicating', async () => {
    const expected = await nameOf(rep.userId);
    await post({ period_label: PERIOD, reps: [{ user_id: Number(rep.userId), rep_name: expected, commit: 10 }] });
    const second = await post({
      period_label: PERIOD,
      reps: [{ user_id: Number(rep.userId), rep_name: expected, commit: 7777 }],
    });
    expect(second.status).toBe(201);

    const n = await pool.query(
      'SELECT COUNT(*)::int AS n, MAX(commit) AS c FROM forecast_snapshots WHERE tenant_id = $1 AND user_id = $2 AND period_label = $3',
      [ws.tenantId, rep.userId, PERIOD]);
    expect(n.rows[0].n).toBe(1);
    expect(parseFloat(n.rows[0].c)).toBe(7777);
  });

  it('an UNATTRIBUTED rep also upserts, rather than duplicating per run', async () => {
    // The functional index keys on COALESCE(user_id::text, rep_name), so a
    // NULL user_id does not make every re-run a new row — which a plain
    // UNIQUE on user_id would have, since NULLs are distinct.
    await post({ period_label: PERIOD, reps: [{ rep_name: 'John Smith', commit: 1 }] });
    await post({ period_label: PERIOD, reps: [{ rep_name: 'John Smith', commit: 4242 }] });

    const n = await pool.query(
      `SELECT COUNT(*)::int AS n, MAX(commit) AS c FROM forecast_snapshots
        WHERE tenant_id = $1 AND period_label = $2 AND user_id IS NULL AND rep_name = 'John Smith'`,
      [ws.tenantId, PERIOD]);
    expect(n.rows[0].n).toBe(1);
    expect(parseFloat(n.rows[0].c)).toBe(4242);
  });

  it('TWO USERS SHARING A DISPLAY NAME get separate rows — the old key merged them', async () => {
    const twinA = await addUserWithRole(ws, 'sales');
    const twinB = await addUserWithRole(ws, 'sales');
    // Same display name, two different people. Under
    // UNIQUE (tenant_id, period_label, rep_name, snapshot_date) the second
    // would have overwritten the first.
    await post({
      period_label: PERIOD,
      reps: [
        { user_id: Number(twinA.userId), rep_name: 'Sam Twin', commit: 100 },
        { user_id: Number(twinB.userId), rep_name: 'Sam Twin', commit: 200 },
      ],
    });

    const rows = await pool.query(
      `SELECT user_id, commit FROM forecast_snapshots
        WHERE tenant_id = $1 AND period_label = $2 AND rep_name = 'Sam Twin'
        ORDER BY commit ASC`,
      [ws.tenantId, PERIOD]);
    expect(rows.rowCount).toBe(2);
    expect(rows.rows.map(r => Number(r.user_id)).sort()).toEqual(
      [Number(twinA.userId), Number(twinB.userId)].sort());
  });

  it('a user from ANOTHER workspace is refused 400, naming the field only', async () => {
    const res = await post({
      period_label: PERIOD,
      reps: [{ user_id: Number(other.userId), rep_name: 'Someone Else', commit: 500 }],
    });
    expect(res.status, JSON.stringify(res.body)).toBe(400);
    expect(res.body.message).toContain('user_id');
    // Must not disclose that the user exists somewhere else.
    expect(res.body.message).not.toMatch(/another workspace|other workspace|exists/i);
  });

  it('THE WHOLE SNAPSHOT is refused when one rep is bad — no partial write', async () => {
    // A snapshot that silently omits a rep is a forecast record with a hole in
    // it, reported as success.
    const before = (await rowsFor(ws.tenantId)).length;
    const res = await post({
      period_label: PERIOD,
      reps: [
        { rep_name: 'Fresh Valid Rep', commit: 111 },
        { user_id: Number(other.userId), rep_name: 'Cross Tenant', commit: 222 },
      ],
    });
    expect(res.status).toBe(400);

    const after = await rowsFor(ws.tenantId);
    expect(after.length).toBe(before);
    expect(after.find(r => r.rep_name === 'Fresh Valid Rep')).toBeUndefined();
  });

  it('snapshots are workspace-scoped: another workspace never sees them', async () => {
    const theirs = await list(PERIOD, other);
    expect(theirs.status).toBe(200);
    expect(theirs.body.data).toHaveLength(0);
  });

  it('deleting a user KEEPS the snapshot and nulls the reference', async () => {
    /*
     * ON DELETE SET NULL, deliberately the OPPOSITE of quotas.user_id, which
     * CASCADEs. A quota without its person is meaningless; a snapshot is
     * history, and cascading would let deleting one user silently rewrite past
     * forecast calls. The captured `rep_name` is what keeps the row readable.
     */
    const doomed = await addUserWithRole(ws, 'sales');
    const doomedName = 'Departing Rep';
    await post({
      period_label: PERIOD,
      reps: [{ user_id: Number(doomed.userId), rep_name: doomedName, commit: 8888 }],
    });

    await pool.query('DELETE FROM users WHERE id = $1', [doomed.userId]);

    const kept = await pool.query(
      'SELECT user_id, rep_name, commit FROM forecast_snapshots WHERE tenant_id = $1 AND rep_name = $2',
      [ws.tenantId, doomedName]);
    expect(kept.rowCount).toBe(1);
    expect(kept.rows[0].user_id).toBeNull();
    // The name is why the surviving row still means something.
    expect(kept.rows[0].rep_name).toBe(doomedName);
    expect(parseFloat(kept.rows[0].commit)).toBe(8888);
  });

  it('requires the period query param on GET rather than returning everything', async () => {
    const res = await request(app).get('/api/v1/forecast/snapshots').set(auth(ws));
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('period');
  });

  it('rejects a non-numeric user_id before Postgres has to', async () => {
    const res = await post({
      period_label: PERIOD,
      reps: [{ user_id: 'not-a-number', rep_name: 'Bad Id', commit: 1 }],
    });
    expect(res.status).toBe(400);
    // Not a masked 500 carrying the driver's own text.
    expect(JSON.stringify(res.body)).not.toMatch(/invalid input syntax|22P02/);
  });
});
