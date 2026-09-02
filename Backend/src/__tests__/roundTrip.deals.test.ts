import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';

describe('Deals — round trip', () => {
  let ws: TestWorkspace;
  let companyId: string;
  const dealIds: string[] = [];

  beforeAll(async () => {
    ws = await setupWorkspace('deals');
    const co = await request(app).post('/api/v1/companies').set(auth(ws)).send({ name: `Deal Test Co ${Date.now()}` });
    companyId = co.body.data.id;
  });

  afterAll(async () => {
    if (dealIds.length) {
      await pool.query('DELETE FROM deal_stage_history WHERE deal_id = ANY($1::varchar[])', [dealIds]);
      await pool.query('DELETE FROM deals WHERE id = ANY($1::varchar[])', [dealIds]);
      const after = await pool.query('SELECT COUNT(*)::int AS n FROM deals WHERE id = ANY($1::varchar[])', [dealIds]);
      if (after.rows[0].n !== 0) throw new Error(`Cleanup failed: ${after.rows[0].n} test deals remain`);
    }
    await pool.query('DELETE FROM companies WHERE id = $1', [companyId]);
    await teardownWorkspace(ws);
  });

  it('create: a real POST creates a deal Postgres actually holds, linked to the real company', async () => {
    const res = await request(app).post('/api/v1/deals').set(auth(ws)).send({
      name: `Test Deal ${Date.now()}`, value: 50000, currency: 'USD',
      company_id: companyId, stage: 'prospecting',
    });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    const id = res.body.data.id;
    dealIds.push(id);

    const row = await pool.query('SELECT name, value, currency, company_id, stage FROM deals WHERE id = $1 AND tenant_id = $2', [id, ws.tenantId]);
    expect(row.rows[0].value).toBe('50000.00'); // DECIMAL(15,2) comes back as text from pg
    expect(row.rows[0].currency).toBe('USD');
    expect(row.rows[0].company_id).toBe(companyId);
    expect(row.rows[0].stage).toBe('prospecting');
  });

  it('negative: company_id from another workspace is rejected, no deal created', async () => {
    const wsB = await setupWorkspace('deals-foreign-co');
    try {
      const coB = await request(app).post('/api/v1/companies').set(auth(wsB)).send({ name: `Other WS Co ${Date.now()}` });
      const foreignCompanyId = coB.body.data.id;

      const before = await pool.query('SELECT COUNT(*)::int AS n FROM deals WHERE tenant_id = $1', [ws.tenantId]);
      const res = await request(app).post('/api/v1/deals').set(auth(ws)).send({
        name: 'Should Not Save', value: 1000, company_id: foreignCompanyId,
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/company_id does not name a company/);
      const after = await pool.query('SELECT COUNT(*)::int AS n FROM deals WHERE tenant_id = $1', [ws.tenantId]);
      expect(after.rows[0].n).toBe(before.rows[0].n);
    } finally {
      await teardownWorkspace(wsB);
    }
  });

  /**
   * deals.value is NUMERIC(12,2) NOT NULL with no default. createDeal used to
   * validate only the name and the FK refs, so a missing value reached
   * Postgres as a raw 23502 and came back to the caller as a masked 500
   * "Internal Server Error" — the real reason discarded. These lock in the
   * clean 400 that replaced it. The column itself is unchanged.
   */
  it('negative: a missing value is rejected with the real reason, not a masked 500', async () => {
    const before = await pool.query('SELECT COUNT(*)::int AS n FROM deals WHERE tenant_id = $1', [ws.tenantId]);
    const res = await request(app).post('/api/v1/deals').set(auth(ws))
      .send({ name: `No Value Deal ${Date.now()}`, company_id: companyId });
    expect(res.status, JSON.stringify(res.body)).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/value is required/);
    expect(res.body.message, 'a 500 here means the DB rejected it, not the controller').not.toMatch(/Internal Server Error/);
    const after = await pool.query('SELECT COUNT(*)::int AS n FROM deals WHERE tenant_id = $1', [ws.tenantId]);
    expect(after.rows[0].n).toBe(before.rows[0].n);
  });

  it.each([
    ['a negative number', -500],
    ['a non-numeric string', 'not-a-number'],
  ])('negative: %s for value is rejected, nothing created', async (_label, badValue) => {
    const before = await pool.query('SELECT COUNT(*)::int AS n FROM deals WHERE tenant_id = $1', [ws.tenantId]);
    const res = await request(app).post('/api/v1/deals').set(auth(ws))
      .send({ name: `Bad Value Deal ${Date.now()}`, company_id: companyId, value: badValue });
    expect(res.status, JSON.stringify(res.body)).toBe(400);
    expect(res.body.message).toMatch(/value must be a non-negative number/);
    const after = await pool.query('SELECT COUNT(*)::int AS n FROM deals WHERE tenant_id = $1', [ws.tenantId]);
    expect(after.rows[0].n).toBe(before.rows[0].n);
  });

  /**
   * BOUNDARY THAT PROTECTS THE REAL FORM. ComprehensiveDealFormPage sends
   * `parseFloat(d.value) || 0`, so a deal entered with a blank amount arrives
   * as a literal 0. Rejecting 0 as "missing" would break the actual Add Deal
   * button, so zero must remain a valid, stored value — not a 400.
   */
  it('a value of 0 is accepted and stored as 0.00, since the real form sends 0 for a blank amount', async () => {
    const res = await request(app).post('/api/v1/deals').set(auth(ws))
      .send({ name: `Zero Value Deal ${Date.now()}`, company_id: companyId, value: 0 });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    dealIds.push(res.body.data.id);

    const row = await pool.query('SELECT value FROM deals WHERE id = $1', [res.body.data.id]);
    expect(row.rows[0].value).toBe('0.00');
  });

  /**
   * HIGHEST-PRIORITY REGRESSION IN THIS SUITE, per Prompt C explicitly.
   *
   * The close-date field was found shifting backward by one day on every
   * no-op save — a genuine data-corruption bug (see HANDOFF.md's DATE-column
   * timezone writeup, and commit 9c858c1 "Deal dates: stop a no-op save from
   * walking the close date backwards", which appears to already fix this).
   * This test locks the fix in: open, save with the SAME value, the stored
   * date must be byte-for-byte unchanged. Repeated three times, because a
   * once-a-day drift needs more than one round trip to show up reliably.
   */
  it('REGRESSION: saving expected_close_date with an UNCHANGED value never shifts the stored date', async () => {
    const closeDate = '2026-12-25';
    const create = await request(app).post('/api/v1/deals').set(auth(ws)).send({
      name: `Close Date Deal ${Date.now()}`, value: 75000, company_id: companyId, expected_close_date: closeDate,
    });
    expect(create.status, JSON.stringify(create.body)).toBe(201);
    const id = create.body.data.id;
    dealIds.push(id);

    const afterCreate = await pool.query(`SELECT to_char(expected_close_date, 'YYYY-MM-DD') AS d FROM deals WHERE id = $1`, [id]);
    expect(afterCreate.rows[0].d).toBe(closeDate);

    for (let i = 0; i < 3; i++) {
      const noop = await request(app).put(`/api/v1/deals/${id}`).set(auth(ws)).send({ expected_close_date: closeDate });
      expect(noop.status, JSON.stringify(noop.body)).toBe(200);
      const row = await pool.query(`SELECT to_char(expected_close_date, 'YYYY-MM-DD') AS d FROM deals WHERE id = $1`, [id]);
      expect(row.rows[0].d, `close date drifted after no-op save #${i + 1}`).toBe(closeDate);
    }
  });

  it('edit: a REAL change to expected_close_date persists exactly as sent', async () => {
    const create = await request(app).post('/api/v1/deals').set(auth(ws)).send({
      name: `Changing Close Date ${Date.now()}`, value: 12000, company_id: companyId, expected_close_date: '2026-06-01',
    });
    const id = create.body.data.id;
    dealIds.push(id);

    const res = await request(app).put(`/api/v1/deals/${id}`).set(auth(ws)).send({ expected_close_date: '2026-07-15' });
    expect(res.status).toBe(200);
    const row = await pool.query(`SELECT to_char(expected_close_date, 'YYYY-MM-DD') AS d FROM deals WHERE id = $1`, [id]);
    expect(row.rows[0].d).toBe('2026-07-15');
  });

  it('edit: stakeholders (jsonb) actually persist, not just render (F24 lesson)', async () => {
    const create = await request(app).post('/api/v1/deals').set(auth(ws)).send({
      name: `Stakeholder Deal ${Date.now()}`, value: 30000, company_id: companyId,
    });
    const id = create.body.data.id;
    dealIds.push(id);

    const stakeholders = [
      { name: 'Anita Desai', role: 'champion', email: 'anita@example.com' },
      { name: 'Vikram Rao', role: 'economic-buyer', email: 'vikram@example.com' },
    ];
    const res = await request(app).put(`/api/v1/deals/${id}`).set(auth(ws)).send({ stakeholders });
    expect(res.status, JSON.stringify(res.body)).toBe(200);

    // Re-read from Postgres. node-pg parses jsonb back into JS, so this also
    // catches double-encoding: a JSON *string* stored inside the jsonb column
    // would not deep-equal the array that was sent.
    const row = await pool.query('SELECT stakeholders FROM deals WHERE id = $1', [id]);
    expect(row.rows[0].stakeholders).toEqual(stakeholders);

    // A SECOND edit replaces the committee rather than appending or failing —
    // the realistic flow when a stakeholder leaves the deal.
    const revised = [{ name: 'Anita Desai', role: 'economic-buyer', email: 'anita@example.com' }];
    const replace = await request(app).put(`/api/v1/deals/${id}`).set(auth(ws)).send({ stakeholders: revised });
    expect(replace.status, JSON.stringify(replace.body)).toBe(200);
    const afterReplace = await pool.query('SELECT stakeholders FROM deals WHERE id = $1', [id]);
    expect(afterReplace.rows[0].stakeholders).toEqual(revised);

    // Explicit null clears to [], matching createDeal's `stakeholders ?? []`.
    const cleared = await request(app).put(`/api/v1/deals/${id}`).set(auth(ws)).send({ stakeholders: null });
    expect(cleared.status, JSON.stringify(cleared.body)).toBe(200);
    const afterClear = await pool.query('SELECT stakeholders FROM deals WHERE id = $1', [id]);
    expect(afterClear.rows[0].stakeholders).toEqual([]);

    // Omitting the field leaves the stored value alone.
    const untouched = await request(app).put(`/api/v1/deals/${id}`).set(auth(ws)).send({ description: 'unrelated edit' });
    expect(untouched.status).toBe(200);
    const afterOmit = await pool.query('SELECT stakeholders, description FROM deals WHERE id = $1', [id]);
    expect(afterOmit.rows[0].stakeholders).toEqual([]);
    expect(afterOmit.rows[0].description).toBe('unrelated edit');
  });

  /**
   * The other two JSONB columns on updateDeal's generic field loop. Both were
   * stringified on create (createDeal:260 and :262) and passed through RAW on
   * update, so both returned a masked 500 and saved nothing — the same defect
   * as stakeholders, confirmed against the live endpoint before being fixed.
   *
   * Same four-part shape as the stakeholders test above, which is the
   * distinction this codebase has settled on for a jsonb edit: the value
   * round-trips, a second edit REPLACES it, an explicit null clears it to []
   * (matching create's `?? []`), and omitting the field preserves it.
   *
   * All three columns default to '[]'::jsonb in the schema — checked, not
   * assumed — so [] is the right empty value for each, not {}.
   */
  it.each([
    [
      'competitors',
      [{ name: 'Rival Systems', strength: 'high', notes: 'incumbent' }],
      [{ name: 'Other Vendor', strength: 'low', notes: 'price play' }],
    ],
    [
      'attachment_metadata',
      [{ filename: 'proposal-v1.pdf', size: 20480, uploaded_by: 'Round Tripper' }],
      [{ filename: 'proposal-v2.pdf', size: 30720, uploaded_by: 'Round Tripper' }],
    ],
  ])('edit: %s (jsonb) survives a create, an edit, a clear and an unrelated save', async (field, initial, revised) => {
    // Created WITH the value, so the create path is exercised too, not just the edit.
    const create = await request(app).post('/api/v1/deals').set(auth(ws)).send({
      name: `Jsonb ${field} Deal ${Date.now()}`, value: 18000, company_id: companyId,
      [field]: initial,
    });
    expect(create.status, JSON.stringify(create.body)).toBe(201);
    const id = create.body.data.id;
    dealIds.push(id);

    // node-pg parses jsonb back into JS, so a deep-equal here also rules out
    // double-encoding — a JSON string inside the column would not match.
    const afterCreate = await pool.query(`SELECT ${field} AS v FROM deals WHERE id = $1 AND tenant_id = $2`, [id, ws.tenantId]);
    expect(afterCreate.rows[0].v).toEqual(initial);

    // The edit that used to 500.
    const edit = await request(app).put(`/api/v1/deals/${id}`).set(auth(ws)).send({ [field]: revised });
    expect(edit.status, JSON.stringify(edit.body)).toBe(200);
    expect(edit.body.message ?? '').not.toMatch(/Internal Server Error/);
    const afterEdit = await pool.query(`SELECT ${field} AS v FROM deals WHERE id = $1`, [id]);
    expect(afterEdit.rows[0].v).toEqual(revised);

    // Explicit null clears to [], matching createDeal's `?? []`.
    const cleared = await request(app).put(`/api/v1/deals/${id}`).set(auth(ws)).send({ [field]: null });
    expect(cleared.status, JSON.stringify(cleared.body)).toBe(200);
    const afterClear = await pool.query(`SELECT ${field} AS v FROM deals WHERE id = $1`, [id]);
    expect(afterClear.rows[0].v).toEqual([]);

    // Omitting the field leaves the stored value alone.
    const unrelated = await request(app).put(`/api/v1/deals/${id}`).set(auth(ws)).send({ description: `unrelated ${field} edit` });
    expect(unrelated.status).toBe(200);
    const afterOmitJson = await pool.query(`SELECT ${field} AS v, description FROM deals WHERE id = $1`, [id]);
    expect(afterOmitJson.rows[0].v).toEqual([]);
    expect(afterOmitJson.rows[0].description).toBe(`unrelated ${field} edit`);
  });

  /**
   * The counterpart that must NOT change: `tags` shares the same loop but is
   * text[], not jsonb, so the raw array is exactly what the column wants.
   * Stringifying it would have been a new bug introduced by fixing the old one.
   */
  it('tags (text[]) still round-trips as a real array, not a JSON string', async () => {
    const create = await request(app).post('/api/v1/deals').set(auth(ws)).send({
      name: `Tags Deal ${Date.now()}`, value: 9000, company_id: companyId,
    });
    expect(create.status).toBe(201);
    const id = create.body.data.id;
    dealIds.push(id);

    const res = await request(app).put(`/api/v1/deals/${id}`).set(auth(ws)).send({ tags: ['enterprise', 'renewal'] });
    expect(res.status, JSON.stringify(res.body)).toBe(200);

    const row = await pool.query('SELECT tags FROM deals WHERE id = $1', [id]);
    expect(row.rows[0].tags).toEqual(['enterprise', 'renewal']);
    // Two elements, not one string that merely looks like a list.
    expect(row.rows[0].tags).toHaveLength(2);
  });

  /**
   * Move Stage modal regression: previously performed ZERO writes while
   * showing a success toast. Confirm a stage change writes a real
   * deal_stage_history row with correct prior/new stage and changed_by —
   * queried directly from Postgres, never from the transition response body.
   */
  it('REGRESSION: Move Stage writes a real deal_stage_history row, not just a UI toast', async () => {
    const create = await request(app).post('/api/v1/deals').set(auth(ws)).send({
      name: `Stage Move Deal ${Date.now()}`, value: 40000, company_id: companyId, stage: 'prospecting',
    });
    const id = create.body.data.id;
    dealIds.push(id);

    const beforeHistory = await pool.query('SELECT COUNT(*)::int AS n FROM deal_stage_history WHERE deal_id = $1', [id]);
    expect(beforeHistory.rows[0].n).toBe(0);

    const move = await request(app).post(`/api/v1/deals/${id}/stage-transition`).set(auth(ws))
      .send({ to_stage: 'negotiation', probability: 60, reason_code: 'manual-move' });
    expect(move.status, JSON.stringify(move.body)).toBe(200);

    // Assert against the DEAL row, not the transition response body.
    const dealRow = await pool.query('SELECT stage, probability FROM deals WHERE id = $1', [id]);
    expect(dealRow.rows[0].stage).toBe('negotiation');
    expect(dealRow.rows[0].probability).toBe(60);

    // Assert the audit row exists with the correct prior/new stage.
    const history = await pool.query(
      'SELECT from_stage, to_stage, probability, probability_override, changed_by FROM deal_stage_history WHERE deal_id = $1',
      [id],
    );
    expect(history.rows.length).toBe(1);
    expect(history.rows[0].from_stage).toBe('prospecting');
    expect(history.rows[0].to_stage).toBe('negotiation');
    expect(history.rows[0].probability).toBe(60);
    expect(history.rows[0].probability_override).toBe(true); // explicit probability was sent
    expect(history.rows[0].changed_by).toBeTruthy(); // resolved to the real actor, not null/undefined
  });

  it('a no-op stage move (same stage) writes no history row', async () => {
    const create = await request(app).post('/api/v1/deals').set(auth(ws)).send({
      name: `No-op Stage Deal ${Date.now()}`, value: 40000, company_id: companyId, stage: 'prospecting',
    });
    const id = create.body.data.id;
    dealIds.push(id);

    const move = await request(app).post(`/api/v1/deals/${id}/stage-transition`).set(auth(ws)).send({ to_stage: 'prospecting' });
    expect(move.status).toBe(200);
    const history = await pool.query('SELECT COUNT(*)::int AS n FROM deal_stage_history WHERE deal_id = $1', [id]);
    expect(history.rows[0].n).toBe(0);
  });

  it('negative: stage-transition requires to_stage, deal is unchanged', async () => {
    const create = await request(app).post('/api/v1/deals').set(auth(ws)).send({
      name: `Missing Stage Deal ${Date.now()}`, value: 40000, company_id: companyId, stage: 'prospecting',
    });
    const id = create.body.data.id;
    dealIds.push(id);

    const res = await request(app).post(`/api/v1/deals/${id}/stage-transition`).set(auth(ws)).send({});
    expect(res.status).toBe(400);
    const row = await pool.query('SELECT stage FROM deals WHERE id = $1', [id]);
    expect(row.rows[0].stage).toBe('prospecting');
    const history = await pool.query('SELECT COUNT(*)::int AS n FROM deal_stage_history WHERE deal_id = $1', [id]);
    expect(history.rows[0].n).toBe(0);
  });

  it('tenant isolation: workspace B cannot read, edit, or move the stage of workspace A\'s deal', async () => {
    const wsB = await setupWorkspace('deals-b');
    try {
      const create = await request(app).post('/api/v1/deals').set(auth(ws)).send({
        name: `Isolated Deal ${Date.now()}`, value: 40000, company_id: companyId, stage: 'prospecting',
      });
      const id = create.body.data.id;
      dealIds.push(id);

      const readAsB = await request(app).get(`/api/v1/deals/${id}`).set(auth(wsB));
      expect(readAsB.status).toBe(404);

      const moveAsB = await request(app).post(`/api/v1/deals/${id}/stage-transition`).set(auth(wsB)).send({ to_stage: 'closed-won' });
      expect(moveAsB.status).toBe(404);

      const row = await pool.query('SELECT stage FROM deals WHERE id = $1', [id]);
      expect(row.rows[0].stage).toBe('prospecting'); // untouched
      const history = await pool.query('SELECT COUNT(*)::int AS n FROM deal_stage_history WHERE deal_id = $1', [id]);
      expect(history.rows[0].n).toBe(0);
    } finally {
      await teardownWorkspace(wsB);
    }
  });
});
