import React from 'react';
import { Lightbulb, Briefcase } from 'lucide-react';

export const TipsHelpPanel: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center space-x-2 mb-4">
        <Lightbulb className="h-6 w-6 text-yellow-600" />
        <h2 className="text-lg font-bold text-gray-900">💡 TIPS & HELP</h2>
      </div>

      <div className="space-y-4">
        <div>
          <div className="text-sm font-semibold text-gray-700 mb-2">Pro Tips:</div>
          <ul className="space-y-1 text-sm text-gray-600">
            <li>• Link to existing account to avoid duplicates</li>
            <li>• Add all decision makers upfront</li>
            <li>• Use realistic close dates (AI suggestions help)</li>
            <li>• Tag deals for better organization</li>
            <li>• Set next steps to stay on track</li>
          </ul>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border-2 border-orange-300">
            <div className="flex items-center space-x-2 mb-2">
              <Briefcase className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-bold text-orange-900">🏢 UNIQUE: HRMS Connection</span>
            </div>
            <div className="text-sm text-orange-800">
              If this deal came from HRMS recruitment, select "HRMS (Recruitment)" as source to track warm intro advantage and higher close rates!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
