import React from 'react';
import { Sparkles, TrendingUp, CheckCircle2, AlertTriangle } from 'lucide-react';

interface AIInsightsPanelProps {
  formData: any;
}

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ formData }) => {
  const calculateAIInsights = () => {
    const factors = [];
    let winProbability = 50;

    if (formData.dealValue && parseFloat(formData.dealValue) >= 40000 && parseFloat(formData.dealValue) <= 60000) {
      factors.push({ type: 'positive', text: 'Good company fit', impact: 20, detail: 'SaaS company, 75 employees' });
      winProbability += 20;
    }

    if (formData.contactRole === 'Champion' || formData.contactRole === 'Decision Maker') {
      factors.push({ type: 'positive', text: 'Decision maker engaged', impact: 15, detail: 'VP-level contact' });
      winProbability += 15;
    }

    if (formData.dealValue && parseFloat(formData.dealValue) >= 45000 && parseFloat(formData.dealValue) <= 55000) {
      factors.push({ type: 'positive', text: 'Deal size in sweet spot', impact: 12, detail: `$${(parseFloat(formData.dealValue) / 1000).toFixed(0)}K matches avg wins` });
      winProbability += 12;
    }

    if (formData.source && formData.source.includes('lead-gen')) {
      factors.push({ type: 'warning', text: 'Competitor risk', impact: -8, detail: 'May use existing solution' });
      winProbability -= 8;
    }

    return { factors, winProbability: Math.min(Math.max(winProbability, 0), 100) };
  };

  const insights = calculateAIInsights();

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center space-x-2 mb-4">
        <Sparkles className="h-6 w-6 text-purple-600" />
        <h2 className="text-lg font-bold text-gray-900">🤖 AI DEAL INSIGHTS</h2>
      </div>

      <p className="text-sm text-gray-600 mb-4">Based on form data so far:</p>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Win Probability:</span>
            <span className="text-2xl font-bold text-blue-600">{insights.winProbability}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${insights.winProbability}%` }}
            ></div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="text-sm font-semibold text-gray-700 mb-3">Factors:</div>
          <div className="space-y-2">
            {insights.factors.map((factor, idx) => (
              <div key={idx} className="flex items-start space-x-2">
                {factor.type === 'positive' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="text-sm text-gray-900">
                    {factor.text} ({factor.impact > 0 ? '+' : ''}{factor.impact})
                  </div>
                  <div className="text-xs text-gray-600">{factor.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="text-sm font-semibold text-gray-700 mb-2">Predicted Outcome:</div>
          <div className="space-y-1 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>• Expected Close:</span>
              <span className="font-medium">{formData.closeDate ? new Date(formData.closeDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span>• Confidence:</span>
              <span className="font-medium">78%</span>
            </div>
            <div className="flex justify-between">
              <span>• Estimated Cycle:</span>
              <span className="font-medium">42 days</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="text-sm font-semibold text-gray-700 mb-2">Similar Deals:</div>
          <div className="text-sm text-gray-700">
            <div className="mb-2">You've closed 3 similar deals:</div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>• Avg value:</span>
                <span className="font-medium">$48K</span>
              </div>
              <div className="flex justify-between">
                <span>• Avg cycle:</span>
                <span className="font-medium">45 days</span>
              </div>
              <div className="flex justify-between">
                <span>• Win rate:</span>
                <span className="font-medium text-green-600">72%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
