import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';

/**
 * Round-trip regression suite — manual activity logging.
 *
 * SCOPE, stated precisely so it is not over-read. This file proves the WRITE
 * path of manual activity logging: what the "Log a call / email / meeting"
 * form submits is what Postgres ends up holding, and what it rejects is
 * rejected with the real server-side reason.
 *
 * It does NOT prove the populated activity-timeline RENDER, which HANDOFF.md
 * records as one shared unproven path. That needs real usage data; the
 * project's no-fabricated-data rule forbids seeding rows to force it, and a
 * row this suite creates and deletes inside one run is not usage data.
 * See the reporting note at the end of the session for that gap.
 *
 * Every assertion re-reads Postgres through `pool` — never the response body
 * of the write itself.
 */
describe('Activities (manual logging) — round trip', () => {
  let ws: TestWorkspace;
  let contactId: string;
  let dealId: string;
  const activityIds: string[] = [];

  beforeAll(async () => {
    ws = await setupWorkspace('activities');

    const contact = await request(app).post('/api/v1/contacts').set(auth(ws))
      .send({ first_name: 'Timeline', last_name: 'Owner', email: `timeline.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com` });
    if (contact.status !== 201) throw new Error(`contact fixture failed: ${JSON.stringify(contact.body)}`);
    contactId = contact.body.data.id;

    // `value` is sent explicitly: deals.value is NOT NULL with no default, so
    // omitting it 500s. That defect has its own test in roundTrip.deals.test.ts
    // and must not also break this file's fixtures.
    const deal = await request(app).post('/api/v1/deals').set(auth(ws))
      .send({ name: `Activity Deal ${Date.now()}`, value: 25000 });
    if (deal.status !== 201) throw new Error(`deal fixture failed: ${JSON.stringify(deal.body)}`);
    dealId = deal.body.data.id;
  });

  afterAll(async () => {
    if (activityIds.length) {
      await pool.query('DELETE FROM activities WHERE id = ANY($1::varchar[])', [activityIds]);
      // Cleanup verified by re-counting, not by DELETE returning without error.
      const after = await pool.query(
        'SELECT COUNT(*)::int AS n FROM activities WHERE id = ANY($1::varchar[])', [activityIds]);
      if (after.rows[0].n !== 0) {
        throw new Error(`Cleanup failed: ${after.rows[0].n} test activities remain`);
      }
    }
    await teardownWorkspace(ws);
  });

  /** Count of everything this workspace holds — the guard for every negative case. */
  const activityCount = async (): Promise<number> => {
    const r = await pool.query('SELECT COUNT(*)::int AS n FROM activities WHERE tenant_id = $1', [ws.tenantId]);
    return r.rows[0].n;
  };

  it('log a call against a contact: every submitted field is what Postgres holds', async () => {
    const payload = {
      subject: 'Discovery call with procurement',
      type: 'call',
      direction: 'outbound',
      status: 'completed',
      priority: 'high',
      description: 'Walked through the integration timeline.',
      outcome: 'Positive — asked for a proposal.',
      duration: 45,
      contact_id: contactId,
    };
    const res = await request(app).post('/api/v1/activities').set(auth(ws)).send(payload);
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    const id = res.body.data.id;
    activityIds.push(id);

    const row = await pool.query('SELECT * FROM activities WHERE id = $1 AND tenant_id = $2', [id, ws.tenantId]);
    expect(row.rows[0], 'the activity must actually exist in Postgres').toBeTruthy();
    const a = row.rows[0];
    expect(a.subject).toBe(payload.subject);
    expect(a.type).toBe(payload.type);
    expect(a.direction).toBe(payload.direction);
    expect(a.status).toBe(payload.status);
    expect(a.priority).toBe(payload.priority);
    expect(a.description).toBe(payload.description);
    expect(a.outcome).toBe(payload.outcome);
    expect(a.duration).toBe(payload.duration);
    expect(a.contact_id).toBe(contactId);
    // Exactly one parent — the others must be null, not silently co-populated.
    expect(a.deal_id).toBeNull();
    expect(a.company_id).toBeNull();
    expect(a.lead_id).toBeNull();
  });

  it('created_by resolves to the real actor, never null or "Unknown"', async () => {
    const res = await request(app).post('/api/v1/activities').set(auth(ws))
      .send({ subject: 'Attribution check', type: 'note', contact_id: contactId });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    activityIds.push(res.body.data.id);

    const row = await pool.query('SELECT created_by, assigned_to FROM activities WHERE id = $1', [res.body.data.id]);
    // helpers.ts seeds the workspace admin as Round Tripper.
    expect(row.rows[0].created_by).toBe('Round Tripper');
    expect(row.rows[0].created_by).not.toBe('Unknown');
    // assigned_to defaults to the actor rather than being left null.
    expect(row.rows[0].assigned_to).toBe('Round Tripper');
  });

  it('logging something already done stamps completed_at; a planned activity leaves it null', async () => {
    const done = await request(app).post('/api/v1/activities').set(auth(ws))
      .send({ subject: 'Already-held meeting', type: 'meeting', status: 'completed', deal_id: dealId });
    expect(done.status, JSON.stringify(done.body)).toBe(201);
    activityIds.push(done.body.data.id);

    const doneRow = await pool.query('SELECT status, completed_at FROM activities WHERE id = $1', [done.body.data.id]);
    expect(doneRow.rows[0].status).toBe('completed');
    expect(doneRow.rows[0].completed_at, 'a logged-as-completed activity must carry a time').toBeTruthy();

    const planned = await request(app).post('/api/v1/activities').set(auth(ws))
      .send({ subject: 'Future demo', type: 'demo', status: 'planned', deal_id: dealId });
    expect(planned.status).toBe(201);
    activityIds.push(planned.body.data.id);

    const plannedRow = await pool.query('SELECT status, completed_at FROM activities WHERE id = $1', [planned.body.data.id]);
    expect(plannedRow.rows[0].status).toBe('planned');
    expect(plannedRow.rows[0].completed_at).toBeNull();
  });

  it('status defaults to "planned" and type to "note" when the form omits them', async () => {
    const res = await request(app).post('/api/v1/activities').set(auth(ws))
      .send({ subject: 'Bare minimum note', company_id: null, contact_id: contactId });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    activityIds.push(res.body.data.id);

    const row = await pool.query('SELECT type, status, priority FROM activities WHERE id = $1', [res.body.data.id]);
    expect(row.rows[0].type).toBe('note');
    expect(row.rows[0].status).toBe('planned');
    expect(row.rows[0].priority).toBe('medium');
  });

  it('edit: an update actually persists to the row', async () => {
    const create = await request(app).post('/api/v1/activities').set(auth(ws))
      .send({ subject: 'Original subject', type: 'call', status: 'planned', contact_id: contactId });
    expect(create.status).toBe(201);
    const id = create.body.data.id;
    activityIds.push(id);

    const res = await request(app).put(`/api/v1/activities/${id}`).set(auth(ws))
      .send({ subject: 'Revised subject', status: 'completed', outcome: 'Rescheduled to next week' });
    expect(res.status, JSON.stringify(res.body)).toBe(200);

    const row = await pool.query('SELECT subject, status, outcome FROM activities WHERE id = $1', [id]);
    expect(row.rows[0].subject).toBe('Revised subject');
    expect(row.rows[0].status).toBe('completed');
    expect(row.rows[0].outcome).toBe('Rescheduled to next week');
  });

  // ── Negative cases: nothing saves, and the reason is the real one ──────────

  it('negative: a missing subject is rejected with the real reason, nothing created', async () => {
    const before = await activityCount();
    const res = await request(app).post('/api/v1/activities').set(auth(ws))
      .send({ type: 'call', contact_id: contactId });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/subject is required/);
    expect(res.body.message, 'the real reason, not a swallowed error').not.toMatch(/Internal Server Error/);
    expect(await activityCount()).toBe(before);
  });

  it('negative: an activity with NO parent is refused rather than created as an invisible orphan', async () => {
    const before = await activityCount();
    const res = await request(app).post('/api/v1/activities').set(auth(ws))
      .send({ subject: 'Orphan activity', type: 'note' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/must be linked to exactly one of/);
    expect(await activityCount()).toBe(before);
  });

  it('negative: an activity linked to TWO parents is refused, nothing created', async () => {
    const before = await activityCount();
    const res = await request(app).post('/api/v1/activities').set(auth(ws))
      .send({ subject: 'Two parents', type: 'note', contact_id: contactId, deal_id: dealId });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/exactly one record/);
    // Both offending fields are named. Order follows the controller's PARENTS
    // list, not the order the client sent them, so assert on membership.
    expect(res.body.message).toMatch(/contact_id/);
    expect(res.body.message).toMatch(/deal_id/);
    expect(await activityCount()).toBe(before);
  });

  it.each([
    ['type',      'telepathy',  /type must be one of/],
    ['status',    'half-done',  /status must be one of/],
    ['direction', 'sideways',   /direction must be one of/],
    ['priority',  'whenever',   /priority must be one of/],
  ])('negative: an invalid %s is rejected with the real enum list, nothing created', async (field, bad, pattern) => {
    const before = await activityCount();
    const res = await request(app).post('/api/v1/activities').set(auth(ws))
      .send({ subject: `Invalid ${field}`, contact_id: contactId, [field]: bad });
    expect(res.status, JSON.stringify(res.body)).toBe(400);
    expect(res.body.message).toMatch(pattern);
    expect(res.body.message, 'a generic fallback would hide the real reason').not.toMatch(/Internal Server Error/);
    expect(await activityCount()).toBe(before);
  });

  it('negative: a parent id from another workspace is refused, naming the field without disclosing the row exists', async () => {
    const wsB = await setupWorkspace('activities-foreign');
    try {
      const contactB = await request(app).post('/api/v1/contacts').set(auth(wsB))
        .send({ first_name: 'Foreign', last_name: 'Contact', email: `foreign.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com` });
      expect(contactB.status).toBe(201);

      const before = await activityCount();
      const res = await request(app).post('/api/v1/activities').set(auth(ws))
        .send({ subject: 'Cross-workspace activity', type: 'note', contact_id: contactB.body.data.id });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/contact_id does not name a contact/);
      // Must not reveal that the row exists elsewhere.
      expect(res.body.message).not.toMatch(/another workspace|other tenant|exists/i);
      expect(await activityCount()).toBe(before);
    } finally {
      await pool.query('DELETE FROM contacts WHERE tenant_id = $1', [wsB.tenantId]);
      await teardownWorkspace(wsB);
    }
  });

  it('tenant isolation: workspace B cannot read, list, or edit workspace A\'s activity', async () => {
    const wsB = await setupWorkspace('activities-b');
    try {
      const create = await request(app).post('/api/v1/activities').set(auth(ws))
        .send({ subject: 'Isolated activity', type: 'call', contact_id: contactId });
      expect(create.status).toBe(201);
      const id = create.body.data.id;
      activityIds.push(id);

      const readAsB = await request(app).get(`/api/v1/activities/${id}`).set(auth(wsB));
      expect(readAsB.status).toBe(404);

      const editAsB = await request(app).put(`/api/v1/activities/${id}`).set(auth(wsB)).send({ subject: 'Hijacked' });
      expect(editAsB.status).toBe(404);

      const listAsB = await request(app).get('/api/v1/activities').set(auth(wsB));
      expect(listAsB.status).toBe(200);
      expect(listAsB.body.data.some((x: { id: string }) => x.id === id)).toBe(false);

      // Scope comes from the token and nowhere else: supplying A's tenant_id
      // explicitly must not widen B's view.
      const spoofAsB = await request(app)
        .get(`/api/v1/activities?tenant_id=${ws.tenantId}&contact_id=${contactId}`).set(auth(wsB));
      expect(spoofAsB.status).toBe(200);
      expect(spoofAsB.body.data.some((x: { id: string }) => x.id === id)).toBe(false);

      const row = await pool.query('SELECT subject FROM activities WHERE id = $1', [id]);
      expect(row.rows[0].subject).toBe('Isolated activity'); // untouched by B
    } finally {
      await teardownWorkspace(wsB);
    }
  });
});
