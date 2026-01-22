import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, RotateCcw, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RealTimeEnrichmentProgress } from '../../components/LeadGeneration/RealTimeEnrichmentProgress';
import { simulateEnrichmentProgress, initialEnrichmentState } from '../../utils/enrichmentProgressMockData';
import type { EnrichmentProgressState } from '../../types/enrichmentProgress';

export function RealTimeProgressDemo() {
  const navigate = useNavigate();
  const [progressState, setProgressState] = useState<EnrichmentProgressState>(initialEnrichmentState);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [abortFn, setAbortFn] = useState<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      if (abortFn) {
        abortFn();
      }
    };
  }, [abortFn]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleStart = () => {
    if (isRunning) return;

    addLog('🚀 Starting real-time enrichment...');
    setIsRunning(true);

    const abort = simulateEnrichmentProgress(
      (state) => {
        setProgressState(state);

        if (state.status === 'enriching') {
          const currentField = state.categories
            .flatMap(c => c.fields)
            .find(f => f.status === 'enriching');

          if (currentField && currentField.progress === 0) {
            addLog(`🔄 Enriching ${currentField.fieldName}...`);
          }
        }

        state.categories.forEach(category => {
          category.fields.forEach(field => {
            if (field.status === 'completed' && field.progress === 100) {
              const prevField = progressState.categories
                .flatMap(c => c.fields)
                .find(f => f.fieldId === field.fieldId);

              if (prevField?.status !== 'completed') {
                addLog(`✅ Completed: ${field.fieldName} = ${field.afterValue}`);
              }
            }
          });
        });
      },
      () => {
        addLog('🎉 Enrichment completed successfully!');
        addLog(`📊 Total fields enriched: ${progressState.totalFields}`);
        setIsRunning(false);
      }
    );

    setAbortFn(() => abort);
  };

  const handleReset = () => {
    if (abortFn) {
      abortFn();
    }
    setProgressState(JSON.parse(JSON.stringify(initialEnrichmentState)));
    setIsRunning(false);
    setLogs([]);
    addLog('🔄 Reset to initial state');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/lead-generation')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-blue-600" />
                  Real-Time Enrichment Progress
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Field-by-field loading states with live progress tracking
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleStart}
                disabled={isRunning}
                className={`px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all ${
                  isRunning
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow'
                }`}
              >
                <Play className="w-4 h-4" />
                {isRunning ? 'Running...' : 'Start Enrichment'}
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-2.5 border border-gray-300 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Progress Display - 2 columns */}
          <div className="lg:col-span-2">
            <RealTimeEnrichmentProgress
              progressState={progressState}
              onComplete={() => {
                addLog('✨ All fields enriched successfully!');
              }}
            />
          </div>

          {/* Activity Log - 1 column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 sticky top-6">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="font-semibold text-gray-900">Activity Log</h3>
              </div>
              <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto font-mono text-xs">
                {logs.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No activity yet. Click "Start Enrichment" to begin.
                  </p>
                ) : (
                  logs.map((log, index) => (
                    <div
                      key={index}
                      className="text-gray-700 py-1 border-b border-gray-100 last:border-0"
                    >
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Feature Highlights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div className="flex items-start gap-2">
              <span className="text-blue-600">✓</span>
              <div>
                <strong>Real-time Progress:</strong> Watch fields enrich one by one with live progress bars
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600">✓</span>
              <div>
                <strong>Field States:</strong> Queued → Enriching → Completed transitions
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600">✓</span>
              <div>
                <strong>Visual Feedback:</strong> Green highlight animation on field completion
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600">✓</span>
              <div>
                <strong>Grouped Categories:</strong> Contact, Company, Professional, Social
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600">✓</span>
              <div>
                <strong>Before/After Values:</strong> See what changed during enrichment
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600">✓</span>
              <div>
                <strong>Source Attribution:</strong> Data source and confidence scores shown
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
