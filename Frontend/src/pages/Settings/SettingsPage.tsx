import React, { useState, useEffect } from 'react';
import {
  Settings, Shield, Users, Lock, Activity, Key, Globe,
  Database, Bell, FileText, Workflow, UserCheck, Zap,
  Search, ChevronRight, AlertTriangle, CheckCircle, Info, ArrowLeft,
  Plus, Edit, Trash2, Eye, X, Webhook, MessageSquare, TrendingUp, Smartphone
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import RolesManagement from './RolesManagement';
import PermissionMatrix from './PermissionMatrix';
import PermissionSets from './PermissionSets';
import ProfilesAccess from './ProfilesAccess';
import SecurityPolicies from './SecurityPolicies';
import SSOAuthentication from './SSOAuthentication';
import SharingRules from './SharingRules';
import Integrations from './Integrations';
import UserGroups from './UserGroups';
import NotificationsManagement from './NotificationsManagement';
import AdvancedSecurity from './AdvancedSecurity';
import WorkflowAutomation from './WorkflowAutomation';
import AnalyticsReporting from './AnalyticsReporting';
import MobileAPI from './MobileAPI';
import MobileDeviceManagement from './MobileDeviceManagement';
import { WhatIfSimulator } from '../../components/Permissions/WhatIfSimulator';
import { SharingRuleBuilder } from '../../components/Permissions/SharingRuleBuilder';
import { UserGroupManagement } from '../../components/Permissions/UserGroupManagement';
import { AuditFeed } from '../../components/Permissions/AuditFeed';
import { APIIntegrationsPanel } from '../../components/Permissions/APIIntegrationsPanel';
import AuditTrail from './AuditTrail';

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  badge?: string;
}

const SettingsPage: React.FC = () => {
  const {
    loading,
    error,
    getSecurityMetrics,
    roles,
    permissions,
    fetchRoles,
    fetchPermissions,
    createRole,
    auditLogs,
    fetchAuditLogs
  } = useSettings();

  const [searchQuery, setSearchQuery] = useState('');
  const [securityMetrics, setSecurityMetrics] = useState<any>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    hierarchy_level: 1,
    parent_role_id: ''
  });

  useEffect(() => {
    const loadData = async () => {
      const metrics = await getSecurityMetrics();
      setSecurityMetrics(metrics);
      await fetchRoles();
      await fetchPermissions();
      await fetchAuditLogs();
    };
    loadData();
  }, []);

  const sections: SettingsSection[] = [
    {
      id: 'roles',
      title: 'Roles & Permissions',
      description: 'Manage user roles, permissions, and field-level security',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      badge: 'Core'
    },
    {
      id: 'permission-matrix',
      title: 'Permission Matrix',
      description: 'Interactive matrix for granular permission assignment',
      icon: Shield,
      color: 'from-blue-500 to-cyan-600',
      badge: 'New'
    },
    {
      id: 'permission-sets',
      title: 'Permission Sets',
      description: 'Create reusable permission templates to apply across multiple roles',
      icon: FileText,
      color: 'from-teal-500 to-teal-600',
      badge: 'New'
    },
    {
      id: 'profiles',
      title: 'Profiles & Access',
      description: 'Configure user profiles and module-level access controls',
      icon: UserCheck,
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'sharing',
      title: 'Sharing Rules',
      description: 'Set up record sharing with conditional logic',
      icon: Globe,
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'security',
      title: 'Security Policies',
      description: 'Password policies, IP restrictions, and 2FA settings',
      icon: Shield,
      color: 'from-red-500 to-red-600',
      badge: 'Critical'
    },
    {
      id: 'sso',
      title: 'SSO & Authentication',
      description: 'Configure SAML, OAuth2, and LDAP integrations',
      icon: Key,
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      id: 'api',
      title: 'API & Tokens',
      description: 'Manage API access tokens and rate limits',
      icon: Database,
      color: 'from-cyan-500 to-cyan-600'
    },
    {
      id: 'audit',
      title: 'Audit Logs',
      description: 'View system changes and activity tracking',
      icon: Activity,
      color: 'from-orange-500 to-orange-600'
    },
    {
      id: 'workflows',
      title: 'Workflow Automation',
      description: 'Create automated workflows and approval processes',
      icon: Workflow,
      color: 'from-pink-500 to-pink-600'
    },
    {
      id: 'analytics',
      title: 'Analytics & Reporting',
      description: 'Create dashboards, reports, and AI-powered insights',
      icon: TrendingUp,
      color: 'from-blue-500 to-purple-600',
      badge: 'New'
    },
    {
      id: 'groups',
      title: 'User Groups',
      description: 'Organize users into hierarchical groups',
      icon: Users,
      color: 'from-teal-500 to-teal-600',
      badge: 'New'
    },
    {
      id: 'webhooks',
      title: 'Webhooks & Integrations',
      description: 'Configure webhooks and external integrations',
      icon: Webhook,
      color: 'from-indigo-500 to-indigo-600',
      badge: 'New'
    },
    {
      id: 'collaboration',
      title: 'Audit & Collaboration',
      description: 'View audit logs, comments, and approval workflows',
      icon: MessageSquare,
      color: 'from-orange-500 to-orange-600',
      badge: 'New'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Configure system notifications and alerts',
      icon: Bell,
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      id: 'integrations',
      title: 'Integrations',
      description: 'Connect third-party apps and webhooks',
      icon: Zap,
      color: 'from-violet-500 to-violet-600'
    },
    {
      id: 'advanced_security',
      title: 'Advanced Security',
      description: 'Threat detection, device management, and compliance',
      icon: Shield,
      color: 'from-red-500 to-red-600',
      badge: 'Enterprise'
    },
    {
      id: 'mobile_api',
      title: 'Mobile & API Platform',
      description: 'Mobile app and developer API management',
      icon: Smartphone,
      color: 'from-green-500 to-green-600',
      badge: 'New'
    },
    {
      id: 'mobile_mdm',
      title: 'Mobile Device Management',
      description: 'Manage mobile devices, app policies, and security settings',
      icon: Smartphone,
      color: 'from-teal-500 to-teal-600',
      badge: 'Enterprise'
    },
    {
      id: 'compliance',
      title: 'Compliance & Data',
      description: 'Data encryption, backup, and GDPR settings',
      icon: FileText,
      color: 'from-gray-500 to-gray-600'
    }
  ];

  const filteredSections = sections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateRole = async () => {
    if (!newRole.name.trim()) {
      alert('Role name is required');
      return;
    }

    const result = await createRole({
      name: newRole.name,
      description: newRole.description,
      hierarchy_level: newRole.hierarchy_level,
      parent_role_id: newRole.parent_role_id || undefined
    });

    if (result) {
      setShowCreateRoleModal(false);
      setNewRole({ name: '', description: '', hierarchy_level: 1, parent_role_id: '' });
      await fetchRoles();
    }
  };

  const renderAlert = (type: 'warning' | 'info' | 'success', message: string) => {
    const icons = { warning: AlertTriangle, info: Info, success: CheckCircle };
    const colors = {
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800',
      success: 'bg-green-50 border-green-200 text-green-800'
    };
    const Icon = icons[type];

    return (
      <div className={`rounded-xl border p-4 ${colors[type]}`}>
        <div className="flex items-start space-x-3">
          <Icon className="h-5 w-5 mt-0.5" />
          <p className="text-sm">{message}</p>
        </div>
      </div>
    );
  };

  const renderSectionContent = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return null;
    const Icon = section.icon;

    switch (sectionId) {
      case 'roles':
        return <RolesManagement />;

      case 'permission-matrix':
        return <PermissionMatrix />;

      case 'permission-sets':
        return <PermissionSets />;

      case 'profiles':
        return <ProfilesAccess />;

      case 'groups':
        return <UserGroups />;

      case 'sharing':
        return <SharingRules />;

      case 'sso':
        return <SSOAuthentication />;

      case 'integrations':
        return <Integrations />;

      case 'notifications':
        return <NotificationsManagement />;

      case 'webhooks':
        return <APIIntegrationsPanel />;

      case 'collaboration':
        return <AuditFeed />;

      case 'audit':
        return <AuditTrail />;

      case 'security':
        return <SecurityPolicies />;

      case 'advanced_security':
        return <AdvancedSecurity />;

      case 'workflows':
        return <WorkflowAutomation />;

      case 'analytics':
        return <AnalyticsReporting />;

      case 'mobile_api':
        return <MobileAPI />;

      case 'mobile_mdm':
        return <MobileDeviceManagement />;

      default:
        return (
          <div>
            <div className="flex items-center space-x-4 mb-6">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${section.color}`}>
                <Icon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                <p className="text-gray-600">{section.description}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="p-4 bg-gray-100 rounded-full inline-block mb-4">
                  <Icon className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{section.title}</h3>
                <p className="text-gray-600 mb-6">{section.description}</p>
                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Configure {section.title}</button>
              </div>
            </div>
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-700">This section is ready for configuration!</p>
            </div>
          </div>
        );
    }
  };

  const renderCreateRoleModal = () => {
    if (!showCreateRoleModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">Create New Role</h3>
            <button
              onClick={() => setShowCreateRoleModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role Name <span className="text-red-500">*</span>
              </label>
              <select
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a role</option>
                <option value="CEO">CEO</option>
                <option value="Manager">Manager</option>
                <option value="Executive">Executive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={newRole.description}
                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Describe the role's responsibilities"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hierarchy Level</label>
              <input
                type="number"
                value={newRole.hierarchy_level}
                onChange={(e) => setNewRole({ ...newRole, hierarchy_level: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent Role</label>
              <select
                value={newRole.parent_role_id}
                onChange={(e) => setNewRole({ ...newRole, parent_role_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Parent (Top Level)</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name} (Level {role.hierarchy_level})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              onClick={() => setShowCreateRoleModal(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateRole}
              disabled={!newRole.name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Create Role
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (selectedSection) {
    if (selectedSection === 'roles' || selectedSection === 'permission-matrix' || selectedSection === 'permission-sets' || selectedSection === 'profiles') {
      return (
        <div className="h-screen flex flex-col bg-gray-50">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <button onClick={() => setSelectedSection(null)} className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5 mr-2" />Back to Settings
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            {renderSectionContent(selectedSection)}
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button onClick={() => setSelectedSection(null)} className="flex items-center text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="h-5 w-5 mr-2" />Back to Settings
          </button>
          {renderSectionContent(selectedSection)}
        </div>
        {renderCreateRoleModal()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <Settings className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Settings & Administration</h1>
                <p className="text-gray-600 text-lg mt-1">Configure security, permissions, and system preferences</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input type="text" placeholder="Search settings..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {securityMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{securityMetrics.total_users}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg"><Users className="h-6 w-6 text-blue-600" /></div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{securityMetrics.active_sessions}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg"><Activity className="h-6 w-6 text-green-600" /></div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">API Calls Today</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{securityMetrics.api_calls_today}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg"><Database className="h-6 w-6 text-purple-600" /></div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Failed Logins (24h)</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{securityMetrics.failed_login_attempts_24h}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg"><Lock className="h-6 w-6 text-red-600" /></div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSections.map((section) => {
            const Icon = section.icon;
            return (
              <button key={section.id} onClick={() => setSelectedSection(section.id)}
                className="bg-white rounded-xl border border-gray-200 p-6 text-left hover:shadow-lg transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${section.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  {section.badge && <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">{section.badge}</span>}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600">{section.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{section.description}</p>
                <div className="flex items-center text-blue-600 text-sm font-medium">
                  <span>Configure</span>
                  <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>

        {filteredSections.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No settings found</h3>
            <p className="text-gray-600">Try adjusting your search query</p>
          </div>
        )}
      </div>
      {renderCreateRoleModal()}
    </div>
  );
};

export default SettingsPage;
