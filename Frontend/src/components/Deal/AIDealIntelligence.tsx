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
}) => {
  const navigate = useNavigate();
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);
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

      {/* Deal Health — clickable, expands score factor panel (item 10) */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setShowScoreFactors(v => !v)}
          className="w-full flex items-center justify-between mb-1 rounded-lg hover:bg-gray-50 px-2 py-1.5 -mx-2 transition-colors group"
        >
          <h3 className="text-[15px] font-semibold text-gray-900">Deal Health</h3>
          <div className="flex items-center gap-2">
            {/* Gradient health bar (item 8) */}
            <div className="w-24 h-2 rounded-full overflow-hidden bg-gray-100 relative">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(to right, #EF4444 0%, #EF4444 40%, #F59E0B 40%, #F59E0B 70%, #22C55E 70%, #22C55E 100%)',
                }}
              />
              {/* Gray mask slides from right to reveal gradient */}
              <div
                className="absolute inset-0 bg-gray-100 origin-right"
                style={{
                  transform: `scaleX(${1 - healthBarWidth / 100})`,
                  transition: 'transform 0.8s ease-in-out',
                  transformOrigin: 'right center',
                }}
              />
            </div>
            {/* Score number — pulse when ≥ 85 */}
            <span
              className={`text-[22px] font-bold leading-none ${
                healthScore >= 80 ? 'text-green-600' : healthScore >= 60 ? 'text-blue-600' : healthScore >= 40 ? 'text-yellow-600' : 'text-red-600'
              } ${healthScore >= 85 ? 'animate-[pulse_2s_ease-in-out_infinite]' : ''}`}
            >
              {healthScore}
            </span>
            <span className="text-xs text-gray-400">/100</span>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showScoreFactors ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Hint text — only when collapsed */}
        {!showScoreFactors && (
          <p className="text-xs text-gray-400 mb-2 px-2">Click to see score breakdown</p>
        )}

        {/* Inline factor panel (item 10) */}
        {showScoreFactors && (
          <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Score Factor Breakdown</p>

            {/* Positive factors */}
            <div className="space-y-2 mb-3">
              <p className="text-xs font-medium text-green-700 mb-1">✅ Driving Score Up</p>
              {positiveFactors.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{f.category}</span>
                  <span className="font-semibold text-green-600">+{f.score}</span>
                </div>
              ))}
            </div>

            {/* Negative factors */}
            <div className="space-y-2 pt-2 border-t border-gray-200">
              <p className="text-xs font-medium text-red-600 mb-1">⚠️ Dragging Score Down</p>
              {negativeFactors.length > 0 ? (
                negativeFactors.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{f.category}</span>
                    <span className="font-semibold text-red-500">{f.score}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 italic">No negative factors — deal is fully optimised.</p>
              )}
            </div>
          </div>
        )}

        {/* Show full analysis toggle (item 19) */}
        <button
          type="button"
          onClick={() => setShowFullAnalysis(v => !v)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors mb-2"
        >
          {showFullAnalysis ? 'Hide analysis ↑' : 'Show full analysis ↓'}
        </button>

        {showFullAnalysis && (
          <>
            <div className="mb-3">
              <div className="text-xs font-medium text-gray-500 mb-1.5">Strengths:</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
                <div className="flex items-center gap-1.5 text-xs text-gray-900">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                  <span>Contact responds quickly (avg 2 hours)</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-900">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                  <span>Multiple touchpoints (3 meetings, 8 emails)</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-900">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                  <span>Budget confirmed ($50K available)</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-900">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                  <span>Strong business case (ROI: 240%)</span>
                </div>
              </div>
            </div>

            <div className="mb-3">
              <div className="text-xs font-medium text-gray-500 mb-1.5">Risks:</div>
              <div className="space-y-1.5">
                <div className="bg-yellow-50 rounded-lg py-2 px-3 border border-yellow-200">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-900">Stalled - No activity in 5 days</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">Action: Schedule follow-up call</div>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 rounded-lg py-2 px-3 border border-yellow-200">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-900">Competitor (Salesforce) mentioned in last meeting</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">Action: Address competitive positioning</div>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 rounded-lg py-2 px-3 border border-yellow-200">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-900">CEO approval needed (not yet engaged)</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">Action: Request intro to CEO</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {scoreBreakdown.length > 0 && (
              <div className="pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowScoreBreakdown(v => !v)}
                  className="flex items-center justify-between w-full text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <span>Score Breakdown</span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showScoreBreakdown ? 'rotate-180' : ''}`} />
                </button>
                {showScoreBreakdown && (
                  <div className="mt-3 space-y-3">
                    {scoreBreakdown.map((item, idx) => (
                      <div key={idx}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700">{item.category}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900">{item.score}</span>
                            <span className="text-xs">{getStars(item.stars)}</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${getScoreBarColor(item.score)}`}
                            style={{ width: `${item.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
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
