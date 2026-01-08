import React from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

interface QualifyLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  lead: {
    name: string;
    company: string;
  };
  aiScore: number;
  bantScore: number;
  assignedTo: string;
  hasIncompleteBANT?: boolean;
}

const QualifyLeadModal: React.FC<QualifyLeadModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  lead,
  aiScore,
  bantScore,
  assignedTo,
  hasIncompleteBANT = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            CONFIRM QUALIFICATION
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {hasIncompleteBANT && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 mb-1">
                    Warning: Incomplete BANT Assessment
                  </p>
                  <p className="text-sm text-gray-700">
                    Some BANT fields are not fully completed. It's recommended to complete the assessment before qualifying.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <p className="text-gray-700 mb-4">
              You're about to qualify this lead:
            </p>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Lead:</span>
                <span className="text-sm font-medium text-gray-900">
                  {lead.name} ({lead.company})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">AI Score:</span>
                <span className="text-sm font-medium text-gray-900">
                  {aiScore}/100
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">BANT Score:</span>
                <span className="text-sm font-medium text-gray-900">
                  {bantScore}/20
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Assigned to:</span>
                <span className="text-sm font-medium text-gray-900">
                  {assignedTo}
                </span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-900 mb-3">
              This will:
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                Mark lead as "Qualified"
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                Sync to CRM immediately
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                Create CRM opportunity
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                Notify assigned sales rep
              </li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 bg-gray-50 rounded-b-lg">
          <button
            onClick={onConfirm}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            <CheckCircle className="h-5 w-5" />
            Confirm & Sync
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default QualifyLeadModal;
