import React, { useState } from 'react';
import {
  Bell, Plus, Trash2, Edit, ArrowLeft, MessageSquare, Mail,
  Webhook, Check, X, Activity, TrendingUp, Clock, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { NotificationConfiguration, NotificationChannel } from '../../types/workflowAutomation';

const NotificationsManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [configurations, setConfigurations] = useState<NotificationConfiguration[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<NotificationChannel | null>(null);

  const channels: Array<{
    id: NotificationChannel;
    name: string;
    icon: string;
    color: string;
    description: string;
  }> = [
    {
      id: 'slack',
      name: 'Slack',
      icon: '💬',
      color: 'from-purple-500 to-pink-600',
      description: 'Send notifications to Slack channels'
    },
    {
      id: 'teams',
      name: 'Microsoft Teams',
      icon: '👥',
      color: 'from-blue-500 to-indigo-600',
      description: 'Send notifications to Teams channels'
    },
    {
      id: 'email',
      name: 'Email',
      icon: '✉️',
      color: 'from-green-500 to-emerald-600',
      description: 'Send email notifications'
    },
    {
      id: 'webhook',
      name: 'Webhook',
      icon: '🔗',
      color: 'from-orange-500 to-red-600',
      description: 'Custom webhook integration'
    }
  ];

  const triggerEvents = [
    { id: 'new_high_intent_lead', label: 'New High-Intent Lead', icon: '🎯', popular: true },
    { id: 'reply_received', label: 'Reply Received', icon: '💬', popular: true },
    { id: 'meeting_booked', label: 'Meeting Booked', icon: '📅', popular: true },
    { id: 'sequence_completed', label: 'Sequence Completed', icon: '✅', popular: false },
    { id: 'target_account_visit', label: 'Target Account Website Visit', icon: '🌐', popular: true },
    { id: 'deal_created', label: 'Deal Created', icon: '💰', popular: false },
    { id: 'task_due', label: 'Task Due', icon: '⏰', popular: false },
    { id: 'lead_qualified', label: 'Lead Qualified', icon: '⭐', popular: false }
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
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <Bell className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-600 text-lg">Configure Slack, Teams, and webhook notifications</p>
              </div>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Notification
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 py-8">
        {configurations.length === 0 ? (
          <div className="space-y-8">
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
                <Bell className="h-10 w-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Notifications Configured</h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Get real-time alerts in Slack, Teams, or via webhook when important events happen
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Available Channels</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {channels.map((channel) => (
                  <div
                    key={channel.id}
                    className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => {
                      setSelectedChannel(channel.id);
                      setShowCreateModal(true);
                    }}
                  >
                    <div className={`p-3 bg-gradient-to-r ${channel.color} rounded-lg w-fit mb-4`}>
                      <span className="text-3xl">{channel.icon}</span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2">{channel.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{channel.description}</p>

                    <button className={`w-full px-4 py-2 bg-gradient-to-r ${channel.color} text-white rounded-lg hover:shadow-md transition-all text-sm font-semibold`}>
                      <Plus className="h-4 w-4 inline mr-2" />
                      Configure
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Popular Notification Triggers</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {triggerEvents.filter(e => e.popular).map((event) => (
                  <div
                    key={event.id}
                    className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200"
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{event.icon}</span>
                      <h4 className="font-semibold text-gray-900 text-sm">{event.label}</h4>
                    </div>
                    <p className="text-xs text-gray-600">Get notified instantly when this happens</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 text-white">
              <div className="max-w-3xl">
                <h3 className="text-2xl font-bold mb-4">Quick Actions in Slack</h3>
                <p className="mb-6 opacity-90">
                  Interact with leads directly from Slack messages using action buttons:
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white bg-opacity-20 backdrop-blur rounded-lg p-4">
                    <h4 className="font-semibold mb-2">👤 Assign to me</h4>
                    <p className="text-sm opacity-90">Claim leads with one click</p>
                  </div>
                  <div className="bg-white bg-opacity-20 backdrop-blur rounded-lg p-4">
                    <h4 className="font-semibold mb-2">➕ Add to sequence</h4>
                    <p className="text-sm opacity-90">Start outreach immediately</p>
                  </div>
                  <div className="bg-white bg-opacity-20 backdrop-blur rounded-lg p-4">
                    <h4 className="font-semibold mb-2">📝 Create task</h4>
                    <p className="text-sm opacity-90">Schedule follow-up actions</p>
                  </div>
                  <div className="bg-white bg-opacity-20 backdrop-blur rounded-lg p-4">
                    <h4 className="font-semibold mb-2">👁️ View profile</h4>
                    <p className="text-sm opacity-90">Open full prospect details</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Active Notifications</span>
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {configurations.filter(c => c.is_active).length}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Delivered Today</span>
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">47</p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Success Rate</span>
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">99.8%</p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Avg Response Time</span>
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">250ms</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Configured Notifications</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {configurations.map((config) => {
                  const channel = channels.find(c => c.id === config.channel);
                  if (!channel) return null;

                  return (
                    <div key={config.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className={`p-2 bg-gradient-to-r ${channel.color} rounded-lg`}>
                            <span className="text-2xl">{channel.icon}</span>
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-1">
                              <h3 className="text-lg font-semibold text-gray-900">{config.name}</h3>
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${config.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                {config.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>Channel: {channel.name}</span>
                              <span>•</span>
                              <span>{config.trigger_events.length} events</span>
                              <span>•</span>
                              <span>{config.delivery_count} delivered</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <Edit className="h-5 w-5 text-gray-600" />
                          </button>
                          <button className="p-2 hover:bg-red-100 rounded-lg transition-colors">
                            <Trash2 className="h-5 w-5 text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Configure Notification</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedChannel(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., High-Intent Lead Alerts"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Channel
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {channels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => setSelectedChannel(channel.id)}
                      className={`flex items-center p-4 border-2 rounded-lg transition-all ${
                        selectedChannel === channel.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <span className="text-2xl mr-3">{channel.icon}</span>
                      <span className="font-semibold text-gray-900">{channel.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedChannel && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {selectedChannel === 'slack' || selectedChannel === 'teams' ? 'Webhook URL' : 'Configuration'}
                    </label>
                    <input
                      type="text"
                      placeholder={
                        selectedChannel === 'slack'
                          ? 'https://hooks.slack.com/services/...'
                          : selectedChannel === 'teams'
                          ? 'https://outlook.office.com/webhook/...'
                          : 'Enter webhook URL'
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Trigger Events
                    </label>
                    <div className="space-y-2 max-h-64 overflow-auto">
                      {triggerEvents.map((event) => (
                        <label
                          key={event.id}
                          className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                        >
                          <input type="checkbox" className="mr-3 rounded" />
                          <span className="mr-2">{event.icon}</span>
                          <span className="text-sm font-medium text-gray-900">{event.label}</span>
                          {event.popular && (
                            <span className="ml-auto px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded">
                              Popular
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedChannel(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                <Zap className="h-4 w-4 inline mr-2" />
                Create Notification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsManagementPage;
