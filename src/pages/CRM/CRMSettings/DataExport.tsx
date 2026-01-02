import React from 'react';
import { Download, FileText } from 'lucide-react';

const DataExport: React.FC = () => {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Export Data</h2>
        <p className="text-sm text-gray-600 mt-1">Download all your CRM data</p>
      </div>

      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">What's Included:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• All contacts and leads</li>
            <li>• Deals and opportunities</li>
            <li>• Activities and notes</li>
            <li>• Custom fields and data</li>
          </ul>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
          <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option>CSV Format</option>
            <option>JSON Format</option>
            <option>Excel (XLSX)</option>
          </select>
        </div>

        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Download className="h-4 w-4" />
          Request Export
        </button>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Recent Exports:</h4>
          <p className="text-sm text-gray-600">No recent exports</p>
        </div>
      </div>
    </div>
  );
};

export default DataExport;
