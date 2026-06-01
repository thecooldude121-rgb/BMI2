import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Code } from 'lucide-react';
import InvalidAPIKeyModal from '../../components/LeadGeneration/InvalidAPIKeyModal';
import { invalidAPIKeyData } from '../../utils/invalidAPIKeyMockData';

const InvalidAPIKeyDemo: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleUpdateKey = (newKey: string) => {
    console.log('✅ API Key Updated');
    console.log('New API Key:', newKey);
    console.log('Key format valid:', newKey.startsWith('apollo_') && newKey.length === 36);
    alert(`API key updated successfully!\n\nNew key: ${newKey.slice(0, 10)}...${newKey.slice(-6)}`);
    setIsModalOpen(false);
  };

  const handleSkipApollo = () => {
    const altService = invalidAPIKeyData.alternativeServices[0];
    console.log('⏭️ Skipping Apollo, using alternative service');
    console.log('Alternative service:', altService);
    console.log('Service status:', altService.status);
    console.log('Estimated fields:', altService.estimatedFields);
    alert('Continuing with ZoomInfo only...');
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    console.log('❌ Enrichment cancelled');
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/lead-generation/enrichment')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invalid API Key Error State Demo</h1>
            <p className="text-sm text-gray-600 mt-1">
              Test the authentication failed error modal with API key update flow
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Demo Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Demo Controls</h2>
          <div className="flex gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              Show Invalid API Key Modal
            </button>
            <button
              onClick={() => navigate('/lead-generation/enrichment')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Back to Enrichment
            </button>
          </div>
        </div>

        {/* Mock Data Structure */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Code className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Mock Data Structure</h2>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-xs text-green-400 font-mono">
              <code>{JSON.stringify(invalidAPIKeyData, null, 2)}</code>
            </pre>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-red-900 mb-2">Error Details</h3>
              <ul className="text-xs text-red-800 space-y-1">
                <li>• Type: {invalidAPIKeyData.error.type}</li>
                <li>• Service: {invalidAPIKeyData.error.service}</li>
                <li>• Status Code: {invalidAPIKeyData.error.statusCode}</li>
                <li>• Message: "{invalidAPIKeyData.error.message}"</li>
              </ul>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Current API Key</h3>
              <ul className="text-xs text-gray-800 space-y-1">
                <li>• Masked: {invalidAPIKeyData.currentAPIKey.masked}</li>
                <li>• Status: {invalidAPIKeyData.currentAPIKey.status}</li>
                <li>• Last Verified: {new Date(invalidAPIKeyData.currentAPIKey.lastVerified).toLocaleDateString()}</li>
                <li>• Format: {invalidAPIKeyData.currentAPIKey.format}... ({invalidAPIKeyData.currentAPIKey.expectedLength} chars)</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-amber-900 mb-2">Possible Causes</h3>
              <ul className="text-xs text-amber-800 space-y-1">
                {invalidAPIKeyData.possibleCauses.slice(0, 3).map((cause, index) => (
                  <li key={index}>• {cause}</li>
                ))}
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Available Options</h3>
              <ul className="text-xs text-blue-800 space-y-1">
                {invalidAPIKeyData.options.map((option, index) => (
                  <li key={option.id}>• Option {index + 1}: {option.id}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Testing Instructions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Testing Instructions</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">1. Error Display</h3>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Red error header with "API Authentication Failed" title</li>
                <li>• Error details panel showing service, code, and message</li>
                <li>• List of 4 possible causes for the error</li>
                <li>• Current API key displayed in masked format</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">2. Update API Key Flow</h3>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Select "Update API key" option (default)</li>
                <li>• Input field appears with format hint</li>
                <li>• Try invalid format: "test123" - See validation error</li>
                <li>• Try valid format: "apollo_xxxxxxxxxxxxxxxxxxxxxxxxxxxx" (36 chars)</li>
                <li>• Click "Test Connection" - Shows loading spinner</li>
                <li>• Success message appears if format is valid</li>
                <li>• "Save & Test" button becomes enabled</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">3. Alternative Options</h3>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Select "Skip Apollo, use ZoomInfo only"</li>
                <li>• Input field disappears</li>
                <li>• "Save & Test" button is always enabled</li>
                <li>• Click "Save & Test" - Console logs alternative service info</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">4. Instructions Section</h3>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Amber panel with 4-step instructions</li>
                <li>• "Open Apollo Settings" button (opens in new tab)</li>
                <li>• Clear guidance on where to get API key</li>
                <li>• Reminder about required permissions</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">5. Footer Actions</h3>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Cancel button - Closes modal</li>
                <li>• "Go to Settings" button - Opens enrichment settings</li>
                <li>• "Save & Test" button - Executes selected action</li>
                <li>• Button states change based on validation</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">6. Console Logging</h3>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Open browser console (F12)</li>
                <li>• All actions logged with emojis and details</li>
                <li>• API key updates show masked key in alert</li>
                <li>• Alternative service selection logs service details</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Expected Behavior */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">Expected Behavior</h2>

          <div className="space-y-3 text-sm text-blue-900">
            <div className="flex items-start gap-2">
              <span className="font-semibold">✓</span>
              <span>Modal opens automatically showing authentication error</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold">✓</span>
              <span>Error details clearly explain the problem and possible causes</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold">✓</span>
              <span>Current API key is masked for security (shows only last 6 chars)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold">✓</span>
              <span>Three clear options: Update key, Skip Apollo, or Cancel</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold">✓</span>
              <span>API key input validates format in real-time (apollo_ prefix, 36 chars)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold">✓</span>
              <span>Test connection button provides immediate feedback (loading → success/error)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold">✓</span>
              <span>"Save & Test" button only enabled after successful validation</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold">✓</span>
              <span>Instructions panel provides step-by-step guidance with link to settings</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold">✓</span>
              <span>All actions logged to console for debugging</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold">✓</span>
              <span>Modal closes after successful action or cancel</span>
            </div>
          </div>
        </div>

        {/* Quick Test Scenarios */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Test Scenarios</h2>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Scenario 1: Update with Valid Key</h3>
              <ol className="text-sm text-gray-600 space-y-1 ml-4 list-decimal">
                <li>Open modal</li>
                <li>"Update API key" is pre-selected</li>
                <li>Enter: "apollo_abc123def456ghi789jkl012mno3"</li>
                <li>Click "Test Connection"</li>
                <li>Wait for success message</li>
                <li>Click "Save & Test"</li>
                <li>See alert with masked key</li>
              </ol>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Scenario 2: Invalid Key Format</h3>
              <ol className="text-sm text-gray-600 space-y-1 ml-4 list-decimal">
                <li>Open modal</li>
                <li>Enter: "invalid_key_123"</li>
                <li>See red validation error</li>
                <li>Click "Test Connection"</li>
                <li>See error message after test</li>
                <li>"Save & Test" remains disabled</li>
              </ol>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Scenario 3: Skip Apollo</h3>
              <ol className="text-sm text-gray-600 space-y-1 ml-4 list-decimal">
                <li>Open modal</li>
                <li>Select "Skip Apollo, use ZoomInfo only"</li>
                <li>Input field disappears</li>
                <li>"Save & Test" is enabled immediately</li>
                <li>Click "Save & Test"</li>
                <li>See alert about ZoomInfo</li>
                <li>Check console for service details</li>
              </ol>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Scenario 4: Cancel Enrichment</h3>
              <ol className="text-sm text-gray-600 space-y-1 ml-4 list-decimal">
                <li>Open modal</li>
                <li>Select "Cancel enrichment"</li>
                <li>Click "Save & Test" or "Cancel"</li>
                <li>Modal closes</li>
                <li>Check console for cancellation log</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <InvalidAPIKeyModal
        isOpen={isModalOpen}
        onClose={handleCancel}
        onUpdateKey={handleUpdateKey}
        onSkipApollo={handleSkipApollo}
      />
    </div>
  );
};

export default InvalidAPIKeyDemo;
