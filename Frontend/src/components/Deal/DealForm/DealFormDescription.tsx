import React from 'react';
import { FileText } from 'lucide-react';

interface DealFormDescriptionProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export const DealFormDescription: React.FC<DealFormDescriptionProps> = ({ formData, onChange }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center space-x-3 mb-6 pb-3 border-b border-gray-100">
        <div className="p-2 bg-gray-50 rounded-lg">
          <FileText className="h-5 w-5 text-gray-500" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">Description & Next Steps</h2>
          <p className="text-xs text-gray-500">Context and immediate actions for this deal</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description/Notes:</label>
          <textarea
            value={formData.description}
            onChange={(e) => onChange('description', e.target.value)}
            placeholder="Summarize customer needs, budget, timeline, and use case…"
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder:text-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Next Steps:</label>
          <textarea
            value={formData.nextSteps}
            onChange={(e) => onChange('nextSteps', e.target.value)}
            placeholder="e.g. Send proposal, schedule stakeholder demo, confirm procurement process…"
            rows={5}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder:text-gray-400"
          />
        </div>
      </div>
    </div>
  );
};
