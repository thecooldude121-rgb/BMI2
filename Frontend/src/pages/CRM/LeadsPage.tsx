import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Upload, Search, ChevronDown, CheckCircle, Info, UserPlus, Link as LinkIcon, X, BookmarkCheck, Clock, AlertTriangle, UserX, TrendingUp, Copy, BarChart2, SlidersHorizontal } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { useLeads } from '../../contexts/LeadContext';
import { useLeadsPageState, migrateLegacyStatus, SERVER_SORTS, PAGE_SIZE } from '../../hooks/useLeadsPageState';
import { usePermissions } from '../../hooks/usePermissions';
import { SORT_OPTIONS } from '../../utils/leadSorting';
import { Button } from '../../components/ui/Button';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import SavedViewsBar from '../../components/Leads/SavedViewsBar';
import SavedViewModal from '../../components/Leads/SavedViewModal';
import KpiCard from '../../components/Leads/KpiCard';
import LeadsPager from '../../components/Leads/LeadsPager';
import EmptyState from '../../components/ui/EmptyState';
import Alert from '../../components/ui/Alert';
import { selectClass } from '../../components/ui/Field';
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
import LeadSelectedPanel from '../../components/Leads/LeadSelectedPanel';
import OutreachComposer from '../../components/Leads/OutreachComposer';
import { useLeadActions } from '../../hooks/useLeadActions';
import { useLogLeadActivity, LOGGED_LABEL } from '../../hooks/useLogLeadActivity';
import { HEALTHY_SLA_RESULT } from '../../utils/leadSla';
import type { TerminalAction } from '../../utils/leadReasons';
import { computeConversionReadiness } from '../../utils/conversionReadiness';
import { computeMultiFactorScore } from '../../utils/leadScoring/multiFactorScore';
import type { AdvancedFilter, FilterGroup } from '../../types/leadFilter';
import type { Lead } from '../../types/lead';
import type { ModalId } from '../../hooks/useLeadsPageState';
import { LeadStageError } from '../../utils/leadsApi';
import { useKanbanLanes } from '../../hooks/useKanbanLanes';
import { toCsv } from '../../utils/csv';
import { createLeadFollowUp } from '../../utils/leadFollowUp';

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

// Figma: one indigo pill for working stages; green / amber / red only where
// the stage itself says so. (The score is shown as "N stored" — no verdict colour.)
const getStatusBadge = (status: string) => {
  const brand = 'bg-brand-50 text-brand-600';
  const colors: Record<string, string> = {
    new: brand, assigned: brand, enriching: brand, attempting_contact: brand, engaged: brand,
    qualified: 'bg-success-100 text-success-700', sales_accepted: 'bg-success-100 text-success-700',
    converted: 'bg-success-100 text-success-700', nurture: 'bg-warning-100 text-warning-700',
    lost: 'bg-danger-100 text-danger-700', disqualified: 'bg-surface-sunken text-ink-secondary',
  };
  return colors[status] || 'bg-surface-sunken text-ink-secondary';
};

const getStatusLabel = (status: string) =>
  status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

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
    case 'green': return 'bg-success-700 text-white hover:bg-success-800';
    case 'red':   return 'bg-danger-700 text-white hover:bg-danger-800';
    case 'amber': return 'bg-warning-700 text-white hover:bg-warning-800';
    case 'blue':  return 'bg-brand-600 text-white hover:bg-brand-700';
    default:      return 'bg-surface-sunken text-ink hover:bg-black/5';
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
  { id: 'incoming',   label: 'Incoming',   statuses: ['new', 'assigned'],                    dropTarget: 'new',               headerColor: 'bg-surface-sunken text-ink border-line' },
  { id: 'research',   label: 'Research',   statuses: ['enriching'],                           dropTarget: 'enriching',          headerColor: 'bg-surface-sunken text-ink border-line' },
  { id: 'outreach',   label: 'Outreach',   statuses: ['attempting_contact'],                  dropTarget: 'attempting_contact', headerColor: 'bg-surface-sunken text-ink border-line' },
  { id: 'engaged',    label: 'Engaged',    statuses: ['engaged'],                             dropTarget: 'engaged',            headerColor: 'bg-surface-sunken text-ink border-line' },
  { id: 'qualifying', label: 'Qualifying', statuses: ['qualified', 'sales_accepted'],         dropTarget: 'qualified',          headerColor: 'bg-surface-sunken text-ink border-line' },
  { id: 'nurturing',  label: 'Nurturing',  statuses: ['nurture'],                             dropTarget: 'nurture',            headerColor: 'bg-surface-sunken text-ink border-line' },
  { id: 'closed',     label: 'Closed',     statuses: ['converted', 'disqualified', 'lost'],  dropTarget: 'lost',               headerColor: 'bg-surface-sunken text-ink border-line' },
];

// ── Component ─────────────────────────────────────────────────────────────────

const LeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const { updateLead, transitionLead, deleteLead, updateView: ctxUpdateView, lastWriteErrorRef, writeVersion, notifyWrite } = useLeads();
  const actions = useLeadActions(updateLead);
  const logActivity = useLogLeadActivity();

  const { can } = usePermissions();

  const {
    viewMode, setViewMode,
    searchQuery, setSearchQuery,
    sortBy, setSortBy, sortLabel, sortExplanation,
    page, pageCount, setPage,
    filterState, setFilterStatus, setFilterSource, setFilterScore,
    selectedLeadIds, toggleLeadSelection, selectAllLeads, setSelection, clearSelection, isSelected,
    activeLead,
    activeModal, openModal, closeModal, isModalOpen,
    toast, showToast, clearToast,
    sortedLeads,
    paginatedLeads,
    listTotal, listLoading, listError, listUnavailableReason, serverQuery, summary,
    // Insight selectors
    overdueLeads, duplicateCandidateMap, untouchedLeads,
    leadSLAMap, nbaQueue, sourceQualityThisWeek,
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

  // ── Server-side Kanban lanes + the rows this page actually holds (step 5) ──
  const kanban = useKanbanLanes(KANBAN_SWIM_LANES, serverQuery, viewMode === 'kanban' && !listUnavailableReason, writeVersion);
  const kanbanLaneLeads = React.useMemo(() => Object.fromEntries(
    Object.entries(kanban.lanes).map(([id, lane]) => [id, lane.leads.map(migrateLegacyStatus)]),
  ) as Record<string, Lead[]>, [kanban.lanes]);
  /**
   * Every lead the page has loaded (list pages + Kanban lanes). Lookups that used
   * LeadContext's own list — capped at the API's default 50 — now use this, so a
   * lead past row 50 can be opened, dragged, selected and exported.
   */
  const pageLeads = React.useMemo(() => {
    const m = new Map<string, Lead>();
    for (const l of sortedLeads) m.set(l.id, l);
    for (const rows of Object.values(kanbanLaneLeads)) for (const l of rows) if (!m.has(l.id)) m.set(l.id, l);
    return [...m.values()];
  }, [sortedLeads, kanbanLaneLeads]);
  const initialLoading = listLoading && sortedLeads.length === 0;

  // ── Source quality drawer ─────────────────────────────────────────────────
  const [showSourceQualityDrawer, setShowSourceQualityDrawer] = useState(false);

  // ── Terminal status modal (disqualify / lost) ─────────────────────────────
  const [bulkTerminalAction, setBulkTerminalAction] = useState<TerminalAction | null>(null);

  // ── Quick drawer ──────────────────────────────────────────────────────────
  const [drawerLeadId, setDrawerLeadId] = useState<string | null>(null);
  const drawerLead = drawerLeadId ? pageLeads.find(l => l.id === drawerLeadId) ?? null : null;
  const drawerIdx  = drawerLeadId ? sortedLeads.findIndex(l => l.id === drawerLeadId) : -1;

  // ── Kanban workflow state ─────────────────────────────────────────────────
  const [pendingDropLeadId, setPendingDropLeadId] = useState<string | null>(null);
  const [kanbanModal,       setKanbanModal]       = useState<'qualify' | 'outcome' | null>(null);
  const pendingLead = pendingDropLeadId
    ? (pageLeads.find(l => l.id === pendingDropLeadId) ?? null)
    : null;

  // ── KPI helpers ───────────────────────────────────────────────────────────

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
    () => pageLeads.filter(l => selectedLeadIds.includes(l.id)),
    [pageLeads, selectedLeadIds],
  );

  // ── Handlers ─────────────────────────────────────────────────────────────

  // ── Single-lead modal actions (triggered from row ⋯ menu) ─────────────────

  // Awaits the server. It used to fire the delete and toast "Lead deleted"
  // whatever came back — a sales user's 403 read as a success.
  const handleSingleDelete = async () => {
    if (!activeLead) return;
    const ok = await deleteLead(activeLead.id);
    closeModal();
    if (ok) showToast('Lead deleted', 'success');
    else showToast(lastWriteErrorRef.current || 'The lead was not deleted.', 'error');
  };

  const handleSingleArchive = () => {
    // Now handled by TerminalStatusModal via the 'terminalLost' modal ID
  };

  // ── Bulk action handlers (delegated from BulkActionBar) ───────────────────

  /**
   * Runs one write per lead, AWAITS all of them, and reports what the server
   * actually did. These used to fire-and-forget and toast success for every
   * selected lead — and since step 5 a stage move can be refused (the
   * qualification gate), so "N leads moved" was not even a likely truth.
   */
  const runBulk = async (ids: string[], write: (id: string) => Promise<boolean>, done: string) => {
    const results = await Promise.all(ids.map(write));
    const ok = results.filter(Boolean).length;
    const failed = ids.length - ok;
    const plural = (n: number) => `${n} lead${n !== 1 ? 's' : ''}`;
    if (failed === 0) showToast(`${plural(ok)} ${done}`, 'success');
    else if (ok === 0) showToast(`No leads ${done} — the server refused all ${ids.length}.`, 'error');
    else showToast(`${plural(ok)} ${done}; ${failed} refused by the server.`, 'info');
  };

  /**
   * A single stage move, with the server's verdict shown either way. Since
   * step 5 the server can refuse a move (the qualification gate, a converted
   * lead) and a silent snap-back reads as a glitch, not a rule.
   */
  const moveLead = async (id: string, status: Lead['status'], successMsg?: string) => {
    const target = pageLeads.find(l => l.id === id);
    const ok = target ? await actions.changeStatus(target, status) : await updateLead(id, { status });
    if (ok) { if (successMsg) showToast(successMsg, 'success'); }
    else showToast(lastWriteErrorRef.current || 'The server refused the move.', 'error');
  };

  const handleBulkChangeStatus = (status: Lead['status']) => {
    const ids = [...selectedLeadIds];
    clearSelection();
    void runBulk(ids, id => updateLead(id, { status }), `moved to ${status}`);
  };

  // Real since Group B item 11: one follow-up TASK per selected lead, each
  // awaited; runBulk reports what the server did. (It used to write a column
  // that did not exist and say "Follow-up set for N leads".)
  const handleBulkSetFollowUp = (date: string, type: FollowUpType) => {
    const ids = [...selectedLeadIds];
    clearSelection();
    void runBulk(ids, async id => {
      const l = pageLeads.find(x => x.id === id);
      const name = l ? [l.first_name, l.last_name].filter(Boolean).join(' ') || 'lead' : 'lead';
      try { await createLeadFollowUp(id, date, `Follow up (${type}) with ${name}`); return true; }
      catch { return false; }
    }, `given a follow-up`).then(() => notifyWrite());
  };

  const handleBulkExport = () => {
    // RFC 4180 via utils/csv (the contacts export's tested builder). This used to
    // join cells with bare commas, so "Acme, Inc" split into two columns and a
    // quote broke the row — a corrupted file under an "exported" success toast.
    const csvContent = toCsv(
      ['Name', 'Company', 'Email', 'Phone', 'Status', 'Score'],
      selectedLeads.map(l => [
        getLeadName(l), l.company || '', l.email || '', l.phone || '',
        l.status, String(getLeadScore(l)),
      ]),
    );
    const url = window.URL.createObjectURL(new Blob([csvContent], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads-export.csv';
    a.click();
    showToast(`${selectedLeads.length} lead${selectedLeads.length !== 1 ? 's' : ''} exported`, 'success');
    // Intentionally do NOT clear selection — user may want to take another action
  };

  const handleBulkConvert = (_ids: string[]) => {
    // Was: a stage write per lead and "N leads converted" — no contact, account
    // or deal was ever created. Real conversion (step 5, slice B) creates those
    // records through POST /leads/:id/convert; until then this says so.
    showToast('Converting leads in bulk is not available yet — nothing was converted.', 'info');
  };

  const handleBulkArchive = () => setBulkTerminalAction('lost');

  const handleBulkDisqualify = () => setBulkTerminalAction('disqualified');

  const handleTerminalConfirm = (reason: string, notes: string) => {
    if (bulkTerminalAction !== null) {
      const status = bulkTerminalAction;
      const extra = status === 'disqualified'
        ? { disqualified_reason: reason, disqualified_reason_notes: notes || undefined }
        : { lost_reason: reason, lost_reason_notes: notes || undefined };
      // The reason now travels as the stage transition's recorded reason.
      const ids = [...selectedLeadIds];
      clearSelection();
      void runBulk(ids, id => updateLead(id, { status, ...extra } as Partial<Lead>), `marked ${status}`);
      setBulkTerminalAction(null);
    } else if (activeLead) {
      // Checks the write: it used to toast "Lead marked as …" either way.
      const isSingleDisqualify = isModalOpen('terminalDisqualify');
      const notesOrUndefined = notes || undefined;
      const lead = activeLead;
      void (async () => {
        const ok = isSingleDisqualify
          ? await actions.disqualify(lead, reason, notesOrUndefined)
          : await actions.markLost(lead, reason, notesOrUndefined);
        if (ok) {
          showToast(`Lead marked as ${isSingleDisqualify ? 'disqualified' : 'lost'}`, 'success');
          closeModal();
        } else {
          showToast(lastWriteErrorRef.current || 'The server refused this — nothing was saved.', 'error');
        }
      })();
    }
  };

  // Awaits every delete and reports what the server did (runBulk). It used to
  // fire them all and toast "N leads deleted" whatever came back.
  const handleBulkDelete = () => {
    const ids = [...selectedLeadIds];
    clearSelection();
    void runBulk(ids, id => deleteLead(id), 'deleted');
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
    if (lane) void moveLead(draggableId, lane.dropTarget);
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
      signals.push({ cls: 'text-warning-700', icon: <Clock size={9} />, title: 'Overdue' });
    if (slaResult?.overall === 'breached')
      signals.push({ cls: 'text-danger-700', icon: <AlertTriangle size={9} />, title: 'SLA breach' });
    if (duplicateCandidateMap.has(lead.id))
      signals.push({ cls: 'text-warning-700', icon: <Copy size={9} />, title: 'Duplicate risk' });
    if (nbaPri === 'urgent' || nbaPri === 'high')
      signals.push({
        cls:   nbaPri === 'urgent' ? 'text-danger-700' : 'text-warning-700',
        icon:  <TrendingUp size={9} />,
        title: `${nbaPri} priority`,
      });
    const shownSigs = signals.slice(0, 3);
    const overflow  = Math.max(0, signals.length - 3);

    const ageColor =
      ageDays < 7  ? 'bg-surface-sunken text-ink-secondary' :
      ageDays < 21 ? 'bg-warning-100 text-warning-700' :
                     'bg-danger-100 text-danger-700';

    return (
      <Draggable key={lead.id} draggableId={lead.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`bg-surface-panel rounded-card border p-3 mb-2 cursor-grab transition-shadow ${
              snapshot.isDragging
                ? 'shadow-lg border-brand-600'
                : 'border-line hover:shadow-md'
            }`}
            onClick={() => setDrawerLeadId(lead.id)}
          >
            {/* Name + score */}
            <div className="flex items-start justify-between gap-1.5 mb-1">
              <p className="text-sm font-semibold text-ink truncate flex-1 min-w-0 leading-tight">
                {getLeadName(lead)}
              </p>
              <span className="shrink-0 text-xs text-ink-muted" title="Stored score">{score} stored</span>
            </div>

            {/* Company + status badge */}
            <div className="flex items-center justify-between gap-1 mb-2.5">
              <p className="text-xs text-brand-600 truncate flex-1 min-w-0">{lead.company || '—'}</p>
              <span className={`shrink-0 text-xs font-semibold px-1.5 py-0.5 rounded-full ${getStatusBadge(lead.status)}`}>
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
                  <span className="text-xs font-bold text-ink-muted">+{overflow}</span>
                )}
              </div>
              <span
                className={`text-xs font-semibold px-1.5 py-0.5 rounded ${ageColor}`}
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
        className={`relative bg-surface-panel rounded-card border flex flex-col cursor-pointer transition-all duration-150 hover:shadow-md ${
          selected
            ? 'ring-2 ring-brand-600 border-transparent'
            : 'border-line'
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
              className="h-4 w-4 rounded border-line text-brand-600 cursor-pointer focus:ring-brand-600"
              aria-label={`Select ${getLeadName(lead)}`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink truncate leading-tight">{getLeadName(lead)}</p>
            <p className="text-xs text-brand-600 truncate">{lead.company || '—'}</p>
          </div>
          <span className="shrink-0 text-xs text-ink-muted" title="Stored score">{score} stored</span>
        </div>

        {/* ── Identity sub-row: title + source ─────────────────────────── */}
        <div className="px-4 pb-3 flex items-center justify-between gap-2">
          <span className="text-xs text-ink-muted truncate">{lead.position || 'No title'}</span>
          <span className="text-xs text-ink-muted shrink-0">{lead.source || '—'}</span>
        </div>

        {/* ── Urgency strip (rendered only when flags exist) ────────────── */}
        {hasUrgency && (
          <div className="px-4 pb-3 flex flex-wrap gap-1">
            {isOver && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-warning-100 text-warning-700">
                <Clock size={9} />Overdue
              </span>
            )}
            {hasSLABreach && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-danger-100 text-danger-700">
                <AlertTriangle size={9} />SLA breach
              </span>
            )}
            {isDuplicate && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-warning-100 text-warning-700">
                <Copy size={9} />Dup risk
              </span>
            )}
            {nbaPri === 'urgent' && !isOver && !hasSLABreach && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-danger-100 text-danger-700">
                Urgent
              </span>
            )}
            {nbaPri === 'high' && !isOver && !hasSLABreach && !isDuplicate && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-warning-100 text-warning-700">
                High priority
              </span>
            )}
          </div>
        )}

        {/* ── Divider ──────────────────────────────────────────────────── */}
        <div className="mx-4 border-t border-line" />

        {/* ── State row: status badge + last contact recency ───────────── */}
        <div className="px-4 py-2.5 flex items-center justify-between gap-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full truncate max-w-[120px] ${getStatusBadge(lead.status)}`}>
            {getStatusLabel(lead.status)}
          </span>
          <span className={`text-xs shrink-0 tabular-nums ${recency === 'Never' ? 'text-warning-700 font-medium' : 'text-ink-muted'}`}>
            {recency === 'Never' ? 'Never contacted' : recency}
          </span>
        </div>

        {/* ── Primary CTA ──────────────────────────────────────────────── */}
        <div className="px-3 pb-3 mt-auto">
          <button
            disabled={cta.blocked}
            title={cta.blocked ? 'Not available for your role' : undefined}
            className={`w-full py-1.5 text-xs font-semibold rounded-ctrl transition-colors ${
              cta.blocked
                ? 'bg-surface-sunken text-ink-muted cursor-not-allowed'
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
    <div className="mx-auto flex max-w-[1240px] flex-col gap-4 pt-6 pb-8">

      {/* Toast */}
      {toast && (
        // The icon follows the message: it used to be a green check for EVERY
        // toast, so a server refusal read as a success at a glance.
        <div role={toast.type === 'error' ? 'alert' : 'status'} className="fixed top-4 right-4 z-[60] bg-ink text-white px-4 py-3 rounded-card shadow-lg flex items-center space-x-2">
          {toast.type === 'error'
            ? <AlertTriangle className="h-4 w-4 text-danger-100 flex-shrink-0" aria-hidden="true" />
            : toast.type === 'success'
              ? <CheckCircle className="h-4 w-4 text-success-100 flex-shrink-0" aria-hidden="true" />
              : <Info className="h-4 w-4 text-brand-100 flex-shrink-0" aria-hidden="true" />}
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

      {/* Header (Figma "Leads header" 61:65) */}
      <header className="flex flex-col gap-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-[32px] font-bold leading-10 text-ink">Leads</h1>
            <p className="text-sm leading-[22px] text-ink-muted">Manage and qualify incoming leads.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => navigate('/crm/leads/integrations')} leadingIcon={<LinkIcon className="h-3.5 w-3.5" />}>Integrations</Button>
            <Button variant="secondary" onClick={() => navigate('/crm/leads/import')} leadingIcon={<Upload className="h-3.5 w-3.5" />}>Import</Button>
            {/* Split button: Quick Add + a menu for Full Form / Import CSV */}
            <div ref={addMenuRef} className="relative flex">
              <Button onClick={() => setQuickAddOpen(true)} leadingIcon={<Plus className="h-3.5 w-3.5" />} className="rounded-r-none">
                Quick Add
              </Button>
              <Button
                iconOnly
                aria-label="More lead creation options"
                aria-expanded={addMenuOpen}
                aria-haspopup="menu"
                onClick={() => setAddMenuOpen(o => !o)}
                leadingIcon={<ChevronDown className="h-3.5 w-3.5" />}
                className="rounded-l-none border-l border-l-brand-700"
              />
              {addMenuOpen && (
                <div role="menu" className="absolute right-0 top-full z-30 mt-1 w-44 rounded-card border border-line bg-surface-panel py-1 shadow-lg">
                  <button role="menuitem" onClick={() => { setAddMenuOpen(false); navigate('/crm/leads/new'); }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-ink hover:bg-black/5">
                    <UserPlus className="h-4 w-4 text-ink-muted" /> Full Form
                  </button>
                  <button role="menuitem" onClick={() => { setAddMenuOpen(false); navigate('/crm/leads/import'); }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-ink hover:bg-black/5">
                    <Upload className="h-4 w-4 text-ink-muted" /> Import CSV
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Quick Add options row (Figma) — the same two real routes, one click away */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-brand-50 px-2 py-[3px] text-xs font-semibold text-brand-600">Quick Add options</span>
          <Button variant="secondary" size="sm" onClick={() => navigate('/crm/leads/new')}>Full Form</Button>
          <Button variant="secondary" size="sm" onClick={() => navigate('/crm/leads/import')}>Import CSV</Button>
        </div>
      </header>

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {/* 1 — Overdue Follow-ups */}
          {/* Real since Group B item 11: leads with an open follow-up task due
              before today, counted over ALL leads by GET /leads/summary; the
              click filters to exactly those (insight=overdue). */}
          <KpiCard
            title="Overdue Follow-ups"
            value={summary?.overdue_follow_ups ?? 0}
            subtitle={(summary?.overdue_follow_ups ?? 0) > 0
              ? `${summary?.overdue_follow_ups} lead${summary?.overdue_follow_ups === 1 ? '' : 's'} past a follow-up date`
              : 'No follow-up is past its date'}
            danger={(summary?.overdue_follow_ups ?? 0) > 0}
            neutral={(summary?.overdue_follow_ups ?? 0) === 0}
            icon={<Clock size={18} />}
            onClick={() => setActiveInsight(activeInsight === 'overdue' ? null : 'overdue')}
            isActive={activeInsight === 'overdue'}
          />

          {/* 2 — SLA Breached */}
          <KpiCard
            title="SLA Breached"
            value="—"
            comingSoon="Counting SLA breaches needs every lead; it is moving to the server. Each row still shows its own SLA."
            icon={<AlertTriangle size={18} />}
          />

          {/* 3 — New Unworked */}
          <KpiCard
            title="New Unworked"
            value={(summary?.new_unworked ?? 0)}
            subtitle={
              (summary?.new_unworked ?? 0) > 0
                ? `${(summary?.new_unworked ?? 0)} leads with no contact logged`
                : 'All new leads have been touched'
            }
            delta={newUnworkedDelta}
            deltaLabel="vs last week"
            warning={(summary?.new_unworked ?? 0) > 5 && (summary?.new_unworked ?? 0) <= 20}
            danger={(summary?.new_unworked ?? 0) > 20}
            neutral={(summary?.new_unworked ?? 0) === 0}
            icon={<UserX size={18} />}
            onClick={() => setActiveInsight(activeInsight === 'untouched' ? null : 'untouched')}
            isActive={activeInsight === 'untouched'}
          />

          {/* 4 — Action Required (NBA) */}
          <KpiCard
            title="Action Required"
            value="—"
            comingSoon="The next-best-action queue ranks every lead against the others; it is moving to the server."
            icon={<TrendingUp size={18} />}
          />

          {/* 5 — Duplicate Risk */}
          <KpiCard
            title="Duplicate Risk"
            value="—"
            comingSoon="Duplicate detection compares every lead with every other; it is moving to the server."
            icon={<Copy size={18} />}
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
            {/* The breakdown scores sources on duplicate and SLA rates, which need
                every lead — "Coming soon" until they move to the server (step 5 B). */}
            <button
              type="button"
              disabled
              title="Coming soon"
              className="text-right text-xs text-ink-muted font-medium px-1 cursor-not-allowed"
            >
              Source breakdown — coming soon
            </button>
          </div>

        </div>
      </div>

      {/* ── Saved Views Bar ───────────────────────────────────────────────── */}
      <div className="rounded-card border border-line bg-surface-panel px-3 py-2">
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

      {/* Filter & Search panel (Figma 61:126 controls) */}
      <div className="rounded-card border border-line bg-surface-panel p-3">
        <div className="space-y-3">
          {/* Active view pill + save controls */}
          {activeViewId && (
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-ink-muted">Viewing:</span>
                <span className="flex items-center space-x-1.5 px-2.5 py-1 bg-brand-50 text-brand-700 rounded-full text-xs font-semibold">
                  <BookmarkCheck className="h-3.5 w-3.5" />
                  <span>{activeViewLabel}</span>
                  <button
                    onClick={clearActiveView}
                    className="ml-1 hover:text-brand-900 opacity-60 hover:opacity-100"
                    aria-label="Clear active view"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              </div>
              {can('leads.manage_views') && (
                <div className="flex items-center space-x-2">
                  {isUserViewActive && (
                    <Button onClick={updateActiveView} size="sm" className="font-semibold">
                      Update {activeViewLabel}
                    </Button>
                  )}
                  <button
                    onClick={() => openModal('createView')}
                    className="px-3 py-1.5 border border-line bg-surface-panel rounded-ctrl text-xs font-medium hover:bg-surface-subtle text-ink"
                  >
                    Save as new view
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Status (Simple / Detailed vocabulary), source and score — the same
              filter values the chip rows sent, as the frame's dropdowns. */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-ctrl bg-surface-sunken p-0.5 text-xs" role="group" aria-label="Status vocabulary">
              {(['simplified', 'detailed'] as const).map(m => (
                <button key={m} type="button" onClick={() => setStatusViewMode(m)} aria-pressed={statusViewMode === m}
                  className={`rounded-ctrl px-2.5 py-1 font-semibold transition-colors ${
                    statusViewMode === m ? 'bg-surface-panel text-brand-600 shadow-sm' : 'text-ink-secondary hover:text-ink'}`}>
                  {m === 'simplified' ? 'Simple' : 'Detailed'}
                </button>
              ))}
            </div>
            <select aria-label="Status" value={filterState.status} onChange={e => setFilterStatus(e.target.value)} className={`${selectClass()} w-auto`}>
              {(statusViewMode === 'simplified'
                ? [
                    { value: 'all', label: 'All' }, { value: '__incoming__', label: 'New' },
                    { value: '__in_progress__', label: 'In Progress' }, { value: '__qualified__', label: 'Qualified' },
                    { value: '__nurturing__', label: 'Nurturing' }, { value: '__closed__', label: 'Closed' },
                  ]
                : ['all', 'new', 'assigned', 'enriching', 'attempting_contact', 'engaged', 'qualified',
                   'sales_accepted', 'nurture', 'disqualified', 'converted', 'lost']
                    .map(v => ({ value: v, label: v === 'all' ? 'All' : getStatusLabel(v) }))
              ).map(o => <option key={o.value} value={o.value}>Status: {o.label}</option>)}
            </select>
            <select aria-label="Source" value={filterState.source} onChange={e => setFilterSource(e.target.value)} className={`${selectClass()} w-auto`}>
              {['all', 'Lead Gen', 'HRMS', 'Manual', 'Website'].map(src => (
                <option key={src} value={src}>Source: {src === 'all' ? 'All' : src}</option>
              ))}
            </select>
            <select aria-label="Score" value={filterState.score} onChange={e => setFilterScore(e.target.value)} className={`${selectClass()} w-auto`}>
              {[
                { value: 'all', label: 'Any' }, { value: '80-100', label: '80–100' },
                { value: '60-79', label: '60–79' }, { value: 'below-60', label: 'Below 60' },
              ].map(o => <option key={o.value} value={o.value}>Score: {o.label}</option>)}
            </select>
            <Button
              variant="secondary"
              onClick={() => openModal('advancedFilters')}
              leadingIcon={<SlidersHorizontal className="h-3.5 w-3.5" />}
              className={hasActiveAdvancedFilter ? 'border-brand-600 text-brand-700' : ''}
            >
              Advanced filters
              {hasActiveAdvancedFilter && (
                <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                  {advancedFilter.groups.reduce((s, g) => s + g.conditions.length, 0)}
                </span>
              )}
            </Button>
          </div>

          {/* Search + sort + view toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[240px] flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
              <input
                type="text"
                aria-label="Search leads"
                placeholder="Search name, company or email"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-ctrl border border-line bg-surface-panel pl-8 pr-3 text-sm text-ink placeholder:text-ink-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30"
              />
            </div>
            <div className="flex items-center gap-2">
              {/* Sort dropdown */}
              <div className="relative">
                <Button variant="secondary" onClick={() => isModalOpen('sortDropdown') ? closeModal() : openModal('sortDropdown')}
                  aria-expanded={isModalOpen('sortDropdown')} trailingIcon={<ChevronDown className="h-3.5 w-3.5" />}>
                  Sort: {sortLabel}
                </Button>
                {isModalOpen('sortDropdown') && (
                  <div className="absolute right-0 top-full z-20 mt-1 w-64 rounded-card border border-line bg-surface-panel py-1 shadow-lg">
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
                          <div className="px-3 pt-2 pb-1 text-xs font-semibold uppercase text-ink-secondary">
                            {groupLabels[group]}
                          </div>
                          {options.map(option => (
                            SERVER_SORTS.has(option.mode) ? (
                            <button
                              key={option.mode}
                              onClick={() => { setSortBy(option.mode); closeModal(); }}
                              className={`w-full px-4 py-2 text-left text-sm text-ink hover:bg-black/5 ${
                                sortBy === option.mode ? 'bg-brand-50 font-semibold text-brand-600' : ''
                              }`}
                            >
                              {option.label}
                            </button>
                            ) : (
                            // Ranks on scores computed per lead in the browser (or SLA /
                            // duplicate risk) — "Coming soon" until the server computes them.
                            <button
                              key={option.mode}
                              type="button"
                              disabled
                              title="Coming soon"
                              className="w-full cursor-not-allowed px-4 py-2 text-left text-sm text-ink-muted"
                            >
                              {option.label} <span className="text-xs">· coming soon</span>
                            </button>
                            )
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* View mode toggle — each one gates the render below */}
              <div className="flex items-center rounded-ctrl bg-surface-sunken p-0.5 text-xs" role="group" aria-label="View">
                {(['list', 'grid', 'kanban'] as const).map(mode => (
                  <button key={mode} type="button" onClick={() => setViewMode(mode)} aria-pressed={viewMode === mode}
                    className={`rounded-ctrl px-2.5 py-1.5 font-semibold capitalize transition-colors ${
                      viewMode === mode ? 'bg-surface-panel text-brand-600 shadow-sm' : 'text-ink-secondary hover:text-ink'}`}>
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Advanced filter chips ─────────────────────────────────────────── */}
      {hasActiveAdvancedFilter && (
        <div className="rounded-card border border-line bg-surface-panel px-3 py-2">
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
        <p className="text-xs text-ink-muted">Sorted by: {sortExplanation}</p>
      )}

      {/* ── Why the list is empty, when it is not "no matches" (step 5) ─────── */}
      {(listUnavailableReason || listError) && (
        listError
          ? <Alert tone="danger" title="The server could not apply these filters">{listError}</Alert>
          : <Alert tone="info" title="This list is not available">{listUnavailableReason}</Alert>
      )}

      {/* ── BULK ACTIONS BAR — inline above the results (Figma 61:157) ── */}
      {selectedLeadIds.length > 0 && can('leads.bulk_actions') && (
        <BulkActionBar
          selectedIds={selectedLeadIds}
          selectedLeads={selectedLeads}
          totalFiltered={listTotal}
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

      {/* Results + the docked "Selected lead" panel (Figma 61:328) */}
      <div className={drawerLead ? 'grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_400px]' : ''}>
        <div className="min-w-0">
      {/* ── LIST VIEW ─────────────────────────────────────────────────────── */}
      {viewMode === 'list' && (
        <div>
          {initialLoading ? (
            <p className="py-16 text-center text-sm text-ink-muted" role="status">Loading leads…</p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-card border border-line bg-surface-panel">
                <table className="min-w-full">
                  <thead className="border-b border-line bg-surface-sunken">
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
                          className="h-4 w-4 text-brand-600 rounded border-line"
                        />
                      </th>
                      <th className="w-72 px-4 py-2.5 text-left text-xs font-semibold uppercase text-ink-secondary">Identity</th>
                      <th className="w-48 px-4 py-2.5 text-left text-xs font-semibold uppercase text-ink-secondary">Qualification</th>
                      <th className="w-44 px-4 py-2.5 text-left text-xs font-semibold uppercase text-ink-secondary">Engagement</th>
                      <th className="w-56 px-4 py-2.5 text-left text-xs font-semibold uppercase text-ink-secondary">Urgency</th>
                      <th className="w-44 px-4 py-2.5 text-right text-xs font-semibold uppercase text-ink-secondary">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
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
                        onUpdateStatus={(id, status) => { void moveLead(id, status, `Lead marked as ${status}`); }}
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

                {sortedLeads.length === 0 && !listError && !listUnavailableReason && (
                  <div className="p-4">
                    <EmptyState title="No leads match" reason="Nothing in this workspace matches these filters. Clear a filter, or add a lead."
                      action={<Button onClick={() => setQuickAddOpen(true)} leadingIcon={<Plus className="h-3.5 w-3.5" />}>Quick Add</Button>} />
                  </div>
                )}
                {/* Numbered pages over the SERVER's total (step 5 slice A). */}
                <LeadsPager page={page} pageCount={pageCount} total={listTotal} pageSize={PAGE_SIZE}
                  shown={sortedLeads.length} loading={listLoading} onPage={setPage} />
              </div>
            </>
          )}
        </div>
      )}

      {/* ── GRID VIEW ─────────────────────────────────────────────────────── */}
      {viewMode === 'grid' && (
        <div>
          {initialLoading ? (
            <p className="py-16 text-center text-sm text-ink-muted" role="status">Loading leads…</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedLeads.map(renderGridCard)}
              </div>
              {sortedLeads.length === 0 && !listError && !listUnavailableReason && (
                <EmptyState title="No leads match" reason="Nothing in this workspace matches these filters. Clear a filter, or add a lead." />
              )}
              <div className="mt-4 rounded-card border border-line bg-surface-panel">
                <LeadsPager page={page} pageCount={pageCount} total={listTotal} pageSize={PAGE_SIZE}
                  shown={sortedLeads.length} loading={listLoading} onPage={setPage} />
              </div>
            </>
          )}
        </div>
      )}

      {/* ── KANBAN VIEW ───────────────────────────────────────────────────── */}
      {viewMode === 'kanban' && (
        <div className="overflow-x-auto">
          {initialLoading ? (
            <p className="py-16 text-center text-sm text-ink-muted" role="status">Loading leads…</p>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-7 gap-3">
                {KANBAN_SWIM_LANES.map(lane => {
                  const laneLeads = kanbanLaneLeads[lane.id] ?? [];
                  const laneData  = kanban.lanes[lane.id];
                  const laneTotal = laneData?.total ?? 0;
                  return (
                    <div key={lane.id} className="flex flex-col min-w-0">
                      <div className={`flex items-center justify-between px-2.5 py-2 rounded-t-card border ${lane.headerColor}`}>
                        <span className="text-xs font-semibold truncate">{lane.label}</span>
                        <div className="flex items-center gap-1 ml-1 shrink-0">
                          {WIP_LIMITS[lane.id] != null && laneTotal > WIP_LIMITS[lane.id] && (
                            <span
                              className="text-xs font-bold bg-warning-100 text-warning-700 px-1 py-0.5 rounded leading-none"
                              title={`WIP limit exceeded (limit: ${WIP_LIMITS[lane.id]})`}
                            >
                              WIP
                            </span>
                          )}
                          <span className="text-xs font-bold bg-surface-panel px-1.5 py-0.5 rounded-full" title={`${laneTotal} leads in this lane`}>
                            {laneTotal}
                          </span>
                        </div>
                      </div>
                      <Droppable droppableId={lane.id}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`flex-1 min-h-[200px] p-2 rounded-b-card border border-t-0 border-line transition-colors ${
                              snapshot.isDraggingOver ? 'bg-brand-50 border-brand-600' : 'bg-surface-subtle'
                            }`}
                          >
                            {laneLeads.map((lead, index) => renderKanbanCard(lead, index))}
                            {provided.placeholder}
                            {laneData?.error && (
                              <p role="alert" className="text-xs text-danger-700 text-center py-2">{laneData.error}</p>
                            )}
                            {laneLeads.length < laneTotal && (
                              <button
                                type="button"
                                onClick={() => kanban.loadMoreLane(lane.id)}
                                disabled={laneData?.loading}
                                className="w-full mt-1 text-xs font-medium text-brand-600 hover:text-brand-700 py-1.5"
                              >
                                {laneData?.loading ? 'Loading…' : `Showing ${laneLeads.length} of ${laneTotal} — load more`}
                              </button>
                            )}
                            {laneLeads.length === 0 && !snapshot.isDraggingOver && (
                              <p className="text-xs text-ink-muted text-center py-6">
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

        </div>
        {drawerLead && (
          <LeadSelectedPanel
            lead={drawerLead}
            position={drawerIdx >= 0 ? (page - 1) * PAGE_SIZE + drawerIdx + 1 : 0}
            total={listTotal}
            slaResult={leadSLAMap.get(drawerLead.id) ?? HEALTHY_SLA_RESULT}
            isDuplicateRisk={duplicateCandidateMap.has(drawerLead.id)}
            hasPrev={drawerIdx > 0}
            hasNext={drawerIdx >= 0 && drawerIdx < sortedLeads.length - 1}
            onPrev={() => { if (drawerIdx > 0) setDrawerLeadId(sortedLeads[drawerIdx - 1].id); }}
            onNext={() => { if (drawerIdx >= 0 && drawerIdx < sortedLeads.length - 1) setDrawerLeadId(sortedLeads[drawerIdx + 1].id); }}
            onClose={() => setDrawerLeadId(null)}
            onOpenRecord={() => navigate(`/crm/leads/${drawerLead.id}`)}
            onConvert={() => openModal('convertLead', drawerLead)}
            onUpdateStatus={status => { void moveLead(drawerLead.id, status, `Lead moved to ${status.replace(/_/g, ' ')}`); }}
            onGoTo={navigate}
            refreshKey={writeVersion}
          />
        )}
      </div>

      {/* Outreach Composer — opened from contactLead modal (row menu, drawer, NBA actions) */}
      {isModalOpen('contactLead') && activeLead && (
        <OutreachComposer
          lead={activeLead}
          submitting={logActivity.saving}
          error={logActivity.error}
          followUpAvailable
          onSubmit={(activity, followUp) => {
            // Saved for real now (it toasted "Call logged" over nothing). Success
            // only after the server confirms; a refusal keeps the composer open.
            const lead = activeLead;
            const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'lead';
            const fu = followUp?.date
              ? { date: followUp.date, type: followUp.type, title: `Follow up (${followUp.type}) with ${name}` }
              : undefined;
            void logActivity.save(lead.id, activity, fu).then(ok => {
              if (!ok) return;
              const fuError = logActivity.followUpErrorRef.current;
              const label = LOGGED_LABEL[activity.type] ?? 'Activity saved';
              if (fuError) showToast(`${label} — but the follow-up was not set: ${fuError}`, 'error');
              else showToast(`${label}${fu ? ' · follow-up set' : ''}`, 'success');
              closeModal();
              // A completed call / email / meeting moves last contact, a follow-up
              // changes the lead's next follow-up: refetch.
              if (activity.type !== 'note' || fu) notifyWrite();
            });
          }}
          onClose={() => { logActivity.reset(); closeModal(); }}
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
          onConverted={(res) => {
            // Fires only after the SERVER created/linked the records.
            const targetType = res.deal ? 'both' : 'contact';
            actions.convert(activeLead, targetType, res.deal?.id ?? res.contact.id);
          }}
        />
      )}

      {/* ── Merge Review Modal ───────────────────────────────────────────── */}
      {isModalOpen('mergeDuplicate') && activeLead && (
        <MergeReviewModal
          lead={activeLead}
          candidateId={duplicateCandidateMap.get(activeLead.id)?.[0]?.leadId ?? ''}
          allLeads={pageLeads}
          candidates={duplicateCandidateMap.get(activeLead.id) ?? []}
          isOpen
          onClose={closeModal}
        />
      )}

      {/* ── Advanced Filter Drawer ────────────────────────────────────────── */}
      <AdvancedFilterDrawer
        open={isModalOpen('advancedFilters')}
        advancedFilter={advancedFilter}
        leads={pageLeads}
        serverQuery={serverQuery}
        onChange={setAdvancedFilter}
        onClose={closeModal}
      />

      {/* ── Kanban Qualify Gate ──────────────────────────────────────────── */}
      {kanbanModal === 'qualify' && pendingLead && (
        <KanbanQualifyModal
          lead={pendingLead}
          canOverride={can('leads.override_qualification_guard')}
          onConfirm={async (opts) => {
            // Step 5: the server runs the gate. The toast fires only after it
            // confirms; a refusal goes back to the modal, which stays open and
            // shows the server's reasons. (It used to fire the PUT without
            // awaiting it and toast success regardless.)
            try {
              await transitionLead(pendingLead.id, 'qualified', opts);
              setPendingDropLeadId(null);
              setKanbanModal(null);
              showToast(`${pendingLead.first_name || 'Lead'} moved to Qualifying`, 'success');
              return null;
            } catch (e) {
              if (e instanceof LeadStageError) {
                return { message: e.message, unmetCriteria: e.unmetCriteria, canOverride: e.canOverride };
              }
              return { message: e instanceof Error ? e.message : 'Could not move the lead.' };
            }
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

    </div>
  );
};

export default LeadsPage;
