import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, addUserWithRole, TestWorkspace } from './helpers';

/**
 * Step 5, slice A — lead stage transitions and the server-side qualification
 * gate. Ratified 2026-10-03:
 *   - every stage change goes through POST /leads/:id/stage-transition;
 *     PUT /leads/:id refuses a stage change;
 *   - entering the qualifying lane needs email-or-phone, a company and a
 *     recorded last contact; overriding needs a manager or admin and a reason;
 *   - last_contact is set by logging a call, an email, or a call/email/meeting
 *     activity.
 *
 * Every assertion that matters is checked against Postgres, not just the
 * response body (the reload test, in effect).
 */
describe('Lead stage transitions — round trip', () => {
  let ws: TestWorkspace;        // admin (setupWorkspace)
  let manager: TestWorkspace;
  let sales: TestWorkspace;

  beforeAll(async () => {
    ws = await setupWorkspace('leadtx');
    manager = await addUserWithRole(ws, 'manager');
    sales = await addUserWithRole(ws, 'sales');
  });
  afterAll(async () => { await teardownWorkspace(ws); });

  const uniq = () => `${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
  const newLead = async (extra: Record<string, unknown> = {}, as: TestWorkspace = ws) => {
    const res = await request(app).post('/api/v1/leads').set(auth(as)).send({
      first_name: 'Tx', last_name: 'Lead', email: `tx.${uniq()}@example.com`, ...extra,
    });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    return res.body.data.id as number;
  };
  const move = (id: number, body: Record<string, unknown>, as: TestWorkspace = ws) =>
    request(app).post(`/api/v1/leads/${id}/stage-transition`).set(auth(as)).send(body);
  const stageOf = async (id: number) =>
    (await pool.query('SELECT stage FROM leads WHERE id = $1', [id])).rows[0].stage;
  const history = async (id: number) =>
    (await pool.query(
      'SELECT * FROM lead_stage_history WHERE lead_id = $1 ORDER BY changed_at ASC, id', [id],
    )).rows;
  const lastContact = async (id: number) =>
    (await pool.query('SELECT last_contact::text AS d FROM leads WHERE id = $1', [id])).rows[0].d;
  const today = () => new Date().toISOString().slice(0, 10);

  // ── Ordinary moves ────────────────────────────────────────────────────────

  it('creating a lead writes the first history row (from NULL)', async () => {
    const id = await newLead();
    const rows = await history(id);
    expect(rows).toHaveLength(1);
    expect(rows[0].from_stage).toBeNull();
    expect(rows[0].to_stage).toBe('new');
    expect(rows[0].changed_by_user_id).toBe(ws.userId);
    expect(rows[0].tenant_id).toBe(ws.tenantId);
  });

  it('an ungated move persists and is recorded with who made it', async () => {
    const id = await newLead();
    const res = await move(id, { to_stage: 'engaged' }, sales);
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.data.stage).toBe('engaged');
    expect(await stageOf(id)).toBe('engaged');

    const rows = await history(id);
    const last = rows[rows.length - 1];
    expect(last.from_stage).toBe('new');
    expect(last.to_stage).toBe('engaged');
    expect(last.qualification_override).toBe(false);
    expect(last.changed_by_user_id).toBe(sales.userId);
  });

  it('a move to the current stage is a no-op: 200, no history row', async () => {
    const id = await newLead();
    const before = (await history(id)).length;
    const res = await move(id, { to_stage: 'new' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/already in that stage/);
    expect((await history(id)).length).toBe(before);
  });

  it('an invalid or missing to_stage is a 400 and changes nothing', async () => {
    const id = await newLead();
    expect((await move(id, { to_stage: 'nope' })).status).toBe(400);
    expect((await move(id, {})).status).toBe(400);
    expect((await move(id, { to_stage: 'qualified', override: 'yes' })).status).toBe(400);
    expect(await stageOf(id)).toBe('new');
  });

  // ── The qualification gate ────────────────────────────────────────────────

  it('a lead missing criteria cannot be qualified: 409 naming each unmet criterion, nothing written', async () => {
    const id = await newLead();                       // no company, no last contact
    const before = (await history(id)).length;
    const res = await move(id, { to_stage: 'qualified' }, sales);
    expect(res.status, JSON.stringify(res.body)).toBe(409);
    expect(res.body.code).toBe('QUALIFICATION_CRITERIA_UNMET');
    expect(res.body.unmet_criteria.map((c: { id: string }) => c.id)).toEqual(['company', 'last_contact']);
    expect(res.body.can_override).toBe(false);        // served, so the UI renders the rule
    expect(await stageOf(id)).toBe('new');
    expect((await history(id)).length).toBe(before);
  });

  it('the gate covers sales_accepted too — entering the lane from outside', async () => {
    const id = await newLead();
    const res = await move(id, { to_stage: 'sales_accepted' });
    expect(res.status).toBe(409);
    expect(await stageOf(id)).toBe('new');
  });

  it('can_override is true for a manager', async () => {
    const id = await newLead();
    const res = await move(id, { to_stage: 'qualified' }, manager);
    expect(res.status).toBe(409);
    expect(res.body.can_override).toBe(true);
  });

  it('a SALES user cannot override — 403, the rule that used to be a hidden button', async () => {
    const id = await newLead();
    const res = await move(id, { to_stage: 'qualified', override: true, reason: 'I insist' }, sales);
    expect(res.status, JSON.stringify(res.body)).toBe(403);
    expect(res.body.message).toMatch(/manager or admin/);
    expect(await stageOf(id)).toBe('new');
  });

  it('a manager override needs a reason', async () => {
    const id = await newLead();
    for (const reason of [undefined, '', '   ']) {
      const res = await move(id, { to_stage: 'qualified', override: true, reason }, manager);
      expect(res.status, JSON.stringify(res.body)).toBe(400);
    }
    expect(await stageOf(id)).toBe('new');
  });

  it('a manager override with a reason succeeds, and records WHAT was overridden', async () => {
    const id = await newLead({ company: 'Contoso' }); // only last_contact missing
    const res = await move(id, { to_stage: 'qualified', override: true, reason: 'Met at the expo' }, manager);
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(await stageOf(id)).toBe('qualified');

    const rows = await history(id);
    const last = rows[rows.length - 1];
    expect(last.qualification_override).toBe(true);
    expect(last.unmet_criteria).toEqual(['last_contact']);
    expect(last.reason).toBe('Met at the expo');
    expect(last.changed_by_user_id).toBe(manager.userId);
  });

  it('an ADMIN can override too — the rule is manager OR admin', async () => {
    const id = await newLead();                       // missing company and last contact
    const res = await move(id, { to_stage: 'qualified', override: true, reason: 'Exec referral' }, ws);
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(await stageOf(id)).toBe('qualified');
    const rows = await history(id);
    expect(rows[rows.length - 1].qualification_override).toBe(true);
    expect(rows[rows.length - 1].unmet_criteria).toEqual(['company', 'last_contact']);
    expect(rows[rows.length - 1].changed_by_user_id).toBe(ws.userId);
  });

  it('an override can only land on qualified, not sales_accepted', async () => {
    const id = await newLead();
    const res = await move(id, { to_stage: 'sales_accepted', override: true, reason: 'x' }, manager);
    expect(res.status).toBe(400);
    expect(await stageOf(id)).toBe('new');
  });

  it('a lead that MEETS the criteria is qualified by anyone, with no override recorded', async () => {
    const id = await newLead({ company: 'Contoso' }, sales);
    const call = await request(app).post(`/api/v1/leads/${id}/calls`).set(auth(sales)).send({ outcome: 'connected' });
    expect(call.status, JSON.stringify(call.body)).toBe(201);

    const res = await move(id, { to_stage: 'qualified' }, sales);
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    const rows = await history(id);
    expect(rows[rows.length - 1].qualification_override).toBe(false);
    expect(rows[rows.length - 1].unmet_criteria).toEqual([]);

    // Moving on within the lane is not gated again.
    expect((await move(id, { to_stage: 'sales_accepted' }, sales)).status).toBe(200);
  });

  // ── What sets last_contact ────────────────────────────────────────────────

  it('a logged call sets last_contact to the call date', async () => {
    const id = await newLead();
    expect(await lastContact(id)).toBeNull();
    await request(app).post(`/api/v1/leads/${id}/calls`).set(auth(ws)).send({ outcome: 'no-answer' });
    expect(await lastContact(id)).toBe(today());
  });

  it('a sent email sets it; a draft does not', async () => {
    const draft = await newLead();
    await request(app).post(`/api/v1/leads/${draft}/emails`).set(auth(ws))
      .send({ from_email: 'rep@example.com', subject: 'Draft', status: 'draft' });
    expect(await lastContact(draft)).toBeNull();

    const sent = await newLead();
    const res = await request(app).post(`/api/v1/leads/${sent}/emails`).set(auth(ws))
      .send({ from_email: 'rep@example.com', subject: 'Hello' });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(await lastContact(sent)).toBe(today());
  });

  it('a COMPLETED call/email/meeting activity sets it; a planned one or a note does not', async () => {
    const planned = await newLead();
    await request(app).post(`/api/v1/leads/${planned}/activities`).set(auth(ws))
      .send({ subject: 'Demo', type: 'meeting', status: 'planned' });
    await request(app).post(`/api/v1/leads/${planned}/activities`).set(auth(ws))
      .send({ subject: 'Thought', type: 'note' });
    expect(await lastContact(planned)).toBeNull();

    const met = await newLead();
    const res = await request(app).post(`/api/v1/leads/${met}/activities`).set(auth(ws))
      .send({ subject: 'Demo', type: 'meeting', status: 'completed' });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(await lastContact(met)).toBe(today());
  });

  it('the date only moves forward, and a future-dated touch does not count', async () => {
    const id = await newLead();
    await request(app).post(`/api/v1/leads/${id}/calls`).set(auth(ws)).send({ started_at: '2026-01-15T10:00:00Z' });
    expect(await lastContact(id)).toBe('2026-01-15');

    await request(app).post(`/api/v1/leads/${id}/calls`).set(auth(ws)).send({ started_at: '2025-06-01T10:00:00Z' });
    expect(await lastContact(id)).toBe('2026-01-15');           // an older call never rolls it back

    const future = new Date(Date.now() + 7 * 864e5).toISOString();
    await request(app).post(`/api/v1/leads/${id}/calls`).set(auth(ws)).send({ started_at: future });
    expect(await lastContact(id)).toBe('2026-01-15');           // not contact yet
  });

  // ── The side door is closed ───────────────────────────────────────────────

  it('PUT refuses a stage CHANGE — 400, row unchanged, no history', async () => {
    const id = await newLead();
    const before = (await history(id)).length;
    const res = await request(app).put(`/api/v1/leads/${id}`).set(auth(ws)).send({ stage: 'qualified' });
    expect(res.status, JSON.stringify(res.body)).toBe(400);
    expect(res.body.code).toBe('STAGE_NOT_EDITABLE');
    expect(await stageOf(id)).toBe('new');
    expect((await history(id)).length).toBe(before);
  });

  it('PUT tolerates the UNCHANGED stage in a full-object save, and saves the other fields', async () => {
    const id = await newLead();
    const res = await request(app).put(`/api/v1/leads/${id}`).set(auth(ws)).send({ stage: 'new', company: 'Fabrikam' });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    const row = (await pool.query('SELECT stage, company FROM leads WHERE id = $1', [id])).rows[0];
    expect(row).toEqual({ stage: 'new', company: 'Fabrikam' });
  });

  it('creation cannot bypass the gate or conversion', async () => {
    const asQualified = await request(app).post('/api/v1/leads').set(auth(ws))
      .send({ first_name: 'Q', email: `q.${uniq()}@example.com`, company: 'Contoso', stage: 'qualified' });
    expect(asQualified.status, JSON.stringify(asQualified.body)).toBe(409);
    expect(asQualified.body.unmet_criteria.map((c: { id: string }) => c.id)).toEqual(['last_contact']);

    const asConverted = await request(app).post('/api/v1/leads').set(auth(ws))
      .send({ first_name: 'C', email: `c.${uniq()}@example.com`, stage: 'converted' });
    expect(asConverted.status).toBe(400);
  });

  it('"converted" is not a stage move, and a converted lead is terminal', async () => {
    const id = await newLead();
    const res = await move(id, { to_stage: 'converted' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('USE_CONVERSION');

    // Simulate a lead converted by slice B's endpoint, then try to move it.
    await pool.query("UPDATE leads SET stage = 'converted' WHERE id = $1", [id]);
    const out = await move(id, { to_stage: 'engaged' }, manager);
    expect(out.status).toBe(409);
    expect(out.body.code).toBe('LEAD_CONVERTED');
    expect(await stageOf(id)).toBe('converted');
  });

  // ── Reading history; isolation ────────────────────────────────────────────

  it('GET /stage-history returns the lead\'s rows newest first', async () => {
    const id = await newLead();
    await move(id, { to_stage: 'engaged' });
    await move(id, { to_stage: 'nurture' });
    const res = await request(app).get(`/api/v1/leads/${id}/stage-history`).set(auth(sales));
    expect(res.status).toBe(200);
    expect(res.body.data.map((r: { to_stage: string }) => r.to_stage)).toEqual(['nurture', 'engaged', 'new']);
  });

  it('tenant isolation: another workspace\'s lead is 404 for both endpoints and untouched', async () => {
    const other = await setupWorkspace('leadtx-other');
    try {
      const theirs = await newLead({}, other);
      expect((await move(theirs, { to_stage: 'engaged' })).status).toBe(404);
      expect((await request(app).get(`/api/v1/leads/${theirs}/stage-history`).set(auth(ws))).status).toBe(404);
      expect(await stageOf(theirs)).toBe('new');
    } finally {
      await teardownWorkspace(other);
    }
  });
});
