import React, { useState } from 'react';
import { User, Bell, Shield, Database, Mail, Calendar, Zap, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'integrations', name: 'Integrations', icon: Zap },
    { id: 'data', name: 'Data & Privacy', icon: Database },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and application preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full lg:w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="mr-3 h-5 w-5" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile Settings</h2>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-6">
                  <img
                    src={user?.avatar || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'}
                    alt={user?.name}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                  <div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 mr-3">
                      Change Photo
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                      Remove
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      defaultValue={user?.name}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      defaultValue={user?.email}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <input
                      type="text"
                      value={user?.role}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      defaultValue={user?.department}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                    Cancel
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Notification Preferences</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Email Notifications</h3>
                  <div className="space-y-3">
                    {[
                      { id: 'new-leads', label: 'New leads assigned to me', checked: true },
                      { id: 'deal-updates', label: 'Deal stage changes', checked: true },
                      { id: 'task-reminders', label: 'Task due date reminders', checked: true },
                      { id: 'meeting-notifications', label: 'Meeting reminders', checked: true },
                      { id: 'weekly-digest', label: 'Weekly performance digest', checked: false }
                    ].map((item) => (
                      <div key={item.id} className="flex items-center">
                        <input
                          id={item.id}
                          type="checkbox"
                          defaultChecked={item.checked}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={item.id} className="ml-3 text-sm text-gray-700">
                          {item.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Push Notifications</h3>
                  <div className="space-y-3">
                    {[
                      { id: 'browser-notifications', label: 'Browser notifications', checked: true },
                      { id: 'mobile-notifications', label: 'Mobile app notifications', checked: false },
                      { id: 'desktop-notifications', label: 'Desktop notifications', checked: true }
                    ].map((item) => (
                      <div key={item.id} className="flex items-center">
                        <input
                          id={item.id}
                          type="checkbox"
                          defaultChecked={item.checked}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={item.id} className="ml-3 text-sm text-gray-700">
                          {item.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                    Save Preferences
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Security Settings</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Change Password</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Password
                        </label>
                        <input
                          type="password"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                        Update Password
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Two-Factor Authentication</h3>
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Enable 2FA</p>
                        <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                      </div>
                      <button className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700">
                        Enable
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Integrations</h2>
              
              <div className="space-y-4">
                {[
                  {
                    name: 'Google Calendar',
                    description: 'Sync meetings and events with your Google Calendar',
                    icon: Calendar,
                    connected: true,
                    color: 'text-blue-600'
                  },
                  {
                    name: 'Gmail',
                    description: 'Sync emails and automatically log communications',
                    icon: Mail,
                    connected: false,
                    color: 'text-red-600'
                  },
                  {
                    name: 'LinkedIn',
                    description: 'Import leads and enrich contact profiles',
                    icon: User,
                    connected: true,
                    color: 'text-blue-700'
                  },
                  {
                    name: 'Outlook',
                    description: 'Sync emails and calendar with Microsoft Outlook',
                    icon: Mail,
                    connected: false,
                    color: 'text-blue-600'
                  }
                ].map((integration) => (
                  <div key={integration.name} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg bg-gray-100`}>
                        <integration.icon className={`h-6 w-6 ${integration.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{integration.name}</p>
                        <p className="text-sm text-gray-500">{integration.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {integration.connected && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Connected
                        </span>
                      )}
                      <button className={`px-4 py-2 rounded-md text-sm font-medium ${
                        integration.connected
                          ? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}>
                        {integration.connected ? 'Disconnect' : 'Connect'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Data & Privacy</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Data Export</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Download a copy of all your data in CSV format.
                    </p>
                    <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                      <Download className="h-4 w-4 mr-2" />
                      Export All Data
                    </button>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Privacy Settings</h3>
                    <div className="space-y-3">
                      {[
                        { id: 'analytics', label: 'Allow usage analytics', checked: true },
                        { id: 'marketing', label: 'Receive marketing communications', checked: false },
                        { id: 'third-party', label: 'Share data with third-party integrations', checked: true }
                      ].map((item) => (
                        <div key={item.id} className="flex items-center">
                          <input
                            id={item.id}
                            type="checkbox"
                            defaultChecked={item.checked}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor={item.id} className="ml-3 text-sm text-gray-700">
                            {item.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-4 text-red-600">Danger Zone</h3>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-red-800 mb-2">Delete Account</h4>
                      <p className="text-sm text-red-700 mb-3">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                      <button className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700">
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;