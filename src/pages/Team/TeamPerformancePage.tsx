import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, Target, Trophy, Building2, Search, Download, ChevronDown, X, ExternalLink, AlertCircle } from 'lucide-react';

type Role = 'CEO' | 'VP' | 'Manager' | 'Rep' | 'Admin' | 'Analyst' | 'Support';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  manager: string;
  deals: number;
  pipeline: string;
  winRate: number;
  hrmsLeads: number;
  status: 'Active' | 'Inactive';
  initials: string;
}

interface HRMSLead {
  company: string;
  value: string;
  employeeName: string;
  recruitedDate: string;
  stage: string;
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    id: '1',
    name: 'Alex Rodriguez',
    email: 'alex@bmi.com',
    role: 'Sales Rep',
    manager: 'Sarah Chen',
    deals: 8,
    pipeline: '$450K',
    winRate: 67,
    hrmsLeads: 0,
    status: 'Active',
    initials: 'AR'
  },
  {
    id: '2',
    name: 'Sarah Chen',
    email: 'sarah@bmi.com',
    role: 'Sales Manager',
    manager: 'John Smith',
    deals: 12,
    pipeline: '$680K',
    winRate: 72,
    hrmsLeads: 2,
    status: 'Active',
    initials: 'SC'
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@bmi.com',
    role: 'Account Executive',
    manager: 'John Smith',
    deals: 6,
    pipeline: '$320K',
    winRate: 58,
    hrmsLeads: 1,
    status: 'Active',
    initials: 'MJ'
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily@bmi.com',
    role: 'Sales Rep',
    manager: 'Sarah Chen',
    deals: 5,
    pipeline: '$280K',
    winRate: 65,
    hrmsLeads: 0,
    status: 'Active',
    initials: 'ED'
  },
  {
    id: '5',
    name: 'John Smith',
    email: 'john@bmi.com',
    role: 'Sales Director',
    manager: 'CEO',
    deals: 15,
    pipeline: '$1.2M',
    winRate: 75,
    hrmsLeads: 0,
    status: 'Active',
    initials: 'JS'
  }
];

const HRMS_LEADS_DATA: Record<string, HRMSLead[]> = {
  '2': [
    {
      company: 'DataFlow Inc',
      value: '$120K',
      employeeName: 'Emma Wilson',
      recruitedDate: 'Oct 15, 2025',
      stage: 'Qualified'
    },
    {
      company: 'BigCo Enterprise',
      value: '$95K',
      employeeName: 'Alex Johnson',
      recruitedDate: 'Sep 22, 2025',
      stage: 'Proposal'
    }
  ],
  '3': [
    {
      company: 'TechStart Inc',
      value: '$75K',
      employeeName: 'Emma Wilson',
      recruitedDate: 'Oct 15, 2025',
      stage: 'Qualified'
    }
  ]
};

const ROLE_SCOPES: Record<Role, string> = {
  CEO: 'Company',
  VP: 'Department',
  Manager: 'Team',
  Rep: 'View Only',
  Admin: 'All Data',
  Analyst: 'All Data',
  Support: 'Restricted'
};

export default function TeamPerformancePage() {
  const navigate = useNavigate();
  const [currentRole, setCurrentRole] = useState<Role>('Manager');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [hrmsModalOpen, setHrmsModalOpen] = useState(false);
  const [selectedMemberHRMS, setSelectedMemberHRMS] = useState<string | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  const canViewHRMS = ['CEO', 'VP', 'Manager', 'Admin', 'Analyst'].includes(currentRole);
  const canExport = ['CEO', 'VP', 'Manager', 'Admin', 'Analyst'].includes(currentRole);
  const isRestricted = currentRole === 'Support';
  const repViewMode = currentRole === 'Rep';

  const handleExport = () => {
    alert('Exporting team performance report...');
  };

  const handleMemberClick = (memberId: string) => {
    navigate(`/team/${memberId}`);
  };

  const handleManagerClick = (managerName: string) => {
    const manager = TEAM_MEMBERS.find(m => m.name === managerName);
    if (manager) {
      navigate(`/team/${manager.id}`);
    }
  };

  const handleDealsClick = (memberName: string) => {
    navigate(`/deals?member=${encodeURIComponent(memberName)}`);
  };

  const handleHRMSBadgeClick = (memberId: string) => {
    if (canViewHRMS) {
      setSelectedMemberHRMS(memberId);
      setHrmsModalOpen(true);
    }
  };

  const handleViewContacts = (memberName: string) => {
    navigate(`/contacts?member=${encodeURIComponent(memberName)}`);
    setActionMenuOpen(null);
  };

  const handleViewActivities = (memberName: string) => {
    navigate(`/activity?member=${encodeURIComponent(memberName)}`);
    setActionMenuOpen(null);
  };

  // Role-based filtering
  const getVisibleMembers = () => {
    let visibleMembers = TEAM_MEMBERS;

    if (currentRole === 'Manager') {
      // Manager (Sarah Chen) sees only direct reports + self
      // Direct reports: Alex Rodriguez, Emily Davis
      visibleMembers = TEAM_MEMBERS.filter(m =>
        m.manager === 'Sarah Chen' || m.name === 'Sarah Chen'
      );
    } else if (currentRole === 'VP') {
      // VP sees department data (for demo: all except CEO's direct reports)
      visibleMembers = TEAM_MEMBERS.filter(m => m.manager !== 'CEO');
    }
    // CEO, Admin, Analyst, Rep see all members

    return visibleMembers;
  };

  const visibleMembers = getVisibleMembers();

  // Calculate stats based on visible members
  const teamSize = visibleMembers.length;
  const totalDeals = visibleMembers.reduce((sum, m) => sum + m.deals, 0);
  const totalPipelineValue = visibleMembers.reduce((sum, m) => {
    const value = parseInt(m.pipeline.replace(/[$KM,]/g, '')) * (m.pipeline.includes('M') ? 1000 : 1);
    return sum + value;
  }, 0);
  const avgWinRate = Math.round(visibleMembers.reduce((sum, m) => sum + m.winRate, 0) / visibleMembers.length);
  const totalHRMSLeads = visibleMembers.reduce((sum, m) => sum + m.hrmsLeads, 0);
  const formattedPipeline = totalPipelineValue >= 1000 ? `$${(totalPipelineValue / 1000).toFixed(1)}M` : `$${totalPipelineValue}K`;

  const filteredMembers = visibleMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'All Roles' || member.role === roleFilter;
    const matchesStatus = statusFilter === 'All Status' || member.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (isRestricted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-8">
        <div className="bg-white rounded-xl shadow-lg p-12 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Restricted</h2>
          <p className="text-slate-600 mb-6">
            Team Performance is not available for Support role. Contact your administrator for access.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-8">
        {/* Top Navigation Bar */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Team Performance</h1>
                  <p className="text-slate-600 text-sm">Track your team's success</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-slate-600 mb-1">View as:</div>
                <select
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value as Role)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="CEO">CEO</option>
                  <option value="VP">VP</option>
                  <option value="Manager">Manager</option>
                  <option value="Rep">Rep</option>
                  <option value="Admin">Admin</option>
                  <option value="Analyst">Analyst</option>
                  <option value="Support">Support</option>
                </select>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-600 mb-1">Scope:</div>
                <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200">
                  {ROLE_SCOPES[currentRole]}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        {!repViewMode && (
          <div className="grid grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-700">Team Size</h3>
              </div>
              <div className="text-3xl font-bold text-slate-800 mb-1">{teamSize}</div>
              <div className="text-xs text-slate-500">All Active</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h3 className="text-sm font-semibold text-slate-700">Active Deals</h3>
              </div>
              <div className="text-3xl font-bold text-slate-800 mb-1">{totalDeals}</div>
              <div className="text-xs text-slate-500">Across all</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-700">Total Pipeline</h3>
              </div>
              <div className="text-3xl font-bold text-slate-800 mb-1">{formattedPipeline}</div>
              <div className="text-xs text-green-600">+12% vs Q</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                <h3 className="text-sm font-semibold text-slate-700">Avg Win Rate</h3>
              </div>
              <div className="text-3xl font-bold text-slate-800 mb-1">{avgWinRate}%</div>
              <div className="text-xs text-green-600">Above tgt</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-green-600" />
                <h3 className="text-sm font-semibold text-slate-700">Quota</h3>
              </div>
              <div className="text-3xl font-bold text-slate-800 mb-1">112%</div>
              <div className="text-xs text-green-600">On track</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-orange-600" />
                <h3 className="text-sm font-semibold text-slate-700">HRMS Leads</h3>
              </div>
              <div className="text-3xl font-bold text-slate-800 mb-1">{visibleMembers.filter(m => m.hrmsLeads > 0).length}</div>
              <div className="text-xs text-slate-500">{totalHRMSLeads} conn</div>
            </div>
          </div>
        )}

        {/* HRMS Integration Status */}
        {canViewHRMS && !repViewMode && (
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">HRMS Integration Status</h3>
                <p className="text-sm text-slate-600">Recruitment-powered B2B leads</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Team Members Benefiting</h4>
                <div className="text-2xl font-bold text-orange-600 mb-3">
                  {visibleMembers.filter(m => m.hrmsLeads > 0).length} out of {teamSize}
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                  {visibleMembers
                    .filter(m => m.hrmsLeads > 0)
                    .map((member) => (
                      <div key={member.id} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span>{member.name}: {member.hrmsLeads} HRMS lead{member.hrmsLeads > 1 ? 's' : ''}</span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="bg-white rounded-lg p-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">HRMS Performance Stats</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total HRMS Leads:</span>
                    <span className="font-semibold text-slate-800">{totalHRMSLeads}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Conversion Rate:</span>
                    <span className="font-semibold text-green-600">50%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Pipeline Value:</span>
                    <span className="font-semibold text-slate-800">$315K</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">ROI vs Cold Leads:</span>
                    <span className="font-semibold text-orange-600">+33%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0">💡</div>
                <div className="text-sm text-slate-700">
                  <strong>Insight:</strong> Your company's recruitment activity is creating warm B2B sales opportunities.
                  HRMS-sourced leads show significantly higher close rates and faster sales cycles.
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/hrms/dashboard')}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
            >
              View HRMS Module
            </button>
          </div>
        )}

        {/* Action Bar */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between gap-4">
            {canExport && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            )}

            <div className={`flex items-center gap-3 ${canExport ? 'flex-1 justify-end' : 'w-full justify-end'}`}>
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search team members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>All Roles</option>
                <option>Sales Rep</option>
                <option>Sales Manager</option>
                <option>Account Executive</option>
                <option>Sales Director</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>All Status</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Team Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Member</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Role</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Manager</th>
                  {!repViewMode && (
                    <>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Deals</th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Pipeline</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Win %</th>
                      {canViewHRMS && (
                        <th className="text-center px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">HRMS</th>
                      )}
                    </>
                  )}
                  <th className="text-center px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="text-center px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                          {member.initials}
                        </div>
                        <div>
                          <button
                            onClick={() => handleMemberClick(member.id)}
                            className="font-semibold text-slate-800 hover:text-blue-600 transition-colors text-left"
                          >
                            {member.name}
                            {member.name === 'Alex Rodriguez' && (
                              <span className="ml-2 text-xs text-slate-500">(You)</span>
                            )}
                          </button>
                          <div className="text-sm text-slate-500">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{member.role}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleManagerClick(member.manager)}
                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                      >
                        {member.manager}
                      </button>
                    </td>
                    {!repViewMode && (
                      <>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleDealsClick(member.name)}
                            className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                          >
                            {member.deals}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-slate-800">{member.pipeline}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            member.winRate >= 70 ? 'bg-green-100 text-green-700' :
                            member.winRate >= 60 ? 'bg-blue-100 text-blue-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {member.winRate}%
                          </span>
                        </td>
                        {canViewHRMS && (
                          <td className="px-6 py-4 text-center">
                            {member.hrmsLeads > 0 ? (
                              <button
                                onClick={() => handleHRMSBadgeClick(member.id)}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold hover:bg-orange-200 transition-colors"
                              >
                                <Building2 className="w-3 h-3" />
                                {member.hrmsLeads}
                              </button>
                            ) : (
                              <span className="text-slate-400 text-sm">—</span>
                            )}
                          </td>
                        )}
                      </>
                    )}
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        member.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="relative">
                        <button
                          onClick={() => setActionMenuOpen(actionMenuOpen === member.id ? null : member.id)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <div className="flex flex-col gap-1">
                            <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                            <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                            <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                          </div>
                        </button>

                        {actionMenuOpen === member.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setActionMenuOpen(null)}
                            ></div>
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-20">
                              <button
                                onClick={() => {
                                  handleMemberClick(member.id);
                                  setActionMenuOpen(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                View Profile
                              </button>
                              <button
                                onClick={() => {
                                  handleDealsClick(member.name);
                                  setActionMenuOpen(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                View Deals
                              </button>
                              <button
                                onClick={() => handleViewContacts(member.name)}
                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                View Contacts
                              </button>
                              <button
                                onClick={() => handleViewActivities(member.name)}
                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                View Activities
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Showing {filteredMembers.length} of {TEAM_MEMBERS.length} team members
            </p>
          </div>
        </div>

        {/* HRMS Modal */}
        {hrmsModalOpen && selectedMemberHRMS && HRMS_LEADS_DATA[selectedMemberHRMS] && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-amber-600 text-white p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">HRMS Connection Details</h3>
                    <p className="text-sm text-orange-100">
                      {TEAM_MEMBERS.find(m => m.id === selectedMemberHRMS)?.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setHrmsModalOpen(false);
                    setSelectedMemberHRMS(null);
                  }}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">💡</div>
                    <div className="text-sm text-slate-700">
                      <strong>Recruitment Context:</strong> These B2B sales opportunities originated from your company's
                      HRMS recruitment activity. When your HR team hired employees from these companies, it created
                      warm introduction opportunities for your sales team.
                    </div>
                  </div>
                </div>

                <h4 className="text-lg font-bold text-slate-800 mb-4">
                  HRMS-Sourced Leads ({HRMS_LEADS_DATA[selectedMemberHRMS].length})
                </h4>

                <div className="space-y-4">
                  {HRMS_LEADS_DATA[selectedMemberHRMS].map((lead, index) => (
                    <div key={index} className="border border-slate-200 rounded-lg p-4 hover:border-orange-300 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h5 className="font-semibold text-slate-800 text-lg">{lead.company}</h5>
                          <div className="text-2xl font-bold text-orange-600 mt-1">{lead.value}</div>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                          {lead.stage}
                        </span>
                      </div>

                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                        <div className="text-xs font-semibold text-orange-700 mb-2">🤝 WARM INTRODUCTION PATH</div>
                        <div className="text-sm text-slate-700">
                          <strong>{lead.employeeName}</strong> was recruited from {lead.company} on {lead.recruitedDate}.
                          This hiring relationship provides a natural conversation starter and credibility boost.
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-slate-600">Employee Recruited:</span>
                          <div className="font-semibold text-slate-800">{lead.employeeName}</div>
                        </div>
                        <div>
                          <span className="text-slate-600">Recruited Date:</span>
                          <div className="font-semibold text-slate-800">{lead.recruitedDate}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="text-sm font-semibold text-green-700 mb-2">📊 HRMS Lead Performance</div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-green-600 font-semibold">+33%</div>
                        <div className="text-slate-600">Higher close rate</div>
                      </div>
                      <div>
                        <div className="text-green-600 font-semibold">-25%</div>
                        <div className="text-slate-600">Faster sales cycle</div>
                      </div>
                      <div>
                        <div className="text-green-600 font-semibold">+15%</div>
                        <div className="text-slate-600">Higher deal value</div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/hrms/dashboard')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View in HRMS Module
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
