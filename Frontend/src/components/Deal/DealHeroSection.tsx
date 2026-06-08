import React, { useState, useEffect, useRef } from 'react';
import {
  Edit, MoreVertical, Building2, User, Target, Sparkles,
  Mail, Phone, CalendarDays, FileText, TrendingUp, TrendingDown,
  ChevronDown, ChevronUp, DollarSign, AlertTriangle,
  Copy, GitMerge, Archive, FileDown, Share2, MoreHorizontal, Keyboard, X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MoreOptionsDropdown } from './DealModals';
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

// Action bar "..." items
const ACTION_BAR_MORE_ITEMS = [
  { id: 'clone',      icon: Copy,     label: 'Clone Deal'      },
  { id: 'merge',      icon: GitMerge, label: 'Merge Deal'      },
  { id: 'archive',    icon: Archive,  label: 'Archive Deal'    },
  { id: 'export-pdf', icon: FileDown, label: 'Export PDF'      },
  { id: 'share',      icon: Share2,   label: 'Share Deal Link' },
];

// ── Keyboard shortcut badge ───────────────────────────────────────────────────

function KbdBadge({ char }: { char: string }) {
  return (
    <kbd className="ml-1.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold bg-black/20 border border-white/25 rounded text-white leading-none tracking-wide">
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
  onShowShortcuts?: () => void;
  momentumResult?: MomentumResult;
  revenueSchedule?: RevenueSchedule | null;
  onViewRevenue?: () => void;
  priorityAction?: PriorityAction | null;
  onViewAllActions?: () => void;
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
  onShowShortcuts,
  momentumResult,
  revenueSchedule,
  onViewRevenue,
  priorityAction,
  onViewAllActions,
}) => {
  const navigate = useNavigate();

  // Priority action banner dismiss (session only)
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Header more-options
  const [showMoreActions, setShowMoreActions] = useState(false);

  // Owner tile
  const [showOwnerDropdown, setShowOwnerDropdown]   = useState(false);
  const [showValueHistory, setShowValueHistory]       = useState(false);
  const [ownersList, setOwnersList]                   = useState<any[]>([]);
  const [isLoadingOwners, setIsLoadingOwners]         = useState(false);
  const ownerDropdownRef = useRef<HTMLDivElement>(null);

  // Action bar "..." dropdown
  const [showActionBarMore, setShowActionBarMore] = useState(false);
  const actionBarMoreRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!showActionBarMore) return;
    const handler = (e: MouseEvent) => {
      if (actionBarMoreRef.current && !actionBarMoreRef.current.contains(e.target as Node)) {
        setShowActionBarMore(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showActionBarMore]);

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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white border-b border-gray-200 px-8 py-6">
      <div className="max-w-7xl mx-auto">

        {/* Header Row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {deal.companyName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{deal.dealName}</h1>
                <button onClick={onEdit} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Edit className="h-5 w-5 text-gray-600" />
                </button>
                <div className="relative">
                  <button onClick={() => setShowMoreActions(!showMoreActions)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical className="h-5 w-5 text-gray-600" />
                  </button>
                  <MoreOptionsDropdown
                    isOpen={showMoreActions}
                    onClose={() => setShowMoreActions(false)}
                    onAction={(action) => { onMoreAction(action); setShowMoreActions(false); }}
                  />
                </div>
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

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-4 gap-6 mb-2">
          {/* Value tile */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm font-medium text-blue-700">Value</div>
              {valueDelta !== 0 && (
                <div title={valueDeltaTooltip} className="cursor-help">
                  {valueDelta > 0
                    ? <TrendingUp className="h-4 w-4 text-green-500" />
                    : <TrendingDown className="h-4 w-4 text-red-500" />}
                </div>
              )}
            </div>
            <div className="text-3xl font-bold text-blue-900">
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
          </div>

          {/* Stage tile */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border border-orange-200">
            <div className="text-sm font-medium text-orange-700 mb-1">Stage</div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{getStageEmoji(deal.stage)}</span>
              <span className="text-lg font-bold text-orange-900">{deal.stageName}</span>
            </div>
            <div className="text-xs text-orange-700 mt-1">Stage {deal.stageNumber} of {deal.totalStages}</div>
          </div>

          {/* Close date tile */}
          <div className={`rounded-xl p-5 border ${closeDateUrgencyClass(deal.closeDate)}`}>
            <div className="text-sm font-medium mb-1 opacity-70">Close Date</div>
            <div className="text-lg font-bold">{deal.closeDate}</div>
            <div className="text-xs mt-1 opacity-80">{daysFromNowLabel(deal.closeDate)}</div>
          </div>

          {/* Owner tile */}
          <div className="relative bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-purple-700">Owner</div>
              {isOOO && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200 leading-tight">OOO</span>
              )}
            </div>
            {isUnassigned ? (
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

        {/* Account & Contact Info */}
        <div className="grid grid-cols-3 gap-4 mb-3">
          <div className="flex items-center space-x-3 py-2.5 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => navigate(`/accounts/${deal.id}`)}>
            <Building2 className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <div>
              <div className="text-[11px] font-medium text-gray-500">Account</div>
              <div className="text-sm font-semibold text-gray-900">{deal.accountName}</div>
              <div className="text-[11px] text-gray-400">{deal.accountSize}, {deal.accountIndustry}</div>
            </div>
          </div>
          <div className="flex items-center space-x-3 py-2.5 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => navigate(`/crm/contacts/${deal.id}`)}>
            <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <div>
              <div className="text-[11px] font-medium text-gray-500">Contact</div>
              <div className="text-sm font-semibold text-gray-900">{deal.contactName}</div>
              <div className="text-[11px] text-gray-400">{deal.contactTitle}</div>
            </div>
          </div>
          <div className="flex items-center space-x-3 py-2.5 px-4 bg-gray-50 rounded-lg">
            <Target className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <div>
              <div className="text-[11px] font-medium text-gray-500">Source</div>
              <div className="text-sm font-semibold text-gray-900">{deal.source}</div>
              <div className="text-[11px] text-gray-400">Lead Gen → Lead → Deal</div>
            </div>
          </div>
        </div>

        {/* AI Health Score */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-semibold text-purple-900">AI Health Score</span>
            </div>
            <div className="flex items-center gap-3">
              {momentumResult && <DealMomentum result={momentumResult} />}
              <div className={`text-3xl font-bold ${getHealthColor(deal.aiScore)}`}>{deal.aiScore}/100</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-200 rounded-full h-2.5">
              <div className={`h-2.5 rounded-full transition-all duration-300 ${getHealthBarColor(deal.aiScore)}`} style={{ width: `${deal.aiScore}%` }} />
            </div>
            <span className="text-[11px] font-medium text-gray-600 whitespace-nowrap flex-shrink-0">{deal.aiHealth}</span>
          </div>
        </div>

        {/* ── Today's Priority Action banner ── */}
        {priorityAction && !bannerDismissed && (
          <div
            className="mb-4 bg-amber-50 rounded-lg border border-amber-200 shadow-sm overflow-hidden"
            style={{ borderLeftWidth: 3, borderLeftColor: priorityAction.priority === 'high' ? '#F59E0B' : '#EAB308' }}
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

              {/* CTA buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {priorityAction.ctas.slice(0, 2).map(cta => (
                  <button
                    key={cta}
                    onClick={() => handleBannerCTA(cta)}
                    className="px-3 py-1.5 text-xs font-medium bg-white text-amber-800 border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors whitespace-nowrap"
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

            {/* View all link */}
            <div className="px-4 pb-2.5 flex justify-end">
              <button
                onClick={onViewAllActions}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                View all {priorityAction.totalCount} actions ↓
              </button>
            </div>
          </div>
        )}

        {/* ── DESKTOP action bar (hidden on mobile) ── */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Email */}
          <button onClick={onEmail} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
            <Mail className="h-4 w-4" />
            Email
            <KbdBadge char="E" />
          </button>

          {/* Call */}
          <button onClick={onCall} className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm">
            <Phone className="h-4 w-4" />
            Call
            <KbdBadge char="C" />
          </button>

          {/* Meeting */}
          <button onClick={onMeeting} className="flex items-center gap-2 px-4 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm">
            <CalendarDays className="h-4 w-4" />
            Meeting
            <KbdBadge char="M" />
          </button>

          {/* Proposal */}
          <button onClick={onProposal} className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm">
            <FileText className="h-4 w-4" />
            Proposal
            <KbdBadge char="P" />
          </button>

          <div className="flex-1" />

          {/* Move to Next Stage — with tooltip */}
          <div
            className="relative"
            onMouseEnter={() => setShowStageTooltip(true)}
            onMouseLeave={() => setShowStageTooltip(false)}
          >
            <button
              onClick={hasNextStage ? onMoveStage : undefined}
              disabled={!hasNextStage}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium text-sm"
            >
              <TrendingUp className="h-4 w-4" />
              Move to Next Stage
              <KbdBadge char="S" />
            </button>
            {showStageTooltip && nextStageName && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-50 shadow-xl pointer-events-none">
                Move to: <span className="font-semibold">{nextStageName}</span>
                <span className="text-gray-300"> (Stage {nextStageNum} of {deal.totalStages})</span>
                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-gray-900" />
              </div>
            )}
          </div>

          {/* Update Amount */}
          <button onClick={onUpdateAmount} className="flex items-center gap-2 px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm">
            <DollarSign className="h-4 w-4" />
            Update Amount
            <KbdBadge char="U" />
          </button>

          {/* "..." action bar menu */}
          <div className="relative" ref={actionBarMoreRef}>
            <button
              onClick={() => setShowActionBarMore(v => !v)}
              className="p-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              title="More actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {showActionBarMore && (
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden py-1">
                {ACTION_BAR_MORE_ITEMS.map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { onMoreAction(item.id); setShowActionBarMore(false); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                    >
                      <Icon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ⌨ Shortcuts hint */}
          <button
            onClick={onShowShortcuts}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors px-1"
          >
            <Keyboard className="h-3.5 w-3.5" />
            Shortcuts
          </button>
        </div>

        {/* ── MOBILE action row (visible only on mobile) ── */}
        <div className="flex md:hidden items-center gap-2">
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
