import { describe, it, expect } from 'vitest';
import { invitableRolesFor } from './usersApi';

/**
 * Who may invite whom.
 *
 * The server is the control — `INVITABLE_BY` in invitesController answers 403 —
 * and this list exists so a manager is never offered an option that will be
 * refused. Both derive from the same rule, "never above your own role", and this
 * file is what stops the two drifting apart.
 */
describe('invitableRolesFor', () => {
  it('an ADMIN may invite anyone, including another admin', () => {
    expect([...invitableRolesFor('admin')]).toEqual(['sales', 'manager', 'admin']);
  });

  it('a MANAGER may NOT invite an admin — the escalation this closes', () => {
    // A manager could previously invite themselves at a second address as an
    // admin, accept, and hold an account that could deactivate them.
    const roles = invitableRolesFor('manager');
    expect(roles).not.toContain('admin');
    expect([...roles]).toEqual(['sales', 'manager']);
  });

  it('is case-insensitive, because the UI capitalises roles and the API does not', () => {
    // AuthContext maps the API's lowercase 'admin' to a capitalised 'Admin', and
    // this function is called with THAT value. Missing the case difference would
    // have silently given every admin an empty picker.
    expect([...invitableRolesFor('Admin')]).toEqual(['sales', 'manager', 'admin']);
    expect([...invitableRolesFor('Manager')]).toEqual(['sales', 'manager']);
  });

  it('an unknown or absent role gets NOTHING, not everything', () => {
    // The safe direction: a role we do not recognise must not be handed the
    // widest set by accident.
    expect([...invitableRolesFor('sales')]).toEqual([]);
    expect([...invitableRolesFor(undefined)]).toEqual([]);
    expect([...invitableRolesFor('')]).toEqual([]);
  });
});
