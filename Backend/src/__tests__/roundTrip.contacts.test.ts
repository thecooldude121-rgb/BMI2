import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';

/**
 * Round-trip regression suite — Contacts (Prompt C).
 *
 * Guards this project's most repeated failure mode: a 200/201 or a success
 * toast with no real write behind it, or a write that does not match what was
 * submitted. Every assertion here re-reads Postgres directly through `pool`
 * — never the response body of the write itself, never app state.
 */
describe('Contacts — round trip', () => {
  let ws: TestWorkspace;
  const createdIds: string[] = [];

  beforeAll(async () => { ws = await setupWorkspace('contacts'); });

  afterAll(async () => {
    if (createdIds.length) {
      const before = await pool.query(
        'SELECT COUNT(*)::int AS n FROM contacts WHERE id = ANY($1::varchar[])', [createdIds]);
      await pool.query('DELETE FROM contacts WHERE id = ANY($1::varchar[])', [createdIds]);
      const after = await pool.query(
        'SELECT COUNT(*)::int AS n FROM contacts WHERE id = ANY($1::varchar[])', [createdIds]);
      // Cleanup verified by re-counting, not by DELETE returning without error.
      if (after.rows[0].n !== 0) {
        throw new Error(`Cleanup failed: ${after.rows[0].n} of ${before.rows[0].n} test contacts remain`);
      }
    }
    await teardownWorkspace(ws);
  });

  it('create: a real POST creates a row Postgres actually holds, every submitted field intact', async () => {
    const payload = {
      first_name: 'Priya', last_name: 'Nair', email: `priya.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`,
      phone: '+91-98765-43210', position: 'VP Sales', source: 'referral',
      tags: ['enterprise', 'renewal'],
    };
    const res = await request(app).post('/api/v1/contacts').set(auth(ws)).send(payload);
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    const id = res.body.data.id;
    createdIds.push(id);

    const row = await pool.query('SELECT * FROM contacts WHERE id = $1 AND tenant_id = $2', [id, ws.tenantId]);
    expect(row.rows[0], 'row must actually exist in Postgres').toBeTruthy();
    expect(row.rows[0].first_name).toBe(payload.first_name);
    expect(row.rows[0].last_name).toBe(payload.last_name);
    expect(row.rows[0].email).toBe(payload.email);
    expect(row.rows[0].phone).toBe(payload.phone);
    expect(row.rows[0].position).toBe(payload.position);
    expect(row.rows[0].source).toBe(payload.source);
    expect(row.rows[0].tags).toEqual(payload.tags);
  });

  it('negative: missing required fields — nothing is created', async () => {
    const before = await pool.query('SELECT COUNT(*)::int AS n FROM contacts WHERE tenant_id = $1', [ws.tenantId]);
    const res = await request(app).post('/api/v1/contacts').set(auth(ws)).send({ first_name: 'OnlyFirst' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    const after = await pool.query('SELECT COUNT(*)::int AS n FROM contacts WHERE tenant_id = $1', [ws.tenantId]);
    expect(after.rows[0].n).toBe(before.rows[0].n);
  });

  it('edit: buying_role actually persists, and explicit null actually clears it (F25 lesson)', async () => {
    const create = await request(app).post('/api/v1/contacts').set(auth(ws))
      .send({ first_name: 'Rahul', last_name: 'Iyer', email: `rahul.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com` });
    expect(create.status, JSON.stringify(create.body)).toBe(201);
    const id = create.body.data.id;
    createdIds.push(id);

    const setRole = await request(app).put(`/api/v1/contacts/${id}`).set(auth(ws)).send({ buying_role: 'champion' });
    expect(setRole.status, JSON.stringify(setRole.body)).toBe(200);
    const afterSet = await pool.query('SELECT buying_role FROM contacts WHERE id = $1', [id]);
    expect(afterSet.rows[0].buying_role).toBe('champion');

    // Explicit null CLEARS the role — a different operation from omitting the
    // field, which must leave it alone. This distinction is load-bearing per
    // contactsController's own comment.
    const clearRole = await request(app).put(`/api/v1/contacts/${id}`).set(auth(ws)).send({ buying_role: null });
    expect(clearRole.status, JSON.stringify(clearRole.body)).toBe(200);
    const afterClear = await pool.query('SELECT buying_role FROM contacts WHERE id = $1', [id]);
    expect(afterClear.rows[0].buying_role).toBeNull();

    // Omitting the field entirely leaves it alone.
    const setAgain = await request(app).put(`/api/v1/contacts/${id}`).set(auth(ws)).send({ buying_role: 'decision-maker' });
    expect(setAgain.status).toBe(200);
    const noop = await request(app).put(`/api/v1/contacts/${id}`).set(auth(ws)).send({ phone: '+91-90000-00000' });
    expect(noop.status).toBe(200);
    const afterNoop = await pool.query('SELECT buying_role, phone FROM contacts WHERE id = $1', [id]);
    expect(afterNoop.rows[0].buying_role).toBe('decision-maker');
    expect(afterNoop.rows[0].phone).toBe('+91-90000-00000');
  });

  it('negative: an invalid buying_role is rejected with the real reason, row unchanged', async () => {
    const create = await request(app).post('/api/v1/contacts').set(auth(ws))
      .send({ first_name: 'Test', last_name: 'Reject', email: `reject.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`, buying_role: 'champion' });
    const id = create.body.data.id;
    createdIds.push(id);

    const res = await request(app).put(`/api/v1/contacts/${id}`).set(auth(ws)).send({ buying_role: 'not-a-real-role' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    // The real server-side reason, not a generic fallback message.
    expect(res.body.message).toMatch(/buying_role must be null or one of/);

    const row = await pool.query('SELECT buying_role FROM contacts WHERE id = $1', [id]);
    expect(row.rows[0].buying_role).toBe('champion'); // unchanged by the rejected write
  });

  it('negative: tags sent as a delimited string, not an array, is rejected rather than silently mis-stored', async () => {
    // This is the exact shape that made leads.tags become invisible for months
    // per migration 012 — pg would otherwise coerce "a;b" into a one-element array.
    const res = await request(app).post('/api/v1/contacts').set(auth(ws))
      .send({ first_name: 'Bad', last_name: 'Tags', email: `badtags.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`, tags: 'a;b;c' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/tags must be an array/);
  });

  it('negative: a duplicate email in the same workspace is rejected, not silently overwritten', async () => {
    const email = `dup.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;
    const first = await request(app).post('/api/v1/contacts').set(auth(ws))
      .send({ first_name: 'First', last_name: 'One', email });
    expect(first.status, JSON.stringify(first.body)).toBe(201);
    createdIds.push(first.body.data.id);

    const before = await pool.query('SELECT COUNT(*)::int AS n FROM contacts WHERE tenant_id = $1', [ws.tenantId]);

    const second = await request(app).post('/api/v1/contacts').set(auth(ws))
      .send({ first_name: 'Second', last_name: 'Two', email });
    expect(second.status, 'a duplicate email must not return 201').not.toBe(201);
    if (second.status === 201) createdIds.push(second.body.data.id); // safety net only

    const after = await pool.query('SELECT COUNT(*)::int AS n FROM contacts WHERE tenant_id = $1', [ws.tenantId]);
    expect(after.rows[0].n).toBe(before.rows[0].n);

    // And the original row's name must not have been overwritten either.
    const row = await pool.query('SELECT first_name FROM contacts WHERE id = $1', [first.body.data.id]);
    expect(row.rows[0].first_name).toBe('First');
  });

  /**
   * CREATE-VS-UPDATE ASYMMETRY. createContact rejects a blank first_name,
   * last_name or email; updateContact enforced nothing, so an explicit null
   * reached the NOT NULL column as a masked 500 and an empty string stored a
   * genuinely blank name. Same bug shape as companies.size and the deals jsonb
   * columns: validated on create, waved through on update.
   */
  it.each([
    ['first_name', null], ['first_name', ''], ['first_name', '   '],
    ['last_name', null],  ['last_name', ''],
    ['email', null],      ['email', ''],
  ])('negative: blanking %s on update is rejected, the stored row is unchanged', async (field, bad) => {
    const create = await request(app).post('/api/v1/contacts').set(auth(ws))
      .send({ first_name: 'Keep', last_name: 'Me', email: `keep.${field}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com` });
    expect(create.status, JSON.stringify(create.body)).toBe(201);
    const id = create.body.data.id;
    createdIds.push(id);
    const before = await pool.query('SELECT first_name, last_name, email FROM contacts WHERE id = $1', [id]);

    const res = await request(app).put(`/api/v1/contacts/${id}`).set(auth(ws)).send({ [field]: bad });
    expect(res.status, JSON.stringify(res.body)).toBe(400);
    expect(res.body.message).toMatch(new RegExp(`${field} cannot be blank`));
    expect(res.body.message, 'the real reason, not a masked 500').not.toMatch(/Internal Server Error/);

    const after = await pool.query('SELECT first_name, last_name, email FROM contacts WHERE id = $1', [id]);
    expect(after.rows[0]).toEqual(before.rows[0]);
  });

  /**
   * SYMMETRIC masked 500, and the one of the three actually reachable by an
   * ordinary user: editing a contact's email to one a colleague already holds
   * returned "Internal Server Error". Both paths now return 409 with a real
   * message, matching deleteContact's existing 23503 handling — a uniqueness
   * conflict is a legitimate refusal the caller can act on, not a server fault.
   *
   * Handled by catching 23505 rather than pre-checking with a SELECT, so two
   * concurrent requests claiming the same address cannot both pass a
   * check-then-write.
   */
  it('negative: updating a contact to an email another contact holds is a clean 409, both rows unchanged', async () => {
    const stamp = Date.now();
    const takenEmail = `taken.${stamp}@example.com`;
    const ownEmail = `own.${stamp}@example.com`;

    const holder = await request(app).post('/api/v1/contacts').set(auth(ws))
      .send({ first_name: 'Holder', last_name: 'One', email: takenEmail });
    expect(holder.status, JSON.stringify(holder.body)).toBe(201);
    createdIds.push(holder.body.data.id);

    const mover = await request(app).post('/api/v1/contacts').set(auth(ws))
      .send({ first_name: 'Mover', last_name: 'Two', email: ownEmail });
    expect(mover.status).toBe(201);
    const moverId = mover.body.data.id;
    createdIds.push(moverId);

    const res = await request(app).put(`/api/v1/contacts/${moverId}`).set(auth(ws)).send({ email: takenEmail });
    expect(res.status, JSON.stringify(res.body)).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already exists in this workspace/);
    expect(res.body.message, 'the real reason, not a masked 500').not.toMatch(/Internal Server Error/);

    // Neither row moved.
    const moverRow = await pool.query('SELECT email FROM contacts WHERE id = $1', [moverId]);
    expect(moverRow.rows[0].email).toBe(ownEmail);
    const holderRow = await pool.query('SELECT email, first_name FROM contacts WHERE id = $1', [holder.body.data.id]);
    expect(holderRow.rows[0].email).toBe(takenEmail);
    expect(holderRow.rows[0].first_name).toBe('Holder');
  });

  it('a duplicate email on CREATE is the same clean 409, and nothing is created', async () => {
    const email = `dup409.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;
    const first = await request(app).post('/api/v1/contacts').set(auth(ws))
      .send({ first_name: 'First', last_name: 'Holder', email });
    expect(first.status).toBe(201);
    createdIds.push(first.body.data.id);

    const before = await pool.query('SELECT COUNT(*)::int AS n FROM contacts WHERE tenant_id = $1', [ws.tenantId]);
    const res = await request(app).post('/api/v1/contacts').set(auth(ws))
      .send({ first_name: 'Second', last_name: 'Attempt', email });
    expect(res.status, JSON.stringify(res.body)).toBe(409);
    expect(res.body.message).toMatch(/already exists in this workspace/);
    const after = await pool.query('SELECT COUNT(*)::int AS n FROM contacts WHERE tenant_id = $1', [ws.tenantId]);
    expect(after.rows[0].n).toBe(before.rows[0].n);
  });

  it('updating to a genuinely unique new email still works', async () => {
    const stamp = Date.now();
    const create = await request(app).post('/api/v1/contacts').set(auth(ws))
      .send({ first_name: 'Rename', last_name: 'Me', email: `before.${stamp}@example.com` });
    expect(create.status).toBe(201);
    const id = create.body.data.id;
    createdIds.push(id);

    const fresh = `after.${stamp}@example.com`;
    const res = await request(app).put(`/api/v1/contacts/${id}`).set(auth(ws)).send({ email: fresh });
    expect(res.status, JSON.stringify(res.body)).toBe(200);

    const row = await pool.query('SELECT email FROM contacts WHERE id = $1', [id]);
    expect(row.rows[0].email).toBe(fresh);
  });

  it('the SAME email is still free in a different workspace — the constraint is (tenant_id, email)', async () => {
    const email = `shared.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;
    const mine = await request(app).post('/api/v1/contacts').set(auth(ws))
      .send({ first_name: 'Mine', last_name: 'Contact', email });
    expect(mine.status).toBe(201);
    createdIds.push(mine.body.data.id);

    const wsB = await setupWorkspace('contacts-dup-b');
    try {
      const theirs = await request(app).post('/api/v1/contacts').set(auth(wsB))
        .send({ first_name: 'Theirs', last_name: 'Contact', email });
      expect(theirs.status, 'a different workspace may reuse the address').toBe(201);
      await pool.query('DELETE FROM contacts WHERE tenant_id = $1', [wsB.tenantId]);
    } finally {
      await teardownWorkspace(wsB);
    }
  });

  it('tenant isolation: workspace B cannot read or edit workspace A\'s contact', async () => {
    const wsB = await setupWorkspace('contacts-b');
    try {
      const create = await request(app).post('/api/v1/contacts').set(auth(ws))
        .send({ first_name: 'Isolated', last_name: 'Contact', email: `iso.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com` });
      expect(create.status).toBe(201);
      const id = create.body.data.id;
      createdIds.push(id);

      const readAsB = await request(app).get(`/api/v1/contacts/${id}`).set(auth(wsB));
      expect(readAsB.status).toBe(404);

      const editAsB = await request(app).put(`/api/v1/contacts/${id}`).set(auth(wsB)).send({ first_name: 'Hijacked' });
      expect(editAsB.status).toBe(404);

      const listAsB = await request(app).get('/api/v1/contacts').set(auth(wsB));
      expect(listAsB.body.data.some((c: { id: string }) => c.id === id)).toBe(false);

      const row = await pool.query('SELECT first_name FROM contacts WHERE id = $1', [id]);
      expect(row.rows[0].first_name).toBe('Isolated'); // untouched by workspace B's attempt
    } finally {
      await teardownWorkspace(wsB);
    }
  });

  /**
   * external_ref idempotency (migration 046).
   *
   * The failure this guards: Lead Gen POSTs a conversion, BMI2 creates the
   * contact, the response is lost, Lead Gen retries. Before 046 the retry hit
   * contacts_tenant_email_key and came back 409 with no contact id, so the
   * conversion could never be marked done even though the contact existed.
   *
   * Asserted against Postgres directly, not the response body: the point is
   * that ONE row exists, and the response-body id alone cannot show that.
   */
  it('external_ref: a retried create returns the SAME contact and Postgres holds exactly one row', async () => {
    const ref = `prospect-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const payload = {
      first_name: 'Retry', last_name: 'Prospect',
      email: `retry.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`,
      source: 'lead-gen', external_ref: ref,
    };

    const first = await request(app).post('/api/v1/contacts').set(auth(ws)).send(payload);
    expect(first.status, JSON.stringify(first.body)).toBe(201);
    const id = first.body.data.id;
    createdIds.push(id);
    expect(first.body.data.external_ref).toBe(ref);

    // The retry: byte-identical request, as a real retry would be.
    const retry = await request(app).post('/api/v1/contacts').set(auth(ws)).send(payload);
    // 200, not 201 — nothing was created this time, and the caller can tell.
    expect(retry.status, JSON.stringify(retry.body)).toBe(200);
    expect(retry.body.success).toBe(true);
    expect(retry.body.data.id, 'the retry must resolve to the first contact').toBe(id);

    const rows = await pool.query(
      'SELECT id FROM contacts WHERE tenant_id = $1 AND source = $2 AND external_ref = $3',
      [ws.tenantId, 'lead-gen', ref],
    );
    expect(rows.rowCount, 'exactly one row, no duplicate').toBe(1);
    expect(rows.rows[0].id).toBe(id);
  });

  /**
   * The duplicate that WAS reachable before 046: the prospect's email is
   * corrected between the first attempt and the retry, so the email constraint
   * no longer matches and a second contact for one prospect is created.
   * external_ref does not depend on any field a user can edit, so it still
   * recognises the retry.
   */
  it('external_ref: a retry with a changed email is still the same contact, not a second one', async () => {
    const ref = `prospect-moved-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const base = { first_name: 'Moved', last_name: 'Email', source: 'lead-gen', external_ref: ref };

    const first = await request(app).post('/api/v1/contacts').set(auth(ws))
      .send({ ...base, email: `before.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com` });
    expect(first.status, JSON.stringify(first.body)).toBe(201);
    const id = first.body.data.id;
    createdIds.push(id);

    const retry = await request(app).post('/api/v1/contacts').set(auth(ws))
      .send({ ...base, email: `after.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com` });
    expect(retry.status, JSON.stringify(retry.body)).toBe(200);
    expect(retry.body.data.id).toBe(id);

    const rows = await pool.query(
      'SELECT COUNT(*)::int AS n FROM contacts WHERE tenant_id = $1 AND external_ref = $2',
      [ws.tenantId, ref],
    );
    expect(rows.rows[0].n).toBe(1);

    // DO NOTHING, not DO UPDATE: the stored contact is the first one, unchanged.
    const stored = await pool.query('SELECT email FROM contacts WHERE id = $1', [id]);
    expect(stored.rows[0].email).toMatch(/^before\./);
  });

  /**
   * The reason source is in the unique key. Two modules that both number their
   * records from 1 must not collide, or the second module's first conversion
   * would be handed the first module's contact.
   */
  it('external_ref: the same ref from a different source is a different contact', async () => {
    const ref = `shared-id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const stamp = `${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;

    const fromLeadGen = await request(app).post('/api/v1/contacts').set(auth(ws))
      .send({ first_name: 'From', last_name: 'LeadGen', email: `lg.${stamp}@example.com`, source: 'lead-gen', external_ref: ref });
    expect(fromLeadGen.status, JSON.stringify(fromLeadGen.body)).toBe(201);
    createdIds.push(fromLeadGen.body.data.id);

    const fromHrms = await request(app).post('/api/v1/contacts').set(auth(ws))
      .send({ first_name: 'From', last_name: 'Hrms', email: `hr.${stamp}@example.com`, source: 'hrms', external_ref: ref });
    expect(fromHrms.status, 'a different source reusing the id is a genuine new contact').toBe(201);
    createdIds.push(fromHrms.body.data.id);

    expect(fromHrms.body.data.id).not.toBe(fromLeadGen.body.data.id);
    const rows = await pool.query(
      'SELECT COUNT(*)::int AS n FROM contacts WHERE tenant_id = $1 AND external_ref = $2', [ws.tenantId, ref]);
    expect(rows.rows[0].n).toBe(2);
  });

  it('external_ref: two workspaces may use the same ref without colliding', async () => {
    const wsB = await setupWorkspace('contacts-extref-b');
    try {
      const ref = `cross-ws-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const stamp = `${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
      const body = (p: string) => ({
        first_name: 'Cross', last_name: 'Workspace', email: `${p}.${stamp}@example.com`,
        source: 'lead-gen', external_ref: ref,
      });

      const inA = await request(app).post('/api/v1/contacts').set(auth(ws)).send(body('a'));
      expect(inA.status, JSON.stringify(inA.body)).toBe(201);
      createdIds.push(inA.body.data.id);

      const inB = await request(app).post('/api/v1/contacts').set(auth(wsB)).send(body('b'));
      expect(inB.status, JSON.stringify(inB.body)).toBe(201);
      expect(inB.body.data.id).not.toBe(inA.body.data.id);
    } finally {
      await teardownWorkspace(wsB);
    }
  });

  it('external_ref: concurrent retries still produce exactly one contact', async () => {
    const ref = `concurrent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const payload = {
      first_name: 'Concurrent', last_name: 'Retry',
      email: `conc.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`,
      source: 'lead-gen', external_ref: ref,
    };

    // Fired together, as a client retrying while the first attempt is still in
    // flight would. A check-then-insert would let both pass the check.
    const results = await Promise.all(
      Array.from({ length: 4 }, () => request(app).post('/api/v1/contacts').set(auth(ws)).send(payload)),
    );

    const rows = await pool.query(
      'SELECT id FROM contacts WHERE tenant_id = $1 AND source = $2 AND external_ref = $3',
      [ws.tenantId, 'lead-gen', ref],
    );
    expect(rows.rowCount, 'exactly one contact from four concurrent attempts').toBe(1);
    const id = rows.rows[0].id;
    createdIds.push(id);

    for (const r of results) {
      expect([200, 201], `unexpected ${r.status}: ${JSON.stringify(r.body)}`).toContain(r.status);
      expect(r.body.data.id, 'every concurrent caller learns the same contact id').toBe(id);
    }
    expect(results.filter(r => r.status === 201), 'exactly one caller created it').toHaveLength(1);
  });

  it('external_ref: rejected without a source, since a ref alone could never dedup', async () => {
    const email = `noSource.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;
    const res = await request(app).post('/api/v1/contacts').set(auth(ws))
      .send({ first_name: 'No', last_name: 'Source', email, external_ref: 'ref-without-source' });
    expect(res.status, JSON.stringify(res.body)).toBe(400);
    expect(res.body.message).toMatch(/external_ref requires source/);
    expect(res.body.message, 'the real reason, not a masked 500').not.toMatch(/Internal Server Error/);

    const rows = await pool.query('SELECT COUNT(*)::int AS n FROM contacts WHERE email = $1', [email]);
    expect(rows.rows[0].n, 'nothing created').toBe(0);
  });

  it('external_ref: a blank or over-long ref is a 400, not a stored value that can never match', async () => {
    for (const bad of ['   ', 'x'.repeat(101)]) {
      const email = `badref.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;
      const res = await request(app).post('/api/v1/contacts').set(auth(ws))
        .send({ first_name: 'Bad', last_name: 'Ref', email, source: 'lead-gen', external_ref: bad });
      expect(res.status, JSON.stringify(res.body)).toBe(400);
      expect(res.body.message).toMatch(/external_ref must be/);

      const rows = await pool.query('SELECT COUNT(*)::int AS n FROM contacts WHERE email = $1', [email]);
      expect(rows.rows[0].n, 'nothing created').toBe(0);
    }
  });

  /**
   * The pre-046 behaviour must survive unchanged: the index is partial on
   * external_ref IS NOT NULL, so for every caller that sends no ref the
   * ON CONFLICT clause can never fire and a duplicate email is still a 409.
   */
  it('external_ref: contacts without one are unaffected — duplicate email is still a 409', async () => {
    const email = `stillConflicts.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;
    const first = await request(app).post('/api/v1/contacts').set(auth(ws))
      .send({ first_name: 'Plain', last_name: 'One', email });
    expect(first.status, JSON.stringify(first.body)).toBe(201);
    createdIds.push(first.body.data.id);
    expect(first.body.data.external_ref, 'no ref sent, none invented').toBeNull();

    const second = await request(app).post('/api/v1/contacts').set(auth(ws))
      .send({ first_name: 'Plain', last_name: 'Two', email });
    expect(second.status, JSON.stringify(second.body)).toBe(409);
    expect(second.body.message).toMatch(/already exists in this workspace/);

    const rows = await pool.query('SELECT COUNT(*)::int AS n FROM contacts WHERE email = $1', [email]);
    expect(rows.rows[0].n).toBe(1);
  });

  /**
   * A new external_ref whose email is already taken is a REAL conflict — a
   * different prospect that happens to share an address with an existing
   * contact — and must stay a 409. Returning the existing contact there would
   * silently bind Lead Gen's new prospect to someone else's record.
   */
  it('external_ref: a new ref with an already-taken email is still a 409', async () => {
    const email = `taken409.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;
    const holder = await request(app).post('/api/v1/contacts').set(auth(ws))
      .send({ first_name: 'Holder', last_name: 'Ofmail', email });
    expect(holder.status, JSON.stringify(holder.body)).toBe(201);
    createdIds.push(holder.body.data.id);

    const res = await request(app).post('/api/v1/contacts').set(auth(ws)).send({
      first_name: 'Different', last_name: 'Prospect', email,
      source: 'lead-gen', external_ref: `fresh-${Date.now()}`,
    });
    expect(res.status, JSON.stringify(res.body)).toBe(409);
    expect(res.body.message).toMatch(/already exists in this workspace/);
    expect(res.body.message, 'the real reason, not a masked 500').not.toMatch(/Internal Server Error/);
  });

  it('external_ref: PUT cannot repoint it, so a later retry still finds its contact', async () => {
    const ref = `immutable-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const create = await request(app).post('/api/v1/contacts').set(auth(ws)).send({
      first_name: 'Immutable', last_name: 'Ref',
      email: `imm.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`,
      source: 'lead-gen', external_ref: ref,
    });
    expect(create.status, JSON.stringify(create.body)).toBe(201);
    const id = create.body.data.id;
    createdIds.push(id);

    const edit = await request(app).put(`/api/v1/contacts/${id}`).set(auth(ws))
      .send({ first_name: 'Edited', external_ref: 'hijacked' });
    expect(edit.status, JSON.stringify(edit.body)).toBe(200);

    const row = await pool.query('SELECT first_name, external_ref FROM contacts WHERE id = $1', [id]);
    expect(row.rows[0].first_name, 'the writable field did change').toBe('Edited');
    expect(row.rows[0].external_ref, 'the ref did not').toBe(ref);
  });
});
