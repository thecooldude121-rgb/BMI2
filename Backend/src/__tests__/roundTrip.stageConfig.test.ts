import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, addUserWithRole, TestWorkspace } from './helpers';

/**
 * Stage configuration — round trip.
 *
 * PIPELINE_STAGES_DESIGN.md §4 and §5. This is the slice that finally makes
 * stages configurable rather than merely per-tenant, so what it must get right
 * is: nobody but an admin can change them, a rename never moves the slug, a
 * pipeline can never be stripped of an outcome stage, and deleting a stage that
 * still holds deals either refuses or moves them — never silently orphans them.
 */
describe('Stage configuration — round trip', () => {
  let ws: TestWorkspace;
  let sales: TestWorkspace;
  let other: TestWorkspace;
  let pipelineId: string;

  const stagesOf = async (pid = pipelineId) => {
    const r = await pool.query(
      `SELECT id, slug, name, stage_type, position, color, archived_at
         FROM pipeline_stages WHERE pipeline_id = $1 ORDER BY position ASC`, [pid]);
    return r.rows;
  };

  beforeAll(async () => {
    ws = await setupWorkspace('stagecfg');
    sales = await addUserWithRole(ws, 'sales');
    other = await setupWorkspace('stagecfg-other');
    const p = await pool.query('SELECT id FROM pipelines WHERE tenant_id = $1', [ws.tenantId]);
    pipelineId = p.rows[0].id;
  });
  afterAll(async () => {
    await teardownWorkspace(ws);
    await teardownWorkspace(other);
  });

  /**
   * Reset to the six provisioned stages between tests.
   *
   * RE-CREATES deleted stages as well as un-archiving and un-renaming them:
   * these tests delete stages, and a reset that only tidied the survivors left
   * later tests running against a pipeline missing `proposal`. Caught by two
   * failures that looked like product bugs and were fixture bugs.
   */
  const CANON: Array<[string, string, string, number, string]> = [
    ['prospecting', 'Prospecting', 'open', 1, '#6B7280'],
    ['qualified',   'Qualified',   'open', 2, '#3B82F6'],
    ['proposal',    'Proposal',    'open', 3, '#F59E0B'],
    ['negotiation', 'Negotiation', 'open', 4, '#8B5CF6'],
    ['closed-won',  'Closed Won',  'won',  5, '#10B981'],
    ['closed-lost', 'Closed Lost', 'lost', 6, '#EF4444'],
  ];

  beforeEach(async () => {
    await pool.query('DELETE FROM deal_stage_history WHERE tenant_id = $1', [ws.tenantId]);
    await pool.query('DELETE FROM deals WHERE tenant_id = $1', [ws.tenantId]);
    await pool.query(
      `DELETE FROM pipeline_stages WHERE pipeline_id = $1 AND slug <> ALL($2::text[])`,
      [pipelineId, CANON.map(c => c[0])]);
    // Shift every surviving position out of the way FIRST. Each pool.query is
    // its own transaction, so the deferrable unique constraint defers only to
    // that statement's commit — restoring 1..6 one row at a time collides with
    // whatever the reorder test left behind. A uniform shift stays unique.
    await pool.query(
      'UPDATE pipeline_stages SET position = position + 1000 WHERE pipeline_id = $1', [pipelineId]);
    for (const [slug, name, type, pos, color] of CANON) {
      await pool.query(
        `INSERT INTO pipeline_stages
           (pipeline_id, tenant_id, slug, name, stage_type, position, color)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (tenant_id, pipeline_id, slug) DO UPDATE
           SET name = EXCLUDED.name, stage_type = EXCLUDED.stage_type,
               position = EXCLUDED.position, color = EXCLUDED.color,
               archived_at = NULL`,
        [pipelineId, ws.tenantId, slug, name, type, pos, color]);
    }
  });

  const base = () => `/api/v1/pipelines/${pipelineId}/stages`;

  // ── RBAC (design Q5) ───────────────────────────────────────────────────────

  it('a SALES user can READ stages but cannot change them', async () => {
    // Reads stay open deliberately: the Kanban cannot render without the stage
    // list, so gating reads would break the board for every sales user.
    const read = await request(app).get(base()).set(auth(sales));
    expect(read.status).toBe(200);
    expect(read.body.data.length).toBeGreaterThan(0);

    for (const call of [
      request(app).post(base()).set(auth(sales)).send({ name: 'Sneaky' }),
      request(app).put(`${base()}/order`).set(auth(sales)).send({ stage_ids: [] }),
      request(app).patch(`${base()}/x`).set(auth(sales)).send({ name: 'x' }),
      request(app).delete(`${base()}/x`).set(auth(sales)),
    ]) {
      const res = await call;
      expect(res.status).toBe(403);
    }
    expect((await stagesOf()).length).toBe(6);
  });

  it('another workspace cannot touch this pipeline, and is told 404 not 403', async () => {
    // 404 rather than 403: "not found" discloses nothing about whether the
    // pipeline exists elsewhere, the same stance as every other scoped read.
    const res = await request(app).post(base()).set(auth(other)).send({ name: 'Theirs' });
    expect(res.status).toBe(404);
    expect((await stagesOf()).length).toBe(6);
  });

  // ── create ─────────────────────────────────────────────────────────────────

  it('creates a stage, derives its slug, and appends it', async () => {
    const res = await request(app).post(base()).set(auth(ws))
      .send({ name: 'Legal Review', stage_type: 'open', probability: 70, color: '#8B5CF6' });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(res.body.data.slug).toBe('legal-review');
    expect(res.body.data.position).toBe(7);

    const rows = await stagesOf();
    expect(rows.map(r => r.slug)).toContain('legal-review');
  });

  it('inserts at a position and shifts the rest down', async () => {
    const res = await request(app).post(base()).set(auth(ws))
      .send({ name: 'Discovery', position: 2 });
    expect(res.status).toBe(201);

    const rows = await stagesOf();
    expect(rows.map(r => r.slug)).toEqual([
      'prospecting', 'discovery', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost',
    ]);
    // Contiguous — the deferrable unique constraint lets the shift happen
    // without intermediate collisions failing the statement.
    expect(rows.map(r => r.position)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('refuses a duplicate name in the same pipeline with a 409', async () => {
    const res = await request(app).post(base()).set(auth(ws)).send({ name: 'Qualified' });
    expect(res.status).toBe(409);
    expect((await stagesOf()).length).toBe(6);
  });

  it('refuses a name that slugifies to nothing', async () => {
    // The slug is derived once and immutable, so an empty key can never be
    // allowed to exist in the first place.
    const res = await request(app).post(base()).set(auth(ws)).send({ name: '!!!' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/at least one letter or number/);
  });

  // ── the fixed palette (design Q4) ──────────────────────────────────────────

  it('refuses a colour outside the palette', async () => {
    const res = await request(app).post(base()).set(auth(ws))
      .send({ name: 'Custom', color: '#123456' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/palette/);
  });

  it('refuses green or red on an OPEN stage, because those mean won and lost', async () => {
    // The design system's rule, enforced server-side rather than trusted to the
    // client: an admin picking green for an open stage does not see a rule being
    // broken, they see a colour they liked.
    for (const color of ['#10B981', '#EF4444']) {
      const res = await request(app).post(base()).set(auth(ws))
        .send({ name: `Tinted ${color}`, stage_type: 'open', color });
      expect(res.status, color).toBe(400);
      expect(res.body.message).toMatch(/reserved for won and lost/);
    }
  });

  it('ALLOWS green on a won stage and red on a lost one', async () => {
    const won = await request(app).post(base()).set(auth(ws))
      .send({ name: 'Also Won', stage_type: 'won', color: '#10B981' });
    expect(won.status, JSON.stringify(won.body)).toBe(201);
    const lost = await request(app).post(base()).set(auth(ws))
      .send({ name: 'Also Lost', stage_type: 'lost', color: '#EF4444' });
    expect(lost.status).toBe(201);
  });

  it('serves the palette so the UI cannot invent its own list', async () => {
    const res = await request(app).get('/api/v1/pipelines/palette').set(auth(ws));
    expect(res.status).toBe(200);
    expect(res.body.data.find((c: any) => c.hex === '#10B981').outcome_only).toBe(true);
    expect(res.body.data.find((c: any) => c.hex === '#3B82F6').outcome_only).toBe(false);
  });

  // ── rename, and the slug that must not move ────────────────────────────────

  it('RENAMING NEVER CHANGES THE SLUG, so deals and history keep resolving', async () => {
    const before = (await stagesOf()).find(s => s.slug === 'qualified')!;
    const res = await request(app).patch(`${base()}/${before.id}`).set(auth(ws))
      .send({ name: 'Sales Qualified' });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.data.name).toBe('Sales Qualified');
    expect(res.body.data.slug).toBe('qualified');

    const after = (await stagesOf()).find(s => s.id === before.id)!;
    expect(after.slug).toBe('qualified');
  });

  it('refuses an explicit attempt to set the slug, and says why', async () => {
    const s = (await stagesOf())[0];
    const res = await request(app).patch(`${base()}/${s.id}`).set(auth(ws))
      .send({ slug: 'something-else' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot be changed/i);
  });

  // ── the invariant: one open, one won, one lost ─────────────────────────────

  it('refuses to retire the pipeline\'s LAST won stage', async () => {
    const won = (await stagesOf()).find(s => s.stage_type === 'won')!;
    const res = await request(app).patch(`${base()}/${won.id}`).set(auth(ws)).send({ archived: true });
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/at least one won stage/);

    expect((await stagesOf()).find(s => s.id === won.id)!.archived_at).toBeNull();
  });

  it('refuses to RETYPE the last lost stage into an open one', async () => {
    // Same invariant reached by a different door — retyping strips an outcome
    // just as effectively as retiring, so it is checked the same way.
    const lost = (await stagesOf()).find(s => s.stage_type === 'lost')!;
    const res = await request(app).patch(`${base()}/${lost.id}`).set(auth(ws)).send({ stage_type: 'open' });
    expect(res.status).toBe(409);
    expect((await stagesOf()).find(s => s.id === lost.id)!.stage_type).toBe('lost');
  });

  it('ALLOWS retiring a won stage once a second one exists', async () => {
    await request(app).post(base()).set(auth(ws)).send({ name: 'Won Elsewhere', stage_type: 'won' });
    const won = (await stagesOf()).find(s => s.slug === 'closed-won')!;
    const res = await request(app).patch(`${base()}/${won.id}`).set(auth(ws)).send({ archived: true });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect((await stagesOf()).find(s => s.id === won.id)!.archived_at).not.toBeNull();
  });

  // ── reorder ────────────────────────────────────────────────────────────────

  it('reorders by taking the COMPLETE list and rewriting positions 1..N', async () => {
    const rows = await stagesOf();
    const reversed = [...rows].reverse().map(r => r.id);
    const res = await request(app).put(`${base()}/order`).set(auth(ws)).send({ stage_ids: reversed });
    expect(res.status, JSON.stringify(res.body)).toBe(200);

    const after = await stagesOf();
    expect(after.map(r => r.slug)).toEqual([...rows].reverse().map(r => r.slug));
    expect(after.map(r => r.position)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('refuses a PARTIAL order rather than silently dropping the rest', async () => {
    const rows = await stagesOf();
    const res = await request(app).put(`${base()}/order`).set(auth(ws))
      .send({ stage_ids: rows.slice(0, 3).map(r => r.id) });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/every stage in this pipeline exactly once/);
    // Untouched.
    expect((await stagesOf()).map(r => r.slug)).toEqual(rows.map(r => r.slug));
  });

  it('refuses a duplicated id, and an id from another pipeline', async () => {
    const rows = await stagesOf();
    const dupe = await request(app).put(`${base()}/order`).set(auth(ws))
      .send({ stage_ids: [rows[0].id, rows[0].id, ...rows.slice(2).map(r => r.id)] });
    expect(dupe.status).toBe(400);

    const foreign = await pool.query('SELECT id FROM pipeline_stages WHERE tenant_id = $1 LIMIT 1', [other.tenantId]);
    const alien = await request(app).put(`${base()}/order`).set(auth(ws))
      .send({ stage_ids: [...rows.slice(1).map(r => r.id), foreign.rows[0].id] });
    expect(alien.status).toBe(400);
  });

  // ── delete: the §4 decision ────────────────────────────────────────────────

  const dealInStage = async (slug: string) => {
    const res = await request(app).post('/api/v1/deals').set(auth(ws))
      .send({ name: `Cfg ${Date.now()}${Math.random()}`, value: 500, stage: slug });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    return res.body.data.id as string;
  };

  it('deletes an EMPTY stage and closes the position gap', async () => {
    await request(app).post(base()).set(auth(ws)).send({ name: 'Scratch' });
    const scratch = (await stagesOf()).find(s => s.slug === 'scratch')!;
    const res = await request(app).delete(`${base()}/${scratch.id}`).set(auth(ws));
    expect(res.status, JSON.stringify(res.body)).toBe(200);

    const after = await stagesOf();
    expect(after.map(r => r.slug)).not.toContain('scratch');
    expect(after.map(r => r.position)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('BLOCKS deleting a stage that still holds deals, and names the count', async () => {
    const dealId = await dealInStage('proposal');
    const proposal = (await stagesOf()).find(s => s.slug === 'proposal')!;

    const res = await request(app).delete(`${base()}/${proposal.id}`).set(auth(ws));
    expect(res.status).toBe(409);
    expect(res.body.deals_in_stage).toBe(1);
    expect(res.body.message).toMatch(/retire this stage instead/);

    // Nothing orphaned, nothing nulled — the whole point of blocking.
    const d = await pool.query(`SELECT ps.slug AS stage, d.stage_id FROM deals d LEFT JOIN pipeline_stages ps ON ps.id = d.stage_id AND ps.tenant_id = d.tenant_id WHERE d.id = $1`, [dealId]);
    expect(d.rows[0].stage).toBe('proposal');
    expect(d.rows[0].stage_id).toBe(proposal.id);
    expect((await stagesOf()).map(r => r.slug)).toContain('proposal');
  });

  it('reassign_to moves the deals, writes history for each, then deletes', async () => {
    const a = await dealInStage('proposal');
    const b = await dealInStage('proposal');
    const rows = await stagesOf();
    const proposal = rows.find(s => s.slug === 'proposal')!;
    const negotiation = rows.find(s => s.slug === 'negotiation')!;

    const res = await request(app)
      .delete(`${base()}/${proposal.id}?reassign_to=${negotiation.id}`).set(auth(ws));
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.deals_reassigned).toBe(2);

    for (const id of [a, b]) {
      const d = await pool.query(`SELECT ps.slug AS stage, d.stage_id FROM deals d LEFT JOIN pipeline_stages ps ON ps.id = d.stage_id AND ps.tenant_id = d.tenant_id WHERE d.id = $1`, [id]);
      expect(d.rows[0].stage).toBe('negotiation');
      expect(d.rows[0].stage_id).toBe(negotiation.id);
      // A stage deletion that silently relocated deals would be
      // indistinguishable from data loss when someone later asks why.
      const h = await pool.query(
        `SELECT from_stage, to_stage, reason_code FROM deal_stage_history WHERE deal_id = $1`, [id]);
      expect(h.rows[0]).toMatchObject({
        from_stage: 'proposal', to_stage: 'negotiation', reason_code: 'stage-deleted',
      });
    }
    expect((await stagesOf()).map(r => r.slug)).not.toContain('proposal');
  });

  it('reassign_to from another pipeline gets the settled 400 shape, and nothing moves', async () => {
    const dealId = await dealInStage('proposal');
    const proposal = (await stagesOf()).find(s => s.slug === 'proposal')!;
    const foreign = await pool.query('SELECT id FROM pipeline_stages WHERE tenant_id = $1 LIMIT 1', [other.tenantId]);

    const res = await request(app)
      .delete(`${base()}/${proposal.id}?reassign_to=${foreign.rows[0].id}`).set(auth(ws));
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('reassign_to does not name a stage in this pipeline');

    const d = await pool.query(`SELECT ps.slug AS stage FROM deals d LEFT JOIN pipeline_stages ps ON ps.id = d.stage_id AND ps.tenant_id = d.tenant_id WHERE d.id = $1`, [dealId]);
    expect(d.rows[0].stage).toBe('proposal');
  });

  it('RETIRING is the non-destructive path: the deals stay exactly where they are', async () => {
    const dealId = await dealInStage('proposal');
    const proposal = (await stagesOf()).find(s => s.slug === 'proposal')!;

    const res = await request(app).patch(`${base()}/${proposal.id}`).set(auth(ws)).send({ archived: true });
    expect(res.status, JSON.stringify(res.body)).toBe(200);

    const d = await pool.query(`SELECT ps.slug AS stage, d.stage_id FROM deals d LEFT JOIN pipeline_stages ps ON ps.id = d.stage_id AND ps.tenant_id = d.tenant_id WHERE d.id = $1`, [dealId]);
    expect(d.rows[0].stage).toBe('proposal');
    expect(d.rows[0].stage_id).toBe(proposal.id);

    // But nothing new may enter it. A DIFFERENT deal, deliberately: asking to
    // move a deal into the stage it is already in is a no-op that correctly
    // returns 200 before any retirement check, so testing with `dealId` would
    // have proved nothing.
    const elsewhere = await dealInStage('qualified');
    const move = await request(app).post(`/api/v1/deals/${elsewhere}/stage-transition`)
      .set(auth(ws)).send({ to_stage: 'proposal' });
    expect(move.status).toBe(409);
    expect(move.body.message).toMatch(/retired/i);

    const still = await pool.query(`SELECT ps.slug AS stage FROM deals d LEFT JOIN pipeline_stages ps ON ps.id = d.stage_id AND ps.tenant_id = d.tenant_id WHERE d.id = $1`, [elsewhere]);
    expect(still.rows[0].stage).toBe('qualified');
  });
});
