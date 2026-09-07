import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import {
  app, setupWorkspace, teardownWorkspace, auth, addUserWithRole, TestWorkspace,
} from './helpers';

/**
 * Deal ownership as a USER REFERENCE, alongside the legacy name string.
 * Migration 039.
 *
 * WHAT THESE PIN, and why each matters:
 *
 *  1. The API STILL RETURNS `assigned_to` AS A NAME. That is the whole point of
 *     the additive shape — the varchar is not dropped in this migration, so
 *     every existing client keeps working while call sites migrate. This is the
 *     deals.stage -> stage_id precedent, where projecting the old field name
 *     from the new source one phase early is what kept the response stable on
 *     cutover day.
 *
 *  2. A NAME-ONLY WRITE STILL RESOLVES. Several forms submit only a display
 *     name, so the server resolves it. Without this, ownership would silently
 *     stay unresolved for every write from an unmigrated picker — the exact
 *     failure that left 20 of 25 live deals with no owner id.
 *
 *  3. AN UNRESOLVABLE NAME STORES NULL, NOT A GUESS. 15 live deals name "John
 *     Smith", who was never a user. A wrong owner is worse than no owner.
 *
 *  4. AN AMBIGUOUS NAME STORES NULL. Two colleagues sharing a display name must
 *     not have a deal assigned to an arbitrary one of them.
 *
 *  5. TENANT ISOLATION ON THE WRITE. users.id is a global primary key, so an id
 *     from another workspace satisfies the foreign key. Rejected with a 400 that
 *     names the field and does not disclose that the row exists elsewhere.
 *
 *  6. TENANT ISOLATION ON THE READ. Belt and braces, per the project rule that
 *     both halves are needed: the write creates the bad row, the join is what
 *     leaks it.
 */
describe('Deal ownership — user reference (migration 039)', () => {
  let ws: TestWorkspace;
  let other: TestWorkspace;
  let owner: TestWorkspace;
  const dealIds: string[] = [];

  const ownerName = async (id: string) => {
    const r = await pool.query(
      'SELECT first_name || \' \' || last_name AS n FROM users WHERE id = $1', [id]);
    return r.rows[0].n as string;
  };

  const createDeal = (body: Record<string, unknown>, as: TestWorkspace = ws) =>
    request(app).post('/api/v1/deals').set(auth(as)).send({
      name: `Ownership ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      value: 1000, currency: 'USD', stage: 'prospecting', ...body,
    });

  const track = (res: { body: { data?: { id?: string } } }) => {
    const id = res.body?.data?.id;
    if (id) dealIds.push(id);
    return id as string;
  };

  beforeAll(async () => {
    ws = await setupWorkspace('ownership');
    other = await setupWorkspace('ownership-other');
    owner = await addUserWithRole(ws, 'sales');
  });

  afterAll(async () => {
    if (dealIds.length) {
      await pool.query('DELETE FROM deal_stage_history WHERE deal_id = ANY($1::varchar[])', [dealIds]);
      await pool.query('DELETE FROM deals WHERE id = ANY($1::varchar[])', [dealIds]);
      const left = await pool.query(
        'SELECT COUNT(*)::int AS n FROM deals WHERE id = ANY($1::varchar[])', [dealIds]);
      if (left.rows[0].n !== 0) throw new Error(`Cleanup failed: ${left.rows[0].n} deals remain`);
    }
    await teardownWorkspace(other);
    await teardownWorkspace(ws);
  });

  it('an explicit user id is stored, and the response still reports the owner as a NAME', async () => {
    const res = await createDeal({ assigned_to_user_id: Number(owner.userId) });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    const id = track(res);

    const name = await ownerName(owner.userId);
    // THE CONTRACT: a name, not an id, under the same key clients already read.
    expect(res.body.data.assigned_to).toBe(name);
    expect(Number(res.body.data.assigned_to_user_id)).toBe(Number(owner.userId));

    const db = await pool.query('SELECT assigned_to_user_id FROM deals WHERE id = $1', [id]);
    expect(Number(db.rows[0].assigned_to_user_id)).toBe(Number(owner.userId));
  });

  it('a NAME-only write resolves to the user id — unmigrated forms still produce real ownership', async () => {
    const name = await ownerName(owner.userId);
    const res = await createDeal({ assigned_to: name });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    const id = track(res);

    const db = await pool.query(
      'SELECT assigned_to, assigned_to_user_id FROM deals WHERE id = $1', [id]);
    expect(Number(db.rows[0].assigned_to_user_id)).toBe(Number(owner.userId));
    // Dual-write: the legacy string is still recorded, so a rollback of the
    // read path loses nothing.
    expect(db.rows[0].assigned_to).toBe(name);
  });

  it('an unresolvable name stores NULL rather than guessing an owner', async () => {
    // The live-data case: 15 deals name "John Smith", who was never a user.
    const res = await createDeal({ assigned_to: 'Nobody Whatsoever' });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    const id = track(res);

    const db = await pool.query(
      'SELECT assigned_to, assigned_to_user_id FROM deals WHERE id = $1', [id]);
    expect(db.rows[0].assigned_to_user_id).toBeNull();
    expect(db.rows[0].assigned_to).toBe('Nobody Whatsoever');
    // And the response still shows the name, so nothing disappears from the UI.
    expect(res.body.data.assigned_to).toBe('Nobody Whatsoever');
  });

  it('an AMBIGUOUS name stores NULL — two same-named colleagues are not guessed between', async () => {
    const dupName = `Dup Ambiguous${Date.now()}`;
    const [first, last] = dupName.split(' ');
    const mk = () => pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, tenant_id)
       VALUES ($1,'x',$2,$3,'sales',$4) RETURNING id`,
      [`dup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@roundtrip.example`,
       first, last, ws.tenantId]);
    const a = await mk();
    const b = await mk();

    try {
      const res = await createDeal({ assigned_to: dupName });
      expect(res.status, JSON.stringify(res.body)).toBe(201);
      const id = track(res);
      const db = await pool.query('SELECT assigned_to_user_id FROM deals WHERE id = $1', [id]);
      expect(db.rows[0].assigned_to_user_id).toBeNull();
    } finally {
      await pool.query('DELETE FROM users WHERE id = ANY($1::int[])',
        [[a.rows[0].id, b.rows[0].id]]);
    }
  });

  it('a user id from ANOTHER workspace is refused with a 400 naming the field', async () => {
    const res = await createDeal({ assigned_to_user_id: Number(other.userId) });
    expect(res.status, JSON.stringify(res.body)).toBe(400);
    expect(res.body.message).toContain('assigned_to_user_id');
    // Must not disclose that the row exists somewhere else.
    expect(res.body.message).not.toMatch(/other workspace|another workspace|exists/i);
  });

  it('PATCH cannot re-point ownership at another workspace either', async () => {
    const created = await createDeal({});
    const id = track(created);
    const res = await request(app).put(`/api/v1/deals/${id}`).set(auth(ws))
      .send({ assigned_to_user_id: Number(other.userId) });
    expect(res.status, JSON.stringify(res.body)).toBe(400);

    const db = await pool.query('SELECT assigned_to_user_id FROM deals WHERE id = $1', [id]);
    expect(db.rows[0].assigned_to_user_id).toBeNull();
  });

  it('the read join is tenant-scoped: a cross-workspace owner id never renders a name', async () => {
    // Both halves of the project rule are needed — the write creates the bad
    // row, the join is what leaks it. Plant the row directly, bypassing the
    // validated write path, and confirm the read still refuses to resolve it.
    const created = await createDeal({});
    const id = track(created);
    await pool.query('UPDATE deals SET assigned_to_user_id = $1, assigned_to = NULL WHERE id = $2',
      [Number(other.userId), id]);

    const res = await request(app).get(`/api/v1/deals/${id}`).set(auth(ws));
    expect(res.status).toBe(200);
    // The id is still on the row, but no name is projected from it.
    expect(res.body.data.assigned_to).toBeNull();
    expect(res.body.data.assigned_to_email).toBeNull();
  });

  it('an explicit null clears ownership — unassigned is a real state, not an error', async () => {
    const created = await createDeal({ assigned_to_user_id: Number(owner.userId) });
    const id = track(created);

    const res = await request(app).put(`/api/v1/deals/${id}`).set(auth(ws))
      .send({ assigned_to_user_id: null });
    expect(res.status, JSON.stringify(res.body)).toBe(200);

    const db = await pool.query('SELECT assigned_to_user_id FROM deals WHERE id = $1', [id]);
    expect(db.rows[0].assigned_to_user_id).toBeNull();
  });

  it('the owner filter accepts a NAME and matches deals resolved either way', async () => {
    const name = await ownerName(owner.userId);
    // One deal with only the id set, one with only the legacy string.
    const byId = await createDeal({ assigned_to_user_id: Number(owner.userId) });
    const idOnly = track(byId);
    await pool.query('UPDATE deals SET assigned_to = NULL WHERE id = $1', [idOnly]);

    const byName = await createDeal({ assigned_to: 'Legacy Only Person' });
    const nameOnly = track(byName);

    const resolved = await request(app)
      .get(`/api/v1/deals?assigned_to=${encodeURIComponent(name)}`).set(auth(ws));
    expect(resolved.status).toBe(200);
    expect(resolved.body.data.map((d: { id: string }) => d.id)).toContain(idOnly);

    const legacy = await request(app)
      .get('/api/v1/deals?assigned_to=Legacy%20Only%20Person').set(auth(ws));
    expect(legacy.status).toBe(200);
    expect(legacy.body.data.map((d: { id: string }) => d.id)).toContain(nameOnly);
  });
});

/**
 * deals.source vocabulary. Migration 040.
 *
 * The point of these is the ERROR SHAPE as much as the constraint.
 * errorHandler.ts maps no Postgres constraint codes, so without the validator
 * in dealsController a bad source would reach the caller as a bare 500 —
 * the deals.value NOT NULL failure recorded in CLAUDE.md, repeated. The
 * constraint stops the data drifting; the 400 is what a caller can act on.
 */
describe('Deal source vocabulary (migration 040)', () => {
  let ws: TestWorkspace;
  const dealIds: string[] = [];

  const create = (body: Record<string, unknown>) =>
    request(app).post('/api/v1/deals').set(auth(ws)).send({
      name: `Source ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      value: 1000, currency: 'USD', stage: 'prospecting', ...body,
    });

  beforeAll(async () => { ws = await setupWorkspace('dealsource'); });

  afterAll(async () => {
    if (dealIds.length) {
      await pool.query('DELETE FROM deal_stage_history WHERE deal_id = ANY($1::varchar[])', [dealIds]);
      await pool.query('DELETE FROM deals WHERE id = ANY($1::varchar[])', [dealIds]);
      const left = await pool.query(
        'SELECT COUNT(*)::int AS n FROM deals WHERE id = ANY($1::varchar[])', [dealIds]);
      if (left.rows[0].n !== 0) throw new Error(`Cleanup failed: ${left.rows[0].n} deals remain`);
    }
    await teardownWorkspace(ws);
  });

  it('accepts every source the deal form can submit', async () => {
    // The constraint covers what the FORM offers, not what the table happens to
    // hold. If these two ever diverge, this is what fails.
    for (const source of ['lead-gen-apollo', 'lead-gen-zoominfo', 'hrms', 'website',
                          'manual', 'referral', 'event', 'partner', 'inbound',
                          'cold-outreach', 'other']) {
      const res = await create({ source });
      expect(res.status, `${source}: ${JSON.stringify(res.body)}`).toBe(201);
      if (res.body?.data?.id) dealIds.push(res.body.data.id);
      expect(res.body.data.source).toBe(source);
    }
  });

  it('rejects an unknown source with a 400 that names the vocabulary, NOT a 500', async () => {
    const res = await create({ source: 'Cold Outreach' });   // the exact drifted value
    expect(res.status, JSON.stringify(res.body)).toBe(400);
    expect(res.body.message).toContain('source must be one of');
    expect(res.body.message).toContain('cold-outreach');
  });

  it('rejects a drifted source on UPDATE too, and leaves the row alone', async () => {
    const created = await create({ source: 'manual' });
    const id = created.body.data.id;
    dealIds.push(id);

    const res = await request(app).put(`/api/v1/deals/${id}`).set(auth(ws))
      .send({ source: 'MANUAL' });
    expect(res.status, JSON.stringify(res.body)).toBe(400);

    const db = await pool.query('SELECT source FROM deals WHERE id = $1', [id]);
    expect(db.rows[0].source).toBe('manual');
  });

  it('treats an absent or blank source as NULL — unrecorded is a real state', async () => {
    const omitted = await create({});
    expect(omitted.status).toBe(201);
    dealIds.push(omitted.body.data.id);

    const blank = await create({ source: '' });
    expect(blank.status, JSON.stringify(blank.body)).toBe(201);
    dealIds.push(blank.body.data.id);

    // '' normalises to NULL so the same meaning is not split across two values.
    const db = await pool.query(
      'SELECT source FROM deals WHERE id = ANY($1::varchar[])',
      [[omitted.body.data.id, blank.body.data.id]]);
    expect(db.rows.every(r => r.source === null)).toBe(true);
  });

  it('an update that omits source does not clear it', async () => {
    const created = await create({ source: 'referral' });
    const id = created.body.data.id;
    dealIds.push(id);

    const res = await request(app).put(`/api/v1/deals/${id}`).set(auth(ws))
      .send({ name: 'Renamed, source untouched' });
    expect(res.status, JSON.stringify(res.body)).toBe(200);

    const db = await pool.query('SELECT source FROM deals WHERE id = $1', [id]);
    expect(db.rows[0].source).toBe('referral');
  });

  it('the database constraint backstops the validator', async () => {
    // Bypass the API entirely: if the validator were removed, this is what
    // still stops the column drifting.
    await expect(
      pool.query(
        `INSERT INTO deals (name, value, source, tenant_id, stage_id)
         VALUES ('constraint probe', 1, 'Cold Outreach', $1,
                 (SELECT id FROM pipeline_stages WHERE tenant_id = $1 LIMIT 1))`,
        [ws.tenantId]),
    ).rejects.toThrow(/deals_source_check/);
  });
});
