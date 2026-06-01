import React from 'react';
import { AlertTriangle, Save, Trash2, X } from 'lucide-react';

interface DiscardChangesModalProps {
  isOpen: boolean;
  onSaveDraft: () => void;
  onDiscardChanges: () => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export default function DiscardChangesModal({
  isOpen,
  onSaveDraft,
  onDiscardChanges,
  onCancel,
  isSaving = false
}: DiscardChangesModalProps) {
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
              Discard Changes?
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              You have unsaved changes to your campaign.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-gray-700 mb-4">
            What would you like to do with your changes?
          </p>

          <div className="space-y-3">
            {/* Save Draft Option */}
            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Save className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Save Draft</p>
                <p className="text-xs text-gray-600 mt-0.5">
                  Your progress will be saved and you can continue later
                </p>
              </div>
            </div>

            {/* Discard Changes Option */}
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-4 h-4 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Discard Changes</p>
                <p className="text-xs text-gray-600 mt-0.5">
                  All changes will be permanently deleted
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 p-6 bg-gray-50 rounded-b-xl">
          {/* Primary Actions */}
          <div className="flex gap-3">
            <button
              onClick={onSaveDraft}
              disabled={isSaving}
              className="
                flex-1 px-4 py-3 bg-blue-600 border-2 border-blue-600
                text-white font-medium text-sm rounded-lg
                hover:bg-blue-700 transition-colors duration-200
                disabled:opacity-50 disabled:cursor-wait
                flex items-center justify-center gap-2
              "
              type="button"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
            </button>

            <button
              onClick={onDiscardChanges}
              disabled={isSaving}
              className="
                flex-1 px-4 py-3 bg-red-600 border-2 border-red-600
                text-white font-medium text-sm rounded-lg
                hover:bg-red-700 transition-colors duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
              "
              type="button"
            >
              <Trash2 className="w-4 h-4" />
              <span>Discard Changes</span>
            </button>
          </div>

          {/* Secondary Action */}
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="
              w-full px-4 py-2.5 border-2 border-gray-300
              text-gray-700 font-medium text-sm rounded-lg
              hover:bg-gray-100 transition-colors duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
