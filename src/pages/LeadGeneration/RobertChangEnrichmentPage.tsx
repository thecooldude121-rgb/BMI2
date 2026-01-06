import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  robertChangEnrichmentData,
  robertChangFields,
  robertChangEnrichmentHistory,
  alternativeEnrichmentOptions,
  getContactFields,
  getCompanyFields,
  getProfessionalFields,
  type RobertChangField
} from '../../utils/robertChangEnrichmentData';
import { useToast } from '../../contexts/ToastContext';

export default function RobertChangEnrichmentPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const data = robertChangEnrichmentData;
  const history = robertChangEnrichmentHistory;

  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<{ [key: string]: string }>({});
  const [showLearnWhyModal, setShowLearnWhyModal] = useState(false);
  const [showManualGuideModal, setShowManualGuideModal] = useState(false);
  const [showBulkAddModal, setShowBulkAddModal] = useState<string | null>(null);
  const [showLinkedInImportModal, setShowLinkedInImportModal] = useState(false);
  const [showConfigureSearchModal, setShowConfigureSearchModal] = useState(false);
  const [linkedInUrl, setLinkedInUrl] = useState('');

  const contactFields = getContactFields();
  const companyFields = getCompanyFields();
  const professionalFields = getProfessionalFields();

  const handleTryAgain = () => {
    addToast('🔄 Retrying enrichment...', 'info');
    setTimeout(() => {
      addToast('❌ Still no matching records found', 'error');
    }, 2000);
  };

  const handleAddManually = () => {
    setShowBulkAddModal('all');
  };

  const handleConfigureSearch = () => {
    setShowConfigureSearchModal(true);
  };

  const handleEditField = (fieldId: string, currentValue: string | null) => {
    setEditingField(fieldId);
    setFieldValues({ ...fieldValues, [fieldId]: currentValue || '' });
  };

  const handleSaveField = (fieldId: string) => {
    setEditingField(null);
    addToast('✓ Field saved', 'success');
  };

  const handleCancelEdit = () => {
    setEditingField(null);
  };

  const handleFieldValueChange = (fieldId: string, value: string) => {
    setFieldValues({ ...fieldValues, [fieldId]: value });
  };

  const handleSearchLinkedIn = () => {
    addToast('🔍 Opening LinkedIn search...', 'info');
    window.open('https://www.linkedin.com/search/results/people/?keywords=Robert%20Chang%20CEO%20StartCo', '_blank');
    setTimeout(() => {
      setShowLinkedInImportModal(true);
    }, 1000);
  };

  const handleSearchWeb = () => {
    addToast('🌐 Searching for company website...', 'info');
  };

  const handleVerifyEmail = () => {
    addToast('📧 Verifying email address...', 'info');
    setTimeout(() => {
      addToast('✓ Email verified: robert@startco.io is valid', 'success');
    }, 2000);
  };

  const getScoreDots = (score: number) => {
    const filled = Math.floor(score / 10);
    const dots = [];
    for (let i = 0; i < 10; i++) {
      dots.push(
        <span key={i} className={i < filled ? 'text-yellow-500' : 'text-gray-300'}>
          ●
        </span>
      );
    }
    return dots;
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
              <span className="flex items-center gap-1 text-sm text-red-600 font-medium">
                ❌ {data.statusMessage}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Last Attempt:</span>
              <span className="text-sm text-gray-600">
                {new Date(data.lastAttempt).toLocaleString()} ({data.lastAttemptRelative})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTryAgain}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
            >
              <span>🔄</span>
              <span>Try Again</span>
            </button>
            <button
              onClick={handleAddManually}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
            >
              <span>✏️</span>
              <span>Add Manually</span>
            </button>
            <button
              onClick={handleConfigureSearch}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium flex items-center gap-2"
            >
              <span>⚙️</span>
              <span>Configure Search</span>
            </button>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h3 className="font-bold text-red-900 mb-1">ENRICHMENT FAILED</h3>
              <p className="text-sm text-red-800 mb-3">
                No matching records found in Apollo.io or ZoomInfo databases
                <br />
                This lead may be from a small/private company or startup
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowLearnWhyModal(true)}
                  className="text-sm text-red-700 hover:text-red-900 font-medium underline"
                >
                  Learn Why
                </button>
                <button
                  onClick={() => setShowManualGuideModal(true)}
                  className="text-sm text-red-700 hover:text-red-900 font-medium underline"
                >
                  Manual Entry Guide
                </button>
                <button
                  onClick={() => addToast('📧 Opening support contact form...', 'info')}
                  className="text-sm text-red-700 hover:text-red-900 font-medium underline"
                >
                  Contact Support
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
              <DataSourceCard key={source.id} source={source} onRetry={handleTryAgain} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <span className="text-xl">ℹ️</span>
              <div>
                <p className="text-sm text-blue-800 font-medium">Only basic information available</p>
                <p className="text-sm text-blue-700">
                  Consider adding more details manually or wait for updates
                </p>
              </div>
            </div>
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>📋</span>
            <span>CURRENT LEAD DATA (Manually Entered)</span>
          </h3>

          <div className="space-y-6">
            <FieldSection
              title="CONTACT INFORMATION"
              fields={contactFields}
              editingField={editingField}
              fieldValues={fieldValues}
              onEdit={handleEditField}
              onSave={handleSaveField}
              onCancel={handleCancelEdit}
              onValueChange={handleFieldValueChange}
              onSearchLinkedIn={handleSearchLinkedIn}
              onBulkAdd={() => setShowBulkAddModal('contact')}
            />

            <FieldSection
              title="COMPANY INFORMATION"
              fields={companyFields}
              editingField={editingField}
              fieldValues={fieldValues}
              onEdit={handleEditField}
              onSave={handleSaveField}
              onCancel={handleCancelEdit}
              onValueChange={handleFieldValueChange}
              onSearchWeb={handleSearchWeb}
              onBulkAdd={() => setShowBulkAddModal('company')}
            />

            <FieldSection
              title="PROFESSIONAL DETAILS"
              fields={professionalFields}
              editingField={editingField}
              fieldValues={fieldValues}
              onEdit={handleEditField}
              onSave={handleSaveField}
              onCancel={handleCancelEdit}
              onValueChange={handleFieldValueChange}
              onBulkAdd={() => setShowBulkAddModal('professional')}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>💡</span>
            <span>ALTERNATIVE ENRICHMENT OPTIONS</span>
          </h3>

          <p className="text-sm text-gray-600 mb-4">
            Since automatic enrichment failed, try these alternatives:
          </p>

          <div className="space-y-4">
            {alternativeEnrichmentOptions.map((option) => (
              <AlternativeOptionCard
                key={option.id}
                option={option}
                onSearchLinkedIn={handleSearchLinkedIn}
                onSearchWeb={handleSearchWeb}
                onAddManually={handleAddManually}
                onVerifyEmail={handleVerifyEmail}
              />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>📜</span>
            <span>ENRICHMENT HISTORY</span>
          </h3>

          <div className="space-y-4">
            {history.map((entry) => (
              <HistoryCard key={entry.id} entry={entry} onRetry={handleTryAgain} />
            ))}
          </div>
        </div>
      </div>

      {showLearnWhyModal && (
        <LearnWhyModal onClose={() => setShowLearnWhyModal(false)} />
      )}

      {showManualGuideModal && (
        <ManualGuideModal onClose={() => setShowManualGuideModal(false)} />
      )}

      {showBulkAddModal && (
        <BulkAddModal
          section={showBulkAddModal}
          onClose={() => setShowBulkAddModal(null)}
          onSave={(values) => {
            addToast('✓ All fields saved successfully', 'success');
            setShowBulkAddModal(null);
          }}
        />
      )}

      {showLinkedInImportModal && (
        <LinkedInImportModal
          linkedInUrl={linkedInUrl}
          onUrlChange={setLinkedInUrl}
          onClose={() => {
            setShowLinkedInImportModal(false);
            setLinkedInUrl('');
          }}
          onImport={() => {
            addToast('🔄 Importing profile from LinkedIn...', 'info');
            setTimeout(() => {
              addToast('✓ Profile imported successfully! 8 fields updated.', 'success');
              setShowLinkedInImportModal(false);
              setLinkedInUrl('');
            }, 2000);
          }}
        />
      )}

      {showConfigureSearchModal && (
        <ConfigureSearchModal
          onClose={() => setShowConfigureSearchModal(false)}
          onSave={(config) => {
            addToast('✓ Search configuration saved', 'success');
            setShowConfigureSearchModal(false);
          }}
        />
      )}
    </div>
  );
}

function DataSourceCard({ source, onRetry }: { source: any; onRetry: () => void }) {
  return (
    <div className="border border-red-200 bg-red-50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{source.icon}</span>
        <span className="font-bold text-gray-900">{source.name}</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-red-600 font-medium">❌ No match found</span>
        </div>
        <div className="text-sm text-gray-600">Search: {source.searchStatus}</div>
        <div className="text-sm font-medium text-gray-900">{source.fieldsEnriched} fields enriched</div>
        <div className="text-sm text-gray-500">Response: {source.responseTime}</div>
      </div>

      <div className="mt-3">
        <button
          onClick={onRetry}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          <span>🔍</span>
          <span>Retry Search</span>
        </button>
      </div>
    </div>
  );
}

function FieldSection({
  title,
  fields,
  editingField,
  fieldValues,
  onEdit,
  onSave,
  onCancel,
  onValueChange,
  onSearchLinkedIn,
  onSearchWeb,
  onBulkAdd
}: {
  title: string;
  fields: RobertChangField[];
  editingField: string | null;
  fieldValues: { [key: string]: string };
  onEdit: (fieldId: string, currentValue: string | null) => void;
  onSave: (fieldId: string) => void;
  onCancel: () => void;
  onValueChange: (fieldId: string, value: string) => void;
  onSearchLinkedIn?: () => void;
  onSearchWeb?: () => void;
  onBulkAdd?: () => void;
}) {
  const availableCount = fields.filter(f => f.status === 'available').length;
  const totalCount = fields.length;
  const missingCount = totalCount - availableCount;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-gray-700">
          {title} ({availableCount}/{totalCount} fields)
        </h4>
        {missingCount > 0 && onBulkAdd && (
          <button
            onClick={onBulkAdd}
            className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 flex items-center gap-1"
          >
            <span>✏️</span>
            <span>Add All Fields</span>
          </button>
        )}
      </div>
      <div className="border-t border-gray-200 pt-3">
        <div className="space-y-3">
          {fields.map((field) => (
            <FieldCard
              key={field.id}
              field={field}
              isEditing={editingField === field.id}
              editedValue={fieldValues[field.id] || field.value || ''}
              onEdit={() => onEdit(field.id, field.value)}
              onSave={() => onSave(field.id)}
              onCancel={onCancel}
              onValueChange={(value) => onValueChange(field.id, value)}
              onSearchLinkedIn={onSearchLinkedIn}
              onSearchWeb={onSearchWeb}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FieldCard({
  field,
  isEditing,
  editedValue,
  onEdit,
  onSave,
  onCancel,
  onValueChange,
  onSearchLinkedIn,
  onSearchWeb
}: {
  field: RobertChangField;
  isEditing: boolean;
  editedValue: string;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onValueChange: (value: string) => void;
  onSearchLinkedIn?: () => void;
  onSearchWeb?: () => void;
}) {
  if (isEditing) {
    return (
      <div className="border-2 border-blue-300 bg-blue-50 rounded-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{field.icon}</span>
            <span className="font-medium text-gray-900">{field.label}</span>
          </div>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
            ✏️ Editing
          </span>
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Edit Value:
          </label>
          <input
            type="text"
            value={editedValue}
            onChange={(e) => onValueChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter value..."
            autoFocus
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSave}
            className="px-3 py-1.5 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm font-medium hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (field.status === 'available') {
    return (
      <div className="border border-green-200 bg-green-50 rounded-lg p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{field.icon}</span>
            <span className="font-medium text-gray-900">{field.label}</span>
          </div>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
            ✍️ Manual Entry
          </span>
        </div>
        <div className="text-sm text-gray-900 font-medium mb-2">
          Value: {field.value}
        </div>
        <div className="text-sm text-green-600 mb-2">Status: ✓ Available</div>
        <button
          onClick={onEdit}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          <span>✏️</span>
          <span>Edit</span>
        </button>
      </div>
    );
  }

  return (
    <div className="border border-gray-300 bg-gray-50 rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{field.icon}</span>
          <span className="font-medium text-gray-900">{field.label}</span>
        </div>
        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
          ❌ Missing
        </span>
      </div>
      <div className="text-sm text-gray-500 mb-2">Value: (empty)</div>
      <div className="text-sm text-gray-600 mb-3">Status: Not available</div>
      <div className="flex items-center gap-2">
        {field.id === 'linkedin' && onSearchLinkedIn && (
          <button
            onClick={onSearchLinkedIn}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            <span>🔍</span>
            <span>Search LinkedIn</span>
          </button>
        )}
        {field.id === 'company_website' && onSearchWeb && (
          <button
            onClick={onSearchWeb}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            <span>🔍</span>
            <span>Search Web</span>
          </button>
        )}
        <button
          onClick={onEdit}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          <span>✏️</span>
          <span>Add Manually</span>
        </button>
      </div>
    </div>
  );
}

function AlternativeOptionCard({
  option,
  onSearchLinkedIn,
  onSearchWeb,
  onAddManually,
  onVerifyEmail
}: {
  option: any;
  onSearchLinkedIn: () => void;
  onSearchWeb: () => void;
  onAddManually: () => void;
  onVerifyEmail: () => void;
}) {
  const handleAction = () => {
    if (option.id === 'linkedin-search') onSearchLinkedIn();
    else if (option.id === 'website-scrape') onSearchWeb();
    else if (option.id === 'manual-entry') onAddManually();
    else if (option.id === 'email-verification') onVerifyEmail();
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{option.icon}</span>
        <div className="flex-1">
          <h4 className="font-bold text-gray-900 mb-1">{option.title}</h4>
          <p className="text-sm text-gray-600 mb-3">{option.description}</p>
          <div className="flex items-center gap-2">
            {option.actions ? (
              option.actions.map((action: string, idx: number) => (
                <button
                  key={idx}
                  onClick={handleAction}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
                >
                  {action}
                </button>
              ))
            ) : (
              <button
                onClick={handleAction}
                className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
              >
                {option.action}
              </button>
            )}
            {option.recommended && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                ⭐ Recommended
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function HistoryCard({ entry, onRetry }: { entry: any; onRetry: () => void }) {
  return (
    <div className="border border-red-200 bg-red-50 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">❌</span>
          <span className="font-medium text-gray-900">
            {new Date(entry.timestamp).toLocaleString()}
          </span>
        </div>
        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
          Failed
        </span>
      </div>
      <div className="space-y-2 text-sm text-gray-600 mb-3">
        <div className="font-medium text-gray-900">{entry.message}</div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-700">Sources:</span>
          <span>
            {entry.sources.map((s: any) => `${s.name} (${s.matches} matches)`).join(', ')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-700">Duration:</span>
          <span>{entry.duration}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-700">Reason:</span>
          <span>{entry.reason}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="text-sm text-red-600 hover:text-red-700 font-medium">
          View Search Details →
        </button>
        <button
          onClick={onRetry}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          <span>🔄</span>
          <span>Retry</span>
        </button>
      </div>
    </div>
  );
}

function LearnWhyModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">WHY WAS NO DATA FOUND?</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800 font-medium">
              Common reasons enrichment fails:
            </p>
          </div>

          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🏢</span>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Small startup or private company</h3>
                  <p className="text-sm text-gray-600">
                    Not yet in Apollo/ZoomInfo databases. These platforms primarily cover established companies with public presence.
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📧</span>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Incorrect email format</h3>
                  <p className="text-sm text-gray-600">
                    robert@startco.io may not match records if the actual email uses a different domain or format.
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📅</span>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Company recently founded</h3>
                  <p className="text-sm text-gray-600">
                    Data providers typically lag 6-12 months behind new company formations and executive hires.
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🌍</span>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Non-US company</h3>
                  <p className="text-sm text-gray-600">
                    Limited international coverage in most B2B databases. Best coverage is for US, UK, and Western Europe.
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🔒</span>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Privacy settings</h3>
                  <p className="text-sm text-gray-600">
                    Executive has limited online presence or strict privacy settings on professional networks.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-bold text-blue-900 mb-2">What to do next:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Try manual LinkedIn search</li>
              <li>• Visit company website directly</li>
              <li>• Add available information manually</li>
              <li>• Set up monitoring for future updates</li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ManualGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">MANUAL ENTRY GUIDE</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-medium">
              Step-by-step guide to manually research and add lead information
            </p>
          </div>

          <div className="space-y-4">
            <div className="border border-blue-300 bg-blue-50 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                <span>Search LinkedIn</span>
              </h3>
              <ul className="text-sm text-gray-700 space-y-2 ml-8">
                <li>• Go to LinkedIn.com</li>
                <li>• Search for "Robert Chang CEO StartCo"</li>
                <li>• Find matching profile</li>
                <li>• Copy profile URL</li>
                <li>• Note: Title, company, location, education</li>
              </ul>
            </div>

            <div className="border border-blue-300 bg-blue-50 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                <span>Visit Company Website</span>
              </h3>
              <ul className="text-sm text-gray-700 space-y-2 ml-8">
                <li>• Search Google for "StartCo company"</li>
                <li>• Find official website</li>
                <li>• Check "About Us" or "Team" pages</li>
                <li>• Note: Industry, size, founded year, description</li>
                <li>• Look for contact information</li>
              </ul>
            </div>

            <div className="border border-blue-300 bg-blue-50 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
                <span>Check Crunchbase (if available)</span>
              </h3>
              <ul className="text-sm text-gray-700 space-y-2 ml-8">
                <li>• Visit crunchbase.com</li>
                <li>• Search for company name</li>
                <li>• Note: Funding, revenue, employee count</li>
                <li>• Check executive team listings</li>
              </ul>
            </div>

            <div className="border border-blue-300 bg-blue-50 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">4</span>
                <span>Add Information to CRM</span>
              </h3>
              <ul className="text-sm text-gray-700 space-y-2 ml-8">
                <li>• Click "Add All Fields" button</li>
                <li>• Fill in collected information</li>
                <li>• Add source notes for each field</li>
                <li>• Save and review</li>
              </ul>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-bold text-green-900 mb-2">Pro Tips:</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Use multiple sources to verify information</li>
              <li>• Add notes about data source and confidence</li>
              <li>• Set reminder to update in 30-60 days</li>
              <li>• Mark fields with low confidence for review</li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Start Manual Research
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BulkAddModal({
  section,
  onClose,
  onSave
}: {
  section: string;
  onClose: () => void;
  onSave: (values: any) => void;
}) {
  const [formValues, setFormValues] = useState<any>({});

  const getSectionTitle = () => {
    if (section === 'contact') return 'CONTACT INFORMATION';
    if (section === 'company') return 'COMPANY INFORMATION';
    if (section === 'professional') return 'PROFESSIONAL DETAILS';
    return 'ALL FIELDS';
  };

  const handleSave = () => {
    onSave(formValues);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">ADD {getSectionTitle()}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          {(section === 'contact' || section === 'all') && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 text-sm">Contact Information</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Direct Phone
                </label>
                <input
                  type="tel"
                  placeholder="+1 555-0123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn Profile
                </label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Phone
                </label>
                <input
                  type="tel"
                  placeholder="+1 555-0456"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Office Location
                </label>
                <input
                  type="text"
                  placeholder="San Francisco, CA"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {(section === 'company' || section === 'all') && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 text-sm">Company Information</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Website
                </label>
                <input
                  type="url"
                  placeholder="https://startco.io"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Size
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Select size...</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501+">501+ employees</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Revenue
                </label>
                <input
                  type="text"
                  placeholder="$1M - $5M"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Select industry...</option>
                  <option value="technology">Technology</option>
                  <option value="saas">SaaS</option>
                  <option value="fintech">FinTech</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="ecommerce">E-commerce</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Founded Year
                </label>
                <input
                  type="number"
                  placeholder="2020"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {(section === 'professional' || section === 'all') && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 text-sm">Professional Details</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seniority Level
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Select level...</option>
                  <option value="c-level">C-Level</option>
                  <option value="vp">VP</option>
                  <option value="director">Director</option>
                  <option value="manager">Manager</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  placeholder="Executive"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years in Role
                </label>
                <input
                  type="number"
                  placeholder="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Education
                </label>
                <input
                  type="text"
                  placeholder="MBA, Stanford University"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Save All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LinkedInImportModal({
  linkedInUrl,
  onUrlChange,
  onClose,
  onImport
}: {
  linkedInUrl: string;
  onUrlChange: (url: string) => void;
  onClose: () => void;
  onImport: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full">
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">IMPORT FROM LINKEDIN</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-bold text-blue-900 mb-2">Instructions:</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Find Robert's LinkedIn profile in the new tab</li>
              <li>Copy the profile URL from the address bar</li>
              <li>Paste it below and click Import</li>
            </ol>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              LinkedIn Profile URL
            </label>
            <input
              type="url"
              value={linkedInUrl}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder="https://linkedin.com/in/robert-chang-ceo"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              We'll extract available information like job history, education, and location from the profile.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onImport}
              disabled={!linkedInUrl}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Import Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfigureSearchModal({
  onClose,
  onSave
}: {
  onClose: () => void;
  onSave: (config: any) => void;
}) {
  const [config, setConfig] = useState({
    emailVariations: true,
    nameVariations: true,
    companyVariations: true,
    fuzzyMatching: false,
    confidenceThreshold: 'medium'
  });

  const handleSave = () => {
    onSave(config);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">CONFIGURE SEARCH PARAMETERS</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-medium">
              Adjust search settings to find more matches in data sources
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Try Email Variations</h4>
                <p className="text-sm text-gray-600">
                  Search with robert.chang@, r.chang@, etc.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.emailVariations}
                  onChange={(e) => setConfig({ ...config, emailVariations: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Try Name Variations</h4>
                <p className="text-sm text-gray-600">
                  Search Robert, Rob, Bob, etc.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.nameVariations}
                  onChange={(e) => setConfig({ ...config, nameVariations: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Try Company Variations</h4>
                <p className="text-sm text-gray-600">
                  Search StartCo, Start Co, StartCo Inc, etc.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.companyVariations}
                  onChange={(e) => setConfig({ ...config, companyVariations: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Enable Fuzzy Matching</h4>
                <p className="text-sm text-gray-600">
                  May return less accurate results
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.fuzzyMatching}
                  onChange={(e) => setConfig({ ...config, fuzzyMatching: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Confidence Threshold</h4>
              <select
                value={config.confidenceThreshold}
                onChange={(e) => setConfig({ ...config, confidenceThreshold: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="high">High (90%+) - Most accurate</option>
                <option value="medium">Medium (70%+) - Recommended</option>
                <option value="low">Low (50%+) - More matches</option>
              </select>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              Enabling more options may increase API usage and processing time.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Save & Retry Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
