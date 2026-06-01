import React, { useState } from 'react';
import { Download, Check, AlertTriangle, Info } from 'lucide-react';

const DataPrivacySettings: React.FC = () => {
  const [exportFormat, setExportFormat] = useState('CSV');
  const [deletedItemsRetention, setDeletedItemsRetention] = useState('30 days');
  const [activityLogRetention, setActivityLogRetention] = useState('1 year');
  const [shareUsageData, setShareUsageData] = useState(false);
  const [allowProductUpdates, setAllowProductUpdates] = useState(false);
  const [essentialCookies] = useState(true);
  const [analyticsCookies, setAnalyticsCookies] = useState(true);
  const [marketingCookies, setMarketingCookies] = useState(false);

  const exportIncludes = [
    'All leads (Module 2)',
    'All contacts (Module 3)',
    'All accounts (Module 4)',
    'All deals (Module 5)',
    'All activities (Module 6)',
    'All documents (Module 8)',
    'Integration logs',
    'Custom fields and settings'
  ];

  const recentExports = [
    {
      date: 'Nov 15, 2024',
      filename: 'all_data_export.zip',
      size: '45 MB'
    }
  ];

  const handleRequestExport = () => {
    alert(`Requesting data export in ${exportFormat} format. You'll receive an email when your export is ready (typically within 24 hours).`);
  };

  const handleDownloadExport = (filename: string) => {
    alert(`Downloading ${filename}...`);
  };

  const handleSaveRetention = () => {
    alert(`Data retention settings saved:\nDeleted items: ${deletedItemsRetention}\nActivity logs: ${activityLogRetention}`);
  };

  const handleSavePrivacy = () => {
    alert('Privacy settings saved successfully!');
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you absolutely sure you want to delete your account? This action cannot be undone and you will lose all your data permanently.')) {
      alert('Account deletion process initiated. You will receive a confirmation email.');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data & Privacy</h2>
          <p className="text-sm text-gray-600 mt-1">Manage your data, privacy, and account settings</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">EXPORT YOUR DATA</h3>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-700">Download a copy of all your CRM data.</p>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Export includes:</p>
              <div className="space-y-2">
                {exportIncludes.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Format:</label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="CSV">CSV</option>
                <option value="JSON">JSON</option>
                <option value="Excel (.xlsx)">Excel (.xlsx)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Options: CSV, JSON, Excel (.xlsx)</p>
            </div>

            <button
              onClick={handleRequestExport}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Request Data Export
            </button>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                You'll receive an email when your export is ready (typically within 24 hours)
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-3">Recent Exports:</p>
              {recentExports.map((exportItem, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <span className="text-sm text-gray-900">
                      {exportItem.date} - {exportItem.filename} ({exportItem.size})
                    </span>
                  </div>
                  <button
                    onClick={() => handleDownloadExport(exportItem.filename)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium ml-3"
                  >
                    [Download]
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">DATA RETENTION</h3>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deleted Items Retention:
              </label>
              <select
                value={deletedItemsRetention}
                onChange={(e) => setDeletedItemsRetention(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7 days">7 days</option>
                <option value="30 days">30 days</option>
                <option value="90 days">90 days</option>
                <option value="Forever">Forever</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Options: 7 days, 30 days, 90 days, Forever
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Deleted items are kept in trash for this period before permanent deletion.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activity Log Retention:
              </label>
              <select
                value={activityLogRetention}
                onChange={(e) => setActivityLogRetention(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="3 months">3 months</option>
                <option value="6 months">6 months</option>
                <option value="1 year">1 year</option>
                <option value="Forever">Forever</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Options: 3 months, 6 months, 1 year, Forever
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleSaveRetention}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">PRIVACY SETTINGS</h3>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Data Sharing:</p>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shareUsageData}
                    onChange={(e) => setShareUsageData(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Share anonymized usage data to improve BMI CRM
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowProductUpdates}
                    onChange={(e) => setAllowProductUpdates(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Allow BMI CRM to contact me about product updates
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-3">Cookie Preferences:</p>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-not-allowed">
                  <input
                    type="checkbox"
                    checked={essentialCookies}
                    disabled
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 opacity-50 cursor-not-allowed"
                  />
                  <span className="text-sm text-gray-700">
                    Essential cookies (required)
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={analyticsCookies}
                    onChange={(e) => setAnalyticsCookies(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Analytics cookies</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={marketingCookies}
                    onChange={(e) => setMarketingCookies(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Marketing cookies</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleSavePrivacy}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>

        <div className="border border-red-300 rounded-lg overflow-hidden">
          <div className="bg-red-50 px-6 py-4 border-b border-red-300">
            <h3 className="font-semibold text-red-900">DELETE ACCOUNT</h3>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-red-50 border border-red-300 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-red-900 mb-2">DANGER ZONE</h4>
              </div>
            </div>

            <p className="text-sm text-gray-700">
              Permanently delete your account and all associated data.
            </p>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">This action:</p>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>Deletes all leads, contacts, accounts, deals</li>
                <li>Deletes all activities and documents</li>
                <li>Disconnects all integrations</li>
                <li>Cannot be undone</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">
                Your subscription will be canceled and you will not receive a refund for the current billing period.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleDeleteAccount}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete My Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataPrivacySettings;
