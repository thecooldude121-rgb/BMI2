import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  michaelTorresEnrichmentData,
  michaelTorresEnrichedFields,
  michaelTorresEnrichmentHistory,
  getMichaelTorresFieldsByCategory,
  getMichaelTorresMissingFields,
  type MichaelTorresEnrichedField
} from '../../utils/michaelTorresEnrichmentData';
import { useToast } from '../../contexts/ToastContext';

export default function MichaelTorresEnrichmentPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const data = michaelTorresEnrichmentData;
  const history = michaelTorresEnrichmentHistory;

  const [activeFilter, setActiveFilter] = useState<string>('enriched');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showRetryModal, setShowRetryModal] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryingField, setRetryingField] = useState<string | null>(null);
  const [enrichmentComplete, setEnrichmentComplete] = useState(false);

  const { contactInfo, companyInfo, professionalDetails } = getMichaelTorresFieldsByCategory();
  const missingFields = getMichaelTorresMissingFields();

  const handleRetryZoomInfo = () => {
    setIsRetrying(true);
    addToast('🔄 Retrying ZoomInfo enrichment...', 'info');

    setTimeout(() => {
      setIsRetrying(false);
      const success = Math.random() > 0.5;

      if (success) {
        setEnrichmentComplete(true);
        addToast('✅ ZoomInfo enrichment successful (3 fields added)', 'success');
      } else {
        addToast('❌ ZoomInfo still failing - Check API settings', 'error');
      }
    }, 3000);
  };

  const handleRetryField = (fieldId: string) => {
    setRetryingField(fieldId);
    addToast('🔄 Retrying field enrichment...', 'info');

    setTimeout(() => {
      setRetryingField(null);
      const success = Math.random() > 0.3;

      if (success) {
        addToast('✓ Field updated', 'success');
      } else {
        addToast('Failed to enrich field - retry again', 'error');
      }
    }, 2000);
  };

  const handleEnrichNow = () => {
    addToast('🔄 Starting full enrichment...', 'info');
    setTimeout(() => {
      addToast('✅ All sources enriched successfully', 'success');
    }, 3000);
  };

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

  const getFilteredFields = () => {
    let fields = michaelTorresEnrichedFields;

    if (activeFilter === 'enriched') {
      fields = fields.filter(f => f.status !== 'missing');
    } else if (activeFilter === 'missing') {
      fields = fields.filter(f => f.status === 'missing');
    }

    if (sourceFilter !== 'all') {
      fields = fields.filter(f => f.source === sourceFilter);
    }

    return fields;
  };

  const filteredFields = getFilteredFields();

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
                {data.firstName} {data.lastName} - {data.leadTitle} @ {data.leadCompany}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-medium text-gray-700">{data.source}</span>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm font-medium text-gray-900">{data.score}/100</span>
                <span className="text-xs">{getScoreDots(data.score)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <span className="flex items-center gap-1 text-sm text-orange-600 font-medium">
                ⚠️ Partial enrichment (ZoomInfo failed)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Last Enriched:</span>
              <span className="text-sm text-gray-600">{data.lastEnriched}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleEnrichNow}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
            >
              <span>🔄</span>
              <span>Enrich Now</span>
            </button>
            <button
              onClick={handleRetryZoomInfo}
              disabled={isRetrying}
              className={`px-4 py-2 ${isRetrying ? 'bg-gray-400' : 'bg-orange-600 hover:bg-orange-700'} text-white rounded-lg font-medium flex items-center gap-2`}
            >
              <span>🔄</span>
              <span>{isRetrying ? 'Retrying...' : 'Retry ZoomInfo Only'}</span>
            </button>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium flex items-center gap-2">
              <span>⚙️</span>
              <span>Configure Fields</span>
            </button>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h3 className="font-bold text-orange-900 mb-1">ENRICHMENT WARNING</h3>
              <p className="text-sm text-orange-800 mb-3">
                ZoomInfo API timed out during last enrichment.
                Apollo data (8 fields) was saved successfully.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRetryZoomInfo}
                  className="px-3 py-1.5 bg-orange-600 text-white rounded text-sm font-medium hover:bg-orange-700 flex items-center gap-1"
                >
                  <span>🔄</span>
                  <span>Retry ZoomInfo</span>
                </button>
                <button
                  onClick={() => setShowErrorModal(true)}
                  className="px-3 py-1.5 bg-white border border-orange-300 text-orange-800 rounded text-sm font-medium hover:bg-orange-50"
                >
                  View Error Log
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>📊</span>
            <span>ENRICHMENT DATA SOURCES</span>
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {data.dataSources.map((source) => (
              <DataSourceCard key={source.id} source={source} onRetry={handleRetryZoomInfo} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>📋</span>
              <span>ENRICHED FIELDS ({data.enrichedFields} fields) - Incomplete</span>
            </h3>
            <div className="flex items-center gap-3">
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Fields</option>
                <option value="enriched">Enriched Only</option>
                <option value="missing">Missing Only</option>
              </select>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Sources</option>
                <option value="apollo">Apollo Only</option>
                <option value="zoominfo">ZoomInfo Only</option>
              </select>
            </div>
          </div>

          <div className="space-y-6">
            {filteredFields.length > 0 ? (
              <>
                <FieldSection
                  title="CONTACT INFORMATION"
                  fields={filteredFields.filter(f =>
                    ['email', 'direct_phone', 'linkedin'].includes(f.id)
                  )}
                  onRetry={handleRetryZoomInfo}
                  onRetryField={handleRetryField}
                  retryingField={retryingField}
                />
                <FieldSection
                  title="COMPANY INFORMATION"
                  fields={filteredFields.filter(f =>
                    ['company_size', 'annual_revenue', 'industry', 'company_website', 'company_phone'].includes(f.id)
                  )}
                  onRetry={handleRetryZoomInfo}
                  onRetryField={handleRetryField}
                  retryingField={retryingField}
                />
                <FieldSection
                  title="PROFESSIONAL DETAILS"
                  fields={filteredFields.filter(f =>
                    ['job_title', 'seniority_level', 'department'].includes(f.id)
                  )}
                  onRetry={handleRetryZoomInfo}
                  onRetryField={handleRetryField}
                  retryingField={retryingField}
                />
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No fields match the current filters
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>📜</span>
            <span>ENRICHMENT HISTORY</span>
          </h3>

          <div className="space-y-4">
            {history.map((entry) => (
              <HistoryCard key={entry.id} entry={entry} onRetry={handleRetryZoomInfo} />
            ))}
          </div>
        </div>
      </div>

      {showErrorModal && (
        <ErrorModal
          onClose={() => setShowErrorModal(false)}
          onRetry={handleRetryZoomInfo}
        />
      )}
    </div>
  );
}

function DataSourceCard({
  source,
  onRetry
}: {
  source: any;
  onRetry: () => void;
}) {
  const getStatusDisplay = () => {
    if (source.status === 'connected' || source.status === 'success') {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-medium">✅ Connected</span>
          </div>
          <div className="text-sm text-gray-600">Last Sync: {source.lastSync}</div>
          <div className="text-sm font-medium text-gray-900">{source.fieldsEnriched} fields enriched</div>
          <div className="text-sm text-gray-600">Confidence: {source.confidence}%</div>
          <div className="text-sm text-gray-600">Response Time: {source.responseTime}</div>
        </div>
      );
    } else if (source.status === 'failed' || source.status === 'error') {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-red-600 font-medium">❌ Failed</span>
          </div>
          <div className="text-sm text-red-600 mb-1">Last Sync: {source.lastSync}</div>
          <div className="text-sm font-medium text-gray-900">{source.fieldsEnriched} fields enriched</div>
          {source.responseTime && (
            <div className="text-sm text-red-600">Response Time: {source.responseTime}</div>
          )}
          <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
            <p className="text-xs text-red-800">
              ⚠️ {source.errorMessage || source.error}
            </p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{source.icon}</span>
        <span className="font-bold text-gray-900">{source.name}</span>
      </div>

      {getStatusDisplay()}

      <div className="mt-3 flex items-center gap-2">
        {(source.status === 'failed' || source.status === 'error') && (
          <button
            onClick={onRetry}
            className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
          >
            <span>🔄</span>
            <span>Retry</span>
          </button>
        )}
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View Details
        </button>
      </div>
    </div>
  );
}

function FieldSection({
  title,
  fields,
  onRetry,
  onRetryField,
  retryingField
}: {
  title: string;
  fields: MichaelTorresEnrichedField[];
  onRetry: () => void;
  onRetryField: (fieldId: string) => void;
  retryingField: string | null;
}) {
  if (fields.length === 0) return null;

  const enrichedCount = fields.filter(f => f.status !== 'missing').length;
  const status = enrichedCount === fields.length ? 'COMPLETE' : 'INCOMPLETE';

  return (
    <div>
      <h4 className="text-sm font-bold text-gray-700 mb-3">
        {title} ({enrichedCount} fields - {status})
      </h4>
      <div className="space-y-3">
        {fields.map((field) => (
          <FieldCard
            key={field.id}
            field={field}
            onRetry={onRetry}
            onRetryField={onRetryField}
            isRetrying={retryingField === field.id}
          />
        ))}
      </div>
    </div>
  );
}

function FieldCard({
  field,
  onRetry,
  onRetryField,
  isRetrying
}: {
  field: MichaelTorresEnrichedField;
  onRetry: () => void;
  onRetryField: (fieldId: string) => void;
  isRetrying: boolean;
}) {
  const getSourceBadge = () => {
    if (field.status === 'missing') {
      return (
        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium flex items-center gap-1">
          <span>❌</span>
          <span>Not Available</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium flex items-center gap-1">
        <span>🎯</span>
        <span>{field.source === 'apollo' ? 'Apollo.io' : 'ZoomInfo'}</span>
      </span>
    );
  };

  if (field.status === 'missing') {
    return (
      <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{field.icon}</span>
            <span className="font-medium text-gray-900">{field.label}</span>
          </div>
          {getSourceBadge()}
        </div>
        <div className="space-y-1 text-sm mb-3">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Before:</span>
            <span className="text-gray-400">(empty)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">After:</span>
            <span className="text-gray-400">{isRetrying ? '🔄 Retrying...' : '(empty)'}</span>
          </div>
        </div>
        <div className="bg-orange-100 border border-orange-200 rounded p-2 mb-2">
          <p className="text-xs text-orange-800">
            ⚠️ {field.errorReason}
          </p>
        </div>
        <button
          onClick={() => onRetryField(field.id)}
          disabled={isRetrying}
          className={`text-sm ${isRetrying ? 'text-gray-400' : 'text-orange-600 hover:text-orange-700'} font-medium flex items-center gap-1`}
        >
          <span>🔄</span>
          <span>{isRetrying ? 'Retrying...' : 'Retry ZoomInfo'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{field.icon}</span>
          <span className="font-medium text-gray-900">{field.label}</span>
        </div>
        {getSourceBadge()}
      </div>
      <div className="space-y-1 text-sm mb-2">
        <div className="flex items-start gap-2">
          <span className="text-gray-600 whitespace-nowrap">Before:</span>
          <span className="text-gray-500">{field.before || '(empty)'}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-gray-600 whitespace-nowrap">After:</span>
          <span className="text-green-700 font-medium flex items-center gap-1">
            {field.after}
            <span className="text-green-600">✓</span>
          </span>
        </div>
      </div>
      <div className="text-xs text-gray-500">
        Confidence: {field.confidence}% • Enriched: {field.enrichedAt}
      </div>
    </div>
  );
}

function HistoryCard({
  entry,
  onRetry
}: {
  entry: any;
  onRetry: () => void;
}) {
  const getStatusIcon = () => {
    if (entry.status === 'partial') return '⚠️';
    if (entry.status === 'success') return '✅';
    return '❌';
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{getStatusIcon()}</span>
          <span className="font-medium text-gray-900">{entry.timestamp}</span>
        </div>
      </div>
      <div className="space-y-1 text-sm text-gray-600 mb-3">
        <p>{entry.status === 'partial' ? 'Partial enrichment' : 'Enrichment'} ({entry.errorMessage})</p>
        <p>Sources: {entry.sources.map((s: any) => `${s.name} (${s.fields} fields)`).join(', ')}</p>
        <p>Duration: {entry.duration}</p>
        {entry.errorDetails && (
          <p className="text-red-600">Error: "{entry.errorDetails.split('.')[0]}"</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View Error Details
        </button>
        <button
          onClick={onRetry}
          className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
        >
          <span>🔄</span>
          <span>Retry</span>
        </button>
      </div>
    </div>
  );
}

function ErrorModal({ onClose, onRetry }: { onClose: () => void; onRetry: () => void }) {
  const handleRetryNow = () => {
    onClose();
    onRetry();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4">ERROR DETAILS</h3>

        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-2">
            <span className="text-sm font-medium text-gray-700 w-28">Service:</span>
            <span className="text-sm text-gray-900">ZoomInfo API</span>
          </div>

          <div className="flex items-start gap-2">
            <span className="text-sm font-medium text-gray-700 w-28">Error Code:</span>
            <span className="text-sm text-gray-900">TIMEOUT</span>
          </div>

          <div className="flex items-start gap-2">
            <span className="text-sm font-medium text-gray-700 w-28">Timestamp:</span>
            <span className="text-sm text-gray-900">Jan 5, 2025 2:15:10 PM</span>
          </div>

          <div className="border-t border-gray-200 pt-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Error Message:</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              "ZoomInfo API did not respond within 10 seconds. This may be due to high API load or network issues."
            </p>
          </div>

          <div className="border-t border-gray-200 pt-3">
            <div className="flex items-start gap-2">
              <span className="text-sm font-medium text-gray-700 w-28">Retry Attempts:</span>
              <span className="text-sm text-gray-900">1</span>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Suggested Actions:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Retry after 5 minutes</li>
              <li>• Check ZoomInfo API status page</li>
              <li>• Verify API key is valid</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRetryNow}
            className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium flex items-center justify-center gap-2"
          >
            <span>🔄</span>
            <span>Retry Now</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
