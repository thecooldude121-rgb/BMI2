import React, { useState } from 'react';
import {
  DataConflict,
  dataConflictData,
  applyResolutionStrategy,
  getConflictSummary
} from '../../utils/dataConflictMockData';

interface DataConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (conflicts: DataConflict[], strategy: string) => void;
  onUseAllApollo: () => void;
  onUseAllZoomInfo: () => void;
}

export function DataConflictModal({
  isOpen,
  onClose,
  onAccept,
  onUseAllApollo,
  onUseAllZoomInfo
}: DataConflictModalProps) {
  const [conflicts, setConflicts] = useState<DataConflict[]>(dataConflictData.conflicts);
  const [selectedStrategy, setSelectedStrategy] = useState('use_recommendations');

  if (!isOpen) return null;

  const handleStrategyChange = (strategy: string) => {
    setSelectedStrategy(strategy);
    const updatedConflicts = applyResolutionStrategy(dataConflictData.conflicts, strategy);
    setConflicts(updatedConflicts);
  };

  const handleConflictSelection = (index: number, source: 'apollo' | 'zoominfo') => {
    const updatedConflicts = [...conflicts];
    if (source === 'apollo') {
      updatedConflicts[index].apollo.selected = true;
      updatedConflicts[index].zoominfo.selected = false;
    } else {
      updatedConflicts[index].apollo.selected = false;
      updatedConflicts[index].zoominfo.selected = true;
    }
    setConflicts(updatedConflicts);
    setSelectedStrategy('manual_review');
  };

  const summary = getConflictSummary(conflicts);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-orange-50 border-b border-orange-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚠️</span>
              <div>
                <h2 className="text-xl font-bold text-orange-900">DATA CONFLICT DETECTED</h2>
                <p className="text-sm text-orange-700 mt-1">
                  Different data received from Apollo and ZoomInfo
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-orange-600 hover:text-orange-800 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📊</span>
              <h3 className="font-semibold text-gray-900">Conflicting Fields: {dataConflictData.conflictCount}</h3>
            </div>
            <p className="text-sm text-gray-700">
              Apollo and ZoomInfo returned different values for some fields.
              Please review and select which data to use.
            </p>
          </div>

          {/* Conflicts */}
          <div className="space-y-4 mb-6">
            {conflicts.map((conflict, index) => (
              <div key={conflict.field} className="bg-white border-2 border-gray-200 rounded-lg p-5">
                <h3 className="font-semibold text-gray-900 mb-4 text-lg">
                  CONFLICT {index + 1}: {conflict.fieldLabel}
                </h3>

                {/* Apollo Option */}
                <label
                  className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all mb-3 ${
                    conflict.apollo.selected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  onClick={() => handleConflictSelection(index, 'apollo')}
                >
                  <input
                    type="radio"
                    name={`conflict-${index}`}
                    value="apollo"
                    checked={conflict.apollo.selected}
                    onChange={() => handleConflictSelection(index, 'apollo')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">Apollo.io</span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                          Confidence: {conflict.apollo.confidence}%
                        </span>
                      </div>
                    </div>
                    <div className="text-lg font-medium text-gray-900 mb-1">
                      {conflict.apollo.value}
                    </div>
                    <div className="text-sm text-gray-600">
                      Source: {conflict.apollo.source}
                    </div>
                  </div>
                </label>

                {/* ZoomInfo Option */}
                <label
                  className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all mb-3 ${
                    conflict.zoominfo.selected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  onClick={() => handleConflictSelection(index, 'zoominfo')}
                >
                  <input
                    type="radio"
                    name={`conflict-${index}`}
                    value="zoominfo"
                    checked={conflict.zoominfo.selected}
                    onChange={() => handleConflictSelection(index, 'zoominfo')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">ZoomInfo</span>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                          Confidence: {conflict.zoominfo.confidence}%
                        </span>
                      </div>
                    </div>
                    <div className="text-lg font-medium text-gray-900 mb-1">
                      {conflict.zoominfo.value}
                    </div>
                    <div className="text-sm text-gray-600">
                      Source: {conflict.zoominfo.source}
                    </div>
                  </div>
                </label>

                {/* Recommendation */}
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded">
                  <span className="text-lg">💡</span>
                  <div className="text-sm text-blue-900">
                    <span className="font-semibold">Recommendation:</span> Use{' '}
                    {conflict.recommendation === 'apollo' ? 'Apollo' : 'ZoomInfo'} ({conflict.reason})
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Resolution Options */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Resolution Options:</h3>
            <div className="space-y-3">
              {dataConflictData.resolutionOptions.map((option) => (
                <label
                  key={option.id}
                  className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedStrategy === option.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="resolution-strategy"
                    value={option.id}
                    checked={selectedStrategy === option.id}
                    onChange={(e) => handleStrategyChange(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Selection Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-gray-900 mb-3">Current Selection:</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <span className="text-blue-600 font-semibold">Apollo.io:</span>
                <span className="font-bold text-blue-700">{summary.apolloSelected} fields</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-600 font-semibold">ZoomInfo:</span>
                <span className="font-bold text-purple-700">{summary.zoominfoSelected} fields</span>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {dataConflictData.recommendations && dataConflictData.recommendations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <span className="text-lg">💡</span>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Recommendations:</h4>
                  <ul className="space-y-1">
                    {dataConflictData.recommendations.map((rec, idx) => (
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
              <button
                onClick={onUseAllZoomInfo}
                className="px-4 py-2 text-purple-700 bg-purple-50 border border-purple-300 rounded-lg hover:bg-purple-100 font-medium transition-colors flex items-center gap-2"
              >
                <span>🔄</span>
                Use All ZoomInfo
              </button>

              <button
                onClick={onUseAllApollo}
                className="px-4 py-2 text-blue-700 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 font-medium transition-colors flex items-center gap-2"
              >
                <span>🔄</span>
                Use All Apollo
              </button>

              <button
                onClick={() => onAccept(conflicts, selectedStrategy)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center gap-2"
              >
                <span>✅</span>
                Accept Selections
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
