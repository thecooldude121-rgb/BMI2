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
 * TODO(next session that builds real conversion): once a POST
 * /leads/:id/convert endpoint and the linking columns exist, replace
 * "conversion has no linking side effect" below with a real positive test:
 * submit through the endpoint, then confirm a contact/account/deal actually
 * exist in Postgres, correctly linked back to the lead.
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
    const email = `lead.${Date.now()}@example.com`;
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
  it.each([
    'assigned', 'enriching', 'attempting_contact', 'engaged',
    'sales_accepted', 'nurture', 'disqualified',
  ])('create+edit: previously-rejected stage "%s" is now accepted and persists', async (stage) => {
    const create = await request(app).post('/api/v1/leads').set(auth(ws)).send({
      first_name: 'Stage', last_name: 'Test', email: `stage-${stage}-${Date.now()}@example.com`,
    });
    const id = create.body.data.id;
    leadIds.push(id);

    const res = await request(app).put(`/api/v1/leads/${id}`).set(auth(ws)).send({ stage });
    expect(res.status, `${stage}: ${JSON.stringify(res.body)}`).toBe(200);
    const row = await pool.query('SELECT stage FROM leads WHERE id = $1', [id]);
    expect(row.rows[0].stage).toBe(stage);
  });

  it('negative: an invalid stage is still rejected, row unchanged', async () => {
    const create = await request(app).post('/api/v1/leads').set(auth(ws)).send({
      first_name: 'Invalid', last_name: 'Stage', email: `invalid-stage-${Date.now()}@example.com`, stage: 'new',
    });
    const id = create.body.data.id;
    leadIds.push(id);

    const res = await request(app).put(`/api/v1/leads/${id}`).set(auth(ws)).send({ stage: 'made-up-stage' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/stage must be one of/);
    const row = await pool.query('SELECT stage FROM leads WHERE id = $1', [id]);
    expect(row.rows[0].stage).toBe('new');
  });

  describe('conversion — current honest-failure behavior (see file header)', () => {
    it('there is no conversion endpoint yet: POST /leads/:id/convert does not exist', async () => {
      const create = await request(app).post('/api/v1/leads').set(auth(ws)).send({
        first_name: 'Convert', last_name: 'Me', email: `convert-${Date.now()}@example.com`,
      });
      const id = create.body.data.id;
      leadIds.push(id);

      const res = await request(app).post(`/api/v1/leads/${id}/convert`).set(auth(ws)).send({});
      // notFound middleware returns 404 for any unmatched route.
      expect(res.status).toBe(404);
    });

    it('setting stage to "converted" changes only the lead itself — no contact, account, or deal is fabricated as a side effect', async () => {
      const create = await request(app).post('/api/v1/leads').set(auth(ws)).send({
        first_name: 'ToConvert', last_name: 'Lead', email: `toconvert-${Date.now()}@example.com`, company: 'Contoso',
      });
      const id = create.body.data.id;
      leadIds.push(id);

      const beforeContacts = await pool.query('SELECT COUNT(*)::int AS n FROM contacts WHERE tenant_id = $1', [ws.tenantId]);
      const beforeCompanies = await pool.query('SELECT COUNT(*)::int AS n FROM companies WHERE tenant_id = $1', [ws.tenantId]);
      const beforeDeals = await pool.query('SELECT COUNT(*)::int AS n FROM deals WHERE tenant_id = $1', [ws.tenantId]);

      const res = await request(app).put(`/api/v1/leads/${id}`).set(auth(ws)).send({ stage: 'converted' });
      expect(res.status, JSON.stringify(res.body)).toBe(200);

      const row = await pool.query('SELECT stage FROM leads WHERE id = $1', [id]);
      expect(row.rows[0].stage).toBe('converted');

      // The honest part: nothing else got created. If this suite is re-run
      // after conversion is actually built, THIS assertion is expected to
      // start failing — that failure means replace this whole describe block
      // per the TODO at the top of the file, not "fix" the count back to zero.
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
   * The block above submits `stage: 'converted'`, which is a valid stage and
   * therefore succeeds. That is NOT what the real UI sends. Read off
   * Frontend/src/components/Leads/LeadConversionWizard.tsx (handleConvert),
   * the wizard mints CLIENT-SIDE stub ids (cnt_/acc_/deal_) and calls
   * onUpdateLead with `status: 'converted'` plus converted_at,
   * converted_to_contact_id, converted_to_deal_id and account_id.
   *
   * `status` is a different field from `stage` (CLAUDE.md's schema-drift note):
   * leads.status is active | inactive | nurturing, so 'converted' is invalid
   * there, and none of the four converted_* / account_id columns exist on the
   * table at all. So the real Convert button cannot succeed today.
   *
   * This locks in the HONEST FAILURE: rejected, with the real reason, and
   * nothing fabricated. It is deliberately not a blessing of the current
   * state — see the TODO at the top of this file. When conversion is really
   * built, this test is expected to fail, and the fix is to replace it with a
   * positive round trip, never to loosen it.
   */
  it('the real wizard payload is rejected with the real reason, and fabricates nothing', async () => {
    const create = await request(app).post('/api/v1/leads').set(auth(ws)).send({
      first_name: 'Wizard', last_name: 'Payload',
      email: `wizard-${Date.now()}@example.com`, company: 'Contoso', stage: 'qualified',
    });
    expect(create.status, JSON.stringify(create.body)).toBe(201);
    const id = create.body.data.id;
    leadIds.push(id);

    const beforeContacts = await pool.query('SELECT COUNT(*)::int AS n FROM contacts WHERE tenant_id = $1', [ws.tenantId]);
    const beforeCompanies = await pool.query('SELECT COUNT(*)::int AS n FROM companies WHERE tenant_id = $1', [ws.tenantId]);
    const beforeDeals = await pool.query('SELECT COUNT(*)::int AS n FROM deals WHERE tenant_id = $1', [ws.tenantId]);

    const ts = Date.now();
    const res = await request(app).put(`/api/v1/leads/${id}`).set(auth(ws)).send({
      status: 'converted',
      converted_at: new Date().toISOString(),
      converted_to_contact_id: `cnt_${ts}`,
      converted_to_deal_id: `deal_${ts}`,
      account_id: `acc_${ts}`,
    });

    // Rejected, and with the actual server-side reason rather than a generic
    // fallback or a swallowed null.
    expect(res.status, JSON.stringify(res.body)).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/status must be one of/);
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
      .send({ first_name: 'Keep', last_name: 'Lead', email: `keeplead.${field}.${Date.now()}@example.com` });
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

  it('tenant isolation: workspace B cannot read or edit workspace A\'s lead', async () => {
    const wsB = await setupWorkspace('leads-b');
    try {
      const create = await request(app).post('/api/v1/leads').set(auth(ws)).send({
        first_name: 'Isolated', last_name: 'Lead', email: `isolead-${Date.now()}@example.com`,
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
