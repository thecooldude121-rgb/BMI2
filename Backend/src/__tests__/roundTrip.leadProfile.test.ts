import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';

/**
 * Migration 063 — lead profile fields (Group A item 1). Each write is checked
 * against the ROW in Postgres, not the response alone (lesson 10), and every
 * bad value must be a 400 naming the field, never the masked 500 a raw
 * constraint / overflow error becomes.
 */
describe('Lead profile fields (migration 063)', () => {
  let ws: TestWorkspace;
  let other: TestWorkspace;
  let leadId: number;

  beforeAll(async () => {
    ws = await setupWorkspace('leadprofile');
    other = await setupWorkspace('leadprofile-other');
  });
  afterAll(async () => { await teardownWorkspace(ws); await teardownWorkspace(other); });

  const row = async (id: number) =>
    (await pool.query('SELECT * FROM leads WHERE id = $1 AND tenant_id = $2', [id, ws.tenantId])).rows[0];

  it('create stores every profile field, with the value and an upper-cased currency', async () => {
    const res = await request(app).post('/api/v1/leads').set(auth(ws)).send({
      first_name: 'Amina', last_name: 'Farsi', email: 'amina@profile.example', company: 'GulfAxis',
      mobile: ' +971 50 000 0000 ', website: 'gulfaxis.example', linkedin_url: 'linkedin.com/in/amina',
      city: 'Dubai', country: 'United Arab Emirates', company_size: '1000+', department: 'IT',
      source_detail: 'Enterprise security page', priority: 'high', value: 2200000, currency: 'inr',
      utm_source: 'linkedin', utm_medium: 'paid-social', utm_campaign: 'mea-security-q4', referral_contact: 'Rohan Mehta',
    });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    leadId = res.body.data.id;
    const r = await row(leadId);
    expect(r).toMatchObject({
      mobile: '+971 50 000 0000', website: 'gulfaxis.example', linkedin_url: 'linkedin.com/in/amina',
      city: 'Dubai', country: 'United Arab Emirates', company_size: '1000+', department: 'IT',
      source_detail: 'Enterprise security page', priority: 'high', currency: 'INR',
      utm_source: 'linkedin', utm_medium: 'paid-social', utm_campaign: 'mea-security-q4', referral_contact: 'Rohan Mehta',
    });
    expect(Number(r.value)).toBe(2200000);
  });

  it('a create that omits them leaves every profile column NULL — nothing is defaulted', async () => {
    const res = await request(app).post('/api/v1/leads').set(auth(ws)).send({ first_name: 'Bare', email: 'bare@profile.example' });
    expect(res.status).toBe(201);
    const r = await row(res.body.data.id);
    for (const c of ['mobile', 'website', 'city', 'country', 'company_size', 'priority', 'currency', 'department']) {
      expect(r[c], c).toBeNull();
    }
  });

  it('update changes only what is sent; a blank string CLEARS a field to NULL (not "")', async () => {
    const res = await request(app).put(`/api/v1/leads/${leadId}`).set(auth(ws)).send({ city: 'Abu Dhabi', mobile: '  ', priority: 'low' });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    const r = await row(leadId);
    expect(r.city).toBe('Abu Dhabi');
    expect(r.mobile).toBeNull();
    expect(r.priority).toBe('low');
    expect(r.country).toBe('United Arab Emirates');   // untouched
    expect(r.company_size).toBe('1000+');
  });

  it.each([
    ['an unknown company size', { company_size: '5000-10000' }, /company_size must be one of/],
    ['an unknown priority', { priority: 'urgent' }, /priority must be one of/],
    ['a bad currency', { currency: 'RUPEES' }, /currency must be a three-letter code/],
    ['a negative value', { value: -5 }, /value must be a number of zero or more/],
    ['a non-numeric value', { value: 'lots' }, /value must be a number/],
    ['an over-long city', { city: 'x'.repeat(101) }, /city must be at most 100 characters/],
    ['a non-text mobile', { mobile: 12345 }, /mobile must be text/],
  ])('update REFUSES %s with a 400 naming the field — and writes nothing', async (_l, body, msg) => {
    const before = await row(leadId);
    const res = await request(app).put(`/api/v1/leads/${leadId}`).set(auth(ws)).send(body);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(msg);
    const after = await row(leadId);
    expect(after.updated_at.toISOString()).toBe(before.updated_at.toISOString());
  });

  it('create refuses a bad field the same way (400, no row)', async () => {
    const res = await request(app).post('/api/v1/leads').set(auth(ws)).send({ first_name: 'X', email: 'x@profile.example', company_size: 'huge' });
    expect(res.status).toBe(400);
    const n = (await pool.query('SELECT count(*)::int AS n FROM leads WHERE email = $1 AND tenant_id = $2', ['x@profile.example', ws.tenantId])).rows[0].n;
    expect(n).toBe(0);
  });

  it('another workspace cannot edit the lead — 404, and the row is unchanged', async () => {
    const res = await request(app).put(`/api/v1/leads/${leadId}`).set(auth(other)).send({ city: 'Hijacked' });
    expect(res.status).toBe(404);
    expect((await row(leadId)).city).toBe('Abu Dhabi');
  });

  it('GET /leads/:id returns the new fields', async () => {
    const res = await request(app).get(`/api/v1/leads/${leadId}`).set(auth(ws));
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ city: 'Abu Dhabi', company_size: '1000+', currency: 'INR', priority: 'low' });
  });
});
