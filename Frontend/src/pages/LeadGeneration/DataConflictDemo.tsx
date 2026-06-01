import React, { useState } from 'react';
import { DataConflictModal } from '../../components/LeadGeneration/DataConflictModal';
import { DataConflict, dataConflictData, getConflictSummary } from '../../utils/dataConflictMockData';

export default function DataConflictDemo() {
  const [showModal, setShowModal] = useState(false);
  const [actionLog, setActionLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setActionLog(prev => [`[${timestamp}] ${message}`, ...prev]);
  };

  const handleAccept = (conflicts: DataConflict[], strategy: string) => {
    const summary = getConflictSummary(conflicts);
    addLog(`✅ Accepted conflict resolution using strategy: ${strategy}`);
    addLog(`📊 Apollo selected for ${summary.apolloSelected} fields, ZoomInfo for ${summary.zoominfoSelected} fields`);

    conflicts.forEach(conflict => {
      const selectedSource = conflict.apollo.selected ? 'Apollo.io' : 'ZoomInfo';
      const selectedValue = conflict.apollo.selected ? conflict.apollo.value : conflict.zoominfo.value;
      addLog(`   • ${conflict.fieldLabel}: ${selectedValue} (${selectedSource})`);
    });

    addLog('💾 Lead updated with selected data');
    setShowModal(false);
  };

  const handleUseAllApollo = () => {
    addLog('🔄 Using all Apollo.io data for conflicting fields');
    dataConflictData.conflicts.forEach(conflict => {
      addLog(`   • ${conflict.fieldLabel}: ${conflict.apollo.value}`);
    });
    addLog('💾 Lead updated with Apollo.io data');
    setShowModal(false);
  };

  const handleUseAllZoomInfo = () => {
    addLog('🔄 Using all ZoomInfo data for conflicting fields');
    dataConflictData.conflicts.forEach(conflict => {
      addLog(`   • ${conflict.fieldLabel}: ${conflict.zoominfo.value}`);
    });
    addLog('💾 Lead updated with ZoomInfo data');
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Data Conflict Error State Demo
          </h1>
          <p className="text-gray-600">
            Error State 5: Apollo vs ZoomInfo data conflicts
          </p>
        </div>

        {/* Control Panel */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Demo Controls</h2>

          <button
            onClick={() => {
              setShowModal(true);
              addLog('⚠️ Data conflict detected during enrichment');
              addLog(`📊 ${dataConflictData.conflictCount} conflicting fields found between Apollo and ZoomInfo`);
            }}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors"
          >
            Trigger Data Conflict
          </button>

          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded">
            <p className="text-sm text-orange-800">
              <strong>Scenario:</strong> Enriching {dataConflictData.leadName} at {dataConflictData.company}.
              Apollo.io and ZoomInfo returned different values for {dataConflictData.conflictCount} fields.
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Mock Data Display */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
              <span>📦</span>
              Conflict Data Structure
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-xs text-gray-800">
{`{
  conflictCount: ${dataConflictData.conflictCount},
  leadName: "${dataConflictData.leadName}",
  company: "${dataConflictData.company}",

  conflicts: [
    {
      field: "company_size",
      fieldLabel: "Company Size",
      apollo: {
        value: "85 employees",
        confidence: 94,
        source: "LinkedIn company page...",
        lastUpdated: "2 days ago"
      },
      zoominfo: {
        value: "100-150 employees",
        confidence: 87,
        source: "ZoomInfo database...",
        lastUpdated: "1 month ago"
      },
      recommendation: "apollo",
      selected: "apollo"
    },
    {
      field: "annual_revenue",
      fieldLabel: "Annual Revenue",
      apollo: {
        value: "$10M - $15M",
        confidence: 82,
        ...
      },
      zoominfo: {
        value: "$12M - $15M",
        confidence: 91,
        ...
      },
      recommendation: "zoominfo",
      selected: "zoominfo"
    },
    {
      field: "direct_phone",
      fieldLabel: "Direct Phone",
      apollo: {
        value: "+1 (415) 234-5678",
        confidence: 88,
        ...
      },
      zoominfo: {
        value: "+1 (415) 234-9999",
        confidence: 85,
        ...
      },
      recommendation: "apollo",
      selected: "apollo"
    }
  ],

  resolutionStrategies: [
    {
      id: "recommendations",
      label: "Use recommendations..."
    },
    {
      id: "prefer_apollo",
      label: "Always prefer Apollo.io"
    },
    {
      id: "prefer_zoominfo",
      label: "Always prefer ZoomInfo"
    },
    {
      id: "manual",
      label: "Review each conflict manually"
    }
  ]
}`}
              </pre>
            </div>
          </div>

          {/* Conflict Details */}
          <div className="space-y-6">
            {/* Statistics */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
                <span>📊</span>
                Conflict Statistics
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded">
                  <span className="text-sm font-medium text-orange-900">Total Conflicts</span>
                  <span className="text-xl font-bold text-orange-700">
                    {dataConflictData.conflictCount}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                  <span className="text-sm font-medium text-blue-900">Total Fields Enriched</span>
                  <span className="text-xl font-bold text-blue-700">
                    {dataConflictData.totalFields}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                  <span className="text-sm font-medium text-green-900">Conflict Rate</span>
                  <span className="text-xl font-bold text-green-700">
                    {Math.round((dataConflictData.conflictCount / dataConflictData.totalFields) * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Conflict Breakdown */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
                <span>⚖️</span>
                Confidence Comparison
              </h2>
              <div className="space-y-4">
                {dataConflictData.conflicts.map((conflict, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded">
                    <div className="font-medium text-gray-900 mb-2">{conflict.fieldLabel}</div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-blue-600 font-medium w-20">Apollo:</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500"
                            style={{ width: `${conflict.apollo.confidence}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-blue-700 w-10 text-right">
                          {conflict.apollo.confidence}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-purple-600 font-medium w-20">ZoomInfo:</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500"
                            style={{ width: `${conflict.zoominfo.confidence}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-purple-700 w-10 text-right">
                          {conflict.zoominfo.confidence}%
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      Recommended: {conflict.recommendation === 'apollo' ? 'Apollo.io' : 'ZoomInfo'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Conflict Details Table */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
            <span>📋</span>
            Detailed Conflict Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Field</th>
                  <th className="text-left py-3 px-4 font-semibold text-blue-900">Apollo.io</th>
                  <th className="text-left py-3 px-4 font-semibold text-purple-900">ZoomInfo</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Recommended</th>
                </tr>
              </thead>
              <tbody>
                {dataConflictData.conflicts.map((conflict, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{conflict.fieldLabel}</td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-900">{conflict.apollo.value}</div>
                      <div className="text-xs text-blue-600">
                        {conflict.apollo.confidence}% confidence
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-900">{conflict.zoominfo.value}</div>
                      <div className="text-xs text-purple-600">
                        {conflict.zoominfo.confidence}% confidence
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          conflict.recommendation === 'apollo'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {conflict.recommendation === 'apollo' ? 'Apollo.io' : 'ZoomInfo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              <p className="text-gray-500 italic">
                No actions yet. Trigger the data conflict modal to see logs.
              </p>
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
      <DataConflictModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          addLog('Modal closed without resolution');
        }}
        onAccept={handleAccept}
        onUseAllApollo={handleUseAllApollo}
        onUseAllZoomInfo={handleUseAllZoomInfo}
      />
    </div>
  );
}
