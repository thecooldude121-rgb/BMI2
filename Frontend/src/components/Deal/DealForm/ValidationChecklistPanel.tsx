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
  const closeDateIsPast = !!formData.closeDate && (() => {
    const t = new Date(); t.setHours(0,0,0,0);
    return new Date(formData.closeDate) < t;
  })();
  const closeDateNeedsReason = closeDateIsPast && !formData.closeDateOverrideReason?.trim();

  // status: 'complete' | 'warning' | 'incomplete'
  const closeDateStatus = !formData.closeDate
    ? 'incomplete'
    : closeDateNeedsReason
    ? 'warning'
    : 'complete';

  const requiredFields = [
    { field: 'dealName',           label: 'Deal Name',       status: formData.dealName           ? 'complete' : 'incomplete' },
    { field: 'dealValue',          label: 'Deal Value',       status: formData.dealValue          ? 'complete' : 'incomplete' },
    { field: 'closeDate',          label: 'Close Date',       status: closeDateStatus,             note: closeDateNeedsReason ? 'Override reason required' : undefined },
    { field: 'dealType',           label: 'Deal Type',        status: formData.dealType           ? 'complete' : 'incomplete' },
    { field: 'stage',              label: 'Stage',            status: formData.stage              ? 'complete' : 'incomplete' },
    { field: 'accountName',        label: 'Account',          status: formData.accountName        ? 'complete' : 'incomplete' },
    { field: 'primaryContactName', label: 'Primary Contact',  status: formData.primaryContactName ? 'complete' : 'incomplete' },
    { field: 'owner',              label: 'Owner',            status: formData.owner              ? 'complete' : 'incomplete' },
    { field: 'source',             label: 'Source',           status: formData.source             ? 'complete' : 'incomplete' },
  ] as Array<{ field: string; label: string; status: 'complete'|'warning'|'incomplete'; note?: string }>;

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
              <div key={field.field} className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  {field.status === 'complete' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  ) : field.status === 'warning' ? (
                    <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                  )}
                  <span className={`text-sm ${
                    field.status === 'complete'  ? 'text-gray-900' :
                    field.status === 'warning'   ? 'text-amber-700 font-medium' :
                    'text-gray-500'
                  }`}>
                    {field.label}: {
                      field.status === 'complete'  ? 'Completed' :
                      field.status === 'warning'   ? 'Needs attention' :
                      'Required'
                    }
                  </span>
                </div>
                {field.note && (
                  <p className="text-xs text-amber-600 pl-6">{field.note}</p>
                )}
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
