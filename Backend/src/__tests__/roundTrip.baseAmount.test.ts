import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';

/**
 * Migration 066 (decided 2026-10-11): a deal's USD amount is UNKNOWN (NULL)
 * when it is not USD and no converted amount was sent — never the native
 * number (INR 125,000 was stored as USD 125,000) and never 0. The deal is
 * never rejected for it, and the server does no conversion of its own.
 */
describe('deals.base_amount_usd: unknown rather than the native amount', () => {
  let ws: TestWorkspace;
  beforeAll(async () => { ws = await setupWorkspace('baseamt'); });
  afterAll(async () => { await teardownWorkspace(ws); });

  const base = async (id: string) => (await pool.query('SELECT base_amount_usd FROM deals WHERE id = $1', [id])).rows[0].base_amount_usd;
  const create = (body: Record<string, unknown>) =>
    request(app).post('/api/v1/deals').set(auth(ws)).send({ name: `B ${Date.now()}.${Math.random()}`, stage: 'prospecting', ...body });

  it('USD without a base: the base is the value', async () => {
    const r = await create({ value: 5000, currency: 'USD' });
    expect(r.status, JSON.stringify(r.body)).toBe(201);
    expect(Number(await base(r.body.data.id))).toBe(5000);
  });

  it('INR without a base: accepted, and the USD amount is UNKNOWN (null) — not 125000', async () => {
    const r = await create({ value: 125000, currency: 'INR' });
    expect(r.status, JSON.stringify(r.body)).toBe(201);
    expect(await base(r.body.data.id)).toBeNull();
    const sum = await request(app).get('/api/v1/deals/stage-summary').set(auth(ws));
    const p = sum.body.data.stages.find((x: { slug: string }) => x.slug === 'prospecting');
    expect(p.unconverted).toBeGreaterThanOrEqual(1);
  });

  it('a base the caller SENT is kept (the form converts client-side)', async () => {
    const r = await create({ value: 125000, currency: 'INR', base_amount_usd: 1500 });
    expect(Number(await base(r.body.data.id))).toBe(1500);
  });

  it('changing value or currency without a base recomputes it: USD -> value, otherwise unknown', async () => {
    const usd = (await create({ value: 100, currency: 'USD' })).body.data.id;
    await request(app).put(`/api/v1/deals/${usd}`).set(auth(ws)).send({ value: 250 });
    expect(Number(await base(usd))).toBe(250);
    await request(app).put(`/api/v1/deals/${usd}`).set(auth(ws)).send({ currency: 'AED' });
    expect(await base(usd)).toBeNull();
    await request(app).put(`/api/v1/deals/${usd}`).set(auth(ws)).send({ value: 900, base_amount_usd: 245 });
    expect(Number(await base(usd))).toBe(245);
    const untouched = (await create({ value: 100, currency: 'USD' })).body.data.id;
    await request(app).put(`/api/v1/deals/${untouched}`).set(auth(ws)).send({ name: 'Renamed' });
    expect(Number(await base(untouched))).toBe(100);
  });

  it('lead conversion: an INR deal gets an unknown USD amount, a USD deal its value', async () => {
    const convert = async (currency: string) => {
      const l = await request(app).post('/api/v1/leads').set(auth(ws)).send({ first_name: 'C', last_name: 'V', email: `c.${Date.now()}.${Math.random()}@baseamt.example`, company: 'Kora', phone: '+91 1' });
      await request(app).post(`/api/v1/leads/${l.body.data.id}/calls`).set(auth(ws)).send({ outcome: 'connected' });
      await request(app).post(`/api/v1/leads/${l.body.data.id}/stage-transition`).set(auth(ws)).send({ to_stage: 'qualified' });
      const c = await request(app).post(`/api/v1/leads/${l.body.data.id}/convert`).set(auth(ws))
        .send({ contact: { mode: 'create' }, company: { mode: 'create' }, deal: { name: `Conv ${currency}`, value: 125000, currency } });
      expect(c.status, JSON.stringify(c.body)).toBe(201);
      return c.body.data.deal.id as string;
    };
    expect(await base(await convert('INR'))).toBeNull();
    expect(Number(await base(await convert('USD')))).toBe(125000);
  });
});
