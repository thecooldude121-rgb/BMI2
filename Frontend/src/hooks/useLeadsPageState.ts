import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { Lead, LeadLifecycleStage, LeadView } from '../types/lead';
import type { LeadDomain } from '../types/leadDomain';
import { useLeads } from '../contexts/LeadContext';
import { toLeadDomain } from '../utils/leadAdapters';
import { SYSTEM_PRESETS } from '../utils/savedViewPresets';
import type { PresetSetters } from '../utils/savedViewPresets';
import type { AdvancedFilter } from '../types/leadFilter';
import type { SortMode } from '../utils/leadSorting';
import { getSortDescription, SORT_OPTIONS } from '../utils/leadSorting';
import { computeLeadSLA, getSLAConfig } from '../utils/leadSla';
import type { LeadSLAResult } from '../utils/leadSla';
import type { NBAPriority } from '../utils/leadNBA/engine';
import type { DuplicateCandidate } from '../utils/leadDuplicates';
import { computeSourceAnalytics } from '../utils/leadSourceAnalytics';
import type { SourceStats } from '../utils/leadSourceAnalytics';
import { usePermissions } from './usePermissions';
import { useCurrentUser } from '../contexts/CurrentUserContext';
import { fetchLeadsPage, fetchLeadSummary } from '../utils/leadsApi';
import type { LeadListQuery, LeadSummary } from '../utils/leadsApi';
import { dayOrInstant, localDay } from '../utils/dates';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ViewMode = 'list' | 'grid' | 'kanban';

// SortOption is now an alias for SortMode — canonical type lives in leadSorting.ts
export type SortOption = SortMode;

export type ModalId =
  | 'contactLead'
  | 'convertLead'
  | 'editLead'
  | 'assignOwner'
  | 'addTag'
  | 'enrichLead'
  | 'mergeDuplicate'
  | 'bulkAssign'
  | 'bulkStatus'
  | 'sortDropdown'
  | 'actionsMenu'
  | 'confirmDelete'
  | 'terminalDisqualify'
  | 'terminalLost'
  | 'createView'
  | 'editView'
  | 'manageViews'
  | 'advancedFilters';

export interface FilterState {
  status: string;
  source: string;
  score:  string;
}

export interface ToastMessage {
  message: string;
  type:    'success' | 'error' | 'info';
}

export interface KpiMetrics {
  total:            number;
  newToday:         number;
  hot:              number;
  importedThisWeek: number;
  urgentNbaCount:   number;
  highNbaCount:     number;
}

export interface SourceQuality {
  topSource:          string;
  topSourceAvgScore:  number;
  topSourceCount:     number;
  weeklyLeads:        number;
}

export interface SourceAnalytics {
  all:   SourceStats[];
  week:  SourceStats[];
  month: SourceStats[];
}

export type { SourceStats };

export type ActiveInsight = 'overdue' | 'duplicateRisk' | 'untouched' | 'readyToConvert' | 'slaBreach' | 'nbaAction' | null;

export type StatusViewMode = 'simplified' | 'detailed';

// Simplified status groups — map to arrays of individual lifecycle stages.
// Used when the status filter bar is in "Simplified" mode.
export const STATUS_GROUPS: Record<string, LeadLifecycleStage[]> = {
  '__incoming__':    ['new', 'assigned'],
  '__in_progress__': ['enriching', 'attempting_contact', 'engaged'],
  '__qualified__':   ['qualified', 'sales_accepted'],
  '__nurturing__':   ['nurture'],
  '__closed__':      ['converted', 'disqualified', 'lost'],
};

export interface LeadsPageState {
  viewMode:        ViewMode;
  searchQuery:     string;
  sortBy:          SortOption;
  sortLabel:        string;
  sortExplanation:  string;
  displayedCount:  number;
  filterState:     FilterState;
  selectedLeadIds: string[];
  activeLead:      Lead | null;
  activeModal:     ModalId | null;
  toast:           ToastMessage | null;
  savedViews:      LeadView[];
  activeViewId:    string | null;
  activeViewLabel: string;
  activeInsight:   ActiveInsight;

  domainLeads:            LeadDomain[];
  filteredLeads:          Lead[];
  sortedLeads:            Lead[];
  paginatedLeads:         Lead[];
  kpiMetrics:             KpiMetrics;
  overdueLeads:           Lead[];
  untouchedLeads:         Lead[];
  readyToConvertLeads:    Lead[];
  duplicateRiskLeads:     Lead[];
  duplicateCandidateMap:  Map<string, DuplicateCandidate[]>;
  nbaQueue:               Map<string, NBAPriority>;
  leadSLAMap:             Map<string, LeadSLAResult>;
  slaBreachedLeads:       Lead[];
  slaAtRiskLeads:         Lead[];
  slaEscalateLeads:       Lead[];
  slaBreachCounts:        { firstResponse: number; followUp: number; stale: number };
  newUnworkedLeads:       Lead[];
  sourceQualityThisWeek:  SourceQuality;
  sourceAnalytics:        SourceAnalytics;
  canViewAllLeads:        boolean;
  newUnworkedDelta:       number;
  readyToConvertDelta:    number;
  advancedFilter:         AdvancedFilter;
  hasActiveAdvancedFilter: boolean;
  /** SERVER pagination (step 5): the real number of leads matching the filters. */
  listTotal:              number;
  listLoading:            boolean;
  /** The server's refusal (e.g. a saved view filtering on a field with no column). */
  listError:              string | null;
  /** Set when the current filters ask for something not computable yet — the list is NOT fetched. */
  listUnavailableReason:  string | null;
  /** The filters as a server query (without paging) — Kanban lanes reuse it. */
  serverQuery:            Omit<LeadListQuery, 'limit' | 'offset'>;
  /** KPI figures over ALL matching leads, or null until loaded. */
  summary:                LeadSummary | null;
  statusViewMode:         StatusViewMode;

  setViewMode:         (mode: ViewMode) => void;
  setSearchQuery:      (q: string) => void;
  setSortBy:           (s: SortOption) => void;
  setFilterStatus:     (s: string) => void;
  setFilterSource:     (s: string) => void;
  setFilterScore:      (s: string) => void;
  resetFilters:        () => void;
  /** 1-based page of the server's ordered result; numbered, not accumulated. */
  page:                number;
  pageCount:           number;
  setPage:             (page: number) => void;
  toggleLeadSelection: (id: string) => void;
  selectAllLeads:      () => void;
  setSelection:        (ids: string[]) => void;
  clearSelection:      () => void;
  isSelected:          (id: string) => boolean;
  openModal:           (id: ModalId, lead?: Lead) => void;
  closeModal:          () => void;
  isModalOpen:         (id: ModalId) => boolean;
  showToast:           (message: string, type?: ToastMessage['type']) => void;
  clearToast:          () => void;
  createSavedView:     (view: Partial<LeadView>) => Promise<LeadView | null>;
  deleteSavedView:     (id: string) => Promise<boolean>;
  // Saved-views actions
  setActiveView:        (id: string) => void;
  clearActiveView:      () => void;
  setActiveInsight:     (insight: ActiveInsight) => void;
  setStatusViewMode:    (mode: StatusViewMode) => void;
  setAdvancedFilter:    (filter: AdvancedFilter) => void;
  clearAdvancedFilter:  () => void;
  saveCurrentAsView:   (name: string, visibility: 'private' | 'team' | 'organization') => Promise<void>;
  updateActiveView:    () => Promise<void>;
  renameView:          (id: string, name: string) => Promise<void>;
  pinView:             (id: string) => Promise<void>;
  reorderViews:        (draggedId: string, newOrder: number) => Promise<void>;
  deleteView:          (id: string) => Promise<void>;
}

// ── Private helpers ───────────────────────────────────────────────────────────

// (getLeadName / getLeadScore were used by the client-side filter, now on the server.)

const VALID_SORT_MODES = new Set<string>(SORT_OPTIONS.map(o => o.mode));
function isSortOption(s: string | undefined): s is SortOption {
  return s !== undefined && VALID_SORT_MODES.has(s);
}

const DEFAULT_FILTER: FilterState = { status: 'all', source: 'all', score: 'all' };

/** Sorts the server can run in SQL (Backend utils/leadListQuery SQL_SORTS). */
export const SERVER_SORTS = new Set<string>(['newest', 'oldest', 'score_high_low', 'score_low_high', 'recently_active']);

/**
 * Insight filters the server can run, mapped to its insight names. The rest need
 * every lead (duplicates, SLA, next-best-action) or a column that does not exist
 * (overdue follow-ups) — they are "Coming soon" until step 5 slice B.
 * 'untouched' is the "New Unworked" card: it now filters to exactly what that
 * card counts (new/assigned with no contact) rather than a different set.
 */
const SERVER_INSIGHTS: Partial<Record<string, LeadListQuery['insight']>> = {
  untouched:      'new_unworked',
  readyToConvert: 'ready_to_convert',
  // Real since Group B item 11: an open follow-up task due before today.
  overdue:        'overdue',
};
export const COMING_SOON_INSIGHT_REASON: Record<string, string> = {
  duplicateRisk: 'Duplicate risk is coming soon — it compares every lead and is moving to the server.',
  slaBreach:     'SLA breach filtering is coming soon — it is moving to the server.',
  nbaAction:     'The action-required queue is coming soon — it is moving to the server.',
};
/** Figma "Showing 1–25 of N · 25 rows per page" (decided 2026-10-05). */
export const PAGE_SIZE = 25;

/**
 * Display-side status migration: legacy DB stages shown in the 12-state model
 * ('contacted' -> 'attempting_contact', …) and a 'new' lead with an owner shown
 * as 'assigned'. The server's status filters mirror exactly this
 * (Backend utils/leadListQuery statusPredicate), so a chip and its rows agree.
 */
export function migrateLegacyStatus(lead: Lead): Lead {
  const STATUS_MAP: Record<string, LeadLifecycleStage> = {
    contacted: 'attempting_contact',
    working:   'attempting_contact',
    nurturing: 'nurture',
    unqualified: 'disqualified',
  };
  const migrated = STATUS_MAP[lead.status];
  const hasOwner = Boolean(lead.owner_id) || Boolean(lead.assigned_to_user_id);
  const derived: LeadLifecycleStage =
    migrated ?? (lead.status === 'new' && hasOwner ? 'assigned' : lead.status as LeadLifecycleStage);
  return derived !== lead.status ? { ...lead, status: derived } : lead;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useLeadsPageState(): LeadsPageState {
  const { can, canViewLead } = usePermissions();

  const {
    leads: contextLeads,
    fetchLeads,
    views,
    fetchViews,
    createView,
    updateView,
    deleteView: ctxDeleteView,
    writeVersion,
  } = useLeads();
  const { currentUser } = useCurrentUser();

  // ── State ─────────────────────────────────────────────────────────────────
  const [viewMode,        setViewMode]        = useState<ViewMode>('list');
  const [searchQuery,     setSearchQuery]     = useState('');
  // Default 'newest' (step 5): 'priority' is a client-computed composite score
  // and cannot be ordered by the server until slice B.
  const [sortBy,          setSortBy]          = useState<SortOption>('newest');
  const [displayedCount,  setDisplayedCount]  = useState(PAGE_SIZE);
  const [filterState,     setFilterState]     = useState<FilterState>(DEFAULT_FILTER);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [activeLead,      setActiveLead]      = useState<Lead | null>(null);
  const [activeModal,     setActiveModal]     = useState<ModalId | null>(null);
  const [toast,           setToast]           = useState<ToastMessage | null>(null);
  // Saved views state
  const [activeViewId,    setActiveViewId]    = useState<string | null>(null);
  const [activeInsight,   setActiveInsightSt] = useState<ActiveInsight>(null);
  const [advancedFilter,  setAdvancedFilterSt] = useState<AdvancedFilter>({ groups: [] });
  const [statusViewMode,  setStatusViewModeSt] = useState<StatusViewMode>(
    () => {
      try {
        return (localStorage.getItem('bmi_lead_status_view') as StatusViewMode | null) ?? 'detailed';
      } catch {
        return 'detailed';
      }
    },
  );

  useEffect(() => {
    fetchViews();
  }, [fetchViews]);
  void fetchLeads; // the page no longer reads LeadContext's (capped) list — see the server fetch below

  // ── Server-side list (step 5 slice A) ─────────────────────────────────────
  // The page used to filter / sort / page LeadContext's leads — at most the
  // API's default 50 — in the browser, with no total. It now asks the server
  // for one page at a time, filtered and counted over EVERY lead.
  const canViewAll = can('leads.view_all');
  const ownerFilter = !canViewAll && /^\d+$/.test(String(currentUser.id ?? '')) ? String(currentUser.id) : undefined;
  // A user without view_all and without a resolvable id sees nothing rather
  // than everything — the display filter fails closed.
  const ownerBlocked = !canViewAll && !ownerFilter;

  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const serverQuery = useMemo((): Omit<LeadListQuery, 'limit' | 'offset'> => ({
    status: filterState.status, source: filterState.source, score_band: filterState.score,
    search: debouncedSearch, assigned_to_user_id: ownerFilter,
    insight: activeInsight ? SERVER_INSIGHTS[activeInsight] : undefined,
    filter: advancedFilter, sort: sortBy,
  }), [filterState, debouncedSearch, ownerFilter, activeInsight, advancedFilter, sortBy]);

  const listUnavailableReason: string | null =
    ownerBlocked ? 'Your leads cannot be shown — your account has no user id to match lead owners against.'
    : activeInsight && !SERVER_INSIGHTS[activeInsight] ? (COMING_SOON_INSIGHT_REASON[activeInsight] ?? 'This view is coming soon.')
    : !SERVER_SORTS.has(sortBy) ? `Sorting by "${SORT_OPTIONS.find(o => o.mode === sortBy)?.label ?? sortBy}" is coming soon.`
    : null;

  const [serverRows,  setServerRows]  = useState<Lead[]>([]);
  const [listTotal,   setListTotal]   = useState(0);
  const [listLoading, setListLoading] = useState(false);
  const [listError,   setListError]   = useState<string | null>(null);
  const reqSeq = useRef(0);
  const [page, setPageState] = useState(1);
  const queryKey = JSON.stringify(serverQuery);
  const lastQueryKey = useRef(queryKey);

  useEffect(() => {
    if (listUnavailableReason) {
      setServerRows([]); setListTotal(0); setListError(null); setListLoading(false);
      return;
    }
    // A new query starts at page 1; a refetch after a write keeps the page.
    let effectivePage = page;
    if (lastQueryKey.current !== queryKey) {
      lastQueryKey.current = queryKey;
      if (page !== 1) { setPageState(1); return; }   // re-runs with page 1
      effectivePage = 1;
    }
    const seq = ++reqSeq.current;
    setListLoading(true);
    fetchLeadsPage({ ...serverQuery, limit: PAGE_SIZE, offset: (effectivePage - 1) * PAGE_SIZE })
      .then(page => {
        if (seq !== reqSeq.current) return;          // a newer request superseded this one
        setServerRows(page.leads); setListTotal(page.total); setListError(null);
      })
      .catch(e => {
        if (seq !== reqSeq.current) return;
        setServerRows([]); setListTotal(0);
        setListError(e instanceof Error ? e.message : 'Could not load leads.');
      })
      .finally(() => { if (seq === reqSeq.current) setListLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, writeVersion, listUnavailableReason, page]);

  const [summary, setSummary] = useState<LeadSummary | null>(null);
  useEffect(() => {
    if (ownerBlocked) { setSummary(null); return; }
    let live = true;
    fetchLeadSummary(ownerFilter).then(s => { if (live) setSummary(s); }).catch(() => { if (live) setSummary(null); });
    return () => { live = false; };
  }, [ownerFilter, ownerBlocked, writeVersion]);

  // ── Frontend migration layer ──────────────────────────────────────────────
  // Normalises legacy status values from the DB into the 12-state model.
  // In production, apply the SQL migration in Backend/migrations/ first, then remove this.
  const migratedLeads = useMemo((): Lead[] => serverRows.map(migrateLegacyStatus), [serverRows]);
  // The "own leads" display filter now runs on the SERVER (assigned_to_user_id),
  // so the total matches the rows. (canViewLead compared lead.owner_id, which
  // the API never set — sales users saw no leads at all.)
  void canViewLead; void contextLeads;

  // ── Sorted saved views (pinned first, then view_order) ───────────────────
  const savedViews = useMemo(
    () => [...views].sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return a.view_order - b.view_order;
    }),
    [views],
  );

  // ── Active view label ─────────────────────────────────────────────────────
  const activeViewLabel = useMemo(() => {
    if (!activeViewId) return '';
    if (activeViewId.startsWith('preset_')) {
      return SYSTEM_PRESETS.find(p => p.id === activeViewId)?.name ?? '';
    }
    return savedViews.find(v => v.id === activeViewId)?.name ?? '';
  }, [activeViewId, savedViews]);

  // ── Derived selectors — all operate on migratedLeads, not raw contextLeads ──

  const domainLeads = useMemo(
    () => migratedLeads.map(toLeadDomain),
    [migratedLeads],
  );

  // Per-row only: a loaded lead whose earliest open follow-up (served by GET
  // /leads since Group B item 11) is a day before today, local calendar. The
  // KPI COUNT comes from the server summary, never from this list.
  const overdueLeads = useMemo(() => {
    const today = localDay();
    return migratedLeads.filter(l => !!l.next_follow_up_date && l.next_follow_up_date.slice(0, 10) < today);
  }, [migratedLeads]);

  const untouchedLeads = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return migratedLeads.filter(
      l => !l.last_contact_date || dayOrInstant(l.last_contact_date) < cutoff,
    );
  }, [migratedLeads]);

  const readyToConvertLeads = useMemo(
    () => migratedLeads.filter(l => l.status === 'qualified' || l.status === 'sales_accepted'),
    [migratedLeads],
  );

  // Per-lead duplicate candidate map — replaces the old coarse domain-level set
  // Duplicate detection compares a lead with EVERY other lead; over one server
  // page it would miss most matches and imply the rest are clean. Empty until
  // step 5 slice B moves it to the server ("Coming soon" on the page).
  const duplicateCandidateMap = useMemo((): Map<string, DuplicateCandidate[]> => new Map(), []);

  // Backward-compat domain set consumed by leadFilterEngine and leadSorting

  const duplicateRiskLeads = useMemo(
    () => migratedLeads.filter(l => duplicateCandidateMap.has(l.id)),
    [migratedLeads, duplicateCandidateMap],
  );

  const leadSLAMap = useMemo(() => {
    const cfg = getSLAConfig();
    const now = new Date();
    return new Map(migratedLeads.map(l => [l.id, computeLeadSLA(l, now, cfg)]));
  }, [migratedLeads]);

  const slaBreachedLeads = useMemo(
    () => migratedLeads.filter(l => leadSLAMap.get(l.id)?.overall === 'breached'),
    [migratedLeads, leadSLAMap],
  );

  const slaAtRiskLeads = useMemo(
    () => migratedLeads.filter(l => leadSLAMap.get(l.id)?.overall === 'at_risk'),
    [migratedLeads, leadSLAMap],
  );

  const slaEscalateLeads = useMemo(
    () => migratedLeads.filter(l => leadSLAMap.get(l.id)?.escalate === true),
    [migratedLeads, leadSLAMap],
  );

  const slaBreachCounts = useMemo(() => {
    let firstResponse = 0, followUp = 0, stale = 0;
    for (const result of leadSLAMap.values()) {
      if (result.firstResponse.severity === 'breached') firstResponse++;
      if (result.followUp.severity === 'breached') followUp++;
      if (result.stale.severity === 'breached') stale++;
    }
    return { firstResponse, followUp, stale };
  }, [leadSLAMap]);

  const newUnworkedLeads = useMemo(
    () => migratedLeads.filter(
      l => (l.status === 'new' || l.status === 'assigned') && l.last_contact_date == null,
    ),
    [migratedLeads],
  );

  const sourceQualityThisWeek = useMemo((): SourceQuality => {
    const q = summary?.source_quality_week;
    return q && q.top_source
      ? { topSource: q.top_source, topSourceAvgScore: q.top_source_avg_score, topSourceCount: q.top_source_count, weeklyLeads: q.weekly_leads }
      : { topSource: '—', topSourceAvgScore: 0, topSourceCount: 0, weeklyLeads: q?.weekly_leads ?? 0 };
  }, [summary]);

  const sourceAnalytics = useMemo((): SourceAnalytics => {
    const now = Date.now();
    const WEEK_MS  = 7  * 86_400_000;
    const MONTH_MS = 30 * 86_400_000;
    return {
      all:   computeSourceAnalytics(migratedLeads, duplicateCandidateMap, leadSLAMap),
      week:  computeSourceAnalytics(
        migratedLeads.filter(l => now - new Date(l.created_at).getTime() <= WEEK_MS),
        duplicateCandidateMap,
        leadSLAMap,
      ),
      month: computeSourceAnalytics(
        migratedLeads.filter(l => now - new Date(l.created_at).getTime() <= MONTH_MS),
        duplicateCandidateMap,
        leadSLAMap,
      ),
    };
  }, [migratedLeads, duplicateCandidateMap, leadSLAMap]);

  // The next-best-action queue is a step 5 slice B item ("Coming soon"): it
  // ranks leads against each other and reads duplicate risk, which needs every
  // lead. Row CTAs fall back to their rule hierarchy.
  const nbaQueue = useMemo((): Map<string, NBAPriority> => new Map(), []);

  // Filtering, sorting and paging happen on the SERVER now (utils/leadListQuery
  // in the backend); these are the rows it returned, in its order.
  const filteredLeads = migratedLeads;
  const sortedLeads   = migratedLeads;
  const paginatedLeads = migratedLeads;
  void untouchedLeads; void readyToConvertLeads; void slaBreachedLeads;

  // Over ALL matching leads, from GET /leads/summary. (The NBA counts are
  // "Coming soon"; the page renders that card accordingly.)
  const kpiMetrics = useMemo((): KpiMetrics => ({
    total:            summary?.total ?? 0,
    newToday:         summary?.new_today ?? 0,
    hot:              summary?.hot ?? 0,
    importedThisWeek: summary?.imported_this_week ?? 0,
    urgentNbaCount:   0,
    highNbaCount:     0,
  }), [summary]);

  // ── Trend deltas (7d vs prior 7d, derived — not memoized) ────────────────

  const _now7  = new Date();
  const _7dAgo  = new Date(_now7.getTime() - 7  * 86_400_000);
  const _14dAgo = new Date(_now7.getTime() - 14 * 86_400_000);

  const newUnworkedDelta = summary ? summary.new_unworked_this_week - summary.new_unworked_last_week : 0;

  const readyToConvertDelta = (() => {
    const thisWk = readyToConvertLeads.filter(l => new Date(l.created_at) >= _7dAgo).length;
    const lastWk = readyToConvertLeads.filter(l => {
      const d = new Date(l.created_at);
      return d >= _14dAgo && d < _7dAgo;
    }).length;
    return thisWk - lastWk;
  })();

  // ── Filter handlers ───────────────────────────────────────────────────────

  const setFilterStatus = useCallback(
    (s: string) => setFilterState(prev => ({ ...prev, status: s })),
    [],
  );
  const setFilterSource = useCallback(
    (s: string) => setFilterState(prev => ({ ...prev, source: s })),
    [],
  );
  const setFilterScore = useCallback(
    (s: string) => setFilterState(prev => ({ ...prev, score: s })),
    [],
  );
  const resetFilters = useCallback(() => setFilterState(DEFAULT_FILTER), []);

  // ── Pagination ────────────────────────────────────────────────────────────

  const pageCount = Math.max(1, Math.ceil(listTotal / PAGE_SIZE));
  const setPage = useCallback((p: number) => {
    setPageState(Math.min(Math.max(1, Math.floor(p)), Math.max(1, Math.ceil(listTotal / PAGE_SIZE))));
  }, [listTotal]);
  // A write can shrink the total under the current page (deleting the last row
  // of the last page): step back rather than show an empty page past the end.
  useEffect(() => {
    if (!listLoading && listTotal > 0 && page > pageCount) setPageState(pageCount);
  }, [listLoading, listTotal, page, pageCount]);
  void setDisplayedCount;

  // ── Selection ─────────────────────────────────────────────────────────────

  const toggleLeadSelection = useCallback((id: string) =>
    setSelectedLeadIds(prev =>
      prev.includes(id) ? prev.filter(lid => lid !== id) : [...prev, id],
    ), []);

  const selectAllLeads = useCallback(() =>
    setSelectedLeadIds(prev =>
      prev.length === sortedLeads.length ? [] : sortedLeads.map(l => l.id),
    ), [sortedLeads]);

  const setSelection = useCallback((ids: string[]) => setSelectedLeadIds(ids), []);

  const clearSelection = useCallback(() => setSelectedLeadIds([]), []);

  const isSelected = useCallback(
    (id: string) => selectedLeadIds.includes(id),
    [selectedLeadIds],
  );

  // ── Modal ─────────────────────────────────────────────────────────────────

  const openModal = useCallback((id: ModalId, lead?: Lead) => {
    setActiveModal(id);
    if (lead !== undefined) setActiveLead(lead);
  }, []);

  const closeModal = useCallback(() => setActiveModal(null), []);

  const isModalOpen = useCallback(
    (id: ModalId) => activeModal === id,
    [activeModal],
  );

  // ── Toast ─────────────────────────────────────────────────────────────────

  const showToast = useCallback(
    (message: string, type: ToastMessage['type'] = 'success') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
    },
    [],
  );

  const clearToast = useCallback(() => setToast(null), []);

  // ── Legacy view helpers (kept for context compat) ────────────────────────

  const createSavedView = useCallback(
    (view: Partial<LeadView>) => createView(view),
    [createView],
  );

  const deleteSavedView = useCallback(
    (id: string) => ctxDeleteView(id),
    [ctxDeleteView],
  );

  // ── Advanced filter actions ───────────────────────────────────────────────

  const setAdvancedFilter = useCallback(
    (filter: AdvancedFilter) => setAdvancedFilterSt(filter),
    [],
  );

  const clearAdvancedFilter = useCallback(
    () => setAdvancedFilterSt({ groups: [] }),
    [],
  );

  const hasActiveAdvancedFilter =
    advancedFilter.groups.length > 0 &&
    advancedFilter.groups.some(g => g.conditions.length > 0);

  // ── Saved views actions ───────────────────────────────────────────────────

  const setActiveInsight = useCallback(
    (insight: ActiveInsight) => setActiveInsightSt(insight),
    [],
  );

  const setStatusViewMode = useCallback((mode: StatusViewMode) => {
    setStatusViewModeSt(mode);
    localStorage.setItem('bmi_lead_status_view', mode);
  }, []);

  // Build the PresetSetters object — stable because setters are stable callbacks.
  const presetSetters: PresetSetters = {
    setFilterStatus,
    setFilterSource,
    setFilterScore,
    setSearchQuery,
    setSortBy: (v: string) => { if (isSortOption(v)) setSortBy(v); },
    setViewMode: (v: string) => { setViewMode(v as ViewMode); },
    setActiveInsight,
    resetFilters,
  };

  const setActiveView = useCallback((id: string) => {
    if (id.startsWith('preset_')) {
      const preset = SYSTEM_PRESETS.find(p => p.id === id);
      if (preset) preset.applyFn(presetSetters);
      setActiveViewId(id);
    } else {
      const view = views.find(v => v.id === id);
      if (!view) return;
      const { advancedFilter: savedAdv, ...savedSimple } = (view.filters ?? {}) as any;
      setFilterState((savedSimple as FilterState) ?? DEFAULT_FILTER);
      setAdvancedFilterSt(savedAdv ?? { groups: [] });
      setSearchQuery(view.search_query ?? '');
      if (isSortOption(view.sort_by)) setSortBy(view.sort_by);
      setViewMode((view.view_mode ?? 'list') as ViewMode);
      setActiveInsightSt(null);
      setActiveViewId(id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [views]);

  const clearActiveView = useCallback(() => {
    setActiveViewId(null);
    setActiveInsightSt(null);
  }, []);

  const saveCurrentAsView = useCallback(
    async (name: string, visibility: 'private' | 'team' | 'organization') => {
      try {
        const created = await createView({
          name,
          visibility,
          filters:      { ...filterState, advancedFilter },
          sort_by:      sortBy,
          sort_order:   'desc',
          search_query: searchQuery,
          view_mode:    viewMode,
          columns:      [],
          is_pinned:    false,
          view_order:   views.length,
          is_public:    visibility !== 'private',
          icon:         'list',
        });
        if (created) {
          setActiveViewId(created.id);
          showToast(`View "${name}" saved`, 'success');
        }
      } catch (err: any) {
        showToast(err.message ?? 'Failed to save view', 'error');
      }
    },
    [createView, filterState, advancedFilter, sortBy, searchQuery, viewMode, views.length, showToast],
  );

  const updateActiveView = useCallback(async () => {
    if (!activeViewId || activeViewId.startsWith('preset_')) return;
    try {
      await updateView(activeViewId, {
        filters:      { ...filterState, advancedFilter },
        sort_by:      sortBy,
        sort_order:   'desc',
        search_query: searchQuery,
        view_mode:    viewMode,
        columns:      [],
      });
      showToast('View updated', 'success');
    } catch (err: any) {
      showToast(err.message ?? 'Failed to update view', 'error');
    }
  }, [activeViewId, updateView, filterState, sortBy, searchQuery, viewMode, showToast]);

  const renameView = useCallback(async (id: string, name: string) => {
    try {
      await updateView(id, { name });
      showToast('View renamed', 'success');
    } catch (err: any) {
      showToast(err.message ?? 'Failed to rename view', 'error');
    }
  }, [updateView, showToast]);

  const pinView = useCallback(async (id: string) => {
    const view = views.find(v => v.id === id);
    if (!view) return;
    try {
      await updateView(id, { is_pinned: !view.is_pinned });
      showToast(view.is_pinned ? 'View unpinned' : 'View pinned', 'success');
    } catch (err: any) {
      showToast(err.message ?? 'Failed to pin view', 'error');
    }
  }, [views, updateView, showToast]);

  const reorderViews = useCallback(
    async (draggedId: string, newOrder: number) => {
      try {
        // Single-item update. TODO: replace with bulk /meta/views/reorder endpoint.
        await updateView(draggedId, { view_order: newOrder });
      } catch (err: any) {
        showToast(err.message ?? 'Failed to reorder views', 'error');
      }
    },
    [updateView, showToast],
  );

  const deleteView = useCallback(async (id: string) => {
    try {
      await ctxDeleteView(id);
      if (activeViewId === id) clearActiveView();
      showToast('View deleted', 'success');
    } catch (err: any) {
      showToast(err.message ?? 'Failed to delete view', 'error');
    }
  }, [ctxDeleteView, activeViewId, clearActiveView, showToast]);

  // ── Derived sort metadata ─────────────────────────────────────────────────

  const sortLabel       = SORT_OPTIONS.find(o => o.mode === sortBy)?.label ?? sortBy;
  const sortExplanation = getSortDescription(sortBy);

  // ── Return ─────────────────────────────────────────────────────────────────

  return {
    viewMode,
    searchQuery,
    sortBy,
    sortLabel,
    sortExplanation,
    displayedCount,
    filterState,
    selectedLeadIds,
    activeLead,
    activeModal,
    toast,
    savedViews,
    activeViewId,
    activeViewLabel,
    activeInsight,

    domainLeads,
    filteredLeads,
    sortedLeads,
    paginatedLeads,
    kpiMetrics,
    listTotal,
    listLoading,
    listError,
    listUnavailableReason,
    serverQuery,
    summary,
    overdueLeads,
    untouchedLeads,
    readyToConvertLeads,
    duplicateRiskLeads,
    duplicateCandidateMap,
    nbaQueue,
    leadSLAMap,
    slaBreachedLeads,
    slaAtRiskLeads,
    slaEscalateLeads,
    slaBreachCounts,
    newUnworkedLeads,
    sourceQualityThisWeek,
    sourceAnalytics,
    canViewAllLeads: can('leads.view_all'),
    newUnworkedDelta,
    readyToConvertDelta,
    advancedFilter,
    hasActiveAdvancedFilter,
    statusViewMode,

    setViewMode,
    setSearchQuery,
    setSortBy,
    setFilterStatus,
    setFilterSource,
    setFilterScore,
    resetFilters,
    page, pageCount, setPage,
    toggleLeadSelection,
    selectAllLeads,
    setSelection,
    clearSelection,
    isSelected,
    openModal,
    closeModal,
    isModalOpen,
    showToast,
    clearToast,
    createSavedView,
    deleteSavedView,
    setActiveView,
    clearActiveView,
    setActiveInsight,
    setStatusViewMode,
    setAdvancedFilter,
    clearAdvancedFilter,
    saveCurrentAsView,
    updateActiveView,
    renameView,
    pinView,
    reorderViews,
    deleteView,
  };
}
