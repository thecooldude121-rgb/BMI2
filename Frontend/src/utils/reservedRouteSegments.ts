/**
 * Words that are ROUTE SEGMENTS, never record ids.
 *
 * THE BUG THIS EXISTS FOR. The global "+ New" menu pointed at `/crm/deals/new`
 * and `/accounts/new`. Neither had a route, so React Router fell through to
 * `/deals/:id` and `/accounts/:accountId`, the detail pages fetched a record
 * whose id was the literal string "new", and the two most prominent create
 * affordances in the product rendered "Could not load deal — Deal not found"
 * and "Account not found".
 *
 * That failure mode is worse than a blank page, which is what "+ New Task" did:
 * a confident, well-designed error about a record the user never asked for and
 * that was never supposed to exist. Nothing distinguishes it from a genuinely
 * missing record, so it reads as data loss rather than a broken link.
 *
 * TWO LAYERS, because they fail independently and only one of them scales:
 *
 *   1. Explicit routes. `/deals/new` and `/accounts/new` are declared, and React
 *      Router ranks a static segment above a dynamic one, so the create form
 *      wins regardless of declaration order. This is the fix for the three
 *      links that were broken.
 *   2. This guard, used by the detail pages themselves. Layer 1 only covers the
 *      words someone remembered to route. A detail page that asks
 *      `isReservedRecordSegment(id)` before fetching refuses the whole class —
 *      including a word added to this list later, and including modules that
 *      never declared the route at all. `/accounts/*` is exactly such a module.
 *
 * `add` and `create` are here because they are already real create routes on
 * deals and accounts, so they are as capable of leaking into an id position as
 * `new` was; `edit` because it is a suffix everywhere and a plausible typo one
 * slash earlier.
 */
export const RESERVED_RECORD_SEGMENTS = ['new', 'add', 'create', 'edit'] as const;

export type ReservedRecordSegment = (typeof RESERVED_RECORD_SEGMENTS)[number];

/**
 * True when a URL segment names an ACTION rather than a record.
 *
 * Case-insensitive: `/deals/New` is the same mistake as `/deals/new`, and ids in
 * this project are uppercase-prefixed (`D052`, `C001`), so lowercasing can never
 * collide with a real one.
 */
export function isReservedRecordSegment(segment: string | undefined | null): boolean {
  if (!segment) return false;
  return (RESERVED_RECORD_SEGMENTS as readonly string[]).includes(segment.trim().toLowerCase());
}
