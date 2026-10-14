import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import ImportWizard from '../../components/Leads/ImportWizard';
import { Upload, Check, Calendar, TrendingUp, Download, AlertCircle, X, ArrowLeft } from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  status: 'connected' | 'not-connected';
  logo: string;
  lastSync?: string;
  totalImported?: number;
  autoSync?: boolean;
  frequency?: string;
  assignedTo?: string;
  leadStatus?: string;
  tags?: string[];
  aiScoring?: boolean;
  benefits?: string[];
}

interface ImportHistory {
  id: string;
  date: string;
  time: string;
  source: string;
  totalLeads: number;
  highValue: number;
  mediumValue: number;
  lowValue: number;
  failed: number;
  duplicates?: number;
}

const ImportLeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const [showImportDetailsModal, setShowImportDetailsModal] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedImport, setSelectedImport] = useState<ImportHistory | null>(null);
  const [showFullHistory, setShowFullHistory] = useState(false);

  const integrations: Integration[] = [
    {
      // Was status 'connected' with "2 hours ago", "1,234 leads" imported and
      // auto-sync "Enabled" — directly under copy saying no integration is
      // wired. Nothing is connected; corrected 2026-10-03.
      id: 'apollo',
      name: 'Apollo.io',
      status: 'not-connected',
      logo: '🚀',
    },
    {
      id: 'zoominfo',
      name: 'ZoomInfo',
      status: 'not-connected',
      logo: '🔍',
    },
    {
      id: 'linkedin',
      name: 'LinkedIn Sales Navigator',
      status: 'not-connected',
      logo: '💼',
    },
    {
      id: 'lusha',
      name: 'Lusha',
      status: 'not-connected',
      logo: '📞',
    }
  ];

  // Was six invented Apollo.io imports (Nov 2025, with lead counts and
  // value splits). No import from an external provider has ever run; CSV
  // imports are not recorded as history either. Emptied 2026-10-03.
  const importHistory: ImportHistory[] = [];

  const handleViewTheseLeads = (importItem: ImportHistory) => {
    navigate(`/crm/leads?filter=import-${importItem.id}&date=${importItem.date}`);
  };

  const handleViewDetails = (importItem: ImportHistory) => {
    setSelectedImport(importItem);
    setShowImportDetailsModal(true);
  };

  const handleDownloadSample = () => {
    const csvContent = 'Full Name,Company,Email,Phone,Job Title\nJohn Doe,Acme Corp,john@acme.com,555-0123,Sales Manager\nJane Smith,TechStart,jane@techstart.com,555-0456,VP Marketing';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_leads_import.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/crm/leads')}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Leads</span>
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-start space-x-3">
          <Upload className="h-8 w-8 text-blue-600 mt-1" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Import Leads
            </h1>
            <p className="text-gray-600 text-lg mb-3">
              Connect and sync leads from an external lead generation tool
            </p>
            {/* This used to advertise "our native BMI Lead Gen Tool with
                real-time sync, unlimited leads, and advanced AI scoring
                included FREE". Lead Generation is a SEPARATE PLATFORM now (see
                CLAUDE.md, "Identity & SSO"), and none of those features exists
                to promise — so the claim went. The generic "any external tool"
                framing stays, because an import over an API boundary is exactly
                the right shape for this page.

                The connect action is already honest: handleCompleteConnection
                says plainly that there is no OAuth flow behind it and nothing
                was connected. */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <p className="text-blue-900 font-medium">
                BMI CRM can import leads from any external lead generation tool.
                Connecting a provider is not available yet — no integration is
                wired behind these cards.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">

        {/* Connected Integrations */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Lead Sources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {integrations.map((integration) => (
              <div
                key={integration.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-4xl">{integration.logo}</span>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{integration.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        {integration.status === 'connected' ? (
                          <span className="flex items-center text-sm text-green-600 font-medium">
                            <Check className="h-4 w-4 mr-1" />
                            Connected
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">Not Connected</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* No provider is wired: there is no OAuth flow and no sync behind
                    any of these. The card used to list the provider's marketing
                    claims ("Access to 100M+ B2B contacts") and a live Connect button
                    whose modal ended in an alert. Provider sourcing is the Lead
                    Generation product's job; here it stays "Coming soon". */}
                <Button disabled fullWidth title={`Connecting ${integration.name} is coming soon`}>
                  Connect · Coming soon
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Import History */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Imports</h2>
            {!showFullHistory && importHistory.length > 0 && (
              <button
                onClick={() => setShowFullHistory(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View Full Import History
              </button>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
            {importHistory.length === 0 && (
              <div className="p-8 text-center">
                <p className="font-medium text-gray-900">No imports yet</p>
                <p className="text-sm text-gray-600 mt-1">No lead source is connected, so nothing has been imported from one.</p>
              </div>
            )}
            {(showFullHistory ? importHistory : importHistory.slice(0, 4)).map((item) => (
              <div key={item.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <span className="font-semibold text-gray-900">
                        {item.date}, {item.time}
                      </span>
                      <span className="text-gray-500">from</span>
                      <span className="font-medium text-blue-600">{item.source}</span>
                    </div>

                    <div className="flex items-center space-x-6 text-sm">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-gray-600">High:</span>
                        <span className="font-semibold text-green-600">{item.highValue}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-yellow-500" />
                        <span className="text-gray-600">Medium:</span>
                        <span className="font-semibold text-yellow-600">{item.mediumValue}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Low:</span>
                        <span className="font-semibold text-gray-600">{item.lowValue}</span>
                      </div>
                      {item.failed > 0 && (
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <span className="text-gray-600">Failed:</span>
                          <span className="font-semibold text-red-600">{item.failed}</span>
                        </div>
                      )}
                      {item.duplicates && item.duplicates > 0 && (
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                          <span className="text-gray-600">Duplicates skipped:</span>
                          <span className="font-semibold text-orange-600">{item.duplicates}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      onClick={() => handleViewTheseLeads(item)}
                    >
                      View These Leads
                    </Button>
                    <button
                      onClick={() => handleViewDetails(item)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {showFullHistory && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowFullHistory(false)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Show Less
              </button>
            </div>
          )}
        </div>

        {/* Manual CSV Import */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Manual Import</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="max-w-3xl mx-auto">
              <div
                onClick={() => setWizardOpen(true)}
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer"
              >
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload CSV File</h3>
                <p className="text-sm text-gray-600 mb-4">Click to open the guided import wizard</p>
                <Button
                  onClick={e => { e.stopPropagation(); setWizardOpen(true); }}
                  size="xl"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Start CSV Import
                </Button>
              </div>

              <div className="mt-6 flex items-center justify-center">
                <button
                  onClick={handleDownloadSample}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Sample CSV Template
                </button>
              </div>

              <div className="mt-8 p-6 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">6-step guided import:</h4>
                <ol className="space-y-2 text-sm text-gray-700">
                  {['Upload CSV (up to 1,000 rows)', 'Auto-map columns to CRM fields', 'Validate rows — see errors, warnings & duplicates', 'Set import rules: status, owner, tags, source', 'Review the final plan before confirming', 'Real-time progress + post-import summary'].map((step, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <span className="font-semibold flex-shrink-0">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Import Details Modal */}
      {showImportDetailsModal && selectedImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Import Details
              </h3>
              <button
                onClick={() => setShowImportDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="text-gray-600">Import Date:</span>
                <span className="font-medium text-gray-900">{selectedImport.date} at {selectedImport.time}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="text-gray-600">Source:</span>
                <span className="font-medium text-gray-900">{selectedImport.source}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="text-gray-600">Total Leads:</span>
                <span className="font-medium text-gray-900">{selectedImport.totalLeads}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="text-gray-600">High Value Leads:</span>
                <span className="font-medium text-green-600">{selectedImport.highValue} (Score 80+)</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="text-gray-600">Medium Value Leads:</span>
                <span className="font-medium text-yellow-600">{selectedImport.mediumValue} (Score 60-79)</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="text-gray-600">Low Value Leads:</span>
                <span className="font-medium text-gray-600">{selectedImport.lowValue} (Score &lt;60)</span>
              </div>
              {selectedImport.failed > 0 && (
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-600">Failed Imports:</span>
                  <span className="font-medium text-red-600">{selectedImport.failed}</span>
                </div>
              )}
              {selectedImport.duplicates && selectedImport.duplicates > 0 && (
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-600">Duplicates Skipped:</span>
                  <span className="font-medium text-orange-600">{selectedImport.duplicates}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowImportDetailsModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Close
              </button>
              <Button
                onClick={() => {
                  setShowImportDetailsModal(false);
                  handleViewTheseLeads(selectedImport);
                }}
                fullWidth
              >
                View These Leads
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Import Wizard overlay */}
      {wizardOpen && <ImportWizard onClose={() => setWizardOpen(false)} />}

    </div>
  );
};

export default ImportLeadsPage;
