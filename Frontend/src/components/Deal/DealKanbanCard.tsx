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
  status?: string;
  createdAt?: string;
}

export interface DealKanbanCardProps {
  deal: DealCard;
  stageId: string;
  /** 'standard' shows all 4 zones; 'compact' collapses to 3 rows */
  density: 'standard' | 'compact';
  isHighlighted: boolean;
  isDragging: boolean;
  showScoreTooltip: boolean;
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

/** AI score bar fill colour — three-tier: green / indigo / amber. */
function aiBarColor(score: number): string {
  if (score >= 80) return '#10b981'; // emerald-500
  if (score >= 60) return '#6366f1'; // indigo-500
  return '#f59e0b';                  // amber-500
}

// ── Component ─────────────────────────────────────────────────────────────────

const DealKanbanCard: React.FC<DealKanbanCardProps> = ({
  deal,
  stageId,
  density,
  isHighlighted,
  isDragging,
  showScoreTooltip,
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

  // ── Resolve the canonical deal state ──────────────────────────────────────
  // One function, one priority ordering — all visual treatments flow from here.
  const state  = resolveDealState(deal, closeDaysLeft, isClosed);
  const tokens = STATE_TOKENS[state.primary];

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
          opacity: isDragging ? 0.92 : 1,
        }}
        aria-label={`Deal: ${deal.dealName}, ${formatCurrencyCompact(deal.amount, deal.currency || BASE_CURRENCY_CODE)}, ${state.description}`}
        title={state.description}
      >
        {/* Row A: Deal name (left) + value (right) — two most critical fields at a glance */}
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <span className="text-[13px] font-semibold text-gray-900 leading-snug line-clamp-1 flex-1">
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
          <span className="text-[11px] text-gray-500 truncate mr-2">{deal.companyName || '—'}</span>
          {deal.closeDate ? (
            <div className="flex items-center space-x-1 flex-shrink-0">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${closeDateDotClass(closeDaysLeft)}`} />
              <span className={`text-[11px] ${closeDateTextClass(closeDaysLeft)}`}>
                {formatCloseDate(deal.closeDate)}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-gray-400">No close date</span>
          )}
        </div>

        {/* Row C: State chip — single authoritative status signal */}
        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${tokens.chipBg} ${tokens.chipText}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tokens.chipDot}`} />
            <span>{state.chipLabel}</span>
          </span>
          {deal.isHRMS && (
            <button
              onClick={(e) => { e.stopPropagation(); onHRMSClick(e, deal); }}
              className="text-[10px] px-1.5 py-0.5 rounded font-medium transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b', color: '#92400e' }}
              title="HRMS-connected deal"
            >
              HRMS
            </button>
          )}
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
        padding: '11px 13px 10px',
        opacity: isDragging ? 0.92 : 1,
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
        <h4 className="text-[13px] font-semibold text-gray-900 leading-snug line-clamp-2 flex-1 mr-2">
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
      <p className="text-[11px] text-gray-500 mb-2 truncate">{deal.companyName || '—'}</p>

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
          <span className={`text-[11px] ${closeDateTextClass(closeDaysLeft)}`}>
            {formatCloseDate(deal.closeDate)}
          </span>
        </div>
      </div>

      {/* ── ZONE 3: State chip ───────────────────────────────────────────── */}
      {/*
        Single authoritative status pill driven by resolveDealState().
        This replaces the four independent ad-hoc helpers that previously
        each expressed part of the deal's condition.
        Activity time is right-aligned secondary context — useful but not
        what a sales manager scans for first.
        The chip is a button so clicking it opens the activity modal
        (the natural next action when you notice a deal is stalled/at-risk).
      */}
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-gray-100">
        <button
          onClick={(e) => { e.stopPropagation(); onStatusClick(e, deal); }}
          className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium transition-opacity hover:opacity-80 ${tokens.chipBg} ${tokens.chipText}`}
          title={state.description}
        >
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tokens.chipDot}`} />
          <span>{state.chipLabel}</span>
        </button>
        <span className="text-[11px] text-gray-400 truncate max-w-[110px]">
          {isClosed
            ? (stageId === 'closed-won' ? 'Won' : 'Lost')
            : formatRelativeTime(deal.lastActivity, 'No activity')}
        </span>
      </div>

      {/* ── ZONE 4: Metadata ─────────────────────────────────────────────── */}
      {/*
        Owner avatar and AI score — the lowest-urgency metadata.
        Placed last so urgency states in zones 2–3 dominate the initial scan.

        Owner: initials avatar (same info as "Owner: Name" in ~20% of space).
        The avatar background color is fixed indigo — could be role-coded in
        a future iteration.

        AI score: thin bar (gestalt range) + number (precision).
        Color-coded to match the deal state where possible.
        Hidden entirely for closed deals where it's no longer actionable.
      */}
      <div className="flex items-center justify-between">
        <button
          onClick={(e) => { e.stopPropagation(); onContactClick(e, deal.id); }}
          className="flex items-center space-x-1.5 text-[11px] text-gray-500 hover:text-indigo-600 transition-colors min-w-0"
          title={`Owner: ${deal.owner || 'Unassigned'}`}
        >
          <span
            className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
            style={{ backgroundColor: '#6366f1' }}
            aria-label={`Owner: ${deal.owner}`}
          >
            {getInitials(deal.owner)}
          </span>
          <span className="truncate max-w-[80px]">{deal.owner || 'Unassigned'}</span>
        </button>

        {!isClosed && (
          <button
            onClick={(e) => { e.stopPropagation(); onScoreClick(e, deal.id); }}
            className="flex items-center space-x-1.5 flex-shrink-0 hover:opacity-70 transition-opacity"
            title={`AI Health: ${deal.aiScore}/100 — click for breakdown`}
          >
            <Sparkles className="h-3 w-3 text-indigo-400 flex-shrink-0" />
            <div className="w-14 bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${deal.aiScore}%`, backgroundColor: aiBarColor(deal.aiScore) }}
              />
            </div>
            <span
              className="text-[11px] font-semibold tabular-nums"
              style={{ color: aiBarColor(deal.aiScore) }}
            >
              {deal.aiScore}
            </span>
          </button>
        )}
      </div>

      {/* ── AI Score Tooltip ─────────────────────────────────────────────── */}
      {/*
        Mounted inside the card for correct stacking context.
        Signals are computed from real deal fields (not static values).
        Colour-coded: green tick = positive signal, amber warning = risk factor.
      */}
      {showScoreTooltip && !isClosed && (() => {
        const activitySignal =
          deal.daysSinceContact === 0 ? { label: 'Activity today',                   delta: +20, good: true  }
          : deal.daysSinceContact <= 2 ? { label: `Active ${deal.daysSinceContact}d ago`,  delta: +15, good: true  }
          : deal.daysSinceContact <= 5 ? { label: `${deal.daysSinceContact}d since contact`, delta: +5, good: true }
          :                              { label: `No activity (${deal.daysSinceContact}d)`, delta: -15, good: false };

        const sizeSignal =
          deal.amount >= 100_000 ? { label: 'High-value deal',   delta: +15, good: true }
          : deal.amount >= 50_000 ? { label: 'Mid-value deal',   delta: +10, good: true }
          :                          { label: 'Standard deal',    delta:  +5, good: true };

        const healthSignal =
          deal.health === 'healthy'  ? { label: 'Deal health: good',    delta:  +5, good: true  }
          : deal.health === 'at-risk' ? { label: 'Deal health: at risk', delta:  -5, good: false }
          :                             { label: 'Deal stalled',          delta: -15, good: false };

        const closeDateSignal = closeDaysLeft === null ? null
          : closeDaysLeft < 0   ? { label: 'Close date overdue',    delta: -10, good: false }
          : closeDaysLeft <= 7  ? { label: 'Closing this week',      delta: +10, good: true  }
          : closeDaysLeft <= 30 ? { label: 'Close date this month',  delta:  +5, good: true  }
          :                       { label: 'Close date far out',      delta:  -2, good: false };

        const signals = [activitySignal, sizeSignal, healthSignal, ...(closeDateSignal ? [closeDateSignal] : [])];

        return (
          <div
            className="absolute z-50 left-0 top-full mt-1.5 w-60 bg-white rounded-lg shadow-2xl border border-indigo-100 p-3"
          >
            <p className="text-[11px] font-semibold text-indigo-600 mb-2 flex items-center space-x-1">
              <Sparkles className="h-3 w-3" />
              <span>AI Health: {deal.aiScore}/100</span>
            </p>
            <div className="space-y-1.5">
              {signals.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-[11px]">
                  <span className={`flex items-center space-x-1 ${s.good ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {s.good
                      ? <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                      : <AlertTriangle className="h-3 w-3 flex-shrink-0" />}
                    <span>{s.label}</span>
                  </span>
                  <span className={`font-semibold tabular-nums ${s.delta > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {s.delta > 0 ? `+${s.delta}` : s.delta}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

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
