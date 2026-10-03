import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, addUserWithRole, TestWorkspace } from './helpers';

/**
 * Step 5, slice B — real lead conversion, POST /leads/:id/convert.
 *
 * Every success is checked by READING THE ROWS BACK from Postgres (the records
 * exist, are linked, and are owned by the converter); every refusal is checked
 * by counting that NOTHING was written — including records the transaction had
 * already created before the step that failed.
 *
 * Ratified 2026-10-03: deal value required (no default 0); an existing contact
 * email is a 409, never an auto-link; the converter owns created records.
 */
describe('Lead conversion — round trip', () => {
  let ws: TestWorkspace;     // admin
  let sales: TestWorkspace;

  beforeAll(async () => {
    ws = await setupWorkspace('leadconv');
    sales = await addUserWithRole(ws, 'sales');
  });
  afterAll(async () => { await teardownWorkspace(ws); });

  const uniq = () => `${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;

  /** A lead brought to `qualified` the real way: company, a logged call, a move. */
  const qualifiedLead = async (extra: Record<string, unknown> = {}, as: TestWorkspace = ws) => {
    const email = `conv.${uniq()}@example.com`;
    const c = await request(app).post('/api/v1/leads').set(auth(as))
      .send({ first_name: 'Priya', last_name: 'Menon', email, company: 'Contoso', phone: '+91 98', position: 'CTO', ...extra });
    expect(c.status, JSON.stringify(c.body)).toBe(201);
    const id = c.body.data.id as number;
    await request(app).post(`/api/v1/leads/${id}/calls`).set(auth(as)).send({ outcome: 'connected' });
    const q = await request(app).post(`/api/v1/leads/${id}/stage-transition`).set(auth(as)).send({ to_stage: 'qualified' });
    expect(q.status, JSON.stringify(q.body)).toBe(200);
    return { id, email };
  };
  const convert = (id: number, body: Record<string, unknown>, as: TestWorkspace = ws) =>
    request(app).post(`/api/v1/leads/${id}/convert`).set(auth(as)).send(body);
  const counts = async () => {
    const one = async (t: string) =>
      (await pool.query(`SELECT COUNT(*)::int AS n FROM ${t} WHERE tenant_id = $1`, [ws.tenantId])).rows[0].n;
    return { contacts: await one('contacts'), companies: await one('companies'), deals: await one('deals') };
  };
  const leadRow = async (id: number) => (await pool.query('SELECT * FROM leads WHERE id = $1', [id])).rows[0];
  const fullBody = (dealExtra: Record<string, unknown> = {}) => ({
    contact: { mode: 'create' },
    company: { mode: 'create' },
    deal: { name: 'Contoso — Platform', value: 125000, currency: 'INR', expected_close_date: '2026-12-31', ...dealExtra },
  });

  // ── The real thing ────────────────────────────────────────────────────────

  it('creates a real contact, company and deal, linked to each other and to the lead', async () => {
    const { id, email } = await qualifiedLead();
    const res = await convert(id, fullBody());
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    const { contact, company, deal } = res.body.data;

    // Read every record back — the ids in the response must be real rows.
    const c = (await pool.query('SELECT * FROM contacts WHERE id = $1', [contact.id])).rows[0];
    expect(c).toMatchObject({
      first_name: 'Priya', last_name: 'Menon', email, phone: '+91 98', position: 'CTO',
      company_id: company.id, owner_id: ws.userId, source: 'converted', tenant_id: ws.tenantId,
    });
    const co = (await pool.query('SELECT * FROM companies WHERE id = $1', [company.id])).rows[0];
    expect(co).toMatchObject({ name: 'Contoso', tenant_id: ws.tenantId });

    const d = (await pool.query('SELECT * FROM deals WHERE id = $1', [deal.id])).rows[0];
    expect(Number(d.value)).toBe(125000);
    expect(d).toMatchObject({
      lead_id: id, company_id: company.id, currency: 'INR', assigned_to_user_id: ws.userId,
      contact_email: email, tenant_id: ws.tenantId, pipeline_id: 'new-business',
    });
    // Its stage is the pipeline's first OPEN stage, resolved from the workspace.
    const st = (await pool.query(
      `SELECT ps.stage_type, ps.position FROM pipeline_stages ps WHERE ps.id = $1 AND ps.tenant_id = $2`, [d.stage_id, ws.tenantId],
    )).rows[0];
    expect(st.stage_type).toBe('open');

    const l = await leadRow(id);
    expect(l).toMatchObject({
      stage: 'converted', converted_by_user_id: ws.userId,
      converted_contact_id: contact.id, converted_company_id: company.id, converted_deal_id: deal.id,
    });
    expect(l.converted_at).not.toBeNull();

    const h = (await pool.query(
      'SELECT from_stage, to_stage, changed_by_user_id FROM lead_stage_history WHERE lead_id = $1 ORDER BY changed_at DESC LIMIT 1', [id],
    )).rows[0];
    expect(h).toEqual({ from_stage: 'qualified', to_stage: 'converted', changed_by_user_id: ws.userId });
  });

  it('a SALES user converts too, and owns what was created (interim owner rule)', async () => {
    const { id } = await qualifiedLead({}, sales);
    const res = await convert(id, fullBody(), sales);
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    const c = (await pool.query('SELECT owner_id FROM contacts WHERE id = $1', [res.body.data.contact.id])).rows[0];
    const d = (await pool.query('SELECT assigned_to_user_id FROM deals WHERE id = $1', [res.body.data.deal.id])).rows[0];
    expect(c.owner_id).toBe(sales.userId);
    expect(d.assigned_to_user_id).toBe(sales.userId);
    // There is no owner field to send — one in the body is simply not read.
    expect((await leadRow(id)).converted_by_user_id).toBe(sales.userId);
  });

  it('contact only — no company, no deal — is a valid conversion', async () => {
    const { id } = await qualifiedLead();
    const res = await convert(id, { contact: { mode: 'create' }, company: { mode: 'none' }, deal: null });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(res.body.data.company).toBeNull();
    expect(res.body.data.deal).toBeNull();
    const l = await leadRow(id);
    expect(l.converted_company_id).toBeNull();
    expect(l.converted_deal_id).toBeNull();
  });

  it('an explicit deal value of 0 is a real choice and is accepted', async () => {
    const { id } = await qualifiedLead();
    const res = await convert(id, fullBody({ value: 0 }));
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    const d = (await pool.query('SELECT value FROM deals WHERE id = $1', [res.body.data.deal.id])).rows[0];
    expect(Number(d.value)).toBe(0);
  });

  // ── Ratified refusals ─────────────────────────────────────────────────────

  it.each([
    ['missing', undefined],
    ['blank', ''],
    ['null', null],
    ['non-numeric', 'lots'],
    ['negative', -5],
  ])('a deal with a %s value is refused (400) and NOTHING is written', async (_label, value) => {
    const { id } = await qualifiedLead();
    const before = await counts();
    const res = await convert(id, fullBody({ value }));
    expect(res.status, JSON.stringify(res.body)).toBe(400);
    expect(res.body.message).toMatch(/deal\.value/);
    expect(await counts()).toEqual(before);
    expect((await leadRow(id)).stage).toBe('qualified');
  });

  it('an existing contact email is a 409 naming that contact — never an auto-link — and nothing is written', async () => {
    const { id, email } = await qualifiedLead();
    const existing = await request(app).post('/api/v1/contacts').set(auth(ws))
      .send({ first_name: 'Already', last_name: 'Here', email });
    expect(existing.status, JSON.stringify(existing.body)).toBe(201);

    const before = await counts();
    const res = await convert(id, fullBody());
    expect(res.status, JSON.stringify(res.body)).toBe(409);
    expect(res.body.code).toBe('CONTACT_EMAIL_EXISTS');
    expect(res.body.existing_contact.id).toBe(existing.body.data.id);
    // The company was inserted BEFORE the contact check failed — the
    // transaction must have taken it back with everything else.
    expect(await counts()).toEqual(before);
    const l = await leadRow(id);
    expect(l.stage).toBe('qualified');
    expect(l.converted_contact_id).toBeNull();
  });

  it('…and the rep can then explicitly LINK to that existing contact', async () => {
    const { id, email } = await qualifiedLead();
    const existing = await request(app).post('/api/v1/contacts').set(auth(ws))
      .send({ first_name: 'Link', last_name: 'Target', email });
    const before = await counts();

    const res = await convert(id, { contact: { mode: 'link', contact_id: existing.body.data.id }, company: { mode: 'none' }, deal: null });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(res.body.data.contact).toMatchObject({ id: existing.body.data.id, created: false });
    expect((await counts()).contacts).toBe(before.contacts);          // no new contact
    expect((await leadRow(id)).converted_contact_id).toBe(existing.body.data.id);
  });

  it('a lead that is not qualified cannot convert (409), and nothing is written', async () => {
    const c = await request(app).post('/api/v1/leads').set(auth(ws))
      .send({ first_name: 'New', last_name: 'Lead', email: `new.${uniq()}@example.com`, company: 'Contoso' });
    const before = await counts();
    const res = await convert(c.body.data.id, fullBody());
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('LEAD_NOT_QUALIFIED');
    expect(await counts()).toEqual(before);
  });

  it('a lead converts once: the second attempt is a 409 and creates nothing', async () => {
    const { id } = await qualifiedLead();
    expect((await convert(id, fullBody())).status).toBe(201);
    const before = await counts();
    const again = await convert(id, fullBody());
    expect(again.status).toBe(409);
    expect(again.body.code).toBe('LEAD_ALREADY_CONVERTED');
    expect(await counts()).toEqual(before);
  });

  it('a lead with no last name needs one supplied — refused, then accepted with the override', async () => {
    const { id } = await qualifiedLead({ last_name: undefined });
    await pool.query('UPDATE leads SET last_name = NULL WHERE id = $1', [id]);
    const before = await counts();
    const res = await convert(id, { contact: { mode: 'create' }, company: { mode: 'none' }, deal: null });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/last_name/);
    expect(await counts()).toEqual(before);

    const ok = await convert(id, { contact: { mode: 'create', last_name: 'Iyer' }, company: { mode: 'none' }, deal: null });
    expect(ok.status, JSON.stringify(ok.body)).toBe(201);
    const c = (await pool.query('SELECT last_name FROM contacts WHERE id = $1', [ok.body.data.contact.id])).rows[0];
    expect(c.last_name).toBe('Iyer');
  });

  it('a failure in the LAST step (deal pipeline) rolls back the contact and company already created', async () => {
    const { id } = await qualifiedLead();
    const before = await counts();
    const res = await convert(id, fullBody({ pipeline_id: 'no-such-pipeline' }));
    expect(res.status, JSON.stringify(res.body)).toBe(400);
    expect(await counts()).toEqual(before);
    expect((await leadRow(id)).stage).toBe('qualified');
  });

  it('malformed modes are 400s', async () => {
    const { id } = await qualifiedLead();
    expect((await convert(id, { contact: { mode: 'guess' } })).status).toBe(400);
    expect((await convert(id, { contact: { mode: 'link' } })).status).toBe(400);
    expect((await convert(id, { company: { mode: 'link' } })).status).toBe(400);
    expect((await convert(id, { deal: { value: 10 } })).status).toBe(400);   // no name
  });

  // ── Tenant isolation ──────────────────────────────────────────────────────

  describe('tenant isolation', () => {
    let other: TestWorkspace;
    beforeAll(async () => { other = await setupWorkspace('leadconv-other'); });
    afterAll(async () => { await teardownWorkspace(other); });

    it('another workspace\'s lead is 404 and untouched', async () => {
      const theirs = await qualifiedLead({}, other);
      const res = await convert(theirs.id, fullBody());
      expect(res.status).toBe(404);
      expect((await leadRow(theirs.id)).stage).toBe('qualified');
    });

    it('linking another workspace\'s contact or company is a 400 naming only the field, and nothing is written', async () => {
      const theirContact = await request(app).post('/api/v1/contacts').set(auth(other))
        .send({ first_name: 'Their', last_name: 'Contact', email: `their.${uniq()}@example.com` });
      const theirCompany = await request(app).post('/api/v1/companies').set(auth(other)).send({ name: 'Their Co' });
      expect(theirContact.status).toBe(201);
      expect(theirCompany.status, JSON.stringify(theirCompany.body)).toBe(201);

      const { id } = await qualifiedLead();
      const before = await counts();

      const c = await convert(id, { contact: { mode: 'link', contact_id: theirContact.body.data.id }, deal: null });
      expect(c.status).toBe(400);
      expect(c.body.message).toBe('contact.contact_id does not name a contact in this workspace');

      const co = await convert(id, { contact: { mode: 'create' }, company: { mode: 'link', company_id: theirCompany.body.data.id }, deal: null });
      expect(co.status).toBe(400);
      expect(co.body.message).toBe('company.company_id does not name a company in this workspace');

      expect(await counts()).toEqual(before);
      expect((await leadRow(id)).stage).toBe('qualified');
    });
  });

  // ── Concurrency ───────────────────────────────────────────────────────────

  it('two conversions racing on one lead: exactly one wins, exactly one contact exists', async () => {
    const { id, email } = await qualifiedLead();
    const [a, b] = await Promise.all([convert(id, fullBody()), convert(id, fullBody())]);
    expect([a.status, b.status].sort()).toEqual([201, 409]);
    const n = (await pool.query(
      'SELECT COUNT(*)::int AS n FROM contacts WHERE tenant_id = $1 AND lower(email) = lower($2)', [ws.tenantId, email],
    )).rows[0].n;
    expect(n).toBe(1);
    const deals = (await pool.query('SELECT COUNT(*)::int AS n FROM deals WHERE lead_id = $1', [id])).rows[0].n;
    expect(deals).toBe(1);
  });

  /**
   * The race the lead-row LOCK exists for. When both requests LINK an existing
   * contact there is no unique index to catch the second one — without the
   * FOR UPDATE on the lead, both would see 'qualified', both would create a
   * deal, and the lead would be "converted" twice. (The create-mode race above
   * is also caught by contacts' unique email, so on its own it cannot prove
   * the lock — found by mutation-testing it.)
   */
  it('two conversions racing on one lead in LINK mode: exactly one wins, exactly one deal', async () => {
    const { id, email } = await qualifiedLead();
    const existing = await request(app).post('/api/v1/contacts').set(auth(ws))
      .send({ first_name: 'Race', last_name: 'Target', email });
    const body = { contact: { mode: 'link', contact_id: existing.body.data.id }, company: { mode: 'none' },
      deal: { name: 'Race deal', value: 10 } };
    const [a, b] = await Promise.all([convert(id, body), convert(id, body)]);
    expect([a.status, b.status].sort()).toEqual([201, 409]);
    const deals = (await pool.query('SELECT COUNT(*)::int AS n FROM deals WHERE lead_id = $1', [id])).rows[0].n;
    expect(deals).toBe(1);
  });
});
