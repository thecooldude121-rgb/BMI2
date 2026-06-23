import React from 'react';
import { CheckCircle, XCircle, GitMerge, AlertTriangle, Zap, ExternalLink, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ImportProgress, ImportResult } from './types';

type Props = {
  progress: ImportProgress | null;
  result: ImportResult | null;
  onClose: () => void;
  onImportAnother: () => void;
};

export default function Step6Results({ progress, result, onClose, onImportAnother }: Props) {
  const navigate = useNavigate();
  const isRunning = progress !== null && result === null;

  const pct = progress
    ? progress.total === 0 ? 100 : Math.round((progress.processed / progress.total) * 100)
    : 100;

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      {isRunning ? (
        <>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Importing leads…</h2>
            <p className="text-sm text-gray-500 mt-1">
              Processing {progress!.processed.toLocaleString()} of {progress!.total.toLocaleString()} rows
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 bg-blue-600 rounded-full transition-all duration-150"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{progress!.processed.toLocaleString()} processed</span>
              <span>{pct}%</span>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center">Don't close this window during import.</p>
        </>
      ) : result ? (
        <>
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Import complete</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {result.imported.toLocaleString()} lead{result.imported !== 1 ? 's' : ''} successfully imported.
              </p>
            </div>
          </div>

          {/* Result cards */}
          <div className="space-y-2">
            {result.imported > 0 && (
              <div className="flex items-center justify-between p-3.5 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-2.5 text-sm font-medium text-green-800">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Imported
                </div>
                <span className="text-lg font-bold text-green-700">{result.imported.toLocaleString()}</span>
              </div>
            )}

            {result.failed > 0 && (
              <div className="flex items-center justify-between p-3.5 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-2.5 text-sm font-medium text-red-800">
                  <XCircle className="h-4 w-4 text-red-600" />
                  Failed
                </div>
                <span className="text-lg font-bold text-red-700">{result.failed.toLocaleString()}</span>
              </div>
            )}

            {result.duplicatesSkipped > 0 && (
              <div className="flex items-center justify-between p-3.5 bg-purple-50 border border-purple-200 rounded-xl">
                <div className="flex items-center gap-2.5 text-sm font-medium text-purple-800">
                  <GitMerge className="h-4 w-4 text-purple-600" />
                  Duplicates skipped
                </div>
                <span className="text-lg font-bold text-purple-700">{result.duplicatesSkipped.toLocaleString()}</span>
              </div>
            )}

            {result.duplicatesMergeQueued > 0 && (
              <div className="flex items-center justify-between p-3.5 bg-purple-50 border border-purple-200 rounded-xl">
                <div className="flex items-center gap-2.5 text-sm font-medium text-purple-800">
                  <GitMerge className="h-4 w-4 text-purple-600" />
                  Added to merge review
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-purple-700">{result.duplicatesMergeQueued.toLocaleString()}</span>
                  <button
                    onClick={() => navigate('/crm/leads?tag=merge-candidate')}
                    className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 underline font-medium"
                  >
                    Review <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            {result.errorRowsSkipped > 0 && (
              <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-2.5 text-sm font-medium text-gray-700">
                  <XCircle className="h-4 w-4 text-gray-400" />
                  Error rows skipped
                </div>
                <span className="text-lg font-bold text-gray-500">{result.errorRowsSkipped.toLocaleString()}</span>
              </div>
            )}

            {result.warnings > 0 && (
              <div className="flex items-center justify-between p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-center gap-2.5 text-sm font-medium text-amber-800">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Imported with warnings
                </div>
                <span className="text-lg font-bold text-amber-700">{result.warnings.toLocaleString()}</span>
              </div>
            )}

            {result.enrichmentQueued > 0 && (
              <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-xl">
                <div className="flex items-center gap-2.5 text-sm font-medium text-purple-800">
                  <Zap className="h-4 w-4 text-purple-500" />
                  Queued for enrichment
                </div>
                <span className="text-lg font-bold text-purple-700">{result.enrichmentQueued.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onImportAnother}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Import another file
            </button>
            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Done — view leads
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
