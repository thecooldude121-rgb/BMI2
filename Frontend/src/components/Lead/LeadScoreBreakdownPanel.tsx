import React from 'react';
import { TrendingUp, TrendingDown, Minus, Info, Zap, Target, Flag } from 'lucide-react';
import { LeadScoreBreakdown, ScoreComponent } from '../../types/leadScoring';

interface LeadScoreBreakdownPanelProps {
  breakdown: LeadScoreBreakdown;
}

const LeadScoreBreakdownPanel: React.FC<LeadScoreBreakdownPanelProps> = ({ breakdown }) => {
  const getTrendIcon = () => {
    if (breakdown.trend === 'up') return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (breakdown.trend === 'down') return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = () => {
    if (breakdown.trend === 'up') return 'text-green-600';
    if (breakdown.trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  const renderScoreComponent = (component: ScoreComponent, icon: React.ReactNode, color: string) => {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-lg ${color === 'blue' ? 'bg-blue-100' : color === 'green' ? 'bg-green-100' : 'bg-purple-100'}`}>
              {icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{component.name} Score</h3>
              <p className="text-xs text-gray-600">{component.value} / {component.maxValue} points</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{component.value}</div>
            <div className="text-xs text-gray-600">{component.percentage}%</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                color === 'blue' ? 'bg-blue-600' : color === 'green' ? 'bg-green-600' : 'bg-purple-600'
              }`}
              style={{ width: `${component.percentage}%` }}
            ></div>
          </div>
        </div>

        {/* Factors */}
        <div className="space-y-2">
          {component.factors.map((factor, idx) => (
            <div key={idx} className="group relative">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700 flex items-center">
                  {factor.label}
                  <Info className="h-3 w-3 ml-1 text-gray-400" />
                </span>
                <span className="font-semibold text-gray-900">{factor.value.toFixed(1)} pts</span>
              </div>
              {/* Tooltip */}
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10">
                <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 whitespace-nowrap">
                  {factor.description}
                  <div className="absolute top-full left-4 w-2 h-2 bg-gray-900 transform rotate-45 -mt-1"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Total Score */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-1">Lead Score</h2>
            <p className="text-blue-100 text-sm">Last updated: {new Date(breakdown.lastUpdated).toLocaleString()}</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold">{breakdown.totalScore}</div>
            <div className="text-sm mt-1">/ 100 points</div>
          </div>
        </div>

        {/* Change Indicator */}
        <div className="mt-4 pt-4 border-t border-blue-500 flex items-center justify-between">
          <span className="text-sm text-blue-100">Change from last week</span>
          <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="font-semibold">
              {breakdown.changeAmount > 0 ? '+' : ''}{breakdown.changeAmount} points
            </span>
          </div>
        </div>
      </div>

      {/* Score Components */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {renderScoreComponent(
          breakdown.engagementScore,
          <Zap className="h-5 w-5 text-blue-600" />,
          'blue'
        )}
        {renderScoreComponent(
          breakdown.fitScore,
          <Target className="h-5 w-5 text-green-600" />,
          'green'
        )}
        {renderScoreComponent(
          breakdown.intentScore,
          <Flag className="h-5 w-5 text-purple-600" />,
          'purple'
        )}
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Score Components Explained</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-700">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-3 h-3 bg-blue-600 rounded"></div>
              <span className="font-semibold">Engagement (0-30)</span>
            </div>
            <p>Email opens, clicks, replies, website visits</p>
          </div>
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-3 h-3 bg-green-600 rounded"></div>
              <span className="font-semibold">Fit (0-40)</span>
            </div>
            <p>Company size, industry, seniority, budget</p>
          </div>
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-3 h-3 bg-purple-600 rounded"></div>
              <span className="font-semibold">Intent (0-30)</span>
            </div>
            <p>Downloads, demos, pricing views, visits</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadScoreBreakdownPanel;