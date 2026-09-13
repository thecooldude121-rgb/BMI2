/**
 * THE industry vocabulary. Migration 045.
 *
 * Used for two different fields that ask the same question about different
 * companies:
 *   - companies.industry                  — a CLIENT account's industry
 *   - tenants.settings.business_industry  — the workspace's OWN industry
 *
 * Mirrors companies_industry_check, and roundTrip.industries compares the two
 * so they cannot drift silently. The frontend keeps NO copy: it renders what
 * GET /companies/industries serves. AccountFormPage's hardcoded list and
 * CompanyForm's different one are the drift this replaces.
 */
export const INDUSTRIES = [
  'Automotive', 'Consulting', 'E-Commerce', 'EdTech', 'Education',
  'Energy', 'Entertainment', 'Finance', 'FinTech', 'Food & Beverage',
  'Healthcare', 'IT Services', 'Logistics', 'Manufacturing',
  'Real Estate', 'Retail', 'SaaS', 'Technology', 'Transportation',
  'Travel', 'Other',
] as const;

export type Industry = (typeof INDUSTRIES)[number];

const BY_LOWER = new Map<string, Industry>(INDUSTRIES.map(i => [i.toLowerCase(), i]));

export const INDUSTRY_MESSAGE =
  `must be one of: ${INDUSTRIES.join(', ')}`;

/**
 * Normalise a client-supplied industry.
 *
 *   undefined           -> { ok, value: undefined }  (not sent: leave alone)
 *   null, '' or blanks  -> { ok, value: null }       (clear it: not recorded)
 *   ' technology '      -> { ok, value: 'Technology' } (case/space corrected)
 *   'Space Mining'      -> { ok: false }             (refused, never coerced)
 *
 * Case is corrected rather than refused because 'technology' is the same
 * industry typed carelessly. An unknown value is refused rather than mapped to
 * 'Other', because 'Other' is a deliberate user choice and a silent mapping
 * would make the two indistinguishable — the same reasoning 040 used for
 * deals.source.
 */
export function normalizeIndustry(
  input: unknown,
): { ok: true; value: Industry | null | undefined } | { ok: false } {
  if (input === undefined) return { ok: true, value: undefined };
  if (input === null) return { ok: true, value: null };
  if (typeof input !== 'string') return { ok: false };
  const s = input.trim();
  if (!s) return { ok: true, value: null };
  const hit = BY_LOWER.get(s.toLowerCase());
  return hit ? { ok: true, value: hit } : { ok: false };
}
