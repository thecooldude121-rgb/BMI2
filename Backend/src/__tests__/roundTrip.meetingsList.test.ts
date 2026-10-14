import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';

/**
 * Slice 6c — the Meetings list pages, searches, filters and counts on the
 * server. The page loaded the first 50 meetings and did all of that in the
 * browser, so its tiles never exceeded 50 and meeting #51 was unreachable.
 * Checked at 10,000 meetings against independent SQL.
 */
describe('meetings list: filters, totals and summary', () => {
  let ws: TestWorkspace;
  let other: TestWorkspace;
  const N = 10_000;
  const get = (path: string, q: Record<string, string | number> = {}) => request(app).get(path).query(q).set(auth(ws));
  const count = async (where: string, params: unknown[] = []) =>
    (await pool.query(`SELECT COUNT(*)::int AS n FROM meetings WHERE tenant_id = $1 AND ${where}`, [ws.tenantId, ...params])).rows[0].n as number;

  beforeAll(async () => {
    ws = await setupWorkspace('mtglist');
    other = await setupWorkspace('mtglist-other');
    const companyId = (await pool.query(`INSERT INTO companies (name, tenant_id) VALUES ('Kora', $1) RETURNING id`, [ws.tenantId])).rows[0].id;
    // Every 3rd meeting is linked; types cycle through the vocabulary and NULL;
    // every 100th mentions "zebra" in its notes, every 250th in its attendees.
    await pool.query(
      `INSERT INTO meetings (title, date, type, related_to_type, related_to_id, notes, attendees, tenant_id)
       SELECT 'Meeting ' || g,
              TIMESTAMPTZ '2030-01-01' + g * INTERVAL '1 hour',
              (ARRAY['sales-call','internal','client-meeting',NULL])[1 + g % 4],
              CASE WHEN g % 3 = 0 THEN 'company' END,
              CASE WHEN g % 3 = 0 THEN $2 END,
              CASE WHEN g % 100 = 0 THEN 'talked about the zebra project' END,
              CASE WHEN g % 250 = 0 THEN 'Zebra Team' END,
              $1
         FROM generate_series(1, ${N}) g`,
      [ws.tenantId, companyId]);
    // A literal "%" title, to prove LIKE wildcards are escaped.
    await pool.query(`INSERT INTO meetings (title, tenant_id) VALUES ('100% renewal', $1)`, [ws.tenantId]);
    // Another workspace's meetings must never be counted or listed.
    await pool.query(
      `INSERT INTO meetings (title, notes, tenant_id) SELECT 'Foreign zebra ' || g, 'zebra', $1 FROM generate_series(1, 7) g`,
      [other.tenantId]);
  }, 60_000);

  afterAll(async () => {
    await teardownWorkspace(ws);
    await teardownWorkspace(other);
  });

  it('the list total is every meeting in this workspace, and a page is the page size', async () => {
    const res = await get('/api/v1/meetings', { limit: 25, offset: 0 });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.total).toBe(N + 1);
    expect(res.body.data).toHaveLength(25);
    expect(res.body).toMatchObject({ limit: 25, offset: 0 });
  });

  it('the summary counts every meeting and the unlinked ones, against SQL', async () => {
    const res = await get('/api/v1/meetings/summary');
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.data).toEqual({ total: N + 1, unlinked: await count('related_to_id IS NULL') });
    expect(res.body.data.unlinked).toBeGreaterThan(50);
  });

  it('linked=no / yes, type and search each narrow the total exactly as SQL does', async () => {
    const cases: [Record<string, string>, string, unknown[]][] = [
      [{ linked: 'no' }, 'related_to_id IS NULL', []],
      [{ linked: 'yes' }, 'related_to_id IS NOT NULL', []],
      [{ type: 'internal' }, "type = 'internal'", []],
      [{ search: 'zebra' }, '(title ILIKE $2 OR notes ILIKE $2 OR attendees ILIKE $2)', ['%zebra%']],
      [{ search: 'zebra', type: 'sales-call', linked: 'no' },
        "(title ILIKE $2 OR notes ILIKE $2 OR attendees ILIKE $2) AND type = 'sales-call' AND related_to_id IS NULL", ['%zebra%']],
    ];
    for (const [q, where, params] of cases) {
      const res = await get('/api/v1/meetings', { ...q, limit: 5 });
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      expect(res.body.total, JSON.stringify(q)).toBe(await count(where, params));
    }
    // The summary honours search and type (its tiles split by link state).
    const s = await get('/api/v1/meetings/summary', { search: 'zebra' });
    expect(s.body.data.total).toBe(await count('(title ILIKE $2 OR notes ILIKE $2 OR attendees ILIKE $2)', ['%zebra%']));
  });

  it('LIKE wildcards in a search are literal', async () => {
    const res = await get('/api/v1/meetings', { search: '100%' });
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].title).toBe('100% renewal');
    expect((await get('/api/v1/meetings', { search: '_' })).body.total).toBe(0);
  });

  it('a bad filter is a 400 naming it, never ignored', async () => {
    for (const q of [{ type: 'video' }, { linked: 'maybe' }]) {
      const res = await get('/api/v1/meetings', q);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(Object.keys(q)[0]);
      expect((await get('/api/v1/meetings/summary', q)).status).toBe(q.type ? 400 : 200);
    }
  });

  it('garbage limit and offset fall back rather than reaching SQL', async () => {
    const res = await get('/api/v1/meetings', { limit: 'abc', offset: -5 });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ limit: 50, offset: 0 });
    expect((await get('/api/v1/meetings', { limit: 9999 })).body.limit).toBe(200);
  });

  it('walking every unlinked page returns each meeting exactly once', async () => {
    const seen = new Set<string>();
    let offset = 0;
    let total = Infinity;
    while (offset < total) {
      const res = await get('/api/v1/meetings', { linked: 'no', limit: 200, offset });
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      total = res.body.total;
      for (const m of res.body.data) {
        expect(seen.has(m.id)).toBe(false);
        seen.add(m.id);
      }
      offset += 200;
    }
    expect(seen.size).toBe(await count('related_to_id IS NULL'));
  }, 60_000);
});
