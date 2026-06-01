import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  Check,
  Settings,
  Calendar,
  TrendingUp,
  Zap,
  Download,
  ExternalLink,
  Clock,
  Users,
  AlertCircle,
  FileText,
  Link as LinkIcon,
  X,
  ArrowLeft,
  Loader2,
  ChevronRight
} from 'lucide-react';

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

interface CSVColumnMapping {
  csvColumn: string;
  crmField: string;
}

const ImportLeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [showImportDetailsModal, setShowImportDetailsModal] = useState(false);
  const [showCSVPreviewModal, setShowCSVPreviewModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [selectedImport, setSelectedImport] = useState<ImportHistory | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [showFullHistory, setShowFullHistory] = useState(false);

  const [configForm, setConfigForm] = useState({
    assignedTo: 'Alex Rodriguez (You)',
    defaultStatus: 'New',
    tags: 'Lead Gen, Apollo',
    syncFrequency: 'Every 6 hours',
    aiScoring: true
  });

  const [csvMapping, setCsvMapping] = useState<CSVColumnMapping[]>([
    { csvColumn: 'Full Name', crmField: 'name' },
    { csvColumn: 'Company', crmField: 'company' },
    { csvColumn: 'Email', crmField: 'email' },
    { csvColumn: 'Phone', crmField: 'phone' },
    { csvColumn: 'Job Title', crmField: 'position' }
  ]);

  const integrations: Integration[] = [
    {
      id: 'apollo',
      name: 'Apollo.io',
      status: 'connected',
      logo: '🚀',
      lastSync: '2 hours ago',
      totalImported: 1234,
      autoSync: true,
      frequency: 'Every 6 hours',
      assignedTo: 'Alex Rodriguez (You)',
      leadStatus: 'New',
      tags: ['Lead Gen', 'Apollo'],
      aiScoring: true
    },
    {
      id: 'zoominfo',
      name: 'ZoomInfo',
      status: 'not-connected',
      logo: '🔍',
      benefits: [
        'Access to 100M+ B2B contacts',
        'Advanced company intelligence',
        'Direct dial phone numbers'
      ]
    },
    {
      id: 'linkedin',
      name: 'LinkedIn Sales Navigator',
      status: 'not-connected',
      logo: '💼',
      benefits: [
        'Advanced LinkedIn search',
        'InMail capabilities',
        'Lead recommendations'
      ]
    },
    {
      id: 'lusha',
      name: 'Lusha',
      status: 'not-connected',
      logo: '📞',
      benefits: [
        'Contact enrichment',
        'Email finder',
        'Phone number lookup'
      ]
    }
  ];

  const importHistory: ImportHistory[] = [
    {
      id: '1',
      date: 'Nov 15, 2025',
      time: '10:00 AM',
      source: 'Apollo.io',
      totalLeads: 25,
      highValue: 8,
      mediumValue: 12,
      lowValue: 5,
      failed: 0
    },
    {
      id: '2',
      date: 'Nov 13, 2025',
      time: '4:00 PM',
      source: 'Apollo.io',
      totalLeads: 18,
      highValue: 5,
      mediumValue: 9,
      lowValue: 4,
      failed: 0
    },
    {
      id: '3',
      date: 'Nov 10, 2025',
      time: '9:00 AM',
      source: 'Apollo.io',
      totalLeads: 32,
      highValue: 12,
      mediumValue: 15,
      lowValue: 5,
      failed: 0
    },
    {
      id: '4',
      date: 'Nov 8, 2025',
      time: '2:00 PM',
      source: 'Apollo.io',
      totalLeads: 5,
      highValue: 2,
      mediumValue: 2,
      lowValue: 1,
      failed: 0,
      duplicates: 2
    }
  ];

  const handleImportNow = (integration: Integration) => {
    setSelectedIntegration(integration);
    setImportSuccess(false);
    setImportProgress(0);
    setShowImportModal(true);
  };

  const handleConfigure = (integration: Integration) => {
    setSelectedIntegration(integration);
    setConfigForm({
      assignedTo: integration.assignedTo || 'Alex Rodriguez (You)',
      defaultStatus: integration.leadStatus || 'New',
      tags: integration.tags?.join(', ') || '',
      syncFrequency: integration.frequency || 'Every 6 hours',
      aiScoring: integration.aiScoring || false
    });
    setShowConfigModal(true);
  };

  const handleConnect = (integration: Integration) => {
    setSelectedIntegration(integration);
    setShowConnectModal(true);
  };

  const handleDisconnectClick = (integration: Integration) => {
    setSelectedIntegration(integration);
    setShowDisconnectModal(true);
  };

  const handleConfirmDisconnect = () => {
    setShowDisconnectModal(false);
    setTimeout(() => {
      alert(`${selectedIntegration?.name} has been disconnected. Auto-sync has been stopped.`);
    }, 100);
  };

  const handleStartImport = () => {
    setImporting(true);
    setImportProgress(0);

    const interval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setImporting(false);
          setImportSuccess(true);
          setImportedCount(25);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleImportComplete = () => {
    setShowImportModal(false);
    navigate('/crm/leads?filter=just-imported');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      setUploadedFile(file);
      setShowCSVPreviewModal(true);
    } else {
      alert('Please upload a CSV file');
    }
  };

  const handleSaveConfig = () => {
    setShowConfigModal(false);
    setTimeout(() => {
      alert('✅ Configuration saved successfully!');
    }, 100);
  };

  const handleCompleteConnection = () => {
    setShowConnectModal(false);
    setTimeout(() => {
      alert(`✅ ${selectedIntegration?.name} connected successfully! You can now start importing leads.`);
    }, 100);
  };

  const handleViewTheseLeads = (importItem: ImportHistory) => {
    navigate(`/crm/leads?filter=import-${importItem.id}&date=${importItem.date}`);
  };

  const handleViewDetails = (importItem: ImportHistory) => {
    setSelectedImport(importItem);
    setShowImportDetailsModal(true);
  };

  const handleCSVImport = () => {
    setShowCSVPreviewModal(false);
    setImporting(true);
    setImportProgress(0);
    setShowImportModal(true);

    const interval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setImporting(false);
          setImportSuccess(true);
          setImportedCount(50);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
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
              Import Leads from Lead Generation Tool
            </h1>
            <p className="text-gray-600 text-lg mb-3">
              Connect and sync leads automatically from your lead generation tools
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <p className="text-blue-900 font-medium">
                BMI CRM integrates with any lead generation tool. For the best experience, use our native BMI Lead Gen Tool with real-time sync, unlimited leads, and advanced AI scoring included FREE.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">

        {/* Connected Integrations */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Connected Integrations</h2>
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

                {integration.status === 'connected' ? (
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Last sync:</span>
                      <span className="font-medium text-gray-900">{integration.lastSync}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Total imported:</span>
                      <span className="font-medium text-gray-900">{integration.totalImported?.toLocaleString()} leads</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Auto-sync:</span>
                      <span className="flex items-center font-medium text-green-600">
                        <Zap className="h-3 w-3 mr-1" />
                        Enabled ({integration.frequency})
                      </span>
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                      <div className="text-xs text-gray-600 mb-2">Settings:</div>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                          Auto-assign: {integration.assignedTo}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                          Status: {integration.leadStatus}
                        </span>
                        {integration.tags?.map(tag => (
                          <span key={tag} className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-600 font-medium mb-2">Benefits:</p>
                    {integration.benefits?.map((benefit, idx) => (
                      <div key={idx} className="flex items-start space-x-2 text-sm text-gray-600">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  {integration.status === 'connected' ? (
                    <>
                      <button
                        onClick={() => handleImportNow(integration)}
                        className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Import Now
                      </button>
                      <button
                        onClick={() => handleConfigure(integration)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDisconnectClick(integration)}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleConnect(integration)}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                    >
                      Connect {integration.name}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Import History */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Imports</h2>
            {!showFullHistory && (
              <button
                onClick={() => setShowFullHistory(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View Full Import History
              </button>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
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
                    <button
                      onClick={() => handleViewTheseLeads(item)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      View These Leads
                    </button>
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
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Upload CSV File
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Drop your CSV file here, or click to browse
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer font-medium"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </label>
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
                <h4 className="font-semibold text-gray-900 mb-3">How CSV Import Works:</h4>
                <ol className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start space-x-2">
                    <span className="font-semibold">1.</span>
                    <span>Upload your CSV file with lead data</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="font-semibold">2.</span>
                    <span>Map CSV columns to CRM fields</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="font-semibold">3.</span>
                    <span>Review and preview the data</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="font-semibold">4.</span>
                    <span>Import leads with AI-powered scoring</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="font-semibold">5.</span>
                    <span>Duplicate detection automatically skips existing leads</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="mr-2">🔄</span>
              Automatic Lead Import Process
            </h3>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Connect Your Tool</h4>
                  <p className="text-gray-600">Link Apollo.io, ZoomInfo, or other tools</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Auto-Sync Enabled</h4>
                  <p className="text-gray-600">New leads automatically flow into your CRM</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">AI Scoring</h4>
                  <p className="text-gray-600">🤖 Every lead is scored automatically (1-100)</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Auto-Assignment</h4>
                  <p className="text-gray-600">Leads assigned to team members based on rules</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                  5
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Ready to Contact</h4>
                  <p className="text-gray-600">Start selling immediately</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Import Progress Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            {!importSuccess ? (
              <>
                <div className="text-center mb-6">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    {importing ? (
                      <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                    ) : (
                      <Upload className="h-8 w-8 text-blue-600" />
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {importing ? 'Importing Leads...' : 'Ready to Import'}
                  </h3>
                  <p className="text-gray-600">
                    {importing
                      ? 'Please wait while we import your leads from ' + selectedIntegration?.name
                      : 'Import leads from ' + selectedIntegration?.name
                    }
                  </p>
                </div>

                {importing && (
                  <div className="mb-6">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${importProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 text-center mt-2">{importProgress}% complete</p>
                  </div>
                )}

                {!importing && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowImportModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleStartImport}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Start Import
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Import Complete!
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Successfully imported <span className="font-bold text-green-600">{importedCount} new leads</span> from {selectedIntegration?.name}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleImportComplete}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    View Imported Leads
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Configure Settings Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Configure {selectedIntegration?.name} Settings
              </h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto-assign to
                </label>
                <select
                  value={configForm.assignedTo}
                  onChange={(e) => setConfigForm({...configForm, assignedTo: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>Alex Rodriguez (You)</option>
                  <option>Sarah Johnson</option>
                  <option>Mike Chen</option>
                  <option>Round Robin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Lead Status
                </label>
                <select
                  value={configForm.defaultStatus}
                  onChange={(e) => setConfigForm({...configForm, defaultStatus: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>New</option>
                  <option>Contacted</option>
                  <option>Qualified</option>
                  <option>Unqualified</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={configForm.tags}
                  onChange={(e) => setConfigForm({...configForm, tags: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Lead Gen, Apollo, Outbound"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto-sync Frequency
                </label>
                <select
                  value={configForm.syncFrequency}
                  onChange={(e) => setConfigForm({...configForm, syncFrequency: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>Every 1 hour</option>
                  <option>Every 3 hours</option>
                  <option>Every 6 hours</option>
                  <option>Every 12 hours</option>
                  <option>Daily</option>
                  <option>Manual only</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">AI-Powered Lead Scoring</p>
                  <p className="text-sm text-gray-600">Automatically score leads using AI</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={configForm.aiScoring}
                    onChange={(e) => setConfigForm({...configForm, aiScoring: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfigModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfig}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disconnect Confirmation Modal */}
      {showDisconnectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
              Disconnect {selectedIntegration?.name}?
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to disconnect this integration? Auto-sync will be stopped and you won't receive new leads automatically.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDisconnectModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDisconnect}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Yes, Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connect Integration Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Connect {selectedIntegration?.name}
              </h3>
              <button
                onClick={() => setShowConnectModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Enter your {selectedIntegration?.name} API key to connect and start importing leads.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your API key"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                You can find your API key in {selectedIntegration?.name} settings
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConnectModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteConnection}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}

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
              <button
                onClick={() => {
                  setShowImportDetailsModal(false);
                  handleViewTheseLeads(selectedImport);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                View These Leads
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Preview Modal */}
      {showCSVPreviewModal && uploadedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Map CSV Columns
              </h3>
              <button
                onClick={() => setShowCSVPreviewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                File: <span className="font-medium">{uploadedFile.name}</span>
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Map your CSV columns to CRM fields. Preview shows approximately 50 leads will be imported.
              </p>

              <div className="space-y-3">
                {csvMapping.map((mapping, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">CSV Column</label>
                      <input
                        type="text"
                        value={mapping.csvColumn}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                      />
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 mt-5" />
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">CRM Field</label>
                      <select
                        value={mapping.crmField}
                        onChange={(e) => {
                          const newMapping = [...csvMapping];
                          newMapping[index].crmField = e.target.value;
                          setCsvMapping(newMapping);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="name">Name</option>
                        <option value="company">Company</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="position">Position/Title</option>
                        <option value="website">Website</option>
                        <option value="linkedin">LinkedIn URL</option>
                        <option value="skip">Skip this column</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCSVPreviewModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCSVImport}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Import 50 Leads
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ImportLeadsPage;
