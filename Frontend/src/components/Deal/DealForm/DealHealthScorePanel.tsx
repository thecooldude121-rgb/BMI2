import React from 'react';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { calculateDealHealthScore, HealthTier, ItemStatus } from '../../../utils/dealHealthScore';

interface DealHealthScorePanelProps {
  formData: any;
  subtitle?: string;
}

// ─── SVG circular gauge ───────────────────────────────────────────────────────
const CircleGauge: React.FC<{ score: number; tier: HealthTier }> = ({ score, tier }) => {
  const r = 36;
  const cx = 44;
  const cy = 44;
  const circumference = 2 * Math.PI * r;
  const filled = circumference * (score / 100);
  const gap = circumference - filled;

  const trackColor = '#E5E7EB'; // gray-200
  const fillColor =
    tier === 'green'  ? '#10B981' : // emerald-500
    tier === 'yellow' ? '#F59E0B' : // amber-500
                        '#EF4444';  // red-500

  const textColor =
    tier === 'green'  ? 'text-emerald-600' :
    tier === 'yellow' ? 'text-amber-600'   :
                        'text-red-500';

  return (
    <div className="relative flex items-center justify-center">
      <svg width={88} height={88} className="-rotate-90">
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={trackColor} strokeWidth={8} />
        {/* Fill */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={fillColor}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${gap}`}
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold leading-none ${textColor}`}>{score}</span>
        <span className="text-xs text-gray-400 font-medium mt-0.5">/ 100</span>
      </div>
    </div>
  );
};

// ─── Score item row ───────────────────────────────────────────────────────────
const itemIcon = (status: ItemStatus) => {
  if (status === 'earned')  return <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />;
  if (status === 'partial') return <AlertCircle  className="h-4 w-4 text-amber-500 flex-shrink-0"   />;
  return                           <Circle       className="h-4 w-4 text-gray-300 flex-shrink-0"    />;
};

const itemTextColor = (status: ItemStatus) =>
  status === 'earned'  ? 'text-gray-800' :
  status === 'partial' ? 'text-amber-700' :
  'text-gray-400';

const itemPointsColor = (status: ItemStatus) =>
  status === 'earned'  ? 'text-emerald-600' :
  status === 'partial' ? 'text-amber-500'   :
  'text-gray-300';

// ─── Panel ────────────────────────────────────────────────────────────────────
export const DealHealthScorePanel: React.FC<DealHealthScorePanelProps> = ({ formData, subtitle }) => {
  const result = calculateDealHealthScore(formData);

  const tierBadge =
    result.tier === 'green'  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
    result.tier === 'yellow' ? 'bg-amber-50 text-amber-700 border-amber-100'       :
                               'bg-red-50 text-red-700 border-red-100';

  const missingItems  = result.items.filter(i => i.status === 'missing');
  const partialItems  = result.items.filter(i => i.status === 'partial');
  const earnedItems   = result.items.filter(i => i.status === 'earned');
  const availablePts  = [...missingItems, ...partialItems]
    .reduce((s, i) => s + (i.max - i.earned), 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-[15px] font-semibold text-gray-900">Deal Health Score</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">{subtitle ?? 'Updates as you fill the form'}</p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${tierBadge}`}>
          {result.label}
        </span>
      </div>

      {/* Gauge + available points */}
      <div className="flex items-center space-x-4 mb-2">
        <CircleGauge score={result.score} tier={result.tier} />
        <div className="flex-1">
          {availablePts > 0 ? (
            <>
              <p className="text-sm font-medium text-gray-700">
                +{availablePts} pts available
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {partialItems.length > 0 && `${partialItems.length} field${partialItems.length > 1 ? 's' : ''} need more detail · `}
                {missingItems.length > 0 && `${missingItems.length} field${missingItems.length > 1 ? 's' : ''} missing`}
              </p>
            </>
          ) : (
            <p className="text-sm font-semibold text-emerald-600">
              Maximum score reached!
            </p>
          )}
        </div>
      </div>

      {/* Score items */}
      <div className="space-y-1.5">
        {/* Show missing + partial first (opportunity items) */}
        {[...partialItems, ...missingItems].map(item => (
          <div key={item.id} className="flex items-start space-x-2.5">
            {itemIcon(item.status)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium ${itemTextColor(item.status)}`}>
                  {item.label}
                </span>
                <span className={`text-xs font-semibold ml-2 flex-shrink-0 ${itemPointsColor(item.status)}`}>
                  +{item.max - item.earned} pts
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5 leading-tight">{item.tip}</p>
            </div>
          </div>
        ))}

        {/* Divider when there are both earned and not-earned */}
        {earnedItems.length > 0 && (partialItems.length > 0 || missingItems.length > 0) && (
          <div className="border-t border-gray-100 pt-1.5 mt-1">
            <p className="text-[11px] text-gray-400 mb-1">Completed</p>
          </div>
        )}

        {/* Earned items — collapsed style */}
        {earnedItems.map(item => (
          <div key={item.id} className="flex items-center space-x-2.5">
            {itemIcon(item.status)}
            <span className="text-xs text-gray-500 flex-1">{item.label}</span>
            <span className="text-xs font-semibold text-emerald-500">+{item.earned}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
