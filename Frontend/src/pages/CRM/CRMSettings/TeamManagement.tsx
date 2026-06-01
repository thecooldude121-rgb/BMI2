import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  UserPlus,
  Download,
  Upload,
  Search,
  Edit,
  MoreVertical,
  Mail,
  Phone,
  User,
  Calendar,
  Clock,
  BarChart3,
  DollarSign,
  Briefcase,
  Shield,
  Activity,
  TrendingUp,
  FileText,
  Lock,
  CheckCircle,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  MapPin,
  Globe,
  Building,
  X,
  Trash2
} from 'lucide-react';
import {
  mockTeamMembers,
  mockTeamCapacity,
  mockRoleDefinitions,
  mockDepartments,
  mockAuditLog,
  getRoleDisplayName,
  getStatusBadgeClass,
  getStatusIcon,
  type TeamMember,
  type UserRole,
  type UserStatus
} from '../../../utils/teamManagementMockData';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import ForbiddenAccess from '../../../components/common/ForbiddenAccess';
import UpgradePlanModal from '../../../components/Team/UpgradePlanModal';
import EditTeamMemberModal from '../../../components/Team/EditTeamMemberModal';
import UserActionsDropdown from '../../../components/Team/UserActionsDropdown';
import ResetPasswordModal from '../../../components/Team/ResetPasswordModal';
import ViewActivityLogModal from '../../../components/Team/ViewActivityLogModal';
import DeactivateUserModal from '../../../components/Team/DeactivateUserModal';
import DeleteUserModal from '../../../components/Team/DeleteUserModal';
import { TeamEmailComposerModal } from '../../../components/Team/TeamEmailComposerModal';
import { useNavigate } from 'react-router-dom';

const TeamManagement: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [showUpgradePlanModal, setShowUpgradePlanModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showEmailComposerModal, setShowEmailComposerModal] = useState(false);
  const [showActivityLogModal, setShowActivityLogModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [teamMembersState, setTeamMembersState] = useState(mockTeamMembers);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownButtonRefs = useRef<{ [key: string]: React.RefObject<HTMLButtonElement> }>({});
  const searchInputRef = useRef<HTMLInputElement>(null);

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
        returnPath="/settings"
        returnLabel="Return to Settings"
      />
    );
  }

  const teamMembers = teamMembersState;
  const teamCapacity = mockTeamCapacity;

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
    return teamMembers.filter(m => m.department.toLowerCase() === dept.toLowerCase()).length;
  };

  const filteredMembers = teamMembers.filter(member => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' ||
      member.name.toLowerCase().includes(searchLower) ||
      member.email.toLowerCase().includes(searchLower) ||
      member.phone.toLowerCase().includes(searchLower) ||
      member.jobTitle.toLowerCase().includes(searchLower) ||
      member.department.toLowerCase().includes(searchLower) ||
      getRoleDisplayName(member.role).toLowerCase().includes(searchLower);
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || member.department.toLowerCase() === departmentFilter.toLowerCase();
    return matchesSearch && matchesRole && matchesStatus && matchesDepartment;
  });

  const handleUpgradePlan = (
    plan: 'business' | 'enterprise' | 'add-seat',
    billingCycle: 'monthly' | 'annual'
  ) => {
    if (plan === 'enterprise') {
      showToast('Redirecting to contact sales...', 'info');
      setTimeout(() => {
        setShowUpgradePlanModal(false);
        showToast('Sales team will contact you within 24 hours', 'success');
      }, 1500);
    } else if (plan === 'business') {
      showToast(`Upgrading to Business plan (${billingCycle})...`, 'info');
      setTimeout(() => {
        setShowUpgradePlanModal(false);
        showToast('Plan upgraded successfully! Your new seats are now available.', 'success');
      }, 2000);
    } else if (plan === 'add-seat') {
      showToast('Adding seat to your plan...', 'info');
      setTimeout(() => {
        setShowUpgradePlanModal(false);
        showToast('Seat added successfully! You now have 1 additional seat.', 'success');
      }, 1500);
    }
  };

  const handleEditMember = (member: TeamMember) => {
    setSelectedMember(member);
    setShowEditModal(true);
  };

  const handleSaveMember = (updatedMember: TeamMember, changes: any) => {
    // Handle deletion
    if (changes.deleted) {
      setTeamMembersState(prev => prev.filter(m => m.id !== updatedMember.id));
      setShowEditModal(false);
      setSelectedMember(null);
      showToast(`${updatedMember.name} has been permanently deleted`, 'success');
      return;
    }

    // Update member in state
    setTeamMembersState(prev =>
      prev.map(m => m.id === updatedMember.id ? updatedMember : m)
    );

    // Build change summary for toast
    const changesList = Object.keys(changes).filter(key => key !== 'deleted' && key !== 'deactivated');

    if (changesList.length > 0) {
      // Log changes to console (in real app, would send to backend)
      console.log('User Updated:', {
        action: 'User Updated',
        user: updatedMember.name,
        updatedBy: user?.name || 'Current Admin',
        changes: changes,
        timestamp: new Date().toISOString()
      });

      // Build notification message
      let notificationMessage = `${updatedMember.name} has been updated`;

      if (changes.status) {
        notificationMessage += ` (Status: ${changes.status.to})`;
      } else if (changes.role) {
        notificationMessage += ` (Role: ${changes.role.to})`;
      }

      showToast(notificationMessage, 'success');
    } else if (changes.deactivated) {
      showToast(`${updatedMember.name} has been deactivated`, 'success');
    } else {
      showToast('No changes were made', 'info');
    }

    setShowEditModal(false);
    setSelectedMember(null);
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
    setShowResetPasswordModal(true);
  };

  const handleResetPasswordConfirm = () => {
    if (!selectedMember) return;

    // Log activity
    console.log('Password Reset:', {
      action: 'Password Reset',
      user: selectedMember.name,
      initiatedBy: user?.name || 'Admin',
      timestamp: new Date().toISOString()
    });

    showToast(`Password reset email sent to ${selectedMember.email}`, 'success');
  };

  const handleSendWelcomeEmail = (member: TeamMember) => {
    setSelectedMember(member);
    setShowEmailComposerModal(true);
  };

  const handleEmailSend = (emailData: {
    subject: string;
    body: string;
    template: string;
    attachments?: File[];
  }) => {
    if (!selectedMember) return;

    // Log activity
    console.log('Email Sent:', {
      action: 'Email Sent',
      user: selectedMember.name,
      email: selectedMember.email,
      subject: emailData.subject,
      template: emailData.template,
      sentBy: user?.name || 'Admin',
      timestamp: new Date().toISOString()
    });

    showToast(`Email sent to ${selectedMember.name}`, 'success');
    setShowEmailComposerModal(false);
    setSelectedMember(null);
  };

  const handleEmailSaveDraft = (emailData: {
    subject: string;
    body: string;
    template: string;
  }) => {
    if (!selectedMember) return;

    // Log draft save
    console.log('Email Draft Saved:', {
      action: 'Email Draft Saved',
      user: selectedMember.name,
      subject: emailData.subject,
      savedBy: user?.name || 'Admin',
      timestamp: new Date().toISOString()
    });

    showToast('Email draft saved', 'info');
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

    showToast(`Account unlocked for ${member.name}`, 'success');
  };

  const handleViewActivityLog = (member: TeamMember) => {
    setSelectedMember(member);
    setShowActivityLogModal(true);
  };

  const handleDeactivateUser = (member: TeamMember) => {
    setSelectedMember(member);
    setShowDeactivateModal(true);
  };

  const handleDeactivateConfirm = (data: {
    reassignTo: string | null;
    sendNotification: boolean;
    reason: string;
  }) => {
    if (!selectedMember) return;

    setTeamMembersState(prev =>
      prev.map(m =>
        m.id === selectedMember.id
          ? { ...m, status: 'inactive' as const }
          : m
      )
    );

    const reassignedToMember = data.reassignTo
      ? teamMembersState.find(m => m.id === data.reassignTo)
      : null;

    // Log activity
    console.log('User Deactivated:', {
      action: 'User Deactivated',
      user: selectedMember.name,
      email: selectedMember.email,
      deactivatedBy: user?.name || 'Admin',
      reason: data.reason || 'Not specified',
      dealsReassignedTo: reassignedToMember?.name || 'Not reassigned',
      notificationSent: data.sendNotification,
      timestamp: new Date().toISOString()
    });

    // Show appropriate toast
    if (data.sendNotification) {
      showToast(`${selectedMember.name} has been deactivated. Notification email sent.`, 'success');
    } else {
      showToast(`${selectedMember.name} has been deactivated`, 'success');
    }
  };

  const handleDeleteUser = (member: TeamMember) => {
    setSelectedMember(member);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = (data: {
    dealsReassignTo: string;
    contactsReassignTo: string;
    tasksReassignTo: string;
  }) => {
    if (!selectedMember) return;

    const dealsManager = teamMembersState.find(m => m.id === data.dealsReassignTo);
    const contactsManager = teamMembersState.find(m => m.id === data.contactsReassignTo);
    const tasksManager = teamMembersState.find(m => m.id === data.tasksReassignTo);

    // Remove user from team
    setTeamMembersState(prev => prev.filter(m => m.id !== selectedMember.id));

    // Log comprehensive activity
    console.log('User Deleted Permanently:', {
      action: 'User Deleted Permanently',
      user: selectedMember.name,
      email: selectedMember.email,
      deletedBy: user?.name || 'Admin',
      dealsReassignedTo: `${dealsManager?.name} (${selectedMember.quickStats?.activeDeals || 0} deals)`,
      contactsReassignedTo: `${contactsManager?.name} (${selectedMember.quickStats?.totalProspects || 0} contacts)`,
      tasksReassignedTo: `${tasksManager?.name} (${selectedMember.quickStats?.openTasks || 0} tasks)`,
      timestamp: new Date().toISOString(),
      note: 'User and all associated data permanently deleted',
      recoverable: 'NO'
    });

    showToast(`${selectedMember.name} has been permanently deleted`, 'success');

    // Scroll to top after deletion
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeactivateInsteadOfDelete = () => {
    if (!selectedMember) return;
    setShowDeleteModal(false);
    setShowDeactivateModal(true);
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
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Add New Team Member
          </button>
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

          <div
            className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4 relative group cursor-help"
            title={`${teamCapacity.availableSeats} seats remaining on your ${teamCapacity.plan} plan. You can add ${teamCapacity.availableSeats} more team members without upgrading.`}
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-600">Available Seats</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{teamCapacity.availableSeats}</div>
            <div className="text-xs text-gray-600">${teamCapacity.costPerSeat}/seat/month</div>

            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
              {teamCapacity.availableSeats} seats remaining on your {teamCapacity.plan} plan.<br />
              You can add {teamCapacity.availableSeats} more team members without upgrading.
            </div>
          </div>

          <div
            className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4 relative group cursor-help"
            title={`Your ${teamCapacity.plan} plan includes ${teamCapacity.totalCapacity} user seats. Upgrade to Business (15 seats) or add individual seats.`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">Total Capacity</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{teamCapacity.totalCapacity}</div>
            <div className="text-xs text-gray-600">{teamCapacity.plan} plan</div>

            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
              Your {teamCapacity.plan} plan includes {teamCapacity.totalCapacity} user seats.<br />
              Upgrade to Business (15 seats) or add individual seats.
            </div>
          </div>

          <div
            className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4 relative group cursor-help"
            title="User data syncs automatically in real-time. Last manual refresh: 2 hours ago."
          >
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-600">Last Updated</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{teamCapacity.lastUpdated}</div>
            <div className="text-xs text-gray-600">Auto-sync enabled</div>

            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
              User data syncs automatically in real-time.<br />
              Last manual refresh: 2 hours ago.
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="font-semibold text-gray-900 mb-1">Plan: {teamCapacity.plan}</div>
              <div className="text-xs text-gray-500 mb-2">Tier {teamCapacity.planTier}</div>
              <div className="space-y-1 text-sm text-gray-600">
                <div>• Included seats: {teamCapacity.totalCapacity} users</div>
                <div>• Used seats: {teamCapacity.activeMembers + teamCapacity.inactiveMembers + teamCapacity.pendingInvites} users ({teamCapacity.utilization}% utilized)</div>
                <div>• Available seats: {teamCapacity.availableSeats}</div>
                <div>• Monthly cost: ${teamCapacity.monthlyCost} ({teamCapacity.activeMembers} seats × ${teamCapacity.costPerSeat})</div>
                <div>• Next billing: {teamCapacity.nextBillingDate} ({teamCapacity.planRenewal})</div>
                <div>• Auto-sync: {teamCapacity.autoSyncStatus} - Last sync: {teamCapacity.lastSync}</div>
              </div>
            </div>
            <button
              onClick={() => setShowUpgradePlanModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
            >
              Upgrade Plan
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="border-t border-gray-200 pt-3 mt-3">
            <div className="text-sm font-medium text-gray-900 mb-2">Upgrade Options:</div>
            <div className="space-y-1 text-sm text-gray-600">
              <div>• <span className="font-medium">Business Plan:</span> {teamCapacity.upgradeOptions.business.seats} seats included ({teamCapacity.upgradeOptions.business.price})</div>
              <div>• <span className="font-medium">Enterprise Plan:</span> {teamCapacity.upgradeOptions.enterprise.seats} seats ({teamCapacity.upgradeOptions.enterprise.price})</div>
            </div>
          </div>
        </div>
      </div>

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
              <button
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                  setDepartmentFilter('all');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Clear All Filters
              </button>
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
                    <p className={`text-sm ${member.status === 'inactive' ? 'text-gray-500' : 'text-gray-600'}`}>
                      {member.jobTitle}
                    </p>
                    <p className="text-xs text-gray-500">ID: {member.employeeId}</p>
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
                    isAccountLocked={member.accountLocked || false}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    {member.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    {member.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    {member.location}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Globe className="h-4 w-4" />
                    {member.timezone}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBadgeClass(member.status)}`}>
                      {getStatusIcon(member.status)} {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Role:</span> {getRoleDisplayName(member.role)}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Permissions:</span> {member.permissions}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Department:</span> {member.department}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <div className="space-y-2 text-sm">
                  {member.reportsTo && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="h-4 w-4" />
                      <span className="font-medium">Reports to:</span> {member.reportsTo}
                    </div>
                  )}
                  {member.directReports && member.directReports.length > 0 && (
                    <div className="flex items-start gap-2 text-gray-600">
                      <Users className="h-4 w-4 mt-0.5" />
                      <div>
                        <span className="font-medium">Manages:</span> {member.directReports.length} direct reports
                        <div className="text-xs text-gray-500 mt-1">({member.directReports.join(', ')})</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">Member since:</span>
                    </div>
                    <div className="text-gray-900 ml-6">{member.memberSince}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">Last login:</span>
                    </div>
                    <div className="text-gray-900 ml-6">{member.lastLogin}</div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="font-medium text-gray-900 mb-2">Quick Stats:</div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-blue-600" />
                    Active Deals: <span className="font-semibold text-gray-900">{member.quickStats.activeDeals}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                    Pipeline: <span className="font-semibold text-gray-900">{member.quickStats.pipeline}</span>
                  </div>
                  {member.quickStats.additionalInfo && (
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-600" />
                      {member.quickStats.additionalInfo}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleViewProfile(member)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  View Profile
                </button>
                {member.status === 'inactive' ? (
                  <>
                    <button
                      onClick={() => {
                        setTeamMembersState(prev =>
                          prev.map(m =>
                            m.id === member.id
                              ? { ...m, status: 'active' as const }
                              : m
                          )
                        );
                        showToast(`${member.name} has been reactivated`, 'success');
                        console.log('User Reactivated:', {
                          action: 'User Reactivated',
                          user: member.name,
                          reactivatedBy: user?.name || 'Admin',
                          timestamp: new Date().toISOString()
                        });
                      }}
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

      {/* Upgrade Plan Modal */}
      <UpgradePlanModal
        isOpen={showUpgradePlanModal}
        onClose={() => setShowUpgradePlanModal(false)}
        currentPlan={teamCapacity.plan}
        currentPrice={teamCapacity.monthlyCost}
        onUpgrade={handleUpgradePlan}
      />

      {/* Edit Team Member Modal */}
      <EditTeamMemberModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedMember(null);
        }}
        member={selectedMember}
        onSave={handleSaveMember}
        allMembers={teamMembers}
      />

      {/* Reset Password Modal */}
      {selectedMember && (
        <ResetPasswordModal
          isOpen={showResetPasswordModal}
          onClose={() => {
            setShowResetPasswordModal(false);
            setSelectedMember(null);
          }}
          userName={selectedMember.name}
          userEmail={selectedMember.email}
          onConfirm={handleResetPasswordConfirm}
        />
      )}

      {/* Email Composer Modal */}
      {selectedMember && (
        <TeamEmailComposerModal
          isOpen={showEmailComposerModal}
          onClose={() => {
            setShowEmailComposerModal(false);
            setSelectedMember(null);
          }}
          memberName={selectedMember.name}
          memberEmail={selectedMember.email}
          currentUserEmail={user?.email || 'admin@bmi.com'}
          onSend={handleEmailSend}
          onSaveDraft={handleEmailSaveDraft}
        />
      )}

      {/* View Activity Log Modal */}
      {selectedMember && (
        <ViewActivityLogModal
          isOpen={showActivityLogModal}
          onClose={() => {
            setShowActivityLogModal(false);
            setSelectedMember(null);
          }}
          userName={selectedMember.name}
          userId={selectedMember.id}
        />
      )}

      {/* Deactivate User Modal */}
      {selectedMember && (
        <DeactivateUserModal
          isOpen={showDeactivateModal}
          onClose={() => {
            setShowDeactivateModal(false);
            setSelectedMember(null);
          }}
          member={{
            id: selectedMember.id,
            name: selectedMember.name,
            email: selectedMember.email,
            role: selectedMember.jobTitle || selectedMember.role,
            activeDeals: selectedMember.quickStats?.activeDeals || 0,
            pipelineValue: selectedMember.quickStats?.pipeline || '$0',
            assignedContacts: selectedMember.quickStats?.totalProspects || 0,
            openTasks: selectedMember.quickStats?.openTasks || 0
          }}
          availableManagers={teamMembersState
            .filter(m =>
              m.id !== selectedMember.id &&
              m.status === 'active' &&
              (m.role === 'manager' || m.role === 'vp' || m.role === 'ceo')
            )
            .map(m => ({
              id: m.id,
              name: m.name,
              email: m.email,
              role: m.jobTitle || m.role
            }))
          }
          onConfirm={handleDeactivateConfirm}
        />
      )}

      {/* Delete User Modal */}
      {selectedMember && (
        <DeleteUserModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedMember(null);
          }}
          member={{
            id: selectedMember.id,
            name: selectedMember.name,
            email: selectedMember.email,
            role: selectedMember.jobTitle || selectedMember.role,
            activeDeals: selectedMember.quickStats?.activeDeals || 0,
            assignedContacts: selectedMember.quickStats?.totalProspects || 0,
            openTasks: selectedMember.quickStats?.openTasks || 0,
            totalActivities: 124,
            coachingNotes: 5
          }}
          availableManagers={teamMembersState
            .filter(m =>
              m.id !== selectedMember.id &&
              m.status === 'active'
            )
            .map(m => ({
              id: m.id,
              name: m.name,
              email: m.email,
              role: m.jobTitle || m.role
            }))
          }
          onConfirm={handleDeleteConfirm}
          onDeactivateInstead={handleDeactivateInsteadOfDelete}
        />
      )}
    </div>
  );
};

export default TeamManagement;
