import React from 'react';
import { X } from 'lucide-react';

interface ProgressDetailPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  progress: {
    currentPoints: number;
    nextLevelPoints: number;
    remainingPoints: number;
    daysToNextLevel: number;
  };
  position?: { top: number; left: number };
}

const ProgressDetailPopover: React.FC<ProgressDetailPopoverProps> = ({
  isOpen,
  onClose,
  progress,
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
          <h4 className="text-lg font-bold text-gray-900">Level Progress</h4>
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
            <span className="text-sm font-semibold text-gray-900">
              {progress.currentPoints.toLocaleString()} points
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Next Level:</span>
            <span className="text-sm font-semibold text-gray-900">
              {progress.nextLevelPoints.toLocaleString()} points
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Remaining:</span>
            <span className="text-sm font-semibold" style={{ color: '#667eea' }}>
              {progress.remainingPoints.toLocaleString()} points
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 mb-4">
          <p className="text-sm text-gray-600 mb-2">At current pace:</p>
          <p className="text-sm font-semibold text-gray-900">
            • {progress.daysToNextLevel} days to Diamond
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

export default ProgressDetailPopover;
