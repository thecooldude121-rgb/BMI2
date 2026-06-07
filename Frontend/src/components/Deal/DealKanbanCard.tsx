/**
 * DealKanbanCard — reusable Kanban deal card.
 *
 * Visual state is driven entirely by resolveDealState() from dealState.ts.
 * No ad-hoc color logic lives here — the card is a pure renderer.
 *
 * Card anatomy (standard mode, 4 zones):
 *
 *   ┌─ 3px state border ──────────────────────────────────┐
 *   │ ZONE 1 — Identity                                   │
 *   │  Deal Name (13px/600)            [HRMS]             │
 *   │  Company Name (11px/gray-500)                       │
 *   ├─────────────────────────────────────────────────────┤
 *   │ ZONE 2 — Value signal (single scan line)            │
 *   │  ◆ $50,000                   ● Jun 15, 2026         │
 *   ├─────────────────────────────────────────────────────┤
 *   │ ZONE 3 — State chip                                 │
 *   │  [● Stalled · 8d]                    Today          │
 *   ├─────────────────────────────────────────────────────┤
 *   │ ZONE 4 — Metadata                                   │
 *   │  [JS] John Smith          ░░████ 78                 │
 *   └─────────────────────────────────────────────────────┘
 *     [✉][⏱][✎][⋯]  ← hover-reveal quick actions
 *
 * Compact mode collapses to 3 rows:
 *   [Name                    $50,000]
 *   [Company  ·  ● Jun 15          ]
 *   [● Stalled · 8d               ]
 */

import React, { useState } from 'react';
import {
  Building2, Sparkles,
  CheckCircle2, AlertTriangle, XCircle,
  Mail, Activity, Edit2, MoreHorizontal,
  Diamond, ArrowRight, Clock,
} from 'lucide-react';
import {
  formatCloseDate,
  formatRelativeTime,
  daysFromNow,
} from '../../utils/dateUtils';
import {
  resolveDealState,
  STATE_TOKENS,
} from '../../utils/dealState';
import { explainDealHealth } from '../../utils/dealHealthDrivers';
import type { StakeholderContact } from '../../config/contactRoles';
import CommitteeCoverageBar from './CommitteeCoverageBar';
import { formatCurrencyCompact, convertToBaseCurrency, BASE_CURRENCY_CODE } from '../../utils/currencyUtils';

// ── Type definitions ──────────────────────────────────────────────────────────

export interface DealCard {
  id: string;
  companyName: string;
  dealName: string;
  accountName: string;
  amount: number;
  currency?: string;
  baseAmountUsd?: number;
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
  nextStep?: string;
  nextStepDueDate?: string;
  nextStepOwner?: string;
  nextStepStatus?: 'pending' | 'done' | 'overdue';
  /** Total contacts on this deal (primary + stakeholders). Drives single-thread signal. */
  contactCount?: number;
  /** Number of named competitors. Drives competitor-in-play signal. */
  competitorCount?: number;
  /** Full stakeholder list — drives the committee coverage bar and health drivers. */
  stakeholders?: StakeholderContact[];
  createdAt?: string;
  /** True when the deal has a real company_name in the database (not a name fallback). */
  hasAccount?: boolean;
}

export interface DealKanbanCardProps {
  deal: DealCard;
  stageId: string;
  /** 'standard' shows all 4 zones; 'compact' collapses to 3 rows */
  density: 'standard' | 'compact';
  isHighlighted: boolean;
  isDragging: boolean;
  showScoreTooltip: boolean;
  /** When true the card renders in manager inspection mode. */
  inspectionMode?: boolean;
  /** Badge descriptor from getInspectionBadge(). Null = clean deal (dimmed in inspection mode). */
  inspectionBadge?: { label: string; style: string; title: string } | null;
  onCardClick: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onHRMSClick: (e: React.MouseEvent, deal: DealCard) => void;
  onScoreClick: (e: React.MouseEvent, id: string) => void;
  onContactClick: (e: React.MouseEvent, id: string) => void;
  onStatusClick: (e: React.MouseEvent, deal: DealCard) => void;
  onQuickEdit: (e: React.MouseEvent, id: string) => void;
  onQuickEmail: (e: React.MouseEvent, id: string) => void;
  onQuickActivity: (e: React.MouseEvent, id: string) => void;
  formatCurrency: (amount: number) => string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** "John Smith" → "JS". Falls back to "?" if name is absent. */
function getInitials(name?: string): string {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Close date dot color — three-level urgency.
 * Encodes date risk as a 2×2px visual, no text required.
 *   red    → overdue
 *   amber  → closing within 7 days
 *   green  → comfortably in the future
 *   gray   → no date set
 */
function closeDateDotClass(daysLeft: number | null): string {
  if (daysLeft === null) return 'bg-gray-300';
  if (daysLeft < 0)     return 'bg-red-500';
  if (daysLeft <= 7)    return 'bg-amber-500';
  return 'bg-emerald-500';
}

/**
 * Close date text colour — matches dot urgency for consistent reading.
 */
function closeDateTextClass(daysLeft: number | null): string {
  if (daysLeft === null) return 'text-gray-400';
  if (daysLeft < 0)     return 'text-red-600 font-medium';
  if (daysLeft <= 7)    return 'text-amber-600 font-medium';
  return 'text-gray-600';
}

/** AI score bar fill colour — three-tier aligned with global thresholds (70/40). */
function aiBarColor(score: number): string {
  if (score >= 70) return '#10b981'; // emerald-500 — Healthy
  if (score >= 40) return '#f59e0b'; // amber-500 — Watch
  return '#ef4444';                  // red-500 — At Risk
}

// ── Component ─────────────────────────────────────────────────────────────────

const DealKanbanCard: React.FC<DealKanbanCardProps> = ({
  deal,
  stageId,
  density,
  isHighlighted,
  isDragging,
  showScoreTooltip,
  inspectionMode = false,
  inspectionBadge = null,
  onCardClick,
  onContextMenu,
  onHRMSClick,
  onScoreClick,
  onContactClick,
  onStatusClick,
  onQuickEdit,
  onQuickEmail,
  onQuickActivity,
  formatCurrency,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const isClosed      = ['closed-won', 'closed-lost'].includes(stageId);
  const closeDaysLeft = daysFromNow(deal.closeDate);

  // TODO: activate from API once revenueSchedule is a persisted DB field
  const paymentIndicator = (deal.id === 'D036' || deal.id === 'D029')
    ? { hasOverdue: deal.id === 'D029' }
    : null;

  // ── Resolve the canonical deal state ──────────────────────────────────────
  const state  = resolveDealState(deal, closeDaysLeft, isClosed);
  const tokens = STATE_TOKENS[state.primary];

  // ── Health explanation — computed once, used in score button + popover ────
  const healthExpl = isClosed ? null : explainDealHealth(deal, closeDaysLeft);

  // ── Card border style ──────────────────────────────────────────────────────
  // Override border completely when dragging or highlighted to avoid competing
  // with the priority state color.
  const borderColor = isDragging
    ? '#6366f1'                                          // indigo — drag feedback
    : isHighlighted
    ? '#dc2626'                                          // red — AI/search highlight
    : tokens.borderColor;

  const borderStyle = `${isDragging || isHighlighted ? '2px' : '1px'} solid #e5e7eb`;

  const isCompact = density === 'compact';

  // ─────────────────────────────────────────────────────────────────────────
  // COMPACT MODE — 3 rows, no metadata zone.
  // Name + value on row 1, company + date on row 2, state chip on row 3.
  // Background tint still applied for 'overdue' and 'stalled' even in compact.
  // ─────────────────────────────────────────────────────────────────────────
  if (isCompact) {
    return (
      <div
        onClick={() => onCardClick(deal.id)}
        onContextMenu={(e) => onContextMenu(e, deal.id)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`rounded-lg cursor-pointer transition-all duration-150 ${tokens.cardTint || 'bg-white'} ${
          isDragging ? 'shadow-xl scale-105' : 'shadow-sm hover:shadow-md hover:-translate-y-px'
        }`}
        style={{
          border: borderStyle,
          borderLeft: `3px solid ${borderColor}`,
          padding: '9px 12px',
          opacity: isDragging ? 0.92 : inspectionMode && !inspectionBadge ? 0.3 : 1,
        }}
        aria-label={`Deal: ${deal.dealName}, ${formatCurrencyCompact(deal.amount, deal.currency || BASE_CURRENCY_CODE)}, ${state.description}`}
        title={state.description}
      >
        {/* Row A: Deal name (left) + value (right) — two most critical fields at a glance */}
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <span className="text-[14px] font-semibold text-gray-900 leading-snug line-clamp-1 flex-1">
            {deal.dealName}
          </span>
          <div className="flex flex-col items-end flex-shrink-0">
            <span className="flex items-center space-x-0.5 text-[13px] font-bold text-indigo-600 whitespace-nowrap">
              {state.isHighValue && (
                <span className="text-amber-500 text-[10px] mr-0.5" title="High-value deal">◆</span>
              )}
              {formatCurrencyCompact(deal.amount, deal.currency || BASE_CURRENCY_CODE)}
            </span>
            {deal.currency && deal.currency !== BASE_CURRENCY_CODE && deal.amount > 0 && (
              <span className="text-[10px] text-gray-400 leading-none mt-0.5">
                ≈ {formatCurrencyCompact(deal.baseAmountUsd || convertToBaseCurrency(deal.amount, deal.currency), BASE_CURRENCY_CODE)} USD
              </span>
            )}
          </div>
        </div>

        {/* Row B: Company + urgency dot + date */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-gray-600 truncate mr-2">{deal.companyName || '—'}</span>
          {deal.closeDate ? (
            <div className="flex items-center space-x-1 flex-shrink-0">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${closeDateDotClass(closeDaysLeft)}`} />
              <span className={`text-[12px] ${closeDateTextClass(closeDaysLeft)}`}>
                {formatCloseDate(deal.closeDate)}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-gray-400">No close date</span>
          )}
        </div>

        {/* Row C: State chip — only rendered when there is an active signal */}
        <div className="flex items-center gap-1.5 mt-1">
          {state.chipLabel && (
            <span
              className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium flex-shrink-0 ${tokens.chipBg} ${tokens.chipText}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tokens.chipDot}`} />
              <span>{state.chipLabel}</span>
            </span>
          )}
          {inspectionMode && inspectionBadge ? (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ml-auto ${inspectionBadge.style}`}
              title={inspectionBadge.title}
            >
              {inspectionBadge.label}
            </span>
          ) : deal.isHRMS ? (
            <button
              onClick={(e) => { e.stopPropagation(); onHRMSClick(e, deal); }}
              className="text-[10px] px-1.5 py-0.5 rounded font-medium transition-opacity hover:opacity-80 ml-auto"
              style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b', color: '#92400e' }}
              title="HRMS-connected deal"
            >
              HRMS
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STANDARD MODE — 4 zones with hover quick-action strip.
  //
  // Zone 1: Identity (deal name, company, HRMS badge)
  // Zone 2: Value signal (amount + close date on one scan line)
  // Zone 3: State chip + last-activity time
  // Zone 4: Metadata (owner avatar + AI score)
  //
  // Background tint applied for 'overdue' and 'stalled' so the entire
  // card reads "urgent" without the rep needing to parse the chip text.
  // All other states use a plain white card — less noise.
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      onClick={() => onCardClick(deal.id)}
      onContextMenu={(e) => onContextMenu(e, deal.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`rounded-lg cursor-pointer transition-all duration-150 relative ${tokens.cardTint || 'bg-white'} ${
        isDragging ? 'shadow-xl scale-[1.03]' : 'shadow-sm hover:shadow-md hover:-translate-y-0.5'
      }`}
      style={{
        border: borderStyle,
        borderLeft: `3px solid ${borderColor}`,
        padding: '11px 13px',
        opacity: isDragging ? 0.92 : inspectionMode && !inspectionBadge ? 0.3 : 1,
      }}
      aria-label={`Deal: ${deal.dealName}, ${formatCurrencyCompact(deal.amount, deal.currency || BASE_CURRENCY_CODE)}, ${state.description}`}
      title={state.description}
    >

      {/* ── ZONE 1: Identity ─────────────────────────────────────────────── */}
      {/*
        Deal name is the primary identifier — 13px/semibold, two-line clamp.
        Company sits directly below as muted context.
        HRMS badge is top-right so it never interrupts the left-to-right
        name scan.  It's a button so reps can click directly into HRMS context.
      */}
      <div className="flex items-start justify-between mb-0.5">
        <h4 className="text-[14px] font-semibold text-gray-900 leading-snug line-clamp-2 flex-1 mr-2">
          {deal.dealName}
        </h4>
        {deal.isHRMS && (
          <button
            onClick={(e) => { e.stopPropagation(); onHRMSClick(e, deal); }}
            className="flex-shrink-0 flex items-center space-x-1 px-2 py-0.5 text-[10px] rounded font-semibold transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b', color: '#92400e' }}
            title="HRMS-connected deal — click for details"
          >
            <Building2 className="h-2.5 w-2.5" />
            <span>HRMS</span>
          </button>
        )}
      </div>
      <p className="text-[11px] text-gray-500 mb-1.5 truncate">{deal.companyName || '—'}</p>

      {/* ── ZONE 2: Value signal ─────────────────────────────────────────── */}
      {/*
        Amount (left) and close date (right) on one scan line.
        The eye reads: "$50,000 → Jun 15" in a single pass.
        ◆ prefix marks high-value deals as a typographic modifier — no extra
        badge so it doesn't add visual weight on already-urgent cards.
        Urgency dot encodes deadline risk as a 2px visual before the date text.
      */}
      <div className="flex items-center justify-between mb-2 pt-1.5 border-t border-gray-100">
        <div className="flex flex-col">
          <div className="flex items-center space-x-1">
            {state.isHighValue && (
              <span className="text-amber-500 text-[11px] leading-none" title="High-value deal (≥$100K)">◆</span>
            )}
            <span className="text-[15px] font-bold text-indigo-600">
              {formatCurrencyCompact(deal.amount, deal.currency || BASE_CURRENCY_CODE)}
            </span>
          </div>
          {deal.currency && deal.currency !== BASE_CURRENCY_CODE && deal.amount > 0 && (
            <span className="text-[10px] text-gray-400 leading-none mt-0.5">
              ≈ {formatCurrencyCompact(deal.baseAmountUsd || convertToBaseCurrency(deal.amount, deal.currency), BASE_CURRENCY_CODE)} USD
            </span>
          )}
        </div>
        <div className="flex items-center space-x-1.5">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${closeDateDotClass(closeDaysLeft)}`} />
          <span className={`text-[12px] ${closeDateTextClass(closeDaysLeft)}`}>
            {formatCloseDate(deal.closeDate)}
          </span>
        </div>
      </div>

      {/* ── ZONE 3: State chip + secondary context ───────────────────────── */}
      {/*
        Layout: justify-between so the left chip and right label are always
        at opposite ends with reliable spacing — no ml-auto/truncate collapse.

        Left:  status chip (always a button for interaction) when signal exists,
               or plain activity text for on-track deals.
        Right: inspection badge > close date (closed) > activity time (active)
               Overdue/stalled suppress the right element — chip encodes timing.
      */}
      <div className="flex items-center justify-between gap-3 mb-1.5">

        {/* Left — chip or fallback activity label */}
        {state.chipLabel ? (
          <button
            onClick={(e) => { e.stopPropagation(); onStatusClick(e, deal); }}
            className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium transition-opacity hover:opacity-80 flex-shrink-0 ${tokens.chipBg} ${tokens.chipText}`}
            title={state.description}
          >
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tokens.chipDot}`} />
            <span>{state.chipLabel}</span>
          </button>
        ) : (
          <span className="text-[11px] text-gray-500 whitespace-nowrap">
            {isClosed
              ? formatCloseDate(deal.closeDate)
              : formatRelativeTime(deal.lastActivity, 'No activity')}
          </span>
        )}

        {/* Right — inspection badge > activity time for active-with-chip states.
            Closed deals show no right element — close date is already in Zone 2. */}
        {inspectionMode && inspectionBadge ? (
          <span
            className={`text-[11px] px-2 py-0.5 rounded font-medium flex-shrink-0 ${inspectionBadge.style}`}
            title={inspectionBadge.title}
          >
            {inspectionBadge.label}
          </span>
        ) : !isClosed && state.chipLabel && state.primary !== 'overdue' && state.primary !== 'stalled' ? (
          <span className="text-[11px] text-gray-400 flex-shrink-0 whitespace-nowrap">
            {formatRelativeTime(deal.lastActivity, 'No activity')}
          </span>
        ) : null}

      </div>

      {/* ── Next step line ───────────────────────────────────────────────── */}
      {/* Hidden for closed deals — next steps are irrelevant post-close.
          Also suppresses placeholder strings like "N/A" stored in the DB.
          Shown for active deals when a real next step exists.               */}
      {!isClosed && !inspectionMode && !!deal.nextStep?.trim() &&
        deal.nextStep.trim().toUpperCase() !== 'N/A' &&
        deal.nextStep.trim() !== '—' && (
        <div className="flex items-center space-x-1 mt-1.5 mb-1">
          <ArrowRight className="h-3 w-3 text-indigo-400 flex-shrink-0" />
          <span className="text-[11px] text-gray-600 line-clamp-1 leading-snug flex-1 min-w-0">
            {deal.nextStep}
          </span>
          {deal.nextStepDueDate && (() => {
            const dueLeft = daysFromNow(deal.nextStepDueDate!);
            if (dueLeft < 0) return (
              <span key="late" className="text-[9px] px-1 py-0.5 rounded font-semibold bg-orange-100 text-orange-700 flex-shrink-0 ml-1">
                {Math.abs(dueLeft)}d late
              </span>
            );
            if (dueLeft === 0) return (
              <span key="today" className="text-[9px] px-1 py-0.5 rounded font-semibold bg-amber-100 text-amber-700 flex-shrink-0 ml-1">
                Today
              </span>
            );
            if (dueLeft <= 2) return (
              <span key="soon" className="text-[9px] px-1 py-0.5 rounded font-semibold bg-amber-50 text-amber-600 flex-shrink-0 ml-1">
                {dueLeft}d
              </span>
            );
            return null;
          })()}
        </div>
      )}

      {/* ── Payment indicator ────────────────────────────────────────────── */}
      {paymentIndicator && (
        <div className="flex items-center gap-1.5 mb-1">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${paymentIndicator.hasOverdue ? 'bg-red-500' : 'bg-green-500'}`} />
          <span className={`text-[11px] ${paymentIndicator.hasOverdue ? 'text-red-600 font-medium' : 'text-green-600'}`}>
            {paymentIndicator.hasOverdue ? 'Payment overdue' : 'Payments on track'}
          </span>
        </div>
      )}

      {/* ── ZONE 4: Metadata footer ──────────────────────────────────────── */}
      {/*
        Single border-t anchors the entire metadata zone — owner, AI score,
        and committee coverage all read as one footer distinct from deal content.

        Owner avatar bumped to 24px so it reads as a person marker, not a token.
        AI bar slimmed to h-1.5 so it registers as a secondary indicator rather
        than competing with the amount for visual weight.
        Coverage bar self-separates via its own border-t border-gray-50.
      */}
      <div className="border-t border-gray-100 pt-2 mt-1">
        <div className="flex items-center justify-between">
          <button
            onClick={(e) => { e.stopPropagation(); onContactClick(e, deal.id); }}
            className="flex items-center space-x-2 text-[11px] text-gray-600 hover:text-indigo-600 transition-colors min-w-0"
            title={`Owner: ${deal.owner || 'Unassigned'}`}
          >
            <span
              className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ backgroundColor: '#6366f1' }}
              aria-label={`Owner: ${deal.owner}`}
            >
              {getInitials(deal.owner)}
            </span>
            <span className="truncate max-w-[100px]">{deal.owner || 'Unassigned'}</span>
          </button>

          {!isClosed && (
            <button
              onClick={(e) => { e.stopPropagation(); onScoreClick(e, deal.id); }}
              className="flex items-center space-x-1.5 flex-shrink-0 hover:opacity-70 transition-opacity"
              title={`AI Health: ${deal.aiScore}/100 — click for breakdown`}
            >
              <div className="w-12 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${deal.aiScore}%`, backgroundColor: aiBarColor(deal.aiScore) }}
                />
              </div>
              <span className="relative flex items-center">
                <span
                  className="text-[11px] font-semibold tabular-nums"
                  style={{ color: aiBarColor(deal.aiScore) }}
                >
                  {deal.aiScore}
                </span>
                {healthExpl?.hasHighRisk && (
                  <span
                    className="absolute -top-1 -right-2 w-1.5 h-1.5 rounded-full bg-amber-400 ring-1 ring-white"
                    title="High-impact risk detected"
                  />
                )}
              </span>
            </button>
          )}
        </div>

        {/* Committee coverage — self-separates via border-t border-gray-50 */}
        {!isClosed && (
          <CommitteeCoverageBar stakeholders={deal.stakeholders} />
        )}
      </div>

      {/* ── Health driver popover ─────────────────────────────────────────── */}
      {/* Replaces the old delta-based tooltip.  Shows the explanation model
          from dealHealthDrivers.ts — no fake arithmetic, just observable facts
          with one action each.  Mounted inside the card for stacking context. */}
      {showScoreTooltip && !isClosed && healthExpl && (
        <div className="absolute z-50 left-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header — score + tier */}
          <div className="px-3 pt-3 pb-2 border-b border-gray-50">
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center space-x-1 text-[11px] font-semibold text-indigo-600">
                <Sparkles className="h-3 w-3" />
                <span>AI Health</span>
              </span>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full
                  ${healthExpl.tier === 'strong' ? 'bg-emerald-50 text-emerald-700'
                  : healthExpl.tier === 'fair'   ? 'bg-amber-50 text-amber-700'
                  :                                'bg-red-50 text-red-700'}`}
              >
                {healthExpl.tierLabel}
              </span>
            </div>
            {/* Score bar */}
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${healthExpl.score}%`, backgroundColor: aiBarColor(healthExpl.score) }}
                />
              </div>
              <span className="text-[11px] font-bold tabular-nums" style={{ color: aiBarColor(healthExpl.score) }}>
                {healthExpl.score}
              </span>
            </div>
            <p className="text-[10px] text-gray-500 mt-1.5 leading-snug">{healthExpl.headline}</p>
          </div>

          {/* Risk drivers */}
          {healthExpl.risks.length > 0 && (
            <div className="px-3 py-2 border-b border-gray-50">
              <p className="text-[9px] font-semibold text-red-500 uppercase tracking-wider mb-1.5">Risks</p>
              <div className="space-y-1.5">
                {healthExpl.risks.slice(0, 4).map(r => (
                  <div key={r.id} className="flex items-start justify-between gap-2">
                    <span className="flex items-start space-x-1 min-w-0">
                      <AlertTriangle className={`h-3 w-3 flex-shrink-0 mt-px
                        ${r.impact === 'high' ? 'text-red-500' : 'text-amber-500'}`}
                      />
                      <span className="text-[11px] text-gray-700 leading-snug">{r.label}</span>
                    </span>
                    {r.action && (
                      <span className="text-[10px] text-indigo-500 whitespace-nowrap flex-shrink-0 font-medium">
                        {r.action} →
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Positive drivers */}
          {healthExpl.positives.length > 0 && (
            <div className="px-3 py-2">
              <p className="text-[9px] font-semibold text-emerald-600 uppercase tracking-wider mb-1.5">Strengths</p>
              <div className="flex flex-wrap gap-1">
                {healthExpl.positives.slice(0, 4).map(p => (
                  <span
                    key={p.id}
                    className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] rounded-full"
                  >
                    <CheckCircle2 className="h-2.5 w-2.5 flex-shrink-0" />
                    <span>{p.label}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Hover quick actions ───────────────────────────────────────────── */}
      {/*
        Revealed on hover, hidden at rest — zero resting visual weight.
        Gradient fade at the card bottom creates a natural anchor for the
        action strip without a hard separator line.
        Four actions cover the most common daily rep operations:
          ✉  Email          → open composer
          ⏱  Log activity   → open activity modal
          ✎  Edit           → navigate to edit page
          ⋯  More           → surface right-click context menu
      */}
      {isHovered && !isDragging && (
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center justify-end space-x-1 px-2 py-1.5 rounded-b-lg"
          style={{ background: 'linear-gradient(to top, rgba(248,250,255,0.98) 55%, transparent)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => onQuickEmail(e, deal.id)}
            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
            title="Send email" aria-label="Send email"
          >
            <Mail className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => onQuickActivity(e, deal.id)}
            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
            title="Log activity" aria-label="Log activity"
          >
            <Activity className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => onQuickEdit(e, deal.id)}
            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
            title="Edit deal" aria-label="Edit deal"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onContextMenu(e, deal.id); }}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="More options" aria-label="More options"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default DealKanbanCard;
