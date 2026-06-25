import type { Lead } from '../../types/lead';
import { LeadScoringEngine } from '../leadScoring';
import { computeMultiFactorScore } from './multiFactorScore';
import type { MultiFactorScore } from './multiFactorScore';
import { getPlaybook, hasNonTrivialBias } from '../leadSourcePlaybook';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ScoreDriver {
  label:  string;
  impact: 'positive' | 'negative';
  pts:    number;
  maxPts: number;
  /** pts / maxPts × 100, rounded */
  pct:    number;
  detail: string;
}

export interface ActivitySignal {
  label:     string;
  direction: 'up' | 'down' | 'neutral';
}

export interface ScoreExplanation {
  positiveDrivers:  ScoreDriver[];
  negativeDrivers:  ScoreDriver[];
  confidenceLevel:  ConfidenceLevel;
  confidenceReason: string;
  activitySignals:  ActivitySignal[];
  /** Non-null when confidenceScore < 33 — rendered as amber warning banner */
  fallbackMessage:  string | null;
  /** Non-null when the lead's source playbook applies non-trivial weight adjustments */
  playbookNote:     string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysSince(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  return d >= 0 ? d : null;
}

function fmtDays(d: number): string {
  if (d === 0) return 'today';
  if (d === 1) return '1 day ago';
  if (d < 7)  return `${d} days ago`;
  if (d < 14) return '1 week ago';
  const w = Math.floor(d / 7);
  if (w < 5)  return `${w} weeks ago`;
  const m = Math.floor(d / 30);
  return `${m} month${m > 1 ? 's' : ''} ago`;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Derives a structured explanation from the existing LeadScoringEngine factors.
 * Pass `mfs` when already computed to skip redundant calculateDetailedScore call.
 */
export function explainScore(lead: Lead, mfs?: MultiFactorScore): ScoreExplanation {
  const { factors } = LeadScoringEngine.calculateDetailedScore(lead);
  const resolvedMfs = mfs ?? computeMultiFactorScore(lead);

  // ── Driver classification ──────────────────────────────────────────────────
  // Positive: earns ≥60% of max points (and max ≥ 5 to exclude trivial factors)
  // Negative: earns ≤30% of max points (same floor)
  const positive: ScoreDriver[] = [];
  const negative: ScoreDriver[] = [];

  for (const f of factors) {
    if (f.maxPoints < 5) continue;
    const ratio = f.points / f.maxPoints;
    const driver: ScoreDriver = {
      label:  f.name,
      impact: ratio >= 0.6 ? 'positive' : 'negative',
      pts:    f.points,
      maxPts: f.maxPoints,
      pct:    Math.round(ratio * 100),
      detail: f.description,
    };
    if (ratio >= 0.6) positive.push(driver);
    else if (ratio <= 0.3) negative.push(driver);
  }

  // Sort: positive by points earned (best first), negative by missed points (worst first)
  positive.sort((a, b) => b.pts - a.pts);
  negative.sort((a, b) => (b.maxPts - b.pts) - (a.maxPts - a.pts));

  // ── Confidence ─────────────────────────────────────────────────────────────
  const confPct = resolvedMfs.confidenceScore.score;
  let confidenceLevel: ConfidenceLevel;
  let confidenceReason: string;
  if (confPct >= 66) {
    confidenceLevel  = 'high';
    confidenceReason = 'Profile is well-filled — score is reliable.';
  } else if (confPct >= 33) {
    confidenceLevel  = 'medium';
    confidenceReason = 'Moderate data available — some factors may be estimated.';
  } else {
    confidenceLevel  = 'low';
    confidenceReason = 'Key fields are missing — add company, title, and contact info.';
  }

  // ── Activity signals ───────────────────────────────────────────────────────
  // Derived from count/timestamp fields. These are cumulative totals, not deltas,
  // but they reflect the lead's observable engagement state.
  const signals: ActivitySignal[] = [];

  const actDays = daysSince(lead.last_activity_date);
  if (actDays !== null) {
    if (actDays <= 3) {
      signals.push({ label: `Activity logged ${fmtDays(actDays)}`, direction: 'up' });
    } else if (actDays > 21) {
      signals.push({ label: `No activity for ${actDays} days`, direction: 'down' });
    } else {
      signals.push({ label: `Last activity: ${fmtDays(actDays)}`, direction: 'neutral' });
    }
  }

  const meets = lead.meeting_count ?? 0;
  if (meets > 0) {
    signals.push({ label: `${meets} meeting${meets > 1 ? 's' : ''} logged`, direction: 'up' });
  }

  const opens = lead.email_opens_count ?? 0;
  const sent  = lead.email_sent_count  ?? 0;
  if (opens > 0) {
    signals.push({ label: `${opens} email open${opens > 1 ? 's' : ''}`, direction: 'up' });
  } else if (sent > 0) {
    signals.push({ label: `${sent} email${sent > 1 ? 's' : ''} sent, no opens`, direction: 'down' });
  }

  const calls = lead.call_count ?? 0;
  if (calls > 0 && signals.length < 3) {
    signals.push({ label: `${calls} call${calls > 1 ? 's' : ''} logged`, direction: 'up' });
  }

  const activitySignals = signals.slice(0, 3);
  if (activitySignals.length === 0) {
    activitySignals.push({ label: 'No recent activity to report', direction: 'neutral' });
  }

  // ── Fallback ───────────────────────────────────────────────────────────────
  const fallbackMessage = confPct < 33
    ? 'Limited profile data — fill in company, title, and contact details to unlock a reliable score.'
    : null;

  // Playbook note — shown when source-specific weight adjustments are in effect
  const playbook = getPlaybook(lead.source);
  let playbookNote: string | null = null;
  if (hasNonTrivialBias(playbook)) {
    const biasEntries = Object.entries(playbook.scoreWeightBias)
      .filter(([, v]) => v !== undefined && Math.abs((v as number) - 1.0) > 0.05)
      .map(([dim, v]) => {
        const pct  = Math.round(Math.abs((v as number) - 1.0) * 100);
        const dir  = (v as number) > 1 ? 'higher' : 'lower';
        return `${dim} weighted ${pct}% ${dir}`;
      });
    playbookNote = `Source-adjusted weights applied (${playbook.displayName}): ${biasEntries.join(', ')}.`;
  }

  return {
    positiveDrivers:  positive.slice(0, 3),
    negativeDrivers:  negative.slice(0, 3),
    confidenceLevel,
    confidenceReason,
    activitySignals,
    fallbackMessage,
    playbookNote,
  };
}
