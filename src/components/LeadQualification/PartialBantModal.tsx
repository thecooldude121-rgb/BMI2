import React from 'react';
import { X, AlertCircle, CheckCircle, Edit, Save } from 'lucide-react';

interface BantField {
  name: string;
  label: string;
  completed: boolean;
  score: number;
  maxScore: number;
  displayValue?: string;
}

interface PartialBantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQualifyAnyway: () => void;
  onCompleteBant: (specificField?: string) => void;
  onSaveDraft: () => void;
  bantScore: number;
  maxScore: number;
  completedFields: BantField[];
  missingFields: BantField[];
}

const PartialBantModal: React.FC<PartialBantModalProps> = ({
  isOpen,
  onClose,
  onQualifyAnyway,
  onCompleteBant,
  onSaveDraft,
  bantScore,
  maxScore,
  completedFields,
  missingFields
}) => {
  if (!isOpen) return null;

  const percentage = Math.round((bantScore / maxScore) * 100);
  const missingFieldNames = missingFields.map(f => f.label).join(', ');
  const primaryMissingField = missingFields[0]?.label || 'missing fields';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              PARTIAL BANT ASSESSMENT
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-gray-900 mb-1">
                  Your BANT assessment is incomplete.
                </p>
                <div className="mt-2">
                  <p className="text-sm text-gray-700 mb-2">
                    Current BANT Score: <span className="font-bold text-yellow-600">{bantScore}/{maxScore}</span> ({percentage}%)
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {completedFields.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-900 mb-3">
                Completed ({completedFields.length}/4):
              </p>
              <div className="space-y-2">
                {completedFields.map((field) => (
                  <div
                    key={field.name}
                    className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-gray-900">{field.label}:</span>
                        {field.displayValue && (
                          <span className="text-sm text-gray-700 ml-1">
                            {field.displayValue}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-green-600">
                      +{field.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {missingFields.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-900 mb-3">
                Missing ({missingFields.length}/4):
              </p>
              <div className="space-y-2">
                {missingFields.map((field) => (
                  <div
                    key={field.name}
                    className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-red-500 flex-shrink-0">❌</span>
                      <span className="font-medium text-gray-900">{field.label}:</span>
                      <span className="text-sm text-gray-600">Not assessed</span>
                    </div>
                    <span className="text-sm font-semibold text-red-500">
                      -{field.maxScore} points
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-lg">💡</span>
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Recommendation
                </p>
                <p className="text-sm text-gray-700">
                  Complete {primaryMissingField} assessment to improve qualification accuracy.
                  {bantScore < 15 && (
                    <> Leads with BANT scores below 15 have 30% lower conversion rates.</>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-900 mb-3">
              Do you want to:
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 rounded-b-lg space-y-2">
          <div className="flex gap-3">
            <button
              onClick={onQualifyAnyway}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              <CheckCircle className="h-5 w-5" />
              Qualify Anyway ({bantScore}/{maxScore})
            </button>
            <button
              onClick={() => onCompleteBant(primaryMissingField)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Edit className="h-5 w-5" />
              Complete {primaryMissingField}
            </button>
          </div>
          <button
            onClick={onSaveDraft}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            <Save className="h-5 w-5" />
            Save as Draft
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartialBantModal;
