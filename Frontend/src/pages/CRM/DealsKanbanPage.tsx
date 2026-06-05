import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { fetchDeals } from '../../utils/dealsApi';
import {
  formatDisplayDate,
  formatRelativeTime,
  formatCloseDate,
  daysFromNow,
  daysFromNowLabel,
  isWithinDays,
  parseDateMs,
} from '../../utils/dateUtils';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  Plus,
  Search,
  Filter,
  Download,
  Settings,
  TrendingUp,
  AlertTriangle,
  Clock,
  DollarSign,
  Target,
  Building2,
  User,
  Calendar,
  Sparkles,
  CheckCircle2,
  XCircle,
  BarChart3,
  MoreVertical,
  FileDown,
  Upload,
  Archive,
  Columns,
  LayoutList,
  AlignJustify,
  RotateCcw,
  X as XIcon,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react';
import DealsListView from './DealsListView';
import DealsGridView from './DealsGridView';
import DealKanbanCard, { type DealCard } from '../../components/Deal/DealKanbanCard';
import DealSlideoutPanel from '../../components/Deal/DealSlideoutPanel';
import {
  SAVED_VIEWS,
  findView,
  getActiveFilterPills,
  isAnyFilterActive,
  type SavedView,
} from '../../utils/dealViews';
import ManagerInspectionBar from '../../components/Deal/ManagerInspectionBar';
import {
  computeInspectionSignals,
  getInspectionBadge,
} from '../../utils/inspectionSignals';

interface PipelineStage {
  id: string;
  name: string;
  deals: DealCard[];
  color: string;
}

const DealsKanbanPage: React.FC = () => {
  const navigate = useNavigate();
  const { deals: contextDeals } = useData();
  const { user } = useAuth();
  // Stable counter incremented only when a real data-mutating action occurs
  // (deal added, deleted, stage-changed). Using contextDeals.length directly
  // caused refetch races during drag-and-drop because length can momentarily
  // change during optimistic-UI updates, triggering a stale API response to
  // overwrite the board state.
  const [refetchKey, setRefetchKey] = useState(0);
  const triggerRefetch = () => setRefetchKey(k => k + 1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const viewDropdownRef = useRef<HTMLDivElement>(null);

  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [highlightedDeals, setHighlightedDeals] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'closeDate' | 'value' | 'health' | 'activity' | 'stage'>('closeDate');
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'grid' | 'calendar'>('kanban');
  const [showHRMSModal, setShowHRMSModal] = useState(false);
  const [selectedHRMSDeal, setSelectedHRMSDeal] = useState<DealCard | null>(null);
  const [showScoreTooltip, setShowScoreTooltip] = useState<string | null>(null);
  const [showContextMenu, setShowContextMenu] = useState<{ dealId: string; x: number; y: number } | null>(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedActivityDeal, setSelectedActivityDeal] = useState<DealCard | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);
  const [collapsedStages, setCollapsedStages] = useState<string[]>([]);
  const [focusedStage, setFocusedStage] = useState<string | null>(null);
  const [showValueBreakdown, setShowValueBreakdown] = useState(false);
  const [selectedStageForBreakdown, setSelectedStageForBreakdown] = useState<PipelineStage | null>(null);
  // Delete confirmation — stores the deal to be deleted until user confirms
  const [deleteConfirmDeal, setDeleteConfirmDeal] = useState<{ id: string; name: string } | null>(null);
  // Card density — 'standard' shows all 4 zones, 'compact' collapses to 3 rows
  const [cardDensity, setCardDensity] = useState<'standard' | 'compact'>('standard');
  // Slideout panel — stores the deal ID to preview; null = panel closed
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [visibleDealsCount, setVisibleDealsCount] = useState<Record<string, number>>({});
  const [loadingMore, setLoadingMore] = useState<Record<string, boolean>>({});
  const DEALS_PER_PAGE = 10;
  const observerRefs = useRef<Record<string, IntersectionObserver | null>>({});

  // Stage skeletons — deals are populated exclusively from the backend fetch below.
  // Never seed hardcoded sample deals here: they cause duplicate cards when the
  // API returns real data and the two datasets share IDs.
  const [stages, setStages] = useState<PipelineStage[]>([
    { id: 'prospecting', name: 'Prospecting', color: 'bg-blue-100',  deals: [] },
    { id: 'qualified',   name: 'Qualified',   color: 'bg-green-100', deals: [] },
    { id: 'proposal',    name: 'Proposal',    color: 'bg-orange-100', deals: [] },
    { id: 'negotiation', name: 'Negotiation', color: 'bg-purple-100', deals: [] },
    { id: 'closed-won',  name: 'Closed-Won',  color: 'bg-green-200', deals: [] },
    { id: 'closed-lost', name: 'Closed-Lost', color: 'bg-red-100',   deals: [] },
  ]);

  // Fetch all deals from the backend and populate stages.
  // Re-runs on mount and whenever triggerRefetch() is called (explicit actions).
  // NOT driven by contextDeals.length to avoid race conditions during drag-and-drop.
  useEffect(() => {
    let cancelled = false;

    fetchDeals().then((apiDeals: any[]) => {
      if (cancelled) return;

      // ── Pass 1: drop malformed records ────────────────────────────────────
      // Any record without a string id is unusable as a React key and as a
      // @hello-pangea/dnd draggableId — log and discard immediately.
      const malformed = apiDeals.filter(
        (d: any) => !d.id || typeof d.id !== 'string'
      );
      if (malformed.length > 0) {
        console.warn(
          `[Pipeline] ${malformed.length} deal(s) dropped — missing or non-string id.`,
          malformed
        );
      }

      // ── Pass 2: deduplicate by id ──────────────────────────────────────────
      // Guards against same-id rows that could appear if a future query adds a
      // one-to-many JOIN (e.g. tags, activities).  First-occurrence wins so the
      // array order (created_at DESC from the API) is preserved.
      const seenById = new Map<string, any>();
      apiDeals.forEach((d: any) => {
        if (d.id && typeof d.id === 'string' && !seenById.has(d.id)) {
          seenById.set(d.id, d);
        }
      });
      const idDedupedDeals = Array.from(seenById.values());

      if (idDedupedDeals.length !== apiDeals.length) {
        console.warn(
          `[Pipeline] API returned ${apiDeals.length} rows, id-deduped to ` +
          `${idDedupedDeals.length} (${apiDeals.length - idDedupedDeals.length} same-id rows removed).`
        );
      }

      // ── Pass 3: deduplicate by content identity ────────────────────────────
      // The backend LEFT JOIN on leads is one-to-one and cannot inflate rows,
      // so same-id duplicates are rare.  The more common problem is genuine DB
      // duplicates: two rows with different IDs but the same (name, company,
      // stage) created by double-submitting the form or repeated test inserts.
      // These survive Pass 2 and render as duplicate cards on the board.
      //
      // Key: name + company_name + stage (company scopes the key so two deals
      // with identical names at different companies are not wrongly merged).
      // First-occurrence wins — API is sorted created_at DESC so the first
      // record seen is the most recently created one (the canonical version).
      // Discarded IDs are logged so the DB can be cleaned up.
      const contentKey = (d: any) =>
        `${(d.name || '').toLowerCase().trim()}|` +
        `${(d.company_name || '').toLowerCase().trim()}|` +
        `${d.stage}`;
      const seenByContent = new Map<string, string>(); // key → kept id
      const dedupedDeals = idDedupedDeals.filter(d => {
        const key = contentKey(d);
        if (seenByContent.has(key)) {
          console.warn(
            `[Pipeline] DB duplicate: "${d.name}" / "${d.company_name || '—'}" in "${d.stage}" ` +
            `— keeping id ${seenByContent.get(key)}, discarding id ${d.id}. ` +
            `Run: DELETE FROM deals WHERE id = '${d.id}';`
          );
          return false;
        }
        seenByContent.set(key, d.id);
        return true;
      });

      if (!dedupedDeals.length) return;

      setStages(prev => prev.map(stage => {
        // Build each stage's deal list and apply a final ID-dedup pass so the
        // board state invariant "every deal appears exactly once per stage" is
        // guaranteed at storage time, not just at render time.
        const raw = dedupedDeals
          .filter((d: any) => d.stage === stage.id)
          .map((d: any) => ({
            id: d.id,
            companyName: d.company_name || d.name || 'Unknown Company',
            dealName: d.name || d.title || 'Untitled',
            accountName: d.company_name || d.name || '',
            amount: parseFloat(d.value) || 0,
            currency: d.currency || 'USD',
            baseAmountUsd: parseFloat(d.base_amount_usd) || parseFloat(d.value) || 0,
            // Strip time component so formatDisplayDate renders cleanly
            closeDate: d.expected_close_date
              ? d.expected_close_date.split('T')[0]
              : '',
            stage: stage.id,
            aiScore: d.probability || 0,
            contactName: d.contact_name || '',
            contactTitle: d.contact_title || '',
            owner: d.assigned_to || 'Unassigned',
            // Store raw ISO; formatRelativeTime() from dateUtils renders it human-readable on card
            lastActivity: d.updated_at || d.created_at || '',
            daysSinceContact: d.days_since_contact ?? 0,
            isHRMS: Boolean(d.is_hrms),
            hrmsDetails: d.hrms_details || '',
            priority: (['high', 'medium', 'low'].includes(d.priority?.toLowerCase())
              ? d.priority.toLowerCase()
              : 'medium') as 'high' | 'medium' | 'low',
            health: (['healthy', 'at-risk', 'stalled'].includes(d.health)
              ? d.health
              : 'healthy') as 'healthy' | 'at-risk' | 'stalled',
            source: d.source || 'manual',
            nextStep: d.next_step || '',
            nextStepDueDate: d.next_step_due_date ? d.next_step_due_date.split('T')[0] : '',
            nextStepOwner: d.next_step_owner || '',
            nextStepStatus: (['pending', 'done', 'overdue'].includes(d.next_step_status)
              ? d.next_step_status : 'pending') as 'pending' | 'done' | 'overdue',
            stakeholders: (() => {
              try {
                const s = typeof d.stakeholders === 'string'
                  ? JSON.parse(d.stakeholders) : (d.stakeholders ?? []);
                return Array.isArray(s) ? s : [];
              } catch { return []; }
            })(),
            contactCount: (() => {
              try {
                const s = typeof d.stakeholders === 'string'
                  ? JSON.parse(d.stakeholders) : (d.stakeholders ?? []);
                return (d.contact_name ? 1 : 0) + (Array.isArray(s) ? s.length : 0);
              } catch { return d.contact_name ? 1 : 0; }
            })(),
            competitorCount: (() => {
              try {
                const c = typeof d.competitors === 'string'
                  ? JSON.parse(d.competitors) : (d.competitors ?? []);
                return Array.isArray(c)
                  ? c.filter((x: any) => x && (typeof x === 'string' ? x.trim() : true)).length
                  : 0;
              } catch { return 0; }
            })(),
            createdAt: d.created_at || '',
          }));
        // Hard invariant: deduplicate by id before committing to state.
        const seen = new Set<string>();
        const deals = raw.filter(d => {
          if (seen.has(d.id)) return false;
          seen.add(d.id);
          return true;
        });
        return { ...stage, deals };
      }));
    });

    return () => { cancelled = true; };
  // refetchKey is incremented by triggerRefetch() on explicit mutations.
  // contextDeals is intentionally excluded — its length fluctuates during
  // drag-and-drop optimistic updates and caused stale-fetch races.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetchKey]);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedOwner, setSelectedOwner] = useState('all');
  const [selectedCloseDateFilter, setSelectedCloseDateFilter] = useState('all');
  const [selectedValueFilter, setSelectedValueFilter] = useState('all');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState('all');

  // Saved-view state — activeViewId tracks which chip is highlighted;
  // viewPredicate is the view's extra filter function (null for dropdown-only views).
  const [activeViewId, setActiveViewId] = useState('all');
  const [viewPredicate, setViewPredicate] = useState<((d: DealCard) => boolean) | null>(null);

  // Manager Inspection Mode — toggle with the ShieldAlert button or Esc to exit.
  const [inspectionMode, setInspectionMode] = useState(false);
  const [inspectionOwner, setInspectionOwner] = useState('all');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 200);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const kpis = useMemo(() => {
    // Dedup across stages before counting: if a deal somehow appears in two
    // stages (e.g. after a drag+refetch race), it must not inflate totals.
    const allDeals = Array.from(
      new Map(
        stages.flatMap(s => s.deals).map(d => [d.id, d])
      ).values()
    );

    // Active = not yet closed. Pipeline KPIs must reflect the live pipeline only;
    // including closed-won/lost was inflating totalDeals, totalValue, and stalledDeals.
    const activeDeals = allDeals.filter(d => !['closed-won', 'closed-lost'].includes(d.stage));

    const totalDeals = activeDeals.length;
    const totalValue = activeDeals.reduce((sum, d) => sum + (d.amount || 0), 0);

    // Win rate uses per-stage arrays (already deduped within each stage by ingestion)
    const wonDeals  = stages.find(s => s.id === 'closed-won')?.deals.length  || 0;
    const lostDeals = stages.find(s => s.id === 'closed-lost')?.deals.length || 0;
    const closedTotal = wonDeals + lostDeals;
    // Require ≥3 closed deals before showing a rate; below that a single win
    // produces 100 % which is statistically meaningless and erodes trust.
    const winRate: number | null = closedTotal >= 3
      ? Math.round((wonDeals / closedTotal) * 100)
      : null;

    // "Due / Overdue": active deals whose close date is within 7 days OR already
    // past due (days < 0). The previous `days >= 0` guard hid overdue deals and
    // caused the KPI to show 0 while the board displayed cards with red close dates.
    const closingThisWeek = activeDeals.filter(d => {
      if (!d.closeDate) return false;
      const days = daysFromNow(d.closeDate);
      return days !== null && days <= 7;
    }).length;

    // Stalled: active deals with no contact for 5+ days. Scoped to activeDeals so
    // the count always matches aiInsights.needAttention (same predicate, same scope).
    const stalledDeals = activeDeals.filter(d => d.daysSinceContact >= 5).length;

    // Average sales cycle from closed-won deals that have both dates.
    const wonWithDates = (stages.find(s => s.id === 'closed-won')?.deals || []).filter(
      d => d.createdAt && d.closeDate
    );
    const rawAvgCycle = wonWithDates.length > 0
      ? Math.round(wonWithDates.reduce((sum, d) => {
          const createdMs = parseDateMs(d.createdAt);
          const closedMs  = parseDateMs(d.closeDate);
          const cycleDays = (closedMs - createdMs) / 86_400_000;
          return sum + Math.max(0, isFinite(cycleDays) ? cycleDays : 0);
        }, 0) / wonWithDates.length)
      : null;
    // 0-day cycles indicate same-day create+close (test data); treat as no data
    // rather than displaying a misleading "0d".
    const avgCycle = rawAvgCycle !== null && rawAvgCycle > 0 ? rawAvgCycle : null;

    return { totalDeals, totalValue, winRate, closingThisWeek, stalledDeals, avgCycle };
  }, [stages]);

  const aiInsights = useMemo(() => {
    // Same cross-stage dedup as kpis: one record per id before any analysis
    const allDeals = Array.from(
      new Map(stages.flatMap(s => s.deals).map(d => [d.id, d])).values()
    );
    const activeDeals = allDeals.filter(d => !['closed-won', 'closed-lost'].includes(d.stage));

    // Deals with no activity for 5+ days, sorted by descending value — real data driven
    const needAttention = activeDeals
      .filter(d => d.daysSinceContact >= 5)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(d => ({ id: d.id, companyName: d.companyName, amount: d.amount }));

    const negotiationDeals = stages.find(s => s.id === 'negotiation')?.deals || [];
    // Sum of negotiation-stage deals = realistic "probable close" value this month
    const highProbValue = negotiationDeals.reduce((sum, d) => sum + d.amount, 0);

    const hrmsDeals = activeDeals.filter(d => d.isHRMS);

    return { needAttention, negotiationDeals, highProbValue, hrmsDeals };
  }, [stages]);

  const inspectionSignals = useMemo(
    () => computeInspectionSignals(stages, inspectionOwner === 'all' ? '' : inspectionOwner),
    [stages, inspectionOwner],
  );

  // Stages where a next step is required before the deal can sit comfortably.
  // A soft coaching prompt is shown when a deal lands here without one.
  const STAGES_REQUIRING_NEXT_STEP: string[] = ['proposal', 'negotiation'];

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    // Deep-copy both the outer array AND every inner deals array.
    // The previous `[...stages]` was a shallow copy — sourceStage.deals and
    // destStage.deals still pointed at the original state arrays, so the
    // subsequent splice() calls silently mutated React state in place.
    // React's concurrent renderer can observe that partially-mutated state
    // and render a card in both source and destination columns simultaneously.
    const newStages = stages.map(s => ({ ...s, deals: [...s.deals] }));

    const sourceStage = newStages.find(s => s.id === source.droppableId);
    const destStage   = newStages.find(s => s.id === destination.droppableId);

    if (!sourceStage || !destStage) return;

    // Both splices now operate on the copied deals arrays, never on state.
    const [movedDeal] = sourceStage.deals.splice(source.index, 1);
    const updatedDeal = {
      ...movedDeal,
      stage:   destStage.id,
      aiScore: Math.max(0, Math.min(100, movedDeal.aiScore + Math.floor(Math.random() * 10) - 3)),
    };

    destStage.deals.splice(destination.index, 0, updatedDeal);
    setStages(newStages);

    const isStageChange  = source.droppableId !== destination.droppableId;
    const needsNextStep  =
      isStageChange &&
      STAGES_REQUIRING_NEXT_STEP.includes(destStage.id) &&
      !updatedDeal.nextStep?.trim();

    if (needsNextStep) {
      setToast({
        message: `"${updatedDeal.dealName}" moved to ${destStage.name} — add a next step to keep it on track`,
        type: 'info',
        actionLabel: 'Add now',
        onAction: () => setSelectedDealId(updatedDeal.id),
      });
    } else {
      setToast({ message: `Deal moved to ${destStage.name}`, type: 'success' });
    }

    console.log(`Stage changed to ${destStage.name} for ${updatedDeal.companyName}`);
    setTimeout(() => setToast(null), 5000);
  };

  // formatRelativeTime from dateUtils replaces the old local formatLastActivity.
  // It handles ISO strings, already-human strings, null, and timezone-safe parsing.

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'at-risk': return 'text-yellow-600';
      case 'stalled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle2 className="h-4 w-4" />;
      case 'at-risk': return <AlertTriangle className="h-4 w-4" />;
      case 'stalled': return <XCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMoreOptions(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
      if (viewDropdownRef.current && !viewDropdownRef.current.contains(event.target as Node)) {
        setShowViewDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && inspectionMode) setInspectionMode(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [inspectionMode]);

  const handleExportPipeline = (format: 'csv' | 'pdf') => {
    console.log(`Exporting pipeline as ${format.toUpperCase()}`);
    setShowMoreOptions(false);
  };

  const handleImportDeals = () => {
    console.log('Opening import deals dialog');
    setShowMoreOptions(false);
  };

  const handlePipelineSettings = () => {
    console.log('Opening pipeline settings');
    setShowMoreOptions(false);
  };

  const handleViewArchived = () => {
    console.log('Viewing archived deals');
    setShowMoreOptions(false);
  };

  const handleCustomizeColumns = () => {
    console.log('Opening column customization');
    setShowMoreOptions(false);
  };

  const handleStatClick = (stat: string) => {
    setHighlightedDeals([]);

    switch (stat) {
      case 'total':
        break;
      case 'value':
        navigate('/analytics', { state: { view: 'revenue' } });
        break;
      case 'winRate':
        navigate('/analytics', { state: { view: 'winRate' } });
        break;
      case 'closingWeek': {
        // Highlight the same deals counted by the KPI: active + due within 7 days or overdue.
        const dueDeals = stages.flatMap(s => s.deals).filter(d => {
          if (['closed-won', 'closed-lost'].includes(d.stage)) return false;
          if (!d.closeDate) return false;
          const days = daysFromNow(d.closeDate);
          return days !== null && days <= 7;
        });
        setHighlightedDeals(dueDeals.map(d => d.id));
        break;
      }
      case 'stalled': {
        // Highlight the same deals counted by the KPI: active + daysSinceContact >= 5.
        // Previously used d.health === 'stalled' (DB field) which diverged from the
        // KPI's daysSinceContact predicate and produced a mismatch on click.
        const stalledList = stages.flatMap(s => s.deals).filter(d =>
          !['closed-won', 'closed-lost'].includes(d.stage) && d.daysSinceContact >= 5
        );
        setHighlightedDeals(stalledList.map(d => d.id));
        break;
      }
      case 'avgCycle':
        navigate('/analytics', { state: { view: 'cycleTime' } });
        break;
    }
  };

  const handleViewDeals = () => {
    const dealsToHighlight = aiInsights.needAttention.map(d => d.id);
    setHighlightedDeals(dealsToHighlight);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleCreateTasks = () => {
    setShowTaskModal(true);
  };

  const handleViewForecast = () => {
    navigate('/analytics', { state: { view: 'forecast' } });
  };

  const handleViewHRMSDeals = () => {
    const hrmsDeals = stages.flatMap(s => s.deals).filter(d => d.isHRMS);
    setHighlightedDeals(hrmsDeals.map(d => d.id));
    setSelectedSourceFilter('hrms');
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleSort = (sortOption: 'closeDate' | 'value' | 'health' | 'activity' | 'stage') => {
    setSortBy(sortOption);
    setShowSortDropdown(false);
  };

  const handleViewChange = (view: 'kanban' | 'list' | 'grid' | 'calendar') => {
    setViewMode(view);
    setShowViewDropdown(false);
  };

  const handleExportCSV = () => {
    const allDeals = stages.flatMap(s => s.deals);
    const csvData = allDeals.map(d => ({
      Company: d.companyName,
      Deal: d.dealName,
      Account: d.accountName,
      Amount: d.amount,
      Stage: d.stage,
      CloseDate: d.closeDate,
      Owner: d.owner,
      Score: d.aiScore,
      Health: d.health
    }));
    console.log('Exporting CSV:', csvData);
  };

  const getSortLabel = () => {
    switch (sortBy) {
      case 'closeDate': return 'Close Date';
      case 'value': return 'Deal Value';
      case 'health': return 'AI Health Score';
      case 'activity': return 'Last Activity';
      case 'stage': return 'Stage Progress';
      default: return 'Close Date';
    }
  };

  const getViewLabel = () => {
    switch (viewMode) {
      case 'kanban': return 'Kanban';
      case 'list': return 'List';
      case 'calendar': return 'Calendar';
      default: return 'Kanban';
    }
  };

  const handleHRMSBadgeClick = (e: React.MouseEvent, deal: DealCard) => {
    e.stopPropagation();
    setSelectedHRMSDeal(deal);
    setShowHRMSModal(true);
  };

  const handleContactClick = (e: React.MouseEvent, dealId: string) => {
    e.stopPropagation();
    navigate(`/crm/contacts/${dealId}`);
  };

  const handleOwnerClick = (e: React.MouseEvent, dealId: string) => {
    e.stopPropagation();
    navigate(`/settings/team/${dealId}`);
  };

  const handleScoreClick = (e: React.MouseEvent, dealId: string) => {
    e.stopPropagation();
    setShowScoreTooltip(showScoreTooltip === dealId ? null : dealId);
  };

  const handleStatusClick = (e: React.MouseEvent, deal: DealCard) => {
    e.stopPropagation();
    setSelectedActivityDeal(deal);
    setShowActivityModal(true);
  };

  // Kanban card click → open slideout panel (board stays mounted).
  // List/Grid views keep their own navigate-to-full-page behavior.
  const handleCardClick = (dealId: string) => {
    setSelectedDealId(dealId);
  };

  // Called by the panel's "Open full record" button — only navigates when the
  // user explicitly requests the full detail page.
  const handlePanelNavigate = (dealId: string) => {
    navigate(`/crm/deals/${dealId}`);
  };

  // Patches a card in the stages state after a panel quick-edit save so the
  // board stays in sync without a full refetch.
  const handlePanelUpdate = (dealId: string, patch: Partial<DealCard>) => {
    setStages(prev => prev.map(stage => ({
      ...stage,
      deals: stage.deals.map(d => d.id === dealId ? { ...d, ...patch } : d),
    })));
  };

  // Quick-action handlers — surfaced on card hover so daily actions are 1-click
  const handleQuickEdit = (e: React.MouseEvent, dealId: string) => {
    e.stopPropagation();
    navigate(`/crm/deals/${dealId}/edit`);
  };
  const handleQuickEmail = (e: React.MouseEvent, _dealId: string) => {
    e.stopPropagation();
    setToast({ message: 'Opening email composer…', type: 'info' });
    setTimeout(() => setToast(null), 2500);
  };
  const handleQuickActivity = (e: React.MouseEvent, dealId: string) => {
    e.stopPropagation();
    const deal = stages.flatMap(s => s.deals).find(d => d.id === dealId);
    if (deal) { setSelectedActivityDeal(deal); setShowActivityModal(true); }
  };

  const handleContextMenu = (e: React.MouseEvent, dealId: string) => {
    e.preventDefault();
    setShowContextMenu({ dealId, x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => {
    setShowContextMenu(null);
  };

  useEffect(() => {
    const handleClick = () => closeContextMenu();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleContextMenuAction = (action: string, dealId: string) => {
    console.log(`${action} for deal ${dealId}`);
    closeContextMenu();

    switch (action) {
      case 'edit':
        navigate(`/crm/deals/${dealId}/edit`);
        break;
      case 'email':
        console.log('Opening email composer');
        break;
      case 'meeting':
        navigate('/meetings/new', { state: { dealId } });
        break;
      case 'won':
        setToast({ message: 'Deal marked as Won', type: 'success' });
        setTimeout(() => setToast(null), 3000);
        break;
      case 'lost':
        setToast({ message: 'Deal marked as Lost', type: 'info' });
        setTimeout(() => setToast(null), 3000);
        break;
      case 'delete': {
        // Show confirmation modal instead of deleting immediately
        const dealToDelete = stages.flatMap(s => s.deals).find(d => d.id === dealId);
        if (dealToDelete) {
          setDeleteConfirmDeal({ id: dealToDelete.id, name: dealToDelete.dealName });
        }
        break;
      }
    }
  };

  // Remove the deal from all stages and close the confirmation modal
  const confirmDeleteDeal = () => {
    if (!deleteConfirmDeal) return;
    setStages(prev =>
      prev.map(stage => ({
        ...stage,
        deals: stage.deals.filter(d => d.id !== deleteConfirmDeal.id),
      }))
    );
    setToast({ message: `"${deleteConfirmDeal.name}" deleted`, type: 'error' });
    setTimeout(() => setToast(null), 3000);
    setDeleteConfirmDeal(null);
    // Re-sync with backend after deletion so the board reflects DB truth.
    triggerRefetch();
  };

  const toggleStageCollapse = (stageId: string) => {
    setCollapsedStages(prev =>
      prev.includes(stageId)
        ? prev.filter(id => id !== stageId)
        : [...prev, stageId]
    );
  };

  const handleStageCountClick = (e: React.MouseEvent, stageId: string) => {
    e.stopPropagation();
    setFocusedStage(focusedStage === stageId ? null : stageId);
  };

  const handleStageValueClick = (e: React.MouseEvent, stage: PipelineStage) => {
    e.stopPropagation();
    setSelectedStageForBreakdown(stage);
    setShowValueBreakdown(true);
  };

  const handleAddDealToStage = (stageId: string) => {
    navigate(`/crm/deals/add?stage=${stageId}`);
  };

  // Apply a saved view — presets the dropdown controls and sets the custom
  // predicate.  The user can then further refine with manual dropdown changes.
  const applyView = (view: SavedView) => {
    setActiveViewId(view.id);
    // Only override the dropdown values explicitly specified by the view
    if (view.filterPreset.owner     !== undefined) setSelectedOwner(view.filterPreset.owner);
    if (view.filterPreset.closeDate !== undefined) setSelectedCloseDateFilter(view.filterPreset.closeDate);
    if (view.filterPreset.value     !== undefined) setSelectedValueFilter(view.filterPreset.value);
    if (view.filterPreset.source    !== undefined) setSelectedSourceFilter(view.filterPreset.source);
    if (view.filterPreset.sortBy    !== undefined) setSortBy(view.filterPreset.sortBy);
    // Bind the view's predicate (if any) so filterDeals picks it up
    setViewPredicate(view.predicate ? () => view.predicate! : null);
  };

  // Reset every filter, saved view, and search back to defaults.
  const resetFilters = () => {
    setActiveViewId('all');
    setViewPredicate(null);
    setSelectedOwner('all');
    setSelectedCloseDateFilter('all');
    setSelectedValueFilter('all');
    setSelectedSourceFilter('all');
    setSearchTerm('');
    setSortBy('closeDate');
  };

  // Clear a single active-filter pill by its key.
  const clearFilterPill = (key: string) => {
    switch (key) {
      case 'view':      setActiveViewId('all'); setViewPredicate(null); break;
      case 'owner':     setSelectedOwner('all'); break;
      case 'closeDate': setSelectedCloseDateFilter('all'); break;
      case 'value':     setSelectedValueFilter('all'); break;
      case 'source':    setSelectedSourceFilter('all'); break;
      case 'search':    setSearchTerm(''); break;
    }
  };

  const displayedStages = focusedStage
    ? stages.filter(s => s.id === focusedStage)
    : stages;

  useEffect(() => {
    const updates: Record<string, number> = {};
    stages.forEach(stage => {
      const target = Math.min(DEALS_PER_PAGE, stage.deals.length);
      const current = visibleDealsCount[stage.id];
      // Allow count to grow when new deals are injected; never shrink a
      // count the user has already expanded via "load more".
      if (!current || current < target) {
        updates[stage.id] = target;
      }
    });
    if (Object.keys(updates).length > 0) {
      setVisibleDealsCount(prev => ({ ...prev, ...updates }));
    }
  }, [stages]);

  const loadMoreDeals = (stageId: string) => {
    const stage = stages.find(s => s.id === stageId);
    if (!stage) return;

    setLoadingMore(prev => ({ ...prev, [stageId]: true }));

    setTimeout(() => {
      setVisibleDealsCount(prev => ({
        ...prev,
        [stageId]: Math.min((prev[stageId] || DEALS_PER_PAGE) + DEALS_PER_PAGE, stage.deals.length)
      }));
      setLoadingMore(prev => ({ ...prev, [stageId]: false }));
    }, 500);
  };

  const setupInfiniteScroll = (element: HTMLDivElement | null, stageId: string) => {
    if (observerRefs.current[stageId]) {
      observerRefs.current[stageId]?.disconnect();
    }

    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !loadingMore[stageId]) {
            const stage = stages.find(s => s.id === stageId);
            const currentVisible = visibleDealsCount[stageId] || DEALS_PER_PAGE;
            if (stage && currentVisible < stage.deals.length) {
              loadMoreDeals(stageId);
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    observerRefs.current[stageId] = observer;
  };

  useEffect(() => {
    return () => {
      Object.values(observerRefs.current).forEach(observer => observer?.disconnect());
    };
  }, []);

  // All active filter + search predicates applied in one pass
  const filterDeals = (deals: PipelineStage['deals']) => {
    return deals.filter(d => {
      // Text search across deal name, account, contact
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        if (![d.dealName, d.accountName, d.contactName].some(f => f?.toLowerCase().includes(q))) {
          return false;
        }
      }
      // Owner filter — 'me' matches the logged-in user's name from AuthContext
      if (selectedOwner === 'me' && user && d.owner !== user.name) return false;
      if (selectedOwner === 'unassigned' && d.owner && d.owner !== 'Unassigned') return false;

      // Close date filter — isWithinDays uses parseDate internally, null-safe
      if (selectedCloseDateFilter === 'week'    && !isWithinDays(d.closeDate, 7))  return false;
      if (selectedCloseDateFilter === 'month'   && !isWithinDays(d.closeDate, 30)) return false;
      if (selectedCloseDateFilter === 'quarter' && !isWithinDays(d.closeDate, 90)) return false;

      // Value range filter
      if (selectedValueFilter === '0-25k'  && d.amount > 25_000)  return false;
      if (selectedValueFilter === '25-50k' && (d.amount < 25_000 || d.amount > 50_000)) return false;
      if (selectedValueFilter === '50-100k' && (d.amount < 50_000 || d.amount > 100_000)) return false;
      if (selectedValueFilter === '100k+'  && d.amount < 100_000) return false;

      // Source filter
      if (selectedSourceFilter === 'hrms'    && !d.isHRMS) return false;
      if (selectedSourceFilter === 'website' && !d.source?.toLowerCase().includes('website')) return false;
      if (selectedSourceFilter === 'leadgen' && !d.source?.toLowerCase().includes('lead gen')) return false;
      if (selectedSourceFilter === 'manual'  && d.isHRMS) return false;

      // Apply the active saved view's custom predicate — handles conditions that
      // the dropdown controls cannot express (aiScore, daysSinceContact, etc.)
      if (viewPredicate && !viewPredicate(d)) return false;

      return true;
    });
  };

  // Sort a filtered deal list by the active sort key
  const sortDeals = (deals: PipelineStage['deals']) => {
    return [...deals].sort((a, b) => {
      switch (sortBy) {
        case 'value':    return b.amount - a.amount;
        case 'health':   return b.aiScore - a.aiScore;
        case 'activity': return a.daysSinceContact - b.daysSinceContact;
        case 'closeDate':
          // parseDateMs returns Infinity for missing/invalid dates → sorts to end safely
          return parseDateMs(a.closeDate) - parseDateMs(b.closeDate);
        default: return 0;
      }
    });
  };

  // Deduplicate within a single stage's deal array by id before any
  // filtering or sorting.  This is the render-layer safety net: even if
  // a duplicate somehow survives ingestion or is introduced by an
  // optimistic-UI merge, it never reaches the JSX or drag-and-drop layer.
  // Duplicate draggableIds in @hello-pangea/dnd cause silent rendering bugs.
  const dedupStageDeals = (deals: PipelineStage['deals']): PipelineStage['deals'] =>
    Array.from(new Map(deals.map(d => [d.id, d])).values());

  const getVisibleDeals = (stage: PipelineStage) => {
    const unique   = dedupStageDeals(stage.deals);
    const filtered = sortDeals(filterDeals(unique));
    const count    = visibleDealsCount[stage.id] || DEALS_PER_PAGE;
    return filtered.slice(0, count);
  };

  const hasMoreDeals = (stage: PipelineStage) => {
    const unique   = dedupStageDeals(stage.deals);
    const filtered = filterDeals(unique);
    const count    = visibleDealsCount[stage.id] || DEALS_PER_PAGE;
    return count < filtered.length;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Merged title + KPI bar ───────────────────────────────────────────
          Title on the left, 6 inline KPI stats in the middle, action buttons
          on the right — all in one sticky row.  Each stat is a click target
          that filters the board, preserving all existing handleStatClick logic.
      */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 -mx-6 -mt-6 px-8 py-4">
        <div className="flex items-center gap-3 min-w-0">

          {/* AI insight signals — 3 inline clickable items */}
          <div className="flex items-center gap-0.5 flex-1 min-w-0">

            {/* Needs attention — deals with no contact for 5+ days */}
            <button
              onClick={handleViewDeals}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-md hover:bg-amber-50 transition-colors group flex-shrink-0"
              title={aiInsights.needAttention.length > 0
                ? `${aiInsights.needAttention.length} deal${aiInsights.needAttention.length !== 1 ? 's' : ''} without recent activity`
                : 'All deals have recent activity'}
            >
              <AlertTriangle className={`h-4 w-4 flex-shrink-0 transition-colors ${aiInsights.needAttention.length > 0 ? 'text-amber-500' : 'text-gray-300 group-hover:text-amber-400'}`} />
              <div className="flex flex-col items-start">
                <span className={`text-[15px] font-semibold tabular-nums leading-none transition-colors ${aiInsights.needAttention.length > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                  {aiInsights.needAttention.length > 0 ? aiInsights.needAttention.length : 'All clear'}
                </span>
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider leading-none mt-1">
                  Needs Attention
                </span>
              </div>
            </button>

            <div className="w-px h-8 bg-gray-100 flex-shrink-0" />

            {/* Forecast — negotiation-stage deals likely to close this month */}
            <button
              onClick={handleViewForecast}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-md hover:bg-emerald-50 transition-colors group flex-shrink-0"
              title={`${formatCurrency(aiInsights.highProbValue)} in Negotiation — ${aiInsights.negotiationDeals.length} deal${aiInsights.negotiationDeals.length !== 1 ? 's' : ''}`}
            >
              <TrendingUp className="h-4 w-4 text-emerald-500 flex-shrink-0 group-hover:text-emerald-600 transition-colors" />
              <div className="flex flex-col items-start">
                <span className="text-[15px] font-semibold text-gray-900 tabular-nums leading-none group-hover:text-emerald-600 transition-colors">
                  {formatCurrency(aiInsights.highProbValue)}
                </span>
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider leading-none mt-1">
                  Likely This Month
                </span>
              </div>
            </button>

            <div className="w-px h-8 bg-gray-100 flex-shrink-0" />

            {/* HRMS signal — deals linked to HRMS data */}
            <button
              onClick={handleViewHRMSDeals}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-md hover:bg-indigo-50 transition-colors group flex-shrink-0"
              title={aiInsights.hrmsDeals.length > 0
                ? `${aiInsights.hrmsDeals.length} HRMS-connected deal${aiInsights.hrmsDeals.length !== 1 ? 's' : ''}`
                : 'No HRMS-connected deals'}
            >
              <Building2 className="h-4 w-4 text-indigo-400 flex-shrink-0 group-hover:text-indigo-600 transition-colors" />
              <div className="flex flex-col items-start">
                <span className={`text-[15px] font-semibold tabular-nums leading-none transition-colors ${aiInsights.hrmsDeals.length > 0 ? 'text-gray-900 group-hover:text-indigo-600' : 'text-gray-400'}`}>
                  {aiInsights.hrmsDeals.length > 0 ? aiInsights.hrmsDeals.length : 'None'}
                </span>
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider leading-none mt-1">
                  HRMS Deals
                </span>
              </div>
            </button>

          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setInspectionMode(m => !m)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-[13px] font-medium transition-all duration-150
                ${inspectionMode
                  ? 'bg-slate-900 text-amber-400 border-slate-700'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-800'
                }`}
              title={inspectionMode ? 'Exit Manager Inspection (Esc)' : 'Enter Manager Inspection Mode'}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>{inspectionMode ? 'Inspecting' : 'Inspect'}</span>
            </button>

            <button
              onClick={() => navigate('/crm/deals/add')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-[13px] font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>Add Deal</span>
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowMoreOptions(!showMoreOptions)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md border border-gray-200 transition-colors"
                title="More options"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {showMoreOptions && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={() => handleExportPipeline('csv')}
                    className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <FileDown className="h-4 w-4 text-gray-500" />
                    <div className="text-left">
                      <div className="font-medium">Export Pipeline</div>
                      <div className="text-xs text-gray-500">CSV or PDF format</div>
                    </div>
                  </button>

                  <button
                    onClick={handleImportDeals}
                    className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Upload className="h-4 w-4 text-gray-500" />
                    <div className="text-left">
                      <div className="font-medium">Import Deals</div>
                      <div className="text-xs text-gray-500">Upload CSV file</div>
                    </div>
                  </button>

                  <div className="border-t border-gray-100 my-1" />

                  <button
                    onClick={handlePipelineSettings}
                    className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="h-4 w-4 text-gray-500" />
                    <div className="text-left">
                      <div className="font-medium">Pipeline Settings</div>
                      <div className="text-xs text-gray-500">Configure stages</div>
                    </div>
                  </button>

                  <button
                    onClick={handleViewArchived}
                    className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Archive className="h-4 w-4 text-gray-500" />
                    <div className="text-left">
                      <div className="font-medium">View Archived Deals</div>
                      <div className="text-xs text-gray-500">Access archive</div>
                    </div>
                  </button>

                  <button
                    onClick={handleCustomizeColumns}
                    className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Columns className="h-4 w-4 text-gray-500" />
                    <div className="text-left">
                      <div className="font-medium">Customize Columns</div>
                      <div className="text-xs text-gray-500">Adjust view layout</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Inspection bar — rendered below the title bar only when active */}
      {inspectionMode && (
        <ManagerInspectionBar
          signals={inspectionSignals}
          inspectionOwner={inspectionOwner}
          onOwnerChange={setInspectionOwner}
          onExit={() => setInspectionMode(false)}
          onSignalClick={(viewId) => {
            const view = findView(viewId);
            if (view) applyView(view);
          }}
          formatCurrency={formatCurrency}
        />
      )}

      <div className="bg-white border-b border-gray-200 px-8 py-4">

        {/* ── Saved views chip bar ────────────────────────────────────────
            Horizontal scrollable row of view pills.  Clicking a chip applies
            that view's preset filters + custom predicate in one action.
            The "All Deals" chip acts as a reset.  No overflow on desktop —
            scrollable on narrow screens.                                    */}
        <div className="flex items-center space-x-2 mb-4 overflow-x-auto pb-1 scrollbar-thin">
          {SAVED_VIEWS.map(view => {
            const isActive = activeViewId === view.id;
            return (
              <button
                key={view.id}
                onClick={() => applyView(view)}
                title={view.description}
                className={`flex-shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium
                  transition-all duration-150 whitespace-nowrap border
                  ${isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
                aria-pressed={isActive}
                aria-label={`${view.label}: ${view.description}`}
              >
                <span className="text-[12px]">{view.emoji}</span>
                <span>{view.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Filter dropdowns — styled selects with ChevronDown affordance ── */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {([
            { label: 'Owner', value: selectedOwner, onChange: setSelectedOwner,
              options: [['all','All owners'],['me','Assigned to me'],['team','My team'],['unassigned','Unassigned']] },
            { label: 'Close date', value: selectedCloseDateFilter, onChange: setSelectedCloseDateFilter,
              options: [['all','Any close date'],['week','This week'],['month','This month'],['quarter','This quarter']] },
            { label: 'Value', value: selectedValueFilter, onChange: setSelectedValueFilter,
              options: [['all','Any value'],['0-25k','Up to $25K'],['25-50k','$25K – $50K'],['50-100k','$50K – $100K'],['100k+','$100K+'],] },
            { label: 'Source', value: selectedSourceFilter, onChange: setSelectedSourceFilter,
              options: [['all','All sources'],['leadgen','Lead gen'],['hrms','HRMS'],['website','Website'],['manual','Manual']] },
          ] as const).map(f => (
            <div key={f.label} className="relative flex-shrink-0">
              <select
                value={f.value}
                onChange={(e) => f.onChange(e.target.value as any)}
                className={`appearance-none bg-white border rounded-md pl-3 pr-7 py-1.5 text-[13px] cursor-pointer
                  focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors
                  ${f.value !== 'all'
                    ? 'border-indigo-300 text-indigo-700 bg-indigo-50'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
              >
                {(f.options as readonly (readonly [string, string])[]).map(([val, lbl]) => (
                  <option key={val} value={val}>{val === 'all' ? `${f.label}: ${lbl}` : lbl}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
            </div>
          ))}
        </div>

        {/* ── Active filter pills ─────────────────────────────────────────
            One dismissible pill per active filter.  Each pill has an ×
            to individually clear that filter without resetting everything.
            The "Reset all" button clears every filter including the view.
            Hidden entirely when no filters are active.                    */}
        {(() => {
          const pills = getActiveFilterPills(
            activeViewId,
            selectedOwner,
            selectedCloseDateFilter,
            selectedValueFilter,
            selectedSourceFilter,
            searchTerm,
          );
          if (pills.length === 0) return null;
          return (
            <div className="flex items-center flex-wrap gap-2 mb-3">
              <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Active:</span>
              {pills.map(pill => (
                <span
                  key={pill.key}
                  className="inline-flex items-center space-x-1 pl-2.5 pr-1.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[12px] font-medium rounded-full"
                >
                  <span>{pill.label}</span>
                  <button
                    onClick={() => clearFilterPill(pill.key)}
                    className="ml-0.5 p-0.5 rounded-full hover:bg-indigo-200 transition-colors"
                    aria-label={`Remove ${pill.label} filter`}
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <button
                onClick={resetFilters}
                className="inline-flex items-center space-x-1 px-2.5 py-1 text-[12px] text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full border border-gray-200 hover:border-red-200 transition-colors"
                title="Clear all filters"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset all</span>
              </button>
            </div>
          );
        })()}


        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search deals, accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-[13px] border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 placeholder:text-gray-400 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Sort */}
            <div className="relative" ref={sortDropdownRef}>
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md border border-gray-200 transition-colors"
              >
                <Filter className="h-3.5 w-3.5" />
                <span>{getSortLabel()}</span>
                <ChevronDown className="h-3 w-3 text-gray-400" />
              </button>
              {showSortDropdown && (
                <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  {([
                    ['closeDate', 'Close date'],
                    ['value',     'Deal value'],
                    ['health',    'AI health score'],
                    ['activity',  'Last activity'],
                    ['stage',     'Stage progress'],
                  ] as const).map(([key, label]) => (
                    <button key={key} onClick={() => handleSort(key)}
                      className={`w-full text-left px-3 py-2 text-[13px] transition-colors
                        ${sortBy === key ? 'text-indigo-600 bg-indigo-50 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View */}
            <div className="relative" ref={viewDropdownRef}>
              <button
                onClick={() => setShowViewDropdown(!showViewDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md border border-gray-200 transition-colors"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span>{getViewLabel()}</span>
                <ChevronDown className="h-3 w-3 text-gray-400" />
              </button>
              {showViewDropdown && (
                <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  {([
                    ['kanban',   'Kanban'],
                    ['list',     'List'],
                    ['grid',     'Grid'],
                    ['calendar', 'Calendar'],
                  ] as const).map(([key, label]) => (
                    <button key={key} onClick={() => handleViewChange(key)}
                      className={`w-full text-left px-3 py-2 text-[13px] transition-colors
                        ${viewMode === key ? 'text-indigo-600 bg-indigo-50 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Density toggle */}
            <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
              <button
                onClick={() => setCardDensity('standard')}
                title="Standard density"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[13px] transition-colors
                  ${cardDensity === 'standard' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <AlignJustify className="h-3.5 w-3.5" />
              </button>
              <div className="w-px h-4 bg-gray-200" />
              <button
                onClick={() => setCardDensity('compact')}
                title="Compact density"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[13px] transition-colors
                  ${cardDensity === 'compact' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <LayoutList className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Export — icon-only tertiary */}
            <button
              onClick={handleExportCSV}
              title="Export pipeline"
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md border border-gray-200 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        <DealsListView
          stages={stages}
          onDealClick={handleCardClick}
          onStageChange={(dealId, newStage) => {
            console.log('Stage change:', dealId, newStage);
          }}
        />
      ) : viewMode === 'grid' ? (
        <DealsGridView
          stages={stages}
          onDealClick={handleCardClick}
          onStageChange={(dealId, newStage) => {
            console.log('Stage change:', dealId, newStage);
          }}
        />
      ) : viewMode === 'calendar' ? (
        <div className="px-8 py-12 text-center">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Calendar View</h3>
          <p className="text-gray-600">Calendar view coming soon...</p>
        </div>
      ) : (
        <div className="px-6 py-5 overflow-x-auto" style={{ scrollBehavior: 'smooth' }}>
          {focusedStage && (
            <div className="mb-4 flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-2.5">
              <div className="flex items-center gap-2 text-indigo-800">
                <Filter className="h-3.5 w-3.5" />
                <span className="text-[13px] font-medium">
                  Viewing: {stages.find(s => s.id === focusedStage)?.name}
                </span>
              </div>
              <button
                onClick={() => setFocusedStage(null)}
                className="text-[13px] text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              >
                Show all stages
              </button>
            </div>
          )}

          <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 min-w-max">
            {displayedStages.map((stage) => {
              const isCollapsed = collapsedStages.includes(stage.id);
              // Dedup before computing the header count and value total so the
              // column badge never shows "12 deals" when 6 are real duplicates.
              const filteredDeals = filterDeals(dedupStageDeals(stage.deals));
              // Hide column entirely when search is active and nothing matches
              if (debouncedSearch && filteredDeals.length === 0) return null;
              const stageTotal = filteredDeals.reduce((sum, d) => sum + d.amount, 0);

              const STAGE_ACCENT: Record<string, string> = {
                'prospecting': '#6366f1',
                'qualified':   '#0ea5e9',
                'proposal':    '#f59e0b',
                'negotiation': '#8b5cf6',
                'closed-won':  '#10b981',
                'closed-lost': '#f43f5e',
              };
              const accentColor = STAGE_ACCENT[stage.id] ?? '#94a3b8';

              return (
                <div key={stage.id} style={{ width: '280px' }} className="flex-shrink-0">
                  {/* Column header — white with colored accent dot */}
                  <div className="bg-white rounded-t-lg border border-b-0 border-gray-200 px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={() => toggleStageCollapse(stage.id)}
                        className="flex items-center gap-2 group"
                        title={`${isCollapsed ? 'Expand' : 'Collapse'} ${stage.name}`}
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: accentColor }}
                        />
                        <span className="text-[11px] font-semibold text-gray-700 uppercase tracking-wider group-hover:text-gray-900 transition-colors">
                          {stage.name}
                        </span>
                      </button>
                      {!['closed-won', 'closed-lost'].includes(stage.id) && (
                        <button
                          onClick={() => handleAddDealToStage(stage.id)}
                          className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title={`Add deal to ${stage.name}`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={(e) => handleStageCountClick(e, stage.id)}
                        className="text-[13px] font-semibold text-gray-900 hover:text-indigo-600 transition-colors tabular-nums"
                      >
                        {filteredDeals.length}
                        <span className="text-[12px] font-normal text-gray-400 ml-1">
                          {`deal${filteredDeals.length !== 1 ? 's' : ''}${debouncedSearch && filteredDeals.length !== stage.deals.length ? ` / ${stage.deals.length}` : ''}`}
                        </span>
                      </button>
                      <button
                        onClick={(e) => handleStageValueClick(e, stage)}
                        className="text-[12px] font-medium text-gray-500 hover:text-gray-700 transition-colors tabular-nums"
                      >
                        {formatCurrency(stageTotal)}
                      </button>
                    </div>
                  </div>

                {/* isDropDisabled on collapsed stages prevents silent drops into hidden position */}
                <Droppable droppableId={stage.id} isDropDisabled={isCollapsed}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`rounded-b-lg border border-t-0 border-gray-200 px-3 py-2.5 transition-colors
                        ${isCollapsed ? 'min-h-[40px]' : 'min-h-[500px] overflow-y-auto'}
                        space-y-2 ${snapshot.isDraggingOver ? 'bg-indigo-50/70' : 'bg-gray-50'}`}
                      style={{ scrollbarWidth: 'thin' }}
                    >
                      {!isCollapsed && getVisibleDeals(stage).map((deal, index) => (
                        <Draggable key={deal.id} draggableId={deal.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <DealKanbanCard
                                deal={deal}
                                stageId={stage.id}
                                density={cardDensity}
                                isHighlighted={highlightedDeals.includes(deal.id)}
                                isDragging={snapshot.isDragging}
                                showScoreTooltip={showScoreTooltip === deal.id}
                                inspectionMode={inspectionMode}
                                inspectionBadge={inspectionMode ? getInspectionBadge(deal) : null}
                                onCardClick={handleCardClick}
                                onContextMenu={handleContextMenu}
                                onHRMSClick={handleHRMSBadgeClick}
                                onScoreClick={handleScoreClick}
                                onContactClick={handleContactClick}
                                onStatusClick={handleStatusClick}
                                onQuickEdit={handleQuickEdit}
                                onQuickEmail={handleQuickEmail}
                                onQuickActivity={handleQuickActivity}
                                formatCurrency={formatCurrency}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {/* Empty state */}
                      {!isCollapsed && filterDeals(stage.deals).length === 0 && !debouncedSearch && (
                        <div className="flex flex-col items-center justify-center py-10 px-3">
                          <div className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center mb-3">
                            <Target className="h-4 w-4 text-gray-300" />
                          </div>
                          <p className="text-[12px] font-medium text-gray-500 text-center mb-0.5">No deals here</p>
                          <p className="text-[11px] text-gray-400 text-center">Drag a card in or use + above</p>
                        </div>
                      )}

                      {/* Collapsed state */}
                      {isCollapsed && (
                        <div className="flex items-center justify-center py-3">
                          <span className="text-[12px] text-gray-400 tabular-nums">
                            {stage.deals.length} deal{stage.deals.length !== 1 ? 's' : ''} hidden
                          </span>
                        </div>
                      )}

                      {/* Load more */}
                      {!isCollapsed && hasMoreDeals(stage) && (
                        <>
                          {loadingMore[stage.id] ? (
                            <div className="flex items-center justify-center gap-2 py-3">
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-200 border-t-indigo-500" />
                              <span className="text-[12px] text-gray-500">Loading…</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => loadMoreDeals(stage.id)}
                              className="w-full py-2 bg-white border border-gray-200 rounded-md text-[12px] text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors font-medium"
                            >
                              Load more
                              <span className="text-gray-400 ml-1">
                                ({stage.deals.length - (visibleDealsCount[stage.id] || DEALS_PER_PAGE)} remaining)
                              </span>
                            </button>
                          )}
                          <div ref={(el) => setupInfiniteScroll(el, stage.id)} className="h-2" />
                        </>
                      )}

                      {/* Add deal — dashed CTA at column bottom */}
                      {!isCollapsed && !['closed-won', 'closed-lost'].includes(stage.id) && (
                        <button
                          onClick={() => handleAddDealToStage(stage.id)}
                          className="w-full py-2 border border-dashed border-gray-300 rounded-md text-[12px] text-gray-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/40 transition-colors font-medium"
                        >
                          + Add deal
                        </button>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
              );
            })}
          </div>
        </DragDropContext>
        </div>
      )}

      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create Follow-up Tasks</h3>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  For: {aiInsights.needAttention.length} selected deals
                </label>
                <div className="text-sm text-gray-600">
                  {aiInsights.needAttention.map(d => d.companyName).join(', ')}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task
                </label>
                <input
                  type="text"
                  defaultValue="Follow up call"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Tomorrow</option>
                  <option>In 2 days</option>
                  <option>This week</option>
                  <option>Next week</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign to
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Deal Owners</option>
                  <option>Me</option>
                  <option>My Team</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowTaskModal(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log('Creating tasks for deals:', aiInsights.needAttention.map(d => d.id));
                  setShowTaskModal(false);
                }}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Tasks
              </button>
            </div>
          </div>
        </div>
      )}

      {showHRMSModal && selectedHRMSDeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">HRMS Connection Details</h3>
              </div>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{selectedHRMSDeal.companyName}</h4>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Recruited Employee:</div>
                <div className="text-sm text-gray-900">Sarah Lee (CFO)</div>
                <div className="text-xs text-gray-600 mt-1">Recruitment Date: Nov 14, 2024</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Advantage:</div>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li className="flex items-start space-x-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>Warm introduction through recruitment</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>Existing relationship</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>33% higher close rate vs cold leads</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowHRMSModal(false);
                  setSelectedHRMSDeal(null);
                }}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  navigate('/hrms');
                  setShowHRMSModal(false);
                  setSelectedHRMSDeal(null);
                }}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View HRMS Module
              </button>
            </div>
          </div>
        </div>
      )}

      {showActivityModal && selectedActivityDeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Activity Details</h3>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">{selectedActivityDeal.companyName}</h4>
                <p className="text-sm text-gray-600">{formatCurrency(selectedActivityDeal.amount)}</p>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Last Activity:</div>
                {/* formatRelativeTime converts raw ISO strings to "Today", "3 days ago" etc. */}
                <div className="text-sm text-gray-900">
                  {formatRelativeTime(selectedActivityDeal.lastActivity, 'No recent activity')}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {selectedActivityDeal.daysSinceContact} days since last contact
                </div>
              </div>

              {selectedActivityDeal.daysSinceContact >= 5 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-yellow-900 mb-1">Suggested Action</div>
                      <div className="text-sm text-yellow-800">
                        Schedule a follow-up call to re-engage with the contact
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowActivityModal(false);
                  setSelectedActivityDeal(null);
                }}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  console.log('Logging activity for deal:', selectedActivityDeal.id);
                  setShowActivityModal(false);
                  setSelectedActivityDeal(null);
                }}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Log Activity
              </button>
            </div>
          </div>
        </div>
      )}

      {showContextMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 min-w-[180px]"
          style={{ top: showContextMenu.y, left: showContextMenu.x }}
        >
          <button
            onClick={() => handleContextMenuAction('edit', showContextMenu.dealId)}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Edit Deal
          </button>
          <button
            onClick={() => handleContextMenuAction('stage', showContextMenu.dealId)}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Change Stage
          </button>
          <button
            onClick={() => handleContextMenuAction('owner', showContextMenu.dealId)}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Change Owner
          </button>
          <div className="border-t border-gray-200 my-1"></div>
          <button
            onClick={() => handleContextMenuAction('activity', showContextMenu.dealId)}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Log Activity
          </button>
          <button
            onClick={() => handleContextMenuAction('email', showContextMenu.dealId)}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Send Email
          </button>
          <button
            onClick={() => handleContextMenuAction('meeting', showContextMenu.dealId)}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Schedule Meeting
          </button>
          <div className="border-t border-gray-200 my-1"></div>
          <button
            onClick={() => handleContextMenuAction('won', showContextMenu.dealId)}
            className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-gray-50"
          >
            Mark as Won
          </button>
          <button
            onClick={() => handleContextMenuAction('lost', showContextMenu.dealId)}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
          >
            Mark as Lost
          </button>
          <div className="border-t border-gray-200 my-1"></div>
          <button
            onClick={() => handleContextMenuAction('delete', showContextMenu.dealId)}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
          >
            Delete Deal
          </button>
        </div>
      )}

      {/* Delete confirmation — shown before any destructive removal */}
      {deleteConfirmDeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Delete Deal</h3>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-600 mb-1">
                Are you sure you want to delete:
              </p>
              <p className="text-sm font-semibold text-gray-900 mb-4">
                "{deleteConfirmDeal.name}"
              </p>
              <div className="flex items-start space-x-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-700">This action cannot be undone. All deal data will be permanently removed.</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmDeal(null)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteDeal}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showValueBreakdown && selectedStageForBreakdown && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedStageForBreakdown.name} - Deal Breakdown
                </h3>
                <button
                  onClick={() => {
                    setShowValueBreakdown(false);
                    setSelectedStageForBreakdown(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="px-6 py-4">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Total Deals</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedStageForBreakdown.deals.length}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Total Value</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(selectedStageForBreakdown.deals.reduce((sum, d) => sum + d.amount, 0))}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Avg Deal Size</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(
                      selectedStageForBreakdown.deals.reduce((sum, d) => sum + d.amount, 0) /
                      Math.max(selectedStageForBreakdown.deals.length, 1)
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 mb-3">Deals in this Stage</h4>
                {selectedStageForBreakdown.deals
                  .sort((a, b) => b.amount - a.amount)
                  .map((deal) => (
                    <div
                      key={deal.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => {
                        navigate(`/crm/deals/${deal.id}`);
                        setShowValueBreakdown(false);
                        setSelectedStageForBreakdown(null);
                      }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-gray-900">{deal.companyName}</span>
                          {deal.isHRMS && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                              HRMS
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {deal.contactName} • Close: {formatCloseDate(deal.closeDate)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{formatCurrency(deal.amount)}</div>
                        {!['closed-won', 'closed-lost'].includes(selectedStageForBreakdown.id) && (
                          <div className="text-xs text-gray-600">AI Score: {deal.aiScore}</div>
                        )}
                      </div>
                    </div>
                  ))}

                {selectedStageForBreakdown.deals.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No deals in this stage
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowValueBreakdown(false);
                  setSelectedStageForBreakdown(null);
                }}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
          <div className={`rounded-lg shadow-lg px-4 py-3 flex items-center space-x-3 ${
            toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-indigo-700'
          } text-white`}>
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              {toast.type === 'success' && <CheckCircle2 className="h-4 w-4 flex-shrink-0" />}
              {toast.type === 'error'   && <XCircle      className="h-4 w-4 flex-shrink-0" />}
              {toast.type === 'info'    && <ShieldAlert  className="h-4 w-4 flex-shrink-0 text-amber-300" />}
              <span className="text-sm font-medium leading-snug">{toast.message}</span>
            </div>
            {toast.actionLabel && toast.onAction && (
              <button
                onClick={() => { toast.onAction!(); setToast(null); }}
                className="flex-shrink-0 text-xs font-semibold px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded transition-colors whitespace-nowrap"
              >
                {toast.actionLabel}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Deal slideout panel ─────────────────────────────────────────────
          Rendered via createPortal at document.body level so it sits above
          the overflow-x-auto board container without being clipped.
          selectedDealId drives mount; panel handles its own animation.  */}
      <DealSlideoutPanel
        dealId={selectedDealId}
        onClose={() => setSelectedDealId(null)}
        onNavigateToFull={handlePanelNavigate}
        onDealUpdate={handlePanelUpdate}
      />
    </div>
  );
};

export default DealsKanbanPage;
