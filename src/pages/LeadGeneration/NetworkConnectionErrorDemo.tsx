import React, { useState } from 'react';
import { NetworkConnectionErrorModal } from '../../components/LeadGeneration/NetworkConnectionErrorModal';
import { networkConnectionErrorData } from '../../utils/networkConnectionErrorMockData';

export const NetworkConnectionErrorDemo: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [actionLog, setActionLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setActionLog(prev => [`[${timestamp}] ${message}`, ...prev]);
  };

  const handleRetry = () => {
    addLog(`🔄 Retry attempt ${attemptNumber + 1} initiated`);

    if (attemptNumber < 3) {
      setAttemptNumber(prev => prev + 1);
      setTimeout(() => {
        addLog(`⚠️ Retry failed - Connection still unavailable`);
        setShowModal(true);
      }, 2000);
    } else {
      addLog(`❌ Maximum retry attempts reached (3/3)`);
      setShowModal(false);
    }
  };

  const handleCheckStatus = () => {
    addLog('📊 Opened service status pages');
    addLog('✅ Apollo.io status: https://status.apollo.io');
    addLog('✅ ZoomInfo status: https://status.zoominfo.com');
  };

  const handleSaveDraft = () => {
    addLog('💾 Lead saved as draft - can retry enrichment later');
    setShowModal(false);
  };

  const handleContactSupport = () => {
    addLog('📧 Support contact initiated');
    addLog(`📋 Ticket created with error details`);
    addLog(`📞 Support: ${networkConnectionErrorData.supportInfo.phone}`);
    setShowModal(false);
  };

  const resetDemo = () => {
    setAttemptNumber(1);
    setActionLog([]);
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🌐</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Network Connection Error - Demo
              </h1>
              <p className="text-gray-600">Error State 3: Connection/Network Issues</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <span>🌐</span>
              Trigger Network Error
            </button>

            <button
              onClick={resetDemo}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <span>🔄</span>
              Reset Demo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Left Column: Mock Data */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📦</span>
              Mock Data Structure
            </h2>

            <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs text-gray-800">
{`{
  error: {
    type: "network_connection_failed",
    statusCode: 504,
    message: "Cannot connect to..."
  },
  connectionStatus: {
    apollo: {
      status: "failed",
      message: "Connection timeout"
    },
    zoominfo: {
      status: "failed",
      message: "Connection timeout"
    },
    internet: {
      status: "connected",
      message: "Connected"
    }
  },
  errorDetails: [
    "Request timed out after 30s",
    "DNS resolution failed",
    "Possible firewall issues"
  ],
  retryInfo: {
    currentAttempt: ${attemptNumber},
    maxAttempts: 3
  }
}`}
              </pre>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              {/* Error Details */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-red-900 mb-2">Error Info</h3>
                <ul className="text-xs text-red-800 space-y-1">
                  <li>• Type: {networkConnectionErrorData.error.type}</li>
                  <li>• Code: {networkConnectionErrorData.error.statusCode}</li>
                  <li>• Message: {networkConnectionErrorData.error.message}</li>
                </ul>
              </div>

              {/* Retry Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Retry Status</h3>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Current: {attemptNumber} of 3</li>
                  <li>• Max Attempts: {networkConnectionErrorData.retryInfo.maxAttempts}</li>
                  <li>• Delay: {networkConnectionErrorData.retryInfo.suggestedDelay}ms</li>
                </ul>
              </div>

              {/* Connection Status */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Services</h3>
                <ul className="text-xs text-gray-800 space-y-1">
                  <li>• Apollo: {networkConnectionErrorData.connectionStatus.apollo.status}</li>
                  <li>• ZoomInfo: {networkConnectionErrorData.connectionStatus.zoominfo.status}</li>
                  <li>• Internet: {networkConnectionErrorData.connectionStatus.internet.status}</li>
                </ul>
              </div>

              {/* Options */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-green-900 mb-2">Options</h3>
                <ul className="text-xs text-green-800 space-y-1">
                  {networkConnectionErrorData.options.map((opt) => (
                    <li key={opt.id}>• {opt.label}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column: Action Log */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📋</span>
              Action Log
              {actionLog.length > 0 && (
                <span className="ml-auto text-sm text-gray-500">
                  ({actionLog.length} events)
                </span>
              )}
            </h2>

            <div className="bg-gray-50 rounded-lg p-4 h-[400px] overflow-y-auto">
              {actionLog.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No actions yet. Click "Trigger Network Error" to start.
                </p>
              ) : (
                <div className="space-y-2">
                  {actionLog.map((log, index) => (
                    <div
                      key={index}
                      className="text-xs font-mono bg-white rounded p-2 border border-gray-200"
                    >
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-yellow-900 mb-2">
                💡 Testing Tips
              </h3>
              <ul className="text-xs text-yellow-800 space-y-1">
                <li>• Each retry increments attempt counter</li>
                <li>• Maximum 3 retry attempts allowed</li>
                <li>• Service status opens external pages</li>
                <li>• Save draft preserves lead data</li>
                <li>• All actions logged to console</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Feature Documentation */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>📚</span>
            Features & Interactions
          </h2>

          <div className="grid grid-cols-3 gap-4">
            {/* Connection Status */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">🔌 Connection Status</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ Service-by-service status</li>
                <li>✓ Visual indicators (✅/❌)</li>
                <li>✓ Error details panel</li>
                <li>✓ Last attempt timestamp</li>
              </ul>
            </div>

            {/* Retry Logic */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">🔄 Retry Logic</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>✓ Attempt counter (1 of 3)</li>
                <li>✓ Immediate retry button</li>
                <li>✓ Progress indicator</li>
                <li>✓ Max attempts limit</li>
              </ul>
            </div>

            {/* Resolution Options */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-2">⚙️ Options</h3>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>✓ Retry connection</li>
                <li>✓ Check service status</li>
                <li>✓ Save draft for later</li>
                <li>✓ Contact support</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="font-semibold text-orange-900 mb-2">
              🔍 Troubleshooting Steps
            </h3>
            <ol className="text-sm text-orange-800 space-y-1">
              {networkConnectionErrorData.troubleshootingSteps.map((step, index) => (
                <li key={index}>
                  {index + 1}. {step}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Quick Test Guide */}
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-sm p-6 border-2 border-blue-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>⚡</span>
            Quick Test Guide
          </h2>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Test Scenario 1: Retry Flow</h3>
              <ol className="text-sm text-gray-700 space-y-1">
                <li>1. Click "Trigger Network Error"</li>
                <li>2. Select "Retry connection" (default)</li>
                <li>3. Click "Retry Now"</li>
                <li>4. Watch attempt counter increment</li>
                <li>5. Repeat until max attempts (3)</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Test Scenario 2: Alternatives</h3>
              <ol className="text-sm text-gray-700 space-y-1">
                <li>1. Open modal</li>
                <li>2. Select "Check service status"</li>
                <li>3. Click "Service Status" button</li>
                <li>4. Try "Save draft" option</li>
                <li>5. Test "Contact support" flow</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <NetworkConnectionErrorModal
        isOpen={showModal}
        onClose={() => {
          addLog('❌ Modal closed');
          setShowModal(false);
        }}
        onRetry={handleRetry}
        onCheckStatus={handleCheckStatus}
        onSaveDraft={handleSaveDraft}
        onContactSupport={handleContactSupport}
        attemptNumber={attemptNumber}
      />
    </div>
  );
};

export default NetworkConnectionErrorDemo;
