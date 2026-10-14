import { it, expect, vi, afterEach } from 'vitest';
import { checkLeadDuplicates, DUPLICATE_CHECK_CHUNK } from './leadsApi';

/**
 * The server's JSON body limit is Express's default 100 KB. A 1000-row import
 * sent in one request measured ~140 KB and was refused with a 413, so the
 * duplicate check failed for any large file. The client sends body-sized chunks.
 */
afterEach(() => vi.unstubAllGlobals());

it('a 1000-row check goes out in chunks that each fit the 100 KB body limit, results in row order', async () => {
  const bodies: string[] = [];
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
    const body = String(init.body);
    bodies.push(body);
    const { rows } = JSON.parse(body) as { rows: { email: string }[] };
    return { ok: true, status: 200, json: async () => ({ data: rows.map((r, index) => ({ index, match: { id: Number(r.email.split('@')[0].slice(1)) } })) }) } as Response;
  }));
  const rows = Array.from({ length: 1000 }, (_, k) => ({
    email: `u${k}@a-rather-long-company-name.example`, phone: '+91 98765 43210',
    company: 'Acme Technologies Private Limited', last_name: 'Krishnamurthy',
  }));
  const out = await checkLeadDuplicates(rows);
  expect(bodies).toHaveLength(Math.ceil(1000 / DUPLICATE_CHECK_CHUNK));
  for (const b of bodies) expect(new TextEncoder().encode(b).length).toBeLessThan(100 * 1024);
  expect(out.map(m => m?.id)).toEqual(rows.map((_, k) => k));
});

it('a refused chunk throws — "could not check" never reads as "no duplicates"', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 413, json: async () => ({}) } as Response)));
  await expect(checkLeadDuplicates([{ email: 'a@b.example' }])).rejects.toThrow(/413/);
});
