/**
 * DealKanbanCard — reusable Kanban deal card component.
 *
 * Design goals:
 *  1. Sub-2-second scanability: name → company → value+date → status → owner.
 *  2. Two density modes: standard (full metadata) and compact (name+value+status).
 *  3. Hover-reveal quick actions so daily-use CTA is always one click away
 *     without adding visual weight to the resting card.
 *  4. Single status chip eliminates the old dual-signal redundancy (left border
 *     + health icon both expressing the same state).
 *  5. Owner rendered as initials avatar — same info, ~70% less space than "Owner: Name".
 */

import React, { useState } from 'react';
import {
  Building2, Calendar, User, Sparkles,
  CheckCircle2, AlertTriangle, XCircle,
  Mail, Activity, Edit2, MoreHorizontal,
} from 'lucide-react';
import {
  formatCloseDate,
  formatRelativeTime,
  daysFromNow,
} from '../../utils/dateUtils';

// ── Type definition ──────────────────────────────────────────────────────────
// Exported so DealsKanbanPage can import the canonical type from here.

export interface DealCard {
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

/**
 * Derives initials from a display name ("John Smith" → "JS").
 * Falls back to a single letter, then "?" if the name is absent.
 */
function getInitials(name?: string): string {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Maps health state → Tailwind chip classes for the status pill.
 * One canonical mapping used in both density modes.
 */
function healthChip(health: string): { bg: string; text: string; dot: string } {
  switch (health) {
    case 'healthy':  return { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500' };
    case 'at-risk':  return { bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-500' };
    case 'stalled':  return { bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500'   };
    default:         return { bg: 'bg-gray-50',   text: 'text-gray-600',   dot: 'bg-gray-400'  };
  }
}

/**
 * Left border accent unifies urgency signals that were previously split
 * between the border and the health icon row:
 *   stalled OR high priority → red (highest urgency)
 *   at-risk                  → amber
 *   default                  → indigo-300 (subtle, always present for drag affordance)
 */
function accentBorderColor(deal: DealCard): string {
  const isStalled  = deal.daysSinceContact >= 5 || deal.health === 'stalled';
  const isHighRisk = deal.priority === 'high';
  if (isStalled || isHighRisk) return '#dc2626';   // red-600
  if (deal.health === 'at-risk') return '#f59e0b'; // amber-500
  return '#a5b4fc';                                // indigo-300 — resting default
}

/**
 * Urgency dot next to the close date:
 *   overdue         → red
 *   within 7 days   → amber
 *   otherwise / null → green (or transparent when no date)
 */
function closeDateDot(daysLeft: number | null): string {
  if (daysLeft === null) return 'bg-gray-300';
  if (daysLeft < 0)  return 'bg-red-500';
  if (daysLeft <= 7) return 'bg-amber-500';
  return 'bg-green-500';
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

  const isCompact    = density === 'compact';
  const isStalled    = deal.daysSinceContact >= 5 || deal.health === 'stalled';
  const isClosed     = ['closed-won', 'closed-lost'].includes(stageId);
  const closeDaysLeft = daysFromNow(deal.closeDate);
  const chip          = healthChip(isClosed ? deal.health : deal.health);
  const accentColor   = accentBorderColor(deal);

  // AI score colour — green above 80, indigo above 60, amber otherwise
  const aiColor = deal.aiScore >= 80 ? '#16a34a'
    : deal.aiScore >= 60 ? '#6366f1'
    : '#f59e0b';

  // ── Status chip label ──
  let chipLabel: string;
  if (stageId === 'closed-won')  chipLabel = 'Won';
  else if (stageId === 'closed-lost') chipLabel = 'Lost';
  else if (isStalled) chipLabel = `Stalled · ${deal.daysSinceContact}d`;
  else if (deal.health === 'at-risk') chipLabel = 'At Risk';
  else chipLabel = 'Healthy';

  // ── Card border ──
  const borderStyle = isDragging
    ? '2px solid #6366f1'
    : isHighlighted
    ? '2px solid #dc2626'
    : '1px solid #e5e7eb'; // gray-200

  // ─────────────────────────────────────────────────────────────────────────
  // COMPACT MODE
  // Three-row layout: [name + value] · [company + date] · [status chip]
  // No owner, no AI bar, minimal spacing. ~30% shorter than standard.
  // ─────────────────────────────────────────────────────────────────────────
  if (isCompact) {
    return (
      <div
        onClick={() => onCardClick(deal.id)}
        onContextMenu={(e) => onContextMenu(e, deal.id)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`bg-white rounded-lg cursor-pointer transition-all duration-150 ${
          isDragging ? 'shadow-xl scale-105' : 'shadow-sm hover:shadow-md hover:-translate-y-px'
        }`}
        style={{
          border: borderStyle,
          borderLeft: `3px solid ${accentColor}`,
          padding: '9px 12px',
          opacity: isDragging ? 0.92 : 1,
        }}
        aria-label={`Deal: ${deal.dealName}, ${formatCurrency(deal.amount)}`}
      >
        {/* Row A: Deal name (left) + amount (right) — both primary signals on one line */}
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <span className="text-[13px] font-semibold text-gray-900 leading-snug line-clamp-1 flex-1">
            {deal.dealName}
          </span>
          <span className="text-[13px] font-bold text-indigo-600 whitespace-nowrap flex-shrink-0">
            {formatCurrency(deal.amount)}
          </span>
        </div>

        {/* Row B: Company (left) + urgency dot + date (right) — secondary context */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-gray-500 truncate mr-2">{deal.companyName || '—'}</span>
          {deal.closeDate ? (
            <div className="flex items-center space-x-1 flex-shrink-0">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${closeDateDot(closeDaysLeft)}`} />
              <span className="text-[11px] text-gray-500">{formatCloseDate(deal.closeDate)}</span>
            </div>
          ) : (
            <span className="text-[11px] text-gray-400">No close date</span>
          )}
        </div>

        {/* Row C: Status chip — health state at a glance */}
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${chip.bg} ${chip.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${chip.dot}`} />
            <span>{chipLabel}</span>
          </span>
          {deal.isHRMS && (
            <button
              onClick={(e) => { e.stopPropagation(); onHRMSClick(e, deal); }}
              className="text-[10px] px-1.5 py-0.5 rounded font-medium"
              style={{ backgroundColor: '#fff3cd', border: '1px solid #f59e0b', color: '#b45309' }}
            >
              HRMS
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STANDARD MODE
  // Four-zone layout with hover quick-action strip.
  // Zones are separated by subtle dividers for scanability without weight.
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      onClick={() => onCardClick(deal.id)}
      onContextMenu={(e) => onContextMenu(e, deal.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`bg-white rounded-lg cursor-pointer transition-all duration-150 relative ${
        isDragging ? 'shadow-xl scale-[1.03]' : 'shadow-sm hover:shadow-md hover:-translate-y-0.5'
      }`}
      style={{
        border: borderStyle,
        borderLeft: `3px solid ${accentColor}`,
        padding: '11px 13px 10px',
        opacity: isDragging ? 0.92 : 1,
      }}
      aria-label={`Deal: ${deal.dealName}, ${formatCurrency(deal.amount)}, ${chipLabel}`}
    >

      {/* ── ZONE 1: Identity ─────────────────────────────────────────────── */}
      {/* Primary identifier — deal name reads first, company reads second.
          HRMS badge is top-right so it doesn't interrupt the name scan. */}
      <div className="flex items-start justify-between mb-0.5">
        <h4 className="text-[13px] font-semibold text-gray-900 leading-snug line-clamp-2 flex-1 mr-2">
          {deal.dealName}
        </h4>
        {deal.isHRMS && (
          <button
            onClick={(e) => { e.stopPropagation(); onHRMSClick(e, deal); }}
            className="flex-shrink-0 flex items-center space-x-1 px-2 py-0.5 text-[10px] rounded font-semibold transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#fff3cd', border: '1px solid #f59e0b', color: '#b45309' }}
            title="HRMS-connected deal — click for details"
          >
            <Building2 className="h-2.5 w-2.5" />
            <span>HRMS</span>
          </button>
        )}
      </div>
      <p className="text-[11px] text-gray-500 mb-2 truncate">{deal.companyName || '—'}</p>

      {/* ── ZONE 2: Value signal ─────────────────────────────────────────── */}
      {/* Amount and close date on the same scan line.
          The eye reads: "$50,000 → Jun 15" without two stops.
          Urgency dot encodes deadline risk without a text badge (less noise). */}
      <div className="flex items-center justify-between mb-2 pt-1.5 border-t border-gray-100">
        <span className="text-[15px] font-bold text-indigo-600">
          {formatCurrency(deal.amount)}
        </span>
        <div className="flex items-center space-x-1.5 text-[11px]">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${closeDateDot(closeDaysLeft)}`} />
          <span className={
            closeDaysLeft === null ? 'text-gray-400' :
            closeDaysLeft < 0     ? 'text-red-600 font-medium' :
            closeDaysLeft <= 7    ? 'text-amber-600 font-medium' :
                                    'text-gray-600'
          }>
            {formatCloseDate(deal.closeDate)}
          </span>
        </div>
      </div>

      {/* ── ZONE 3: Status chip ──────────────────────────────────────────── */}
      {/* Single pill replaces the old scattered icon + text pattern.
          Consistent pill shape means the eye always finds health in the same spot.
          Activity time is secondary context on the same row (right side). */}
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-gray-100">
        <button
          onClick={(e) => { e.stopPropagation(); onStatusClick(e, deal); }}
          className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium transition-opacity hover:opacity-80 ${chip.bg} ${chip.text}`}
          title="Click to log activity"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${chip.dot}`} />
          <span>{chipLabel}</span>
        </button>
        <span className="text-[11px] text-gray-400 truncate max-w-[100px]">
          {isClosed
            ? (stageId === 'closed-won' ? 'Won' : 'Lost')
            : formatRelativeTime(deal.lastActivity, 'No activity')}
        </span>
      </div>

      {/* ── ZONE 4: Metadata ─────────────────────────────────────────────── */}
      {/* Owner as initials avatar: same info as "Owner: Name" but ~60% narrower.
          AI score as number + thin bar: bar gives gestalt (range), number gives precision.
          This zone is the least actionable — visually lightest treatment. */}
      <div className="flex items-center justify-between">
        {/* Owner initials avatar + name */}
        <button
          onClick={(e) => { e.stopPropagation(); onContactClick(e, deal.id); }}
          className="flex items-center space-x-1.5 text-[11px] text-gray-500 hover:text-indigo-600 transition-colors min-w-0"
          title={deal.owner || 'Unassigned'}
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

        {/* AI Health score — hidden for closed deals where it's irrelevant */}
        {!isClosed && (
          <button
            onClick={(e) => { e.stopPropagation(); onScoreClick(e, deal.id); }}
            className="flex items-center space-x-1.5 flex-shrink-0 hover:opacity-70 transition-opacity"
            title={`AI Health Score: ${deal.aiScore}/100 — click for breakdown`}
          >
            <Sparkles className="h-3 w-3 text-indigo-400 flex-shrink-0" />
            {/* Thin track + filled bar: gestalt at a glance, number for precision */}
            <div className="w-14 bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${deal.aiScore}%`, backgroundColor: aiColor }}
              />
            </div>
            <span className="text-[11px] font-semibold" style={{ color: aiColor }}>
              {deal.aiScore}
            </span>
          </button>
        )}
      </div>

      {/* ── AI Score Tooltip ─────────────────────────────────────────────── */}
      {/* Mounted inside the card so it sits in the correct stacking context. */}
      {showScoreTooltip && !isClosed && (() => {
        const activitySignal = deal.daysSinceContact === 0
          ? { label: 'Activity today',           delta: +20, good: true  }
          : deal.daysSinceContact <= 2
          ? { label: `Active ${deal.daysSinceContact}d ago`, delta: +15, good: true  }
          : deal.daysSinceContact <= 5
          ? { label: `${deal.daysSinceContact}d since contact`, delta: +5, good: true }
          : { label: `No activity (${deal.daysSinceContact}d)`, delta: -15, good: false };

        const sizeSignal = deal.amount >= 100_000
          ? { label: 'High-value deal',  delta: +15, good: true }
          : deal.amount >= 50_000
          ? { label: 'Mid-value deal',   delta: +10, good: true }
          : { label: 'Standard deal',    delta:  +5, good: true };

        const healthSignal = deal.health === 'healthy'
          ? { label: 'Deal health: good',    delta:  +5, good: true  }
          : deal.health === 'at-risk'
          ? { label: 'Deal health: at risk', delta:  -5, good: false }
          : { label: 'Deal stalled',         delta: -15, good: false };

        const closeDateSignal = closeDaysLeft === null ? null
          : closeDaysLeft < 0   ? { label: 'Close date overdue',       delta: -10, good: false }
          : closeDaysLeft <= 7  ? { label: 'Closing this week',         delta: +10, good: true  }
          : closeDaysLeft <= 30 ? { label: 'Close date this month',     delta:  +5, good: true  }
          :                       { label: 'Close date far out',         delta:  -2, good: false };

        const signals = [activitySignal, sizeSignal, healthSignal, ...(closeDateSignal ? [closeDateSignal] : [])];

        return (
          <div
            className="absolute z-50 left-0 top-full mt-1.5 w-60 bg-white rounded-lg shadow-2xl border p-3"
            style={{ borderColor: '#e0e7ff' }}
          >
            <p className="text-[11px] font-semibold text-indigo-600 mb-2 flex items-center space-x-1">
              <Sparkles className="h-3 w-3" />
              <span>AI Health: {deal.aiScore}/100</span>
            </p>
            <div className="space-y-1.5">
              {signals.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-[11px]">
                  <span className={`flex items-center space-x-1 ${s.good ? 'text-green-600' : 'text-amber-600'}`}>
                    {s.good
                      ? <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                      : <AlertTriangle className="h-3 w-3 flex-shrink-0" />}
                    <span>{s.label}</span>
                  </span>
                  <span className={`font-semibold tabular-nums ${s.delta > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {s.delta > 0 ? `+${s.delta}` : s.delta}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── Hover quick actions ───────────────────────────────────────────── */}
      {/* Revealed only on hover — adds zero visual weight to the resting card.
          Three most common daily actions for a sales rep:
            ✉  Send email (navigates to email composer)
            ⏱  Log activity (opens activity modal)
            ✎  Edit deal (navigates to edit page)
          Icon-only for space efficiency; titles provide accessible labels. */}
      {isHovered && !isDragging && (
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center justify-end space-x-1 px-2 py-1.5 rounded-b-lg"
          style={{ background: 'linear-gradient(to top, #f8faff 60%, transparent)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => onQuickEmail(e, deal.id)}
            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
            title="Send email"
            aria-label="Send email"
          >
            <Mail className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => onQuickActivity(e, deal.id)}
            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
            title="Log activity"
            aria-label="Log activity"
          >
            <Activity className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => onQuickEdit(e, deal.id)}
            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
            title="Edit deal"
            aria-label="Edit deal"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onContextMenu(e, deal.id); }}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="More options"
            aria-label="More options"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default DealKanbanCard;
