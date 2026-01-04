import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, Download, Upload, Plus, MoreVertical, Mail, Phone,
  Calendar, FileText, Zap, CheckCircle, XCircle, ArrowRight,
  ChevronDown, ChevronUp, TrendingUp, Target, Users, Activity,
  Trash2, Copy, Clock, UserPlus, Edit,
  Eye, Grid, List, Columns, RefreshCw, Share2, Archive
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
    email: 'sarah@techstart.com',
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
    email: 'robert@dataflow.com',
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
    email: 'emma@innovatelabs.com',
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
    company: 'BigCo Enterprise',
    email: 'michael@bigco.com',
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
    email: 'lisa@startco.com',
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
    email: 'david@techflow.com',
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
    email: 'alex@dataverse.com',
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
    name: 'Tom Harris',
    title: 'Owner',
    company: 'SmallBiz Inc',
    email: 'tom@smallbiz.com',
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
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'kanban'>('list');

  const [filters, setFilters] = useState({
    status: 'all',
    source: 'all',
    score: 'all',
    owner: 'all'
  });

  const [sortBy, setSortBy] = useState('recent');
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showSequenceMenu, setShowSequenceMenu] = useState<string | null>(null);
  const [showAssignMenu, setShowAssignMenu] = useState<string | null>(null);
  const [showMoreMenu, setShowMoreMenu] = useState<string | null>(null);

  const filteredLeads = useMemo(() => {
    let result = [...mockLeads];

    if (filters.status !== 'all') {
      result = result.filter(lead => lead.status === filters.status);
    }

    if (filters.source !== 'all') {
      const sourceMap: Record<string, string> = {
        '🎯 apollo': 'apollo',
        '🏢 hrms': 'hrms',
        '🔔 intelligence': 'intent',
        '✍️ manual': 'manual'
      };
      const mappedSource = sourceMap[filters.source] || filters.source;
      result = result.filter(lead => lead.source === mappedSource);
    }

    if (filters.score !== 'all') {
      const scoreRanges: Record<string, [number, number]> = {
        '90-100': [90, 100],
        '80-89': [80, 89],
        '70-79': [70, 79],
        '60-69': [60, 69],
        'below 60': [0, 59]
      };
      const range = scoreRanges[filters.score];
      if (range) {
        result = result.filter(lead => lead.score >= range[0] && lead.score <= range[1]);
      }
    }

    if (filters.owner !== 'all' && filters.owner !== 'assigned to me') {
      if (filters.owner === 'unassigned') {
        result = result.filter(lead => lead.owner === 'Unassigned');
      } else {
        result = result.filter(lead => lead.owner.toLowerCase().includes(filters.owner));
      }
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(lead =>
        lead.name.toLowerCase().includes(query) ||
        lead.email.toLowerCase().includes(query) ||
        lead.company.toLowerCase().includes(query) ||
        lead.title.toLowerCase().includes(query)
      );
    }

    return result;
  }, [filters, searchQuery]);

  const stats = [
    {
      label: 'Total Leads',
      value: '450',
      icon: Target,
      color: 'text-blue-600',
      filter: () => setFilters({ status: 'all', source: 'all', score: 'all', owner: 'all' })
    },
    {
      label: 'New Leads',
      value: '150',
      percentage: '33%',
      icon: TrendingUp,
      color: 'text-green-600',
      filter: () => setFilters({ ...filters, status: 'new' })
    },
    {
      label: 'Contacted Leads',
      value: '180',
      percentage: '40%',
      icon: Mail,
      color: 'text-orange-600',
      filter: () => setFilters({ ...filters, status: 'contacted' })
    },
    {
      label: '🏢 HRMS Warm!',
      value: '45',
      percentage: '10%',
      icon: Zap,
      color: 'text-purple-600',
      filter: () => setFilters({ ...filters, source: '🏢 hrms' })
    },
    {
      label: 'Qualified Leads',
      value: '80',
      percentage: '18%',
      icon: CheckCircle,
      color: 'text-emerald-600',
      filter: () => setFilters({ ...filters, status: 'qualified' })
    },
    {
      label: 'Avg Score',
      value: '72',
      icon: Activity,
      color: 'text-indigo-600',
      filter: () => setSortBy('score')
    }
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
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    }
  };

  const handleLeadAction = (action: string, lead: LeadDetail) => {
    switch (action) {
      case 'View':
        navigate(`/lead-generation/leads/${lead.id}`);
        break;
      case 'Enrich':
      case 'Enrich Now':
        showToast(`Enriching ${lead.name} with Apollo/ZoomInfo data...`, 'info');
        setTimeout(() => showToast(`${lead.name} enriched successfully!`, 'success'), 2000);
        break;
      case 'Qualify':
      case 'Score':
        navigate(`/lead-generation/qualify/${lead.id}`);
        break;
      case 'Email':
        showToast(`Opening email composer for ${lead.name}...`, 'info');
        break;
      case 'Call':
        showToast(`Opening call logging modal for ${lead.name}...`, 'info');
        break;
      case 'Sync Now':
        showToast(`Syncing ${lead.name} to CRM...`, 'info');
        setTimeout(() => showToast('Synced to CRM!', 'success'), 1500);
        break;
      case 'Edit':
        showToast(`Opening quick edit for ${lead.name}...`, 'info');
        break;
      case 'Add Note':
        showToast(`Opening note modal for ${lead.name}...`, 'info');
        break;
      case 'View Sequence':
        navigate('/lead-generation/campaigns');
        break;
      case 'Requalify':
        showToast(`${lead.name} reopened and marked as New`, 'success');
        break;
      case 'Archive':
        showToast(`${lead.name} archived`, 'success');
        break;
      case 'Delete':
        if (confirm(`Delete ${lead.name}? This cannot be undone.`)) {
          showToast(`${lead.name} deleted`, 'success');
        }
        break;
      case 'Add to Deal':
        showToast(`Creating deal for ${lead.name}...`, 'info');
        break;
      case 'Assign to Rep':
        setShowAssignMenu(lead.id);
        break;
      default:
        showToast(`${action} for ${lead.name}`, 'info');
    }
  };

  const handleBulkAction = (action: string) => {
    const count = selectedLeads.length;
    switch (action) {
      case 'enrich':
        showToast(`Enriching ${count} leads...`, 'info');
        setTimeout(() => showToast(`${count} leads enriched!`, 'success'), 2000);
        break;
      case 'export':
        showToast(`Exporting ${count} leads to CSV...`, 'success');
        break;
      case 'delete':
        if (confirm(`Delete ${count} leads? This cannot be undone.`)) {
          showToast(`${count} leads deleted`, 'success');
          setSelectedLeads([]);
        }
        break;
      default:
        showToast(`${action} applied to ${count} leads`, 'success');
    }
  };

  return (
    <div className="bg-gray-50">
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
              onClick={() => navigate('/lead-generation/leads/add-import')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Upload className="h-4 w-4" />
              Import Leads
            </button>
            <button
              onClick={() => navigate('/lead-generation/leads/add-import')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Lead
            </button>
            <button
              onClick={() => showToast('Exporting filtered leads to CSV...', 'success')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            <div className="relative">
              <button
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                className="flex items-center gap-2 px-2 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {showActionsMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <button
                    onClick={() => { showToast('Exporting all leads...', 'success'); setShowActionsMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Export all leads
                  </button>
                  <button
                    onClick={() => { showToast('Opening Apollo.io import...', 'info'); setShowActionsMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Import from Apollo.io
                  </button>
                  <button
                    onClick={() => { showToast('Opening ZoomInfo import...', 'info'); setShowActionsMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Import from ZoomInfo
                  </button>
                  <button
                    onClick={() => { showToast('Opening column configuration...', 'info'); setShowActionsMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Configure columns
                  </button>
                  <button
                    onClick={() => { showToast('Current view saved!', 'success'); setShowActionsMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Save current view
                  </button>
                  <button
                    onClick={() => { showToast('Opening bulk assign...', 'info'); setShowActionsMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Bulk assign
                  </button>
                  <button
                    onClick={() => { showToast('Opening bulk delete...', 'info'); setShowActionsMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                  >
                    Bulk delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-6 gap-4 mb-6">
          {stats.map((stat, index) => (
            <button
              key={index}
              onClick={stat.filter}
              className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md hover:border-blue-300 transition-all text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
              {stat.percentage && (
                <div className="text-xs text-gray-500 mt-1">{stat.percentage}</div>
              )}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 w-20">Status:</span>
              <div className="flex items-center gap-2 flex-wrap">
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
              <div className="flex items-center gap-2 flex-wrap">
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
              <div className="flex items-center gap-2 flex-wrap">
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
              <div className="flex items-center gap-2 flex-wrap">
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
                <option value="oldest">Sort: Oldest First</option>
                <option value="score">Sort: Highest Score</option>
                <option value="name">Sort: Name A-Z</option>
                <option value="company">Sort: Company A-Z</option>
              </select>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as 'list' | 'grid' | 'kanban')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="list">📋 List View</option>
                <option value="grid">📊 Grid View</option>
                <option value="kanban">📌 Kanban View</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedLeads.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center gap-4">
            <span className="text-sm font-medium text-blue-900">
              {selectedLeads.length} leads selected
            </span>

            <div className="relative">
              <button
                onClick={() => setShowAssignMenu('bulk')}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                Assign to... ▼
              </button>
              {showAssignMenu === 'bulk' && (
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  {['Alex T.', 'Sarah C.', 'Mike J.', 'Round-robin', 'Territory rules'].map(owner => (
                    <button
                      key={owner}
                      onClick={() => {
                        showToast(`Assigned ${selectedLeads.length} leads to ${owner}`, 'success');
                        setShowAssignMenu(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {owner}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowSequenceMenu('bulk')}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                Add to Sequence ▼
              </button>
              {showSequenceMenu === 'bulk' && (
                <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  {['New Customer Outreach', 'Product Launch Follow-up', 'Re-engagement Campaign'].map(seq => (
                    <button
                      key={seq}
                      onClick={() => {
                        showToast(`Added ${selectedLeads.length} leads to ${seq}`, 'success');
                        setShowSequenceMenu(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {seq}
                    </button>
                  ))}
                  <div className="border-t border-gray-200"></div>
                  <button
                    onClick={() => {
                      showToast('Creating new sequence...', 'info');
                      setShowSequenceMenu(null);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-gray-50"
                  >
                    + Create New Sequence
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => handleBulkAction('enrich')}
              className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 text-sm rounded hover:bg-blue-50 transition-colors"
            >
              Enrich
            </button>
            <button
              onClick={() => handleBulkAction('export')}
              className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 text-sm rounded hover:bg-blue-50 transition-colors"
            >
              Export
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
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
                    checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
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
              {filteredLeads.map((lead) => {
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
                            <span className="font-semibold text-gray-900 group-hover:text-blue-600 cursor-pointer">
                              {lead.name}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/lead-generation/leads/${lead.id}`);
                            }}
                            className="text-sm text-gray-600 hover:text-blue-600 cursor-pointer"
                          >
                            {lead.company}
                          </div>
                          <div className="text-xs text-gray-500">{lead.title}</div>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setFilters({ ...filters, source: lead.source })}
                          className="flex items-center gap-2 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                        >
                          <span className="text-lg">{getSourceIcon(lead.source)}</span>
                          <span className="text-sm font-medium text-gray-700">
                            {getSourceLabel(lead.source)}
                          </span>
                        </button>
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
                        <div className="relative">
                          <button
                            onClick={() => setShowMoreMenu(showMoreMenu === lead.id ? null : lead.id)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {showMoreMenu === lead.id && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                              <button
                                onClick={() => {
                                  handleLeadAction('Edit', lead);
                                  setShowMoreMenu(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                              >
                                Edit lead
                              </button>
                              <button
                                onClick={() => {
                                  showToast(`Duplicating ${lead.name}...`, 'info');
                                  setShowMoreMenu(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                              >
                                Duplicate lead
                              </button>
                              {lead.status === 'qualified' && (
                                <button
                                  onClick={() => {
                                    showToast(`Converting ${lead.name} to contact...`, 'info');
                                    setShowMoreMenu(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  Convert to contact
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  handleLeadAction('Add to Deal', lead);
                                  setShowMoreMenu(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                              >
                                Add to deal
                              </button>
                              <button
                                onClick={() => {
                                  showToast(`Sharing ${lead.name}...`, 'info');
                                  setShowMoreMenu(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                              >
                                Send to colleague
                              </button>
                              <button
                                onClick={() => {
                                  showToast(`Exporting ${lead.name} data...`, 'success');
                                  setShowMoreMenu(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                              >
                                Export lead data
                              </button>
                              <button
                                onClick={() => {
                                  navigate(`/lead-generation/leads/${lead.id}/activity`);
                                  setShowMoreMenu(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                              >
                                View activity history
                              </button>
                              <div className="border-t border-gray-200"></div>
                              <button
                                onClick={() => {
                                  handleLeadAction('Delete', lead);
                                  setShowMoreMenu(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className="px-4 py-4 bg-gray-50">
                          <div className="space-y-3">
                            <div className="flex items-center gap-4 text-sm">
                              <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">{lead.email}</a>
                              {lead.phone && <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">{lead.phone}</a>}
                            </div>

                            <div className="space-y-2">
                              <div className="text-sm text-gray-700">{lead.sourceContext}</div>
                              <div className="text-sm text-gray-700">{lead.aiInsight}</div>
                              <div className="text-sm text-gray-700">{lead.nextAction}</div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              {lead.actionButtons.map((action, index) => {
                                if (action === 'Add to Sequence') {
                                  return (
                                    <div key={index} className="relative">
                                      <button
                                        onClick={() => setShowSequenceMenu(lead.id)}
                                        className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-100 transition-colors"
                                      >
                                        {action} ▼
                                      </button>
                                      {showSequenceMenu === lead.id && (
                                        <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                          {['New Customer Outreach', 'Product Launch Follow-up', 'Re-engagement Campaign'].map(seq => (
                                            <button
                                              key={seq}
                                              onClick={() => {
                                                showToast(`Added ${lead.name} to ${seq}`, 'success');
                                                setShowSequenceMenu(null);
                                              }}
                                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                              {seq}
                                            </button>
                                          ))}
                                          <div className="border-t border-gray-200"></div>
                                          <button
                                            onClick={() => {
                                              showToast('Creating new sequence...', 'info');
                                              setShowSequenceMenu(null);
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-gray-50"
                                          >
                                            + Create New Sequence
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                }

                                if (action === 'Assign to Rep') {
                                  return (
                                    <div key={index} className="relative">
                                      <button
                                        onClick={() => setShowAssignMenu(lead.id)}
                                        className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-100 transition-colors"
                                      >
                                        Assign ▼
                                      </button>
                                      {showAssignMenu === lead.id && (
                                        <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                          {['Alex T.', 'Sarah C.', 'Mike J.'].map(owner => (
                                            <button
                                              key={owner}
                                              onClick={() => {
                                                showToast(`Assigned ${lead.name} to ${owner}`, 'success');
                                                setShowAssignMenu(null);
                                              }}
                                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                              {owner}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                }

                                return (
                                  <button
                                    key={index}
                                    onClick={() => handleLeadAction(action, lead)}
                                    className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-100 transition-colors"
                                  >
                                    {action}
                                  </button>
                                );
                              })}
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

          {filteredLeads.length === 0 && (
            <div className="px-4 py-12 text-center">
              <p className="text-gray-500">No leads found matching your filters.</p>
              <button
                onClick={() => {
                  setFilters({ status: 'all', source: 'all', score: 'all', owner: 'all' });
                  setSearchQuery('');
                }}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}

          {filteredLeads.length > 0 && (
            <div className="px-4 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {filteredLeads.length} of 450 leads
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setCurrentPage(1)}
                  className={`px-3 py-1 rounded text-sm ${currentPage === 1 ? 'bg-blue-600 text-white' : 'border border-gray-300 hover:bg-gray-50'}`}
                >
                  1
                </button>
                <button
                  onClick={() => setCurrentPage(2)}
                  className={`px-3 py-1 rounded text-sm ${currentPage === 2 ? 'bg-blue-600 text-white' : 'border border-gray-300 hover:bg-gray-50'}`}
                >
                  2
                </button>
                <button
                  onClick={() => setCurrentPage(3)}
                  className={`px-3 py-1 rounded text-sm ${currentPage === 3 ? 'bg-blue-600 text-white' : 'border border-gray-300 hover:bg-gray-50'}`}
                >
                  3
                </button>
                <span className="px-2 text-gray-600">...</span>
                <button
                  onClick={() => setCurrentPage(45)}
                  className={`px-3 py-1 rounded text-sm ${currentPage === 45 ? 'bg-blue-600 text-white' : 'border border-gray-300 hover:bg-gray-50'}`}
                >
                  45
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(45, currentPage + 1))}
                  disabled={currentPage === 45}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadsListPage;
