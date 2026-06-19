import { useState, useMemo, useCallback, useEffect } from 'react';
import type { Lead, LeadView } from '../types/lead';
import type { LeadDomain } from '../types/leadDomain';
import { useLeads } from '../contexts/LeadContext';
import { toLeadDomain } from '../utils/leadAdapters';
import { SYSTEM_PRESETS } from '../utils/savedViewPresets';
import type { PresetSetters } from '../utils/savedViewPresets';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ViewMode = 'list' | 'grid' | 'kanban';

export type SortOption = 'score_high_low' | 'score_low_high' | 'name_az' | 'date_newest';

export const SORT_LABELS: Record<SortOption, string> = {
  score_high_low: 'Score (High to Low)',
  score_low_high: 'Score (Low to High)',
  name_az:        'Name (A-Z)',
  date_newest:    'Date (Newest)',
};

export type ModalId =
  | 'contactLead'
  | 'convertLead'
  | 'bulkAssign'
  | 'bulkStatus'
  | 'sortDropdown'
  | 'actionsMenu'
  | 'confirmDelete'
  | 'createView'
  | 'editView'
  | 'manageViews';

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
}

export interface SourceQuality {
  topSource:          string;
  topSourceAvgScore:  number;
  topSourceCount:     number;
  weeklyLeads:        number;
}

export type ActiveInsight = 'overdue' | 'duplicateRisk' | 'untouched' | 'readyToConvert' | null;

export interface LeadsPageState {
  viewMode:        ViewMode;
  searchQuery:     string;
  sortBy:          SortOption;
  sortLabel:       string;
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
  slaBreachedLeads:       Lead[];
  newUnworkedLeads:       Lead[];
  sourceQualityThisWeek:  SourceQuality;
  newUnworkedDelta:       number;
  readyToConvertDelta:    number;

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
  setActiveView:       (id: string) => void;
  clearActiveView:     () => void;
  setActiveInsight:    (insight: ActiveInsight) => void;
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

function isSortOption(s: string | undefined): s is SortOption {
  return s === 'score_high_low' || s === 'score_low_high' || s === 'name_az' || s === 'date_newest';
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
  const [sortBy,          setSortBy]          = useState<SortOption>('score_high_low');
  const [displayedCount,  setDisplayedCount]  = useState(PAGE_SIZE);
  const [filterState,     setFilterState]     = useState<FilterState>(DEFAULT_FILTER);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [activeLead,      setActiveLead]      = useState<Lead | null>(null);
  const [activeModal,     setActiveModal]     = useState<ModalId | null>(null);
  const [toast,           setToast]           = useState<ToastMessage | null>(null);
  // Saved views state
  const [activeViewId,    setActiveViewId]    = useState<string | null>(null);
  const [activeInsight,   setActiveInsightSt] = useState<ActiveInsight>(null);

  useEffect(() => {
    fetchLeads();
    fetchViews();
  }, [fetchLeads, fetchViews]);

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

  // ── Derived selectors ─────────────────────────────────────────────────────

  const domainLeads = useMemo(
    () => contextLeads.map(toLeadDomain),
    [contextLeads],
  );

  const overdueLeads = useMemo(() => {
    const now = new Date();
    return contextLeads.filter(
      l => l.next_follow_up_date && new Date(l.next_follow_up_date) < now,
    );
  }, [contextLeads]);

  const untouchedLeads = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return contextLeads.filter(
      l => !l.last_contact_date || new Date(l.last_contact_date) < cutoff,
    );
  }, [contextLeads]);

  const readyToConvertLeads = useMemo(
    () => contextLeads.filter(l => l.status === 'qualified'),
    [contextLeads],
  );

  const duplicateRiskLeads = useMemo(() => {
    const emailCounts: Record<string, number> = {};
    for (const lead of contextLeads) {
      if (lead.email) emailCounts[lead.email] = (emailCounts[lead.email] || 0) + 1;
    }
    return contextLeads.filter(l => l.email && emailCounts[l.email] > 1);
  }, [contextLeads]);

  const slaBreachedLeads = useMemo(() => {
    const now = new Date().getTime();
    return contextLeads.filter(lead => {
      if (lead.status !== 'new') return false;
      if (lead.last_contact_date) return false;
      const slaHours = lead.source === 'Website' ? 4 : 24;
      return now - new Date(lead.created_at).getTime() > slaHours * 3_600_000;
    });
  }, [contextLeads]);

  const newUnworkedLeads = useMemo(
    () => contextLeads.filter(
      l => l.status === 'new' && (l.last_contact_date == null),
    ),
    [contextLeads],
  );

  const sourceQualityThisWeek = useMemo((): SourceQuality => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    const dow = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - (dow === 0 ? 6 : dow - 1));

    const weeklyLeads = contextLeads.filter(l => new Date(l.created_at) >= weekStart);
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
  }, [contextLeads]);

  const filteredLeads = useMemo(() => {
    let base = contextLeads.filter(lead => {
      const matchesStatus = filterState.status === 'all' || lead.status === filterState.status;
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
    }

    return base;
  }, [contextLeads, filterState, searchQuery, activeInsight, overdueLeads, duplicateRiskLeads, untouchedLeads, readyToConvertLeads]);

  const sortedLeads = useMemo(() => [...filteredLeads].sort((a, b) => {
    if (sortBy === 'score_high_low') return getLeadScore(b) - getLeadScore(a);
    if (sortBy === 'score_low_high') return getLeadScore(a) - getLeadScore(b);
    if (sortBy === 'name_az')        return getLeadName(a).localeCompare(getLeadName(b));
    if (sortBy === 'date_newest')    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return 0;
  }), [filteredLeads, sortBy]);

  const paginatedLeads = useMemo(
    () => sortedLeads.slice(0, displayedCount),
    [sortedLeads, displayedCount],
  );

  const kpiMetrics = useMemo((): KpiMetrics => {
    const today = new Date().toDateString();
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    return {
      total:    contextLeads.length,
      newToday: contextLeads.filter(l => new Date(l.created_at).toDateString() === today).length,
      hot:      contextLeads.filter(l => getLeadScore(l) >= 80).length,
      importedThisWeek: contextLeads.filter(l => {
        const src = (l.source || '').toLowerCase();
        return (
          new Date(l.created_at) >= weekStart &&
          (src.includes('lead gen') || src.includes('hrms') || src.includes('apollo'))
        );
      }).length,
    };
  }, [contextLeads]);

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

  // ── Saved views actions ───────────────────────────────────────────────────

  const setActiveInsight = useCallback(
    (insight: ActiveInsight) => setActiveInsightSt(insight),
    [],
  );

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
      setFilterState(view.filters as FilterState ?? DEFAULT_FILTER);
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
          filters:      filterState,
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
    [createView, filterState, sortBy, searchQuery, viewMode, views.length, showToast],
  );

  const updateActiveView = useCallback(async () => {
    if (!activeViewId || activeViewId.startsWith('preset_')) return;
    try {
      await updateView(activeViewId, {
        filters:      filterState,
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

  // ── Return ─────────────────────────────────────────────────────────────────

  return {
    viewMode,
    searchQuery,
    sortBy,
    sortLabel: SORT_LABELS[sortBy],
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
    slaBreachedLeads,
    newUnworkedLeads,
    sourceQualityThisWeek,
    newUnworkedDelta,
    readyToConvertDelta,

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
    saveCurrentAsView,
    updateActiveView,
    renameView,
    pinView,
    reorderViews,
    deleteView,
  };
}
