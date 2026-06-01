import React, { useState } from 'react';
import {
  Share2, Shield, Users, Lock, Eye, Edit, Settings, Plus, Trash2, Copy,
  CheckCircle, XCircle, AlertTriangle, Search, Filter, Download, Upload,
  Save, RefreshCw, ChevronRight, ChevronDown, Play, Pause, Info, Zap
} from 'lucide-react';

interface OrgWideDefault {
  module: string;
  defaultAccess: 'private' | 'public_read_only' | 'public_read_write' | 'public_read_write_delete';
  description: string;
}

interface SharingRule {
  id: string;
  name: string;
  module: string;
  ruleType: 'owner_based' | 'criteria_based' | 'hierarchy' | 'group_based';
  priority: number;
  shareWith: {
    type: 'role' | 'group' | 'user';
    targets: string[];
  };
  accessLevel: 'read' | 'read_write' | 'read_write_delete';
  criteria?: {
    field: string;
    operator: string;
    value: string;
    logicalOperator?: 'AND' | 'OR';
  }[];
  ownerCriteria?: {
    roles: string[];
    groups: string[];
  };
  enabled: boolean;
  temporary?: {
    startDate: string;
    endDate: string;
  };
  affectedRecords?: number;
  createdAt: string;
  createdBy: string;
  lastModified: string;
}

const SharingRules: React.FC = () => {
  const [activeView, setActiveView] = useState<'defaults' | 'rules'>('defaults');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [editingRule, setEditingRule] = useState<SharingRule | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const modules = [
    'Leads', 'Accounts', 'Contacts', 'Deals', 'Tasks', 'Meetings', 'Campaigns', 'Cases'
  ];

  const [orgWideDefaults, setOrgWideDefaults] = useState<OrgWideDefault[]>([
    {
      module: 'Leads',
      defaultAccess: 'private',
      description: 'Only lead owner and managers can access'
    },
    {
      module: 'Accounts',
      defaultAccess: 'public_read_only',
      description: 'All users can view, only owner can edit'
    },
    {
      module: 'Contacts',
      defaultAccess: 'public_read_only',
      description: 'All users can view, only owner can edit'
    },
    {
      module: 'Deals',
      defaultAccess: 'private',
      description: 'Only deal owner and managers can access'
    },
    {
      module: 'Tasks',
      defaultAccess: 'public_read_write',
      description: 'All users can view and edit tasks'
    },
    {
      module: 'Meetings',
      defaultAccess: 'public_read_write',
      description: 'All users can view and edit meetings'
    },
    {
      module: 'Campaigns',
      defaultAccess: 'public_read_only',
      description: 'All users can view, only marketing can edit'
    },
    {
      module: 'Cases',
      defaultAccess: 'private',
      description: 'Only case owner and support team can access'
    }
  ]);

  const [sharingRules, setSharingRules] = useState<SharingRule[]>([
    {
      id: '1',
      name: 'Share California Leads with West Coast Team',
      module: 'Leads',
      ruleType: 'criteria_based',
      priority: 1,
      shareWith: {
        type: 'group',
        targets: ['West Coast Sales']
      },
      accessLevel: 'read_write',
      criteria: [
        {
          field: 'state',
          operator: 'equals',
          value: 'California'
        }
      ],
      enabled: true,
      affectedRecords: 342,
      createdAt: '2024-01-15T10:00:00Z',
      createdBy: 'admin@company.com',
      lastModified: '2024-01-20T14:30:00Z'
    },
    {
      id: '2',
      name: 'Share Manager Accounts with Team',
      module: 'Accounts',
      ruleType: 'owner_based',
      priority: 2,
      shareWith: {
        type: 'role',
        targets: ['Sales Representative']
      },
      accessLevel: 'read',
      ownerCriteria: {
        roles: ['Sales Manager'],
        groups: []
      },
      enabled: true,
      affectedRecords: 156,
      createdAt: '2024-01-10T09:00:00Z',
      createdBy: 'manager@company.com',
      lastModified: '2024-01-18T11:00:00Z'
    },
    {
      id: '3',
      name: 'Enterprise Deals Access for Executives',
      module: 'Deals',
      ruleType: 'criteria_based',
      priority: 1,
      shareWith: {
        type: 'role',
        targets: ['Executive', 'VP Sales']
      },
      accessLevel: 'read_write',
      criteria: [
        {
          field: 'deal_value',
          operator: 'greater_than',
          value: '100000'
        },
        {
          field: 'stage',
          operator: 'in',
          value: 'Negotiation,Proposal',
          logicalOperator: 'AND'
        }
      ],
      enabled: true,
      affectedRecords: 45,
      createdAt: '2024-01-12T14:00:00Z',
      createdBy: 'ceo@company.com',
      lastModified: '2024-01-19T16:00:00Z'
    },
    {
      id: '4',
      name: 'Temporary Campaign Access for Marketing Interns',
      module: 'Campaigns',
      ruleType: 'criteria_based',
      priority: 3,
      shareWith: {
        type: 'group',
        targets: ['Marketing Interns']
      },
      accessLevel: 'read',
      criteria: [
        {
          field: 'status',
          operator: 'equals',
          value: 'Active'
        }
      ],
      temporary: {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-03-31T23:59:59Z'
      },
      enabled: true,
      affectedRecords: 23,
      createdAt: '2024-01-05T08:00:00Z',
      createdBy: 'marketing@company.com',
      lastModified: '2024-01-15T10:00:00Z'
    }
  ]);

  const [newRule, setNewRule] = useState<Partial<SharingRule>>({
    name: '',
    module: 'Leads',
    ruleType: 'criteria_based',
    priority: 1,
    shareWith: {
      type: 'role',
      targets: []
    },
    accessLevel: 'read',
    criteria: [{
      field: '',
      operator: 'equals',
      value: ''
    }],
    enabled: true
  });

  const handleSaveDefaults = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleToggleRule = (id: string) => {
    setSharingRules(sharingRules.map(rule =>
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const handleDeleteRule = (id: string) => {
    if (confirm('Are you sure you want to delete this sharing rule?')) {
      setSharingRules(sharingRules.filter(rule => rule.id !== id));
    }
  };

  const handleCloneRule = (rule: SharingRule) => {
    const clonedRule: SharingRule = {
      ...rule,
      id: Date.now().toString(),
      name: `${rule.name} (Copy)`,
      enabled: false,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    setSharingRules([...sharingRules, clonedRule]);
  };

  const handleTestRule = async (id: string) => {
    alert(`Testing rule ${id}...\n\nThis rule would affect ${sharingRules.find(r => r.id === id)?.affectedRecords || 0} records.`);
  };

  const filteredRules = sharingRules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rule.module.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModule = selectedModule === 'all' || rule.module === selectedModule;
    return matchesSearch && matchesModule;
  });

  const getAccessLevelBadge = (level: string) => {
    switch (level) {
      case 'read':
        return { color: 'blue', label: 'Read Only' };
      case 'read_write':
        return { color: 'green', label: 'Read/Write' };
      case 'read_write_delete':
        return { color: 'purple', label: 'Full Access' };
      default:
        return { color: 'gray', label: level };
    }
  };

  const getRuleTypeIcon = (type: string) => {
    switch (type) {
      case 'owner_based':
        return Users;
      case 'criteria_based':
        return Filter;
      case 'hierarchy':
        return ChevronRight;
      case 'group_based':
        return Shield;
      default:
        return Share2;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Share2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sharing Rules</h1>
              <p className="text-gray-600 mt-1">Configure record access and sharing permissions across your organization</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                const json = JSON.stringify({ orgWideDefaults, sharingRules }, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'sharing-rules-export.json';
                link.click();
              }}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">{sharingRules.filter(r => r.enabled).length}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Active Rules</div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{sharingRules.reduce((acc, r) => acc + (r.affectedRecords || 0), 0)}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Records Shared</div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <Lock className="h-5 w-5 text-purple-600" />
              <span className="text-2xl font-bold text-purple-600">{orgWideDefaults.filter(d => d.defaultAccess === 'private').length}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Private Modules</div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <Eye className="h-5 w-5 text-orange-600" />
              <span className="text-2xl font-bold text-orange-600">{orgWideDefaults.filter(d => d.defaultAccess.includes('public')).length}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Public Modules</div>
          </div>
        </div>
      </div>

      {/* Save Success Message */}
      {saveSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-green-800 font-medium">Configuration saved successfully!</span>
        </div>
      )}

      {/* View Toggle */}
      <div className="mb-6 flex items-center space-x-2 border-b border-gray-200">
        <button
          onClick={() => setActiveView('defaults')}
          className={`px-6 py-3 font-medium text-sm transition-all ${
            activeView === 'defaults'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Organization-Wide Defaults
        </button>
        <button
          onClick={() => setActiveView('rules')}
          className={`px-6 py-3 font-medium text-sm transition-all ${
            activeView === 'rules'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Sharing Rules ({sharingRules.length})
        </button>
      </div>

      {/* Organization-Wide Defaults View */}
      {activeView === 'defaults' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Organization-Wide Default Access</h2>
            <p className="text-gray-600">Set the baseline access level for each module. Sharing rules can only grant additional access, not restrict it.</p>
          </div>

          <div className="space-y-3">
            {orgWideDefaults.map((defaultConfig) => (
              <div
                key={defaultConfig.module}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{defaultConfig.module}</h3>
                    <p className="text-sm text-gray-600">{defaultConfig.description}</p>
                  </div>
                  <div className="ml-4">
                    <select
                      value={defaultConfig.defaultAccess}
                      onChange={(e) => {
                        setOrgWideDefaults(orgWideDefaults.map(d =>
                          d.module === defaultConfig.module
                            ? { ...d, defaultAccess: e.target.value as any }
                            : d
                        ));
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[220px]"
                    >
                      <option value="private">Private</option>
                      <option value="public_read_only">Public Read Only</option>
                      <option value="public_read_write">Public Read/Write</option>
                      <option value="public_read_write_delete">Public Read/Write/Delete</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-2">Important Notes:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>Organization-wide defaults define the most restrictive access level</li>
                  <li>Sharing rules can only grant additional access, not remove it</li>
                  <li>Changes to defaults affect all existing records immediately</li>
                  <li>Role hierarchy always grants access from subordinates to managers</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSaveDefaults}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>{loading ? 'Saving...' : 'Save Defaults'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Sharing Rules View */}
      {activeView === 'rules' && (
        <div>
          {/* Filters and Actions */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search rules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80"
                />
              </div>
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Modules</option>
                {modules.map(module => (
                  <option key={module} value={module}>{module}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => {
                setEditingRule(null);
                setShowRuleBuilder(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create Sharing Rule</span>
            </button>
          </div>

          {/* Rules List */}
          <div className="space-y-4">
            {filteredRules.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Share2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No sharing rules found</p>
                <p className="text-sm text-gray-500 mt-1">Create your first sharing rule to control record access</p>
              </div>
            ) : (
              filteredRules.map((rule) => {
                const RuleIcon = getRuleTypeIcon(rule.ruleType);
                const accessBadge = getAccessLevelBadge(rule.accessLevel);

                return (
                  <div
                    key={rule.id}
                    className={`border rounded-lg p-6 transition-all ${
                      rule.enabled
                        ? 'border-gray-200 bg-white hover:shadow-md'
                        : 'border-gray-200 bg-gray-50 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            rule.enabled ? 'bg-blue-100' : 'bg-gray-200'
                          }`}>
                            <RuleIcon className={`h-4 w-4 ${rule.enabled ? 'text-blue-600' : 'text-gray-500'}`} />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-semibold">
                            Priority {rule.priority}
                          </span>
                          {rule.enabled ? (
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                              Active
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-semibold">
                              Inactive
                            </span>
                          )}
                          {rule.temporary && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
                              Temporary
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Module:</span>
                            <span className="ml-2 font-semibold text-gray-900">{rule.module}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Share With:</span>
                            <span className="ml-2 font-semibold text-gray-900 capitalize">
                              {rule.shareWith.type}: {rule.shareWith.targets.join(', ')}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Access Level:</span>
                            <span className={`ml-2 px-2 py-0.5 bg-${accessBadge.color}-100 text-${accessBadge.color}-800 rounded text-xs font-semibold`}>
                              {accessBadge.label}
                            </span>
                          </div>
                        </div>

                        {/* Criteria Display */}
                        {rule.criteria && rule.criteria.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="text-xs font-semibold text-gray-700 mb-2">Criteria:</div>
                            <div className="flex flex-wrap gap-2">
                              {rule.criteria.map((criterion, idx) => (
                                <div key={idx} className="flex items-center space-x-1">
                                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-mono">
                                    {criterion.field} {criterion.operator} "{criterion.value}"
                                  </span>
                                  {criterion.logicalOperator && idx < rule.criteria!.length - 1 && (
                                    <span className="text-xs font-semibold text-gray-600">
                                      {criterion.logicalOperator}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Owner Criteria Display */}
                        {rule.ownerCriteria && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="text-xs font-semibold text-gray-700 mb-2">Owner Criteria:</div>
                            <div className="flex flex-wrap gap-2">
                              {rule.ownerCriteria.roles.map((role, idx) => (
                                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                  Role: {role}
                                </span>
                              ))}
                              {rule.ownerCriteria.groups.map((group, idx) => (
                                <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                  Group: {group}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Temporary Access Display */}
                        {rule.temporary && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="text-xs text-orange-700">
                              Temporary Access: {new Date(rule.temporary.startDate).toLocaleDateString()} - {new Date(rule.temporary.endDate).toLocaleDateString()}
                            </div>
                          </div>
                        )}

                        <div className="mt-3 flex items-center space-x-4 text-xs text-gray-600">
                          <span>Affects {rule.affectedRecords || 0} records</span>
                          <span>•</span>
                          <span>Created by {rule.createdBy}</span>
                          <span>•</span>
                          <span>Modified {new Date(rule.lastModified).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleTestRule(rule.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Test Rule"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleCloneRule(rule)}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="Clone Rule"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingRule(rule);
                            setShowRuleBuilder(true);
                          }}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleRule(rule.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            rule.enabled
                              ? 'text-orange-600 hover:bg-orange-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={rule.enabled ? 'Deactivate' : 'Activate'}
                        >
                          {rule.enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Rule Priority Guide */}
          <div className="mt-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Info className="h-5 w-5 text-gray-600" />
              <span>Understanding Rule Priority</span>
            </h3>
            <div className="grid grid-cols-3 gap-6 text-sm">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center text-blue-600 font-bold text-xs">
                    1
                  </div>
                  <span className="font-semibold text-gray-900">Highest Priority</span>
                </div>
                <p className="text-gray-600">Rules with priority 1 are evaluated first and take precedence</p>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  <span className="font-semibold text-gray-900">Conflict Resolution</span>
                </div>
                <p className="text-gray-600">If multiple rules grant different access, the most permissive wins</p>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-gray-900">Cumulative Access</span>
                </div>
                <p className="text-gray-600">Users get the sum of all applicable sharing rules</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rule Builder Modal (Simplified) */}
      {showRuleBuilder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-gray-900">
                {editingRule ? 'Edit Sharing Rule' : 'Create Sharing Rule'}
              </h3>
              <button
                onClick={() => setShowRuleBuilder(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Rule Name *
                </label>
                <input
                  type="text"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="e.g., Share California Leads with West Coast Team"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Module *
                  </label>
                  <select
                    value={newRule.module}
                    onChange={(e) => setNewRule({ ...newRule, module: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {modules.map(module => (
                      <option key={module} value={module}>{module}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Rule Type *
                  </label>
                  <select
                    value={newRule.ruleType}
                    onChange={(e) => setNewRule({ ...newRule, ruleType: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="criteria_based">Criteria Based</option>
                    <option value="owner_based">Owner Based</option>
                    <option value="hierarchy">Hierarchy Based</option>
                    <option value="group_based">Group Based</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Access Level *
                </label>
                <select
                  value={newRule.accessLevel}
                  onChange={(e) => setNewRule({ ...newRule, accessLevel: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="read">Read Only</option>
                  <option value="read_write">Read/Write</option>
                  <option value="read_write_delete">Read/Write/Delete</option>
                </select>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-start space-x-2">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800">
                    This is a simplified rule builder. In production, you would have detailed criteria builder,
                    role/group selectors, and advanced configuration options.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowRuleBuilder(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const rule: SharingRule = {
                    id: editingRule?.id || Date.now().toString(),
                    name: newRule.name || 'New Rule',
                    module: newRule.module || 'Leads',
                    ruleType: newRule.ruleType || 'criteria_based',
                    priority: newRule.priority || sharingRules.length + 1,
                    shareWith: newRule.shareWith || { type: 'role', targets: [] },
                    accessLevel: newRule.accessLevel || 'read',
                    criteria: newRule.criteria,
                    enabled: true,
                    affectedRecords: 0,
                    createdAt: editingRule?.createdAt || new Date().toISOString(),
                    createdBy: 'current-user@company.com',
                    lastModified: new Date().toISOString()
                  };

                  if (editingRule) {
                    setSharingRules(sharingRules.map(r => r.id === rule.id ? rule : r));
                  } else {
                    setSharingRules([...sharingRules, rule]);
                  }

                  setShowRuleBuilder(false);
                  setNewRule({
                    name: '',
                    module: 'Leads',
                    ruleType: 'criteria_based',
                    priority: 1,
                    shareWith: { type: 'role', targets: [] },
                    accessLevel: 'read',
                    criteria: [{ field: '', operator: 'equals', value: '' }],
                    enabled: true
                  });
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingRule ? 'Update Rule' : 'Create Rule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharingRules;
