import React from 'react';

interface DealFormDescriptionProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export const DealFormDescription: React.FC<DealFormDescriptionProps> = ({ formData, onChange }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">
        ━━━ DEAL DESCRIPTION & NOTES ━━━━━━━━━━━━━━━━━━━
      </h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description/Notes:</label>
          <textarea
            value={formData.description}
            onChange={(e) => onChange('description', e.target.value)}
            placeholder="Enterprise plan for 75-person SaaS company. Key needs: Automation, integration with Salesforce, reporting dashboards. Budget confirmed at $50K. Timeline: Q1 2026."
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="text-sm text-gray-500 mt-1">Rich text editor: Bold, Italic, Lists, Links</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Next Steps:</label>
          <textarea
            value={formData.nextSteps}
            onChange={(e) => onChange('nextSteps', e.target.value)}
            placeholder="1. Send proposal by Dec 10&#10;2. Schedule demo for stakeholders&#10;3. Get CEO introduction from John"
            rows={5}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>
    </div>
  );
};
