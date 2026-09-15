import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { pool } from '../config/database';
import { setupWorkspace, teardownWorkspace, TestWorkspace } from './helpers';
import { encryptSecret, decryptSecret } from '../utils/secretBox';
import { leadGenLink, normalizeBaseUrl, LEAD_GEN_MODULE } from '../services/leadGen/link';
import { fetchAccountIntelligence } from '../services/leadGen/accountIntelligence';

/**
 * The outbound Lead Gen link (migration 047) and the account-intelligence read.
 *
 * Only `fetch` is stubbed. module_links rows are real, the encryption is real,
 * and the link lookup really reads and decrypts -- because the thing worth
 * guarding is that a stored credential survives the round trip through Postgres
 * and comes back usable, not that a mock returns what it was told to.
 */
describe('Lead Gen account intelligence', () => {
  let ws: TestWorkspace;
  const KEY_ENV = 'MODULE_LINK_ENCRYPTION_KEY';
  const originalKey = process.env[KEY_ENV];

  beforeAll(async () => {
    process.env[KEY_ENV] = 'a'.repeat(64);
    ws = await setupWorkspace('leadgen');
  });

  afterAll(async () => {
    await teardownWorkspace(ws);
    if (originalKey === undefined) delete process.env[KEY_ENV];
    else process.env[KEY_ENV] = originalKey;
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    process.env[KEY_ENV] = 'a'.repeat(64);
    await pool.query('DELETE FROM module_links WHERE tenant_id = $1', [ws.tenantId]);
  });

  async function link(opts: { apiKey?: string | null; remote?: string | null; active?: boolean } = {}) {
    const { apiKey = 'lgk_test-key', remote = null, active = true } = opts;
    await pool.query(
      `INSERT INTO module_links (tenant_id, module, base_url, api_key_encrypted, remote_workspace_id, is_active)
       VALUES ($1,$2,'https://leadgen.test',$3,$4,$5)`,
      [ws.tenantId, LEAD_GEN_MODULE, apiKey === null ? null : encryptSecret(apiKey), remote, active],
    );
  }

  function stubFetch(status: number, body: unknown) {
    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: any) => {
        calls.push(String(url));
        return { ok: status >= 200 && status < 300, status, json: async () => body } as any;
      }),
    );
    return calls;
  }

  // ── the secret store ──────────────────────────────────────────────────────

  it('a stored key survives encryption, Postgres, and decryption unchanged', async () => {
    const secret = 'lgk_UnVh4Nd0m-Key_with_base64url-chars';
    await link({ apiKey: secret });

    // It is genuinely ciphertext at rest, not the key with extra steps.
    const { rows } = await pool.query(
      'SELECT api_key_encrypted FROM module_links WHERE tenant_id = $1', [ws.tenantId]);
    expect(rows[0].api_key_encrypted).not.toContain(secret);
    expect(rows[0].api_key_encrypted.startsWith('v1:')).toBe(true);

    const resolved = await leadGenLink(ws.tenantId);
    expect(resolved?.apiKey).toBe(secret);
  });

  it('encrypting the same secret twice produces different ciphertext', () => {
    const a = encryptSecret('same-secret');
    const b = encryptSecret('same-secret');
    expect(a).not.toBe(b);
    expect(decryptSecret(a)).toBe('same-secret');
    expect(decryptSecret(b)).toBe('same-secret');
  });

  it('a tampered ciphertext fails loudly instead of decrypting to garbage', () => {
    const payload = encryptSecret('lgk_real-key');
    const parts = payload.split(':');
    // Flip a byte of the ciphertext.
    const ct = Buffer.from(parts[3], 'base64');
    ct[0] ^= 0xff;
    parts[3] = ct.toString('base64');
    expect(() => decryptSecret(parts.join(':'))).toThrow();
  });

  it('a missing or malformed encryption key names the variable and the fix', () => {
    delete process.env[KEY_ENV];
    expect(() => encryptSecret('x')).toThrow(/MODULE_LINK_ENCRYPTION_KEY is not set/);
    process.env[KEY_ENV] = 'too-short';
    expect(() => encryptSecret('x')).toThrow(/64 hex characters/);
  });

  it('an undecryptable stored key reads as no key rather than throwing', async () => {
    await link({ apiKey: 'lgk_test-key' });
    // Simulates a rotated or lost encryption key.
    process.env[KEY_ENV] = 'b'.repeat(64);
    const resolved = await leadGenLink(ws.tenantId);
    expect(resolved).not.toBeNull();
    expect(resolved?.apiKey).toBeNull();
  });

  // ── base URL validation (this URL is fetched server-side) ─────────────────

  it('rejects base URLs that would be an SSRF foothold', () => {
    expect(() => normalizeBaseUrl('file:///etc/passwd')).toThrow(/http or https/);
    expect(() => normalizeBaseUrl('http://169.254.169.254/latest/meta-data')).toThrow(/https except for localhost/);
    expect(() => normalizeBaseUrl('not a url')).toThrow(/valid URL/);
    expect(() => normalizeBaseUrl('')).toThrow(/required/);
    // Allowed, and the trailing slash is trimmed so paths concatenate cleanly.
    expect(normalizeBaseUrl('https://leadgen.example/')).toBe('https://leadgen.example');
    expect(normalizeBaseUrl('http://localhost:4100')).toBe('http://localhost:4100');
  });

  // ── the read itself ───────────────────────────────────────────────────────

  it('reports not_linked when no link row exists, without calling out', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const res = await fetchAccountIntelligence(ws.tenantId, 'northwind.example');
    expect(res.status).toBe('not_linked');
    expect(fetchSpy, 'no outbound call without a credential').not.toHaveBeenCalled();
  });

  it('reports not_linked when the link exists but carries no key', async () => {
    await link({ apiKey: null });
    const res = await fetchAccountIntelligence(ws.tenantId, 'northwind.example');
    expect(res.status).toBe('not_linked');
  });

  it('an inactive link is not used', async () => {
    await link({ active: false });
    const res = await fetchAccountIntelligence(ws.tenantId, 'northwind.example');
    expect(res.status).toBe('not_linked');
  });

  /** The real success shape, as the running Lead Gen service returns it. */
  it('parses a bare JSON array and returns the signals newest first', async () => {
    await link();
    stubFetch(200, [
      { id: 'a1', source: 'sample', category: 'hiring', headline: 'Hiring 14 engineers', url: 'https://e.example/a', published_at: '2026-08-31T18:30:00.000Z' },
      { id: 'a2', source: 'sample', category: 'funding', headline: 'Raises Series B', url: null, published_at: '2026-09-09T18:30:00.000Z' },
    ]);

    const res = await fetchAccountIntelligence(ws.tenantId, 'northwind.example');
    expect(res.status).toBe('ok');
    if (res.status !== 'ok') return;
    expect(res.signals.map((s) => s.id)).toEqual(['a2', 'a1']);
    expect(res.signals[0].url, 'a null url stays null').toBeNull();
    expect(res.signals[1].url).toBe('https://e.example/a');
  });

  it('sends the domain, and workspace_id only when the link recorded one', async () => {
    await link({ remote: null });
    let calls = stubFetch(200, []);
    await fetchAccountIntelligence(ws.tenantId, 'northwind.example', { since: '2026-01-01', limit: 25 });
    expect(calls[0]).toContain('company_domain=northwind.example');
    expect(calls[0]).toContain('since=2026-01-01');
    expect(calls[0]).toContain('limit=25');
    // An unmatched workspace_id is a 403 on Lead Gen's side, so a guess would
    // turn a working read into a failure.
    expect(calls[0]).not.toContain('workspace_id');

    await pool.query('DELETE FROM module_links WHERE tenant_id = $1', [ws.tenantId]);
    await link({ remote: 'lg-workspace-7' });
    calls = stubFetch(200, []);
    await fetchAccountIntelligence(ws.tenantId, 'northwind.example');
    expect(calls[0]).toContain('workspace_id=lg-workspace-7');
  });

  it('an empty domain returns nothing rather than the whole workspace feed', async () => {
    await link();
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const res = await fetchAccountIntelligence(ws.tenantId, '   ');
    expect(res).toEqual({ status: 'ok', signals: [] });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('a 401 or 403 says the connection is unauthorised, not that the app broke', async () => {
    await link();
    stubFetch(401, { error: 'invalid or revoked API key' });
    const res = await fetchAccountIntelligence(ws.tenantId, 'northwind.example');
    expect(res.status).toBe('error');
    if (res.status !== 'error') return;
    expect(res.message).toMatch(/not authorised/);
    // The upstream body can echo detail that does not belong on a CRM page.
    expect(res.message).not.toMatch(/revoked|invalid/);
  });

  it('a 500, a non-array body, or a network failure all degrade to one safe message', async () => {
    await link();

    stubFetch(500, { error: 'boom' });
    const server = await fetchAccountIntelligence(ws.tenantId, 'northwind.example');
    expect(server.status).toBe('error');

    stubFetch(200, { unexpected: 'shape' });
    const malformed = await fetchAccountIntelligence(ws.tenantId, 'northwind.example');
    expect(malformed.status).toBe('error');

    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('ECONNREFUSED'); }));
    const down = await fetchAccountIntelligence(ws.tenantId, 'northwind.example');
    expect(down.status).toBe('error');
    if (down.status !== 'error') return;
    expect(down.message).toMatch(/Couldn't load account intelligence right now/);
  });

  it('tolerates a { signals: [...] } wrapper, and drops rows with no headline or id', async () => {
    await link();
    stubFetch(200, {
      signals: [
        { id: 'ok1', headline: 'Real signal', category: 'news', url: null, published_at: '2026-09-01' },
        { id: 'no-headline', headline: '   ', category: 'news' },
        { headline: 'no id', category: 'news' },
        null,
      ],
    });
    const res = await fetchAccountIntelligence(ws.tenantId, 'northwind.example');
    expect(res.status).toBe('ok');
    if (res.status !== 'ok') return;
    expect(res.signals.map((s) => s.id)).toEqual(['ok1']);
  });

  it('one link per module per workspace', async () => {
    await link();
    await expect(link()).rejects.toMatchObject({ code: '23505' });
  });

  it('the link is scoped to its workspace -- another cannot read it', async () => {
    await link();
    const other = await setupWorkspace('leadgen-b');
    try {
      expect(await leadGenLink(other.tenantId)).toBeNull();
    } finally {
      await teardownWorkspace(other);
    }
  });
});
