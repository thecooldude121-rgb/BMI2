import React from 'react';
import { Clock, Activity } from 'lucide-react';

interface LastInteractionBarProps {
  lastInteractionDate: string;
  daysAgo: number;
  engagementScore: number;
}

const LastInteractionBar: React.FC<LastInteractionBarProps> = ({
  lastInteractionDate,
  daysAgo,
  engagementScore
}) => {
  const getEngagementColor = (score: number) => {
    if (score >= 80) return 'text-green-700';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-4 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Last Interaction:</p>
              <p className="text-sm text-gray-700">
                {lastInteractionDate} <span className="text-gray-600">({daysAgo} {daysAgo === 1 ? 'day' : 'days'} ago)</span>
              </p>
            </div>
          </div>

          <div className="h-8 w-px bg-gray-300" />

          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Engagement Score:</p>
              <p className={`text-lg font-bold ${getEngagementColor(engagementScore)}`}>
                {engagementScore}/100
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="w-32 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                engagementScore >= 80
                  ? 'bg-green-600'
                  : engagementScore >= 60
                  ? 'bg-blue-600'
                  : engagementScore >= 40
                  ? 'bg-yellow-600'
                  : 'bg-red-600'
              }`}
              style={{ width: `${engagementScore}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-700">
            {engagementScore >= 80 ? 'Excellent' : engagementScore >= 60 ? 'Good' : engagementScore >= 40 ? 'Fair' : 'Poor'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LastInteractionBar;
