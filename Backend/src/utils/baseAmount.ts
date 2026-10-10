/**
 * A deal's USD amount for cross-currency totals (migration 066, decided by
 * Venkat 2026-10-11). This server holds no exchange rates, so:
 *   - a base the caller SENT is kept (the deal form converts client-side);
 *   - a USD deal's base is its value;
 *   - otherwise it is UNKNOWN (null) — never the native number, which turned
 *     INR 125,000 into USD 125,000, and never 0.
 * The deal is never rejected for it.
 */
export function usdBase(currency: unknown, value: unknown, supplied?: unknown): number | null {
  if (supplied !== undefined && supplied !== null && supplied !== '') {
    const n = Number(supplied);
    if (Number.isFinite(n)) return n;
  }
  const isUsd = String(currency ?? 'USD').trim().toUpperCase() === 'USD';
  const v = Number(value);
  return isUsd && Number.isFinite(v) ? v : null;
}
