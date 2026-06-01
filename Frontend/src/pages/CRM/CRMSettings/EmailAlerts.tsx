import React, { useState } from 'react';
import { Save } from 'lucide-react';

const EmailAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState({
    newLeads: true,
    dealUpdates: true,
    taskReminders: true,
    meetingInvites: true,
    activityDigest: false,
    weeklyReports: true
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Email Alerts</h2>
        <p className="text-sm text-gray-600 mt-1">Choose which notifications you receive via email</p>
      </div>

      <div className="space-y-4">
        {Object.entries(alerts).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <div className="text-sm font-medium text-gray-700">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </div>
              <div className="text-xs text-gray-500">Receive notifications about this activity</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => setAlerts({ ...alerts, [key]: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Preferences
        </button>
      </div>
    </div>
  );
};

export default EmailAlerts;
