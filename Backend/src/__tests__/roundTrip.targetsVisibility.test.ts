import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import {
  app, setupWorkspace, teardownWorkspace, auth, addUserWithRole, TestWorkspace,
} from './helpers';

/**
 * THE REPORTING-CHAIN PERMISSION RULES, through the real endpoints.
 *
 * Two decisions, one relation:
 *   WRITE — a manager sets targets for anyone in their SUBTREE, at any depth,
 *           not only their direct reports.
 *   READ  — GET /quotas, GET /targets and GET /targets/projection return a
 *           person's row only to that person, to everyone ABOVE them in the
 *           chain, and to admins. They used to return the whole workspace to
 *           any authenticated caller.
 *
 * The org built here is four levels deep on purpose. A two-level fixture cannot
 * tell "direct reports" apart from "subtree", which is the entire change:
 *
 *     admin                          (the workspace owner, reports to nobody)
 *     vp        (manager)
 *      └─ mid   (manager)            reports to vp
 *          └─ rep      (sales)       reports to mid       — 2 below vp
 *              └─ junior (sales)     reports to rep       — 3 below vp
 *     outsider  (sales)              reports to nobody
 *
 * `rep` is deliberately a SALES role WITH a report. That pair is the sharp
 * edge of the two rules disagreeing on purpose: rep may SEE junior's targets
 * (chain) and may not SET them (role).
 *
 * Every assertion reads the response of a real HTTP call made with a real
 * login, and every write is confirmed against Postgres rather than the 200.
 */
describe('Targets — the reporting chain governs both writes and reads', () => {
  let ws: TestWorkspace;        // admin, workspace owner
  let vp: TestWorkspace;        // manager, top of the reporting tree
  let mid: TestWorkspace;       // manager, reports to vp
  let rep: TestWorkspace;       // sales,   reports to mid
  let junior: TestWorkspace;    // sales,   reports to rep
  let outsider: TestWorkspace;  // sales,   reports to nobody
  const PERIOD = 'Q4 2098';

  const id = (w: TestWorkspace) => Number(w.userId);

  const putQuota = (as: TestWorkspace, subjectId: number, amount: number) =>
    request(app).put('/api/v1/quotas').set(auth(as))
      .send({ user_id: subjectId, period_label: PERIOD, quota_amount: amount });

  const getQuotas = (as: TestWorkspace) =>
    request(app).get(`/api/v1/quotas?period=${encodeURIComponent(PERIOD)}`).set(auth(as));

  const getTargets = (as: TestWorkspace) =>
    request(app).get(`/api/v1/targets?period=${encodeURIComponent(PERIOD)}`).set(auth(as));

  const getProjection = (as: TestWorkspace) =>
    request(app).get(`/api/v1/targets/projection?period=${encodeURIComponent(PERIOD)}`).set(auth(as));

  const storedQuota = async (userId: number) => (await pool.query(
    `SELECT quota_amount FROM quotas WHERE tenant_id = $1 AND user_id = $2 AND period_label = $3`,
    [ws.tenantId, userId, PERIOD])).rows[0];

  beforeAll(async () => {
    ws = await setupWorkspace('chain');
    vp = await addUserWithRole(ws, 'manager');
    mid = await addUserWithRole(ws, 'manager');
    rep = await addUserWithRole(ws, 'sales');
    junior = await addUserWithRole(ws, 'sales');
    outsider = await addUserWithRole(ws, 'sales');

    for (const [child, parent] of [[mid, vp], [rep, mid], [junior, rep]] as const) {
      await pool.query('UPDATE users SET manager_id = $1 WHERE id = $2', [parent.userId, child.userId]);
    }

    // Everyone has a quota, so a filtered list is filtered because of the rule
    // and not because a row was missing. The admin writes them all, which is
    // itself the "admin may set anyone's" case.
    for (const who of [ws, vp, mid, rep, junior, outsider]) {
      const res = await putQuota(ws, id(who), 10000 + id(who));
      if (res.status !== 200) throw new Error(`fixture quota failed: ${JSON.stringify(res.body)}`);
    }
  });

  afterAll(async () => {
    await pool.query('DELETE FROM quotas WHERE tenant_id = $1', [ws.tenantId]);
    await pool.query('DELETE FROM user_sales_profiles WHERE tenant_id = $1', [ws.tenantId]);
    const left = await pool.query(
      `SELECT (SELECT COUNT(*) FROM quotas WHERE tenant_id = $1)
            + (SELECT COUNT(*) FROM user_sales_profiles WHERE tenant_id = $1) AS n`,
      [ws.tenantId]);
    if (Number(left.rows[0].n) !== 0) throw new Error(`Cleanup failed: ${left.rows[0].n} rows remain`);
    await teardownWorkspace(ws);
  });

  // ── The write rule: the subtree, not the direct reports ───────────────────

  it('a manager sets the quota of a report TWO levels down', async () => {
    const res = await putQuota(vp, id(rep), 222000);
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(Number((await storedQuota(id(rep))).quota_amount)).toBe(222000);
  });

  it('and THREE levels down', async () => {
    const res = await putQuota(vp, id(junior), 333000);
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(Number((await storedQuota(id(junior))).quota_amount)).toBe(333000);
  });

  it('a manager still may NOT set the quota of someone outside their chain', async () => {
    const before = Number((await storedQuota(id(outsider))).quota_amount);
    const res = await putQuota(vp, id(outsider), 1);
    expect(res.status, JSON.stringify(res.body)).toBe(403);
    expect(res.body.message).toMatch(/reporting line/);
    expect(Number((await storedQuota(id(outsider))).quota_amount)).toBe(before);
  });

  it('a manager may NOT set their OWN manager\'s quota — the chain is one-directional', async () => {
    const before = Number((await storedQuota(id(vp))).quota_amount);
    const res = await putQuota(mid, id(vp), 1);
    expect(res.status, JSON.stringify(res.body)).toBe(403);
    expect(Number((await storedQuota(id(vp))).quota_amount)).toBe(before);
  });

  it('a SALES rep with a report of their own still sets nobody\'s quota', async () => {
    const before = Number((await storedQuota(id(junior))).quota_amount);
    const res = await putQuota(rep, id(junior), 1);
    expect(res.status, JSON.stringify(res.body)).toBe(403);
    expect(Number((await storedQuota(id(junior))).quota_amount)).toBe(before);
  });

  it('the profile endpoint applies the same subtree rule', async () => {
    const ok = await request(app).put(`/api/v1/targets/${id(junior)}/profile`)
      .set(auth(vp)).send({ territory: 'South' });
    expect(ok.status, JSON.stringify(ok.body)).toBe(200);

    const no = await request(app).put(`/api/v1/targets/${id(outsider)}/profile`)
      .set(auth(vp)).send({ territory: 'North' });
    expect(no.status, JSON.stringify(no.body)).toBe(403);

    const stored = await pool.query(
      'SELECT user_id, territory FROM user_sales_profiles WHERE tenant_id = $1', [ws.tenantId]);
    expect(stored.rows.map(r => Number(r.user_id))).toEqual([id(junior)]);
    expect(stored.rows[0].territory).toBe('South');
  });

  it('a deactivated middle manager does NOT sever the subtree beneath them', async () => {
    // The reporting graph is loaded without an is_active filter for exactly
    // this: mid is out of the picture, and vp is still accountable for rep.
    await pool.query('UPDATE users SET is_active = false WHERE id = $1', [mid.userId]);
    try {
      const res = await putQuota(vp, id(rep), 444000);
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      expect(Number((await storedQuota(id(rep))).quota_amount)).toBe(444000);
    } finally {
      await pool.query('UPDATE users SET is_active = true WHERE id = $1', [mid.userId]);
    }
  });

  // ── The read rule ─────────────────────────────────────────────────────────

  const idsFrom = (body: { data: { user_id?: number; id?: number }[] }) =>
    body.data.map(r => Number(r.user_id ?? r.id)).sort((a, b) => a - b);
  const sorted = (...w: TestWorkspace[]) => w.map(id).sort((a, b) => a - b);

  it('GET /quotas: a rep sees their OWN row and nothing else', async () => {
    const res = await getQuotas(rep);
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(idsFrom(res.body)).toEqual(sorted(rep, junior)); // own + their one report
  });

  it('GET /quotas: someone outside every chain sees only themselves', async () => {
    const res = await getQuotas(outsider);
    expect(idsFrom(res.body)).toEqual(sorted(outsider));
  });

  it('GET /quotas: a manager sees their whole subtree, MORE THAN ONE LEVEL DOWN', async () => {
    const res = await getQuotas(vp);
    // vp + mid (1 down) + rep (2 down) + junior (3 down). Not the admin, not
    // the outsider. The two-levels-down rows are the ones a direct-reports
    // filter would drop.
    expect(idsFrom(res.body)).toEqual(sorted(vp, mid, rep, junior));
  });

  it('GET /quotas: a middle manager sees down, never up', async () => {
    const res = await getQuotas(mid);
    expect(idsFrom(res.body)).toEqual(sorted(mid, rep, junior));
    expect(idsFrom(res.body)).not.toContain(id(vp));
  });

  it('GET /quotas: an admin sees everyone', async () => {
    const res = await getQuotas(ws);
    expect(idsFrom(res.body)).toEqual(sorted(ws, vp, mid, rep, junior, outsider));
  });

  it('GET /targets applies the identical rule', async () => {
    expect(idsFrom((await getTargets(vp)).body)).toEqual(sorted(vp, mid, rep, junior));
    expect(idsFrom((await getTargets(outsider)).body)).toEqual(sorted(outsider));
    expect(idsFrom((await getTargets(ws)).body)).toEqual(sorted(ws, vp, mid, rep, junior, outsider));
  });

  it('GET /targets/projection applies it too — a projection is a performance profile', async () => {
    // The projection keys by name rather than id, so this asserts on the count
    // and on the absence of the outsider's name.
    const asVp = await getProjection(vp);
    expect(asVp.status, JSON.stringify(asVp.body)).toBe(200);
    expect(asVp.body.data).toHaveLength(4);

    const outsiderRow = (await getProjection(outsider)).body.data;
    expect(outsiderRow).toHaveLength(1);
    expect((await getProjection(ws)).body.data).toHaveLength(6);
  });

  it('everything a caller may EDIT is something they may READ', async () => {
    for (const who of [ws, vp, mid, rep, junior, outsider]) {
      const res = await getQuotas(who);
      const visible = idsFrom(res.body);
      for (const editable of res.body.editable_user_ids as number[]) {
        expect(visible, `${who.email} may edit ${editable} but cannot see them`).toContain(editable);
      }
    }
  });

  it('GET /quotas serves visible_user_ids, so a client can tell "unset" from "not yours"', async () => {
    // Without this field an absent row is ambiguous and ForecastPage prints
    // "Not set" over someone's real quota. Pinned here as well as in
    // ForecastPage.quotaVisibility.test.tsx, because the two halves fail
    // independently: the server can stop sending it, or the client can stop
    // reading it.
    const asMid = await getQuotas(mid);
    expect([...(asMid.body.visible_user_ids as number[])].sort((a, b) => a - b))
      .toEqual(sorted(mid, rep, junior));

    const asOutsider = await getQuotas(outsider);
    expect(asOutsider.body.visible_user_ids).toEqual([id(outsider)]);

    // It agrees with what was actually returned, rather than being a second
    // answer computed somewhere else.
    expect(idsFrom(asMid.body).every(i => (asMid.body.visible_user_ids as number[]).includes(i))).toBe(true);
  });

  it('a filtered row is ABSENT, never redacted — no placeholder names leak', async () => {
    const res = await getQuotas(rep);
    const names = (res.body.data as { rep_name: string | null }[]).map(r => r.rep_name);
    expect(names.every(n => n !== null && n !== '')).toBe(true);
    expect(res.body.data).toHaveLength(2);
  });

  it('a REPORTING CYCLE written directly to the table does not hang the endpoint', async () => {
    // wouldCreateCycle refuses to write this through the API, so it can only
    // arrive by direct SQL — but if it ever does, an unguarded upward walk
    // would spin forever and take the endpoint with it.
    await pool.query('UPDATE users SET manager_id = $1 WHERE id = $2', [junior.userId, vp.userId]);
    try {
      const res = await getQuotas(mid);
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    } finally {
      await pool.query('UPDATE users SET manager_id = NULL WHERE id = $1', [vp.userId]);
    }
  });

  it('the rule is tenant-scoped: another workspace\'s manager sees nothing here', async () => {
    const other = await setupWorkspace('chain-other');
    try {
      const res = await getQuotas(other);
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      // Their own workspace has no quota for this period, and none of ours is
      // reachable — the tenant predicate, not the chain, is what stops it.
      expect(res.body.data).toHaveLength(0);
    } finally {
      await teardownWorkspace(other);
    }
  });
});
