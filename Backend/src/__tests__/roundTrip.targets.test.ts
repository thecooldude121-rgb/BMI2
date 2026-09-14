import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import {
  app, setupWorkspace, teardownWorkspace, auth, addUserWithRole, TestWorkspace,
} from './helpers';

/**
 * Per-user targets. Migration 044.
 *
 * WHAT THESE PIN:
 *  1. WHO MAY SET WHOSE TARGETS — admin: anyone; manager: anyone in their
 *     reporting subtree; anyone: themselves, only when the workspace toggle is
 *     on. PUT /quotas was open to every role before this, so the
 *     sales-sets-someone-else case is the regression that matters most. The
 *     DEPTH of the subtree rule is pinned next door in
 *     roundTrip.targetsVisibility.test.ts, which builds a four-level org; the
 *     fixture here is one level and cannot tell the two rules apart.
 *  2. The rule is SERVED (editable_user_ids, can_edit) and agrees with what the
 *     write path enforces.
 *  3. Activity targets and currency are validated, and PARTIAL: ForecastPage's
 *     amount-only write must not wipe targets set in Settings.
 *  4. The profile table is tenant-consistent AT THE DATABASE (composite FK),
 *     not only at the API.
 *  5. Every stored value is read back from Postgres, never from the response.
 */
describe('Targets — quotas + sales profiles (migration 044)', () => {
  let ws: TestWorkspace;          // admin
  let other: TestWorkspace;       // a different workspace entirely
  let manager: TestWorkspace;
  let report: TestWorkspace;      // reports to `manager`
  let stranger: TestWorkspace;    // sales, reports to nobody
  const PERIOD = 'Q4 2099';

  const setToggle = (on: boolean) => pool.query(
    `UPDATE tenants SET settings = settings || jsonb_build_object('reps_set_own_targets', $2::boolean)
      WHERE id = $1`, [ws.tenantId, on]);

  const putQuota = (as: TestWorkspace, body: Record<string, unknown>) =>
    request(app).put('/api/v1/quotas').set(auth(as))
      .send({ period_label: PERIOD, quota_amount: 100000, ...body });

  const putProfile = (as: TestWorkspace, userId: string | number, body: Record<string, unknown>) =>
    request(app).put(`/api/v1/targets/${userId}/profile`).set(auth(as)).send(body);

  const storedQuota = async (userId: string | number) => (await pool.query(
    `SELECT quota_amount, currency, activity_targets FROM quotas
      WHERE tenant_id = $1 AND user_id = $2 AND period_label = $3`,
    [ws.tenantId, userId, PERIOD])).rows[0];

  const storedProfile = async (userId: string | number) => (await pool.query(
    `SELECT seniority, ramp_start_date::text AS ramp_start_date, territory, product_line
       FROM user_sales_profiles WHERE user_id = $1`, [userId])).rows[0];

  beforeAll(async () => {
    ws = await setupWorkspace('targets');
    other = await setupWorkspace('targets-other');
    manager = await addUserWithRole(ws, 'manager');
    report = await addUserWithRole(ws, 'sales');
    stranger = await addUserWithRole(ws, 'sales');
    await pool.query('UPDATE users SET manager_id = $1 WHERE id = $2', [manager.userId, report.userId]);
  });

  afterAll(async () => {
    const tenants = [ws.tenantId, other.tenantId];
    await pool.query('DELETE FROM quotas WHERE tenant_id = ANY($1::uuid[])', [tenants]);
    await pool.query('DELETE FROM user_sales_profiles WHERE tenant_id = ANY($1::uuid[])', [tenants]);
    const left = await pool.query(
      `SELECT (SELECT COUNT(*) FROM quotas WHERE tenant_id = ANY($1::uuid[]))
            + (SELECT COUNT(*) FROM user_sales_profiles WHERE tenant_id = ANY($1::uuid[])) AS n`,
      [tenants]);
    if (Number(left.rows[0].n) !== 0) throw new Error(`Cleanup failed: ${left.rows[0].n} rows remain`);
    await teardownWorkspace(other);
    await teardownWorkspace(ws);
  });

  // ── 1. Who may set whose targets ──────────────────────────────────────────

  it('an admin may set anyone\'s quota', async () => {
    await setToggle(false);
    const res = await putQuota(ws, { user_id: Number(stranger.userId) });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(Number((await storedQuota(stranger.userId)).quota_amount)).toBe(100000);
  });

  it('a SALES rep may NOT set someone else\'s quota — the hole PUT /quotas used to have', async () => {
    await setToggle(true); // even with self-service on
    const res = await putQuota(stranger, { user_id: Number(report.userId), quota_amount: 1 });
    expect(res.status, JSON.stringify(res.body)).toBe(403);
    expect(await storedQuota(report.userId)).toBeUndefined();
  });

  it('a manager may set a DIRECT report\'s quota', async () => {
    const res = await putQuota(manager, { user_id: Number(report.userId), quota_amount: 250000 });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(Number((await storedQuota(report.userId)).quota_amount)).toBe(250000);
  });

  it('a manager may NOT set the quota of someone who does not report to them', async () => {
    const before = await storedQuota(stranger.userId);
    const res = await putQuota(manager, { user_id: Number(stranger.userId), quota_amount: 1 });
    expect(res.status, JSON.stringify(res.body)).toBe(403);
    expect(res.body.message).toMatch(/reporting line/);
    expect(Number((await storedQuota(stranger.userId)).quota_amount)).toBe(Number(before.quota_amount));
  });

  it('a manager may NOT set targets for an admin, even one recorded as reporting to them', async () => {
    // users.role and users.manager_id are set independently, so this line can
    // exist. canActOn must still refuse it.
    await pool.query('UPDATE users SET manager_id = $1 WHERE id = $2', [manager.userId, ws.userId]);
    try {
      const res = await putQuota(manager, { user_id: Number(ws.userId), quota_amount: 1 });
      expect(res.status, JSON.stringify(res.body)).toBe(403);
      expect(await storedQuota(ws.userId)).toBeUndefined();
    } finally {
      await pool.query('UPDATE users SET manager_id = NULL WHERE id = $1', [ws.userId]);
    }
  });

  it('self-service is OFF by default: nobody but an admin sets their own', async () => {
    await pool.query(`UPDATE tenants SET settings = settings - 'reps_set_own_targets' WHERE id = $1`, [ws.tenantId]);
    for (const who of [report, manager]) {
      const res = await putQuota(who, { user_id: Number(who.userId), quota_amount: 5 });
      expect(res.status, `${who.email}: ${JSON.stringify(res.body)}`).toBe(403);
      expect(res.body.message).toMatch(/does not let people set their own targets/);
    }
    expect(await storedQuota(manager.userId)).toBeUndefined();
  });

  it('with the toggle ON, a rep and a manager may each set their own', async () => {
    await setToggle(true);
    for (const who of [report, manager]) {
      const res = await putQuota(who, { user_id: Number(who.userId), quota_amount: 7 });
      expect(res.status, `${who.email}: ${JSON.stringify(res.body)}`).toBe(200);
      expect(Number((await storedQuota(who.userId)).quota_amount)).toBe(7);
    }
    await setToggle(false);
  });

  it('a user from ANOTHER workspace is a 400 naming the field, and discloses nothing', async () => {
    const res = await putQuota(ws, { user_id: Number(other.userId) });
    expect(res.status, JSON.stringify(res.body)).toBe(400);
    expect(res.body.message).toBe('user_id does not name a user in this workspace');
    const n = await pool.query('SELECT COUNT(*)::int AS n FROM quotas WHERE user_id = $1', [other.userId]);
    expect(n.rows[0].n).toBe(0);
  });

  // ── 2. The rule is served, and matches the write path ─────────────────────

  it('GET /quotas serves editable_user_ids that match what PUT enforces', async () => {
    await setToggle(false);
    const asManager = await request(app).get(`/api/v1/quotas?period=${encodeURIComponent(PERIOD)}`).set(auth(manager));
    expect(asManager.status).toBe(200);
    expect(asManager.body.editable_user_ids).toEqual([Number(report.userId)]);

    const asSales = await request(app).get(`/api/v1/quotas?period=${encodeURIComponent(PERIOD)}`).set(auth(stranger));
    expect(asSales.body.editable_user_ids).toEqual([]);

    await setToggle(true);
    const asSalesOn = await request(app).get(`/api/v1/quotas?period=${encodeURIComponent(PERIOD)}`).set(auth(stranger));
    expect(asSalesOn.body.editable_user_ids).toEqual([Number(stranger.userId)]);
    await setToggle(false);
  });

  it('GET /targets lists this workspace only, with served rules and honest nulls', async () => {
    const res = await request(app).get(`/api/v1/targets?period=${encodeURIComponent(PERIOD)}`).set(auth(manager));
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    const ids = res.body.data.map((r: { user_id: number }) => r.user_id);
    expect(ids).toContain(Number(report.userId));
    expect(ids).not.toContain(Number(other.userId));
    // `stranger` reports to nobody, so a manager may not SEE them at all now —
    // the list is filtered by the same chain that governs the write.
    expect(ids).not.toContain(Number(stranger.userId));

    const r = res.body.data.find((x: { user_id: number }) => x.user_id === Number(report.userId));
    expect(r.can_edit).toBe(true);
    expect(r.manager_id).toBe(Number(manager.userId));
    // can_edit is not blanket-true on a filtered list: the manager's OWN row is
    // visible and not editable, because self-service is off.
    const self = res.body.data.find((x: { user_id: number }) => x.user_id === Number(manager.userId));
    expect(self.can_edit).toBe(false);

    expect(res.body.seniority_levels).toEqual(['junior', 'mid', 'senior', 'lead']);
    expect(res.body.activity_target_keys).toEqual(['calls_per_week', 'meetings_per_week', 'emails_per_week']);
    expect(res.body.reps_set_own_targets).toBe(false);
    expect(res.body.period.label).toBe(PERIOD);
    // Served: a manager may flip the self-service toggle (PUT /workspace)...
    expect(res.body.can_change_self_service).toBe(true);
    // ...a sales rep may not, and is told so rather than shown a control.
    const asSales = await request(app).get(`/api/v1/targets?period=${encodeURIComponent(PERIOD)}`).set(auth(stranger));
    expect(asSales.body.can_change_self_service).toBe(false);
  });

  it('GET /targets reports a user with nothing recorded as null, not zeros', async () => {
    const fresh = await addUserWithRole(ws, 'sales');
    const res = await request(app).get(`/api/v1/targets?period=${encodeURIComponent(PERIOD)}`).set(auth(ws));
    const row = res.body.data.find((x: { user_id: number }) => x.user_id === Number(fresh.userId));
    expect(row.profile).toBeNull();
    expect(row.quota).toBeNull();
  });

  it('GET /targets refuses an unparseable period', async () => {
    const res = await request(app).get('/api/v1/targets?period=next%20quarter').set(auth(ws));
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/calendar quarter/);
  });

  // ── 3. Validation, currency, and partial writes ───────────────────────────

  it('refuses a period_label that is not a calendar quarter', async () => {
    for (const bad of ['Q5 2026', 'Q2 262026', 'next quarter', '2026-Q3']) {
      const res = await putQuota(ws, { user_id: Number(stranger.userId), period_label: bad });
      expect(res.status, `${bad}: ${JSON.stringify(res.body)}`).toBe(400);
      expect(res.body.message).toMatch(/period_label/);
    }
  });

  it('activity_targets: unknown keys, fractions and absurd values are refused by name', async () => {
    const cases: [unknown, RegExp][] = [
      [{ linkedin_per_week: 5 }, /linkedin_per_week is not a recognised target/],
      [{ calls_per_week: 2.5 }, /calls_per_week must be a whole number/],
      [{ calls_per_week: -1 }, /calls_per_week must be a whole number/],
      [{ calls_per_week: 1001 }, /calls_per_week must be a whole number from 0 to 1000/],
      [{ calls_per_week: '40' }, /calls_per_week must be a whole number/],
      [[40], /must be an object/],
    ];
    for (const [body, msg] of cases) {
      const res = await putQuota(ws, { user_id: Number(stranger.userId), activity_targets: body });
      expect(res.status, JSON.stringify(body)).toBe(400);
      expect(res.body.message).toMatch(msg);
    }
  });

  it('activity_targets are stored, and an amount-only write (ForecastPage) does NOT wipe them', async () => {
    const set = await putQuota(ws, {
      user_id: Number(stranger.userId),
      activity_targets: { calls_per_week: 40, meetings_per_week: 8 },
    });
    expect(set.status, JSON.stringify(set.body)).toBe(200);
    expect((await storedQuota(stranger.userId)).activity_targets)
      .toEqual({ calls_per_week: 40, meetings_per_week: 8 });

    // Exactly ForecastPage's payload: user, period, amount. Nothing else.
    const amountOnly = await request(app).put('/api/v1/quotas').set(auth(ws))
      .send({ user_id: Number(stranger.userId), period_label: PERIOD, quota_amount: 300000 });
    expect(amountOnly.status).toBe(200);
    const after = await storedQuota(stranger.userId);
    expect(Number(after.quota_amount)).toBe(300000);
    expect(after.activity_targets).toEqual({ calls_per_week: 40, meetings_per_week: 8 });
  });

  it('a null key clears that target; activity_targets: null clears them all', async () => {
    await putQuota(ws, { user_id: Number(stranger.userId), activity_targets: { calls_per_week: 40, meetings_per_week: null } });
    expect((await storedQuota(stranger.userId)).activity_targets).toEqual({ calls_per_week: 40 });
    await putQuota(ws, { user_id: Number(stranger.userId), activity_targets: null });
    expect((await storedQuota(stranger.userId)).activity_targets).toEqual({});
  });

  it('currency: a new quota takes the workspace default, else USD; omitted on update keeps it', async () => {
    const a = await addUserWithRole(ws, 'sales');
    await pool.query(`UPDATE tenants SET settings = settings - 'default_currency' WHERE id = $1`, [ws.tenantId]);
    await putQuota(ws, { user_id: Number(a.userId) });
    expect((await storedQuota(a.userId)).currency).toBe('USD');

    const b = await addUserWithRole(ws, 'sales');
    await pool.query(
      `UPDATE tenants SET settings = settings || '{"default_currency":"INR"}'::jsonb WHERE id = $1`, [ws.tenantId]);
    try {
      await putQuota(ws, { user_id: Number(b.userId) });
      expect((await storedQuota(b.userId)).currency).toBe('INR');

      await putQuota(ws, { user_id: Number(b.userId), currency: 'aed' });
      expect((await storedQuota(b.userId)).currency).toBe('AED');
      // Omitted on the next write: keeps AED rather than reverting to INR.
      await putQuota(ws, { user_id: Number(b.userId), quota_amount: 9 });
      expect((await storedQuota(b.userId)).currency).toBe('AED');
    } finally {
      await pool.query(`UPDATE tenants SET settings = settings - 'default_currency' WHERE id = $1`, [ws.tenantId]);
    }

    const bad = await putQuota(ws, { user_id: Number(a.userId), currency: 'RUPEES' });
    expect(bad.status).toBe(400);
    expect(bad.body.message).toMatch(/currency/);
  });

  // ── 4. Sales profiles ─────────────────────────────────────────────────────

  it('stores a profile, and a partial update leaves the other fields alone', async () => {
    const res = await putProfile(manager, report.userId, {
      seniority: 'mid', ramp_start_date: '2026-07-01', territory: 'Gulf', product_line: 'Managed Services',
    });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(await storedProfile(report.userId)).toEqual({
      seniority: 'mid', ramp_start_date: '2026-07-01', territory: 'Gulf', product_line: 'Managed Services',
    });

    const partial = await putProfile(manager, report.userId, { territory: 'Kenya' });
    expect(partial.status).toBe(200);
    expect(await storedProfile(report.userId)).toEqual({
      seniority: 'mid', ramp_start_date: '2026-07-01', territory: 'Kenya', product_line: 'Managed Services',
    });
  });

  it('refuses the D043 date — a year of 262026 — and dates that do not exist', async () => {
    for (const bad of ['262026-09-30', '2026-02-30', '1999-12-31', '30/09/2026']) {
      const res = await putProfile(ws, report.userId, { ramp_start_date: bad });
      expect(res.status, `${bad}: ${JSON.stringify(res.body)}`).toBe(400);
      expect(res.body.message).toMatch(/ramp_start_date/);
    }
    expect((await storedProfile(report.userId)).ramp_start_date).toBe('2026-07-01');
  });

  it('refuses an unknown seniority; blank text is stored as NULL, never as ""', async () => {
    const bad = await putProfile(ws, report.userId, { seniority: 'rockstar' });
    expect(bad.status).toBe(400);
    expect(bad.body.message).toMatch(/seniority must be one of: junior, mid, senior, lead/);

    const blank = await putProfile(ws, report.userId, { territory: '   ' });
    expect(blank.status).toBe(200);
    expect((await storedProfile(report.userId)).territory).toBeNull();
  });

  it('the profile endpoint applies the same permission rule as quotas', async () => {
    const res = await putProfile(manager, stranger.userId, { seniority: 'senior' });
    expect(res.status).toBe(403);
    expect(await storedProfile(stranger.userId)).toBeUndefined();

    const cross = await putProfile(ws, other.userId, { seniority: 'senior' });
    expect(cross.status).toBe(400);
    expect(cross.body.message).toBe('user_id does not name a user in this workspace');
  });

  it('an empty body is refused rather than reported as a save', async () => {
    const res = await putProfile(ws, report.userId, {});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/No fields to update/);
  });

  it('THE DATABASE refuses a profile whose tenant differs from its user\'s', async () => {
    // Bypass the API entirely. The composite FK (user_id, tenant_id) ->
    // users(id, tenant_id) is what makes this impossible, not the controller.
    await expect(pool.query(
      `INSERT INTO user_sales_profiles (user_id, tenant_id, seniority) VALUES ($1, $2, 'lead')`,
      [other.userId, ws.tenantId],
    )).rejects.toMatchObject({ code: '23503' });
  });

  it('deleting a user CASCADES their profile away', async () => {
    const doomed = await addUserWithRole(ws, 'sales');
    await putProfile(ws, doomed.userId, { seniority: 'junior' });
    expect(await storedProfile(doomed.userId)).toBeDefined();
    await pool.query('DELETE FROM users WHERE id = $1', [doomed.userId]);
    expect(await storedProfile(doomed.userId)).toBeUndefined();
  });

  // ── The workspace toggle itself ───────────────────────────────────────────

  it('the toggle is set through PUT /workspace by an admin, and reads back as a boolean', async () => {
    const on = await request(app).put('/api/v1/workspace').set(auth(ws)).send({ reps_set_own_targets: true });
    expect(on.status, JSON.stringify(on.body)).toBe(200);
    expect(on.body.data.reps_set_own_targets).toBe(true);
    const row = await pool.query(`SELECT settings->'reps_set_own_targets' AS v FROM tenants WHERE id = $1`, [ws.tenantId]);
    expect(row.rows[0].v).toBe(true);

    const str = await request(app).put('/api/v1/workspace').set(auth(ws)).send({ reps_set_own_targets: 'false' });
    expect(str.status).toBe(400);

    const bySales = await request(app).put('/api/v1/workspace').set(auth(stranger)).send({ reps_set_own_targets: false });
    expect(bySales.status).toBe(403);

    const cleared = await request(app).put('/api/v1/workspace').set(auth(ws)).send({ reps_set_own_targets: null });
    expect(cleared.body.data.reps_set_own_targets).toBe(false);
  });
});
