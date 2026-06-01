import React from 'react';
import { X } from 'lucide-react';

interface StreakPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  streak: {
    current: number;
    longest: number;
    nextMilestone: {
      days: number;
      points: number;
      daysRemaining: number;
    };
  };
  position?: { top: number; left: number };
}

const StreakPopover: React.FC<StreakPopoverProps> = ({
  isOpen,
  onClose,
  streak,
  position
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="absolute bg-white rounded-lg shadow-2xl border border-gray-200 p-5 z-50"
        style={{
          top: position?.top || '100%',
          left: position?.left || '50%',
          transform: 'translateX(-50%)',
          marginTop: '8px',
          width: '300px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <span className="text-2xl mr-2">🔥</span>
            <h4 className="text-lg font-bold text-gray-900">{streak.current}-Day Streak!</h4>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Current:</span>
            <span className="text-sm font-semibold text-gray-900">{streak.current} days</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Longest:</span>
            <span className="text-sm font-semibold text-gray-900">{streak.longest} days</span>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Next milestone:</p>
          <p className="text-sm text-gray-900 mb-1">
            {streak.nextMilestone.days}-day streak (+{streak.nextMilestone.points} pts)
          </p>
          <p className="text-sm font-semibold" style={{ color: '#667eea' }}>
            {streak.nextMilestone.daysRemaining} days to go!
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 px-4 rounded-lg text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: '#667eea' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5568d3'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#667eea'}
        >
          Close
        </button>
      </div>
    </>
  );
};

export default StreakPopover;
