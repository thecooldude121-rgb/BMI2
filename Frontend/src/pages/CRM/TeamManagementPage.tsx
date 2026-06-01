import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, Filter, Download, Upload, MoreVertical, TrendingUp, TrendingDown, Target, DollarSign, Award, Activity, Clock, Mail, Phone, MapPin, Calendar, BarChart3, Trophy, Star, CheckCircle, XCircle, AlertCircle, ArrowUp, ArrowDown, Minus, Settings, UserPlus, CreditCard as Edit, Trash2, Eye, MessageSquare, ArrowRight, Shield, BarChart3 as BarChart3Icon } from 'lucide-react';
import CRMNavigation from '../../components/CRM/CRMNavigation';
import { teamMembers as initialTeamMembers, teamStats, recentTeamActivities, territories, teamGoals, leaderboard } from '../../utils/sampleTeamData';
import { TeamMember } from '../../types/team';
import { useToast } from '../../contexts/ToastContext';
import AddTeamMemberModal from '../../components/Team/AddTeamMemberModal';
import NoSeatsAvailableModal from '../../components/Team/NoSeatsAvailableModal';
import ImportUsersModal from '../../components/Team/ImportUsersModal';
import ExportUsersModal from '../../components/Team/ExportUsersModal';
import UserActivityReportModal from '../../components/Team/UserActivityReportModal';
import AuditLogModal from '../../components/Team/AuditLogModal';

export default function TeamManagementPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeamMembers);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedView, setSelectedView] = useState<'grid' | 'list' | 'hierarchy'>('grid');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'members' | 'performance' | 'territories' | 'goals'>('overview');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showNoSeatsModal, setShowNoSeatsModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [showActivityReportModal, setShowActivityReportModal] = useState(false);
  const [showAuditLogModal, setShowAuditLogModal] = useState(false);

  // Plan and seat management
  const planName = 'Professional Plan';
  const totalSeats = 5;
  const activeMembers = teamMembers.filter(m => m.status === 'active').length;
  const availableSeats = totalSeats - activeMembers;

  const filteredMembers = useMemo(() => {
    return teamMembers.filter(member => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.title.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === 'all' || member.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || member.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [searchQuery, roleFilter, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'away': return 'bg-yellow-100 text-yellow-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      'admin': 'Admin',
      'sales_manager': 'Sales Manager',
      'sales_rep': 'Sales Rep',
      'account_executive': 'Account Executive',
      'sales_development_rep': 'SDR',
      'customer_success': 'Customer Success',
      'marketing': 'Marketing'
    };
    return roleMap[role] || role;
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 5) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  const getGoalStatusColor = (status: string) => {
    switch (status) {
      case 'on-track': return 'text-green-600 bg-green-50';
      case 'at-risk': return 'text-yellow-600 bg-yellow-50';
      case 'behind': return 'text-red-600 bg-red-50';
      case 'completed': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleAddMember = () => {
    // Check seat availability before opening modal
    if (availableSeats > 0) {
      setShowAddMemberModal(true);
    } else {
      setShowNoSeatsModal(true);
    }
  };

  const handleAddNewMember = (newMember: Partial<TeamMember>) => {
    // Add the member with all properties from modal
    const completeMember = newMember as TeamMember;

    setTeamMembers(prev => [...prev, completeMember]);

    // Show success toast
    showToast(`${newMember.name} has been added to the team successfully`, 'success');

    // Log activity
    console.log('Activity Log:', {
      action: 'User Added',
      userAdded: newMember.name,
      addedBy: 'Current Admin',
      date: new Date().toISOString(),
      roleAssigned: newMember.role,
      department: newMember.department
    });

    // Simulate sending welcome email
    if (newMember.email) {
      console.log('Welcome Email Sent:', {
        to: newMember.email,
        subject: 'Welcome to BMI CRM - Your Account is Ready',
        loginLink: 'https://bmi.com/login'
      });
    }
  };

  const handleExportTeam = () => {
    setShowExportModal(true);
  };

  const handleExportComplete = (format: 'csv' | 'pdf' | 'json', message: string) => {
    showToast(message, 'success');
  };

  const handleMemberClick = (member: TeamMember) => {
    showToast(`Opening profile for ${member.name}`, 'info');
  };

  const handleDeactivateUser = () => {
    setShowNoSeatsModal(false);
    showToast('Navigate to user management to deactivate users', 'info');
    // In a real app, this would navigate to a user management page
    // navigate('/crm/team-management?action=deactivate');
  };

  const handleUpgradePlan = () => {
    setShowNoSeatsModal(false);
    showToast('Opening billing and upgrade options...', 'info');
    // In a real app, this would navigate to billing/upgrade page
    // navigate('/settings/billing?action=upgrade');
  };

  const handleImportUsers = (users: Partial<TeamMember>[]) => {
    const importedMembers = users as TeamMember[];
    setTeamMembers([...teamMembers, ...importedMembers]);

    const validCount = importedMembers.length;
    const warningCount = 0; // Would track actual warnings from validation
    const errorCount = 0; // Would track actual errors from validation

    let message = `${validCount} team member${validCount !== 1 ? 's' : ''} imported successfully.`;
    if (warningCount > 0) {
      message += ` ${warningCount} duplicate${warningCount !== 1 ? 's' : ''} skipped.`;
    }
    if (errorCount > 0) {
      message += ` ${errorCount} error${errorCount !== 1 ? 's' : ''} (see import log).`;
    }

    showToast(message, 'success');
  };

  const handleViewTeamPerformance = () => {
    showToast('Opening Team Performance dashboard', 'info');
    navigate('/team');
  };

  const handleConfigureRolePermissions = () => {
    setShowComingSoonModal(true);
  };

  const handleViewActivityReport = () => {
    setShowActivityReportModal(true);
  };

  const handleExportActivityReport = (format: 'pdf' | 'csv', dateRange: string) => {
    const today = new Date().toISOString().split('T')[0];
    const fileName = `user_activity_report_${today}.${format}`;
    showToast(`Exporting activity report as ${format.toUpperCase()}...`, 'success');

    setTimeout(() => {
      showToast(`Report "${fileName}" downloaded successfully`, 'success');
      setShowActivityReportModal(false);
    }, 1500);
  };

  const handleViewAuditLog = () => {
    setShowAuditLogModal(true);
  };

  const handleExportAuditLog = (entries: any[], dateRange: string) => {
    const today = new Date().toISOString().split('T')[0];
    const fileName = `audit_log_${today}.csv`;
    showToast('Exporting audit log...', 'success');

    setTimeout(() => {
      showToast(`Audit log "${fileName}" downloaded successfully (${entries.length} entries)`, 'success');
      setShowAuditLogModal(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CRMNavigation />

      <div className="px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
                <p className="text-gray-600 mt-1">Manage your sales team, track performance, and assign territories</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportTeam}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Import Users
              </button>
              <button
                onClick={handleAddMember}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add New Team Member
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Quick Actions</h3>
                <p className="text-xs text-gray-600">Monitor team metrics and performance tracking</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleViewTeamPerformance}
                  className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-colors font-medium text-sm shadow-sm"
                >
                  <Users className="w-4 h-4" />
                  View Team Performance
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleConfigureRolePermissions}
                  className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 hover:border-purple-400 transition-colors font-medium text-sm shadow-sm"
                >
                  <Shield className="w-4 h-4" />
                  Configure Role Permissions
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleViewActivityReport}
                  className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-green-300 text-green-700 rounded-lg hover:bg-green-50 hover:border-green-400 transition-colors font-medium text-sm shadow-sm"
                >
                  <BarChart3Icon className="w-4 h-4" />
                  View User Activity Report
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleViewAuditLog}
                  className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-400 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-500 transition-colors font-medium text-sm shadow-sm"
                >
                  <Shield className="w-4 h-4" />
                  Audit Log
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-6">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'members', label: 'Team Members', icon: Users },
              { id: 'performance', label: 'Performance', icon: Trophy },
              { id: 'territories', label: 'Territories', icon: MapPin },
              { id: 'goals', label: 'Goals', icon: Target }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${
                  selectedTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    +12%
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{teamStats.totalMembers}</div>
                <div className="text-sm text-gray-600">Total Members</div>
                <div className="mt-2 text-xs text-gray-500">{teamStats.activeMembers} active now</div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    +18%
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(teamStats.totalRevenue)}</div>
                <div className="text-sm text-gray-600">Total Revenue</div>
                <div className="mt-2 text-xs text-gray-500">Quota: {teamStats.quotaAttainment}%</div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Trophy className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    +24%
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{teamStats.dealsWon}</div>
                <div className="text-sm text-gray-600">Deals Won</div>
                <div className="mt-2 text-xs text-gray-500">{teamStats.dealsInProgress} in progress</div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Target className="w-5 h-5 text-amber-600" />
                  </div>
                  <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    +8%
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{teamStats.avgWinRate.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Avg Win Rate</div>
                <div className="mt-2 text-xs text-gray-500">Pipeline: {formatCurrency(teamStats.totalPipeline)}</div>
              </div>
            </div>

            {/* Recent Activity & Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Team Activity */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
                </div>
                <div className="space-y-4">
                  {recentTeamActivities.slice(0, 6).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {activity.userAvatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{activity.userName}</span>
                          <span className="text-sm text-gray-500">{getTimeAgo(activity.timestamp)}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium text-gray-900">{activity.action}</span>
                          {' - '}
                          {activity.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Leaderboard */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Leaderboard</h3>
                  <select className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>This Month</option>
                    <option>This Quarter</option>
                    <option>This Year</option>
                  </select>
                </div>
                <div className="space-y-3">
                  {leaderboard.rankings.slice(0, 5).map((ranking) => (
                    <div key={ranking.memberId} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        ranking.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                        ranking.rank === 2 ? 'bg-gray-100 text-gray-700' :
                        ranking.rank === 3 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-50 text-gray-600'
                      }`}>
                        {ranking.rank}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {ranking.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">{ranking.memberName}</div>
                        <div className="text-sm text-gray-600">{formatCurrency(ranking.score)}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        {ranking.change > 0 && <ArrowUp className="w-4 h-4 text-green-600" />}
                        {ranking.change < 0 && <ArrowDown className="w-4 h-4 text-red-600" />}
                        {ranking.change === 0 && <Minus className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Members Tab */}
        {selectedTab === 'members' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Roles</option>
                  <option value="sales_manager">Sales Manager</option>
                  <option value="account_executive">Account Executive</option>
                  <option value="sales_development_rep">SDR</option>
                  <option value="customer_success">Customer Success</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="away">Away</option>
                  <option value="offline">Offline</option>
                </select>
                <div className="flex gap-2 border-l border-gray-200 pl-4">
                  <button
                    onClick={() => setSelectedView('grid')}
                    className={`p-2 rounded-lg ${selectedView === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setSelectedView('list')}
                    className={`p-2 rounded-lg ${selectedView === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Grid View */}
            {selectedView === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    onClick={() => handleMemberClick(member)}
                    className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                          {member.avatar}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
                          member.status === 'active' ? 'bg-green-500' :
                          member.status === 'away' ? 'bg-yellow-500' :
                          'bg-gray-400'
                        }`} />
                      </div>
                      <button className="p-1.5 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>

                    <h3 className="font-bold text-gray-900 mb-1">{member.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{member.title}</p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{member.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{member.location}</span>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4 space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">Quota Attainment</span>
                          <span className="font-bold text-gray-900">{member.performance.quotaAttainment}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                            style={{ width: `${Math.min(member.performance.quotaAttainment, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Revenue</div>
                          <div className="font-bold text-gray-900">{formatCurrency(member.performance.revenue)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Deals Won</div>
                          <div className="font-bold text-gray-900">{member.performance.dealsWon}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium text-sm transition-colors">
                        View Profile
                      </button>
                      <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <MessageSquare className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* List View */}
            {selectedView === 'list' && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Territory</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quota</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Win Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                                {member.avatar}
                              </div>
                              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                                member.status === 'active' ? 'bg-green-500' :
                                member.status === 'away' ? 'bg-yellow-500' :
                                'bg-gray-400'
                              }`} />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{member.name}</div>
                              <div className="text-sm text-gray-600">{member.title}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-sm font-medium">
                            {getRoleDisplay(member.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.territory || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-gray-900">{formatCurrency(member.performance.revenue)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${
                              member.performance.quotaAttainment >= 100 ? 'text-green-600' :
                              member.performance.quotaAttainment >= 80 ? 'text-blue-600' :
                              'text-amber-600'
                            }`}>
                              {member.performance.quotaAttainment}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium text-gray-900">{member.metrics.winRate.toFixed(1)}%</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                            {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Performance Tab */}
        {selectedTab === 'performance' && (
          <div className="space-y-6">
            {/* Performance Chart Placeholder */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Team Performance Trends</h3>
              <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Performance chart visualization</p>
                  <p className="text-sm text-gray-500 mt-2">Would show revenue, deals, activities over time</p>
                </div>
              </div>
            </div>

            {/* Top Performers */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {leaderboard.rankings.slice(0, 3).map((ranking, index) => (
                <div key={ranking.memberId} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                      index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                      index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                      'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
                    }`}>
                      {ranking.rank}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{ranking.memberName}</div>
                      <div className="text-sm text-gray-600">Top Performer</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Revenue</span>
                      <span className="font-bold text-gray-900">{formatCurrency(ranking.score)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {ranking.badges.map((badge, i) => (
                        <span key={i} className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-medium">
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Territories Tab */}
        {selectedTab === 'territories' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {territories.map((territory) => (
                <div key={territory.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${territory.color}20` }}
                      >
                        <MapPin className="w-6 h-6" style={{ color: territory.color }} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{territory.name}</h3>
                        <p className="text-sm text-gray-600">{territory.region}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Quota Achievement</span>
                        <span className="font-bold text-gray-900">
                          {((territory.revenue / territory.quota) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min((territory.revenue / territory.quota) * 100, 100)}%`,
                            backgroundColor: territory.color
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Revenue</div>
                        <div className="font-bold text-gray-900">{formatCurrency(territory.revenue)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Accounts</div>
                        <div className="font-bold text-gray-900">{territory.accounts}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-600 mb-2">Assigned To:</div>
                      <div className="flex -space-x-2">
                        {territory.assignedTo.map((memberId) => {
                          const member = teamMembers.find(m => m.id === memberId);
                          return member ? (
                            <div
                              key={memberId}
                              className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs border-2 border-white"
                              title={member.name}
                            >
                              {member.avatar}
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Goals Tab */}
        {selectedTab === 'goals' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {teamGoals.map((goal) => {
                const progress = (goal.currentValue / goal.targetValue) * 100;
                return (
                  <div key={goal.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-gray-900">{goal.title}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getGoalStatusColor(goal.status)}`}>
                            {goal.status.replace('-', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                      </div>
                      <div className={`p-2 rounded-lg ${
                        goal.priority === 'high' ? 'bg-red-50' :
                        goal.priority === 'medium' ? 'bg-yellow-50' :
                        'bg-gray-50'
                      }`}>
                        <Target className={`w-5 h-5 ${
                          goal.priority === 'high' ? 'text-red-600' :
                          goal.priority === 'medium' ? 'text-yellow-600' :
                          'text-gray-600'
                        }`} />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-bold text-gray-900">
                            {goal.currentValue.toLocaleString()} / {goal.targetValue.toLocaleString()}
                            {goal.unit === 'revenue' && ' $'}
                          </span>
                        </div>
                        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              goal.status === 'completed' ? 'bg-blue-600' :
                              goal.status === 'on-track' ? 'bg-green-600' :
                              goal.status === 'at-risk' ? 'bg-yellow-600' :
                              'bg-red-600'
                            }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{progress.toFixed(0)}% complete</div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>Due: {new Date(goal.deadline).toLocaleDateString()}</span>
                        </div>
                        <div className="flex -space-x-2">
                          {goal.assignedTo.slice(0, 3).map((memberId) => {
                            const member = teamMembers.find(m => m.id === memberId);
                            return member ? (
                              <div
                                key={memberId}
                                className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs border-2 border-white"
                                title={member.name}
                              >
                                {member.avatar}
                              </div>
                            ) : null;
                          })}
                          {goal.assignedTo.length > 3 && (
                            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium border-2 border-white">
                              +{goal.assignedTo.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add Team Member Modal */}
      <AddTeamMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        onAdd={handleAddNewMember}
        existingMembers={teamMembers}
      />

      {/* No Seats Available Modal */}
      <NoSeatsAvailableModal
        isOpen={showNoSeatsModal}
        onClose={() => setShowNoSeatsModal(false)}
        planName={planName}
        totalSeats={totalSeats}
        usedSeats={activeMembers}
        onDeactivateUser={handleDeactivateUser}
        onUpgradePlan={handleUpgradePlan}
      />

      {/* Import Users Modal */}
      <ImportUsersModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportUsers}
        existingMembers={teamMembers}
        totalSeats={totalSeats}
        usedSeats={activeMembers}
      />

      {/* Export Users Modal */}
      <ExportUsersModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExportComplete}
        teamMembers={teamMembers}
      />

      {/* User Activity Report Modal */}
      <UserActivityReportModal
        isOpen={showActivityReportModal}
        onClose={() => setShowActivityReportModal(false)}
        onExport={handleExportActivityReport}
      />

      {/* Audit Log Modal */}
      <AuditLogModal
        isOpen={showAuditLogModal}
        onClose={() => setShowAuditLogModal(false)}
        onExport={handleExportAuditLog}
      />

      {/* Coming Soon Modal */}
      {showComingSoonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-xl">
              <h3 className="text-xl font-bold">Feature Coming Soon</h3>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-center justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                  <Shield className="w-10 h-10 text-purple-600" />
                </div>
              </div>

              <h4 className="text-lg font-bold text-gray-900 mb-3 text-center">
                Role Permissions Configuration
              </h4>

              <p className="text-sm text-gray-600 mb-4">
                This feature will allow you to:
              </p>

              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>View permissions matrix</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Customize role permissions</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Create custom roles</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Set granular access controls</span>
                </li>
              </ul>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold text-blue-900">Expected Release:</span> Q1 2025
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowComingSoonModal(false);
                    showToast('You will be notified when this feature is available', 'success');
                  }}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Notify Me
                </button>
                <button
                  onClick={() => setShowComingSoonModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
