import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';

/**
 * MEETING AGENT — notes, their tasks, and pushing them to a deal or account.
 * Migration 049.
 *
 * WHAT THESE PIN, hardest first:
 *  1. THE POLYMORPHIC REFERENCE IS CONSTRAINED ON BOTH HALVES. A bogus type is
 *     refused by the API and by the DATABASE; an id belonging to another
 *     workspace is refused with the field-naming 400 that discloses nothing.
 *     This is the third occurrence of the pattern, so the constraint is tested
 *     at both layers rather than trusted at one.
 *  2. An activity created from a meeting lands in `activities` on the RELATED
 *     record, which is the whole reason activities were chosen over
 *     `action_items` — a test reads it back through the deal's own feed.
 *  3. Nothing is inferred from note text. Notes containing obvious "action
 *     item" phrasing produce ZERO activities until the user asks.
 *  4. Every stored value is read back from Postgres, not from the response.
 */
describe('Meetings — notes, tasks and pushing to a deal or account', () => {
  let ws: TestWorkspace;
  let other: TestWorkspace;
  let dealId: string;
  let companyId: string;
  let theirDealId: string;

  const post = (as: TestWorkspace, body: Record<string, unknown>) =>
    request(app).post('/api/v1/meetings').set(auth(as)).send(body);

  const stored = async (id: string) => (await pool.query(
    'SELECT * FROM meetings WHERE id = $1 AND tenant_id = $2', [id, ws.tenantId])).rows[0];

  const makeCompany = async (w: TestWorkspace, name: string) => {
    const r = await request(app).post('/api/v1/companies').set(auth(w)).send({ name });
    if (r.status >= 300) throw new Error(`company fixture: ${JSON.stringify(r.body)}`);
    return r.body.data.id as string;
  };

  const makeDeal = async (w: TestWorkspace, name: string) => {
    const r = await request(app).post('/api/v1/deals').set(auth(w))
      .send({ name, value: 1000, stage: 'prospecting' });
    if (r.status >= 300) throw new Error(`deal fixture: ${JSON.stringify(r.body)}`);
    return r.body.data.id as string;
  };

  beforeAll(async () => {
    ws = await setupWorkspace('meetings');
    other = await setupWorkspace('meetings-other');
    companyId = await makeCompany(ws, 'RT Meetings Co');
    dealId = await makeDeal(ws, 'RT Meetings Deal');
    theirDealId = await makeDeal(other, 'RT Meetings Their Deal');
  });

  afterAll(async () => {
    const tenants = [ws.tenantId, other.tenantId];
    await pool.query('DELETE FROM meetings WHERE tenant_id = ANY($1::uuid[])', [tenants]);
    const left = await pool.query(
      'SELECT COUNT(*)::int AS n FROM meetings WHERE tenant_id = ANY($1::uuid[])', [tenants]);
    if (left.rows[0].n !== 0) throw new Error(`Cleanup failed: ${left.rows[0].n} meetings remain`);
    await teardownWorkspace(other);
    await teardownWorkspace(ws);
  });

  // ── 1. The relation, both halves ─────────────────────────────────────────

  it('creates a meeting with no relation at all — not yet pushed anywhere', async () => {
    const res = await post(ws, { title: 'Discovery call', notes: 'They use three tools today.' });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    const row = await stored(res.body.data.id);
    expect(row.related_to_type).toBeNull();
    expect(row.related_to_id).toBeNull();
    expect(row.notes).toBe('They use three tools today.');
    // The owner is the authenticated user's id, never a name.
    expect(Number(row.owner_id)).toBe(Number(ws.userId));
  });

  it('refuses an unknown related_to_type by name', async () => {
    const res = await post(ws, { title: 'x', related_to_type: 'employee', related_to_id: '1' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/related_to_type must be one of/);
    // 'employee' is absent deliberately, unlike tasks: employees has no
    // tenant_id and belongs to HRMS.
    expect(res.body.message).not.toContain('employee');
  });

  it('refuses a related_to_id from ANOTHER workspace, naming only the field', async () => {
    const res = await post(ws, { title: 'x', related_to_type: 'deal', related_to_id: theirDealId });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('related_to_id does not name a deal in this workspace');
    // Never discloses that the row exists elsewhere.
    expect(JSON.stringify(res.body)).not.toContain('Their Deal');
  });

  it('refuses a type with no id, and an id with no type', async () => {
    const a = await post(ws, { title: 'x', related_to_type: 'deal' });
    expect(a.status).toBe(400);
    expect(a.body.message).toMatch(/related_to_id is required/);

    const b = await post(ws, { title: 'x', related_to_id: dealId });
    expect(b.status).toBe(400);
    expect(b.body.message).toMatch(/related_to_type must be one of/);
  });

  it('THE DATABASE refuses a bogus type too, not only the API', async () => {
    // Migration 049's CHECK. The API guard can be bypassed by hand-written SQL
    // or a future writer; this is the layer that cannot.
    await expect(pool.query(
      `INSERT INTO meetings (id, title, related_to_type, related_to_id, tenant_id)
       VALUES ('MTGX1', 'x', 'employee', '1', $1)`,
      [ws.tenantId],
    )).rejects.toThrow(/meetings_related_to_type_check/);
  });

  it('THE DATABASE refuses a half-set pair', async () => {
    await expect(pool.query(
      `INSERT INTO meetings (id, title, related_to_type, related_to_id, tenant_id)
       VALUES ('MTGX2', 'x', 'deal', NULL, $1)`,
      [ws.tenantId],
    )).rejects.toThrow(/meetings_related_to_pair_check/);
  });

  // ── 2. The push-to-deal action ───────────────────────────────────────────

  it('pushes a meeting to a deal, and to an account, through its own endpoint', async () => {
    const made = await post(ws, { title: 'Pushable' });
    const id = made.body.data.id;

    const toDeal = await request(app).put(`/api/v1/meetings/${id}/relation`).set(auth(ws))
      .send({ related_to_type: 'deal', related_to_id: dealId });
    expect(toDeal.status, JSON.stringify(toDeal.body)).toBe(200);
    expect((await stored(id)).related_to_id).toBe(dealId);

    const toAccount = await request(app).put(`/api/v1/meetings/${id}/relation`).set(auth(ws))
      .send({ related_to_type: 'company', related_to_id: companyId });
    expect(toAccount.status).toBe(200);
    const row = await stored(id);
    expect(row.related_to_type).toBe('company');
    expect(row.related_to_id).toBe(companyId);
  });

  it('the push endpoint validates the target, and a rejected push changes nothing', async () => {
    const made = await post(ws, { title: 'Guarded', related_to_type: 'deal', related_to_id: dealId });
    const id = made.body.data.id;
    const res = await request(app).put(`/api/v1/meetings/${id}/relation`).set(auth(ws))
      .send({ related_to_type: 'deal', related_to_id: theirDealId });
    expect(res.status).toBe(400);
    expect((await stored(id)).related_to_id).toBe(dealId);
  });

  it('clearing the relation sets BOTH columns null, never one', async () => {
    const made = await post(ws, { title: 'Clearable', related_to_type: 'deal', related_to_id: dealId });
    const id = made.body.data.id;
    const res = await request(app).put(`/api/v1/meetings/${id}/relation`).set(auth(ws))
      .send({ related_to_type: null });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    const row = await stored(id);
    expect(row.related_to_type).toBeNull();
    expect(row.related_to_id).toBeNull();
  });

  it('PATCH cannot move the relation — that is the push endpoint\'s job alone', async () => {
    const made = await post(ws, { title: 'Patchable', related_to_type: 'deal', related_to_id: dealId });
    const id = made.body.data.id;
    const res = await request(app).patch(`/api/v1/meetings/${id}`).set(auth(ws))
      .send({ related_to_type: 'company', related_to_id: companyId, notes: 'edited' });
    expect(res.status).toBe(200);
    const row = await stored(id);
    expect(row.notes).toBe('edited');
    // The relation is untouched: one write path for the field that needs the
    // ownership check.
    expect(row.related_to_type).toBe('deal');
    expect(row.related_to_id).toBe(dealId);
  });

  // ── 3. Activities from a note ────────────────────────────────────────────

  it('turns a chosen line into a real activity ON THE DEAL, readable from the deal\'s own feed', async () => {
    const made = await post(ws, {
      title: 'Pricing call', related_to_type: 'deal', related_to_id: dealId,
      notes: 'They want a revised quote and an intro to security.',
    });
    const id = made.body.data.id;

    const res = await request(app).post(`/api/v1/meetings/${id}/activities`).set(auth(ws))
      .send({ subject: 'Send revised quote', type: 'task' });
    expect(res.status, JSON.stringify(res.body)).toBe(201);

    // THE POINT OF CHOOSING activities OVER action_items: it is on the deal.
    const onDeal = await pool.query(
      'SELECT subject, type, deal_id, description FROM activities WHERE tenant_id = $1 AND deal_id = $2',
      [ws.tenantId, dealId]);
    expect(onDeal.rows.map(r => r.subject)).toContain('Send revised quote');
    const row = onDeal.rows.find(r => r.subject === 'Send revised quote');
    expect(row.type).toBe('task');
    // Provenance survives, so the activity can be traced to its meeting even
    // though `activities` has no meeting_id column.
    expect(row.description).toContain(`From meeting ${id}`);
    expect(row.description).toContain('Pricing call');

    await pool.query('DELETE FROM activities WHERE tenant_id = $1', [ws.tenantId]);
  });

  it('attaches to the ACCOUNT when the meeting is pushed to a company', async () => {
    const made = await post(ws, {
      title: 'Account review', related_to_type: 'company', related_to_id: companyId,
    });
    const res = await request(app).post(`/api/v1/meetings/${made.body.data.id}/activities`)
      .set(auth(ws)).send({ subject: 'Schedule QBR' });
    expect(res.status).toBe(201);

    const onCompany = await pool.query(
      'SELECT subject, company_id, deal_id, type FROM activities WHERE tenant_id = $1', [ws.tenantId]);
    expect(onCompany.rows).toHaveLength(1);
    expect(onCompany.rows[0].company_id).toBe(companyId);
    expect(onCompany.rows[0].deal_id).toBeNull();
    // Default type is the least-claiming one.
    expect(onCompany.rows[0].type).toBe('note');

    await pool.query('DELETE FROM activities WHERE tenant_id = $1', [ws.tenantId]);
  });

  it('REFUSES to create an activity for an unlinked meeting, and says why', async () => {
    const made = await post(ws, { title: 'Unlinked', notes: 'Follow up next week.' });
    const res = await request(app).post(`/api/v1/meetings/${made.body.data.id}/activities`)
      .set(auth(ws)).send({ subject: 'Follow up' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Link this meeting to a deal, account, contact or lead first/);

    const none = await pool.query(
      'SELECT COUNT(*)::int AS n FROM activities WHERE tenant_id = $1', [ws.tenantId]);
    expect(none.rows[0].n).toBe(0);
  });

  it('NOTHING is inferred from note text — an action-item-shaped note creates nothing', async () => {
    // The explicit non-feature. A note full of obvious TODO phrasing must
    // produce zero activities until a user asks for one, because extraction is
    // Phase 2 and a heuristic here would be exactly the fabrication this
    // project keeps removing.
    const made = await post(ws, {
      title: 'Full of action items',
      related_to_type: 'deal', related_to_id: dealId,
      notes: 'ACTION: send the quote. TODO: book a demo. Next steps: call security. Follow up Friday.',
    });
    expect(made.status).toBe(201);
    const after = await pool.query(
      'SELECT COUNT(*)::int AS n FROM activities WHERE tenant_id = $1', [ws.tenantId]);
    expect(after.rows[0].n).toBe(0);

    // ...and editing the note in does not either.
    await request(app).patch(`/api/v1/meetings/${made.body.data.id}`).set(auth(ws))
      .send({ notes: 'ACTION: something else entirely.' });
    const still = await pool.query(
      'SELECT COUNT(*)::int AS n FROM activities WHERE tenant_id = $1', [ws.tenantId]);
    expect(still.rows[0].n).toBe(0);
  });

  it('validates the activity subject, type and status rather than storing junk', async () => {
    const made = await post(ws, { title: 'V', related_to_type: 'deal', related_to_id: dealId });
    const id = made.body.data.id;
    const base = () => request(app).post(`/api/v1/meetings/${id}/activities`).set(auth(ws));

    expect((await base().send({})).status).toBe(400);
    expect((await base().send({ subject: '   ' })).status).toBe(400);
    expect((await base().send({ subject: 'x', type: 'telepathy' })).status).toBe(400);
    expect((await base().send({ subject: 'x', status: 'maybe' })).status).toBe(400);

    const none = await pool.query(
      'SELECT COUNT(*)::int AS n FROM activities WHERE tenant_id = $1', [ws.tenantId]);
    expect(none.rows[0].n).toBe(0);
  });

  // ── 4. Reading it back ───────────────────────────────────────────────────

  it('GET /meetings/:id carries the meeting, its tasks and its activities', async () => {
    const made = await post(ws, {
      title: 'Readback', related_to_type: 'deal', related_to_id: dealId, notes: 'n',
    });
    const id = made.body.data.id;

    const task = await request(app).post('/api/v1/tasks').set(auth(ws)).send({
      title: 'Prepare the quote', related_to_type: 'deal', related_to_id: dealId,
    });
    expect(task.status, JSON.stringify(task.body)).toBe(201);

    await request(app).post(`/api/v1/meetings/${id}/activities`).set(auth(ws))
      .send({ subject: 'Logged from the note' });

    const res = await request(app).get(`/api/v1/meetings/${id}`).set(auth(ws));
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.data.title).toBe('Readback');
    expect(res.body.data.owner_name).toBeTruthy();
    expect(res.body.data.tasks.map((t: { title: string }) => t.title)).toContain('Prepare the quote');
    expect(res.body.data.activities.map((a: { subject: string }) => a.subject)).toContain('Logged from the note');

    await pool.query('DELETE FROM activities WHERE tenant_id = $1', [ws.tenantId]);
    await pool.query('DELETE FROM tasks WHERE tenant_id = $1', [ws.tenantId]);
  });

  it('GET /meetings filters by related record, and never crosses workspaces', async () => {
    const res = await request(app)
      .get(`/api/v1/meetings?related_to_type=deal&related_to_id=${dealId}`).set(auth(ws));
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    for (const m of res.body.data) expect(m.related_to_id).toBe(dealId);

    // The other workspace sees none of ours, even asking for our deal by id.
    const theirs = await request(app)
      .get(`/api/v1/meetings?related_to_type=deal&related_to_id=${dealId}`).set(auth(other));
    expect(theirs.status).toBe(200);
    expect(theirs.body.data).toHaveLength(0);
  });

  it('a meeting from another workspace is a 404, and cannot be patched', async () => {
    const mine = await post(ws, { title: 'Mine' });
    const id = mine.body.data.id;
    expect((await request(app).get(`/api/v1/meetings/${id}`).set(auth(other))).status).toBe(404);
    expect((await request(app).patch(`/api/v1/meetings/${id}`).set(auth(other)).send({ notes: 'x' })).status).toBe(404);
    expect((await stored(id)).notes).toBeNull();
  });

  it('refuses a blank title on update and an absurd duration on create', async () => {
    const made = await post(ws, { title: 'Keep me' });
    const blank = await request(app).patch(`/api/v1/meetings/${made.body.data.id}`)
      .set(auth(ws)).send({ title: '   ' });
    expect(blank.status).toBe(400);
    expect((await stored(made.body.data.id)).title).toBe('Keep me');

    expect((await post(ws, { title: 'x', duration: 5000 })).status).toBe(400);
  });

  it('uses the DEPLOYED type vocabulary, and stores no type when none is given', async () => {
    // The live CHECK allows exactly sales-call | internal | client-meeting.
    // The first draft of this module invented a different list and every
    // create 500'd.
    const ok = await post(ws, { title: 'Typed', type: 'client-meeting' });
    expect(ok.status, JSON.stringify(ok.body)).toBe(201);
    expect((await stored(ok.body.data.id)).type).toBe('client-meeting');

    const bad = await post(ws, { title: 'Bad type', type: 'video' });
    expect(bad.status).toBe(400);
    expect(bad.body.message).toMatch(/sales-call/);

    // Omitted stays NULL rather than being classified on the caller's behalf.
    const none = await post(ws, { title: 'Untyped' });
    expect(none.status).toBe(201);
    expect((await stored(none.body.data.id)).type).toBeNull();
  });

  it('requires authentication', async () => {
    expect((await request(app).get('/api/v1/meetings')).status).toBe(401);
    expect((await request(app).post('/api/v1/meetings').send({ title: 'x' })).status).toBe(401);
  });
});
