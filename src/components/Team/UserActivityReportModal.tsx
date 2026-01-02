import React, { useState } from 'react';
import { X, Download, BarChart3, CheckCircle } from 'lucide-react';

interface UserActivityReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'pdf' | 'csv', dateRange: string) => void;
}

const UserActivityReportModal: React.FC<UserActivityReportModalProps> = ({
  isOpen,
  onClose,
  onExport
}) => {
  const [dateRange, setDateRange] = useState('30');
  const [includeLogins, setIncludeLogins] = useState(true);
  const [includeFeatureUsage, setIncludeFeatureUsage] = useState(true);
  const [includeDataAccess, setIncludeDataAccess] = useState(true);
  const [includeFailedLogins, setIncludeFailedLogins] = useState(true);

  if (!isOpen) return null;

  const handleExport = (format: 'pdf' | 'csv') => {
    const dateRangeLabel = dateRange === '7' ? 'Last 7 Days' :
                           dateRange === '30' ? 'Last 30 Days' :
                           dateRange === '90' ? 'Last 90 Days' : 'Custom Range';
    onExport(format, dateRangeLabel);
  };

  const userBreakdown = [
    {
      name: 'Sarah Chen',
      logins: 75,
      lastLogin: 'Today 9:30 AM',
      devices: 2
    },
    {
      name: 'Alex Rodriguez',
      logins: 74,
      lastLogin: 'Today 9:45 AM',
      devices: 1
    },
    {
      name: 'Mike Johnson',
      logins: 73,
      lastLogin: 'Today 8:15 AM',
      devices: 2
    }
  ];

  const featureUsage = [
    { feature: 'Deals', count: 245, percentage: 100 },
    { feature: 'Contacts', count: 189, percentage: 100 },
    { feature: 'Activities', count: 156, percentage: 100 },
    { feature: 'Team', count: 34, percentage: 67 },
    { feature: 'Reports', count: 12, percentage: 33 }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold">User Activity Report</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Date Range Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="custom">Custom range</option>
            </select>
          </div>

          {/* Include Options */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Include
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeLogins}
                  onChange={(e) => setIncludeLogins(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Login activity</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeFeatureUsage}
                  onChange={(e) => setIncludeFeatureUsage(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Feature usage</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeDataAccess}
                  onChange={(e) => setIncludeDataAccess(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Data access</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeFailedLogins}
                  onChange={(e) => setIncludeFailedLogins(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Failed login attempts</span>
              </label>
            </div>
          </div>

          {/* Summary Section */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
              Summary (Last {dateRange} Days)
            </h3>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total Active Users</p>
                  <p className="text-xl font-bold text-gray-900">3/3 <span className="text-sm text-green-600">(100%)</span></p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total Logins</p>
                  <p className="text-xl font-bold text-gray-900">222</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Avg Logins per User</p>
                  <p className="text-xl font-bold text-gray-900">74</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Failed Login Attempts</p>
                  <p className="text-xl font-bold text-gray-900">0</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Most Active Day</p>
                  <p className="text-sm font-semibold text-gray-900">Weekdays</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Peak Usage Hours</p>
                  <p className="text-sm font-semibold text-gray-900">9 AM - 5 PM PST</p>
                </div>
              </div>
            </div>
          </div>

          {/* User Breakdown */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
              User Breakdown
            </h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Logins
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Devices
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {userBreakdown.map((user, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {user.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700">
                        {user.logins}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700">
                        {user.lastLogin}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700">
                        {user.devices}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Feature Usage */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
              Feature Usage
            </h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Feature
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Usage Count
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      % of Users
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {featureUsage.map((feature, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {feature.feature}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700">
                        {feature.count}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-gray-700">{feature.percentage}%</span>
                          {feature.percentage === 100 && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <button
                onClick={() => handleExport('pdf')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Download className="w-4 h-4" />
                Export Report (PDF)
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Download className="w-4 h-4" />
                Export Report (CSV)
              </button>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserActivityReportModal;
