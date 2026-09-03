import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsPage from './SettingsPage';
import RolesManagement from './RolesManagement';
import PermissionMatrix from './PermissionMatrix';

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

  it('WITH roles: toggling and saving refuses out loud and KEEPS "Unsaved changes"', async () => {
    // The regression that matters, exercised on the path where it was
    // reachable. The old code looped over the changed cells, got `false` back
    // from every write, ignored the return value, and fell through to
    // setHasUnsavedChanges(false) — the badge vanished and the user read that
    // as a save. A role is supplied here purely as test input so the grid has
    // rows to toggle.
    const user = userEvent.setup();
    const withRole = {
      ...settingsStub,
      roles: [{
        id: 'role-1', name: 'Sales Rep', description: '', hierarchy_level: 1,
        parent_role_id: null, is_system: false, is_active: true,
        permissions: {}, restrictions: {},
      }],
    };
    Object.assign(settingsStub, withRole);

    try {
      render(<PermissionMatrix />);
      await waitFor(() => expect(settingsStub.getModulePermissions).toHaveBeenCalled());

      const boxes = await waitFor(() => {
        const found = screen.queryAllByRole('checkbox');
        expect(found.length).toBeGreaterThan(0);
        return found;
      });

      await user.click(boxes[0]);
      const badge = await screen.findByText(/Unsaved changes/i);
      expect(badge).toBeInTheDocument();

      const save = screen.getByRole('button', { name: /save changes/i });
      expect(save).toBeDisabled();

      // Even reaching the handler directly must not clear the badge or write.
      await user.click(save);
      expect(screen.getByText(/Unsaved changes/i)).toBeInTheDocument();
      expect(settingsStub.setModulePermission).not.toHaveBeenCalled();
      expect(settingsStub.setFieldPermission).not.toHaveBeenCalled();
    } finally {
      Object.assign(settingsStub, { roles: [] });
    }
  });
});
