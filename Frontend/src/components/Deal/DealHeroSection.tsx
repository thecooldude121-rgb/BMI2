import React, { useState, useEffect, useRef } from 'react';
import {
  Edit, Building2, Sparkles,
  Mail, Phone, CalendarDays, FileText, TrendingUp, TrendingDown,
  ChevronDown, ChevronUp, DollarSign, AlertTriangle,
  MoreHorizontal, X,
  StickyNote, ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { daysFromNowLabel, closeDateUrgencyClass } from '../../utils/dateUtils';
import { formatCurrencyCompact, convertToBaseCurrency, BASE_CURRENCY_CODE } from '../../utils/currencyUtils';
import { getUsers } from '../../utils/dealsApi';
import type { DealOwnerInfo, DealValueHistoryEntry } from '../../types/dealManagement';
import { DealMomentum } from './DealMomentum';
import type { MomentumResult } from '../../utils/dealMomentum';
import type { RevenueSchedule } from './RevenueTimeline';

// Stage ordering (1-indexed, matching STAGE_MAP in ComprehensiveDealDetailPage)
const ORDERED_STAGES: Record<number, string> = {
  1: 'Prospecting',
  2: 'Qualified',
  3: 'Proposal',
  4: 'Negotiation',
  5: 'Closed Won',
  6: 'Closed Lost',
};

// Item 2: avatar gradient per stage
const STAGE_AVATAR_GRADIENT: Record<string, string> = {
  prospecting:  'from-blue-500 to-blue-600',
  qualified:    'from-green-500 to-green-600',
  proposal:     'from-orange-500 to-orange-600',
  negotiation:  'from-purple-500 to-purple-600',
  'closed-won': 'from-emerald-500 to-emerald-600',
  'closed-lost':'from-red-500 to-red-600',
};

// Item 5: stage dot color (Tailwind class)
const STAGE_DOT_COLOR: Record<string, string> = {
  prospecting:  'bg-blue-500',
  qualified:    'bg-green-500',
  proposal:     'bg-orange-500',
  negotiation:  'bg-purple-500',
  'closed-won': 'bg-emerald-500',
  'closed-lost':'bg-red-500',
};

// Inline CSS gradient per stage (avoids Tailwind JIT dynamic-class purge)
const STAGE_GRADIENT_CSS: Record<string, string> = {
  prospecting:  'linear-gradient(to bottom right, #3B82F6, #2563EB)',
  qualified:    'linear-gradient(to bottom right, #22C55E, #16A34A)',
  proposal:     'linear-gradient(to bottom right, #F97316, #EA580C)',
  negotiation:  'linear-gradient(to bottom right, #A855F7, #9333EA)',
  'closed-won': 'linear-gradient(to bottom right, #10B981, #059669)',
  'closed-lost':'linear-gradient(to bottom right, #EF4444, #DC2626)',
};

// Hex dot color per stage (inline style, avoids Tailwind JIT purge)
const STAGE_DOT_HEX: Record<string, string> = {
  prospecting:  '#3B82F6',
  qualified:    '#22C55E',
  proposal:     '#F97316',
  negotiation:  '#A855F7',
  'closed-won': '#10B981',
  'closed-lost':'#EF4444',
};

// Item 23: stage hex colors for pipeline strip
const STAGE_HEX: Record<number, string> = {
  1: '#3B82F6', 2: '#22C55E', 3: '#F97316', 4: '#A855F7', 5: '#10B981', 6: '#EF4444',
};

// API-compatible stage key per stage number
const STAGE_KEY_MAP: Record<number, string> = {
  1: 'prospecting',
  2: 'qualified',
  3: 'proposal',
  4: 'negotiation',
  5: 'closed-won',
  6: 'closed-lost',
};

// Item 6: color-coded days away label (returns hex to avoid Tailwind JIT dynamic-class purge)

// ── Keyboard shortcut badge ───────────────────────────────────────────────────

function KbdBadge({ char }: { char: string }) {
  return (
    <kbd className="ml-1 hidden xl:inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold bg-black/20 border border-white/25 rounded text-white leading-none tracking-wide">
      {char}
    </kbd>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface PriorityAction {
  priority: 'high' | 'medium';
  title: string;
  reason: string;
  ctas: string[];
  totalCount: number;
}

interface DealHeroSectionProps {
  deal: {
    id: string;
    companyName: string;
    dealName: string;
    amount: number;
    currency?: string;
    base_amount_usd?: number;
    stage: string;
    stageName: string;
    closeDate: string;
    owner: string;
    ownerId?: string;
    ownerInfo?: DealOwnerInfo;
    dealValueHistory?: DealValueHistoryEntry[];
    createdDate: string;
    accountName: string;
    accountSize: string;
    accountIndustry: string;
    contactName: string;
    contactTitle: string;
    source: string;
    aiScore: number;
    aiHealth: string;
    daysAway: number;
    stageNumber: number;
    totalStages: number;
    probability?: number;
  };
  onEdit: () => void;
  onMoreAction: (action: string) => void;
  onEmail?: () => void;
  onCall?: () => void;
  onMeeting?: () => void;
  onProposal?: () => void;
  onMoveStage?: () => void;
  onUpdateAmount?: () => void;
  onAssignOwner?: (ownerName: string) => void;
  onSaveAmount?: (amount: number) => void;
  onSaveCloseDate?: (isoDate: string) => void;
  onShowShortcuts?: () => void;
  momentumResult?: MomentumResult;
  revenueSchedule?: RevenueSchedule | null;
  onViewRevenue?: () => void;
  priorityAction?: PriorityAction | null;
  onViewAllActions?: () => void;
  healthScoreFactors?: Array<{ category: string; score: number; stars: number }>;
  daysSinceContact?: number;
  timeInStage?: number;
  avgStageDuration?: number;
  onStageSelect?: (stageNum: number, stageName: string, stageKey: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const DealHeroSection: React.FC<DealHeroSectionProps> = ({
  deal,
  onEdit,
  onMoreAction,
  onEmail,
  onCall,
  onMeeting,
  onProposal,
  onMoveStage,
  onUpdateAmount,
  onAssignOwner,
  onSaveAmount,
  onSaveCloseDate,
  onShowShortcuts,
  momentumResult,
  revenueSchedule,
  onViewRevenue,
  priorityAction,
  onViewAllActions,
  healthScoreFactors,
  daysSinceContact = 0,
  timeInStage,
  avgStageDuration,
  onStageSelect,
}) => {
  const navigate = useNavigate();

  // Priority action banner dismiss (session only)
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Item 10: health score row expand
  const [showHealthFactors, setShowHealthFactors] = useState(false);

  // Item 8: animate health bar on mount
  const [healthBarWidth, setHealthBarWidth] = React.useState(0);
  React.useEffect(() => {
    requestAnimationFrame(() => setHealthBarWidth(deal.aiScore));
  }, [deal.aiScore]);

  // Header more-options

  // Owner tile
  const [showOwnerDropdown, setShowOwnerDropdown]   = useState(false);
  const [showValueHistory, setShowValueHistory]       = useState(false);
  const [ownersList, setOwnersList]                   = useState<any[]>([]);
  const [isLoadingOwners, setIsLoadingOwners]         = useState(false);
  const ownerDropdownRef = useRef<HTMLDivElement>(null);

  // ── Inline edit ───────────────────────────────────────────────────────────
  const [activeInlineEdit, setActiveInlineEdit] = useState<'value' | 'closeDate' | 'owner' | null>(null);
  const [draftAmount, setDraftAmount] = useState<number>(0);
  const [draftCloseDate, setDraftCloseDate] = useState<string>('');
  const [draftOwner, setDraftOwner] = useState<string>('');
  const valueCardRef = useRef<HTMLDivElement>(null);
  const closeDateCardRef = useRef<HTMLDivElement>(null);
  const ownerInlineRef = useRef<HTMLDivElement>(null);

  // ── Stage pill popover ────────────────────────────────────────────────────
  const [pendingPill, setPendingPill] = useState<{ num: number; name: string; key: string } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Action bar "..." dropdown

  // Move-stage tooltip
  const [showStageTooltip, setShowStageTooltip] = useState(false);

  // Mobile bottom sheet
  const [showMobileSheet, setShowMobileSheet] = useState(false);

  // ── Click-outside handlers ─────────────────────────────────────────────────

  useEffect(() => {
    if (!showOwnerDropdown) return;
    const handler = (e: MouseEvent) => {
      if (ownerDropdownRef.current && !ownerDropdownRef.current.contains(e.target as Node)) {
        setShowOwnerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showOwnerDropdown]);

  // Escape cancels any active inline edit
  useEffect(() => {
    if (!activeInlineEdit) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setActiveInlineEdit(null); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [activeInlineEdit]);

  // Click outside the active card cancels inline edit
  useEffect(() => {
    if (!activeInlineEdit) return;
    const refMap: Record<string, React.RefObject<HTMLDivElement | null>> = {
      value: valueCardRef,
      closeDate: closeDateCardRef,
      owner: ownerInlineRef,
    };
    const activeRef = refMap[activeInlineEdit];
    const handler = (e: MouseEvent) => {
      if (activeRef?.current && !activeRef.current.contains(e.target as Node)) {
        setActiveInlineEdit(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [activeInlineEdit]);

  // Escape cancels pill popover
  useEffect(() => {
    if (!pendingPill) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setPendingPill(null); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [pendingPill]);

  // Click outside pill popover
  useEffect(() => {
    if (!pendingPill) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPendingPill(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pendingPill]);

  // ── Owner helpers ──────────────────────────────────────────────────────────

  const ownerName      = deal.owner || deal.ownerInfo?.name || '';
  const isUnassigned   = !ownerName;
  const isOOO          = deal.ownerInfo?.outOfOffice === true;
  const lastActiveAt   = deal.ownerInfo?.lastActiveAt;
  const lastActiveDays = lastActiveAt
    ? Math.floor((Date.now() - new Date(lastActiveAt).getTime()) / 86_400_000)
    : null;
  const lastActiveColor = lastActiveDays !== null
    ? (lastActiveDays > 7 ? 'text-red-600' : lastActiveDays > 3 ? 'text-amber-600' : 'text-gray-500')
    : '';
  const lastActiveText = lastActiveDays !== null
    ? (lastActiveDays === 0 ? 'Active today'
      : lastActiveDays === 1 ? 'Active yesterday'
      : `Last active ${lastActiveDays}d ago`)
    : '';

  function openOwnerDropdown() {
    if (ownersList.length === 0) {
      setIsLoadingOwners(true);
      getUsers()
        .then(users => setOwnersList(users))
        .catch(() => {})
        .finally(() => setIsLoadingOwners(false));
    }
    setShowOwnerDropdown(true);
  }

  // ── Inline edit helpers ────────────────────────────────────────────────────

  function displayDateToIso(display: string): string {
    const d = new Date(display);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  }

  function openValueEdit() {
    setDraftAmount(deal.amount);
    setActiveInlineEdit('value');
  }

  function openCloseDateEdit() {
    setDraftCloseDate(displayDateToIso(deal.closeDate));
    setActiveInlineEdit('closeDate');
  }

  function openOwnerEdit() {
    setDraftOwner(ownerName);
    if (ownersList.length === 0) {
      setIsLoadingOwners(true);
      getUsers().then(users => setOwnersList(users)).catch(() => {}).finally(() => setIsLoadingOwners(false));
    }
    setActiveInlineEdit('owner');
  }

  function commitValue() {
    if (draftAmount > 0) onSaveAmount?.(draftAmount);
    setActiveInlineEdit(null);
  }

  function commitCloseDate() {
    if (draftCloseDate) onSaveCloseDate?.(draftCloseDate);
    setActiveInlineEdit(null);
  }

  function commitOwner(name: string) {
    onAssignOwner?.(name);
    setActiveInlineEdit(null);
  }

  // ── Value history helpers ──────────────────────────────────────────────────

  const dealValueHistory = deal.dealValueHistory;
  const hasValueHistory  = (dealValueHistory?.length ?? 0) > 0;
  const originalValue    = hasValueHistory
    ? dealValueHistory![dealValueHistory!.length - 1].previousValue
    : deal.amount;
  const valueDelta       = deal.amount - originalValue;
  const valuePctChange   = originalValue !== 0
    ? Math.round((valueDelta / originalValue) * 100)
    : 0;
  const valueDeltaTooltip = hasValueHistory
    ? `Original: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: deal.currency || 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(originalValue)} · Current: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: deal.currency || 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(deal.amount)} · ${valuePctChange >= 0 ? '+' : ''}${valuePctChange}% from original`
    : '';

  function formatValueCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: deal.currency || 'USD',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount);
  }

  // ── AI health helpers ──────────────────────────────────────────────────────

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // ── Stage helpers ──────────────────────────────────────────────────────────

  const getStageEmoji = (stage: string) => {
    const emojiMap: Record<string, string> = {
      'prospecting': '🔍', 'qualified': '✅', 'proposal': '🟠',
      'negotiation': '🤝', 'closed-won': '🎉', 'closed-lost': '❌',
    };
    return emojiMap[stage.toLowerCase()] || '📊';
  };

  const hasNextStage   = deal.stageNumber < deal.totalStages;
  const nextStageNum   = deal.stageNumber + 1;
  const nextStageName  = hasNextStage ? ORDERED_STAGES[nextStageNum] ?? `Stage ${nextStageNum}` : null;

  // Maps banner CTA label → existing action handler
  function handleBannerCTA(label: string) {
    const l = label.toLowerCase();
    if (l.includes('email')) onEmail?.();
    else if (l.includes('call')) onCall?.();
    else if (l.includes('meeting') || l.includes('schedule')) onMeeting?.();
    else if (l.includes('proposal')) onProposal?.();
    else if (l.includes('stage')) onMoveStage?.();
  }

  // Mobile action list (used in bottom sheet)
  const mobileActions = [
    { icon: Mail,         label: 'Email',              kbd: 'E', color: 'text-blue-600',    onClick: onEmail },
    { icon: Phone,        label: 'Call',               kbd: 'C', color: 'text-green-600',   onClick: onCall },
    { icon: CalendarDays, label: 'Meeting',             kbd: 'M', color: 'text-gray-700',    onClick: onMeeting },
    { icon: FileText,     label: 'Proposal',            kbd: 'P', color: 'text-orange-600',  onClick: onProposal },
    { icon: TrendingUp,   label: 'Move to Next Stage',  kbd: 'S', color: 'text-emerald-600', onClick: hasNextStage ? onMoveStage : undefined },
    { icon: DollarSign,   label: 'Update Amount',       kbd: 'U', color: 'text-gray-600',    onClick: onUpdateAmount },
  ];

  // ── Revenue status line (shown below value in the Value tile) ────────────────

  const revenueStatusLine = revenueSchedule ? (() => {
    const hasOverdue = revenueSchedule.installments.some(i => i.status === 'overdue');
    if (hasOverdue) {
      return { text: 'Payments overdue', dotClass: 'bg-red-500', colorClass: 'text-red-700' };
    }
    if (revenueSchedule.type === 'upfront' && revenueSchedule.installments.length === 1) {
      return revenueSchedule.installments[0].status === 'paid'
        ? { text: 'Fully paid', dotClass: 'bg-green-500', colorClass: 'text-green-700' }
        : { text: 'One-time payment', dotClass: 'bg-gray-400', colorClass: 'text-gray-500' };
    }
    const paid = revenueSchedule.installments.filter(i => i.status === 'paid');
    const upcoming = revenueSchedule.installments.filter(i => i.status === 'upcoming');
    const paidAmt = paid.reduce((s, i) => s + i.amount, 0);
    const pct = revenueSchedule.totalValue > 0
      ? Math.round((paidAmt / revenueSchedule.totalValue) * 100)
      : 0;
    return {
      text: `${pct}% collected · ${upcoming.length} upcoming`,
      dotClass: 'bg-green-500',
      colorClass: 'text-green-700',
    };
  })() : null;

  // ── Velocity strip computations ───────────────────────────────────────────
  const VELOCITY_STAGE_AVG: Record<string, number> = {
    prospecting: 14, qualified: 10, proposal: 12, negotiation: 21,
  };
  const velocityStageKey = (deal.stage || '').toLowerCase();
  const velocityDaysInStage = timeInStage ?? 8;
  const resolvedAvgDays = avgStageDuration ?? VELOCITY_STAGE_AVG[velocityStageKey] ?? 12;
  const velocityPct = Math.round((velocityDaysInStage / resolvedAvgDays) * 100);
  const showVelocityStrip = !['closed-won', 'closed-lost'].includes(velocityStageKey) && velocityDaysInStage > 0;
  const velocityStatus =
    velocityPct <= 75
      ? { label: 'Moving Fast', icon: '⚡', textColor: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' }
      : velocityPct <= 100
      ? { label: 'On Track',    icon: '✓',  textColor: 'text-blue-700',  bg: 'bg-blue-50',  border: 'border-blue-200' }
      : velocityPct <= 140
      ? { label: 'Slowing',     icon: '⚠',  textColor: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' }
      : { label: 'Stalled',     icon: '●',  textColor: 'text-red-700',   bg: 'bg-red-50',   border: 'border-red-200' };

  // ── Weighted forecast card values ─────────────────────────────────────────
  const probability = deal.probability ?? 45;
  const dealAmount = deal.amount || 30000;
  const weightedValue = Math.round(dealAmount * (probability / 100));
  const weightedCardClass = deal.stage === 'closed-won'
    ? 'rounded-xl border p-4 min-w-0 bg-emerald-50 border-emerald-200'
    : 'rounded-xl border p-4 min-w-0 bg-violet-50 border-violet-100';

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white border-b border-gray-200 px-8 py-6">
      <div className="max-w-7xl mx-auto">

        {/* Header Row — items 1, 2, 3 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-4">
            {/* Item 2: stage-colored avatar (inline gradient avoids Tailwind JIT dynamic-class purge) */}
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg flex-shrink-0"
              style={{ background: STAGE_GRADIENT_CSS[deal.stage.toLowerCase()] || 'linear-gradient(to bottom right, #3B82F6, #2563EB)' }}
            >
              {deal.companyName.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {/* Item 1: title clamped + ID badge */}
                <h1 className="text-3xl font-bold text-gray-900 truncate max-w-[480px]">{deal.dealName}</h1>
                <span className="text-[0.7rem] bg-gray-100 text-gray-500 rounded px-2 py-0.5 font-medium shrink-0">#{deal.id}</span>
                {/* Edit pencil */}
                <button onClick={onEdit} className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors flex-shrink-0">
                  <Edit className="h-5 w-5 text-gray-600" />
                </button>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Building2 className="h-4 w-4" />
                <span>{deal.companyName}</span>
                <span className="text-gray-400">•</span>
                <span>Created {deal.createdDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics — flex so Value is wider (items 4, 5, 6) */}
        <div className="flex gap-6 mb-2">
          {/* Value tile — inline editable */}
          <div
            ref={valueCardRef}
            className="relative group bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200"
            style={{ flex: 1.2, borderLeft: '4px solid #3B82F6' }}
          >
            {activeInlineEdit !== 'value' && (
              <button
                type="button"
                onClick={openValueEdit}
                className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-blue-200"
                title="Edit value"
              >
                <Edit className="h-3.5 w-3.5 text-blue-500" />
              </button>
            )}
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm font-medium text-blue-700">Value</div>
              {valueDelta !== 0 && activeInlineEdit !== 'value' && (
                <div title={valueDeltaTooltip} className="cursor-help">
                  {valueDelta > 0
                    ? <TrendingUp className="h-4 w-4 text-green-500" />
                    : <TrendingDown className="h-4 w-4 text-red-500" />}
                </div>
              )}
            </div>
            {activeInlineEdit === 'value' ? (
              <>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={draftAmount}
                  onChange={e => setDraftAmount(Number(e.target.value))}
                  onKeyDown={e => { if (e.key === 'Enter') commitValue(); }}
                  autoFocus
                  className="w-full text-2xl font-bold text-blue-900 bg-white border border-blue-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 mb-2"
                />
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={commitValue}
                    className="flex-1 text-xs font-semibold bg-blue-600 text-white rounded-md py-1.5 hover:bg-blue-700 transition-colors"
                  >
                    ✓ Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveInlineEdit(null)}
                    className="flex-1 text-xs font-semibold bg-gray-100 text-gray-600 rounded-md py-1.5 hover:bg-gray-200 transition-colors"
                  >
                    ✗ Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div
                  className="text-4xl font-bold text-blue-900 cursor-pointer hover:opacity-75 transition-opacity"
                  onClick={openValueEdit}
                >
                  {formatCurrencyCompact(deal.amount, deal.currency || BASE_CURRENCY_CODE)}
                </div>
                {deal.currency && deal.currency !== BASE_CURRENCY_CODE && deal.amount > 0 && (
                  <div className="text-xs text-blue-600 mt-0.5 opacity-80">
                    ≈ {formatCurrencyCompact(
                        deal.base_amount_usd || convertToBaseCurrency(deal.amount, deal.currency),
                        BASE_CURRENCY_CODE
                      )} USD
                  </div>
                )}
                {revenueStatusLine && (
                  <button
                    type="button"
                    onClick={onViewRevenue}
                    className="mt-1 flex items-center gap-1.5 text-left hover:opacity-75 transition-opacity"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${revenueStatusLine.dotClass}`} />
                    <span className={`text-xs ${revenueStatusLine.colorClass}`}>{revenueStatusLine.text}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowValueHistory(v => !v)}
                  className="mt-2 flex items-center gap-0.5 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  {showValueHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  Value History
                </button>
              </>
            )}
          </div>

          {/* Stage tile — item 5: dot replaces emoji */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border border-orange-200" style={{ flex: 1 }}>
            <div className="text-sm font-medium text-orange-700 mb-1">Stage</div>
            <div className="flex items-center space-x-2">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: STAGE_DOT_HEX[deal.stage.toLowerCase()] || '#6B7280' }}
              />
              <span className="text-lg font-bold text-orange-900">{deal.stageName}</span>
            </div>
            <div className="text-xs text-orange-700 mt-1">Stage {deal.stageNumber} of {deal.totalStages}</div>
          </div>

          {/* Close date tile — inline editable */}
          <div
            ref={closeDateCardRef}
            className={`relative group rounded-xl p-5 border ${closeDateUrgencyClass(deal.closeDate)}`}
            style={{ flex: 1 }}
          >
            {activeInlineEdit !== 'closeDate' && (
              <button
                type="button"
                onClick={openCloseDateEdit}
                className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-black/10"
                title="Edit close date"
              >
                <Edit className="h-3.5 w-3.5 opacity-50" />
              </button>
            )}
            <div className="text-sm font-medium mb-1 opacity-70">Close Date</div>
            {activeInlineEdit === 'closeDate' ? (
              <>
                <input
                  type="date"
                  value={draftCloseDate}
                  onChange={e => setDraftCloseDate(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') commitCloseDate(); }}
                  autoFocus
                  className="w-full text-base font-bold bg-white border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 mb-2"
                />
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={commitCloseDate}
                    className="flex-1 text-xs font-semibold bg-blue-600 text-white rounded-md py-1.5 hover:bg-blue-700 transition-colors"
                  >
                    ✓ Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveInlineEdit(null)}
                    className="flex-1 text-xs font-semibold bg-gray-100 text-gray-600 rounded-md py-1.5 hover:bg-gray-200 transition-colors"
                  >
                    ✗ Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div
                  className="text-lg font-bold cursor-pointer hover:opacity-75 transition-opacity"
                  onClick={openCloseDateEdit}
                >
                  {deal.closeDate}
                </div>
                {(() => {
                  const closeDate = new Date(deal.closeDate || '');
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  closeDate.setHours(0, 0, 0, 0);
                  const daysAway = Math.floor((closeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  if (isNaN(daysAway)) return null;
                  const colorClass = daysAway < 0
                    ? 'text-red-700 font-bold'
                    : daysAway < 10
                    ? 'text-red-600 font-bold'
                    : daysAway < 30
                    ? 'text-amber-600 font-semibold'
                    : 'text-green-600 font-semibold';
                  const label = daysAway < 0
                    ? `${Math.abs(daysAway)} days overdue`
                    : `${daysAway} days away`;
                  return <span className={`text-sm mt-1 block ${colorClass}`}>{label}</span>;
                })()}
              </>
            )}
          </div>

          {/* Owner tile — inline editable */}
          <div
            ref={ownerInlineRef}
            className="relative group bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200"
            style={{ flex: 1 }}
          >
            {!isUnassigned && activeInlineEdit !== 'owner' && (
              <button
                type="button"
                onClick={openOwnerEdit}
                className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-purple-200"
                title="Change owner"
              >
                <Edit className="h-3.5 w-3.5 text-purple-500" />
              </button>
            )}
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-purple-700">Owner</div>
              {isOOO && activeInlineEdit !== 'owner' && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200 leading-tight">OOO</span>
              )}
            </div>
            {activeInlineEdit === 'owner' ? (
              <>
                {isLoadingOwners ? (
                  <div className="text-sm text-purple-400 italic py-2">Loading team members…</div>
                ) : (
                  <select
                    autoFocus
                    value={draftOwner}
                    onChange={e => setDraftOwner(e.target.value)}
                    className="w-full text-sm font-semibold text-purple-900 bg-white border border-purple-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-400 mb-2"
                  >
                    {ownersList.map((u: any) => {
                      const name = `${u.first_name} ${u.last_name}`;
                      return (
                        <option key={u.id} value={name}>
                          {name}{u.role ? ` (${u.role})` : ''}
                        </option>
                      );
                    })}
                  </select>
                )}
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => commitOwner(draftOwner)}
                    className="flex-1 text-xs font-semibold bg-purple-600 text-white rounded-md py-1.5 hover:bg-purple-700 transition-colors"
                  >
                    ✓ Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveInlineEdit(null)}
                    className="flex-1 text-xs font-semibold bg-gray-100 text-gray-600 rounded-md py-1.5 hover:bg-gray-200 transition-colors"
                  >
                    ✗ Cancel
                  </button>
                </div>
              </>
            ) : isUnassigned ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                  <span className="text-base font-semibold text-red-600">Unassigned</span>
                </div>
                {onAssignOwner && (
                  <button type="button" onClick={openOwnerDropdown} className="text-xs font-medium text-purple-700 hover:text-purple-900 underline underline-offset-2 transition-colors">
                    + Assign Owner
                  </button>
                )}
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => deal.ownerId && navigate(`/team/${deal.ownerId}`)}
                  className="text-lg font-bold text-purple-900 hover:underline text-left leading-tight"
                >
                  {ownerName}
                </button>
                {lastActiveDays !== null && (
                  <div className={`flex items-center gap-1 text-xs mt-1.5 ${lastActiveColor}`}>
                    {lastActiveDays > 7 && <AlertTriangle className="h-3 w-3 flex-shrink-0" />}
                    <span>{lastActiveText}</span>
                  </div>
                )}
              </div>
            )}
            {showOwnerDropdown && (
              <div ref={ownerDropdownRef} className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                {isLoadingOwners ? (
                  <div className="px-3 py-4 text-sm text-gray-500 text-center">Loading team members…</div>
                ) : ownersList.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-gray-500 text-center">No team members found</div>
                ) : (
                  <ul className="max-h-52 overflow-y-auto py-1">
                    {ownersList.map((u: any) => (
                      <li key={u.id}>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 transition-colors"
                          onClick={() => { const name = `${u.first_name} ${u.last_name}`; setShowOwnerDropdown(false); onAssignOwner?.(name); }}
                        >
                          <span className="font-medium">{u.first_name} {u.last_name}</span>
                          {u.role && <span className="text-gray-400 text-xs ml-1.5">({u.role})</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* 5th KPI Card: Weighted Forecast Value */}
          {deal.stage !== 'closed-lost' && (
            <div
              style={{ flex: 1 }}
              className={weightedCardClass}
              title={`Weighted forecast: ${probability}% win probability × ${formatCurrencyCompact(dealAmount)}`}
            >
              {deal.stage === 'closed-won' ? (
                <>
                  <div className="text-xs font-semibold text-emerald-500 uppercase tracking-wide mb-1">Final Value</div>
                  <div className="text-2xl font-bold text-emerald-700 mb-1 leading-none">{formatCurrencyCompact(dealAmount)}</div>
                  <div className="text-xs text-emerald-500 font-medium">🎉 Deal Won</div>
                </>
              ) : (
                <>
                  <div className="text-xs font-semibold text-violet-500 uppercase tracking-wide mb-1">Weighted Value</div>
                  <div className="text-2xl font-bold text-violet-700 mb-1 leading-none">{formatCurrencyCompact(weightedValue)}</div>
                  <div className="text-xs text-violet-400">{probability}% of {formatCurrencyCompact(dealAmount)}</div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Value History accordion */}
        {showValueHistory && (
          <div className="mb-3 bg-white border border-blue-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-blue-900">Value Change History</span>
              <button type="button" onClick={() => setShowValueHistory(false)} className="text-blue-400 hover:text-blue-600 text-xs">Close</button>
            </div>
            <div className="px-4 py-3 space-y-2 max-h-64 overflow-y-auto">
              {!hasValueHistory ? (
                <p className="text-sm text-gray-500 py-2">No changes — original value</p>
              ) : (
                dealValueHistory!.map((entry, idx) => (
                  <div key={idx} className="flex items-start gap-2 py-2 border-b border-gray-50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-900 font-medium">
                        {new Date(entry.changedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-sm text-gray-700 mx-1">:</span>
                      <span className="text-sm text-red-600 line-through">{formatValueCurrency(entry.previousValue)}</span>
                      <span className="text-sm text-gray-500 mx-1">→</span>
                      <span className="text-sm text-green-600 font-medium">{formatValueCurrency(entry.newValue)}</span>
                      <span className="text-sm text-gray-500 ml-2">· Changed by {entry.changedBy}</span>
                      {entry.reason && <span className="text-sm text-gray-500 ml-2">· Reason: {entry.reason}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Item 23: Stage pipeline strip */}
        <div className="mb-3 relative">
          <div className="flex items-center">
            {Object.entries(ORDERED_STAGES).map(([numStr, stageName], idx) => {
              const num = parseInt(numStr);
              const isCompleted = num < deal.stageNumber;
              const isCurrent = num === deal.stageNumber;
              const color = STAGE_HEX[num];
              return (
                <React.Fragment key={num}>
                  {idx > 0 && (
                    <div className={`flex-1 h-px ${isCompleted || isCurrent ? 'bg-gray-400' : 'bg-gray-200'}`} />
                  )}
                  <button
                    type="button"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap flex-shrink-0"
                    style={
                      isCurrent
                        ? { backgroundColor: color, color: '#fff', cursor: 'default' }
                        : isCompleted
                        ? { backgroundColor: '#9CA3AF', color: '#fff', cursor: 'pointer' }
                        : { backgroundColor: '#F3F4F6', color: '#9CA3AF', border: '1px solid #E5E7EB', cursor: 'pointer' }
                    }
                    onMouseEnter={isCurrent ? undefined : (e) => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(0.88)'; }}
                    onMouseLeave={isCurrent ? undefined : (e) => { (e.currentTarget as HTMLButtonElement).style.filter = ''; }}
                    onClick={() => {
                      if (isCurrent) return;
                      if (num === 5) { onMoreAction('mark-won'); return; }
                      if (num === 6) { onMoreAction('mark-lost'); return; }
                      setPendingPill({ num, name: stageName, key: STAGE_KEY_MAP[num] });
                    }}
                  >
                    {isCompleted && <span className="text-[10px]">✓</span>}
                    {stageName}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          {/* Inline stage-change popover */}
          {pendingPill && (
            <div
              ref={popoverRef}
              className="absolute top-full left-0 mt-1.5 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-4 min-w-[240px] max-w-[320px]"
            >
              <div className="text-sm font-semibold text-gray-900 mb-1">
                Move to {pendingPill.name}?
              </div>
              {(() => {
                const isBackward = pendingPill.num < deal.stageNumber;
                const skipCount = Math.abs(pendingPill.num - deal.stageNumber) - 1;
                return (
                  <>
                    {!isBackward && skipCount > 0 && (
                      <div className="text-xs text-amber-600 mb-1">
                        This will skip {skipCount} stage{skipCount > 1 ? 's' : ''}
                      </div>
                    )}
                    {isBackward && (
                      <div className="text-xs text-amber-600 mb-1">
                        ⚠️ Moving backwards — are you sure?
                      </div>
                    )}
                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => {
                          onStageSelect?.(pendingPill.num, pendingPill.name, pendingPill.key);
                          setPendingPill(null);
                        }}
                        className={`flex-1 text-xs font-semibold rounded-lg py-1.5 text-white transition-colors ${
                          isBackward ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingPill(null)}
                        className="flex-1 text-xs font-semibold bg-gray-100 text-gray-600 rounded-lg py-1.5 hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* Stage Velocity strip */}
        {showVelocityStrip && (
          <div className={`flex items-center gap-3 px-4 py-2 rounded-lg border text-xs my-2 ${velocityStatus.bg} ${velocityStatus.border}`}>
            <span className="font-semibold text-gray-500 flex-shrink-0">Stage Velocity</span>
            <span className={`font-bold flex-shrink-0 ${velocityStatus.textColor}`}>
              {velocityStatus.icon} {velocityStatus.label}
            </span>
            <span className="text-gray-500">
              {velocityDaysInStage}d in {deal.stageName || deal.stage}
              &nbsp;·&nbsp;avg {resolvedAvgDays}d
            </span>
            {velocityPct > 100 ? (
              <span className={`ml-auto font-semibold flex-shrink-0 ${velocityStatus.textColor}`}>
                +{velocityDaysInStage - resolvedAvgDays}d over avg
              </span>
            ) : (
              <span className="ml-auto text-gray-400 flex-shrink-0">
                {resolvedAvgDays - velocityDaysInStage}d to avg
              </span>
            )}
          </div>
        )}

        {/* ── 4-column context strip: Account | Contact | Source | Last Contact ── */}
        <div className="flex items-start gap-0 border-t border-b border-gray-100 py-2.5 px-1 my-2">

          {/* Account */}
          <div className="flex flex-col min-w-0 flex-1 px-3 border-r border-gray-200">
            <span className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5">Account</span>
            <span className="text-sm font-semibold text-blue-600 truncate hover:underline cursor-pointer">
              {deal.accountName || '—'}
            </span>
          </div>

          {/* Contact */}
          <div className="flex flex-col min-w-0 flex-1 px-3 border-r border-gray-200">
            <span className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5">Contact</span>
            <span className="text-sm font-semibold text-gray-800 truncate">
              {deal.contactName || '—'}
            </span>
            {deal.contactTitle && (
              <span className="text-xs text-gray-400 truncate capitalize">{deal.contactTitle}</span>
            )}
          </div>

          {/* Source */}
          <div className="flex flex-col min-w-0 flex-1 px-3 border-r border-gray-200">
            <span className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5">Source</span>
            <span className="text-sm font-semibold text-gray-800 capitalize truncate">
              {deal.source || '—'}
            </span>
          </div>

          {/* Last Contact */}
          <div className="flex flex-col min-w-0 flex-1 px-3">
            <span className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5">Last Contact</span>
            {(() => {
              const days = daysSinceContact;
              if (days === null || days === undefined) {
                return <span className="text-sm text-gray-400">No contact yet</span>;
              }
              const label = days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days}d ago`;
              const colorClass = days <= 3
                ? 'text-green-600'
                : days <= 7
                ? 'text-amber-600 font-semibold'
                : 'text-red-600 font-bold';
              return <span className={`text-sm ${colorClass}`}>{label}</span>;
            })()}
          </div>

        </div>

        {/* AI Health Score — items 8, 9, 10 */}
        <div
          className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200 mb-4 cursor-pointer select-none"
          onClick={() => setShowHealthFactors(v => !v)}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-semibold text-purple-900">AI Health Score</span>
            </div>
            <div className="flex items-center gap-3">
              {momentumResult && <DealMomentum result={momentumResult} />}
              {/* Item 9: pulse when score ≥ 85 */}
              <div
                className={`text-3xl font-bold ${getHealthColor(deal.aiScore)} ${deal.aiScore >= 85 ? 'animate-[pulse_2s_ease-in-out_infinite]' : ''}`}
              >
                {deal.aiScore}/100
              </div>
            </div>
          </div>
          {/* Item 8: gradient bar clipped by fill width */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2.5 rounded-full overflow-hidden relative bg-gray-200">
              <div
                className="absolute inset-0 rounded-full"
                style={{ background: 'linear-gradient(to right, #EF4444 0%, #EF4444 40%, #F59E0B 40%, #F59E0B 70%, #22C55E 70%, #22C55E 100%)' }}
              />
              <div
                className="absolute inset-0 bg-gray-200 origin-right"
                style={{ transform: `scaleX(${1 - healthBarWidth / 100})`, transition: 'transform 0.8s ease-in-out', transformOrigin: 'right center' }}
              />
            </div>
            <span className="text-[11px] font-medium text-gray-600 whitespace-nowrap flex-shrink-0">{deal.aiHealth}</span>
          </div>
          {/* Item 10: inline factors panel */}
          {showHealthFactors && healthScoreFactors && healthScoreFactors.length > 0 && (
            <div className="mt-3 pt-3 border-t border-purple-200 grid grid-cols-2 gap-2">
              {healthScoreFactors.slice(0, 3).map((f, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white rounded-lg px-2.5 py-1.5">
                  <span className="text-[11px] text-gray-600">{f.category}</span>
                  <span className={`text-[11px] font-bold ${getHealthColor(f.score)}`}>{f.score}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Today's Priority Action banner — items 11, 12, 13 ── */}
        {priorityAction && !bannerDismissed && (
          <div
            className="mb-4 bg-white rounded-lg shadow-sm overflow-hidden"
            style={{
              border: '1px solid #E5E7EB',
              borderLeftWidth: '4px',
              borderLeftStyle: 'solid',
              borderLeftColor: daysSinceContact >= 7 ? '#EF4444' : '#F59E0B',
            }}
          >
            <div className="flex items-center gap-3 px-4 py-3">
              {/* Icon */}
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-base flex-shrink-0">
                🎯
              </div>

              {/* Title + reason */}
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-gray-900">{priorityAction.title}</span>
                <span className="text-gray-400 mx-1.5">·</span>
                <span className="text-sm text-gray-600 truncate">{priorityAction.reason}</span>
              </div>

              {/* Item 12: solid filled amber CTA buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {priorityAction.ctas.slice(0, 2).map(cta => (
                  <button
                    key={cta}
                    onClick={() => handleBannerCTA(cta)}
                    className="px-3 py-1.5 text-xs font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors whitespace-nowrap"
                  >
                    {cta}
                  </button>
                ))}
              </div>

              {/* Dismiss */}
              <button
                onClick={() => setBannerDismissed(true)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors flex-shrink-0"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Item 13: "X Pending Actions →" with red dot */}
            <div className="px-4 pb-2.5 flex justify-end">
              <button
                onClick={onViewAllActions}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                {priorityAction.totalCount} Pending Actions →
                <span className="w-2 h-2 bg-red-500 rounded-full inline-block flex-shrink-0" />
              </button>
            </div>
          </div>
        )}

        {/* ── Unified Action Toolbar ── */}
        <div className="-mx-8 -mb-6 mt-4">

          {/* Desktop: single unified row */}
          <div className="hidden md:flex items-center gap-1 px-6 py-2 border-t border-gray-200 overflow-hidden">

            {/* ── Communication group ── */}
            <button title="Email (E)" onClick={onEmail} className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors whitespace-nowrap flex-shrink-0">
              <Mail className="h-3.5 w-3.5" />
              Email
              <KbdBadge char="E" />
            </button>
            <button title="Call (C)" onClick={onCall} className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium bg-green-600 hover:bg-green-700 text-white transition-colors whitespace-nowrap flex-shrink-0">
              <Phone className="h-3.5 w-3.5" />
              Call
              <KbdBadge char="C" />
            </button>
            <button title="Meeting (M)" onClick={onMeeting} className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium bg-gray-800 hover:bg-gray-900 text-white transition-colors whitespace-nowrap flex-shrink-0">
              <CalendarDays className="h-3.5 w-3.5" />
              Meeting
              <KbdBadge char="M" />
            </button>
            <button title="Proposal (P)" onClick={onProposal} className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium bg-orange-500 hover:bg-orange-600 text-white transition-colors whitespace-nowrap flex-shrink-0">
              <FileText className="h-3.5 w-3.5" />
              Proposal
              <KbdBadge char="P" />
            </button>
            <button title="Note (N)" onClick={() => onMoreAction('add-note')} className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium bg-yellow-500 hover:bg-yellow-600 text-white transition-colors whitespace-nowrap flex-shrink-0">
              <StickyNote className="h-3.5 w-3.5" />
              Note
              <KbdBadge char="N" />
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-300 mx-1 flex-shrink-0" />

            {/* ── Pipeline group ── */}
            <div
              className="relative flex-shrink-0"
              onMouseEnter={() => setShowStageTooltip(true)}
              onMouseLeave={() => setShowStageTooltip(false)}
            >
              <button
                title="Next Stage (S)"
                onClick={hasNextStage ? onMoveStage : undefined}
                disabled={!hasNextStage}
                className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors whitespace-nowrap"
              >
                <ArrowRight className="h-3.5 w-3.5" />
                Next Stage
                <KbdBadge char="S" />
              </button>
              {showStageTooltip && nextStageName && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-50 shadow-xl pointer-events-none">
                  Move to: <span className="font-semibold">{nextStageName}</span>
                  <span className="text-gray-300"> (Stage {nextStageNum} of {deal.totalStages})</span>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-gray-900" />
                </div>
              )}
            </div>
            <button title="Update Amount (U)" onClick={onUpdateAmount} className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium bg-gray-700 hover:bg-gray-800 text-white transition-colors whitespace-nowrap flex-shrink-0">
              <DollarSign className="h-3.5 w-3.5" />
              Amount
              <KbdBadge char="U" />
            </button>

          </div>

        </div>

        {/* ── Mobile action row ── */}
        <div className="flex md:hidden items-center gap-2 mt-4">
          <button
            onClick={onEmail}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm"
          >
            <Mail className="h-4 w-4" />
            Follow Up
          </button>
          <button
            onClick={() => setShowMobileSheet(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-700 text-white rounded-lg font-medium text-sm"
          >
            <MoreHorizontal className="h-4 w-4" />
            More Actions
          </button>
        </div>

      </div>

      {/* ── MOBILE bottom sheet ──────────────────────────────────────────────── */}
      <div className={`fixed inset-0 z-50 md:hidden ${showMobileSheet ? '' : 'pointer-events-none'}`}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black transition-opacity duration-300 ${showMobileSheet ? 'opacity-40' : 'opacity-0'}`}
          onClick={() => setShowMobileSheet(false)}
        />
        {/* Sheet */}
        <div className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ${showMobileSheet ? 'translate-y-0' : 'translate-y-full'}`}>
          {/* Drag handle */}
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-1" />
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <span className="text-base font-semibold text-gray-900">Actions</span>
            <button onClick={() => setShowMobileSheet(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
              <X className="h-5 w-5" />
            </button>
          </div>
          {/* Actions */}
          <div className="px-3 py-2 pb-8">
            {mobileActions.map((action) => {
              const Icon = action.icon;
              const disabled = action.onClick === undefined;
              return (
                <button
                  key={action.label}
                  disabled={disabled}
                  onClick={() => { action.onClick?.(); setShowMobileSheet(false); }}
                  className="w-full flex items-center gap-3.5 px-3 py-3.5 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <div className={`w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 ${action.color}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-sm font-medium text-gray-800 flex-1 text-left">{action.label}</span>
                  <kbd className="text-[10px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">
                    {action.kbd}
                  </kbd>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
