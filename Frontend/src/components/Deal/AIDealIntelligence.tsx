import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle2, Mail, Phone, CalendarDays, FileText, Target, Bot } from 'lucide-react';

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
}

interface AIDealIntelligenceProps {
  dealName?: string;
  winProbability: number;
  winProbAI?: number;
  winProbOverrideReason?: string;
  healthScore: number;
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
}

export const AIDealIntelligence: React.FC<AIDealIntelligenceProps> = ({
  dealName,
  winProbability,
  winProbAI,
  winProbOverrideReason,
  healthScore,
  insights,
  nextActions,
  historicalData,
  onSendEmail,
  onScheduleCall,
  onScheduleMeeting,
  onFindBestTime
}) => {
  const navigate = useNavigate();
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

  const getPriorityBadge = (priority: string) => {
    if (priority === 'high') {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded">HIGH PRIORITY</span>;
    }
    if (priority === 'medium') {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">MEDIUM</span>;
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-bold rounded">LOW</span>;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
      <div className="flex items-center space-x-2 mb-6">
        <Sparkles className="h-6 w-6 text-purple-600" />
        <h2 className="text-xl font-bold text-gray-900">AI Deal Intelligence</h2>
        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded">UNIQUE DIFFERENTIATOR</span>
      </div>

      {/* Win Probability */}
      <div className="mb-8">
        {/* Determine if this deal has a rep override */}
        {winProbOverrideReason ? (
          <>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900">Win Probability</h3>
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
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900">Win Probability</h3>
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded">
                  AI-calculated
                </span>
              </div>
              <span className="text-3xl font-bold text-blue-600">{winProbability}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
              <div
                className={`h-4 rounded-full transition-all duration-300 ${getWinProbabilityColor(winProbability)}`}
                style={{ width: `${winProbability}%` }}
              />
            </div>
            <div className="text-sm font-medium text-gray-700 mb-4">
              {getWinProbabilityText(winProbability)}
            </div>
          </>
        )}

        {/* Based on factors */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm font-semibold text-gray-700 mb-3">Based on:</div>
          <div className="space-y-3">
            {insights.positive.map((insight, idx) => (
              <div key={idx} className="flex items-start space-x-2">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-gray-900">{insight.text}</div>
                  <div className="text-xs text-green-600 font-medium">Impact: {insight.impact}</div>
                </div>
              </div>
            ))}
            {insights.warnings.map((insight, idx) => (
              <div key={idx} className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-gray-900">{insight.text}</div>
                  <div className="text-xs text-yellow-600 font-medium">Impact: {insight.impact}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-600">{historicalData}</div>
          </div>
        </div>
      </div>

      {/* Deal Health */}
      <div className="mb-8 pb-8 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Deal Health: {healthScore}/100</h3>

        <div className="mb-4">
          <div className="text-sm font-semibold text-gray-700 mb-2">Strengths:</div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-900">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Contact responds quickly (avg 2 hours)</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-900">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Multiple touchpoints (3 meetings, 8 emails)</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-900">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Budget confirmed ($50K available)</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-900">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Strong business case (ROI: 240%)</span>
            </div>
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold text-gray-700 mb-2">Risks:</div>
          <div className="space-y-3">
            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Stalled - No activity in 5 days</div>
                  <div className="text-xs text-gray-600 mt-1">Action: Schedule follow-up call</div>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Competitor (Salesforce) mentioned in last meeting</div>
                  <div className="text-xs text-gray-600 mt-1">Action: Address competitive positioning</div>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">CEO approval needed (not yet engaged)</div>
                  <div className="text-xs text-gray-600 mt-1">Action: Request intro to CEO</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Next Best Actions */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Next Best Actions (AI-Recommended)</h3>
        <div className="space-y-4">
          {nextActions.map((action, idx) => (
            <div
              key={idx}
              className={`rounded-lg p-4 border-2 ${
                action.priority === 'high'
                  ? 'bg-red-50 border-red-300'
                  : action.priority === 'medium'
                  ? 'bg-yellow-50 border-yellow-300'
                  : 'bg-gray-50 border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-gray-700">{idx + 1}.</span>
                  <Target className="h-5 w-5 text-gray-600" />
                  <span className="font-bold text-gray-900">{action.title}</span>
                </div>
                {getPriorityBadge(action.priority)}
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
      <div className="mt-6 pt-6 border-t border-gray-200">
        <button
          onClick={() => navigate(`/crm/ai-copilot?query=Analyze the ${dealName || 'this deal'} strategy and give me recommendations`)}
          className="w-full px-6 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center justify-center gap-2 text-sm font-semibold transition-all shadow-md hover:shadow-lg"
        >
          <Bot className="h-5 w-5" />
          Get Full AI Strategy for This Deal
        </button>
        <p className="text-xs text-gray-500 text-center mt-2">
          Get personalized strategy, competitive analysis, and objection handling from AI Copilot
        </p>
      </div>
    </div>
  );
};
