import React, { useState } from 'react';
import {
  Workflow, Plus, Play, Pause, Trash2, Copy, Settings,
  ArrowLeft, Zap, Clock, TrendingUp, Activity, Edit,
  Mail, Phone, MessageSquare, Calendar, Target, Tag, User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { WorkflowAutomation, WorkflowTriggerType, WorkflowActionType } from '../../types/workflowAutomation';

const WorkflowAutomationPage: React.FC = () => {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<WorkflowAutomation[]>([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowAutomation | null>(null);

  const workflowTemplates = [
    {
      id: 'auto-qualify',
      name: 'Auto-qualify Hot Leads',
      description: 'Automatically score and route high-intent leads to sales',
      icon: '🎯',
      color: 'from-red-500 to-orange-600',
      trigger: 'prospect_added',
      popular: true
    },
    {
      id: 'nurture-cold',
      name: 'Nurture Cold Prospects',
      description: 'Automated drip campaign for cold leads with engagement tracking',
      icon: '❄️',
      color: 'from-blue-500 to-cyan-600',
      trigger: 'status_changed',
      popular: true
    },
    {
      id: 'meeting-follow-up',
      name: 'Meeting Follow-up Automation',
      description: 'Send thank you email and create follow-up tasks after meetings',
      icon: '📅',
      color: 'from-green-500 to-emerald-600',
      trigger: 'meeting_booked',
      popular: false
    },
    {
      id: 'reply-routing',
      name: 'Email Reply Routing',
      description: 'Route replies to appropriate team members based on content',
      icon: '✉️',
      color: 'from-purple-500 to-pink-600',
      trigger: 'email_replied',
      popular: true
    }
  ];

  const triggerTypes: Array<{ type: WorkflowTriggerType; label: string; icon: any }> = [
    { type: 'prospect_added', label: 'Prospect Added', icon: User },
    { type: 'status_changed', label: 'Status Changed', icon: Activity },
    { type: 'email_opened', label: 'Email Opened', icon: Mail },
    { type: 'email_replied', label: 'Email Replied', icon: MessageSquare },
    { type: 'meeting_booked', label: 'Meeting Booked', icon: Calendar },
    { type: 'form_submitted', label: 'Form Submitted', icon: Target },
    { type: 'webhook', label: 'Webhook', icon: Zap },
    { type: 'scheduled', label: 'Scheduled', icon: Clock }
  ];

  const actionTypes: Array<{ type: WorkflowActionType; label: string; icon: any; color: string }> = [
    { type: 'send_email', label: 'Send Email', icon: Mail, color: 'bg-blue-100 text-blue-700' },
    { type: 'create_task', label: 'Create Task', icon: Target, color: 'bg-green-100 text-green-700' },
    { type: 'send_slack', label: 'Send Slack Message', icon: MessageSquare, color: 'bg-purple-100 text-purple-700' },
    { type: 'add_to_sequence', label: 'Add to Sequence', icon: Workflow, color: 'bg-orange-100 text-orange-700' },
    { type: 'update_field', label: 'Update Field', icon: Edit, color: 'bg-gray-100 text-gray-700' },
    { type: 'add_tag', label: 'Add Tag', icon: Tag, color: 'bg-pink-100 text-pink-700' },
    { type: 'wait_delay', label: 'Wait/Delay', icon: Clock, color: 'bg-yellow-100 text-yellow-700' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Go back"
              >
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </button>
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl">
                <Workflow className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Workflow Automation</h1>
                <p className="text-gray-600 text-lg">Build powerful automation workflows with visual builder</p>
              </div>
            </div>

            <button
              onClick={() => setShowBuilder(true)}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Workflow
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 py-8">
        {workflows.length === 0 ? (
          <div className="space-y-8">
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-4">
                <Workflow className="h-10 w-10 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Workflows Yet</h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Get started by creating your first workflow or choose from our templates
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Popular Templates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {workflowTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-purple-300 hover:shadow-lg transition-all cursor-pointer"
                  >
                    <div className={`p-3 bg-gradient-to-r ${template.color} rounded-lg w-fit mb-4`}>
                      <span className="text-3xl">{template.icon}</span>
                    </div>

                    {template.popular && (
                      <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded mb-2">
                        ⭐ Popular
                      </span>
                    )}

                    <h3 className="text-lg font-bold text-gray-900 mb-2">{template.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{template.description}</p>

                    <button
                      onClick={() => setShowBuilder(true)}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold"
                    >
                      Use Template
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">How Workflow Automation Works</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    <Zap className="h-8 w-8 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">1. Choose Trigger</h4>
                  <p className="text-sm text-gray-600">
                    Select what event starts the workflow: prospect added, email opened, meeting booked, etc.
                  </p>
                </div>

                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <Target className="h-8 w-8 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">2. Add Actions</h4>
                  <p className="text-sm text-gray-600">
                    Build your workflow by adding actions: send emails, create tasks, update CRM, and more.
                  </p>
                </div>

                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                    <Activity className="h-8 w-8 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">3. Activate & Monitor</h4>
                  <p className="text-sm text-gray-600">
                    Turn on your workflow and monitor execution in real-time with detailed analytics.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Active Workflows</span>
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{workflows.filter(w => w.is_active).length}</p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Total Executions</span>
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {workflows.reduce((sum, w) => sum + w.execution_count, 0)}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Success Rate</span>
                  <Target className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">98%</p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Avg Duration</span>
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">1.2s</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Your Workflows</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {workflows.map((workflow) => (
                  <div key={workflow.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className={`p-2 rounded-lg ${workflow.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <Workflow className={`h-6 w-6 ${workflow.is_active ? 'text-green-600' : 'text-gray-600'}`} />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">{workflow.name}</h3>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${workflow.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                              {workflow.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{workflow.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>Trigger: {workflow.trigger_type.replace(/_/g, ' ')}</span>
                            <span>•</span>
                            <span>{workflow.execution_count} executions</span>
                            <span>•</span>
                            <span>{((workflow.success_count / workflow.execution_count) * 100 || 0).toFixed(1)}% success</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          {workflow.is_active ? <Pause className="h-5 w-5 text-gray-600" /> : <Play className="h-5 w-5 text-gray-600" />}
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <Edit className="h-5 w-5 text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <Copy className="h-5 w-5 text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-red-100 rounded-lg transition-colors">
                          <Trash2 className="h-5 w-5 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {showBuilder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Workflow Builder</h2>
                <button
                  onClick={() => setShowBuilder(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              <div className="w-64 border-r border-gray-200 p-4 overflow-auto">
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Triggers</h3>
                  <div className="space-y-2">
                    {triggerTypes.map((trigger) => (
                      <button
                        key={trigger.type}
                        className="w-full flex items-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                      >
                        {React.createElement(trigger.icon, { className: 'h-4 w-4 mr-2' })}
                        {trigger.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Actions</h3>
                  <div className="space-y-2">
                    {actionTypes.map((action) => (
                      <button
                        key={action.type}
                        className={`w-full flex items-center px-3 py-2 ${action.color} rounded-lg hover:opacity-80 transition-opacity text-sm`}
                      >
                        {React.createElement(action.icon, { className: 'h-4 w-4 mr-2' })}
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-gray-50 p-8 overflow-auto">
                <div className="text-center py-20">
                  <Workflow className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Visual Workflow Canvas</h3>
                  <p className="text-gray-600 mb-4">Drag and drop triggers and actions to build your workflow</p>
                  <p className="text-sm text-gray-500">
                    This would integrate with React Flow library for node-based workflow building
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-between">
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Test Workflow
              </button>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowBuilder(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold">
                  Save Workflow
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowAutomationPage;
