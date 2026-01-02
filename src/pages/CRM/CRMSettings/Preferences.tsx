import React, { useState } from 'react';
import { Save, Settings } from 'lucide-react';

const Preferences: React.FC = () => {
  const [generalPrefs, setGeneralPrefs] = useState({
    language: 'en-US',
    timezone: 'America/Los_Angeles',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    weekStart: 'monday',
    currency: 'USD'
  });

  const [displayPrefs, setDisplayPrefs] = useState({
    theme: 'auto',
    density: 'normal',
    defaultDealsView: 'kanban',
    defaultLeadsView: 'list',
    itemsPerPage: 25
  });

  const [dashboardPrefs, setDashboardPrefs] = useState({
    defaultLandingPage: 'dashboard',
    widgets: {
      pipelineOverview: true,
      recentActivities: true,
      aiInsights: true,
      topDeals: true,
      upcomingMeetings: true,
      hotLeads: false
    }
  });

  const getCurrentTime = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      timeZone: generalPrefs.timezone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: generalPrefs.timeFormat === '12h'
    };
    return now.toLocaleString('en-US', options);
  };

  const formatDatePreview = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const year = now.getFullYear();

    switch (generalPrefs.dateFormat) {
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      default:
        return `${month}/${day}/${year}`;
    }
  };

  const formatTimePreview = () => {
    const now = new Date();
    if (generalPrefs.timeFormat === '12h') {
      return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else {
      return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
  };

  const formatCurrencyPreview = () => {
    const currencySymbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'INR': '₹',
      'AUD': 'A$',
      'CAD': 'C$'
    };
    return `${currencySymbols[generalPrefs.currency]}50,000.00`;
  };

  const getTimezoneLabel = (tz: string) => {
    const tzLabels: { [key: string]: string } = {
      'America/New_York': 'America/New_York (EST, UTC-5)',
      'America/Chicago': 'America/Chicago (CST, UTC-6)',
      'America/Denver': 'America/Denver (MST, UTC-7)',
      'America/Los_Angeles': 'America/Los_Angeles (PST, UTC-8)',
      'Europe/London': 'Europe/London (GMT, UTC+0)',
      'Europe/Paris': 'Europe/Paris (CET, UTC+1)',
      'Asia/Tokyo': 'Asia/Tokyo (JST, UTC+9)',
      'Asia/Shanghai': 'Asia/Shanghai (CST, UTC+8)',
      'Australia/Sydney': 'Australia/Sydney (AEDT, UTC+11)'
    };
    return tzLabels[tz] || tz;
  };

  const handleSaveGeneral = () => {
    console.log('Saving general preferences:', generalPrefs);
  };

  const handleSaveDisplay = () => {
    console.log('Saving display preferences:', displayPrefs);
  };

  const handleSaveDashboard = () => {
    console.log('Saving dashboard preferences:', dashboardPrefs);
  };

  const toggleWidget = (widget: keyof typeof dashboardPrefs.widgets) => {
    setDashboardPrefs({
      ...dashboardPrefs,
      widgets: {
        ...dashboardPrefs.widgets,
        [widget]: !dashboardPrefs.widgets[widget]
      }
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Preferences</h2>
          <p className="text-sm text-gray-600 mt-1">Customize your CRM experience</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              GENERAL PREFERENCES
            </h3>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <select
                value={generalPrefs.language}
                onChange={(e) => setGeneralPrefs({ ...generalPrefs, language: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="es-ES">Spanish</option>
                <option value="fr-FR">French</option>
                <option value="de-DE">German</option>
                <option value="pt-PT">Portuguese</option>
                <option value="zh-CN">Chinese</option>
                <option value="ja-JP">Japanese</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Options: English (US), English (UK), Spanish, French, German, Portuguese, Chinese, Japanese
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
              <select
                value={generalPrefs.timezone}
                onChange={(e) => setGeneralPrefs({ ...generalPrefs, timezone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="America/New_York">America/New_York (EST, UTC-5)</option>
                <option value="America/Chicago">America/Chicago (CST, UTC-6)</option>
                <option value="America/Denver">America/Denver (MST, UTC-7)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST, UTC-8)</option>
                <option value="Europe/London">Europe/London (GMT, UTC+0)</option>
                <option value="Europe/Paris">Europe/Paris (CET, UTC+1)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST, UTC+9)</option>
                <option value="Asia/Shanghai">Asia/Shanghai (CST, UTC+8)</option>
                <option value="Australia/Sydney">Australia/Sydney (AEDT, UTC+11)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Current time: {getCurrentTime()}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
              <select
                value={generalPrefs.dateFormat}
                onChange={(e) => setGeneralPrefs({ ...generalPrefs, dateFormat: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Preview: {formatDatePreview()}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Format</label>
              <select
                value={generalPrefs.timeFormat}
                onChange={(e) => setGeneralPrefs({ ...generalPrefs, timeFormat: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="12h">12-hour (AM/PM)</option>
                <option value="24h">24-hour</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Preview: {formatTimePreview()}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Week Starts On</label>
              <select
                value={generalPrefs.weekStart}
                onChange={(e) => setGeneralPrefs({ ...generalPrefs, weekStart: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="sunday">Sunday</option>
                <option value="monday">Monday</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <select
                value={generalPrefs.currency}
                onChange={(e) => setGeneralPrefs({ ...generalPrefs, currency: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="INR">INR (₹)</option>
                <option value="AUD">AUD (A$)</option>
                <option value="CAD">CAD (C$)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Preview: {formatCurrencyPreview()}
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleSaveGeneral}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">DISPLAY PREFERENCES</h3>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Theme</label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="theme"
                    checked={displayPrefs.theme === 'light'}
                    onChange={() => setDisplayPrefs({ ...displayPrefs, theme: 'light' })}
                  />
                  <span className="text-sm text-gray-900">Light Mode (Default)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="theme"
                    checked={displayPrefs.theme === 'dark'}
                    onChange={() => setDisplayPrefs({ ...displayPrefs, theme: 'dark' })}
                  />
                  <span className="text-sm text-gray-900">Dark Mode</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="theme"
                    checked={displayPrefs.theme === 'auto'}
                    onChange={() => setDisplayPrefs({ ...displayPrefs, theme: 'auto' })}
                  />
                  <span className="text-sm text-gray-900">Auto (Match system preferences)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Density</label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="density"
                    checked={displayPrefs.density === 'comfortable'}
                    onChange={() => setDisplayPrefs({ ...displayPrefs, density: 'comfortable' })}
                  />
                  <span className="text-sm text-gray-900">Comfortable (More spacing)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="density"
                    checked={displayPrefs.density === 'normal'}
                    onChange={() => setDisplayPrefs({ ...displayPrefs, density: 'normal' })}
                  />
                  <span className="text-sm text-gray-900">Normal</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="density"
                    checked={displayPrefs.density === 'compact'}
                    onChange={() => setDisplayPrefs({ ...displayPrefs, density: 'compact' })}
                  />
                  <span className="text-sm text-gray-900">Compact (Less spacing)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Default View for Deals</label>
              <select
                value={displayPrefs.defaultDealsView}
                onChange={(e) => setDisplayPrefs({ ...displayPrefs, defaultDealsView: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="kanban">Kanban Pipeline</option>
                <option value="list">List</option>
                <option value="calendar">Calendar</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                (Controls Screen 5.1 default view)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Default View for Leads</label>
              <select
                value={displayPrefs.defaultLeadsView}
                onChange={(e) => setDisplayPrefs({ ...displayPrefs, defaultLeadsView: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="list">List View</option>
                <option value="grid">Grid</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                (Controls Screen 2.1 default view)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Items Per Page</label>
              <select
                value={displayPrefs.itemsPerPage}
                onChange={(e) => setDisplayPrefs({ ...displayPrefs, itemsPerPage: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="10">10 items</option>
                <option value="25">25 items</option>
                <option value="50">50 items</option>
                <option value="100">100 items</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                (Applies to all list views)
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleSaveDisplay}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">DASHBOARD PREFERENCES</h3>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Default Landing Page</label>
              <select
                value={dashboardPrefs.defaultLandingPage}
                onChange={(e) => setDashboardPrefs({ ...dashboardPrefs, defaultLandingPage: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="dashboard">Dashboard (Screen 1.1)</option>
                <option value="leads">Leads</option>
                <option value="deals">Deals</option>
                <option value="activities">Activities</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Show on Dashboard</label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dashboardPrefs.widgets.pipelineOverview}
                    onChange={() => toggleWidget('pipelineOverview')}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-900">Pipeline overview</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dashboardPrefs.widgets.recentActivities}
                    onChange={() => toggleWidget('recentActivities')}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-900">Recent activities</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dashboardPrefs.widgets.aiInsights}
                    onChange={() => toggleWidget('aiInsights')}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-900">AI insights</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dashboardPrefs.widgets.topDeals}
                    onChange={() => toggleWidget('topDeals')}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-900">Top deals</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dashboardPrefs.widgets.upcomingMeetings}
                    onChange={() => toggleWidget('upcomingMeetings')}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-900">Upcoming meetings</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dashboardPrefs.widgets.hotLeads}
                    onChange={() => toggleWidget('hotLeads')}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-900">Hot leads widget</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleSaveDashboard}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preferences;
