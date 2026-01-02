import React from 'react';
import { X } from 'lucide-react';

interface ChallengeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: {
    icon: string;
    name: string;
    description: string;
    current: number;
    target: number;
    progress: number;
    calls: Array<{ time: string; contact: string }>;
    reward: number;
    timeRemaining: string;
  };
}

const ChallengeDetailModal: React.FC<ChallengeDetailModalProps> = ({
  isOpen,
  onClose,
  challenge
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center">
            <span className="text-2xl mr-3">{challenge.icon}</span>
            <h3 className="text-xl font-bold text-gray-900">Daily Dialer</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-lg font-semibold text-gray-900 mb-4">{challenge.description}</p>

          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Your Progress: {challenge.current} / {challenge.target} ({challenge.progress}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all duration-500"
                style={{
                  width: `${challenge.progress}%`,
                  backgroundColor: '#667eea'
                }}
              />
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">Calls logged today:</p>
            <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              <div className="space-y-2">
                {challenge.calls.map((call, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-700">
                    <span className="text-gray-500 mr-3">{call.time}</span>
                    <span className="font-medium">{call.contact}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Reward:</p>
              <p className="text-xl font-bold text-green-600">+{challenge.reward} points</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Time left:</p>
              <p className="text-xl font-bold text-orange-600">{challenge.timeRemaining}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                onClose();
                window.location.href = '/crm/activities/call/new';
              }}
              className="flex-1 py-3 px-4 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: '#667eea' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5568d3'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#667eea'}
            >
              Log Call
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeDetailModal;
