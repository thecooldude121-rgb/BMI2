import React, { useState } from 'react';
import { partialEnrichmentData, formatFieldName, getCategoryTotals } from '../../utils/partialEnrichmentMockData';

interface PartialEnrichmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onRetryFailed: () => void;
  onManualEntry: () => void;
  onDiscard: () => void;
}

export function PartialEnrichmentModal({
  isOpen,
  onClose,
  onAccept,
  onRetryFailed,
  onManualEntry,
  onDiscard
}: PartialEnrichmentModalProps) {
  const [selectedOption, setSelectedOption] = useState('accept');

  if (!isOpen) return null;

  const categoryTotals = getCategoryTotals();
  const { results, successfulFields, failedFields, options, recommendations } = partialEnrichmentData;

  const handlePrimaryAction = () => {
    switch (selectedOption) {
      case 'accept':
        onAccept();
        break;
      case 'retry':
        onRetryFailed();
        break;
      case 'manual':
        onManualEntry();
        break;
      case 'discard':
        onDiscard();
        break;
    }
  };

  const getButtonConfig = () => {
    const configs: Record<string, { label: string; icon: string; color: string }> = {
      accept: { label: 'Accept & Continue', icon: '✅', color: 'bg-green-600 hover:bg-green-700' },
      retry: { label: 'Retry Failed', icon: '🔄', color: 'bg-blue-600 hover:bg-blue-700' },
      manual: { label: 'Manual Entry', icon: '✏️', color: 'bg-purple-600 hover:bg-purple-700' },
      discard: { label: 'Discard', icon: '❌', color: 'bg-red-600 hover:bg-red-700' }
    };
    return configs[selectedOption] || configs.accept;
  };

  const buttonConfig = getButtonConfig();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚠️</span>
              <div>
                <h2 className="text-xl font-bold text-yellow-900">PARTIAL ENRICHMENT</h2>
                <p className="text-sm text-yellow-700 mt-1">
                  Some fields could not be enriched
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-yellow-600 hover:text-yellow-800 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Enrichment Results Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📊</span>
              <h3 className="font-semibold text-gray-900">Enrichment Results</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-green-600 font-semibold">✅ Successfully enriched:</span>
                <span className="font-bold text-green-700">{results.successful} fields</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-600 font-semibold">❌ Failed to enrich:</span>
                <span className="font-bold text-red-700">{results.failed} fields</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-blue-600 font-semibold">⏭️ Skipped (low confidence):</span>
              <span className="font-bold text-blue-700">{results.skipped} fields</span>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-300">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Success rate:</span>
                <div className="flex items-center gap-3">
                  <div className="w-48 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${results.successRate}%` }}
                    ></div>
                  </div>
                  <span className="font-bold text-lg text-gray-900">
                    {results.successRate}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Successfully Enriched Section */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">✅</span>
              <h3 className="font-semibold text-green-900">
                SUCCESSFULLY ENRICHED ({results.successful} fields)
              </h3>
            </div>

            {/* Contact Information */}
            <div className="mb-4">
              <h4 className="font-medium text-green-900 mb-2">
                Contact Information ({categoryTotals.contactInfo.enriched}/{categoryTotals.contactInfo.total}):
              </h4>
              <ul className="space-y-1 ml-4">
                {successfulFields.contactInfo.map((item, idx) => (
                  <li key={idx} className="text-sm text-green-800">
                    • {formatFieldName(item.field)} ✓
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Information */}
            <div className="mb-4">
              <h4 className="font-medium text-green-900 mb-2">
                Company Information ({categoryTotals.companyInfo.enriched}/{categoryTotals.companyInfo.total}):
              </h4>
              <ul className="space-y-1 ml-4">
                {successfulFields.companyInfo.map((item, idx) => (
                  <li key={idx} className="text-sm text-green-800">
                    • {formatFieldName(item.field)} ✓
                  </li>
                ))}
              </ul>
            </div>

            {/* Professional Details */}
            <div>
              <h4 className="font-medium text-green-900 mb-2">
                Professional Details ({categoryTotals.professionalDetails.enriched}/{categoryTotals.professionalDetails.total}):
              </h4>
              <ul className="space-y-1 ml-4">
                {successfulFields.professionalDetails.map((item, idx) => (
                  <li key={idx} className="text-sm text-green-800">
                    • {formatFieldName(item.field)} ✓
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Failed to Enrich Section */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">❌</span>
              <h3 className="font-semibold text-red-900">
                FAILED TO ENRICH ({results.failed} fields)
              </h3>
            </div>

            {/* Contact Information */}
            {failedFields.contactInfo.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-red-900 mb-2">
                  Contact Information ({failedFields.contactInfo.length}):
                </h4>
                <ul className="space-y-1 ml-4">
                  {failedFields.contactInfo.map((item, idx) => (
                    <li key={idx} className="text-sm text-red-800">
                      • {formatFieldName(item.field)} - <span className="italic">{item.reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Company Information */}
            {failedFields.companyInfo.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-red-900 mb-2">
                  Company Information ({failedFields.companyInfo.length}):
                </h4>
                <ul className="space-y-1 ml-4">
                  {failedFields.companyInfo.map((item, idx) => (
                    <li key={idx} className="text-sm text-red-800">
                      • {formatFieldName(item.field)} - <span className="italic">{item.reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Professional Details */}
            {failedFields.professionalDetails.length > 0 && (
              <div>
                <h4 className="font-medium text-red-900 mb-2">
                  Professional Details ({failedFields.professionalDetails.length}):
                </h4>
                <ul className="space-y-1 ml-4">
                  {failedFields.professionalDetails.map((item, idx) => (
                    <li key={idx} className="text-sm text-red-800">
                      • {formatFieldName(item.field)} - <span className="italic">{item.reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 mb-3">What would you like to do?</h3>
            <div className="space-y-3">
              {options.map((option) => {
                const icons: Record<string, string> = {
                  accept: '✅',
                  retry: '🔄',
                  manual: '✏️',
                  discard: '❌'
                };

                return (
                  <label
                    key={option.id}
                    className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedOption === option.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="partial-option"
                      value={option.id}
                      checked={selectedOption === option.id}
                      onChange={(e) => setSelectedOption(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{icons[option.id]}</span>
                        <span className="font-medium text-gray-900">{option.label}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Recommendations */}
          {recommendations && recommendations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <span className="text-lg">💡</span>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Recommendations:</h4>
                  <ul className="space-y-1">
                    {recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-blue-800">
                        • {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handlePrimaryAction}
              className={`px-6 py-2 text-white rounded-lg font-medium transition-colors flex items-center gap-2 ${buttonConfig.color}`}
            >
              <span>{buttonConfig.icon}</span>
              {buttonConfig.label}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
