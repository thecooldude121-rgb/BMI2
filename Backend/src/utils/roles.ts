/**
 * ONE PLACE THAT ANSWERS "may this person hand out that role".
 *
 * The rule was written for `POST /invites` and lived inside `invitesController`
 * as `INVITABLE_BY`. `PATCH /users/:id/role` needs the SAME rule for the same
 * reason — a manager who cannot invite an admin but can promote one has not
 * been stopped from escalating, only slowed down — so it moved here rather than
 * being copied. Two lists that must agree are two lists that will eventually
 * disagree; this project has already paid for that with four copies of an actor
 * name lookup, one of which was missing its tenant predicate.
 */

/** Every role the app understands. Not every role every caller may grant. */
export const ASSIGNABLE_ROLES = ['sales', 'manager', 'admin'] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

/**
 * Roles that keep a workspace administrable. A workspace with none of these
 * active cannot invite, cannot change its settings and cannot promote anyone,
 * and nothing in the product can undo that from the inside.
 *
 * Mirrors DESTRUCTIVE_ACTION_ROLES in middleware/auth and PRIVILEGED_ROLES in
 * usersController — the latter now imports this.
 */
export const PRIVILEGED_ROLES: readonly string[] = ['admin', 'manager'];

/**
 * Seniority, for "never above your own role" comparisons.
 *
 * `hr` USED TO SIT HERE, ranked with `sales`. It is GONE DELIBERATELY, not
 * dropped by accident — HRMS is a separate platform reached over SSO, so an HR
 * persona is not a CRM role and this CRM has no permission it grants. Removed
 * after confirming zero users held it in any workspace and no invite was
 * pending, so nothing was orphaned. If HR ever needs access to this CRM it
 * comes back as a deliberate decision here, and the reason is worth stating:
 * the frontend permission model (`utils/permissions.ts`) never recognised `hr`
 * anyway, so an hr account could sign in and then be denied by every UI gate.
 *
 * Note this matters for the drift history: `invitableRolesFor()` in the
 * frontend once OMITTED `hr` while the server accepted it, which is why the
 * assignable-role list is served rather than mirrored. An `hr` missing from a
 * list is now correct everywhere, which is the opposite of that bug — the tests
 * assert its absence on purpose.
 *
 * UNKNOWN ROLES RANK 0 — BELOW EVERYTHING, DELIBERATELY. `users.role` has no
 * CHECK constraint, so an arbitrary string can be stored. Ranking an unknown
 * value HIGH would make such a row unfixable by anyone, which is the wrong
 * failure: a junk role should be repairable by an admin, not permanent. It
 * cannot be exploited from the caller's side because `requireRole` refuses any
 * role it does not recognise before this is ever consulted.
 */
const RANK: Record<string, number> = { sales: 1, manager: 2, admin: 3 };

export const rankOf = (role: string | undefined): number => RANK[(role ?? '').toLowerCase()] ?? 0;

/**
 * The roles `callerRole` may grant — their own level and below, never above.
 *
 * An unrecognised caller gets the EMPTY set rather than the widest one: the safe
 * direction when we do not know who is asking.
 */
export const rolesAssignableBy = (callerRole: string | undefined): readonly AssignableRole[] => {
  const rank = rankOf(callerRole);
  if (rank === 0) return [];
  return ASSIGNABLE_ROLES.filter(r => rankOf(r) <= rank);
};

export const canAssign = (callerRole: string | undefined, role: string): boolean =>
  (rolesAssignableBy(callerRole) as readonly string[]).includes(role);

/**
 * May `callerRole` act ON someone who currently holds `targetRole`?
 *
 * SEPARATE FROM canAssign, AND BOTH ARE NEEDED. canAssign bounds the role being
 * handed out; this bounds who may be touched at all. Without it a manager could
 * not promote an admin — but could DEMOTE one to sales, which is the same
 * escalation reached from the other end: remove the person above you, and the
 * ceiling above you is gone. (The last-admin guard would stop it only when the
 * admin being demoted was the final one.)
 *
 * Equal ranks may act on each other: an admin may demote another admin, which
 * is what makes an abandoned or compromised admin account recoverable from
 * inside the workspace.
 */
export const canActOn = (callerRole: string | undefined, targetRole: string | undefined): boolean =>
  rankOf(callerRole) >= rankOf(targetRole) && rankOf(callerRole) > 0;
