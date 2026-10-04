/**
 * The lead profile fields added by migration 063 (Group A item 1, 2026-10-05):
 * validation and normalisation for create and update, in ONE place.
 *
 * Every limit mirrors the column: a value Postgres would refuse (an over-long
 * varchar is 22001, a bad enum is 23514) must come back as a 400 naming the
 * field, never as the masked 500 errorHandler produces for a raw DB error.
 *
 * Semantics: an OMITTED field is untouched; `null` or a blank string CLEARS it
 * (stored as NULL — never an empty string, which would read as "recorded").
 */

/** Free-text columns and their varchar lengths (migration 063). */
export const PROFILE_TEXT_FIELDS: Record<string, number> = {
  mobile: 50,
  website: 255,
  linkedin_url: 255,
  city: 100,
  country: 100,
  department: 100,
  source_detail: 255,
  utm_source: 255,
  utm_medium: 255,
  utm_campaign: 255,
  referral_contact: 255,
};

/** Same bands as companies.size and the scoring engine (leads_company_size_check). */
export const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'] as const;
export const PRIORITIES = ['low', 'medium', 'high'] as const;

const isBlank = (v: unknown) => v === null || (typeof v === 'string' && v.trim() === '');

/** The first problem with the profile fields in `body`, or null. */
export function profileFieldsError(body: Record<string, unknown>): string | null {
  for (const [field, max] of Object.entries(PROFILE_TEXT_FIELDS)) {
    const v = body[field];
    if (v === undefined || isBlank(v)) continue;
    if (typeof v !== 'string') return `${field} must be text`;
    if (v.trim().length > max) return `${field} must be at most ${max} characters`;
  }
  const size = body.company_size;
  if (size !== undefined && !isBlank(size) && !COMPANY_SIZES.includes(size as typeof COMPANY_SIZES[number])) {
    return `company_size must be one of: ${COMPANY_SIZES.join(', ')}`;
  }
  const pri = body.priority;
  if (pri !== undefined && !isBlank(pri) && !PRIORITIES.includes(pri as typeof PRIORITIES[number])) {
    return `priority must be one of: ${PRIORITIES.join(', ')}`;
  }
  const cur = body.currency;
  if (cur !== undefined && !isBlank(cur)) {
    if (typeof cur !== 'string' || !/^[A-Za-z]{3}$/.test(cur.trim())) return 'currency must be a three-letter code such as INR';
  }
  const val = body.value;
  if (val !== undefined && !isBlank(val)) {
    const n = typeof val === 'number' ? val : Number(val);
    if (!Number.isFinite(n) || n < 0) return 'value must be a number of zero or more';
  }
  return null;
}

/**
 * Column -> value for every profile field PRESENT in `body`, normalised:
 * trimmed, blank -> NULL, currency upper-cased, value a number. Call only after
 * profileFieldsError returned null.
 */
export function normalizeProfileFields(body: Record<string, unknown>): Record<string, string | number | null> {
  const out: Record<string, string | number | null> = {};
  for (const field of [...Object.keys(PROFILE_TEXT_FIELDS), 'company_size', 'priority']) {
    if (body[field] === undefined) continue;
    out[field] = isBlank(body[field]) ? null : String(body[field]).trim();
  }
  if (body.currency !== undefined) out.currency = isBlank(body.currency) ? null : String(body.currency).trim().toUpperCase();
  if (body.value !== undefined) out.value = isBlank(body.value) ? null : Number(body.value);
  return out;
}
