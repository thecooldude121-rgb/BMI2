import React from 'react';
import { Sparkles, Calendar, Info } from 'lucide-react';
import { SUPPORTED_CURRENCIES, getCurrency, BASE_CURRENCY_CODE } from '../../../config/currencies';
import { formatCurrencyCompact, convertToBaseCurrency, getCurrencySymbol, validateDealValue } from '../../../utils/currencyUtils';

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
      <div className="flex items-center space-x-3 mb-6 pb-3 border-b border-gray-100">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Info className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">Basic Information</h2>
          <p className="text-xs text-gray-500">Core details about this deal</p>
        </div>
      </div>

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
            Deal Value <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center space-x-2">
            {/* Dynamic currency symbol — updates when currency changes */}
            <span className="text-gray-500 font-medium text-sm w-8 text-center flex-shrink-0">
              {getCurrencySymbol(formData.currency || 'USD')}
            </span>
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
            {/* Currency selector built from shared config — add currencies in currencies.ts */}
            <select
              value={formData.currency || 'USD'}
              onChange={(e) => onChange('currency', e.target.value)}
              className="px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          {validationErrors.dealValue && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.dealValue}</p>
          )}

          {/* Base currency conversion hint */}
          {!validationErrors.dealValue && formData.dealValue && formData.currency && formData.currency !== BASE_CURRENCY_CODE && (() => {
            const raw = parseFloat(formData.dealValue.toString().replace(/,/g, ''));
            if (isNaN(raw) || raw <= 0) return null;
            const baseAmt = convertToBaseCurrency(raw, formData.currency);
            return (
              <p className="mt-1.5 text-xs text-gray-500 flex items-center space-x-1">
                <Info className="h-3 w-3 flex-shrink-0" />
                <span>
                  ≈ {formatCurrencyCompact(baseAmt, BASE_CURRENCY_CODE)} {BASE_CURRENCY_CODE} for reporting
                  <span className="text-gray-400 ml-1">(mock rate — live FX coming)</span>
                </span>
              </p>
            );
          })()}

          {!validationErrors.dealValue && (!formData.currency || formData.currency === BASE_CURRENCY_CODE) && (
            <p className="mt-1 text-xs text-gray-400">
              Amounts are stored in {getCurrency(formData.currency || BASE_CURRENCY_CODE).name} and used as-is for reporting
            </p>
          )}

          {aiSuggestions && !validationErrors.dealValue && (
            <div className="mt-2 flex items-center space-x-3">
              <div className="flex items-center space-x-1 text-sm text-purple-600">
                <Sparkles className="h-4 w-4" />
                <span>Suggested: {aiSuggestions.valueRange}</span>
              </div>
              <button
                onClick={() => onChange('dealValue', String(aiSuggestions.dealValue))}
                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-medium transition-colors"
              >
                Apply {formatCurrencyCompact(aiSuggestions.dealValue, formData.currency || 'USD')}
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

        {/* Stage — horizontal bar */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Stage <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden">
            {stages.map((stage, idx) => {
              const isActive = formData.stage === stage.id;
              const isWon = stage.id === 'closed-won';
              const isLost = stage.id === 'closed-lost';
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => onChange('stage', stage.id)}
                  className={`flex-1 py-2.5 text-xs font-medium transition-all relative
                    ${idx !== 0 ? 'border-l border-gray-200' : ''}
                    ${isActive
                      ? isWon ? 'bg-green-600 text-white' : isLost ? 'bg-red-500 text-white' : 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  {stage.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Win Probability — compact row with collapsible breakdown */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 flex items-center space-x-1">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span>Win Probability</span>
              <span className="text-xs text-gray-400 font-normal">(AI-calculated)</span>
            </label>
            <span className="text-lg font-bold text-gray-900">{formData.probability}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${formData.probability}%` }}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
            <span className="bg-gray-50 border border-gray-200 rounded px-2 py-0.5">Stage base</span>
            <span className="bg-gray-50 border border-gray-200 rounded px-2 py-0.5">Contact role</span>
            {(formData.source === 'hrms' || formData.hrmsConnection) && (
              <span className="bg-orange-50 border border-orange-200 text-orange-700 rounded px-2 py-0.5">+15% HRMS</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
