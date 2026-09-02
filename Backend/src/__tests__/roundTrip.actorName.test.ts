import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';

/**
 * Resolved actor name — regression guard.
 *
 * `resolveActorName` returns `first_name + ' ' + last_name`, or the user's
 * email when the row cannot be read. Both name columns are VARCHAR(50) NOT
 * NULL and nothing caps them upstream (authController.register writes the
 * request body straight into the INSERT), so the resolved name reaches exactly
 * 101 characters for an ordinary registration — and the email fallback can
 * reach users.email's 150.
 *
 * Every column that value lands in was too narrow at some point:
 *   documents.uploaded_by     VARCHAR(10)  -> 255  (migration 032)
 *   activities.created_by     VARCHAR(100) -> 255  (migration 034)
 *   activities.assigned_to    VARCHAR(100) -> 255  (migration 034)
 *   tasks.assigned_to         VARCHAR(100) -> 255  (migration 034)
 *   deal_stage_history.changed_by  was already 255
 *
 * Each overflow arrived as "value too long for type character varying(N)",
 * masked by errorHandler as a bare 500. This file drives the maximum-length
 * actor through every one of those write paths, so a future narrowing — or a
 * new actor column sized to today's maximum — fails here instead of in
 * production.
 */
describe('Maximum-length actor name survives every write path', () => {
  let ws: TestWorkspace;
  /** A workspace member at the column maximum: 50 + 1 + 50 = 101 characters. */
  let longActor: { token: string; name: string };
  let contactId: string;
  let dealId: string;

  beforeAll(async () => {
    ws = await setupWorkspace('actor');

    const first = 'A'.repeat(50);
    const last = 'B'.repeat(50);
    const password = 'round-trip-test-password';
    const hash = await bcrypt.hash(password, 10);
    const email = `actor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@roundtrip.example`;
    await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, tenant_id)
       VALUES ($1,$2,$3,$4,'admin',$5)`,
      [email, hash, first, last, ws.tenantId],
    );
    const login = await request(app).post('/api/v1/auth/login').send({ email, password });
    if (login.status !== 200) throw new Error(`long-actor login failed: ${JSON.stringify(login.body)}`);
    longActor = { token: login.body.token, name: `${first} ${last}` };
    expect(longActor.name.length).toBe(101);

    // Parents, created by the ordinary admin.
    const contact = await request(app).post('/api/v1/contacts').set(auth(ws))
      .send({ first_name: 'Actor', last_name: 'Parent', email: `actorparent.${Date.now()}@example.com` });
    if (contact.status !== 201) throw new Error(`contact fixture: ${JSON.stringify(contact.body)}`);
    contactId = contact.body.data.id;

    const deal = await request(app).post('/api/v1/deals').set(auth(ws))
      .send({ name: `Actor Deal ${Date.now()}`, value: 1000, stage: 'prospecting' });
    if (deal.status !== 201) throw new Error(`deal fixture: ${JSON.stringify(deal.body)}`);
    dealId = deal.body.data.id;
  });

  afterAll(async () => {
    await pool.query('DELETE FROM deal_stage_history WHERE tenant_id = $1', [ws.tenantId]);
    for (const t of ['activities', 'documents', 'tasks', 'deals', 'contacts']) {
      await pool.query(`DELETE FROM ${t} WHERE tenant_id = $1`, [ws.tenantId]);
      const left = await pool.query(`SELECT COUNT(*)::int AS n FROM ${t} WHERE tenant_id = $1`, [ws.tenantId]);
      if (left.rows[0].n !== 0) throw new Error(`Cleanup failed: ${left.rows[0].n} rows left in ${t}`);
    }
    await teardownWorkspace(ws);
  });

  const asLongActor = () => ({ Authorization: `Bearer ${longActor.token}` });

  it('the fixture really is at the boundary: 101 characters, above the old 100-wide columns', () => {
    expect(longActor.name.length).toBe(101);
    expect(longActor.name.length).toBeGreaterThan(100);
  });

  it('activities: created_by AND assigned_to both store the full 101 characters', async () => {
    const res = await request(app).post('/api/v1/activities').set(asLongActor())
      .send({ subject: 'Logged by a long-named user', type: 'call', contact_id: contactId });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(res.body.message ?? '').not.toMatch(/Internal Server Error/);

    const row = await pool.query(
      'SELECT created_by, assigned_to FROM activities WHERE id = $1 AND tenant_id = $2',
      [res.body.data.id, ws.tenantId],
    );
    // Stored in full, not truncated to 100 — a silent truncation would show here.
    expect(row.rows[0].created_by).toBe(longActor.name);
    expect(row.rows[0].created_by.length).toBe(101);
    expect(row.rows[0].assigned_to).toBe(longActor.name);
    expect(row.rows[0].assigned_to.length).toBe(101);
  });

  it('tasks: assigned_to stores the full 101 characters', async () => {
    const res = await request(app).post('/api/v1/tasks').set(asLongActor())
      .send({ title: 'Created by a long-named user' });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(res.body.message ?? '').not.toMatch(/Internal Server Error/);

    const row = await pool.query('SELECT assigned_to FROM tasks WHERE id = $1', [res.body.data.id]);
    expect(row.rows[0].assigned_to).toBe(longActor.name);
    expect(row.rows[0].assigned_to.length).toBe(101);
  });

  it('documents: uploaded_by stores the full 101 characters', async () => {
    const res = await request(app).post('/api/v1/documents').set(asLongActor())
      .send({ name: `Uploaded by a long name ${Date.now()}.pdf` });
    expect(res.status, JSON.stringify(res.body)).toBe(201);

    const row = await pool.query('SELECT uploaded_by FROM documents WHERE id = $1', [res.body.data.id]);
    expect(row.rows[0].uploaded_by).toBe(longActor.name);
    expect(row.rows[0].uploaded_by.length).toBe(101);
  });

  it('deal_stage_history: changed_by stores the full 101 characters', async () => {
    const move = await request(app).post(`/api/v1/deals/${dealId}/stage-transition`).set(asLongActor())
      .send({ to_stage: 'negotiation' });
    expect(move.status, JSON.stringify(move.body)).toBe(200);

    const row = await pool.query('SELECT changed_by FROM deal_stage_history WHERE deal_id = $1', [dealId]);
    expect(row.rows.length).toBe(1);
    expect(row.rows[0].changed_by).toBe(longActor.name);
    expect(row.rows[0].changed_by.length).toBe(101);
  });

  it('an explicitly supplied assigned_to is still preferred over the resolved actor', async () => {
    // createActivity writes `assigned_to || actor`, so the caller's choice wins.
    // Worth pinning alongside the width fix: widening must not change who a
    // record is attributed to.
    const res = await request(app).post('/api/v1/activities').set(asLongActor())
      .send({ subject: 'Assigned elsewhere', type: 'note', contact_id: contactId, assigned_to: 'Someone Else' });
    expect(res.status, JSON.stringify(res.body)).toBe(201);

    const row = await pool.query('SELECT created_by, assigned_to FROM activities WHERE id = $1', [res.body.data.id]);
    expect(row.rows[0].created_by).toBe(longActor.name);   // who did it
    expect(row.rows[0].assigned_to).toBe('Someone Else');  // who owns it
  });
});
