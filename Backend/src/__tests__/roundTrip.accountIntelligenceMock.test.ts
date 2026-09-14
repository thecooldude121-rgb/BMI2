import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';
import {
  getAccountIntelligenceProvider, resetAccountIntelligenceProvider, PROVIDER_ENV,
  SIGNAL_CATEGORIES,
} from '../services/accountIntelligence';

/**
 * ACCOUNT INTELLIGENCE — the mock provider, its seam, and the tenant boundary.
 *
 * This is PLACEHOLDER work (see CLAUDE.md), so the assertions that matter most
 * are the ones that keep it honest rather than the ones that keep it working:
 *  1. Every sample item is self-identifying, and carries NO source, url or date
 *     — a fabricated headline with a citation is the thing this must never be.
 *  2. The four outcomes stay apart. "No domain", "provider failed" and
 *     "answered with nothing" are three different facts, and only the last one
 *     means the account has no signals.
 *  3. The seam defaults to the mock when unset and REFUSES to start on an
 *     unknown or unbuilt provider, rather than falling back silently.
 *  4. A company in another workspace is a 404, like everywhere else here.
 */
describe('Account intelligence (mock provider)', () => {
  let ws: TestWorkspace;
  let other: TestWorkspace;
  let withDomain: string;
  let withoutDomain: string;
  let theirCompany: string;

  const get = (as: TestWorkspace, id: string) =>
    request(app).get(`/api/v1/companies/${id}/intelligence`).set(auth(as));

  const makeCompany = async (w: TestWorkspace, name: string, domain: string | null) => {
    const res = await request(app).post('/api/v1/companies').set(auth(w))
      .send({ name, ...(domain ? { domain } : {}) });
    if (res.status !== 201 && res.status !== 200) {
      throw new Error(`fixture company failed: ${JSON.stringify(res.body)}`);
    }
    return res.body.data.id as string;
  };

  beforeAll(async () => {
    ws = await setupWorkspace('acctintel');
    other = await setupWorkspace('acctintel-other');
    withDomain = await makeCompany(ws, 'RT Intel Co', 'rt-intel-example.test');
    withoutDomain = await makeCompany(ws, 'RT Intel No Domain', null);
    theirCompany = await makeCompany(other, 'RT Intel Theirs', 'theirs-example.test');
  });

  afterAll(async () => {
    delete process.env[PROVIDER_ENV];
    resetAccountIntelligenceProvider();
    await teardownWorkspace(other);
    await teardownWorkspace(ws);
    // Re-count rather than trust the deletes (lesson 8).
    const left = await pool.query(
      'SELECT COUNT(*)::int AS n FROM companies WHERE tenant_id = ANY($1::uuid[])',
      [[ws.tenantId, other.tenantId]]);
    if (left.rows[0].n !== 0) throw new Error(`Cleanup failed: ${left.rows[0].n} companies remain`);
  });

  // ── 1. The content is self-identifying ───────────────────────────────────

  it('returns sample signals that are labelled as sample content', async () => {
    const res = await get(ws, withDomain);
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.preview).toBe(true);
    expect(res.body.data.provider).toBe('mock');
    expect(res.body.data.preview_note).toMatch(/PREVIEW · SAMPLE CONTENT/);
    expect(res.body.data.signals.length).toBeGreaterThanOrEqual(2);
    expect(res.body.data.signals.length).toBeLessThanOrEqual(3);
  });

  it('NO signal carries a source, a url or a timestamp', async () => {
    // The central rule for this capability. An invented headline is a labelled
    // placeholder; an invented headline with an outlet and a date is a
    // fabricated news story, and the label stops travelling with it the moment
    // anyone copies the text out.
    const res = await get(ws, withDomain);
    for (const s of res.body.data.signals as Record<string, unknown>[]) {
      expect(s.source, JSON.stringify(s)).toBeNull();
      expect(s.url, JSON.stringify(s)).toBeNull();
      expect(s.published_at, JSON.stringify(s)).toBeNull();
    }
  });

  it('every headline says "Sample" in its own text, not only in the badge', async () => {
    const res = await get(ws, withDomain);
    for (const s of res.body.data.signals as { headline: string }[]) {
      expect(s.headline).toMatch(/^Sample:/);
    }
  });

  it('uses only the agreed category vocabulary, which includes news', async () => {
    const res = await get(ws, withDomain);
    const cats = (res.body.data.signals as { category: string }[]).map(s => s.category);
    expect(cats).toContain('news');
    for (const c of cats) expect(SIGNAL_CATEGORIES as readonly string[]).toContain(c);
  });

  it('is the SAME sample content for a different company — it is not a lookup', async () => {
    // Guards against the mock being mistaken for data. Two accounts get the
    // same three sentences; only the interpolated key differs.
    const mine = await get(ws, withDomain);
    const theirs = await request(app).get(`/api/v1/companies/${theirCompany}/intelligence`).set(auth(other));
    const strip = (b: { signals: { headline: string }[] }) => b.signals.map(s => s.headline);
    expect(strip(theirs.body.data)).toEqual(strip(mine.body.data));
  });

  // ── 2. The four outcomes stay apart ──────────────────────────────────────

  it('an account with NO domain is "no_domain", not an empty signal list', async () => {
    const res = await get(ws, withoutDomain);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('no_domain');
    expect(res.body.data.company_domain).toBeNull();
    expect(res.body.data.signals).toEqual([]);
    expect(res.body.data.detail).toMatch(/no website domain recorded/);
    // And it must not wear the preview banner's note: there is no sample
    // content being shown, so there is nothing to disclaim.
    expect(res.body.data.preview_note).toBeNull();
  });

  it('a company in ANOTHER workspace is a 404, disclosing nothing', async () => {
    const res = await get(ws, theirCompany);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Company not found');
    expect(JSON.stringify(res.body)).not.toContain('theirs-example.test');
  });

  it('requires authentication', async () => {
    const res = await request(app).get(`/api/v1/companies/${withDomain}/intelligence`);
    expect(res.status).toBe(401);
  });

  // ── 3. The seam ──────────────────────────────────────────────────────────

  it('defaults to the mock when the env var is unset', () => {
    delete process.env[PROVIDER_ENV];
    resetAccountIntelligenceProvider();
    const p = getAccountIntelligenceProvider();
    expect(p.name).toBe('mock');
    expect(p.isPreview).toBe(true);
  });

  it('REFUSES an unbuilt provider rather than falling back to the mock', () => {
    // A silent fallback is how a deployment shows placeholder news while its
    // operator believes the integration is live — the EMAIL_TRANSPORT=log
    // lesson. Loud and unbootable beats quiet and wrong.
    process.env[PROVIDER_ENV] = 'leadgen';
    resetAccountIntelligenceProvider();
    expect(() => getAccountIntelligenceProvider()).toThrow(/not built/);
    delete process.env[PROVIDER_ENV];
    resetAccountIntelligenceProvider();
  });

  it('refuses an unknown provider name', () => {
    process.env[PROVIDER_ENV] = 'whatever';
    resetAccountIntelligenceProvider();
    expect(() => getAccountIntelligenceProvider()).toThrow(/not a known provider/);
    delete process.env[PROVIDER_ENV];
    resetAccountIntelligenceProvider();
  });
});
