// ─── Deal Name Generator ──────────────────────────────────────────────────────
// Pure function — no React, no side-effects, no imports from the app.
// Safe to import in unit tests without any mocking.

export interface DealNameContext {
  accountName?: string;
  product?: string;
  closeDate?: string; // ISO date string e.g. "2026-03-15", or empty
}

/**
 * Formats a date (ISO string or Date) as "Mon YYYY" e.g. "Jan 2026".
 * Falls back to the current month/year if the input is missing or invalid.
 */
export const formatMonthYear = (isoDate?: string): string => {
  const date = isoDate ? new Date(isoDate) : new Date();
  // new Date('') produces Invalid Date — guard against it
  const valid = !isNaN(date.getTime());
  const target = valid ? date : new Date();
  return target.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

/**
 * Generates a deal name from available context.
 *
 * Rules:
 *   account + product  → "[Account] – [Product] – [Mon YYYY]"
 *   account only       → "[Account] – Deal – [Mon YYYY]"
 *   product only       → "[Product] – [Mon YYYY]"
 *   neither            → "" (caller should treat empty string as "nothing to generate")
 *
 * The separator is an em-dash (–) with spaces, matching HubSpot convention.
 * Month/year uses closeDate when available, otherwise today's month/year.
 *
 * @example
 *   generateDealName({ accountName: 'Acme Corp', product: 'Enterprise Plan', closeDate: '2026-03-15' })
 *   // → "Acme Corp – Enterprise Plan – Mar 2026"
 *
 *   generateDealName({ accountName: 'Acme Corp' })
 *   // → "Acme Corp – Deal – Jun 2026"  (current month)
 *
 *   generateDealName({ product: 'Growth Plan', closeDate: '2026-06-01' })
 *   // → "Growth Plan – Jun 2026"
 *
 *   generateDealName({})
 *   // → ""
 */
export const generateDealName = (ctx: DealNameContext): string => {
  const account = ctx.accountName?.trim() || '';
  const product = ctx.product?.trim() || '';
  const monthYear = formatMonthYear(ctx.closeDate);

  if (account && product) return `${account} – ${product} – ${monthYear}`;
  if (account)             return `${account} – Deal – ${monthYear}`;
  if (product)             return `${product} – ${monthYear}`;
  return '';
};
