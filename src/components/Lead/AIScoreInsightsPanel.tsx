import React from 'react';
import { Brain, TrendingUp, CheckCircle, AlertCircle, Lightbulb, Users } from 'lucide-react';
import { AIScoreInsight } from '../../types/leadScoring';

interface AIScoreInsightsPanelProps {
  insights: AIScoreInsight;
}

const AIScoreInsightsPanel: React.FC<AIScoreInsightsPanelProps> = ({ insights }) => {
  const getConfidenceColor = () => {
    if (insights.confidence === 'high') return 'bg-green-100 text-green-800';
    if (insights.confidence === 'medium') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* AI Score Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Score Intelligence</h2>
              <p className="text-purple-100 text-sm">Powered by machine learning</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{insights.score}</div>
            <div className={`mt-1 px-3 py-1 rounded-full text-xs font-semibold ${getConfidenceColor()}`}>
              {insights.confidence.toUpperCase()} CONFIDENCE
            </div>
          </div>
        </div>
      </div>

      {/* Why This Score */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Lightbulb className="h-5 w-5 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-900">Why This Score?</h3>
        </div>
        <div className="space-y-3">
          {insights.explanation.map((reason, idx) => (
            <div key={idx} className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-gray-700">{reason}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Buying Signals */}
      {insights.buyingSignals.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Buying Signals</h3>
          </div>
          <div className="space-y-3">
            {insights.buyingSignals.map((signal, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center space-x-3">
                  <div className={`px-2 py-1 rounded text-xs font-semibold ${
                    signal.strength === 'strong' ? 'bg-green-100 text-green-800' :
                    signal.strength === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {signal.strength.toUpperCase()}
                  </div>
                  <span className="text-gray-900 font-medium">{signal.signal}</span>
                </div>
                <span className="text-xs text-gray-600">
                  {new Date(signal.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">Recommended Next Actions</h3>
        </div>
        <div className="space-y-3">
          {insights.recommendedActions.map((action) => (
            <div key={action.id} className={`p-4 rounded-lg border-2 ${
              action.priority === 'high' ? 'border-orange-200 bg-orange-50' :
              action.priority === 'medium' ? 'border-yellow-200 bg-yellow-50' :
              'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className={`px-2 py-1 rounded text-xs font-semibold ${
                    action.priority === 'high' ? 'bg-orange-200 text-orange-900' :
                    action.priority === 'medium' ? 'bg-yellow-200 text-yellow-900' :
                    'bg-gray-200 text-gray-900'
                  }`}>
                    {action.priority.toUpperCase()}
                  </div>
                  <span className="font-semibold text-gray-900">{action.title}</span>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-2">{action.description}</p>
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <TrendingUp className="h-3 w-3" />
                <span className="font-medium">Expected Impact: {action.expectedImpact}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Similar Successful Deals */}
      {insights.similarDeals.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Similar Successful Deals</h3>
          </div>
          <div className="space-y-3">
            {insights.similarDeals.map((deal) => (
              <div key={deal.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100">
                <div>
                  <div className="font-semibold text-gray-900">{deal.companyName}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Score: {deal.score} | Deal Value: ${deal.dealValue.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Closed: {new Date(deal.closeDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">{deal.similarity}%</div>
                  <div className="text-xs text-gray-600">Similar</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIScoreInsightsPanel;
