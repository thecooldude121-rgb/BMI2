/**
 * Parse an IETF draft-8 `RateLimit` response header, as express-rate-limit
 * writes it: one item per limiter, comma-separated —
 *   "login-ip"; r=29; t=900, "login-email"; r=4; t=900
 * r = requests remaining in the window, t = seconds until it resets.
 * Unparseable items are skipped; a missing header gives an empty map.
 */
export interface RateLimitItem { remaining: number; resetSeconds: number | null }

export function parseRateLimit(header: string | null | undefined): Record<string, RateLimitItem> {
  const out: Record<string, RateLimitItem> = {};
  if (!header) return out;
  for (const item of header.split(',')) {
    const name = item.match(/^\s*"([^"]+)"/)?.[1];
    const r = item.match(/(?:^|;)\s*r=(\d+)/)?.[1];
    if (!name || r === undefined) continue;
    const t = item.match(/(?:^|;)\s*t=(\d+)/)?.[1];
    out[name] = { remaining: Number(r), resetSeconds: t === undefined ? null : Number(t) };
  }
  return out;
}
