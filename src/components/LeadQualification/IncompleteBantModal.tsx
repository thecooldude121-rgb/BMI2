import React from 'react';
import { X, AlertCircle, Edit, Save } from 'lucide-react';

interface IncompleteBantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteBant: (specificField?: string) => void;
  onSaveDraft: () => void;
  bantScore: number;
  missingFields: {
    budget: boolean;
    authority: boolean;
    need: boolean;
    timeline: boolean;
  };
}

const IncompleteBantModal: React.FC<IncompleteBantModalProps> = ({
  isOpen,
  onClose,
  onCompleteBant,
  onSaveDraft,
  bantScore,
  missingFields
}) => {
  if (!isOpen) return null;

  const missingCount = Object.values(missingFields).filter(Boolean).length;

  const getFirstMissingField = (): string => {
    if (missingFields.budget) return 'Budget';
    if (missingFields.authority) return 'Authority';
    if (missingFields.need) return 'Need';
    if (missingFields.timeline) return 'Timeline';
    return 'Budget';
  };

  const firstMissingField = getFirstMissingField();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              INCOMPLETE QUALIFICATION
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
              <div>
                <p className="font-medium text-gray-900 mb-1">
                  You haven't completed the BANT assessment.
                </p>
                <p className="text-sm text-gray-700">
                  Current BANT Score: <span className="font-bold text-red-500">{bantScore}/20 ❌</span>
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-900 mb-3">
              Missing ({missingCount}/4):
            </p>
            <div className="space-y-2">
              {missingFields.budget && (
                <div className="flex items-center gap-2 text-sm text-gray-700 bg-red-50 border border-red-200 rounded-lg p-3">
                  <span className="text-red-500">❌</span>
                  <span className="font-medium">Budget:</span>
                  <span>Not assessed (-5 points)</span>
                </div>
              )}
              {missingFields.authority && (
                <div className="flex items-center gap-2 text-sm text-gray-700 bg-red-50 border border-red-200 rounded-lg p-3">
                  <span className="text-red-500">❌</span>
                  <span className="font-medium">Authority:</span>
                  <span>Not assessed (-5 points)</span>
                </div>
              )}
              {missingFields.need && (
                <div className="flex items-center gap-2 text-sm text-gray-700 bg-red-50 border border-red-200 rounded-lg p-3">
                  <span className="text-red-500">❌</span>
                  <span className="font-medium">Need:</span>
                  <span>Not assessed (-5 points)</span>
                </div>
              )}
              {missingFields.timeline && (
                <div className="flex items-center gap-2 text-sm text-gray-700 bg-red-50 border border-red-200 rounded-lg p-3">
                  <span className="text-red-500">❌</span>
                  <span className="font-medium">Timeline:</span>
                  <span>Not assessed (-5 points)</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-lg">📊</span>
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Did you know?
                </p>
                <p className="text-sm text-gray-700">
                  Leads without BANT assessment have 40% lower conversion rates.
                  We recommend completing the assessment before qualifying.
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-900 mb-3">
              What would you like to do?
            </p>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 bg-gray-50 rounded-b-lg">
          <button
            onClick={() => onCompleteBant(firstMissingField)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Edit className="h-5 w-5" />
            Complete BANT Assessment
          </button>
          <button
            onClick={onSaveDraft}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            <Save className="h-5 w-5" />
            Save as Draft
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncompleteBantModal;
