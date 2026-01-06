import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { johnSmithEnrichmentData, type JohnSmithDataSource } from '../../utils/johnSmithEnrichmentData';
import { useToast } from '../../contexts/ToastContext';

export default function JohnSmithEnrichmentPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const data = johnSmithEnrichmentData;

  const [isEnriching, setIsEnriching] = useState(true);
  const [enrichProgress, setEnrichProgress] = useState(0);
  const [dataSources, setDataSources] = useState(data.dataSources);
  const [estimatedTime, setEstimatedTime] = useState(5);
  const [enrichedFieldsCount, setEnrichedFieldsCount] = useState(0);

  useEffect(() => {
    if (!isEnriching) return;

    const interval = setInterval(() => {
      setEnrichProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsEnriching(false);
          addToast('✅ Successfully enriched 15 fields for John Smith', 'success');
          setTimeout(() => {
            navigate('/lead-generation/leads/lead_002/enrichment');
          }, 1500);
          return 100;
        }
        return Math.min(100, prev + 2.5);
      });

      setEstimatedTime(prev => Math.max(0, prev - 0.12));

      setDataSources(current => current.map(source => {
        if (source.status === 'fetching') {
          const newProgress = Math.min(100, source.progress + 3.5);
          if (newProgress >= 100) {
            const fieldsEnriched = source.id === 'apollo' ? 9 : 6;
            setEnrichedFieldsCount(prev => prev + fieldsEnriched);
            return { ...source, status: 'success' as const, progress: 100 };
          }
          return { ...source, progress: newProgress };
        }
        if ((source.status === 'waiting' || source.status === 'queued') && enrichProgress > 55) {
          return { ...source, status: 'fetching' as const, progress: 5 };
        }
        return source;
      }));
    }, 150);

    return () => clearInterval(interval);
  }, [isEnriching, enrichProgress, addToast, navigate]);

  const getScoreDots = (score: number) => {
    const filled = Math.floor(score / 10);
    const dots = [];
    for (let i = 0; i < 10; i++) {
      dots.push(
        <span key={i} className={i < filled ? 'text-green-500' : 'text-gray-300'}>
          ●
        </span>
      );
    }
    return dots;
  };

  const handleCancel = () => {
    setIsEnriching(false);
    addToast('⚠️ Enrichment cancelled', 'info');
    navigate('/lead-generation/leads');
  };

  const getStatusMessage = () => {
    if (enrichProgress === 0) {
      return '🔄 Starting enrichment...';
    } else if (enrichProgress < 50) {
      return '🔄 Enriching... (Fetching from Apollo.io)';
    } else if (enrichProgress < 100) {
      return '🔄 Enriching... (Fetching from ZoomInfo)';
    } else {
      return '✅ Enrichment complete!';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/lead-generation/leads')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <span className="text-xl">←</span>
              <span className="font-medium">Back to Lead Details</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">LEAD ENRICHMENT</h1>
            <div className="w-48"></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">👤</span>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">
                {data.leadName} - {data.leadTitle} @ {data.leadCompany}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-medium text-gray-700">{data.source}</span>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm font-medium text-gray-900">{data.score}/100</span>
                <span className="text-xs">{getScoreDots(data.score)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Status:</span>
                <span className="flex items-center gap-1 text-sm text-blue-600 font-medium">
                  {getStatusMessage()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Fields Enriched:</span>
                <span className="text-sm text-gray-900 font-semibold">
                  {enrichedFieldsCount} / 15
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Started:</span>
                <span className="text-sm text-gray-600">{data.startedAt}</span>
              </div>
            </div>

            <div className="flex-shrink-0">
              <button
                disabled
                className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed font-medium flex items-center gap-2 whitespace-nowrap"
              >
                <span className="animate-spin">🔄</span>
                <span>Enriching...</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>📊</span>
            <span>ENRICHMENT DATA SOURCES</span>
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {dataSources.map((source) => (
              <DataSourceCard key={source.id} source={source} onCancel={handleCancel} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>📋</span>
            <span>ENRICHED FIELDS ({enrichedFieldsCount} / 15 fields) {enrichedFieldsCount < 15 ? '- Loading...' : '- Complete!'}</span>
          </h3>

          <div className="border border-gray-200 rounded-lg p-8">
            <div className="text-center space-y-4">
              <div className="text-blue-600 text-lg font-medium">
                🔄 Fetching data from Apollo.io and ZoomInfo...
              </div>

              <div className="max-w-md mx-auto">
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${enrichProgress}%` }}
                  />
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  {enrichProgress}% Complete
                </div>
              </div>

              <div className="text-sm text-gray-600">
                ⏱️ Estimated time remaining: {Math.ceil(estimatedTime)} seconds
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <span>💡</span>
                  <span>Pro Tip: First-time enrichment may take 5-10 seconds</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>📜</span>
            <span>ENRICHMENT HISTORY</span>
          </h3>

          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <div className="text-lg font-medium text-gray-900 mb-2">
              No enrichment history yet
            </div>
            <div className="text-sm text-gray-600">
              This lead has never been enriched before
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DataSourceCard({
  source,
  onCancel
}: {
  source: JohnSmithDataSource;
  onCancel: () => void;
}) {
  const getStatusDisplay = () => {
    switch (source.status) {
      case 'fetching':
        return (
          <>
            <span className="text-blue-600 font-medium">🔄 Fetching...</span>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${source.progress}%` }}
                />
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Progress: {source.progress}%
              </div>
            </div>
          </>
        );
      case 'waiting':
      case 'queued':
        return (
          <>
            <span className="text-gray-500 font-medium">⏳ Waiting...</span>
            <div className="text-sm text-gray-600 mt-2">Queued</div>
          </>
        );
      case 'success':
        return (
          <>
            <span className="text-green-600 font-medium">✅ Complete</span>
            <div className="text-sm text-gray-600 mt-2">Data retrieved</div>
          </>
        );
      case 'error':
        return (
          <>
            <span className="text-red-600 font-medium">❌ Failed</span>
            <div className="text-sm text-gray-600 mt-2">Error occurred</div>
          </>
        );
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{source.icon}</span>
        <span className="font-bold text-gray-900">{source.name}</span>
      </div>

      <div className="mb-3">
        {getStatusDisplay()}
      </div>

      {source.status !== 'success' && (
        <div className="space-y-2">
          <div className="text-sm text-gray-600">
            Est. time: {source.estimatedTime}
          </div>
          <button
            onClick={onCancel}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1"
          >
            <span>⏸️</span>
            <span>Cancel</span>
          </button>
        </div>
      )}

      {source.status === 'success' && (
        <div className="text-sm text-green-600 font-medium">
          ✓ Ready
        </div>
      )}
    </div>
  );
}
