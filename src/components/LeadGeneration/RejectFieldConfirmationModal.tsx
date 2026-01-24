import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface RejectFieldConfirmationModalProps {
  fieldName: string;
  fieldIcon: string;
  currentValue: string;
  previousValue: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function RejectFieldConfirmationModal({
  fieldName,
  fieldIcon,
  currentValue,
  previousValue,
  isOpen,
  onClose,
  onConfirm
}: RejectFieldConfirmationModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Reject Enrichment?
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-6 py-4">
          <p className="text-gray-700 mb-4">
            This will revert the field to its previous value.
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Field:</span>
              <span className="font-medium text-gray-900">
                {fieldIcon} {fieldName}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2 text-sm">
                <span className="text-gray-600 min-w-[80px]">Current:</span>
                <span className="text-gray-900 font-mono text-xs bg-white border border-gray-200 rounded px-2 py-1 flex-1">
                  {currentValue || <span className="text-gray-400 italic">Empty</span>}
                </span>
              </div>

              <div className="flex items-center justify-center">
                <div className="text-orange-600">↓</div>
              </div>

              <div className="flex items-start gap-2 text-sm">
                <span className="text-gray-600 min-w-[80px]">Will revert to:</span>
                <span className="text-gray-900 font-mono text-xs bg-white border border-green-200 rounded px-2 py-1 flex-1">
                  {previousValue || <span className="text-gray-400 italic">Empty</span>}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-orange-800">
                <p className="font-medium mb-1">What will happen:</p>
                <ul className="list-disc list-inside space-y-0.5 ml-1">
                  <li>Field value will be reverted</li>
                  <li>Rejection will be recorded in history</li>
                  <li>Verified status will be removed</li>
                  <li>Field can be re-enriched later</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Reject Enrichment
          </button>
        </div>
      </div>
    </div>
  );
}
