import React, { useState } from 'react';
import { X, AlertCircle, Lock, ExternalLink, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { invalidAPIKeyData } from '../../utils/invalidAPIKeyMockData';

interface InvalidAPIKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateKey: (newKey: string) => void;
  onSkipApollo: () => void;
  service?: string;
}

const InvalidAPIKeyModal: React.FC<InvalidAPIKeyModalProps> = ({
  isOpen,
  onClose,
  onUpdateKey,
  onSkipApollo,
  service = 'Apollo.io'
}) => {
  const [selectedOption, setSelectedOption] = useState<string>('update_api_key');
  const [apiKey, setApiKey] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);

    await new Promise(resolve => setTimeout(resolve, 1500));

    if (apiKey.startsWith('apollo_') && apiKey.length === 36) {
      setTestResult('success');
    } else {
      setTestResult('error');
    }

    setIsTestingConnection(false);
  };

  const handleSaveAndTest = () => {
    if (selectedOption === 'update_api_key' && apiKey) {
      onUpdateKey(apiKey);
    } else if (selectedOption === 'skip_apollo') {
      onSkipApollo();
    } else if (selectedOption === 'cancel') {
      onClose();
    }
  };

  const handleOpenSettings = () => {
    window.open(invalidAPIKeyData.instructions.settingsUrl, '_blank');
  };

  const isValidFormat = apiKey.length === 0 ||
    (apiKey.startsWith('apollo_') && apiKey.length <= 36);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-red-50 border-b border-red-100 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-red-900">
                  API Authentication Failed
                </h2>
                <p className="text-sm text-red-700 mt-1">
                  {service} authentication failed
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Details */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="w-4 h-4 text-gray-700" />
              <h3 className="font-semibold text-gray-900">Error Details</h3>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="text-gray-600 font-medium">Service:</span>
                <span className="text-gray-900">{invalidAPIKeyData.error.service}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-600 font-medium">Error Code:</span>
                <span className="text-gray-900">{invalidAPIKeyData.error.errorCode} Unauthorized</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-600 font-medium">Message:</span>
                <span className="text-gray-900">"{invalidAPIKeyData.error.message}"</span>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Possible causes:</p>
              <ul className="space-y-1">
                {invalidAPIKeyData.possibleCauses.map((cause, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    <span>{cause}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Current API Key */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Current API Key (masked):</p>
            <div className="bg-gray-100 border border-gray-300 rounded px-3 py-2 font-mono text-sm text-gray-600">
              {invalidAPIKeyData.currentAPIKey.masked}
            </div>
          </div>

          {/* Options */}
          <div>
            <p className="text-sm font-medium text-gray-900 mb-3">What would you like to do?</p>
            <div className="space-y-3">
              {invalidAPIKeyData.options.map((option) => (
                <label
                  key={option.id}
                  className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="option"
                    value={option.id}
                    checked={selectedOption === option.id}
                    onChange={(e) => setSelectedOption(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{option.label}</p>
                    <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* API Key Input (shown when "Update API key" is selected) */}
          {selectedOption === 'update_api_key' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  New Apollo.io API Key:
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="apollo_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className={`w-full px-3 py-2 border rounded-lg font-mono text-sm ${
                    !isValidFormat
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
                {!isValidFormat && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    {invalidAPIKeyData.validation.format}
                  </p>
                )}
                {isValidFormat && apiKey.length > 0 && (
                  <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {invalidAPIKeyData.validation.format}
                  </p>
                )}
              </div>

              {/* Test Connection Button */}
              {apiKey.length > 0 && (
                <button
                  onClick={handleTestConnection}
                  disabled={!isValidFormat || isTestingConnection}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isTestingConnection ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Testing Connection...
                    </>
                  ) : testResult === 'success' ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Connection Successful
                    </>
                  ) : testResult === 'error' ? (
                    <>
                      <XCircle className="w-4 h-4" />
                      Connection Failed
                    </>
                  ) : (
                    'Test Connection'
                  )}
                </button>
              )}

              {testResult === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <div className="text-sm text-green-800">
                    <p className="font-medium">API key is valid!</p>
                    <p className="text-xs mt-1">Click "Save & Test" to use this key for enrichment.</p>
                  </div>
                </div>
              )}

              {testResult === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium">Invalid API key</p>
                    <p className="text-xs mt-1">Please check the format and try again.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="text-2xl">💡</div>
              <h3 className="font-semibold text-amber-900">
                {invalidAPIKeyData.instructions.title}
              </h3>
            </div>

            <ol className="space-y-2 mb-4">
              {invalidAPIKeyData.instructions.steps.map((step, index) => (
                <li key={index} className="text-sm text-amber-900 flex gap-2">
                  <span className="font-semibold">{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>

            <button
              onClick={handleOpenSettings}
              className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center justify-center gap-2"
            >
              Open Apollo Settings
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleOpenSettings}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            <span>🔧</span>
            Go to Settings
          </button>
          <button
            onClick={handleSaveAndTest}
            disabled={
              selectedOption === 'update_api_key' &&
              (apiKey.length === 0 || !isValidFormat || testResult !== 'success')
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span>💾</span>
            Save & Test
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvalidAPIKeyModal;
