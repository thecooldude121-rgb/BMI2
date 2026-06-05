/**
 * ManagerInspectionBar — the coaching inspection layer rendered above the board.
 *
 * Shown only when inspection mode is active (inspectionMode === true in the page).
 * It replaces the AI Insights band in the same vertical slot so the page
 * height stays constant.
 *
 * Layout:
 *   Header row: title + rep filter chips + Exit button
 *   Signal row: 4 clickable signal cards
 *   Risky deals list: top 3 high-risk / high-value deals with quick action
 *
 * Every signal card is actionable — clicking it applies the corresponding
 * saved view on the board so the manager sees only those deals.
 */

import React from 'react';
import {
  Clock, Calendar, AlertTriangle, TrendingDown,
  X, ChevronRight, ShieldAlert, AlarmClock,
} from 'lucide-react';
import type { InspectionSignals, OwnerStats } from '../../utils/inspectionSignals';
import { daysFromNow } from '../../utils/dateUtils';

// ── Props ─────────────────────────────────────────────────────────────────────

interface ManagerInspectionBarProps {
  signals: InspectionSignals;
  /** Currently scoped owner, or 'all' for all reps. */
  inspectionOwner: string;
  onOwnerChange: (owner: string) => void;
  onExit: () => void;
  /** Called when a signal card is clicked — passes the saved-view id to apply. */
  onSignalClick: (viewId: string) => void;
  formatCurrency: (amount: number) => string;
}

// ── Sub-components ────────────────────────────────────────────────────────────

/**
 * A single signal card.  Shows count, label, description, and a "View →" CTA.
 * Clicking anywhere on the card applies the corresponding saved view filter.
 */
const SignalCard: React.FC<{
  icon: React.ReactNode;
  count: number;
  label: string;
  description: string;
  viewId: string;
  accentClass: string;     // Tailwind classes for the accent bar colour
  countClass: string;      // Tailwind classes for the count text
  onClick: (viewId: string) => void;
}> = ({ icon, count, label, description, viewId, accentClass, countClass, onClick }) => (
  <button
    onClick={() => onClick(viewId)}
    className="flex-1 min-w-[160px] bg-white/10 hover:bg-white/20 backdrop-blur-sm
      rounded-lg p-4 border border-white/20 text-left transition-all duration-150
      hover:border-white/40 hover:shadow-lg group"
    title={`View ${label} → applies the "${label}" filter`}
  >
    {/* Accent bar at top */}
    <div className={`h-1 w-8 rounded-full mb-3 ${accentClass}`} />

    <div className="flex items-start justify-between mb-1">
      <div className="flex items-center space-x-2">
        <span className="text-white/70">{icon}</span>
        <span className={`text-2xl font-bold ${countClass}`}>{count}</span>
      </div>
      {/* View arrow — visible on hover to signal the card is clickable */}
      <ChevronRight className="h-4 w-4 text-white/0 group-hover:text-white/60 transition-colors mt-1" />
    </div>

    <p className="text-white text-[13px] font-semibold leading-snug mb-0.5">{label}</p>
    <p className="text-white/60 text-[11px] leading-snug">{description}</p>
  </button>
);

/**
 * Owner chip shown in the Rep Overview row.
 * Turns amber and shows flag count when the owner has issues.
 * Active owner gets a white filled background.
 */
const OwnerChip: React.FC<{
  stats: OwnerStats;
  isActive: boolean;
  onClick: (owner: string) => void;
}> = ({ stats, isActive, onClick }) => {
  const initials = stats.owner
    .split(/\s+/)
    .map(w => w[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  const hasFlaggedDeals = stats.flagCount > 0;

  return (
    <button
      onClick={() => onClick(stats.owner)}
      className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium
        transition-all duration-150 border flex-shrink-0
        ${isActive
          ? 'bg-white text-gray-900 border-white shadow-sm'
          : hasFlaggedDeals
          ? 'bg-amber-500/20 text-white border-amber-400/40 hover:bg-amber-500/30'
          : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
        }`}
      title={`${stats.owner}: ${stats.total} deals, ${stats.flagCount} issues`}
      aria-pressed={isActive}
    >
      {/* Avatar */}
      <span
        className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0
          ${isActive ? 'bg-indigo-600 text-white' : 'bg-white/20 text-white'}`}
      >
        {initials}
      </span>
      <span className="truncate max-w-[80px]">{stats.owner.split(' ')[0]}</span>
      {/* Flag count badge — shown only when > 0 */}
      {hasFlaggedDeals && (
        <span className={`text-[10px] font-bold px-1 py-0.5 rounded-full leading-none
          ${isActive ? 'bg-amber-500 text-white' : 'bg-amber-400/30 text-amber-100'}`}
        >
          {stats.flagCount}
        </span>
      )}
    </button>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

const ManagerInspectionBar: React.FC<ManagerInspectionBarProps> = ({
  signals,
  inspectionOwner,
  onOwnerChange,
  onExit,
  onSignalClick,
  formatCurrency,
}) => {
  return (
    <div
      className="px-8 py-5"
      style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4c1d95 100%)' }}
      role="region"
      aria-label="Manager Inspection Mode"
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="h-5 w-5 text-amber-400" />
          <span className="text-white font-semibold text-[15px]">Manager Inspection</span>
          <span className="px-2 py-0.5 bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-semibold rounded-full uppercase tracking-wider">
            Active
          </span>
        </div>

        {/* Rep filter chips ──────────────────────────────────────────────
            "All" chip + one chip per active deal owner.
            Shows the most-flagged reps first (sorted by flagCount desc). */}
        <div className="flex items-center space-x-1.5 flex-1 mx-6 overflow-x-auto">
          <span className="text-white/50 text-[11px] whitespace-nowrap flex-shrink-0">Rep:</span>
          {/* "All" chip */}
          <button
            onClick={() => onOwnerChange('all')}
            className={`px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150 border flex-shrink-0
              ${inspectionOwner === 'all'
                ? 'bg-white text-gray-900 border-white shadow-sm'
                : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
              }`}
            aria-pressed={inspectionOwner === 'all'}
          >
            All reps
          </button>
          {signals.byOwner.map(s => (
            <OwnerChip
              key={s.owner}
              stats={s}
              isActive={inspectionOwner === s.owner}
              onClick={onOwnerChange}
            />
          ))}
        </div>

        {/* Exit button */}
        <button
          onClick={onExit}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-[12px] text-white/70
            hover:text-white hover:bg-white/10 rounded-lg border border-white/20
            hover:border-white/40 transition-all flex-shrink-0"
          title="Exit inspection mode (Esc)"
          aria-label="Exit Manager Inspection Mode"
        >
          <X className="h-3.5 w-3.5" />
          <span>Exit inspection</span>
        </button>
      </div>

      {/* ── Signal cards ─────────────────────────────────────────────────── */}
      {/* Four clickable cards — each applies the corresponding saved view.
          De-emphasised when count is 0 so the manager can scan quickly. */}
      <div className="flex space-x-3 mb-4 overflow-x-auto pb-1">
        <SignalCard
          icon={<Clock className="h-4 w-4" />}
          count={signals.noActivity.length}
          label="No Activity"
          description={`7+ days without contact`}
          viewId="stalled"
          accentClass="bg-amber-400"
          countClass={signals.noActivity.length > 0 ? 'text-amber-300' : 'text-white/40'}
          onClick={onSignalClick}
        />
        <SignalCard
          icon={<Calendar className="h-4 w-4" />}
          count={signals.overdueClose.length}
          label="Overdue"
          description="Close date already passed"
          viewId="closing-month"
          accentClass="bg-red-400"
          countClass={signals.overdueClose.length > 0 ? 'text-red-300' : 'text-white/40'}
          onClick={onSignalClick}
        />
        <SignalCard
          icon={<AlertTriangle className="h-4 w-4" />}
          count={signals.noNextStep.length}
          label="No Next Step"
          description="Action plan undefined"
          viewId="no-next-step"
          accentClass="bg-slate-400"
          countClass={signals.noNextStep.length > 0 ? 'text-slate-300' : 'text-white/40'}
          onClick={onSignalClick}
        />
        <SignalCard
          icon={<AlarmClock className="h-4 w-4" />}
          count={signals.nextStepOverdue.length}
          label="Step Overdue"
          description="Next step past its due date"
          viewId="no-next-step"
          accentClass="bg-orange-400"
          countClass={signals.nextStepOverdue.length > 0 ? 'text-orange-300' : 'text-white/40'}
          onClick={onSignalClick}
        />
        <SignalCard
          icon={<TrendingDown className="h-4 w-4" />}
          count={signals.highRiskHighValue.length}
          label="High-Risk Value"
          description={`At-risk deals ≥ $50K`}
          viewId="manager-review"
          accentClass="bg-red-400"
          countClass={signals.highRiskHighValue.length > 0 ? 'text-red-300' : 'text-white/40'}
          onClick={onSignalClick}
        />
      </div>

      {/* ── Top risky deals ───────────────────────────────────────────────── */}
      {/* Shown only when there are high-risk/high-value deals.
          Lists the top 3 by amount with a quick "Inspect →" link that opens
          the slideout panel (via onSignalClick applying manager-review view). */}
      {signals.topRiskyDeals.length > 0 && (
        <div className="bg-white/5 rounded-lg px-4 py-3 border border-white/10">
          <div className="flex items-center space-x-2 mb-2">
            <ShieldAlert className="h-3.5 w-3.5 text-orange-300" />
            <span className="text-[11px] font-semibold text-orange-300 uppercase tracking-wider">
              Needs immediate attention
            </span>
          </div>
          <div className="space-y-2">
            {signals.topRiskyDeals.map((deal, i) => {
              const daysLeft = deal.closeDate ? daysFromNow(deal.closeDate) : null;
              const isOverdue = daysLeft !== null && daysLeft < 0;
              return (
                <div key={deal.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 min-w-0">
                    {/* Rank indicator */}
                    <span className="text-[10px] text-white/40 w-3 flex-shrink-0">{i + 1}.</span>
                    <div className="min-w-0">
                      <span className="text-[12px] text-white font-medium truncate block max-w-[180px]">
                        {deal.dealName}
                      </span>
                      <span className="text-[11px] text-white/50 truncate block max-w-[180px]">
                        {deal.companyName} · {deal.owner.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 flex-shrink-0">
                    <span className="text-[13px] font-bold text-white">
                      {formatCurrency(deal.amount)}
                    </span>
                    {/* Urgency badge */}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium
                      ${isOverdue
                        ? 'bg-red-500/30 text-red-300'
                        : deal.health === 'stalled'
                        ? 'bg-amber-500/30 text-amber-300'
                        : 'bg-orange-500/30 text-orange-300'
                      }`}
                    >
                      {isOverdue
                        ? `${Math.abs(daysLeft!)}d late`
                        : deal.health === 'stalled'
                        ? 'Stalled'
                        : 'At risk'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {signals.highRiskHighValue.length > 3 && (
            <button
              onClick={() => onSignalClick('manager-review')}
              className="mt-2 text-[11px] text-orange-300/70 hover:text-orange-300 transition-colors"
            >
              +{signals.highRiskHighValue.length - 3} more risky deals →
            </button>
          )}
        </div>
      )}

      {/* ── All-clear state — shown when no signals are flagged ──────────── */}
      {signals.noActivity.length === 0 &&
        signals.overdueClose.length === 0 &&
        signals.noNextStep.length === 0 &&
        signals.nextStepOverdue.length === 0 &&
        signals.highRiskHighValue.length === 0 && (
        <div className="text-center py-2">
          <p className="text-white/60 text-[13px]">
            ✅ Pipeline looks healthy — no critical signals detected
            {inspectionOwner !== 'all' && ` for ${inspectionOwner}`}.
          </p>
        </div>
      )}
    </div>
  );
};

export default ManagerInspectionBar;
