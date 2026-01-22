import React, { useState } from 'react';
import { PartialEnrichmentModal } from '../../components/LeadGeneration/PartialEnrichmentModal';
import { partialEnrichmentData } from '../../utils/partialEnrichmentMockData';

export default function PartialEnrichmentDemo() {
  const [showModal, setShowModal] = useState(false);
  const [actionLog, setActionLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setActionLog(prev => [`[${timestamp}] ${message}`, ...prev]);
  };

  const handleAccept = () => {
    addLog('✅ Accepted partial enrichment - 12 fields saved');
    addLog('📊 Success rate: 60%');
    addLog('💾 Lead updated with available data');
    setShowModal(false);
  };

  const handleRetryFailed = () => {
    addLog('🔄 Retrying enrichment for 8 failed fields...');
    addLog('📡 Attempting to fetch: Direct Phone, Office Location, Annual Revenue...');
    addLog('⏳ This may take a few moments');
    setShowModal(false);
  };

  const handleManualEntry = () => {
    addLog('✏️ Opening manual entry form for 8 missing fields');
    addLog('📝 You can now add the missing data yourself');
    setShowModal(false);
  };

  const handleDiscard = () => {
    addLog('❌ Discarded all enrichment data');
    addLog('⚠️ None of the 12 successfully enriched fields were saved');
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Partial Enrichment Error State Demo
          </h1>
          <p className="text-gray-600">
            Error State 4: Some fields enriched successfully, others failed
          </p>
        </div>

        {/* Control Panel */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Demo Controls</h2>

          <button
            onClick={() => {
              setShowModal(true);
              addLog('⚠️ Partial enrichment scenario triggered');
              addLog(`📊 ${partialEnrichmentData.enrichmentResults.successful} fields succeeded, ${partialEnrichmentData.enrichmentResults.failed} fields failed`);
            }}
            className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium transition-colors"
          >
            Trigger Partial Enrichment
          </button>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Scenario:</strong> Enriching Jessica Anderson's profile resulted in partial success.
              12 out of 20 fields were enriched successfully.
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Mock Data Display */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
              <span>📦</span>
              Mock Data Structure
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-xs text-gray-800">
{`{
  error: {
    type: "partial_enrichment",
    leadName: "Jessica Anderson",
    leadEmail: "jessica.anderson@techcorp.com"
  },
  enrichmentResults: {
    total: 20,
    successful: ${partialEnrichmentData.enrichmentResults.successful},
    failed: ${partialEnrichmentData.enrichmentResults.failed},
    skipped: ${partialEnrichmentData.enrichmentResults.skipped},
    successRate: ${partialEnrichmentData.enrichmentResults.successRate}%
  },
  successfulFields: {
    contactInformation: {
      total: 5, enriched: 3,
      fields: [ Email, LinkedIn, Phone ]
    },
    companyInformation: {
      total: 8, enriched: 5,
      fields: [ Size, Industry, Founded,
                Website, Funding ]
    },
    professionalDetails: {
      total: 7, enriched: 4,
      fields: [ Title, Seniority,
                Department, Education ]
    }
  },
  failedFields: {
    contactInformation: [
      { name: "Direct Phone",
        reason: "No data available" },
      { name: "Office Location",
        reason: "API timeout" }
    ],
    companyInformation: [
      { name: "Annual Revenue",
        reason: "Data not found" },
      { name: "Company HQ",
        reason: "API error" },
      { name: "International Presence",
        reason: "No data available" }
    ],
    professionalDetails: [
      { name: "Years in Role",
        reason: "Data not found" },
      { name: "Skills & Expertise",
        reason: "API timeout" },
      { name: "Previous Companies",
        reason: "No data available" }
    ]
  },
  options: [
    "accept_partial",
    "retry_failed",
    "manual_entry",
    "discard_all"
  ]
}`}
              </pre>
            </div>
          </div>

          {/* Statistics */}
          <div className="space-y-6">
            {/* Enrichment Results */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
                <span>📊</span>
                Enrichment Statistics
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                  <span className="text-sm font-medium text-green-900">Successfully Enriched</span>
                  <span className="text-xl font-bold text-green-700">
                    {partialEnrichmentData.enrichmentResults.successful}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded">
                  <span className="text-sm font-medium text-red-900">Failed to Enrich</span>
                  <span className="text-xl font-bold text-red-700">
                    {partialEnrichmentData.enrichmentResults.failed}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                  <span className="text-sm font-medium text-blue-900">Success Rate</span>
                  <span className="text-xl font-bold text-blue-700">
                    {partialEnrichmentData.enrichmentResults.successRate}%
                  </span>
                </div>
              </div>
            </div>

            {/* Breakdown by Category */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
                <span>📋</span>
                Category Breakdown
              </h2>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">Contact Information</span>
                    <span className="text-sm font-bold text-gray-700">
                      {partialEnrichmentData.successfulFields.contactInformation.enriched}/
                      {partialEnrichmentData.successfulFields.contactInformation.total}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width: `${(partialEnrichmentData.successfulFields.contactInformation.enriched /
                                  partialEnrichmentData.successfulFields.contactInformation.total) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">Company Information</span>
                    <span className="text-sm font-bold text-gray-700">
                      {partialEnrichmentData.successfulFields.companyInformation.enriched}/
                      {partialEnrichmentData.successfulFields.companyInformation.total}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{
                        width: `${(partialEnrichmentData.successfulFields.companyInformation.enriched /
                                  partialEnrichmentData.successfulFields.companyInformation.total) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">Professional Details</span>
                    <span className="text-sm font-bold text-gray-700">
                      {partialEnrichmentData.successfulFields.professionalDetails.enriched}/
                      {partialEnrichmentData.successfulFields.professionalDetails.total}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500"
                      style={{
                        width: `${(partialEnrichmentData.successfulFields.professionalDetails.enriched /
                                  partialEnrichmentData.successfulFields.professionalDetails.total) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Log */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span>📝</span>
              Action Log
            </h2>
            {actionLog.length > 0 && (
              <button
                onClick={() => setActionLog([])}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Clear Log
              </button>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto font-mono text-sm">
            {actionLog.length === 0 ? (
              <p className="text-gray-500 italic">No actions yet. Trigger the partial enrichment modal to see logs.</p>
            ) : (
              <div className="space-y-1">
                {actionLog.map((log, index) => (
                  <div key={index} className="text-gray-800">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <PartialEnrichmentModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          addLog('Modal closed without action');
        }}
        onAccept={handleAccept}
        onRetryFailed={handleRetryFailed}
        onManualEntry={handleManualEntry}
        onDiscard={handleDiscard}
      />
    </div>
  );
}
