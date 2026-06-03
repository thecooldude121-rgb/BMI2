import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { fetchDeals } from '../../utils/dealsApi';
import { formatDisplayDate, daysFromNow, daysFromNowLabel } from '../../utils/dateUtils';
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
  Columns
} from 'lucide-react';
import DealsListView from './DealsListView';
import DealsGridView from './DealsGridView';

interface DealCard {
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
  hrmsDetails?: string;
  priority: 'high' | 'medium' | 'low';
  health: 'healthy' | 'at-risk' | 'stalled';
  source: string;
  status?: string;
  createdAt?: string;
}

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
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [collapsedStages, setCollapsedStages] = useState<string[]>([]);
  const [focusedStage, setFocusedStage] = useState<string | null>(null);
  const [showValueBreakdown, setShowValueBreakdown] = useState(false);
  const [selectedStageForBreakdown, setSelectedStageForBreakdown] = useState<PipelineStage | null>(null);
  // Delete confirmation — stores the deal to be deleted until user confirms
  const [deleteConfirmDeal, setDeleteConfirmDeal] = useState<{ id: string; name: string } | null>(null);
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
  // Re-runs whenever the DataContext deal count changes (e.g. after Add Deal).
  useEffect(() => {
    fetchDeals().then((apiDeals: any[]) => {
      if (!apiDeals.length) return;
      setStages(prev => prev.map(stage => ({
        ...stage,
        deals: apiDeals
          .filter((d: any) => d.stage === stage.id)
          .map((d: any) => ({
            id: d.id,
            companyName: d.company_name || d.name || 'Unknown Company',
            dealName: d.name || d.title || 'Untitled',
            accountName: d.company_name || d.name || '',
            amount: parseFloat(d.value) || 0,
            // Strip time component so formatDisplayDate renders cleanly
            closeDate: d.expected_close_date
              ? d.expected_close_date.split('T')[0]
              : '',
            stage: stage.id,
            aiScore: d.probability || 0,
            contactName: d.contact_name || '',
            contactTitle: d.contact_title || '',
            owner: d.assigned_to || 'Unassigned',
            // Store raw ISO; formatLastActivity() renders it human-readable on card
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
            status: d.status || '',
            createdAt: d.created_at || '',
          })),
      })));
    });
  }, [contextDeals.length]);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedOwner, setSelectedOwner] = useState('all');
  const [selectedCloseDateFilter, setSelectedCloseDateFilter] = useState('all');
  const [selectedValueFilter, setSelectedValueFilter] = useState('all');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState('all');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 200);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const kpis = useMemo(() => {
    // Always computed from the FULL unfiltered dataset — never from search/filter subsets
    const allDeals = stages.flatMap(stage => stage.deals);
    const totalDeals = allDeals.length;
    const totalValue = allDeals.reduce((sum, d) => sum + (d.amount || 0), 0);

    const wonDeals = stages.find(s => s.id === 'closed-won')?.deals.length || 0;
    const lostDeals = stages.find(s => s.id === 'closed-lost')?.deals.length || 0;
    const closedTotal = wonDeals + lostDeals;
    const winRate = closedTotal > 0 ? Math.round((wonDeals / closedTotal) * 100) : 0;

    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const closingThisWeek = allDeals.filter(d => {
      if (!d.closeDate) return false;
      const days = daysFromNow(d.closeDate);
      return days !== null && days >= 0 && days <= 7;
    }).length;

    const stalledDeals = allDeals.filter(d => d.daysSinceContact >= 5).length;

    // Compute average sales cycle from real closed-won deals that have a creation date.
    // Falls back to null (displayed as "N/A") when no qualifying data exists.
    const wonWithDates = (stages.find(s => s.id === 'closed-won')?.deals || []).filter(
      d => d.createdAt && d.closeDate
    );
    const avgCycle = wonWithDates.length > 0
      ? Math.round(wonWithDates.reduce((sum, d) => {
          const created = new Date(d.createdAt!).getTime();
          const closed  = new Date(d.closeDate + 'T12:00:00').getTime();
          return sum + Math.max(0, (closed - created) / 86_400_000);
        }, 0) / wonWithDates.length)
      : null;

    return { totalDeals, totalValue, winRate, closingThisWeek, stalledDeals, avgCycle };
  }, [stages]);

  const aiInsights = useMemo(() => {
    const allDeals = stages.flatMap(stage => stage.deals);
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

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const newStages = [...stages];
    const sourceStage = newStages.find(s => s.id === source.droppableId);
    const destStage = newStages.find(s => s.id === destination.droppableId);

    if (!sourceStage || !destStage) return;

    const [movedDeal] = sourceStage.deals.splice(source.index, 1);
    const oldStage = movedDeal.stage;
    movedDeal.stage = destStage.id;

    const newScore = Math.min(100, movedDeal.aiScore + Math.floor(Math.random() * 10) - 3);
    movedDeal.aiScore = Math.max(0, newScore);

    destStage.deals.splice(destination.index, 0, movedDeal);

    setStages(newStages);

    setToast({
      message: `Deal moved to ${destStage.name}`,
      type: 'success'
    });

    console.log(`Activity logged: Stage changed from ${sourceStage.name} to ${destStage.name} for ${movedDeal.companyName}`);

    setTimeout(() => setToast(null), 3000);
  };

  // Convert a raw ISO timestamp or human-readable string to a friendly label.
  // Backend-injected deals carry ISO strings (e.g. "2026-01-15T10:30:00Z").
  // Sample/dragged deals already carry strings like "3 days ago" — pass those through.
  const formatLastActivity = (lastActivity: string): string => {
    if (!lastActivity) return 'No activity';
    if (/^\d{4}-\d{2}-\d{2}T/.test(lastActivity)) {
      const d = new Date(lastActivity);
      if (!isNaN(d.getTime())) {
        const daysAgo = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
        if (daysAgo === 0) return 'Today';
        if (daysAgo === 1) return '1 day ago';
        if (daysAgo < 30) return `${daysAgo} days ago`;
        if (daysAgo < 365) return `${Math.floor(daysAgo / 30)}mo ago`;
        return formatDisplayDate(d);
      }
    }
    return lastActivity;
  };

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
      case 'closingWeek':
        setSelectedCloseDateFilter('week');
        break;
      case 'stalled':
        const stalledDeals = stages.flatMap(s => s.deals).filter(d => d.health === 'stalled');
        setHighlightedDeals(stalledDeals.map(d => d.id));
        break;
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

  const handleCardClick = (dealId: string) => {
    navigate(`/crm/deals/${dealId}`);
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

      // Close date filter
      if (selectedCloseDateFilter !== 'all' && d.closeDate) {
        const closeMs = new Date(d.closeDate + 'T12:00:00').getTime();
        const now = Date.now();
        if (selectedCloseDateFilter === 'week' && closeMs > now + 7 * 86_400_000) return false;
        if (selectedCloseDateFilter === 'month') {
          const n = new Date();
          const endOfMonth = new Date(n.getFullYear(), n.getMonth() + 1, 0, 23, 59, 59).getTime();
          if (closeMs > endOfMonth) return false;
        }
        if (selectedCloseDateFilter === 'quarter') {
          const n = new Date();
          const qEnd = Math.floor(n.getMonth() / 3) + 1;
          const endOfQ = new Date(n.getFullYear(), qEnd * 3, 0, 23, 59, 59).getTime();
          if (closeMs > endOfQ) return false;
        }
      }

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
        case 'closeDate': {
          const aMs = a.closeDate ? new Date(a.closeDate + 'T12:00:00').getTime() : Infinity;
          const bMs = b.closeDate ? new Date(b.closeDate + 'T12:00:00').getTime() : Infinity;
          return aMs - bMs;
        }
        default: return 0;
      }
    });
  };

  const getVisibleDeals = (stage: PipelineStage) => {
    const filtered = sortDeals(filterDeals(stage.deals));
    const count = visibleDealsCount[stage.id] || DEALS_PER_PAGE;
    return filtered.slice(0, count);
  };

  const hasMoreDeals = (stage: PipelineStage) => {
    const filtered = filterDeals(stage.deals);
    const count = visibleDealsCount[stage.id] || DEALS_PER_PAGE;
    return count < filtered.length;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Frozen title bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 -mx-6 -mt-6 px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Deals Pipeline</h1>
                <p className="text-xs text-gray-500">Manage your sales pipeline and forecast revenue</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/crm/deals/add')}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>Add Deal</span>
              </button>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowMoreOptions(!showMoreOptions)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="More Options"
                >
                  <MoreVertical className="h-5 w-5" />
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

                    <div className="border-t border-gray-100 my-1"></div>

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

      <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="grid grid-cols-6 gap-4">
            <button
              onClick={() => handleStatClick('total')}
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200 hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700">Total Deals</span>
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-900">{kpis.totalDeals}</div>
            </button>

            <button
              onClick={() => handleStatClick('value')}
              className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200 hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-700">Total Value</span>
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-900">{formatCurrency(kpis.totalValue)}</div>
            </button>

            <button
              onClick={() => handleStatClick('winRate')}
              className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200 hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-700">Avg Win Rate</span>
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-900">{kpis.winRate}%</div>
            </button>

            <button
              onClick={() => handleStatClick('closingWeek')}
              className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200 hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-orange-700">Closing This Week</span>
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-orange-900">{kpis.closingThisWeek}</div>
            </button>

            <button
              onClick={() => handleStatClick('stalled')}
              className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200 hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-red-700">Stalled Deals</span>
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-red-900">{kpis.stalledDeals}</div>
            </button>

            <button
              onClick={() => handleStatClick('avgCycle')}
              className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Days Avg Cycle</span>
                <Clock className="h-5 w-5 text-gray-600" />
              </div>
              {/* null = no closed-won deals with dates yet; show N/A rather than a fake number */}
              <div className="text-2xl font-bold text-gray-900">
                {kpis.avgCycle !== null ? kpis.avgCycle : <span className="text-base text-gray-400">N/A</span>}
              </div>
            </button>
          </div>
      </div>

      <div className="px-8 py-6" style={{ background: '#667eea' }}>
        <div className="flex items-center space-x-2 mb-4">
          <Sparkles className="h-5 w-5 text-white" />
          <h2 className="text-lg font-semibold text-white">AI Insights & Recommendations</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-300 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-white font-medium mb-1">
                  3 deals need attention - No activity in 5+ days
                </p>
                <p className="text-white/80 text-sm mb-3">
                  {aiInsights.needAttention.map(d => `${d.companyName} (${formatCurrency(d.amount)})`).join(', ')}
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={handleViewDeals}
                    className="text-xs px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded transition-colors"
                  >
                    View Deals
                  </button>
                  <button
                    onClick={handleCreateTasks}
                    className="text-xs px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded transition-colors"
                  >
                    Create Tasks
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-start space-x-3">
              <TrendingUp className="h-5 w-5 text-green-300 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-white font-medium mb-1">
                  High probability to close {formatCurrency(aiInsights.highProbValue)} this month
                </p>
                <p className="text-white/80 text-sm mb-3">
                  {aiInsights.negotiationDeals.length} deals in Negotiation stage (avg 85% win rate)
                </p>
                <button
                  onClick={handleViewForecast}
                  className="text-xs px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded transition-colors"
                >
                  View Forecast
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 backdrop-blur-sm rounded-lg p-4 border-2 border-orange-400/40 shadow-lg">
            <div className="flex items-start space-x-3">
              <div className="bg-orange-500/30 rounded-full p-2">
                <Building2 className="h-5 w-5 text-orange-100 flex-shrink-0" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold mb-1 flex items-center space-x-2">
                  <span>🏢 {aiInsights.hrmsDeals.length} deals with HRMS connections progressing well</span>
                </p>
                <p className="text-white/90 text-sm mb-3">
                  TechStart ({formatCurrency(42000)}) and DataFlow ({formatCurrency(95000)}) - 92% avg score
                </p>
                <button
                  onClick={handleViewHRMSDeals}
                  className="text-xs px-3 py-1.5 bg-orange-500/40 hover:bg-orange-500/60 text-white rounded font-medium transition-colors border border-orange-300/30"
                >
                  View HRMS Deals
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Owner:</span>
            <select
              value={selectedOwner}
              onChange={(e) => setSelectedOwner(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="me">Me</option>
              <option value="team">My Team</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Close Date:</span>
            <select
              value={selectedCloseDateFilter}
              onChange={(e) => setSelectedCloseDateFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Value:</span>
            <select
              value={selectedValueFilter}
              onChange={(e) => setSelectedValueFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="0-25k">$0-25K</option>
              <option value="25-50k">$25-50K</option>
              <option value="50-100k">$50-100K</option>
              <option value="100k+">$100K+</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Source:</span>
            <select
              value={selectedSourceFilter}
              onChange={(e) => setSelectedSourceFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="leadgen">Lead Gen</option>
              <option value="hrms">HRMS</option>
              <option value="website">Website</option>
              <option value="manual">Manual</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search deals, accounts, contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative" ref={sortDropdownRef}>
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-300"
              >
                <Filter className="h-4 w-4" />
                <span>Sort: {getSortLabel()}</span>
              </button>

              {showSortDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={() => handleSort('closeDate')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Close Date (soonest first)
                  </button>
                  <button
                    onClick={() => handleSort('value')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Deal Value (highest first)
                  </button>
                  <button
                    onClick={() => handleSort('health')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    AI Health Score (highest first)
                  </button>
                  <button
                    onClick={() => handleSort('activity')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Last Activity (most recent)
                  </button>
                  <button
                    onClick={() => handleSort('stage')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Stage Progress
                  </button>
                </div>
              )}
            </div>

            <div className="relative" ref={viewDropdownRef}>
              <button
                onClick={() => setShowViewDropdown(!showViewDropdown)}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-300"
              >
                <BarChart3 className="h-4 w-4" />
                <span>View: {getViewLabel()}</span>
              </button>

              {showViewDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={() => handleViewChange('kanban')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Kanban
                  </button>
                  <button
                    onClick={() => handleViewChange('list')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    List view (table)
                  </button>
                  <button
                    onClick={() => handleViewChange('grid')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Grid view (cards)
                  </button>
                  <button
                    onClick={() => handleViewChange('calendar')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Calendar view
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-300"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
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
        <div className="px-8 py-6 overflow-x-auto" style={{ scrollBehavior: 'smooth' }}>
          {focusedStage && (
            <div className="mb-4 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
              <div className="flex items-center space-x-2 text-blue-900">
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Viewing: {stages.find(s => s.id === focusedStage)?.name}
                </span>
              </div>
              <button
                onClick={() => setFocusedStage(null)}
                className="text-sm text-blue-700 hover:text-blue-900 font-medium"
              >
                Show All Stages
              </button>
            </div>
          )}

          <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 min-w-max">
            {displayedStages.map((stage) => {
              const isCollapsed = collapsedStages.includes(stage.id);
              const filteredDeals = filterDeals(stage.deals);
              // Hide column entirely when search is active and nothing matches
              if (debouncedSearch && filteredDeals.length === 0) return null;
              const stageTotal = filteredDeals.reduce((sum, d) => sum + d.amount, 0);

              const getStageHeaderColor = () => {
                switch(stage.id) {
                  case 'prospecting': return { bg: '#2196F3', text: '#ffffff' };
                  case 'qualified': return { bg: '#4CAF50', text: '#ffffff' };
                  case 'proposal': return { bg: '#FF9800', text: '#ffffff' };
                  case 'negotiation': return { bg: '#9C27B0', text: '#ffffff' };
                  case 'closed-won': return { bg: '#2E7D32', text: '#ffffff' };
                  case 'closed-lost': return { bg: '#D32F2F', text: '#ffffff' };
                  default: return { bg: '#757575', text: '#ffffff' };
                }
              };

              const headerColors = getStageHeaderColor();

              return (
                <div key={stage.id} style={{ width: '280px' }} className="flex-shrink-0">
                  <div className="rounded-t-lg px-4 py-3" style={{ backgroundColor: headerColors.bg }}>
                    <div className="flex items-center justify-between mb-1">
                      <button
                        onClick={() => toggleStageCollapse(stage.id)}
                        className="font-bold hover:opacity-80 transition-opacity text-left uppercase text-sm tracking-wide"
                        style={{ color: headerColors.text }}
                      >
                        {stage.name}
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-sm" style={{ color: headerColors.text, opacity: 0.9 }}>
                      <button
                        onClick={(e) => handleStageCountClick(e, stage.id)}
                        className="hover:opacity-80 transition-opacity font-medium"
                      >
                        {filteredDeals.length} deal{filteredDeals.length !== 1 ? 's' : ''}
                        {debouncedSearch && filteredDeals.length !== stage.deals.length && (
                          <span style={{ opacity: 0.75 }}> / {stage.deals.length}</span>
                        )}
                      </button>
                      <button
                        onClick={(e) => handleStageValueClick(e, stage)}
                        className="font-medium hover:opacity-80 transition-opacity"
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
                      className={`${stage.color} rounded-b-lg px-3 py-2 ${isCollapsed ? 'min-h-[50px]' : 'min-h-[500px] max-h-[700px] overflow-y-auto'} space-y-2 ${
                        snapshot.isDraggingOver ? 'ring-2 ring-blue-400' : ''
                      }`}
                      style={{ scrollbarWidth: 'thin' }}
                    >
                      {!isCollapsed && getVisibleDeals(stage).map((deal, index) => {
                        const isStalled = deal.daysSinceContact >= 5;
                        const isHighPriority = deal.priority === 'high';

                        // Close date urgency for at-a-glance scanning
                        const closeDaysLeft = deal.closeDate
                          ? Math.ceil((new Date(deal.closeDate + 'T12:00:00').getTime() - Date.now()) / 86_400_000)
                          : null;
                        const closeDateColor =
                          closeDaysLeft === null ? 'text-gray-500' :
                          closeDaysLeft < 0    ? 'text-red-600 font-semibold' :
                          closeDaysLeft <= 7   ? 'text-orange-600 font-semibold' :
                                                 'text-gray-600';

                        return (
                        <Draggable key={deal.id} draggableId={deal.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => handleCardClick(deal.id)}
                              onContextMenu={(e) => handleContextMenu(e, deal.id)}
                              className={`bg-white rounded-lg shadow-sm transition-all duration-200 cursor-pointer relative ${
                                snapshot.isDragging ? 'shadow-xl scale-105 ring-2' : 'hover:shadow-md hover:-translate-y-0.5'
                              }`}
                              style={{
                                padding: '12px 14px',
                                border: snapshot.isDragging ? '2px solid #667eea' :
                                        highlightedDeals.includes(deal.id) ? '2px solid #dc3545' :
                                        '1px solid #E0E0E0',
                                // Left accent: stalled = amber, high priority = red, default = none
                                borderLeft: isStalled
                                  ? '4px solid #ffc107'
                                  : isHighPriority
                                  ? '4px solid #dc3545'
                                  : undefined,
                                opacity: snapshot.isDragging ? 0.9 : 1
                              }}
                              onMouseEnter={(e) => {
                                if (!snapshot.isDragging) e.currentTarget.style.borderColor = '#667eea';
                              }}
                              onMouseLeave={(e) => {
                                if (!snapshot.isDragging) {
                                  e.currentTarget.style.borderColor =
                                    highlightedDeals.includes(deal.id) ? '#dc3545' : '#E0E0E0';
                                }
                              }}
                            >
                              {/* Row 1: Deal name + HRMS badge */}
                              <div className="flex items-start justify-between mb-1">
                                <h4 className="font-semibold text-sm leading-snug text-gray-900 flex-1 mr-2 line-clamp-2">
                                  {deal.dealName}
                                </h4>
                                {deal.isHRMS && (
                                  <button
                                    onClick={(e) => handleHRMSBadgeClick(e, deal)}
                                    className="flex-shrink-0 flex items-center space-x-1 px-2 py-0.5 text-xs rounded font-medium hover:shadow-sm transition-all"
                                    style={{ backgroundColor: '#fff3cd', border: '1px solid #ff9800', color: '#e65100' }}
                                  >
                                    <Building2 className="h-3 w-3" />
                                    <span>HRMS</span>
                                  </button>
                                )}
                              </div>

                              {/* Row 2: Company name (muted) */}
                              <p className="text-xs text-gray-500 mb-2 truncate">{deal.companyName}</p>

                              {/* Row 3: Amount — primary visual anchor on the card */}
                              <div className="text-base font-bold mb-2" style={{ color: '#4f46e5' }}>
                                {formatCurrency(deal.amount)}
                              </div>

                              {/* Row 4: Close date with urgency colour */}
                              <div className={`flex items-center space-x-1 text-xs mb-2 ${closeDateColor}`}>
                                <Calendar className="h-3 w-3 flex-shrink-0" />
                                <span>{formatDisplayDate(deal.closeDate)}</span>
                                {closeDaysLeft !== null && closeDaysLeft < 0 && (
                                  <span className="ml-1 px-1 py-0.5 bg-red-100 text-red-700 rounded text-xs">Overdue</span>
                                )}
                                {closeDaysLeft !== null && closeDaysLeft >= 0 && closeDaysLeft <= 7 && (
                                  <span className="ml-1 px-1 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">This week</span>
                                )}
                              </div>

                              {/* Row 5: AI Health — compact pill + expandable score tooltip */}
                              {!['closed-won', 'closed-lost'].includes(stage.id) && (
                                <div className="mb-2 relative">
                                  <button
                                    onClick={(e) => handleScoreClick(e, deal.id)}
                                    className="flex items-center space-x-2 w-full hover:opacity-80 transition-opacity"
                                  >
                                    <span className="flex items-center space-x-1 text-xs" style={{ color: '#667eea' }}>
                                      <Sparkles className="h-3 w-3" />
                                      <span className="font-medium">AI</span>
                                    </span>
                                    {/* Thin progress bar — less dominant than before */}
                                    <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                      <div
                                        className="h-1.5 rounded-full transition-all duration-300"
                                        style={{
                                          width: `${deal.aiScore}%`,
                                          backgroundColor: deal.aiScore >= 80 ? '#16a34a' : deal.aiScore >= 60 ? '#667eea' : '#f59e0b'
                                        }}
                                      />
                                    </div>
                                    <span className="text-xs font-bold" style={{ color: '#667eea' }}>{deal.aiScore}</span>
                                  </button>

                                  {showScoreTooltip === deal.id && (() => {
                                    // Compute score signals from real deal fields
                                    const activitySignal = deal.daysSinceContact === 0 ? { label: 'Activity today', delta: +20, good: true }
                                      : deal.daysSinceContact <= 2 ? { label: `Active ${deal.daysSinceContact}d ago`, delta: +15, good: true }
                                      : deal.daysSinceContact <= 5 ? { label: `${deal.daysSinceContact}d since contact`, delta: +5, good: true }
                                      : { label: `No activity (${deal.daysSinceContact}d)`, delta: -15, good: false };

                                    const sizeSignal = deal.amount >= 100_000 ? { label: 'High-value deal', delta: +15, good: true }
                                      : deal.amount >= 50_000 ? { label: 'Mid-value deal', delta: +10, good: true }
                                      : { label: 'Standard deal size', delta: +5, good: true };

                                    const healthSignal = deal.health === 'healthy'  ? { label: 'Deal health: good', delta: +5, good: true }
                                      : deal.health === 'at-risk' ? { label: 'Deal health: at risk', delta: -5, good: false }
                                      : { label: 'Deal stalled', delta: -15, good: false };

                                    const closeDateSignal = closeDaysLeft === null ? null
                                      : closeDaysLeft < 0  ? { label: 'Close date overdue', delta: -10, good: false }
                                      : closeDaysLeft <= 7 ? { label: 'Closing this week', delta: +10, good: true }
                                      : closeDaysLeft <= 30 ? { label: 'Close date this month', delta: +5, good: true }
                                      : { label: 'Close date far out', delta: -2, good: false };

                                    const signals = [activitySignal, sizeSignal, healthSignal, ...(closeDateSignal ? [closeDateSignal] : [])];
                                    return (
                                      <div className="absolute z-50 left-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border-2 p-3" style={{ borderColor: '#667eea' }}>
                                        <div className="text-xs font-semibold mb-2 flex items-center space-x-1" style={{ color: '#667eea' }}>
                                          <Sparkles className="h-3.5 w-3.5" />
                                          <span>AI Health: {deal.aiScore}/100</span>
                                        </div>
                                        <div className="space-y-1.5 text-xs">
                                          {signals.map((s, i) => (
                                            <div key={i} className="flex items-center justify-between">
                                              <span className={`flex items-center space-x-1 ${s.good ? 'text-green-600' : 'text-yellow-600'}`}>
                                                {s.good ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                                                <span>{s.label}</span>
                                              </span>
                                              <span className={`font-semibold ${s.delta > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                {s.delta > 0 ? `+${s.delta}` : s.delta}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}

                              {/* Row 6: Contact + Owner in a single compact row */}
                              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <button
                                  onClick={(e) => handleContactClick(e, deal.id)}
                                  className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-600 transition-colors truncate max-w-[60%]"
                                >
                                  <User className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{deal.contactName || '—'}</span>
                                </button>
                                <button
                                  onClick={(e) => handleStatusClick(e, deal)}
                                  className={`flex items-center space-x-1 text-xs font-medium transition-colors ${
                                    isStalled ? 'text-red-500 hover:text-red-700' :
                                    deal.health === 'healthy' ? 'text-green-600 hover:text-green-800' :
                                    deal.health === 'at-risk' ? 'text-yellow-600 hover:text-yellow-800' :
                                    'text-gray-500'
                                  }`}
                                >
                                  {stage.id === 'closed-won' && <><CheckCircle2 className="h-3 w-3" /><span>Won</span></>}
                                  {stage.id === 'closed-lost' && <><XCircle className="h-3 w-3" /><span>Lost</span></>}
                                  {!['closed-won', 'closed-lost'].includes(stage.id) && (
                                    <>
                                      {getHealthIcon(deal.health)}
                                      {isStalled
                                        ? <span>{deal.daysSinceContact}d stalled</span>
                                        : <span>{formatLastActivity(deal.lastActivity)}</span>
                                      }
                                    </>
                                  )}
                                </button>
                              </div>
                              {/* Owner shown below contact row — less prominent */}
                              {deal.owner && (
                                <div className="text-xs text-gray-400 mt-1 truncate">
                                  Owner: {deal.owner}
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      );
                      })}
                      {provided.placeholder}

                      {/* Empty state when search/filters produce no results */}
                      {!isCollapsed && filterDeals(stage.deals).length === 0 && !debouncedSearch && (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                          <Target className="h-8 w-8 mb-2 opacity-40" />
                          <p className="text-xs text-center">No deals in this stage</p>
                        </div>
                      )}

                      {isCollapsed && (
                        <div className="text-center text-sm text-gray-500 py-4">
                          {stage.deals.length} deal{stage.deals.length !== 1 ? 's' : ''} hidden
                        </div>
                      )}

                      {!isCollapsed && hasMoreDeals(stage) && (
                        <>
                          {loadingMore[stage.id] ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                              <span className="ml-2 text-sm text-gray-600">Loading more deals...</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => loadMoreDeals(stage.id)}
                              className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-blue-400 transition-colors text-sm font-medium flex items-center justify-center space-x-2"
                            >
                              <span>Load More Deals</span>
                              <span className="text-xs text-gray-500">
                                ({stage.deals.length - (visibleDealsCount[stage.id] || DEALS_PER_PAGE)} remaining)
                              </span>
                            </button>
                          )}
                          <div
                            ref={(el) => setupInfiniteScroll(el, stage.id)}
                            className="h-4"
                          />
                        </>
                      )}

                      {!isCollapsed && !['closed-won', 'closed-lost'].includes(stage.id) && (
                        <button
                          onClick={() => handleAddDealToStage(stage.id)}
                          className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors text-sm font-medium"
                        >
                          + Add Deal
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
                <div className="text-sm text-gray-900">{selectedActivityDeal.lastActivity}</div>
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
                          {deal.contactName} • Close: {formatDisplayDate(deal.closeDate)}
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
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`rounded-lg shadow-lg px-4 py-3 flex items-center space-x-2 ${
            toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
          } text-white`}>
            {toast.type === 'success' && <CheckCircle2 className="h-5 w-5" />}
            {toast.type === 'error' && <XCircle className="h-5 w-5" />}
            {toast.type === 'info' && <AlertTriangle className="h-5 w-5" />}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealsKanbanPage;
