import React, { useState } from 'react';
import {
  Settings, User, Mail, Calendar, Zap, Database, Shield,
  Bell, Globe, Download, Upload, Save, RefreshCw, Eye,
  Lock, Key, Smartphone, Monitor, Palette, Languages, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'email', name: 'Email Settings', icon: Mail },
    { id: 'sequences', name: 'Sequences', icon: Zap },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'integrations', name: 'Integrations', icon: Globe },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'data', name: 'Data & Privacy', icon: Database }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-8 py-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Go back"
            >
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </button>
            <div className="p-3 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl">
              <Settings className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 text-lg">Configure your lead generation preferences</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mt-6">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="mr-2 h-5 w-5" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-8">
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Profile Settings</h3>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-6">
                <img
                  src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1"
                  alt="Profile"
                  className="h-20 w-20 rounded-full object-cover"
                />
                <div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 mr-3">
                    Change Photo
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                    Remove
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    defaultValue="John"
                    className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    defaultValue="Smith"
                    className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    defaultValue="john@company.com"
                    className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    defaultValue="+1 (555) 123-4567"
                    className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'email' && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Email Settings</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Email Signature</h4>
                <textarea
                  rows={6}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Enter your email signature..."
                  defaultValue="Best regards,&#10;John Smith&#10;Sales Representative&#10;Company Name&#10;john@company.com&#10;+1 (555) 123-4567"
                />
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Email Preferences</h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    <span className="ml-3 text-sm text-gray-700">Track email opens</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    <span className="ml-3 text-sm text-gray-700">Track email clicks</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    <span className="ml-3 text-sm text-gray-700">Auto-save drafts</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Notification Preferences</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Email Notifications</h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    <span className="ml-3 text-sm text-gray-700">New prospect replies</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    <span className="ml-3 text-sm text-gray-700">Sequence completions</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    <span className="ml-3 text-sm text-gray-700">Daily activity summary</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    <span className="ml-3 text-sm text-gray-700">Weekly performance report</span>
                  </label>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Push Notifications</h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    <span className="ml-3 text-sm text-gray-700">Browser notifications</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    <span className="ml-3 text-sm text-gray-700">Mobile notifications</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Integrations</h3>
            
            <div className="space-y-4">
              {[
                { name: 'Gmail', description: 'Sync emails and track communications', connected: true, icon: Mail },
                { name: 'Google Calendar', description: 'Sync meetings and availability', connected: true, icon: Calendar },
                { name: 'LinkedIn Sales Navigator', description: 'Import prospects and enrich data', connected: false, icon: Globe },
                { name: 'Salesforce', description: 'Sync leads and opportunities', connected: false, icon: Database },
                { name: 'HubSpot', description: 'Import contacts and companies', connected: false, icon: Target }
              ].map((integration) => {
                const Icon = integration.icon;
                return (
                  <div key={integration.name} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-gray-100 rounded-lg">
                        <Icon className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{integration.name}</p>
                        <p className="text-sm text-gray-600">{integration.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {integration.connected && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Connected
                        </span>
                      )}
                      <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        integration.connected
                          ? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}>
                        {integration.connected ? 'Disconnect' : 'Connect'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Security Settings</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                      <input
                        type="password"
                        className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <input
                        type="password"
                        className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <button className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                    Update Password
                  </button>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Two-Factor Authentication</h4>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Enable 2FA</p>
                      <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                    </div>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                      Enable
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Data & Privacy</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Data Export</h4>
                <p className="text-sm text-gray-600 mb-4">Download your data in various formats</p>
                <div className="flex space-x-3">
                  <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                    <Download className="h-4 w-4 mr-2" />
                    Export Prospects
                  </button>
                  <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                    <Download className="h-4 w-4 mr-2" />
                    Export Companies
                  </button>
                  <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                    <Download className="h-4 w-4 mr-2" />
                    Export All Data
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Privacy Settings</h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    <span className="ml-3 text-sm text-gray-700">Allow usage analytics</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    <span className="ml-3 text-sm text-gray-700">Share data for product improvements</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    <span className="ml-3 text-sm text-gray-700">Receive product updates</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;