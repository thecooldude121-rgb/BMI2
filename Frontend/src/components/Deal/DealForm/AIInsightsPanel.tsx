import React from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { formatCurrencyCompact, convertToBaseCurrency } from '../../../utils/currencyUtils';
import { formatDisplayDate } from '../../../utils/dateUtils';
import { BASE_CURRENCY_CODE } from '../../../config/currencies';
import { getStageProbability, DEFAULT_PIPELINE } from '../../../config/pipelines';
import { getContactRole } from '../../../config/contactRoles';

interface AIInsightsPanelProps {
  formData: any;
}

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ formData }) => {
  const currency = formData.currency || BASE_CURRENCY_CODE;
  const rawAmount = parseFloat((formData.dealValue || '0').toString().replace(/,/g, ''));
  // Normalise to USD for threshold comparisons so sweet-spot logic works across all currencies
  const amountUSD = isNaN(rawAmount) ? 0 : convertToBaseCurrency(rawAmount, currency);

  const stageProbability = getStageProbability(formData.pipelineId || DEFAULT_PIPELINE.id, formData.stage);
  const primaryProbability = formData.probability ?? stageProbability;
  // 'ai' when signals have pushed the score above the stage baseline; 'stage' otherwise
  const probSource: 'ai' | 'stage' = primaryProbability > stageProbability ? 'ai' : 'stage';

  const calculateFactors = () => {
    const factors: { type: string; text: string; impact: number; detail: string }[] = [];

    // Mirrors calculateWinProbability boost amounts exactly
    const roleId = getContactRole(formData.contactRole || '').id;
    if (roleId === 'decision-maker') {
      factors.push({ type: 'positive', text: 'Decision maker engaged', impact: 10, detail: 'VP-level contact' });
    } else if (roleId === 'champion') {
      factors.push({ type: 'positive', text: 'Champion identified', impact: 15, detail: 'Internal advocate for this deal' });
    } else if (roleId === 'economic-buyer') {
      factors.push({ type: 'positive', text: 'Economic buyer engaged', impact: 10, detail: 'Budget holder involved' });
    }

    if (amountUSD >= 40000 && amountUSD <= 60000) {
      factors.push({
        type: 'positive',
        text: 'Deal size in sweet spot',
        impact: 5,
        detail: `${formatCurrencyCompact(rawAmount, currency)} matches avg wins`,
      });
    }

    if (formData.source === 'hrms' || formData.hrmsConnection) {
      factors.push({ type: 'positive', text: 'HRMS warm intro', impact: 15, detail: 'Connection increases close rate by 33%' });
    }

    if (formData.source && formData.source.includes('lead-gen')) {
      factors.push({ type: 'warning', text: 'Competitor risk', impact: -8, detail: 'May use existing solution' });
    }

    return factors;
  };

  const factors = calculateFactors();

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center space-x-2 mb-4">
        <Sparkles className="h-6 w-6 text-purple-600" />
        <h2 className="text-lg font-bold text-gray-900">🤖 AI DEAL INSIGHTS</h2>
      </div>

      <p className="text-sm text-gray-600 mb-4">Based on form data so far:</p>

      <div className="space-y-4">
        {/* Primary probability — single authoritative number */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-gray-700">Win Probability</span>
              {probSource === 'ai' ? (
                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                  AI Score
                </span>
              ) : (
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded">
                  Stage Baseline
                </span>
              )}
              <div className="relative group">
                <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                <div className="absolute left-0 bottom-5 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 leading-relaxed">
                  AI score uses deal context and stakeholder signals; stage baseline is historical default.
                </div>
              </div>
            </div>
            <span className="text-2xl font-bold text-blue-600">{primaryProbability}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${primaryProbability}%` }}
            />
          </div>
          {/* Stage baseline shown as supporting context only when AI score is active */}
          {probSource === 'ai' && (
            <div className="mt-1 text-xs text-gray-400 text-right">
              Stage baseline: {stageProbability}%
            </div>
          )}
        </div>

        {factors.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <div className="text-sm font-semibold text-gray-700 mb-3">Factors:</div>
            <div className="space-y-2">
              {factors.map((factor, idx) => (
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
        )}

        <div className="pt-4 border-t border-gray-200">
          <div className="text-sm font-semibold text-gray-700 mb-2">Predicted Outcome:</div>
          <div className="space-y-1 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>• Expected Close:</span>
              <span className="font-medium">
                {formatDisplayDate(formData.closeDate)}
              </span>
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
                <span className="font-medium">{formatCurrencyCompact(48000, BASE_CURRENCY_CODE)}</span>
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
