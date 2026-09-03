import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsPage from './SettingsPage';
import RolesManagement from './RolesManagement';
import PermissionMatrix, { writePermissionCells, describeSaveFailure } from './PermissionMatrix';

/**
 * The three roles pages are LABELLED, not wired — and this pins that.
 *
 * There is nothing to wire them to. SettingsContext talks to Supabase, which
 * this product does not use, and the tables behind these screens (custom roles,
 * role hierarchy, per-module and per-field permissions) do not exist in its
 * Postgres either. So unlike the workspace and team screens, which had real
 * endpoints waiting, these are a UI for a feature this product does not have.
 *
 * Two distinct defects are pinned here, and they fail differently:
 *   1. SettingsPage rendered FABRICATED DATA — four headline security figures
 *      that were literals in a function, live at /settings.
 *   2. PermissionMatrix reported a FAKE SUCCESS — its save swallowed every
 *      failure and cleared the "Unsaved changes" badge anyway.
 * The rest is inert UI, which is a smaller problem but still reads as working.
 */

const settingsStub = {
  roles: [],
  permissions: [],
  profiles: [],
  userGroups: [],
  auditLogs: [],
  loading: false,
  error: null,
  fetchRoles: vi.fn(async () => {}),
  fetchPermissions: vi.fn(async () => {}),
  fetchAuditLogs: vi.fn(async () => {}),
  fetchProfiles: vi.fn(async () => {}),
  fetchUserGroups: vi.fn(async () => {}),
  createRole: vi.fn(async () => null),
  updateRole: vi.fn(async () => false),
  deleteRole: vi.fn(async () => false),
  getRoleHierarchy: vi.fn(async () => []),
  getModulePermissions: vi.fn(async () => []),
  setModulePermission: vi.fn(async () => false),
  getFieldPermissions: vi.fn(async () => []),
  setFieldPermission: vi.fn(async () => false),
  // Deliberately still returns the literals: the point is that SettingsPage no
  // longer calls it, not that the function was edited.
  getSecurityMetrics: vi.fn(async () => ({
    total_users: 150, active_sessions: 42, failed_login_attempts_24h: 5,
    suspicious_activities_count: 2, api_calls_today: 1523, avg_session_duration_minutes: 45,
  })),
};

vi.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => settingsStub,
}));

beforeEach(() => { vi.clearAllMocks(); });
afterEach(() => { vi.restoreAllMocks(); });

describe('SettingsPage — the fabricated security metrics are gone', () => {
  it('renders none of the six invented figures', async () => {
    render(<SettingsPage />);
    await waitFor(() => expect(settingsStub.fetchRoles).toHaveBeenCalled());

    // "150 users" on a workspace of four. Deleted, not relabelled — the numbers
    // were the entire content of those cards.
    for (const label of ['Total Users', 'Active Sessions', 'API Calls Today', 'Failed Logins (24h)']) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
    for (const figure of ['150', '42', '1523', '1,523']) {
      expect(screen.queryByText(figure)).not.toBeInTheDocument();
    }
  });

  it('does not even ask for them any more', async () => {
    render(<SettingsPage />);
    await waitFor(() => expect(settingsStub.fetchRoles).toHaveBeenCalled());
    // Not called at all. A page that fetches invented numbers and then hides
    // them is one edit away from showing them again.
    expect(settingsStub.getSecurityMetrics).not.toHaveBeenCalled();
  });

  it('says the sections below are unbacked, and points at what IS wired', async () => {
    const { container } = render(<SettingsPage />);
    const banner = await waitFor(() => container.querySelector('[data-not-available]'));
    expect(banner).not.toBeNull();
    // Whitespace-tolerant: the banner text is a wrapped JSX literal, so the
    // words are separated by a newline and indentation, not a single space.
    expect(banner!.textContent!.replace(/\s+/g, ' ')).toMatch(/Team Management/);
  });
});

describe('RolesManagement — labelled, and its writes refuse', () => {
  it('carries a NotAvailable that explains the empty list is a failure, not an empty workspace', async () => {
    const { container } = render(<RolesManagement />);
    const banner = await waitFor(() => container.querySelector('[data-not-available]'));
    expect(banner).not.toBeNull();
    // The distinction that matters: zero roles here means every request failed.
    expect(banner!.textContent).toMatch(/not because no roles exist/i);
  });

  it('the Create Role control is disabled rather than opening a modal that cannot save', async () => {
    render(<RolesManagement />);
    await waitFor(() => expect(settingsStub.fetchRoles).toHaveBeenCalled());

    const createButtons = screen.getAllByTitle(/Creating a role is not available yet/);
    expect(createButtons.length).toBeGreaterThan(0);
    createButtons.forEach(b => expect(b).toBeDisabled());
  });

  it('never calls createRole, even though the stub would answer', async () => {
    render(<RolesManagement />);
    await waitFor(() => expect(settingsStub.fetchRoles).toHaveBeenCalled());
    expect(settingsStub.createRole).not.toHaveBeenCalled();
    expect(settingsStub.updateRole).not.toHaveBeenCalled();
    expect(settingsStub.deleteRole).not.toHaveBeenCalled();
  });
});

describe('PermissionMatrix — the fake success is closed', () => {
  it('is labelled, and names the fixture problem as well as the missing backend', async () => {
    const { container } = render(<PermissionMatrix />);
    const banner = await waitFor(() => container.querySelector('[data-not-available]'));
    expect(banner).not.toBeNull();
    // The modules and fields on the grid are written into the component.
    expect(banner!.textContent).toMatch(/fixture written into this file/i);
  });

  it('with no roles there is nothing to toggle, and no permission write is attempted', async () => {
    // Worth stating precisely, because it bounds the severity of the fake
    // success below: `roles` is always empty in this deployment, the matrix
    // builds its cells per role, so today there are no cells, no unsaved
    // changes, and no reachable Save. The fake success is real code on a path
    // a user cannot currently get to — one restored data source away from
    // being live, which is why it is closed rather than left.
    const { container } = render(<PermissionMatrix />);
    await waitFor(() => expect(container.querySelector('[data-not-available]')).not.toBeNull());

    // Not asserted as "zero checkboxes": the toolbar has one of its own that is
    // not a permission cell. What matters is that no permission row exists to
    // change, so no save can be reached.
    expect(screen.queryByText(/Unsaved changes/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /save changes/i })).not.toBeInTheDocument();
    expect(settingsStub.setModulePermission).not.toHaveBeenCalled();
    expect(settingsStub.setFieldPermission).not.toHaveBeenCalled();
  });

  it('with no roles there is nothing to toggle, so no write is attempted at all', async () => {
    const { container } = render(<PermissionMatrix />);
    await waitFor(() => expect(container.querySelector('[data-not-available]')).not.toBeNull());

    expect(screen.queryByText(/Unsaved changes/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /save changes/i })).not.toBeInTheDocument();
    expect(settingsStub.setModulePermission).not.toHaveBeenCalled();
    expect(settingsStub.setFieldPermission).not.toHaveBeenCalled();
  });
});

/**
 * The save rule itself.
 *
 * These drive `writePermissionCells` directly rather than through the UI, and
 * that is the point rather than a shortcut. The Save button is disabled — the
 * page has no backend — so `userEvent.click` on it never invokes the handler.
 * The first version of this test did exactly that and PASSED: "Unsaved changes"
 * was still on screen because nothing had run, not because the logic keeps it
 * there. That is CLAUDE.md lesson 2 in miniature, and it is why the rule was
 * extracted into a unit that can actually be exercised.
 */
describe('writePermissionCells — the return-value rule', () => {
  const modules = [
    { id: 'leads', name: 'leads', fields: [{ id: 'email', name: 'email' }] },
  ];
  const cell = (over = {}) => ({
    roleId: 'role-1', moduleId: 'leads',
    permissions: { read: true, write: false, delete: false, export: false, import: false, hide: false },
    ...over,
  });

  it('counts a FALSE return as a failure — it is not an exception, and that was the bug', async () => {
    const setModulePermission = vi.fn(async () => false);
    const out = await writePermissionCells([cell(), cell()], modules, {
      setModulePermission,
      setFieldPermission: vi.fn(async () => false),
    });

    // Two attempts, two failures, and NOT a thrown error. The old loop saw the
    // absence of a throw as success.
    expect(out).toEqual({ attempted: 2, failed: 2 });
    expect(setModulePermission).toHaveBeenCalledTimes(2);
  });

  it('reports zero failures when every write returns true', async () => {
    const out = await writePermissionCells([cell(), cell()], modules, {
      setModulePermission: vi.fn(async () => true),
      setFieldPermission: vi.fn(async () => true),
    });
    // The caller may clear its dirty flag only on this outcome.
    expect(out).toEqual({ attempted: 2, failed: 0 });
  });

  it('counts a PARTIAL failure precisely, rather than rounding to all-or-nothing', async () => {
    let n = 0;
    const out = await writePermissionCells([cell(), cell(), cell()], modules, {
      setModulePermission: vi.fn(async () => { n++; return n !== 2; }),
      setFieldPermission: vi.fn(async () => true),
    });
    expect(out).toEqual({ attempted: 3, failed: 1 });
  });

  it('routes a field-level cell to setFieldPermission, and counts its false too', async () => {
    const setFieldPermission = vi.fn(async () => false);
    const setModulePermission = vi.fn(async () => true);
    const out = await writePermissionCells([cell({ fieldId: 'email' })], modules, {
      setModulePermission, setFieldPermission,
    });

    expect(setFieldPermission).toHaveBeenCalledTimes(1);
    expect(setModulePermission).not.toHaveBeenCalled();
    expect(out).toEqual({ attempted: 1, failed: 1 });
    expect(setFieldPermission.mock.calls[0][0]).toMatchObject({ module_name: 'leads', field_name: 'email' });
  });

  it('skips a cell whose module is unknown without counting it as attempted', async () => {
    const setModulePermission = vi.fn(async () => true);
    const out = await writePermissionCells([cell({ moduleId: 'nonexistent' })], modules, {
      setModulePermission, setFieldPermission: vi.fn(async () => true),
    });
    expect(out).toEqual({ attempted: 0, failed: 0 });
    expect(setModulePermission).not.toHaveBeenCalled();
  });
});

describe('describeSaveFailure — says which, and never overclaims', () => {
  it('total failure says none were saved', () => {
    expect(describeSaveFailure({ attempted: 3, failed: 3 }))
      .toMatch(/None of the 3 permission changes could be saved/);
  });

  it('partial failure names the count, because some writes DID land', () => {
    // "Nothing was saved" would be a lie in the other direction.
    expect(describeSaveFailure({ attempted: 5, failed: 2 }))
      .toMatch(/2 of 5 permission changes could not be saved/);
  });

  it('and every message says the changes are still unsaved', () => {
    for (const o of [{ attempted: 1, failed: 1 }, { attempted: 4, failed: 2 }]) {
      expect(describeSaveFailure(o)).toMatch(/still unsaved/);
    }
  });
});
