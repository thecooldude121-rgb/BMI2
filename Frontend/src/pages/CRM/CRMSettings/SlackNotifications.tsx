import React, { useState } from 'react';
import { Save, ExternalLink } from 'lucide-react';

const SlackNotifications: React.FC = () => {
  const [connected, setConnected] = useState(true);
  const [settings, setSettings] = useState({
    channel: '#sales-team',
    newDeals: true,
    dealWins: true,
    leadAssignments: false,
    dailySummary: true
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Slack Notifications</h2>
        <p className="text-sm text-gray-600 mt-1">Manage notifications sent to Slack</p>
      </div>

      {connected ? (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-green-900">Slack Connected</div>
              <div className="text-xs text-green-700">Notifications will be sent to {settings.channel}</div>
            </div>
            <button className="text-sm text-red-600 hover:text-red-700">Disconnect</button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Default Channel</label>
            <input
              type="text"
              value={settings.channel}
              onChange={(e) => setSettings({ ...settings, channel: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-4">
            {Object.entries(settings).filter(([key]) => key !== 'channel').map(([key, value]) => (
              <div key={key} className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <div className="text-sm font-medium text-gray-700">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </div>
                  <div className="text-xs text-gray-500">Post to Slack when this occurs</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value as boolean}
                    onChange={(e) => setSettings({ ...settings, [key]: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Settings
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Connect your Slack workspace to receive notifications</p>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto">
            Connect Slack
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default SlackNotifications;
