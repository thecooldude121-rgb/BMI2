import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Upload, Search, ChevronDown, CheckCircle, Mail, Phone, Eye,
  UserPlus, Link as LinkIcon, X, BookmarkCheck,
  Clock, AlertTriangle, UserX, TrendingUp, Copy, BarChart2, SlidersHorizontal,
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { useLeads } from '../../contexts/LeadContext';
import { useLeadsPageState } from '../../hooks/useLeadsPageState';
import { usePermissions } from '../../hooks/usePermissions';
import { SORT_OPTIONS } from '../../utils/leadSorting';
import CRMNavigation from '../../components/CRM/CRMNavigation';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import SavedViewsBar from '../../components/Leads/SavedViewsBar';
import SavedViewModal from '../../components/Leads/SavedViewModal';
import KpiCard from '../../components/Leads/KpiCard';
import LeadTableRow from '../../components/Leads/LeadTableRow';
import FilterChipBar from '../../components/Leads/FilterChipBar';
import AdvancedFilterDrawer from '../../components/Leads/AdvancedFilterDrawer';
import BulkActionBar from '../../components/Leads/BulkActionBar';
import type { FollowUpType } from '../../components/Leads/BulkActionBar';
import QuickAddLeadModal from '../../components/Leads/QuickAddLeadModal';
import LeadConversionWizard from '../../components/Leads/LeadConversionWizard';
import MergeReviewModal from '../../components/Leads/MergeReviewModal';
import KanbanOutcomeModal from '../../components/Leads/KanbanOutcomeModal';
import KanbanQualifyModal from '../../components/Leads/KanbanQualifyModal';
import SourceQualityDrawer from '../../components/Leads/SourceQualityDrawer';
import TerminalStatusModal from '../../components/Leads/TerminalStatusModal';
import LeadQuickDrawer from '../../components/Leads/LeadQuickDrawer';
import OutreachComposer from '../../components/Leads/OutreachComposer';
import { useLeadActions } from '../../hooks/useLeadActions';
import { HEALTHY_SLA_RESULT } from '../../utils/leadSla';
import type { TerminalAction } from '../../utils/leadReasons';
import { computeConversionReadiness } from '../../utils/conversionReadiness';
import { computeMultiFactorScore } from '../../utils/leadScoring/multiFactorScore';
import type { AdvancedFilter, FilterGroup } from '../../types/leadFilter';
import type { Lead } from '../../types/lead';
import type { ModalId } from '../../hooks/useLeadsPageState';

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
    new:               'bg-blue-500 text-white',
    assigned:          'bg-indigo-500 text-white',
    enriching:         'bg-cyan-500 text-white',
    attempting_contact: 'bg-orange-500 text-white',
    engaged:           'bg-emerald-500 text-white',
    qualified:         'bg-green-500 text-white',
    sales_accepted:    'bg-teal-500 text-white',
    nurture:           'bg-purple-500 text-white',
    disqualified:      'bg-gray-400 text-white',
    converted:         'bg-teal-600 text-white',
    lost:              'bg-red-500 text-white',
  };
  return colors[status] || 'bg-gray-500 text-white';
};

const getStatusLabel = (status: string) =>
  status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

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

const formatRecency = (date?: string): string => {
  if (!date) return 'Never';
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7)  return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

const getCtaStyle = (color: string): string => {
  switch (color) {
    case 'green': return 'bg-green-600 text-white hover:bg-green-700';
    case 'red':   return 'bg-red-600   text-white hover:bg-red-700';
    case 'amber': return 'bg-amber-500 text-white hover:bg-amber-600';
    case 'blue':  return 'bg-blue-600  text-white hover:bg-blue-700';
    default:      return 'bg-gray-100  text-gray-700 hover:bg-gray-200';
  }
};

const getAgingDays = (lead: Lead): number => {
  const ref = lead.stage_entered_at ?? lead.created_at;
  return Math.floor((Date.now() - new Date(ref).getTime()) / 86_400_000);
};



// Modals not yet implemented — show a toast instead of opening a stub modal
const STUB_MODALS = new Set<ModalId>(['assignOwner', 'addTag', 'enrichLead', 'editLead']);
const STUB_LABELS: Partial<Record<ModalId, string>> = {
  assignOwner: 'Assign owner',
  addTag:      'Add tag',
  enrichLead:  'Lead enrichment',
  editLead:    'Edit lead',
};

// WIP limits per lane — soft warning only, no hard block on drop.
// TODO: move to a team settings page when per-user configuration is needed.
const WIP_LIMITS: Record<string, number> = {
  incoming:   50,
  research:   20,
  outreach:   30,
  engaged:    20,
  qualifying: 15,
  nurturing:  25,
};

// 7 swim-lane columns — each maps to one or more lifecycle statuses.
// Cards within a lane show their individual status badge.
const KANBAN_SWIM_LANES: Array<{
  id: string;
  label: string;
  statuses: Lead['status'][];
  dropTarget: Lead['status'];
  headerColor: string;
}> = [
  { id: 'incoming',   label: 'Incoming',   statuses: ['new', 'assigned'],                    dropTarget: 'new',               headerColor: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'research',   label: 'Research',   statuses: ['enriching'],                           dropTarget: 'enriching',          headerColor: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  { id: 'outreach',   label: 'Outreach',   statuses: ['attempting_contact'],                  dropTarget: 'attempting_contact', headerColor: 'bg-orange-100 text-orange-800 border-orange-200' },
  { id: 'engaged',    label: 'Engaged',    statuses: ['engaged'],                             dropTarget: 'engaged',            headerColor: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'qualifying', label: 'Qualifying', statuses: ['qualified', 'sales_accepted'],         dropTarget: 'qualified',          headerColor: 'bg-green-100 text-green-800 border-green-200' },
  { id: 'nurturing',  label: 'Nurturing',  statuses: ['nurture'],                             dropTarget: 'nurture',            headerColor: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'closed',     label: 'Closed',     statuses: ['converted', 'disqualified', 'lost'],  dropTarget: 'lost',               headerColor: 'bg-red-100 text-red-800 border-red-200' },
];

// ── Component ─────────────────────────────────────────────────────────────────

const LeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const { leads: contextLeads, loading, updateLead, deleteLead, updateView: ctxUpdateView } = useLeads();
  const actions = useLeadActions(updateLead);

  const { can } = usePermissions();

  const {
    viewMode, setViewMode,
    searchQuery, setSearchQuery,
    sortBy, setSortBy, sortLabel, sortExplanation,
    displayedCount, loadMore,
    filterState, setFilterStatus, setFilterSource, setFilterScore,
    selectedLeadIds, toggleLeadSelection, selectAllLeads, setSelection, clearSelection, isSelected,
    activeLead,
    activeModal, openModal, closeModal, isModalOpen,
    toast, showToast, clearToast,
    sortedLeads,
    paginatedLeads,
    kpiMetrics,
    // Insight selectors
    overdueLeads, duplicateRiskLeads, duplicateCandidateMap, untouchedLeads,
    slaBreachedLeads, slaBreachCounts, leadSLAMap, newUnworkedLeads, nbaQueue, sourceQualityThisWeek,
    sourceAnalytics,
    newUnworkedDelta,
    canViewAllLeads,
    activeInsight, setActiveInsight,
    // Advanced filters
    advancedFilter, hasActiveAdvancedFilter, setAdvancedFilter, clearAdvancedFilter,
    // Status view mode
    statusViewMode, setStatusViewMode,
    // Saved views
    savedViews, activeViewId, activeViewLabel,
    setActiveView, clearActiveView,
    saveCurrentAsView, updateActiveView, renameView, pinView, reorderViews, deleteView,
  } = useLeadsPageState();

  // ── Source quality drawer ─────────────────────────────────────────────────
  const [showSourceQualityDrawer, setShowSourceQualityDrawer] = useState(false);

  // ── Terminal status modal (disqualify / lost) ─────────────────────────────
  const [bulkTerminalAction, setBulkTerminalAction] = useState<TerminalAction | null>(null);

  // ── Quick drawer ──────────────────────────────────────────────────────────
  const [drawerLeadId, setDrawerLeadId] = useState<string | null>(null);
  const drawerLead = drawerLeadId ? contextLeads.find(l => l.id === drawerLeadId) ?? null : null;
  const drawerIdx  = drawerLeadId ? sortedLeads.findIndex(l => l.id === drawerLeadId) : -1;

  // ── Kanban workflow state ─────────────────────────────────────────────────
  const [pendingDropLeadId, setPendingDropLeadId] = useState<string | null>(null);
  const [kanbanModal,       setKanbanModal]       = useState<'qualify' | 'outcome' | null>(null);
  const pendingLead = pendingDropLeadId
    ? (contextLeads.find(l => l.id === pendingDropLeadId) ?? null)
    : null;

  // ── KPI helpers ───────────────────────────────────────────────────────────
  const uniqueDomainsCount = new Set(
    duplicateRiskLeads.map(l => l.email?.split('@')[1]).filter(Boolean)
  ).size;

  const overdueIdSet = React.useMemo(
    () => new Set(overdueLeads.map(l => l.id)),
    [overdueLeads],
  );
  const untouchedIdSet = React.useMemo(
    () => new Set(untouchedLeads.map(l => l.id)),
    [untouchedLeads],
  );

  // ── Advanced filter handlers ──────────────────────────────────────────────
  const handleRemoveCondition = (groupId: string, conditionId: string) => {
    const updated: AdvancedFilter = {
      groups: advancedFilter.groups.map((g: FilterGroup) =>
        g.id !== groupId ? g : { ...g, conditions: g.conditions.filter(c => c.id !== conditionId) }
      ).filter((g: FilterGroup) => g.conditions.length > 0),
    };
    setAdvancedFilter(updated);
  };

  const handleRemoveGroup = (groupId: string) => {
    setAdvancedFilter({
      groups: advancedFilter.groups.filter((g: FilterGroup) => g.id !== groupId),
    });
  };

  // ── Quick Add + split-button state ───────────────────────────────────────
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!addMenuOpen) return;
    const h = (e: MouseEvent) => {
      if (!addMenuRef.current?.contains(e.target as Node)) setAddMenuOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [addMenuOpen]);

  // ── Local state for edit modal ────────────────────────────────────────────
  const [editingViewId, setEditingViewId] = useState<string | null>(null);
  const editingView = savedViews.find(v => v.id === editingViewId) ?? null;
  const isUserViewActive = activeViewId !== null && !activeViewId.startsWith('preset_');

  // ── Bulk selection computed values ────────────────────────────────────────
  const isPageFullySelected = React.useMemo(
    () => paginatedLeads.length > 0 && paginatedLeads.every(l => selectedLeadIds.includes(l.id)),
    [paginatedLeads, selectedLeadIds],
  );
  const areAllFiltered =
    selectedLeadIds.length === sortedLeads.length && sortedLeads.length > 0;

  const selectedLeads = React.useMemo(
    () => contextLeads.filter(l => selectedLeadIds.includes(l.id)),
    [contextLeads, selectedLeadIds],
  );

  // ── Handlers ─────────────────────────────────────────────────────────────

  // ── Single-lead modal actions (triggered from row ⋯ menu) ─────────────────


  const handleSingleDelete = () => {
    if (activeLead) {
      deleteLead(activeLead.id);
      closeModal();
      showToast('Lead deleted', 'success');
    }
  };

  const handleSingleArchive = () => {
    // Now handled by TerminalStatusModal via the 'terminalLost' modal ID
  };

  // ── Bulk action handlers (delegated from BulkActionBar) ───────────────────

  const handleBulkChangeStatus = (status: Lead['status']) => {
    const n = selectedLeadIds.length;
    selectedLeadIds.forEach(id => updateLead(id, { status }));
    showToast(`${n} lead${n !== 1 ? 's' : ''} → ${status}`, 'success');
    clearSelection();
  };

  const handleBulkSetFollowUp = (date: string, _type: FollowUpType) => {
    // _type is UI-only; only date is persisted to next_follow_up_date
    const n = selectedLeadIds.length;
    selectedLeadIds.forEach(id => updateLead(id, { next_follow_up_date: date }));
    showToast(`Follow-up set for ${n} lead${n !== 1 ? 's' : ''}`, 'success');
    clearSelection();
  };

  const handleBulkExport = () => {
    const csvContent = [
      ['Name', 'Company', 'Email', 'Phone', 'Status', 'Score'],
      ...selectedLeads.map(l => [
        getLeadName(l), l.company || '', l.email || '', l.phone || '',
        l.status, String(getLeadScore(l)),
      ]),
    ].map(row => row.join(',')).join('\n');
    const url = window.URL.createObjectURL(new Blob([csvContent], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads-export.csv';
    a.click();
    showToast(`${selectedLeads.length} lead${selectedLeads.length !== 1 ? 's' : ''} exported`, 'success');
    // Intentionally do NOT clear selection — user may want to take another action
  };

  const handleBulkConvert = (ids: string[]) => {
    ids.forEach(id => updateLead(id, { status: 'converted' as Lead['status'] }));
    showToast(`${ids.length} lead${ids.length !== 1 ? 's' : ''} converted`, 'success');
    clearSelection();
  };

  const handleBulkArchive = () => setBulkTerminalAction('lost');

  const handleBulkDisqualify = () => setBulkTerminalAction('disqualified');

  const handleTerminalConfirm = (reason: string, notes: string) => {
    if (bulkTerminalAction !== null) {
      const status = bulkTerminalAction;
      const n = selectedLeadIds.length;
      const extra = status === 'disqualified'
        ? { disqualified_reason: reason, disqualified_reason_notes: notes || undefined }
        : { lost_reason: reason, lost_reason_notes: notes || undefined };
      // TODO: wire bulk terminal actions through actions.disqualify/markLost per-lead for audit trail
      selectedLeadIds.forEach(id => updateLead(id, { status, ...extra } as Partial<Lead>));
      showToast(`${n} lead${n !== 1 ? 's' : ''} marked ${status}`, 'success');
      clearSelection();
      setBulkTerminalAction(null);
    } else if (activeLead) {
      const isSingleDisqualify = isModalOpen('terminalDisqualify');
      const notesOrUndefined = notes || undefined;
      if (isSingleDisqualify) {
        void actions.disqualify(activeLead, reason, notesOrUndefined);
      } else {
        void actions.markLost(activeLead, reason, notesOrUndefined);
      }
      showToast(`Lead marked as ${isSingleDisqualify ? 'disqualified' : 'lost'}`, 'success');
      closeModal();
    }
  };

  const handleBulkDelete = () => {
    const n = selectedLeadIds.length;
    selectedLeadIds.forEach(id => deleteLead(id));
    showToast(`${n} lead${n !== 1 ? 's' : ''} deleted`, 'success');
    clearSelection();
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const laneId = destination.droppableId;

    // Guarded lanes — intercept drop and open the relevant modal.
    // The lead's status is NOT updated yet; if the user cancels, the card
    // snaps back automatically because the underlying data never changed.
    if (laneId === 'qualifying') {
      setPendingDropLeadId(draggableId);
      setKanbanModal('qualify');
      return;
    }
    if (laneId === 'closed') {
      setPendingDropLeadId(draggableId);
      setKanbanModal('outcome');
      return;
    }

    // Unguarded lanes — update directly.
    const lane = KANBAN_SWIM_LANES.find(l => l.id === laneId);
    if (lane) {
      const draggedLead = contextLeads.find(l => l.id === draggableId);
      if (draggedLead) void actions.changeStatus(draggedLead, lane.dropTarget);
      else updateLead(draggableId, { status: lane.dropTarget });
    }
  };

  // ── Kanban card (workflow-aware) ──────────────────────────────────────────

  const renderKanbanCard = (lead: Lead, index: number) => {
    const score      = getLeadScore(lead);
    const ageDays    = getAgingDays(lead);
    const slaResult  = leadSLAMap.get(lead.id);
    const nbaPri     = nbaQueue.get(lead.id);

    // Build urgency signal list in priority order (max 3 shown, rest as +N)
    type Sig = { cls: string; icon: React.ReactNode; title: string };
    const signals: Sig[] = [];
    if (overdueIdSet.has(lead.id))
      signals.push({ cls: 'text-amber-500', icon: <Clock size={9} />, title: 'Overdue' });
    if (slaResult?.overall === 'breached')
      signals.push({ cls: 'text-red-500', icon: <AlertTriangle size={9} />, title: 'SLA breach' });
    if (duplicateCandidateMap.has(lead.id))
      signals.push({ cls: 'text-orange-500', icon: <Copy size={9} />, title: 'Duplicate risk' });
    if (nbaPri === 'urgent' || nbaPri === 'high')
      signals.push({
        cls:   nbaPri === 'urgent' ? 'text-red-500' : 'text-amber-500',
        icon:  <TrendingUp size={9} />,
        title: `${nbaPri} priority`,
      });
    const shownSigs = signals.slice(0, 3);
    const overflow  = Math.max(0, signals.length - 3);

    const ageColor =
      ageDays < 7  ? 'bg-gray-50  text-gray-400'  :
      ageDays < 21 ? 'bg-amber-50 text-amber-600' :
                     'bg-red-50   text-red-600';

    return (
      <Draggable key={lead.id} draggableId={lead.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`bg-white rounded-lg border p-3 mb-2 shadow-sm cursor-grab transition-shadow ${
              snapshot.isDragging
                ? 'shadow-lg border-blue-300'
                : 'border-gray-200 hover:shadow-md'
            }`}
            onClick={() => setDrawerLeadId(lead.id)}
          >
            {/* Name + score */}
            <div className="flex items-start justify-between gap-1.5 mb-1">
              <p className="text-sm font-semibold text-gray-900 truncate flex-1 min-w-0 leading-tight">
                {getLeadName(lead)}
              </p>
              <span className={`shrink-0 text-xs font-bold px-1.5 py-0.5 rounded border ${getScoreColor(score)}`}>
                {score}
              </span>
            </div>

            {/* Company + status badge */}
            <div className="flex items-center justify-between gap-1 mb-2.5">
              <p className="text-xs text-gray-500 truncate flex-1 min-w-0">{lead.company || '—'}</p>
              <span className={`shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${getStatusBadge(lead.status)}`}>
                {getStatusLabel(lead.status)}
              </span>
            </div>

            {/* Footer: urgency icons (max 3 + overflow) + aging chip */}
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1">
                {shownSigs.map((sig, i) => (
                  <span key={i} className={sig.cls} title={sig.title}>
                    {sig.icon}
                  </span>
                ))}
                {overflow > 0 && (
                  <span className="text-[9px] font-bold text-gray-400">+{overflow}</span>
                )}
              </div>
              <span
                className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${ageColor}`}
                title={`${ageDays}d in stage`}
              >
                {ageDays === 0 ? 'Today' : `${ageDays}d`}
              </span>
            </div>
          </div>
        )}
      </Draggable>
    );
  };

  // ── Grid card (triage-optimized) ─────────────────────────────────────────

  const renderGridCard = (lead: Lead) => {
    const score       = getLeadScore(lead);
    const src         = getSourceInfo(lead.source);
    const selected    = isSelected(lead.id);
    const isDuplicate = duplicateCandidateMap.has(lead.id);
    const isOver      = overdueIdSet.has(lead.id);
    const isUnworked  = (lead.status === 'new' || lead.status === 'assigned') && !lead.last_contact_date;
    const slaResult   = leadSLAMap.get(lead.id);
    const nbaPri      = nbaQueue.get(lead.id);
    const hasSLABreach = slaResult?.overall === 'breached';
    const hasUrgency   = isOver || hasSLABreach || isDuplicate || nbaPri === 'urgent' || nbaPri === 'high';
    const recency      = formatRecency(lead.last_contact_date);

    // CTA: nbaQueue priority drives urgency; rule hierarchy drives action label
    const canConvertLead = can('leads.convert');
    const cta: { label: string; modal: ModalId | null; color: string; blocked?: boolean } = (() => {
      if (isDuplicate)
        return { label: 'Review duplicate', modal: 'mergeDuplicate', color: 'amber' };
      if (lead.status === 'qualified' || lead.status === 'sales_accepted')
        return { label: 'Convert', modal: 'convertLead', color: 'green', blocked: !canConvertLead };
      if (isOver || nbaPri === 'urgent')
        return { label: 'Follow up', modal: 'contactLead', color: 'red' };
      if (isUnworked || nbaPri === 'high')
        return { label: 'Contact now', modal: 'contactLead', color: 'blue' };
      if (lead.status === 'engaged' || lead.status === 'attempting_contact')
        return { label: 'Log activity', modal: 'contactLead', color: 'blue' };
      return { label: 'View details', modal: null, color: 'gray' };
    })();

    return (
      <div
        key={lead.id}
        className={`relative bg-white rounded-xl border flex flex-col cursor-pointer transition-all duration-150 hover:shadow-md ${
          selected
            ? 'ring-2 ring-blue-500 border-blue-300 shadow-sm'
            : 'border-gray-200 hover:border-gray-300 shadow-sm'
        }`}
        onClick={() => setDrawerLeadId(lead.id)}
      >
        {/* ── Header: checkbox + name/company + score ──────────────────── */}
        <div className="px-4 pt-4 pb-2 flex items-start gap-3">
          <div
            className="shrink-0 mt-0.5"
            onClick={e => { e.stopPropagation(); toggleLeadSelection(lead.id); }}
          >
            <input
              type="checkbox"
              checked={selected}
              onChange={() => toggleLeadSelection(lead.id)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 cursor-pointer focus:ring-blue-500"
              aria-label={`Select ${getLeadName(lead)}`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate leading-tight">{getLeadName(lead)}</p>
            <p className="text-xs text-gray-500 truncate">{lead.company || '—'}</p>
          </div>
          <span className={`shrink-0 text-sm font-bold px-2 py-0.5 rounded-lg border-2 ${getScoreColor(score)}`}>
            {score}
          </span>
        </div>

        {/* ── Identity sub-row: title + source ─────────────────────────── */}
        <div className="px-4 pb-3 flex items-center justify-between gap-2">
          <span className="text-xs text-gray-400 truncate">{lead.position || 'No title'}</span>
          <span className={`text-sm px-1.5 py-0.5 rounded shrink-0 ${src.color}`}>{src.icon}</span>
        </div>

        {/* ── Urgency strip (rendered only when flags exist) ────────────── */}
        {hasUrgency && (
          <div className="px-4 pb-3 flex flex-wrap gap-1">
            {isOver && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                <Clock size={9} />Overdue
              </span>
            )}
            {hasSLABreach && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                <AlertTriangle size={9} />SLA breach
              </span>
            )}
            {isDuplicate && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                <Copy size={9} />Dup risk
              </span>
            )}
            {nbaPri === 'urgent' && !isOver && !hasSLABreach && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                Urgent
              </span>
            )}
            {nbaPri === 'high' && !isOver && !hasSLABreach && !isDuplicate && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                High priority
              </span>
            )}
          </div>
        )}

        {/* ── Divider ──────────────────────────────────────────────────── */}
        <div className="mx-4 border-t border-gray-100" />

        {/* ── State row: status badge + last contact recency ───────────── */}
        <div className="px-4 py-2.5 flex items-center justify-between gap-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full truncate max-w-[120px] ${getStatusBadge(lead.status)}`}>
            {getStatusLabel(lead.status)}
          </span>
          <span className={`text-[10px] shrink-0 tabular-nums ${recency === 'Never' ? 'text-amber-500 font-medium' : 'text-gray-400'}`}>
            {recency === 'Never' ? 'Never contacted' : recency}
          </span>
        </div>

        {/* ── Primary CTA ──────────────────────────────────────────────── */}
        <div className="px-3 pb-3 mt-auto">
          <button
            disabled={cta.blocked}
            title={cta.blocked ? 'Requires Senior SDR or above' : undefined}
            className={`w-full py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              cta.blocked
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                : getCtaStyle(cta.color)
            }`}
            onClick={e => {
              e.stopPropagation();
              if (cta.blocked) return;
              if (cta.modal) {
                if (STUB_MODALS.has(cta.modal)) {
                  showToast(`${STUB_LABELS[cta.modal] ?? cta.modal} — coming soon`, 'info');
                } else {
                  openModal(cta.modal, lead);
                }
              } else {
                setDrawerLeadId(lead.id);
              }
            }}
          >
            {cta.label}
          </button>
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

      {/* Single-lead delete (from row ⋯ menu) */}
      <ConfirmationModal
        isOpen={isModalOpen('confirmDelete')}
        title="Delete Lead"
        message={activeLead ? `Permanently delete ${[activeLead.first_name, activeLead.last_name].filter(Boolean).join(' ') || 'this lead'}? This cannot be undone.` : ''}
        confirmLabel="Delete"
        type="danger"
        onConfirm={handleSingleDelete}
        onCancel={closeModal}
      />

      {/* Single-lead terminal status modals (disqualify / lost) */}
      <TerminalStatusModal
        open={isModalOpen('terminalDisqualify') || isModalOpen('terminalLost') || bulkTerminalAction !== null}
        action={
          isModalOpen('terminalDisqualify') ? 'disqualified' :
          isModalOpen('terminalLost')        ? 'lost' :
          bulkTerminalAction!
        }
        count={bulkTerminalAction !== null ? selectedLeadIds.length : 1}
        leadName={bulkTerminalAction === null && activeLead ? getLeadName(activeLead) : undefined}
        onConfirm={handleTerminalConfirm}
        onClose={() => {
          if (bulkTerminalAction !== null) setBulkTerminalAction(null);
          else closeModal();
        }}
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
            {/* Split-button: Quick Add (primary) + dropdown for Full Form / Import CSV */}
            <div ref={addMenuRef} className="relative">
              <div className="flex items-center rounded-lg overflow-hidden shadow-sm">
                <button
                  onClick={() => setQuickAddOpen(true)}
                  className="flex items-center px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-semibold"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Quick Add
                </button>
                <button
                  onClick={() => setAddMenuOpen(o => !o)}
                  aria-label="More lead creation options"
                  aria-expanded={addMenuOpen}
                  aria-haspopup="menu"
                  className="px-2 py-2.5 bg-blue-700 text-white hover:bg-blue-800 transition-colors border-l border-blue-500"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
              {addMenuOpen && (
                <div role="menu" className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-30 py-1">
                  <button
                    role="menuitem"
                    onClick={() => { setAddMenuOpen(false); navigate('/crm/leads/new'); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4 text-gray-400" />
                    Full Form
                  </button>
                  <div className="my-1 border-t border-gray-100" />
                  <button
                    role="menuitem"
                    onClick={() => { setAddMenuOpen(false); navigate('/crm/leads/import'); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4 text-gray-400" />
                    Import CSV
                  </button>
                </div>
              )}
            </div>
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
                ? `${slaBreachCounts.firstResponse} first-response · ${slaBreachCounts.followUp} follow-up · ${slaBreachCounts.stale} stale`
                : 'No SLA breaches across all tracks'
            }
            warning={slaBreachedLeads.length > 0 && slaBreachedLeads.length <= 5}
            danger={slaBreachedLeads.length > 5}
            neutral={slaBreachedLeads.length === 0}
            icon={<AlertTriangle size={18} />}
            badge="Multi-track SLA"
            onClick={() => setActiveInsight(activeInsight === 'slaBreach' ? null : 'slaBreach')}
            isActive={activeInsight === 'slaBreach'}
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

          {/* 4 — Action Required (NBA) */}
          <KpiCard
            title="Action Required"
            value={kpiMetrics.urgentNbaCount + kpiMetrics.highNbaCount}
            subtitle={
              kpiMetrics.urgentNbaCount + kpiMetrics.highNbaCount > 0
                ? `${kpiMetrics.urgentNbaCount} urgent · ${kpiMetrics.highNbaCount} high priority`
                : 'No urgent actions pending'
            }
            danger={kpiMetrics.urgentNbaCount > 0}
            warning={kpiMetrics.urgentNbaCount === 0 && kpiMetrics.highNbaCount > 0}
            neutral={kpiMetrics.urgentNbaCount + kpiMetrics.highNbaCount === 0}
            badge="NBA"
            icon={<TrendingUp size={18} />}
            onClick={() => setActiveInsight(activeInsight === 'nbaAction' ? null : 'nbaAction')}
            isActive={activeInsight === 'nbaAction'}
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
          <div className="flex flex-col gap-1.5">
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
            <button
              onClick={() => setShowSourceQualityDrawer(true)}
              className="text-right text-xs text-blue-500 hover:text-blue-700 font-medium px-1 transition-colors"
            >
              View source breakdown →
            </button>
          </div>

        </div>
      </div>

      {/* ── Saved Views Bar ───────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-8 py-3">
        <SavedViewsBar
          savedViews={savedViews}
          activeViewId={activeViewId}
          onSelectView={setActiveView}
          onNewView={can('leads.manage_views') ? () => openModal('createView') : undefined}
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
              {can('leads.manage_views') && (
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
              )}
            </div>
          )}

          {/* Status filter with simplified/detailed toggle */}
          <div className="flex items-start gap-4 flex-wrap">
            <div className="flex items-center gap-2 shrink-0 pt-0.5">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden text-xs">
                <button
                  onClick={() => setStatusViewMode('simplified')}
                  className={`px-2.5 py-1 font-medium transition-colors ${
                    statusViewMode === 'simplified' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Simple
                </button>
                <button
                  onClick={() => setStatusViewMode('detailed')}
                  className={`px-2.5 py-1 font-medium transition-colors border-l border-gray-200 ${
                    statusViewMode === 'detailed' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Detailed
                </button>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {statusViewMode === 'simplified' ? (
                [
                  { value: 'all',            label: 'All'         },
                  { value: '__incoming__',   label: 'New'         },
                  { value: '__in_progress__', label: 'In Progress' },
                  { value: '__qualified__',  label: 'Qualified'   },
                  { value: '__nurturing__',  label: 'Nurturing'   },
                  { value: '__closed__',     label: 'Closed'      },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setFilterStatus(value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      filterState.status === value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))
              ) : (
                [
                  'all', 'new', 'assigned', 'enriching', 'attempting_contact',
                  'engaged', 'qualified', 'sales_accepted', 'nurture',
                  'disqualified', 'converted', 'lost',
                ].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      filterState.status === status ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status === 'all' ? 'All' : getStatusLabel(status)}
                  </button>
                ))
              )}
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
              {/* Advanced filters button */}
              <button
                onClick={() => openModal('advancedFilters')}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                  hasActiveAdvancedFilter
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {hasActiveAdvancedFilter && (
                  <span className="ml-1 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {advancedFilter.groups.reduce((s, g) => s + g.conditions.length, 0)}
                  </span>
                )}
              </button>

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
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                    {(['smart', 'score', 'time', 'pipeline'] as const).map(group => {
                      const groupLabels: Record<string, string> = {
                        smart:    'Smart Rankings',
                        score:    'By Score',
                        time:     'By Time',
                        pipeline: 'By Pipeline',
                      };
                      const options = SORT_OPTIONS.filter(o => o.group === group);
                      return (
                        <div key={group}>
                          <div className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                            {groupLabels[group]}
                          </div>
                          {options.map(option => (
                            <button
                              key={option.mode}
                              onClick={() => { setSortBy(option.mode); closeModal(); }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                                sortBy === option.mode ? 'font-semibold text-blue-600 bg-blue-50' : ''
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      );
                    })}
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

      {/* ── Advanced filter chips ─────────────────────────────────────────── */}
      {hasActiveAdvancedFilter && (
        <div className="bg-white border-b border-gray-200 px-8 py-2">
          <FilterChipBar
            advancedFilter={advancedFilter}
            onRemoveCondition={handleRemoveCondition}
            onRemoveGroup={handleRemoveGroup}
            onClearAll={clearAdvancedFilter}
            onOpenDrawer={() => openModal('advancedFilters')}
          />
        </div>
      )}

      {/* ── Sort explainability ───────────────────────────────────────────── */}
      {sortExplanation && (
        <div className="px-8 pt-3">
          <p className="text-xs text-gray-400 italic">Sorted by: {sortExplanation}</p>
        </div>
      )}

      {/* ── LIST VIEW ─────────────────────────────────────────────────────── */}
      {viewMode === 'list' && (
        <div className="px-8 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="w-12 px-4 py-3">
                        <input
                          type="checkbox"
                          ref={el => {
                            if (!el) return;
                            const someSelected = paginatedLeads.some(l => selectedLeadIds.includes(l.id));
                            el.indeterminate = someSelected && !isPageFullySelected;
                            el.checked = isPageFullySelected;
                          }}
                          onChange={() => {
                            if (isPageFullySelected) {
                              clearSelection();
                            } else {
                              setSelection(paginatedLeads.map(l => l.id));
                            }
                          }}
                          aria-label={isPageFullySelected ? 'Deselect all on this page' : 'Select all on this page'}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300"
                        />
                      </th>
                      <th className="w-72 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Identity</th>
                      <th className="w-48 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qualification</th>
                      <th className="w-44 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engagement</th>
                      <th className="w-56 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Urgency</th>
                      <th className="w-44 px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedLeads.map(lead => (
                      <LeadTableRow
                        key={lead.id}
                        lead={lead}
                        isSelected={isSelected(lead.id)}
                        onToggleSelect={toggleLeadSelection}
                        onNavigate={id => setDrawerLeadId(id)}
                        onGoTo={navigate}
                        onOpenModal={(modal, l) => {
                          if (STUB_MODALS.has(modal)) {
                            showToast(`${STUB_LABELS[modal] ?? modal} — coming soon`, 'info');
                            return;
                          }
                          openModal(modal, l);
                        }}
                        onUpdateStatus={(id, status) => {
                          const target = contextLeads.find(l => l.id === id);
                          if (target) void actions.changeStatus(target, status);
                          else updateLead(id, { status });
                          showToast(`Lead marked as ${status}`, 'success');
                        }}
                        duplicateRisk={duplicateCandidateMap.get(lead.id)?.[0]?.risk}
                        isOverdue={overdueIdSet.has(lead.id)}
                        isUntouched={untouchedIdSet.has(lead.id)}
                        slaResult={leadSLAMap.get(lead.id)}
                        canConvert={can('leads.convert')}
                        canDelete={can('leads.delete')}
                      />
                    ))}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <div className="grid grid-cols-7 gap-3">
                {KANBAN_SWIM_LANES.map(lane => {
                  const laneLeads = sortedLeads.filter(l => lane.statuses.includes(l.status));
                  return (
                    <div key={lane.id} className="flex flex-col min-w-0">
                      <div className={`flex items-center justify-between px-2.5 py-2 rounded-t-lg border ${lane.headerColor}`}>
                        <span className="text-xs font-semibold truncate">{lane.label}</span>
                        <div className="flex items-center gap-1 ml-1 shrink-0">
                          {WIP_LIMITS[lane.id] != null && laneLeads.length > WIP_LIMITS[lane.id] && (
                            <span
                              className="text-[9px] font-bold bg-amber-400 text-white px-1 py-0.5 rounded leading-none"
                              title={`WIP limit exceeded (limit: ${WIP_LIMITS[lane.id]})`}
                            >
                              WIP
                            </span>
                          )}
                          <span className="text-xs font-bold bg-white bg-opacity-70 px-1.5 py-0.5 rounded-full">
                            {laneLeads.length}
                          </span>
                        </div>
                      </div>
                      <Droppable droppableId={lane.id}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`flex-1 min-h-[200px] p-2 rounded-b-lg border border-t-0 border-gray-200 transition-colors ${
                              snapshot.isDraggingOver ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'
                            }`}
                          >
                            {laneLeads.map((lead, index) => renderKanbanCard(lead, index))}
                            {provided.placeholder}
                            {laneLeads.length === 0 && !snapshot.isDraggingOver && (
                              <p className="text-xs text-gray-400 text-center py-6">
                                {canViewAllLeads ? 'Drop here' : 'None assigned to you'}
                              </p>
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
      {selectedLeadIds.length > 0 && can('leads.bulk_actions') && (
        <BulkActionBar
          selectedIds={selectedLeadIds}
          selectedLeads={selectedLeads}
          totalFiltered={sortedLeads.length}
          isPageFullySelected={isPageFullySelected}
          areAllFiltered={areAllFiltered}
          onSelectAllFiltered={selectAllLeads}
          onClearSelection={clearSelection}
          onChangeStatus={handleBulkChangeStatus}
          onSetFollowUp={handleBulkSetFollowUp}
          onExport={handleBulkExport}
          onConvert={handleBulkConvert}
          onArchive={handleBulkArchive}
          onDisqualify={handleBulkDisqualify}
          onOpenTerminalModal={setBulkTerminalAction}
          onDelete={handleBulkDelete}
          onToast={(msg, type) => showToast(msg, type)}
          canConvert={can('leads.convert')}
          canDelete={can('leads.delete')}
        />
      )}

      {/* Outreach Composer — opened from contactLead modal (row menu, drawer, NBA actions) */}
      {isModalOpen('contactLead') && activeLead && (
        <OutreachComposer
          lead={activeLead}
          onSubmit={(activity, followUp) => {
            if (followUp?.date) {
              void updateLead(activeLead.id, { next_follow_up_date: followUp.date });
            }
            const labels: Record<string, string> = {
              email: 'Email logged', call: 'Call logged', whatsapp: 'WhatsApp logged',
              meeting: 'Meeting logged', note: 'Note saved', task: 'Task created',
            };
            showToast(labels[activity.type] ?? 'Activity logged', 'success');
            closeModal();
          }}
          onClose={closeModal}
        />
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

      {/* Conversion Wizard */}
      {activeLead && (
        <LeadConversionWizard
          lead={activeLead}
          readiness={computeConversionReadiness(activeLead, computeMultiFactorScore(activeLead))}
          isOpen={isModalOpen('convertLead')}
          onClose={closeModal}
          onUpdateLead={async (id, updates) => {
            await updateLead(id, updates);
            if (updates.status === 'converted') {
              const targetType =
                updates.converted_to_contact_id && updates.converted_to_deal_id ? 'both'
                : updates.converted_to_deal_id    ? 'deal'
                : 'contact';
              actions.convert(activeLead, targetType, updates.converted_to_deal_id ?? updates.converted_to_contact_id);
            }
          }}
        />
      )}

      {/* ── Merge Review Modal ───────────────────────────────────────────── */}
      {isModalOpen('mergeDuplicate') && activeLead && (
        <MergeReviewModal
          lead={activeLead}
          candidateId={duplicateCandidateMap.get(activeLead.id)?.[0]?.leadId ?? ''}
          allLeads={contextLeads}
          candidates={duplicateCandidateMap.get(activeLead.id) ?? []}
          isOpen
          onClose={closeModal}
          onUpdateLead={updateLead}
          onShowToast={showToast}
          onMergeComplete={(absorbedId, absorbedName) =>
            actions.merge(activeLead, absorbedId, absorbedName)
          }
        />
      )}

      {/* ── Advanced Filter Drawer ────────────────────────────────────────── */}
      <AdvancedFilterDrawer
        open={isModalOpen('advancedFilters')}
        advancedFilter={advancedFilter}
        leads={contextLeads}
        onChange={setAdvancedFilter}
        onClose={closeModal}
      />

      {/* ── Kanban Qualify Gate ──────────────────────────────────────────── */}
      {kanbanModal === 'qualify' && pendingLead && (
        <KanbanQualifyModal
          lead={pendingLead}
          canOverride={can('leads.override_qualification_guard')}
          onConfirm={() => {
            void actions.changeStatus(pendingLead, 'qualified');
            setPendingDropLeadId(null);
            setKanbanModal(null);
            showToast(`${pendingLead.first_name || 'Lead'} moved to Qualifying`, 'success');
          }}
          onClose={() => { setPendingDropLeadId(null); setKanbanModal(null); }}
        />
      )}

      {/* ── Kanban Outcome Picker ─────────────────────────────────────────── */}
      {kanbanModal === 'outcome' && pendingLead && (
        <KanbanOutcomeModal
          lead={pendingLead}
          onSelect={outcome => {
            setKanbanModal(null);
            setPendingDropLeadId(null);
            if (outcome === 'converted')     openModal('convertLead',         pendingLead);
            else if (outcome === 'disqualified') openModal('terminalDisqualify', pendingLead);
            else                             openModal('terminalLost',         pendingLead);
          }}
          onClose={() => { setKanbanModal(null); setPendingDropLeadId(null); }}
        />
      )}

      {/* ── Source Quality Drawer ─────────────────────────────────────────── */}
      <SourceQualityDrawer
        open={showSourceQualityDrawer}
        data={sourceAnalytics}
        onClose={() => setShowSourceQualityDrawer(false)}
        onFilterSource={source => {
          setFilterSource(source);
          setShowSourceQualityDrawer(false);
        }}
      />

      {/* ── Quick Add Modal ───────────────────────────────────────────────── */}
      {quickAddOpen && (
        <QuickAddLeadModal
          onClose={() => setQuickAddOpen(false)}
          onSuccess={lead => {
            setQuickAddOpen(false);
            const name = lead.full_name || [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Lead';
            showToast(`${name} added`, 'success');
          }}
        />
      )}

      {/* ── Lead quick drawer ─────────────────────────────────────────────── */}
      {drawerLead && (
        <LeadQuickDrawer
          lead={drawerLead}
          slaResult={leadSLAMap.get(drawerLead.id) ?? HEALTHY_SLA_RESULT}
          hasPrev={drawerIdx > 0}
          hasNext={drawerIdx < sortedLeads.length - 1}
          isDuplicateRisk={duplicateCandidateMap.has(drawerLead.id)}
          isOverdue={overdueIdSet.has(drawerLead.id)}
          isUntouched={untouchedIdSet.has(drawerLead.id)}
          onClose={() => setDrawerLeadId(null)}
          onGoTo={navigate}
          onPrevLead={() => {
            if (drawerIdx > 0) setDrawerLeadId(sortedLeads[drawerIdx - 1].id);
          }}
          onNextLead={() => {
            if (drawerIdx < sortedLeads.length - 1) setDrawerLeadId(sortedLeads[drawerIdx + 1].id);
          }}
          onOpenModal={(modal, l) => {
            if (STUB_MODALS.has(modal)) {
              showToast(`${STUB_LABELS[modal] ?? modal} — coming soon`, 'info');
              return;
            }
            openModal(modal, l);
          }}
          onUpdateStatus={(id, status) => {
            updateLead(id, { status });
            showToast(`Lead marked as ${status}`, 'success');
          }}
        />
      )}
    </div>
  );
};

export default LeadsPage;
