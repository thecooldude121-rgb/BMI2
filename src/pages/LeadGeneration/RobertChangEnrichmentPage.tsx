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
    addToast('✏️ Opening manual entry form...', 'info');
  };

  const handleConfigureSearch = () => {
    addToast('⚙️ Opening search configuration...', 'info');
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
                <button className="text-sm text-red-700 hover:text-red-900 font-medium underline">
                  Learn Why
                </button>
                <button className="text-sm text-red-700 hover:text-red-900 font-medium underline">
                  Manual Entry Guide
                </button>
                <button className="text-sm text-red-700 hover:text-red-900 font-medium underline">
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
  onSearchWeb
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
}) {
  const availableCount = fields.filter(f => f.status === 'available').length;
  const totalCount = fields.length;

  return (
    <div>
      <h4 className="text-sm font-bold text-gray-700 mb-3">
        {title} ({availableCount}/{totalCount} fields)
      </h4>
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
