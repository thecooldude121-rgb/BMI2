// ── Role + Permission types ────────────────────────────────────────────────────

export type Role = 'sdr' | 'senior_sdr' | 'manager' | 'admin';

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
  manager:    MANAGER,
  admin:      ALL,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export function roleHas(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function allPermissions(): Permission[] {
  return ALL;
}
