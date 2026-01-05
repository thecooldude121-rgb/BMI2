import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Settings,
  Search,
  TrendingUp,
  DollarSign,
  Users,
  Rocket,
  Globe,
  ChevronDown,
  Plus,
  Eye,
  BellOff,
  MoreHorizontal,
  ExternalLink,
  Undo,
  Filter
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
  keyDetails: { label: string; value: string }[];
  relatedSignals?: string[];
  decisionMakers?: { name: string; title: string; email: string }[];
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
        return 'text-green-600 bg-green-50';
      case 'hiring':
        return 'text-blue-600 bg-blue-50';
      case 'product':
        return 'text-purple-600 bg-purple-50';
      case 'expansion':
        return 'text-orange-600 bg-orange-50';
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
    alert(`Adding "${signal.company}" to leads with score ${signal.leadScore}/100`);
    // Would navigate to add lead form with pre-filled data
  };

  const handleViewDetails = (signalId: string) => {
    navigate(`/lead-generation/intelligence/${signalId}`);
  };

  const handleDismiss = (signalId: string) => {
    alert(`Signal dismissed. Reason: Not a fit for current strategy`);
  };

  const handleUndoDismiss = (signalId: string) => {
    alert(`Signal restored to active feed`);
  };

  const handleViewLead = (leadId: string) => {
    navigate(`/lead-generation/leads/${leadId}`);
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
              <span>🔔 Sales Intelligence Feed</span>
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
            <span>⚙️ Configure</span>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
            <div className="text-3xl font-bold text-blue-900 mb-1">450</div>
            <div className="text-sm font-medium text-blue-700 mb-1">Total Signals</div>
            <div className="text-xs text-blue-600">Monitored</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
            <div className="text-3xl font-bold text-green-900 mb-1">50</div>
            <div className="text-sm font-medium text-green-700 mb-1">New This Week</div>
            <div className="text-xs text-green-600">+12%</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
            <div className="text-3xl font-bold text-purple-900 mb-1">15</div>
            <div className="text-sm font-medium text-purple-700 mb-1">Leads Created</div>
            <div className="text-xs text-purple-600">from Feed</div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border border-orange-200">
            <div className="text-3xl font-bold text-orange-900 mb-1">85%</div>
            <div className="text-sm font-medium text-orange-700 mb-1">Conversion Rate</div>
            <div className="text-xs text-orange-600">(High!)</div>
          </div>
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
                  ? 'bg-green-600 text-white'
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
                  ? 'bg-blue-600 text-white'
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
                  ? 'bg-purple-600 text-white'
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
                  ? 'bg-orange-600 text-white'
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
                <option value="ecommerce">E-commerce</option>
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
                <option value="1-50">1-50</option>
                <option value="51-200">51-200</option>
                <option value="201-500">201-500</option>
                <option value="500+">500+</option>
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
                <option value="score">Highest Score</option>
                <option value="company">Company A-Z</option>
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
                <option value="compact">📊 Compact View</option>
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
                <h3 className="text-lg font-bold text-gray-900 mb-2">{signal.title}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {signal.industry} | {signal.employees} employees | {signal.location}
                </p>

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
                    <p className="text-sm font-semibold text-gray-900 mb-2">Related Signals:</p>
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
                        onClick={() => handleDismiss(signal.id)}
                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        <BellOff className="h-4 w-4" />
                        <span>Dismiss</span>
                      </button>
                      <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
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
        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-gray-600">Showing 6 of 450 signals</p>
          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">
              ← Previous
            </button>
            <button className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
              1
            </button>
            <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">
              2
            </button>
            <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">
              3
            </button>
            <span className="px-2 text-sm text-gray-600">...</span>
            <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">
              75
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">
              Next →
            </button>
          </div>
        </div>

        {/* Load More Button */}
        <div className="mt-6 text-center">
          <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
            Load More...
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesIntelligenceFeed;
