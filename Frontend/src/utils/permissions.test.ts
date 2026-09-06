import { describe, it, expect } from 'vitest';
import { roleHas, ROLE_PERMISSIONS, allPermissions } from './permissions';
import type { Permission, Role } from './permissions';

/**
 * The permission model, after it started carrying the REAL session role.
 *
 * Two things changed and both are load-bearing: `sales` — a role the backend
 * actually issues — now has a mapping, and an unrecognised role denies rather
 * than throwing. Before this, CurrentUserContext held a hardcoded 'admin' stub,
 * so neither path was ever taken.
 */
describe('permissions', () => {
  it('the backend\'s three real roles all have a mapping', () => {
    // users.role holds these. A role the model does not know would deny every
    // permission, which for a real signed-in user is a blank, useless UI.
    for (const role of ['admin', 'manager', 'sales'] as Role[]) {
      expect(ROLE_PERMISSIONS[role], `${role} has no permission set`).toBeDefined();
    }
  });

  it('sales maps to the SDR tier — view_own and edit_fields, nothing destructive', () => {
    expect(ROLE_PERMISSIONS.sales).toEqual(ROLE_PERMISSIONS.sdr);

    expect(roleHas('sales', 'leads.view_own')).toBe(true);
    expect(roleHas('sales', 'leads.edit_fields')).toBe(true);

    // The destructive half must be denied, and this is not arbitrary: the API
    // enforces the same split (DESTRUCTIVE_ACTION_ROLES = admin|manager), so a
    // sales user offered these would get a button that always fails.
    expect(roleHas('sales', 'leads.delete')).toBe(false);
    expect(roleHas('sales', 'leads.bulk_actions')).toBe(false);
    expect(roleHas('sales', 'leads.view_all')).toBe(false);
  });

  it('sdr and senior_sdr survive as aliases, and are not silently collapsed', () => {
    expect(ROLE_PERMISSIONS.sdr).toBeDefined();
    expect(ROLE_PERMISSIONS.senior_sdr).toBeDefined();
    // senior_sdr is a genuinely wider tier than sdr/sales — if these ever became
    // the same set, the four-tier model would have quietly become three.
    expect(roleHas('senior_sdr', 'leads.convert')).toBe(true);
    expect(roleHas('sdr', 'leads.convert')).toBe(false);
  });

  it('manager and admin keep the destructive permissions the API also allows them', () => {
    for (const role of ['manager', 'admin'] as Role[]) {
      expect(roleHas(role, 'leads.delete'), `${role} should be able to delete`).toBe(true);
      expect(roleHas(role, 'leads.bulk_actions')).toBe(true);
      expect(roleHas(role, 'leads.view_all')).toBe(true);
    }
    expect(ROLE_PERMISSIONS.admin).toEqual(allPermissions());
  });

  /**
   * FAILS CLOSED. `ROLE_PERMISSIONS[unknown]` is undefined, so the previous
   * `.includes` threw a TypeError — in a React render that is a blank screen,
   * not a denied button. It only became reachable when the real role started
   * flowing through, since users.role has no CHECK constraint and the app also
   * carries roles this model never listed (e.g. HR).
   */
  it.each([
    ['hr'], ['user'], ['HR'], ['Admin'], ['superuser'], [''], ['anonymous'],
  ])('an unrecognised role %j denies every permission instead of throwing', (role) => {
    for (const permission of allPermissions()) {
      expect(() => roleHas(role, permission)).not.toThrow();
      expect(roleHas(role, permission), `${role} must not be granted ${permission}`).toBe(false);
    }
  });

  it('roles are case-sensitive: "Admin" is not "admin"', () => {
    // AuthContext capitalises its roles; CurrentUserContext maps them back down.
    // If that mapping is ever dropped, this is what catches it — a capitalised
    // role must NOT accidentally match, it must deny.
    expect(roleHas('Admin' as unknown as Role, 'leads.delete')).toBe(false);
    expect(roleHas('admin', 'leads.delete')).toBe(true);
  });

  it('every permission a role claims is a real permission', () => {
    const known = new Set<Permission>(allPermissions());
    for (const [role, granted] of Object.entries(ROLE_PERMISSIONS)) {
      for (const p of granted) {
        expect(known.has(p), `${role} grants unknown permission ${p}`).toBe(true);
      }
    }
  });
});
