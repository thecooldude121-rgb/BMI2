import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sarahLeeEnrichmentData, type EnrichedField } from '../../utils/sarahLeeEnrichmentData';

export default function LeadEnrichmentPage() {
  const navigate = useNavigate();
  const data = sarahLeeEnrichmentData;

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [autoEnrich, setAutoEnrich] = useState(true);

  const contactFields = data.enrichedFields.filter(f => f.category === 'contact');
  const companyFields = data.enrichedFields.filter(f => f.category === 'company');
  const professionalFields = data.enrichedFields.filter(f => f.category === 'professional');

  const filteredFields = data.enrichedFields.filter(field => {
    if (selectedCategory !== 'all' && field.category !== selectedCategory) return false;
    if (selectedSource !== 'all' && field.source !== selectedSource) return false;
    return true;
  });

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 80) return 'text-yellow-600';
    return 'text-orange-600';
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
        {/* Lead Hero Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">👤</span>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">
                {data.leadName} - {data.leadTitle} @ {data.leadCompany}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-medium text-gray-700">🏢 {data.source}</span>
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
                <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                  ✅ Enriched
                </span>
                <span className="text-sm text-gray-500">(2 hours ago)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Last Enriched:</span>
                <span className="text-sm text-gray-600">{data.lastEnriched}</span>
              </div>
            </div>

            <div className="flex gap-3 flex-shrink-0">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 whitespace-nowrap">
                <span>🔄</span>
                <span>Enrich Now</span>
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-2 whitespace-nowrap">
                <span>⚙️</span>
                <span>Configure Fields</span>
              </button>
            </div>
          </div>
        </div>

        {/* Data Sources Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>📊</span>
            <span>ENRICHMENT DATA SOURCES</span>
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {data.dataSources.map((source) => (
              <div key={source.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{source.icon}</span>
                    <span className="font-bold text-gray-900">{source.name}</span>
                  </div>
                  <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                    ✅ Connected
                  </span>
                </div>

                <div className="space-y-1 mb-3">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Last Sync:</span> {source.lastSync}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{source.fieldsEnriched} fields enriched</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Confidence:</span> {source.confidence}%
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Response Time:</span> {source.responseTime}
                  </div>
                </div>

                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  [View Details]
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Enriched Fields Section */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📋</span>
              <span>ENRICHED FIELDS ({data.totalFields} fields)</span>
            </h3>

            <div className="flex items-center gap-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Fields ▼</option>
                <option value="contact">Contact Information</option>
                <option value="company">Company Information</option>
                <option value="professional">Professional Details</option>
              </select>

              <button
                onClick={() => setAutoEnrich(!autoEnrich)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  autoEnrich
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300'
                }`}
              >
                🔄 Auto-Enrich: {autoEnrich ? 'ON' : 'OFF'}
              </button>

              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">Filter by Source ▼</option>
                <option value="Apollo.io">Apollo.io</option>
                <option value="ZoomInfo">ZoomInfo</option>
              </select>
            </div>
          </div>

          <div className="p-6">
            {/* Contact Information */}
            {(selectedCategory === 'all' || selectedCategory === 'contact') && (
              <div className="mb-8">
                <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
                  CONTACT INFORMATION ({contactFields.length} fields)
                </h4>
                <div className="h-px bg-gray-200 mb-6"></div>

                <div className="space-y-4">
                  {contactFields
                    .filter(field => selectedSource === 'all' || field.source === selectedSource)
                    .map((field) => (
                      <EnrichedFieldCard key={field.id} field={field} getConfidenceColor={getConfidenceColor} />
                    ))}
                </div>
              </div>
            )}

            {/* Company Information */}
            {(selectedCategory === 'all' || selectedCategory === 'company') && (
              <div className="mb-8">
                <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
                  COMPANY INFORMATION ({companyFields.length} fields)
                </h4>
                <div className="h-px bg-gray-200 mb-6"></div>

                <div className="space-y-4">
                  {companyFields
                    .filter(field => selectedSource === 'all' || field.source === selectedSource)
                    .map((field) => (
                      <EnrichedFieldCard key={field.id} field={field} getConfidenceColor={getConfidenceColor} />
                    ))}
                </div>
              </div>
            )}

            {/* Professional Details */}
            {(selectedCategory === 'all' || selectedCategory === 'professional') && (
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
                  PROFESSIONAL DETAILS ({professionalFields.length} fields)
                </h4>
                <div className="h-px bg-gray-200 mb-6"></div>

                <div className="space-y-4">
                  {professionalFields
                    .filter(field => selectedSource === 'all' || field.source === selectedSource)
                    .map((field) => (
                      <EnrichedFieldCard key={field.id} field={field} getConfidenceColor={getConfidenceColor} />
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enrichment History */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>📜</span>
            <span>ENRICHMENT HISTORY</span>
          </h3>

          <div className="space-y-4">
            {data.history.map((entry) => (
              <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {entry.status === 'success' && <span className="text-green-600">✅</span>}
                      {entry.status === 'partial' && <span className="text-yellow-600">⚠️</span>}
                      {entry.status === 'failed' && <span className="text-red-600">❌</span>}
                      <span className="font-bold text-gray-900">{entry.timestamp}</span>
                      {entry.triggeredBy === 'auto' && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                          AUTO
                        </span>
                      )}
                      {entry.triggeredBy === 'manual' && entry.triggeredByUser && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          MANUAL - {entry.triggeredByUser}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>{entry.message}</p>
                      <p><span className="font-medium">Fields Enriched:</span> {entry.fieldsEnriched}</p>
                      <p><span className="font-medium">Sources:</span> {entry.sources}</p>
                      <p><span className="font-medium">Duration:</span> {entry.duration}</p>
                    </div>
                  </div>
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap ml-4">
                    [View Details]
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EnrichedFieldCard({
  field,
  getConfidenceColor
}: {
  field: EnrichedField;
  getConfidenceColor: (confidence: number) => string;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{field.icon}</span>
          <span className="font-medium text-gray-900">{field.fieldName}</span>
          {field.status === 'added' && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
              NEW
            </span>
          )}
          {field.status === 'updated' && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
              UPDATED
            </span>
          )}
        </div>
        <span className="flex items-center gap-1 text-sm font-medium text-gray-700">
          <span>🎯</span>
          <span>{field.source}</span>
        </span>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-start gap-2">
          <span className="text-sm font-medium text-gray-500 whitespace-nowrap">Before:</span>
          <span className="text-sm text-gray-600">{field.before || '(empty)'}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-sm font-medium text-gray-500 whitespace-nowrap">After:</span>
          <span className="text-sm text-gray-900 font-medium">{field.after} ✓</span>
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <span className={`font-medium ${getConfidenceColor(field.confidence)}`}>
          Confidence: {field.confidence}%
        </span>
        <span className="text-gray-400">•</span>
        <span className="text-gray-600">Enriched: {field.enrichedAt}</span>
      </div>
    </div>
  );
}
