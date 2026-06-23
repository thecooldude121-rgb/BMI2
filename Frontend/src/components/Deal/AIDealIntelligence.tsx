import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, AlertTriangle, CheckCircle2, Target, Bot, ChevronDown } from 'lucide-react';

interface AIInsight {
  type: 'positive' | 'warning';
  text: string;
  impact: string;
}

interface NextAction {
  priority: 'high' | 'medium' | 'low';
  title: string;
  reason: string;
  suggestion: string;
  actions: string[];
  competitor?: string;
}

interface ScoreBreakdownItem {
  category: string;
  score: number;
  stars: number;
}

interface AIDealIntelligenceProps {
  dealName?: string;
  winProbability: number;
  winProbAI?: number;
  winProbConfidence?: number;
  winProbOverrideReason?: string;
  healthScore: number;
  scoreBreakdown?: ScoreBreakdownItem[];
  insights: {
    positive: AIInsight[];
    warnings: AIInsight[];
  };
  nextActions: NextAction[];
  historicalData: string;
  onSendEmail?: (to: string, subject: string, body: string) => void;
  onScheduleCall?: () => void;
  onScheduleMeeting?: () => void;
  onFindBestTime?: () => void;
  onViewBattleCard?: (competitor: string) => void;
  showOnlyNextBestActions?: boolean;
  maxActions?: number;
  stageNumber?: number;
}

export const AIDealIntelligence: React.FC<AIDealIntelligenceProps> = ({
  dealName,
  winProbability,
  winProbAI,
  winProbConfidence,
  winProbOverrideReason,
  healthScore,
  scoreBreakdown = [],
  insights,
  nextActions,
  historicalData,
  onSendEmail,
  onScheduleCall,
  onScheduleMeeting,
  onFindBestTime,
  onViewBattleCard,
  showOnlyNextBestActions = false,
  maxActions,
  stageNumber = 1,
}) => {
  const navigate = useNavigate();
  const [showScoreFactors, setShowScoreFactors] = useState(false);
  const [healthBarWidth, setHealthBarWidth] = useState(0);

  // Animate health bar whenever healthScore changes (fires on API load too)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setHealthBarWidth(healthScore));
    return () => cancelAnimationFrame(raf);
  }, [healthScore]);

  // Fallback factors when scoreBreakdown is empty
  const fallbackFactors = [
    { category: 'High contact engagement (92% response)', score: 20, stars: 5 },
    { category: 'Budget confirmed ($50K available)',       score: 15, stars: 4 },
    { category: 'Stage progression on track',             score: 12, stars: 4 },
    { category: 'Decision maker involved (VP level)',     score: 10, stars: 3 },
    { category: 'No activity in 5 days',                  score: -12, stars: 2 },
    { category: 'Competitor mentioned (Salesforce)',       score: -8,  stars: 2 },
  ];
  const effectiveBreakdown = scoreBreakdown.length > 0 ? scoreBreakdown : fallbackFactors;
  const positiveFactors = effectiveBreakdown.filter(f => f.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
  const negativeFactors = effectiveBreakdown.filter(f => f.score < 0).sort((a, b) => a.score - b.score).slice(0, 2);

  const engagementEntry = effectiveBreakdown.find(f => f.category?.toLowerCase().includes('engagement'));
  const derivedEngagementScore = engagementEntry?.score ? Math.min(Math.abs(engagementEntry.score) * 4, 100) : 70;
  const stageProgressPct = (Math.max(stageNumber, 1) / 6) * 100;
  const winProb = winProbAI || winProbability || 45;
  const dealQualityScore = Math.round((winProb * 0.5) + (derivedEngagementScore * 0.3) + (stageProgressPct * 0.2));

  const getWinProbabilityColor = (prob: number) => {
    if (prob >= 75) return 'bg-green-500';
    if (prob >= 50) return 'bg-blue-500';
    if (prob >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getWinProbabilityText = (prob: number) => {
    if (prob >= 75) return 'Highly Likely to Close';
    if (prob >= 50) return 'Likely to Close';
    if (prob >= 25) return 'Moderate Chance';
    return 'At Risk';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStars = (count: number) => '⭐'.repeat(count) + '☆'.repeat(5 - count);

  // Priority card styling: border color IS the priority signal (item 22)
  const getPriorityCardClass = (priority: string) => {
    if (priority === 'high')   return 'border-l-4 border-red-500 bg-red-50';
    if (priority === 'medium') return 'border-l-4 border-amber-400 bg-amber-50';
    return 'border-l-4 border-gray-300 bg-white';
  };

  if (showOnlyNextBestActions) {
    const visibleActions = maxActions ? nextActions.slice(0, maxActions) : nextActions;
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <h3 className="text-[15px] font-semibold text-gray-900 mb-2.5">Next Best Actions (AI-Recommended)</h3>
        <div className="space-y-4">
          {visibleActions.map((action, idx) => (
            <div key={idx} className={`rounded-lg p-4 border ${getPriorityCardClass(action.priority)}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-gray-700">{idx + 1}.</span>
                  <Target className="h-5 w-5 text-gray-600" />
                  <span className="font-bold text-gray-900">{action.title}</span>
                </div>
              </div>
              <div className="ml-8 space-y-2">
                <div className="text-sm text-gray-700"><span className="font-semibold">Why:</span> {action.reason}</div>
                <div className="text-sm text-gray-700"><span className="font-semibold">Suggested:</span> "{action.suggestion}"</div>
                <div className="flex items-center space-x-2 mt-3">
                  {action.actions.map((actionBtn, btnIdx) => {
                    const handleClick = () => {
                      if (actionBtn === 'Send Email' && onSendEmail) onSendEmail('john@acme.com', 'Following up on proposal', 'Hi John,\n\n');
                      else if (actionBtn === 'Schedule Call' && onScheduleCall) onScheduleCall();
                      else if (actionBtn === 'Schedule Meeting' && onScheduleMeeting) onScheduleMeeting();
                      else if (actionBtn === 'AI Find Best Time' && onFindBestTime) onFindBestTime();
                      else if (actionBtn === 'Send Case Study' && onSendEmail) onSendEmail('john@acme.com', 'ROI Case Study', 'Hi John,\n\n');
                      else if (actionBtn === 'Draft Email' && onSendEmail) onSendEmail('john@acme.com', 'Introduction to CEO', 'Hi John,\n\n');
                      else if (actionBtn === 'View Battle Card' && onViewBattleCard) onViewBattleCard(action.competitor ?? 'Salesforce');
                    };
                    return (
                      <button key={btnIdx} onClick={handleClick}
                        className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs rounded-lg hover:bg-gray-50 font-medium transition-colors">
                        {actionBtn}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3">
      <div className="flex items-center space-x-2 mb-3">
        <Sparkles className="h-5 w-5 text-purple-600" />
        <h2 className="text-[15px] font-semibold text-gray-900">AI Deal Analysis</h2>
        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[9px] font-bold rounded">UNIQUE DIFFERENTIATOR</span>
      </div>

      {/* Win Probability */}
      <div className="mb-4">
        {/* Determine if this deal has a rep override */}
        {winProbOverrideReason ? (
          <>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-semibold text-gray-900">Win Probability</h3>
                <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                  Rep Override
                </span>
              </div>
              <span className="text-3xl font-bold text-indigo-600">{winProbability}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
              <div
                className={`h-4 rounded-full transition-all duration-300 ${getWinProbabilityColor(winProbability)}`}
                style={{ width: `${winProbability}%` }}
              />
            </div>
            <div className="text-sm font-medium text-gray-700 mb-1">
              {getWinProbabilityText(winProbability)}
            </div>
            {winProbAI !== undefined && winProbAI !== winProbability && (
              <div className="text-xs text-gray-400 mb-2">
                AI suggested: {winProbAI}%
              </div>
            )}
            <div className="text-sm text-gray-500 italic border-l-2 border-indigo-200 pl-3 py-1">
              "{winProbOverrideReason}"
            </div>
          </>
        ) : (
          <>
            {/* Single compact row: label · value · confidence badge */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-semibold text-gray-900">Win Probability</h3>
                {winProbConfidence !== undefined && (
                  <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-medium rounded-full">
                    {winProbConfidence}% confidence ↑
                  </span>
                )}
              </div>
              <span className="text-[28px] font-bold text-blue-600 leading-none">{winProbAI ?? winProbability}%</span>
            </div>
            {/* Progress bar with inline "Likely to Close" label */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getWinProbabilityColor(winProbAI ?? winProbability)}`}
                  style={{ width: `${winProbAI ?? winProbability}%` }}
                />
              </div>
              <span className="text-[11px] text-gray-500 whitespace-nowrap flex-shrink-0">
                {getWinProbabilityText(winProbAI ?? winProbability)}
              </span>
            </div>
          </>
        )}

        {/* Based on factors */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-xs font-medium text-gray-500 mb-1.5">Based on:</div>
          <div className="space-y-1.5">
            {insights.positive.map((insight, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-xs text-gray-900 flex-1">{insight.text}</span>
                <span className="text-[10px] font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full flex-shrink-0">{insight.impact}</span>
              </div>
            ))}
            {insights.warnings.map((insight, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                <span className="text-xs text-gray-900 flex-1">{insight.text}</span>
                <span className="text-[10px] font-medium text-yellow-700 bg-yellow-50 px-1.5 py-0.5 rounded-full flex-shrink-0">{insight.impact}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="text-[11px] text-gray-400">{historicalData}</div>
          </div>
        </div>
      </div>

      {/* Data Completeness + Deal Quality — two side-by-side cards */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <div className="grid grid-cols-2 gap-3">

          {/* LEFT — Data Completeness */}
          <div className="rounded-xl border border-gray-200 bg-white p-3 flex flex-col gap-2">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Data Completeness</p>
            <div className="flex items-end gap-1.5">
              <span className={`text-[28px] font-bold leading-none ${
                healthScore >= 80 ? 'text-emerald-600' : healthScore >= 60 ? 'text-blue-600' : healthScore >= 40 ? 'text-amber-600' : 'text-red-600'
              }`}>
                {healthScore}
              </span>
              <span className="text-xs text-gray-400 mb-1">/100</span>
            </div>
            {/* Solid emerald bar */}
            <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${healthBarWidth}%` }}
              />
            </div>
            <p className="text-[11px] text-gray-500 leading-snug">
              {healthScore >= 90
                ? 'All required CRM fields filled'
                : healthScore >= 70
                ? 'Most fields complete — a few gaps'
                : 'Several key fields are missing'}
            </p>
          </div>

          {/* RIGHT — Deal Quality */}
          <div className="rounded-xl border border-gray-200 bg-white p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Deal Quality</p>
              <button
                type="button"
                onClick={() => setShowScoreFactors(v => !v)}
                className="p-0.5 rounded hover:bg-gray-100 transition-colors"
                title="Show score breakdown"
              >
                <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${showScoreFactors ? 'rotate-180' : ''}`} />
              </button>
            </div>
            <div className="flex items-end gap-1.5">
              <span className={`text-[28px] font-bold leading-none ${
                dealQualityScore >= 75 ? 'text-green-600' : dealQualityScore >= 50 ? 'text-blue-600' : dealQualityScore >= 30 ? 'text-amber-600' : 'text-red-600'
              }`}>
                {dealQualityScore}
              </span>
              <span className="text-xs text-gray-400 mb-1">/100</span>
            </div>
            {/* Tricolor gradient bar */}
            <div className="w-full h-1.5 rounded-full overflow-hidden bg-gray-100 relative">
              <div
                className="absolute inset-0 rounded-full"
                style={{ background: 'linear-gradient(to right, #EF4444 0%, #EF4444 40%, #F59E0B 40%, #F59E0B 70%, #22C55E 70%, #22C55E 100%)' }}
              />
              <div
                className="absolute inset-0 bg-gray-100"
                style={{ transform: `scaleX(${1 - dealQualityScore / 100})`, transformOrigin: 'right center', transition: 'transform 0.8s ease-in-out' }}
              />
            </div>
            <p className="text-[11px] text-gray-500 leading-snug">
              {dealQualityScore >= 75 ? 'Strong win probability & engagement' : dealQualityScore >= 50 ? 'Moderate — nurture key signals' : 'Needs attention on engagement & stage'}
            </p>
          </div>
        </div>

        {/* Expandable factor panel — toggled by chevron in Deal Quality card */}
        {showScoreFactors && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Score Factor Breakdown</p>
            <div className="space-y-1.5 mb-2">
              <p className="text-[11px] font-medium text-green-700">✅ Driving Score Up</p>
              {positiveFactors.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-gray-700">{f.category}</span>
                  <span className="font-semibold text-green-600">+{f.score}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1.5 pt-2 border-t border-gray-200">
              <p className="text-[11px] font-medium text-red-600">⚠️ Dragging Score Down</p>
              {negativeFactors.length > 0 ? (
                negativeFactors.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-gray-700">{f.category}</span>
                    <span className="font-semibold text-red-500">{f.score}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic">No negative factors — deal is fully optimised.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Next Best Actions */}
      <div>
        <h3 className="text-[15px] font-semibold text-gray-900 mb-2.5">Next Best Actions (AI-Recommended)</h3>
        <div className="space-y-4">
          {nextActions.map((action, idx) => (
            <div
              key={idx}
              className={`rounded-lg p-4 border ${getPriorityCardClass(action.priority)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-gray-700">{idx + 1}.</span>
                  <Target className="h-5 w-5 text-gray-600" />
                  <span className="font-bold text-gray-900">{action.title}</span>
                </div>
              </div>
              <div className="ml-8 space-y-2">
                <div className="text-sm text-gray-700">
                  <span className="font-semibold">Why:</span> {action.reason}
                </div>
                <div className="text-sm text-gray-700">
                  <span className="font-semibold">Suggested:</span> "{action.suggestion}"
                </div>
                <div className="flex items-center space-x-2 mt-3">
                  {action.actions.map((actionBtn, btnIdx) => {
                    const handleClick = () => {
                      if (actionBtn === 'Send Email' && onSendEmail) {
                        onSendEmail('john@acme.com', 'Following up on proposal', 'Hi John,\n\n');
                      } else if (actionBtn === 'Schedule Call' && onScheduleCall) {
                        onScheduleCall();
                      } else if (actionBtn === 'Schedule Meeting' && onScheduleMeeting) {
                        onScheduleMeeting();
                      } else if (actionBtn === 'AI Find Best Time' && onFindBestTime) {
                        onFindBestTime();
                      } else if (actionBtn === 'Send Case Study' && onSendEmail) {
                        onSendEmail('john@acme.com', 'ROI Case Study', 'Hi John,\n\nAttached is the ROI case study you requested.\n\n');
                      } else if (actionBtn === 'Draft Email' && onSendEmail) {
                        onSendEmail('john@acme.com', 'Introduction to CEO', 'Hi John,\n\nWould you be able to introduce me to your CEO?\n\n');
                      } else if (actionBtn === 'View Battle Card' && onViewBattleCard) {
                        onViewBattleCard(action.competitor ?? 'Salesforce');
                      }
                    };

                    return (
                      <button
                        key={btnIdx}
                        onClick={handleClick}
                        className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        {actionBtn}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Get Full AI Strategy */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={() => navigate(`/crm/ai-copilot?query=Analyze the ${dealName || 'this deal'} strategy and give me recommendations`)}
          className="w-full px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center justify-center gap-2 text-sm font-semibold transition-all shadow-md hover:shadow-lg"
        >
          <Bot className="h-5 w-5" />
          Get Full AI Strategy for This Deal
        </button>
        <p className="text-[11px] text-gray-400 text-center mt-1.5">
          Get personalized strategy, competitive analysis, and objection handling from AI Copilot
        </p>
      </div>
    </div>
  );
};
