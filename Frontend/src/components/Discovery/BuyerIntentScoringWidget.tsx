import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, TrendingDown, Minus, Activity, Zap } from 'lucide-react';
import { buyerIntentService } from '../../services/dataIntelligenceService';
import type { BuyerIntentBreakdown, TrendDirection } from '../../types/dataIntelligence';

interface BuyerIntentScoringWidgetProps {
  prospectId: string;
  onScoreChange?: (score: number) => void;
}

const BuyerIntentScoringWidget: React.FC<BuyerIntentScoringWidgetProps> = ({
  prospectId,
  onScoreChange
}) => {
  const [intentData, setIntentData] = useState<BuyerIntentBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    loadIntentData();
  }, [prospectId]);

  const loadIntentData = async () => {
    setLoading(true);
    try {
      const data = await buyerIntentService.getBuyerIntentBreakdown(prospectId);
      setIntentData(data);
      if (data) {
        onScoreChange?.(data.composite_score);
      }
    } catch (error) {
      console.error('Error loading buyer intent:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await buyerIntentService.calculateBuyerIntent(prospectId);
      await loadIntentData();
    } catch (error) {
      console.error('Error recalculating intent:', error);
    } finally {
      setRecalculating(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'from-red-500 to-orange-600';
    if (score >= 60) return 'from-orange-500 to-yellow-600';
    if (score >= 40) return 'from-yellow-500 to-green-500';
    return 'from-gray-400 to-gray-500';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Very High';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    if (score >= 20) return 'Low';
    return 'Very Low';
  };

  const getTrendIcon = (trend: TrendDirection) => {
    if (trend === 'increasing') return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === 'decreasing') return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = (trend: TrendDirection): string => {
    if (trend === 'increasing') return 'text-green-600 bg-green-50';
    if (trend === 'decreasing') return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getComponentColor = (score: number): string => {
    if (score >= 80) return 'bg-red-500';
    if (score >= 60) return 'bg-orange-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-40 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!intentData) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="text-center py-8">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">No intent data available</p>
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {recalculating ? 'Calculating...' : 'Calculate Intent Score'}
          </button>
        </div>
      </div>
    );
  }

  const components = [
    { name: 'Engagement', value: intentData.components.engagement, icon: '💬' },
    { name: 'Fit', value: intentData.components.fit, icon: '🎯' },
    { name: 'Timing', value: intentData.components.timing, icon: '⏰' },
    { name: 'Authority', value: intentData.components.authority, icon: '👔' }
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 bg-gradient-to-r ${getScoreColor(intentData.composite_score)} rounded-lg`}>
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Buyer Intent Score</h3>
              <p className="text-sm text-gray-600">AI-powered purchase readiness</p>
            </div>
          </div>
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <Activity className="h-4 w-4 mr-2" />
            {recalculating ? 'Recalculating...' : 'Recalculate'}
          </button>
        </div>

        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <svg className="transform -rotate-90" width="200" height="200">
              <circle
                cx="100"
                cy="100"
                r="80"
                stroke="#e5e7eb"
                strokeWidth="16"
                fill="none"
              />
              <circle
                cx="100"
                cy="100"
                r="80"
                stroke="url(#gradient)"
                strokeWidth="16"
                fill="none"
                strokeDasharray={`${(intentData.composite_score / 100) * 502.4} 502.4`}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" className="text-blue-500" style={{ stopColor: 'currentColor' }} />
                  <stop offset="100%" className="text-purple-600" style={{ stopColor: 'currentColor' }} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-5xl font-bold text-gray-900">{intentData.composite_score}</div>
              <div className="text-sm font-medium text-gray-600">{getScoreLabel(intentData.composite_score)}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-2">
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${getTrendColor(intentData.trend)}`}>
            {getTrendIcon(intentData.trend)}
            <span className="ml-1.5 capitalize">{intentData.trend}</span>
          </span>
          {intentData.velocity !== 0 && (
            <span className="text-sm text-gray-600">
              {intentData.velocity > 0 ? '+' : ''}{intentData.velocity.toFixed(1)} pts/day
            </span>
          )}
        </div>
      </div>

      <div className="p-6 border-b border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Score Components</h4>
        <div className="space-y-4">
          {components.map((component) => (
            <div key={component.name}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{component.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{component.name}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{component.value}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getComponentColor(component.value)} transition-all duration-500`}
                  style={{ width: `${component.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {intentData.score_history.length > 0 && (
        <div className="p-6 bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <TrendingUp className="h-4 w-4 mr-2 text-blue-600" />
            Score History
          </h4>
          <div className="flex items-end space-x-2 h-24">
            {intentData.score_history.slice(-10).map((entry, idx) => {
              const height = (entry.score / 100) * 100;
              return (
                <div
                  key={idx}
                  className="flex-1 bg-gradient-to-t from-blue-500 to-purple-600 rounded-t hover:opacity-80 transition-opacity"
                  style={{ height: `${height}%` }}
                  title={`${entry.score} - ${new Date(entry.date).toLocaleDateString()}`}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>
              {intentData.score_history.length > 0
                ? new Date(intentData.score_history[0].date).toLocaleDateString()
                : 'Start'}
            </span>
            <span>Today</span>
          </div>
        </div>
      )}

      <div className="p-4 bg-blue-50 border-t border-blue-100">
        <div className="flex items-start space-x-2">
          <div className="p-1.5 bg-blue-100 rounded">
            <Target className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <h5 className="text-sm font-semibold text-blue-900 mb-1">Next Best Action</h5>
            <p className="text-xs text-blue-700">
              {intentData.composite_score >= 80
                ? 'High intent detected! Schedule a demo or product walkthrough immediately.'
                : intentData.composite_score >= 60
                ? 'Strong interest shown. Send personalized case studies and schedule a call.'
                : intentData.composite_score >= 40
                ? 'Moderate intent. Continue nurturing with targeted content and follow-ups.'
                : 'Low intent. Focus on educational content and build awareness.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerIntentScoringWidget;
