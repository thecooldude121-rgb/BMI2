import React from 'react';
import { X } from 'lucide-react';

interface LevelInfoPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  level: {
    number: number;
    name: string;
    minPoints: number;
    maxPoints: number;
    perks: string[];
    nextLevel: {
      name: string;
      points: number;
    };
  };
  position?: { top: number; left: number };
}

const LevelInfoPopover: React.FC<LevelInfoPopoverProps> = ({
  isOpen,
  onClose,
  level,
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
          width: '320px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <span className="text-2xl mr-2">💎</span>
            <h4 className="text-lg font-bold text-gray-900">
              Level {level.number}: {level.name}
            </h4>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Requirements:</p>
          <p className="text-sm text-gray-600">
            • {level.minPoints.toLocaleString()} - {level.maxPoints.toLocaleString()} points
          </p>
        </div>

        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Perks:</p>
          <ul className="space-y-1">
            {level.perks.map((perk, index) => (
              <li key={index} className="text-sm text-gray-600">
                • {perk}
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm font-semibold text-gray-900">
            Next: {level.nextLevel.name} ({level.nextLevel.points.toLocaleString()} pts)
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-2 px-4 rounded-lg text-sm font-medium text-white transition-colors"
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

export default LevelInfoPopover;
