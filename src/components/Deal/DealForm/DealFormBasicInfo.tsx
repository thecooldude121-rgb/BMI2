import React from 'react';
import { Sparkles, Calendar } from 'lucide-react';

interface DealFormBasicInfoProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  aiSuggestions?: any;
  validationErrors?: Record<string, string>;
  fieldWarnings?: Record<string, string>;
}

export const DealFormBasicInfo: React.FC<DealFormBasicInfoProps> = ({
  formData,
  onChange,
  aiSuggestions,
  validationErrors = {},
  fieldWarnings = {}
}) => {
  const stages = [
    { id: 'prospecting', name: 'Prospecting', probability: 25 },
    { id: 'qualified', name: 'Qualified', probability: 45 },
    { id: 'proposal', name: 'Proposal', probability: 67 },
    { id: 'negotiation', name: 'Negotiation', probability: 85 },
    { id: 'closed-won', name: 'Closed-Won', probability: 100 },
    { id: 'closed-lost', name: 'Closed-Lost', probability: 0 }
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">
        ━━━ BASIC DEAL INFORMATION ━━━━━━━━━━━━━━━━━━━━
      </h2>

      <div className="space-y-6">
        {/* Deal Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deal Name: <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.dealName}
            onChange={(e) => onChange('dealName', e.target.value)}
            placeholder="e.g., Acme Corp - Enterprise Plan"
            maxLength={100}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
              validationErrors.dealName
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          {validationErrors.dealName && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.dealName}</p>
          )}
          {!validationErrors.dealName && (
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2 text-sm text-purple-600">
                <Sparkles className="h-4 w-4" />
                <span>AI Suggestion: Use company + product pattern</span>
              </div>
              <span className="text-xs text-gray-500">{formData.dealName.length}/100</span>
            </div>
          )}
        </div>

        {/* Deal Value */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deal Value: <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center space-x-2">
            <span className="text-gray-700 font-medium">$</span>
            <input
              type="text"
              value={formData.dealValue}
              onChange={(e) => onChange('dealValue', e.target.value)}
              placeholder="50,000"
              className={`flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                validationErrors.dealValue
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            <select
              value={formData.currency}
              onChange={(e) => onChange('currency', e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          {validationErrors.dealValue && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.dealValue}</p>
          )}
          <div className="mt-1 text-xs text-gray-500">Max: $10,000,000 | Format: Auto-adds commas</div>
          {aiSuggestions && !validationErrors.dealValue && (
            <div className="mt-2">
              <div className="flex items-center space-x-2 text-sm text-purple-600">
                <Sparkles className="h-4 w-4" />
                <span>Suggested range: {aiSuggestions.valueRange} (Based on company)</span>
              </div>
              <button
                onClick={() => onChange('dealValue', aiSuggestions.dealValue)}
                className="mt-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-medium transition-colors"
              >
                Apply ${(aiSuggestions.dealValue / 1000).toFixed(0)}K
              </button>
            </div>
          )}
        </div>

        {/* Close Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Close Date: <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              value={formData.closeDate}
              onChange={(e) => onChange('closeDate', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                validationErrors.closeDate
                  ? 'border-red-500 focus:ring-red-500'
                  : fieldWarnings.closeDate
                  ? 'border-yellow-500 focus:ring-yellow-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
          {validationErrors.closeDate && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.closeDate}</p>
          )}
          {fieldWarnings.closeDate && !validationErrors.closeDate && (
            <p className="mt-1 text-sm text-yellow-600 flex items-center space-x-1">
              <span>⚠️</span>
              <span>{fieldWarnings.closeDate}</span>
            </p>
          )}
          {!validationErrors.closeDate && (
            <div className="mt-1 text-xs text-gray-500">Must be a future date</div>
          )}
          {aiSuggestions && !validationErrors.closeDate && (
            <div className="mt-2">
              <div className="flex items-center space-x-2 text-sm text-purple-600">
                <Sparkles className="h-4 w-4" />
                <span>Suggested: {aiSuggestions.closeDays} days from today (Industry avg)</span>
              </div>
              <button
                onClick={() => onChange('closeDate', aiSuggestions.closeDate)}
                className="mt-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-medium transition-colors"
              >
                Apply Suggestion
              </button>
            </div>
          )}
        </div>

        {/* Stage */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stage: <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.stage}
            onChange={(e) => onChange('stage', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </select>
          <div className="text-sm text-gray-600 mt-2">
            Default for new deals: Prospecting
          </div>
        </div>

        {/* Win Probability */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Win Probability: <span className="text-gray-500">(Auto-calculated)</span>
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="number"
              value={formData.probability}
              onChange={(e) => onChange('probability', parseInt(e.target.value) || 0)}
              min="0"
              max="100"
              className="w-24 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              readOnly
            />
            <span className="text-gray-700 font-medium">%</span>
            <div className="flex-1 bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${formData.probability}%` }}
              />
            </div>
          </div>
          <div className="mt-3 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center space-x-2 text-sm text-purple-900 mb-3">
              <Sparkles className="h-5 w-5" />
              <span className="font-semibold">AI Probability Calculation</span>
            </div>
            <div className="text-xs text-purple-800 space-y-2">
              <div className="flex justify-between items-center">
                <span>Stage Base:</span>
                <span className="font-semibold">
                  {formData.stage === 'prospecting' && '20%'}
                  {formData.stage === 'qualified' && '40%'}
                  {formData.stage === 'proposal' && '60%'}
                  {formData.stage === 'negotiation' && '80%'}
                  {formData.stage === 'closed-won' && '100%'}
                  {formData.stage === 'closed-lost' && '0%'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Contact Level:</span>
                <span className="font-semibold">
                  {formData.contactRole === 'Champion' && '+15%'}
                  {formData.contactRole === 'Decision Maker' && '+10%'}
                  {formData.contactRole === 'Influencer' && '+5%'}
                  {!['Champion', 'Decision Maker', 'Influencer'].includes(formData.contactRole) && '+0%'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>HRMS Connection:</span>
                <span className={`font-semibold ${(formData.source === 'hrms' || formData.hrmsConnection) ? 'text-orange-700' : ''}`}>
                  {(formData.source === 'hrms' || formData.hrmsConnection) ? '+15% 🏢' : '+0%'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Deal Value Sweet Spot:</span>
                <span className="font-semibold">
                  {(() => {
                    const dealValue = parseFloat(formData.dealValue?.toString().replace(/,/g, '') || '0');
                    return dealValue >= 40000 && dealValue <= 60000 ? '+5%' : '+0%';
                  })()}
                </span>
              </div>
              <div className="pt-2 mt-2 border-t border-purple-300 flex justify-between items-center">
                <span className="font-bold">Total:</span>
                <span className="font-bold text-lg">{formData.probability}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
