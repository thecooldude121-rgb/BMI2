import React from 'react';
import { AlertTriangle, Save, LogOut, X } from 'lucide-react';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onSaveAndExit: () => void;
  onExitWithoutSaving: () => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export default function UnsavedChangesModal({
  isOpen,
  onSaveAndExit,
  onExitWithoutSaving,
  onCancel,
  isSaving = false
}: UnsavedChangesModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-4 p-6 border-b border-gray-200">
          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              Unsaved Changes
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              You have unsaved changes that will be lost if you leave this page.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-gray-700">
            Would you like to save your draft before leaving?
          </p>
          <ul className="mt-4 space-y-2 text-xs text-gray-600">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
              <span><strong>Save Draft:</strong> Your progress will be saved and you can continue later</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              <span><strong>Exit Without Saving:</strong> All changes will be permanently lost</span>
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-6 bg-gray-50 rounded-b-xl">
          <button
            onClick={onExitWithoutSaving}
            disabled={isSaving}
            className="
              flex-1 px-4 py-2.5 border-2 border-gray-300
              text-gray-700 font-medium text-sm rounded-lg
              hover:bg-gray-100 transition-colors duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            type="button"
          >
            <span className="flex items-center justify-center gap-2">
              <LogOut className="w-4 h-4" />
              Exit Without Saving
            </span>
          </button>

          <button
            onClick={onCancel}
            disabled={isSaving}
            className="
              px-4 py-2.5 border-2 border-gray-300
              text-gray-700 font-medium text-sm rounded-lg
              hover:bg-gray-100 transition-colors duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            type="button"
          >
            Cancel
          </button>

          <button
            onClick={onSaveAndExit}
            disabled={isSaving}
            className="
              flex-1 px-4 py-2.5 bg-blue-600 border-2 border-blue-600
              text-white font-medium text-sm rounded-lg
              hover:bg-blue-700 transition-colors duration-200
              disabled:opacity-50 disabled:cursor-wait
            "
            type="button"
          >
            <span className="flex items-center justify-center gap-2">
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save & Exit'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
