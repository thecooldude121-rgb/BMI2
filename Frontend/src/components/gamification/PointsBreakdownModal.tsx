import React from 'react';
import { X } from 'lucide-react';

interface PointsBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  breakdown: {
    dealsClosedPoints: number;
    activitiesPoints: number;
    challengesPoints: number;
    bonusPoints: number;
    total: number;
  };
}

const PointsBreakdownModal: React.FC<PointsBreakdownModalProps> = ({
  isOpen,
  onClose,
  breakdown
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Points Breakdown</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm font-semibold text-gray-700 mb-4">This Quarter:</p>

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-700">Deals Closed:</span>
              <span className="font-semibold text-gray-900">{breakdown.dealsClosedPoints.toLocaleString()} pts</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-700">Activities:</span>
              <span className="font-semibold text-gray-900">{breakdown.activitiesPoints.toLocaleString()} pts</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-700">Challenges:</span>
              <span className="font-semibold text-gray-900">{breakdown.challengesPoints.toLocaleString()} pts</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-700">Bonuses:</span>
              <span className="font-semibold text-gray-900">{breakdown.bonusPoints.toLocaleString()} pts</span>
            </div>
          </div>

          <div className="flex items-center justify-between py-4 bg-purple-50 rounded-lg px-4 mb-6">
            <span className="text-lg font-bold text-gray-900">TOTAL:</span>
            <span className="text-2xl font-bold" style={{ color: '#667eea' }}>
              {breakdown.total.toLocaleString()} points
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                onClose();
                window.location.href = '/crm/gamification/history';
              }}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              View History
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: '#667eea' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5568d3'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#667eea'}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PointsBreakdownModal;
