import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Settings,
  Search,
  DollarSign,
  Users,
  Rocket,
  Globe,
  Plus,
  Eye,
  BellOff,
  MoreHorizontal,
  ExternalLink,
  Undo,
  TrendingUp,
  Filter,
  X,
  Calendar,
  Star,
  Share2,
  AlertTriangle,
  Clock,
  CheckCircle,
  BarChart3,
  ChevronDown
} from 'lucide-react';

type SignalType = 'funding' | 'hiring' | 'product' | 'expansion';
type SignalStatus = 'new' | 'in_review' | 'converted' | 'dismissed';

interface IntelligenceSignal {
  id: string;
  type: SignalType;
  title: string;
  company: string;
  industry: string;
  employees: number;
  location: string;
  timeAgo: string;
  aiAnalysis: string[];
  leadScore: number;
  keyDetails: Array<{ label: string; value: string }>;
  relatedSignals?: string[];
  decisionMakers?: Array<{ name: string; title: string; email: string }>;
  opportunity?: string[];
  status: SignalStatus;
  statusDetails?: {
    convertedTo?: string;
    convertedBy?: string;
    convertedDate?: string;
    dismissedBy?: string;
    dismissedDate?: string;
    dismissReason?: string;
  };
}

const SalesIntelligenceFeed: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSignalType, setSelectedSignalType] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('7days');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [selectedCompanySize, setSelectedCompanySize] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState('list');

  // Modal states
  const [showAddToLeadsModal, setShowAddToLeadsModal] = useState(false);
  const [showDismissModal, setShowDismissModal] = useState(false);
  const [showCompanyPreviewModal, setShowCompanyPreviewModal] = useState(false);
  const [showConversionFunnelModal, setShowConversionFunnelModal] = useState(false);
  const [showMoreActionsMenu, setShowMoreActionsMenu] = useState<string | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<IntelligenceSignal | null>(null);
  const [dismissReason, setDismissReason] = useState('');
  const [dismissNote, setDismissNote] = useState('');

  // Mock data for intelligence signals
  const signals: IntelligenceSignal[] = [
    {
      id: '1',
      type: 'funding',
      title: 'TechStart Inc raised $10M Series A',
      company: 'TechStart Inc',
      industry: 'FinTech',
      employees: 45,
      location: 'San Francisco, CA',
      timeAgo: '2 hours ago',
      aiAnalysis: [
        'High buying intent - Budget confirmed',
        'Growth stage - Likely building teams',
        'Lead Score Potential: 88/100'
      ],
      leadScore: 88,
      keyDetails: [
        { label: 'Round Size', value: '$10 million' },
        { label: 'Lead Investor', value: 'Accel Partners' },
        { label: 'Use Case', value: 'Expand sales team, scale operations' },
        { label: 'Source', value: 'Crunchbase' }
      ],
      relatedSignals: [
        'Hired VP of Sales (1 month ago)',
        'Posted 3 sales engineer jobs (2 weeks ago)'
      ],
      status: 'new'
    },
    {
      id: '2',
      type: 'hiring',
      title: 'DataFlow Inc posted 5 Sales Engineer jobs',
      company: 'DataFlow Inc',
      industry: 'Data Analytics',
      employees: 120,
      location: 'Austin, TX',
      timeAgo: '5 hours ago',
      aiAnalysis: [
        'Scaling sales team - High buying intent',
        'Rapid growth phase',
        'Lead Score Potential: 85/100'
      ],
      leadScore: 85,
      keyDetails: [
        { label: 'Job Titles', value: 'Sales Engineer (5 positions)' },
        { label: 'Location', value: 'Remote + Austin HQ' },
        { label: 'Posted', value: 'Nov 15, 2024' },
        { label: 'Source', value: 'LinkedIn Jobs' }
      ],
      decisionMakers: [
        { name: 'Robert Chang', title: 'CEO', email: 'robert@dataflow.com' },
        { name: 'Emma Wilson', title: 'VP Sales', email: 'emma@dataflow.com' }
      ],
      status: 'new'
    },
    {
      id: '3',
      type: 'product',
      title: 'Acme Corp launched new enterprise product line',
      company: 'Acme Corp',
      industry: 'SaaS',
      employees: 75,
      location: 'New York, NY',
      timeAgo: '1 day ago',
      aiAnalysis: [
        'Product expansion - Integration opportunities',
        'Enterprise focus - Higher deal sizes',
        'Lead Score Potential: 78/100'
      ],
      leadScore: 78,
      keyDetails: [
        { label: 'Product', value: 'Enterprise Analytics Platform' },
        { label: 'Target', value: 'Fortune 500 companies' },
        { label: 'Launch Date', value: 'Nov 14, 2024' },
        { label: 'Source', value: 'Company Blog + TechCrunch' }
      ],
      opportunity: [
        'New product needs integrations with HR/sales tools',
        'Enterprise customers need our solutions'
      ],
      status: 'in_review'
    },
    {
      id: '4',
      type: 'expansion',
      title: 'InnovateLabs opened new office in Austin, TX',
      company: 'InnovateLabs',
      industry: 'HealthTech',
      employees: 30,
      location: 'Originally: Boston, MA',
      timeAgo: '3 days ago',
      aiAnalysis: [
        'Geographic expansion - Growth mode',
        'Hiring local teams - New office needs tools',
        'Lead Score Potential: 72/100'
      ],
      leadScore: 72,
      keyDetails: [
        { label: 'New Office', value: 'Austin, TX (2,500 sq ft)' },
        { label: 'Expected Headcount', value: '15 new hires' },
        { label: 'Opening Date', value: 'December 2024' },
        { label: 'Source', value: 'Google News + LinkedIn' }
      ],
      opportunity: [
        'New office setup needs HR/sales systems',
        'Local hiring = potential HRMS opportunity'
      ],
      status: 'new'
    },
    {
      id: '5',
      type: 'funding',
      title: 'CloudNine Inc raised $18M Series B',
      company: 'CloudNine Inc',
      industry: 'Cloud Services',
      employees: 90,
      location: 'Seattle, WA',
      timeAgo: '1 week ago',
      aiAnalysis: [
        'Mature funding round - Established company',
        'Cloud infrastructure focus',
        'Lead Score Potential: 88/100'
      ],
      leadScore: 88,
      keyDetails: [
        { label: 'Round Size', value: '$18 million Series B' },
        { label: 'Lead Investor', value: 'Sequoia Capital' },
        { label: 'Source', value: 'Crunchbase' }
      ],
      status: 'converted',
      statusDetails: {
        convertedTo: 'Jessica Park (CEO) - Score: 88/100',
        convertedBy: 'Sarah C.',
        convertedDate: 'Nov 8, 2024'
      }
    },
    {
      id: '6',
      type: 'hiring',
      title: 'SmallBiz Inc posted 2 marketing jobs',
      company: 'SmallBiz Inc',
      industry: 'E-commerce',
      employees: 5,
      location: 'Remote',
      timeAgo: '2 weeks ago',
      aiAnalysis: [
        'Small company - May not fit ICP',
        'Marketing roles - Not sales focused',
        'Lead Score Potential: 45/100'
      ],
      leadScore: 45,
      keyDetails: [
        { label: 'Job Titles', value: 'Marketing Specialist (2 positions)' },
        { label: 'Source', value: 'LinkedIn Jobs' }
      ],
      status: 'dismissed',
      statusDetails: {
        dismissedBy: 'Mike J.',
        dismissedDate: 'Nov 1, 2024',
        dismissReason: 'Company too small (below 10 employees)'
      }
    }
  ];

  const getSignalIcon = (type: SignalType) => {
    switch (type) {
      case 'funding':
        return <DollarSign className="h-5 w-5" />;
      case 'hiring':
        return <Users className="h-5 w-5" />;
      case 'product':
        return <Rocket className="h-5 w-5" />;
      case 'expansion':
        return <Globe className="h-5 w-5" />;
    }
  };

  const getSignalColor = (type: SignalType) => {
    switch (type) {
      case 'funding':
        return 'text-orange-600 bg-orange-50';
      case 'hiring':
        return 'text-green-600 bg-green-50';
      case 'product':
        return 'text-blue-600 bg-blue-50';
      case 'expansion':
        return 'text-purple-600 bg-purple-50';
    }
  };

  const getSignalLabel = (type: SignalType) => {
    switch (type) {
      case 'funding':
        return 'FUNDING';
      case 'hiring':
        return 'HIRING';
      case 'product':
        return 'PRODUCT LAUNCH';
      case 'expansion':
        return 'EXPANSION';
    }
  };

  const getStatusBadge = (status: SignalStatus) => {
    switch (status) {
      case 'new':
        return <span className="text-green-600 font-medium">🟢 New Signal</span>;
      case 'in_review':
        return <span className="text-yellow-600 font-medium">🟡 In Review</span>;
      case 'converted':
        return <span className="text-blue-600 font-medium">✅ Converted to Lead</span>;
      case 'dismissed':
        return <span className="text-red-600 font-medium">❌ Dismissed</span>;
    }
  };

  const handleAddToLeads = (signal: IntelligenceSignal) => {
    setSelectedSignal(signal);
    setShowAddToLeadsModal(true);
  };

  const handleCreateLead = (createMultiple: boolean) => {
    setShowAddToLeadsModal(false);
    if (selectedSignal) {
      navigate(`/lead-generation/leads/new?from=intelligence&signalId=${selectedSignal.id}`);
    }
  };

  const handleViewDetails = (signalId: string) => {
    navigate(`/lead-generation/intelligence/${signalId}`);
  };

  const handleDismiss = (signal: IntelligenceSignal) => {
    setSelectedSignal(signal);
    setShowDismissModal(true);
  };

  const confirmDismiss = () => {
    setShowDismissModal(false);
    setDismissReason('');
    setDismissNote('');
    alert(`Signal dismissed: ${dismissReason}`);
  };

  const handleUndoDismiss = (signalId: string) => {
    alert(`Signal restored to active feed`);
  };

  const handleViewLead = (signalId: string) => {
    navigate(`/lead-generation/leads/${signalId}`);
  };

  const handleCompanyClick = (signal: IntelligenceSignal) => {
    setSelectedSignal(signal);
    setShowCompanyPreviewModal(true);
  };

  const handleStatClick = (stat: string) => {
    switch (stat) {
      case 'total':
        setSelectedSignalType('all');
        setSelectedDateRange('7days');
        setSearchQuery('');
        break;
      case 'new':
        setSelectedDateRange('7days');
        break;
      case 'leads':
        navigate('/lead-generation/leads?source=intelligence');
        break;
      case 'conversion':
        setShowConversionFunnelModal(true);
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-8 py-3">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <button
            onClick={() => navigate('/lead-generation/dashboard')}
            className="hover:text-blue-600 transition-colors"
          >
            Dashboard
          </button>
          <span>&gt;</span>
          <span className="text-gray-900 font-medium">Sales Intelligence</span>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center space-x-3">
              <Bell className="h-8 w-8 text-blue-600" />
              <span>Sales Intelligence Feed</span>
            </h1>
            <p className="text-gray-600">
              Automated company signals: funding, hiring, product launches
            </p>
          </div>
          <button
            onClick={() => navigate('/lead-generation/settings?section=intelligence')}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span>Configure</span>
          </button>
        </div>
      </div>

      {/* Stats Bar - Clickable */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="grid grid-cols-4 gap-6">
          <button
            onClick={() => handleStatClick('total')}
            className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200 hover:shadow-md transition-all text-left"
          >
            <div className="text-3xl font-bold text-blue-900 mb-1">450</div>
            <div className="text-sm font-medium text-blue-700 mb-1">Total Signals</div>
            <div className="text-xs text-blue-600">Monitored</div>
          </button>
          <button
            onClick={() => handleStatClick('new')}
            className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200 hover:shadow-md transition-all text-left"
          >
            <div className="text-3xl font-bold text-green-900 mb-1">50</div>
            <div className="text-sm font-medium text-green-700 mb-1">New This Week</div>
            <div className="text-xs text-green-600">+12%</div>
          </button>
          <button
            onClick={() => handleStatClick('leads')}
            className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200 hover:shadow-md transition-all text-left"
          >
            <div className="text-3xl font-bold text-purple-900 mb-1">15</div>
            <div className="text-sm font-medium text-purple-700 mb-1">Leads Created</div>
            <div className="text-xs text-purple-600">from Feed</div>
          </button>
          <button
            onClick={() => handleStatClick('conversion')}
            className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border border-orange-200 hover:shadow-md transition-all text-left"
          >
            <div className="text-3xl font-bold text-orange-900 mb-1">85%</div>
            <div className="text-sm font-medium text-orange-700 mb-1">Conversion Rate</div>
            <div className="text-xs text-orange-600">(High!)</div>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="space-y-4">
          {/* Signal Type Filters */}
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-700">Signal Type:</span>
            <button
              onClick={() => setSelectedSignalType('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedSignalType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedSignalType('funding')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                selectedSignalType === 'funding'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>💰</span>
              <span>Funding</span>
            </button>
            <button
              onClick={() => setSelectedSignalType('hiring')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                selectedSignalType === 'hiring'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>📈</span>
              <span>Hiring</span>
            </button>
            <button
              onClick={() => setSelectedSignalType('product')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                selectedSignalType === 'product'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>🚀</span>
              <span>Product</span>
            </button>
            <button
              onClick={() => setSelectedSignalType('expansion')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                selectedSignalType === 'expansion'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>🌍</span>
              <span>Expansion</span>
            </button>
          </div>

          {/* Additional Filters */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range:</label>
              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="quarter">Last Quarter</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry:</label>
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Industries</option>
                <option value="fintech">FinTech</option>
                <option value="healthtech">HealthTech</option>
                <option value="saas">SaaS</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="ecommerce">E-commerce</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Size:</label>
              <select
                value={selectedCompanySize}
                onChange={(e) => setSelectedCompanySize(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Sizes</option>
                <option value="1-50">1-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="500+">500+ employees</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search:</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search company, event, keyword..."
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Sort and View Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="recent">Most Recent</option>
                <option value="oldest">Oldest First</option>
                <option value="score">Highest Score</option>
                <option value="type">Signal Type</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">View:</span>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="list">📋 List View</option>
                <option value="grid">🔲 Grid View</option>
                <option value="table">📊 Table View</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Intelligence Feed */}
      <div className="px-8 py-8">
        <div className="space-y-6 max-w-7xl">
          {signals.map((signal) => (
            <div key={signal.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {/* Signal Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getSignalColor(signal.type)}`}>
                    {getSignalIcon(signal.type)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-gray-700">
                        {getSignalLabel(signal.type)}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-sm text-gray-500">{signal.timeAgo}</span>
              </div>

              <div className="border-t border-gray-200 pt-4">
                {/* Signal Title */}
                <button
                  onClick={() => handleViewDetails(signal.id)}
                  className="text-lg font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors text-left"
                >
                  {signal.title}
                </button>
                <div className="text-sm text-gray-600 mb-4">
                  <button
                    onClick={() => handleCompanyClick(signal)}
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    {signal.company}
                  </button>
                  <span> | {signal.industry} | {signal.employees} employees | {signal.location}</span>
                </div>

                {/* AI Analysis */}
                <div className="mb-4 bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm font-semibold text-gray-900 mb-2">🤖 AI Analysis:</p>
                  <ul className="space-y-1">
                    {signal.aiAnalysis.map((analysis, idx) => (
                      <li key={idx} className="text-sm text-gray-700">
                        • {analysis}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Key Details */}
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Key Details:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {signal.keyDetails.map((detail, idx) => (
                      <div key={idx} className="text-sm">
                        <span className="text-gray-600">• {detail.label}:</span>{' '}
                        <span className="text-gray-900">{detail.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Related Signals */}
                {signal.relatedSignals && (
                  <div className="mb-4">
                    <button
                      onClick={() => handleCompanyClick(signal)}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700 mb-2"
                    >
                      Related Signals: →
                    </button>
                    <ul className="space-y-1">
                      {signal.relatedSignals.map((related, idx) => (
                        <li key={idx} className="text-sm text-gray-700">
                          • {related}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Decision Makers */}
                {signal.decisionMakers && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      Decision Makers Identified:
                    </p>
                    <ul className="space-y-1">
                      {signal.decisionMakers.map((maker, idx) => (
                        <li key={idx} className="text-sm text-gray-700">
                          • {maker.name} ({maker.title}) - {maker.email}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Opportunity */}
                {signal.opportunity && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      {signal.type === 'product' ? 'Why This Matters:' : 'Opportunity:'}
                    </p>
                    <ul className="space-y-1">
                      {signal.opportunity.map((opp, idx) => (
                        <li key={idx} className="text-sm text-gray-700">
                          • {opp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Status */}
                <div className="mb-4 flex items-center space-x-2">
                  <span className="text-sm font-semibold text-gray-900">Status:</span>
                  {getStatusBadge(signal.status)}
                </div>

                {/* Converted/Dismissed Details */}
                {signal.status === 'converted' && signal.statusDetails && (
                  <div className="mb-4 bg-green-50 rounded p-3 border border-green-200">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Lead Created:</span>{' '}
                      {signal.statusDetails.convertedTo}
                    </p>
                    <p className="text-sm text-gray-600">
                      Added: {signal.statusDetails.convertedDate} by{' '}
                      {signal.statusDetails.convertedBy}
                    </p>
                  </div>
                )}

                {signal.status === 'dismissed' && signal.statusDetails && (
                  <div className="mb-4 bg-red-50 rounded p-3 border border-red-200">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Reason:</span>{' '}
                      {signal.statusDetails.dismissReason}
                    </p>
                    <p className="text-sm text-gray-600">
                      Dismissed by: {signal.statusDetails.dismissedBy} on{' '}
                      {signal.statusDetails.dismissedDate}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                  {signal.status === 'new' || signal.status === 'in_review' ? (
                    <>
                      <button
                        onClick={() => handleAddToLeads(signal)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add to Leads</span>
                      </button>
                      <button
                        onClick={() => handleViewDetails(signal.id)}
                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View Details</span>
                      </button>
                      <button
                        onClick={() => handleDismiss(signal)}
                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        <BellOff className="h-4 w-4" />
                        <span>Dismiss</span>
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setShowMoreActionsMenu(showMoreActionsMenu === signal.id ? null : signal.id)}
                          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {showMoreActionsMenu === signal.id && (
                          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                            <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                              <Star className="h-4 w-4" />
                              <span>Add to Watch List</span>
                            </button>
                            <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                              <Clock className="h-4 w-4" />
                              <span>Set Reminder</span>
                            </button>
                            <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                              <Share2 className="h-4 w-4" />
                              <span>Share with Team</span>
                            </button>
                            <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                              <ExternalLink className="h-4 w-4" />
                              <span>Export Signal</span>
                            </button>
                            <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center space-x-2">
                              <AlertTriangle className="h-4 w-4" />
                              <span>Report Inaccurate</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  ) : signal.status === 'converted' ? (
                    <>
                      <button
                        onClick={() => handleViewLead(signal.id)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>View Lead</span>
                      </button>
                      <button
                        onClick={() => handleViewDetails(signal.id)}
                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View Details</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleUndoDismiss(signal.id)}
                        className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                      >
                        <Undo className="h-4 w-4" />
                        <span>Undo Dismiss</span>
                      </button>
                      <button
                        onClick={() => handleViewDetails(signal.id)}
                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View Details</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-8 flex items-center justify-between max-w-7xl">
          <div className="text-sm text-gray-600">
            Showing 6 of 450 signals
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
              ← Previous
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
              1
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
              2
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
              3
            </button>
            <span className="px-2 text-gray-600">...</span>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
              75
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Add to Leads Modal */}
      {showAddToLeadsModal && selectedSignal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Add to Leads</h2>
              <button
                onClick={() => setShowAddToLeadsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 mb-2">Company: {selectedSignal.company}</p>
                <p className="text-sm text-gray-700">Industry: {selectedSignal.industry}</p>
                <p className="text-sm text-gray-700">AI Score: {selectedSignal.leadScore}/100</p>
              </div>

              {selectedSignal.decisionMakers && (
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-2">Decision Makers:</p>
                  <div className="space-y-2">
                    {selectedSignal.decisionMakers.map((maker, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-sm">
                        <input type="checkbox" id={`dm-${idx}`} defaultChecked className="rounded" />
                        <label htmlFor={`dm-${idx}`} className="text-gray-700">
                          {maker.name} ({maker.title}) - {maker.email}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add to Sequence (Optional):
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="">No sequence</option>
                  <option value="1">Cold Outreach Sequence</option>
                  <option value="2">Warm Introduction Sequence</option>
                  <option value="3">Product Demo Sequence</option>
                </select>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddToLeadsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCreateLead(false)}
                className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 text-sm font-medium"
              >
                Create Single Lead
              </button>
              <button
                onClick={() => handleCreateLead(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Create Multiple Leads
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dismiss Modal */}
      {showDismissModal && selectedSignal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Dismiss Signal</h2>
              <button
                onClick={() => setShowDismissModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Why are you dismissing "{selectedSignal.company}"?
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason:
                </label>
                <select
                  value={dismissReason}
                  onChange={(e) => setDismissReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select a reason...</option>
                  <option value="not_interested">Not Interested</option>
                  <option value="too_small">Company Too Small</option>
                  <option value="wrong_industry">Wrong Industry</option>
                  <option value="already_contacted">Already Contacted</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note (Optional):
                </label>
                <textarea
                  value={dismissNote}
                  onChange={(e) => setDismissNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Add any additional notes..."
                />
              </div>
            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowDismissModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDismiss}
                disabled={!dismissReason}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
              >
                Dismiss Signal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Company Preview Modal */}
      {showCompanyPreviewModal && selectedSignal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{selectedSignal.company}</h2>
              <button
                onClick={() => setShowCompanyPreviewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Industry</p>
                  <p className="text-base font-medium text-gray-900">{selectedSignal.industry}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Employees</p>
                  <p className="text-base font-medium text-gray-900">{selectedSignal.employees}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="text-base font-medium text-gray-900">{selectedSignal.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Lead Score</p>
                  <p className="text-base font-medium text-gray-900">{selectedSignal.leadScore}/100</p>
                </div>
              </div>

              {selectedSignal.relatedSignals && (
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">All Signals for this Company:</h3>
                  <div className="space-y-2">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-900">{selectedSignal.title}</p>
                      <p className="text-xs text-gray-600">{selectedSignal.timeAgo}</p>
                    </div>
                    {selectedSignal.relatedSignals.map((related, idx) => (
                      <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-sm text-gray-700">{related}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowCompanyPreviewModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowCompanyPreviewModal(false);
                  handleViewDetails(selectedSignal.id);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                View Full Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conversion Funnel Modal */}
      {showConversionFunnelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Conversion Funnel</h2>
              <button
                onClick={() => setShowConversionFunnelModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Signals Monitored</p>
                    <p className="text-2xl font-bold text-gray-900">450</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>

                <div className="flex items-center justify-center">
                  <ChevronDown className="h-6 w-6 text-gray-400" />
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Leads Created</p>
                    <p className="text-2xl font-bold text-gray-900">15</p>
                    <p className="text-xs text-gray-600">3.3% conversion</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>

                <div className="flex items-center justify-center">
                  <ChevronDown className="h-6 w-6 text-gray-400" />
                </div>

                <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Converted to Contacts</p>
                    <p className="text-2xl font-bold text-gray-900">13</p>
                    <p className="text-xs text-gray-600">86.7% conversion</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>

                <div className="flex items-center justify-center">
                  <ChevronDown className="h-6 w-6 text-gray-400" />
                </div>

                <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Deals Created</p>
                    <p className="text-2xl font-bold text-gray-900">8</p>
                    <p className="text-xs text-gray-600">61.5% conversion</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-orange-600" />
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 mb-2">Overall Conversion Rate</p>
                  <p className="text-3xl font-bold text-green-600">85%</p>
                  <p className="text-xs text-gray-600">Leads to Deals conversion</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowConversionFunnelModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesIntelligenceFeed;
