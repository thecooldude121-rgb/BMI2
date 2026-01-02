import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle, Loader, Undo } from 'lucide-react';
import { BulkActionType, BULK_ACTION_LABELS } from '../../types/bulkActions';

interface BulkActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: BulkActionType;
  selectedCount: number;
  previewItems: Array<{ id: string; name: string; company: string }>;
  onConfirm: (options: any) => void;
  options?: React.ReactNode;
}

const BulkActionModal: React.FC<BulkActionModalProps> = ({
  isOpen,
  onClose,
  actionType,
  selectedCount,
  previewItems,
  onConfirm,
  options
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const isDestructive = ['delete', 'merge_duplicates'].includes(actionType);

  const handleConfirm = async () => {
    setIsProcessing(true);
    await onConfirm({});
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDestructive ? 'bg-red-50 border-red-200' : 'border-gray-200'}`}>
          <div className="flex items-center space-x-3">
            {isDestructive ? (
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            ) : (
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {BULK_ACTION_LABELS[actionType]}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                This action will affect <span className="font-semibold">{selectedCount}</span> prospect{selectedCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isProcessing}
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Options */}
          {options && (
            <div className="bg-gray-50 rounded-lg p-4">
              {options}
            </div>
          )}

          {/* Preview */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Preview of affected prospects:
            </h3>
            <div className="space-y-2">
              {previewItems.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-600">{item.company}</div>
                  </div>
                </div>
              ))}
              {selectedCount > 5 && (
                <div className="text-sm text-gray-600 text-center py-2">
                  and {selectedCount - 5} more prospect{selectedCount - 5 !== 1 ? 's' : ''}...
                </div>
              )}
            </div>
          </div>

          {/* Warning for destructive actions */}
          {isDestructive && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-900">Warning: This action cannot be undone</p>
                  <p className="text-sm text-red-700 mt-1">
                    {actionType === 'delete'
                      ? 'Deleted prospects will be permanently removed from your database.'
                      : 'Merged prospects cannot be separated after merging.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className={`flex items-center px-6 py-2 rounded-lg transition-colors font-medium disabled:opacity-50 ${
              isDestructive
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>Confirm {BULK_ACTION_LABELS[actionType]}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionModal;
