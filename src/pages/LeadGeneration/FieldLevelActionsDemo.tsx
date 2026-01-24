import React, { useState, useEffect } from 'react';
import { ArrowLeft, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RealTimeEnrichmentProgress } from '../../components/LeadGeneration/RealTimeEnrichmentProgress';
import { EditFieldModal } from '../../components/LeadGeneration/EditFieldModal';
import { FieldHistoryModal } from '../../components/LeadGeneration/FieldHistoryModal';
import { simulateEnrichmentProgress, initialEnrichmentState } from '../../utils/enrichmentProgressMockData';
import {
  fieldLevelActionsData,
  emailFieldData,
  linkedinFieldData,
  githubFieldData
} from '../../utils/fieldLevelActionsMockData';
import type { EnrichmentProgressState, FieldHistoryEntry, EnrichedFieldData } from '../../types/enrichmentProgress';

export default function FieldLevelActionsDemo() {
  const navigate = useNavigate();
  const [progressState, setProgressState] = useState<EnrichmentProgressState>(initialEnrichmentState);
  const [activityLog, setActivityLog] = useState<string[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<EnrichedFieldData | null>(null);
  const [fieldHistories, setFieldHistories] = useState<Record<string, any[]>>({
    direct_phone: fieldLevelActionsData.fieldHistory,
    email: emailFieldData.fieldHistory,
    linkedin: linkedinFieldData.fieldHistory,
    github: githubFieldData.fieldHistory
  });

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

  const handleVerifyField = (fieldId: string) => {
    setProgressState(prevState => {
      const newState = { ...prevState };

      newState.categories.forEach(category => {
        category.fields.forEach(field => {
          if (field.fieldId === fieldId) {
            field.isVerified = true;
            const historyEntry: FieldHistoryEntry = {
              timestamp: new Date().toISOString(),
              action: 'verified',
              previousValue: field.afterValue,
              newValue: field.afterValue,
              userName: 'Current User'
            };
            field.history = [...(field.history || []), historyEntry];
          }
        });
      });

      return newState;
    });

    setActivityLog(prev => [...prev, `✅ Verified field "${fieldId}"`]);
  };

  const handleViewHistory = (fieldId: string) => {
    let field: EnrichedFieldData | null = null;

    progressState.categories.forEach(category => {
      category.fields.forEach(f => {
        if (f.fieldId === fieldId) {
          field = f;
        }
      });
    });

    if (field) {
      setSelectedField(field);
      setHistoryModalOpen(true);
    }
  };

  const handleRejectField = (fieldId: string) => {
    setProgressState(prevState => {
      const newState = { ...prevState };

      newState.categories.forEach(category => {
        category.fields.forEach(field => {
          if (field.fieldId === fieldId) {
            const historyEntry: FieldHistoryEntry = {
              timestamp: new Date().toISOString(),
              action: 'rejected',
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

    setActivityLog(prev => [...prev, `🚫 Rejected enrichment for field "${fieldId}"`]);
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
              onVerifyField={handleVerifyField}
              onViewHistory={handleViewHistory}
              onRejectField={handleRejectField}
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
                  <h4 className="font-medium text-gray-900 mb-2">2. Hover Over Fields</h4>
                  <p className="text-gray-600">
                    Hover over completed fields to see action buttons: Verify, History, and Reject.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">3. Verify Fields</h4>
                  <p className="text-gray-600">
                    Click "Verify" to mark a field as verified, preventing future auto-overrides.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">4. View History</h4>
                  <p className="text-gray-600">
                    Click "History" to see complete audit trail of all changes to a field.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">5. Reject Enrichment</h4>
                  <p className="text-gray-600">
                    Click "Reject" to revert to the original value before enrichment.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">6. Retry Failed Fields</h4>
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
                  <span className="text-gray-700">Verify field (prevent overrides)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <span className="text-gray-700">View complete field history</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <span className="text-gray-700">Reject enrichment</span>
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
                  <span className="text-gray-700">Format hints for fields</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <span className="text-gray-700">Action buttons on hover</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <span className="text-gray-700">Timeline view of changes</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <span className="text-gray-700">Confidence scores display</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedField && (
        <>
          <EditFieldModal
            field={selectedField}
            isOpen={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            onSave={handleEditField}
            onRevert={handleRevertField}
          />

          <FieldHistoryModal
            fieldName={selectedField.fieldName}
            fieldIcon={selectedField.fieldIcon}
            history={fieldHistories[selectedField.fieldId] || selectedField.history || []}
            isOpen={historyModalOpen}
            onClose={() => setHistoryModalOpen(false)}
          />
        </>
      )}
    </div>
  );
}
