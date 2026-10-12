/**
 * How a deal's OWNER is grouped in server totals (Reports, Forecast): the
 * resolved user (`id:<user>`) where `assigned_to_user_id` is set, otherwise the
 * legacy free-text name (`name:<text>`), otherwise `name:Unassigned`. The
 * prefixes stop a user id of 5 colliding with a rep literally named "5" — the
 * same rule as the client's `utils/dealOwnership.ownerIdentityOf`.
 *
 * Assumes deals aliased `d` and users joined as `au` with the tenant match.
 */
export const OWNER_KEY = `CASE WHEN d.assigned_to_user_id IS NOT NULL THEN 'id:' || d.assigned_to_user_id
  ELSE 'name:' || COALESCE(NULLIF(btrim(d.assigned_to), ''), 'Unassigned') END`;

export const OWNER_LABEL = `CASE WHEN d.assigned_to_user_id IS NOT NULL
  THEN COALESCE(NULLIF(btrim(au.first_name || ' ' || au.last_name), ''), NULLIF(btrim(d.assigned_to), ''), 'User ' || d.assigned_to_user_id)
  ELSE COALESCE(NULLIF(btrim(d.assigned_to), ''), 'Unassigned') END`;
