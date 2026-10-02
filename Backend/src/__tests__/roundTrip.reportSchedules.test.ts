import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, addUserWithRole, TestWorkspace } from './helpers';
import { recipientsFor, deliverableTo, hasNoDeliverableRecipients } from '../services/reports/schedules';

/**
 * SCHEDULED DELIVERY — THE ACCESS MODEL. P3 Phase 8. Migration 057.
 *
 * There is no send path and no endpoint; this pins the SCHEMA and the RULE.
 *
 * The decision being tested: a send re-checks each recipient at send time. It
 * does not send as its creator, and there is no snapshot of who could see the
 * report when the schedule was made. Every test below is a consequence of that
 * — and the ones that matter most are the ones where access CHANGES after the
 * schedule exists, because a cached model passes all the others.
 */
describe('Saved report schedules', () => {
  let ws: TestWorkspace;
  let other: TestWorkspace;
  let viewer: TestWorkspace;    // granted view on the report
  let stranger: TestWorkspace;  // same workspace, no grant
  let reportId: string;
  let scheduleId: string;

  const addRecipient = (uid: number) =>
    pool.query(
      `INSERT INTO saved_report_schedule_recipients (schedule_id, user_id, tenant_id)
       VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      [scheduleId, uid, ws.tenantId],
    );

  const statusOf = async (uid: number) =>
    (await recipientsFor(scheduleId, ws.tenantId)).find(r => r.user_id === uid)?.status;

  beforeAll(async () => {
    ws = await setupWorkspace('sched');
    other = await setupWorkspace('sched-other');
    viewer = await addUserWithRole(ws, 'sales');
    stranger = await addUserWithRole(ws, 'sales');

    const created = await request(app).post('/api/v1/reports').set(auth(ws)).send({
      name: 'Weekly pipeline',
      definition: { v: 1, base: 'deals', metrics: [{ agg: 'count' }] },
    });
    reportId = created.body.data.id;

    await request(app).put(`/api/v1/reports/${reportId}/grants`).set(auth(ws))
      .send({ user_id: Number(viewer.userId), level: 'view' });

    const sched = await pool.query(
      `INSERT INTO saved_report_schedules (tenant_id, report_id, created_by, cadence, day_of_week, format)
       VALUES ($1, $2, $3, 'weekly', 1, 'pdf') RETURNING id`,
      [ws.tenantId, reportId, ws.userId],
    );
    scheduleId = sched.rows[0].id;
  });

  afterAll(async () => {
    const tenants = [ws.tenantId, other.tenantId];
    await pool.query('DELETE FROM saved_report_schedules WHERE tenant_id = ANY($1::uuid[])', [tenants]);
    await pool.query('DELETE FROM saved_reports WHERE tenant_id = ANY($1::uuid[])', [tenants]);
    await teardownWorkspace(other);
    await teardownWorkspace(ws);
  });

  // ── The schema refuses what it should ────────────────────────────────────

  it('refuses a cadence whose fields do not match it', async () => {
    /*
     * The first version of this CHECK ACCEPTED a weekly schedule with no
     * weekday, and the reason is worth keeping: `day_of_week BETWEEN 0 AND 6`
     * is NULL — not FALSE — when the column is NULL, so the branch evaluated to
     * NULL, the OR chain to NULL, and A CHECK CONSTRAINT ACCEPTS A NULL RESULT.
     * The one row it existed to refuse was the one it let through. Found by
     * probing it, not by reading it.
     */
    const bad = [
      ['weekly', null, null],      // no weekday
      ['monthly', null, null],     // no day
      ['daily', 3, null],          // a weekday it cannot use
      ['weekly', 9, null],         // out of range
      ['monthly', null, 31],       // 29-31 do not exist every month
    ] as const;

    for (const [cadence, dow, dom] of bad) {
      await expect(pool.query(
        `INSERT INTO saved_report_schedules (tenant_id, report_id, cadence, day_of_week, day_of_month)
         VALUES ($1, $2, $3, $4, $5)`,
        [ws.tenantId, reportId, cadence, dow, dom],
      )).rejects.toThrow();
    }
  });

  it('accepts each cadence in its satisfiable form', async () => {
    // The positive control. Without it the test above passes against a
    // constraint that refuses everything.
    // (cadence, day_of_week, day_of_month) — passed straight through, so a
    // tuple in the wrong slot fails loudly instead of being papered over by a
    // conditional. The first version put 15 in the WEEKDAY slot for `monthly`
    // and then read `dom`, which was null: the constraint refused it correctly
    // and the test was the thing at fault.
    for (const [cadence, dow, dom] of [
      ['daily', null, null], ['weekly', 1, null], ['monthly', null, 15],
    ] as const) {
      const r = await pool.query(
        `INSERT INTO saved_report_schedules (tenant_id, report_id, cadence, day_of_week, day_of_month)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [ws.tenantId, reportId, cadence, dow, dom],
      );
      expect(r.rows[0].id).toBeTruthy();
      await pool.query('DELETE FROM saved_report_schedules WHERE id = $1', [r.rows[0].id]);
    }
  });

  it('refuses a format nothing can produce', async () => {
    await expect(pool.query(
      `INSERT INTO saved_report_schedules (tenant_id, report_id, cadence, format)
       VALUES ($1, $2, 'daily', 'docx')`,
      [ws.tenantId, reportId],
    )).rejects.toThrow();
  });

  it('makes a cross-workspace schedule UNSTORABLE, not merely refused in code', async () => {
    await expect(pool.query(
      `INSERT INTO saved_report_schedules (tenant_id, report_id, cadence)
       VALUES ($1, $2, 'daily')`,
      [other.tenantId, reportId],
    )).rejects.toThrow();
  });

  it('makes a cross-workspace RECIPIENT unstorable too', async () => {
    await expect(pool.query(
      `INSERT INTO saved_report_schedule_recipients (schedule_id, user_id, tenant_id)
       VALUES ($1, $2, $3)`,
      [scheduleId, Number(other.userId), ws.tenantId],
    )).rejects.toThrow();
  });

  it('deletes schedules with the report, since there is nothing left to send', async () => {
    const r = await request(app).post('/api/v1/reports').set(auth(ws)).send({
      name: 'Doomed', definition: { v: 1, base: 'deals', metrics: [{ agg: 'count' }] },
    });
    await pool.query(
      `INSERT INTO saved_report_schedules (tenant_id, report_id, cadence) VALUES ($1, $2, 'daily')`,
      [ws.tenantId, r.body.data.id],
    );
    await request(app).delete(`/api/v1/reports/${r.body.data.id}`).set(auth(ws));

    const left = await pool.query(
      'SELECT count(*) FROM saved_report_schedules WHERE report_id = $1', [r.body.data.id]);
    expect(Number(left.rows[0].count)).toBe(0);
  });

  // ── The rule: access is re-checked, never remembered ─────────────────────

  it('sends to the owner and to a granted viewer', async () => {
    await addRecipient(Number(ws.userId));
    await addRecipient(Number(viewer.userId));

    const list = await recipientsFor(scheduleId, ws.tenantId);
    expect(list).toHaveLength(2);
    expect(deliverableTo(list)).toHaveLength(2);
  });

  it('REPORTS a recipient with no access rather than silently dropping them', async () => {
    /*
     * The reason this returns verdicts instead of a filtered list. A schedule
     * that silently stops mailing someone is a support mystery: they say they
     * stopped getting the report and nothing anywhere says why.
     */
    await addRecipient(Number(stranger.userId));

    const list = await recipientsFor(scheduleId, ws.tenantId);
    expect(list).toHaveLength(3);
    expect(await statusOf(Number(stranger.userId))).toBe('no_access');
    // Listed, but not delivered to.
    expect(deliverableTo(list).map(r => r.user_id)).not.toContain(Number(stranger.userId));
  });

  it('STOPS sending the moment a grant is revoked — no cleanup step needed', async () => {
    /*
     * THE TEST THAT DISTINGUISHES THIS MODEL FROM A CACHED ONE. A snapshot
     * taken when the schedule was created passes every test above and fails
     * this one, which is precisely the failure the decision was made to avoid:
     * revoking someone's access in the UI while a schedule keeps mailing them
     * the data every week.
     */
    expect(await statusOf(Number(viewer.userId))).toBe('ok');

    await request(app)
      .delete(`/api/v1/reports/${reportId}/grants/${viewer.userId}`).set(auth(ws));

    expect(await statusOf(Number(viewer.userId))).toBe('no_access');

    // Restore, and it resumes — equally without any action on the schedule.
    await request(app).put(`/api/v1/reports/${reportId}/grants`).set(auth(ws))
      .send({ user_id: Number(viewer.userId), level: 'view' });
    expect(await statusOf(Number(viewer.userId))).toBe('ok');
  });

  it('stops sending to a DEACTIVATED account, and says that is why', async () => {
    // Distinguished from no_access because the fix differs: "their account is
    // off" and "their access was revoked" are different conversations.
    await pool.query('UPDATE users SET is_active = false WHERE id = $1', [viewer.userId]);
    expect(await statusOf(Number(viewer.userId))).toBe('inactive');

    await pool.query('UPDATE users SET is_active = true WHERE id = $1', [viewer.userId]);
    expect(await statusOf(Number(viewer.userId))).toBe('ok');
  });

  it('is unaffected by the CREATOR losing their account', async () => {
    /*
     * A direct consequence of re-checking per recipient: the creator is NOT the
     * authority for anyone else's access, so their departure changes nothing.
     * Under a send-as-creator model this schedule would stop entirely — which
     * is the behaviour the decision rejected.
     */
    await pool.query('UPDATE saved_report_schedules SET created_by = NULL WHERE id = $1', [scheduleId]);

    const list = await recipientsFor(scheduleId, ws.tenantId);
    expect(deliverableTo(list).length).toBeGreaterThan(0);

    await pool.query('UPDATE saved_report_schedules SET created_by = $2 WHERE id = $1',
      [scheduleId, ws.userId]);
  });

  it('never reports a recipient from another workspace, even asked with the wrong tenant', async () => {
    expect(await recipientsFor(scheduleId, other.tenantId)).toEqual([]);
  });

  it('flags a schedule nobody can receive, without deleting it', async () => {
    /*
     * All recipients having lost access is a state to surface, not an action to
     * take: the grants may be restored tomorrow, and silently discarding
     * someone's configuration is worse than carrying a dormant row.
     */
    const empty = await pool.query(
      `INSERT INTO saved_report_schedules (tenant_id, report_id, cadence) VALUES ($1, $2, 'daily') RETURNING id`,
      [ws.tenantId, reportId],
    );
    await pool.query(
      `INSERT INTO saved_report_schedule_recipients (schedule_id, user_id, tenant_id) VALUES ($1, $2, $3)`,
      [empty.rows[0].id, Number(stranger.userId), ws.tenantId],
    );

    const list = await recipientsFor(empty.rows[0].id, ws.tenantId);
    expect(hasNoDeliverableRecipients(list)).toBe(true);
    // A schedule with no recipients at all is NOT the same state — nobody has
    // lost anything, it was simply never configured.
    expect(hasNoDeliverableRecipients([])).toBe(false);

    await pool.query('DELETE FROM saved_report_schedules WHERE id = $1', [empty.rows[0].id]);
  });

  it('removes a recipient row when their account is deleted', async () => {
    const u = await pool.query(
      `INSERT INTO users (tenant_id, email, first_name, last_name, role, password_hash)
       VALUES ($1, 'gone-sched@x.test', 'Gone', 'User', 'sales', 'x') RETURNING id`,
      [ws.tenantId],
    );
    await addRecipient(Number(u.rows[0].id));
    await pool.query('DELETE FROM users WHERE id = $1', [u.rows[0].id]);

    const left = await pool.query(
      'SELECT count(*) FROM saved_report_schedule_recipients WHERE user_id = $1', [u.rows[0].id]);
    expect(Number(left.rows[0].count)).toBe(0);
  });
});
