import React from 'react';
import { X, ExternalLink, RotateCcw, CheckCircle, TrendingUp, Building, User, Briefcase } from 'lucide-react';
import { CRMUpdate } from '../../utils/meetingTranscriptMockData';

interface CRMUpdatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  crmUpdates: CRMUpdate[];
  onViewInCRM?: (update: CRMUpdate) => void;
  onUndoUpdate?: (update: CRMUpdate) => void;
}

const CRMUpdatesModal: React.FC<CRMUpdatesModalProps> = ({
  isOpen,
  onClose,
  crmUpdates,
  onViewInCRM,
  onUndoUpdate
}) => {
  if (!isOpen) return null;

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'deal':
        return <Briefcase className="w-4 h-4" />;
      case 'contact':
        return <User className="w-4 h-4" />;
      case 'account':
        return <Building className="w-4 h-4" />;
      case 'opportunity':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Briefcase className="w-4 h-4" />;
    }
  };

  const getEntityColor = (type: string) => {
    switch (type) {
      case 'deal':
        return 'text-blue-600 bg-blue-50';
      case 'contact':
        return 'text-green-600 bg-green-50';
      case 'account':
        return 'text-purple-600 bg-purple-50';
      case 'opportunity':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">CRM Updates</h2>
              <p className="text-sm text-gray-500">{crmUpdates.length} automatic updates made</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {crmUpdates.map((update, index) => (
            <div
              key={update.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getEntityColor(update.entityType)}`}>
                    {getEntityIcon(update.entityType)}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {update.entityType}
                    </div>
                    <div className="text-sm font-medium text-gray-900">{update.entityName}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                    {update.confidence}% Confidence
                  </span>
                  <span className="text-xs text-gray-500">{update.timestamp}</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Field Updated</div>
                  <div className="text-sm font-semibold text-gray-900">{update.field}</div>
                </div>

                {update.oldValue && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="text-xs text-gray-500">From</div>
                      <div className="text-sm text-gray-700 line-through">{update.oldValue}</div>
                    </div>
                    <div className="text-gray-400">→</div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-500">To</div>
                      <div className="text-sm font-medium text-gray-900">{update.newValue}</div>
                    </div>
                  </div>
                )}

                {!update.oldValue && (
                  <div>
                    <div className="text-xs text-gray-500">New Value</div>
                    <div className="text-sm font-medium text-gray-900">{update.newValue}</div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-3">
                {onViewInCRM && (
                  <button
                    onClick={() => onViewInCRM(update)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View in CRM
                  </button>
                )}
                {onUndoUpdate && update.canUndo && (
                  <button
                    onClick={() => onUndoUpdate(update)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Undo
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>All updates applied successfully</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CRMUpdatesModal;
