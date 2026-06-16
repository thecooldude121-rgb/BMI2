import React, { useState, useEffect, useRef, useMemo } from 'react';
import { formatCloseDate, formatRelativeTime, daysFromNow, daysFromNowLabel, isWithinDays, parseDateMs } from '../../utils/dateUtils';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Download, Settings, BarChart3, ChevronDown, ChevronUp, ArrowUp, ArrowDown,
  Building2, User, Sparkles, Mail, Phone, Eye, MoreHorizontal,
  CheckCircle2, AlertTriangle, Clock, Target, X, Edit, Copy, Trash2, GripVertical, Archive,
  StickyNote, CalendarPlus, ExternalLink, SlidersHorizontal, PauseCircle, UserX,
  Pencil, ArrowLeftRight, UserCog, Zap, FileText,
  CheckSquare, ClipboardList, Workflow, Link2,
  AlignJustify, LayoutList,
} from 'lucide-react';
import { formatAmountUSD } from '../../utils/currencyUtils';
import { explainDealHealth, scoreToHealthTier } from '../../utils/dealHealthDrivers';
import type { DealCard } from '../../components/Deal/DealKanbanCard';
import { getStageStyle } from '../../config/stageColors';
import { type ColumnKey, ALL_COLUMNS, DEFAULT_COLUMN_ORDER } from '../../utils/dealsColumns';
import type { CloseDateFilter, ValueFilter, PipelineAgeFilter, HealthTierFilter } from '../../utils/dealsColumns';
import { AdvancedFilterBuilder } from '../../components/Deals/AdvancedFilterBuilder';
import type { FilterCondition, Conjunction } from '../../components/Deals/AdvancedFilterBuilder';
import { useStalledConfig } from '../../hooks/useStalledConfig';
import { findDuplicatePairs } from '../../utils/duplicateDetection';
import type { DuplicatePair, DuplicatableDeal } from '../../utils/duplicateDetection';

// ── Advanced filter builder predicate ─────────────────────────────────────────
// Evaluates a single FilterCondition against a deal. Returns true for incomplete
// conditions (empty valueStrings / null numbers) so building mid-air never hides results.
function evaluateCondition(deal: {
  stage: string; owner: string; amount: number; closeDate: string;
  daysSinceContact: number; aiScore: number; contactName: string;
}, c: FilterCondition): boolean {
  switch (c.field) {
    case 'stage':
      if (c.valueStrings.length === 0) return true;
      return c.operator === 'isNoneOf'
        ? !c.valueStrings.includes(deal.stage)
        : c.valueStrings.includes(deal.stage);
    case 'owner':
      if (c.valueStrings.length === 0) return true;
      return c.operator === 'isNoneOf'
        ? !c.valueStrings.includes(deal.owner)
        : c.valueStrings.includes(deal.owner);
    case 'value':
      if (c.operator === 'between') {
        if (c.valueNumber !== null && deal.amount < c.valueNumber) return false;
        if (c.valueNumber2 !== null && deal.amount > c.valueNumber2) return false;
        return true;
      }
      if (c.valueNumber === null) return true;
      return c.operator === 'greaterThan' ? deal.amount > c.valueNumber : deal.amount < c.valueNumber;
    case 'closeDate': {
      if (!c.valueDate) return true;
      const closeMs = deal.closeDate ? new Date(deal.closeDate).getTime() : null;
      if (closeMs === null) return false;
      const filterMs = new Date(c.valueDate).getTime();
      return c.operator === 'before' ? closeMs < filterMs : closeMs > filterMs;
    }
    case 'lastActivity':
      if (c.valueNumber === null) return true;
      return c.operator === 'olderThan'
        ? deal.daysSinceContact > c.valueNumber
        : deal.daysSinceContact <= c.valueNumber;
    case 'health': {
      const { tier } = scoreToHealthTier(deal.aiScore);
      if (c.operator === 'is')
        return c.valueStrings.length === 0 || c.valueStrings.includes(tier);
      if (c.operator === 'isNot')
        return c.valueStrings.length === 0 || !c.valueStrings.includes(tier);
      if (c.valueNumber === null) return true;
      return c.operator === 'scoreBelow' ? deal.aiScore < c.valueNumber : deal.aiScore > c.valueNumber;
    }
    case 'contact':
      return c.operator === 'isSet' ? !!deal.contactName : !deal.contactName;
    default:
      return true;
  }
}

interface Deal {
  id: string;
  companyName: string;
  dealName: string;
  accountName: string;
  amount: number;
  closeDate: string;
  stage: string;
  aiScore: number;
  contactName: string;
  contactTitle: string;
  owner: string;
  lastActivity: string;
  daysSinceContact: number;
  isHRMS: boolean;
  priority: 'high' | 'medium' | 'low';
  health: 'excellent' | 'healthy' | 'at-risk' | 'critical';
  source: string;
  status?: string;
  hrmsDetails?: string;
  nextStep?: string;
  nextStepDueDate?: string;
  createdAt?: string;
}

function getRowClassName(isExpanded: boolean, isSelected: boolean, isHovered: boolean): string {
  const base = 'transition-colors duration-100 cursor-pointer border-l-2';
  if (isSelected) return `${base} bg-blue-50 border-l-blue-400`;
  if (isExpanded) return `${base} bg-indigo-50/30 border-l-indigo-300`;
  if (isHovered)  return `${base} bg-slate-50/60 border-l-indigo-200`;
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
}

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
}) => {
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
    const p = searchParams.get('healthTiers');
    return p ? new Set(p.split(',').filter(Boolean) as HealthTierFilter[]) : new Set();
  });
  const [pipelineAgeFilter, setPipelineAgeFilter] = useState<PipelineAgeFilter>(() => {
    const min = searchParams.get('pipelineAgeMin');
    const max = searchParams.get('pipelineAgeMax');
    return { min: min ? parseInt(min) : null, max: max ? parseInt(max) : null };
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
    'deal' | 'account' | 'value' | 'stage' | 'closeDate' | 'health'
    | 'owner' | 'contact' | 'probability' | 'dealAge' | 'source'
  >('closeDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [hoveredScore, setHoveredScore] = useState<string | null>(null);
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);
  const [contextMenuDeal, setContextMenuDeal] = useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [showStageModal, setShowStageModal] = useState<string | null>(null);
  const [showActionDropdown, setShowActionDropdown] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState<Deal | null>(null);
  const [showCallModal, setShowCallModal] = useState<Deal | null>(null);
  const [showHRMSModal, setShowHRMSModal] = useState<Deal | null>(null);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
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

  // ── Density ─────────────────────────────────────────────────────────────────
  type Density = 'comfortable' | 'compact';
  const [density, setDensity] = useState<Density>(() => {
    try { return (localStorage.getItem('bmi_deals_density') as Density) ?? 'comfortable'; }
    catch { return 'comfortable'; }
  });
  useEffect(() => { localStorage.setItem('bmi_deals_density', density); }, [density]);
  const cellPadding        = density === 'compact' ? 'px-3 py-2' : 'px-4 py-3';
  const textSizeSecondary  = density === 'compact' ? 'text-[11px]' : 'text-xs';
  const avatarSize         = density === 'compact' ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 text-[11px]';

  // ── Duplicate detection state ───────────────────────────────────────────────
  const [dismissedPairs, setDismissedPairs] = useState<Set<string>>(new Set());
  const [duplicateDrawerOpen, setDuplicateDrawerOpen] = useState(false);
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

  const allDeals = useMemo(
    () => stages
      .flatMap(stage => stage.deals.map(deal => ({ ...deal, stage: stage.id })))
      .filter(d => !archivedDealIds.has(d.id)),
    [stages, archivedDealIds],
  );

  const stageFilterOptions = useMemo(
    () => [...new Set(allDeals.map(d => d.stage).filter(Boolean))].sort(),
    [allDeals]
  );
  const ownerFilterOptions = useMemo(
    () => availableOwners.length > 0
      ? availableOwners
      : [...new Set(allDeals.map(d => d.owner).filter(Boolean))].sort(),
    [allDeals, availableOwners]
  );
  const sourceFilterOptions = useMemo(
    () => [...new Set(allDeals.map(d => d.source).filter(Boolean))].sort(),
    [allDeals]
  );

  const selectedDealSet = useMemo(() => new Set(selectedDeals), [selectedDeals]);

  const filteredDeals = useMemo(() => {
    return allDeals.filter(deal => {
      // Stage
      if (selectedStages.size > 0 && !selectedStages.has(deal.stage)) return false;

      // Owner
      if (selectedOwners.size > 0 && !selectedOwners.has(deal.owner)) return false;

      // Close Date
      if (closeDateFilter.preset !== 'all') {
        const close = deal.closeDate ? new Date(deal.closeDate) : null;
        const now = new Date();
        if (!close) return false;
        if (closeDateFilter.preset === 'thisWeek') {
          const end = new Date(now.getTime() + 7 * 86400000);
          if (close < now || close > end) return false;
        } else if (closeDateFilter.preset === 'thisMonth') {
          if (close.getMonth() !== now.getMonth() || close.getFullYear() !== now.getFullYear()) return false;
        } else if (closeDateFilter.preset === 'thisQuarter') {
          const q = Math.floor(now.getMonth() / 3);
          if (Math.floor(close.getMonth() / 3) !== q || close.getFullYear() !== now.getFullYear()) return false;
        } else if (closeDateFilter.preset === 'overdue') {
          if (close >= now) return false;
        } else if (closeDateFilter.preset === 'custom') {
          if (closeDateFilter.from && close < new Date(closeDateFilter.from)) return false;
          if (closeDateFilter.to && close > new Date(closeDateFilter.to)) return false;
        }
      }

      // Value
      if (valueFilter.min !== null && deal.amount < valueFilter.min) return false;
      if (valueFilter.max !== null && deal.amount > valueFilter.max) return false;

      // Source
      if (selectedSources.size > 0 && !selectedSources.has(deal.source)) return false;

      // Health tier
      if (selectedHealthTiers.size > 0) {
        const { tier } = scoreToHealthTier(deal.aiScore);
        if (!selectedHealthTiers.has(tier)) return false;
      }

      // Activity gap (days since last contact)
      if (pipelineAgeFilter.min !== null || pipelineAgeFilter.max !== null) {
        const idleDays = deal.daysSinceContact;
        if (pipelineAgeFilter.min !== null && idleDays < pipelineAgeFilter.min) return false;
        if (pipelineAgeFilter.max !== null && idleDays > pipelineAgeFilter.max) return false;
      }

      // Advanced filter builder conditions (additive AND with quick filters)
      if (advancedConditions.length > 0) {
        const results = advancedConditions.map(c => evaluateCondition(deal, c));
        const passes = advancedConjunction === 'AND'
          ? results.every(Boolean)
          : results.some(Boolean);
        if (!passes) return false;
      }

      return true;
    });
  }, [allDeals, selectedStages, selectedOwners, closeDateFilter, valueFilter, selectedSources, selectedHealthTiers, pipelineAgeFilter, advancedConditions, advancedConjunction]);

  const kpiFilteredDeals = useMemo(() => {
    if (activeKpiFilter === 'closingWeek') {
      return filteredDeals.filter(d => d.closeDate && isWithinDays(d.closeDate, 7));
    }
    if (activeKpiFilter === 'stalled') {
      return filteredDeals.filter(d => isStalled(d));
    }
    return filteredDeals;
  }, [filteredDeals, activeKpiFilter]);

  const sortedDeals = [...kpiFilteredDeals].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'deal':
        comparison = a.dealName.localeCompare(b.dealName);
        break;
      case 'account':
        comparison = (a.companyName || '').localeCompare(b.companyName || '');
        break;
      case 'value':
        comparison = a.amount - b.amount;
        break;
      case 'stage': {
        const stageOrder = ['prospecting', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'];
        comparison = stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage);
        break;
      }
      case 'closeDate':
        // parseDateMs returns Infinity for empty/invalid dates — sorts them to end, never NaN
        comparison = parseDateMs(a.closeDate) - parseDateMs(b.closeDate);
        break;
      case 'health':
        comparison = a.aiScore - b.aiScore;
        break;
      case 'owner':
        comparison = (a.owner || '').localeCompare(b.owner || '');
        break;
      case 'contact':
        comparison = (a.contactName || '').localeCompare(b.contactName || '');
        break;
      case 'probability':
        // TODO: rename aiScore → probability
        comparison = a.aiScore - b.aiScore;
        break;
      case 'dealAge': {
        const msA = a.createdAt ? Date.now() - new Date(a.createdAt).getTime() : 0;
        const msB = b.createdAt ? Date.now() - new Date(b.createdAt).getTime() : 0;
        comparison = msA - msB;
        break;
      }
      case 'source':
        comparison = (a.source || '').localeCompare(b.source || '');
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const formatDate = formatCloseDate;


  const getStageName = (stageId: string) => {
    const stage = stages.find(s => s.id === stageId);
    return stage ? stage.name : stageId;
  };

  const getStageProgress = (stageId: string) => {
    const stageOrder = ['prospecting', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'];
    return `${stageOrder.indexOf(stageId) + 1} of ${stageOrder.length}`;
  };


  const getInitials = (name: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const getDealAgeDays = (createdAt?: string): number => {
    if (!createdAt) return 0;
    return Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000);
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
    isHRMS: deal.isHRMS ?? false,
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
          if (isFinite(ms)) initialValue = new Date(ms).toISOString().slice(0, 10);
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
    setVisibleColumns(new Set(DEFAULT_COLUMN_ORDER));
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenuDeal(null);
      setShowActionDropdown(null);
      setShowColumnSettings(false);
      setOpenPopover(null);
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
      if (e.key !== 'Escape') return;
      if (editingCell) { setEditingCell(null); setEditValue(''); return; }
      if (openPopover) { setOpenPopover(null); return; }
      if (selectedDeals.length > 0) {
        setSelectedDeals([]);
        lastSelectedIndex.current = null;
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [editingCell, openPopover, selectedDeals]);

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

  const totalValue = sortedDeals.reduce((sum, deal) => sum + deal.amount, 0);
  const avgWinRate = 67;
  // KPI counts from filteredDeals (pre-KPI-filter) so they stay stable when a KPI card is active
  const kpiClosingCount  = filteredDeals.filter(d => d.closeDate && isWithinDays(d.closeDate, 7)).length;
  const kpiStalledCount  = filteredDeals.filter(d => isStalled(d)).length;
  const avgDaysCycle = 45;

  const duplicatePairs = useMemo(() => {
    const pairs = findDuplicatePairs(allDeals);
    return pairs.filter(p => !dismissedPairs.has(p.pairKey));
  }, [allDeals, dismissedPairs]);

  const activePairCount = duplicatePairs.length;

  // Reset KPI shortcut when any dropdown filter changes to avoid phantom pills
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setActiveKpiFilter(null); }, [selectedStages, selectedOwners, closeDateFilter, valueFilter, selectedSources, selectedHealthTiers, pipelineAgeFilter, advancedConditions]);

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
    set('pipelineAgeMin',  pipelineAgeFilter.min !== null ? String(pipelineAgeFilter.min) : null);
    set('pipelineAgeMax',  pipelineAgeFilter.max !== null ? String(pipelineAgeFilter.max) : null);
    setSearchParams(params, { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStages, selectedOwners, closeDateFilter, valueFilter, selectedSources, selectedHealthTiers, pipelineAgeFilter]);

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
  useEffect(() => {
    if (!externalFilters) return;
    if (externalFilters.stages)           setSelectedStages(externalFilters.stages);
    if (externalFilters.owners)           setSelectedOwners(externalFilters.owners);
    if (externalFilters.sources)          setSelectedSources(externalFilters.sources);
    if (externalFilters.healthTiers)      setSelectedHealthTiers(externalFilters.healthTiers);
    if (externalFilters.closeDateFilter)  setCloseDateFilter(externalFilters.closeDateFilter);
    if (externalFilters.valueFilter)      setValueFilter(externalFilters.valueFilter);
    if (externalFilters.pipelineAgeFilter) setPipelineAgeFilter(externalFilters.pipelineAgeFilter);
  }, [externalFilters]);

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
    setPipelineAgeFilter({ min: null, max: null });
    setAdvancedConditions([]);
  };

  const hasActiveFilters =
    selectedStages.size > 0 || selectedOwners.size > 0 ||
    closeDateFilter.preset !== 'all' ||
    valueFilter.min !== null || valueFilter.max !== null ||
    selectedSources.size > 0 || selectedHealthTiers.size > 0 ||
    pipelineAgeFilter.min !== null || pipelineAgeFilter.max !== null ||
    advancedConditions.length > 0;

  const activeFilterCount =
    selectedStages.size + selectedOwners.size + selectedSources.size + selectedHealthTiers.size +
    (closeDateFilter.preset !== 'all' ? 1 : 0) +
    (valueFilter.min !== null || valueFilter.max !== null ? 1 : 0) +
    (pipelineAgeFilter.min !== null || pipelineAgeFilter.max !== null ? 1 : 0) +
    advancedConditions.length;

  const HEALTH_TIER_LABELS: Record<HealthTierFilter, string> = {
    strong: 'Healthy',
    fair:   'Watch',
    weak:   'At Risk',
  };

  const closeDatePresetLabel: Record<string, string> = {
    thisWeek: 'This Week', thisMonth: 'This Month',
    thisQuarter: 'This Quarter', overdue: 'Overdue',
    custom: `${closeDateFilter.from ?? ''}–${closeDateFilter.to ?? ''}`,
  };

  const FilterChip = ({
    label, color = 'indigo', onRemove,
  }: { label: string; color?: 'indigo' | 'green' | 'amber' | 'red' | 'purple' | 'blue' | 'orange'; onRemove: () => void }) => {
    const colorMap = {
      indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      green:  'bg-green-50  text-green-700  border-green-200',
      amber:  'bg-amber-50  text-amber-700  border-amber-200',
      red:    'bg-red-50    text-red-700    border-red-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
      blue:   'bg-blue-50   text-blue-700   border-blue-200',
      orange: 'bg-orange-50 text-orange-700 border-orange-200',
    };
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${colorMap[color]}`}>
        {label}
        <button onClick={onRemove} className="ml-0.5 opacity-60 hover:opacity-100 text-current leading-none">×</button>
      </span>
    );
  };

  const fmtValK = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`;

  const showBulkActions = selectedDeals.length > 0;
  const orderedVisible = columnOrder.filter(k => visibleColumns.has(k));
  // +1 for the always-visible checkbox column
  const visibleColCount = 1 + orderedVisible.length;

  const SortIcon = ({ column }: { column: typeof sortBy }) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const renderHeader = (key: ColumnKey): React.ReactNode => {
    const thBase = `text-left ${cellPadding} text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap`;
    const thSort = thBase + ' cursor-pointer hover:bg-gray-100';
    switch (key) {
      case 'dealName':
        return <th key="dealName" className={thSort} onClick={() => handleSort('deal')}><div className="flex items-center space-x-1"><span>Deal Name</span><SortIcon column="deal" /></div></th>;
      case 'account':
        return <th key="account" className={thSort} onClick={() => handleSort('account')}><div className="flex items-center space-x-1"><span>Account</span><SortIcon column="account" /></div></th>;
      case 'owner':
        return <th key="owner" className={thSort} onClick={() => handleSort('owner')}><div className="flex items-center space-x-1"><span>Owner</span><SortIcon column="owner" /></div></th>;
      case 'contact':
        return <th key="contact" className={thSort} onClick={() => handleSort('contact')}><div className="flex items-center space-x-1"><span>Primary Contact</span><SortIcon column="contact" /></div></th>;
      case 'value':
        return <th key="value" className={`${thSort} text-right`} onClick={() => handleSort('value')}><div className="flex items-center justify-end space-x-1"><span>Value</span><SortIcon column="value" /></div></th>;
      case 'stage':
        return <th key="stage" className={thSort} onClick={() => handleSort('stage')}><div className="flex items-center space-x-1"><span>Stage</span><SortIcon column="stage" /></div></th>;
      case 'closeDate':
        return <th key="closeDate" className={thSort} onClick={() => handleSort('closeDate')}><div className="flex items-center space-x-1"><span>Close Date</span><SortIcon column="closeDate" /></div></th>;
      case 'lastActivity':
        return <th key="lastActivity" className={thBase}>Last Activity</th>;
      case 'nextStep':
        return <th key="nextStep" className={thBase}>Next Step</th>;
      case 'dealAge':
        return <th key="dealAge" className={thSort} onClick={() => handleSort('dealAge')}><div className="flex items-center space-x-1"><span>Deal Age</span><SortIcon column="dealAge" /></div></th>;
      case 'probability':
        return <th key="probability" className={thSort} onClick={() => handleSort('probability')}><div className="flex items-center space-x-1"><span>Probability</span><SortIcon column="probability" /></div></th>;
      case 'source':
        return <th key="source" className={thSort} onClick={() => handleSort('source')}><div className="flex items-center space-x-1"><span>Source</span><SortIcon column="source" /></div></th>;
      case 'health':
        return <th key="health" className={thSort} onClick={() => handleSort('health')}><div className="flex items-center space-x-1"><span>Health</span><SortIcon column="health" /></div></th>;
      case 'actions':
        return <th key="actions" className={thBase}>Actions</th>;
      default:
        return null;
    }
  };

  const renderCell = (key: ColumnKey, deal: Deal, isExpanded: boolean): React.ReactNode => {
    switch (key) {
      case 'dealName':
        return (
          <td key="dealName" className={`${cellPadding} max-w-[260px]`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600 leading-snug truncate"
                    onClick={(e) => { e.stopPropagation(); navigate(`/crm/deals/${deal.id}`); }}
                  >
                    {deal.dealName}
                  </span>
                  {deal.isHRMS && (
                    <span
                      className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-semibold rounded cursor-pointer hover:opacity-80"
                      style={{ backgroundColor: '#fff3cd', border: '1px solid #f59e0b', color: '#92400e' }}
                      onClick={(e) => { e.stopPropagation(); setShowHRMSModal(deal); }}
                      title="HRMS-connected deal"
                    >
                      HRMS
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); toggleRowExpansion(deal.id); }}
                className="flex-shrink-0 p-0.5 hover:bg-gray-100 rounded mt-0.5"
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
          <td key="account" className={`${cellPadding} max-w-[200px]`}>
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
              `${cellPadding} cursor-text transition-colors`,
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
            <td key="contact" className={`${cellPadding} text-sm`}>
              <span className="text-gray-400">—</span>
            </td>
          );
        }
        return (
          <td key="contact" className={cellPadding}>
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
              <div className={`text-sm font-semibold text-gray-900 tabular-nums ${isSaving ? 'animate-pulse opacity-60' : ''}`}>
                {formatAmountUSD(displayAmount)}
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
              `${cellPadding} cursor-text transition-colors`,
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
                    <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
                      <div>Total: 40 days in pipeline</div>
                      <div>Avg cycle: {avgDaysCycle} days</div>
                    </div>
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
              `${cellPadding} cursor-text transition-colors`,
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
          <td key="lastActivity" className={cellPadding}>
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
              `${cellPadding} max-w-[200px] cursor-text transition-colors`,
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
          <td key="dealAge" className={cellPadding}>
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
              `${cellPadding} cursor-text transition-colors`,
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
          <td key="source" className={cellPadding}>
            {deal.source ? (
              <span className={`bg-gray-100 text-gray-500 ${textSizeSecondary} font-medium px-2 py-0.5 rounded-full`}>
                {deal.source}
              </span>
            ) : (
              <span className="text-sm text-gray-400">—</span>
            )}
          </td>
        );

      case 'health': {
        const isClosed = ['closed-won', 'closed-lost'].includes(deal.stage);
        if (isClosed) {
          return (
            <td key="health" className={cellPadding}>
              <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${
                deal.stage === 'closed-won'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-600'
              }`}>
                {deal.stage === 'closed-won' ? 'Won' : 'Lost'}
              </span>
            </td>
          );
        }

        const mergedDeal = localEdits[deal.id] ? { ...deal, ...localEdits[deal.id] } : deal;
        const cardLite = toDealCardLite(mergedDeal);
        const closeDaysLeft = mergedDeal.closeDate ? daysFromNow(mergedDeal.closeDate) : null;
        const healthExpl = explainDealHealth(cardLite, closeDaysLeft);
        const barColor = healthExpl.tier === 'strong' ? '#10b981'
          : healthExpl.tier === 'fair' ? '#f59e0b' : '#ef4444';
        const tierCls = healthExpl.tier === 'strong'
          ? 'bg-emerald-100 text-emerald-700'
          : healthExpl.tier === 'fair'
            ? 'bg-amber-100 text-amber-700'
            : 'bg-red-100 text-red-700';

        return (
          <td key="health" className={cellPadding}>
            <div
              className="relative"
              onMouseEnter={() => setHoveredScore(deal.id)}
              onMouseLeave={() => setHoveredScore(null)}
            >
              <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium cursor-default ${tierCls}`}>
                <span className="font-bold tabular-nums">{deal.aiScore}</span>
                <span>·</span>
                <span>{healthExpl.tierLabel}</span>
              </div>
              <div className="mt-1.5 h-1 bg-gray-100 rounded-full w-20 overflow-hidden">
                <div
                  className="h-1 rounded-full"
                  style={{ width: `${deal.aiScore}%`, backgroundColor: barColor }}
                />
              </div>

              {hoveredScore === deal.id && (
                <div
                  className="absolute left-0 top-full mt-1.5 w-72 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-900">AI Win Probability</span>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${tierCls}`}>
                      {healthExpl.tierLabel}
                    </span>
                  </div>
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-gray-500">Score</span>
                      <span className="text-sm font-bold tabular-nums" style={{ color: barColor }}>
                        {healthExpl.score}/100
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-2 rounded-full"
                        style={{ width: `${healthExpl.score}%`, backgroundColor: barColor }}
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 mb-3 leading-snug">{healthExpl.headline}</p>
                  {healthExpl.risks.length > 0 && (
                    <div className="mb-2.5">
                      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Risks</div>
                      <div className="space-y-1.5">
                        {healthExpl.risks.slice(0, 3).map(r => (
                          <div key={r.id} className="flex items-start justify-between gap-2">
                            <div className="flex items-start space-x-1.5 min-w-0">
                              <AlertTriangle className="h-3 w-3 text-red-400 flex-shrink-0 mt-0.5" />
                              <span className="text-[11px] text-gray-700 leading-snug">{r.label}</span>
                            </div>
                            {r.action && (
                              <span className="text-[10px] text-gray-400 flex-shrink-0 italic">{r.action}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {healthExpl.positives.length > 0 && (
                    <div className="mb-2.5">
                      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Positives</div>
                      <div className="space-y-1.5">
                        {healthExpl.positives.slice(0, 2).map(p => (
                          <div key={p.id} className="flex items-center space-x-1.5">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                            <span className="text-[11px] text-gray-700">{p.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-[9px] text-gray-400 mt-2 pt-2 border-t border-gray-100 leading-snug">
                    Score reflects AI-estimated win probability based on engagement, close date, next-step discipline, and deal attributes.
                  </p>
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
                  title="Schedule Follow-up"
                  onClick={(e) => { e.stopPropagation(); openScheduleFollowUp(deal); }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  <CalendarPlus size={14} />
                </button>
                <button
                  title="Create Task"
                  onClick={(e) => { e.stopPropagation(); openCreateTask(deal); }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  <CheckSquare size={14} />
                </button>
              </div>
              {/* ··· dropdown */}
              <div className="relative">
                <button
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
                      <MenuItem icon={<ClipboardList size={13} />} label="Log Meeting Outcome"
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
                      <MenuItem icon={<Link2 size={13} />} label="Share Deal"
                        onClick={() => { shareDeal(deal); setShowActionDropdown(null); }} />
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

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Stats Bar ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className={`grid gap-6 ${activePairCount > 0 ? 'grid-cols-7' : 'grid-cols-6'}`}>

          {/* Card 1: Total Deals — clickable, active when no KPI filter */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setActiveKpiFilter(null)}
            onKeyDown={e => e.key === 'Enter' && setActiveKpiFilter(null)}
            className={[
              'relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border',
              'cursor-pointer select-none transition-all duration-150',
              'hover:shadow-md hover:scale-[1.01]',
              activeKpiFilter === null
                ? 'border-indigo-400 ring-2 ring-indigo-400 ring-offset-1'
                : 'border-blue-200',
            ].join(' ')}
          >
            <div className={`text-3xl text-blue-900 ${activeKpiFilter === null ? 'font-extrabold' : 'font-bold'}`}>
              {filteredDeals.length}
            </div>
            <div className="text-sm text-blue-700 font-medium mt-1">Total Deals</div>
          </div>

          {/* Card 2: Total Value — decorative only */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200 cursor-default">
            <div className="text-3xl font-bold text-green-900">{formatAmountUSD(totalValue)}</div>
            <div className="text-sm text-green-700 font-medium mt-1">Total Value</div>
          </div>

          {/* Card 3: Avg Win Rate — decorative only */}
          <div
            className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200 cursor-default"
            title="Win rate based on closed deals in the current period"
          >
            <div className="text-3xl font-bold text-purple-900">{avgWinRate}%</div>
            <div className="text-sm text-purple-700 font-medium mt-1">Avg Win Rate</div>
          </div>

          {/* Card 4: Closing This Week — clickable filter */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setActiveKpiFilter(activeKpiFilter === 'closingWeek' ? null : 'closingWeek')}
            onKeyDown={e => e.key === 'Enter' && setActiveKpiFilter(activeKpiFilter === 'closingWeek' ? null : 'closingWeek')}
            className={[
              'relative bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border',
              'cursor-pointer select-none transition-all duration-150',
              'hover:shadow-md hover:scale-[1.01]',
              activeKpiFilter === 'closingWeek'
                ? 'border-orange-400 ring-2 ring-orange-400 ring-offset-2 scale-[1.02]'
                : 'border-orange-200',
            ].join(' ')}
          >
            {activeKpiFilter === 'closingWeek' && (
              <button
                title="Clear filter"
                onClick={e => { e.stopPropagation(); setActiveKpiFilter(null); }}
                className="absolute top-2 right-2 w-4 h-4 text-gray-400 hover:text-gray-600 leading-none"
                tabIndex={-1}
              >×</button>
            )}
            <div className={`text-3xl text-orange-900 ${activeKpiFilter === 'closingWeek' ? 'font-extrabold' : 'font-bold'}`}>
              {kpiClosingCount}
            </div>
            <div className="text-sm text-orange-700 font-medium mt-1">Closing This Week</div>
          </div>

          {/* Card 5: Stalled Deals — clickable filter */}
          <div
            role="button"
            tabIndex={0}
            title={stalledConfig.enabled
              ? `Deals stalled when: ${[
                  stalledConfig.criteria.noActivity.enabled && `no activity ${stalledConfig.criteria.noActivity.threshold}d+`,
                  stalledConfig.criteria.noNextStep.enabled && 'no next step set',
                  stalledConfig.criteria.closeOverdue.enabled && 'close date passed',
                  stalledConfig.criteria.dealAge.enabled && `deal age ${stalledConfig.criteria.dealAge.threshold}d+`,
                ].filter(Boolean).join(', ')}. Click to filter.`
              : 'Stall detection is disabled. Click to filter.'}
            onClick={() => setActiveKpiFilter(activeKpiFilter === 'stalled' ? null : 'stalled')}
            onKeyDown={e => e.key === 'Enter' && setActiveKpiFilter(activeKpiFilter === 'stalled' ? null : 'stalled')}
            className={[
              'relative bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border',
              'cursor-pointer select-none transition-all duration-150',
              'hover:shadow-md hover:scale-[1.01]',
              activeKpiFilter === 'stalled'
                ? 'border-red-400 ring-2 ring-red-400 ring-offset-2 scale-[1.02]'
                : 'border-red-200',
            ].join(' ')}
          >
            {activeKpiFilter === 'stalled' && (
              <button
                title="Clear filter"
                onClick={e => { e.stopPropagation(); setActiveKpiFilter(null); }}
                className="absolute top-2 right-2 w-4 h-4 text-gray-400 hover:text-gray-600 leading-none"
                tabIndex={-1}
              >×</button>
            )}
            <div className={`text-3xl text-red-900 ${activeKpiFilter === 'stalled' ? 'font-extrabold' : 'font-bold'}`}>
              {kpiStalledCount}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-sm text-red-700 font-medium">Stalled Deals</span>
              <button
                onClick={e => { e.stopPropagation(); navigate('/crm/settings'); }}
                title="Configure stall rules in Settings → Pipeline Settings → Stalled Rules"
                className="text-red-400 hover:text-red-600 transition-colors"
                tabIndex={-1}
              >
                <Settings size={12} />
              </button>
            </div>
          </div>

          {/* Card 6: Days Avg Cycle — decorative only */}
          <div
            className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200 cursor-default"
            title="Average deal cycle based on closed deals"
          >
            <div className="text-3xl font-bold text-gray-900">{avgDaysCycle}</div>
            <div className="text-sm text-gray-700 font-medium mt-1">Days Avg Cycle</div>
          </div>

          {/* Card 7: Duplicate Pairs — only shown when pairs exist */}
          {activePairCount > 0 && (
            <button
              onClick={() => setDuplicateDrawerOpen(true)}
              title="Potential duplicate deals detected — click to review"
              className={[
                'relative bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border',
                'cursor-pointer select-none transition-all duration-150 text-left w-full',
                'hover:shadow-md hover:scale-[1.01] border-amber-300',
              ].join(' ')}
            >
              <div className="text-3xl font-bold text-amber-800">{activePairCount}</div>
              <div className="text-sm text-amber-700 font-medium mt-1">Duplicate<br />Pairs</div>
            </button>
          )}

        </div>
      </div>

      {/* ── Filter Bar ────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100" ref={filterBarRef}>

        {/* Mobile: single "Filters" button */}
        <div className="md:hidden flex items-center gap-2 px-4 py-3">
          <button
            onClick={() => setShowMobileFilters(true)}
            className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-600"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {hasActiveFilters && (
              <span className="bg-indigo-500 text-white text-[10px] rounded-full px-1.5 py-0.5 leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button onClick={clearAllFilters} className="text-sm text-red-500 hover:text-red-700 font-medium">
              Clear all
            </button>
          )}
        </div>

        {/* Desktop: full filter row */}
        <div className="hidden md:flex items-center gap-2 flex-wrap px-4 py-3">

          {/* ── Stage ── */}
          <div className="relative">
            <button
              onClick={() => setOpenFilter(openFilter === 'stage' ? null : 'stage')}
              className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                selectedStages.size > 0
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              Stage
              {selectedStages.size > 0 && (
                <span className="ml-0.5 bg-indigo-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 inline-flex items-center justify-center px-1">
                  {selectedStages.size}
                </span>
              )}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openFilter === 'stage' ? 'rotate-180' : ''}`} />
            </button>
            {openFilter === 'stage' && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-3 z-50 min-w-[180px]">
                {stageFilterOptions.map(s => (
                  <label key={s} className="flex items-center gap-2 px-1 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStages.has(s)}
                      onChange={() => setSelectedStages(prev => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n; })}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">{s}</span>
                  </label>
                ))}
                {stageFilterOptions.length === 0 && <p className="text-xs text-gray-400 px-1">No stages found</p>}
              </div>
            )}
          </div>

          {/* ── Owner ── */}
          <div className="relative">
            <button
              onClick={() => setOpenFilter(openFilter === 'owner' ? null : 'owner')}
              className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                selectedOwners.size > 0
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              Owner
              {selectedOwners.size > 0 && (
                <span className="ml-0.5 bg-indigo-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 inline-flex items-center justify-center px-1">
                  {selectedOwners.size}
                </span>
              )}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openFilter === 'owner' ? 'rotate-180' : ''}`} />
            </button>
            {openFilter === 'owner' && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-3 z-50 min-w-[200px]">
                {ownerFilterOptions.map(o => (
                  <label key={o} className="flex items-center gap-2 px-1 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedOwners.has(o)}
                      onChange={() => setSelectedOwners(prev => { const n = new Set(prev); n.has(o) ? n.delete(o) : n.add(o); return n; })}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-semibold text-indigo-700">{getInitials(o)}</span>
                    </div>
                    <span className="text-sm text-gray-700">{o}</span>
                  </label>
                ))}
                {ownerFilterOptions.length === 0 && <p className="text-xs text-gray-400 px-1">No owners found</p>}
              </div>
            )}
          </div>

          {/* ── Close Date ── */}
          <div className="relative">
            <button
              onClick={() => setOpenFilter(openFilter === 'closeDate' ? null : 'closeDate')}
              className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                closeDateFilter.preset !== 'all'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              Close Date
              {closeDateFilter.preset !== 'all' && (
                <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block flex-shrink-0" />
              )}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openFilter === 'closeDate' ? 'rotate-180' : ''}`} />
            </button>
            {openFilter === 'closeDate' && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-3 z-50 min-w-[240px]">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {([
                    { value: 'thisWeek',    label: 'This Week' },
                    { value: 'thisMonth',   label: 'This Month' },
                    { value: 'thisQuarter', label: 'This Quarter' },
                    { value: 'overdue',     label: 'Overdue' },
                    { value: 'custom',      label: 'Custom Range' },
                  ] as const).map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setCloseDateFilter(
                        closeDateFilter.preset === value ? { preset: 'all' } : { preset: value }
                      )}
                      className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                        closeDateFilter.preset === value
                          ? 'bg-purple-100 text-purple-700 border-purple-300'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className={closeDateFilter.preset === 'custom' ? 'block mt-2 pt-2 border-t border-gray-100' : 'hidden'}>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] text-gray-500 font-medium block mb-0.5">From</label>
                      <input
                        type="date"
                        value={closeDateFilter.from ?? ''}
                        onChange={e => setCloseDateFilter(prev => ({ ...prev, from: e.target.value || undefined }))}
                        className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 font-medium block mb-0.5">To</label>
                      <input
                        type="date"
                        value={closeDateFilter.to ?? ''}
                        onChange={e => setCloseDateFilter(prev => ({ ...prev, to: e.target.value || undefined }))}
                        className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Value ── */}
          <div className="relative">
            <button
              onClick={() => setOpenFilter(openFilter === 'value' ? null : 'value')}
              className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                valueFilter.min !== null || valueFilter.max !== null
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              Value
              {(valueFilter.min !== null || valueFilter.max !== null) && (
                <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block flex-shrink-0" />
              )}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openFilter === 'value' ? 'rotate-180' : ''}`} />
            </button>
            {openFilter === 'value' && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-3 z-50 min-w-[220px]">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {([
                    { label: '< $10K',       min: null,   max: 10000  },
                    { label: '$10K – $50K',  min: 10000,  max: 50000  },
                    { label: '$50K – $200K', min: 50000,  max: 200000 },
                    { label: '> $200K',      min: 200000, max: null   },
                  ] as const).map((preset) => {
                    const isActive = valueFilter.min === preset.min && valueFilter.max === preset.max;
                    return (
                      <button
                        key={preset.label}
                        onClick={() => setValueFilter(isActive ? { min: null, max: null } : { min: preset.min, max: preset.max })}
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                          isActive
                            ? 'bg-blue-100 text-blue-700 border-blue-300'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
                <div className="border-t border-gray-100 my-2" />
                <div className="text-xs text-gray-400 mb-1.5">Custom range</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-400 block mb-0.5">Min $</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={valueFilter.min ?? ''}
                      onChange={e => setValueFilter(prev => ({ ...prev, min: e.target.value ? parseFloat(e.target.value) : null }))}
                      className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                  </div>
                  <span className="text-gray-400 text-sm mt-3">–</span>
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-400 block mb-0.5">Max $</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="∞"
                      value={valueFilter.max ?? ''}
                      onChange={e => setValueFilter(prev => ({ ...prev, max: e.target.value ? parseFloat(e.target.value) : null }))}
                      className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Source ── */}
          <div className="relative">
            <button
              onClick={() => setOpenFilter(openFilter === 'source' ? null : 'source')}
              className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                selectedSources.size > 0
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              Source
              {selectedSources.size > 0 && (
                <span className="ml-0.5 bg-indigo-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 inline-flex items-center justify-center px-1">
                  {selectedSources.size}
                </span>
              )}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openFilter === 'source' ? 'rotate-180' : ''}`} />
            </button>
            {openFilter === 'source' && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-3 z-50 min-w-[180px]">
                {sourceFilterOptions.map(s => (
                  <label key={s} className="flex items-center gap-2 px-1 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedSources.has(s)}
                      onChange={() => setSelectedSources(prev => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n; })}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{s}</span>
                  </label>
                ))}
                {sourceFilterOptions.length === 0 && <p className="text-xs text-gray-400 px-1">No sources found</p>}
              </div>
            )}
          </div>

          {/* ── Health ── */}
          <div className="relative">
            <button
              onClick={() => setOpenFilter(openFilter === 'health' ? null : 'health')}
              className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                selectedHealthTiers.size > 0
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              Health
              {selectedHealthTiers.size > 0 && (
                <span className="ml-0.5 bg-indigo-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 inline-flex items-center justify-center px-1">
                  {selectedHealthTiers.size}
                </span>
              )}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openFilter === 'health' ? 'rotate-180' : ''}`} />
            </button>
            {openFilter === 'health' && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-3 z-50 min-w-[260px]">
                <div className="flex gap-2">
                  {([
                    { tier: 'strong' as HealthTierFilter, label: 'Healthy', dot: 'bg-green-500', activeClass: 'bg-green-100 text-green-700 border-green-300' },
                    { tier: 'fair'   as HealthTierFilter, label: 'Watch',   dot: 'bg-amber-500', activeClass: 'bg-amber-100 text-amber-700 border-amber-300' },
                    { tier: 'weak'   as HealthTierFilter, label: 'At Risk', dot: 'bg-red-500',   activeClass: 'bg-red-100   text-red-700   border-red-300'   },
                  ]).map(({ tier, label, dot, activeClass }) => (
                    <button
                      key={tier}
                      onClick={() => {
                        const next = new Set(selectedHealthTiers);
                        next.has(tier) ? next.delete(tier) : next.add(tier);
                        setSelectedHealthTiers(next);
                      }}
                      className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border font-medium transition-colors ${
                        selectedHealthTiers.has(tier)
                          ? activeClass
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Activity Gap ── */}
          <div className="relative">
            <button
              onClick={() => setOpenFilter(openFilter === 'pipelineAge' ? null : 'pipelineAge')}
              className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                pipelineAgeFilter.min !== null || pipelineAgeFilter.max !== null
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              Activity Gap
              {(pipelineAgeFilter.min !== null || pipelineAgeFilter.max !== null) && (
                <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block flex-shrink-0" />
              )}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openFilter === 'pipelineAge' ? 'rotate-180' : ''}`} />
            </button>
            {openFilter === 'pipelineAge' && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-3 z-50 min-w-[200px]">
                <p className="text-[11px] text-gray-500 font-medium mb-1">
                  Activity Gap (days)
                  <span title="Deals with no contact activity in the last N days" className="ml-1 cursor-help text-gray-400">ⓘ</span>
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-400 block mb-0.5">Min days</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={pipelineAgeFilter.min ?? ''}
                      onChange={e => setPipelineAgeFilter(prev => ({ ...prev, min: e.target.value ? parseInt(e.target.value) : null }))}
                      className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                  </div>
                  <span className="text-gray-400 text-sm mt-3">–</span>
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-400 block mb-0.5">Max days</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="∞"
                      value={pipelineAgeFilter.max ?? ''}
                      onChange={e => setPipelineAgeFilter(prev => ({ ...prev, max: e.target.value ? parseInt(e.target.value) : null }))}
                      className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                  </div>
                </div>
                <button
                  onClick={() => setPipelineAgeFilter({ min: null, max: null })}
                  className="mt-2 text-xs text-gray-400 hover:text-gray-600 w-full text-left"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* ── Advanced filter builder toggle ── */}
          <button
            onClick={() => setShowBuilder(v => !v)}
            className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
              advancedConditions.length > 0
                ? 'bg-violet-50 border-violet-300 text-violet-700 font-medium'
                : showBuilder
                  ? 'bg-gray-100 border-gray-300 text-gray-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {advancedConditions.length > 0
              ? `${advancedConditions.length} condition${advancedConditions.length !== 1 ? 's' : ''}`
              : 'Build filter'}
          </button>

          {/* ── Column settings ── */}
          <div className="ml-auto flex items-center gap-2">

            {/* Density toggle */}
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button
                title="Comfortable density"
                onClick={() => setDensity('comfortable')}
                className={`p-1.5 transition-colors ${density === 'comfortable' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
              >
                <AlignJustify className="h-3.5 w-3.5" />
              </button>
              <button
                title="Compact density"
                onClick={() => setDensity('compact')}
                className={`p-1.5 transition-colors ${density === 'compact' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
              >
                <LayoutList className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Column settings gear */}
            <div className="relative">
              <button
                className="flex items-center px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200"
                onClick={(e) => { e.stopPropagation(); setShowColumnSettings(v => !v); }}
                title="Column settings"
              >
                <Settings className="h-4 w-4" />
              </button>
              {showColumnSettings && (
                <div
                  className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="px-3 pb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    Columns
                  </p>
                  {columnOrder.map(key => {
                    const col = ALL_COLUMNS.find(c => c.key === key)!;
                    return (
                      <div
                        key={key}
                        draggable
                        onDragStart={() => { dragKey.current = key; }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (!dragKey.current || dragKey.current === key) return;
                          setColumnOrder(prev => {
                            const next = [...prev];
                            const fromIdx = next.indexOf(dragKey.current!);
                            const toIdx = next.indexOf(key);
                            next.splice(fromIdx, 1);
                            next.splice(toIdx, 0, dragKey.current!);
                            return next;
                          });
                          dragKey.current = null;
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-default"
                      >
                        <GripVertical className="h-3.5 w-3.5 text-gray-300 cursor-grab flex-shrink-0" />
                        <input
                          type="checkbox"
                          checked={visibleColumns.has(key)}
                          onChange={() => toggleColumn(key)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">{col.label}</span>
                      </div>
                    );
                  })}
                  <div className="border-t border-gray-200 mt-1 pt-1 px-3">
                    <button
                      onClick={resetColumns}
                      className="w-full text-left text-xs text-indigo-600 hover:text-indigo-700 py-1.5 font-medium"
                    >
                      Reset to default
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Active filter chips row */}
        {hasActiveFilters && (
          <div className="hidden md:flex items-center gap-2 flex-wrap px-4 py-2 border-t border-gray-100 bg-gray-50/50">
            <span className="text-xs text-gray-400 font-medium shrink-0">Active:</span>
            {[...selectedStages].map(s => (
              <FilterChip key={`stage-${s}`} label={s} color="indigo" onRemove={() => setSelectedStages(prev => { const n = new Set(prev); n.delete(s); return n; })} />
            ))}
            {[...selectedOwners].map(o => (
              <FilterChip key={`owner-${o}`} label={o.split(' ')[0]} color="indigo" onRemove={() => setSelectedOwners(prev => { const n = new Set(prev); n.delete(o); return n; })} />
            ))}
            {[...selectedSources].map(s => (
              <FilterChip key={`source-${s}`} label={s} color="indigo" onRemove={() => setSelectedSources(prev => { const n = new Set(prev); n.delete(s); return n; })} />
            ))}
            {[...selectedHealthTiers].map(t => (
              <FilterChip
                key={`health-${t}`}
                label={HEALTH_TIER_LABELS[t]}
                color={t === 'strong' ? 'green' : t === 'fair' ? 'amber' : 'red'}
                onRemove={() => setSelectedHealthTiers(prev => { const n = new Set(prev); n.delete(t); return n; })}
              />
            ))}
            {closeDateFilter.preset !== 'all' && (
              <FilterChip
                color="purple"
                label={
                  closeDateFilter.preset === 'thisWeek'    ? 'This Week' :
                  closeDateFilter.preset === 'thisMonth'   ? 'This Month' :
                  closeDateFilter.preset === 'thisQuarter' ? 'This Quarter' :
                  closeDateFilter.preset === 'overdue'     ? 'Overdue' :
                  closeDateFilter.from && closeDateFilter.to ? `${closeDateFilter.from} – ${closeDateFilter.to}` :
                  closeDateFilter.from ? `From ${closeDateFilter.from}` :
                  closeDateFilter.to   ? `Until ${closeDateFilter.to}` : 'Custom'
                }
                onRemove={() => setCloseDateFilter({ preset: 'all' })}
              />
            )}
            {(valueFilter.min !== null || valueFilter.max !== null) && (
              <FilterChip
                color="blue"
                label={
                  valueFilter.min !== null && valueFilter.max !== null
                    ? `${fmtValK(valueFilter.min)} – ${fmtValK(valueFilter.max)}`
                    : valueFilter.min !== null
                      ? `> ${fmtValK(valueFilter.min)}`
                      : `< ${fmtValK(valueFilter.max!)}`
                }
                onRemove={() => setValueFilter({ min: null, max: null })}
              />
            )}
            {(pipelineAgeFilter.min !== null || pipelineAgeFilter.max !== null) && (
              <FilterChip
                color="orange"
                label={
                  pipelineAgeFilter.min !== null && pipelineAgeFilter.max !== null
                    ? `Idle ${pipelineAgeFilter.min}–${pipelineAgeFilter.max} days`
                    : pipelineAgeFilter.min !== null
                      ? `Idle ${pipelineAgeFilter.min}+ days`
                      : `Active < ${pipelineAgeFilter.max} days`
                }
                onRemove={() => setPipelineAgeFilter({ min: null, max: null })}
              />
            )}
            {advancedConditions.length > 0 && (
              <FilterChip
                color="purple"
                label={`⚙ ${advancedConditions.length} condition${advancedConditions.length !== 1 ? 's' : ''}`}
                onRemove={() => setAdvancedConditions([])}
              />
            )}
            <button
              onClick={clearAllFilters}
              className="text-xs text-red-500 hover:text-red-700 font-medium ml-auto shrink-0"
            >
              Clear all
            </button>
          </div>
        )}

        {/* KPI filter active pill */}
        {activeKpiFilter && (
          <div className="flex items-center gap-2 px-4 pb-2">
            <span className="text-xs text-gray-500">Filtered:</span>
            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full border border-indigo-200">
              {activeKpiFilter === 'closingWeek' ? 'Closing This Week' : 'Stalled Deals'}
              <button
                onClick={() => setActiveKpiFilter(null)}
                className="ml-1 text-indigo-400 hover:text-indigo-600 leading-none"
                title="Clear filter"
              >×</button>
            </span>
          </div>
        )}

      </div>

      {/* ── Advanced Filter Builder Panel ─────────────────────────────────────── */}
      {showBuilder && (
        <AdvancedFilterBuilder
          conditions={advancedConditions}
          conjunction={advancedConjunction}
          onConditionsChange={setAdvancedConditions}
          onConjunctionChange={setAdvancedConjunction}
          stageOptions={stageFilterOptions}
          ownerOptions={ownerFilterOptions}
          onClose={() => setShowBuilder(false)}
        />
      )}

      {/* Mobile filter sheet */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto md:hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 sticky top-0 bg-white">
            <h2 className="text-base font-semibold text-gray-900">Filters</h2>
            <button onClick={() => setShowMobileFilters(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4 space-y-6">
            {/* Stage */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Stage</p>
              <div className="space-y-2">
                {stageFilterOptions.map(s => (
                  <label key={s} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={selectedStages.has(s)} onChange={() => setSelectedStages(prev => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n; })} className="rounded border-gray-300 text-indigo-600" />
                    <span className="text-sm text-gray-700 capitalize">{s}</span>
                  </label>
                ))}
              </div>
            </div>
            {/* Owner */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Owner</p>
              <div className="space-y-2">
                {ownerFilterOptions.map(o => (
                  <label key={o} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={selectedOwners.has(o)} onChange={() => setSelectedOwners(prev => { const n = new Set(prev); n.has(o) ? n.delete(o) : n.add(o); return n; })} className="rounded border-gray-300 text-indigo-600" />
                    <span className="text-sm text-gray-700">{o}</span>
                  </label>
                ))}
              </div>
            </div>
            {/* Source */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Source</p>
              <div className="space-y-2">
                {sourceFilterOptions.map(s => (
                  <label key={s} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={selectedSources.has(s)} onChange={() => setSelectedSources(prev => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n; })} className="rounded border-gray-300 text-indigo-600" />
                    <span className="text-sm text-gray-700">{s}</span>
                  </label>
                ))}
              </div>
            </div>
            {/* Health */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Health</p>
              <div className="space-y-2">
                {([['strong','Healthy','bg-green-400'],['fair','Watch','bg-amber-400'],['weak','At Risk','bg-red-400']] as [HealthTierFilter,string,string][]).map(([tier,label,dot]) => (
                  <label key={tier} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={selectedHealthTiers.has(tier)} onChange={() => setSelectedHealthTiers(prev => { const n = new Set(prev); n.has(tier) ? n.delete(tier) : n.add(tier); return n; })} className="rounded border-gray-300 text-indigo-600" />
                    <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            {/* Close Date */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Close Date</p>
              <div className="space-y-2">
                {(['all','thisWeek','thisMonth','thisQuarter','overdue','custom'] as const).map(preset => (
                  <label key={preset} className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" name="mobileCloseDatePreset" checked={closeDateFilter.preset === preset} onChange={() => setCloseDateFilter({ preset })} className="text-indigo-600" />
                    <span className="text-sm text-gray-700">{preset === 'all' ? 'Any' : preset === 'thisWeek' ? 'This week' : preset === 'thisMonth' ? 'This month' : preset === 'thisQuarter' ? 'This quarter' : preset === 'overdue' ? 'Overdue' : 'Custom'}</span>
                  </label>
                ))}
                {closeDateFilter.preset === 'custom' && (
                  <div className="space-y-2 pl-6">
                    <input type="date" value={closeDateFilter.from ?? ''} onChange={e => setCloseDateFilter(prev => ({ ...prev, from: e.target.value || undefined }))} className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                    <input type="date" value={closeDateFilter.to ?? ''} onChange={e => setCloseDateFilter(prev => ({ ...prev, to: e.target.value || undefined }))} className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                  </div>
                )}
              </div>
            </div>
            {/* Value */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Value range</p>
              <div className="flex items-center gap-2">
                <input type="number" min={0} placeholder="Min $" value={valueFilter.min ?? ''} onChange={e => setValueFilter(prev => ({ ...prev, min: e.target.value ? parseFloat(e.target.value) : null }))} className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                <span className="text-gray-400">–</span>
                <input type="number" min={0} placeholder="Max $" value={valueFilter.max ?? ''} onChange={e => setValueFilter(prev => ({ ...prev, max: e.target.value ? parseFloat(e.target.value) : null }))} className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-400" />
              </div>
            </div>
            {/* Activity Gap */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Activity Gap (days)</p>
              <p className="text-xs text-gray-400 mb-2">Deals with no contact activity in the last N days.</p>
              <div className="flex items-center gap-2">
                <input type="number" min={0} placeholder="Min" value={pipelineAgeFilter.min ?? ''} onChange={e => setPipelineAgeFilter(prev => ({ ...prev, min: e.target.value ? parseInt(e.target.value) : null }))} className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                <span className="text-gray-400">–</span>
                <input type="number" min={0} placeholder="Max" value={pipelineAgeFilter.max ?? ''} onChange={e => setPipelineAgeFilter(prev => ({ ...prev, max: e.target.value ? parseInt(e.target.value) : null }))} className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-400" />
              </div>
            </div>
          </div>
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-3">
            {hasActiveFilters && (
              <button onClick={clearAllFilters} className="flex-1 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
                Clear all
              </button>
            )}
            <button onClick={() => setShowMobileFilters(false)} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
              Done ({filteredDeals.length} deals)
            </button>
          </div>
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────────────────────── */}
      <div className="px-8 py-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[1300px]">
            <thead className="bg-gray-50/80 border-b-2 border-gray-200">
              <tr>
                {/* Checkbox — always visible */}
                <th className={`w-12 pl-3 ${density === 'compact' ? 'py-2' : 'py-3'}`}>
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
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {sortedDeals.map((deal) => {
                const isExpanded = expandedRows.includes(deal.id);
                const isSelected = selectedDealSet.has(deal.id);

                // Pre-compute expanded panel data for all rows (< 200 rows, acceptable per PERF NOTE)
                const isClosed = ['closed-won', 'closed-lost'].includes(deal.stage);
                const expandedMerged = localEdits[deal.id] ? { ...deal, ...localEdits[deal.id] } : deal;
                const expandedCardLite = toDealCardLite(expandedMerged);
                const expandedCloseDays = expandedMerged.closeDate ? daysFromNow(expandedMerged.closeDate) : null;
                const healthExpl = isClosed ? null : explainDealHealth(expandedCardLite, expandedCloseDays);
                const { tier: healthTier } = scoreToHealthTier(deal.aiScore);
                const accentClass = isClosed ? 'border-gray-300'
                  : healthTier === 'strong' ? 'border-green-400'
                  : healthTier === 'fair'   ? 'border-amber-400'
                  : 'border-red-400';
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
                  <React.Fragment key={deal.id}>
                    <tr
                      className={getRowClassName(isExpanded, isSelected, hoveredRowId === deal.id)}
                      onClick={() => toggleRowExpansion(deal.id)}
                      onContextMenu={(e) => handleContextMenu(e, deal.id)}
                      onMouseEnter={() => setHoveredRowId(deal.id)}
                      onMouseLeave={() => setHoveredRowId(null)}
                    >
                      {/* Checkbox */}
                      <td className={`pl-3 ${density === 'compact' ? 'py-2' : 'py-3'}`} onClick={(e) => e.stopPropagation()}>
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
                          <div className="mx-3 mb-3 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-opacity duration-150">
                            {/* Action strip — workflow-first pill buttons */}
                            <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-gray-100 flex-wrap">
                              {([
                                { label: 'Schedule Follow-up', icon: <CalendarPlus size={13} />, action: () => openScheduleFollowUp(deal) },
                                { label: 'Create Task',        icon: <CheckSquare size={13} />,   action: () => openCreateTask(deal) },
                                { label: 'Log Meeting',        icon: <ClipboardList size={13} />, action: () => openLogMeeting(deal) },
                                { label: 'Share',              icon: <Link2 size={13} />,         action: () => shareDeal(deal) },
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
                            <div className={`flex border-l-4 ${accentClass}`}>

                              {/* Zone 1 — People & Time */}
                              <div className="w-48 flex-shrink-0 border-r border-gray-100 p-4">
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
                              <div className="flex-1 border-r border-gray-100 p-4">
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

                              {/* Zone 3 — AI Signals */}
                              <div className="flex-1 border-r border-gray-100 p-4">
                                <div className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase mb-2">AI Signals</div>
                                {isClosed ? (
                                  <div className="flex items-center gap-2">
                                    {deal.stage === 'closed-won'
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
                              </div>

                              {/* Zone 4 — Quick Actions */}
                              <div className="w-44 flex-shrink-0 p-4">
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
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {sortedDeals.length === 0 && (
            <div className="text-center py-16">
              <Building2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500">No deals match your filters</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting the stage, date, or value filters above.</p>
            </div>
          )}
        </div>

        <div className="mt-4 text-center text-sm text-gray-600">
          Showing {sortedDeals.length} of {allDeals.length} deals
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
              <MenuItem icon={<ClipboardList size={14} />} label="Log Meeting Outcome"
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
              <MenuItem icon={<Link2 size={14} />} label="Share Deal"
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
                  <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Time</label>
                  <input type="time" value={followUpTime} onChange={e => setFollowUpTime(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Notes (optional)</label>
                <textarea value={followUpNotes} onChange={e => setFollowUpNotes(e.target.value)}
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
                  showBulkToast(`Follow-up scheduled for "${name}"`);
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
                <input type="text" value={taskTitle} onChange={e => setTaskTitle(e.target.value)}
                  placeholder="e.g. Send follow-up email, Prepare proposal..."
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Due date</label>
                  <input type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Priority</label>
                  <select value={taskPriority} onChange={e => setTaskPriority(e.target.value as 'high' | 'medium' | 'low')}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400 bg-white">
                    <option value="high">🔴 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Assign to</label>
                <select value={taskAssignee} onChange={e => setTaskAssignee(e.target.value)}
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
                  showBulkToast(`Task created for "${name}"`);
                }}
                className="flex-1 text-sm font-medium bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Create task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Log Meeting Outcome Modal ─────────────────────────────────────────── */}
      {logMeetingDeal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setLogMeetingDeal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <ClipboardList size={18} className="text-indigo-600" />
                <h3 className="text-base font-semibold text-gray-900">Log Meeting Outcome</h3>
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
                <textarea value={meetingNotes} onChange={e => setMeetingNotes(e.target.value)}
                  placeholder="What was discussed, key objections, decisions made..."
                  rows={3}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-400 resize-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Next step</label>
                <input type="text" value={meetingNextStep} onChange={e => setMeetingNextStep(e.target.value)}
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
                  showBulkToast(`Meeting outcome logged for "${name}"`);
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
                  showBulkToast(`Added "${addSequenceDeal.dealName}" to "${seq?.name}"`);
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
                    showBulkToast(`"${deleteConfirmDeal.dealName}" deleted`);
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
                      showBulkToast(`${count} deal${count !== 1 ? 's' : ''} deleted`);
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
                  <input
                    type="email"
                    defaultValue={showEmailModal.contactName}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    defaultValue={`Re: ${showEmailModal.dealName}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
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
              <button
                onClick={() => setShowEmailModal(null)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Send Email
              </button>
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
                  <input
                    type="text"
                    defaultValue={showCallModal.contactName}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Call Duration</label>
                  <input
                    type="text"
                    placeholder="e.g., 15 minutes"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Call Notes</label>
                  <textarea
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="What was discussed..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
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

      {/* ── HRMS Modal ────────────────────────────────────────────────────────── */}
      {showHRMSModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">HRMS Connection Details</h3>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <Building2 className="h-6 w-6 text-orange-600" />
                  <div>
                    <div className="font-semibold text-gray-900">{showHRMSModal.dealName}</div>
                    <div className="text-sm text-gray-600">
                      {showHRMSModal.companyName
                        ? `${showHRMSModal.companyName} · Connected to HRMS System`
                        : 'Connected to HRMS System'}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Last Sync:</span>
                    <span className="text-sm font-medium text-gray-900">{formatRelativeTime(showHRMSModal.lastActivity, '—')}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Data Quality:</span>
                    <span className="text-sm font-medium text-green-600">Excellent</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">Integration Status:</span>
                    <span className="flex items-center space-x-1 text-sm font-medium text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Active</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowHRMSModal(null)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Actions Bar ──────────────────────────────────────────────────── */}
      <div
        role="toolbar"
        aria-label="Bulk actions"
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-200 ease-out
          ${showBulkActions ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gray-900 text-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-2">

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
                Select all {kpiFilteredDeals.length}
              </button>
            )}
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
                      showBulkToast(`Stage updated for ${count} deal${count !== 1 ? 's' : ''}`);
                    }}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {stage.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reassign Owner */}
          <div className="relative flex-shrink-0">
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
                      showBulkToast(`Owner updated for ${count} deal${count !== 1 ? 's' : ''}`);
                    }}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {ownerName}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add Tag */}
          <div className="relative flex-shrink-0">
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
                        showBulkToast(`Tag added to ${count} deal${count !== 1 ? 's' : ''}`);
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
                      showBulkToast(`Tag added to ${count} deal${count !== 1 ? 's' : ''}`);
                    }}
                    className="px-2.5 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Export — immediate CSV download, no modal */}
          <button
            onClick={() => {
              const selectedList = allDeals.filter(d => selectedDealSet.has(d.id));
              const today = new Date().toISOString().slice(0, 10);
              const headers = ['Deal Name', 'Account', 'Owner', 'Contact', 'Value', 'Stage', 'Close Date', 'Health Score', 'Source', 'Deal Age (days)'];
              const rows = selectedList.map(d => [
                d.dealName,
                d.companyName || d.accountName || '',
                d.owner || '',
                d.contactName || '',
                d.amount.toString(),
                d.stage,
                d.closeDate || '',
                d.aiScore.toString(),
                d.source || '',
                getDealAgeDays(d.createdAt).toString(),
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
            className="text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-1.5 flex-shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>

          {/* Archive */}
          <div className="relative flex-shrink-0">
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
                                {deal.amount ? formatAmountUSD(deal.amount) : '—'}
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
