import React from 'react';
import { X, User, Zap, AlertCircle } from 'lucide-react';
import {
  formatFieldTimestamp,
  getFieldHistoryIcon,
  getFieldHistoryColor
} from '../../utils/fieldLevelActionsMockData';

interface FieldHistoryEntry {
  id: string;
  timestamp: string;
  type: string;
  user?: string;
  source?: string;
  oldValue: string | null;
  newValue: string | null;
  reason?: string;
  note?: string;
  verified?: boolean;
  confidence?: number;
  sourceDetail?: string;
  error?: string;
}

interface FieldHistoryModalProps {
  fieldName: string;
  fieldIcon: string;
  history: FieldHistoryEntry[];
  isOpen: boolean;
  onClose: () => void;
}

export function FieldHistoryModal({
  fieldName,
  fieldIcon,
  history,
  isOpen,
  onClose
}: FieldHistoryModalProps) {
  if (!isOpen) return null;

  const sortedHistory = [...history].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'manual_edit':
        return 'Manual Edit';
      case 'api_enrichment':
        return 'API Enrichment';
      case 'api_enrichment_failed':
        return 'Enrichment Failed';
      case 'lead_created':
        return 'Lead Created';
      case 'verified':
        return 'Verified';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Change';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📜</span>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Field History
                </h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  {fieldIcon} {fieldName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-4">
            {sortedHistory.map((entry, index) => (
              <div
                key={entry.id}
                className={`relative pl-8 pb-6 ${
                  index === sortedHistory.length - 1 ? 'pb-0' : ''
                }`}
              >
                {index !== sortedHistory.length - 1 && (
                  <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-gray-200" />
                )}

                <div
                  className={`absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center border-2 ${getFieldHistoryColor(
                    entry.type
                  )}`}
                >
                  <span className="text-xs">
                    {getFieldHistoryIcon(entry.type)}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {getTypeLabel(entry.type)}
                        </h3>
                        {entry.verified && (
                          <span className="px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded">
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatFieldTimestamp(entry.timestamp)}
                      </p>
                    </div>

                    {(entry.user || entry.source) && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        {entry.user ? (
                          <>
                            <User className="w-3.5 h-3.5" />
                            <span>{entry.user}</span>
                          </>
                        ) : entry.source ? (
                          <>
                            <Zap className="w-3.5 h-3.5" />
                            <span className="capitalize">{entry.source}</span>
                          </>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {entry.oldValue !== undefined && entry.newValue !== undefined && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">
                            Previous Value
                          </p>
                          <p className="text-gray-900 font-mono text-xs bg-white border border-gray-200 rounded px-2 py-1.5">
                            {entry.oldValue || (
                              <span className="text-gray-400 italic">Empty</span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">
                            New Value
                          </p>
                          <p className="text-gray-900 font-mono text-xs bg-white border border-gray-200 rounded px-2 py-1.5">
                            {entry.newValue || (
                              <span className="text-gray-400 italic">Empty</span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    {entry.error && (
                      <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded text-sm">
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-red-900">Error</p>
                          <p className="text-red-700 text-xs mt-0.5">{entry.error}</p>
                        </div>
                      </div>
                    )}

                    {entry.confidence && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="font-medium">Confidence:</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                entry.confidence >= 90
                                  ? 'bg-green-500'
                                  : entry.confidence >= 70
                                  ? 'bg-yellow-500'
                                  : 'bg-orange-500'
                              }`}
                              style={{ width: `${entry.confidence}%` }}
                            />
                          </div>
                          <span className="font-medium">{entry.confidence}%</span>
                        </div>
                      </div>
                    )}

                    {entry.sourceDetail && (
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Source Details:</span>{' '}
                        {entry.sourceDetail}
                      </p>
                    )}

                    {entry.reason && (
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs font-medium text-gray-700 mb-1">
                          Reason for Change
                        </p>
                        <p className="text-xs text-gray-600">{entry.reason}</p>
                      </div>
                    )}

                    {entry.note && (
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs font-medium text-gray-700 mb-1">
                          Additional Notes
                        </p>
                        <p className="text-xs text-gray-600 italic">"{entry.note}"</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {sortedHistory.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                <AlertCircle className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-gray-600">No history available for this field</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {sortedHistory.length} {sortedHistory.length === 1 ? 'change' : 'changes'}{' '}
            recorded
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
