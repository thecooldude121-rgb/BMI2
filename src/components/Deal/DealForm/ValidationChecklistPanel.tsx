import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface ValidationChecklistPanelProps {
  validation: {
    completed: number;
    total: number;
    percentage: number;
    isValid: boolean;
  };
  formData: any;
}

export const ValidationChecklistPanel: React.FC<ValidationChecklistPanelProps> = ({ validation, formData }) => {
  const requiredFields = [
    { field: 'dealName', label: 'Deal Name', completed: !!formData.dealName },
    { field: 'dealValue', label: 'Deal Value', completed: !!formData.dealValue },
    { field: 'closeDate', label: 'Close Date', completed: !!formData.closeDate },
    { field: 'stage', label: 'Stage', completed: !!formData.stage },
    { field: 'accountName', label: 'Account', completed: !!formData.accountName },
    { field: 'primaryContactName', label: 'Primary Contact', completed: !!formData.primaryContactName },
    { field: 'owner', label: 'Owner', completed: !!formData.owner },
    { field: 'source', label: 'Source', completed: !!formData.source }
  ];

  const recommendedFields = [
    { field: 'product', label: 'Product/Package', message: 'Add for better tracking', completed: !!formData.product },
    { field: 'description', label: 'Description', message: 'Help team understand deal', completed: !!formData.description },
    { field: 'nextSteps', label: 'Next Steps', message: 'Define action plan', completed: !!formData.nextSteps }
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center space-x-2 mb-4">
        <CheckCircle2 className="h-6 w-6 text-green-600" />
        <h2 className="text-lg font-bold text-gray-900">✅ VALIDATION CHECKLIST</h2>
      </div>

      <div className="space-y-4">
        <div>
          <div className="text-sm font-semibold text-gray-700 mb-3">Required Fields:</div>
          <div className="space-y-2">
            {requiredFields.map((field) => (
              <div key={field.field} className="flex items-center space-x-2">
                {field.completed ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                )}
                <span className={`text-sm ${field.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                  {field.label}: {field.completed ? 'Completed' : 'Required'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="text-sm font-semibold text-gray-700 mb-3">Recommended (Optional):</div>
          <div className="space-y-2">
            {recommendedFields.map((field) => (
              <div key={field.field}>
                <div className="flex items-center space-x-2">
                  {field.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className={`text-sm ${field.completed ? 'text-gray-900' : 'text-gray-700'}`}>
                    {field.label}: {field.completed ? 'Completed' : field.message}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Data Quality:</span>
            <span className="text-lg font-bold text-gray-900">{validation.percentage}/100 {validation.percentage >= 80 ? '(Excellent)' : validation.percentage >= 50 ? '(Good)' : '(Needs Work)'}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                validation.percentage >= 80 ? 'bg-green-500' : validation.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${validation.percentage}%` }}
            ></div>
          </div>
          {validation.isValid && (
            <div className="mt-2 text-sm font-medium text-green-600">✅ Ready to save!</div>
          )}
        </div>
      </div>
    </div>
  );
};
