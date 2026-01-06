import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  emilyChenEnrichmentData,
  emilyChenEnrichedFields,
  emilyChenEnrichmentHistory,
  getEmilyChenLowConfidenceFields,
  getEmilyChenHighConfidenceFields,
  type EmilyChenEnrichedField
} from '../../utils/emilyChenEnrichmentData';
import { useToast } from '../../contexts/ToastContext';

export default function EmilyChenEnrichmentPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const data = emilyChenEnrichmentData;
  const history = emilyChenEnrichmentHistory;

  const [activeFilter, setActiveFilter] = useState<string>('low_confidence');
  const [showHighConfidence, setShowHighConfidence] = useState(false);
  const [acceptedFields, setAcceptedFields] = useState<string[]>([]);
  const [rejectedFields, setRejectedFields] = useState<string[]>([]);
  const [editingField, setEditingField] = useState<string | null>(null);

  const lowConfidenceFields = getEmilyChenLowConfidenceFields();
  const highConfidenceFields = getEmilyChenHighConfidenceFields();

  const handleAcceptField = (fieldId: string) => {
    setAcceptedFields([...acceptedFields, fieldId]);
    addToast('✅ Field accepted', 'success');
  };

  const handleRejectField = (fieldId: string) => {
    setRejectedFields([...rejectedFields, fieldId]);
    addToast('❌ Field rejected', 'info');
  };

  const handleEditField = (fieldId: string) => {
    setEditingField(fieldId);
    addToast('✏️ Opening editor...', 'info');
  };

  const handleAcceptAll = () => {
    const remainingLowConfidence = lowConfidenceFields
      .filter(f => !acceptedFields.includes(f.id) && !rejectedFields.includes(f.id))
      .map(f => f.id);

    setAcceptedFields([...acceptedFields, ...remainingLowConfidence]);
    addToast(`✅ Accepted ${remainingLowConfidence.length} fields`, 'success');
  };

  const handleRejectAll = () => {
    const remainingLowConfidence = lowConfidenceFields
      .filter(f => !acceptedFields.includes(f.id) && !rejectedFields.includes(f.id))
      .map(f => f.id);

    setRejectedFields([...rejectedFields, ...remainingLowConfidence]);
    addToast(`❌ Rejected ${remainingLowConfidence.length} fields`, 'info');
  };

  const handleReviewApprove = () => {
    addToast('🔄 Processing approval...', 'info');
    setTimeout(() => {
      addToast('✅ All fields reviewed and approved', 'success');
      navigate('/lead-generation/leads');
    }, 1500);
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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-green-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 85) return '✅ HIGH';
    if (confidence >= 70) return '🟡 MEDIUM';
    return '🔴 LOW';
  };

  const pendingReviewCount = lowConfidenceFields.filter(
    f => !acceptedFields.includes(f.id) && !rejectedFields.includes(f.id)
  ).length;

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
                ⚠️ {data.statusMessage}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Last Enriched:</span>
              <span className="text-sm text-gray-600">{data.lastEnriched} ({data.lastEnrichedRelative})</span>
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
              onClick={handleReviewApprove}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
            >
              <span>✅</span>
              <span>Review & Approve</span>
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
              <h3 className="font-bold text-orange-900 mb-1">LOW CONFIDENCE WARNING</h3>
              <p className="text-sm text-orange-800 mb-3">
                {data.fieldsNeedingReview} fields have confidence scores below 70% threshold
                <br />
                Please review and manually verify data before using
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveFilter('low_confidence')}
                  className="px-3 py-1.5 bg-orange-600 text-white rounded text-sm font-medium hover:bg-orange-700"
                >
                  View Low Confidence Fields
                </button>
                <button
                  onClick={handleAcceptAll}
                  disabled={pendingReviewCount === 0}
                  className={`px-3 py-1.5 ${pendingReviewCount === 0 ? 'bg-gray-300' : 'bg-green-600 hover:bg-green-700'} text-white rounded text-sm font-medium`}
                >
                  Accept All
                </button>
                <button
                  onClick={handleRejectAll}
                  disabled={pendingReviewCount === 0}
                  className={`px-3 py-1.5 ${pendingReviewCount === 0 ? 'bg-gray-300' : 'bg-red-600 hover:bg-red-700'} text-white rounded text-sm font-medium`}
                >
                  Reject All
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
              <DataSourceCard key={source.id} source={source} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>📋</span>
              <span>ENRICHED FIELDS ({data.enrichedFields} fields - {pendingReviewCount} need review)</span>
            </h3>
            <div className="flex items-center gap-3">
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="low_confidence">⚠️ Low Confidence Only</option>
                <option value="all">All Fields</option>
                <option value="high_confidence">High Confidence Only</option>
              </select>
            </div>
          </div>

          <div className="space-y-6">
            {activeFilter !== 'high_confidence' && (
              <div>
                <h4 className="text-sm font-bold text-orange-700 mb-3 flex items-center gap-2">
                  <span>⚠️</span>
                  <span>REVIEW REQUIRED ({pendingReviewCount} fields below 70% confidence)</span>
                </h4>
                <div className="space-y-3">
                  {lowConfidenceFields.map((field) => (
                    <ReviewFieldCard
                      key={field.id}
                      field={field}
                      isAccepted={acceptedFields.includes(field.id)}
                      isRejected={rejectedFields.includes(field.id)}
                      onAccept={() => handleAcceptField(field.id)}
                      onReject={() => handleRejectField(field.id)}
                      onEdit={() => handleEditField(field.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {activeFilter !== 'low_confidence' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-green-700 flex items-center gap-2">
                    <span>✅</span>
                    <span>HIGH CONFIDENCE ({highConfidenceFields.length} fields above 85%)</span>
                  </h4>
                  {!showHighConfidence && activeFilter === 'all' && (
                    <button
                      onClick={() => setShowHighConfidence(true)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Show {highConfidenceFields.length} more high-confidence fields ▼
                    </button>
                  )}
                </div>

                {(showHighConfidence || activeFilter === 'high_confidence') && (
                  <div className="space-y-3">
                    {highConfidenceFields.map((field) => (
                      <HighConfidenceFieldCard key={field.id} field={field} />
                    ))}
                  </div>
                )}

                {!showHighConfidence && activeFilter === 'all' && (
                  <div className="space-y-3">
                    {highConfidenceFields.slice(0, 2).map((field) => (
                      <HighConfidenceFieldCard key={field.id} field={field} />
                    ))}
                  </div>
                )}
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
              <HistoryCard key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DataSourceCard({ source }: { source: any }) {
  const getStatusDisplay = () => {
    if (source.status === 'low_confidence') {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-orange-600 font-medium">⚠️ Low Confidence</span>
          </div>
          <div className="text-sm text-gray-600">Last Sync: {source.lastSync}</div>
          <div className="text-sm font-medium text-gray-900">
            {source.fieldsEnriched} fields ({source.lowConfidenceCount} low)
          </div>
          <div className="text-sm text-orange-600">Avg: {source.avgConfidence}% confidence</div>
        </div>
      );
    } else {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-medium">✅ Connected</span>
          </div>
          <div className="text-sm text-gray-600">Last Sync: {source.lastSync}</div>
          <div className="text-sm font-medium text-gray-900">{source.fieldsEnriched} fields enriched</div>
          <div className="text-sm text-green-600">Avg: {source.avgConfidence}% confidence</div>
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

      <div className="mt-3">
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View Details
        </button>
      </div>
    </div>
  );
}

function ReviewFieldCard({
  field,
  isAccepted,
  isRejected,
  onAccept,
  onReject,
  onEdit
}: {
  field: EmilyChenEnrichedField;
  isAccepted: boolean;
  isRejected: boolean;
  onAccept: () => void;
  onReject: () => void;
  onEdit: () => void;
}) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 70) return '🟡';
    return '🔴';
  };

  if (isAccepted) {
    return (
      <div className="border border-green-200 bg-green-50 rounded-lg p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{field.icon}</span>
            <span className="font-medium text-gray-900">{field.label}</span>
          </div>
          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
            ✅ Accepted
          </span>
        </div>
        <div className="text-sm text-gray-600 mb-2">
          Value: {field.after}
        </div>
        <button
          onClick={onAccept}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Undo
        </button>
      </div>
    );
  }

  if (isRejected) {
    return (
      <div className="border border-gray-300 bg-gray-50 rounded-lg p-4 opacity-60">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{field.icon}</span>
            <span className="font-medium text-gray-900">{field.label}</span>
          </div>
          <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs font-medium">
            ❌ Rejected
          </span>
        </div>
        <div className="text-sm text-gray-600 line-through mb-2">
          Value: {field.after}
        </div>
        <button
          onClick={onReject}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Undo
        </button>
      </div>
    );
  }

  return (
    <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{field.icon}</span>
          <span className="font-medium text-gray-900">{field.label}</span>
        </div>
        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium flex items-center gap-1">
          <span>🎯</span>
          <span>{field.source === 'apollo' ? 'Apollo.io' : 'ZoomInfo'}</span>
        </span>
      </div>
      <div className="space-y-1 text-sm mb-3">
        <div className="flex items-start gap-2">
          <span className="text-gray-600 whitespace-nowrap">Before:</span>
          <span className="text-gray-500">{field.before}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-gray-600 whitespace-nowrap">After:</span>
          <span className="text-gray-900 font-medium flex items-center gap-1">
            {field.after}
            <span className="text-orange-600">⚠️</span>
          </span>
        </div>
      </div>
      <div className={`text-sm ${getConfidenceColor(field.confidence)} font-medium mb-3`}>
        Confidence: {field.confidence}% {getConfidenceIcon(field.confidence)} {field.confidenceNote}
      </div>
      <div className="text-xs text-gray-500 mb-3">
        Enriched: {field.enrichedAt}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onAccept}
          className="px-3 py-1.5 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 flex items-center gap-1"
        >
          <span>✅</span>
          <span>Accept</span>
        </button>
        <button
          onClick={onReject}
          className="px-3 py-1.5 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 flex items-center gap-1"
        >
          <span>❌</span>
          <span>Reject</span>
        </button>
        <button
          onClick={onEdit}
          className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 flex items-center gap-1"
        >
          <span>✏️</span>
          <span>Edit Manually</span>
        </button>
      </div>
    </div>
  );
}

function HighConfidenceFieldCard({ field }: { field: EmilyChenEnrichedField }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{field.icon}</span>
          <span className="font-medium text-gray-900">{field.label}</span>
        </div>
        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium flex items-center gap-1">
          <span>🎯</span>
          <span>{field.source === 'apollo' ? 'Apollo.io' : 'ZoomInfo'}</span>
        </span>
      </div>
      <div className="space-y-1 text-sm mb-2">
        <div className="flex items-start gap-2">
          <span className="text-gray-600 whitespace-nowrap">Before:</span>
          <span className="text-gray-500">{field.before}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-gray-600 whitespace-nowrap">After:</span>
          <span className="text-green-700 font-medium flex items-center gap-1">
            {field.after}
            <span className="text-green-600">✓</span>
          </span>
        </div>
      </div>
      <div className="text-sm text-green-600 font-medium">
        Confidence: {field.confidence}% ✅ HIGH
      </div>
      <div className="text-xs text-gray-500 mt-1">
        Enriched: {field.enrichedAt} • Auto-approved
      </div>
    </div>
  );
}

function HistoryCard({ entry }: { entry: any }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚠️</span>
          <span className="font-medium text-gray-900">{entry.timestamp}</span>
        </div>
      </div>
      <div className="space-y-1 text-sm text-gray-600 mb-3">
        <p>{entry.message}</p>
        <p>
          Sources: {entry.sources.map((s: any) => `${s.name} (${s.fields} fields, avg ${s.avgConfidence}%)`).join(', ')}
        </p>
        <p>Duration: {entry.duration}</p>
        <p className="text-orange-600 font-medium">
          Status: Pending review ({entry.fieldsNeedingReview} fields need manual verification)
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button className="text-sm text-orange-600 hover:text-orange-700 font-medium">
          Review Now
        </button>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View Details
        </button>
      </div>
    </div>
  );
}
