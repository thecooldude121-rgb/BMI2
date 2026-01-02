import React, { useState } from 'react';
import {
  Users, Plus, Edit, Trash2, Search, Filter, ChevronRight, ChevronDown,
  Building, GitBranch, Globe, Award, Shield, Calendar, TrendingUp, Activity,
  Settings, Copy, Download, Upload, RefreshCw, CheckCircle, AlertCircle,
  Eye, UserPlus, UserMinus, Target, BarChart, Layers, Share2, Bell, X
} from 'lucide-react';

interface UserGroup {
  id: string;
  name: string;
  type: 'department' | 'project' | 'regional' | 'skill' | 'security';
  description: string;
  parentId?: string;
  level: number;
  memberCount: number;
  activeMembers: number;
  permissions: string[];
  autoAssignmentRules?: {
    field: string;
    operator: string;
    value: string;
  }[];
  createdAt: string;
  manager?: string;
  isExpanded?: boolean;
}

interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
  email: string;
  role: string;
  joinedAt: string;
  expiresAt?: string;
  status: 'active' | 'pending' | 'expired';
}

const UserGroups: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'groups' | 'members' | 'analytics'>('hierarchy');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupType, setSelectedGroupType] = useState<string>('all');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['1', '2', '5']));

  const [groups, setGroups] = useState<UserGroup[]>([
    {
      id: '1',
      name: 'Sales Organization',
      type: 'department',
      description: 'Global sales teams and operations',
      level: 0,
      memberCount: 145,
      activeMembers: 142,
      permissions: ['view_leads', 'edit_leads', 'view_deals', 'edit_deals'],
      manager: 'John Smith',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: '3',
      name: 'North America Sales',
      type: 'regional',
      description: 'Sales team covering North American region',
      parentId: '1',
      level: 1,
      memberCount: 65,
      activeMembers: 64,
      permissions: ['view_leads', 'edit_leads', 'view_deals'],
      manager: 'Sarah Johnson',
      createdAt: '2024-01-05T00:00:00Z'
    },
    {
      id: '4',
      name: 'EMEA Sales',
      type: 'regional',
      description: 'Sales team covering Europe, Middle East, and Africa',
      parentId: '1',
      level: 1,
      memberCount: 52,
      activeMembers: 51,
      permissions: ['view_leads', 'edit_leads', 'view_deals'],
      manager: 'David Brown',
      createdAt: '2024-01-05T00:00:00Z'
    },
    {
      id: '7',
      name: 'Enterprise Sales',
      type: 'skill',
      description: 'Specialized team for enterprise deals',
      parentId: '3',
      level: 2,
      memberCount: 18,
      activeMembers: 18,
      permissions: ['view_leads', 'edit_leads', 'view_deals', 'edit_deals', 'delete_deals'],
      manager: 'Michael Chen',
      autoAssignmentRules: [
        { field: 'deal_value', operator: 'greater_than', value: '100000' }
      ],
      createdAt: '2024-01-10T00:00:00Z'
    },
    {
      id: '2',
      name: 'Marketing',
      type: 'department',
      description: 'Marketing and brand management',
      level: 0,
      memberCount: 42,
      activeMembers: 41,
      permissions: ['view_campaigns', 'edit_campaigns', 'view_analytics'],
      manager: 'Emily Davis',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: '8',
      name: 'Digital Marketing',
      type: 'skill',
      description: 'Online marketing and social media',
      parentId: '2',
      level: 1,
      memberCount: 24,
      activeMembers: 24,
      permissions: ['view_campaigns', 'edit_campaigns', 'view_analytics'],
      manager: 'Alex Turner',
      createdAt: '2024-01-12T00:00:00Z'
    },
    {
      id: '5',
      name: 'Product Launch 2024',
      type: 'project',
      description: 'Cross-functional team for new product launch',
      level: 0,
      memberCount: 28,
      activeMembers: 28,
      permissions: ['view_all', 'edit_project_data'],
      manager: 'Rachel Green',
      createdAt: '2024-01-15T00:00:00Z'
    },
    {
      id: '6',
      name: 'Security Administrators',
      type: 'security',
      description: 'System administrators and security team',
      level: 0,
      memberCount: 8,
      activeMembers: 8,
      permissions: ['admin_access', 'security_management', 'user_management'],
      manager: 'Robert Wilson',
      createdAt: '2024-01-01T00:00:00Z'
    }
  ]);

  const [groupMembers] = useState<GroupMember[]>([
    {
      id: '1',
      groupId: '7',
      userId: 'u1',
      userName: 'Michael Chen',
      email: 'michael.chen@company.com',
      role: 'Manager',
      joinedAt: '2024-01-10T00:00:00Z',
      status: 'active'
    },
    {
      id: '2',
      groupId: '7',
      userId: 'u2',
      userName: 'Jennifer Lee',
      email: 'jennifer.lee@company.com',
      role: 'Senior Sales Executive',
      joinedAt: '2024-01-11T00:00:00Z',
      status: 'active'
    },
    {
      id: '3',
      groupId: '5',
      userId: 'u3',
      userName: 'Tom Anderson',
      email: 'tom.anderson@company.com',
      role: 'Project Member',
      joinedAt: '2024-01-15T00:00:00Z',
      expiresAt: '2024-06-30T00:00:00Z',
      status: 'active'
    }
  ]);

  const toggleGroupExpansion = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const getGroupIcon = (type: string) => {
    switch (type) {
      case 'department': return Building;
      case 'project': return Target;
      case 'regional': return Globe;
      case 'skill': return Award;
      case 'security': return Shield;
      default: return Users;
    }
  };

  const getGroupColor = (type: string) => {
    switch (type) {
      case 'department': return 'blue';
      case 'project': return 'purple';
      case 'regional': return 'green';
      case 'skill': return 'orange';
      case 'security': return 'red';
      default: return 'gray';
    }
  };

  const renderGroupHierarchy = (parentId?: string, level: number = 0) => {
    const childGroups = groups.filter(g => g.parentId === parentId);

    return childGroups.map(group => {
      const Icon = getGroupIcon(group.type);
      const color = getGroupColor(group.type);
      const hasChildren = groups.some(g => g.parentId === group.id);
      const isExpanded = expandedGroups.has(group.id);

      return (
        <div key={group.id} className="mb-2">
          <div
            className={`border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer bg-white`}
            style={{ marginLeft: `${level * 32}px` }}
            onClick={() => setSelectedGroup(group)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                {hasChildren && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleGroupExpansion(group.id);
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-600" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-600" />
                    )}
                  </button>
                )}
                <div className={`w-10 h-10 bg-${color}-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`h-5 w-5 text-${color}-600`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900">{group.name}</h3>
                    <span className={`px-2 py-0.5 bg-${color}-100 text-${color}-800 rounded-full text-xs font-semibold capitalize`}>
                      {group.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{group.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-6 text-sm">
                <div className="text-center">
                  <div className="font-bold text-gray-900">{group.memberCount}</div>
                  <div className="text-xs text-gray-600">Members</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-green-600">{group.activeMembers}</div>
                  <div className="text-xs text-gray-600">Active</div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedGroup(group);
                      setShowMemberModal(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Manage Members"
                  >
                    <UserPlus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedGroup(group);
                      setShowGroupModal(true);
                    }}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    title="Edit Group"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Auto-assignment rules */}
            {group.autoAssignmentRules && group.autoAssignmentRules.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs font-semibold text-gray-700 mb-1">Auto-assignment Rules:</div>
                <div className="flex flex-wrap gap-1">
                  {group.autoAssignmentRules.map((rule, idx) => (
                    <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-mono">
                      {rule.field} {rule.operator} {rule.value}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {hasChildren && isExpanded && renderGroupHierarchy(group.id, level + 1)}
        </div>
      );
    });
  };

  const tabs = [
    { id: 'hierarchy', label: 'Group Hierarchy', icon: GitBranch },
    { id: 'groups', label: 'All Groups', icon: Layers },
    { id: 'members', label: 'Group Members', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart }
  ];

  const groupTypes = [
    { id: 'all', label: 'All Types', icon: Layers },
    { id: 'department', label: 'Departments', icon: Building },
    { id: 'project', label: 'Projects', icon: Target },
    { id: 'regional', label: 'Regional', icon: Globe },
    { id: 'skill', label: 'Skills', icon: Award },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         group.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedGroupType === 'all' || group.type === selectedGroupType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Groups</h1>
              <p className="text-gray-600 mt-1">Manage team organization, hierarchy, and collaboration</p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedGroup(null);
              setShowGroupModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create Group</span>
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <Layers className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">{groups.length}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Total Groups</div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-green-600">
                {groups.reduce((acc, g) => acc + g.memberCount, 0)}
              </span>
            </div>
            <div className="text-sm font-medium text-gray-700">Total Members</div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <Building className="h-5 w-5 text-purple-600" />
              <span className="text-2xl font-bold text-purple-600">
                {groups.filter(g => g.type === 'department').length}
              </span>
            </div>
            <div className="text-sm font-medium text-gray-700">Departments</div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-orange-600" />
              <span className="text-2xl font-bold text-orange-600">
                {groups.filter(g => g.type === 'project').length}
              </span>
            </div>
            <div className="text-sm font-medium text-gray-700">Projects</div>
          </div>

          <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-teal-600" />
              <span className="text-2xl font-bold text-teal-600">
                {Math.round((groups.reduce((acc, g) => acc + g.activeMembers, 0) / groups.reduce((acc, g) => acc + g.memberCount, 0)) * 100)}%
              </span>
            </div>
            <div className="text-sm font-medium text-gray-700">Active Rate</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex space-x-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 border-t-2 border-x border-blue-600 -mb-px'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Group Hierarchy Tab */}
        {activeTab === 'hierarchy' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Organization Hierarchy</h2>
              <p className="text-gray-600">Visual representation of group structure and relationships</p>
            </div>

            <div className="space-y-2">
              {renderGroupHierarchy()}
            </div>

            {groups.filter(g => !g.parentId).length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No groups created</p>
                <p className="text-sm text-gray-500 mt-1">Create your first group to start organizing your team</p>
              </div>
            )}
          </div>
        )}

        {/* All Groups Tab */}
        {activeTab === 'groups' && (
          <div className="p-6">
            <div className="mb-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {groupTypes.map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedGroupType(type.id)}
                      className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all ${
                        selectedGroupType === type.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGroups.map(group => {
                const Icon = getGroupIcon(group.type);
                const color = getGroupColor(group.type);

                return (
                  <div
                    key={group.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => setSelectedGroup(group)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center`}>
                        <Icon className={`h-6 w-6 text-${color}-600`} />
                      </div>
                      <span className={`px-2 py-1 bg-${color}-100 text-${color}-800 rounded-full text-xs font-semibold capitalize`}>
                        {group.type}
                      </span>
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-1">{group.name}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{group.description}</p>

                    <div className="flex items-center justify-between text-sm border-t border-gray-200 pt-3">
                      <div>
                        <span className="text-gray-600">Members:</span>
                        <span className="ml-2 font-semibold text-gray-900">{group.memberCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Active:</span>
                        <span className="ml-2 font-semibold text-green-600">{group.activeMembers}</span>
                      </div>
                    </div>

                    {group.manager && (
                      <div className="mt-3 text-xs text-gray-600">
                        Manager: <span className="font-medium">{group.manager}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Group Members Tab */}
        {activeTab === 'members' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Group Members</h2>
              <p className="text-gray-600">Manage user assignments and memberships</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {groupMembers.map(member => {
                    const group = groups.find(g => g.id === member.groupId);
                    return (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="font-medium text-gray-900">{member.userName}</div>
                            <div className="text-sm text-gray-500">{member.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{group?.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{member.role}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            member.status === 'active' ? 'bg-green-100 text-green-800' :
                            member.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {member.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(member.joinedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <button className="text-red-600 hover:text-red-900">
                            <UserMinus className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Group Analytics</h2>
              <p className="text-gray-600">Performance metrics and collaboration insights</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Group Distribution */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Group Distribution by Type</h3>
                <div className="space-y-3">
                  {groupTypes.filter(t => t.id !== 'all').map(type => {
                    const count = groups.filter(g => g.type === type.id).length;
                    const percentage = (count / groups.length) * 100;
                    const Icon = type.icon;

                    return (
                      <div key={type.id}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <Icon className="h-4 w-4 text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">{type.label}</span>
                          </div>
                          <span className="text-sm font-bold text-gray-900">{count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Membership Stats */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Membership Statistics</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold text-blue-600">
                      {(groups.reduce((acc, g) => acc + g.memberCount, 0) / groups.length).toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">Average Members per Group</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-600">
                      {Math.max(...groups.map(g => g.memberCount))}
                    </div>
                    <div className="text-sm text-gray-600">Largest Group Size</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-purple-600">
                      {Math.round((groups.reduce((acc, g) => acc + g.activeMembers, 0) / groups.reduce((acc, g) => acc + g.memberCount, 0)) * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">Overall Active Rate</div>
                  </div>
                </div>
              </div>

              {/* Top Performing Groups */}
              <div className="border border-gray-200 rounded-lg p-6 md:col-span-2">
                <h3 className="font-semibold text-gray-900 mb-4">Top Groups by Member Count</h3>
                <div className="space-y-2">
                  {groups
                    .sort((a, b) => b.memberCount - a.memberCount)
                    .slice(0, 5)
                    .map((group, idx) => {
                      const Icon = getGroupIcon(group.type);
                      return (
                        <div key={group.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="text-lg font-bold text-gray-400">#{idx + 1}</div>
                            <Icon className="h-5 w-5 text-gray-600" />
                            <div>
                              <div className="font-medium text-gray-900">{group.name}</div>
                              <div className="text-sm text-gray-600 capitalize">{group.type}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-600">{group.memberCount}</div>
                            <div className="text-xs text-gray-600">members</div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Group Detail Modal (Simplified) */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                {selectedGroup ? 'Edit Group' : 'Create Group'}
              </h3>
              <button onClick={() => setShowGroupModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-800">
                  Group creation and editing interface with full hierarchy, permissions, and auto-assignment configuration.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowGroupModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                {selectedGroup ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserGroups;
