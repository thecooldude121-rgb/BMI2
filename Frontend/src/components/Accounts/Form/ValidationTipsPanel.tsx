import React from 'react';
import { CheckCircle } from 'lucide-react';

const ValidationTipsPanel: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center space-x-2 mb-4">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <h3 className="text-sm font-semibold text-gray-900">Validation Tips</h3>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium text-gray-700 mb-2">Required fields:</p>
          <ul className="space-y-1 text-xs text-gray-600">
            <li>• Company Name: Required field</li>
            <li>• Website: Must be valid URL</li>
            <li>• Industry: Required for reporting</li>
            <li>• Owner: Required to assign account</li>
          </ul>
        </div>

        <div className="pt-3 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-700 mb-2">Optional but recommended:</p>
          <ul className="space-y-1 text-xs text-gray-600">
            <li>• LinkedIn (for enrichment)</li>
            <li>• Employee count (for segmentation)</li>
            <li>• Revenue (for prioritization)</li>
            <li>• Location (for territory planning)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ValidationTipsPanel;
