import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, Loader2, XCircle, Zap, RotateCcw } from 'lucide-react';
import type { EnrichmentProgressState, EnrichedFieldData } from '../../types/enrichmentProgress';

interface RealTimeEnrichmentProgressProps {
  progressState: EnrichmentProgressState;
  onComplete?: () => void;
  onRetryField?: (fieldId: string) => void;
}

export function RealTimeEnrichmentProgress({
  progressState,
  onComplete,
  onRetryField
}: RealTimeEnrichmentProgressProps) {
  const [completedFieldIds, setCompletedFieldIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (progressState.status === 'completed' && onComplete) {
      const timer = setTimeout(onComplete, 1000);
      return () => clearTimeout(timer);
    }
  }, [progressState.status, onComplete]);

  useEffect(() => {
    const newCompleted = new Set(completedFieldIds);
    let hasNewCompletions = false;

    progressState.categories.forEach(category => {
      category.fields.forEach(field => {
        if (field.status === 'completed' && !completedFieldIds.has(field.fieldId)) {
          newCompleted.add(field.fieldId);
          hasNewCompletions = true;
        }
      });
    });

    if (hasNewCompletions) {
      setCompletedFieldIds(newCompleted);
    }
  }, [progressState]);

  const getStatusIcon = (status: EnrichedFieldData['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'enriching':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'queued':
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: EnrichedFieldData['status']) => {
    switch (status) {
      case 'completed':
        return <span className="text-green-600 font-medium">✅ Enriched</span>;
      case 'enriching':
        return <span className="text-blue-600 font-medium">🔄 Enriching...</span>;
      case 'failed':
        return <span className="text-red-600 font-medium">❌ Failed</span>;
      case 'queued':
      default:
        return <span className="text-gray-500">⏳ Queued</span>;
    }
  };

  const isFieldJustCompleted = (fieldId: string) => {
    return completedFieldIds.has(fieldId);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            📋 ENRICHED FIELDS ({progressState.completedFields}/{progressState.totalFields} fields)
            {progressState.status === 'enriching' && (
              <span className="text-blue-600 text-base font-normal ml-2">- Enriching...</span>
            )}
          </h3>
        </div>

        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {progressState.message ? progressState.message : (
                <>
                  {progressState.status === 'preparing' && '🔄 Preparing to enrich fields...'}
                  {progressState.status === 'enriching' && `Enriching field ${progressState.completedFields + 1} of ${progressState.totalFields}...`}
                  {progressState.status === 'completed' && (
                    <>
                      ✅ Enrichment complete!
                      {progressState.duration && ` (${progressState.duration})`}
                    </>
                  )}
                </>
              )}
            </span>
            <span className="font-semibold text-gray-900">
              {Math.round(progressState.overallProgress)}%
            </span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out"
              style={{ width: `${progressState.overallProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Field Categories */}
      <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
        {progressState.categories.map((category) => (
          <div key={category.id}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900 uppercase text-sm tracking-wide">
                {category.name} ({category.completedFields}/{category.totalFields} fields)
              </h4>
            </div>
            <div className="h-px bg-gray-200 mb-4" />

            <div className="space-y-3">
              {category.fields.map((field) => (
                <FieldCard
                  key={field.fieldId}
                  field={field}
                  isJustCompleted={isFieldJustCompleted(field.fieldId)}
                  onRetry={onRetryField}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface FieldCardProps {
  field: EnrichedFieldData;
  isJustCompleted: boolean;
  onRetry?: (fieldId: string) => void;
}

function FieldCard({ field, isJustCompleted, onRetry }: FieldCardProps) {
  const [showHighlight, setShowHighlight] = useState(false);

  useEffect(() => {
    if (field.status === 'completed' && isJustCompleted) {
      setShowHighlight(true);
      const timer = setTimeout(() => setShowHighlight(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [field.status, isJustCompleted]);

  const getStatusIcon = () => {
    switch (field.status) {
      case 'completed':
        return '✅';
      case 'enriching':
        return '🔄';
      case 'failed':
        return '❌';
      case 'queued':
      default:
        return '⏳';
    }
  };

  const getStatusLabel = () => {
    switch (field.status) {
      case 'completed':
        return <span className="text-green-600 font-medium">Enriched</span>;
      case 'enriching':
        return <span className="text-blue-600 font-medium">Enriching...</span>;
      case 'failed':
        return <span className="text-red-600 font-medium">Failed</span>;
      case 'queued':
      default:
        return <span className="text-gray-500">Queued</span>;
    }
  };

  return (
    <div
      className={`border-2 rounded-lg p-4 transition-all duration-500 ${
        showHighlight
          ? 'border-green-500 bg-green-50 shadow-lg scale-[1.02]'
          : field.status === 'completed'
          ? 'border-green-200 bg-green-50'
          : field.status === 'enriching'
          ? 'border-blue-300 bg-blue-50'
          : field.status === 'failed'
          ? 'border-red-200 bg-red-50'
          : 'border-gray-200 bg-white'
      }`}
    >
      {/* Field Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{field.fieldIcon}</span>
          <span className="font-medium text-gray-900">{field.fieldName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">{getStatusIcon()}</span>
          {getStatusLabel()}
        </div>
      </div>

      {/* Progress Bar for Enriching State */}
      {field.status === 'enriching' && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">
              {field.statusMessage || 'Processing...'}
            </span>
            {field.estimatedTimeRemaining && (
              <span className="text-xs text-blue-600 font-medium">
                ~{field.estimatedTimeRemaining}
              </span>
            )}
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300 ease-out animate-pulse"
              style={{ width: `${field.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Skeleton Loading for Queued State */}
      {field.status === 'queued' && (
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {field.statusMessage || 'Waiting for API response...'}
            </p>
            {field.queuePosition !== undefined && (
              <span className="text-xs text-gray-500 font-medium">
                Position #{field.queuePosition}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Before/After Values for Completed State */}
      {field.status === 'completed' && (
        <div className="space-y-2">
          {field.beforeValue && (
            <div className="text-sm">
              <span className="text-gray-600">Before: </span>
              <span className="text-gray-800 line-through">{field.beforeValue}</span>
            </div>
          )}
          {field.afterValue && (
            <div className="text-sm">
              <span className="text-gray-600">After: </span>
              <span className="text-gray-900 font-medium">{field.afterValue}</span>
            </div>
          )}
          {field.source && field.confidence && (
            <div className="text-xs text-gray-600">
              Source: {field.source} ({field.confidence}%) • {field.timestamp}
            </div>
          )}
        </div>
      )}

      {/* Error Message for Failed State */}
      {field.status === 'failed' && (
        <div className="space-y-2">
          {field.error && (
            <div className="text-sm text-red-600">
              {field.error}
            </div>
          )}
          {onRetry && (
            <button
              onClick={() => onRetry(field.fieldId)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Retry Enrichment
            </button>
          )}
        </div>
      )}
    </div>
  );
}
