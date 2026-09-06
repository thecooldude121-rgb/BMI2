import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, addUserWithRole, TestWorkspace } from './helpers';

/**
 * Workspace settings — round trip.
 *
 * Settings item 1: name, slug, timezone and default currency, stored on
 * `tenants` (name, slug and the `settings` JSONB from migration 035).
 *
 * The currency assertions are the ones that matter most. A default currency
 * that only renders in a Settings form is decorative; these confirm it reaches
 * `deals.currency` on a create, which is what "drives new deal creation" means.
 */
describe('Workspace settings — round trip', () => {
  let ws: TestWorkspace;
  let manager: TestWorkspace;
  let sales: TestWorkspace;
  const dealIds: string[] = [];

  beforeAll(async () => {
    ws = await setupWorkspace('wsset');
    manager = await addUserWithRole(ws, 'manager');
    sales = await addUserWithRole(ws, 'sales');
  });

  afterAll(async () => {
    if (dealIds.length) {
      await pool.query('DELETE FROM deals WHERE id = ANY($1::varchar[])', [dealIds]);
      const left = await pool.query(
        'SELECT COUNT(*)::int AS n FROM deals WHERE id = ANY($1::varchar[])', [dealIds]);
      if (left.rows[0].n !== 0) throw new Error(`Cleanup failed: ${left.rows[0].n} deals remain`);
    }
    await teardownWorkspace(ws);
  });

  /** Read settings straight from Postgres — never from the response body. */
  const stored = async () => {
    const r = await pool.query('SELECT name, slug, settings FROM tenants WHERE id = $1', [ws.tenantId]);
    return r.rows[0];
  };

  // ── Read ──────────────────────────────────────────────────────────────────

  it('GET returns the caller\'s own workspace, with honest nulls for unset settings', async () => {
    const res = await request(app).get('/api/v1/workspace').set(auth(ws));
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.data.id).toBe(ws.tenantId);
    expect(res.body.data.name).toBeTruthy();
    expect(res.body.data.slug).toBeTruthy();
    // A workspace that has chosen no timezone reports null, not an invented
    // "UTC" that would be indistinguishable from a deliberate choice.
    expect(res.body.data.timezone).toBeNull();
    expect(res.body.data.default_currency).toBeNull();
  });

  it('every role can READ the workspace — the app shell needs it to render', async () => {
    for (const who of [sales, manager]) {
      const res = await request(app).get('/api/v1/workspace').set(auth(who));
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      expect(res.body.data.id).toBe(ws.tenantId);
    }
  });

  // ── Write ─────────────────────────────────────────────────────────────────

  it('update: every submitted field is what Postgres actually holds', async () => {
    const slug = `acme-${Date.now()}`;
    const res = await request(app).put('/api/v1/workspace').set(auth(ws)).send({
      name: 'Acme Industries', slug, timezone: 'Asia/Kolkata', default_currency: 'INR',
    });
    expect(res.status, JSON.stringify(res.body)).toBe(200);

    const row = await stored();
    expect(row.name).toBe('Acme Industries');
    expect(row.slug).toBe(slug);
    expect(row.settings.timezone).toBe('Asia/Kolkata');
    expect(row.settings.default_currency).toBe('INR');
  });

  it('a partial update leaves the other fields alone', async () => {
    const before = await stored();
    const res = await request(app).put('/api/v1/workspace').set(auth(ws))
      .send({ timezone: 'Europe/London' });
    expect(res.status, JSON.stringify(res.body)).toBe(200);

    const after = await stored();
    expect(after.settings.timezone).toBe('Europe/London');
    // The settings document is MERGED, not replaced — sending only a timezone
    // must not drop the currency alongside it.
    expect(after.settings.default_currency).toBe(before.settings.default_currency);
    expect(after.name).toBe(before.name);
    expect(after.slug).toBe(before.slug);
  });

  it('an explicit null clears a setting, which is different from omitting it', async () => {
    await request(app).put('/api/v1/workspace').set(auth(ws))
      .send({ timezone: 'Asia/Kolkata', default_currency: 'INR' });

    const cleared = await request(app).put('/api/v1/workspace').set(auth(ws))
      .send({ timezone: null });
    expect(cleared.status, JSON.stringify(cleared.body)).toBe(200);

    const row = await stored();
    expect(row.settings.timezone).toBeUndefined();      // the key is gone
    expect(row.settings.default_currency).toBe('INR');  // its neighbour survived
  });

  /**
   * REGRESSION. Clearing one setting while setting another in the same request
   * is ordinary for a settings form, and the first implementation built it as
   * two `settings = ...` assignments in one UPDATE — which Postgres refuses
   * with "multiple assignments to same column", surfacing as a masked 500.
   * Both halves are now one composed expression.
   */
  it('clearing one setting and changing another in the SAME request works', async () => {
    await request(app).put('/api/v1/workspace').set(auth(ws))
      .send({ timezone: 'Asia/Kolkata', default_currency: 'INR' });

    const res = await request(app).put('/api/v1/workspace').set(auth(ws))
      .send({ timezone: null, default_currency: 'AED' });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.message ?? '').not.toMatch(/Internal Server Error/);

    const row = await stored();
    expect(row.settings.timezone).toBeUndefined();
    expect(row.settings.default_currency).toBe('AED');
  });

  it('clearing and re-setting the SAME key in one request keeps the new value', async () => {
    await request(app).put('/api/v1/workspace').set(auth(ws)).send({ timezone: 'Asia/Kolkata' });
    // Removals apply before the merge, so this must end as Europe/Paris, not unset.
    const res = await request(app).put('/api/v1/workspace').set(auth(ws))
      .send({ timezone: 'Europe/Paris' });
    expect(res.status).toBe(200);
    expect((await stored()).settings.timezone).toBe('Europe/Paris');
  });

  it('currency is normalised to upper case, so "inr" and "INR" cannot both exist', async () => {
    const res = await request(app).put('/api/v1/workspace').set(auth(ws))
      .send({ default_currency: 'aed' });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    const row = await stored();
    expect(row.settings.default_currency).toBe('AED');
  });

  // ── The setting must actually drive deal creation ─────────────────────────

  it('REGRESSION: the workspace default currency reaches deals.currency on create', async () => {
    await request(app).put('/api/v1/workspace').set(auth(ws)).send({ default_currency: 'INR' });

    const deal = await request(app).post('/api/v1/deals').set(auth(ws))
      .send({ name: `Currency Deal ${Date.now()}`, value: 50000 });   // no currency sent
    expect(deal.status, JSON.stringify(deal.body)).toBe(201);
    dealIds.push(deal.body.data.id);

    // Read the DEAL row, not the settings row: the point is that the preference
    // travelled, not that it was saved.
    const row = await pool.query('SELECT currency FROM deals WHERE id = $1', [deal.body.data.id]);
    expect(row.rows[0].currency, 'the workspace default must drive new deals').toBe('INR');
  });

  it('an explicitly supplied currency still wins over the workspace default', async () => {
    await request(app).put('/api/v1/workspace').set(auth(ws)).send({ default_currency: 'INR' });

    const deal = await request(app).post('/api/v1/deals').set(auth(ws))
      .send({ name: `Explicit Currency ${Date.now()}`, value: 100, currency: 'USD' });
    expect(deal.status, JSON.stringify(deal.body)).toBe(201);
    dealIds.push(deal.body.data.id);

    const row = await pool.query('SELECT currency FROM deals WHERE id = $1', [deal.body.data.id]);
    expect(row.rows[0].currency).toBe('USD');
  });

  it('with no workspace default set, deal creation still falls back to USD', async () => {
    await request(app).put('/api/v1/workspace').set(auth(ws)).send({ default_currency: null });

    const deal = await request(app).post('/api/v1/deals').set(auth(ws))
      .send({ name: `Fallback Currency ${Date.now()}`, value: 100 });
    expect(deal.status, JSON.stringify(deal.body)).toBe(201);
    dealIds.push(deal.body.data.id);

    const row = await pool.query('SELECT currency FROM deals WHERE id = $1', [deal.body.data.id]);
    expect(row.rows[0].currency).toBe('USD');
  });

  // ── Negatives: nothing saves, and the reason is the real one ──────────────

  it.each([
    ['name', '', /name cannot be blank/],
    ['name', '   ', /name cannot be blank/],
    ['slug', '', /slug cannot be blank/],
    ['slug', 'Not A Slug', /slug must be lowercase/],
    ['slug', 'trailing-', /slug must be lowercase/],
    ['slug', '-leading', /slug must be lowercase/],
    ['slug', 'double--hyphen', /slug must be lowercase/],
    ['timezone', 'Mars/Olympus_Mons', /is not a known IANA timezone/],
    ['default_currency', 'RUPEES', /three-letter ISO 4217/],
    ['default_currency', 'IN', /three-letter ISO 4217/],
    ['default_currency', '123', /three-letter ISO 4217/],
  ])('negative: %s = %j is rejected with the real reason, nothing changes', async (field, bad, pattern) => {
    const before = await stored();

    const res = await request(app).put('/api/v1/workspace').set(auth(ws)).send({ [field]: bad });
    expect(res.status, JSON.stringify(res.body)).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(pattern);
    expect(res.body.message, 'the real reason, not a masked 500').not.toMatch(/Internal Server Error/);

    const after = await stored();
    expect(after).toEqual(before);
  });

  it('negative: an empty body is refused rather than silently doing nothing', async () => {
    const res = await request(app).put('/api/v1/workspace').set(auth(ws)).send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/No fields to update/);
  });

  it('negative: a slug already taken by another workspace is a clean 409, not a masked 500', async () => {
    const other = await setupWorkspace('wsset-other');
    try {
      const taken = await pool.query('SELECT slug FROM tenants WHERE id = $1', [other.tenantId]);
      const before = await stored();

      const res = await request(app).put('/api/v1/workspace').set(auth(ws))
        .send({ slug: taken.rows[0].slug });
      expect(res.status, JSON.stringify(res.body)).toBe(409);
      expect(res.body.message).toMatch(/already taken/);
      expect(res.body.message).not.toMatch(/Internal Server Error/);

      // Neither workspace moved.
      expect((await stored()).slug).toBe(before.slug);
      const otherRow = await pool.query('SELECT slug FROM tenants WHERE id = $1', [other.tenantId]);
      expect(otherRow.rows[0].slug).toBe(taken.rows[0].slug);
    } finally {
      await teardownWorkspace(other);
    }
  });

  // ── RBAC and isolation ────────────────────────────────────────────────────

  it('a sales user cannot change workspace settings, and nothing changes', async () => {
    const before = await stored();
    const res = await request(app).put('/api/v1/workspace').set(auth(sales))
      .send({ name: 'Renamed By Sales' });
    expect(res.status, JSON.stringify(res.body)).toBe(403);
    expect(res.body.message).toMatch(/Insufficient permissions/);
    expect(await stored()).toEqual(before);
  });

  it('a manager CAN change workspace settings — the policy locks nobody out', async () => {
    const res = await request(app).put('/api/v1/workspace').set(auth(manager))
      .send({ name: 'Renamed By Manager' });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect((await stored()).name).toBe('Renamed By Manager');
  });

  it('an unauthenticated request is 401, distinct from the 403 for the wrong role', async () => {
    expect((await request(app).get('/api/v1/workspace')).status).toBe(401);
    expect((await request(app).put('/api/v1/workspace').send({ name: 'x' })).status).toBe(401);
  });

  it('tenant isolation: a caller can only ever read and write their OWN workspace', async () => {
    const other = await setupWorkspace('wsset-iso');
    try {
      // There is no :id on these routes, so the only way to attempt another
      // workspace is to smuggle an id in. None of these may be honoured.
      const before = await pool.query('SELECT name FROM tenants WHERE id = $1', [other.tenantId]);

      const read = await request(app)
        .get(`/api/v1/workspace?tenant_id=${other.tenantId}&workspace_id=${other.tenantId}&id=${other.tenantId}`)
        .set(auth(ws));
      expect(read.status).toBe(200);
      expect(read.body.data.id, 'scope must come from the token, never a query param').toBe(ws.tenantId);

      const write = await request(app).put('/api/v1/workspace').set(auth(ws))
        .send({ id: other.tenantId, tenant_id: other.tenantId, workspace_id: other.tenantId, name: 'Hijacked' });
      expect(write.status, JSON.stringify(write.body)).toBe(200);
      // It updated the CALLER's workspace, not the one named in the body.
      expect(write.body.data.id).toBe(ws.tenantId);

      const otherAfter = await pool.query('SELECT name FROM tenants WHERE id = $1', [other.tenantId]);
      expect(otherAfter.rows[0].name, "the other workspace must be untouched").toBe(before.rows[0].name);
    } finally {
      await teardownWorkspace(other);
    }
  });
});
