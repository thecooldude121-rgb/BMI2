import React from 'react';
import { useNavigate } from 'react-router-dom';

interface PointsDetailTooltipProps {
  isOpen: boolean;
  onClose: () => void;
  points: number;
  activityType: string;
  totalPoints: number;
  rank: number;
  position: { top: number; left: number };
}

const PointsDetailTooltip: React.FC<PointsDetailTooltipProps> = ({
  isOpen,
  onClose,
  points,
  activityType,
  totalPoints,
  rank,
  position
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="absolute bg-white rounded-lg shadow-2xl border border-gray-200 p-4 z-50"
        style={{
          top: position.top,
          left: position.left,
          transform: 'translateX(-50%)',
          marginTop: '8px',
          width: '280px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
        }}
      >
        <h4 className="text-sm font-bold text-gray-900 mb-3">Points Earned</h4>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{activityType} logged:</span>
            <span className="text-sm font-semibold" style={{ color: '#667eea' }}>
              +{points} pts
            </span>
          </div>
          <div className="h-px bg-gray-200" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Your total:</span>
            <span className="text-sm font-semibold text-gray-900">
              {totalPoints.toLocaleString()} points
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Rank:</span>
            <span className="text-sm font-semibold text-gray-900">#{rank}</span>
          </div>
        </div>

        <button
          onClick={() => {
            onClose();
            navigate('/crm/gamification/leaderboard');
          }}
          className="w-full py-2 px-4 rounded-lg text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: '#667eea' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5568d3'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#667eea'}
        >
          View Leaderboard
        </button>
      </div>
    </>
  );
};

export default PointsDetailTooltip;
