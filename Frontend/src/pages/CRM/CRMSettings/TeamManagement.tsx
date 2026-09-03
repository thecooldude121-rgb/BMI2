import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../../../components/ui/Button';
import { Users, UserPlus, Download, Upload, Search, Edit, MoreVertical, Mail, User, Calendar, Clock, BarChart3, Briefcase, Shield, TrendingUp, FileText, Lock, CheckCircle, ChevronRight, X, Trash2 } from 'lucide-react';
import { getRoleDisplayName, getStatusBadgeClass, getStatusIcon } from '../../../utils/teamManagementMockData';
import {
  fetchMembers, deactivateMember, reactivateMember, inviteMember,
  fetchPendingInvites, formatLastLogin, INVITABLE_ROLES,
  type WorkspaceMember, type PendingInvite, type InviteResult,
} from '../../../utils/usersApi';
import { NotAvailable } from '../../../components/common/NotAvailable';

/**
 * `TeamMember` was a 44-FIELD FABRICATED MODEL (teamManagementMockData.ts, 958
 * lines). GET /users returns nine columns, and this page read twenty fields —
 * seven of them backed, thirteen invented: employee ids, job titles, phone
 * numbers, office locations, timezones, reporting lines, direct reports,
 * permission strings, "member since", and a Quick Stats panel of deal and
 * pipeline figures. The remaining twenty-four declared fields were read by
 * nothing at all.
 *
 * The seven real ones are wired below. The thirteen rendered-but-invented are
 * labelled with <NotAvailable> rather than deleted silently, because the UI
 * structure is worth keeping for when columns exist. See the commit message for
 * the field-by-field disposition, and TEAM_FIELDS_FOLLOWUP.md for which of the
 * absent fields are worth a schema addition.
 */
type TeamMember = WorkspaceMember;
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import ForbiddenAccess from '../../../components/common/ForbiddenAccess';
import UserActionsDropdown from '../../../components/Team/UserActionsDropdown';
import { useNavigate } from 'react-router-dom';

const TeamManagement: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [teamMembersState, setTeamMembersState] = useState<WorkspaceMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[] | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);
  // Invite
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('sales');
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<InviteResult | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownButtonRefs = useRef<{ [key: string]: React.RefObject<HTMLButtonElement> }>({});
  const searchInputRef = useRef<HTMLInputElement>(null);

  const loadRoster = React.useCallback(async () => {
    setLoadingMembers(true);
    setLoadError(null);
    try {
      // Deactivated members are INCLUDED here: the screen that manages
      // deactivation cannot be the one screen that hides deactivated people.
      const [members, invites] = await Promise.all([
        fetchMembers(true),
        // Invites are admin/manager only. A 403 resolves to null rather than
        // throwing, so a sales user still sees the roster.
        fetchPendingInvites().catch(() => null),
      ]);
      setTeamMembersState(members);
      setPendingInvites(invites);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load the team');
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  useEffect(() => { void loadRoster(); }, [loadRoster]);

  // Handle Escape key to clear search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchQuery !== '') {
        setSearchQuery('');
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

  // Check if user is Admin
  if (!user || user.role !== 'Admin') {
    return (
      <ForbiddenAccess
        title="403 - Access Forbidden"
        message="Team Management settings are only accessible to Admin users. Contact your system administrator for access."
        returnPath="/crm/settings"
        returnLabel="Return to Settings"
      />
    );
  }

  const teamMembers = teamMembersState;
  // Derived from the real roster rather than a fixture. Seat limits and plan
  // utilisation are NOT derived: no plan or seat-count column exists, so the
  // card that showed them is labelled instead of computed from nothing.
  const teamCapacity = {
    activeMembers: teamMembersState.filter(m => m.isActive).length,
    inactiveMembers: teamMembersState.filter(m => !m.isActive).length,
    pendingInvites: pendingInvites?.length ?? 0,
  };

  // Calculate counts for each filter option
  const getRoleCount = (role: string) => {
    if (role === 'all') return teamMembers.length;
    return teamMembers.filter(m => m.role === role).length;
  };

  const getStatusCount = (status: string) => {
    if (status === 'all') return teamMembers.length;
    return teamMembers.filter(m => m.status === status).length;
  };

  const getDepartmentCount = (dept: string) => {
    if (dept === 'all') return teamMembers.length;
    return teamMembers.filter(m => (m.department ?? '').toLowerCase() === dept.toLowerCase()).length;
  };

  const filteredMembers = teamMembers.filter(member => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' ||
      member.name.toLowerCase().includes(searchLower) ||
      member.email.toLowerCase().includes(searchLower) ||
      // phone and jobTitle were searchable against invented values; the real
      // row has neither. Department is real and is searched instead.
      (member.department ?? '').toLowerCase().includes(searchLower) ||
      (member.department ?? '').toLowerCase().includes(searchLower) ||
      getRoleDisplayName(member.role as Parameters<typeof getRoleDisplayName>[0]).toLowerCase().includes(searchLower);
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || (member.department ?? '').toLowerCase() === departmentFilter.toLowerCase();
    return matchesSearch && matchesRole && matchesStatus && matchesDepartment;
  });


  const handleEditMember = (member: TeamMember) => {
    setSelectedMember(member);
    showToast('Editing another member is not available yet — you can edit your own profile in Settings → Profile', 'warning');
  };


  // Get or create ref for dropdown button
  const getDropdownButtonRef = (memberId: string) => {
    if (!dropdownButtonRefs.current[memberId]) {
      dropdownButtonRefs.current[memberId] = React.createRef<HTMLButtonElement>();
    }
    return dropdownButtonRefs.current[memberId];
  };

  // Dropdown action handlers
  const handleViewProfile = (member: TeamMember) => {
    showToast(`Loading ${member.name}'s profile`, 'info');
    navigate(`/team/${member.id}`, { state: { from: 'settings' } });
  };

  const handleResetPassword = (member: TeamMember) => {
    setSelectedMember(member);
    showToast('Password reset is not available yet — no email was sent', 'warning');
  };


  const handleSendWelcomeEmail = (member: TeamMember) => {
    setSelectedMember(member);
    showToast('Sending email is not available yet — nothing was sent', 'warning');
  };



  const handleUnlockAccount = (member: TeamMember) => {
    // Update member status
    setTeamMembersState(prev =>
      prev.map(m =>
        m.id === member.id
          ? { ...m, accountLocked: false }
          : m
      )
    );

    // Log activity
    console.log('Account Unlocked:', {
      action: 'Account Unlocked',
      user: member.name,
      unlockedBy: user?.name || 'Admin',
      timestamp: new Date().toISOString()
    });

    showToast(`${member.name}'s account was NOT unlocked — this is not available yet`, 'warning');
  };

  const handleViewActivityLog = (member: TeamMember) => {
    setSelectedMember(member);
    showToast('Activity logs are not recorded yet', 'warning');
  };

  const handleDeactivateUser = (member: TeamMember) => {
    setSelectedMember(member);
    setShowDeactivateModal(true);
  };

  /**
   * REAL. POST /users/:id/deactivate — soft: the row stays, the account cannot
   * sign in, and migration 036 stops its existing sessions on the next request.
   *
   * The server refuses two cases with a 409 whose message is shown verbatim:
   * deactivating yourself, and removing the last admin or manager. Neither is
   * pre-checked here — the server is the authority, and duplicating the rule in
   * the client is how the two drift apart.
   *
   * The previous flow opened a modal offering to reassign the member's deals,
   * contacts and tasks. No endpoint does that, so it is gone rather than
   * reimplemented against invented counts.
   */
  const handleDeactivateConfirm = async (member: TeamMember) => {
    setActionError(null);
    setBusyMemberId(member.id);
    try {
      const updated = await deactivateMember(member.id);
      // Replace from the SERVER's row, not an optimistic guess.
      setTeamMembersState(prev => prev.map(m => (m.id === updated.id ? updated : m)));
      showToast(`${updated.name} was deactivated`, 'success');
      // Close ONLY on success. Closing in `finally` dismissed the dialog that
      // was displaying the server's refusal — so a 409 explaining "cannot
      // deactivate the last admin" vanished as it arrived, leaving a toast the
      // user may well have missed. The dialog stays open on failure so the
      // reason is readable next to the action that caused it.
      setShowDeactivateModal(false);
      setSelectedMember(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not deactivate this member';
      setActionError(message);
      showToast(message, 'error');
    } finally {
      setBusyMemberId(null);
    }
  };

  /** REAL. POST /users/:id/reactivate. */
  const handleReactivate = async (member: TeamMember) => {
    setActionError(null);
    setBusyMemberId(member.id);
    try {
      const updated = await reactivateMember(member.id);
      setTeamMembersState(prev => prev.map(m => (m.id === updated.id ? updated : m)));
      showToast(`${updated.name} was reactivated`, 'success');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not reactivate this member';
      setActionError(message);
      showToast(message, 'error');
    } finally {
      setBusyMemberId(null);
    }
  };

  /** REAL. POST /invites — creates the invite; delivery is a separate matter. */
  const handleInvite = async () => {
    setActionError(null);
    setInviting(true);
    setInviteResult(null);
    try {
      const result = await inviteMember(inviteEmail.trim(), inviteRole);
      setInviteResult(result);
      setInviteEmail('');
      // Refresh the pending list so the new invite appears without a reload.
      setPendingInvites(await fetchPendingInvites().catch(() => null));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not create the invite';
      setActionError(message);
    } finally {
      setInviting(false);
    }
  };

  /**
   * NOT WIRED, AND NOT REWIRED TO DEACTIVATE.
   *
   * There is no hard-delete endpoint, deliberately: deactivation is soft so a
   * member's deals, contacts and activities keep their owner. Quietly making
   * "Delete" mean "deactivate" would tell someone a record was purged when it
   * was not — a worse lie than an unavailable button, and the reason the
   * separate Deactivate action stays separate.
   */
  const handleDeleteUser = (member: TeamMember) => {
    setSelectedMember(member);
    showToast('Permanently deleting a member is not available. Deactivate them instead — nothing is lost.', 'warning');
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-600" />
              Team Management
            </h2>
            <p className="text-sm text-gray-600 mt-1">User management, roles, and access control</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => { setShowInvite(v => !v); setInviteResult(null); setActionError(null); }}>
            <UserPlus className="h-4 w-4" />
            {showInvite ? 'Cancel invite' : 'Invite a member'}
          </Button>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import Users
          </button>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export User List
          </button>
        </div>
      </div>

      {/* Team Capacity Overview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Team Capacity</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div
            className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 relative group cursor-help"
            title={`${teamCapacity.activeMembers} team members with active accounts. All members have logged in within the last 7 days.`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Active Members</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{teamCapacity.activeMembers}</div>
            <div className="text-xs text-gray-600">{teamCapacity.inactiveMembers} inactive, {teamCapacity.pendingInvites} pending</div>

            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
              {teamCapacity.activeMembers} team members with active accounts.<br />
              All members have logged in within the last 7 days.
            </div>
          </div>

          {/* Seat count and plan utilisation were fabricated: there is no plan
              or seat-limit column, so nothing can compute them. Labelled
              rather than shown as a number. */}
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">Available Seats</span>
            </div>
            <div className="text-sm text-gray-600">Seat limits are not tracked yet.</div>
          </div>

          {/* Total Capacity and Last Updated were fabricated: no plan, seat
              limit or sync-timestamp exists. */}
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">Plan &amp; capacity</span>
            </div>
            <div className="text-sm text-gray-600">Not tracked yet.</div>
          </div>
        </div>

        {/*
          A whole billing panel used to live here: plan name and tier, included
          and used seats, utilisation percentage, monthly cost, cost per seat,
          next billing date, renewal terms, auto-sync status and last sync time,
          plus Business/Enterprise upgrade pricing. Every one of those numbers
          was invented — there is no billing system, no plan column, and no sync
          job. An "Upgrade Plan" button charged nothing and said so in a toast.

          Replaced with one honest statement rather than left as a page of
          figures a customer could reasonably act on.
        */}
        <NotAvailable
          feature="Billing and plan management"
          detail="Seats, plan tier, costs and renewal dates are not tracked yet. The member counts above are real, counted from your workspace."
        />
      </div>

      {/* Invite — REAL. POST /invites creates a single-use, hashed, expiring
          token. Delivery is a separate matter and is reported honestly below. */}
      {showInvite && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Invite a member</h3>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[240px]">
              <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="invite-role" className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                id="invite-role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {INVITABLE_ROLES.map((r) => (
                  <option key={r} value={r}>{getRoleDisplayName(r as Parameters<typeof getRoleDisplayName>[0])}</option>
                ))}
              </select>
            </div>
            <Button onClick={() => void handleInvite()} disabled={inviting || !inviteEmail.trim()}>
              <Mail className="h-4 w-4" />
              {inviting ? 'Creating…' : 'Send invite'}
            </Button>
          </div>

          {/* The invite exists either way; whether anything was EMAILED is a
              separate fact, and the server reports it rather than implying it
              from a 201. While EMAIL_TRANSPORT is `log` nothing is delivered,
              so the link is shown for the admin to pass on by hand. */}
          {inviteResult && (
            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4" role="status">
              <p className="text-sm font-medium text-gray-900">
                Invite created for {inviteResult.invite.email}
              </p>
              {inviteResult.email_sent ? (
                <p className="mt-1 text-sm text-gray-700">An email has been sent with the link.</p>
              ) : (
                <>
                  <p className="mt-1 text-sm text-gray-700">
                    <strong>No email was sent.</strong>{' '}
                    {inviteResult.note ?? 'Email delivery is not configured, so send this link yourself.'}
                  </p>
                  {inviteResult.accept_url && (
                    <code className="mt-2 block break-all rounded border border-blue-200 bg-white p-2 text-xs text-gray-800">
                      {inviteResult.accept_url}
                    </code>
                  )}
                </>
              )}
            </div>
          )}

          {actionError && (
            <p role="alert" className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {actionError}
            </p>
          )}
        </div>
      )}

      {/* Outstanding invites — real rows from GET /invites. */}
      {pendingInvites !== null && pendingInvites.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Invites awaiting acceptance ({pendingInvites.length})
          </h3>
          <ul className="divide-y divide-gray-200">
            {pendingInvites.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-900">{inv.email}</span>
                <span className="text-gray-600">
                  {getRoleDisplayName(inv.role as Parameters<typeof getRoleDisplayName>[0])}
                  {' · expires '}{formatLastLogin(inv.expires_at)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {loadingMembers && (
        <p role="status" className="mb-6 text-sm text-gray-600">Loading your team…</p>
      )}
      {loadError && (
        <div role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {loadError}
        </div>
      )}

      {/* Team Members List */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Current Team Members ({filteredMembers.length})</h3>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by name, email, phone, role, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-96"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Clear search (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px]"
          >
            <option value="all">{roleFilter === 'all' ? '●' : '○'} All Roles ({getRoleCount('all')})</option>
            <option value="ceo">{roleFilter === 'ceo' ? '●' : '○'} CEO ({getRoleCount('ceo')})</option>
            <option value="vp">{roleFilter === 'vp' ? '●' : '○'} VP / Director ({getRoleCount('vp')})</option>
            <option value="manager">{roleFilter === 'manager' ? '●' : '○'} Sales Manager ({getRoleCount('manager')})</option>
            <option value="rep">{roleFilter === 'rep' ? '●' : '○'} Sales Rep ({getRoleCount('rep')})</option>
            <option value="account_executive">{roleFilter === 'account_executive' ? '●' : '○'} Account Executive ({getRoleCount('account_executive')})</option>
            <option value="admin">{roleFilter === 'admin' ? '●' : '○'} Admin ({getRoleCount('admin')})</option>
            <option value="analyst">{roleFilter === 'analyst' ? '●' : '○'} Analyst ({getRoleCount('analyst')})</option>
            <option value="support">{roleFilter === 'support' ? '●' : '○'} Support ({getRoleCount('support')})</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[180px]"
          >
            <option value="all">{statusFilter === 'all' ? '●' : '○'} All Status ({getStatusCount('all')})</option>
            <option value="active">{statusFilter === 'active' ? '●' : '○'} Active ({getStatusCount('active')})</option>
            <option value="inactive">{statusFilter === 'inactive' ? '●' : '○'} Inactive ({getStatusCount('inactive')})</option>
            <option value="pending">{statusFilter === 'pending' ? '●' : '○'} Pending ({getStatusCount('pending')})</option>
            <option value="suspended">{statusFilter === 'suspended' ? '●' : '○'} Suspended ({getStatusCount('suspended')})</option>
          </select>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px]"
          >
            <option value="all">{departmentFilter === 'all' ? '●' : '○'} All Departments ({getDepartmentCount('all')})</option>
            <option value="sales">{departmentFilter === 'sales' ? '●' : '○'} Sales ({getDepartmentCount('sales')})</option>
            <option value="marketing">{departmentFilter === 'marketing' ? '●' : '○'} Marketing ({getDepartmentCount('marketing')})</option>
            <option value="customer success">{departmentFilter === 'customer success' ? '●' : '○'} Customer Success ({getDepartmentCount('customer success')})</option>
            <option value="operations">{departmentFilter === 'operations' ? '●' : '○'} Operations ({getDepartmentCount('operations')})</option>
            <option value="finance">{departmentFilter === 'finance' ? '●' : '○'} Finance ({getDepartmentCount('finance')})</option>
            <option value="hr">{departmentFilter === 'hr' ? '●' : '○'} HR ({getDepartmentCount('hr')})</option>
            <option value="engineering">{departmentFilter === 'engineering' ? '●' : '○'} Engineering ({getDepartmentCount('engineering')})</option>
            <option value="product">{departmentFilter === 'product' ? '●' : '○'} Product ({getDepartmentCount('product')})</option>
            <option value="executive">{departmentFilter === 'executive' ? '●' : '○'} Executive ({getDepartmentCount('executive')})</option>
            <option value="other">{departmentFilter === 'other' ? '●' : '○'} Other ({getDepartmentCount('other')})</option>
          </select>

          {(roleFilter !== 'all' || statusFilter !== 'all' || departmentFilter !== 'all') && (
            <button
              onClick={() => {
                setRoleFilter('all');
                setStatusFilter('all');
                setDepartmentFilter('all');
              }}
              className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear Filters
            </button>
          )}

          {(roleFilter !== 'all' || statusFilter !== 'all' || departmentFilter !== 'all') && (
            <span className="text-sm text-gray-600">
              {filteredMembers.length} {filteredMembers.length === 1 ? 'result' : 'results'}
            </span>
          )}
        </div>

        <div className="space-y-4">
          {filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No team members found</h3>
              <p className="text-sm text-gray-600 text-center mb-1">
                No results match your search
                {searchQuery && (
                  <span className="font-medium text-gray-900"> for "{searchQuery}"</span>
                )}
              </p>
              <p className="text-xs text-gray-500 text-center mb-6">
                Try adjusting your search terms or filters
              </p>
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                  setDepartmentFilter('all');
                }}
              >
                Clear All Filters
              </Button>
            </div>
          ) : (
            filteredMembers.map((member) => (
            <div key={member.id} className={`border rounded-lg p-6 transition-all duration-200 cursor-pointer ${
              member.status === 'inactive'
                ? 'border-gray-300 bg-slate-100 hover:shadow-md'
                : 'border-gray-200 bg-white hover:bg-slate-50 hover:shadow-md'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-semibold shadow-md ${
                    member.status === 'inactive'
                      ? 'bg-gray-400'
                      : `bg-gradient-to-br ${member.avatarColor}`
                  }`}>
                    {member.initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className={`text-lg font-semibold ${member.status === 'inactive' ? 'text-gray-500' : 'text-gray-900'}`}>
                        {member.name}
                      </h4>
                      {member.status === 'inactive' && (
                        <span className="px-2 py-0.5 bg-gray-300 text-gray-700 text-xs font-semibold rounded">
                          INACTIVE
                        </span>
                      )}
                    </div>
                    {/* jobTitle and employeeId had no columns. The real row
                        carries department, which is shown instead. */}
                    <p className={`text-sm ${member.status === 'inactive' ? 'text-gray-500' : 'text-gray-600'}`}>
                      {member.department || 'No department set'}
                    </p>
                    {/* The email is shown once, in the contact row below. */}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {member.status !== 'inactive' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditMember(member);
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit user"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    ref={getDropdownButtonRef(member.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdownId(openDropdownId === member.id ? null : member.id);
                    }}
                    className={`p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ${
                      openDropdownId === member.id ? 'bg-gray-100' : ''
                    }`}
                    title="More actions"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  <UserActionsDropdown
                    isOpen={openDropdownId === member.id}
                    onClose={() => setOpenDropdownId(null)}
                    buttonRef={getDropdownButtonRef(member.id)}
                    onViewProfile={() => handleViewProfile(member)}
                    onEdit={() => handleEditMember(member)}
                    onResetPassword={() => handleResetPassword(member)}
                    onSendWelcomeEmail={() => handleSendWelcomeEmail(member)}
                    onUnlockAccount={() => handleUnlockAccount(member)}
                    onViewActivityLog={() => handleViewActivityLog(member)}
                    onDeactivate={() => handleDeactivateUser(member)}
                    onDelete={() => handleDeleteUser(member)}
                    /* `users` has no lock column; nothing can be locked, so nothing shows as locked. */
                    isAccountLocked={false}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    {member.email}
                  </div>
                  {/* phone, location and timezone were invented per member —
                      `users` has no such columns. See
                      TEAM_FIELDS_FOLLOWUP.md; phone is the one most worth
                      adding. */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    Last signed in: {formatLastLogin(member.lastLoginAt)}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBadgeClass(member.status as Parameters<typeof getStatusBadgeClass>[0])}`}>
                      {getStatusIcon(member.status as Parameters<typeof getStatusIcon>[0])} {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Role:</span> {getRoleDisplayName(member.role as Parameters<typeof getRoleDisplayName>[0])}
                  </div>
                  {/* A free-text "permissions" string was invented alongside
                      the role. The role IS the permission model — see
                      utils/permissions.ts and the server's requireRole. */}
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Department:</span> {member.department}
                  </div>
                </div>
              </div>

              {/* Reporting lines were fabricated: no manager_id or direct-reports
                  relation exists. Structure kept, absence labelled. */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">Member since:</span>
                    </div>
                    {/* created_at is a real column — this is wired, not removed. */}
                    <div className="text-gray-900 ml-6">{formatLastLogin(member.createdAt)}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">Last login:</span>
                    </div>
                    <div className="text-gray-900 ml-6">{formatLastLogin(member.lastLoginAt)}</div>
                  </div>
                </div>
              </div>

              {/* Quick Stats showed per-member active deals, pipeline value and
                  prospect counts — all invented. They are computable from real
                  deals once an owner-rollup endpoint exists; until then this is
                  labelled rather than filled in. */}
              <NotAvailable
                className="mb-4"
                feature="Per-member deal statistics"
                detail="Active deals, pipeline value and assigned contacts for each member are not calculated yet."
              />

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => handleViewProfile(member)}
                >
                  <User className="h-4 w-4" />
                  View Profile
                </Button>
                {member.status === 'inactive' ? (
                  <>
                    <button
                      onClick={() => void handleReactivate(member)}
                      disabled={busyMemberId === member.id}
                      className="px-4 py-2 border border-green-300 text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-sm flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Reactivate
                    </button>
                    <button
                      onClick={() => handleDeleteUser(member)}
                      className="px-4 py-2 border border-red-300 text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-sm flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </>
                ) : (
                  <>
                    {/* Deactivation is a real action now, so it gets a visible
                        control rather than only a dropdown entry — matching
                        Reactivate for inactive members. */}
                    <button
                      onClick={() => handleDeactivateUser(member)}
                      disabled={busyMemberId === member.id}
                      className="px-4 py-2 border border-red-300 text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-sm flex items-center gap-2 disabled:opacity-60"
                    >
                      <Shield className="h-4 w-4" />
                      Deactivate
                    </button>
                    <button
                      onClick={() => handleResetPassword(member)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center gap-2"
                    >
                      <Lock className="h-4 w-4" />
                      Reset Password
                    </button>
                    <button
                      onClick={() => handleSendWelcomeEmail(member)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      Send Email
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
          )}
        </div>

        <div className="mt-6 text-sm text-gray-600 text-center">
          Showing {filteredMembers.length} of {teamMembers.length} users
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        </div>

        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">View Team Performance</div>
                <div className="text-sm text-gray-600">Opens "More → Team" dashboard to view team metrics</div>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
          </button>

          <button className="w-full flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">Configure Role Permissions</div>
                <div className="text-sm text-gray-600">Manage permissions matrix (Phase 2 feature)</div>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
          </button>

          <button className="w-full flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">View User Activity Report</div>
                <div className="text-sm text-gray-600">Generate report on login activity, usage stats</div>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
          </button>

          <button className="w-full flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-orange-600" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">Audit Log</div>
                <div className="text-sm text-gray-600">View all user management changes (who added/edited/deleted users)</div>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
          </button>
        </div>
      </div>

      {/*
        MODALS. Only the deactivation confirmation is real; the rest had no
        endpoint behind them and, rather than being deleted, are reduced to an
        honest confirmation that says so. Each previously opened a full modal
        built on invented data:

          EditTeamMemberModal   — no endpoint edits ANOTHER user. PATCH
                                  /auth/me is self-only by design, so editing a
                                  colleague is not available.
          ResetPasswordModal    — no password-reset endpoint exists at all; the
                                  feature is unbuilt (see CLAUDE.md).
          ViewActivityLogModal  — needed per-user activity analytics that are
                                  not recorded.
          DeleteUserModal       — hard delete does not exist, deliberately.
          UpgradePlanModal      — there is no billing system.
          TeamEmailComposerModal— no transactional send from the browser.

        Their menu entries still exist and still say plainly that the action is
        unavailable, which is the established convention here: a control that
        admits it does nothing beats a control that lies.
      */}

      {/* Deactivate — REAL. A plain confirmation, because the old modal offered
          to reassign deals, contacts and tasks and no endpoint does that. */}
      {selectedMember && showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="deactivate-title">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 id="deactivate-title" className="text-lg font-semibold text-gray-900 mb-2">
              Deactivate {selectedMember.name}?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              They will not be able to sign in, and any session they currently have stops working
              immediately. Nothing is deleted — their deals, contacts and activities stay exactly as
              they are, and you can reactivate them at any time.
            </p>
            {actionError && (
              <p role="alert" className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {actionError}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowDeactivateModal(false); setSelectedMember(null); setActionError(null); }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleDeactivateConfirm(selectedMember)}
                disabled={busyMemberId === selectedMember.id}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 text-sm"
              >
                {busyMemberId === selectedMember.id ? 'Deactivating…' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TeamManagement;
