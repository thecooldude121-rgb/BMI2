import React, { useState } from 'react';
import {
  Bell, Mail, MessageSquare, Smartphone, Globe, Settings, Plus, Edit, Trash2,
  Eye, EyeOff, Search, Filter, Clock, TrendingUp, Activity, CheckCircle,
  AlertTriangle, Info, Send, Code, Copy, Download, Upload, RefreshCw,
  X, Save, TestTube, BarChart, Users, Zap, Target, Calendar, Pause, Play
} from 'lucide-react';

interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'in_app' | 'webhook';
  subject?: string;
  content: string;
  variables: string[];
  category: string;
  enabled: boolean;
  deliveryRate: number;
  openRate?: number;
  clickRate?: number;
  createdAt: string;
}

interface NotificationRule {
  id: string;
  name: string;
  event: string;
  channels: string[];
  conditions: {
    field: string;
    operator: string;
    value: string;
  }[];
  recipients: {
    type: 'user' | 'role' | 'group';
    targets: string[];
  };
  templateId: string;
  priority: 'critical' | 'high' | 'normal' | 'low';
  enabled: boolean;
  deliveryCount: number;
  lastTriggered?: string;
}

interface NotificationHistory {
  id: string;
  ruleId: string;
  ruleName: string;
  recipient: string;
  channel: string;
  status: 'delivered' | 'pending' | 'failed';
  sentAt: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
}

const NotificationsManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'rules' | 'templates' | 'preferences' | 'history' | 'analytics'>('rules');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const [notificationRules, setNotificationRules] = useState<NotificationRule[]>([
    {
      id: '1',
      name: 'Lead Assignment Notification',
      event: 'lead.assigned',
      channels: ['email', 'in_app'],
      conditions: [
        { field: 'lead.priority', operator: 'equals', value: 'high' }
      ],
      recipients: {
        type: 'user',
        targets: ['assigned_user']
      },
      templateId: 'tmpl_1',
      priority: 'high',
      enabled: true,
      deliveryCount: 1234,
      lastTriggered: '2024-01-21T15:30:00Z'
    },
    {
      id: '2',
      name: 'Deal Won Celebration',
      event: 'deal.won',
      channels: ['email', 'in_app', 'slack'],
      conditions: [
        { field: 'deal.value', operator: 'greater_than', value: '10000' }
      ],
      recipients: {
        type: 'role',
        targets: ['sales_team']
      },
      templateId: 'tmpl_2',
      priority: 'normal',
      enabled: true,
      deliveryCount: 456,
      lastTriggered: '2024-01-21T14:00:00Z'
    },
    {
      id: '3',
      name: 'Task Overdue Alert',
      event: 'task.overdue',
      channels: ['email', 'sms', 'push'],
      conditions: [],
      recipients: {
        type: 'user',
        targets: ['task_owner', 'task_owner_manager']
      },
      templateId: 'tmpl_3',
      priority: 'critical',
      enabled: true,
      deliveryCount: 789,
      lastTriggered: '2024-01-21T13:00:00Z'
    }
  ]);

  const [notificationTemplates, setNotificationTemplates] = useState<NotificationTemplate[]>([
    {
      id: 'tmpl_1',
      name: 'Lead Assignment Email',
      type: 'email',
      subject: 'New High-Priority Lead Assigned: {{lead.name}}',
      content: 'Hi {{user.firstName}},\n\nA new high-priority lead has been assigned to you:\n\nLead: {{lead.name}}\nCompany: {{lead.company}}\nPhone: {{lead.phone}}\n\nPlease follow up within 24 hours.',
      variables: ['user.firstName', 'lead.name', 'lead.company', 'lead.phone'],
      category: 'Leads',
      enabled: true,
      deliveryRate: 99.2,
      openRate: 87.5,
      clickRate: 34.2,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'tmpl_2',
      name: 'Deal Won Notification',
      type: 'email',
      subject: '🎉 Deal Won: {{deal.name}} - ${{deal.value}}',
      content: 'Congratulations team!\n\n{{user.firstName}} has won a deal:\n\nDeal: {{deal.name}}\nValue: ${{deal.value}}\nClient: {{deal.account}}\n\nGreat work!',
      variables: ['user.firstName', 'deal.name', 'deal.value', 'deal.account'],
      category: 'Deals',
      enabled: true,
      deliveryRate: 100,
      openRate: 92.1,
      clickRate: 15.3,
      createdAt: '2024-01-05T00:00:00Z'
    },
    {
      id: 'tmpl_3',
      name: 'Task Overdue SMS',
      type: 'sms',
      content: 'Task overdue: {{task.name}}. Due: {{task.dueDate}}. Please complete ASAP.',
      variables: ['task.name', 'task.dueDate'],
      category: 'Tasks',
      enabled: true,
      deliveryRate: 98.5,
      createdAt: '2024-01-10T00:00:00Z'
    },
    {
      id: 'tmpl_4',
      name: 'Lead Created In-App',
      type: 'in_app',
      content: 'New lead created: {{lead.name}} from {{lead.company}}',
      variables: ['lead.name', 'lead.company'],
      category: 'Leads',
      enabled: true,
      deliveryRate: 100,
      createdAt: '2024-01-12T00:00:00Z'
    }
  ]);

  const [notificationHistory] = useState<NotificationHistory[]>([
    {
      id: '1',
      ruleId: '1',
      ruleName: 'Lead Assignment Notification',
      recipient: 'john.smith@company.com',
      channel: 'email',
      status: 'delivered',
      sentAt: '2024-01-21T15:30:00Z',
      deliveredAt: '2024-01-21T15:30:15Z',
      openedAt: '2024-01-21T15:45:00Z'
    },
    {
      id: '2',
      ruleId: '2',
      ruleName: 'Deal Won Celebration',
      recipient: 'sales-team@company.com',
      channel: 'email',
      status: 'delivered',
      sentAt: '2024-01-21T14:00:00Z',
      deliveredAt: '2024-01-21T14:00:12Z',
      openedAt: '2024-01-21T14:15:00Z',
      clickedAt: '2024-01-21T14:16:00Z'
    },
    {
      id: '3',
      ruleId: '3',
      ruleName: 'Task Overdue Alert',
      recipient: '+1234567890',
      channel: 'sms',
      status: 'delivered',
      sentAt: '2024-01-21T13:00:00Z',
      deliveredAt: '2024-01-21T13:00:08Z'
    },
    {
      id: '4',
      ruleId: '1',
      ruleName: 'Lead Assignment Notification',
      recipient: 'sarah.johnson@company.com',
      channel: 'email',
      status: 'pending',
      sentAt: '2024-01-21T15:35:00Z'
    }
  ]);

  const [userPreferences] = useState({
    email: {
      enabled: true,
      frequency: 'immediate',
      categories: ['leads', 'deals', 'tasks', 'system']
    },
    sms: {
      enabled: true,
      frequency: 'critical_only',
      categories: ['tasks']
    },
    in_app: {
      enabled: true,
      frequency: 'immediate',
      categories: ['leads', 'deals', 'tasks', 'system', 'social']
    },
    push: {
      enabled: false,
      frequency: 'immediate',
      categories: []
    },
    quiet_hours: {
      enabled: true,
      start: '22:00',
      end: '08:00',
      timezone: 'America/New_York'
    }
  });

  const eventTypes = [
    { value: 'lead.created', label: 'Lead Created' },
    { value: 'lead.assigned', label: 'Lead Assigned' },
    { value: 'lead.converted', label: 'Lead Converted' },
    { value: 'deal.created', label: 'Deal Created' },
    { value: 'deal.updated', label: 'Deal Updated' },
    { value: 'deal.won', label: 'Deal Won' },
    { value: 'deal.lost', label: 'Deal Lost' },
    { value: 'task.created', label: 'Task Created' },
    { value: 'task.overdue', label: 'Task Overdue' },
    { value: 'task.completed', label: 'Task Completed' },
    { value: 'user.login', label: 'User Login' },
    { value: 'system.maintenance', label: 'System Maintenance' }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'normal': return 'blue';
      case 'low': return 'gray';
      default: return 'gray';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return Mail;
      case 'sms': return MessageSquare;
      case 'push': return Smartphone;
      case 'in_app': return Bell;
      case 'slack': return Zap;
      case 'webhook': return Globe;
      default: return Bell;
    }
  };

  const tabs = [
    { id: 'rules', label: 'Notification Rules', icon: Zap },
    { id: 'templates', label: 'Templates', icon: Code },
    { id: 'preferences', label: 'User Preferences', icon: Settings },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'analytics', label: 'Analytics', icon: BarChart }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
              <Bell className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications Management</h1>
              <p className="text-gray-600 mt-1">Configure multi-channel notifications and user preferences</p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <Zap className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">{notificationRules.filter(r => r.enabled).length}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Active Rules</div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <Code className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{notificationTemplates.filter(t => t.enabled).length}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Templates</div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <Send className="h-5 w-5 text-purple-600" />
              <span className="text-2xl font-bold text-purple-600">
                {notificationRules.reduce((acc, r) => acc + r.deliveryCount, 0)}
              </span>
            </div>
            <div className="text-sm font-medium text-gray-700">Total Sent</div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <span className="text-2xl font-bold text-orange-600">
                {notificationTemplates.reduce((acc, t) => acc + (t.deliveryRate || 0), 0) / notificationTemplates.length}%
              </span>
            </div>
            <div className="text-sm font-medium text-gray-700">Delivery Rate</div>
          </div>

          <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
            <div className="flex items-center justify-between mb-2">
              <Eye className="h-5 w-5 text-teal-600" />
              <span className="text-2xl font-bold text-teal-600">
                {(notificationTemplates.filter(t => t.openRate).reduce((acc, t) => acc + (t.openRate || 0), 0) /
                  notificationTemplates.filter(t => t.openRate).length).toFixed(1)}%
              </span>
            </div>
            <div className="text-sm font-medium text-gray-700">Open Rate</div>
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
        {/* Notification Rules Tab */}
        {activeTab === 'rules' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Notification Rules</h2>
                <p className="text-gray-600">Configure event-driven notification triggers and delivery rules</p>
              </div>
              <button
                onClick={() => {
                  setSelectedItem(null);
                  setShowRuleModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Create Rule</span>
              </button>
            </div>

            <div className="space-y-4">
              {notificationRules.map((rule) => {
                const priorityColor = getPriorityColor(rule.priority);
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
                          <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
                          <span className={`px-3 py-1 bg-${priorityColor}-100 text-${priorityColor}-800 rounded-full text-xs font-semibold uppercase`}>
                            {rule.priority}
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
                        </div>

                        <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                          <div>
                            <span className="text-gray-600">Event:</span>
                            <span className="ml-2 font-semibold text-gray-900">{rule.event}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Recipients:</span>
                            <span className="ml-2 font-semibold text-gray-900 capitalize">
                              {rule.recipients.type}: {rule.recipients.targets.join(', ')}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Delivery Count:</span>
                            <span className="ml-2 font-semibold text-blue-600">{rule.deliveryCount}</span>
                          </div>
                        </div>

                        {/* Channels */}
                        <div className="mt-4">
                          <span className="text-sm font-semibold text-gray-700 mb-2 block">Channels:</span>
                          <div className="flex flex-wrap gap-2">
                            {rule.channels.map((channel, idx) => {
                              const ChannelIcon = getChannelIcon(channel);
                              return (
                                <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold flex items-center space-x-1">
                                  <ChannelIcon className="h-3 w-3" />
                                  <span className="capitalize">{channel}</span>
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {/* Conditions */}
                        {rule.conditions.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <span className="text-sm font-semibold text-gray-700 mb-2 block">Conditions:</span>
                            <div className="flex flex-wrap gap-2">
                              {rule.conditions.map((condition, idx) => (
                                <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-mono">
                                  {condition.field} {condition.operator} {condition.value}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-4 text-xs text-gray-600">
                          Last triggered: {rule.lastTriggered ? new Date(rule.lastTriggered).toLocaleString() : 'Never'}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => alert('Testing rule...')}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Test Rule"
                        >
                          <TestTube className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedItem(rule);
                            setShowRuleModal(true);
                          }}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setNotificationRules(notificationRules.map(r =>
                              r.id === rule.id ? { ...r, enabled: !r.enabled } : r
                            ));
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            rule.enabled
                              ? 'text-orange-600 hover:bg-orange-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={rule.enabled ? 'Disable' : 'Enable'}
                        >
                          {rule.enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete this rule?')) {
                              setNotificationRules(notificationRules.filter(r => r.id !== rule.id));
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Notification Templates</h2>
                <p className="text-gray-600">Manage email, SMS, and in-app notification templates</p>
              </div>
              <button
                onClick={() => {
                  setSelectedItem(null);
                  setShowTemplateModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Create Template</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notificationTemplates.map((template) => {
                const TypeIcon = getChannelIcon(template.type);
                return (
                  <div
                    key={template.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <TypeIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{template.name}</h3>
                          <p className="text-xs text-gray-600 capitalize">{template.type} • {template.category}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        template.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {template.enabled ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {template.subject && (
                      <div className="mb-3">
                        <div className="text-xs font-semibold text-gray-700 mb-1">Subject:</div>
                        <div className="text-sm text-gray-900 font-medium">{template.subject}</div>
                      </div>
                    )}

                    <div className="mb-3">
                      <div className="text-xs font-semibold text-gray-700 mb-1">Content Preview:</div>
                      <div className="text-sm text-gray-600 line-clamp-3">{template.content}</div>
                    </div>

                    {/* Variables */}
                    <div className="mb-4">
                      <div className="text-xs font-semibold text-gray-700 mb-1">Variables:</div>
                      <div className="flex flex-wrap gap-1">
                        {template.variables.map((variable, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                            {`{{${variable}}}`}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="border-t border-gray-200 pt-3 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-gray-600">Delivery</div>
                        <div className="font-bold text-green-600">{template.deliveryRate}%</div>
                      </div>
                      {template.openRate !== undefined && (
                        <div>
                          <div className="text-gray-600">Open</div>
                          <div className="font-bold text-blue-600">{template.openRate}%</div>
                        </div>
                      )}
                      {template.clickRate !== undefined && (
                        <div>
                          <div className="text-gray-600">Click</div>
                          <div className="font-bold text-purple-600">{template.clickRate}%</div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end space-x-2 mt-4">
                      <button
                        onClick={() => alert('Preview template...')}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedItem(template);
                          setShowTemplateModal(true);
                        }}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => alert('Template copied!')}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Copy"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* User Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Notification Preferences</h2>
              <p className="text-gray-600">Configure your notification preferences by channel and category</p>
            </div>

            <div className="space-y-6">
              {/* Email Preferences */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-6 w-6 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Email Notifications</h3>
                      <p className="text-sm text-gray-600">Receive updates via email</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={userPreferences.email.enabled} className="sr-only peer" readOnly />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Frequency</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                      <option value="immediate">Immediate</option>
                      <option value="hourly">Hourly Digest</option>
                      <option value="daily">Daily Digest</option>
                      <option value="weekly">Weekly Digest</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Categories</label>
                    <div className="flex flex-wrap gap-2">
                      {userPreferences.email.categories.map(cat => (
                        <span key={cat} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs capitalize">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* SMS Preferences */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="h-6 w-6 text-green-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">SMS Notifications</h3>
                      <p className="text-sm text-gray-600">Receive urgent alerts via SMS</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={userPreferences.sms.enabled} className="sr-only peer" readOnly />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="text-sm text-gray-600">
                  Only critical and high-priority notifications will be sent via SMS
                </div>
              </div>

              {/* In-App Preferences */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Bell className="h-6 w-6 text-purple-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">In-App Notifications</h3>
                      <p className="text-sm text-gray-600">Show notifications in the application</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={userPreferences.in_app.enabled} className="sr-only peer" readOnly />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Quiet Hours */}
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-6 w-6 text-orange-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Quiet Hours</h3>
                      <p className="text-sm text-gray-600">Pause non-critical notifications during specific hours</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={userPreferences.quiet_hours.enabled} className="sr-only peer" readOnly />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">From:</span>
                    <span className="ml-2 font-semibold text-gray-900">{userPreferences.quiet_hours.start}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">To:</span>
                    <span className="ml-2 font-semibold text-gray-900">{userPreferences.quiet_hours.end}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Timezone:</span>
                    <span className="ml-2 font-semibold text-gray-900">{userPreferences.quiet_hours.timezone}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors">
                <Save className="h-4 w-4" />
                <span>Save Preferences</span>
              </button>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Notification History</h2>
              <p className="text-gray-600">View delivery status and engagement metrics</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rule</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Channel</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivered</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Opened</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {notificationHistory.map(item => {
                    const ChannelIcon = getChannelIcon(item.channel);
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.ruleName}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.recipient}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <ChannelIcon className="h-4 w-4 text-gray-600" />
                            <span className="text-sm text-gray-900 capitalize">{item.channel}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            item.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{new Date(item.sentAt).toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {item.deliveredAt ? new Date(item.deliveredAt).toLocaleString() : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {item.openedAt ? new Date(item.openedAt).toLocaleString() : '-'}
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
              <h2 className="text-xl font-bold text-gray-900 mb-2">Notification Analytics</h2>
              <p className="text-gray-600">Performance metrics and engagement insights</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Channel Performance */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Channel Performance</h3>
                <div className="space-y-3">
                  {['email', 'sms', 'in_app', 'push'].map(channel => {
                    const Icon = getChannelIcon(channel);
                    const deliveryRate = Math.random() * 10 + 90;
                    return (
                      <div key={channel}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <Icon className="h-4 w-4 text-gray-600" />
                            <span className="text-sm font-medium text-gray-700 capitalize">{channel}</span>
                          </div>
                          <span className="text-sm font-bold text-gray-900">{deliveryRate.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${deliveryRate}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Engagement Metrics */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Engagement Metrics</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold text-blue-600">89.2%</div>
                    <div className="text-sm text-gray-600">Average Open Rate</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-purple-600">28.5%</div>
                    <div className="text-sm text-gray-600">Average Click Rate</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-600">99.1%</div>
                    <div className="text-sm text-gray-600">Overall Delivery Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsManagement;
