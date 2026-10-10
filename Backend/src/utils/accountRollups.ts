/**
 * Per-account roll-ups for the Accounts list (Group A item 4, slice 3b).
 *
 * The list used to JOIN these in the browser from the context's other capped
 * lists (500 contacts, 500 deals) — under paging that silently undercounts.
 * Now each returned account row carries its own server counts. Scalar
 * subqueries in a select list run only for the returned page (after LIMIT).
 *
 * OPEN = the deal's stage has stage_type 'open' (never a slug comparison, so
 * every pipeline counts). Test and archived deals are excluded, as everywhere.
 * USD VALUE sums only a trustworthy base_amount_usd (the stage-summary rule):
 * unknown (NULL, migration 066) or a native amount stored as USD is COUNTED in
 * `open_deal_unconverted`, never added. Every subquery carries the tenant match.
 * Assumes the companies table is aliased `c`.
 */
const OPEN_DEALS_OF_C = `
  FROM deals d
  JOIN pipeline_stages ps ON ps.id = d.stage_id AND ps.tenant_id = d.tenant_id
 WHERE d.tenant_id = c.tenant_id AND d.company_id = c.id
   AND d.is_test = false AND d.is_archived = false AND ps.stage_type = 'open'`;

/** A deal's base_amount_usd may be summed as USD. Alias-parameterised. */
export const TRUSTED_USD = (a: string) =>
  `(${a}.base_amount_usd IS NOT NULL AND (upper(coalesce(${a}.currency, 'USD')) = 'USD' OR ${a}.base_amount_usd IS DISTINCT FROM ${a}.value))`;

export const ACCOUNT_ROLLUP_COLUMNS = `
  (SELECT count(*) FROM contacts ct WHERE ct.tenant_id = c.tenant_id AND ct.company_id = c.id)::int AS contact_count,
  (SELECT count(*) ${OPEN_DEALS_OF_C})::int AS open_deal_count,
  (SELECT COALESCE(sum(d.base_amount_usd) FILTER (WHERE ${TRUSTED_USD('d')}), 0) ${OPEN_DEALS_OF_C})::float8 AS open_deal_value_usd,
  (SELECT count(*) FILTER (WHERE NOT ${TRUSTED_USD('d')}) ${OPEN_DEALS_OF_C})::int AS open_deal_unconverted`;
