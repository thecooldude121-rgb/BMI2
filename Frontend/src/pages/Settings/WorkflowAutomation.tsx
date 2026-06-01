import React, { useState } from 'react';
import {
  Workflow, Play, Pause, Edit, Trash2, Copy, Download, Upload, Plus, X,
  GitBranch, Clock, Zap, CheckCircle, AlertTriangle, Activity, BarChart,
  Users, Mail, Database, FileText, Settings, Filter, Search, Eye, Save,
  RefreshCw, Target, TrendingUp, MessageSquare, Calendar, Share2, Bell
} from 'lucide-react';

interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: 'record_create' | 'record_update' | 'time_based' | 'event' | 'manual';
    entity: string;
    conditions?: string[];
  };
  actions: {
    type: string;
    config: any;
  }[];
  status: 'active' | 'inactive' | 'draft';
  executionCount: number;
  successRate: number;
  lastRun?: string;
  createdBy: string;
  createdAt: string;
}

interface ApprovalProcess {
  id: string;
  name: string;
  entity: string;
  stages: {
    name: string;
    approvers: string[];
    criteria?: string;
  }[];
  status: 'active' | 'inactive';
  pendingApprovals: number;
  averageTime: string;
}

interface BusinessRule {
  id: string;
  name: string;
  type: 'validation' | 'calculation' | 'assignment' | 'duplicate_check';
  entity: string;
  condition: string;
  action: string;
  enabled: boolean;
  executionCount: number;
}

const WorkflowAutomation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'workflows' | 'approvals' | 'rules' | 'analytics'>('workflows');
  const [searchQuery, setSearchQuery] = useState('');
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);

  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([
    {
      id: '1',
      name: 'Lead Assignment Automation',
      description: 'Automatically assign leads to sales reps based on territory and expertise',
      trigger: {
        type: 'record_create',
        entity: 'Lead',
        conditions: ['Status = New', 'Lead Source != null']
      },
      actions: [
        { type: 'calculate_territory', config: { field: 'Territory' } },
        { type: 'assign_owner', config: { logic: 'round_robin' } },
        { type: 'send_email', config: { template: 'new_lead_notification' } }
      ],
      status: 'active',
      executionCount: 2847,
      successRate: 98.5,
      lastRun: '2024-01-21T15:30:00Z',
      createdBy: 'Admin',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      name: 'Deal Stage Progression',
      description: 'Automate deal progression when criteria are met and notify stakeholders',
      trigger: {
        type: 'record_update',
        entity: 'Deal',
        conditions: ['Probability >= 75', 'All Required Documents Uploaded']
      },
      actions: [
        { type: 'update_stage', config: { stage: 'Negotiation' } },
        { type: 'create_task', config: { task: 'Prepare final proposal' } },
        { type: 'notify_manager', config: { channel: 'email_and_slack' } }
      ],
      status: 'active',
      executionCount: 1523,
      successRate: 96.2,
      lastRun: '2024-01-21T14:00:00Z',
      createdBy: 'Sales Manager',
      createdAt: '2024-01-05T00:00:00Z'
    },
    {
      id: '3',
      name: 'Follow-up Reminder System',
      description: 'Send automated follow-up reminders for inactive leads',
      trigger: {
        type: 'time_based',
        entity: 'Lead',
        conditions: ['Last Activity > 7 days', 'Status = Contacted']
      },
      actions: [
        { type: 'send_email', config: { template: 'follow_up_reminder' } },
        { type: 'create_task', config: { task: 'Follow up with lead', due: '3 days' } },
        { type: 'update_field', config: { field: 'Follow_Up_Count', action: 'increment' } }
      ],
      status: 'active',
      executionCount: 4892,
      successRate: 99.1,
      lastRun: '2024-01-21T13:00:00Z',
      createdBy: 'Admin',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: '4',
      name: 'Contract Approval Workflow',
      description: 'Route contracts through approval chain based on deal value',
      trigger: {
        type: 'event',
        entity: 'Deal',
        conditions: ['Stage = Proposal Sent', 'Amount > $10,000']
      },
      actions: [
        { type: 'start_approval', config: { process: 'contract_approval' } },
        { type: 'notify_legal', config: { priority: 'high' } },
        { type: 'create_document', config: { template: 'contract_template' } }
      ],
      status: 'active',
      executionCount: 456,
      successRate: 94.8,
      lastRun: '2024-01-21T11:30:00Z',
      createdBy: 'Legal Team',
      createdAt: '2024-01-10T00:00:00Z'
    }
  ]);

  const [approvalProcesses] = useState<ApprovalProcess[]>([
    {
      id: '1',
      name: 'Deal Approval Process',
      entity: 'Deal',
      stages: [
        { name: 'Sales Manager', approvers: ['sales.manager@company.com'], criteria: 'Amount > $10,000' },
        { name: 'VP Sales', approvers: ['vp.sales@company.com'], criteria: 'Amount > $50,000' },
        { name: 'CFO', approvers: ['cfo@company.com'], criteria: 'Amount > $100,000' }
      ],
      status: 'active',
      pendingApprovals: 12,
      averageTime: '2.5 hours'
    },
    {
      id: '2',
      name: 'Discount Approval',
      entity: 'Quote',
      stages: [
        { name: 'Sales Manager', approvers: ['sales.manager@company.com'], criteria: 'Discount > 15%' },
        { name: 'VP Sales', approvers: ['vp.sales@company.com'], criteria: 'Discount > 25%' }
      ],
      status: 'active',
      pendingApprovals: 5,
      averageTime: '1.2 hours'
    },
    {
      id: '3',
      name: 'Expense Approval',
      entity: 'Expense',
      stages: [
        { name: 'Direct Manager', approvers: [], criteria: 'Amount > $100' },
        { name: 'Finance', approvers: ['finance@company.com'], criteria: 'Amount > $1,000' }
      ],
      status: 'active',
      pendingApprovals: 8,
      averageTime: '3.1 hours'
    }
  ]);

  const [businessRules] = useState<BusinessRule[]>([
    {
      id: '1',
      name: 'Lead Score Calculation',
      type: 'calculation',
      entity: 'Lead',
      condition: 'On Record Save',
      action: 'Calculate score based on engagement, company size, and budget',
      enabled: true,
      executionCount: 3456
    },
    {
      id: '2',
      name: 'Duplicate Lead Prevention',
      type: 'duplicate_check',
      entity: 'Lead',
      condition: 'On Record Create',
      action: 'Check email and company name for duplicates',
      enabled: true,
      executionCount: 2847
    },
    {
      id: '3',
      name: 'Deal Amount Validation',
      type: 'validation',
      entity: 'Deal',
      condition: 'Amount field is modified',
      action: 'Ensure amount is positive and within reasonable range',
      enabled: true,
      executionCount: 1523
    },
    {
      id: '4',
      name: 'Territory Assignment',
      type: 'assignment',
      entity: 'Lead',
      condition: 'Country or State is populated',
      action: 'Auto-assign territory based on geographic location',
      enabled: true,
      executionCount: 2891
    }
  ]);

  const tabs = [
    { id: 'workflows', label: 'Workflows', icon: Workflow },
    { id: 'approvals', label: 'Approvals', icon: CheckCircle },
    { id: 'rules', label: 'Business Rules', icon: Target },
    { id: 'analytics', label: 'Analytics', icon: BarChart }
  ];

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'record_create': return Plus;
      case 'record_update': return Edit;
      case 'time_based': return Clock;
      case 'event': return Zap;
      case 'manual': return Play;
      default: return Activity;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'inactive': return 'gray';
      case 'draft': return 'yellow';
      default: return 'gray';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Workflow className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Workflow Automation</h1>
              <p className="text-gray-600 mt-1">Enterprise process automation and business rules</p>
            </div>
          </div>
          <button
            onClick={() => setShowWorkflowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create Workflow</span>
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <Workflow className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">
                {workflows.filter(w => w.status === 'active').length}
              </span>
            </div>
            <div className="text-sm font-medium text-gray-700">Active Workflows</div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-green-600">
                {approvalProcesses.reduce((sum, p) => sum + p.pendingApprovals, 0)}
              </span>
            </div>
            <div className="text-sm font-medium text-gray-700">Pending Approvals</div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-purple-600" />
              <span className="text-2xl font-bold text-purple-600">
                {businessRules.filter(r => r.enabled).length}
              </span>
            </div>
            <div className="text-sm font-medium text-gray-700">Active Rules</div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <Activity className="h-5 w-5 text-orange-600" />
              <span className="text-2xl font-bold text-orange-600">
                {workflows.reduce((sum, w) => sum + w.executionCount, 0).toLocaleString()}
              </span>
            </div>
            <div className="text-sm font-medium text-gray-700">Total Executions</div>
          </div>

          <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-teal-600" />
              <span className="text-2xl font-bold text-teal-600">
                {(workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length).toFixed(1)}%
              </span>
            </div>
            <div className="text-sm font-medium text-gray-700">Success Rate</div>
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
        {/* Workflows Tab */}
        {activeTab === 'workflows' && (
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Workflow Automations</h2>
                <div className="flex space-x-2">
                  <button className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
                    <Upload className="h-4 w-4" />
                    <span className="text-sm">Import</span>
                  </button>
                  <button className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
                    <Filter className="h-4 w-4" />
                    <span className="text-sm">Filter</span>
                  </button>
                </div>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search workflows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              {workflows.map(workflow => {
                const TriggerIcon = getTriggerIcon(workflow.trigger.type);
                const statusColor = getStatusColor(workflow.status);

                return (
                  <div key={workflow.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className={`w-12 h-12 bg-${statusColor}-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <TriggerIcon className={`h-6 w-6 text-${statusColor}-600`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{workflow.name}</h3>
                            <span className={`px-3 py-1 bg-${statusColor}-100 text-${statusColor}-800 rounded-full text-xs font-semibold uppercase`}>
                              {workflow.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{workflow.description}</p>

                          <div className="grid grid-cols-4 gap-4 mb-3">
                            <div>
                              <span className="text-xs text-gray-600">Trigger:</span>
                              <div className="font-semibold text-gray-900 text-sm capitalize">
                                {workflow.trigger.type.replace('_', ' ')}
                              </div>
                            </div>
                            <div>
                              <span className="text-xs text-gray-600">Entity:</span>
                              <div className="font-semibold text-gray-900 text-sm">{workflow.trigger.entity}</div>
                            </div>
                            <div>
                              <span className="text-xs text-gray-600">Executions:</span>
                              <div className="font-semibold text-blue-600 text-sm">{workflow.executionCount.toLocaleString()}</div>
                            </div>
                            <div>
                              <span className="text-xs text-gray-600">Success Rate:</span>
                              <div className="font-semibold text-green-600 text-sm">{workflow.successRate}%</div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="border-t border-gray-200 pt-3">
                            <div className="text-xs font-semibold text-gray-700 mb-2">Actions:</div>
                            <div className="flex flex-wrap gap-2">
                              {workflow.actions.map((action, idx) => (
                                <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium capitalize">
                                  {action.type.replace('_', ' ')}
                                </span>
                              ))}
                            </div>
                          </div>

                          {workflow.lastRun && (
                            <div className="mt-3 text-xs text-gray-500">
                              Last run: {new Date(workflow.lastRun).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Details">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Test Workflow">
                          <Play className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors" title="Edit">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors" title="Clone">
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setWorkflows(workflows.map(w =>
                              w.id === workflow.id
                                ? { ...w, status: w.status === 'active' ? 'inactive' : 'active' }
                                : w
                            ));
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            workflow.status === 'active'
                              ? 'text-orange-600 hover:bg-orange-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={workflow.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {workflow.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Approvals Tab */}
        {activeTab === 'approvals' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Approval Processes</h2>
              <p className="text-gray-600">Manage multi-stage approval workflows</p>
            </div>

            <div className="space-y-4">
              {approvalProcesses.map(process => (
                <div key={process.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{process.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                          process.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {process.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <span className="text-xs text-gray-600">Entity:</span>
                          <div className="font-semibold text-gray-900 text-sm">{process.entity}</div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-600">Pending:</span>
                          <div className="font-semibold text-orange-600 text-sm">{process.pendingApprovals}</div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-600">Avg Time:</span>
                          <div className="font-semibold text-blue-600 text-sm">{process.averageTime}</div>
                        </div>
                      </div>

                      {/* Approval Stages */}
                      <div className="border-t border-gray-200 pt-4">
                        <div className="text-xs font-semibold text-gray-700 mb-3">Approval Stages:</div>
                        <div className="flex items-center space-x-2">
                          {process.stages.map((stage, idx) => (
                            <React.Fragment key={idx}>
                              <div className="flex-1">
                                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                  <div className="text-sm font-semibold text-gray-900 mb-1">{stage.name}</div>
                                  <div className="text-xs text-gray-600">
                                    {stage.approvers.length > 0 ? stage.approvers[0] : 'Dynamic assignment'}
                                  </div>
                                  {stage.criteria && (
                                    <div className="text-xs text-blue-600 mt-1 font-medium">{stage.criteria}</div>
                                  )}
                                </div>
                              </div>
                              {idx < process.stages.length - 1 && (
                                <GitBranch className="h-5 w-5 text-gray-400 transform rotate-90" />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Business Rules Tab */}
        {activeTab === 'rules' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Business Rules</h2>
              <p className="text-gray-600">Data validation and automated calculations</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {businessRules.map(rule => (
                <div key={rule.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          rule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {rule.enabled ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium capitalize mb-2">
                        {rule.type.replace('_', ' ')}
                      </span>
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Entity:</strong> {rule.entity}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Condition:</strong> {rule.condition}
                      </div>
                      <div className="text-sm text-gray-700 mb-3">
                        <strong>Action:</strong> {rule.action}
                      </div>
                      <div className="text-xs text-gray-500">
                        Executions: <span className="font-semibold text-blue-600">{rule.executionCount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-200">
                    <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Workflow Analytics</h2>
              <p className="text-gray-600">Performance metrics and optimization insights</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Execution Performance */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Workflow Performance</h3>
                <div className="space-y-3">
                  {workflows.slice(0, 4).map(workflow => {
                    const percentage = workflow.successRate;
                    return (
                      <div key={workflow.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{workflow.name}</span>
                          <span className="text-sm font-bold text-gray-900">{percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              percentage >= 95 ? 'bg-green-600' :
                              percentage >= 90 ? 'bg-yellow-600' :
                              'bg-red-600'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Execution Volume */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Execution Volume</h3>
                <div className="space-y-4">
                  {workflows.slice(0, 4).map((workflow, idx) => (
                    <div key={workflow.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="text-lg font-bold text-gray-400">#{idx + 1}</div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{workflow.name}</div>
                          <div className="text-xs text-gray-600">{workflow.trigger.entity}</div>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-blue-600">{workflow.executionCount.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Approval Metrics */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Approval Metrics</h3>
                <div className="space-y-4">
                  {approvalProcesses.map(process => (
                    <div key={process.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{process.name}</div>
                        <div className="text-xs text-gray-600">Avg: {process.averageTime}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-orange-600">{process.pendingApprovals}</div>
                        <div className="text-xs text-gray-600">Pending</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rule Execution Stats */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Business Rule Activity</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold text-purple-600">
                      {businessRules.reduce((sum, r) => sum + r.executionCount, 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total Rule Executions</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-600">{businessRules.filter(r => r.enabled).length}</div>
                    <div className="text-sm text-gray-600">Active Rules</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-blue-600">{businessRules.length}</div>
                    <div className="text-sm text-gray-600">Total Rules Defined</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Workflow Builder Modal */}
      {showWorkflowModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-gray-900">Visual Workflow Builder</h3>
              <button onClick={() => setShowWorkflowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-8 border-2 border-dashed border-blue-300">
                <div className="text-center">
                  <Workflow className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Drag-and-Drop Workflow Designer</h4>
                  <p className="text-gray-600 mb-4">
                    Visual interface with flowchart builder, conditional logic, and automated actions
                  </p>
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <GitBranch className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <div className="font-semibold text-gray-900 text-sm">Conditional Logic</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <Zap className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <div className="font-semibold text-gray-900 text-sm">Automated Actions</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <div className="font-semibold text-gray-900 text-sm">Time-Based Triggers</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowWorkflowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Open Builder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowAutomation;
