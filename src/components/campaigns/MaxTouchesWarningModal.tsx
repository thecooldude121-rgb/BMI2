import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface MaxTouchesWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MaxTouchesWarningModal: React.FC<MaxTouchesWarningModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Maximum Touches Reached
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              You've reached the maximum limit of 10 touches per campaign. To add more touches, please remove an existing touch first.
            </p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
              !
            </div>
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Why this limit?</p>
              <p className="text-amber-700">
                Campaigns with more than 10 touches typically have diminishing returns and may appear overly aggressive to prospects.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            OK, Got It
          </button>
        </div>
      </div>
    </div>
  );
};
