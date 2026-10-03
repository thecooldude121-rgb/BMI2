import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';

/**
 * Round-trip regression suite — Leads, including conversion.
 *
 * CONVERSION SCOPE NOTE (read before extending this file): as of this suite,
 * there is no POST /leads/:id/convert route (see Backend/src/routes/leads.ts)
 * and the `leads` table has no converted_at / converted_to_contact_id /
 * converted_to_deal_id / account_id columns (checked directly against every
 * migration file — none add them). HANDOFF.md documents this as a Phase-1 item
 * that was narrowed to "fail honestly" rather than built: the old wizard faked
 * success by minting client-side ids and never wrote anything. Per an explicit
 * decision on this suite, the tests below assert the CURRENT honest-failure
 * shape (the route does not exist; changing a lead's stage to 'converted'
 * changes only that lead's own row and creates no linked records) rather than
 * testing a conversion feature that has not been built yet.
 *
 * STEP 5 (2026-10-03): a lead's stage is no longer editable through PUT —
 * every move goes through POST /leads/:id/stage-transition (pinned in
 * roundTrip.leadTransitions.test.ts). The stage tests below now use it, and the
 * conversion tests assert the NEW honest failure: PUT refuses the stage change
 * outright, and the transition endpoint refuses 'converted'.
 *
 * SLICE B (2026-10-03) BUILT REAL CONVERSION: POST /leads/:id/convert creates
 * the contact / company / deal in one transaction. It is pinned in
 * roundTrip.leadConversion.test.ts; the tests below now only assert that the
 * OLD routes to "converted" (PUT, a stage move) stay closed.
 */
describe('Leads — round trip', () => {
  let ws: TestWorkspace;
  const leadIds: number[] = [];

  beforeAll(async () => { ws = await setupWorkspace('leads'); });

  afterAll(async () => {
    if (leadIds.length) {
      await pool.query('DELETE FROM leads WHERE id = ANY($1::int[])', [leadIds]);
      const after = await pool.query('SELECT COUNT(*)::int AS n FROM leads WHERE id = ANY($1::int[])', [leadIds]);
      if (after.rows[0].n !== 0) throw new Error(`Cleanup failed: ${after.rows[0].n} test leads remain`);
    }
    await teardownWorkspace(ws);
  });

  it('create: a real POST creates a lead Postgres actually holds', async () => {
    const email = `lead.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;
    const res = await request(app).post('/api/v1/leads').set(auth(ws)).send({
      first_name: 'Neha', last_name: 'Sharma', email, company: 'Contoso', stage: 'new',
    });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    const id = res.body.data.id;
    leadIds.push(id);

    const row = await pool.query('SELECT first_name, last_name, email, company, stage FROM leads WHERE id = $1 AND tenant_id = $2', [id, ws.tenantId]);
    expect(row.rows[0].first_name).toBe('Neha');
    expect(row.rows[0].email).toBe(email);
    expect(row.rows[0].company).toBe('Contoso');
    expect(row.rows[0].stage).toBe('new');
  });

  it('negative: missing email is rejected (leads.email is NOT NULL), nothing created', async () => {
    const before = await pool.query('SELECT COUNT(*)::int AS n FROM leads WHERE tenant_id = $1', [ws.tenantId]);
    const res = await request(app).post('/api/v1/leads').set(auth(ws)).send({ first_name: 'No Email' });
    expect(res.status).toBe(400);
    const after = await pool.query('SELECT COUNT(*)::int AS n FROM leads WHERE tenant_id = $1', [ws.tenantId]);
    expect(after.rows[0].n).toBe(before.rows[0].n);
  });

  /**
   * The stage/status vocabulary was expanded this session (migration 025).
   * These specific values were previously rejected by the CHECK constraint —
   * test exactly the ones HANDOFF.md names as newly valid.
   */
  // sales_accepted is gated by the qualification criteria since step 5, so it
  // lives in roundTrip.leadTransitions.test.ts rather than here.
  it.each([
    'assigned', 'enriching', 'attempting_contact', 'engaged',
    'nurture', 'disqualified',
  ])('create+transition: previously-rejected stage "%s" is accepted and persists', async (stage) => {
    const create = await request(app).post('/api/v1/leads').set(auth(ws)).send({
      first_name: 'Stage', last_name: 'Test', email: `stage-${stage}-${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`,
    });
    const id = create.body.data.id;
    leadIds.push(id);

    const res = await request(app).post(`/api/v1/leads/${id}/stage-transition`).set(auth(ws)).send({ to_stage: stage });
    expect(res.status, `${stage}: ${JSON.stringify(res.body)}`).toBe(200);
    const row = await pool.query('SELECT stage FROM leads WHERE id = $1', [id]);
    expect(row.rows[0].stage).toBe(stage);
  });

  it('negative: an invalid stage is still rejected, row unchanged', async () => {
    const create = await request(app).post('/api/v1/leads').set(auth(ws)).send({
      first_name: 'Invalid', last_name: 'Stage', email: `invalid-stage-${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`, stage: 'new',
    });
    const id = create.body.data.id;
    leadIds.push(id);

    const res = await request(app).post(`/api/v1/leads/${id}/stage-transition`).set(auth(ws)).send({ to_stage: 'made-up-stage' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/to_stage must be one of/);
    const row = await pool.query('SELECT stage FROM leads WHERE id = $1', [id]);
    expect(row.rows[0].stage).toBe('new');
  });

  describe('conversion — the old routes to "converted" stay closed (see file header)', () => {
    it('the conversion endpoint now EXISTS, and refuses an unqualified lead with nothing created', async () => {
      const create = await request(app).post('/api/v1/leads').set(auth(ws)).send({
        first_name: 'Convert', last_name: 'Me', email: `convert-${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`,
      });
      const id = create.body.data.id;
      leadIds.push(id);

      const res = await request(app).post(`/api/v1/leads/${id}/convert`).set(auth(ws)).send({});
      // Was a 404 (no route). Now: the route exists and a 'new' lead is refused.
      expect(res.status).toBe(409);
      expect(res.body.code).toBe('LEAD_NOT_QUALIFIED');
    });

    it('"converted" cannot be reached by PUT or by a stage move — and nothing is fabricated', async () => {
      const create = await request(app).post('/api/v1/leads').set(auth(ws)).send({
        first_name: 'ToConvert', last_name: 'Lead', email: `toconvert-${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`, company: 'Contoso',
      });
      const id = create.body.data.id;
      leadIds.push(id);

      const beforeContacts = await pool.query('SELECT COUNT(*)::int AS n FROM contacts WHERE tenant_id = $1', [ws.tenantId]);
      const beforeCompanies = await pool.query('SELECT COUNT(*)::int AS n FROM companies WHERE tenant_id = $1', [ws.tenantId]);
      const beforeDeals = await pool.query('SELECT COUNT(*)::int AS n FROM deals WHERE tenant_id = $1', [ws.tenantId]);

      const put = await request(app).put(`/api/v1/leads/${id}`).set(auth(ws)).send({ stage: 'converted' });
      expect(put.status, JSON.stringify(put.body)).toBe(400);
      expect(put.body.code).toBe('STAGE_NOT_EDITABLE');

      const move = await request(app).post(`/api/v1/leads/${id}/stage-transition`).set(auth(ws)).send({ to_stage: 'converted' });
      expect(move.status, JSON.stringify(move.body)).toBe(409);
      expect(move.body.code).toBe('USE_CONVERSION');

      const row = await pool.query('SELECT stage FROM leads WHERE id = $1', [id]);
      expect(row.rows[0].stage).toBe('new');

      // Nothing else got created. When slice B builds real conversion, replace
      // this block per the TODO at the top of the file.
      const afterContacts = await pool.query('SELECT COUNT(*)::int AS n FROM contacts WHERE tenant_id = $1', [ws.tenantId]);
      const afterCompanies = await pool.query('SELECT COUNT(*)::int AS n FROM companies WHERE tenant_id = $1', [ws.tenantId]);
      const afterDeals = await pool.query('SELECT COUNT(*)::int AS n FROM deals WHERE tenant_id = $1', [ws.tenantId]);
      expect(afterContacts.rows[0].n).toBe(beforeContacts.rows[0].n);
      expect(afterCompanies.rows[0].n).toBe(beforeCompanies.rows[0].n);
      expect(afterDeals.rows[0].n).toBe(beforeDeals.rows[0].n);
    });
  });

  /**
   * THE REAL FORM'S PAYLOAD, not a hand-written one (recorded lesson 1).
   *
   * CORRECTED 2026-10-03. This test used to send `status: 'converted'` and
   * assert a 400 "status must be one of" — and concluded the real Convert
   * button "cannot succeed today". That payload is not what the browser sends:
   * Frontend/src/utils/leadsApi.ts updateLeadViaAPI RENAMES `status` to `stage`
   * before the PUT. The real request was `{ stage: 'converted', converted_at,
   * converted_to_contact_id, converted_to_deal_id, account_id }`, which the
   * server ACCEPTED with 200 — so the wizard showed "New records created
   * successfully" over a lead whose only change was its stage. The test passed
   * over exactly the bug it existed to catch, because it tested a hand-built
   * payload (lesson 1, again).
   *
   * Now the wire payload is what is sent, and step 5's rule refuses it: a
   * stage change through PUT is a 400, so the wizard cannot fake success. When
   * slice B builds real conversion, replace this with a positive round trip.
   */
  it('the real wizard payload (status renamed to stage by leadsApi) is refused, and fabricates nothing', async () => {
    const create = await request(app).post('/api/v1/leads').set(auth(ws)).send({
      first_name: 'Wizard', last_name: 'Payload',
      email: `wizard-${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`, company: 'Contoso',
    });
    expect(create.status, JSON.stringify(create.body)).toBe(201);
    const id = create.body.data.id;
    leadIds.push(id);
    // Qualify it the real way: a logged call records last contact, then move.
    await request(app).post(`/api/v1/leads/${id}/calls`).set(auth(ws)).send({ outcome: 'connected' });
    const q = await request(app).post(`/api/v1/leads/${id}/stage-transition`).set(auth(ws)).send({ to_stage: 'qualified' });
    expect(q.status, JSON.stringify(q.body)).toBe(200);

    const beforeContacts = await pool.query('SELECT COUNT(*)::int AS n FROM contacts WHERE tenant_id = $1', [ws.tenantId]);
    const beforeCompanies = await pool.query('SELECT COUNT(*)::int AS n FROM companies WHERE tenant_id = $1', [ws.tenantId]);
    const beforeDeals = await pool.query('SELECT COUNT(*)::int AS n FROM deals WHERE tenant_id = $1', [ws.tenantId]);

    const ts = Date.now();
    // Byte-for-byte what updateLeadViaAPI puts on the wire.
    const res = await request(app).put(`/api/v1/leads/${id}`).set(auth(ws)).send({
      stage: 'converted',
      converted_at: new Date().toISOString(),
      converted_to_contact_id: `cnt_${ts}`,
      converted_to_deal_id: `deal_${ts}`,
      account_id: `acc_${ts}`,
    });

    // Rejected, and with the actual server-side reason rather than a generic
    // fallback or a swallowed null.
    expect(res.status, JSON.stringify(res.body)).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('STAGE_NOT_EDITABLE');
    expect(res.body.message).not.toMatch(/Internal Server Error/);

    // The lead's own row is untouched — a rejected write must not half-apply.
    const row = await pool.query('SELECT stage, status FROM leads WHERE id = $1', [id]);
    expect(row.rows[0].stage).toBe('qualified');
    expect(row.rows[0].status).not.toBe('converted');

    // And nothing was fabricated on the way through.
    const afterContacts = await pool.query('SELECT COUNT(*)::int AS n FROM contacts WHERE tenant_id = $1', [ws.tenantId]);
    const afterCompanies = await pool.query('SELECT COUNT(*)::int AS n FROM companies WHERE tenant_id = $1', [ws.tenantId]);
    const afterDeals = await pool.query('SELECT COUNT(*)::int AS n FROM deals WHERE tenant_id = $1', [ws.tenantId]);
    expect(afterContacts.rows[0].n).toBe(beforeContacts.rows[0].n);
    expect(afterCompanies.rows[0].n).toBe(beforeCompanies.rows[0].n);
    expect(afterDeals.rows[0].n).toBe(beforeDeals.rows[0].n);

    // The stub ids the wizard minted must exist nowhere in Postgres.
    const stubContact = await pool.query('SELECT COUNT(*)::int AS n FROM contacts WHERE id = $1', [`cnt_${ts}`]);
    const stubDeal = await pool.query('SELECT COUNT(*)::int AS n FROM deals WHERE id = $1', [`deal_${ts}`]);
    expect(stubContact.rows[0].n).toBe(0);
    expect(stubDeal.rows[0].n).toBe(0);
  });

  /**
   * CREATE-VS-UPDATE ASYMMETRY: createLead rejects a blank first_name or email
   * (leads.email is NOT NULL), updateLead enforced neither, so an explicit
   * null reached the column as a masked 500.
   */
  it.each([
    ['first_name', null], ['first_name', ''],
    ['email', null],      ['email', '   '],
  ])('negative: blanking %s on update is rejected, row unchanged', async (field, bad) => {
    const create = await request(app).post('/api/v1/leads').set(auth(ws))
      .send({ first_name: 'Keep', last_name: 'Lead', email: `keeplead.${field}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com` });
    expect(create.status, JSON.stringify(create.body)).toBe(201);
    const id = create.body.data.id;
    leadIds.push(id);
    const before = await pool.query('SELECT first_name, email FROM leads WHERE id = $1', [id]);

    const res = await request(app).put(`/api/v1/leads/${id}`).set(auth(ws)).send({ [field]: bad });
    expect(res.status, JSON.stringify(res.body)).toBe(400);
    expect(res.body.message).toMatch(new RegExp(`${field} cannot be blank`));
    expect(res.body.message).not.toMatch(/Internal Server Error/);

    const after = await pool.query('SELECT first_name, email FROM leads WHERE id = $1', [id]);
    expect(after.rows[0]).toEqual(before.rows[0]);
  });

  /**
   * SYMMETRIC masked 500: score failed identically on create and update.
   * leads.score is INTEGER with leads_score_check CHECK (score >= 0 AND
   * score <= 100) — the range is the schema's, read from pg_constraint, not
   * a number invented here. 55.5 failed too, because the column is an integer.
   */
  it.each([
    ['abc', /whole number between 0 and 100/],
    [-5,    /between 0 and 100/],
    [150,   /between 0 and 100/],
    [101,   /between 0 and 100/],
    [55.5,  /whole number between 0 and 100/],
  ])('negative: score %j is rejected cleanly on UPDATE, stored score unchanged', async (bad, pattern) => {
    const create = await request(app).post('/api/v1/leads').set(auth(ws))
      .send({ first_name: 'Score', last_name: 'Keep', email: `score.${Date.now()}.${Math.random()}@example.com`, score: 42 });
    expect(create.status, JSON.stringify(create.body)).toBe(201);
    const id = create.body.data.id;
    leadIds.push(id);

    const res = await request(app).put(`/api/v1/leads/${id}`).set(auth(ws)).send({ score: bad });
    expect(res.status, JSON.stringify(res.body)).toBe(400);
    expect(res.body.message).toMatch(pattern);
    expect(res.body.message).not.toMatch(/Internal Server Error/);

    const row = await pool.query('SELECT score FROM leads WHERE id = $1', [id]);
    expect(row.rows[0].score).toBe(42);
  });

  it.each([['abc'], [150]])('negative: score %j is rejected cleanly on CREATE, nothing created', async (bad) => {
    const before = await pool.query('SELECT COUNT(*)::int AS n FROM leads WHERE tenant_id = $1', [ws.tenantId]);
    const res = await request(app).post('/api/v1/leads').set(auth(ws))
      .send({ first_name: 'Bad', last_name: 'Score', email: `badscore.${Date.now()}.${Math.random()}@example.com`, score: bad });
    expect(res.status, JSON.stringify(res.body)).toBe(400);
    expect(res.body.message).not.toMatch(/Internal Server Error/);
    const after = await pool.query('SELECT COUNT(*)::int AS n FROM leads WHERE tenant_id = $1', [ws.tenantId]);
    expect(after.rows[0].n).toBe(before.rows[0].n);
  });

  it('the boundary values 0 and 100 remain valid and persist', async () => {
    const create = await request(app).post('/api/v1/leads').set(auth(ws))
      .send({ first_name: 'Bound', last_name: 'Ary', email: `bound.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com` });
    const id = create.body.data.id;
    leadIds.push(id);

    for (const v of [0, 100]) {
      const res = await request(app).put(`/api/v1/leads/${id}`).set(auth(ws)).send({ score: v });
      expect(res.status, `score ${v}: ${JSON.stringify(res.body)}`).toBe(200);
      const row = await pool.query('SELECT score FROM leads WHERE id = $1', [id]);
      expect(row.rows[0].score).toBe(v);
    }
  });

  it('tenant isolation: workspace B cannot read or edit workspace A\'s lead', async () => {
    const wsB = await setupWorkspace('leads-b');
    try {
      const create = await request(app).post('/api/v1/leads').set(auth(ws)).send({
        first_name: 'Isolated', last_name: 'Lead', email: `isolead-${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`,
      });
      const id = create.body.data.id;
      leadIds.push(id);

      const readAsB = await request(app).get(`/api/v1/leads/${id}`).set(auth(wsB));
      expect(readAsB.status).toBe(404);
      const editAsB = await request(app).put(`/api/v1/leads/${id}`).set(auth(wsB)).send({ first_name: 'Hijacked' });
      expect(editAsB.status).toBe(404);

      const row = await pool.query('SELECT first_name FROM leads WHERE id = $1', [id]);
      expect(row.rows[0].first_name).toBe('Isolated');
    } finally {
      await teardownWorkspace(wsB);
    }
  });
});
