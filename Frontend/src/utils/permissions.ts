// ── Role + Permission types ────────────────────────────────────────────────────

/**
 * Roles the permission model understands.
 *
 * THE BACKEND ISSUES THREE: `admin`, `manager`, `sales` (users.role, which has
 * no CHECK constraint, so anything is storable — see roleHas's fail-closed
 * behaviour). This model has four tiers, so something has to collapse; see the
 * `sales` entry in ROLE_PERMISSIONS for that decision.
 *
 * `sdr` and `senior_sdr` are kept as accepted aliases rather than removed: they
 * are what the dev role-switcher offers and what this model was written around,
 * and dropping them would break those call sites for no gain.
 */
export type Role = 'sdr' | 'senior_sdr' | 'sales' | 'manager' | 'admin';

export type Permission =
  | 'leads.view_all'
  | 'leads.view_own'
  | 'leads.edit_fields'
  | 'leads.bulk_actions'
  | 'leads.convert'
  | 'leads.manage_views'
  | 'leads.manage_assignment_rules'
  | 'leads.override_qualification_guard'
  | 'leads.delete';

// ── Role → Permission mapping ──────────────────────────────────────────────────

const SDR: Permission[] = [
  'leads.view_own',
  'leads.edit_fields',
];

const SENIOR_SDR: Permission[] = [
  'leads.view_own',
  'leads.edit_fields',
  'leads.bulk_actions',
  'leads.convert',
];

const MANAGER: Permission[] = [
  'leads.view_all',
  'leads.edit_fields',
  'leads.bulk_actions',
  'leads.convert',
  'leads.manage_views',
  'leads.manage_assignment_rules',
  'leads.override_qualification_guard',
  'leads.delete',
];

const ALL: Permission[] = [
  'leads.view_all',
  'leads.view_own',
  'leads.edit_fields',
  'leads.bulk_actions',
  'leads.convert',
  'leads.manage_views',
  'leads.manage_assignment_rules',
  'leads.override_qualification_guard',
  'leads.delete',
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  sdr:        SDR,
  senior_sdr: SENIOR_SDR,
  /**
   * `sales` -> the SDR permission set. THIS IS A DECISION, NOT AN OBVIOUS GIVEN,
   * so it is written down rather than left to be inferred.
   *
   * The backend issues three roles (admin, manager, sales) and this model has
   * four tiers, so one tier has to absorb another. `sales` maps to the LOWEST
   * non-privileged tier deliberately: view_own and edit_fields, without
   * bulk_actions, convert or delete. Two reasons.
   *
   * First, it matches what the API now enforces. Destructive actions —
   * deletes and bulk updates — require admin or manager server-side
   * (DESTRUCTIVE_ACTION_ROLES in Backend middleware/auth.ts). A UI that offered
   * `sales` a bulk action the API refuses would produce a button that always
   * fails, which is worse than no button.
   *
   * Second, granting is cheap and revoking is not. If `sales` turns out to need
   * senior_sdr's abilities, widening this is a one-line change and nobody was
   * harmed meanwhile; starting wide and narrowing later takes capabilities away
   * from people who had them.
   *
   * TO REVISIT: if `sales` ever needs its own tier, give it a named permission
   * array here rather than pointing it at SENIOR_SDR — the two roles come from
   * different vocabularies and conflating them again would lose this reasoning.
   */
  sales:      SDR,
  manager:    MANAGER,
  admin:      ALL,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * FAILS CLOSED on a role this model does not know, rather than throwing.
 *
 * This mattered the moment CurrentUserContext started carrying the REAL session
 * role. Before that it held a hardcoded 'admin' stub, so the lookup always hit;
 * with a real role, `users.role` has no CHECK constraint and the backend also
 * issues values this model never listed. `ROLE_PERMISSIONS[unknown]` is
 * undefined, so `.includes` threw a TypeError — which in a React render is a
 * blank screen, not a denied button.
 *
 * Denying is the safe direction: an unrecognised role gets the UI of someone
 * with no permissions, which is recoverable and visibly wrong, rather than
 * crashing the page or silently being treated as an admin.
 */
export function roleHas(role: Role | string, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role as Role]?.includes(permission) ?? false;
}

export function allPermissions(): Permission[] {
  return ALL;
}
