import React, { useState } from 'react';
import { networkConnectionErrorData } from '../../utils/networkConnectionErrorMockData';

interface NetworkConnectionErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  onCheckStatus: () => void;
  onSaveDraft: () => void;
  onContactSupport: () => void;
  attemptNumber?: number;
}

export const NetworkConnectionErrorModal: React.FC<NetworkConnectionErrorModalProps> = ({
  isOpen,
  onClose,
  onRetry,
  onCheckStatus,
  onSaveDraft,
  onContactSupport,
  attemptNumber = 1
}) => {
  const [selectedOption, setSelectedOption] = useState<string>('retry');
  const [isRetrying, setIsRetrying] = useState(false);

  if (!isOpen) return null;

  const handleAction = async () => {
    console.log(`🔄 Network Error Action: ${selectedOption}`, {
      option: selectedOption,
      attemptNumber,
      timestamp: new Date().toISOString()
    });

    switch (selectedOption) {
      case 'retry':
        setIsRetrying(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsRetrying(false);
        onRetry();
        break;
      case 'check_status':
        onCheckStatus();
        break;
      case 'save_draft':
        onSaveDraft();
        break;
      case 'contact_support':
        onContactSupport();
        break;
    }
  };

  const handleRetryNow = async () => {
    console.log('🔄 Immediate Retry Triggered');
    setIsRetrying(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRetrying(false);
    onRetry();
  };

  const handleCheckStatus = () => {
    console.log('📊 Opening Service Status Pages');
    const checkStatusOption = networkConnectionErrorData.options.find(opt => opt.id === 'check_status');
    if (checkStatusOption && 'statusUrls' in checkStatusOption) {
      window.open(checkStatusOption.statusUrls.apollo, '_blank');
      window.open(checkStatusOption.statusUrls.zoominfo, '_blank');
    }
    onCheckStatus();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-4 rounded-t-lg">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌐</span>
            <div>
              <h2 className="text-xl font-bold">NETWORK CONNECTION ERROR</h2>
              <p className="text-orange-100 text-sm mt-1">
                {networkConnectionErrorData.error.message}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Connection Status Panel */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🔌</span>
              <h3 className="font-semibold text-gray-900">Connection Status</h3>
            </div>

            <div className="space-y-3 mb-4">
              {/* Apollo Status */}
              <div className="flex items-center justify-between bg-white rounded p-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {networkConnectionErrorData.connectionStatus.apollo.status === 'failed' ? '❌' : '✅'}
                  </span>
                  <span className="font-medium text-gray-900">
                    Apollo.io:
                  </span>
                </div>
                <span className="text-red-600 font-medium">
                  {networkConnectionErrorData.connectionStatus.apollo.error}
                </span>
              </div>

              {/* ZoomInfo Status */}
              <div className="flex items-center justify-between bg-white rounded p-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {networkConnectionErrorData.connectionStatus.zoominfo.status === 'failed' ? '❌' : '✅'}
                  </span>
                  <span className="font-medium text-gray-900">
                    ZoomInfo:
                  </span>
                </div>
                <span className="text-red-600 font-medium">
                  {networkConnectionErrorData.connectionStatus.zoominfo.error}
                </span>
              </div>

              {/* Internet Status */}
              <div className="flex items-center justify-between bg-white rounded p-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {networkConnectionErrorData.connectionStatus.internet.status === 'connected' ? '✅' : '❌'}
                  </span>
                  <span className="font-medium text-gray-900">
                    Internet:
                  </span>
                </div>
                <span className="text-green-600 font-medium">
                  {networkConnectionErrorData.connectionStatus.internet.message}
                </span>
              </div>
            </div>

            {/* Error Details */}
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="font-semibold text-red-900 mb-2">Error Details:</p>
              <ul className="space-y-1">
                {networkConnectionErrorData.errorDetails.map((detail, index) => (
                  <li key={index} className="text-sm text-red-800 flex gap-2">
                    <span>•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Possible Causes */}
          <div>
            <p className="font-medium text-gray-900 mb-2">This could be caused by:</p>
            <ul className="space-y-1">
              {networkConnectionErrorData.possibleCauses.map((cause, index) => (
                <li key={index} className="text-sm text-gray-700 flex gap-2">
                  <span>•</span>
                  <span>{cause}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Options */}
          <div>
            <p className="font-medium text-gray-900 mb-3">What would you like to do?</p>
            <div className="space-y-3">
              {networkConnectionErrorData.options.map((option) => {
                const icons = {
                  retry: '🔄',
                  check_status: '📊',
                  save_draft: '💾',
                  contact_support: '📧'
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
                      name="network-option"
                      value={option.id}
                      checked={selectedOption === option.id}
                      onChange={(e) => setSelectedOption(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{icons[option.id as keyof typeof icons]}</span>
                        <span className="font-medium text-gray-900">{option.label}</span>
                        {option.id === 'retry' && 'attemptNumber' in option && 'maxAttempts' in option && (
                          <span className="text-sm text-gray-500">
                            (Attempt {attemptNumber} of {option.maxAttempts})
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Troubleshooting Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🔍</span>
              <h3 className="font-semibold text-blue-900">TROUBLESHOOTING STEPS</h3>
            </div>

            <ol className="space-y-2">
              {networkConnectionErrorData.troubleshootingSteps.map((step, index) => (
                <li key={index} className="text-sm text-blue-900 flex gap-2">
                  <span className="font-semibold">{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex flex-wrap gap-2">
          <button
            onClick={handleRetryNow}
            disabled={isRetrying}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isRetrying ? (
              <>
                <span className="animate-spin">⏳</span>
                Retrying...
              </>
            ) : (
              <>
                <span>🔄</span>
                Retry Now
              </>
            )}
          </button>

          <button
            onClick={handleCheckStatus}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <span>📊</span>
            Service Status
          </button>

          <button
            onClick={() => {
              console.log('💾 Saving draft for later retry');
              onSaveDraft();
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <span>💾</span>
            Save Draft
          </button>

          <button
            onClick={() => {
              console.log('📧 Opening support contact');
              onContactSupport();
            }}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
          >
            <span>📧</span>
            Contact Support
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            <span>❌</span>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
