import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '../../components/ui/Button';
import { formatCloseDate, formatRelativeTime, daysFromNow, daysFromNowLabel, parseDateMs } from '../../utils/dateUtils';
import { localDay } from '../../utils/dates';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Download, Settings, BarChart3, ChevronDown, ChevronUp, ArrowUp, ArrowDown, Building2, User, Sparkles, Mail, Phone, MoreHorizontal, CheckCircle2, AlertTriangle, Clock, Target, X, Copy, Trash2, Archive, StickyNote, CalendarPlus, ExternalLink, SlidersHorizontal, PauseCircle, UserX, Pencil, ArrowLeftRight, UserCog, Zap, FileText, CheckSquare, ClipboardList, Workflow, Link2, ListFilter, Swords, AlertCircle, Search, TrendingUp, TrendingDown } from 'lucide-react';
import { formatAmountUSD, formatAmountCompact, type SupportedCurrency, CURRENCY_SYMBOLS, getReportingAmount, convertToBaseCurrency } from '../../utils/currencyUtils';
import { explainDealHealth } from '../../utils/dealHealthDrivers';
import type { DealCard } from '../../components/Deal/DealKanbanCard';
import { getStageStyle } from '../../config/stageColors';
import { type ColumnKey, ALL_COLUMNS, DEFAULT_COLUMN_ORDER, DEFAULT_VISIBLE_COLUMNS } from '../../utils/dealsColumns';
import type { CloseDateFilter, ValueFilter, PipelineAgeFilter, HealthTierFilter } from '../../utils/dealsColumns';

import type { FilterCondition, Conjunction } from '../../components/Deal/AdvancedFilterBuilder';
import { useStalledConfig } from '../../hooks/useStalledConfig';
import { getNextBestAction } from '../../utils/dealNextBestAction';
import { getRelationshipRisk } from '../../utils/relationshipRisk';
import { getDealVelocity } from '../../utils/dealVelocity';
import { findDuplicatePairs } from '../../utils/duplicateDetection';
import type { DuplicatePair, DuplicatableDeal } from '../../utils/duplicateDetection';
import { getDealDataQuality } from '../../utils/dealDataQuality';
import {
  fetchPipelines, buildStageLookup, isWonWith, type ApiPipeline,
} from '../../utils/pipelinesApi';
import type { DataQualityIssue } from '../../utils/dealDataQuality';
import { fetchDealsPage } from '../../utils/dealsApi';
import { fetchUsers } from '../../utils/usersApi';
import { NotAvailableBadge } from '../../components/common/NotAvailable';
import { mapApiDeal } from '../../utils/dealCards';

// (The advanced filter builder's predicate lived here; no builder was ever
// rendered, and the list now filters on the server — slice 2b.)

interface Deal {
  id: string;
  companyName: string;
  dealName: string;
  accountName: string;
  amount: number;
  closeDate: string;
  stage: string;
  aiScore: number;
  /**
   * The stored probability with NULL preserved — see DealCard.probabilityRaw.
   * aiScore is `d.probability || 0` and cannot tell "unset" from an explicit 0%,
   * which the weighted forecast has to distinguish (design question 3).
   */
  probabilityRaw?: number | null;
  contactName: string;
  contactTitle: string;
  owner: string;
  lastActivity: string;
  daysSinceContact: number;
  priority: 'high' | 'medium' | 'low';
  health: 'excellent' | 'healthy' | 'at-risk' | 'critical';
  source: string;
  status?: string;
  nextStep?: string;
  nextStepDueDate?: string;
  createdAt?: string;
  // Relationship Risk fields — mock data until stakeholder API is available
  stakeholderCount?: number;
  hasChampion?: boolean;
  lastMeetingDaysAgo?: number | null;
  // Competitor tracking — mock data until deal_competitors join table is available
  primaryCompetitor?: string;
  secondaryCompetitors?: string[];
  // Multi-currency — native deal currency + pre-computed USD equivalent for reporting
  currency?: string;
  baseAmountUsd?: number;
  contactPhone?: string;
}

function getRowClassName(isExpanded: boolean, isSelected: boolean, isHovered: boolean, isActiveRow = false): string {
  const base = 'transition-colors duration-100 cursor-pointer border-l-2';
  if (isSelected) return `${base} bg-blue-50 border-l-blue-400`;
  if (isExpanded) return `${base} bg-indigo-50/30 border-l-indigo-300`;
  if (isActiveRow) return `${base} bg-indigo-50/50 border-l-indigo-400 ring-1 ring-inset ring-indigo-200`;
  if (isHovered)  return `${base} bg-[#F5F7FF] border-l-indigo-200`;
  return `${base} bg-white border-l-transparent`;
}

function MenuItem({
  icon, label, onClick, danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors text-left ${
        danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      <span className={danger ? 'text-red-400' : 'text-gray-400 flex-shrink-0'}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

/** Derives safe, trim-validated contact display values from a Deal. */
function getContactDisplay(deal: Deal) {
  const name  = deal.contactName?.trim() ?? '';
  const title = deal.contactTitle?.trim() ?? '';
  const hasName  = name.length > 0;
  const hasTitle = title.length > 0;
  const initials = hasName
    ? name.split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  return { hasName, hasTitle, displayName: name, displayTitle: title, initials };
}

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  deals: Deal[];
}

interface DealsListViewProps {
  stages: PipelineStage[];
  onDealClick: (dealId: string) => void;
  onStageChange?: (dealId: string, newStage: string) => void;
  onBulkAction?: (
    action: 'stage' | 'owner' | 'tag' | 'archive' | 'delete' | 'export',
    dealIds: string[],
    payload?: { stage?: string; owner?: string; tag?: string }
  ) => void;
  availableOwners?: string[];
  availableStages?: string[];
  onFieldUpdate?: (dealId: string, field: string, value: unknown) => Promise<void>;
  onAddNote?: (dealId: string) => void;
  onScheduleFollowUp?: (dealId: string) => void;
  externalFilters?: {
    stages?: Set<string>;
    owners?: Set<string>;
    sources?: Set<string>;
    healthTiers?: Set<HealthTierFilter>;
    closeDateFilter?: CloseDateFilter;
    valueFilter?: ValueFilter;
    pipelineAgeFilter?: PipelineAgeFilter;
  };
  onFiltersChange?: (filters: {
    stages: Set<string>;
    owners: Set<string>;
    sources: Set<string>;
    healthTiers: Set<HealthTierFilter>;
    closeDateFilter: CloseDateFilter;
    valueFilter: ValueFilter;
    pipelineAgeFilter: PipelineAgeFilter;
  }) => void;
  visibleColumns: Set<ColumnKey>;
  setVisibleColumns: React.Dispatch<React.SetStateAction<Set<ColumnKey>>>;
  columnOrder: ColumnKey[];
  setColumnOrder: React.Dispatch<React.SetStateAction<ColumnKey[]>>;
  activeKpiFilter: 'closingWeek' | 'stalled' | null;
  setActiveKpiFilter: React.Dispatch<React.SetStateAction<'closingWeek' | 'stalled' | null>>;
  currentUser?: string;
  totalPipelineDeals?: number;
  density?: 'standard' | 'compact';
  openDQDrawer?: boolean;
  onDQDrawerClose?: () => void;
  /**
   * Slice 2b: the list pages on the SERVER. The board's server filters
   * (pipeline, search, "My deals") arrive here; the list adds its own page,
   * sort and single Stage / Owner filter. `refreshKey` re-fetches after a write.
   */
  serverQuery: { pipeline_id?: string; search?: string; assigned_to_user_id?: string };
  /** Stage slug -> stage id, for the Stage filter (the server filters by id). */
  stageIds: Record<string, string>;
  /** Stage slug -> the column's server count, for the Stage filter's option counts. */
  stageTotals: Record<string, number>;
  refreshKey?: number;
}

/**
 * List sort keys the SERVER can order by (slice 2b). `flip`: deal AGE ascending
 * is created_at DESCENDING. Keys absent here (account, owner, contact, source,
 * competitor) are not sortable until the server can sort them.
 */
const LIST_SORT: Partial<Record<string, { sort: 'name' | 'base_amount_usd' | 'stage' | 'expected_close_date' | 'probability' | 'created_at'; flip?: boolean }>> = {
  deal: { sort: 'name' },
  value: { sort: 'base_amount_usd' },
  stage: { sort: 'stage' },
  closeDate: { sort: 'expected_close_date' },
  probability: { sort: 'probability' },
  dealAge: { sort: 'created_at', flip: true },
};

const MERGE_FIELDS: Array<{ key: keyof DuplicatableDeal; label: string }> = [
  { key: 'dealName',     label: 'Deal Name'  },
  { key: 'companyName',  label: 'Account'    },
  { key: 'amount',       label: 'Value'      },
  { key: 'closeDate',    label: 'Close Date' },
  { key: 'stage',        label: 'Stage'      },
  { key: 'owner',        label: 'Owner'      },
  { key: 'contactName',  label: 'Contact'    },
  { key: 'nextStep',     label: 'Next Step'  },
  { key: 'source',       label: 'Source'     },
  { key: 'priority',     label: 'Priority'   },
];

const STUB_SEQUENCES = [
  { id: 'new_lead',      name: 'New Lead Nurture',    steps: 5, description: 'Email + call sequence for new prospects' },
  { id: 'proposal',      name: 'Proposal Follow-up',  steps: 3, description: 'Follow up after proposal is sent' },
  { id: 'reengagement',  name: 'Re-engagement',       steps: 4, description: 'Win back stalled or cold deals' },
  { id: 'closing',       name: 'Closing Sequence',    steps: 2, description: 'Final push for deals in negotiation' },
] as const;

const KNOWN_COMPETITORS = [
  'Salesforce', 'HubSpot', 'Microsoft Dynamics', 'Oracle',
  'Zoho', 'Pipedrive', 'Monday CRM', 'SAP',
] as const;

// PERF NOTE: renderCell re-runs for all visible cells on each editValue keystroke.
// For tables > 500 rows, extract each editable cell as React.memo component.
// Current dataset is < 200 rows — acceptable without memoization.

const EDITABLE_FIELDS = ['value', 'stage', 'closeDate', 'owner', 'probability', 'nextStep'] as const;
type EditableField = typeof EDITABLE_FIELDS[number];

// ─────────────────────────────────────────────────────────────────────────────

const DealsListView: React.FC<DealsListViewProps> = ({
  stages, onDealClick, onStageChange, onBulkAction,
  availableOwners = [], onFieldUpdate, onAddNote, onScheduleFollowUp,
  externalFilters, onFiltersChange,
  visibleColumns, setVisibleColumns, columnOrder, setColumnOrder,
  activeKpiFilter, setActiveKpiFilter,
  currentUser = '',
  totalPipelineDeals,
  density: densityProp,
  openDQDrawer: openDQDrawerProp,
  onDQDrawerClose,
  serverQuery, stageIds, stageTotals, refreshKey = 0,
}) => {
  const stageOrder = useMemo(() => stages.map(st => st.id), [stages]);

  /*
   * Stage metadata for the velocity and data-quality engines.
   *
   * Both used to infer outcomes from the stage STRING — `.includes('won')`,
   * a four-slug ACTIVE_STAGES array — and both were already wrong on live data:
   * `partner-active` is the Partnerships won stage and contains none of "won",
   * "lost" or "closed", so a won deal was scored as an open one. They now take
   * the real stage, and return null / skip the check when it cannot be resolved
   * rather than guessing.
   */
  const [lvPipelines, setLvPipelines] = useState<ApiPipeline[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetchPipelines()
      .then(list => { if (!cancelled) setLvPipelines(list); })
      .catch(() => { /* lookup stays empty; both engines decline rather than guess */ });
    return () => { cancelled = true; };
  }, []);
  const stageLookup = useMemo(() => buildStageLookup(lvPipelines), [lvPipelines]);
  /** Resolve a deal's stage, using its own pipeline when the row carries one. */
  const metaFor = (d: { stage?: string | null; pipeline_id?: string | null }) =>
    stageLookup(d.stage, d.pipeline_id ?? null);

  const navigate = useNavigate();
  const { isStalled, getReasons, config: stalledConfig } = useStalledConfig();

  // NOTE: URL sync covers DealsListView (list mode) filters only.
  // KanbanPage-level filters (kanban/grid/calendar) are not URL-synced.
  // These two filter systems will be unified in a future refactor.
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Filter state (7 dimensions) ──────────────────────────────────────────
  const [selectedStages, setSelectedStages] = useState<Set<string>>(() => {
    const p = searchParams.get('stages');
    return p ? new Set(p.split(',').filter(Boolean)) : new Set();
  });
  const [selectedOwners, setSelectedOwners] = useState<Set<string>>(() => {
    const p = searchParams.get('owners');
    return p ? new Set(p.split(',').filter(Boolean)) : new Set();
  });
  const [closeDateFilter, setCloseDateFilter] = useState<CloseDateFilter>(() => {
    const preset = searchParams.get('closeDatePreset') as CloseDateFilter['preset'] | null;
    return {
      preset: preset ?? 'all',
      from: searchParams.get('closeDateFrom') ?? undefined,
      to: searchParams.get('closeDateTo') ?? undefined,
    };
  });
  const [valueFilter, setValueFilter] = useState<ValueFilter>(() => {
    const min = searchParams.get('valueMin');
    const max = searchParams.get('valueMax');
    return { min: min ? parseFloat(min) : null, max: max ? parseFloat(max) : null };
  });
  const [selectedSources, setSelectedSources] = useState<Set<string>>(() => {
    const p = searchParams.get('sources');
    return p ? new Set(p.split(',').filter(Boolean)) : new Set();
  });
  const [selectedHealthTiers, setSelectedHealthTiers] = useState<Set<HealthTierFilter>>(() => {
    // Deliberately ignores a `healthTiers` URL param: the filter is gone, and
    // reading it would count an active filter the user cannot see or clear.
    return new Set();
  });
  const [velocityFilter, setVelocityFilter] = useState<Set<'ahead' | 'slipping'>>(() => {
    const p = searchParams.get('velocity');
    return p ? new Set(p.split(',').filter(Boolean) as ('ahead' | 'slipping')[]) : new Set();
  });
  const [dealAgeFilter, setDealAgeFilter] = useState<{ min: number | null; max: number | null }>(() => {
    const min = searchParams.get('dealAgeMin');
    const max = searchParams.get('dealAgeMax');
    return { min: min ? parseInt(min) : null, max: max ? parseInt(max) : null };
  });
  const [pipelineAgeFilter, setPipelineAgeFilter] = useState<PipelineAgeFilter>(() => {
    const min = searchParams.get('pipelineAgeMin');
    const max = searchParams.get('pipelineAgeMax');
    return { min: min ? parseInt(min) : null, max: max ? parseInt(max) : null };
  });
  const [selectedCompetitors, setSelectedCompetitors] = useState<Set<string>>(() => {
    const p = searchParams.get('competitors');
    return p ? new Set(p.split(',').filter(Boolean)) : new Set();
  });
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const filterBarRef = useRef<HTMLDivElement>(null);

  // ── Advanced filter builder state (URL key: advancedFilters) ──────────────
  const [advancedConditions, setAdvancedConditions] = useState<FilterCondition[]>(() => {
    const p = searchParams.get('advancedFilters');
    if (!p) return [];
    try { return (JSON.parse(decodeURIComponent(p)) as { conditions: FilterCondition[] }).conditions ?? []; }
    catch { return []; }
  });
  const [advancedConjunction, setAdvancedConjunction] = useState<Conjunction>(() => {
    const p = searchParams.get('advancedFilters');
    if (!p) return 'AND';
    try { return (JSON.parse(decodeURIComponent(p)) as { conjunction: Conjunction }).conjunction ?? 'AND'; }
    catch { return 'AND'; }
  });

  const [sortBy, setSortBy] = useState<
    'deal' | 'account' | 'value' | 'stage' | 'closeDate'
    | 'owner' | 'contact' | 'probability' | 'dealAge' | 'source' | 'competitor'
  >('closeDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);
  const [contextMenuDeal, setContextMenuDeal] = useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [showStageModal, setShowStageModal] = useState<string | null>(null);
  const [showActionDropdown, setShowActionDropdown] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState<Deal | null>(null);
  const [showCallModal, setShowCallModal] = useState<Deal | null>(null);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [showDealNameFilter, setShowDealNameFilter] = useState(false);
  const columnPickerRef = useRef<HTMLTableCellElement>(null);
  const dragKey = useRef<ColumnKey | null>(null);
  const [openPopover, setOpenPopover] = useState<'stage' | 'owner' | 'tag' | 'archive' | null>(null);
  const [bulkToast, setBulkToast] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const headerCheckboxRef = useRef<HTMLInputElement>(null);
  const [archivedDealIds, setArchivedDealIds] = useState<Set<string>>(new Set());
  const [undoToast, setUndoToast] = useState<{ message: string; onUndo?: () => void; id: number } | null>(null);
  const [deleteConfirmDeal, setDeleteConfirmDeal] = useState<Deal | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const lastSelectedIndex = useRef<number | null>(null);

  // ── Dynamic table height: measure the sticky KPI+Stage section so the table fills exactly ──
  const kpiSectionRef = useRef<HTMLDivElement>(null);
  const [kpiSectionHeight, setKpiSectionHeight] = useState(220);
  useEffect(() => {
    const el = kpiSectionRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setKpiSectionHeight(el.offsetHeight));
    ro.observe(el);
    setKpiSectionHeight(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  // ── Dynamic table height: measure exact viewport offset of the table container ──
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [tableOffsetTop, setTableOffsetTop] = useState(320);
  const [filterBarHeight, setFilterBarHeight] = useState(44);
  useEffect(() => {
    const el = filterBarRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setFilterBarHeight(el.offsetHeight));
    ro.observe(el);
    setFilterBarHeight(el.offsetHeight);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const measure = () => {
      if (tableContainerRef.current) {
        setTableOffsetTop(tableContainerRef.current.getBoundingClientRect().top);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [kpiSectionHeight, filterBarHeight]);

  // ── Workflow modal state ────────────────────────────────────────────────────
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [scheduleFollowUpDeal, setScheduleFollowUpDeal] = useState<Deal | null>(null);
  const [createTaskDeal, setCreateTaskDeal] = useState<Deal | null>(null);
  const [logMeetingDeal, setLogMeetingDeal] = useState<Deal | null>(null);
  const [addSequenceDeal, setAddSequenceDeal] = useState<Deal | null>(null);

  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');

  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [taskAssignee, setTaskAssignee] = useState('');

  const [meetingOutcome, setMeetingOutcome] = useState<'demo_completed' | 'no_show' | 'follow_up_needed' | 'closed' | ''>('');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [meetingNextStep, setMeetingNextStep] = useState('');

  const [selectedSequence, setSelectedSequence] = useState('');
  const [competitorPopoverDealId, setCompetitorPopoverDealId] = useState<string | null>(null);
  const [customCompetitorInput, setCustomCompetitorInput] = useState('');

  // ── Density ─────────────────────────────────────────────────────────────────
  type Density = 'comfortable' | 'compact';
  const [density, setDensity] = useState<Density>(() => {
    try { return (localStorage.getItem('bmi_deals_density') as Density) ?? 'comfortable'; }
    catch { return 'comfortable'; }
  });
  useEffect(() => { localStorage.setItem('bmi_deals_density', density); }, [density]);
  const effectiveDensity: Density =
    typeof window !== 'undefined' && window.innerWidth < 768
      ? 'compact'
      : densityProp === 'compact' ? 'compact'
      : densityProp === 'standard' ? 'comfortable'
      : density;

  const [reportingCurrency, setReportingCurrency] = useState<SupportedCurrency>(() => {
    try { return (localStorage.getItem('bmi_deals_reporting_currency') as SupportedCurrency) ?? 'USD'; }
    catch { return 'USD'; }
  });
  useEffect(() => { localStorage.setItem('bmi_deals_reporting_currency', reportingCurrency); }, [reportingCurrency]);

  const [showIssuesOnly, setShowIssuesOnly] = useState(false);
  const [dealSearchTerm, setDealSearchTerm] = useState('');
  const [debouncedDealSearch, setDebouncedDealSearch] = useState('');
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const [expandedPanelTabs, setExpandedPanelTabs] = useState<Record<string, 'intelligence' | 'context' | 'timeline'>>({});
  const [rowsPerPage, setRowsPerPage] = useState<25 | 50 | 100>(25);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedDealSearch(dealSearchTerm.trim().toLowerCase()), 200);
    return () => clearTimeout(t);
  }, [dealSearchTerm]);

  useEffect(() => { setCurrentPage(0); }, [debouncedDealSearch, rowsPerPage]);

  const cellPadding        = effectiveDensity === 'compact' ? 'px-3 py-2' : 'px-4 py-3';
  const textSizeSecondary  = effectiveDensity === 'compact' ? 'text-[11px]' : 'text-xs';
  const avatarSize         = effectiveDensity === 'compact' ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 text-[11px]';

  // ── Duplicate detection state ───────────────────────────────────────────────
  const [dismissedPairs, setDismissedPairs] = useState<Set<string>>(new Set());
  const [duplicateDrawerOpen, setDuplicateDrawerOpen] = useState(false);
  const [showDQDrawer, setShowDQDrawer] = useState(false);
  useEffect(() => {
    if (openDQDrawerProp) {
      setShowDQDrawer(true);
      onDQDrawerClose?.();
    }
  }, [openDQDrawerProp]); // eslint-disable-line react-hooks/exhaustive-deps
  const [mergeTargetPair, setMergeTargetPair] = useState<DuplicatePair | null>(null);
  const [mergeSurvivor, setMergeSurvivor] = useState<'A' | 'B'>('A');
  const [mergeFieldOverrides, setMergeFieldOverrides] = useState<Record<string, 'A' | 'B'>>({});

  const [editingCell, setEditingCell] = useState<{ dealId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingCell, setSavingCell] = useState<{ dealId: string; field: string } | null>(null);
  const [localEdits, setLocalEdits] = useState<Record<string, Partial<Deal>>>({});
  const [errorCell, setErrorCell] = useState<{ dealId: string; field: string } | null>(null);
  const editInputRef = useRef<HTMLInputElement | HTMLSelectElement | null>(null);
  const commitEditRef = useRef<() => Promise<void>>(async () => {});

  const getDealAgeDays = (createdAt?: string): number => {
    if (!createdAt) return 0;
    return Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000);
  };

  /*
   * SLICE 2b — ONE PAGE FROM THE SERVER. This list used to flatten whatever the
   * board had loaded (50 deals) and filter, count, sort and page it in the
   * browser, with no page controls at all. Now it asks GET /deals for one page
   * under the board's filters plus its own sort, a single Stage and a single
   * Owner, and renders the server's total. Figures that need the whole set (the
   * KPI cards, duplicates, data-quality counts, the other filters) are "Coming
   * soon" until a later slice serves them.
   */
  const [serverRows, setServerRows] = useState<Deal[]>([]);
  const [serverTotal, setServerTotal] = useState(0);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const singleStage = selectedStages.size === 1 ? [...selectedStages][0] : undefined;
  const singleOwner = selectedOwners.size === 1 ? [...selectedOwners][0] : undefined;
  const listSort = LIST_SORT[sortBy];
  useEffect(() => {
    let cancelled = false;
    setLoadState('loading');
    fetchDealsPage({
      ...serverQuery,
      search: debouncedDealSearch || serverQuery.search,
      stage_id: singleStage ? stageIds[singleStage] : undefined,
      assigned_to: singleOwner,
      ...(listSort ? { sort: listSort.sort, dir: listSort.flip ? (sortOrder === 'asc' ? 'desc' : 'asc') : sortOrder } : {}),
      limit: rowsPerPage,
      offset: currentPage * rowsPerPage,
    })
      .then(page => {
        if (cancelled) return;
        setServerRows(page.deals.map(r => mapApiDeal(r, r.stage ?? '') as Deal));
        setServerTotal(page.total);
        setLoadState('ready');
        setLoadError(null);
      })
      .catch((e: Error) => { if (!cancelled) { setLoadState('error'); setLoadError(e.message); } });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverQuery.pipeline_id, serverQuery.search, serverQuery.assigned_to_user_id, debouncedDealSearch,
      singleStage, singleOwner, sortBy, sortOrder, rowsPerPage, currentPage, refreshKey, retryKey]);
  // A narrower query starts again at page 1.
  useEffect(() => { setCurrentPage(0); },
    [serverQuery.pipeline_id, serverQuery.search, serverQuery.assigned_to_user_id, singleStage, singleOwner, sortBy, sortOrder]);

  const [rosterNames, setRosterNames] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetchUsers()
      .then(us => { if (!cancelled) setRosterNames([...new Set(us.map(u => u.displayName).filter(Boolean))].sort()); })
      .catch(() => { /* no Owner filter rather than a guessed list */ });
    return () => { cancelled = true; };
  }, []);

  const allDeals = useMemo(
    () => serverRows.filter(d => !archivedDealIds.has(d.id)),
    [serverRows, archivedDealIds],
  );

  const stageFilterOptions = useMemo(
    () => [...new Set(allDeals.map(d => d.stage).filter(Boolean))].sort(),
    [allDeals]
  );

  // The per-option counts for the Stage / Owner / Source / Velocity / Deal-age
  // dropdowns were computed over the loaded deals — one page now. The Stage
  // filter shows the server's column totals instead; the rest are coming soon.

  const ownerFilterOptions = useMemo(
    () => availableOwners.length > 0
      ? availableOwners
      : [...new Set(allDeals.map(d => d.owner).filter(Boolean))].sort(),
    [allDeals, availableOwners]
  );

  const availableCompetitors = useMemo(() => {
    const all = new Set<string>();
    allDeals.forEach(d => {
      if (d.primaryCompetitor) all.add(d.primaryCompetitor);
      (d.secondaryCompetitors ?? []).forEach(c => all.add(c));
    });
    return [...all].sort();
  }, [allDeals]);

  const selectedDealSet = useMemo(() => new Set(selectedDeals), [selectedDeals]);

  // The server applied every filter it runs (stage, owner, search, the board's);
  // the others are "Coming soon", so nothing is filtered again in the browser.
  const filteredDeals = allDeals;

  // The KPI filters and "issues only" need the whole set — coming soon.
  const kpiFilteredDeals = filteredDeals;

  // The page arrives SORTED by the server (LIST_SORT); re-sorting one page in
  // the browser would disagree with the next page.
  const sortedDeals = kpiFilteredDeals;

  const totalPages = Math.max(1, Math.ceil(serverTotal / rowsPerPage));
  const pagedDeals = sortedDeals;

  const formatDate = formatCloseDate;

  const getStageName = (stageId: string) => {
    const stage = stages.find(s => s.id === stageId);
    return stage ? stage.name : stageId;
  };

  /*
   * ONE stage order, derived from the workspace's own columns.
   *
   * There were FOUR copies of the same six-slug literal in this file — the sort
   * comparator, this progress label, the stage summary strip and the stage
   * filter dropdown — and each was wrong in its own way for a pipeline outside
   * new-business: the comparator sorted every unknown stage to -1 and so ranked
   * a Renewals deal above Prospecting; this label rendered "0 of 6"; the summary
   * strip silently omitted those deals from its totals; the filter offered six
   * options that matched nothing.
   *
   * `stages` is the prop the Kanban already passes from GET /pipelines, so the
   * correct order was in scope the whole time.
   */




  const getStageProgress = (stageId: string) => {
    const i = stageOrder.indexOf(stageId);
    // Unknown stage: no position to report rather than "0 of 6".
    if (i === -1) return `— of ${stageOrder.length}`;
    return `${i + 1} of ${stageOrder.length}`;
  };

  const getInitials = (name: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Coerce Deal → DealCard shape so explainDealHealth can run on list-view rows.
  // Fields unavailable here (stakeholders, competitorCount) are omitted → those
  // specific drivers are skipped by explainDealHealth's null/undefined checks.
  const toDealCardLite = (deal: Deal): DealCard => ({
    id: deal.id,
    companyName: deal.companyName ?? '',
    dealName: deal.dealName ?? '',
    accountName: deal.accountName ?? '',
    amount: deal.amount,
    closeDate: deal.closeDate,
    stage: deal.stage,
    aiScore: deal.aiScore,
    contactName: deal.contactName ?? '',
    contactTitle: deal.contactTitle ?? '',
    owner: deal.owner ?? '',
    lastActivity: deal.lastActivity ?? '',
    daysSinceContact: deal.daysSinceContact ?? 0,
    priority: deal.priority ?? 'low',
    health: (['healthy', 'at-risk', 'stalled'] as const).includes(deal.health as never)
      ? (deal.health as 'healthy' | 'at-risk' | 'stalled')
      : deal.health === 'excellent' ? 'healthy'
      : deal.health === 'critical'  ? 'stalled'
      : 'healthy',
    source: deal.source ?? '',
    nextStep: deal.nextStep,
    nextStepDueDate: deal.nextStepDueDate,
  });

  const toggleRowExpansion = (dealId: string) => {
    setExpandedRows(prev =>
      prev.includes(dealId) ? prev.filter(id => id !== dealId) : [...prev, dealId]
    );
  };

  const toggleDealSelection = (dealId: string, shiftKey = false) => {
    const currentIndex = sortedDeals.findIndex(d => d.id === dealId);
    if (shiftKey && lastSelectedIndex.current !== null && currentIndex !== -1) {
      const start = Math.min(lastSelectedIndex.current, currentIndex);
      const end   = Math.max(lastSelectedIndex.current, currentIndex);
      const rangeIds = sortedDeals.slice(start, end + 1).map(d => d.id);
      setSelectedDeals(prev => Array.from(new Set([...prev, ...rangeIds])));
    } else {
      setSelectedDeals(prev =>
        prev.includes(dealId) ? prev.filter(id => id !== dealId) : [...prev, dealId]
      );
    }
    if (currentIndex !== -1) lastSelectedIndex.current = currentIndex;
  };

  const selectAllDeals = () => {
    if (selectedDeals.length === sortedDeals.length) {
      setSelectedDeals([]);
      lastSelectedIndex.current = null;
    } else {
      setSelectedDeals(sortedDeals.map(d => d.id));
    }
  };

  const handleSort = (column: typeof sortBy) => {
    if (!LIST_SORT[column]) return;   // the server cannot sort this column yet
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleContextMenu = (e: React.MouseEvent, dealId: string) => {
    e.preventDefault();
    setContextMenuDeal(dealId);
    setContextMenuPosition({ x: e.pageX, y: e.pageY });
  };

  const handleStageChange = (dealId: string, newStage: string) => {
    if (onStageChange) onStageChange(dealId, newStage);
    setShowStageModal(null);
  };

  const handleBulkDelete = () => {
    setBulkDeleteConfirm(true);
  };

  const showBulkToast = (message: string) => {
    setBulkToast(message);
    setTimeout(() => setBulkToast(null), 2500);
  };

  const showUndoToast = (message: string, onUndo?: () => void) => {
    const id = Date.now();
    setUndoToast({ message, onUndo, id });
    setTimeout(() => setUndoToast(prev => prev?.id === id ? null : prev), 5000);
  };

  const archiveDeal = (dealId: string, dealName: string) => {
    setArchivedDealIds(prev => new Set([...prev, dealId]));
    setContextMenuDeal(null);
    showUndoToast(`"${dealName}" archived`, () => {
      setArchivedDealIds(prev => { const next = new Set(prev); next.delete(dealId); return next; });
    });
  };

  const shareDeal = (deal: Deal) => {
    const url = `${window.location.origin}/crm/deals/${deal.id}`;
    navigator.clipboard.writeText(url)
      .then(() => showBulkToast('Deal link copied to clipboard'))
      .catch(() => showBulkToast('Could not copy link — try again'));
    setContextMenuDeal(null);
  };

  const openScheduleFollowUp = (deal: Deal) => {
    setFollowUpDate(''); setFollowUpTime(''); setFollowUpNotes('');
    setScheduleFollowUpDeal(deal);
  };
  const openCreateTask = (deal: Deal) => {
    setTaskTitle(''); setTaskDueDate(''); setTaskPriority('medium'); setTaskAssignee(deal.owner ?? '');
    setCreateTaskDeal(deal);
  };
  const openLogMeeting = (deal: Deal) => {
    setMeetingOutcome(''); setMeetingNotes(''); setMeetingNextStep('');
    setLogMeetingDeal(deal);
  };
  const openAddSequence = (deal: Deal) => {
    setSelectedSequence('');
    setAddSequenceDeal(deal);
  };

  const getDisplayValue = <K extends keyof Deal>(deal: Deal, key: K): Deal[K] =>
    ((localEdits[deal.id]?.[key] ?? deal[key]) as Deal[K]);

  const parseFieldUpdate = (field: string, rawValue: string): { dealKey: keyof Deal; value: unknown } | null => {
    const trimmed = rawValue.trim();
    switch (field) {
      case 'value': {
        const n = Number(trimmed);
        if (isNaN(n) || n < 0) return null;
        return { dealKey: 'amount', value: n };
      }
      case 'stage':     return trimmed ? { dealKey: 'stage',     value: trimmed } : null;
      case 'closeDate': return trimmed ? { dealKey: 'closeDate', value: trimmed } : null;
      case 'owner':     return trimmed ? { dealKey: 'owner',     value: trimmed } : null;
      case 'probability': {
        const n = Number(trimmed);
        if (isNaN(n) || n < 0 || n > 100) return null;
        return { dealKey: 'aiScore', value: n };
      }
      case 'nextStep':  return { dealKey: 'nextStep', value: trimmed };
      default:          return null;
    }
  };

  const startEdit = (dealId: string, field: string) => {
    const deal = allDeals.find(d => d.id === dealId);
    if (!deal) return;
    let initialValue = '';
    switch (field) {
      case 'value':       initialValue = String(getDisplayValue(deal, 'amount') ?? ''); break;
      case 'stage':       initialValue = getDisplayValue(deal, 'stage') ?? ''; break;
      case 'closeDate': {
        const raw = getDisplayValue(deal, 'closeDate') ?? '';
        if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
          initialValue = raw.slice(0, 10);
        } else {
          const ms = parseDateMs(raw);
          if (isFinite(ms)) initialValue = localDay(new Date(ms));
        }
        break;
      }
      case 'owner':       initialValue = getDisplayValue(deal, 'owner') ?? ''; break;
      case 'probability': initialValue = String(getDisplayValue(deal, 'aiScore') ?? ''); break;
      case 'nextStep':    initialValue = getDisplayValue(deal, 'nextStep') ?? ''; break;
    }
    setEditingCell({ dealId, field });
    setEditValue(initialValue);
  };

  const commitEdit = async () => {
    if (!editingCell) return;
    const { dealId, field } = editingCell;
    const parsed = parseFieldUpdate(field, editValue);
    if (parsed === null) {
      if (field === 'probability') {
        setErrorCell({ dealId, field });
        setTimeout(() => setErrorCell(null), 1500);
      }
      setEditingCell(null);
      return;
    }
    const origDeal = allDeals.find(d => d.id === dealId);
    const currentVal = origDeal
      ? (localEdits[dealId]?.[parsed.dealKey] ?? origDeal[parsed.dealKey])
      : undefined;
    if (String(parsed.value ?? '') === String(currentVal ?? '')) {
      setEditingCell(null);
      return;
    }
    setLocalEdits(prev => ({
      ...prev,
      [dealId]: { ...prev[dealId], [parsed.dealKey]: parsed.value as Deal[typeof parsed.dealKey] },
    }));
    setEditingCell(null);
    setSavingCell({ dealId, field });
    try {
      await onFieldUpdate?.(dealId, field, parsed.value);
    } catch {
      setLocalEdits(prev => {
        if (!prev[dealId]) return prev;
        const next = { ...prev };
        const copy = { ...prev[dealId] } as Record<string, unknown>;
        delete copy[parsed.dealKey];
        if (!Object.keys(copy).length) delete next[dealId];
        else next[dealId] = copy as Partial<Deal>;
        return next;
      });
      showBulkToast('Failed to save — change reverted');
    } finally {
      setSavingCell(null);
    }
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, dealId: string, field: string) => {
    if (e.key === 'Enter')  { e.preventDefault(); commitEdit(); return; }
    if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); return; }
    if (e.key === 'Tab') {
      e.preventDefault();
      commitEdit();
      const visibleEditableFields = EDITABLE_FIELDS.filter(f => visibleColumns.has(f as ColumnKey));
      const curFieldIdx  = visibleEditableFields.indexOf(field as EditableField);
      const curRowIdx    = sortedDeals.findIndex(d => d.id === dealId);
      let nextField: string | null = null;
      let nextDealId = dealId;
      if (!e.shiftKey) {
        if (curFieldIdx < visibleEditableFields.length - 1) {
          nextField = visibleEditableFields[curFieldIdx + 1];
        } else if (curRowIdx < sortedDeals.length - 1) {
          nextDealId = sortedDeals[curRowIdx + 1].id;
          nextField  = visibleEditableFields[0];
        }
      } else {
        if (curFieldIdx > 0) {
          nextField = visibleEditableFields[curFieldIdx - 1];
        } else if (curRowIdx > 0) {
          nextDealId = sortedDeals[curRowIdx - 1].id;
          nextField  = visibleEditableFields[visibleEditableFields.length - 1];
        }
      }
      if (nextField) setTimeout(() => startEdit(nextDealId, nextField!), 0);
    }
  };

  const commitImmediateSelect = async (dealId: string, field: string, value: string) => {
    const parsed = parseFieldUpdate(field, value);
    if (!parsed) return;
    setLocalEdits(prev => ({
      ...prev,
      [dealId]: { ...prev[dealId], [parsed.dealKey]: parsed.value as Deal[typeof parsed.dealKey] },
    }));
    setEditingCell(null);
    setSavingCell({ dealId, field });
    try {
      await onFieldUpdate?.(dealId, field, parsed.value);
    } catch {
      setLocalEdits(prev => {
        if (!prev[dealId]) return prev;
        const next = { ...prev };
        const copy = { ...prev[dealId] } as Record<string, unknown>;
        delete copy[parsed.dealKey];
        if (!Object.keys(copy).length) delete next[dealId];
        else next[dealId] = copy as Partial<Deal>;
        return next;
      });
      showBulkToast('Failed to save — change reverted');
    } finally {
      setSavingCell(null);
    }
  };

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      return next;
    });
  };

  const resetColumns = () => {
    setColumnOrder([...DEFAULT_COLUMN_ORDER]);
    setVisibleColumns(new Set(DEFAULT_VISIBLE_COLUMNS));
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenuDeal(null);
      setShowActionDropdown(null);
      setShowColumnSettings(false);
      setOpenPopover(null);
      setCompetitorPopoverDealId(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!headerCheckboxRef.current) return;
    headerCheckboxRef.current.indeterminate =
      selectedDeals.length > 0 && selectedDeals.length < kpiFilteredDeals.length;
  }, [selectedDeals, kpiFilteredDeals]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Guard: don't intercept when an input, textarea, or select has focus
      const tag = (document.activeElement as HTMLElement)?.tagName;
      const isInputFocused = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if (e.key === 'Escape') {
        if (editingCell) { setEditingCell(null); setEditValue(''); return; }
        if (openPopover) { setOpenPopover(null); return; }
        if (expandedRows.length > 0) { setExpandedRows([]); return; }
        if (activeRowIndex !== null) { setActiveRowIndex(null); return; }
        if (selectedDeals.length > 0) { setSelectedDeals([]); lastSelectedIndex.current = null; }
        return;
      }

      if (isInputFocused) return;

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveRowIndex(prev => {
          const next = prev === null ? 0 : Math.min(prev + 1, sortedDeals.length - 1);
          const el = document.getElementById(`deal-row-${sortedDeals[next]?.id}`);
          el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          return next;
        });
        return;
      }
      if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveRowIndex(prev => {
          const next = prev === null ? sortedDeals.length - 1 : Math.max(prev - 1, 0);
          const el = document.getElementById(`deal-row-${sortedDeals[next]?.id}`);
          el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          return next;
        });
        return;
      }
      if (e.key === 'Enter' && activeRowIndex !== null) {
        e.preventDefault();
        const deal = sortedDeals[activeRowIndex];
        if (deal) toggleRowExpansion(deal.id);
        return;
      }
      if (e.key === 'e' && activeRowIndex !== null) {
        e.preventDefault();
        const deal = sortedDeals[activeRowIndex];
        if (deal) startEdit(deal.id, 'owner');
        return;
      }
      if (e.key === 'x' && activeRowIndex !== null) {
        e.preventDefault();
        const deal = sortedDeals[activeRowIndex];
        if (deal) toggleDealSelection(deal.id);
        return;
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [editingCell, openPopover, selectedDeals, sortedDeals, activeRowIndex, expandedRows]);

  useEffect(() => {
    if (!editingCell) return;
    const handleMouseDown = (e: MouseEvent) => {
      const el = document.querySelector('[data-cell-editing="true"]');
      if (el && !el.contains(e.target as Node)) commitEditRef.current();
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [editingCell]);

  useEffect(() => {
    if (!openFilter) return;
    const handler = (e: MouseEvent) => {
      if (filterBarRef.current && !filterBarRef.current.contains(e.target as Node)) {
        setOpenFilter(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openFilter]);

  useEffect(() => {
    if (!showColumnSettings) return;
    const handler = (e: MouseEvent) => {
      if (columnPickerRef.current && !columnPickerRef.current.contains(e.target as Node)) {
        setShowColumnSettings(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showColumnSettings]);

  /*
   * The KPI computations (total value, win rate, closing this week, stalled,
   * avg days to close, weighted forecast) lived here and summed whatever the
   * browser had — one page under server paging (slice 2b), so they are "Coming
   * soon" until item 4 slice 5 serves them as server aggregates. Two rules they
   * encoded MUST carry over when that is built (see git history for the code):
   *   - WIN RATE is classified by stage_type (isWonWith / isLostWith), never by
   *     slug, so Renewals and Partnerships outcomes count;
   *   - WEIGHTED FORECAST excludes OPEN deals with no probability (probabilityRaw
   *     null) and reports how many it excluded — never value x 0.
   */
  const PIPELINE_STAGES = stageOrder;
  const stageSummary = useMemo(() => {
    const byStage: Record<string, { count: number; value: number }> = {};
    for (const s of PIPELINE_STAGES) byStage[s] = { count: 0, value: 0 };
    for (const d of filteredDeals) {
      if (byStage[d.stage]) {
        byStage[d.stage].count++;
        byStage[d.stage].value += getReportingAmount(d, reportingCurrency);
      }
    }
    return PIPELINE_STAGES.map(s => ({ stage: s, ...byStage[s] }));
  }, [filteredDeals, reportingCurrency]);

  const duplicatePairs = useMemo(() => {
    const pairs = findDuplicatePairs(allDeals);
    return pairs.filter(p => !dismissedPairs.has(p.pairKey));
  }, [allDeals, dismissedPairs]);

  const activePairCount = duplicatePairs.length;

  // DQ summary — counts from filteredDeals so it respects quick filters but NOT showIssuesOnly
  const dqSummary = useMemo(() => {
    let errors = 0;
    let warnings = 0;
    for (const d of filteredDeals) {
      const dq = getDealDataQuality(d, metaFor(d));
      if (dq.hasErrors) errors++;
      else if (dq.hasWarnings) warnings++;
    }
    return { errors, warnings, total: errors + warnings };
  }, [filteredDeals]);

  // Reset KPI shortcut when any dropdown filter changes to avoid phantom pills
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setActiveKpiFilter(null); }, [selectedStages, selectedOwners, closeDateFilter, valueFilter, selectedSources, selectedHealthTiers, pipelineAgeFilter, selectedCompetitors, advancedConditions]);

  commitEditRef.current = commitEdit;

  // ── URL sync ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    const set = (k: string, v: string | null) => {
      if (v) params.set(k, v); else params.delete(k);
    };
    set('stages',          selectedStages.size > 0 ? [...selectedStages].join(',') : null);
    set('owners',          selectedOwners.size > 0 ? [...selectedOwners].join(',') : null);
    set('closeDatePreset', closeDateFilter.preset !== 'all' ? closeDateFilter.preset : null);
    set('closeDateFrom',   closeDateFilter.from ?? null);
    set('closeDateTo',     closeDateFilter.to ?? null);
    set('valueMin',        valueFilter.min !== null ? String(valueFilter.min) : null);
    set('valueMax',        valueFilter.max !== null ? String(valueFilter.max) : null);
    set('sources',         selectedSources.size > 0 ? [...selectedSources].join(',') : null);
    set('healthTiers',     selectedHealthTiers.size > 0 ? [...selectedHealthTiers].join(',') : null);
    set('velocity',        velocityFilter.size > 0 ? [...velocityFilter].join(',') : null);
    set('dealAgeMin',      dealAgeFilter.min !== null ? String(dealAgeFilter.min) : null);
    set('dealAgeMax',      dealAgeFilter.max !== null ? String(dealAgeFilter.max) : null);
    set('pipelineAgeMin',  pipelineAgeFilter.min !== null ? String(pipelineAgeFilter.min) : null);
    set('pipelineAgeMax',  pipelineAgeFilter.max !== null ? String(pipelineAgeFilter.max) : null);
    set('competitors',     selectedCompetitors.size > 0 ? [...selectedCompetitors].join(',') : null);
    setSearchParams(params, { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStages, selectedOwners, closeDateFilter, valueFilter, selectedSources, selectedHealthTiers, velocityFilter, dealAgeFilter, pipelineAgeFilter, selectedCompetitors]);

  // ── URL sync: advanced filter builder ─────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (advancedConditions.length > 0) {
      params.set('advancedFilters', encodeURIComponent(
        JSON.stringify({ conjunction: advancedConjunction, conditions: advancedConditions })
      ));
    } else {
      params.delete('advancedFilters');
    }
    setSearchParams(params, { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advancedConditions, advancedConjunction]);

  // ── Apply external filters (from saved views via DealsKanbanPage) ──────────
  // Slice 2b: only ONE stage and ONE owner run on the server; a saved view's
  // other list filters are not applied (the board says so when it applies one).
  useEffect(() => {
    if (!externalFilters) return;
    if (externalFilters.stages) setSelectedStages(new Set([...externalFilters.stages].slice(0, 1)));
    if (externalFilters.owners) setSelectedOwners(new Set([...externalFilters.owners].slice(0, 1)));
  }, [externalFilters]);

  // Filters restored from a URL that the server cannot run are dropped on mount,
  // so a shared link never shows a list that LOOKS filtered by them.
  useEffect(() => {
    setSelectedStages(prev => new Set([...prev].slice(0, 1)));
    setSelectedOwners(prev => new Set([...prev].slice(0, 1)));
    setCloseDateFilter({ preset: 'all' });
    setValueFilter({ min: null, max: null });
    setSelectedSources(new Set());
    setSelectedHealthTiers(new Set());
    setVelocityFilter(new Set());
    setDealAgeFilter({ min: null, max: null });
    setPipelineAgeFilter({ min: null, max: null });
    setSelectedCompetitors(new Set());
    setAdvancedConditions([]);
  }, []);

  // ── Notify parent of filter changes (for saveCurrentView) ─────────────────
  useEffect(() => {
    onFiltersChange?.({ stages: selectedStages, owners: selectedOwners, sources: selectedSources,
      healthTiers: selectedHealthTiers, closeDateFilter, valueFilter, pipelineAgeFilter });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStages, selectedOwners, closeDateFilter, valueFilter, selectedSources, selectedHealthTiers, pipelineAgeFilter]);

  const clearAllFilters = () => {
    setSelectedStages(new Set());
    setSelectedOwners(new Set());
    setCloseDateFilter({ preset: 'all' });
    setValueFilter({ min: null, max: null });
    setSelectedSources(new Set());
    setSelectedHealthTiers(new Set());
    setVelocityFilter(new Set());
    setDealAgeFilter({ min: null, max: null });
    setPipelineAgeFilter({ min: null, max: null });
    setSelectedCompetitors(new Set());
    setAdvancedConditions([]);
    setShowIssuesOnly(false);
    setDealSearchTerm('');
  };

  const hasActiveFilters =
    selectedStages.size > 0 || selectedOwners.size > 0 ||
    closeDateFilter.preset !== 'all' ||
    valueFilter.min !== null || valueFilter.max !== null ||
    selectedSources.size > 0 || selectedHealthTiers.size > 0 || velocityFilter.size > 0 ||
    dealAgeFilter.min !== null || dealAgeFilter.max !== null ||
    pipelineAgeFilter.min !== null || pipelineAgeFilter.max !== null ||
    selectedCompetitors.size > 0 ||
    advancedConditions.length > 0 ||
    showIssuesOnly ||
    debouncedDealSearch !== '';

  const activeFilterCount =
    selectedStages.size + selectedOwners.size + selectedSources.size + selectedHealthTiers.size + velocityFilter.size +
    selectedCompetitors.size +
    (closeDateFilter.preset !== 'all' ? 1 : 0) +
    (valueFilter.min !== null || valueFilter.max !== null ? 1 : 0) +
    (dealAgeFilter.min !== null || dealAgeFilter.max !== null ? 1 : 0) +
    (pipelineAgeFilter.min !== null || pipelineAgeFilter.max !== null ? 1 : 0) +
    advancedConditions.length +
    (debouncedDealSearch ? 1 : 0);

  const HEALTH_TIER_LABELS: Record<HealthTierFilter, string> = {
    strong: 'Healthy',
    fair:   'Needs Attention',
    weak:   'At Risk',
  };

  const closeDatePresetLabel: Record<string, string> = {
    thisWeek: 'This Week', thisMonth: 'This Month',
    thisQuarter: 'This Quarter', overdue: 'Overdue',
    custom: `${closeDateFilter.from ?? ''}–${closeDateFilter.to ?? ''}`,
  };

  const FilterChip = ({
    label, color = 'indigo', onRemove,
  }: { label: string; color?: 'indigo' | 'green' | 'amber' | 'red' | 'purple' | 'blue' | 'orange' | 'teal'; onRemove: () => void }) => {
    const colorMap = {
      indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      green:  'bg-green-50  text-green-700  border-green-200',
      amber:  'bg-amber-50  text-amber-700  border-amber-200',
      red:    'bg-red-50    text-red-700    border-red-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
      blue:   'bg-blue-50   text-blue-700   border-blue-200',
      orange: 'bg-orange-50 text-orange-700 border-orange-200',
      teal:   'bg-teal-50   text-teal-700   border-teal-200',
    };
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${colorMap[color]}`}>
        {label}
        <button onClick={onRemove} className="ml-0.5 opacity-60 hover:opacity-100 text-current leading-none">×</button>
      </span>
    );
  };

  const fmtValK = (v: number) => {
    const sym = CURRENCY_SYMBOLS[reportingCurrency] ?? '$';
    return v >= 1000 ? `${sym}${(v / 1000).toFixed(0)}K` : `${sym}${Math.round(v)}`;
  };

  const showBulkActions = selectedDeals.length > 0;
  const orderedVisible = columnOrder.filter(k => visibleColumns.has(k));
  // +1 for the always-visible checkbox column
  const visibleColCount = 1 + orderedVisible.length;

  const SortIcon = ({ column }: { column: typeof sortBy }) => {
    if (!LIST_SORT[column]) return <span className="sr-only">(not sortable yet)</span>;
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const renderHeader = (key: ColumnKey): React.ReactNode => {
    const thBase = `text-left ${cellPadding} text-xs font-semibold text-gray-700 whitespace-nowrap border-l border-gray-200`;
    const thSort = thBase + ' cursor-pointer hover:bg-gray-50 select-none';
    // Responsive column visibility: P2=md+, P3=lg+, P4=xl+
    const p2 = 'hidden md:table-cell';
    const p3 = 'hidden lg:table-cell';
    const p4 = 'hidden xl:table-cell';
    switch (key) {
      case 'dealName':
        return (
          <th key="dealName" className={thSort} onClick={() => handleSort('deal')}>
            <div className="flex items-center gap-2">
              <span>Deal Name</span>
              <button
                onClick={e => { e.stopPropagation(); setShowDealNameFilter(v => !v); }}
                className="flex items-center gap-0.5 text-[11px] text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded px-1.5 py-0.5 leading-none transition-colors"
              >
                All <ChevronDown size={10} className="mt-px" />
              </button>
              <SortIcon column="deal" />
            </div>
          </th>
        );
      case 'account':
        return <th key="account" className={`${p3} ${thSort}`} onClick={() => handleSort('account')}><div className="flex items-center gap-1"><span>Account Name</span><SortIcon column="account" /></div></th>;
      case 'owner':
        return <th key="owner" className={`${p2} ${thSort}`} onClick={() => handleSort('owner')}><div className="flex items-center gap-1"><span>Owner</span><SortIcon column="owner" /></div></th>;
      case 'contact':
        return <th key="contact" className={`${p3} ${thSort}`} onClick={() => handleSort('contact')}><div className="flex items-center gap-1"><span>Primary Contact</span><SortIcon column="contact" /></div></th>;
      case 'value':
        return <th key="value" className={`${thSort} text-right`} onClick={() => handleSort('value')}><div className="flex items-center justify-end gap-1"><span>Amount</span><SortIcon column="value" /></div></th>;
      case 'stage':
        return <th key="stage" className={`${p2} ${thSort}`} onClick={() => handleSort('stage')}><div className="flex items-center gap-1"><span>Stage</span><SortIcon column="stage" /></div></th>;
      case 'closeDate':
        return (
          <th key="closeDate" className={`${p2} ${thSort}`} onClick={() => handleSort('closeDate')}>
            <div className="flex items-center gap-1">
              <span>Closing</span>
              <span className="text-gray-400 text-[11px] font-normal">*</span>
              <SortIcon column="closeDate" />
            </div>
          </th>
        );
      case 'lastActivity':
        return <th key="lastActivity" className={`${p4} ${thBase}`}>Last Activity</th>;
      case 'lastContact':
        return <th key="lastContact" className={`${p4} ${thSort}`} onClick={() => handleSort('lastActivity')}><div className="flex items-center gap-1"><span>Last Contact</span><SortIcon column="lastActivity" /></div></th>;
      case 'nextStep':
        return <th key="nextStep" className={`${p4} ${thBase}`}>Next Step</th>;
      case 'dealAge':
        return <th key="dealAge" className={`${p4} ${thSort}`} onClick={() => handleSort('dealAge')}><div className="flex items-center gap-1"><span>Pipeline</span><SortIcon column="dealAge" /></div></th>;
      case 'probability':
        return <th key="probability" className={`${p4} ${thSort}`} onClick={() => handleSort('probability')}><div className="flex items-center gap-1"><span>Probability</span><SortIcon column="probability" /></div></th>;
      case 'source':
        return <th key="source" className={`${p4} ${thSort}`} onClick={() => handleSort('source')}><div className="flex items-center gap-1"><span>Source</span><SortIcon column="source" /></div></th>;
      case 'relationship':
        return <th key="relationship" className={`${p2} ${thBase}`}>Relationship</th>;
      case 'competitor':
        return (
          <th key="competitor" className={`${p2} ${thSort}`} onClick={() => handleSort('competitor')}>
            <div className="flex items-center gap-1">
              <span>Competitor</span>
              <SortIcon column="competitor" />
            </div>
          </th>
        );
      case 'actions':
        return <th key="actions" className={`${thBase} text-center`}>Actions</th>;
      default:
        return null;
    }
  };

  const renderCell = (key: ColumnKey, deal: Deal, isExpanded: boolean): React.ReactNode => {
    switch (key) {
      case 'dealName':
        return (
          <td key="dealName" className={`${cellPadding} min-w-[240px] max-w-[280px]`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {isStalled(deal) && (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 align-middle" aria-label="Stalled" />
                  )}
                  <span
                    className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600 leading-snug line-clamp-2"
                    onClick={(e) => { e.stopPropagation(); navigate(`/crm/deals/${deal.id}`); }}
                  >
                    {deal.dealName}
                  </span>
                </div>
                {/* getNextBestAction() is a pure synchronous function — safe to call inline in render.
                    For >500 deals, memoize per deal.id using useMemo. */}
                {(() => {
                  const nba = getNextBestAction(deal, metaFor(deal));
                  if (nba.urgency === 'low') return null;
                  return (
                    <p className={`text-[11px] mt-0.5 truncate leading-tight flex items-center gap-1 ${nba.urgency === 'high' ? 'text-red-600' : 'text-amber-600'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${nba.urgency === 'high' ? 'bg-red-500' : 'bg-amber-400'}`} />
                      {nba.shortLabel}
                    </p>
                  );
                })()}
                {/* Pipeline Hygiene dot — only shown for deals with issues */}
                {(() => {
                  const dq = getDealDataQuality(deal, metaFor(deal));
                  if (dq.isClean) return null;
                  const errorCount = dq.issues.filter(i => i.severity === 'error').length;
                  const dotBg = dq.hasErrors ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700';
                  const dotFill = dq.hasErrors ? 'bg-red-500' : 'bg-amber-400';
                  const label = dq.hasErrors
                    ? `${errorCount} error${errorCount !== 1 ? 's' : ''}`
                    : `${dq.issues.length} warning${dq.issues.length !== 1 ? 's' : ''}`;
                  return (
                    <div className="relative group/dq-dot mt-0.5 inline-block">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-md border ${dotBg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotFill}`} />
                        {label}
                      </span>
                      {/* Hover tooltip */}
                      <div className="absolute bottom-full left-0 mb-2 z-50 hidden group-hover/dq-dot:block w-64 bg-gray-900 text-white text-xs rounded-xl px-4 py-3 shadow-xl pointer-events-none">
                        <p className="font-semibold text-gray-200 mb-2">Pipeline Hygiene Issues</p>
                        {dq.issues.map((issue, i) => (
                          <div key={i} className="flex items-start gap-1.5 mb-1">
                            <span className={issue.severity === 'error' ? 'text-red-400' : 'text-amber-400'}>
                              {issue.severity === 'error' ? '✗' : '⚠'}
                            </span>
                            <span className={issue.severity === 'error' ? 'text-gray-200' : 'text-gray-300'}>
                              {issue.message}
                            </span>
                          </div>
                        ))}
                        <p className="text-gray-500 mt-1.5 text-[10px]">Expand row to fix issues</p>
                        <div className="absolute top-full left-3 border-4 border-transparent border-t-gray-900" />
                      </div>
                    </div>
                  );
                })()}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); toggleRowExpansion(deal.id); }}
                className="flex-shrink-0 p-0.5 hover:bg-gray-100 rounded mt-0.5"
                aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                title={isExpanded ? 'Collapse' : 'Expand row'}
              >
                {isExpanded
                  ? <ChevronUp className="h-4 w-4 text-gray-400" />
                  : <ChevronDown className="h-4 w-4 text-gray-400" />}
              </button>
            </div>
          </td>
        );

      case 'account':
        return (
          <td key="account" className={`hidden lg:table-cell ${cellPadding} max-w-[200px]`}>
            {deal.companyName ? (
              <div className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                <span className="text-sm text-gray-500 truncate">{deal.companyName}</span>
              </div>
            ) : (
              <span className="text-sm text-gray-400">—</span>
            )}
          </td>
        );

      case 'owner': {
        const isEditing      = editingCell?.dealId === deal.id && editingCell?.field === 'owner';
        const isSaving       = savingCell?.dealId  === deal.id && savingCell?.field  === 'owner';
        const displayOwner   = getDisplayValue(deal, 'owner');
        const firstName      = displayOwner ? displayOwner.split(' ')[0] : '';
        const ownerOptions   = availableOwners.length > 0
          ? availableOwners
          : Array.from(new Set(allDeals.map(d => d.owner).filter(Boolean)));
        return (
          <td
            key="owner"
            data-cell-editing={isEditing ? 'true' : undefined}
            className={[
              `hidden md:table-cell ${cellPadding} cursor-text transition-colors`,
              isEditing ? 'bg-indigo-50/60 ring-1 ring-inset ring-indigo-400' : 'hover:bg-indigo-50/30',
            ].join(' ')}
            onClick={(e) => { e.stopPropagation(); if (!isEditing) startEdit(deal.id, 'owner'); }}
          >
            {isEditing ? (
              <select
                className="text-sm bg-white border border-indigo-300 rounded-md px-2 py-1 outline-none w-full"
                value={editValue}
                onChange={e => commitImmediateSelect(deal.id, 'owner', e.target.value)}
                onKeyDown={e => { if (e.key === 'Escape') cancelEdit(); }}
                onBlur={cancelEdit}
                autoFocus
              >
                {ownerOptions.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            ) : (
              <div className={`${isSaving ? 'animate-pulse opacity-60' : ''}`}>
                {displayOwner ? (
                  <div className="flex items-center gap-1.5">
                    <div className={`${avatarSize} rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0`}>
                      <span className="font-semibold text-indigo-700">{getInitials(displayOwner)}</span>
                    </div>
                    <span className="text-sm text-gray-600 truncate max-w-[80px] block">{firstName}</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </div>
            )}
          </td>
        );
      }

      case 'contact': {
        const { hasName, hasTitle, displayName, displayTitle, initials } = getContactDisplay(deal);
        if (!hasName) {
          return (
            <td key="contact" className={`hidden lg:table-cell ${cellPadding} text-sm`}>
              <span className="text-gray-400">—</span>
            </td>
          );
        }
        return (
          <td key="contact" className={`hidden lg:table-cell ${cellPadding}`}>
            <div className="flex items-start gap-2">
              <div className={`${avatarSize} rounded-full bg-violet-100 text-violet-700 font-bold flex items-center justify-center shrink-0 mt-0.5`}>
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{displayName}</p>
                {hasTitle && (
                  <p className={`${textSizeSecondary} text-gray-500 truncate max-w-[160px]`}>{displayTitle}</p>
                )}
              </div>
            </div>
          </td>
        );
      }

      case 'value': {
        const isEditing = editingCell?.dealId === deal.id && editingCell?.field === 'value';
        const isSaving  = savingCell?.dealId  === deal.id && savingCell?.field  === 'value';
        const isError   = errorCell?.dealId   === deal.id && errorCell?.field   === 'value';
        const displayAmount = getDisplayValue(deal, 'amount');
        return (
          <td
            key="value"
            data-cell-editing={isEditing ? 'true' : undefined}
            className={[
              `${cellPadding} text-right cursor-text transition-colors`,
              isEditing ? 'bg-indigo-50/60 ring-1 ring-inset ring-indigo-400' : 'hover:bg-indigo-50/30',
              isError   ? 'ring-1 ring-inset ring-red-400 bg-red-50/40' : '',
            ].join(' ')}
            onClick={(e) => { e.stopPropagation(); if (!isEditing) startEdit(deal.id, 'value'); }}
          >
            {isEditing ? (
              <input
                type="number"
                min={0}
                className="w-full bg-transparent text-indigo-600 font-semibold text-sm outline-none border-none p-0 text-right tabular-nums"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={e => handleEditKeyDown(e, deal.id, 'value')}
                autoFocus
              />
            ) : (
              <div className={`${isSaving ? 'animate-pulse opacity-60' : ''}`}>
                <div className="text-sm font-semibold text-gray-900 tabular-nums">
                  {formatAmountCompact(displayAmount, deal.currency ?? 'USD')}
                </div>
                {(deal.currency ?? 'USD') !== reportingCurrency && (
                  <div className="text-[10px] text-gray-400 tabular-nums leading-tight">
                    ~{formatAmountCompact(getReportingAmount(deal, reportingCurrency), reportingCurrency)} {reportingCurrency}
                  </div>
                )}
              </div>
            )}
          </td>
        );
      }

      case 'stage': {
        const isEditing     = editingCell?.dealId === deal.id && editingCell?.field === 'stage';
        const isSaving      = savingCell?.dealId  === deal.id && savingCell?.field  === 'stage';
        const displayStage  = getDisplayValue(deal, 'stage');
        const displayColor  = getStageStyle(displayStage);
        return (
          <td
            key="stage"
            data-cell-editing={isEditing ? 'true' : undefined}
            className={[
              `hidden md:table-cell ${cellPadding} cursor-text transition-colors`,
              isEditing ? 'bg-indigo-50/60 ring-1 ring-inset ring-indigo-400' : 'hover:bg-indigo-50/30',
            ].join(' ')}
            onClick={(e) => { e.stopPropagation(); if (!isEditing) startEdit(deal.id, 'stage'); }}
          >
            {isEditing ? (
              <select
                className="text-xs bg-white border border-indigo-300 rounded-md px-2 py-1 outline-none font-medium w-full"
                value={editValue}
                onChange={e => commitImmediateSelect(deal.id, 'stage', e.target.value)}
                onKeyDown={e => { if (e.key === 'Escape') cancelEdit(); }}
                onBlur={cancelEdit}
                autoFocus
              >
                {stages.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            ) : (
              <div className="relative">
                <div
                  className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium ${isSaving ? 'animate-pulse opacity-60' : ''}`}
                  style={{ backgroundColor: displayColor.bg, color: displayColor.text }}
                  onMouseEnter={() => setHoveredStage(deal.id)}
                  onMouseLeave={() => setHoveredStage(null)}
                >
                  {getStageName(displayStage)}
                </div>
                <div className="text-xs text-gray-500 tabular-nums mt-1">
                  Stage {getStageProgress(displayStage)}
                </div>
                {/* Velocity chip — pace vs close-date budget */}
                {(() => {
                  const vel = getDealVelocity(deal, metaFor(deal));
                  if (!vel) return null;
                  const chipStyle = vel.rating === 'ahead'
                    ? 'bg-green-100 text-green-700 border-green-300'
                    : vel.rating === 'on-track'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : vel.rating === 'new'
                    ? 'bg-gray-100 text-gray-500 border-gray-200'
                    : 'bg-red-50 text-red-700 border-red-200';
                  const arrow = vel.rating === 'ahead' ? '↑'
                    : vel.rating === 'on-track' ? '→'
                    : vel.rating === 'new' ? '–'
                    : '↓';
                  return (
                    <div className="group/vel-chip relative inline-block mt-1">
                      <div className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium border cursor-default ${chipStyle}`}>
                        <span>{arrow}</span>
                        <span>{vel.label}</span>
                      </div>
                      <div className="pointer-events-none absolute bottom-full left-0 mb-1.5 z-50 w-52
                                      opacity-0 group-hover/vel-chip:opacity-100 transition-opacity duration-150">
                        <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2.5 shadow-xl">
                          <p className="font-semibold mb-1.5">Deal Velocity</p>
                          <div className="space-y-1">
                            <div className="flex justify-between gap-4">
                              <span className="text-gray-300">Stage progress</span>
                              <span className="font-medium">{Math.round(vel.stageProgress * 100)}%</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-gray-300">Time used</span>
                              <span className="font-medium">{Math.round(vel.timeConsumed * 100)}%</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-gray-300">Velocity ratio</span>
                              <span className="font-medium">{vel.velocityRatio.toFixed(2)}x</span>
                            </div>
                            <div className="mt-1.5 pt-1.5 border-t border-gray-700 text-gray-300 text-[10px]">
                              {vel.daysInPipeline}d in pipeline · {vel.totalBudgetDays}d budget
                            </div>
                          </div>
                        </div>
                        <div className="w-0 h-0 mx-3 border-l-4 border-r-4 border-t-4
                                        border-l-transparent border-r-transparent border-t-gray-900" />
                      </div>
                    </div>
                  );
                })()}
                {hoveredStage === deal.id && (
                  <div className="absolute left-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50">
                    <div className="text-sm font-semibold text-gray-900 mb-3">Deal Progress:</div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-gray-700">Prospecting (5 days)</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-gray-700">Qualified (8 days)</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-gray-700">Proposal (12 days)</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm font-medium">
                        <div className="h-4 w-4 flex items-center justify-center">➡️</div>
                        <span className="text-gray-900">{getStageName(displayStage)} (15 days) [NOW]</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                        <span>Closed-Won</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                        <span>Closed-Lost</span>
                      </div>
                    </div>
                    {/* Stage-duration summary removed. "Total: 40 days in pipeline"
                        was a hardcoded literal, and `avgDaysCycle` was never
                        declared anywhere in this file — it rendered as nothing.
                        The type checker could not report it while the Sequences
                        parse error was suppressing all semantic errors.
                        Restore it from deal_stage_history (migration 014), which
                        now records the transitions needed to compute a real
                        cycle time. */}
                  </div>
                )}
              </div>
            )}
          </td>
        );
      }

      case 'closeDate': {
        const isEditing     = editingCell?.dealId === deal.id && editingCell?.field === 'closeDate';
        const isSaving      = savingCell?.dealId  === deal.id && savingCell?.field  === 'closeDate';
        const displayDate   = getDisplayValue(deal, 'closeDate');
        return (
          <td
            key="closeDate"
            data-cell-editing={isEditing ? 'true' : undefined}
            className={[
              `hidden md:table-cell ${cellPadding} cursor-text transition-colors`,
              isEditing ? 'bg-indigo-50/60 ring-1 ring-inset ring-indigo-400' : 'hover:bg-indigo-50/30',
            ].join(' ')}
            onClick={(e) => { e.stopPropagation(); if (!isEditing) startEdit(deal.id, 'closeDate'); }}
          >
            {isEditing ? (
              <input
                type="date"
                className="text-sm bg-transparent border-none outline-none"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={e => handleEditKeyDown(e, deal.id, 'closeDate')}
                autoFocus
              />
            ) : (() => {
              const closeDays = displayDate ? daysFromNow(displayDate) : null;
              const closeDateColor = closeDays === null ? 'text-gray-400'
                : closeDays < 0  ? 'text-red-600 font-medium'
                : closeDays <= 7 ? 'text-amber-600 font-medium'
                : 'text-gray-600';
              return (
                <div className={isSaving ? 'animate-pulse opacity-60' : ''}>
                  <div className={`text-sm ${closeDateColor}`}>{formatDate(displayDate)}</div>
                  <div className="text-xs text-gray-500">{daysFromNowLabel(displayDate)}</div>
                </div>
              );
            })()}
          </td>
        );
      }

      case 'lastActivity': {
        const stallReasons = isStalled(deal) ? getReasons(deal) : null;
        return (
          <td key="lastActivity" className={`hidden xl:table-cell ${cellPadding}`}>
            <div className="flex items-center gap-2 flex-wrap">
              {deal.lastActivity ? (
                <span className={`${textSizeSecondary} text-gray-500`}>{formatRelativeTime(deal.lastActivity, '')}</span>
              ) : (
                <span className={`${textSizeSecondary} text-gray-500`}>No activity</span>
              )}
              {stallReasons && (
                <div className="relative inline-block group/stall">
                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full cursor-default">
                    <PauseCircle size={11} />
                    Stalled
                  </span>
                  {stallReasons.length > 0 && (
                    <div className="absolute bottom-full left-0 mb-2 z-50 hidden group-hover/stall:block w-max max-w-[220px] bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none">
                      <p className="font-semibold mb-1 text-amber-300">Why stalled:</p>
                      {stallReasons.map((r, i) => (
                        <p key={i} className="text-gray-200">· {r}</p>
                      ))}
                      <div className="absolute top-full left-3 border-4 border-transparent border-t-gray-900" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </td>
        );
      }

      case 'lastContact': {
        const dsc = deal.daysSinceContact ?? 999;
        const dayBadgeCls = dsc <= 7   ? 'bg-green-100 text-green-700 border-green-200'
          : dsc <= 14  ? 'bg-amber-100 text-amber-700 border-amber-200'
          : dsc <= 30  ? 'bg-orange-100 text-orange-700 border-orange-200'
          : 'bg-red-100 text-red-700 border-red-200';
        return (
          <td key="lastContact" className={`hidden lg:table-cell ${cellPadding}`}>
            {deal.lastActivity ? (
              <div className="flex items-center gap-1.5">
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${dayBadgeCls} tabular-nums`}>
                  {dsc <= 999 ? `${dsc}d` : '—'}
                </span>
                {dsc > 30 && <AlertCircle size={11} className="text-red-400 shrink-0" title="Overdue — last contact over 30 days ago" />}
              </div>
            ) : (
              <span className="text-xs text-gray-400">Never</span>
            )}
          </td>
        );
      }

      case 'nextStep': {
        const isEditing       = editingCell?.dealId === deal.id && editingCell?.field === 'nextStep';
        const isSaving        = savingCell?.dealId  === deal.id && savingCell?.field  === 'nextStep';
        const displayNextStep = getDisplayValue(deal, 'nextStep');
        const daysUntilDue = deal.nextStepDueDate ? daysFromNow(deal.nextStepDueDate) : null;
        const urgencyBadge = daysUntilDue !== null
          ? daysUntilDue < 0
            ? <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold bg-red-100 text-red-700 rounded flex-shrink-0">Late</span>
            : daysUntilDue === 0
              ? <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold bg-orange-100 text-orange-700 rounded flex-shrink-0">Today</span>
              : daysUntilDue <= 2
                ? <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded flex-shrink-0">{daysUntilDue}d</span>
                : null
          : null;
        return (
          <td
            key="nextStep"
            data-cell-editing={isEditing ? 'true' : undefined}
            className={[
              `hidden xl:table-cell ${cellPadding} max-w-[200px] cursor-text transition-colors`,
              isEditing ? 'bg-indigo-50/60 ring-1 ring-inset ring-indigo-400' : 'hover:bg-indigo-50/30',
            ].join(' ')}
            onClick={(e) => { e.stopPropagation(); if (!isEditing) startEdit(deal.id, 'nextStep'); }}
          >
            {isEditing ? (
              <input
                type="text"
                className="w-full text-sm bg-transparent outline-none border-none p-0 placeholder-gray-300"
                placeholder="Add next step…"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={e => handleEditKeyDown(e, deal.id, 'nextStep')}
                autoFocus
              />
            ) : (
              <div className={isSaving ? 'animate-pulse opacity-60' : ''}>
                {displayNextStep ? (
                  <div className="flex items-center">
                    <span className="text-sm text-gray-700 truncate">{displayNextStep}</span>
                    {urgencyBadge}
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </div>
            )}
          </td>
        );
      }

      case 'dealAge': {
        const ageDays = getDealAgeDays(deal.createdAt);
        const ageLabel = ageDays < 1 ? '<1d' : `${ageDays}d`;
        const ageCls = ageDays < 14
          ? 'bg-gray-100 text-gray-600'
          : ageDays < 30
            ? 'bg-amber-100 text-amber-700'
            : 'bg-red-100 text-red-700';
        return (
          <td key="dealAge" className={`hidden xl:table-cell ${cellPadding}`}>
            <span
              title="Days since deal was created (stage tracking not yet available)"
              className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-full tabular-nums ${ageCls}`}
            >
              {ageLabel}
            </span>
          </td>
        );
      }

      case 'probability': {
        const isEditing = editingCell?.dealId === deal.id && editingCell?.field === 'probability';
        const isSaving  = savingCell?.dealId  === deal.id && savingCell?.field  === 'probability';
        const isError   = errorCell?.dealId   === deal.id && errorCell?.field   === 'probability';
        const prob      = getDisplayValue(deal, 'aiScore');
        const probCls   = prob >= 70
          ? 'bg-green-100 text-green-700'
          : prob >= 40
            ? 'bg-amber-100 text-amber-700'
            : 'bg-red-100 text-red-700';
        return (
          <td
            key="probability"
            data-cell-editing={isEditing ? 'true' : undefined}
            className={[
              `hidden xl:table-cell ${cellPadding} cursor-text transition-colors`,
              isEditing ? 'bg-indigo-50/60 ring-1 ring-inset ring-indigo-400' : 'hover:bg-indigo-50/30',
              isError   ? 'ring-1 ring-inset ring-red-400 bg-red-50/40' : '',
            ].join(' ')}
            onClick={(e) => { e.stopPropagation(); if (!isEditing) startEdit(deal.id, 'probability'); }}
          >
            {isEditing ? (
              <input
                type="number"
                min={0}
                max={100}
                className={`w-16 text-sm bg-transparent outline-none border-none p-0 ${isError ? 'text-red-600' : ''}`}
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={e => handleEditKeyDown(e, deal.id, 'probability')}
                autoFocus
              />
            ) : (
              <span className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-full ${probCls} ${isSaving ? 'animate-pulse opacity-60' : ''}`}>
                {prob}%
              </span>
            )}
          </td>
        );
      }

      case 'source':
        return (
          <td key="source" className={`hidden xl:table-cell ${cellPadding}`}>
            {deal.source ? (
              <span className={`bg-gray-100 text-gray-500 ${textSizeSecondary} font-medium px-2 py-0.5 rounded-full`}>
                {deal.source}
              </span>
            ) : (
              <span className="text-sm text-gray-400">—</span>
            )}
          </td>
        );

      case 'relationship': {
        const relRisk = getRelationshipRisk(deal);
        const relTierConfig = {
          strong: { pill: 'text-green-700 bg-green-50 border-green-200', label: 'Strong' },
          fair:   { pill: 'text-amber-700 bg-amber-50 border-amber-200', label: 'Fair'   },
          weak:   { pill: 'text-red-700 bg-red-50 border-red-200',       label: 'Weak'   },
        };
        const relCfg = relTierConfig[relRisk.tier];
        return (
          <td key="relationship" className={`hidden md:table-cell ${cellPadding}`}>
            <div className="relative group/rel-cell inline-block">
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${relCfg.pill}`}>
                ◈ {relCfg.label}
              </span>
              {/* Hover tooltip with named signal breakdown */}
              <div className="absolute bottom-full left-0 mb-2 z-50 hidden group-hover/rel-cell:block w-64 bg-gray-900 text-white text-xs rounded-xl px-4 py-3 shadow-xl pointer-events-none">
                <p className="font-semibold text-gray-200 mb-2">Relationship: {relCfg.label}</p>
                {relRisk.signals.map((sig, i) => (
                  <div key={i} className="flex items-start gap-1.5 mb-1">
                    <span className={sig.passed ? 'text-green-400' : 'text-red-400'}>
                      {sig.passed ? '✓' : '✗'}
                    </span>
                    <span className={sig.passed ? 'text-gray-300' : 'text-gray-100'}>{sig.detail ?? sig.label}</span>
                  </div>
                ))}
                <p className="text-indigo-300 mt-2 border-t border-gray-700 pt-2 leading-snug">
                  → {relRisk.actionSuggestion}
                </p>
                <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-900" />
              </div>
            </div>
          </td>
        );
      }

      case 'competitor': {
        const effectiveForComp = localEdits[deal.id] ? { ...deal, ...localEdits[deal.id] } : deal;
        const primary = effectiveForComp.primaryCompetitor;
        const secondaries = effectiveForComp.secondaryCompetitors ?? [];
        const isOpen = competitorPopoverDealId === deal.id;
        return (
          <td key="competitor" className={`hidden md:table-cell ${cellPadding} relative`} onClick={e => e.stopPropagation()}>
            <div className="relative group/comp">
              {/* Trigger button */}
              <button
                onClick={(e) => { e.stopPropagation(); setCompetitorPopoverDealId(isOpen ? null : deal.id); setCustomCompetitorInput(''); }}
                className="flex items-center gap-1"
              >
                {primary ? (
                  <>
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 whitespace-nowrap">
                      <Swords size={10} className="shrink-0" />
                      {primary}
                    </span>
                    {secondaries.length > 0 && (
                      <span className="text-xs text-gray-400 font-medium shrink-0">+{secondaries.length}</span>
                    )}
                  </>
                ) : (
                  <span className="text-gray-300 text-sm hover:text-gray-400">—</span>
                )}
              </button>

              {/* Hover tooltip — only when not editing */}
              {primary && !isOpen && (
                <div className="pointer-events-none absolute bottom-full left-0 mb-2 z-50 opacity-0 group-hover/comp:opacity-100 transition-opacity duration-150 w-52">
                  <div className="bg-gray-900 text-white text-xs rounded-xl px-3 py-2.5 shadow-xl">
                    <p className="font-semibold text-gray-300 mb-1.5">Competitors</p>
                    <div className="space-y-1">
                      <div className="flex items-start gap-1.5">
                        <span className="text-teal-400 text-[10px] font-bold uppercase tracking-wide w-14 shrink-0">Primary</span>
                        <span>{primary}</span>
                      </div>
                      {secondaries.map((s, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wide w-14 shrink-0">Also</span>
                          <span className="text-gray-300">{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="w-0 h-0 mx-3 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
                </div>
              )}

              {/* Inline edit popover */}
              {isOpen && (
                <div
                  className="absolute top-full left-0 mt-1 z-50 w-64 bg-white border border-gray-200 rounded-2xl shadow-xl p-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Competitors</p>

                  <div className="mb-3">
                    <label className="text-xs text-gray-500 mb-1 block">Primary competitor</label>
                    <select aria-label="Primary competitor"
                      value={effectiveForComp.primaryCompetitor ?? ''}
                      onChange={e => {
                        const val = e.target.value || undefined;
                        setLocalEdits(prev => ({
                          ...prev,
                          [deal.id]: { ...prev[deal.id], primaryCompetitor: val },
                        }));
                        onFieldUpdate?.(deal.id, 'primaryCompetitor', val ?? null);
                      }}
                      className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white outline-none focus:border-indigo-400"
                    >
                      <option value="">None</option>
                      {KNOWN_COMPETITORS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="text-xs text-gray-500 mb-1.5 block">Also competing against</label>
                    <div className="flex flex-wrap gap-1.5">
                      {KNOWN_COMPETITORS.filter(c => c !== effectiveForComp.primaryCompetitor).map(c => {
                        const isSel = secondaries.includes(c);
                        return (
                          <button
                            key={c}
                            onClick={() => {
                              const next = isSel ? secondaries.filter(x => x !== c) : [...secondaries, c];
                              setLocalEdits(prev => ({
                                ...prev,
                                [deal.id]: { ...prev[deal.id], secondaryCompetitors: next },
                              }));
                              onFieldUpdate?.(deal.id, 'secondaryCompetitors', next);
                            }}
                            className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                              isSel
                                ? 'bg-teal-50 text-teal-700 border-teal-300'
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {c}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="text-xs text-gray-500 mb-1 block">Add unlisted competitor</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customCompetitorInput}
                        onChange={e => setCustomCompetitorInput(e.target.value)}
                        placeholder="Type name…"
                        className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-indigo-400"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && customCompetitorInput.trim()) {
                            const val = customCompetitorInput.trim();
                            if (!secondaries.includes(val)) {
                              const next = [...secondaries, val];
                              setLocalEdits(prev => ({
                                ...prev,
                                [deal.id]: { ...prev[deal.id], secondaryCompetitors: next },
                              }));
                              onFieldUpdate?.(deal.id, 'secondaryCompetitors', next);
                            }
                            setCustomCompetitorInput('');
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (customCompetitorInput.trim()) {
                            const val = customCompetitorInput.trim();
                            if (!secondaries.includes(val)) {
                              const next = [...secondaries, val];
                              setLocalEdits(prev => ({
                                ...prev,
                                [deal.id]: { ...prev[deal.id], secondaryCompetitors: next },
                              }));
                              onFieldUpdate?.(deal.id, 'secondaryCompetitors', next);
                            }
                            setCustomCompetitorInput('');
                          }
                        }}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 px-2"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setCompetitorPopoverDealId(null)}
                    className="w-full text-xs text-gray-400 hover:text-gray-600 text-center mt-1"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </td>
        );
      }

      case 'actions':
        return (
          <td key="actions" className={cellPadding}>
            <div className="flex items-center gap-1">
              {/* Inline hover action buttons */}
              <div className={`flex items-center gap-1 transition-opacity duration-150 ${hoveredRowId === deal.id ? 'opacity-100' : 'opacity-0'}`}>
                <button
                  aria-label="Send email"
                  title="Send Email"
                  onClick={(e) => { e.stopPropagation(); setShowEmailModal(deal); }}
                  className="group/hover-btn flex items-center gap-1 px-2 py-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  <Mail size={14} />
                  <span className="text-xs font-medium opacity-0 group-hover/hover-btn:opacity-100 transition-opacity max-w-0 group-hover/hover-btn:max-w-[80px] overflow-hidden whitespace-nowrap">Email</span>
                </button>
                <button
                  aria-label="Open WhatsApp"
                  title="WhatsApp"
                  onClick={(e) => {
                    e.stopPropagation();
                    const phone = deal.contactPhone;
                    if (phone) {
                      window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank', 'noopener');
                    } else {
                      showBulkToast('No phone number on record for this contact');
                    }
                  }}
                  className="group/hover-btn flex items-center gap-1 px-2 py-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                >
                  <Phone size={14} />
                  <span className="text-xs font-medium opacity-0 group-hover/hover-btn:opacity-100 transition-opacity max-w-0 group-hover/hover-btn:max-w-[80px] overflow-hidden whitespace-nowrap">WhatsApp</span>
                </button>
                <button
                  aria-label="Log activity"
                  title="Log Activity"
                  onClick={(e) => { e.stopPropagation(); openLogMeeting(deal); }}
                  className="group/hover-btn flex items-center gap-1 px-2 py-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  <ClipboardList size={14} />
                  <span className="text-xs font-medium opacity-0 group-hover/hover-btn:opacity-100 transition-opacity max-w-0 group-hover/hover-btn:max-w-[80px] overflow-hidden whitespace-nowrap">Log</span>
                </button>
                <button
                  aria-label="Open deal detail"
                  title="Open Deal"
                  onClick={(e) => { e.stopPropagation(); navigate(`/crm/deals/${deal.id}`); }}
                  className="group/hover-btn flex items-center gap-1 px-2 py-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  <ExternalLink size={14} />
                  <span className="text-xs font-medium opacity-0 group-hover/hover-btn:opacity-100 transition-opacity max-w-0 group-hover/hover-btn:max-w-[80px] overflow-hidden whitespace-nowrap">Open</span>
                </button>
                <button
                  aria-label="Schedule follow-up"
                  title="Schedule Follow-up"
                  onClick={(e) => { e.stopPropagation(); openScheduleFollowUp(deal); }}
                  className="group/hover-btn flex items-center gap-1 px-2 py-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  <CalendarPlus size={14} />
                  <span className="text-xs font-medium opacity-0 group-hover/hover-btn:opacity-100 transition-opacity max-w-0 group-hover/hover-btn:max-w-[80px] overflow-hidden whitespace-nowrap">Follow-up</span>
                </button>
              </div>
              {/* ··· dropdown */}
              <div className="relative">
                <button
                  aria-label={`More actions for ${deal.dealName}`}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  onClick={(e) => { e.stopPropagation(); setShowActionDropdown(showActionDropdown === deal.id ? null : deal.id); }}
                >
                  <MoreHorizontal className="h-4 w-4 text-gray-600" />
                </button>
                {showActionDropdown === deal.id && (
                  <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 pt-0.5 pb-0.5">Workflow</p>
                    <div className="px-1.5 space-y-0.5">
                      <MenuItem icon={<CalendarPlus size={13} />} label="Schedule Follow-up"
                        onClick={() => { openScheduleFollowUp(deal); setShowActionDropdown(null); }} />
                      <MenuItem icon={<CheckSquare size={13} />} label="Create Task"
                        onClick={() => { openCreateTask(deal); setShowActionDropdown(null); }} />
                      <MenuItem icon={<ClipboardList size={13} />} label="Log Activity"
                        onClick={() => { openLogMeeting(deal); setShowActionDropdown(null); }} />
                    </div>
                    <div className="mx-2 my-1 border-t border-gray-100" />
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 pb-0.5">Deal</p>
                    <div className="px-1.5 space-y-0.5">
                      <MenuItem icon={<Pencil size={13} />} label="Edit deal"
                        onClick={() => { navigate(`/crm/deals/${deal.id}`); setShowActionDropdown(null); }} />
                      <MenuItem icon={<ArrowLeftRight size={13} />} label="Change stage"
                        onClick={() => { setShowStageModal(deal.id); setShowActionDropdown(null); }} />
                      <MenuItem icon={<Copy size={13} />} label="Clone deal"
                        onClick={() => { showBulkToast('Clone deal — coming soon'); setShowActionDropdown(null); }} />
                    </div>
                    <div className="mx-2 my-1 border-t border-gray-100" />
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 pb-0.5">Outreach</p>
                    <div className="px-1.5 space-y-0.5">
                      <MenuItem icon={<Workflow size={13} />} label="Add to Sequence"
                        onClick={() => { openAddSequence(deal); setShowActionDropdown(null); }} />
                      <MenuItem icon={<Link2 size={13} />} label="Copy Deal Link"
                        onClick={() => { shareDeal(deal); setShowActionDropdown(null); }} />
                      {isStalled(deal) && (
                        <MenuItem icon={<Sparkles size={13} />} label="Re-engage Deal"
                          onClick={() => { showBulkToast(`Re-engage flow for "${deal.dealName}" — sending outreach sequence`); setShowActionDropdown(null); }} />
                      )}
                    </div>
                    <div className="mx-2 my-1 border-t border-gray-100" />
                    <div className="px-1.5 space-y-0.5">
                      <MenuItem icon={<Archive size={13} />} label="Archive"
                        onClick={() => { archiveDeal(deal.id, deal.dealName); setShowActionDropdown(null); }} />
                      <MenuItem icon={<Trash2 size={13} />} label="Delete forever" danger
                        onClick={() => { setDeleteConfirmDeal(deal); setShowActionDropdown(null); }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </td>
        );

      default:
        return null;
    }
  };

  // Shared expanded panel — used by both desktop table row and mobile card
  const renderExpandedPanel = (deal: Deal): React.ReactNode => {
    const isClosed = ['closed-won', 'closed-lost'].includes(deal.stage);
    const expandedMerged = localEdits[deal.id] ? { ...deal, ...localEdits[deal.id] } : deal;
    const expandedCardLite = toDealCardLite(expandedMerged);
    const expandedCloseDays = expandedMerged.closeDate ? daysFromNow(expandedMerged.closeDate) : null;
    const healthExpl = isClosed ? null : explainDealHealth(expandedCardLite, expandedCloseDays);
    // The accent used to be coloured green/amber/red by deal.aiScore's tier — a
    // verdict from the stored probability with no reasons. Neutral since
    // 2026-10-03; the signals below are observable facts and stay.
    const accentClass = isClosed ? 'border-gray-300' : 'border-gray-200';
    const pipelineDays = getDealAgeDays(deal.createdAt);
    const pipelineDaysLabel = pipelineDays < 1 ? '<1d' : `${pipelineDays}d`;
    const pipelineDaysCls = pipelineDays < 14 ? 'bg-gray-100 text-gray-600'
      : pipelineDays < 30 ? 'bg-amber-100 text-amber-700'
      : 'bg-red-100 text-red-700';
    const dueInDays = deal.nextStepDueDate ? daysFromNow(deal.nextStepDueDate) : null;
    const allSignals = healthExpl
      ? [...healthExpl.risks, ...healthExpl.positives].slice(0, 4)
      : [];

    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Action strip */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-gray-100 flex-wrap">
          {([
            { label: 'Schedule Follow-up', icon: <CalendarPlus size={13} />, action: () => openScheduleFollowUp(deal) },
            { label: 'Create Task',        icon: <CheckSquare size={13} />,   action: () => openCreateTask(deal) },
            { label: 'Log Activity',       icon: <ClipboardList size={13} />, action: () => openLogMeeting(deal) },
            { label: 'Copy Link',          icon: <Link2 size={13} />,         action: () => shareDeal(deal) },
            { label: 'Add to Sequence',    icon: <Workflow size={13} />,      action: () => openAddSequence(deal) },
          ] as const).map(({ label, icon, action }) => (
            <button
              key={label}
              onClick={(e) => { e.stopPropagation(); action(); }}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {/* 8.3 — Next Best Action banner */}
        {!isClosed && (() => {
          const nba = getNextBestAction(deal, metaFor(deal));
          if (nba.urgency === 'low') return null;
          const bannerColor = nba.urgency === 'high'
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-indigo-50 border-indigo-200 text-indigo-800';
          return (
            <div className={`flex items-center justify-between gap-3 px-4 py-2.5 border-b ${bannerColor}`}>
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <p className="text-xs font-medium truncate">{nba.text}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); openScheduleFollowUp(deal); }}
                className="flex-shrink-0 text-xs font-semibold px-3 py-1 rounded-full border border-current hover:bg-white/50 transition-colors"
              >
                {nba.urgency === 'high' ? 'Act now' : 'Schedule'}
              </button>
            </div>
          );
        })()}

        {/* 4-zone body — stacks vertically on mobile, horizontal on md+ */}
        <div className={`flex flex-col md:flex-row border-l-4 ${accentClass}`}>

          {/* Zone 1 — People & Time */}
          <div className="md:w-48 flex-shrink-0 border-b md:border-b-0 md:border-r border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-semibold text-indigo-700">{getInitials(deal.owner || '')}</span>
              </div>
              <span className="text-sm text-gray-700 truncate">
                {deal.owner || <span className="text-gray-400">Unassigned</span>}
              </span>
            </div>
            {(() => {
              const { hasName, hasTitle, displayName, displayTitle, initials } = getContactDisplay(deal);
              return (
                <div className="mb-3">
                  <p className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase mb-1.5">
                    Primary Contact
                  </p>
                  {hasName ? (
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 text-[11px] font-bold flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate leading-snug">{displayName}</p>
                        {hasTitle && (
                          <p className="text-[11px] text-gray-400 truncate leading-snug">{displayTitle}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg bg-gray-50 border border-dashed border-gray-200">
                      <UserX size={13} className="text-gray-300 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400">No primary contact linked</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/crm/deals/${deal.id}`); }}
                          className="text-[11px] text-indigo-500 hover:text-indigo-700 hover:underline text-left"
                        >
                          Edit deal to add contact
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            <div className="text-xs text-gray-500 mb-3">
              {deal.lastActivity
                ? `Last contact: ${formatRelativeTime(deal.lastActivity, 'unknown')}`
                : 'No activity'}
            </div>
            <span
              title="Days since deal was created. Stage-level tracking coming soon."
              className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-full ${pipelineDaysCls}`}
            >
              {pipelineDaysLabel} in pipeline
            </span>
          </div>

          {/* Zone 2 — What's Next */}
          <div className="flex-1 border-b md:border-b-0 md:border-r border-gray-100 p-4">
            {!isClosed && (
              <>
                <div className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase mb-2">Next Step</div>
                <div className="line-clamp-2 text-sm text-gray-700">
                  {deal.nextStep?.trim()
                    ? deal.nextStep
                    : <span className="text-gray-400 italic">No next step defined</span>}
                </div>
                {dueInDays !== null && (
                  <div className="mt-1">
                    {dueInDays < 0
                      ? <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-red-100 text-red-700 rounded">Late</span>
                      : dueInDays === 0
                        ? <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-orange-100 text-orange-700 rounded">Today</span>
                        : dueInDays <= 2
                          ? <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded">{dueInDays}d</span>
                          : null}
                  </div>
                )}
              </>
            )}
            <div className={`text-[10px] font-semibold text-gray-400 tracking-wider uppercase mb-1${!isClosed ? ' mt-3' : ''}`}>Latest Note</div>
            <div className="text-sm text-gray-400 italic">No notes yet</div>
          </div>

          {/* Zone 3 — Intelligence & Context (tabbed) */}
          {(() => {
            const panelTab = expandedPanelTabs[deal.id] ?? 'intelligence';
            const setPanelTab = (t: 'intelligence' | 'context' | 'timeline') =>
              setExpandedPanelTabs(prev => ({ ...prev, [deal.id]: t }));
            const dq = getDealDataQuality(expandedMerged, metaFor(expandedMerged));
            const hasContextIssues = !dq.isClean;

            return (
              <div className="flex-1 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col">
                {/* Tab switcher */}
                <div className="flex border-b border-gray-100 px-4 pt-3 gap-1">
                  {(['intelligence', 'context', 'timeline'] as const).map(t => (
                    <button
                      key={t}
                      onClick={e => { e.stopPropagation(); setPanelTab(t); }}
                      className={[
                        'px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors capitalize relative',
                        panelTab === t
                          ? 'bg-white border border-b-white border-gray-200 text-indigo-700 -mb-px z-10'
                          : 'text-gray-400 hover:text-gray-600',
                      ].join(' ')}
                    >
                      {t === 'intelligence' ? 'Intelligence' : t === 'context' ? 'Context' : 'Timeline'}
                      {t === 'context' && hasContextIssues && panelTab !== 'context' && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-400" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="flex-1 p-4 overflow-y-auto">
                  {panelTab === 'intelligence' ? (
                    <>
                      {/* Next Best Action */}
                      {(() => {
                        const nba = getNextBestAction(deal, metaFor(deal));
                        const urgencyBg = nba.urgency === 'high'
                          ? 'bg-red-50 border-red-200 text-red-800'
                          : nba.urgency === 'medium'
                          ? 'bg-amber-50 border-amber-200 text-amber-800'
                          : 'bg-gray-50 border-gray-200 text-gray-600';
                        const urgencyDot = nba.urgency === 'high'
                          ? 'bg-red-500'
                          : nba.urgency === 'medium'
                          ? 'bg-amber-400'
                          : 'bg-green-400';
                        return (
                          <div className="mb-3">
                            <p className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase mb-1.5">NEXT BEST ACTION</p>
                            <div className={`flex items-start gap-2 px-3 py-2.5 rounded-xl border text-sm ${urgencyBg}`}>
                              <span className={`w-2 h-2 rounded-full shrink-0 mt-1 ${urgencyDot}`} />
                              <p className="leading-snug">{nba.text}</p>
                            </div>
                          </div>
                        );
                      })()}
                      {/* Deal Velocity */}
                      {(() => {
                        const vel = getDealVelocity(deal, metaFor(deal));
                        if (!vel) return null;
                        const velColor = vel.rating === 'ahead'
                          ? { bar: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50 border-green-200' }
                          : vel.rating === 'on-track'
                          ? { bar: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' }
                          : vel.rating === 'new'
                          ? { bar: 'bg-gray-400', text: 'text-gray-500', bg: 'bg-gray-50 border-gray-200' }
                          : { bar: 'bg-red-400', text: 'text-red-700', bg: 'bg-red-50 border-red-200' };
                        const stageBarWidth = `${Math.min(100, Math.round(vel.stageProgress * 100))}%`;
                        const timeBarWidth  = `${Math.min(100, Math.round(vel.timeConsumed * 100))}%`;
                        return (
                          <div className="mb-3">
                            <p className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase mb-1.5">DEAL VELOCITY</p>
                            <div className={`rounded-xl border px-3 py-2.5 ${velColor.bg}`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-xs font-semibold ${velColor.text}`}>
                                  {vel.rating === 'ahead' ? '↑ Ahead of pace' : vel.rating === 'on-track' ? '→ On Track' : vel.rating === 'new' ? '– New Deal' : '↓ Slipping behind'}
                                </span>
                                <span className="text-[10px] text-gray-500 tabular-nums">{vel.daysInPipeline}d / {vel.totalBudgetDays}d</span>
                              </div>
                              <div className="space-y-1.5">
                                <div>
                                  <div className="flex justify-between text-[10px] text-gray-500 mb-0.5"><span>Stage progress</span><span className="tabular-nums">{Math.round(vel.stageProgress * 100)}%</span></div>
                                  <div className="h-1.5 bg-white/60 rounded-full overflow-hidden"><div className={`h-full rounded-full ${velColor.bar}`} style={{ width: stageBarWidth }} /></div>
                                </div>
                                <div>
                                  <div className="flex justify-between text-[10px] text-gray-500 mb-0.5"><span>Time consumed</span><span className="tabular-nums">{Math.round(Math.min(vel.timeConsumed, 1) * 100)}%</span></div>
                                  <div className="h-1.5 bg-white/60 rounded-full overflow-hidden"><div className="h-full rounded-full bg-gray-400" style={{ width: timeBarWidth }} /></div>
                                </div>
                              </div>
                              <p className="text-[10px] text-gray-500 mt-2 tabular-nums">Velocity ratio: {vel.velocityRatio.toFixed(2)}x</p>
                            </div>
                          </div>
                        );
                      })()}
                      {/* Win Score Signals */}
                      <div className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase mb-2">Win Score Signals</div>
                      {isClosed ? (
                        <div className="flex items-center gap-2">
                          {isWonWith(stageLookup)(deal)
                            ? <><CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" /><span className="text-sm text-gray-500">Deal won — no active signals</span></>
                            : <><X className="h-4 w-4 text-red-400 flex-shrink-0" /><span className="text-sm text-gray-500">Deal lost — no active signals</span></>}
                        </div>
                      ) : allSignals.length > 0 ? (
                        <div className="space-y-1">
                          {allSignals.map(signal => (
                            <div key={signal.id} className="flex items-start gap-2">
                              {signal.sentiment === 'positive'
                                ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                                : signal.impact === 'high'
                                  ? <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                                  : <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />}
                              <span className="text-sm text-gray-700 leading-snug">{signal.label}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Score based on deal activity and engagement</span>
                      )}
                    </>
                  ) : panelTab === 'timeline' ? (
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase mb-3">Activity Timeline</p>
                      {deal.lastActivity ? (
                        <div className="relative pl-6 border-l-2 border-gray-100 space-y-4">
                          {deal.nextStep && (
                            <div className="relative">
                              <span className="absolute -left-[17px] w-3 h-3 rounded-full bg-amber-400 border-2 border-white shadow" />
                              <div className="flex items-start gap-2">
                                <ArrowLeftRight size={11} className="text-amber-500 mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-xs text-gray-700 font-medium">Next Step</p>
                                  <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{deal.nextStep}</p>
                                  {deal.nextStepDueDate && (
                                    <p className="text-[10px] text-amber-600 mt-0.5">Due: {formatCloseDate(deal.nextStepDueDate)}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="relative">
                            <span className="absolute -left-[17px] w-3 h-3 rounded-full bg-indigo-400 border-2 border-white shadow" />
                            <div className="flex items-start gap-2">
                              <Phone size={11} className="text-indigo-500 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs text-gray-700 font-medium">Last Contact</p>
                                <p className="text-[11px] text-gray-400 mt-0.5">{formatRelativeTime(deal.lastActivity, 'unknown')}</p>
                              </div>
                            </div>
                          </div>
                          <div className="relative">
                            <span className="absolute -left-[17px] w-3 h-3 rounded-full bg-gray-300 border-2 border-white shadow" />
                            <div className="flex items-start gap-2">
                              <StickyNote size={11} className="text-gray-400 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs text-gray-700 font-medium">Deal Created</p>
                                <p className="text-[11px] text-gray-400 mt-0.5">{deal.createdAt ? formatRelativeTime(deal.createdAt, 'unknown') : 'Unknown'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <Clock className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                          <p className="text-xs text-gray-400">No activity recorded yet</p>
                          <button onClick={e => { e.stopPropagation(); openLogMeeting(deal); }} className="mt-2 text-xs text-indigo-600 hover:underline">Log first activity</button>
                        </div>
                      )}
                      <button onClick={e => { e.stopPropagation(); openLogMeeting(deal); }} className="text-xs text-indigo-600 hover:underline mt-3 block">+ Log activity</button>
                    </div>
                  ) : (
                    <>
                      {/* Relationship Health */}
                      {(() => {
                        const relRisk = getRelationshipRisk(deal);
                        const relTierColor = {
                          strong: 'text-green-700 bg-green-50 border-green-200',
                          fair:   'text-amber-700 bg-amber-50 border-amber-200',
                          weak:   'text-red-700 bg-red-50 border-red-200',
                        }[relRisk.tier];
                        const relTierLabel = relRisk.tier.charAt(0).toUpperCase() + relRisk.tier.slice(1);
                        return (
                          <div className="mb-3">
                            <p className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase mb-1.5">RELATIONSHIP HEALTH</p>
                            <div className={`rounded-xl border px-3 py-2.5 ${relTierColor}`}>
                              <span className="text-xs font-semibold block mb-2">◈ {relTierLabel}</span>
                              <div className="space-y-1">
                                {relRisk.signals.map((sig, i) => (
                                  <div key={i} className="flex items-start gap-1.5 text-xs">
                                    <span className={`shrink-0 font-bold ${sig.passed ? 'text-green-600' : 'text-red-600'}`}>{sig.passed ? '✓' : '✗'}</span>
                                    <span className={sig.passed ? 'opacity-70' : 'font-medium'}>{sig.detail ?? sig.label}</span>
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs mt-2 pt-2 border-t border-current border-opacity-20 opacity-80 leading-snug">→ {relRisk.actionSuggestion}</p>
                            </div>
                          </div>
                        );
                      })()}
                      {/* Competitor Intel */}
                      {(() => {
                        const primary = deal.primaryCompetitor;
                        const secondaries = deal.secondaryCompetitors ?? [];
                        const hasAny = !!primary || secondaries.length > 0;
                        return (
                          <div className="mb-3">
                            <p className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase mb-1.5">COMPETITOR INTEL</p>
                            {!hasAny ? (
                              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 border border-dashed border-gray-200">
                                <Swords size={13} className="text-gray-300 shrink-0" />
                                <div>
                                  <p className="text-xs text-gray-400">No competitors tracked</p>
                                  <button onClick={e => { e.stopPropagation(); setCompetitorPopoverDealId(deal.id); }} className="text-[11px] text-indigo-500 hover:text-indigo-700 hover:underline">Add competitor</button>
                                </div>
                              </div>
                            ) : (
                              <div className="px-3 py-2.5 rounded-xl bg-teal-50 border border-teal-200">
                                {primary && (
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wide w-14 shrink-0">Primary</span>
                                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 border border-teal-300"><Swords size={10} />{primary}</span>
                                  </div>
                                )}
                                {secondaries.length > 0 && (
                                  <div className="flex items-start gap-2">
                                    <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wide w-14 shrink-0 pt-1">Also</span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {secondaries.map((s, i) => (
                                        <span key={i} className="text-xs text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded-full">{s}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                <button onClick={e => { e.stopPropagation(); setCompetitorPopoverDealId(deal.id); }} className="text-[11px] text-teal-600 hover:text-teal-800 hover:underline mt-2 block">Edit competitors</button>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                      {/* Pipeline Hygiene */}
                      {(() => {
                        if (dq.isClean) return (
                          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-green-50 border border-green-200">
                            <CheckCircle2 size={13} className="text-green-500 shrink-0" />
                            <span className="text-xs text-green-700 font-medium">No data quality issues found</span>
                          </div>
                        );
                        const panelBg = dq.hasErrors ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200';
                        const assignTarget = currentUser || availableOwners[0] || '';
                        return (
                          <div className="mb-3">
                            <p className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase mb-1.5">PIPELINE HYGIENE</p>
                            <div className={`rounded-xl border px-3 py-2.5 ${panelBg}`}>
                              <div className="space-y-2">
                                {dq.issues.map((issue: DataQualityIssue, i: number) => (
                                  <div key={i} className="flex items-start justify-between gap-2">
                                    <div className="flex items-start gap-1.5 min-w-0">
                                      <span className={`text-xs font-bold shrink-0 mt-0.5 ${issue.severity === 'error' ? 'text-red-500' : 'text-amber-500'}`}>{issue.severity === 'error' ? '✗' : '⚠'}</span>
                                      <span className={`text-xs leading-snug ${issue.severity === 'error' ? 'text-red-800' : 'text-amber-800'}`}>{issue.message}</span>
                                    </div>
                                    {issue.canAutoFix && issue.type === 'missing_owner' && assignTarget ? (
                                      <button onClick={e => { e.stopPropagation(); setLocalEdits(prev => ({ ...prev, [expandedMerged.id]: { ...prev[expandedMerged.id], owner: assignTarget } })); onFieldUpdate?.(expandedMerged.id, 'owner', assignTarget); }} className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 whitespace-nowrap shrink-0 underline">Assign to me</button>
                                    ) : issue.fixField && issue.fixField !== 'contact' ? (
                                      <button onClick={e => { e.stopPropagation(); startEdit(expandedMerged.id, issue.fixField!); }} className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 whitespace-nowrap shrink-0 underline">Fix →</button>
                                    ) : issue.fixField === 'contact' ? (
                                      <button onClick={e => { e.stopPropagation(); navigate(`/crm/deals/${expandedMerged.id}`); }} className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 whitespace-nowrap shrink-0 underline">Open deal →</button>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Zone 4 — Quick Actions */}
          <div className="md:w-44 flex-shrink-0 p-4">
            <div className="space-y-0.5">
              <button
                onClick={(e) => { e.stopPropagation(); setShowCallModal(deal); }}
                className="flex items-center gap-2 w-full text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2 py-1.5 rounded-lg transition-colors text-left"
              >
                <Phone className="h-4 w-4 flex-shrink-0" /><span>Call</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShowEmailModal(deal); }}
                className="flex items-center gap-2 w-full text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2 py-1.5 rounded-lg transition-colors text-left"
              >
                <Mail className="h-4 w-4 flex-shrink-0" /><span>Email</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onAddNote?.(deal.id); showBulkToast(`Add note for ${deal.dealName} — coming soon`); }}
                className="flex items-center gap-2 w-full text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2 py-1.5 rounded-lg transition-colors text-left"
              >
                <StickyNote className="h-4 w-4 flex-shrink-0" /><span>Add Note</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); openScheduleFollowUp(deal); }}
                className="flex items-center gap-2 w-full text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2 py-1.5 rounded-lg transition-colors text-left"
              >
                <CalendarPlus className="h-4 w-4 flex-shrink-0" /><span>Schedule Follow-up</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/crm/deals/${deal.id}`); }}
                className="flex items-center gap-2 w-full text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1.5 rounded-lg transition-colors text-left"
              >
                <ExternalLink className="h-4 w-4 flex-shrink-0" /><span>Open Full Deal</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50">

      {/* ── Stats Bar + Stage Pipeline Bar — sticky below the two kanban toolbar rows ── */}
      <div ref={kpiSectionRef} className="sticky top-[104px] z-30 bg-gray-50 -mx-6">

      {/* ── Stats Bar — slice 2b ─────────────────────────────────────────────────
          The eight KPI cards (total value, win rate, closing this week, stalled,
          avg days to close, weighted forecast, duplicates) summed the deals the
          browser happened to have; with paging that is one page. The deal count
          is the SERVER's total; the rest wait for server aggregates. */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3" data-testid="list-total">
            <div className="text-2xl font-black text-gray-900 tabular-nums">{loadState === 'ready' ? serverTotal : '—'}</div>
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Deals{hasActiveFilters || serverQuery.search || serverQuery.assigned_to_user_id ? ' matching' : ''}</div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-gray-200 px-4 py-3 text-[13px] text-gray-500" aria-disabled="true">
            Total value, win rate, closing this week, stalled, days to close, weighted forecast and duplicates
            <NotAvailableBadge label="Coming soon" />
          </div>
        </div>
      </div>

      </div>{/* end sticky KPI + stage wrapper */}

      {/* ── Filter Bar ──────────────────────────────────────────────────────── */}
      <div ref={filterBarRef} className="sticky z-20 bg-white border-b border-gray-200" style={{ top: 104 + kpiSectionHeight }}>

        {/* Row 1: filter buttons */}
        <div className="flex items-center gap-1.5 px-4 py-2 overflow-x-auto scrollbar-none">
          <ListFilter className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mr-0.5" />

          {/* ── Stage ──────────────────────────────────────────── */}
          {(() => {
            const STAGE_ORDER = stageOrder;
            const isOpen = openFilter === 'stage';
            return (
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setOpenFilter(isOpen ? null : 'stage')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium border transition-colors ${
                    selectedStages.size > 0
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Stage
                  {selectedStages.size > 0 && (
                    <span className="bg-indigo-600 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                      {selectedStages.size}
                    </span>
                  )}
                  <ChevronDown className={`h-3.5 w-3.5 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div className="absolute left-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-30">
                    {STAGE_ORDER.map(stageId => {
                      // ONE stage at a time — that is what the server filters on
                      // (slice 2b). The count is the column's server total under
                      // the board's filters, shown only when no other list filter
                      // would make it disagree with the table.
                      const count = !singleOwner && !debouncedDealSearch ? stageTotals[stageId] : undefined;
                      const checked = selectedStages.has(stageId);
                      return (
                        <label key={stageId} className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer select-none">
                          <input
                            type="radio"
                            name="deal-list-stage"
                            checked={checked}
                            onChange={() => setSelectedStages(new Set([stageId]))}
                            className="border-gray-300 text-indigo-600 focus:ring-indigo-400 w-3.5 h-3.5 flex-shrink-0"
                          />
                          <span className="flex-1 text-[13px] text-gray-700">{getStageName(stageId)}</span>
                          {count !== undefined && <span className="text-[11px] text-gray-400 tabular-nums">{count}</span>}
                        </label>
                      );
                    })}
                    {selectedStages.size > 0 && (
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={() => { setSelectedStages(new Set()); setOpenFilter(null); }}
                          className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 font-medium"
                        >
                          Clear stage filter
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── Owner ──────────────────────────────────────────── */}
          {rosterNames.length > 0 && (() => {
            const isOpen = openFilter === 'owner';
            return (
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setOpenFilter(isOpen ? null : 'owner')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium border transition-colors ${
                    selectedOwners.size > 0
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Owner
                  {selectedOwners.size > 0 && (
                    <span className="bg-indigo-600 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                      {selectedOwners.size}
                    </span>
                  )}
                  <ChevronDown className={`h-3.5 w-3.5 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div className="absolute left-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-30 max-h-56 overflow-y-auto">
                    {/* The workspace ROSTER (GET /users), not the names on one loaded
                        page; one owner at a time, as the server filters. */}
                    {rosterNames.map(owner => (
                      <label key={owner} className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer select-none">
                        <input
                          type="radio"
                          name="deal-list-owner"
                          checked={selectedOwners.has(owner)}
                          onChange={() => setSelectedOwners(new Set([owner]))}
                          className="border-gray-300 text-indigo-600 focus:ring-indigo-400 w-3.5 h-3.5 flex-shrink-0"
                        />
                        <span className="flex-1 text-[13px] text-gray-700 truncate">{owner}</span>
                      </label>
                    ))}
                    {selectedOwners.size > 0 && (
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={() => { setSelectedOwners(new Set()); setOpenFilter(null); }}
                          className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 font-medium"
                        >
                          Clear owner filter
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── Source / Deal age / Velocity — filtered one loaded page; server-side later (slice 2b) ── */}
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium border border-gray-200 bg-white text-gray-400 flex-shrink-0 cursor-not-allowed"
            aria-disabled="true" title="Source filter is coming soon">
            Source <NotAvailableBadge label="Soon" />
          </span>
          {/* The "Health / Win Score" filter sat here — tiers of deal.aiScore,
              the stored win probability presented as an AI score. Removed
              2026-10-03 (Evidence-Based AI). */}

          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium border border-gray-200 bg-white text-gray-400 flex-shrink-0 cursor-not-allowed"
            aria-disabled="true" title="Deal age filter is coming soon">
            Deal age <NotAvailableBadge label="Soon" />
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium border border-gray-200 bg-white text-gray-400 flex-shrink-0 cursor-not-allowed"
            aria-disabled="true" title="Velocity filter is coming soon">
            Velocity <NotAvailableBadge label="Soon" />
          </span>
          {/* ── Clear all (right-aligned) ───────────────────────── */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="ml-auto flex-shrink-0 flex items-center gap-1 text-xs text-gray-400 hover:text-red-600 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Clear all
              <span className="bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold px-1.5 py-0.5">{activeFilterCount}</span>
            </button>
          )}
        </div>

        {/* Row 2: active filter pills + KPI filter pill */}
        {(hasActiveFilters || activeKpiFilter) && (
          <div className="flex items-center gap-1.5 px-4 pb-2.5 flex-wrap">

            {/* KPI pill */}
            {activeKpiFilter && (
              <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {activeKpiFilter === 'closingWeek' ? 'Closing This Week' : 'Stalled Deals'}
                <button onClick={() => setActiveKpiFilter(null)} className="ml-0.5 hover:text-indigo-900" title="Clear">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {/* Stage pills */}
            {[...selectedStages].map(stageId => (
              <span key={stageId} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {getStageName(stageId)}
                <button
                  onClick={() => setSelectedStages(prev => { const n = new Set(prev); n.delete(stageId); return n; })}
                  className="ml-0.5 hover:text-blue-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

            {/* Owner pills */}
            {[...selectedOwners].map(owner => (
              <span key={owner} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {owner}
                <button
                  onClick={() => setSelectedOwners(prev => { const n = new Set(prev); n.delete(owner); return n; })}
                  className="ml-0.5 hover:text-blue-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

            {/* Source pills */}
            {[...selectedSources].map(src => (
              <span key={src} className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {src}
                <button
                  onClick={() => setSelectedSources(prev => { const n = new Set(prev); n.delete(src); return n; })}
                  className="ml-0.5 hover:text-emerald-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

            {/* Health pills */}
            {([...selectedHealthTiers] as HealthTierFilter[]).map(key => (
              <span key={key} className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {HEALTH_TIER_LABELS[key]}
                <button
                  onClick={() => setSelectedHealthTiers(prev => { const n = new Set(prev); n.delete(key); return n; })}
                  className="ml-0.5 hover:text-amber-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

            {/* Deal Age pill */}
            {(dealAgeFilter.min !== null || dealAgeFilter.max !== null) && (
              <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 border border-sky-200 text-xs font-medium px-2.5 py-0.5 rounded-full">
                <Clock className="h-3 w-3" />
                {dealAgeFilter.min !== null && dealAgeFilter.max !== null
                  ? `${dealAgeFilter.min}–${dealAgeFilter.max} days old`
                  : dealAgeFilter.min !== null
                    ? `${dealAgeFilter.min}+ days old`
                    : `< ${dealAgeFilter.max} days old`}
                <button
                  onClick={() => setDealAgeFilter({ min: null, max: null })}
                  className="ml-0.5 hover:text-sky-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {/* Velocity pills */}
            {velocityFilter.has('ahead') && (
              <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 text-xs font-medium px-2.5 py-0.5 rounded-full">
                <TrendingUp className="h-3 w-3" />
                Accelerating
                <button
                  onClick={() => setVelocityFilter(prev => { const n = new Set(prev); n.delete('ahead'); return n; })}
                  className="ml-0.5 hover:text-green-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {velocityFilter.has('slipping') && (
              <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 border border-orange-200 text-xs font-medium px-2.5 py-0.5 rounded-full">
                <TrendingDown className="h-3 w-3" />
                Stalling
                <button
                  onClick={() => setVelocityFilter(prev => { const n = new Set(prev); n.delete('slipping'); return n; })}
                  className="ml-0.5 hover:text-orange-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

          </div>
        )}
      </div>

      {/* ── Table + Card List ────────────────────────────────────────────────── */}
      <div className="-mx-6 py-0">

        {/* Desktop table (md+) */}
        <div ref={tableContainerRef} className="hidden md:block">
          <div
            className="bg-white overflow-auto"
            // Room below the table for the pager (slice 2b; the 12px was the old
            // count footer) — otherwise the pager sat past the viewport and the
            // window had to scroll, sliding the sticky filter bar under the table.
            style={{ height: `calc(100vh - ${tableOffsetTop + (loadState === 'ready' && serverTotal > 0 ? 56 : 12)}px)`, minHeight: '220px' }}
          >
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-20">
                <tr>
                  {/* Checkbox — always visible */}
                  <th className={`w-12 pl-3 ${effectiveDensity === 'compact' ? 'py-2' : 'py-3'}`}>
                    <input
                      ref={headerCheckboxRef}
                      type="checkbox"
                      checked={selectedDeals.length === sortedDeals.length && sortedDeals.length > 0}
                      onChange={selectAllDeals}
                      aria-label="Select all deals"
                      className="rounded border-gray-300 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1"
                    />
                  </th>
                  {orderedVisible.map(key => renderHeader(key))}
                  {/* Column picker — sticky far right */}
                  <th
                    ref={columnPickerRef}
                    className={`sticky right-0 bg-white border-l border-gray-200 ${effectiveDensity === 'compact' ? 'px-2 py-2' : 'px-3 py-3'}`}
                  >
                    <div className="relative">
                      <button
                        onClick={() => setShowColumnSettings(v => !v)}
                        title="Configure columns"
                        aria-label="Configure visible columns"
                        className={`p-1 rounded transition-colors ${showColumnSettings ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                      >
                        <SlidersHorizontal size={14} />
                      </button>
                      {showColumnSettings && (
                        <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                          <p className="px-3 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Visible Columns</p>
                          {ALL_COLUMNS.filter(c => c.key !== 'dealName' && c.key !== 'actions').map(col => (
                            <label key={col.key} className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-gray-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={visibleColumns.has(col.key)}
                                onChange={() => setVisibleColumns(prev => {
                                  const next = new Set(prev);
                                  if (next.has(col.key)) next.delete(col.key);
                                  else next.add(col.key);
                                  return next;
                                })}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-400 w-3.5 h-3.5"
                              />
                              <span className="text-xs text-gray-700">{col.label}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {pagedDeals.map((deal, rowIdx) => {
                  const isExpanded = expandedRows.includes(deal.id);
                  const isSelected = selectedDealSet.has(deal.id);
                  const isActiveRow = activeRowIndex === rowIdx;
                  return (
                    <React.Fragment key={deal.id}>
                      <tr
                        id={`deal-row-${deal.id}`}
                        className={`group ${getRowClassName(isExpanded, isSelected, hoveredRowId === deal.id, isActiveRow)}`}
                        style={{ scrollMarginTop: '48px' }}
                        onClick={() => { setActiveRowIndex(rowIdx); toggleRowExpansion(deal.id); }}
                        onContextMenu={(e) => handleContextMenu(e, deal.id)}
                        onMouseEnter={() => setHoveredRowId(deal.id)}
                        onMouseLeave={() => setHoveredRowId(null)}
                      >
                        {/* Checkbox */}
                        <td className={`pl-3 ${effectiveDensity === 'compact' ? 'py-2' : 'py-3'}`} onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => toggleDealSelection(deal.id, (e.nativeEvent as MouseEvent | KeyboardEvent).shiftKey)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Select ${deal.dealName}`}
                            className="rounded border-gray-300 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1"
                          />
                        </td>
                        {orderedVisible.map(key => renderCell(key, deal, isExpanded))}
                      </tr>

                      {/* Expanded Panel — Deal Cockpit */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={visibleColCount} className="p-0 border-0">
                            <div className="mx-3 mb-3 transition-opacity duration-150">
                              {renderExpandedPanel(deal)}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>

            {loadState === 'ready' && sortedDeals.length === 0 && (
              <div className="text-center py-16 px-8">
                {(totalPipelineDeals ?? allDeals.length) === 0 ? (
                  <>
                    <BarChart3 className="h-10 w-10 text-indigo-200 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-gray-700 mb-1">Your pipeline is empty</p>
                    <p className="text-xs text-gray-400 mb-4">Start by adding your first deal to track opportunities and forecast revenue.</p>
                    <button
                      onClick={() => navigate('/crm/deals/new')}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <Zap size={14} />
                      Add First Deal
                    </button>
                  </>
                ) : showIssuesOnly ? (
                  <>
                    <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-gray-700 mb-1">All deals are clean</p>
                    <p className="text-xs text-gray-400">No data quality issues found in the current filter. Great work!</p>
                    <button onClick={() => setShowIssuesOnly(false)} className="mt-3 text-xs text-indigo-600 hover:underline">Clear filter</button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center min-h-[320px] py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <Search className="w-7 h-7 text-gray-400" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">No deals match your filters</h3>
                    <p className="text-sm text-gray-500 mb-5 max-w-xs">
                      {hasActiveFilters ? 'Try relaxing some filters or clearing them all.' : 'Try adjusting the stage, date, or value filters above.'}
                    </p>
                    <button
                      onClick={clearAllFilters}
                      className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* A failed load says so — never an empty table that reads as "no deals". */}
        {loadState === 'error' && (
          <div role="alert" className="mx-4 my-4 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            The deals could not load — {loadError}.
            <button onClick={() => setRetryKey(k => k + 1)} className="font-medium underline">Try again</button>
          </div>
        )}
        {loadState === 'loading' && sortedDeals.length === 0 && (
          <p role="status" className="px-6 py-8 text-sm text-gray-500">Loading deals…</p>
        )}

        {/* Pager — from the SERVER's total (slice 2b). There were page variables
            but no controls: every filtered row rendered at once. */}
        {loadState === 'ready' && serverTotal > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-white px-6 py-2.5 text-[13px] text-gray-600" data-testid="deals-pager">
            <span>Showing {currentPage * rowsPerPage + 1}–{Math.min((currentPage + 1) * rowsPerPage, serverTotal)} of {serverTotal}</span>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5">
                Rows
                <select value={rowsPerPage} onChange={e => setRowsPerPage(Number(e.target.value) as 25 | 50 | 100)}
                  className="rounded border border-gray-200 px-1.5 py-1 text-[13px]" aria-label="Rows per page">
                  {[25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}
                className="rounded border border-gray-200 px-2.5 py-1 font-medium disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
              <span className="tabular-nums">Page {currentPage + 1} of {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage + 1 >= totalPages}
                className="rounded border border-gray-200 px-2.5 py-1 font-medium disabled:cursor-not-allowed disabled:opacity-50">Next</button>
            </div>
          </div>
        )}

        {/* Mobile card list (< md) */}
        <div className="block md:hidden py-2 space-y-2">
          {loadState === 'ready' && sortedDeals.length === 0 && (
            <div className="text-center py-12 px-4">
              {showIssuesOnly ? (
                <>
                  <CheckCircle2 className="h-8 w-8 text-green-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-700 mb-1">All deals are clean</p>
                  <p className="text-xs text-gray-400 mb-2">No data quality issues found.</p>
                  <button onClick={() => setShowIssuesOnly(false)} className="text-xs text-indigo-600 hover:underline">Clear filter</button>
                </>
              ) : (
                <>
                  <Building2 className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-500">No deals match your filters</p>
                  <p className="text-xs text-gray-400 mt-1">Try adjusting your filters above.</p>
                  {hasActiveFilters && (
                    <button onClick={clearAllFilters} className="mt-2 text-xs text-indigo-600 hover:underline">Clear all</button>
                  )}
                </>
              )}
            </div>
          )}
          {sortedDeals.map(deal => {
            const isExpanded = expandedRows.includes(deal.id);
            const isSelected = selectedDealSet.has(deal.id);
            const stalled = isStalled(deal);
            const stageStyle = getStageStyle(deal.stage);
            const mobileCloseDays = deal.closeDate ? daysFromNow(deal.closeDate) : null;
            const mobileCloseDateColor = mobileCloseDays === null ? 'text-gray-500'
              : mobileCloseDays < 0  ? 'text-red-600 font-medium'
              : mobileCloseDays <= 7 ? 'text-amber-600 font-medium'
              : 'text-gray-500';
            return (
              <div
                key={deal.id}
                className={[
                  'mx-3 rounded-2xl border transition-colors duration-100',
                  isSelected
                    ? 'border-blue-300 bg-blue-50'
                    : isExpanded
                      ? 'border-indigo-200 bg-indigo-50/20'
                      : 'border-gray-200 bg-white',
                ].join(' ')}
              >
                {/* Card main content */}
                <div className="flex items-start gap-3 px-4 pt-4 pb-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => toggleDealSelection(deal.id, (e.nativeEvent as MouseEvent | KeyboardEvent).shiftKey)}
                    onClick={e => e.stopPropagation()}
                    aria-label={`Select ${deal.dealName}`}
                    className="mt-1 shrink-0 rounded border-gray-300 focus-visible:ring-2 focus-visible:ring-indigo-400"
                  />
                  <div className="flex-1 min-w-0" onClick={() => toggleRowExpansion(deal.id)}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 truncate">{deal.dealName}</p>
                      {stalled && (
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
                          <PauseCircle size={10} /> Stalled
                        </span>
                      )}
                    </div>
                    {deal.companyName && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">{deal.companyName}</p>
                    )}
                    {(() => {
                      const nba = getNextBestAction(deal, metaFor(deal));
                      if (nba.urgency === 'low') return null;
                      return (
                        <p className={`text-[11px] mt-1 flex items-center gap-1 ${nba.urgency === 'high' ? 'text-red-600' : 'text-amber-600'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${nba.urgency === 'high' ? 'bg-red-500' : 'bg-amber-400'}`} />
                          {nba.shortLabel}
                        </p>
                      );
                    })()}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900 tabular-nums">{formatAmountCompact(deal.amount, deal.currency ?? 'USD')}</span>
                      {(deal.currency ?? 'USD') !== reportingCurrency && (
                        <span className="text-[10px] text-gray-400 tabular-nums">~{formatAmountCompact(getReportingAmount(deal, reportingCurrency), reportingCurrency)} {reportingCurrency}</span>
                      )}
                      <span
                        className="text-xs px-2 py-0.5 rounded-md font-medium shrink-0"
                        style={{ backgroundColor: stageStyle.bg, color: stageStyle.text }}
                      >
                        {getStageName(deal.stage)}
                      </span>
                      {deal.closeDate && (
                        <span className={`text-xs tabular-nums shrink-0 ${mobileCloseDateColor}`}>
                          {formatDate(deal.closeDate)}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); handleContextMenu(e as React.MouseEvent, deal.id); }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg shrink-0 -mr-1 mt-0.5"
                    aria-label="Deal actions"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </div>
                {/* Owner + expand toggle */}
                <div
                  className="flex items-center justify-between px-4 pb-3"
                  onClick={() => toggleRowExpansion(deal.id)}
                >
                  {deal.owner ? (
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-semibold text-indigo-700">{getInitials(deal.owner)}</span>
                      </div>
                      <span className="text-xs text-gray-500 truncate max-w-[100px]">{deal.owner.split(' ')[0]}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Unassigned</span>
                  )}
                  <span className="text-gray-400 flex items-center gap-1 text-xs">
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </span>
                </div>
                {/* Expanded panel */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-3 pb-3 pt-0">
                    {renderExpandedPanel(deal)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* ── Context Menu ──────────────────────────────────────────────────────── */}
      {contextMenuDeal && (() => {
        const ctxDeal = kpiFilteredDeals.find(d => d.id === contextMenuDeal);
        if (!ctxDeal) return null;
        return (
          <div
            className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 w-56"
            style={{ left: contextMenuPosition.x, top: contextMenuPosition.y }}
          >
            {/* Workflow — daily actions, top priority */}
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 pt-1 pb-0.5">Workflow</p>
            <div className="px-2 space-y-0.5">
              <MenuItem icon={<CalendarPlus size={14} />} label="Schedule Follow-up"
                onClick={() => { openScheduleFollowUp(ctxDeal); setContextMenuDeal(null); }} />
              <MenuItem icon={<CheckSquare size={14} />} label="Create Task"
                onClick={() => { openCreateTask(ctxDeal); setContextMenuDeal(null); }} />
              <MenuItem icon={<ClipboardList size={14} />} label="Log Activity"
                onClick={() => { openLogMeeting(ctxDeal); setContextMenuDeal(null); }} />
            </div>
            <div className="mx-2 my-1.5 border-t border-gray-100" />
            {/* Deal management */}
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 pb-0.5">Deal</p>
            <div className="px-2 space-y-0.5">
              <MenuItem icon={<Pencil size={14} />} label="Edit deal"
                onClick={() => { navigate(`/crm/deals/${ctxDeal.id}`); setContextMenuDeal(null); }} />
              <MenuItem icon={<ArrowLeftRight size={14} />} label="Change stage"
                onClick={() => { setShowStageModal(ctxDeal.id); setContextMenuDeal(null); }} />
              <MenuItem icon={<UserCog size={14} />} label="Reassign owner"
                onClick={() => { showBulkToast('Reassign owner — coming soon'); setContextMenuDeal(null); }} />
              <MenuItem icon={<Copy size={14} />} label="Clone deal"
                onClick={() => { showBulkToast('Clone deal — coming soon'); setContextMenuDeal(null); }} />
            </div>
            <div className="mx-2 my-1.5 border-t border-gray-100" />
            {/* Outreach */}
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 pb-0.5">Outreach</p>
            <div className="px-2 space-y-0.5">
              <MenuItem icon={<Workflow size={14} />} label="Add to Sequence"
                onClick={() => { openAddSequence(ctxDeal); setContextMenuDeal(null); }} />
              <MenuItem icon={<FileText size={14} />} label="Send Proposal"
                onClick={() => { showBulkToast('Send proposal — coming soon'); setContextMenuDeal(null); }} />
              <MenuItem icon={<Link2 size={14} />} label="Copy Deal Link"
                onClick={() => shareDeal(ctxDeal)} />
            </div>
            <div className="mx-2 my-1.5 border-t border-gray-100" />
            {/* Danger zone */}
            <div className="px-2 space-y-0.5">
              <MenuItem icon={<Archive size={14} />} label="Archive"
                onClick={() => archiveDeal(ctxDeal.id, ctxDeal.dealName)} />
              <MenuItem icon={<Trash2 size={14} />} label="Delete forever" danger
                onClick={() => { setDeleteConfirmDeal(ctxDeal); setContextMenuDeal(null); }} />
            </div>
          </div>
        );
      })()}

      {/* ── Schedule Follow-up Modal ─────────────────────────────────────────── */}
      {scheduleFollowUpDeal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setScheduleFollowUpDeal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <CalendarPlus size={18} className="text-indigo-600" />
                <h3 className="text-base font-semibold text-gray-900">Schedule Follow-up</h3>
              </div>
              <button onClick={() => setScheduleFollowUpDeal(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="bg-indigo-50 rounded-xl px-3 py-2 mb-4 text-sm">
              <span className="font-medium text-indigo-800">{scheduleFollowUpDeal.dealName}</span>
              {scheduleFollowUpDeal.contactName?.trim() && (
                <span className="text-indigo-600 ml-2">· {scheduleFollowUpDeal.contactName}</span>
              )}
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Date</label>
                  <input aria-label="Date" type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Time</label>
                  <input aria-label="Time" type="time" value={followUpTime} onChange={e => setFollowUpTime(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Notes (optional)</label>
                <textarea aria-label="Notes (optional)" value={followUpNotes} onChange={e => setFollowUpNotes(e.target.value)}
                  placeholder="What to discuss, prep notes..."
                  rows={3}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-400 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setScheduleFollowUpDeal(null)}
                className="flex-1 text-sm font-medium border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                disabled={!followUpDate}
                onClick={() => {
                  const name = scheduleFollowUpDeal.dealName;
                  setScheduleFollowUpDeal(null);
                  showBulkToast(`Follow-up for "${name}" is not saved yet — it will be gone after a refresh`);
                }}
                className="flex-1 text-sm font-medium bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Task Modal ─────────────────────────────────────────────────── */}
      {createTaskDeal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setCreateTaskDeal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <CheckSquare size={18} className="text-indigo-600" />
                <h3 className="text-base font-semibold text-gray-900">Create Task</h3>
              </div>
              <button onClick={() => setCreateTaskDeal(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="bg-indigo-50 rounded-xl px-3 py-2 mb-4 text-sm">
              <span className="font-medium text-indigo-800">{createTaskDeal.dealName}</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Task title</label>
                <input aria-label="Task title" type="text" value={taskTitle} onChange={e => setTaskTitle(e.target.value)}
                  placeholder="e.g. Send follow-up email, Prepare proposal..."
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Due date</label>
                  <input aria-label="Due date" type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Priority</label>
                  <select aria-label="Priority" value={taskPriority} onChange={e => setTaskPriority(e.target.value as 'high' | 'medium' | 'low')}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400 bg-white">
                    <option value="high">🔴 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Assign to</label>
                <select aria-label="Assign to" value={taskAssignee} onChange={e => setTaskAssignee(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400 bg-white">
                  <option value="">Select owner...</option>
                  {ownerFilterOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setCreateTaskDeal(null)}
                className="flex-1 text-sm font-medium border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                disabled={!taskTitle.trim()}
                onClick={() => {
                  const name = createTaskDeal.dealName;
                  setCreateTaskDeal(null);
                  showBulkToast(`Task for "${name}" is not saved yet — it will be gone after a refresh`);
                }}
                className="flex-1 text-sm font-medium bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Create task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Log Activity Modal ────────────────────────────────────────────────── */}
      {logMeetingDeal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setLogMeetingDeal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <ClipboardList size={18} className="text-indigo-600" />
                <h3 className="text-base font-semibold text-gray-900">Log Activity</h3>
              </div>
              <button onClick={() => setLogMeetingDeal(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="bg-indigo-50 rounded-xl px-3 py-2 mb-4 text-sm">
              <span className="font-medium text-indigo-800">{logMeetingDeal.dealName}</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-2 block">Meeting outcome</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: 'demo_completed',  label: '✅ Demo completed',  color: 'green' },
                    { value: 'follow_up_needed', label: '🔄 Follow-up needed', color: 'amber' },
                    { value: 'no_show',          label: '❌ No-show',          color: 'red'   },
                    { value: 'closed',           label: '🏆 Deal closed',      color: 'green' },
                  ] as const).map(({ value, label, color }) => (
                    <button key={value}
                      onClick={() => setMeetingOutcome(value)}
                      className={`text-xs font-medium px-3 py-2.5 rounded-xl border text-left transition-colors ${
                        meetingOutcome === value
                          ? color === 'green' ? 'bg-green-100 border-green-300 text-green-800'
                            : color === 'amber' ? 'bg-amber-100 border-amber-300 text-amber-800'
                            : 'bg-red-100 border-red-300 text-red-800'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Meeting notes</label>
                <textarea aria-label="Meeting notes" value={meetingNotes} onChange={e => setMeetingNotes(e.target.value)}
                  placeholder="What was discussed, key objections, decisions made..."
                  rows={3}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-400 resize-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Next step</label>
                <input aria-label="Next step" type="text" value={meetingNextStep} onChange={e => setMeetingNextStep(e.target.value)}
                  placeholder="e.g. Send revised proposal by Friday..."
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setLogMeetingDeal(null)}
                className="flex-1 text-sm font-medium border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                disabled={!meetingOutcome}
                onClick={() => {
                  const name = logMeetingDeal.dealName;
                  setLogMeetingDeal(null);
                  showBulkToast(`Meeting outcome for "${name}" is not saved yet — it will be gone after a refresh`);
                }}
                className="flex-1 text-sm font-medium bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Log outcome
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add to Sequence Modal ─────────────────────────────────────────────── */}
      {addSequenceDeal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setAddSequenceDeal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Workflow size={18} className="text-indigo-600" />
                <h3 className="text-base font-semibold text-gray-900">Add to Sequence</h3>
              </div>
              <button onClick={() => setAddSequenceDeal(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="bg-indigo-50 rounded-xl px-3 py-2 mb-4 text-sm">
              <span className="font-medium text-indigo-800">{addSequenceDeal.dealName}</span>
            </div>
            <div className="space-y-2 mb-5">
              {STUB_SEQUENCES.map(seq => (
                <button key={seq.id}
                  onClick={() => setSelectedSequence(seq.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                    selectedSequence === seq.id
                      ? 'bg-indigo-50 border-indigo-300'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${selectedSequence === seq.id ? 'text-indigo-800' : 'text-gray-800'}`}>
                      {seq.name}
                    </span>
                    <span className="text-xs text-gray-400">{seq.steps} steps</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{seq.description}</p>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setAddSequenceDeal(null)}
                className="flex-1 text-sm font-medium border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                disabled={!selectedSequence}
                onClick={() => {
                  const seq = STUB_SEQUENCES.find(s => s.id === selectedSequence);
                  setAddSequenceDeal(null);
                  showBulkToast(`Adding "${addSequenceDeal.dealName}" to "${seq?.name}" is not available yet — nothing was changed`);
                }}
                className="flex-1 text-sm font-medium bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Add to sequence
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Stage Change Modal ────────────────────────────────────────────────── */}
      {showStageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Change Stage</h3>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-2">
                {stages.map(stage => {
                  const deal = sortedDeals.find(d => d.id === showStageModal);
                  const isCurrentStage = deal?.stage === stage.id;
                  return (
                    <label key={stage.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="stage"
                        checked={isCurrentStage}
                        onChange={() => handleStageChange(showStageModal, stage.id)}
                        className="text-blue-600"
                      />
                      <span className={`text-sm ${isCurrentStage ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                        {stage.name} {isCurrentStage && '(current)'}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowStageModal(null)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Per-Deal Delete Confirmation Modal ───────────────────────────────── */}
      {deleteConfirmDeal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Delete this deal?</h3>
                  <p className="text-sm text-gray-500 mt-0.5">This action cannot be undone.</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 space-y-2">
              <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                <p className="font-medium text-gray-900">{deleteConfirmDeal.dealName}</p>
                <p className="text-gray-500">{deleteConfirmDeal.accountName} · ${deleteConfirmDeal.amount.toLocaleString()}</p>
                <p className="text-gray-500">{deleteConfirmDeal.stage} · {deleteConfirmDeal.owner}</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  archiveDeal(deleteConfirmDeal.id, deleteConfirmDeal.dealName);
                  setDeleteConfirmDeal(null);
                }}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Archive instead
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteConfirmDeal(null)}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onBulkAction?.('delete', [deleteConfirmDeal.id]);
                    setDeleteConfirmDeal(null);
                    showBulkToast(`"${deleteConfirmDeal.dealName}" was NOT deleted — deleting deals is not available yet`);
                  }}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete forever
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Delete Confirmation Modal ────────────────────────────────────── */}
      {bulkDeleteConfirm && (() => {
        const targets = kpiFilteredDeals.filter(d => selectedDeals.includes(d.id));
        const count = targets.length;
        const preview = targets.slice(0, 5);
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Delete {count} deal{count !== 1 ? 's' : ''}?</h3>
                    <p className="text-sm text-gray-500 mt-0.5">This action cannot be undone.</p>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4">
                <ul className="space-y-1">
                  {preview.map(d => (
                    <li key={d.id} className="text-sm text-gray-700 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                      <span className="font-medium truncate">{d.dealName}</span>
                      <span className="text-gray-400 shrink-0">${d.amount.toLocaleString()}</span>
                    </li>
                  ))}
                  {count > 5 && (
                    <li className="text-sm text-gray-400 pl-3.5">…and {count - 5} more</li>
                  )}
                </ul>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
                <button
                  onClick={() => {
                    const ids = [...selectedDeals];
                    const names = targets.map(d => d.dealName);
                    setArchivedDealIds(prev => new Set([...prev, ...ids]));
                    setBulkDeleteConfirm(false);
                    setSelectedDeals([]);
                    lastSelectedIndex.current = null;
                    showUndoToast(`${count} deal${count !== 1 ? 's' : ''} archived`, () => {
                      setArchivedDealIds(prev => { const next = new Set(prev); ids.forEach(id => next.delete(id)); return next; });
                    });
                    void names;
                  }}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Archive instead
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setBulkDeleteConfirm(false)}
                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const ids = [...selectedDeals];
                      onBulkAction?.('delete', ids);
                      setBulkDeleteConfirm(false);
                      setSelectedDeals([]);
                      lastSelectedIndex.current = null;
                      showBulkToast(`No deals were deleted — deleting deals is not available yet`);
                    }}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Delete forever
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Email Composer Modal ──────────────────────────────────────────────── */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Compose Email</h3>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                  <input aria-label="To"
                    type="email"
                    defaultValue={showEmailModal.contactName}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input aria-label="Subject"
                    type="text"
                    defaultValue={`Re: ${showEmailModal.dealName}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea aria-label="Message"
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type your message..."
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowEmailModal(null)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <Button
                onClick={() => setShowEmailModal(null)}
              >
                Send Email
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Call Logging Modal ────────────────────────────────────────────────── */}
      {showCallModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Log Call</h3>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                  <input aria-label="Contact"
                    type="text"
                    defaultValue={showCallModal.contactName}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Call Duration</label>
                  <input aria-label="Call Duration"
                    type="text"
                    placeholder="e.g., 15 minutes"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Call Notes</label>
                  <textarea aria-label="Call Notes"
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="What was discussed..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
                  <select aria-label="Outcome" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Successful</option>
                    <option>No Answer</option>
                    <option>Left Voicemail</option>
                    <option>Follow-up Required</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowCallModal(null)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowCallModal(null)}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Save Call Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Actions Bar ──────────────────────────────────────────────────── */}
      <div
        role="toolbar"
        aria-label="Bulk actions"
        className={[
          'fixed z-40',
          'left-0 right-0 bottom-0',
          'md:left-1/2 md:right-auto md:bottom-6 md:-translate-x-1/2',
          showBulkActions ? 'animate-slide-in-bottom pointer-events-auto' : 'translate-y-full opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gray-900 text-white rounded-t-2xl md:rounded-full shadow-2xl px-6 py-3 flex items-center gap-2 flex-wrap">

          {/* Selection count + Select all affordance */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm font-medium text-white">
              {selectedDeals.length} deal{selectedDeals.length !== 1 ? 's' : ''} selected
            </span>
            {selectedDeals.length < kpiFilteredDeals.length && kpiFilteredDeals.length > 0 && (
              <button
                onClick={selectAllDeals}
                className="text-sm text-indigo-300 hover:text-indigo-200 underline transition-colors"
              >
                Select all {kpiFilteredDeals.length} on this page
              </button>
            )}
            {/* "Select all N matching" across pages needs filter-based bulk actions — coming soon. */}
          </div>

          <div className="w-px h-5 bg-gray-600 mx-1 flex-shrink-0" />

          {/* Change Stage */}
          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setOpenPopover(openPopover === 'stage' ? null : 'stage'); }}
              className="text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-1.5"
            >
              <Target className="h-3.5 w-3.5" />
              Change Stage
            </button>
            {openPopover === 'stage' && (
              <div
                className="absolute bottom-full mb-2 left-0 bg-white border border-gray-200 rounded-xl shadow-lg p-2 min-w-[160px] z-50 text-gray-800"
                onClick={(e) => e.stopPropagation()}
              >
                {stages.map(stage => (
                  <button
                    key={stage.id}
                    onClick={() => {
                      const count = selectedDeals.length;
                      onBulkAction?.('stage', [...selectedDeals], { stage: stage.id });
                      setOpenPopover(null);
                      setSelectedDeals([]);
                      lastSelectedIndex.current = null;
                      showBulkToast(`Stage changed on screen for ${count} deal${count !== 1 ? 's' : ''} — not saved yet`);
                    }}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {stage.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reassign Owner — hidden on mobile */}
          <div className="hidden md:block relative flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setOpenPopover(openPopover === 'owner' ? null : 'owner'); }}
              className="text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-1.5"
            >
              <User className="h-3.5 w-3.5" />
              Reassign Owner
            </button>
            {openPopover === 'owner' && (
              <div
                className="absolute bottom-full mb-2 left-0 bg-white border border-gray-200 rounded-xl shadow-lg p-2 min-w-[160px] z-50 text-gray-800"
                onClick={(e) => e.stopPropagation()}
              >
                {(availableOwners.length > 0
                  ? availableOwners
                  : Array.from(new Set(allDeals.map(d => d.owner).filter(Boolean)))
                ).map(ownerName => (
                  <button
                    key={ownerName}
                    onClick={() => {
                      const count = selectedDeals.length;
                      onBulkAction?.('owner', [...selectedDeals], { owner: ownerName });
                      setOpenPopover(null);
                      setSelectedDeals([]);
                      lastSelectedIndex.current = null;
                      showBulkToast(`Owner changed on screen for ${count} deal${count !== 1 ? 's' : ''} — not saved yet`);
                    }}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {ownerName}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add Tag — hidden on mobile */}
          <div className="hidden md:block relative flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setOpenPopover(openPopover === 'tag' ? null : 'tag'); setTagInput(''); }}
              className="text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Add Tag
            </button>
            {openPopover === 'tag' && (
              <div
                className="absolute bottom-full mb-2 left-0 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-52 z-50 text-gray-800"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Tag name..."
                    autoFocus
                    className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tagInput.trim()) {
                        const count = selectedDeals.length;
                        onBulkAction?.('tag', [...selectedDeals], { tag: tagInput.trim() });
                        setOpenPopover(null);
                        setSelectedDeals([]);
                        lastSelectedIndex.current = null;
                        setTagInput('');
                        showBulkToast(`Tag added on screen to ${count} deal${count !== 1 ? 's' : ''} — not saved yet`);
                      }
                      if (e.key === 'Escape') setOpenPopover(null);
                    }}
                  />
                  <button
                    onClick={() => {
                      if (!tagInput.trim()) return;
                      const count = selectedDeals.length;
                      onBulkAction?.('tag', [...selectedDeals], { tag: tagInput.trim() });
                      setOpenPopover(null);
                      setSelectedDeals([]);
                      lastSelectedIndex.current = null;
                      setTagInput('');
                      showBulkToast(`Tag added on screen to ${count} deal${count !== 1 ? 's' : ''} — not saved yet`);
                    }}
                    className="px-2.5 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Export — hidden on mobile */}
          <button
            onClick={() => {
              const selectedList = allDeals.filter(d => selectedDealSet.has(d.id));
              const today = new Date().toISOString().slice(0, 10);
              const headers = ['Deal Name', 'Account', 'Owner', 'Contact', 'Value (Native)', 'Currency', 'Value (USD)', 'Stage', 'Close Date', 'Probability (%)', 'Source', 'Deal Age (days)', 'Competitor (Primary)', 'Competitors (Secondary)'];
              const rows = selectedList.map(d => [
                d.dealName,
                d.companyName || d.accountName || '',
                d.owner || '',
                d.contactName || '',
                d.amount.toString(),
                d.currency ?? 'USD',
                (d.baseAmountUsd ?? convertToBaseCurrency(d.amount, d.currency ?? 'USD')).toFixed(2),
                d.stage,
                d.closeDate || '',
                d.aiScore.toString(),
                d.source || '',
                getDealAgeDays(d.createdAt).toString(),
                d.primaryCompetitor ?? '',
                (d.secondaryCompetitors ?? []).join(', '),
              ]);
              const csv = [headers, ...rows]
                .map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
                .join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `deals-export-${today}.csv`;
              a.click();
              URL.revokeObjectURL(url);
              const count = selectedDeals.length;
              showBulkToast(`Exported ${count} deal${count !== 1 ? 's' : ''}`);
            }}
            className="hidden md:flex text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors items-center gap-1.5 flex-shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>

          {/* Archive — hidden on mobile */}
          <div className="hidden md:block relative flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setOpenPopover(openPopover === 'archive' ? null : 'archive'); }}
              className="text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-1.5"
            >
              <Archive className="h-3.5 w-3.5" />
              Archive
            </button>
            {openPopover === 'archive' && (
              <div
                className="absolute bottom-full mb-2 left-0 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-64 z-50 text-gray-800"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-sm text-gray-700 mb-3">
                  Archive {selectedDeals.length} deal{selectedDeals.length !== 1 ? 's' : ''}? They will be hidden from the active pipeline.
                </p>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setOpenPopover(null)}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const ids = [...selectedDeals];
                      const count = ids.length;
                      setArchivedDealIds(prev => new Set([...prev, ...ids]));
                      setOpenPopover(null);
                      setSelectedDeals([]);
                      lastSelectedIndex.current = null;
                      showUndoToast(`${count} deal${count !== 1 ? 's' : ''} archived`, () => {
                        setArchivedDealIds(prev => { const next = new Set(prev); ids.forEach(id => next.delete(id)); return next; });
                      });
                    }}
                    className="px-3 py-1.5 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                  >
                    Archive
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Delete */}
          <button
            onClick={() => setBulkDeleteConfirm(true)}
            className="text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1.5 flex-shrink-0 text-red-300 hover:text-white"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>

          <div className="w-px h-5 bg-gray-600 mx-1 flex-shrink-0" />

          {/* Clear selection */}
          <button
            onClick={() => { setSelectedDeals([]); lastSelectedIndex.current = null; }}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg transition-colors flex-shrink-0"
            title="Clear selection (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Duplicate Review Drawer ──────────────────────────────────────────── */}
      {duplicateDrawerOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setDuplicateDrawerOpen(false)}>
          <div
            className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Duplicate Review</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {activePairCount} potential pair{activePairCount !== 1 ? 's' : ''} detected
                </p>
              </div>
              <button onClick={() => setDuplicateDrawerOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* Pair list */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {duplicatePairs.length === 0 ? (
                <div className="text-center py-16">
                  <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-600">No duplicates remaining</p>
                  <p className="text-xs text-gray-400 mt-1">All pairs have been reviewed or dismissed.</p>
                </div>
              ) : (
                duplicatePairs.map(pair => (
                  <div
                    key={pair.pairKey}
                    className={`rounded-2xl border p-4 ${
                      pair.confidence === 'HIGH'
                        ? 'border-amber-300 bg-amber-50/40'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    {/* Confidence badge + dismiss */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        pair.confidence === 'HIGH'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {pair.confidence === 'HIGH' ? '⚠ High confidence match' : '~ Possible match'}
                      </span>
                      <button
                        onClick={() => setDismissedPairs(prev => new Set([...prev, pair.pairKey]))}
                        className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2"
                      >
                        Not a duplicate
                      </button>
                    </div>

                    {/* Side-by-side deal cards */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {[pair.dealA, pair.dealB].map(deal => (
                        <div key={deal.id} className="bg-white rounded-xl border border-gray-200 p-3">
                          <p className="text-sm font-semibold text-gray-900 truncate">{deal.dealName}</p>
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            {deal.companyName || deal.accountName || '—'}
                          </p>
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Value</span>
                              <span className="text-gray-700 font-medium">
                                {deal.amount ? formatAmountCompact(deal.amount, deal.currency ?? 'USD') : '—'}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Stage</span>
                              <span className="text-gray-700">{deal.stage || '—'}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Close</span>
                              <span className="text-gray-700">{deal.closeDate || '—'}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Owner</span>
                              <span className="text-gray-700 truncate ml-2">{deal.owner || '—'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Signal pills */}
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      <span className="text-[11px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                        Same account
                      </span>
                      {pair.signals.map(sig => (
                        <span key={sig} className="text-[11px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                          {sig === 'dealNameSimilar' ? 'Similar name'
                            : sig === 'valueSimilar' ? 'Similar value'
                            : 'Close dates near'}
                        </span>
                      ))}
                    </div>

                    {/* Merge CTA */}
                    <button
                      onClick={() => {
                        setMergeTargetPair(pair);
                        setMergeSurvivor('A');
                        setMergeFieldOverrides({});
                      }}
                      className="w-full text-sm font-medium bg-indigo-600 text-white py-2 rounded-xl hover:bg-indigo-700 transition-colors"
                    >
                      Review &amp; Merge
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Merge Modal ───────────────────────────────────────────────────────── */}
      {mergeTargetPair && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setMergeTargetPair(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Merge Deals</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Pick the surviving deal. Click any field to override per-field.
                </p>
              </div>
              <button onClick={() => setMergeTargetPair(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {/* Survivor header row */}
            <div className="grid grid-cols-[160px_1fr_1fr] border-b border-gray-100 shrink-0">
              <div className="px-4 py-3 flex items-center">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Field</span>
              </div>
              {([mergeTargetPair.dealA, mergeTargetPair.dealB] as const).map((deal, idx) => {
                const side = idx === 0 ? 'A' : 'B' as 'A' | 'B';
                const isWinner = mergeSurvivor === side;
                return (
                  <button
                    key={deal.id}
                    onClick={() => { setMergeSurvivor(side); setMergeFieldOverrides({}); }}
                    className={`px-4 py-3 text-left transition-colors border-l border-gray-100 ${
                      isWinner ? 'bg-indigo-50' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <p className={`text-xs font-semibold ${isWinner ? 'text-indigo-700' : 'text-gray-400'}`}>
                      Deal {side} {isWinner ? '· Survivor ✓' : '· Will be archived'}
                    </p>
                    <p className="text-sm font-medium text-gray-900 truncate mt-0.5">{deal.dealName}</p>
                  </button>
                );
              })}
            </div>

            {/* Field rows — scrollable */}
            <div className="flex-1 overflow-y-auto">
              {MERGE_FIELDS.filter(f => {
                const valA = String(mergeTargetPair.dealA[f.key] ?? '').trim();
                const valB = String(mergeTargetPair.dealB[f.key] ?? '').trim();
                return valA.length > 0 || valB.length > 0;
              }).map(field => {
                const rawA = mergeTargetPair.dealA[field.key];
                const rawB = mergeTargetPair.dealB[field.key];
                const valA = rawA != null ? String(rawA) : '';
                const valB = rawB != null ? String(rawB) : '';
                const isDifferent = valA.trim() !== valB.trim();
                const effectiveSide = (mergeFieldOverrides[field.key as string] ?? mergeSurvivor) as 'A' | 'B';
                const isOverridden = !!mergeFieldOverrides[field.key as string];

                const display = (v: string) =>
                  field.key === 'amount' && v
                    ? formatAmountUSD(Number(v))
                    : v || '—';

                return (
                  <div
                    key={field.key as string}
                    className={`grid grid-cols-[160px_1fr_1fr] border-b border-gray-50 ${
                      isDifferent ? '' : 'opacity-60'
                    }`}
                  >
                    <div className="px-4 py-2.5 flex items-center gap-1.5">
                      <span className="text-xs text-gray-500 font-medium">{field.label}</span>
                      {isOverridden && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                          override
                        </span>
                      )}
                    </div>

                    {([mergeTargetPair.dealA, mergeTargetPair.dealB] as const).map((deal, idx) => {
                      const side = (idx === 0 ? 'A' : 'B') as 'A' | 'B';
                      const val = idx === 0 ? valA : valB;
                      const isSelected = effectiveSide === side;

                      return (
                        <button
                          key={deal.id}
                          disabled={!isDifferent}
                          onClick={() => {
                            if (!isDifferent) return;
                            setMergeFieldOverrides(prev => {
                              const next = { ...prev };
                              if (next[field.key as string] === side) {
                                delete next[field.key as string];
                              } else {
                                next[field.key as string] = side;
                              }
                              return next;
                            });
                          }}
                          className={`px-4 py-2.5 text-left text-sm border-l border-gray-100 transition-colors ${
                            isSelected && isDifferent
                              ? 'bg-indigo-50 font-medium text-indigo-900'
                              : 'text-gray-600'
                          } ${isDifferent && !isSelected ? 'hover:bg-gray-50 cursor-pointer' : ''} ${
                            !isDifferent ? 'cursor-default' : ''
                          }`}
                        >
                          <span className="truncate block">{display(val)}</span>
                          {isSelected && isDifferent && (
                            <span className="text-[10px] text-indigo-500 font-medium">✓ will be kept</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 shrink-0">
              <button
                onClick={() => { setMergeTargetPair(null); setMergeFieldOverrides({}); }}
                className="text-sm font-medium text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <div className="flex items-center gap-3">
                <p className="text-xs text-gray-400">
                  Deal {mergeSurvivor === 'A' ? 'B' : 'A'} will be archived
                </p>
                <button
                  onClick={() => {
                    if (!mergeTargetPair) return;

                    const survivor = mergeSurvivor === 'A' ? mergeTargetPair.dealA : mergeTargetPair.dealB;
                    const loser    = mergeSurvivor === 'A' ? mergeTargetPair.dealB : mergeTargetPair.dealA;

                    // Capture values before state mutations (needed for undo closure)
                    const pairKey      = mergeTargetPair.pairKey;
                    const survivorId   = survivor.id;
                    const loserId      = loser.id;
                    const survivorName = survivor.dealName;

                    // Build field override payload
                    const overrides: Record<string, unknown> = {};
                    Object.entries(mergeFieldOverrides).forEach(([k, side]) => {
                      const src = side === 'A' ? mergeTargetPair.dealA : mergeTargetPair.dealB;
                      overrides[k] = (src as Record<string, unknown>)[k];
                    });
                    const overrideKeys = Object.keys(overrides);

                    // Apply field overrides to survivor's localEdits
                    if (overrideKeys.length > 0) {
                      setLocalEdits(prev => ({
                        ...prev,
                        [survivorId]: { ...prev[survivorId], ...(overrides as Partial<Deal>) },
                      }));
                    }

                    // Archive loser
                    setArchivedDealIds(prev => new Set([...prev, loserId]));

                    // Dismiss this pair
                    setDismissedPairs(prev => new Set([...prev, pairKey]));

                    // Close modal
                    setMergeTargetPair(null);
                    setMergeFieldOverrides({});

                    // Undo — reverses all three effects
                    showUndoToast(`Merged into "${survivorName}"`, () => {
                      setArchivedDealIds(prev => {
                        const next = new Set(prev);
                        next.delete(loserId);
                        return next;
                      });
                      if (overrideKeys.length > 0) {
                        setLocalEdits(prev => {
                          const next = { ...prev };
                          if (next[survivorId]) {
                            const cleaned = { ...next[survivorId] } as Record<string, unknown>;
                            overrideKeys.forEach(k => delete cleaned[k]);
                            if (Object.keys(cleaned).length === 0) delete next[survivorId];
                            else next[survivorId] = cleaned as Partial<Deal>;
                          }
                          return next;
                        });
                      }
                      setDismissedPairs(prev => {
                        const next = new Set(prev);
                        next.delete(pairKey);
                        return next;
                      });
                    });
                  }}
                  className="text-sm font-medium bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  Merge &amp; Archive loser
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Action Toast ─────────────────────────────────────────────────── */}
      {bulkToast && (
        <div className="fixed top-5 right-5 z-50 bg-gray-800 text-white text-sm px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          {bulkToast}
        </div>
      )}

      {/* ── Data Quality Slide-over Drawer ────────────────────────────────────── */}
      {showDQDrawer && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setShowDQDrawer(false)} />
          <div className="fixed right-0 top-0 h-full w-[480px] max-w-full bg-white shadow-2xl z-50 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Pipeline Hygiene</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {dqSummary.errors} error{dqSummary.errors !== 1 ? 's' : ''}, {dqSummary.warnings} warning{dqSummary.warnings !== 1 ? 's' : ''} across {dqSummary.total} deal{dqSummary.total !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const rows = filteredDeals
                      .flatMap(d => {
                        const dq = getDealDataQuality(d, metaFor(d));
                        if (dq.isClean) return [];
                        return dq.issues.map((i: DataQualityIssue) => `${d.dealName}\t${i.severity}\t${i.message}`);
                      })
                      .join('\n');
                    const blob = new Blob([`Deal\tSeverity\tIssue\n${rows}`], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = 'pipeline-hygiene.csv'; a.click(); URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Download size={12} />
                  Export CSV
                </button>
                <button onClick={() => setShowDQDrawer(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {filteredDeals.map(d => {
                const dq = getDealDataQuality(d, metaFor(d));
                if (dq.isClean) return null;
                const assignTarget = currentUser || availableOwners[0] || '';
                return (
                  <div key={d.id} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={() => { setShowDQDrawer(false); navigate(`/crm/deals/${d.id}`); }}
                        className="text-sm font-semibold text-gray-800 hover:text-indigo-600 transition-colors text-left truncate max-w-[260px]"
                      >
                        {d.dealName}
                      </button>
                      <span className="text-xs text-gray-400 shrink-0 ml-2 truncate max-w-[120px]">{d.companyName}</span>
                    </div>
                    <div className="space-y-2">
                      {dq.issues.map((issue: DataQualityIssue, i: number) => (
                        <div key={i} className="flex items-center justify-between gap-3">
                          <div className="flex items-start gap-1.5 min-w-0">
                            <span className={`text-xs font-bold shrink-0 ${issue.severity === 'error' ? 'text-red-500' : 'text-amber-500'}`}>
                              {issue.severity === 'error' ? '✗' : '⚠'}
                            </span>
                            <span className={`text-xs leading-snug ${issue.severity === 'error' ? 'text-red-700' : 'text-amber-700'}`}>{issue.message}</span>
                          </div>
                          {issue.canAutoFix && issue.type === 'missing_owner' && assignTarget ? (
                            <button onClick={() => { onFieldUpdate?.(d.id, 'owner', assignTarget); setShowDQDrawer(false); }} className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 whitespace-nowrap shrink-0">Assign me</button>
                          ) : issue.fixField && issue.fixField !== 'contact' ? (
                            <button onClick={() => { setShowDQDrawer(false); startEdit(d.id, issue.fixField!); }} className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 whitespace-nowrap shrink-0">Fix →</button>
                          ) : (
                            <button onClick={() => { setShowDQDrawer(false); navigate(`/crm/deals/${d.id}`); }} className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 whitespace-nowrap shrink-0">Open →</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {dqSummary.total === 0 && (
                <div className="flex flex-col items-center justify-center h-64">
                  <CheckCircle2 className="h-10 w-10 text-green-400 mb-3" />
                  <p className="text-sm font-semibold text-gray-700">All deals are clean</p>
                  <p className="text-xs text-gray-400 mt-1">No data quality issues found.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Undo Toast (archive actions) ─────────────────────────────────────── */}
      {undoToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-xl flex items-center gap-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{undoToast.message}</span>
          {undoToast.onUndo && (
            <button
              onClick={() => { undoToast.onUndo?.(); setUndoToast(null); }}
              className="ml-1 text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2 transition-colors"
            >
              Undo
            </button>
          )}
          <button
            onClick={() => setUndoToast(null)}
            className="ml-1 text-gray-400 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default DealsListView;
