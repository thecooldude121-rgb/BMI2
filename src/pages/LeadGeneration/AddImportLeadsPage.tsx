import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  FileText,
  Upload,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Users,
  Settings,
  ExternalLink,
  Search,
  ChevronDown,
  Plus
} from 'lucide-react';

type TabType = 'manual' | 'csv' | 'apollo' | 'zoominfo' | 'linkedin';
type CSVStep = 1 | 2 | 3;

interface ManualFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  linkedin: string;
  company: string;
  website: string;
  industry: string;
  companySize: string;
  source: string;
  owner: string;
  tags: string;
  notes: string;
  autoEnrich: boolean;
  addToSequence: boolean;
  sequence: string;
  notifyOwner: boolean;
  skipDuplicateCheck: boolean;
}

interface CSVImportData {
  file: File | null;
  mapping: Record<string, string>;
  skipDuplicates: boolean;
  updateExisting: boolean;
  autoAssign: boolean;
  assignmentType: string;
  autoEnrich: boolean;
  addToSequence: boolean;
  sequence: string;
  defaultSource: string;
  defaultStatus: string;
  defaultTags: string;
}

const AddImportLeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('manual');
  const [csvStep, setCSVStep] = useState<CSVStep>(1);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedApolloLeads, setSelectedApolloLeads] = useState<string[]>([]);

  const [manualForm, setManualForm] = useState<ManualFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: '',
    linkedin: '',
    company: '',
    website: '',
    industry: '',
    companySize: '',
    source: 'manual',
    owner: 'me',
    tags: '',
    notes: '',
    autoEnrich: true,
    addToSequence: false,
    sequence: '',
    notifyOwner: false,
    skipDuplicateCheck: false
  });

  const [csvData, setCSVData] = useState<CSVImportData>({
    file: null,
    mapping: {},
    skipDuplicates: true,
    updateExisting: false,
    autoAssign: true,
    assignmentType: 'round-robin',
    autoEnrich: true,
    addToSequence: false,
    sequence: '',
    defaultSource: 'csv-import',
    defaultStatus: 'new',
    defaultTags: 'CSV Import, Bulk Upload'
  });

  const industries = ['SaaS', 'FinTech', 'HealthTech', 'Manufacturing', 'E-commerce', 'Other'];
  const companySizes = ['1-10 employees', '11-50 employees', '51-200 employees', '201-500 employees', '501-1000 employees', '1000+ employees'];
  const sources = [
    { value: 'manual', label: '✍️ Manual', icon: '✍️' },
    { value: 'website', label: '🌐 Website', icon: '🌐' },
    { value: 'trade-show', label: '📞 Trade Show', icon: '📞' },
    { value: 'referral', label: '📧 Referral', icon: '📧' },
    { value: 'conference', label: '📱 Conference', icon: '📱' }
  ];
  const owners = ['Unassigned', 'Me (Sarah C.)', 'Alex T.', 'Mike J.', 'Round-robin'];

  const apolloResults = [
    {
      id: '1',
      name: 'Sarah Lee',
      title: 'CFO',
      company: 'TechStart Inc',
      industry: 'FinTech',
      employees: '45 employees',
      revenue: '$8M revenue',
      location: 'San Francisco, CA',
      email: 'sarah@techstart.com',
      verified: true,
      score: 85
    },
    {
      id: '2',
      name: 'John Smith',
      title: 'VP Sales',
      company: 'Acme Corp',
      industry: 'SaaS',
      employees: '75 employees',
      revenue: '$12M revenue',
      location: 'New York, NY',
      email: 'john@acme.com',
      verified: true,
      score: 78
    },
    {
      id: '3',
      name: 'Emma Wilson',
      title: 'VP Marketing',
      company: 'InnovateLabs',
      industry: 'HealthTech',
      employees: '30 employees',
      revenue: '$5M revenue',
      location: 'Austin, TX',
      email: 'emma@innovatelabs.com',
      verified: true,
      score: 82
    },
    {
      id: '4',
      name: 'Michael Torres',
      title: 'CTO',
      company: 'BigCo Enterprise',
      industry: 'Manufacturing',
      employees: '500 employees',
      revenue: '$50M revenue',
      location: 'Chicago, IL',
      email: 'michael@bigco.com',
      verified: true,
      score: 68
    },
    {
      id: '5',
      name: 'Lisa Anderson',
      title: 'Director',
      company: 'StartCo',
      industry: 'E-commerce',
      employees: '20 employees',
      revenue: '$3M revenue',
      location: 'Seattle, WA',
      email: 'lisa@startco.com',
      verified: true,
      score: 71
    }
  ];

  const handleManualSubmit = () => {
    if (!manualForm.firstName || !manualForm.lastName || !manualForm.email || !manualForm.company) {
      alert('Please fill in all required fields (marked with *)');
      return;
    }

    alert('Lead created successfully! Redirecting to lead detail...');
    navigate('/lead-generation/leads');
  };

  const handleAutoEnrich = () => {
    if (!manualForm.email) {
      alert('Please enter an email address first');
      return;
    }
    alert('Auto-enriching from email... This will fetch company data, social profiles, and more.');
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCSVData({ ...csvData, file });
      setCSVStep(2);
      alert(`File uploaded: ${file.name}`);
    }
  };

  const handleCSVImport = () => {
    setImporting(true);
    setImportProgress(0);

    const interval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setImporting(false);
          alert('Import completed! 245 leads created successfully.');
          navigate('/lead-generation/leads');
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const toggleApolloLead = (id: string) => {
    setSelectedApolloLeads(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleApolloImport = () => {
    if (selectedApolloLeads.length === 0) {
      alert('Please select at least one lead to import');
      return;
    }
    alert(`Importing ${selectedApolloLeads.length} leads from Apollo.io...`);
    setTimeout(() => {
      alert('Import completed successfully!');
      navigate('/lead-generation/leads');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-8 py-3">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <button onClick={() => navigate('/lead-generation/dashboard')} className="hover:text-blue-600">
            Dashboard
          </button>
          <span>&gt;</span>
          <button onClick={() => navigate('/lead-generation/leads')} className="hover:text-blue-600">
            Leads
          </button>
          <span>&gt;</span>
          <span className="text-gray-900 font-medium">Add/Import Leads</span>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center space-x-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <span>📥 Add/Import Leads</span>
            </h1>
            <p className="text-gray-600">Import leads from multiple sources or add manually</p>
          </div>
          <button
            onClick={() => navigate('/lead-generation/leads')}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-8">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'manual'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            Manual Entry
          </button>
          <button
            onClick={() => setActiveTab('csv')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'csv'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            CSV Import
          </button>
          <button
            onClick={() => setActiveTab('apollo')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'apollo'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            Apollo.io
          </button>
          <button
            onClick={() => setActiveTab('zoominfo')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'zoominfo'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            ZoomInfo
          </button>
          <button
            onClick={() => setActiveTab('linkedin')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'linkedin'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            LinkedIn
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-8 py-8">
        {/* Manual Entry Tab */}
        {activeTab === 'manual' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Manual Lead Entry Form</h2>

            {/* Contact Information */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Contact Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={manualForm.firstName}
                    onChange={(e) => setManualForm({ ...manualForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={manualForm.lastName}
                    onChange={(e) => setManualForm({ ...manualForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    value={manualForm.email}
                    onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                  <button
                    onClick={handleAutoEnrich}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>🤖 Auto-enrich from Email</span>
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={manualForm.phone}
                    onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1 555-0123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    value={manualForm.title}
                    onChange={(e) => setManualForm({ ...manualForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="VP Sales"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                  <input
                    type="url"
                    value={manualForm.linkedin}
                    onChange={(e) => setManualForm({ ...manualForm, linkedin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="linkedin.com/in/john"
                  />
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Company Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={manualForm.company}
                    onChange={(e) => setManualForm({ ...manualForm, company: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Acme Corp"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="url"
                    value={manualForm.website}
                    onChange={(e) => setManualForm({ ...manualForm, website: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="acme.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                  <select
                    value={manualForm.industry}
                    onChange={(e) => setManualForm({ ...manualForm, industry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Industry...</option>
                    {industries.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
                  <select
                    value={manualForm.companySize}
                    onChange={(e) => setManualForm({ ...manualForm, companySize: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Size...</option>
                    {companySizes.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Lead Details */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Lead Details
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lead Source</label>
                  <select
                    value={manualForm.source}
                    onChange={(e) => setManualForm({ ...manualForm, source: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {sources.map((src) => (
                      <option key={src.value} value={src.value}>
                        {src.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lead Owner</label>
                  <select
                    value={manualForm.owner}
                    onChange={(e) => setManualForm({ ...manualForm, owner: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {owners.map((owner) => (
                      <option key={owner} value={owner}>
                        {owner}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={manualForm.tags}
                  onChange={(e) => setManualForm({ ...manualForm, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="VIP, Decision Maker, Hot Lead"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Met at SaaS Summit 2024. Interested in our HRMS integration. Follow up within 2 weeks."
                />
              </div>
              {!manualForm.skipDuplicateCheck && (
                <div className="mt-4">
                  <button
                    onClick={() => {
                      if (manualForm.email) {
                        setShowDuplicateWarning(true);
                      } else {
                        alert('Please enter an email to check for duplicates');
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Search className="h-4 w-4" />
                    Check for Duplicates
                  </button>
                </div>
              )}
            </div>

            {/* Duplicate Detection */}
            {showDuplicateWarning && (
              <div className="mb-8">
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 relative">
                  <button
                    onClick={() => setShowDuplicateWarning(false)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-2">
                        ⚠️ Potential duplicate found:
                      </p>
                      <div className="bg-white rounded p-3 mb-3">
                        <p className="text-sm font-medium text-gray-900">John Smith - Acme Corp - VP Sales</p>
                        <p className="text-xs text-gray-600 mt-1">
                          Email: john@acme.com | Added: Nov 10, 2024
                        </p>
                      </div>
                      <div className="flex space-x-3">
                        <button className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50">
                          View Existing Lead
                        </button>
                        <button className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50">
                          Add Anyway
                        </button>
                        <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                          Merge & Update
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Options */}
            <div className="mb-8">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-between w-full text-left text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200"
              >
                <span>Advanced Options</span>
                <ChevronDown className={`h-5 w-5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </button>
              {showAdvanced && (
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={manualForm.autoEnrich}
                      onChange={(e) => setManualForm({ ...manualForm, autoEnrich: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Auto-enrich after creation (Apollo.io + ZoomInfo)
                    </span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={manualForm.addToSequence}
                      onChange={(e) => setManualForm({ ...manualForm, addToSequence: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Add to email sequence:</span>
                    <select
                      disabled={!manualForm.addToSequence}
                      className="ml-2 px-2 py-1 text-sm border border-gray-300 rounded"
                    >
                      <option>Select Sequence...</option>
                      <option>HRMS Warm Lead</option>
                      <option>New Customer Outreach</option>
                    </select>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={manualForm.notifyOwner}
                      onChange={(e) => setManualForm({ ...manualForm, notifyOwner: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Notify lead owner via email</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={manualForm.skipDuplicateCheck}
                      onChange={(e) => setManualForm({ ...manualForm, skipDuplicateCheck: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Skip duplicate check</span>
                  </label>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => navigate('/lead-generation/leads')}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => alert('Lead saved as draft')}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Save as Draft
              </button>
              <button
                onClick={handleManualSubmit}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Create Lead
              </button>
            </div>
          </div>
        )}

        {/* CSV Import Tab */}
        {activeTab === 'csv' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-6">CSV Import Wizard</h2>

            {/* Step 1: Upload File */}
            {csvStep === 1 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 1 of 3: Upload File</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center mb-6">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">📁 Drag & Drop CSV File Here</p>
                  <p className="text-gray-600 mb-4">or</p>
                  <input
                    type="file"
                    id="csvFileInput"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleCSVUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="csvFileInput"
                    className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer font-medium"
                  >
                    Browse Files
                  </label>
                  <p className="text-sm text-gray-500 mt-4">
                    Supported: .csv, .xlsx, .xls (Max 10,000 rows, 5MB)
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Download className="h-4 w-4" />
                  <button
                    onClick={() => alert('Downloading CSV template...')}
                    className="text-blue-600 hover:underline"
                  >
                    📄 Download Sample CSV Template
                  </button>
                  <span>- Pre-formatted CSV with example data</span>
                </div>
              </div>
            )}

            {/* Step 2: Map Columns */}
            {csvStep === 2 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 2 of 3: Map Columns</h3>
                <p className="text-sm text-gray-600 mb-6">
                  File: leads_export.csv (250 rows detected)
                </p>

                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-4">
                    Map your CSV columns to Lead Gen fields:
                  </p>
                  <div className="space-y-3">
                    {[
                      { csv: 'First Name', field: 'First Name' },
                      { csv: 'Last Name', field: 'Last Name' },
                      { csv: 'Email Address', field: 'Email' },
                      { csv: 'Phone Number', field: 'Phone' },
                      { csv: 'Job Title', field: 'Title' },
                      { csv: 'Company', field: 'Company Name' },
                      { csv: 'Website', field: 'Website' },
                      { csv: 'Industry', field: 'Industry' },
                      { csv: 'Employee Count', field: 'Company Size' },
                      { csv: 'Notes', field: 'Notes' },
                      { csv: 'Column 11', field: 'Skip' }
                    ].map((mapping, idx) => (
                      <div key={idx} className="grid grid-cols-3 gap-4 items-center">
                        <div className="text-sm text-gray-700">"{mapping.csv}"</div>
                        <div className="text-center text-gray-400">→</div>
                        <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                          <option>{mapping.field}</option>
                          <option>Skip</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-3">Preview (First 5 rows):</p>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Company</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Title</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Phone</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-900">John Smith</td>
                          <td className="px-4 py-2 text-sm text-gray-600">john@acme.com</td>
                          <td className="px-4 py-2 text-sm text-gray-900">Acme Corp</td>
                          <td className="px-4 py-2 text-sm text-gray-600">VP Sales</td>
                          <td className="px-4 py-2 text-sm text-gray-600">+1 555-0123</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-900">Sarah Lee</td>
                          <td className="px-4 py-2 text-sm text-gray-600">sarah@techstart.com</td>
                          <td className="px-4 py-2 text-sm text-gray-900">TechStart Inc</td>
                          <td className="px-4 py-2 text-sm text-gray-600">CFO</td>
                          <td className="px-4 py-2 text-sm text-gray-600">+1 555-0456</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-900">Mike Chen</td>
                          <td className="px-4 py-2 text-sm text-gray-600">mike@bigco.com</td>
                          <td className="px-4 py-2 text-sm text-gray-900">BigCo Enterprise</td>
                          <td className="px-4 py-2 text-sm text-gray-600">Director Ops</td>
                          <td className="px-4 py-2 text-sm text-gray-600">+1 555-0789</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-900">Lisa Wong</td>
                          <td className="px-4 py-2 text-sm text-gray-600">lisa@startco.com</td>
                          <td className="px-4 py-2 text-sm text-gray-900">StartCo</td>
                          <td className="px-4 py-2 text-sm text-gray-600">CEO</td>
                          <td className="px-4 py-2 text-sm text-gray-600">+1 555-0321</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-900">David Kumar</td>
                          <td className="px-4 py-2 text-sm text-gray-600">david@innovatelabs.com</td>
                          <td className="px-4 py-2 text-sm text-gray-900">InnovateLabs</td>
                          <td className="px-4 py-2 text-sm text-gray-600">CTO</td>
                          <td className="px-4 py-2 text-sm text-gray-600 italic">(no phone)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setCSVStep(1)}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setCSVStep(3)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Import Settings */}
            {csvStep === 3 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 3 of 3: Import Settings</h3>

                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-3">Import Options:</p>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={csvData.skipDuplicates}
                        onChange={(e) => setCSVData({ ...csvData, skipDuplicates: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Skip duplicate leads (match by email)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={csvData.updateExisting}
                        onChange={(e) => setCSVData({ ...csvData, updateExisting: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Update existing leads if duplicate found</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={csvData.autoAssign}
                        onChange={(e) => setCSVData({ ...csvData, autoAssign: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Auto-assign leads using:</span>
                      <select className="ml-2 px-2 py-1 text-sm border border-gray-300 rounded">
                        <option>Round-robin</option>
                        <option>Me only</option>
                        <option>Unassigned</option>
                      </select>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={csvData.autoEnrich}
                        onChange={(e) => setCSVData({ ...csvData, autoEnrich: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">
                        Auto-enrich after import (Apollo.io + ZoomInfo)
                      </span>
                    </label>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-3">Default Values (for missing data):</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Lead Source:</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                        <option>CSV Import</option>
                        <option>Manual</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Status:</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                        <option>New</option>
                        <option>Contacted</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm text-gray-600 mb-1">Tags:</label>
                      <input
                        type="text"
                        value={csvData.defaultTags}
                        onChange={(e) => setCSVData({ ...csvData, defaultTags: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm font-medium text-gray-900 mb-2">Import Summary:</p>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>• Total Rows: 250</li>
                    <li className="text-green-700">• Valid Leads: 245 ✅</li>
                    <li className="text-yellow-700">• Duplicates: 5 (will be skipped) ⚠️</li>
                    <li>• Invalid: 0 ❌</li>
                  </ul>
                </div>

                {importing && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                    <p className="text-sm font-medium text-gray-900 mb-2">
                      Importing... {Math.floor((importProgress / 100) * 245)} of 245 leads ({importProgress}%)
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all"
                        style={{ width: `${importProgress}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>✅ {Math.floor((importProgress / 100) * 245)} leads created</p>
                      <p>🔄 5 leads enriching...</p>
                      <p>⏳ {245 - Math.floor((importProgress / 100) * 245)} leads remaining</p>
                      <p className="font-medium">Estimated time: 2 minutes</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => navigate('/lead-generation/leads')}
                    disabled={importing}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setCSVStep(2)}
                    disabled={importing}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCSVImport}
                    disabled={importing}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                  >
                    Start Import
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Apollo.io Tab */}
        {activeTab === 'apollo' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Apollo.io Lead Import</h2>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="flex items-center space-x-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Connected</span>
                  </span>
                  <span className="text-gray-600">API Credits: 450 / 500 remaining</span>
                  <span className="text-gray-600">Last Sync: Nov 15, 2024 at 2:30 PM</span>
                </div>
              </div>
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                <Settings className="h-4 w-4" />
                <span>⚙️ Configure API</span>
              </button>
            </div>

            {/* Search Filters */}
            <div className="mb-6 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Search Filters</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm text-gray-700 mb-1">Job Titles</label>
                  <input
                    type="text"
                    placeholder="VP Sales, CFO, CTO, Director"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Company</label>
                  <input
                    type="text"
                    placeholder="Enter company name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Industry</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option>Select Industry...</option>
                    <option>SaaS</option>
                    <option>FinTech</option>
                    <option>HealthTech</option>
                    <option>Manufacturing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="San Francisco, CA"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Company Size</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option>Select Size...</option>
                    <option>1-10</option>
                    <option>11-50</option>
                    <option>51-200</option>
                    <option>201-500</option>
                    <option>501-1000</option>
                    <option>1000+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Revenue Range</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option>Select Revenue...</option>
                    <option>$0-$1M</option>
                    <option>$1M-$10M</option>
                    <option>$10M-$50M</option>
                    <option>$50M-$100M</option>
                    <option>$100M+</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-700 mb-1">Technologies Used</label>
                  <input
                    type="text"
                    placeholder="Salesforce, HubSpot, AWS"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white text-sm">
                  Clear
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center space-x-2">
                  <Search className="h-4 w-4" />
                  <span>Search</span>
                </button>
              </div>
            </div>

            {/* Results Table */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Search Results (125 leads found)
              </h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input type="checkbox" className="rounded border-gray-300" />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Name/Title</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Company</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Score</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {apolloResults.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedApolloLeads.includes(lead.id)}
                            onChange={() => toggleApolloLead(lead.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{lead.name}</p>
                          <p className="text-xs text-gray-600">{lead.title}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-900">{lead.company}</p>
                          <p className="text-xs text-gray-600">{lead.industry}, {lead.employees}</p>
                          <p className="text-xs text-gray-500">{lead.revenue}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{lead.location}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-900">{lead.email}</p>
                          {lead.verified && (
                            <span className="text-xs text-green-600">Verified✅</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-bold text-gray-900">{lead.score}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <input type="checkbox" className="rounded border-gray-300" />
                  <span>Select All</span>
                  <span className="ml-4 font-medium">
                    {selectedApolloLeads.length} of 125 selected
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                    1
                  </button>
                  <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                    2
                  </button>
                  <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                    3
                  </button>
                  <span className="px-3 py-1">...</span>
                  <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                    25
                  </button>
                  <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                    Next →
                  </button>
                </div>
              </div>
            </div>

            {/* Import Settings */}
            <div className="mb-6 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Import Settings:</h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                  <span className="text-sm text-gray-700">Skip duplicates</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                  <span className="text-sm text-gray-700">Auto-enrich company data</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                  <span className="text-sm text-gray-700">Auto-assign using:</span>
                  <select className="ml-2 px-2 py-1 text-sm border border-gray-300 rounded">
                    <option>Round-robin</option>
                  </select>
                </label>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-700">
                  Credits Required: {selectedApolloLeads.length} leads × 1 credit ={' '}
                  <span className="font-bold">{selectedApolloLeads.length} credits</span>
                </p>
                <p className="text-sm text-gray-600">
                  Remaining After Import: {450 - selectedApolloLeads.length} credits
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => navigate('/lead-generation/leads')}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleApolloImport}
                disabled={selectedApolloLeads.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import Selected ({selectedApolloLeads.length})
              </button>
            </div>
          </div>
        )}

        {/* ZoomInfo Tab */}
        {activeTab === 'zoominfo' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">ZoomInfo Lead Import</h2>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="flex items-center space-x-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Connected</span>
                  </span>
                  <span className="text-gray-600">API Credits: 230 / 300 remaining</span>
                  <span className="text-gray-600">Last Sync: Nov 14, 2024 at 10:15 AM</span>
                </div>
              </div>
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                <Settings className="h-4 w-4" />
                <span>⚙️ Configure API</span>
              </button>
            </div>
            <div className="text-center py-12">
              <p className="text-gray-600">
                [Similar interface to Apollo.io with ZoomInfo-specific filters]
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Search Filters: Job Title, Company, Location, Industry, Size
              </p>
              <p className="text-sm text-gray-500">
                Results Table: Name, Company, Email, Phone, LinkedIn
              </p>
              <p className="text-sm text-gray-500">Import Settings: Duplicates, Enrichment, Assignment</p>
            </div>
          </div>
        )}

        {/* LinkedIn Tab */}
        {activeTab === 'linkedin' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-4xl mx-auto">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">LinkedIn Lead Import</h2>
              <div className="flex items-center space-x-2 text-sm">
                <span className="flex items-center space-x-1 text-gray-400">
                  <span className="inline-block w-3 h-3 rounded-full bg-gray-400"></span>
                  <span>Not Connected</span>
                </span>
              </div>
            </div>

            <div className="space-y-6">
              {/* Method 1: Profile URL */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  1️⃣ LinkedIn Profile URL
                </h3>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Enter LinkedIn Profile URL:</label>
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/sarah-lee-cfo"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Fetch Profile
                    </button>
                  </div>
                </div>
              </div>

              {/* Method 2: Sales Navigator CSV */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  2️⃣ LinkedIn Sales Navigator Export (CSV)
                </h3>
                <div className="mb-4">
                  <label className="block text-sm text-gray-700 mb-2">
                    Upload Sales Navigator CSV:
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                <div className="bg-gray-50 rounded p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Instructions:</p>
                  <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                    <li>Go to Sales Navigator search results</li>
                    <li>Click "Export" button</li>
                    <li>Download CSV file</li>
                    <li>Upload here</li>
                  </ol>
                </div>
              </div>

              {/* Method 3: Connect Account */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  3️⃣ Connect LinkedIn Account (Coming Soon)
                </h3>
                <button
                  disabled
                  className="w-full px-4 py-3 bg-gray-100 text-gray-400 rounded-lg font-medium mb-4 cursor-not-allowed"
                >
                  🔗 Connect LinkedIn Account
                </button>
                <div className="bg-gray-50 rounded p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Enable direct import from:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• LinkedIn Connections</li>
                    <li>• Saved Leads</li>
                    <li>• Sales Navigator Lists</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddImportLeadsPage;
