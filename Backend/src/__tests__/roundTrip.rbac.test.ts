import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, addUserWithRole, TestWorkspace } from './helpers';

/**
 * RBAC coverage — Phase 4.
 *
 * CLAUDE.md states it as an architecture rule: "RBAC checks happen at the API
 * layer, not just the UI." This file tests that claim rather than assuming it,
 * and the roles live in ONE workspace on purpose: a second workspace would be
 * refused by tenant scoping and prove nothing about roles.
 *
 * READ THIS BEFORE EXTENDING. There is exactly one role policy expressed
 * anywhere in the backend — `requireRole('admin','manager')` on the three
 * /invites routes. Every other route file has zero role checks (verified by
 * grepping all 14 of them). So for data endpoints there is no policy to test
 * against, and asserting one here would be inventing product rules in a test
 * file. What this file does instead:
 *
 *   1. Tests the policy that IS specified — /invites — properly.
 *   2. Tests the security invariant that IS documented — role comes from the
 *      token and cannot be asserted by the client.
 *   3. CHARACTERISES the unenforced state for data endpoints, clearly labelled,
 *      so that implementing RBAC makes these fail loudly and forces a decision
 *      rather than silently changing behaviour.
 *
 * (3) is NOT an endorsement. See the session report: the gap is a finding.
 */
describe('RBAC', () => {
  let ws: TestWorkspace;          // admin
  let manager: TestWorkspace;
  let sales: TestWorkspace;

  beforeAll(async () => {
    ws = await setupWorkspace('rbac');
    manager = await addUserWithRole(ws, 'manager');
    sales = await addUserWithRole(ws, 'sales');
  });

  afterAll(async () => {
    for (const t of ['tasks', 'deals', 'contacts', 'companies']) {
      await pool.query(`DELETE FROM ${t} WHERE tenant_id = $1`, [ws.tenantId]);
      const left = await pool.query(`SELECT COUNT(*)::int AS n FROM ${t} WHERE tenant_id = $1`, [ws.tenantId]);
      if (left.rows[0].n !== 0) throw new Error(`Cleanup failed: ${left.rows[0].n} rows left in ${t}`);
    }
    await pool.query('DELETE FROM workspace_invites WHERE workspace_id = $1', [ws.tenantId]).catch(() => undefined);
    await teardownWorkspace(ws);   // removes all three users with the tenant
  });

  // ── 1. The one policy the backend actually expresses ─────────────────────

  describe('/invites — requireRole(admin, manager), the only role policy in the API', () => {
    it('a sales user is refused with 403 and a real message, and creates no invite', async () => {
      // NB: workspace_invites is the one table whose column is `workspace_id`,
      // not `tenant_id` — it postdates the rename described in CLAUDE.md.
      const before = await pool.query('SELECT COUNT(*)::int AS n FROM workspace_invites WHERE workspace_id = $1', [ws.tenantId]);

      const res = await request(app).post('/api/v1/invites').set(auth(sales))
        .send({ email: `nope.${Date.now()}@example.com`, role: 'sales' });

      expect(res.status, JSON.stringify(res.body)).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Insufficient permissions/);
      expect(res.body.message).not.toMatch(/Internal Server Error/);

      const after = await pool.query('SELECT COUNT(*)::int AS n FROM workspace_invites WHERE workspace_id = $1', [ws.tenantId]);
      expect(after.rows[0].n, 'a refused request must not write an invite').toBe(before.rows[0].n);
    });

    it('a sales user is refused from LISTING and REVOKING invites too, not just creating', async () => {
      const list = await request(app).get('/api/v1/invites').set(auth(sales));
      expect(list.status).toBe(403);
      // A 403 must not leak the collection it is protecting.
      expect(list.body.data).toBeUndefined();

      const revoke = await request(app).delete('/api/v1/invites/some-id').set(auth(sales));
      expect(revoke.status).toBe(403);
    });

    it('a manager IS permitted to list invites', async () => {
      const res = await request(app).get('/api/v1/invites').set(auth(manager));
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('an admin IS permitted to list invites', async () => {
      const res = await request(app).get('/api/v1/invites').set(auth(ws));
      expect(res.status, JSON.stringify(res.body)).toBe(200);
    });
  });

  // ── 2. Role is a token claim, never a client assertion ───────────────────

  describe('role cannot be asserted by the client', () => {
    it('a sales user cannot escalate by sending role=admin in the body, query or a header', async () => {
      const attempts = [
        request(app).post('/api/v1/invites').set(auth(sales))
          .send({ email: `esc1.${Date.now()}@example.com`, role: 'sales', user_role: 'admin' }),
        request(app).post('/api/v1/invites?role=admin').set(auth(sales))
          .send({ email: `esc2.${Date.now()}@example.com`, role: 'sales' }),
        request(app).post('/api/v1/invites').set({ ...auth(sales), 'X-Role': 'admin', 'X-User-Role': 'admin' })
          .send({ email: `esc3.${Date.now()}@example.com`, role: 'sales' }),
      ];
      for (const [n, attempt] of (await Promise.all(attempts)).entries()) {
        expect(attempt.status, `escalation attempt ${n + 1} was not refused`).toBe(403);
      }

      // The user's stored role is untouched by the attempts.
      const row = await pool.query('SELECT role FROM users WHERE id = $1', [sales.userId]);
      expect(row.rows[0].role).toBe('sales');
    });

    it('an unauthenticated request is 401, distinct from a 403 for the wrong role', async () => {
      const anon = await request(app).get('/api/v1/invites');
      expect(anon.status).toBe(401);
      const wrongRole = await request(app).get('/api/v1/invites').set(auth(sales));
      expect(wrongRole.status).toBe(403);
    });
  });

  // ── 3. Characterisation of the UNENFORCED state — a finding, not a spec ──

  describe('CHARACTERISATION: data endpoints enforce NO role policy (finding, not endorsement)', () => {
    /**
     * These pass today because `requireRole` is absent from all 13 non-invite
     * route files, so a `sales` token can do everything an `admin` can. The
     * frontend has role gates; the API does not, which is exactly the
     * arrangement CLAUDE.md's "not just the UI" rule forbids.
     *
     * They are written as assertions of the CURRENT state so that adding real
     * RBAC breaks them immediately and visibly. When that happens the fix is to
     * REWRITE these against the new policy — never to delete them quietly.
     */
    it('a sales user can create, edit and DELETE a company — no role gate exists', async () => {
      const create = await request(app).post('/api/v1/companies').set(auth(sales))
        .send({ name: `Sales Made This ${Date.now()}` });
      expect(create.status, JSON.stringify(create.body)).toBe(201);
      const id = create.body.data.id;

      const edit = await request(app).put(`/api/v1/companies/${id}`).set(auth(sales)).send({ industry: 'Technology' });
      expect(edit.status).toBe(200);

      const del = await request(app).delete(`/api/v1/companies/${id}`).set(auth(sales));
      expect(del.status).toBe(200);

      // Confirm the delete really happened, rather than trusting the 200.
      const gone = await pool.query('SELECT COUNT(*)::int AS n FROM companies WHERE id = $1', [id]);
      expect(gone.rows[0].n).toBe(0);
    });

    it('a sales user can move a deal stage and write audit history attributed to them', async () => {
      const deal = await request(app).post('/api/v1/deals').set(auth(sales))
        .send({ name: `Sales Deal ${Date.now()}`, value: 1000, stage: 'prospecting' });
      expect(deal.status, JSON.stringify(deal.body)).toBe(201);
      const id = deal.body.data.id;

      const move = await request(app).post(`/api/v1/deals/${id}/stage-transition`).set(auth(sales))
        .send({ to_stage: 'closed-won' });
      expect(move.status, JSON.stringify(move.body)).toBe(200);

      const hist = await pool.query('SELECT changed_by, to_stage FROM deal_stage_history WHERE deal_id = $1', [id]);
      expect(hist.rows.length).toBe(1);
      expect(hist.rows[0].to_stage).toBe('closed-won');
      // Attribution works even though authorisation does not.
      expect(hist.rows[0].changed_by).toBeTruthy();
    });

    it('a sales user can read every contact in the workspace, including ones they do not own', async () => {
      const mine = await request(app).post('/api/v1/contacts').set(auth(ws))
        .send({ first_name: 'Admin', last_name: 'Owned', email: `adminowned.${Date.now()}@example.com` });
      expect(mine.status).toBe(201);

      const asSales = await request(app).get(`/api/v1/contacts/${mine.body.data.id}`).set(auth(sales));
      expect(asSales.status).toBe(200);
      expect(asSales.body.data.first_name).toBe('Admin');
    });
  });
});
