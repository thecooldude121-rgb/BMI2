import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, TrendingUp, TrendingDown, Minus, AlertTriangle, Info, Sliders } from 'lucide-react';
import type { Lead } from '../../types/lead';
import type { MultiFactorScore } from '../../utils/leadScoring/multiFactorScore';
import type {
  ScoreExplanation,
  ScoreDriver,
  ActivitySignal,
  ConfidenceLevel,
} from '../../utils/leadScoring/scoreExplainer';
import { FEEDBACK_META, type FeedbackType } from '../../utils/leadScoring/scoreFeedback';
import ScoreFeedbackControls from './ScoreFeedbackControls';
import type { NBAResult, NBAPriority } from '../../utils/leadNBA/engine';

// ── Color tokens ──────────────────────────────────────────────────────────────

const DIM_META = {
  fit:        { label: 'Fit',        bar: 'bg-blue-500',   text: 'text-blue-700'   },
  intent:     { label: 'Intent',     bar: 'bg-purple-500', text: 'text-purple-700' },
  engagement: { label: 'Engagement', bar: 'bg-green-500',  text: 'text-green-700'  },
  confidence: { label: 'Confidence', bar: 'bg-gray-400',   text: 'text-gray-500'   },
} as const;

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

const NBA_CARD_CLS: Record<NBAPriority, string> = {
  urgent: 'bg-red-50   border-red-200',
  high:   'bg-amber-50 border-amber-200',
  medium: 'bg-blue-50  border-blue-200',
  low:    'bg-gray-50  border-gray-200',
};

const NBA_BADGE_CLS: Record<NBAPriority, string> = {
  urgent: 'bg-red-100   text-red-700   border-red-300',
  high:   'bg-amber-100 text-amber-700 border-amber-300',
  medium: 'bg-blue-100  text-blue-700  border-blue-300',
  low:    'bg-gray-100  text-gray-600  border-gray-300',
};

const NBA_PRIORITY_LABEL: Record<NBAPriority, string> = {
  urgent: 'Urgent',
  high:   'High priority',
  medium: 'Medium',
  low:    'Low priority',
};

// ── Sub-components ────────────────────────────────────────────────────────────

function DimBar({
  label, score, band, barCls, textCls,
}: { label: string; score: number; band: string; barCls: string; textCls: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-gray-700">{label}</span>
        <span className={`font-semibold ${textCls}`}>
          {score}
          <span className="text-gray-400 font-normal ml-1">— {band}</span>
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${barCls} rounded-full transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function DriverRow({ driver }: { driver: ScoreDriver }) {
  const pos = driver.impact === 'positive';
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className={`mt-0.5 shrink-0 font-bold text-sm leading-none ${pos ? 'text-green-500' : 'text-red-400'}`}>
        {pos ? '✓' : '✗'}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-gray-800 truncate">{driver.label}</span>
          <span className={`text-[10px] font-bold shrink-0 tabular-nums ${pos ? 'text-green-600' : 'text-red-500'}`}>
            {driver.pts}/{driver.maxPts} pts
          </span>
        </div>
        <p className="text-[10px] text-gray-500 leading-relaxed">{driver.detail}</p>
      </div>
    </div>
  );
}

function SignalRow({ signal }: { signal: ActivitySignal }) {
  const icon =
    signal.direction === 'up'   ? <TrendingUp  size={11} className="text-green-500 shrink-0 mt-0.5" /> :
    signal.direction === 'down' ? <TrendingDown size={11} className="text-red-400   shrink-0 mt-0.5" /> :
                                  <Minus        size={11} className="text-gray-400  shrink-0 mt-0.5" />;
  return (
    <div className="flex items-start gap-2 text-xs text-gray-600">
      {icon}
      <span>{signal.label}</span>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{children}</p>
  );
}

// ── Drawer panel (portal target) ──────────────────────────────────────────────

interface DrawerProps {
  lead:              Lead;
  mfs:               MultiFactorScore;
  explanation:       ScoreExplanation;
  nbaResult?:        NBAResult;
  onClose:           () => void;
  initialFeedback?:  FeedbackType | null;
  onFeedbackSubmit?: (type: FeedbackType) => void;
}

function DrawerPanel({
  lead, mfs, explanation, nbaResult, onClose, initialFeedback, onFeedbackSubmit,
}: DrawerProps) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const displayName = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || lead.email || 'Lead';
  const { positiveDrivers, negativeDrivers, confidenceLevel, confidenceReason, activitySignals, fallbackMessage, playbookNote } = explanation;

  return (
    <>
      {/* Scrim */}
      <div
        className={`fixed inset-0 bg-black/25 z-40 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-[400px] bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-sm font-bold text-gray-900 truncate">Score Explanation</h2>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${CONF_CLS[confidenceLevel]}`}>
                {CONF_LABEL[confidenceLevel]}
              </span>
            </div>
            <p className="text-xs text-gray-500 truncate">{displayName}</p>
            {lead.company && <p className="text-[10px] text-gray-400 truncate">{lead.company}</p>}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 ml-3 p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Scrollable body ──────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Next Best Action */}
          {nbaResult && (
            <div className={`rounded-lg border px-3 py-3 ${NBA_CARD_CLS[nbaResult.priority]}`}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  Next Best Action
                </p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${NBA_BADGE_CLS[nbaResult.priority]}`}>
                  {NBA_PRIORITY_LABEL[nbaResult.priority]}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1">{nbaResult.action.label}</p>
              <p className="text-xs text-gray-600 leading-relaxed">{nbaResult.reason}</p>
            </div>
          )}

          {/* Overall score chip */}
          <div className="flex items-center gap-3">
            <div className={`text-4xl font-extrabold ${
              mfs.overallScore >= 75 ? 'text-blue-600' :
              mfs.overallScore >= 50 ? 'text-green-600' :
              mfs.overallScore >= 25 ? 'text-amber-500' : 'text-red-500'
            }`}>
              {mfs.overallScore}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700">{mfs.overallBandLabel}</p>
              <p className="text-[10px] text-gray-400">Overall score</p>
            </div>
          </div>

          {/* Fallback banner */}
          {fallbackMessage && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-800">
              <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />
              <span>{fallbackMessage}</span>
            </div>
          )}

          {/* Playbook note */}
          {playbookNote && (
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-xs text-blue-800">
              <Sliders size={12} className="text-blue-500 shrink-0 mt-0.5" />
              <span>{playbookNote}</span>
            </div>
          )}

          {/* Confidence reason */}
          <div className="flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600">
            <Info size={12} className="text-gray-400 shrink-0 mt-0.5" />
            <span>{confidenceReason}</span>
          </div>

          {/* Dimensions */}
          <div>
            <SectionHeading>Score Dimensions</SectionHeading>
            <div className="space-y-3">
              <DimBar label={DIM_META.fit.label}        score={mfs.fitScore.score}        band={mfs.fitScore.bandLabel}        barCls={DIM_META.fit.bar}        textCls={DIM_META.fit.text} />
              <DimBar label={DIM_META.intent.label}     score={mfs.intentScore.score}     band={mfs.intentScore.bandLabel}     barCls={DIM_META.intent.bar}     textCls={DIM_META.intent.text} />
              <DimBar label={DIM_META.engagement.label} score={mfs.engagementScore.score} band={mfs.engagementScore.bandLabel} barCls={DIM_META.engagement.bar} textCls={DIM_META.engagement.text} />
              <DimBar label={DIM_META.confidence.label} score={mfs.confidenceScore.score} band={mfs.confidenceScore.bandLabel} barCls={DIM_META.confidence.bar} textCls={DIM_META.confidence.text} />
            </div>
          </div>

          {/* Positive drivers */}
          {positiveDrivers.length > 0 && (
            <div>
              <SectionHeading>What's working</SectionHeading>
              <div className="space-y-2.5">
                {positiveDrivers.map((d, i) => <DriverRow key={i} driver={d} />)}
              </div>
            </div>
          )}

          {/* Negative drivers */}
          {negativeDrivers.length > 0 && (
            <div>
              <SectionHeading>What's dragging it down</SectionHeading>
              <div className="space-y-2.5">
                {negativeDrivers.map((d, i) => <DriverRow key={i} driver={d} />)}
              </div>
            </div>
          )}

          {positiveDrivers.length === 0 && negativeDrivers.length === 0 && (
            <p className="text-xs text-gray-400 italic">
              No strong drivers found — profile may need more data.
            </p>
          )}

          {/* Activity signals */}
          <div>
            <SectionHeading>Activity Signals</SectionHeading>
            <div className="space-y-1.5">
              {activitySignals.map((s, i) => <SignalRow key={i} signal={s} />)}
            </div>
          </div>

          {/* Feedback */}
          <div className="border-t border-gray-200 pt-4">
            <ScoreFeedbackControls
              lead={lead}
              initial={initialFeedback}
              onSubmit={onFeedbackSubmit}
            />
          </div>
        </div>
      </div>
    </>
  );
}

// ── Portal wrapper ────────────────────────────────────────────────────────────

interface ScoreExplainabilityDrawerProps extends DrawerProps {
  isOpen: boolean;
}

export default function ScoreExplainabilityDrawer({
  isOpen, ...rest
}: ScoreExplainabilityDrawerProps) {
  if (!isOpen) return null;
  return createPortal(<DrawerPanel {...rest} />, document.body);
}
