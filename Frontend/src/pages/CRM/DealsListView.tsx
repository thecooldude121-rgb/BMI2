import React, { useState, useEffect, useRef, useMemo } from 'react';
import { formatCloseDate, formatRelativeTime, daysFromNow, daysFromNowLabel, isWithinDays, parseDateMs } from '../../utils/dateUtils';
import { useNavigate } from 'react-router-dom';
import {
  Download, Settings, BarChart3, ChevronDown, ChevronUp, ArrowUp, ArrowDown,
  Building2, User, Sparkles, Mail, Phone, Eye, MoreHorizontal,
  CheckCircle2, AlertTriangle, Clock, Target, X, Edit, Copy, Trash2, GripVertical, Archive
} from 'lucide-react';
import { formatAmountUSD } from '../../utils/currencyUtils';
import { explainDealHealth } from '../../utils/dealHealthDrivers';
import type { DealCard } from '../../components/Deal/DealKanbanCard';
import { getStageStyle } from '../../config/stageColors';

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
}

// ── Column definitions ────────────────────────────────────────────────────────

type ColumnKey =
  | 'dealName' | 'account' | 'owner' | 'contact'
  | 'value' | 'stage' | 'closeDate' | 'lastActivity'
  | 'nextStep' | 'dealAge' | 'probability' | 'source'
  | 'health' | 'actions';

const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: 'dealName',     label: 'Deal Name'       },
  { key: 'account',      label: 'Account'         },
  { key: 'owner',        label: 'Owner'           },
  { key: 'contact',      label: 'Primary Contact' },
  { key: 'value',        label: 'Value'           },
  { key: 'stage',        label: 'Stage'           },
  { key: 'closeDate',    label: 'Close Date'      },
  { key: 'lastActivity', label: 'Last Activity'   },
  { key: 'nextStep',     label: 'Next Step'       },
  { key: 'dealAge',      label: 'Deal Age'        },
  { key: 'probability',  label: 'Probability'     },
  { key: 'source',       label: 'Source'          },
  { key: 'health',       label: 'Health'          },
  { key: 'actions',      label: 'Actions'         },
];

const DEFAULT_ORDER: ColumnKey[] = [
  'dealName', 'account', 'owner', 'contact',
  'value', 'stage', 'closeDate', 'lastActivity',
  'nextStep', 'dealAge', 'probability', 'source',
  'health', 'actions',
];

// PERF NOTE: renderCell re-runs for all visible cells on each editValue keystroke.
// For tables > 500 rows, extract each editable cell as React.memo component.
// Current dataset is < 200 rows — acceptable without memoization.

const EDITABLE_FIELDS = ['value', 'stage', 'closeDate', 'owner', 'probability', 'nextStep'] as const;
type EditableField = typeof EDITABLE_FIELDS[number];

// ─────────────────────────────────────────────────────────────────────────────

const DealsListView: React.FC<DealsListViewProps> = ({ stages, onDealClick, onStageChange, onBulkAction, availableOwners = [], onFieldUpdate }) => {
  const navigate = useNavigate();
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedOwner, setSelectedOwner] = useState<string>('all');
  const [selectedCloseDate, setSelectedCloseDate] = useState<string>('all');
  const [selectedValue, setSelectedValue] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [activeKpiFilter, setActiveKpiFilter] = useState<'closingWeek' | 'stalled' | null>(null);
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState<Deal | null>(null);
  const [showCallModal, setShowCallModal] = useState<Deal | null>(null);
  const [showHRMSModal, setShowHRMSModal] = useState<Deal | null>(null);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(() => new Set(DEFAULT_ORDER));
  const [columnOrder, setColumnOrder] = useState<ColumnKey[]>([...DEFAULT_ORDER]);
  const dragKey = useRef<ColumnKey | null>(null);
  const [openPopover, setOpenPopover] = useState<'stage' | 'owner' | 'tag' | 'archive' | null>(null);
  const [bulkToast, setBulkToast] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const headerCheckboxRef = useRef<HTMLInputElement>(null);
  const lastSelectedIndex = useRef<number | null>(null);

  const [editingCell, setEditingCell] = useState<{ dealId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingCell, setSavingCell] = useState<{ dealId: string; field: string } | null>(null);
  const [localEdits, setLocalEdits] = useState<Record<string, Partial<Deal>>>({});
  const [errorCell, setErrorCell] = useState<{ dealId: string; field: string } | null>(null);
  const editInputRef = useRef<HTMLInputElement | HTMLSelectElement | null>(null);
  const commitEditRef = useRef<() => Promise<void>>(async () => {});

  const allDeals: Deal[] = stages.flatMap(stage => stage.deals.map(deal => ({ ...deal, stage: stage.id })));

  const selectedDealSet = useMemo(() => new Set(selectedDeals), [selectedDeals]);

  const filteredDeals = allDeals.filter(deal => {
    const matchesStage = selectedStage === 'all' || deal.stage === selectedStage;
    const matchesOwner = selectedOwner === 'all' || deal.owner === selectedOwner;

    const matchesCloseDate = selectedCloseDate === 'all' ||
      (selectedCloseDate === 'week'    && isWithinDays(deal.closeDate, 7))  ||
      (selectedCloseDate === 'month'   && isWithinDays(deal.closeDate, 30)) ||
      (selectedCloseDate === 'quarter' && isWithinDays(deal.closeDate, 90));

    const matchesValue = selectedValue === 'all' ||
      (selectedValue === '0-25k'   && deal.amount < 25000) ||
      (selectedValue === '25-50k'  && deal.amount >= 25000  && deal.amount < 50000) ||
      (selectedValue === '50-100k' && deal.amount >= 50000  && deal.amount < 100000) ||
      (selectedValue === '100k+'   && deal.amount >= 100000);

    const matchesSource = selectedSource === 'all' || deal.source.includes(selectedSource);

    return matchesStage && matchesOwner && matchesCloseDate && matchesValue && matchesSource;
  });

  const kpiFilteredDeals = useMemo(() => {
    if (activeKpiFilter === 'closingWeek') {
      return filteredDeals.filter(d => d.closeDate && isWithinDays(d.closeDate, 7));
    }
    if (activeKpiFilter === 'stalled') {
      return filteredDeals.filter(d => d.daysSinceContact >= 5);
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
    const count = selectedDeals.length;
    onBulkAction?.('delete', [...selectedDeals]);
    setSelectedDeals([]);
    lastSelectedIndex.current = null;
    setShowDeleteModal(false);
    setBulkToast(`${count} deal${count !== 1 ? 's' : ''} deleted`);
    setTimeout(() => setBulkToast(null), 2500);
  };

  const showBulkToast = (message: string) => {
    setBulkToast(message);
    setTimeout(() => setBulkToast(null), 2500);
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
    setColumnOrder([...DEFAULT_ORDER]);
    setVisibleColumns(new Set(DEFAULT_ORDER));
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

  const totalValue = sortedDeals.reduce((sum, deal) => sum + deal.amount, 0);
  const avgWinRate = 67;
  // KPI counts from filteredDeals (pre-KPI-filter) so they stay stable when a KPI card is active
  const kpiClosingCount  = filteredDeals.filter(d => d.closeDate && isWithinDays(d.closeDate, 7)).length;
  const kpiStalledCount  = filteredDeals.filter(d => d.daysSinceContact >= 5).length;
  const avgDaysCycle = 45;

  // Reset KPI shortcut when any dropdown filter changes to avoid phantom pills
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setActiveKpiFilter(null); }, [selectedStage, selectedOwner, selectedCloseDate, selectedValue, selectedSource]);

  commitEditRef.current = commitEdit;

  const showBulkActions = selectedDeals.length > 0;
  const orderedVisible = columnOrder.filter(k => visibleColumns.has(k));
  // +1 for the always-visible checkbox column
  const visibleColCount = 1 + orderedVisible.length;

  const SortIcon = ({ column }: { column: typeof sortBy }) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const renderHeader = (key: ColumnKey): React.ReactNode => {
    const thBase = 'text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider';
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
        return <th key="value" className={thSort} onClick={() => handleSort('value')}><div className="flex items-center space-x-1"><span>Value</span><SortIcon column="value" /></div></th>;
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
          <td key="dealName" className="px-4 py-3 max-w-[260px]">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600 leading-snug"
                    onClick={() => navigate(`/crm/deals/${deal.id}`)}
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
                onClick={() => toggleRowExpansion(deal.id)}
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
          <td key="account" className="px-4 py-3 max-w-[200px]">
            {deal.companyName ? (
              <div className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-900 truncate">{deal.companyName}</span>
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
              'px-4 py-3 cursor-text transition-colors',
              isEditing ? 'bg-indigo-50/60 ring-1 ring-inset ring-indigo-400' : 'hover:bg-indigo-50/30',
            ].join(' ')}
            onClick={() => { if (!isEditing) startEdit(deal.id, 'owner'); }}
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
                    <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-semibold text-indigo-700">{getInitials(displayOwner)}</span>
                    </div>
                    <span className="text-sm text-gray-700">{firstName}</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </div>
            )}
          </td>
        );
      }

      case 'contact':
        return (
          <td key="contact" className="px-4 py-3">
            {deal.contactName ? (
              <div>
                <div className="text-sm text-gray-900">{deal.contactName}</div>
                {deal.contactTitle && (
                  <div className="text-[11px] text-gray-400 truncate max-w-[160px]">{deal.contactTitle}</div>
                )}
              </div>
            ) : (
              <span className="text-sm text-gray-400">—</span>
            )}
          </td>
        );

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
              'px-4 py-3 cursor-text transition-colors',
              isEditing ? 'bg-indigo-50/60 ring-1 ring-inset ring-indigo-400' : 'hover:bg-indigo-50/30',
              isError   ? 'ring-1 ring-inset ring-red-400 bg-red-50/40' : '',
            ].join(' ')}
            onClick={() => { if (!isEditing) startEdit(deal.id, 'value'); }}
          >
            {isEditing ? (
              <input
                type="number"
                min={0}
                className="w-full bg-transparent text-indigo-600 font-bold text-lg outline-none border-none p-0"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={e => handleEditKeyDown(e, deal.id, 'value')}
                autoFocus
              />
            ) : (
              <div
                className={`text-lg font-bold ${isSaving ? 'animate-pulse opacity-60' : ''}`}
                style={{ color: '#667eea' }}
              >
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
              'px-4 py-3 cursor-text transition-colors',
              isEditing ? 'bg-indigo-50/60 ring-1 ring-inset ring-indigo-400' : 'hover:bg-indigo-50/30',
            ].join(' ')}
            onClick={() => { if (!isEditing) startEdit(deal.id, 'stage'); }}
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
                <div className="text-xs text-gray-500 mt-1">
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
              'px-4 py-3 cursor-text transition-colors',
              isEditing ? 'bg-indigo-50/60 ring-1 ring-inset ring-indigo-400' : 'hover:bg-indigo-50/30',
            ].join(' ')}
            onClick={() => { if (!isEditing) startEdit(deal.id, 'closeDate'); }}
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
            ) : (
              <div className={isSaving ? 'animate-pulse opacity-60' : ''}>
                <div className="text-sm text-gray-900">{formatDate(displayDate)}</div>
                <div className="text-xs text-gray-500">{daysFromNowLabel(displayDate)}</div>
              </div>
            )}
          </td>
        );
      }

      case 'lastActivity':
        return (
          <td key="lastActivity" className="px-4 py-3">
            {deal.lastActivity ? (
              <span className="text-sm text-gray-400">{formatRelativeTime(deal.lastActivity, '')}</span>
            ) : (
              <span className="text-sm text-gray-300">No activity</span>
            )}
          </td>
        );

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
              'px-4 py-3 max-w-[200px] cursor-text transition-colors',
              isEditing ? 'bg-indigo-50/60 ring-1 ring-inset ring-indigo-400' : 'hover:bg-indigo-50/30',
            ].join(' ')}
            onClick={() => { if (!isEditing) startEdit(deal.id, 'nextStep'); }}
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
                  <span className="text-sm text-gray-300">—</span>
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
          <td key="dealAge" className="px-4 py-3">
            <span
              title="Days since deal was created (stage tracking not yet available)"
              className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-full ${ageCls}`}
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
              'px-4 py-3 cursor-text transition-colors',
              isEditing ? 'bg-indigo-50/60 ring-1 ring-inset ring-indigo-400' : 'hover:bg-indigo-50/30',
              isError   ? 'ring-1 ring-inset ring-red-400 bg-red-50/40' : '',
            ].join(' ')}
            onClick={() => { if (!isEditing) startEdit(deal.id, 'probability'); }}
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
          <td key="source" className="px-4 py-3">
            {deal.source ? (
              <span className="bg-gray-100 text-gray-500 text-[11px] font-medium px-2 py-0.5 rounded-full">
                {deal.source}
              </span>
            ) : (
              <span className="text-sm text-gray-300">—</span>
            )}
          </td>
        );

      case 'health': {
        const isClosed = ['closed-won', 'closed-lost'].includes(deal.stage);
        if (isClosed) {
          return (
            <td key="health" className="px-4 py-3">
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
          <td key="health" className="px-4 py-3">
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
          <td key="actions" className="px-4 py-3">
            <div className="relative">
              <button
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={(e) => { e.stopPropagation(); setShowActionDropdown(deal.id); }}
              >
                <MoreHorizontal className="h-4 w-4 text-gray-600" />
              </button>
              {showActionDropdown === deal.id && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                  <button onClick={() => navigate(`/crm/deals/${deal.id}/edit`)} className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <Edit className="h-4 w-4" /><span>Edit Deal</span>
                  </button>
                  <button onClick={() => setShowStageModal(deal.id)} className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <Target className="h-4 w-4" /><span>Change Stage</span>
                  </button>
                  <button className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <User className="h-4 w-4" /><span>Change Owner</span>
                  </button>
                  <button className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <Clock className="h-4 w-4" /><span>Log Activity</span>
                  </button>
                  <button onClick={() => setShowEmailModal(deal)} className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <Mail className="h-4 w-4" /><span>Send Proposal</span>
                  </button>
                  <div className="border-t border-gray-200 my-1" />
                  <button className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-green-700 hover:bg-green-50">
                    <CheckCircle2 className="h-4 w-4" /><span>Mark as Won</span>
                  </button>
                  <button className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50">
                    <X className="h-4 w-4" /><span>Mark as Lost</span>
                  </button>
                  <div className="border-t border-gray-200 my-1" />
                  <button className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <Copy className="h-4 w-4" /><span>Clone Deal</span>
                  </button>
                  <button className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" /><span>Delete Deal</span>
                  </button>
                </div>
              )}
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
        <div className="grid grid-cols-6 gap-6">

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
            <div className="text-sm text-red-700 font-medium mt-1">Stalled Deals</div>
          </div>

          {/* Card 6: Days Avg Cycle — decorative only */}
          <div
            className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200 cursor-default"
            title="Average deal cycle based on closed deals"
          >
            <div className="text-3xl font-bold text-gray-900">{avgDaysCycle}</div>
            <div className="text-sm text-gray-700 font-medium mt-1">Days Avg Cycle</div>
          </div>

        </div>
      </div>

      {/* ── Filter Bar ────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Stage:</label>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              {stages.map(stage => (
                <option key={stage.id} value={stage.id}>{stage.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Owner:</label>
            <select
              value={selectedOwner}
              onChange={(e) => setSelectedOwner(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="Alex Rodriguez">Alex Rodriguez</option>
              <option value="Sarah Chen">Sarah Chen</option>
              <option value="Mike Johnson">Mike Johnson</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Close Date:</label>
            <select
              value={selectedCloseDate}
              onChange={(e) => setSelectedCloseDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Value:</label>
            <select
              value={selectedValue}
              onChange={(e) => setSelectedValue(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="0-25k">$0–25K</option>
              <option value="25-50k">$25–50K</option>
              <option value="50-100k">$50–100K</option>
              <option value="100k+">$100K+</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Source:</label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="Lead Gen">Lead Gen</option>
              <option value="HRMS">HRMS</option>
              <option value="Website">Website</option>
              <option value="Manual">Manual</option>
            </select>
          </div>
        </div>

        {/* KPI filter active pill */}
        {activeKpiFilter && (
          <div className="flex items-center gap-2 px-1 pb-2">
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

        <div className="flex items-center justify-end">
          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-300">
              <BarChart3 className="h-4 w-4" />
              <span>View: List</span>
            </button>
            <button className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-300">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>

            {/* Column settings gear */}
            <div className="relative">
              <button
                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-300"
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
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────────── */}
      <div className="px-8 py-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[1300px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {/* Checkbox — always visible */}
                <th className="w-12 px-4 py-3">
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    checked={selectedDeals.length === sortedDeals.length && sortedDeals.length > 0}
                    onChange={selectAllDeals}
                    aria-label="Select all deals"
                    className="rounded border-gray-300"
                  />
                </th>
                {orderedVisible.map(key => renderHeader(key))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {sortedDeals.map((deal) => {
                const isExpanded = expandedRows.includes(deal.id);
                const isSelected = selectedDealSet.has(deal.id);

                return (
                  <React.Fragment key={deal.id}>
                    <tr
                      className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                      onContextMenu={(e) => handleContextMenu(e, deal.id)}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => toggleDealSelection(deal.id, (e.nativeEvent as MouseEvent | KeyboardEvent).shiftKey)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Select ${deal.dealName}`}
                          className="rounded border-gray-300"
                        />
                      </td>
                      {orderedVisible.map(key => renderCell(key, deal, isExpanded))}
                    </tr>

                    {/* Expanded Row */}
                    {isExpanded && (
                      <tr className="bg-gray-50">
                        <td colSpan={visibleColCount} className="px-4 py-4">
                          <div className="pl-12">
                            <div className="grid grid-cols-2 gap-6">
                              <div>
                                <div className="flex items-center space-x-2 text-sm mb-2">
                                  <User className="h-4 w-4 text-gray-400" />
                                  <span
                                    className="font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                                    onClick={() => navigate(`/crm/contacts/${deal.id}`)}
                                  >
                                    {deal.contactName}
                                  </span>
                                  <span className="text-gray-600">({deal.contactTitle})</span>
                                </div>
                                <div className="text-sm text-gray-600 mb-2">
                                  <span className="font-medium">Owner:</span>
                                  <span
                                    className="ml-1 cursor-pointer hover:text-blue-600"
                                    onClick={() => navigate('/settings/team')}
                                  >
                                    {deal.owner}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-4 text-sm mb-3">
                                  {deal.daysSinceContact >= 5 ? (
                                    <span className="flex items-center space-x-1 text-red-600">
                                      <AlertTriangle className="h-4 w-4" />
                                      <span>{deal.daysSinceContact} days no contact</span>
                                    </span>
                                  ) : (
                                    <span className="flex items-center space-x-1 text-green-600">
                                      <CheckCircle2 className="h-4 w-4" />
                                      <span>{formatRelativeTime(deal.lastActivity, 'No recent activity')}</span>
                                    </span>
                                  )}
                                  <span className="text-gray-500">| {deal.source}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => setShowEmailModal(deal)}
                                    className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                                  >
                                    <Mail className="h-4 w-4" />
                                    <span>Email</span>
                                  </button>
                                  <button
                                    onClick={() => setShowCallModal(deal)}
                                    className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                                  >
                                    <Phone className="h-4 w-4" />
                                    <span>Call</span>
                                  </button>
                                  <button
                                    onClick={() => navigate(`/crm/deals/${deal.id}`)}
                                    className="flex items-center space-x-1 px-3 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span>View Deal</span>
                                  </button>
                                </div>
                              </div>
                              <div className="bg-white rounded-lg p-4 border border-gray-200">
                                <div className="text-xs font-semibold text-gray-700 uppercase mb-2">AI Insights</div>
                                <div className="space-y-2">
                                  {deal.aiScore >= 80 && (
                                    <div className="flex items-start space-x-2 text-sm">
                                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                                      <span className="text-gray-700">Strong engagement signals</span>
                                    </div>
                                  )}
                                  {deal.daysSinceContact >= 5 && (
                                    <div className="flex items-start space-x-2 text-sm">
                                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                                      <span className="text-gray-700">No recent contact activity</span>
                                    </div>
                                  )}
                                  {deal.isHRMS && (
                                    <div className="flex items-start space-x-2 text-sm">
                                      <Building2 className="h-4 w-4 text-orange-500 mt-0.5" />
                                      <span className="text-gray-700">Connected to HRMS account</span>
                                    </div>
                                  )}
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
      {contextMenuDeal && (
        <div
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50"
          style={{ left: contextMenuPosition.x, top: contextMenuPosition.y }}
        >
          <button className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            <Edit className="h-4 w-4" />
            <span>Edit Deal</span>
          </button>
          <button className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            <Target className="h-4 w-4" />
            <span>Change Stage</span>
          </button>
          <button className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            <Copy className="h-4 w-4" />
            <span>Clone Deal</span>
          </button>
          <button className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
            <span>Delete Deal</span>
          </button>
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

      {/* ── Delete Confirmation Modal ─────────────────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete {selectedDeals.length} Deals?
                </h3>
              </div>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600">This action cannot be undone.</p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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
                      const count = selectedDeals.length;
                      onBulkAction?.('archive', [...selectedDeals]);
                      setOpenPopover(null);
                      setSelectedDeals([]);
                      lastSelectedIndex.current = null;
                      showBulkToast(`${count} deal${count !== 1 ? 's' : ''} archived`);
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
            onClick={() => setShowDeleteModal(true)}
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

      {/* ── Bulk Action Toast ─────────────────────────────────────────────────── */}
      {bulkToast && (
        <div className="fixed top-5 right-5 z-50 bg-gray-800 text-white text-sm px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          {bulkToast}
        </div>
      )}
    </div>
  );
};

export default DealsListView;
