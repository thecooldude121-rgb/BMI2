import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sarahLeeEnrichmentData, type EnrichedField, type DataSource, type EnrichmentHistoryEntry } from '../../utils/sarahLeeEnrichmentData';
import { useToast } from '../../contexts/ToastContext';
import ConfigureEnrichmentFieldsModal from '../../components/LeadGeneration/ConfigureEnrichmentFieldsModal';

export default function LeadEnrichmentPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const data = sarahLeeEnrichmentData;

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [autoEnrich, setAutoEnrich] = useState(true);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichProgress, setEnrichProgress] = useState(0);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource | null>(null);
  const [selectedField, setSelectedField] = useState<EnrichedField | null>(null);
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<EnrichmentHistoryEntry | null>(null);

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

  const handleEnrichNow = async () => {
    setIsEnriching(true);
    setEnrichProgress(0);
    addToast('🔄 Enriching Sarah Lee\'s data...', 'info');

    // Simulate enrichment progress
    const interval = setInterval(() => {
      setEnrichProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 150);

    // Simulate API call
    setTimeout(() => {
      clearInterval(interval);
      setEnrichProgress(100);
      setIsEnriching(false);
      addToast(`✅ Successfully enriched ${data.totalFields} fields`, 'success');
    }, 3200);
  };

  const handleAutoEnrichToggle = () => {
    setAutoEnrich(!autoEnrich);
    addToast(
      `Auto-enrichment ${!autoEnrich ? 'enabled' : 'disabled'}`,
      'success'
    );
  };

  const handleSaveEnrichmentSettings = (settings: any, selectedFields: string[]) => {
    console.log('Enrichment settings saved:', settings);
    console.log('Selected fields:', selectedFields);
    addToast(`Enrichment settings saved successfully`, 'success');
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
              {isEnriching ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Status:</span>
                    <span className="flex items-center gap-1 text-sm text-blue-600 font-medium">
                      🔄 Enriching... ({enrichProgress}% complete)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${enrichProgress}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    {Math.floor((enrichProgress / 100) * data.totalFields)}/{data.totalFields} fields
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>

            <div className="flex gap-3 flex-shrink-0">
              <button
                onClick={handleEnrichNow}
                disabled={isEnriching}
                className={`px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2 whitespace-nowrap ${
                  isEnriching
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <span>🔄</span>
                <span>{isEnriching ? 'Enriching...' : 'Enrich Now'}</span>
              </button>
              <button
                onClick={() => setShowConfigModal(true)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-2 whitespace-nowrap"
              >
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

                <button
                  onClick={() => setSelectedDataSource(source)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
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
                onClick={handleAutoEnrichToggle}
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
                      <EnrichedFieldCard
                        key={field.id}
                        field={field}
                        getConfidenceColor={getConfidenceColor}
                        onClick={() => setSelectedField(field)}
                      />
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
                      <EnrichedFieldCard
                        key={field.id}
                        field={field}
                        getConfidenceColor={getConfidenceColor}
                        onClick={() => setSelectedField(field)}
                      />
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
                      <EnrichedFieldCard
                        key={field.id}
                        field={field}
                        getConfidenceColor={getConfidenceColor}
                        onClick={() => setSelectedField(field)}
                      />
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
                  <button
                    onClick={() => setSelectedHistoryEntry(entry)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap ml-4"
                  >
                    [View Details]
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ConfigureEnrichmentFieldsModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onSave={handleSaveEnrichmentSettings}
      />
      {selectedDataSource && (
        <DataSourceDetailsModal
          source={selectedDataSource}
          onClose={() => setSelectedDataSource(null)}
        />
      )}
      {selectedField && (
        <FieldDetailsModal
          field={selectedField}
          onClose={() => setSelectedField(null)}
        />
      )}
      {selectedHistoryEntry && (
        <HistoryDetailsModal
          entry={selectedHistoryEntry}
          onClose={() => setSelectedHistoryEntry(null)}
        />
      )}
    </div>
  );
}

function EnrichedFieldCard({
  field,
  getConfidenceColor,
  onClick
}: {
  field: EnrichedField;
  getConfidenceColor: (confidence: number) => string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer"
    >
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


function DataSourceDetailsModal({ source, onClose }: { source: DataSource; onClose: () => void }) {
  const fieldsList = source.name === 'Apollo.io'
    ? ['Email', 'LinkedIn URL', 'Mobile Phone', 'Company Size', 'Industry', 'Total Funding', 'Company Website', 'International Presence', 'Job Title', 'Department', 'Education', 'Previous Companies']
    : ['Direct Phone', 'Office Location', 'Annual Revenue', 'Founded Year', 'Company HQ', 'Seniority Level', 'Years in Role', 'Skills & Expertise'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full m-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 mb-4">{source.name.toUpperCase()} CONNECTION</h3>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <span className="ml-2 text-sm text-green-600 font-medium">✅ Connected</span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">API Key:</span>
              <span className="ml-2 text-sm text-gray-600">••••••••••••1234 (Active)</span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Rate Limit:</span>
              <span className="ml-2 text-sm text-gray-600">45/100 requests today</span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Response Time:</span>
              <span className="ml-2 text-sm text-gray-600">{source.responseTime} (Fast)</span>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-bold text-gray-900 mb-3">Fields Enriched: {source.fieldsEnriched}</h4>
            <div className="grid grid-cols-2 gap-2">
              {fieldsList.map((field, idx) => (
                <div key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                  <span>✓</span>
                  <span>{field}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="text-sm text-gray-700">
              <span className="font-medium">Average Confidence:</span>
              <span className="ml-2">{source.confidence}%</span>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
              Test Connection
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              Reconnect API
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldDetailsModal({ field, onClose }: { field: EnrichedField; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-lg w-full m-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>{field.icon}</span>
          <span>{field.fieldName} - Full History</span>
        </h3>

        <div className="space-y-4">
          <div>
            <span className="text-sm font-medium text-gray-700">Current:</span>
            <span className="ml-2 text-sm text-gray-900 font-medium">{field.after}</span>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-bold text-gray-900 mb-3">Change History:</h4>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                • Jan 6, 10:30 AM: {field.before || '(empty)'} → {field.after} ({field.source}, {field.confidence}%)
              </div>
              {field.before && (
                <div className="text-sm text-gray-600">
                  • Jan 4, 9:00 AM: (empty) → {field.before} (Manual entry)
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium text-gray-700">Verification Status:</span>
                <span className="ml-2 text-green-600 font-medium">✅ Verified</span>
              </div>
              <div className="text-sm text-gray-600">
                Last Verified: Jan 6, 2025
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm">
              ❌ Revert
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm">
              ✏️ Edit Manually
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm">
              ✅ Verify
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HistoryDetailsModal({ entry, onClose }: { entry: EnrichmentHistoryEntry; onClose: () => void }) {
  const apolloFields = ['Email (95%)', 'LinkedIn (92%)', 'Mobile Phone (85%)', 'Company Size (94%)', 'Industry (96%)', 'Total Funding (91%)', 'Company Website (100%)', 'International Presence (89%)', 'Job Title (100%)', 'Department (95%)', 'Education (92%)', 'Previous Companies (90%)'];
  const zoomInfoFields = ['Direct Phone (88%)', 'Office Location (90%)', 'Annual Revenue (87%)', 'Founded Year (98%)', 'Company HQ (93%)', 'Seniority Level (97%)', 'Years in Role (86%)', 'Skills & Expertise (88%)'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full m-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          ENRICHMENT DETAILS - {entry.timestamp}
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <span className="ml-2 text-sm text-green-600 font-medium">
                {entry.status === 'success' && '✅ Success'}
                {entry.status === 'partial' && '⚠️ Partial'}
                {entry.status === 'failed' && '❌ Failed'}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Duration:</span>
              <span className="ml-2 text-sm text-gray-600">{entry.duration}</span>
            </div>
            <div className="col-span-2">
              <span className="text-sm font-medium text-gray-700">Triggered By:</span>
              <span className="ml-2 text-sm text-gray-600">
                {entry.triggeredBy === 'auto' ? 'Auto (real-time)' : `Manual (${entry.triggeredByUser})`}
              </span>
            </div>
          </div>

          {entry.status === 'success' && (
            <>
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-bold text-gray-900 mb-3">Apollo.io (12 fields):</h4>
                <div className="space-y-1">
                  {apolloFields.map((field, idx) => (
                    <div key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                      <span>✓</span>
                      <span>{field} confidence</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-bold text-gray-900 mb-3">ZoomInfo (8 fields):</h4>
                <div className="space-y-1">
                  {zoomInfoFields.map((field, idx) => (
                    <div key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                      <span>✓</span>
                      <span>{field} confidence</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-bold text-gray-900 mb-3">API Logs:</h4>
            <div className="flex gap-3">
              <button className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
                View Raw Response
              </button>
              <button className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
                Download JSON
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
