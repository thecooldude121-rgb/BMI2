import React, { useState } from 'react';
import {
  TrendingUp, TrendingDown, Minus,
  Info, Zap, Target, Flag, ShieldCheck, AlertTriangle,
} from 'lucide-react';
import type { LeadScoreBreakdown, ScoreComponent } from '../../types/leadScoring';
import type { Lead } from '../../types/lead';
import type { MultiFactorScore } from '../../utils/leadScoring/multiFactorScore';
import { BAND_LABELS } from '../../utils/leadScoring/multiFactorScore';
import { explainScore } from '../../utils/leadScoring/scoreExplainer';
import type { ScoreDriver, ActivitySignal, ConfidenceLevel } from '../../utils/leadScoring/scoreExplainer';
import { getFeedbackState, type FeedbackType } from '../../utils/leadScoring/scoreFeedback';
import ScoreFeedbackControls from '../Leads/ScoreFeedbackControls';

// ── Props ─────────────────────────────────────────────────────────────────────

interface LeadScoreBreakdownPanelProps {
  breakdown?:        LeadScoreBreakdown;
  multiFactorScore?: MultiFactorScore;
  /** When provided, enables the explainability + feedback sections */
  lead?:             Lead;
}

// ── Dimension config ──────────────────────────────────────────────────────────

type DimKey = 'fit' | 'intent' | 'engagement' | 'confidence';

const DIM_META: Record<DimKey, {
  label:       string;
  description: string;
  icon:        React.ReactNode;
  bar:         string;
  bg:          string;
  text:        string;
  border:      string;
}> = {
  fit: {
    label:       'Fit',
    description: 'Company size, job title, industry/geography alignment',
    icon:    <Target     className="h-5 w-5 text-blue-600"   />,
    bar:    'bg-blue-500',   bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',
  },
  intent: {
    label:       'Intent',
    description: 'Meetings, calls, page views — proxy for purchase intent',
    icon:    <Flag       className="h-5 w-5 text-purple-600" />,
    bar:    'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200',
  },
  engagement: {
    label:       'Engagement',
    description: 'Email opens/clicks, activity recency',
    icon:    <Zap        className="h-5 w-5 text-green-600"  />,
    bar:    'bg-green-500',  bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',
  },
  confidence: {
    label:       'Confidence',
    description: 'Data completeness — reliability discount on overall score',
    icon:    <ShieldCheck className="h-5 w-5 text-gray-500"  />,
    bar:    'bg-gray-400',   bg: 'bg-gray-50',   text: 'text-gray-600',   border: 'border-gray-200',
  },
};

const CONF_CLS: Record<ConfidenceLevel, string> = {
  high:   'bg-green-100 text-green-700 border-green-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low:    'bg-red-100   text-red-600   border-red-200',
};

const CONF_LABEL: Record<ConfidenceLevel, string> = {
  high:   'High confidence',
  medium: 'Medium confidence',
  low:    'Low confidence',
};

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 my-2">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

function MFDimCard({ dimKey, score, band, detail }: {
  dimKey: DimKey; score: number; band: string; detail: string;
}) {
  const m = DIM_META[dimKey];
  return (
    <div className={`rounded-xl border p-4 space-y-3 ${m.bg} ${m.border}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg bg-white/60 border ${m.border}`}>{m.icon}</div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{m.label}</p>
            <p className="text-[10px] text-gray-500">{m.description}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${m.text}`}>{score}</p>
          <p className="text-[10px] text-gray-500">/ 100</p>
        </div>
      </div>
      <div className="space-y-1">
        <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden border border-white">
          <div
            className={`h-full rounded-full ${m.bar} transition-all duration-500`}
            style={{ width: `${score}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-gray-500">
          <span className="truncate max-w-[70%]">{detail}</span>
          <span className={`font-semibold ${m.text}`}>{band}</span>
        </div>
      </div>
    </div>
  );
}

function LegacyCard({ component, dimKey }: { component: ScoreComponent; dimKey: DimKey }) {
  const m = DIM_META[dimKey];
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`p-2 rounded-lg bg-white border ${m.border}`}>{m.icon}</div>
          <div>
            <h3 className="font-semibold text-gray-900">{component.name} Score</h3>
            <p className="text-xs text-gray-600">{component.value} / {component.maxValue} pts</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">{component.value}</p>
          <p className="text-xs text-gray-500">{component.percentage}%</p>
        </div>
      </div>
      <div className="mb-4">
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-2.5 rounded-full ${m.bar} transition-all duration-500`}
            style={{ width: `${component.percentage}%` }}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        {component.factors.map((factor, idx) => (
          <div key={idx} className="group relative">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 flex items-center gap-1">
                {factor.label}
                <Info className="h-3 w-3 text-gray-400" />
              </span>
              <span className="font-semibold text-gray-900">{factor.value.toFixed(1)} pts</span>
            </div>
            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10 pointer-events-none">
              <div className="bg-gray-900 text-white text-xs rounded py-1.5 px-2.5 whitespace-nowrap shadow-lg">
                {factor.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DriverRow({ driver }: { driver: ScoreDriver }) {
  const pos = driver.impact === 'positive';
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className={`mt-0.5 shrink-0 font-bold leading-none ${pos ? 'text-green-500' : 'text-red-400'}`}>
        {pos ? '✓' : '✗'}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-gray-800 truncate">{driver.label}</span>
          <span className={`text-[10px] font-bold shrink-0 tabular-nums ${pos ? 'text-green-600' : 'text-red-500'}`}>
            {driver.pts}/{driver.maxPts} pts
          </span>
        </div>
        <p className="text-[10px] text-gray-500">{driver.detail}</p>
      </div>
    </div>
  );
}

function SignalRow({ signal }: { signal: ActivitySignal }) {
  const icon =
    signal.direction === 'up'   ? <TrendingUp   size={12} className="text-green-500 shrink-0 mt-0.5" /> :
    signal.direction === 'down' ? <TrendingDown  size={12} className="text-red-400   shrink-0 mt-0.5" /> :
                                  <Minus         size={12} className="text-gray-400  shrink-0 mt-0.5" />;
  return (
    <div className="flex items-start gap-2 text-xs text-gray-600">
      {icon}
      <span>{signal.label}</span>
    </div>
  );
}

// ── Header trend helpers ──────────────────────────────────────────────────────

function trendIcon(trend: LeadScoreBreakdown['trend']) {
  if (trend === 'up')   return <TrendingUp   className="h-4 w-4 text-green-600" />;
  if (trend === 'down') return <TrendingDown  className="h-4 w-4 text-red-600" />;
  return <Minus className="h-4 w-4 text-gray-500" />;
}

function trendCls(trend: LeadScoreBreakdown['trend']) {
  if (trend === 'up')   return 'text-green-600';
  if (trend === 'down') return 'text-red-600';
  return 'text-gray-500';
}

// ── Main component ────────────────────────────────────────────────────────────

const LeadScoreBreakdownPanel: React.FC<LeadScoreBreakdownPanelProps> = ({
  breakdown,
  multiFactorScore: mfs,
  lead,
}) => {
  const totalScore  = mfs?.overallScore ?? breakdown?.totalScore ?? 0;
  const trend       = breakdown?.trend        ?? 'stable';
  const changeAmt   = breakdown?.changeAmount ?? 0;
  const lastUpdated = breakdown?.lastUpdated  ?? new Date().toISOString();

  // Explainability — only when we have both mfs and lead
  const expl = mfs && lead ? explainScore(lead, mfs) : null;

  // Feedback state
  const [feedbackMark] = useState<FeedbackType | null>(
    () => lead ? getFeedbackState(lead.id) : null,
  );

  return (
    <div className="space-y-6">
      {/* ── Header: overall score ────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-1">Lead Score</h2>
            <p className="text-blue-100 text-sm">
              Last updated: {new Date(lastUpdated).toLocaleString()}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {mfs && (
                <span className="text-xs px-2 py-0.5 bg-white/20 rounded-full font-medium">
                  {mfs.overallBandLabel} · Multi-factor
                </span>
              )}
              {expl && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${CONF_CLS[expl.confidenceLevel]}`}>
                  {CONF_LABEL[expl.confidenceLevel]}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-5xl font-bold">{totalScore}</p>
            <p className="text-sm mt-1">/ 100 points</p>
          </div>
        </div>
        {breakdown && (
          <div className="mt-4 pt-4 border-t border-blue-500 flex items-center justify-between">
            <span className="text-sm text-blue-100">Change from last week</span>
            <div className={`flex items-center gap-1 ${trendCls(trend)}`}>
              {trendIcon(trend)}
              <span className="font-semibold">
                {changeAmt > 0 ? '+' : ''}{changeAmt} points
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Fallback warning banner ──────────────────────────────────────── */}
      {expl?.fallbackMessage && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <span>{expl.fallbackMessage}</span>
        </div>
      )}

      {/* ── Dimension cards ──────────────────────────────────────────────── */}
      {mfs ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MFDimCard dimKey="fit"        score={mfs.fitScore.score}        band={mfs.fitScore.bandLabel}        detail={mfs.fitScore.detail} />
          <MFDimCard dimKey="intent"     score={mfs.intentScore.score}     band={mfs.intentScore.bandLabel}     detail={mfs.intentScore.detail} />
          <MFDimCard dimKey="engagement" score={mfs.engagementScore.score} band={mfs.engagementScore.bandLabel} detail={mfs.engagementScore.detail} />
          <MFDimCard dimKey="confidence" score={mfs.confidenceScore.score} band={mfs.confidenceScore.bandLabel} detail={mfs.confidenceScore.detail} />
        </div>
      ) : breakdown ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <LegacyCard component={breakdown.engagementScore} dimKey="engagement" />
          <LegacyCard component={breakdown.fitScore}        dimKey="fit" />
          <LegacyCard component={breakdown.intentScore}     dimKey="intent" />
          {breakdown.confidenceScore && (
            <LegacyCard component={breakdown.confidenceScore} dimKey="confidence" />
          )}
        </div>
      ) : null}

      {/* ── Explainability section (only when lead is available) ─────────── */}
      {expl && (
        <div className="space-y-4">
          <SectionDivider label="Why this score?" />

          {/* Confidence detail */}
          <div className="flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-xs text-gray-600">
            <Info size={13} className="text-gray-400 shrink-0 mt-0.5" />
            <span>{expl.confidenceReason}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Positive drivers */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-3">
                What's working
              </p>
              {expl.positiveDrivers.length > 0 ? (
                <div className="space-y-2.5">
                  {expl.positiveDrivers.map((d, i) => <DriverRow key={i} driver={d} />)}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No strong positive signals yet.</p>
              )}
            </div>

            {/* Negative drivers */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-3">
                What's dragging it down
              </p>
              {expl.negativeDrivers.length > 0 ? (
                <div className="space-y-2.5">
                  {expl.negativeDrivers.map((d, i) => <DriverRow key={i} driver={d} />)}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No major negative signals.</p>
              )}
            </div>
          </div>

          {/* Activity signals */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
              Activity Signals
            </p>
            <div className="space-y-1.5">
              {expl.activitySignals.map((s, i) => <SignalRow key={i} signal={s} />)}
            </div>
          </div>
        </div>
      )}

      {/* ── Feedback section ─────────────────────────────────────────────── */}
      {lead && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <ScoreFeedbackControls
            lead={lead}
            initial={feedbackMark}
          />
        </div>
      )}

      {/* ── Legend ───────────────────────────────────────────────────────── */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Score Dimensions</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-700">
          {(Object.keys(DIM_META) as DimKey[]).map(k => (
            <div key={k}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className={`w-2.5 h-2.5 rounded ${DIM_META[k].bar}`} />
                <span className="font-semibold">{DIM_META[k].label}</span>
              </div>
              <p className="text-gray-500 leading-snug">{DIM_META[k].description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeadScoreBreakdownPanel;
