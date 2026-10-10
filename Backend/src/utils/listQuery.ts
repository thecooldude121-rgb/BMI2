/**
 * Shared paging and sorting for the non-lead list endpoints (Group A item 4,
 * slice 1). GET /leads has its own builder (utils/leadListQuery); these five —
 * deals, contacts, companies, tasks, activities — use this.
 *
 * PAGING. `limit` is clamped to 1..LIST_MAX and `offset` to >= 0, the same
 * lenient rule GET /leads, /tasks and /activities already applied: a malformed
 * value falls back to the default instead of reaching SQL. Deals, contacts
 * and companies passed the raw `?limit=` straight into the query, so
 * `?limit=100000000` ran unbounded and `?limit=abc` surfaced as a masked 500.
 * The applied limit/offset are echoed in the response, so a clamp is visible.
 *
 * TOTAL. Every list answers { data, count, total, limit, offset }: `total` is a
 * COUNT(*) over the SAME FROM + WHERE, so it is the size of the filtered set,
 * not of the page. `count` (the page size) stays for existing callers.
 *
 * SORTING. `?sort=<key>&dir=asc|desc` against a per-endpoint ALLOWLIST of SQL
 * expressions — a key never reaches SQL as text. An unknown key or direction is
 * a 400 naming the allowed values, never silently ignored (the same stance as
 * the Leads advanced filter). Every order ends in a unique tiebreaker so pages
 * cannot overlap or skip rows between requests.
 */
export const LIST_MAX = 500;

export function pageParams(q: Record<string, unknown>, defaultLimit = 50): { limit: number; offset: number } {
  const limit = Math.min(Math.max(parseInt(String(q.limit ?? ''), 10) || defaultLimit, 1), LIST_MAX);
  const offset = Math.max(parseInt(String(q.offset ?? ''), 10) || 0, 0);
  return { limit, offset };
}

export class ListQueryError extends Error {
  statusCode = 400;
}

export function orderBy(
  q: Record<string, unknown>,
  allowed: Record<string, string>,
  fallback: string,
  tiebreak: string,
): string {
  const key = q.sort === undefined || q.sort === '' ? null : String(q.sort);
  const dirRaw = q.dir === undefined || q.dir === '' ? null : String(q.dir).toLowerCase();
  if (dirRaw !== null && dirRaw !== 'asc' && dirRaw !== 'desc') {
    throw new ListQueryError('dir must be asc or desc');
  }
  if (key === null) {
    if (dirRaw !== null) throw new ListQueryError('dir needs a sort');
    return `${fallback}, ${tiebreak}`;
  }
  const expr = allowed[key];
  if (!expr) throw new ListQueryError(`sort must be one of: ${Object.keys(allowed).join(', ')}`);
  return `${expr} ${dirRaw === 'asc' ? 'ASC' : 'DESC'} NULLS LAST, ${tiebreak}`;
}

/** The standard list envelope. */
export const listEnvelope = (rows: unknown[], total: number, page: { limit: number; offset: number }) =>
  ({ success: true, data: rows, count: rows.length, total, limit: page.limit, offset: page.offset });

/** Escape LIKE wildcards in user search text (Postgres' default escape is backslash). */
export const escapeLike = (s: string): string => s.replace(/[\\%_]/g, c => `\\${c}`);
