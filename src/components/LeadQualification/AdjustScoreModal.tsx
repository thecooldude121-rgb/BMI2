import React, { useState } from 'react';
import { X, Settings, AlertCircle } from 'lucide-react';

interface AdjustScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScore: number;
  onSave: (newScore: number, reason: string) => void;
}

const AdjustScoreModal: React.FC<AdjustScoreModalProps> = ({
  isOpen,
  onClose,
  currentScore,
  onSave
}) => {
  const [newScore, setNewScore] = useState(currentScore);
  const [reason, setReason] = useState('');
  const [showWarning, setShowWarning] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!reason.trim()) {
      setShowWarning(true);
      return;
    }
    onSave(newScore, reason);
    onClose();
  };

  const handleCancel = () => {
    setNewScore(currentScore);
    setReason('');
    setShowWarning(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              ADJUST AI SCORE MANUALLY
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
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <strong>Current Score:</strong> {currentScore}/100
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Manual adjustments will override the AI score. This is useful when you have additional context or insights not captured by the AI.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              New Score: {newScore}/100
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={newScore}
              onChange={(e) => setNewScore(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Adjustment: <span className="text-red-600">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setShowWarning(false);
              }}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                showWarning ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Explain why you're adjusting the score..."
            />
            {showWarning && (
              <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span>Please provide a reason for the adjustment</span>
              </div>
            )}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-1">Important:</p>
                <p>Manual adjustments will be recorded in the qualification history and visible to all team members.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 bg-gray-50 rounded-b-lg">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Save Score
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

export default AdjustScoreModal;
