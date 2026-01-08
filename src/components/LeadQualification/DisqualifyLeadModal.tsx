import React, { useState } from 'react';
import { X, XCircle, AlertCircle } from 'lucide-react';

interface DisqualifyLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, sendNotification: boolean) => void;
  lead: {
    name: string;
    company: string;
  };
}

const DisqualifyLeadModal: React.FC<DisqualifyLeadModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  lead
}) => {
  const [reason, setReason] = useState('');
  const [sendNotification, setSendNotification] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!reason.trim()) {
      setShowWarning(true);
      return;
    }
    onConfirm(reason, sendNotification);
    setReason('');
    setSendNotification(false);
    setShowWarning(false);
  };

  const handleCancel = () => {
    setReason('');
    setSendNotification(false);
    setShowWarning(false);
    onClose();
  };

  const commonReasons = [
    'No budget',
    'Not a decision maker',
    'No immediate need',
    'Wrong company size/industry',
    'Already using competitor',
    'Project on hold/delayed',
    'Unresponsive'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              DISQUALIFY LEAD
            </h3>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900 mb-1">
                  You are about to disqualify this lead
                </p>
                <p className="text-sm text-gray-700">
                  <strong>{lead.name}</strong> from <strong>{lead.company}</strong>
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Select Reason:
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {commonReasons.map((commonReason) => (
                <button
                  key={commonReason}
                  onClick={() => {
                    setReason(commonReason);
                    setShowWarning(false);
                  }}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {commonReason}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Disqualification Reason: <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setShowWarning(false);
              }}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                showWarning ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Provide detailed reason for disqualification..."
            />
            {showWarning && (
              <div className="flex items-center gap-2 mt-2 text-sm text-red-500">
                <AlertCircle className="h-4 w-4" />
                <span>Please provide a disqualification reason</span>
              </div>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sendNotification}
                onChange={(e) => setSendNotification(e.target.checked)}
                className="h-4 w-4 text-red-500 rounded"
              />
              <span className="text-sm text-gray-700">
                Send notification to lead owner
              </span>
            </label>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">
              This lead will be moved to the "Disqualified" list and can be re-activated later if needed.
            </p>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 bg-gray-50 rounded-b-lg">
          <button
            onClick={handleConfirm}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            <XCircle className="h-5 w-5" />
            Disqualify Lead
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisqualifyLeadModal;
