import React, { useState } from 'react';
import { partialEnrichmentData } from '../../utils/partialEnrichmentMockData';

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
  const [selectedOption, setSelectedOption] = useState('accept_partial');

  if (!isOpen) return null;

  const handlePrimaryAction = () => {
    switch (selectedOption) {
      case 'accept_partial':
        onAccept();
        break;
      case 'retry_failed':
        onRetryFailed();
        break;
      case 'manual_entry':
        onManualEntry();
        break;
      case 'discard_all':
        onDiscard();
        break;
    }
  };

  const getButtonLabel = () => {
    switch (selectedOption) {
      case 'accept_partial':
        return 'Accept & Continue';
      case 'retry_failed':
        return 'Retry Failed';
      case 'manual_entry':
        return 'Manual Entry';
      case 'discard_all':
        return 'Discard';
      default:
        return 'Continue';
    }
  };

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
                <span className="font-bold text-green-700">{partialEnrichmentData.enrichmentResults.successful} fields</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-600 font-semibold">❌ Failed to enrich:</span>
                <span className="font-bold text-red-700">{partialEnrichmentData.enrichmentResults.failed} fields</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-blue-600 font-semibold">⏭️ Skipped (low confidence):</span>
              <span className="font-bold text-blue-700">{partialEnrichmentData.enrichmentResults.skipped} fields</span>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-300">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Success rate:</span>
                <div className="flex items-center gap-3">
                  <div className="w-48 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${partialEnrichmentData.enrichmentResults.successRate}%` }}
                    ></div>
                  </div>
                  <span className="font-bold text-lg text-gray-900">
                    {partialEnrichmentData.enrichmentResults.successRate}%
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
                SUCCESSFULLY ENRICHED ({partialEnrichmentData.enrichmentResults.successful} fields)
              </h3>
            </div>

            {/* Contact Information */}
            <div className="mb-4">
              <h4 className="font-medium text-green-900 mb-2">
                Contact Information ({partialEnrichmentData.successfulFields.contactInformation.enriched}/{partialEnrichmentData.successfulFields.contactInformation.total}):
              </h4>
              <ul className="space-y-1 ml-4">
                {partialEnrichmentData.successfulFields.contactInformation.fields.map((field, idx) => (
                  <li key={idx} className="text-sm text-green-800">
                    • {field.name} ✓
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Information */}
            <div className="mb-4">
              <h4 className="font-medium text-green-900 mb-2">
                Company Information ({partialEnrichmentData.successfulFields.companyInformation.enriched}/{partialEnrichmentData.successfulFields.companyInformation.total}):
              </h4>
              <ul className="space-y-1 ml-4">
                {partialEnrichmentData.successfulFields.companyInformation.fields.map((field, idx) => (
                  <li key={idx} className="text-sm text-green-800">
                    • {field.name} ✓
                  </li>
                ))}
              </ul>
            </div>

            {/* Professional Details */}
            <div>
              <h4 className="font-medium text-green-900 mb-2">
                Professional Details ({partialEnrichmentData.successfulFields.professionalDetails.enriched}/{partialEnrichmentData.successfulFields.professionalDetails.total}):
              </h4>
              <ul className="space-y-1 ml-4">
                {partialEnrichmentData.successfulFields.professionalDetails.fields.map((field, idx) => (
                  <li key={idx} className="text-sm text-green-800">
                    • {field.name} ✓
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
                FAILED TO ENRICH ({partialEnrichmentData.enrichmentResults.failed} fields)
              </h3>
            </div>

            {/* Contact Information */}
            <div className="mb-4">
              <h4 className="font-medium text-red-900 mb-2">
                Contact Information ({partialEnrichmentData.failedFields.contactInformation.length}):
              </h4>
              <ul className="space-y-1 ml-4">
                {partialEnrichmentData.failedFields.contactInformation.map((field, idx) => (
                  <li key={idx} className="text-sm text-red-800">
                    • {field.name} - <span className="italic">{field.reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Information */}
            <div className="mb-4">
              <h4 className="font-medium text-red-900 mb-2">
                Company Information ({partialEnrichmentData.failedFields.companyInformation.length}):
              </h4>
              <ul className="space-y-1 ml-4">
                {partialEnrichmentData.failedFields.companyInformation.map((field, idx) => (
                  <li key={idx} className="text-sm text-red-800">
                    • {field.name} - <span className="italic">{field.reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Professional Details */}
            <div>
              <h4 className="font-medium text-red-900 mb-2">
                Professional Details ({partialEnrichmentData.failedFields.professionalDetails.length}):
              </h4>
              <ul className="space-y-1 ml-4">
                {partialEnrichmentData.failedFields.professionalDetails.map((field, idx) => (
                  <li key={idx} className="text-sm text-red-800">
                    • {field.name} - <span className="italic">{field.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Options */}
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 mb-3">What would you like to do?</h3>
            <div className="space-y-3">
              {partialEnrichmentData.options.map((option) => {
                const icons = {
                  accept_partial: '✅',
                  retry_failed: '🔄',
                  manual_entry: '✏️',
                  discard_all: '❌'
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
                        <span className="text-lg">{icons[option.id as keyof typeof icons]}</span>
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
          {partialEnrichmentData.recommendations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <span className="text-lg">💡</span>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Recommendations:</h4>
                  <ul className="space-y-1">
                    {partialEnrichmentData.recommendations.map((rec, idx) => (
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

            <div className="flex items-center gap-3">
              {selectedOption === 'accept_partial' && (
                <button
                  onClick={onAccept}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center gap-2"
                >
                  <span>✅</span>
                  Accept & Continue
                </button>
              )}

              {selectedOption === 'retry_failed' && (
                <button
                  onClick={onRetryFailed}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2"
                >
                  <span>🔄</span>
                  Retry Failed
                </button>
              )}

              {selectedOption === 'manual_entry' && (
                <button
                  onClick={onManualEntry}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors flex items-center gap-2"
                >
                  <span>✏️</span>
                  Manual Entry
                </button>
              )}

              {selectedOption === 'discard_all' && (
                <button
                  onClick={onDiscard}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors flex items-center gap-2"
                >
                  <span>❌</span>
                  Discard
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
