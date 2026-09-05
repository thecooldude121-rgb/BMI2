import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';
import { findStage } from '../utils/pipelineStages';

/**
 * Configurable pipeline stages — Phase A round trip.
 *
 * PIPELINE_STAGES_DESIGN.md, migration 037. Phase A makes `deals.stage_id` a
 * real, workspace-scoped foreign key and keeps it in step with the `stage` text
 * column that is still authoritative for reads. What this suite proves:
 *
 *   - Every write path populates stage_id, and the two columns never disagree.
 *   - A stage that is not this workspace's is a clean 400, never a masked 500
 *     and never a silent write.
 *   - The default stage comes from the deal's OWN pipeline, which is a real bug
 *     fix and not just constraint satisfaction.
 *   - Retirement stops new arrivals without touching the deals already there.
 *
 * Reads go to Postgres, not to the response body: a 200 says the request
 * succeeded, and only a row says the right thing was stored.
 */
describe('Pipeline stages — Phase A round trip', () => {
  let ws: TestWorkspace;
  let other: TestWorkspace;
  /** A second pipeline, so "the deal's own pipeline" is a real distinction. */
  let renewalsId: string;

  beforeAll(async () => {
    ws = await setupWorkspace('pipestage');
    other = await setupWorkspace('pipestage-other');

    // setupWorkspace provisions only the default pipeline. A second one with a
    // DIFFERENT stage vocabulary is what makes the per-pipeline resolution
    // testable at all — with one pipeline every bug here looks like correct
    // behaviour.
    const p = await pool.query(
      `INSERT INTO pipelines (name, slug, description, is_default, is_active, tenant_id)
       VALUES ('Renewals','renewals','Renewals',false,true,$1) RETURNING id`,
      [ws.tenantId],
    );
    renewalsId = p.rows[0].id;
    await pool.query(
      `INSERT INTO pipeline_stages
         (pipeline_id, tenant_id, slug, name, stage_type, probability, color, position, is_won, is_lost)
       VALUES
         ($1,$2,'renewal-review','Under Review','open',60,'#3B82F6',1,false,false),
         ($1,$2,'renewal-won','Renewed','won',100,'#10B981',2,true,false),
         ($1,$2,'renewal-lost','Churned','lost',0,'#EF4444',3,false,true)`,
      [renewalsId, ws.tenantId],
    );
  });

  afterAll(async () => {
    await teardownWorkspace(ws);
    await teardownWorkspace(other);
  });

  /** The stored row, never the response body. */
  const row = async (id: string) => {
    const r = await pool.query(
      `SELECT d.stage, d.stage_id, d.probability, s.slug AS stage_slug, s.tenant_id AS stage_tenant
         FROM deals d LEFT JOIN pipeline_stages s ON s.id = d.stage_id
        WHERE d.id = $1`,
      [id],
    );
    return r.rows[0];
  };

  const createDeal = (w: TestWorkspace, body: Record<string, unknown>) =>
    request(app).post('/api/v1/deals').set(auth(w))
      .send({ name: `Stage Test ${Date.now()}${Math.random()}`, value: 1000, ...body });

  // ── The backfill's end state ───────────────────────────────────────────────

  it('every deal in the database points at a stage in its OWN workspace', async () => {
    // The assertion migration 037 makes about itself, re-checked here against
    // whatever the suite has since created. pipeline_stages.id is a global
    // primary key with no tenant component, so Postgres would happily accept a
    // deal in workspace A pointing at a stage in workspace B — referential
    // integrity satisfied, tenant isolation not.
    const bad = await pool.query(
      `SELECT count(*)::int AS n FROM deals d
         JOIN pipeline_stages s ON s.id = d.stage_id
        WHERE s.tenant_id <> d.tenant_id`,
    );
    expect(bad.rows[0].n).toBe(0);

    const nullish = await pool.query('SELECT count(*)::int AS n FROM deals WHERE stage_id IS NULL');
    expect(nullish.rows[0].n).toBe(0);
  });

  it('the stage text column and stage_id never disagree', async () => {
    const mismatched = await pool.query(
      `SELECT count(*)::int AS n FROM deals d
         JOIN pipeline_stages s ON s.id = d.stage_id
        WHERE s.slug <> d.stage`,
    );
    expect(mismatched.rows[0].n).toBe(0);
  });

  // ── createDeal ─────────────────────────────────────────────────────────────

  it('create: a named stage resolves to a real row, and both columns agree', async () => {
    const res = await createDeal(ws, { stage: 'qualified' });
    expect(res.status, JSON.stringify(res.body)).toBe(201);

    const stored = await row(res.body.data.id);
    expect(stored.stage).toBe('qualified');
    expect(stored.stage_slug).toBe('qualified');
    expect(stored.stage_id).toBeTruthy();
    expect(stored.stage_tenant).toBe(ws.tenantId);
  });

  it('create: an omitted stage takes the first OPEN stage of the deal\'s own pipeline', async () => {
    // THE LATENT BUG THIS FIXES. createDeal defaulted pipeline_id and stage
    // INDEPENDENTLY — `pipeline_id || 'new-business'` and `stage ||
    // 'prospecting'` — so a renewals deal with no stage was written into
    // 'prospecting', a stage that does not exist in the renewals pipeline at
    // all. Unreachable from the Add Deal form, which always sends a stage, but
    // the API is not the form.
    const res = await createDeal(ws, { pipeline_id: 'renewals', pipeline_name: 'Renewals' });
    expect(res.status, JSON.stringify(res.body)).toBe(201);

    const stored = await row(res.body.data.id);
    expect(stored.stage).toBe('renewal-review');      // NOT 'prospecting'
    expect(stored.stage_slug).toBe('renewal-review');

    // And it really is a stage of that pipeline, not a same-named coincidence.
    const s = await pool.query('SELECT pipeline_id FROM pipeline_stages WHERE id = $1', [stored.stage_id]);
    expect(s.rows[0].pipeline_id).toBe(renewalsId);
  });

  it('create: a stage from ANOTHER pipeline in the same workspace is refused', async () => {
    // 'qualified' exists — just not in renewals. Being real somewhere is not
    // being valid here.
    const res = await createDeal(ws, { pipeline_id: 'renewals', stage: 'qualified' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/does not name a stage in this workspace/);
  });

  it('create: an unknown stage is a clean 400 that names the field, not a 500', async () => {
    const res = await createDeal(ws, { stage: 'not-a-real-stage' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/^stage does not name a stage in this workspace$/);
    // The message discloses nothing about other workspaces, for the same reason
    // login returns one message for a bad password and an unknown email.
    expect(res.body.message).not.toMatch(/workspace [A-Za-z0-9-]+/);
  });

  it('create: another workspace\'s stage id cannot be smuggled in through the stage field', async () => {
    const theirs = await findStage(other.tenantId, 'new-business', 'qualified');
    expect(theirs).toBeTruthy();
    // Naming it by slug resolves within the CALLER's workspace, so this creates
    // the caller's own 'qualified' deal rather than reaching across.
    const res = await createDeal(ws, { stage: 'qualified' });
    expect(res.status).toBe(201);
    const stored = await row(res.body.data.id);
    expect(stored.stage_id).not.toBe(theirs!.id);
    expect(stored.stage_tenant).toBe(ws.tenantId);
  });

  // ── updateDeal ─────────────────────────────────────────────────────────────

  it('update: changing stage moves stage_id with it', async () => {
    const created = await createDeal(ws, { stage: 'prospecting' });
    const id = created.body.data.id;

    const res = await request(app).put(`/api/v1/deals/${id}`).set(auth(ws)).send({ stage: 'proposal' });
    expect(res.status, JSON.stringify(res.body)).toBe(200);

    const stored = await row(id);
    expect(stored.stage).toBe('proposal');
    expect(stored.stage_slug).toBe('proposal');
  });

  it('update: an unknown stage is refused and the stored row does not move', async () => {
    const created = await createDeal(ws, { stage: 'prospecting' });
    const id = created.body.data.id;

    const res = await request(app).put(`/api/v1/deals/${id}`).set(auth(ws)).send({ stage: 'invented' });
    expect(res.status).toBe(400);

    // This generic update loop used to write ANY string to `stage` with no
    // validation whatsoever, which is how deals reached stages no configuration
    // listed. Confirm the refusal actually left the row alone.
    const stored = await row(id);
    expect(stored.stage).toBe('prospecting');
  });

  it('update: an omitted stage leaves both columns untouched', async () => {
    const created = await createDeal(ws, { stage: 'negotiation' });
    const id = created.body.data.id;
    const before = await row(id);

    const res = await request(app).put(`/api/v1/deals/${id}`).set(auth(ws)).send({ name: 'Renamed only' });
    expect(res.status).toBe(200);

    const after = await row(id);
    expect(after.stage).toBe(before.stage);
    expect(after.stage_id).toBe(before.stage_id);
  });

  // ── stage-transition ───────────────────────────────────────────────────────

  it('transition: sets stage_id, takes the stage\'s probability, and records history', async () => {
    const created = await createDeal(ws, { stage: 'prospecting' });
    const id = created.body.data.id;

    const res = await request(app).post(`/api/v1/deals/${id}/stage-transition`)
      .set(auth(ws)).send({ to_stage: 'closed-won' });
    expect(res.status, JSON.stringify(res.body)).toBe(200);

    const stored = await row(id);
    expect(stored.stage).toBe('closed-won');
    expect(stored.stage_slug).toBe('closed-won');
    // 100 comes from the stage row. The old code matched pipeline_stages by
    // lower(replace(name,' ','-')) and silently found nothing for any stage
    // whose row did not exist, keeping the previous probability instead.
    expect(stored.probability).toBe(100);

    const hist = await pool.query(
      'SELECT from_stage, to_stage FROM deal_stage_history WHERE deal_id = $1 ORDER BY changed_at DESC LIMIT 1',
      [id],
    );
    expect(hist.rows[0]).toMatchObject({ from_stage: 'prospecting', to_stage: 'closed-won' });
  });

  it('transition: an unknown to_stage is a 400 and the deal does not move', async () => {
    const created = await createDeal(ws, { stage: 'prospecting' });
    const id = created.body.data.id;

    const res = await request(app).post(`/api/v1/deals/${id}/stage-transition`)
      .set(auth(ws)).send({ to_stage: 'wishful-thinking' });
    expect(res.status).toBe(400);

    expect((await row(id)).stage).toBe('prospecting');
    const hist = await pool.query('SELECT count(*)::int AS n FROM deal_stage_history WHERE deal_id = $1', [id]);
    expect(hist.rows[0].n).toBe(0);
  });

  it('transition: a stage from another pipeline is refused even though it exists', async () => {
    const created = await createDeal(ws, { stage: 'prospecting' });
    const id = created.body.data.id;

    const res = await request(app).post(`/api/v1/deals/${id}/stage-transition`)
      .set(auth(ws)).send({ to_stage: 'renewal-won' });
    expect(res.status).toBe(400);
    expect((await row(id)).stage).toBe('prospecting');
  });

  // ── retirement ─────────────────────────────────────────────────────────────

  it('retirement: deals already in a retired stage STAY there, and nothing new may enter', async () => {
    // The whole point of retire-versus-delete: retiring never orphans a deal
    // and never nulls a reference. It stops arrivals, not residents.
    const resident = await createDeal(ws, { stage: 'proposal' });
    const residentId = resident.body.data.id;
    const mover = await createDeal(ws, { stage: 'prospecting' });
    const moverId = mover.body.data.id;

    await pool.query(
      `UPDATE pipeline_stages SET archived_at = NOW()
        WHERE tenant_id = $1 AND slug = 'proposal'`,
      [ws.tenantId],
    );
    try {
      // The resident is untouched — still in the stage, still pointing at it.
      const stored = await row(residentId);
      expect(stored.stage).toBe('proposal');
      expect(stored.stage_id).toBeTruthy();

      // Nothing may move in.
      const res = await request(app).post(`/api/v1/deals/${moverId}/stage-transition`)
        .set(auth(ws)).send({ to_stage: 'proposal' });
      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/retired/i);
      expect((await row(moverId)).stage).toBe('prospecting');

      // And a new deal does not silently land there as a default either.
      const fresh = await createDeal(ws, {});
      expect(fresh.status).toBe(201);
      expect((await row(fresh.body.data.id)).stage).toBe('prospecting');
    } finally {
      await pool.query(
        `UPDATE pipeline_stages SET archived_at = NULL WHERE tenant_id = $1 AND slug = 'proposal'`,
        [ws.tenantId],
      );
    }
  });

  // ── bulk ───────────────────────────────────────────────────────────────────

  it('bulk: a selection spanning two pipelines moves only the deals that can move, and says so', async () => {
    // One slug cannot be resolved once for a whole batch: 'qualified' exists in
    // new-business and not in renewals. Resolving globally would either move a
    // renewals deal into another pipeline's stage or fail the batch over one
    // deal — so each is resolved against its own pipeline and the rest are
    // reported rather than silently skipped.
    const inNewBusiness = await createDeal(ws, { stage: 'prospecting' });
    const inRenewals = await createDeal(ws, { pipeline_id: 'renewals', stage: 'renewal-review' });
    const ids = [inNewBusiness.body.data.id, inRenewals.body.data.id];

    const res = await request(app).post('/api/v1/deals/bulk').set(auth(ws))
      .send({ action: 'stage', deal_ids: ids, payload: { stage: 'qualified' } });
    expect(res.status, JSON.stringify(res.body)).toBe(200);

    expect(res.body.affected).toBe(1);
    expect(res.body.stage_not_in_pipeline).toEqual([inRenewals.body.data.id]);
    expect(res.body.message).toMatch(/no such stage/);

    expect((await row(ids[0])).stage).toBe('qualified');
    // Untouched, not moved into a stage of a pipeline it does not belong to.
    expect((await row(ids[1])).stage).toBe('renewal-review');
  });

  it('bulk: when NO selected deal can take the stage, it is a 400 rather than "0 updated"', async () => {
    const a = await createDeal(ws, { pipeline_id: 'renewals', stage: 'renewal-review' });
    const res = await request(app).post('/api/v1/deals/bulk').set(auth(ws))
      .send({ action: 'stage', deal_ids: [a.body.data.id], payload: { stage: 'qualified' } });

    // Every deal failing for the same reason is a mistake in the request, not a
    // partial success worth a 200.
    expect(res.status).toBe(400);
    expect((await row(a.body.data.id)).stage).toBe('renewal-review');
  });

  it('bulk: stage_id follows on every moved deal', async () => {
    const a = await createDeal(ws, { stage: 'prospecting' });
    const b = await createDeal(ws, { stage: 'prospecting' });
    const ids = [a.body.data.id, b.body.data.id];

    const res = await request(app).post('/api/v1/deals/bulk').set(auth(ws))
      .send({ action: 'stage', deal_ids: ids, payload: { stage: 'negotiation' } });
    expect(res.status).toBe(200);
    expect(res.body.affected).toBe(2);

    for (const id of ids) {
      const stored = await row(id);
      expect(stored.stage).toBe('negotiation');
      expect(stored.stage_slug).toBe('negotiation');
      expect(stored.stage_tenant).toBe(ws.tenantId);
    }
  });

  // ── provisioning ───────────────────────────────────────────────────────────

  it('a workspace is born able to hold a deal', async () => {
    // Found by the suite rather than the design: stage_id is NOT NULL and
    // resolves against the workspace's own configuration, so a workspace with no
    // pipeline could not create a single deal. Thirty tests failed on it. Real
    // workspace creation must call provisionDefaultPipeline for the same reason.
    const fresh = await setupWorkspace('pipestage-fresh');
    try {
      const res = await createDeal(fresh, {});
      expect(res.status, JSON.stringify(res.body)).toBe(201);

      const stored = await row(res.body.data.id);
      expect(stored.stage).toBe('prospecting');
      expect(stored.stage_tenant).toBe(fresh.tenantId);

      // And it has an outcome stage, so its deals can actually be closed.
      const outcomes = await pool.query(
        `SELECT count(*) FILTER (WHERE stage_type = 'won')::int  AS won,
                count(*) FILTER (WHERE stage_type = 'lost')::int AS lost
           FROM pipeline_stages WHERE tenant_id = $1`,
        [fresh.tenantId],
      );
      expect(outcomes.rows[0]).toMatchObject({ won: 1, lost: 1 });
    } finally {
      await teardownWorkspace(fresh);
    }
  });
});
