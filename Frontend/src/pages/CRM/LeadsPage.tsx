import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Upload, Search, ChevronDown, MoreVertical, CheckCircle, Mail, Phone, Eye,
  UserPlus, Link as LinkIcon, X, BookmarkCheck,
  Clock, AlertTriangle, UserX, TrendingUp, Copy, BarChart2,
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { useLeads } from '../../contexts/LeadContext';
import { useLeadsPageState } from '../../hooks/useLeadsPageState';
import type { SortOption } from '../../hooks/useLeadsPageState';
import CRMNavigation from '../../components/CRM/CRMNavigation';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import SavedViewsBar from '../../components/Leads/SavedViewsBar';
import SavedViewModal from '../../components/Leads/SavedViewModal';
import KpiCard from '../../components/Leads/KpiCard';
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

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'score_high_low', label: 'Score (High to Low)' },
  { value: 'score_low_high', label: 'Score (Low to High)' },
  { value: 'name_az',        label: 'Name (A-Z)' },
  { value: 'date_newest',    label: 'Date (Newest)' },
];

const KANBAN_COLUMNS: Array<{ id: Lead['status']; label: string; headerColor: string }> = [
  { id: 'new',       label: 'New',       headerColor: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'contacted', label: 'Contacted', headerColor: 'bg-orange-100 text-orange-800 border-orange-200' },
  { id: 'qualified', label: 'Qualified', headerColor: 'bg-green-100 text-green-800 border-green-200' },
  { id: 'lost',      label: 'Lost',      headerColor: 'bg-red-100 text-red-800 border-red-200' },
];

const TEAM_MEMBERS = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Williams'];

// ── Component ─────────────────────────────────────────────────────────────────

const LeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const { leads: contextLeads, loading, updateLead, deleteLead, updateView: ctxUpdateView } = useLeads();

  const {
    viewMode, setViewMode,
    searchQuery, setSearchQuery,
    sortBy, setSortBy, sortLabel,
    displayedCount, loadMore,
    filterState, setFilterStatus, setFilterSource, setFilterScore,
    selectedLeadIds, toggleLeadSelection, selectAllLeads, clearSelection, isSelected,
    activeLead,
    activeModal, openModal, closeModal, isModalOpen,
    toast, showToast, clearToast,
    sortedLeads,
    paginatedLeads,
    kpiMetrics,
    // Insight selectors
    overdueLeads, duplicateRiskLeads, readyToConvertLeads,
    slaBreachedLeads, newUnworkedLeads, sourceQualityThisWeek,
    newUnworkedDelta, readyToConvertDelta,
    activeInsight, setActiveInsight,
    // Saved views
    savedViews, activeViewId, activeViewLabel,
    setActiveView, clearActiveView,
    saveCurrentAsView, updateActiveView, renameView, pinView, reorderViews, deleteView,
  } = useLeadsPageState();

  // ── KPI helpers ───────────────────────────────────────────────────────────
  const uniqueDomainsCount = new Set(
    duplicateRiskLeads.map(l => l.email?.split('@')[1]).filter(Boolean)
  ).size;

  // ── Local state for edit modal ────────────────────────────────────────────
  const [editingViewId, setEditingViewId] = useState<string | null>(null);
  const editingView = savedViews.find(v => v.id === editingViewId) ?? null;
  const isUserViewActive = activeViewId !== null && !activeViewId.startsWith('preset_');

  // ── Handlers ─────────────────────────────────────────────────────────────

  const confirmConvert = () => {
    if (activeLead) {
      closeModal();
      navigate('/crm/contacts/new', { state: { fromLead: activeLead } });
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
    const count = selectedLeadIds.length;
    selectedLeadIds.forEach(id => deleteLead(id));
    clearSelection();
    closeModal();
    showToast(`${count} lead(s) deleted`);
  };

  const handleBulkAssign = (teamMember: string) => {
    showToast(`Assigned ${selectedLeadIds.length} leads to ${teamMember}`);
    closeModal();
    clearSelection();
  };

  const handleBulkStatusChange = (newStatus: string) => {
    selectedLeadIds.forEach(id => updateLead(id, { status: newStatus as Lead['status'] }));
    showToast(`Changed status for ${selectedLeadIds.length} leads to ${newStatus}`);
    closeModal();
    clearSelection();
  };

  const handleExport = () => {
    const leads = contextLeads.filter(l => selectedLeadIds.includes(l.id));
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
    clearSelection();
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    updateLead(draggableId, { status: destination.droppableId as Lead['status'] });
  };

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
        onClick={() => openModal('convertLead', lead)}
        className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 font-medium"
      >
        Convert to Contact
      </button>
    );

    if (lead.status === 'new') return (
      <>
        <button onClick={() => openModal('contactLead', lead)} className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 font-medium">Contact</button>
        {convertBtn}
        {commonView}
      </>
    );
    if (lead.status === 'contacted') return (
      <>
        <button onClick={() => openModal('contactLead', lead)} className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 font-medium">Follow Up</button>
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
              onClick={() => openModal('convertLead', lead)}
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

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[60] bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
          <span className="text-sm">{toast.message}</span>
          <button onClick={clearToast} className="ml-1">
            <X className="h-4 w-4 opacity-60 hover:opacity-100" />
          </button>
        </div>
      )}

      {/* Confirm bulk delete */}
      <ConfirmationModal
        isOpen={isModalOpen('confirmDelete')}
        title="Delete Leads"
        message={`Are you sure you want to delete ${selectedLeadIds.length} lead(s)? This action cannot be undone.`}
        confirmLabel="Delete"
        type="danger"
        onConfirm={handleBulkDelete}
        onCancel={closeModal}
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

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* 1 — Overdue Follow-ups */}
          <KpiCard
            title="Overdue Follow-ups"
            value={overdueLeads.length}
            subtitle={
              overdueLeads.length > 0
                ? `Oldest: ${overdueLeads.slice(0, 3).map(l =>
                    l.full_name || [l.first_name, l.last_name].filter(Boolean).join(' ') || '—'
                  ).join(', ')}`
                : 'All follow-ups on track'
            }
            warning={overdueLeads.length > 0 && overdueLeads.length <= 10}
            danger={overdueLeads.length > 10}
            neutral={overdueLeads.length === 0}
            icon={<Clock size={18} />}
            onClick={() => setActiveInsight(activeInsight === 'overdue' ? null : 'overdue')}
            isActive={activeInsight === 'overdue'}
          />

          {/* 2 — SLA Breached */}
          <KpiCard
            title="SLA Breached"
            value={slaBreachedLeads.length}
            subtitle={
              slaBreachedLeads.length > 0
                ? `${slaBreachedLeads.filter(l => l.source === 'Website').length} web · ${slaBreachedLeads.filter(l => l.source !== 'Website').length} outbound`
                : 'No SLA breaches'
            }
            warning={slaBreachedLeads.length > 0 && slaBreachedLeads.length <= 5}
            danger={slaBreachedLeads.length > 5}
            neutral={slaBreachedLeads.length === 0}
            icon={<AlertTriangle size={18} />}
            badge="4h / 24h SLA"
            onClick={() => setFilterStatus('new')}
            isActive={filterState.status === 'new'}
          />

          {/* 3 — New Unworked */}
          <KpiCard
            title="New Unworked"
            value={newUnworkedLeads.length}
            subtitle={
              newUnworkedLeads.length > 0
                ? `${newUnworkedLeads.length} leads with no contact logged`
                : 'All new leads have been touched'
            }
            delta={newUnworkedDelta}
            deltaLabel="vs last week"
            warning={newUnworkedLeads.length > 5 && newUnworkedLeads.length <= 20}
            danger={newUnworkedLeads.length > 20}
            neutral={newUnworkedLeads.length === 0}
            icon={<UserX size={18} />}
            onClick={() => setActiveInsight(activeInsight === 'untouched' ? null : 'untouched')}
            isActive={activeInsight === 'untouched'}
          />

          {/* 4 — Ready to Convert */}
          <KpiCard
            title="Ready to Convert"
            value={readyToConvertLeads.length}
            subtitle={
              readyToConvertLeads.length > 0
                ? 'Qualified · score ≥ 60'
                : 'No leads ready yet'
            }
            delta={readyToConvertDelta}
            deltaLabel="vs last week"
            neutral={readyToConvertLeads.length === 0}
            icon={<TrendingUp size={18} />}
            onClick={() => setActiveInsight(activeInsight === 'readyToConvert' ? null : 'readyToConvert')}
            isActive={activeInsight === 'readyToConvert'}
          />

          {/* 5 — Duplicate Risk */}
          <KpiCard
            title="Duplicate Risk"
            value={duplicateRiskLeads.length}
            subtitle={
              duplicateRiskLeads.length > 0
                ? `Across ${uniqueDomainsCount} domain${uniqueDomainsCount !== 1 ? 's' : ''}`
                : 'No duplicates detected'
            }
            warning={duplicateRiskLeads.length > 0 && duplicateRiskLeads.length <= 10}
            danger={duplicateRiskLeads.length > 10}
            neutral={duplicateRiskLeads.length === 0}
            icon={<Copy size={18} />}
            onClick={() => setActiveInsight(activeInsight === 'duplicateRisk' ? null : 'duplicateRisk')}
            isActive={activeInsight === 'duplicateRisk'}
          />

          {/* 6 — Top Source This Week */}
          <KpiCard
            title="Top Source This Week"
            value={sourceQualityThisWeek.topSource}
            subtitle={
              sourceQualityThisWeek.weeklyLeads > 0
                ? `avg score ${sourceQualityThisWeek.topSourceAvgScore} · ${sourceQualityThisWeek.topSourceCount} lead${sourceQualityThisWeek.topSourceCount !== 1 ? 's' : ''}`
                : 'No leads this week'
            }
            neutral
            icon={<BarChart2 size={18} />}
            badge="This week"
            onClick={
              sourceQualityThisWeek.topSource !== '—'
                ? () => setFilterSource(sourceQualityThisWeek.topSource)
                : undefined
            }
            isActive={
              filterState.source === sourceQualityThisWeek.topSource &&
              sourceQualityThisWeek.topSource !== '—'
            }
          />

        </div>
      </div>

      {/* ── Saved Views Bar ───────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-8 py-3">
        <SavedViewsBar
          savedViews={savedViews}
          activeViewId={activeViewId}
          onSelectView={setActiveView}
          onNewView={() => openModal('createView')}
          onEditView={(id) => { setEditingViewId(id); openModal('editView'); }}
          onManageViews={() => openModal('manageViews')}
          onRenameView={renameView}
          onDeleteView={deleteView}
          onPinView={pinView}
          onReorderView={reorderViews}
        />
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="space-y-4">
          {/* Active view pill + save controls */}
          {activeViewId && (
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Viewing:</span>
                <span className="flex items-center space-x-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200">
                  <BookmarkCheck className="h-3.5 w-3.5" />
                  <span>{activeViewLabel}</span>
                  <button
                    onClick={clearActiveView}
                    className="ml-1 hover:text-blue-900 opacity-60 hover:opacity-100"
                    aria-label="Clear active view"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {isUserViewActive && (
                  <button
                    onClick={updateActiveView}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
                  >
                    Update {activeViewLabel}
                  </button>
                )}
                <button
                  onClick={() => openModal('createView')}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 text-gray-700"
                >
                  Save as new view
                </button>
              </div>
            </div>
          )}

          {/* Status filter */}
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <div className="flex items-center space-x-2">
              {['all', 'new', 'contacted', 'qualified', 'lost'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterState.status === status ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                  onClick={() => setFilterSource(source === 'all' ? 'all' : source)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterState.source === (source === 'all' ? 'all' : source)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                { value: 'all',      label: 'All' },
                { value: '80-100',   label: '80-100' },
                { value: '60-79',    label: '60-79' },
                { value: 'below-60', label: 'Below 60' },
              ].map(score => (
                <button
                  key={score.value}
                  onClick={() => setFilterScore(score.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterState.score === score.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                  onClick={() => isModalOpen('sortDropdown') ? closeModal() : openModal('sortDropdown')}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  <span>Sort: {sortLabel}</span>
                  <ChevronDown className="h-4 w-4 ml-2" />
                </button>
                {isModalOpen('sortDropdown') && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    {SORT_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        onClick={() => { setSortBy(option.value); closeModal(); }}
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
                          checked={selectedLeadIds.length === sortedLeads.length && sortedLeads.length > 0}
                          onChange={selectAllLeads}
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
                    {paginatedLeads.map(lead => {
                      const score = getLeadScore(lead);
                      const src = getSourceInfo(lead.source);
                      return (
                        <tr key={lead.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={isSelected(lead.id)}
                              onChange={() => toggleLeadSelection(lead.id)}
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
                                onClick={() =>
                                  isModalOpen('actionsMenu') && activeLead?.id === lead.id
                                    ? closeModal()
                                    : openModal('actionsMenu', lead)
                                }
                                className="p-2 hover:bg-gray-100 rounded-lg"
                              >
                                <MoreVertical className="h-4 w-4 text-gray-600" />
                              </button>
                              {isModalOpen('actionsMenu') && activeLead?.id === lead.id && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                  <button
                                    onClick={() => { navigate(`/crm/leads/${lead.id}`); closeModal(); }}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center"
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </button>
                                  <button
                                    onClick={() => openModal('contactLead', lead)}
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
                                    onClick={() => { navigate('/crm/contacts/new'); closeModal(); }}
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
                  Showing {Math.min(displayedCount, sortedLeads.length)} of {sortedLeads.length} leads
                </div>
                {displayedCount < sortedLeads.length && (
                  <button
                    onClick={loadMore}
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
                {paginatedLeads.map(renderGridCard)}
              </div>
              {sortedLeads.length === 0 && (
                <div className="py-16 text-center text-gray-500">
                  <p className="text-lg font-medium">No leads found</p>
                  <p className="text-sm mt-1">Try adjusting your filters or add a new lead.</p>
                </div>
              )}
              <div className="mt-6 text-center">
                <div className="text-sm text-gray-600 mb-4">
                  Showing {Math.min(displayedCount, sortedLeads.length)} of {sortedLeads.length} leads
                </div>
                {displayedCount < sortedLeads.length && (
                  <button
                    onClick={loadMore}
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
      {selectedLeadIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl border border-gray-200 px-6 py-4 z-50">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-semibold text-gray-900">
              {selectedLeadIds.length} lead{selectedLeadIds.length !== 1 ? 's' : ''} selected
            </span>

            {/* Assign dropdown */}
            <div className="relative">
              <button
                onClick={() => isModalOpen('bulkAssign') ? closeModal() : openModal('bulkAssign')}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Assign to…
                <ChevronDown className="h-4 w-4 ml-2" />
              </button>
              {isModalOpen('bulkAssign') && (
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg">
                  {TEAM_MEMBERS.map(member => (
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
                onClick={() => isModalOpen('bulkStatus') ? closeModal() : openModal('bulkStatus')}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
              >
                Change Status
                <ChevronDown className="h-4 w-4 ml-2" />
              </button>
              {isModalOpen('bulkStatus') && (
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
              onClick={() => openModal('confirmDelete')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Contact modal */}
      {isModalOpen('contactLead') && activeLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Contact {getLeadName(activeLead)}</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                <Mail className="h-5 w-5 mr-3 text-blue-600" />
                <div>
                  <div className="font-medium">Send Email</div>
                  <div className="text-sm text-gray-600">{activeLead.email || '—'}</div>
                </div>
              </button>
              <button className="w-full flex items-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                <Phone className="h-5 w-5 mr-3 text-green-600" />
                <div>
                  <div className="font-medium">Call</div>
                  <div className="text-sm text-gray-600">{activeLead.phone || '—'}</div>
                </div>
              </button>
            </div>
            <button
              onClick={closeModal}
              className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Saved View Modals ─────────────────────────────────────────────── */}
      <SavedViewModal
        mode="create"
        isOpen={isModalOpen('createView')}
        onClose={closeModal}
        onSave={async (name, visibility) => {
          await saveCurrentAsView(name, visibility);
          closeModal();
        }}
      />

      <SavedViewModal
        mode="edit"
        isOpen={isModalOpen('editView')}
        onClose={() => { closeModal(); setEditingViewId(null); }}
        viewId={editingView?.id}
        initialName={editingView?.name}
        initialVisibility={editingView?.visibility}
        onUpdate={async (name, visibility) => {
          if (editingViewId) {
            await ctxUpdateView(editingViewId, { name, visibility });
            showToast('View updated', 'success');
          }
          closeModal();
          setEditingViewId(null);
        }}
      />

      <SavedViewModal
        mode="manage"
        isOpen={isModalOpen('manageViews')}
        onClose={closeModal}
        savedViews={savedViews}
        onRename={renameView}
        onDelete={deleteView}
        onPin={pinView}
      />

      {/* Convert to Contact modal */}
      {isModalOpen('convertLead') && activeLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Convert to Contact</h3>
            <p className="text-gray-600 mb-6">
              Convert <strong>{getLeadName(activeLead)}</strong> from{' '}
              {activeLead.company || 'their company'} to a contact?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={confirmConvert}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Convert
              </button>
              <button
                onClick={closeModal}
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
