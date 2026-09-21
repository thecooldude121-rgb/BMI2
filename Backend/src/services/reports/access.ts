/**
 * WHO MAY SEE AND CHANGE A SAVED REPORT — as SQL predicates, in one place.
 *
 * P3 Phase 2. Sharing model decided 2026-09-19, refined 2026-09-21.
 *
 *   owner  — view, edit, delete, and grant. Ownership is `owner_id`, not a
 *            grant row.
 *   edit   — view and change the definition. Cannot delete or re-share.
 *   view   — open and run. The floor that any share confers.
 *
 * `edit` implies `view`, and edit-without-view is unrepresentable: one grant row
 * per (report, user) holds one level, so the bad state cannot be stored.
 *
 * ─── WHY THESE ARE PREDICATES AND NOT `if` STATEMENTS ─────────────────────
 *
 * Enforcement is QUERY-LEVEL. Every read carries `canViewPredicate` in its
 * WHERE clause and every write carries `canEditPredicate`, so an unauthorised
 * request matches ZERO ROWS rather than being stopped by a check that a future
 * endpoint might forget to call.
 *
 * That is the same reasoning as `scopedSource()` in Phase 0 and the RLS policies
 * in Phase 1: the failure mode this project keeps hitting is not a wrong check,
 * it is an absent one. An `if` at the top of a handler is exactly the thing that
 * gets omitted when someone adds the fifth endpoint; a predicate welded into the
 * statement cannot be.
 *
 * App-level logic still shapes the RESPONSE — zero rows becomes 404, never 403,
 * so the API does not disclose that a report exists in a workspace you cannot
 * see it in. Same rule as the FK rejection messages and the single login
 * failure message.
 */

/**
 * Rows this user may READ. Owner, or any grant at either level.
 *
 * `alias` is the saved_reports alias in the caller's query; it comes from the
 * calling code, never from a request. Both parameters are bound.
 */
export function canViewPredicate(alias: string, userParam: number): string {
  return `(
    ${alias}.owner_id = $${userParam}
    OR EXISTS (
      SELECT 1 FROM saved_report_grants g
       WHERE g.report_id = ${alias}.id
         AND g.tenant_id = ${alias}.tenant_id
         AND g.user_id   = $${userParam}
    )
  )`;
}

/**
 * Rows this user may WRITE. Owner, or a grant at level 'edit'.
 *
 * Note `g.level = 'edit'` and NOT `g.level IN ('view','edit')` — the level is
 * the ceiling, and a viewer must not be able to rewrite the definition of a
 * report shared with them.
 */
export function canEditPredicate(alias: string, userParam: number): string {
  return `(
    ${alias}.owner_id = $${userParam}
    OR EXISTS (
      SELECT 1 FROM saved_report_grants g
       WHERE g.report_id = ${alias}.id
         AND g.tenant_id = ${alias}.tenant_id
         AND g.user_id   = $${userParam}
         AND g.level     = 'edit'
    )
  )`;
}

/**
 * Rows this user may DELETE or SHARE: the owner alone.
 *
 * Deliberately narrower than `edit`, and flagged for sign-off. "The owner can
 * grant edit rights" says what an editor may change, not that an editor becomes
 * a second owner — and re-sharing or deleting someone else's report is the kind
 * of authority that should be granted explicitly rather than inferred. Widening
 * this later is safe; narrowing it after people rely on it is not.
 */
export function isOwnerPredicate(alias: string, userParam: number): string {
  return `${alias}.owner_id = $${userParam}`;
}

/** The levels a grant may hold. Mirrors saved_report_grants_level_check. */
export const GRANT_LEVELS = ['view', 'edit'] as const;
export type GrantLevel = (typeof GRANT_LEVELS)[number];

/** What this caller may do with a report, for the API to serve to the client. */
export interface ReportAbilities {
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_share: boolean;
}

/**
 * Computed from the row, and SERVED with it — the client renders the rule rather
 * than re-deriving it. That is the arrangement `assignable_roles` and
 * `editable_user_ids` already use, adopted because a client-side copy of a
 * permission rule had already drifted in this codebase before anyone noticed.
 */
export function abilitiesFor(
  row: { owner_id: number | null }, grantLevel: GrantLevel | null, userId: number,
): ReportAbilities {
  const isOwner = row.owner_id !== null && Number(row.owner_id) === Number(userId);
  return {
    can_view:   isOwner || grantLevel !== null,
    can_edit:   isOwner || grantLevel === 'edit',
    can_delete: isOwner,
    can_share:  isOwner,
  };
}
