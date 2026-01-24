import React, { useState, useEffect } from 'react';
import { ArrowLeft, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RealTimeEnrichmentProgress } from '../../components/LeadGeneration/RealTimeEnrichmentProgress';
import { simulateEnrichmentProgress, initialEnrichmentState } from '../../utils/enrichmentProgressMockData';
import type { EnrichmentProgressState, FieldHistoryEntry } from '../../types/enrichmentProgress';

export default function FieldLevelActionsDemo() {
  const navigate = useNavigate();
  const [progressState, setProgressState] = useState<EnrichmentProgressState>(initialEnrichmentState);
  const [activityLog, setActivityLog] = useState<string[]>([]);

  useEffect(() => {
    const abort = simulateEnrichmentProgress(
      setProgressState,
      () => {
        setActivityLog(prev => [...prev, '✅ Enrichment completed successfully']);
      }
    );

    return () => abort();
  }, []);

  const handleEditField = (
    fieldId: string,
    newValue: string,
    reason: string,
    notes: string,
    markAsVerified: boolean
  ) => {
    setProgressState(prevState => {
      const newState = { ...prevState };

      newState.categories.forEach(category => {
        category.fields.forEach(field => {
          if (field.fieldId === fieldId) {
            const historyEntry: FieldHistoryEntry = {
              timestamp: new Date().toISOString(),
              action: 'edited',
              previousValue: field.afterValue,
              newValue: newValue,
              reason: reason || undefined,
              notes: notes || undefined,
              userName: 'Current User'
            };

            field.afterValue = newValue;
            field.isVerified = markAsVerified;
            field.history = [...(field.history || []), historyEntry];
          }
        });
      });

      return newState;
    });

    setActivityLog(prev => [
      ...prev,
      `✏️ Edited field "${fieldId}": ${newValue}${markAsVerified ? ' (marked as verified)' : ''}`
    ]);
  };

  const handleRevertField = (fieldId: string) => {
    setProgressState(prevState => {
      const newState = { ...prevState };

      newState.categories.forEach(category => {
        category.fields.forEach(field => {
          if (field.fieldId === fieldId) {
            const historyEntry: FieldHistoryEntry = {
              timestamp: new Date().toISOString(),
              action: 'reverted',
              previousValue: field.afterValue,
              newValue: field.beforeValue,
              userName: 'Current User'
            };

            field.afterValue = field.beforeValue;
            field.isVerified = false;
            field.history = [...(field.history || []), historyEntry];
          }
        });
      });

      return newState;
    });

    setActivityLog(prev => [...prev, `🔄 Reverted field "${fieldId}" to API value`]);
  };

  const handleRetryField = (fieldId: string) => {
    setActivityLog(prev => [...prev, `🔄 Retrying enrichment for field "${fieldId}"`]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gap 4: Field-Level Actions Demo
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Test manual field editing, verification, and history tracking
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RealTimeEnrichmentProgress
              progressState={progressState}
              onComplete={() => {
                console.log('Enrichment complete!');
              }}
              onRetryField={handleRetryField}
              onEditField={handleEditField}
              onRevertField={handleRevertField}
            />
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">How to Test</h3>
              </div>

              <div className="space-y-4 text-sm text-gray-700">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">1. Wait for Enrichment</h4>
                  <p className="text-gray-600">
                    Watch as fields are automatically enriched with data from various sources.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">2. Edit Fields</h4>
                  <p className="text-gray-600">
                    Click the edit button on completed or failed fields to manually edit values.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">3. Mark as Verified</h4>
                  <p className="text-gray-600">
                    Check the "Mark as verified" box to prevent future enrichments from overriding your changes.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">4. Revert Changes</h4>
                  <p className="text-gray-600">
                    Use the "Revert to API Value" button to restore the original enriched value.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">5. Retry Failed Fields</h4>
                  <p className="text-gray-600">
                    Click "Retry Enrichment" on failed fields to attempt enrichment again.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Activity Log</h3>

              {activityLog.length === 0 ? (
                <p className="text-sm text-gray-500 italic">
                  No activities yet. Actions will appear here.
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {activityLog.map((activity, index) => (
                    <div
                      key={index}
                      className="text-sm p-3 bg-gray-50 rounded border border-gray-200"
                    >
                      {activity}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Features Implemented</h3>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <span className="text-gray-700">Edit field manually</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <span className="text-gray-700">Show current enrichment data</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <span className="text-gray-700">Reason for change dropdown</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <span className="text-gray-700">Additional notes textarea</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <span className="text-gray-700">Mark as verified checkbox</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <span className="text-gray-700">Change impact summary</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <span className="text-gray-700">Revert to API value</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <span className="text-gray-700">Field history tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <span className="text-gray-700">Format hints for fields</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <span className="text-gray-700">Edit button on field cards</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
