import React, { useState } from 'react';
import { Save } from 'lucide-react';

const DisplayPreferences: React.FC = () => {
  const [display, setDisplay] = useState({
    theme: 'light',
    density: 'comfortable',
    sidebarCollapsed: false,
    showAvatars: true,
    animationsEnabled: true
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Display Preferences</h2>
        <p className="text-sm text-gray-600 mt-1">Customize the appearance of your CRM interface</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
          <select
            value={display.theme}
            onChange={(e) => setDisplay({ ...display, theme: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto (System)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Display Density</label>
          <select
            value={display.density}
            onChange={(e) => setDisplay({ ...display, density: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
            <option value="spacious">Spacious</option>
          </select>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-gray-200">
          <div>
            <div className="text-sm font-medium text-gray-700">Collapse Sidebar by Default</div>
            <div className="text-xs text-gray-500">Start with a collapsed sidebar on page load</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={display.sidebarCollapsed}
              onChange={(e) => setDisplay({ ...display, sidebarCollapsed: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-gray-200">
          <div>
            <div className="text-sm font-medium text-gray-700">Show User Avatars</div>
            <div className="text-xs text-gray-500">Display profile pictures throughout the interface</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={display.showAvatars}
              onChange={(e) => setDisplay({ ...display, showAvatars: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-gray-200">
          <div>
            <div className="text-sm font-medium text-gray-700">Enable Animations</div>
            <div className="text-xs text-gray-500">Use smooth transitions and animations</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={display.animationsEnabled}
              onChange={(e) => setDisplay({ ...display, animationsEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Display Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisplayPreferences;
