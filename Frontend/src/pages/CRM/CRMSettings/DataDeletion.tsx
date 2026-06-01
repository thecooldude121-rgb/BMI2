import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

const DataDeletion: React.FC = () => {
  const [confirmText, setConfirmText] = useState('');

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Delete Account Data</h2>
        <p className="text-sm text-gray-600 mt-1">Permanently delete your account and all data</p>
      </div>

      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="text-sm font-semibold text-red-900 mb-2">Warning: This action cannot be undone</h4>
            <p className="text-sm text-red-800">
              Deleting your account will permanently remove all your data including contacts, deals, activities, and custom configurations.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type "DELETE" to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        <button
          disabled={confirmText !== 'DELETE'}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Delete My Account
        </button>
      </div>
    </div>
  );
};

export default DataDeletion;
