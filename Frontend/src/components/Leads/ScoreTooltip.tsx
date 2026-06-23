import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { MultiFactorScore, MultiFactorDim, ScoreBand } from '../../utils/leadScoring/multiFactorScore';
import type { ScoreExplanation, ScoreDriver, ConfidenceLevel } from '../../utils/leadScoring/scoreExplainer';

// ── Color tokens ──────────────────────────────────────────────────────────────

const DIM_COLORS = {
  fit:        { bar: 'bg-blue-500',   text: 'text-blue-700',   label: 'Fit' },
  intent:     { bar: 'bg-purple-500', text: 'text-purple-700', label: 'Intent' },
  engagement: { bar: 'bg-green-500',  text: 'text-green-700',  label: 'Engagement' },
  confidence: { bar: 'bg-gray-400',   text: 'text-gray-600',   label: 'Confidence' },
} as const;

const BAND_PILL: Record<ScoreBand, string> = {
  low:       'bg-red-50   text-red-600   border-red-200',
  medium:    'bg-amber-50 text-amber-700 border-amber-200',
  high:      'bg-green-50 text-green-700 border-green-200',
  very_high: 'bg-blue-50  text-blue-700  border-blue-200',
};

const CONF_CLS: Record<ConfidenceLevel, string> = {
  high:   'text-green-600',
  medium: 'text-amber-600',
  low:    'text-red-500',
};

const CONF_DOT: Record<ConfidenceLevel, string> = {
  high:   'bg-green-500',
  medium: 'bg-amber-500',
  low:    'bg-red-500',
};

// ── Sub-components ────────────────────────────────────────────────────────────

function DimRow({
  dim: d,
  label,
  colors,
}: {
  dim: MultiFactorDim;
  label: string;
  colors: typeof DIM_COLORS[keyof typeof DIM_COLORS];
}) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <span className={`text-xs font-semibold ${colors.text}`}>{d.score}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${colors.bar} transition-all duration-300`}
            style={{ width: `${d.score}%` }}
          />
        </div>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${BAND_PILL[d.band]}`}>
          {d.bandLabel}
        </span>
      </div>
    </div>
  );
}

function CompactDriverRow({ driver, max = 1 }: { driver: ScoreDriver; max?: number }) {
  const pos = driver.impact === 'positive';
  return (
    <div className="flex items-center gap-1.5 text-[10px]">
      <span className={`font-bold shrink-0 ${pos ? 'text-green-500' : 'text-red-400'}`}>
        {pos ? '✓' : '✗'}
      </span>
      <span className="text-gray-700 truncate">{driver.label}</span>
      <span className={`ml-auto shrink-0 font-semibold tabular-nums ${pos ? 'text-green-600' : 'text-red-500'}`}>
        {driver.pts}/{driver.maxPts}
      </span>
    </div>
  );
}

// ── Exported tooltip ──────────────────────────────────────────────────────────

export default function ScoreTooltip({
  mfs,
  explanation,
}: {
  mfs:         MultiFactorScore;
  explanation: ScoreExplanation;
}) {
  const topPositive = explanation.positiveDrivers.slice(0, 2);
  const topNegative = explanation.negativeDrivers.slice(0, 1);
  const hasDrivers  = topPositive.length > 0 || topNegative.length > 0;

  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 bg-white border border-gray-200 rounded-xl shadow-lg p-3 space-y-3">

      {/* Header: title + confidence */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <span className="text-xs font-bold text-gray-700">Score Breakdown</span>
        <span className={`flex items-center gap-1 text-[10px] font-semibold ${CONF_CLS[explanation.confidenceLevel]}`}>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${CONF_DOT[explanation.confidenceLevel]}`} />
          {explanation.confidenceLevel === 'high'   ? 'High confidence'   :
           explanation.confidenceLevel === 'medium' ? 'Medium confidence' : 'Low confidence'}
        </span>
      </div>

      {/* 4-dim bars */}
      <DimRow dim={mfs.fitScore}        label={DIM_COLORS.fit.label}        colors={DIM_COLORS.fit} />
      <DimRow dim={mfs.intentScore}     label={DIM_COLORS.intent.label}     colors={DIM_COLORS.intent} />
      <DimRow dim={mfs.engagementScore} label={DIM_COLORS.engagement.label} colors={DIM_COLORS.engagement} />
      <DimRow dim={mfs.confidenceScore} label={DIM_COLORS.confidence.label} colors={DIM_COLORS.confidence} />

      {/* Top drivers */}
      {hasDrivers && (
        <div className="pt-2 border-t border-gray-100 space-y-1">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Top signals</p>
          {topPositive.map((d, i) => <CompactDriverRow key={i} driver={d} />)}
          {topNegative.map((d, i) => <CompactDriverRow key={i} driver={d} />)}
        </div>
      )}

      {/* Footer hint */}
      <p className="text-[10px] text-gray-400 pt-1 border-t border-gray-100">
        Click ✦ for full breakdown &amp; feedback
      </p>
    </div>
  );
}
