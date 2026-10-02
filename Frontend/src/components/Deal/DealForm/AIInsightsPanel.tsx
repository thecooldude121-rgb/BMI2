import React from 'react';
import { Sparkles, Info } from 'lucide-react';
import { formatDisplayDate } from '../../../utils/dateUtils';
import { useStageLookup } from '../../../hooks/useStageLookup';

interface AIInsightsPanelProps {
  formData: any;
  winProbOverrideEnabled: boolean;
  winProbOverrideValue: number | '';
  winProbOverrideReason: string;
}

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({
  formData,
  winProbOverrideEnabled,
  winProbOverrideValue,
  winProbOverrideReason,
}) => {
// Stages come from the workspace via useStageLookup, not from the hardcoded
// catalogue in config/pipelines.ts. A stage an admin adds is usable here
// immediately; one they retire stops being described here. `?? 20` used to be
// the fallback when a stage was unknown — a made-up probability presented as the
// deal's — so an unresolvable stage now reads as "not set" instead.
  const { lookup: stageLookup } = useStageLookup();
  const stageProbability =
    stageLookup(formData.stage, formData.pipelineId ?? null)?.probability ?? null;
  // EVIDENCE-BASED AI (CLAUDE.md, 2026-10-03): the score shown is the stage
  // probability the workspace configured, and that is its whole reason. An
  // "AI Score" used to sit here — the stage baseline plus FIXED boosts (+10/+15
  // for buyer roles, +5 for a hardcoded 40K-60K "sweet spot", -8 "competitor
  // risk" for lead-gen sources) with a factor list presented as analysis. Those
  // reasons were not computed from anything, so the score is not shown.
  const primaryProbability = stageProbability ?? 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center space-x-2 mb-4">
        <Sparkles className="h-6 w-6 text-purple-600" />
        <h2 className="text-lg font-bold text-gray-900">DEAL INSIGHTS</h2>
      </div>

      <p className="text-sm text-gray-600 mb-4">Based on form data so far:</p>

      <div className="space-y-4">
        {/* Win Probability — the rep's override if set, otherwise the stage baseline */}
        <div>
          {winProbOverrideEnabled && winProbOverrideValue !== '' ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-gray-700">Win Probability</span>
                  <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                    Rep Override
                  </span>
                </div>
                <span className="text-2xl font-bold text-indigo-600">{winProbOverrideValue}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    Number(winProbOverrideValue) >= 70 ? 'bg-green-500' :
                    Number(winProbOverrideValue) >= 40 ? 'bg-blue-500' :
                    'bg-amber-500'
                  }`}
                  style={{ width: `${winProbOverrideValue}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-gray-400 text-right">
                Stage baseline: {stageProbability === null ? 'not set' : `${primaryProbability}%`}
              </div>
              {winProbOverrideReason && (
                <div className="mt-2 text-xs text-gray-500 italic">
                  "{winProbOverrideReason}"
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-gray-700">Win Probability</span>
                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded">
                    Stage Baseline
                  </span>
                  <div className="relative group">
                    <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                    <div className="absolute left-0 bottom-5 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 leading-relaxed">
                      The probability your workspace set for this stage in Pipeline Settings. It is not adjusted by anything else on this form.
                    </div>
                  </div>
                </div>
                <span className="text-2xl font-bold text-blue-600">{primaryProbability}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${primaryProbability}%` }}
                />
              </div>
            </>
          )}
        </div>


        <div className="pt-4 border-t border-gray-200">
          <div className="text-sm font-semibold text-gray-700 mb-2">Timeline:</div>
          <div className="space-y-1 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>• Expected Close:</span>
              <span className="font-medium">
                {formatDisplayDate(formData.closeDate)}
              </span>
            </div>
          </div>
          {/* "Confidence 78%", "Estimated Cycle 42 days" and a "Similar Deals"
              block ("3 similar deals", avg value, cycle, "72%" win rate) were
              literals rendered as a prediction about THIS deal. Removed
              2026-10-03 — Evidence-Based AI: no score without the reasons that
              produced it, and nothing produced these. */}
        </div>
      </div>
    </div>
  );
};
