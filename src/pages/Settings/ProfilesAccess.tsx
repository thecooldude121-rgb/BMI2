import React, { useState } from 'react';
import {
  Plus, Search, Filter, Users, Mail, Building, Shield,
  ChevronDown, X, Check, AlertTriangle, Edit, Trash2,
  Download, Power, Clock, Globe, Calendar, ArrowLeft
} from 'lucide-react';
import BreadcrumbNav from '../../components/navigation/BreadcrumbNav';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
  roleId: string;
  roleName: string;
  businessUnit?: string;
  status: 'active' | 'inactive';
  timezone: string;
  language: string;
  dateFormat: string;
  createdAt: string;
  lastLogin?: string;
}

interface Role {
  id: string;
  name: string;
  parentRoleId?: string;
  parentRoleName?: string;
  userCount?: number;
  permissionSets?: string[];
}

const SAMPLE_ROLES: Role[] = [
  { id: 'role-1', name: 'CEO', userCount: 1, permissionSets: [] },
  { id: 'role-2', name: 'Sales Manager', parentRoleId: 'role-1', parentRoleName: 'CEO', userCount: 2, permissionSets: ['Sales Manager Baseline'] },
  { id: 'role-3', name: 'Sales Representative', parentRoleId: 'role-2', parentRoleName: 'Sales Manager', userCount: 2, permissionSets: ['Sales Rep Standard'] },
  { id: 'role-4', name: 'Regional Manager', parentRoleId: 'role-1', parentRoleName: 'CEO', userCount: 1, permissionSets: ['Sales Manager Baseline'] },
  { id: 'role-5', name: 'Support Agent', parentRoleId: 'role-4', parentRoleName: 'Regional Manager', userCount: 0, permissionSets: ['Support Agent Access'] },
  { id: 'role-6', name: 'Marketing Manager', userCount: 0, permissionSets: [] }
];

const SAMPLE_USERS: User[] = [
  {
    id: 'user-1',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@company.com',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
    roleId: 'role-1',
    roleName: 'CEO',
    status: 'active',
    timezone: 'America/New_York',
    language: 'English',
    dateFormat: 'MM/DD/YYYY',
    createdAt: '2024-01-15',
    lastLogin: '2024-10-24'
  },
  {
    id: 'user-2',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@company.com',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
    roleId: 'role-2',
    roleName: 'Sales Manager',
    businessUnit: 'North America',
    status: 'active',
    timezone: 'America/Los_Angeles',
    language: 'English',
    dateFormat: 'MM/DD/YYYY',
    createdAt: '2024-02-01',
    lastLogin: '2024-10-24'
  },
  {
    id: 'user-3',
    firstName: 'Mike',
    lastName: 'Davis',
    email: 'mike.davis@company.com',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
    roleId: 'role-3',
    roleName: 'Sales Representative',
    businessUnit: 'North America',
    status: 'active',
    timezone: 'America/Chicago',
    language: 'English',
    dateFormat: 'MM/DD/YYYY',
    createdAt: '2024-03-10',
    lastLogin: '2024-10-23'
  },
  {
    id: 'user-4',
    firstName: 'Emily',
    lastName: 'Chen',
    email: 'emily.chen@company.com',
    avatar: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
    roleId: 'role-4',
    roleName: 'Regional Manager',
    businessUnit: 'Asia Pacific',
    status: 'active',
    timezone: 'Asia/Tokyo',
    language: 'English',
    dateFormat: 'DD/MM/YYYY',
    createdAt: '2024-02-15',
    lastLogin: '2024-10-24'
  },
  {
    id: 'user-5',
    firstName: 'David',
    lastName: 'Wilson',
    email: 'david.wilson@company.com',
    avatar: 'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
    roleId: 'role-3',
    roleName: 'Sales Representative',
    businessUnit: 'Europe',
    status: 'active',
    timezone: 'Europe/London',
    language: 'English',
    dateFormat: 'DD/MM/YYYY',
    createdAt: '2024-04-01',
    lastLogin: '2024-10-22'
  },
  {
    id: 'user-6',
    firstName: 'Lisa',
    lastName: 'Anderson',
    email: 'lisa.anderson@company.com',
    avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
    roleId: 'role-2',
    roleName: 'Sales Manager',
    businessUnit: 'Europe',
    status: 'inactive',
    timezone: 'Europe/Paris',
    language: 'English',
    dateFormat: 'DD/MM/YYYY',
    createdAt: '2024-01-20',
    lastLogin: '2024-09-15'
  }
];

const BUSINESS_UNITS = ['North America', 'Europe', 'Asia Pacific', 'Latin America'];
const TIMEZONES = ['America/New_York', 'America/Los_Angeles', 'America/Chicago', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo'];
const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Japanese'];
const DATE_FORMATS = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];

const ProfilesAccess: React.FC = () => {
  const [users, setUsers] = useState<User[]>(SAMPLE_USERS);
  const [roles] = useState<Role[]>(SAMPLE_ROLES);
  const [selectedUser, setSelectedUser] = useState<User | null>(users[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [businessUnitFilter, setBusinessUnitFilter] = useState<string>('all');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showBulkActionsModal, setShowBulkActionsModal] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showBulkPreview, setShowBulkPreview] = useState(false);
  const [previewAction, setPreviewAction] = useState<{ action: string; value: string; users: User[] } | null>(null);

  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    roleId: '',
    businessUnit: '',
    sendWelcomeEmail: true
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.roleId === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesBU = businessUnitFilter === 'all' || user.businessUnit === businessUnitFilter;

    return matchesSearch && matchesRole && matchesStatus && matchesBU;
  });

  const handleAddUser = () => {
    if (!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.roleId) {
      alert('Please fill in all required fields');
      return;
    }

    const role = roles.find(r => r.id === newUser.roleId);
    if (!role) return;

    const user: User = {
      id: `user-${Date.now()}`,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
      roleId: newUser.roleId,
      roleName: role.name,
      businessUnit: newUser.businessUnit || undefined,
      status: 'active',
      timezone: 'America/New_York',
      language: 'English',
      dateFormat: 'MM/DD/YYYY',
      createdAt: new Date().toISOString().split('T')[0]
    };

    setUsers([...users, user]);
    setSelectedUser(user);
    setShowAddUserModal(false);
    setNewUser({
      firstName: '',
      lastName: '',
      email: '',
      roleId: '',
      businessUnit: '',
      sendWelcomeEmail: true
    });

    setSuccessMessage(`User ${user.firstName} ${user.lastName} added successfully`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleSaveUser = () => {
    if (!editingUser) return;

    setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
    setSelectedUser(editingUser);
    setEditingUser(null);

    setSuccessMessage('User updated successfully');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleBulkAction = () => {
    if (selectedUserIds.size === 0) return;

    const selectedUsers = users.filter(u => selectedUserIds.has(u.id));

    if (bulkAction === 'activate') {
      setUsers(users.map(u => selectedUserIds.has(u.id) ? { ...u, status: 'active' } : u));
      setSuccessMessage(`Activated ${selectedUserIds.size} user(s)`);
    } else if (bulkAction === 'deactivate') {
      setUsers(users.map(u => selectedUserIds.has(u.id) ? { ...u, status: 'inactive' } : u));
      setSuccessMessage(`Deactivated ${selectedUserIds.size} user(s)`);
    }

    setTimeout(() => setSuccessMessage(''), 3000);
    setShowBulkActionsModal(false);
    setSelectedUserIds(new Set());
    setBulkAction('');
  };

  const toggleUserSelection = (userId: string) => {
    const newSet = new Set(selectedUserIds);
    if (newSet.has(userId)) {
      newSet.delete(userId);
    } else {
      newSet.add(userId);
    }
    setSelectedUserIds(newSet);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setStatusFilter('all');
    setBusinessUnitFilter('all');
  };

  const getCurrentRole = (roleId: string) => roles.find(r => r.id === roleId);

  const getBreadcrumbs = () => {
    const breadcrumbs = [
      { label: 'Settings', onClick: () => window.history.back() },
      { label: 'Profiles & Access' }
    ];

    if (editingUser) {
      breadcrumbs.push({ label: `${editingUser.firstName} ${editingUser.lastName}`, onClick: () => setEditingUser(null) });
      breadcrumbs.push({ label: 'Edit', current: true });
    } else if (selectedUser) {
      breadcrumbs.push({ label: `${selectedUser.firstName} ${selectedUser.lastName}`, current: true });
    } else {
      breadcrumbs[breadcrumbs.length - 1].current = true;
    }

    return breadcrumbs;
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <BreadcrumbNav items={getBreadcrumbs()} />
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 m-6 mb-0">
          <div className="flex items-center">
            <Check className="h-5 w-5 text-green-600 mr-2" />
            <p className="text-sm font-medium text-green-900">{successMessage}</p>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Users</h2>
              <button
                onClick={() => setShowAddUserModal(true)}
                className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add User
              </button>
            </div>

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="space-y-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Roles</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <select
                value={businessUnitFilter}
                onChange={(e) => setBusinessUnitFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Business Units</option>
                {BUSINESS_UNITS.map(bu => (
                  <option key={bu} value={bu}>{bu}</option>
                ))}
              </select>

              {(searchQuery || roleFilter !== 'all' || statusFilter !== 'all' || businessUnitFilter !== 'all') && (
                <button
                  onClick={clearFilters}
                  className="w-full px-3 py-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="mt-3 text-xs text-gray-500">
              Showing {filteredUsers.length} of {users.length} users
            </div>
          </div>

          {selectedUserIds.size > 0 && (
            <div className="p-3 bg-blue-50 border-b border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  {selectedUserIds.size} selected
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowBulkActionsModal(true)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Bulk Actions
                  </button>
                  <button
                    onClick={() => setSelectedUserIds(new Set())}
                    className="text-sm text-gray-600 hover:text-gray-700"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                  selectedUser?.id === user.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.has(user.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleUserSelection(user.id);
                    }}
                    className="mt-1"
                  />
                  <img
                    src={user.avatar}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {user.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    <div className="flex items-center mt-1">
                      <Shield className="h-3 w-3 text-gray-400 mr-1" />
                      <p className="text-xs text-gray-600">{user.roleName}</p>
                    </div>
                    {user.businessUnit && (
                      <div className="flex items-center mt-0.5">
                        <Building className="h-3 w-3 text-gray-400 mr-1" />
                        <p className="text-xs text-gray-600">{user.businessUnit}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredUsers.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No users found</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {selectedUser && !editingUser && (
            <div className="max-w-4xl mx-auto space-y-6">
              <button
                onClick={() => setSelectedUser(null)}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Users
              </button>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <img
                      src={selectedUser.avatar}
                      alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {selectedUser.firstName} {selectedUser.lastName}
                      </h3>
                      <p className="text-gray-600">{selectedUser.email}</p>
                      <div className="flex items-center mt-2 space-x-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          selectedUser.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          <Power className="h-3 w-3 mr-1" />
                          {selectedUser.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                        {selectedUser.lastLogin && (
                          <span className="text-sm text-gray-500">
                            Last login: {new Date(selectedUser.lastLogin).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingUser(selectedUser)}
                    className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </button>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Role Assignment</h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Role
                      </label>
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Shield className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{selectedUser.roleName}</p>
                          {(() => {
                            const role = getCurrentRole(selectedUser.roleId);
                            return role?.parentRoleName && (
                              <p className="text-sm text-gray-600">
                                Reports to: {role.parentRoleName}
                              </p>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">Permissions Inherited</p>
                          <p className="text-sm text-blue-700 mt-1">
                            This user inherits all permissions from the {selectedUser.roleName} role
                          </p>
                          {(() => {
                            const role = getCurrentRole(selectedUser.roleId);
                            return role?.permissionSets && role.permissionSets.length > 0 && (
                              <p className="text-sm text-blue-700 mt-1">
                                Permission Sets: {role.permissionSets.join(', ')}
                              </p>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {selectedUser.businessUnit && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Business Unit
                        </label>
                        <div className="flex items-center space-x-2">
                          <Building className="h-5 w-5 text-gray-400" />
                          <span className="text-gray-900">{selectedUser.businessUnit}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-200 mt-6 pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Profile Settings</h4>

                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Clock className="h-4 w-4 inline mr-1" />
                        Time Zone
                      </label>
                      <p className="text-gray-900">{selectedUser.timezone}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Globe className="h-4 w-4 inline mr-1" />
                        Language
                      </label>
                      <p className="text-gray-900">{selectedUser.language}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Date Format
                      </label>
                      <p className="text-gray-900">{selectedUser.dateFormat}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {editingUser && (
            <div className="max-w-4xl mx-auto space-y-6">
              <button
                onClick={() => setEditingUser(null)}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Details
              </button>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Edit User</h3>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={editingUser.firstName}
                        onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={editingUser.lastName}
                        onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editingUser.roleId}
                      onChange={(e) => {
                        const role = roles.find(r => r.id === e.target.value);
                        setEditingUser({
                          ...editingUser,
                          roleId: e.target.value,
                          roleName: role?.name || ''
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                    {(() => {
                      const role = getCurrentRole(editingUser.roleId);
                      return role?.parentRoleName && (
                        <p className="text-sm text-gray-600 mt-1">
                          Reports to: {role.parentRoleName}
                        </p>
                      );
                    })()}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Unit
                    </label>
                    <select
                      value={editingUser.businessUnit || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, businessUnit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">None</option>
                      {BUSINESS_UNITS.map(bu => (
                        <option key={bu} value={bu}>{bu}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={editingUser.status}
                      onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as 'active' | 'inactive' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-base font-semibold text-gray-900 mb-4">Profile Settings</h4>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Time Zone
                        </label>
                        <select
                          value={editingUser.timezone}
                          onChange={(e) => setEditingUser({ ...editingUser, timezone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {TIMEZONES.map(tz => (
                            <option key={tz} value={tz}>{tz}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Language
                        </label>
                        <select
                          value={editingUser.language}
                          onChange={(e) => setEditingUser({ ...editingUser, language: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {LANGUAGES.map(lang => (
                            <option key={lang} value={lang}>{lang}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date Format
                        </label>
                        <select
                          value={editingUser.dateFormat}
                          onChange={(e) => setEditingUser({ ...editingUser, dateFormat: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {DATE_FORMATS.map(format => (
                            <option key={format} value={format}>{format}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveUser}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {!selectedUser && !editingUser && (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p>Select a user to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Add New User</h3>
              <button onClick={() => setShowAddUserModal(false)}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={newUser.roleId}
                  onChange={(e) => setNewUser({ ...newUser, roleId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a role...</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Unit
                </label>
                <select
                  value={newUser.businessUnit}
                  onChange={(e) => setNewUser({ ...newUser, businessUnit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None</option>
                  {BUSINESS_UNITS.map(bu => (
                    <option key={bu} value={bu}>{bu}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newUser.sendWelcomeEmail}
                  onChange={(e) => setNewUser({ ...newUser, sendWelcomeEmail: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Send welcome email with temporary password</span>
              </label>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddUserModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkActionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Bulk Actions</h3>
              <button onClick={() => setShowBulkActionsModal(false)}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <p className="text-sm text-gray-600">
                Select an action to apply to {selectedUserIds.size} selected user(s)
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => setBulkAction('activate')}
                  className={`w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50 ${
                    bulkAction === 'activate' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  <p className="font-medium text-gray-900">Activate Users</p>
                  <p className="text-sm text-gray-600">Set status to active</p>
                </button>

                <button
                  onClick={() => setBulkAction('deactivate')}
                  className={`w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50 ${
                    bulkAction === 'deactivate' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  <p className="font-medium text-gray-900">Deactivate Users</p>
                  <p className="text-sm text-gray-600">Set status to inactive</p>
                </button>

                <button
                  onClick={() => setBulkAction('changeRole')}
                  className={`w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50 ${
                    bulkAction === 'changeRole' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  <p className="font-medium text-gray-900">Change Role</p>
                  <p className="text-sm text-gray-600">Assign a different role to selected users</p>
                </button>
              </div>

              {bulkAction === 'changeRole' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Role
                  </label>
                  <select
                    id="bulkRoleSelect"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a role...</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowBulkActionsModal(false);
                  setBulkAction('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (bulkAction === 'changeRole') {
                    const select = document.getElementById('bulkRoleSelect') as HTMLSelectElement;
                    const newRoleId = select?.value;
                    if (newRoleId) {
                      const affectedUsers = users.filter(u => selectedUserIds.has(u.id));
                      const newRole = roles.find(r => r.id === newRoleId);
                      setPreviewAction({
                        action: 'Change Role',
                        value: newRole?.name || '',
                        users: affectedUsers
                      });
                      setShowBulkPreview(true);
                      setShowBulkActionsModal(false);
                    }
                  } else {
                    handleBulkAction();
                  }
                }}
                disabled={!bulkAction || (bulkAction === 'changeRole' && !(document.getElementById('bulkRoleSelect') as HTMLSelectElement)?.value)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {bulkAction === 'changeRole' ? 'Preview Changes' : 'Apply'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Preview Modal */}
      {showBulkPreview && previewAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Preview Bulk Action</h3>
              <button onClick={() => {
                setShowBulkPreview(false);
                setPreviewAction(null);
              }}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="px-6 py-4 flex-1 overflow-y-auto">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-900 mb-1">Action Summary</p>
                    <p className="text-sm text-blue-800">
                      <strong>{previewAction.action}:</strong> {previewAction.value}
                    </p>
                    <p className="text-sm text-blue-800 mt-1">
                      This will affect <strong>{previewAction.users.length}</strong> user(s)
                    </p>
                  </div>
                </div>
              </div>

              <h4 className="font-medium text-gray-900 mb-3">Affected Users</h4>
              <div className="space-y-2">
                {previewAction.users.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={user.avatar}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Current: {user.roleName}</p>
                      <p className="text-sm font-medium text-blue-600">New: {previewAction.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowBulkPreview(false);
                  setPreviewAction(null);
                  setShowBulkActionsModal(true);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => {
                  handleBulkAction();
                  setShowBulkPreview(false);
                  setPreviewAction(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Confirm Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilesAccess;
