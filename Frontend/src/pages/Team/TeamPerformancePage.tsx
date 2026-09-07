import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, Target, Trophy, Search, Download } from 'lucide-react';
import { NotAvailable } from '../../components/common/NotAvailable';

type Role = 'CEO' | 'VP' | 'Manager' | 'Rep' | 'Admin' | 'Analyst' | 'Support';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  manager: string;
  status: 'Active' | 'Inactive';
  initials: string;
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    id: '1',
    name: 'Alex Rodriguez',
    email: 'alex@bmi.com',
    role: 'Sales Rep',
    manager: 'Sarah Chen',
    status: 'Active',
    initials: 'AR'
  },
  {
    id: '2',
    name: 'Sarah Chen',
    email: 'sarah@bmi.com',
    role: 'Sales Manager',
    manager: 'John Smith',
    status: 'Active',
    initials: 'SC'
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@bmi.com',
    role: 'Account Executive',
    manager: 'John Smith',
    status: 'Active',
    initials: 'MJ'
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily@bmi.com',
    role: 'Sales Rep',
    manager: 'Sarah Chen',
    status: 'Active',
    initials: 'ED'
  },
  {
    id: '5',
    name: 'John Smith',
    email: 'john@bmi.com',
    role: 'Sales Director',
    manager: 'CEO',
    status: 'Active',
    initials: 'JS'
  }
];

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
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

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
  // Aggregates over `deals`, `pipeline` and `winRate` lived here. Those fields
  // are gone from the fixture (they were invented), so there is nothing to sum.

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
          <Button
            onClick={() => navigate('/dashboard')}
            size="lg"
          >
            Return to Dashboard
          </Button>
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

        {/*
          STOPGAP — every figure below TEAM_MEMBERS is a hardcoded literal, and
          this page has no data layer at all (no fetch, no data hook). The
          numbers that used to render here were invented: per-rep deal counts,
          pipeline totals, win rates and a flat "Quota 112% / On track".

          They are blanked to "—" rather than left under a label because these
          are PERFORMANCE FIGURES ABOUT REAL, NAMED EMPLOYEES — Alex Rodriguez,
          Sarah Chen, Mike Johnson, Emily Davis and David Kumar are all real
          users in this workspace. A fabricated quota attainment next to a real
          person's name can be screenshotted into a review or a comp
          conversation, which puts it in the same class as a fabricated
          credential: the blast radius extends outside the app. CLAUDE.md's
          no-fabricated-data rule says that class gets deleted, not labelled.

          Wiring this up needs backend work that does not exist yet: `users` has
          no manager relation (only `employees.manager_id`, which is HRMS-owned
          and must not be joined), `quotas` is empty and keyed by `rep_name`
          rather than a user id, and `deals.assigned_to` is a display-name
          string, so per-rep aggregation cannot be done reliably. See the
          fabricated-data scoping report.
        */}
        <NotAvailable
          feature="Team performance reporting"
          detail="Nothing on this page is connected to your data yet. The team roster, deal counts, pipeline totals, win rates and quota attainment are all placeholders — they are not calculated from your workspace. Per-rep reporting needs a manager relationship on users, quota records, and deal ownership stored as a user reference rather than a name."
          className="mb-6"
        />

        {/* Stats Bar */}
        {!repViewMode && (
          <div className="grid grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-700">Team Size</h3>
              </div>
              <div className="text-3xl font-bold text-slate-300 mb-1">—</div>
              <div className="text-xs text-slate-400">Not connected</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h3 className="text-sm font-semibold text-slate-700">Active Deals</h3>
              </div>
              <div className="text-3xl font-bold text-slate-300 mb-1">—</div>
              <div className="text-xs text-slate-400">Not connected</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-700">Total Pipeline</h3>
              </div>
              <div className="text-3xl font-bold text-slate-300 mb-1">—</div>
              <div className="text-xs text-slate-400">Not connected</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                <h3 className="text-sm font-semibold text-slate-700">Avg Win Rate</h3>
              </div>
              <div className="text-3xl font-bold text-slate-300 mb-1">—</div>
              <div className="text-xs text-slate-400">Not connected</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-green-600" />
                <h3 className="text-sm font-semibold text-slate-700">Quota</h3>
              </div>
              <div className="text-3xl font-bold text-slate-300 mb-1">—</div>
              <div className="text-xs text-slate-400">Not connected</div>
            </div>
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
                        {/* Deal count, pipeline and win rate were invented
                            literals attached to a real named employee. Blanked
                            until per-rep aggregation is possible — see the
                            banner above. The "view this rep's deals" link is
                            kept, because it navigates by name to a page that
                            filters real deals. */}
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleDealsClick(member.name)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                          >
                            View deals
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-slate-300">—</td>
                        <td className="px-6 py-4 text-center text-sm text-slate-300">—</td>
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

      </div>
    </div>
  );
}
