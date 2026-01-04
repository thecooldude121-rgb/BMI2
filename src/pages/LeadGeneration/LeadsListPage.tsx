import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, Download, Upload, Plus, MoreVertical, Mail, Phone,
  User, Calendar, FileText, Zap, CheckCircle, XCircle, ArrowRight,
  ChevronDown, ChevronUp, TrendingUp, Target, Users, Activity
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface LeadDetail {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  industry: string;
  source: 'hrms' | 'intent' | 'apollo' | 'manual';
  score: number;
  status: 'new' | 'contacted' | 'qualified' | 'disqualified' | 'synced';
  statusIndicator: 'active' | 'nurture' | 'ready' | 'lost';
  owner: string;
  lastActivity: string;
  sourceContext: string;
  aiInsight: string;
  nextAction: string;
  actionButtons: string[];
  sequenceInfo?: string;
  bant?: {
    budget: string;
    authority: string;
    need: string;
    timeline: string;
  };
}

const mockLeads: LeadDetail[] = [
  {
    id: '1',
    name: 'Sarah Lee',
    title: 'CFO',
    company: 'TechStart Inc',
    email: 'sarah@tech.com',
    phone: '+1 555-0456',
    industry: 'FinTech',
    source: 'hrms',
    score: 92,
    status: 'new',
    statusIndicator: 'active',
    owner: 'Sarah C.',
    lastActivity: 'Just now',
    sourceContext: '🏢 From HRMS: Recruited Nov 2024',
    aiInsight: '🤖 AI: High intent - Recent funding $10M',
    nextAction: 'Next: Enrich & Qualify',
    actionButtons: ['Enrich', 'Qualify', 'Add to Sequence', 'View']
  },
  {
    id: '2',
    name: 'Robert Chang',
    title: 'CEO',
    company: 'DataFlow Inc',
    email: 'robert@data.com',
    phone: '+1 555-0789',
    industry: 'Data Analytics',
    source: 'intent',
    score: 85,
    status: 'new',
    statusIndicator: 'active',
    owner: 'Mike J.',
    lastActivity: '2h ago',
    sourceContext: '🔔 Signal: Posted 5 Sales Engineer jobs',
    aiInsight: '🤖 AI: Scaling sales team - High buying intent',
    nextAction: 'Next: Contact within 24h for best response',
    actionButtons: ['Enrich', 'Email', 'Add to Sequence', 'View']
  },
  {
    id: '3',
    name: 'John Smith',
    title: 'VP Sales',
    company: 'Acme Corp',
    email: 'john@acme.com',
    phone: '+1 555-0123',
    industry: 'SaaS',
    source: 'apollo',
    score: 78,
    status: 'contacted',
    statusIndicator: 'nurture',
    owner: 'Alex T.',
    lastActivity: 'Nov 15 Email sent',
    sourceContext: '🤖 AI Enriched: Company $12M revenue, 75 emp',
    aiInsight: 'In Sequence: "New Customer Outreach" (Email 2)',
    nextAction: 'Opened email 2x - High engagement!',
    actionButtons: ['Call', 'Qualify', 'View Sequence', 'View'],
    sequenceInfo: 'New Customer Outreach (Email 2)'
  },
  {
    id: '4',
    name: 'Emma Wilson',
    title: 'VP Marketing',
    company: 'InnovateLabs',
    email: 'emma@innov.com',
    phone: '+1 555-0987',
    industry: 'HealthTech',
    source: 'hrms',
    score: 94,
    status: 'new',
    statusIndicator: 'active',
    owner: 'Sarah C.',
    lastActivity: 'Just now',
    sourceContext: '🏢 From HRMS: Recruited from InnovateLabs',
    aiInsight: '🤖 AI: Warm lead - 33% higher close rate',
    nextAction: 'Company: HealthTech, 30 employees, Series A',
    actionButtons: ['Enrich', 'Qualify', 'Add to Sequence', 'View']
  },
  {
    id: '5',
    name: 'Michael Torres',
    title: 'CTO',
    company: 'BigCo Enter',
    email: 'michael@big.com',
    phone: '+1 555-0321',
    industry: 'Manufacturing',
    source: 'apollo',
    score: 68,
    status: 'qualified',
    statusIndicator: 'ready',
    owner: 'Unassigned',
    lastActivity: 'Nov 14 BANT done',
    sourceContext: '✅ BANT Qualified: Budget $75K, Timeline Q1',
    aiInsight: '🤖 Ready to sync to CRM (will sync in 1h)',
    nextAction: 'Decision maker: Yes | Authority: High',
    actionButtons: ['Sync Now', 'Edit', 'View', 'Assign to Rep'],
    bant: {
      budget: '$75K',
      authority: 'High',
      need: 'Critical',
      timeline: 'Q1 2025'
    }
  },
  {
    id: '6',
    name: 'Lisa Anderson',
    title: 'Director',
    company: 'StartCo',
    email: 'lisa@start.com',
    phone: '',
    industry: 'E-commerce',
    source: 'manual',
    score: 55,
    status: 'new',
    statusIndicator: 'active',
    owner: 'Alex T.',
    lastActivity: '30m ago',
    sourceContext: 'Added manually from SaaS Summit 2024',
    aiInsight: '⚠️ Low score - Needs enrichment',
    nextAction: 'Missing: Phone, Company size, Revenue',
    actionButtons: ['Enrich Now', 'Score', 'Add Note', 'View']
  },
  {
    id: '7',
    name: 'David Kumar',
    title: 'CFO',
    company: 'TechFlow',
    email: 'david@tech.com',
    phone: '+1 555-0654',
    industry: 'SaaS',
    source: 'apollo',
    score: 72,
    status: 'contacted',
    statusIndicator: 'nurture',
    owner: 'Mike J.',
    lastActivity: 'Nov 13 In seq',
    sourceContext: 'In Sequence: "Product Launch Follow-up"',
    aiInsight: 'Email 2 sent Nov 13 - Not opened yet',
    nextAction: 'Company: SaaS, $5M revenue, 25 employees',
    actionButtons: ['Call', 'View Sequence', 'Qualify', 'View'],
    sequenceInfo: 'Product Launch Follow-up (Email 2)'
  },
  {
    id: '8',
    name: 'Jessica Park',
    title: 'CEO',
    company: 'CloudNine Inc',
    email: 'jessica@cloudnine.com',
    phone: '',
    industry: 'Cloud Services',
    source: 'intent',
    score: 88,
    status: 'new',
    statusIndicator: 'active',
    owner: 'Sarah C.',
    lastActivity: '4h ago',
    sourceContext: '🔔 Signal: Launched enterprise product line',
    aiInsight: '🤖 AI: Product expansion - Integration opps',
    nextAction: 'Company: Cloud Services, $18M revenue',
    actionButtons: ['Enrich', 'Email', 'Add to Sequence', 'View']
  },
  {
    id: '9',
    name: 'Alex Johnson',
    title: 'VP Operations',
    company: 'DataVerse',
    email: 'alex@data.com',
    phone: '+1 555-0852',
    industry: 'Data Platform',
    source: 'hrms',
    score: 90,
    status: 'qualified',
    statusIndicator: 'ready',
    owner: 'Sarah C.',
    lastActivity: 'Nov 12 BANT done',
    sourceContext: '🏢 From HRMS: Recruited Nov 2024',
    aiInsight: '✅ BANT Qualified: Budget $50K, Timeline Q1',
    nextAction: '🤖 Ready to sync to CRM (will sync in 1h)',
    actionButtons: ['Sync Now', 'View', 'Edit', 'Add to Deal'],
    bant: {
      budget: '$50K',
      authority: 'High',
      need: 'High',
      timeline: 'Q1 2025'
    }
  },
  {
    id: '10',
    name: 'Maria Garcia',
    title: 'Director',
    company: 'NextGen Labs',
    email: 'maria@next.com',
    phone: '+1 555-0741',
    industry: 'BioTech',
    source: 'apollo',
    score: 65,
    status: 'new',
    statusIndicator: 'active',
    owner: 'Unassigned',
    lastActivity: '1h ago',
    sourceContext: '🤖 AI Enriched: BioTech, $3M revenue, 15 emp',
    aiInsight: '⚠️ Unassigned - Needs owner',
    nextAction: 'Recommended: Assign to Sarah (BioTech expert)',
    actionButtons: ['Assign', 'Enrich', 'Score', 'Add Note', 'View']
  },
  {
    id: '11',
    name: 'Tom Harris',
    title: 'Owner',
    company: 'SmallBiz Inc',
    email: 'tom@small.com',
    phone: '',
    industry: 'Retail',
    source: 'apollo',
    score: 45,
    status: 'disqualified',
    statusIndicator: 'lost',
    owner: 'Mike J.',
    lastActivity: 'Nov 10 Marked lost',
    sourceContext: '❌ Disqualified: No budget (Reason: Too small)',
    aiInsight: 'Company size: 5 employees, $200K revenue',
    nextAction: 'Not a fit for enterprise solution',
    actionButtons: ['Requalify', 'Archive', 'View', 'Delete']
  }
];

const LeadsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    status: 'all',
    source: 'all',
    score: 'all',
    owner: 'all'
  });
  const [sortBy, setSortBy] = useState('recent');

  const stats = [
    { label: 'Total Leads', value: '450', icon: Target, color: 'text-blue-600' },
    { label: 'New Leads', value: '150', percentage: '33%', icon: TrendingUp, color: 'text-green-600' },
    { label: 'Contacted Leads', value: '180', percentage: '40%', icon: Mail, color: 'text-orange-600' },
    { label: '🏢 HRMS Warm!', value: '45', percentage: '10%', icon: Zap, color: 'text-purple-600' },
    { label: 'Qualified Leads', value: '80', percentage: '18%', icon: CheckCircle, color: 'text-emerald-600' },
    { label: 'Avg Score', value: '72', icon: Activity, color: 'text-indigo-600' }
  ];

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'hrms': return '🏢';
      case 'intent': return '🔔';
      case 'apollo': return '🎯';
      case 'manual': return '✍️';
      default: return '📊';
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'hrms': return 'HRMS Recruit';
      case 'intent': return 'Intel Hiring';
      case 'apollo': return 'Apollo';
      case 'manual': return 'Manual';
      default: return source;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-700 bg-green-50 border-green-200';
    if (score >= 70) return 'text-blue-700 bg-blue-50 border-blue-200';
    if (score >= 50) return 'text-orange-700 bg-orange-50 border-orange-200';
    return 'text-gray-700 bg-gray-50 border-gray-200';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new': return { label: 'New', color: 'bg-blue-100 text-blue-700' };
      case 'contacted': return { label: 'Contacted', color: 'bg-orange-100 text-orange-700' };
      case 'qualified': return { label: 'Qualified', color: 'bg-green-100 text-green-700' };
      case 'disqualified': return { label: 'Disqualified', color: 'bg-red-100 text-red-700' };
      case 'synced': return { label: 'Synced', color: 'bg-purple-100 text-purple-700' };
      default: return { label: status, color: 'bg-gray-100 text-gray-700' };
    }
  };

  const getStatusIndicatorBadge = (indicator: string) => {
    switch (indicator) {
      case 'active': return { label: '🟢 Active', color: 'text-green-700' };
      case 'nurture': return { label: '🟡 Nurture', color: 'text-orange-700' };
      case 'ready': return { label: '🟢 Ready', color: 'text-emerald-700' };
      case 'lost': return { label: '🔴 Lost', color: 'text-red-700' };
      default: return { label: indicator, color: 'text-gray-700' };
    }
  };

  const toggleExpand = (leadId: string) => {
    setExpandedRows(prev =>
      prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev =>
      prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === mockLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(mockLeads.map(lead => lead.id));
    }
  };

  const handleAction = (action: string, leadName?: string) => {
    showToast(`${action}${leadName ? ` for ${leadName}` : ''}`, 'success');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="max-w-[1600px] mx-auto px-8 py-6">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              📋 Leads
            </h1>
            <p className="text-gray-600 mt-1">Manage and qualify all your leads</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => showToast('Export started', 'success')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            <button className="flex items-center gap-2 px-2 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mb-6">
          <button
            onClick={() => showToast('Import leads modal opened', 'info')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            <Upload className="h-4 w-4" />
            Import Leads
          </button>
          <button
            onClick={() => showToast('Add lead modal opened', 'info')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="h-4 w-4" />
            Add Lead
          </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-6 gap-4 mb-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
              {stat.percentage && (
                <div className="text-xs text-gray-500 mt-1">{stat.percentage}</div>
              )}
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 w-20">Status:</span>
              <div className="flex items-center gap-2">
                {['All', 'New', 'Contacted', 'Qualified', 'Disqualified', 'Synced'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilters({ ...filters, status: status.toLowerCase() })}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      filters.status === status.toLowerCase()
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 w-20">Source:</span>
              <div className="flex items-center gap-2">
                {['All', '🎯 Apollo', '🏢 HRMS', '🔔 Intelligence', '✍️ Manual'].map((source) => (
                  <button
                    key={source}
                    onClick={() => setFilters({ ...filters, source: source.toLowerCase() })}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      filters.source === source.toLowerCase()
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {source}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 w-20">Score:</span>
              <div className="flex items-center gap-2">
                {['All', '90-100', '80-89', '70-79', '60-69', 'Below 60'].map((score) => (
                  <button
                    key={score}
                    onClick={() => setFilters({ ...filters, score: score.toLowerCase() })}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      filters.score === score.toLowerCase()
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 w-20">Owner:</span>
              <div className="flex items-center gap-2">
                {['All', 'Assigned to Me', 'Unassigned', 'Alex', 'Sarah', 'Mike'].map((owner) => (
                  <button
                    key={owner}
                    onClick={() => setFilters({ ...filters, owner: owner.toLowerCase() })}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      filters.owner === owner.toLowerCase()
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {owner}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, company, title..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="recent">Sort: Most Recent</option>
                <option value="score">Sort: Highest Score</option>
                <option value="name">Sort: Name A-Z</option>
              </select>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                Bulk Actions ▼
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                List View 📋 ▼
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedLeads.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center gap-4">
            <span className="text-sm font-medium text-blue-900">
              {selectedLeads.length} leads selected
            </span>
            <button
              onClick={() => handleAction('Assigned to')}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              Assign to... ▼
            </button>
            <button
              onClick={() => handleAction('Added to sequence')}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              Add to Sequence ▼
            </button>
            <button
              onClick={() => handleAction('Enriched')}
              className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 text-sm rounded hover:bg-blue-50 transition-colors"
            >
              Enrich
            </button>
            <button
              onClick={() => handleAction('Exported')}
              className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 text-sm rounded hover:bg-blue-50 transition-colors"
            >
              Export
            </button>
            <button
              onClick={() => handleAction('Deleted')}
              className="px-3 py-1.5 bg-white border border-red-300 text-red-700 text-sm rounded hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => setSelectedLeads([])}
              className="ml-auto text-sm text-blue-600 hover:text-blue-700"
            >
              Clear
            </button>
          </div>
        )}

        {/* Leads Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={selectedLeads.length === mockLeads.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name/Company</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Source</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Score</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Owner</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Last Activity</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mockLeads.map((lead) => {
                const isExpanded = expandedRows.includes(lead.id);
                const statusBadge = getStatusBadge(lead.status);
                const statusIndicator = getStatusIndicatorBadge(lead.statusIndicator);

                return (
                  <React.Fragment key={lead.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={() => handleSelectLead(lead.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleExpand(lead.id)}
                          className="text-left w-full group"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 group-hover:text-blue-600">
                              {lead.name}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          <div className="text-sm text-gray-600">{lead.company}</div>
                          <div className="text-xs text-gray-500">{lead.title}</div>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getSourceIcon(lead.source)}</span>
                          <span className="text-sm font-medium text-gray-700">
                            {getSourceLabel(lead.source)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${getScoreColor(lead.score)}`}>
                          {lead.score}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${statusBadge.color}`}>
                            {statusBadge.label}
                          </span>
                          <div className={`text-xs font-medium ${statusIndicator.color}`}>
                            {statusIndicator.label}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">{lead.owner}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600">{lead.lastActivity}</div>
                      </td>
                      <td className="px-4 py-3">
                        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className="px-4 py-4 bg-gray-50">
                          <div className="space-y-3">
                            {/* Contact Information */}
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-gray-700">{lead.email}</span>
                              {lead.phone && <span className="text-gray-700">{lead.phone}</span>}
                            </div>

                            {/* Context and Insights */}
                            <div className="space-y-2">
                              <div className="text-sm text-gray-700">{lead.sourceContext}</div>
                              <div className="text-sm text-gray-700">{lead.aiInsight}</div>
                              <div className="text-sm text-gray-700">{lead.nextAction}</div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                              {lead.actionButtons.map((action, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleAction(action, lead.name)}
                                  className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-100 transition-colors"
                                >
                                  {action}
                                </button>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="px-4 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing 10 of 450 leads
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm">
                ← Previous
              </button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">1</button>
              <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm">2</button>
              <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm">3</button>
              <span className="px-2 text-gray-600">...</span>
              <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm">45</button>
              <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm">
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadsListPage;
