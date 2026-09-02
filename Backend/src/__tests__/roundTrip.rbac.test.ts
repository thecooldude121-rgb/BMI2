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
    for (const t of ['documents', 'activities', 'tasks', 'deals', 'contacts', 'companies', 'leads']) {
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
        .send({ email: `nope.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`, role: 'sales' });

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
          .send({ email: `esc1.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`, role: 'sales', user_role: 'admin' }),
        request(app).post('/api/v1/invites?role=admin').set(auth(sales))
          .send({ email: `esc2.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`, role: 'sales' }),
        request(app).post('/api/v1/invites').set({ ...auth(sales), 'X-Role': 'admin', 'X-User-Role': 'admin' })
          .send({ email: `esc3.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`, role: 'sales' }),
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

  // ── 3. The enforced policy: destructive actions require manager or admin ──

  /**
   * This block used to CHARACTERISE an unenforced state — `requireRole` was
   * applied to the three /invites routes and nowhere else, so a `sales` user
   * could delete any record. It was written to fail loudly the moment RBAC
   * landed, and it did; this is the rewrite against the real policy, not a
   * quiet deletion.
   *
   * The policy is deliberately narrow: DELETE and bulk actions require a
   * manager or admin; create, read and update stay open to every authenticated
   * role. See DESTRUCTIVE_ACTION_ROLES in middleware/auth.ts for why it is
   * narrow rather than a full matrix.
   */
  describe('destructive actions are gated to manager and admin', () => {
    /** Every route the policy covers, with a fixture that creates the row. */
    const destructive: [string, () => Promise<string>][] = [
      ['companies', async () => {
        const r = await request(app).post('/api/v1/companies').set(auth(ws)).send({ name: `RBAC Co ${Date.now()}` });
        expect(r.status, JSON.stringify(r.body)).toBe(201); return r.body.data.id;
      }],
      ['contacts', async () => {
        const r = await request(app).post('/api/v1/contacts').set(auth(ws))
          .send({ first_name: 'RBAC', last_name: 'Contact', email: `rbac.${Date.now()}.${Math.random()}@example.com` });
        expect(r.status, JSON.stringify(r.body)).toBe(201); return r.body.data.id;
      }],
      ['deals', async () => {
        const r = await request(app).post('/api/v1/deals').set(auth(ws)).send({ name: `RBAC Deal ${Date.now()}`, value: 100 });
        expect(r.status, JSON.stringify(r.body)).toBe(201); return r.body.data.id;
      }],
      ['tasks', async () => {
        const r = await request(app).post('/api/v1/tasks').set(auth(ws)).send({ title: 'RBAC task' });
        expect(r.status, JSON.stringify(r.body)).toBe(201); return r.body.data.id;
      }],
      ['documents', async () => {
        const r = await request(app).post('/api/v1/documents').set(auth(ws)).send({ name: `RBAC doc ${Date.now()}.pdf` });
        expect(r.status, JSON.stringify(r.body)).toBe(201); return r.body.data.id;
      }],
    ];

    it.each(destructive)('a sales user cannot DELETE a %s, and the row survives', async (entity, make) => {
      const id = await make();

      const res = await request(app).delete(`/api/v1/${entity}/${id}`).set(auth(sales));
      expect(res.status, JSON.stringify(res.body)).toBe(403);
      expect(res.body.message).toMatch(/Insufficient permissions/);
      expect(res.body.message).not.toMatch(/Internal Server Error/);

      // The refusal must be real, not just a status: the row is still there.
      const still = await pool.query(
        `SELECT COUNT(*)::int AS n FROM ${entity} WHERE id = $1 AND tenant_id = $2`, [id, ws.tenantId]);
      expect(still.rows[0].n, 'a 403 must not have deleted anything').toBe(1);
    });

    /**
     * THE NO-LOCKOUT CHECK, and the one that matters most in practice: live
     * workspaces contain `sales` and `manager` users and NO admin, so a policy
     * only an admin could satisfy would lock everyone out of deletion
     * entirely. Manager must be able to delete.
     */
    it.each(destructive)('a MANAGER can DELETE a %s — the policy locks nobody out', async (entity, make) => {
      const id = await make();

      const res = await request(app).delete(`/api/v1/${entity}/${id}`).set(auth(manager));
      expect(res.status, JSON.stringify(res.body)).toBe(200);

      const gone = await pool.query(`SELECT COUNT(*)::int AS n FROM ${entity} WHERE id = $1`, [id]);
      expect(gone.rows[0].n, 'the delete must actually have happened').toBe(0);
    });

    it('an activity delete is gated too, and the manager can still do it', async () => {
      const contact = await request(app).post('/api/v1/contacts').set(auth(ws))
        .send({ first_name: 'Act', last_name: 'Parent', email: `actparent.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com` });
      const mk = async () => {
        const r = await request(app).post('/api/v1/activities').set(auth(ws))
          .send({ subject: 'RBAC activity', type: 'note', contact_id: contact.body.data.id });
        expect(r.status, JSON.stringify(r.body)).toBe(201); return r.body.data.id;
      };

      const blockedId = await mk();
      const denied = await request(app).delete(`/api/v1/activities/${blockedId}`).set(auth(sales));
      expect(denied.status).toBe(403);
      const survived = await pool.query('SELECT COUNT(*)::int AS n FROM activities WHERE id = $1', [blockedId]);
      expect(survived.rows[0].n).toBe(1);

      const allowedId = await mk();
      const allowed = await request(app).delete(`/api/v1/activities/${allowedId}`).set(auth(manager));
      expect(allowed.status, JSON.stringify(allowed.body)).toBe(200);
    });

    it('BULK actions are gated for sales and permitted for a manager', async () => {
      const co = await request(app).post('/api/v1/contacts').set(auth(ws))
        .send({ first_name: 'Bulk', last_name: 'Target', email: `bulk.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com` });
      const id = co.body.data.id;

      const denied = await request(app).post('/api/v1/contacts/bulk').set(auth(sales))
        .send({ action: 'status', contact_ids: [id], payload: { status: 'inactive' } });
      expect(denied.status, JSON.stringify(denied.body)).toBe(403);
      // Nothing changed.
      const unchanged = await pool.query('SELECT status FROM contacts WHERE id = $1', [id]);
      expect(unchanged.rows[0].status).toBe('active');

      const allowed = await request(app).post('/api/v1/contacts/bulk').set(auth(manager))
        .send({ action: 'status', contact_ids: [id], payload: { status: 'inactive' } });
      expect(allowed.status, JSON.stringify(allowed.body)).toBe(200);
      const changed = await pool.query('SELECT status FROM contacts WHERE id = $1', [id]);
      expect(changed.rows[0].status).toBe('inactive');
    });

    it('the deals bulk endpoint is gated the same way', async () => {
      const deal = await request(app).post('/api/v1/deals').set(auth(ws))
        .send({ name: `Bulk Deal ${Date.now()}`, value: 500, stage: 'prospecting' });
      const id = deal.body.data.id;

      const denied = await request(app).post('/api/v1/deals/bulk').set(auth(sales))
        .send({ action: 'archive', deal_ids: [id] });
      expect(denied.status, JSON.stringify(denied.body)).toBe(403);
      expect(denied.body.message).toMatch(/Insufficient permissions/);
    });

    /**
     * WHAT THE POLICY DELIBERATELY DOES NOT GATE. These are not oversights and
     * each has a reason; they are pinned so that narrowing the policy further
     * becomes a visible decision rather than a silent drift.
     */
    it('create and update stay open to a sales user — the policy gates destruction, not work', async () => {
      const create = await request(app).post('/api/v1/companies').set(auth(sales))
        .send({ name: `Sales Made This ${Date.now()}` });
      expect(create.status, JSON.stringify(create.body)).toBe(201);

      const edit = await request(app).put(`/api/v1/companies/${create.body.data.id}`).set(auth(sales))
        .send({ industry: 'Technology' });
      expect(edit.status).toBe(200);
      const row = await pool.query('SELECT industry FROM companies WHERE id = $1', [create.body.data.id]);
      expect(row.rows[0].industry).toBe('Technology');
    });

    it('a sales user can still move a deal stage — a stage change is not a destructive action', async () => {
      const deal = await request(app).post('/api/v1/deals').set(auth(sales))
        .send({ name: `Sales Deal ${Date.now()}`, value: 1000, stage: 'prospecting' });
      expect(deal.status, JSON.stringify(deal.body)).toBe(201);

      const move = await request(app).post(`/api/v1/deals/${deal.body.data.id}/stage-transition`).set(auth(sales))
        .send({ to_stage: 'closed-won' });
      expect(move.status, JSON.stringify(move.body)).toBe(200);

      const hist = await pool.query('SELECT changed_by FROM deal_stage_history WHERE deal_id = $1', [deal.body.data.id]);
      expect(hist.rows.length).toBe(1);
      expect(hist.rows[0].changed_by).toBeTruthy();
    });

    /**
     * ROW-LEVEL SCOPING IS NOT IMPLEMENTED, and this test says so out loud
     * rather than leaving it to be discovered. A `sales` user reads every
     * record in the workspace, including ones they do not own. The frontend
     * leads model distinguishes `leads.view_all` from `leads.view_own`; the API
     * does not, because doing so changes read behaviour on every list endpoint
     * and needs an owner_id backfill decision first.
     *
     * If ownership scoping is implemented, THIS TEST FAILS — rewrite it against
     * the new behaviour, as this block itself was rewritten.
     */
    it('a sales user still reads records they do not own — ownership scoping is deferred, not done', async () => {
      const mine = await request(app).post('/api/v1/contacts').set(auth(ws))
        .send({ first_name: 'Admin', last_name: 'Owned', email: `adminowned.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com` });
      expect(mine.status).toBe(201);

      const asSales = await request(app).get(`/api/v1/contacts/${mine.body.data.id}`).set(auth(sales));
      expect(asSales.status).toBe(200);
      expect(asSales.body.data.first_name).toBe('Admin');
    });

    /**
     * Also deliberately ungated, and for a different reason: a note is content
     * the user authored (and its delete is a soft delete), and a saved view is
     * personal UI configuration. Gating those to manager+ would stop an SDR
     * retracting their own note or removing their own filter.
     *
     * NOTE, separate finding: neither route checks OWNERSHIP either, so any
     * workspace member can delete another's note or view. That is a missing
     * ownership predicate, not a missing role check, and is reported rather
     * than fixed here.
     */
    it('deleting a lead note is not gated by role — it is authored content, not a record', async () => {
      const lead = await request(app).post('/api/v1/leads').set(auth(ws))
        .send({ first_name: 'Note', last_name: 'Owner', email: `noteowner.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com` });
      expect(lead.status, JSON.stringify(lead.body)).toBe(201);

      const note = await request(app).post(`/api/v1/leads/${lead.body.data.id}/notes`).set(auth(sales))
        .send({ content: 'A note by the sales user' });
      expect(note.status, JSON.stringify(note.body)).toBe(201);

      const del = await request(app)
        .delete(`/api/v1/leads/${lead.body.data.id}/notes/${note.body.data.id}`).set(auth(sales));
      expect(del.status, JSON.stringify(del.body)).toBe(200);
    });
  });
});
