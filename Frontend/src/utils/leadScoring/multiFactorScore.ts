import type { Lead } from '../../types/lead';
import { LeadScoringEngine } from '../leadScoring';

// ── Dimension weights ─────────────────────────────────────────────────────────
// Adjust here to rebalance the overall score without touching logic.
const WEIGHTS = {
  fit:        0.35,
  intent:     0.25,
  engagement: 0.30,
  confidence: 0.10,
} as const;

// ── Types ─────────────────────────────────────────────────────────────────────

export type ScoreBand = 'low' | 'medium' | 'high' | 'very_high';

export interface MultiFactorDim {
  /** Normalized 0–100 */
  score: number;
  band: ScoreBand;
  bandLabel: string;
  /** Human-readable summary of contributing factors */
  detail: string;
}

export interface MultiFactorScore {
  /** Ideal-customer-profile alignment: job title, company size, industry/demo */
  fitScore: MultiFactorDim;
  /** Purchase intent proxy: meetings, calls, page views */
  intentScore: MultiFactorDim;
  /** Communication engagement: email opens/clicks, activity recency */
  engagementScore: MultiFactorDim;
  /** Data completeness — reliability discount on the overall score */
  confidenceScore: MultiFactorDim;
  /** Weighted blend of all 4 dimensions, 0–100 */
  overallScore: number;
  overallBand: ScoreBand;
  overallBandLabel: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreBand(n: number): ScoreBand {
  if (n >= 75) return 'very_high';
  if (n >= 50) return 'high';
  if (n >= 25) return 'medium';
  return 'low';
}

const BAND_LABELS: Record<ScoreBand, string> = {
  low:       'Low',
  medium:    'Medium',
  high:      'High',
  very_high: 'Very High',
};

function normalize(points: number, max: number): number {
  if (max === 0) return 0;
  return Math.round(Math.min((points / max) * 100, 100));
}

function dim(points: number, max: number, detail: string): MultiFactorDim {
  const score = normalize(points, max);
  const band  = scoreBand(score);
  return { score, band, bandLabel: BAND_LABELS[band], detail };
}

// ── Public API ────────────────────────────────────────────────────────────────

export function computeMultiFactorScore(lead: Lead): MultiFactorScore {
  const { factors } = LeadScoringEngine.calculateDetailedScore(lead);

  const byName = new Map(factors.map(f => [f.name, f]));

  // Fit = job_title (max 20) + company_size (max 15) + demographics (max 5) → 40 pts
  const fitPts = (byName.get('Job Title')?.points       ?? 0)
               + (byName.get('Company Size')?.points     ?? 0)
               + (byName.get('Demographics')?.points     ?? 0);
  const fit = dim(fitPts, 40,
    `${byName.get('Job Title')?.description ?? '—'} · ${byName.get('Company Size')?.description ?? '—'}`);

  // intentScore: currently derived from engagement_depth (calls, demos, emails logged).
  // Replace with real intent signals (page visits, content downloads, pricing page views)
  // when available from enrichment data.
  const intentPts = byName.get('Engagement Depth')?.points ?? 0;
  const intent = dim(intentPts, 15,
    byName.get('Engagement Depth')?.description ?? '—');

  // Engagement = email_engagement (max 20) + activity_recency (max 15) → 35 pts
  const engPts = (byName.get('Email Engagement')?.points  ?? 0)
               + (byName.get('Activity Recency')?.points   ?? 0);
  const engagement = dim(engPts, 35,
    `${byName.get('Email Engagement')?.description ?? '—'} · ${byName.get('Activity Recency')?.description ?? '—'}`);

  // Confidence = data_completeness (max 10)
  const confPts = byName.get('Data Completeness')?.points ?? 0;
  const confidence = dim(confPts, 10,
    byName.get('Data Completeness')?.description ?? '—');

  // Weighted overall — confidence also acts as a reliability discount:
  // a low confidence score pulls the weighted sum down naturally via its own weight.
  const rawOverall =
    fit.score        * WEIGHTS.fit        +
    intent.score     * WEIGHTS.intent     +
    engagement.score * WEIGHTS.engagement +
    confidence.score * WEIGHTS.confidence;

  const overallScore = Math.round(Math.min(rawOverall, 100));
  const overallBand  = scoreBand(overallScore);

  return {
    fitScore:        fit,
    intentScore:     intent,
    engagementScore: engagement,
    confidenceScore: confidence,
    overallScore,
    overallBand,
    overallBandLabel: BAND_LABELS[overallBand],
  };
}

export { BAND_LABELS, scoreBand };
