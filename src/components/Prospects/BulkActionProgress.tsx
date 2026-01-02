import React from 'react';
import { Loader, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { BulkActionResult, BULK_ACTION_LABELS } from '../../types/bulkActions';

interface BulkActionProgressProps {
  action: BulkActionResult;
  onClose: () => void;
}

const BulkActionProgress: React.FC<BulkActionProgressProps> = ({ action, onClose }) => {
  const progress = action.progress;
  const percentage = progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0;

  return (
    <div className="fixed top-4 right-4 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 min-w-[400px] z-50 animate-slide-in">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          {action.status === 'processing' && (
            <Loader className="h-5 w-5 text-blue-600 animate-spin" />
          )}
          {action.status === 'completed' && (
            <CheckCircle className="h-5 w-5 text-green-600" />
          )}
          {action.status === 'failed' && (
            <AlertTriangle className="h-5 w-5 text-red-600" />
          )}
          <div>
            <h3 className="font-semibold text-gray-900">
              {BULK_ACTION_LABELS[action.type]}
            </h3>
            <p className="text-sm text-gray-600">
              {action.status === 'processing' && `Processing ${progress.total} prospects...`}
              {action.status === 'completed' && `Completed ${progress.succeeded} of ${progress.total}`}
              {action.status === 'failed' && `Failed after ${progress.processed} prospects`}
            </p>
          </div>
        </div>
        {action.status !== 'processing' && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="h-4 w-4 text-gray-600" />
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {action.status === 'processing' && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Progress</span>
            <span className="font-semibold text-gray-900">{percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 transition-all duration-300 rounded-full"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
            <span>{progress.processed} / {progress.total} processed</span>
            {progress.failed > 0 && (
              <span className="text-red-600">{progress.failed} failed</span>
            )}
          </div>
        </div>
      )}

      {/* Success Summary */}
      {action.status === 'completed' && (
        <div className="bg-green-50 border border-green-200 rounded p-3 text-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-800 font-medium">Successfully processed</span>
            <span className="text-green-900 font-bold">{progress.succeeded}</span>
          </div>
          {progress.failed > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-red-700">Failed</span>
              <span className="text-red-800 font-semibold">{progress.failed}</span>
            </div>
          )}
        </div>
      )}

      {/* Error Details */}
      {progress.errors.length > 0 && (
        <div className="mt-3 max-h-32 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-700 mb-2">Errors:</p>
          <div className="space-y-1">
            {progress.errors.slice(0, 3).map((error, idx) => (
              <div key={idx} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                {error.error}
              </div>
            ))}
            {progress.errors.length > 3 && (
              <p className="text-xs text-gray-500 text-center py-1">
                +{progress.errors.length - 3} more errors
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkActionProgress;
