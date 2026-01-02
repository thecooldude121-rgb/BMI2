import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Star, Target, AlertCircle } from 'lucide-react';

interface AIAccountInsightsPanelProps {
  accountId: string;
  accountName: string;
  healthScore?: number;
  engagementScore?: number;
  dealPotentialScore?: number;
  relationshipScore?: number;
  companyHealthScore?: number;
  hasHRMSConnection?: boolean;
  pipelineValue?: number;
  dealCount?: number;
}

const AIAccountInsightsPanel: React.FC<AIAccountInsightsPanelProps> = ({
  accountName,
  healthScore = 92,
  engagementScore = 95,
  dealPotentialScore = 90,
  relationshipScore = 95,
  companyHealthScore = 88,
  hasHRMSConnection = false,
  pipelineValue = 60000,
  dealCount = 2
}) => {
  const getScoreStars = (score: number) => {
    const stars = Math.round(score / 20);
    return stars;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Target className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">AI Account Insights</h3>
        </div>

        {/* Overall Health Score */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Account Health Score</span>
            <span className={`text-2xl font-bold ${getScoreColor(healthScore)}`}>
              {healthScore}/100
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div
              className={`h-3 rounded-full ${getScoreBarColor(healthScore)}`}
              style={{ width: `${healthScore}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < getScoreStars(healthScore)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-gray-700">
              {healthScore >= 90 ? 'Excellent' : healthScore >= 70 ? 'Very Good' : healthScore >= 50 ? 'Good' : 'Needs Attention'}
            </span>
          </div>

          <div className="mt-2 flex items-center space-x-2">
            <span className="text-xs text-gray-500">Rating:</span>
            <span className="text-sm font-medium text-green-600">
              {getScoreStars(healthScore)} stars
            </span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-sm font-medium text-green-600">Status: Active</span>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="border-t border-gray-200 pt-4 mb-6">
          <h4 className="text-sm font-bold text-gray-900 mb-4">Score Breakdown</h4>

          <div className="space-y-4">
            {/* Engagement */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700">Engagement</span>
                <span className={`text-sm font-bold ${getScoreColor(engagementScore)}`}>
                  {engagementScore}/100
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getScoreBarColor(engagementScore)}`}
                      style={{ width: `${engagementScore}%` }}
                    />
                  </div>
                </div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < getScoreStars(engagementScore)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Multiple meetings, high response rate
              </p>
            </div>

            {/* Deal Potential */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700">Deal Potential</span>
                <span className={`text-sm font-bold ${getScoreColor(dealPotentialScore)}`}>
                  {dealPotentialScore}/100
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getScoreBarColor(dealPotentialScore)}`}
                      style={{ width: `${dealPotentialScore}%` }}
                    />
                  </div>
                </div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < getScoreStars(dealPotentialScore)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {dealCount} active deals, {formatCurrency(pipelineValue)} pipeline
              </p>
            </div>

            {/* Relationship Strength */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700">Relationship Strength</span>
                <span className={`text-sm font-bold ${getScoreColor(relationshipScore)}`}>
                  {relationshipScore}/100
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getScoreBarColor(relationshipScore)}`}
                      style={{ width: `${relationshipScore}%` }}
                    />
                  </div>
                </div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < getScoreStars(relationshipScore)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {hasHRMSConnection ? 'HRMS connection = Major advantage!' : 'Strong relationship with key contacts'}
              </p>
            </div>

            {/* Company Health */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700">Company Health</span>
                <span className={`text-sm font-bold ${getScoreColor(companyHealthScore)}`}>
                  {companyHealthScore}/100
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getScoreBarColor(companyHealthScore)}`}
                      style={{ width: `${companyHealthScore}%` }}
                    />
                  </div>
                </div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < getScoreStars(companyHealthScore)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Growing fast, well-funded
              </p>
            </div>
          </div>
        </div>

        {/* Predictions */}
        <div className="border-t border-gray-200 pt-4 mb-6">
          <h4 className="text-sm font-bold text-gray-900 mb-4">Predictions</h4>

          <div className="space-y-4">
            {/* Revenue Forecast */}
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900">Revenue Forecast</p>
                  <p className="text-sm text-blue-800 mt-1">
                    Expected: {formatCurrency(pipelineValue)} this year ({dealCount} deals)
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Confidence: 67% (high probability)
                  </p>
                </div>
              </div>
            </div>

            {/* Upsell Opportunity */}
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <Target className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-900">Upsell Opportunity: High</p>
                  <p className="text-sm text-green-800 mt-1">
                    Potential: +$35K in Q1 2026
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Products: Advanced modules, Enterprise features
                  </p>
                </div>
              </div>
            </div>

            {/* Churn Risk */}
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-900">Churn Risk: Low (5%)</p>
                  <p className="text-xs text-green-700 mt-1">
                    Why: Strong relationship, growing company
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-bold text-gray-900 mb-4">Recommendations</h4>

          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Next Best Actions:</p>
              </div>
            </div>

            {/* Action 1 */}
            <div className="bg-gray-50 rounded-lg p-3 ml-7">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    1. Close current deals by Dec 20
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Focus: Get CEO approval
                  </p>
                  <p className="text-xs text-gray-600">
                    (Sarah escalating)
                  </p>
                </div>
                <button className="text-xs text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap">
                  Create Task
                </button>
              </div>
            </div>

            {/* Action 2 */}
            <div className="bg-gray-50 rounded-lg p-3 ml-7">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    2. Identify CEO contact
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Strategy: Ask Sarah for warm intro
                  </p>
                </div>
                <button className="text-xs text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap">
                  Add to To-Do
                </button>
              </div>
            </div>

            {/* Action 3 */}
            <div className="bg-gray-50 rounded-lg p-3 ml-7">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    3. Prepare upsell proposal for Q1 2026
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Value: $35K enterprise modules
                  </p>
                  <p className="text-xs text-gray-600">
                    Timing: After initial deployment success
                  </p>
                </div>
                <button className="text-xs text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap">
                  Schedule Reminder
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAccountInsightsPanel;
