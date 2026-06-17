import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Upload, Search, ChevronDown, MoreVertical, CheckCircle, Mail, Phone, Eye,
  UserPlus, Link as LinkIcon, X
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { useLeads } from '../../contexts/LeadContext';
import CRMNavigation from '../../components/CRM/CRMNavigation';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import type { Lead } from '../../types/lead';

// ── Helpers ───────────────────────────────────────────────────────────────────

const getLeadName = (lead: Lead) =>
  lead.full_name || [lead.first_name, lead.last_name].filter(Boolean).join(' ') || '—';

const getLeadScore = (lead: Lead) => lead.ai_score ?? lead.score;

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'Never';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-800 bg-green-100 border-green-200';
  if (score >= 60) return 'text-green-700 bg-green-50 border-green-200';
  return 'text-orange-700 bg-orange-50 border-orange-200';
};

const getStatusBadge = (status: string) => {
  const colors: Record<string, string> = {
    new: 'bg-blue-500 text-white',
    contacted: 'bg-orange-500 text-white',
    qualified: 'bg-green-500 text-white',
    lost: 'bg-red-500 text-white',
    working: 'bg-orange-400 text-white',
    nurturing: 'bg-purple-500 text-white',
    unqualified: 'bg-gray-400 text-white',
    converted: 'bg-teal-500 text-white',
  };
  return colors[status] || 'bg-gray-500 text-white';
};

const getSourceInfo = (source?: string) => {
  const s = (source || '').toLowerCase();
  if (s.includes('lead gen') || s.includes('apollo') || s.includes('zoom'))
    return { icon: '🎯', color: 'text-blue-600 bg-blue-50' };
  if (s.includes('hrms') || s.includes('recruit'))
    return { icon: '🏢', color: 'text-yellow-600 bg-yellow-50' };
  if (s.includes('website') || s.includes('web') || s.includes('form'))
    return { icon: '🌐', color: 'text-green-600 bg-green-50' };
  if (s.includes('manual') || s.includes('trade') || s.includes('conference') || s.includes('referral'))
    return { icon: '✍️', color: 'text-gray-600 bg-gray-50' };
  return { icon: '📋', color: 'text-gray-600 bg-gray-50' };
};

const getStarRating = (score: number) => '⭐'.repeat(Math.min(5, Math.round((score / 100) * 5)));

const SORT_OPTIONS = [
  { value: 'score-high', label: 'Score (High to Low)' },
  { value: 'score-low', label: 'Score (Low to High)' },
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'date-new', label: 'Date (Newest)' },
];

const KANBAN_COLUMNS: Array<{ id: Lead['status']; label: string; headerColor: string }> = [
  { id: 'new', label: 'New', headerColor: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'contacted', label: 'Contacted', headerColor: 'bg-orange-100 text-orange-800 border-orange-200' },
  { id: 'qualified', label: 'Qualified', headerColor: 'bg-green-100 text-green-800 border-green-200' },
  { id: 'lost', label: 'Lost', headerColor: 'bg-red-100 text-red-800 border-red-200' },
];

// ── Component ─────────────────────────────────────────────────────────────────

const LeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const { leads: contextLeads, fetchLeads, loading, updateLead, deleteLead } = useLeads();

  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [scoreFilter, setScoreFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('score-high');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showBulkAssignDropdown, setShowBulkAssignDropdown] = useState(false);
  const [showBulkStatusDropdown, setShowBulkStatusDropdown] = useState(false);
  const [selectedLeadForAction, setSelectedLeadForAction] = useState<Lead | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'kanban'>('list');
  const [displayedLeadsCount, setDisplayedLeadsCount] = useState(20);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Stats ────────────────────────────────────────────────────────────────

  const today = new Date().toDateString();
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const stats = {
    total: contextLeads.length,
    newToday: contextLeads.filter(l => new Date(l.created_at).toDateString() === today).length,
    hot: contextLeads.filter(l => getLeadScore(l) >= 80).length,
    importedThisWeek: contextLeads.filter(l => {
      const src = (l.source || '').toLowerCase();
      return new Date(l.created_at) >= weekStart &&
        (src.includes('lead gen') || src.includes('hrms') || src.includes('apollo'));
    }).length,
  };

  // ── Filtering & sorting ───────────────────────────────────────────────────

  const filteredLeads = contextLeads.filter(lead => {
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesSource = sourceFilter === 'all' ||
      (lead.source || '').toLowerCase().includes(sourceFilter.toLowerCase());
    const score = getLeadScore(lead);
    const matchesScore =
      scoreFilter === 'all' ||
      (scoreFilter === '80-100' && score >= 80) ||
      (scoreFilter === '60-79' && score >= 60 && score < 80) ||
      (scoreFilter === 'below-60' && score < 60);
    const name = getLeadName(lead).toLowerCase();
    const matchesSearch = searchQuery === '' ||
      name.includes(searchQuery.toLowerCase()) ||
      (lead.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSource && matchesScore && matchesSearch;
  });

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    if (sortBy === 'score-high') return getLeadScore(b) - getLeadScore(a);
    if (sortBy === 'score-low') return getLeadScore(a) - getLeadScore(b);
    if (sortBy === 'name') return getLeadName(a).localeCompare(getLeadName(b));
    if (sortBy === 'date-new') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return 0;
  });

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label ?? 'Score (High to Low)';

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSelectAll = () => {
    setSelectedLeads(selectedLeads.length === sortedLeads.length ? [] : sortedLeads.map(l => l.id));
  };

  const handleSelectLead = (id: string) => {
    setSelectedLeads(prev => prev.includes(id) ? prev.filter(lid => lid !== id) : [...prev, id]);
  };

  const handleContactLead = (lead: Lead) => {
    setSelectedLeadForAction(lead);
    setShowContactModal(true);
  };

  const handleConvertToContact = (lead: Lead) => {
    setSelectedLeadForAction(lead);
    setShowConvertModal(true);
  };

  const confirmConvert = () => {
    if (selectedLeadForAction) {
      setShowConvertModal(false);
      navigate('/crm/contacts/new', { state: { fromLead: selectedLeadForAction } });
    }
  };

  const handleArchiveLead = (leadId: string) => {
    updateLead(leadId, { status: 'lost' as Lead['status'] });
    showToast('Lead archived');
  };

  const handleReactivateLead = (leadId: string) => {
    updateLead(leadId, { status: 'new' as Lead['status'] });
    showToast('Lead reactivated');
  };

  const handleBulkDelete = () => {
    const count = selectedLeads.length;
    selectedLeads.forEach(id => deleteLead(id));
    setSelectedLeads([]);
    setConfirmDelete(false);
    showToast(`${count} lead(s) deleted`);
  };

  const handleBulkAssign = (teamMember: string) => {
    showToast(`Assigned ${selectedLeads.length} leads to ${teamMember}`);
    setShowBulkAssignDropdown(false);
    setSelectedLeads([]);
  };

  const handleBulkStatusChange = (newStatus: string) => {
    selectedLeads.forEach(id => updateLead(id, { status: newStatus as Lead['status'] }));
    showToast(`Changed status for ${selectedLeads.length} leads to ${newStatus}`);
    setShowBulkStatusDropdown(false);
    setSelectedLeads([]);
  };

  const handleExport = () => {
    const leads = contextLeads.filter(l => selectedLeads.includes(l.id));
    const csvContent = [
      ['Name', 'Company', 'Email', 'Phone', 'Status', 'Score'],
      ...leads.map(l => [
        getLeadName(l), l.company || '', l.email || '', l.phone || '',
        l.status, String(getLeadScore(l)),
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads-export.csv';
    a.click();
    setSelectedLeads([]);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    updateLead(draggableId, { status: destination.droppableId as Lead['status'] });
  };

  const teamMembers = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Williams'];

  // ── Action buttons per status ─────────────────────────────────────────────

  const renderRowActions = (lead: Lead) => {
    const commonView = (
      <button
        onClick={() => navigate(`/crm/leads/${lead.id}`)}
        className="px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50 font-medium"
      >
        View
      </button>
    );
    const convertBtn = (
      <button
        onClick={() => handleConvertToContact(lead)}
        className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 font-medium"
      >
        Convert to Contact
      </button>
    );

    if (lead.status === 'new') return (
      <>
        <button onClick={() => handleContactLead(lead)} className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 font-medium">Contact</button>
        {convertBtn}
        {commonView}
      </>
    );
    if (lead.status === 'contacted') return (
      <>
        <button onClick={() => handleContactLead(lead)} className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 font-medium">Follow Up</button>
        {convertBtn}
        {commonView}
      </>
    );
    if (lead.status === 'qualified') return <>{convertBtn}{commonView}</>;
    if (lead.status === 'lost') return (
      <>
        <button onClick={() => handleArchiveLead(lead.id)} className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 font-medium">Archive</button>
        <button onClick={() => handleReactivateLead(lead.id)} className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 font-medium">Reactivate</button>
        {commonView}
      </>
    );
    return commonView;
  };

  // ── Kanban mini-card ──────────────────────────────────────────────────────

  const renderKanbanCard = (lead: Lead, index: number) => (
    <Draggable key={lead.id} draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white rounded-lg border border-gray-200 p-3 mb-2 shadow-sm cursor-grab transition-shadow ${
            snapshot.isDragging ? 'shadow-lg border-blue-300' : 'hover:shadow-md'
          }`}
          onClick={() => navigate(`/crm/leads/${lead.id}`)}
        >
          <div className="flex items-start justify-between mb-1.5">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{getLeadName(lead)}</p>
              <p className="text-xs text-gray-500 truncate">{lead.company}</p>
            </div>
            <span className={`ml-2 text-xs font-bold px-1.5 py-0.5 rounded border flex-shrink-0 ${getScoreColor(getLeadScore(lead))}`}>
              {getLeadScore(lead)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 truncate">{lead.position || '—'}</span>
            <span className="text-sm">{getSourceInfo(lead.source).icon}</span>
          </div>
        </div>
      )}
    </Draggable>
  );

  // ── Grid card ─────────────────────────────────────────────────────────────

  const renderGridCard = (lead: Lead) => {
    const score = getLeadScore(lead);
    const src = getSourceInfo(lead.source);
    return (
      <div key={lead.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 truncate text-sm">{getLeadName(lead)}</h3>
            <p className="text-xs text-gray-500 truncate">{lead.position || '—'}</p>
            <p className="text-xs font-medium text-gray-700 truncate">{lead.company || '—'}</p>
          </div>
          <span className={`ml-2 text-base font-bold px-2 py-0.5 rounded-lg border-2 flex-shrink-0 ${getScoreColor(score)}`}>
            {score}
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-2 truncate">{lead.email || '—'}</p>
        <div className="flex items-center justify-between mt-auto">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBadge(lead.status)}`}>
            {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
          </span>
          <div className="flex items-center space-x-1">
            <span className={`text-sm p-1 rounded ${src.color}`}>{src.icon}</span>
            <button
              onClick={() => navigate(`/crm/leads/${lead.id}`)}
              className="p-1 hover:bg-gray-100 rounded"
              title="View details"
            >
              <Eye className="h-3.5 w-3.5 text-gray-500" />
            </button>
            <button
              onClick={() => handleConvertToContact(lead)}
              className="p-1 hover:bg-gray-100 rounded"
              title="Convert to contact"
            >
              <UserPlus className="h-3.5 w-3.5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <CRMNavigation />

      {/* Toast notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-[60] bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
          <span className="text-sm">{toast}</span>
          <button onClick={() => setToast(null)} className="ml-1">
            <X className="h-4 w-4 opacity-60 hover:opacity-100" />
          </button>
        </div>
      )}

      {/* Confirm bulk delete */}
      <ConfirmationModal
        isOpen={confirmDelete}
        title="Delete Leads"
        message={`Are you sure you want to delete ${selectedLeads.length} lead(s)? This action cannot be undone.`}
        confirmLabel="Delete"
        type="danger"
        onConfirm={handleBulkDelete}
        onCancel={() => setConfirmDelete(false)}
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <span>🎯</span>
              <span>Leads</span>
            </h1>
            <p className="text-sm text-gray-600 mt-1">Manage and qualify incoming leads</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/crm/leads/new')}
              className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </button>
            <button
              onClick={() => navigate('/crm/leads/integrations')}
              className="flex items-center px-5 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold text-gray-700"
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Integrations
            </button>
            <button
              onClick={() => navigate('/crm/leads/import')}
              className="flex items-center px-5 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold text-gray-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="grid grid-cols-4 gap-6">
          {[
            { label: 'Total Leads', value: stats.total },
            { label: 'New Today', value: stats.newToday },
            { label: 'Hot Leads', value: stats.hot },
            { label: 'Imported This Wk', value: stats.importedThisWeek },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-lg p-5 border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-4xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600 font-medium mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="space-y-4">
          {/* Status filter */}
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <div className="flex items-center space-x-2">
              {['all', 'new', 'contacted', 'qualified', 'lost'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === status ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Source filter */}
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Source:</span>
            <div className="flex items-center space-x-2">
              {['all', 'Lead Gen', 'HRMS', 'Manual', 'Website'].map(source => (
                <button
                  key={source}
                  onClick={() => setSourceFilter(source === 'all' ? 'all' : source)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    sourceFilter === (source === 'all' ? 'all' : source) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {source}
                </button>
              ))}
            </div>
          </div>

          {/* Score filter */}
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Score:</span>
            <div className="flex items-center space-x-2">
              {[
                { value: 'all', label: 'All' },
                { value: '80-100', label: '80-100' },
                { value: '60-79', label: '60-79' },
                { value: 'below-60', label: 'Below 60' },
              ].map(score => (
                <button
                  key={score.value}
                  onClick={() => setScoreFilter(score.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    scoreFilter === score.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {score.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search + sort + view toggle */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-4 flex-1">
              <span className="text-sm font-medium text-gray-700">Search:</span>
              <div className="relative flex-1 max-w-md">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, company, email..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Sort dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  <span>Sort: {currentSortLabel}</span>
                  <ChevronDown className="h-4 w-4 ml-2" />
                </button>
                {showSortDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    {SORT_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        onClick={() => { setSortBy(option.value); setShowSortDropdown(false); }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === option.value ? 'font-semibold text-blue-600' : ''}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* View mode toggle */}
              <div className="flex items-center space-x-2 border border-gray-300 rounded-lg p-1 bg-gray-50">
                {(['list', 'grid', 'kanban'] as const).map(mode => {
                  const labels: Record<typeof mode, string> = { list: '📋 List', grid: '🔲 Grid', kanban: '📊 Kanban' };
                  return (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                        viewMode === mode ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-600 hover:bg-white'
                      }`}
                    >
                      {labels[mode]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── LIST VIEW ─────────────────────────────────────────────────────── */}
      {viewMode === 'list' && (
        <div className="px-8 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="w-12 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedLeads.length === sortedLeads.length && sortedLeads.length > 0}
                          onChange={handleSelectAll}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name / Company</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Source</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">AI Score</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedLeads.slice(0, displayedLeadsCount).map(lead => {
                      const score = getLeadScore(lead);
                      const src = getSourceInfo(lead.source);
                      return (
                        <tr key={lead.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={selectedLeads.includes(lead.id)}
                              onChange={() => handleSelectLead(lead.id)}
                              className="h-4 w-4 text-blue-600 rounded border-gray-300"
                            />
                          </td>
                          <td className="px-4 py-5">
                            <div className="space-y-1">
                              <div className="font-bold text-base text-gray-900">{getLeadName(lead)}</div>
                              <div className="text-sm text-gray-700 font-medium">{lead.company || '—'}</div>
                              <div className="text-xs text-gray-600">{lead.position || '—'}</div>
                              <div className="text-xs text-gray-600">{lead.email || '—'}</div>
                              <div className="text-xs text-gray-600">{lead.phone || '—'}</div>
                              {lead.quick_notes && (
                                <div className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded mt-2 inline-block border border-purple-200">
                                  🤖 {lead.quick_notes}
                                </div>
                              )}
                              <div className="text-xs text-gray-500 mt-2">
                                Added: {formatDate(lead.created_at)} | Last contact: {formatDate(lead.last_contact_date)}
                              </div>
                              {lead.next_follow_up_date && (
                                <div className="text-xs text-gray-500">
                                  Next follow-up: {formatDate(lead.next_follow_up_date)}
                                </div>
                              )}
                              <div className="flex items-center space-x-2 mt-3">
                                {renderRowActions(lead)}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-5">
                            <div className="flex items-center space-x-2">
                              <div className={`p-2 rounded-lg ${src.color}`}>
                                <span className="text-lg">{src.icon}</span>
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900">{lead.source || '—'}</div>
                                {lead.source_detail && (
                                  <div className="text-xs text-gray-500">{lead.source_detail}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-5">
                            <div className="flex flex-col items-center space-y-1">
                              <div className={`text-3xl font-bold px-3 py-1 rounded-lg border-2 ${getScoreColor(score)}`}>
                                {score}
                              </div>
                              <div className="text-base">{getStarRating(score)}</div>
                            </div>
                          </td>
                          <td className="px-4 py-5">
                            <span className={`inline-flex px-4 py-2 rounded-lg text-xs font-bold ${getStatusBadge(lead.status)}`}>
                              {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="relative">
                              <button
                                onClick={() => setShowActionsMenu(showActionsMenu === lead.id ? null : lead.id)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                              >
                                <MoreVertical className="h-4 w-4 text-gray-600" />
                              </button>
                              {showActionsMenu === lead.id && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                  <button
                                    onClick={() => { navigate(`/crm/leads/${lead.id}`); setShowActionsMenu(null); }}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center"
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </button>
                                  <button
                                    onClick={() => { handleContactLead(lead); setShowActionsMenu(null); }}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center"
                                  >
                                    <Mail className="h-4 w-4 mr-2" />
                                    Send Email
                                  </button>
                                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center">
                                    <Phone className="h-4 w-4 mr-2" />
                                    Call
                                  </button>
                                  <button
                                    onClick={() => { navigate('/crm/contacts/new'); setShowActionsMenu(null); }}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center"
                                  >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Convert to Contact
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {sortedLeads.length === 0 && (
                  <div className="py-16 text-center text-gray-500">
                    <p className="text-lg font-medium">No leads found</p>
                    <p className="text-sm mt-1">Try adjusting your filters or add a new lead.</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              <div className="mt-6 text-center">
                <div className="text-sm text-gray-600 mb-4">
                  Showing {Math.min(displayedLeadsCount, sortedLeads.length)} of {sortedLeads.length} leads
                </div>
                {displayedLeadsCount < sortedLeads.length && (
                  <button
                    onClick={() => setDisplayedLeadsCount(prev => Math.min(prev + 20, sortedLeads.length))}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    Load More…
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── GRID VIEW ─────────────────────────────────────────────────────── */}
      {viewMode === 'grid' && (
        <div className="px-8 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {sortedLeads.slice(0, displayedLeadsCount).map(renderGridCard)}
              </div>
              {sortedLeads.length === 0 && (
                <div className="py-16 text-center text-gray-500">
                  <p className="text-lg font-medium">No leads found</p>
                  <p className="text-sm mt-1">Try adjusting your filters or add a new lead.</p>
                </div>
              )}
              <div className="mt-6 text-center">
                <div className="text-sm text-gray-600 mb-4">
                  Showing {Math.min(displayedLeadsCount, sortedLeads.length)} of {sortedLeads.length} leads
                </div>
                {displayedLeadsCount < sortedLeads.length && (
                  <button
                    onClick={() => setDisplayedLeadsCount(prev => Math.min(prev + 20, sortedLeads.length))}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    Load More…
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── KANBAN VIEW ───────────────────────────────────────────────────── */}
      {viewMode === 'kanban' && (
        <div className="px-8 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-4 gap-4">
                {KANBAN_COLUMNS.map(col => {
                  const colLeads = sortedLeads.filter(l => l.status === col.id);
                  return (
                    <div key={col.id} className="flex flex-col">
                      <div className={`flex items-center justify-between px-3 py-2 rounded-t-lg border ${col.headerColor} mb-0`}>
                        <span className="text-sm font-semibold">{col.label}</span>
                        <span className="text-xs font-bold bg-white bg-opacity-70 px-1.5 py-0.5 rounded-full">
                          {colLeads.length}
                        </span>
                      </div>
                      <Droppable droppableId={col.id}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`flex-1 min-h-[200px] p-2 rounded-b-lg border border-t-0 border-gray-200 transition-colors ${
                              snapshot.isDraggingOver ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'
                            }`}
                          >
                            {colLeads.map((lead, index) => renderKanbanCard(lead, index))}
                            {provided.placeholder}
                            {colLeads.length === 0 && !snapshot.isDraggingOver && (
                              <p className="text-xs text-gray-400 text-center py-6">Drop leads here</p>
                            )}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  );
                })}
              </div>
            </DragDropContext>
          )}
        </div>
      )}

      {/* ── BULK ACTIONS BAR ──────────────────────────────────────────────── */}
      {selectedLeads.length > 0 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl border border-gray-200 px-6 py-4 z-50">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-semibold text-gray-900">
              {selectedLeads.length} lead{selectedLeads.length !== 1 ? 's' : ''} selected
            </span>

            {/* Assign dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowBulkAssignDropdown(!showBulkAssignDropdown)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Assign to…
                <ChevronDown className="h-4 w-4 ml-2" />
              </button>
              {showBulkAssignDropdown && (
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg">
                  {teamMembers.map(member => (
                    <button
                      key={member}
                      onClick={() => handleBulkAssign(member)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {member}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Status change dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowBulkStatusDropdown(!showBulkStatusDropdown)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
              >
                Change Status
                <ChevronDown className="h-4 w-4 ml-2" />
              </button>
              {showBulkStatusDropdown && (
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg">
                  {['new', 'contacted', 'qualified', 'lost'].map(status => (
                    <button
                      key={status}
                      onClick={() => handleBulkStatusChange(status)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleExport}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              Export
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Contact modal */}
      {showContactModal && selectedLeadForAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Contact {getLeadName(selectedLeadForAction)}</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                <Mail className="h-5 w-5 mr-3 text-blue-600" />
                <div>
                  <div className="font-medium">Send Email</div>
                  <div className="text-sm text-gray-600">{selectedLeadForAction.email || '—'}</div>
                </div>
              </button>
              <button className="w-full flex items-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                <Phone className="h-5 w-5 mr-3 text-green-600" />
                <div>
                  <div className="font-medium">Call</div>
                  <div className="text-sm text-gray-600">{selectedLeadForAction.phone || '—'}</div>
                </div>
              </button>
            </div>
            <button
              onClick={() => setShowContactModal(false)}
              className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Convert to Contact modal */}
      {showConvertModal && selectedLeadForAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Convert to Contact</h3>
            <p className="text-gray-600 mb-6">
              Convert <strong>{getLeadName(selectedLeadForAction)}</strong> from{' '}
              {selectedLeadForAction.company || 'their company'} to a contact?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={confirmConvert}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Convert
              </button>
              <button
                onClick={() => setShowConvertModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsPage;
