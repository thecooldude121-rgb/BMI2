import React from 'react';
import { X, AlertCircle } from 'lucide-react';

interface NoSeatsAvailableModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  totalSeats: number;
  usedSeats: number;
  onDeactivateUser: () => void;
  onUpgradePlan: () => void;
}

export default function NoSeatsAvailableModal({
  isOpen,
  onClose,
  planName,
  totalSeats,
  usedSeats,
  onDeactivateUser,
  onUpgradePlan
}: NoSeatsAvailableModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block w-full max-w-lg my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">No Available Seats</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {/* Warning Icon and Message */}
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  You've reached your plan limit
                </h3>
                <p className="text-gray-600">
                  Your <span className="font-medium">{planName}</span> includes{' '}
                  <span className="font-medium">{totalSeats} seats</span>, and all{' '}
                  <span className="font-medium">{usedSeats}</span> are currently in use.
                </p>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-900">
                To add more team members, you can:
              </p>

              <div className="space-y-3">
                {/* Option 1: Deactivate User */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        1. Deactivate an existing user to free a seat
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Mark an inactive user as deactivated
                      </p>
                    </div>
                  </div>
                </div>

                {/* Option 2: Upgrade Plan */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        2. Upgrade to Business Plan (15 seats)
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Get 10 additional seats + advanced features
                      </p>
                      <p className="text-sm font-semibold text-blue-600 mt-2">
                        $299/month
                      </p>
                    </div>
                  </div>
                </div>

                {/* Option 3: Add Individual Seats */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        3. Add individual seats
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Purchase additional seats as needed
                      </p>
                      <p className="text-sm font-semibold text-gray-900 mt-2">
                        $49/month per additional seat
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onDeactivateUser}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Deactivate User
            </button>
            <button
              type="button"
              onClick={onUpgradePlan}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Upgrade Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
