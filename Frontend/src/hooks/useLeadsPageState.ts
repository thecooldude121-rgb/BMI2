import { useState, useMemo, useCallback, useEffect } from 'react';
import type { Lead, LeadLifecycleStage, LeadView } from '../types/lead';
import type { LeadDomain } from '../types/leadDomain';
import { useLeads } from '../contexts/LeadContext';
import { toLeadDomain } from '../utils/leadAdapters';
import { SYSTEM_PRESETS } from '../utils/savedViewPresets';
import type { PresetSetters } from '../utils/savedViewPresets';
import type { AdvancedFilter } from '../types/leadFilter';
import { applyAdvancedFilter } from '../utils/leadFilterEngine';
import type { SortMode } from '../utils/leadSorting';
import { sortLeads, getSortDescription, SORT_OPTIONS } from '../utils/leadSorting';
import { computeLeadSLA, getSLAConfig, HEALTHY_SLA_RESULT } from '../utils/leadSla';
import type { LeadSLAResult } from '../utils/leadSla';
import { computeNBA } from '../utils/leadNBA/engine';
import type { NBAPriority } from '../utils/leadNBA/engine';
import { computeMultiFactorScore } from '../utils/leadScoring/multiFactorScore';

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
  nbaQueue:               Map<string, NBAPriority>;
  leadSLAMap:             Map<string, LeadSLAResult>;
  slaBreachedLeads:       Lead[];
  slaAtRiskLeads:         Lead[];
  slaEscalateLeads:       Lead[];
  slaBreachCounts:        { firstResponse: number; followUp: number; stale: number };
  newUnworkedLeads:       Lead[];
  sourceQualityThisWeek:  SourceQuality;
  newUnworkedDelta:       number;
  readyToConvertDelta:    number;
  advancedFilter:         AdvancedFilter;
  hasActiveAdvancedFilter: boolean;
  statusViewMode:         StatusViewMode;

  setViewMode:         (mode: ViewMode) => void;
  setSearchQuery:      (q: string) => void;
  setSortBy:           (s: SortOption) => void;
  setFilterStatus:     (s: string) => void;
  setFilterSource:     (s: string) => void;
  setFilterScore:      (s: string) => void;
  resetFilters:        () => void;
  loadMore:            () => void;
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

function getLeadName(lead: Lead): string {
  return lead.full_name || [lead.first_name, lead.last_name].filter(Boolean).join(' ') || '—';
}

function getLeadScore(lead: Lead): number {
  return lead.ai_score ?? lead.score;
}

const VALID_SORT_MODES = new Set<string>(SORT_OPTIONS.map(o => o.mode));
function isSortOption(s: string | undefined): s is SortOption {
  return s !== undefined && VALID_SORT_MODES.has(s);
}

const DEFAULT_FILTER: FilterState = { status: 'all', source: 'all', score: 'all' };
const PAGE_SIZE = 20;

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useLeadsPageState(): LeadsPageState {
  const {
    leads: contextLeads,
    fetchLeads,
    views,
    fetchViews,
    createView,
    updateView,
    deleteView: ctxDeleteView,
  } = useLeads();

  // ── State ─────────────────────────────────────────────────────────────────
  const [viewMode,        setViewMode]        = useState<ViewMode>('list');
  const [searchQuery,     setSearchQuery]     = useState('');
  const [sortBy,          setSortBy]          = useState<SortOption>('priority');
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
    () => (localStorage.getItem('bmi_lead_status_view') as StatusViewMode | null) ?? 'detailed',
  );

  useEffect(() => {
    fetchLeads();
    fetchViews();
  }, [fetchLeads, fetchViews]);

  // ── Frontend migration layer ──────────────────────────────────────────────
  // Normalises legacy status values from the DB into the 12-state model.
  // In production, apply the SQL migration in Backend/migrations/ first, then remove this.
  const migratedLeads = useMemo((): Lead[] => {
    const STATUS_MAP: Record<string, LeadLifecycleStage> = {
      contacted: 'attempting_contact',
      working:   'attempting_contact',
      nurturing: 'nurture',
      unqualified: 'disqualified',
    };
    return contextLeads.map(lead => {
      const migrated = STATUS_MAP[lead.status];
      // Auto-derive 'assigned' for new leads that already have an owner
      const derived: LeadLifecycleStage =
        migrated ??
        (lead.status === 'new' && lead.owner_id ? 'assigned' : lead.status as LeadLifecycleStage);
      return derived !== lead.status ? { ...lead, status: derived } : lead;
    });
  }, [contextLeads]);

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

  const overdueLeads = useMemo(() => {
    const now = new Date();
    return migratedLeads.filter(
      l => l.next_follow_up_date && new Date(l.next_follow_up_date) < now,
    );
  }, [migratedLeads]);

  const untouchedLeads = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return migratedLeads.filter(
      l => !l.last_contact_date || new Date(l.last_contact_date) < cutoff,
    );
  }, [migratedLeads]);

  const readyToConvertLeads = useMemo(
    () => migratedLeads.filter(l => l.status === 'qualified' || l.status === 'sales_accepted'),
    [migratedLeads],
  );

  // Shared domain-level duplicate set — consumed by filteredLeads, sortedLeads, and duplicateRiskLeads
  const duplicateEmailDomainSet = useMemo(() => {
    const domainCounts = migratedLeads.reduce((acc, l) => {
      const domain = l.email?.split('@')[1];
      if (domain) acc[domain] = (acc[domain] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return new Set(
      Object.entries(domainCounts)
        .filter(([, count]) => count > 1)
        .map(([domain]) => domain),
    );
  }, [migratedLeads]);

  const duplicateRiskLeads = useMemo(
    () => migratedLeads.filter(l => {
      const domain = l.email?.split('@')[1];
      return domain !== undefined && duplicateEmailDomainSet.has(domain);
    }),
    [migratedLeads, duplicateEmailDomainSet],
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
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    const dow = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - (dow === 0 ? 6 : dow - 1));

    const weeklyLeads = migratedLeads.filter(l => new Date(l.created_at) >= weekStart);
    if (weeklyLeads.length === 0) {
      return { topSource: '—', topSourceAvgScore: 0, topSourceCount: 0, weeklyLeads: 0 };
    }

    const bySource = new Map<string, number[]>();
    for (const lead of weeklyLeads) {
      const src = lead.source || 'Unknown';
      const score = lead.ai_score ?? lead.score;
      if (!bySource.has(src)) bySource.set(src, []);
      bySource.get(src)!.push(score);
    }

    let topSource = '—';
    let topAvg = -1;
    let topCount = 0;
    for (const [src, scores] of bySource.entries()) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg > topAvg) { topSource = src; topAvg = avg; topCount = scores.length; }
    }

    return {
      topSource,
      topSourceAvgScore: Math.round(topAvg < 0 ? 0 : topAvg),
      topSourceCount: topCount,
      weeklyLeads: weeklyLeads.length,
    };
  }, [migratedLeads]);

  const nbaQueue = useMemo((): Map<string, NBAPriority> => {
    const overdueSet   = new Set(overdueLeads.map(l => l.id));
    const untouchedSet = new Set(untouchedLeads.map(l => l.id));
    const map = new Map<string, NBAPriority>();
    for (const lead of migratedLeads) {
      const domain = lead.email?.split('@')[1];
      const isDuplicateRisk = domain !== undefined && duplicateEmailDomainSet.has(domain);
      const mfs             = computeMultiFactorScore(lead);
      const { priority }    = computeNBA(lead, {
        isDuplicateRisk,
        isOverdue:   overdueSet.has(lead.id),
        isUntouched: untouchedSet.has(lead.id),
        slaResult:   leadSLAMap.get(lead.id),
        mfs,
      });
      map.set(lead.id, priority);
    }
    return map;
  }, [migratedLeads, overdueLeads, untouchedLeads, duplicateEmailDomainSet, leadSLAMap]);

  const filteredLeads = useMemo(() => {
    let base = migratedLeads.filter(lead => {
      const statusGroup = STATUS_GROUPS[filterState.status];
      const matchesStatus =
        filterState.status === 'all'       ? true :
        statusGroup                         ? statusGroup.includes(lead.status) :
                                              lead.status === filterState.status;
      const matchesSource = filterState.source === 'all' ||
        (lead.source || '').toLowerCase().includes(filterState.source.toLowerCase());
      const score = getLeadScore(lead);
      const matchesScore =
        filterState.score === 'all' ||
        (filterState.score === '80-100'   && score >= 80) ||
        (filterState.score === '60-79'    && score >= 60 && score < 80) ||
        (filterState.score === 'below-60' && score < 60);
      const name = getLeadName(lead).toLowerCase();
      const matchesSearch =
        searchQuery === '' ||
        name.includes(searchQuery.toLowerCase()) ||
        (lead.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lead.email   || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSource && matchesScore && matchesSearch;
    });

    if (activeInsight === 'overdue') {
      const overdueIds = new Set(overdueLeads.map(l => l.id));
      base = base.filter(l => overdueIds.has(l.id));
    } else if (activeInsight === 'duplicateRisk') {
      const dupIds = new Set(duplicateRiskLeads.map(l => l.id));
      base = base.filter(l => dupIds.has(l.id));
    } else if (activeInsight === 'untouched') {
      const untouchedIds = new Set(untouchedLeads.map(l => l.id));
      base = base.filter(l => untouchedIds.has(l.id));
    } else if (activeInsight === 'readyToConvert') {
      const rtcIds = new Set(readyToConvertLeads.map(l => l.id));
      base = base.filter(l => rtcIds.has(l.id));
    } else if (activeInsight === 'slaBreach') {
      const slaIds = new Set(slaBreachedLeads.map(l => l.id));
      base = base.filter(l => slaIds.has(l.id));
    } else if (activeInsight === 'nbaAction') {
      base = base.filter(l => {
        const p = nbaQueue.get(l.id);
        return p === 'urgent' || p === 'high';
      });
    }

    base = applyAdvancedFilter(base, advancedFilter, duplicateEmailDomainSet, leadSLAMap);

    return base;
  }, [migratedLeads, filterState, searchQuery, activeInsight, overdueLeads, duplicateRiskLeads, untouchedLeads, readyToConvertLeads, slaBreachedLeads, nbaQueue, advancedFilter, duplicateEmailDomainSet, leadSLAMap]);

  const sortedLeads = useMemo(
    () => sortLeads(filteredLeads, sortBy, duplicateEmailDomainSet, leadSLAMap),
    [filteredLeads, sortBy, duplicateEmailDomainSet, leadSLAMap],
  );

  const paginatedLeads = useMemo(
    () => sortedLeads.slice(0, displayedCount),
    [sortedLeads, displayedCount],
  );

  const kpiMetrics = useMemo((): KpiMetrics => {
    const today = new Date().toDateString();
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    let urgentNbaCount = 0;
    let highNbaCount   = 0;
    for (const priority of nbaQueue.values()) {
      if (priority === 'urgent') urgentNbaCount++;
      else if (priority === 'high') highNbaCount++;
    }

    return {
      total:    migratedLeads.length,
      newToday: migratedLeads.filter(l => new Date(l.created_at).toDateString() === today).length,
      hot:      migratedLeads.filter(l => getLeadScore(l) >= 80).length,
      importedThisWeek: migratedLeads.filter(l => {
        const src = (l.source || '').toLowerCase();
        return (
          new Date(l.created_at) >= weekStart &&
          (src.includes('lead gen') || src.includes('hrms') || src.includes('apollo'))
        );
      }).length,
      urgentNbaCount,
      highNbaCount,
    };
  }, [migratedLeads, nbaQueue]);

  // ── Trend deltas (7d vs prior 7d, derived — not memoized) ────────────────

  const _now7  = new Date();
  const _7dAgo  = new Date(_now7.getTime() - 7  * 86_400_000);
  const _14dAgo = new Date(_now7.getTime() - 14 * 86_400_000);

  const newUnworkedDelta = (() => {
    const thisWk = newUnworkedLeads.filter(l => new Date(l.created_at) >= _7dAgo).length;
    const lastWk = newUnworkedLeads.filter(l => {
      const d = new Date(l.created_at);
      return d >= _14dAgo && d < _7dAgo;
    }).length;
    return thisWk - lastWk;
  })();

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

  const loadMore = useCallback(
    () => setDisplayedCount(prev => Math.min(prev + PAGE_SIZE, sortedLeads.length)),
    [sortedLeads.length],
  );

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
    overdueLeads,
    untouchedLeads,
    readyToConvertLeads,
    duplicateRiskLeads,
    nbaQueue,
    leadSLAMap,
    slaBreachedLeads,
    slaAtRiskLeads,
    slaEscalateLeads,
    slaBreachCounts,
    newUnworkedLeads,
    sourceQualityThisWeek,
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
    loadMore,
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
