import React, { useState } from 'react';
import { Target, Settings, CheckCircle } from 'lucide-react';
import AdjustScoreModal from './AdjustScoreModal';

interface ScoreComponents {
  jobTitle: { score: number; max: number; details: string };
  companyProfile: { score: number; max: number; details: string[] };
  engagement: { score: number; max: number; details: string[] };
  intentSignals: { score: number; max: number; details: string[] };
  dataCompleteness: { score: number; max: number; details: string[] };
}

interface AIScoreBreakdownProps {
  aiScore: number;
  baseScore: number;
  hrmsBonus: number;
  hrmsBonusPoints: number;
  scoreComponents: ScoreComponents;
  aiInsights: string[];
  onScoreAdjust?: (newScore: number, reason: string) => void;
}

const AIScoreBreakdown: React.FC<AIScoreBreakdownProps> = ({
  aiScore,
  baseScore,
  hrmsBonus,
  hrmsBonusPoints,
  scoreComponents,
  aiInsights,
  onScoreAdjust
}) => {
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [hoveredScore, setHoveredScore] = useState<string | null>(null);

  const handleScoreAdjust = (newScore: number, reason: string) => {
    if (onScoreAdjust) {
      onScoreAdjust(newScore, reason);
    }
  };

  const getScoreRating = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Poor';
  };

  const getScoreDots = (score: number): JSX.Element[] => {
    const filled = Math.round(score / 10);
    return [...Array(10)].map((_, i) => (
      <span key={i} className={i < filled ? 'text-green-500' : 'text-gray-300'}>
        ●
      </span>
    ));
  };

  const getProgressBar = (score: number, max: number): string => {
    const percentage = Math.round((score / max) * 100);
    return `${percentage}%`;
  };

  const getProgressBarColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              AI LEAD SCORE BREAKDOWN
            </h2>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-8 mb-6 text-center">
            <div className="mb-2">
              <div
                className="text-4xl font-bold text-gray-900 mb-2 cursor-pointer hover:text-blue-600 transition-colors"
                onMouseEnter={() => setHoveredScore('overall')}
                onMouseLeave={() => setHoveredScore(null)}
                onClick={() => setShowAdjustModal(true)}
                title="Click to adjust score"
              >
                OVERALL SCORE: {aiScore}/100
              </div>
              {hoveredScore === 'overall' && (
                <div className="text-sm text-blue-600 font-medium mb-2">
                  Click to adjust manually
                </div>
              )}
              <div className="text-2xl mb-4 space-x-1">
                {getScoreDots(aiScore)} ({getScoreRating(aiScore)})
              </div>
            </div>

          <div className="space-y-2 text-sm text-gray-700 mb-6">
            <div>Base Score: {baseScore}/100</div>
            <div className="text-green-600 font-medium">
              HRMS Bonus: +{hrmsBonus}% (×{(hrmsBonus / 100 + 1).toFixed(2)}) = +{hrmsBonusPoints} points
            </div>
            <div className="font-semibold text-lg text-gray-900">
              Final Score: {aiScore}/100
            </div>
          </div>

          <button
            onClick={() => setShowAdjustModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings className="h-4 w-4" />
            Adjust Score Manually
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
            SCORE COMPONENTS (Base: {baseScore} points)
          </h3>
          <div className="border-t border-gray-200 pt-4"></div>
        </div>

        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-gray-900">Job Title & Seniority</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900">
                  {scoreComponents.jobTitle.score}/{scoreComponents.jobTitle.max}
                </span>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-2">{scoreComponents.jobTitle.details}</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getProgressBarColor(
                  (scoreComponents.jobTitle.score / scoreComponents.jobTitle.max) * 100
                )}`}
                style={{ width: getProgressBar(scoreComponents.jobTitle.score, scoreComponents.jobTitle.max) }}
              />
            </div>
            <div className="text-right text-sm text-gray-500 mt-1">
              {getProgressBar(scoreComponents.jobTitle.score, scoreComponents.jobTitle.max)}
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏢</span>
                <span className="font-semibold text-gray-900">Company Profile</span>
              </div>
              <div className="font-bold text-gray-900">
                {scoreComponents.companyProfile.score}/{scoreComponents.companyProfile.max}
              </div>
            </div>
            <div className="space-y-1 mb-2">
              {scoreComponents.companyProfile.details.map((detail, index) => (
                <p key={index} className="text-sm text-gray-600">• {detail}</p>
              ))}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getProgressBarColor(
                  (scoreComponents.companyProfile.score / scoreComponents.companyProfile.max) * 100
                )}`}
                style={{ width: getProgressBar(scoreComponents.companyProfile.score, scoreComponents.companyProfile.max) }}
              />
            </div>
            <div className="text-right text-sm text-gray-500 mt-1">
              {getProgressBar(scoreComponents.companyProfile.score, scoreComponents.companyProfile.max)}
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">📧</span>
                <span className="font-semibold text-gray-900">Engagement Level</span>
              </div>
              <div className="font-bold text-gray-900">
                {scoreComponents.engagement.score}/{scoreComponents.engagement.max}
              </div>
            </div>
            <div className="space-y-1 mb-2">
              {scoreComponents.engagement.details.map((detail, index) => (
                <p key={index} className="text-sm text-gray-600">• {detail}</p>
              ))}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getProgressBarColor(
                  (scoreComponents.engagement.score / scoreComponents.engagement.max) * 100
                )}`}
                style={{ width: getProgressBar(scoreComponents.engagement.score, scoreComponents.engagement.max) }}
              />
            </div>
            <div className="text-right text-sm text-gray-500 mt-1">
              {getProgressBar(scoreComponents.engagement.score, scoreComponents.engagement.max)}
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔔</span>
                <span className="font-semibold text-gray-900">Intent Signals</span>
              </div>
              <div className="font-bold text-gray-900">
                {scoreComponents.intentSignals.score}/{scoreComponents.intentSignals.max}
              </div>
            </div>
            <div className="space-y-1 mb-2">
              {scoreComponents.intentSignals.details.map((detail, index) => (
                <p key={index} className="text-sm text-gray-600">• {detail}</p>
              ))}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getProgressBarColor(
                  (scoreComponents.intentSignals.score / scoreComponents.intentSignals.max) * 100
                )}`}
                style={{ width: getProgressBar(scoreComponents.intentSignals.score, scoreComponents.intentSignals.max) }}
              />
            </div>
            <div className="text-right text-sm text-gray-500 mt-1">
              {getProgressBar(scoreComponents.intentSignals.score, scoreComponents.intentSignals.max)}
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">📊</span>
                <span className="font-semibold text-gray-900">Data Completeness</span>
              </div>
              <div className="font-bold text-gray-900">
                {scoreComponents.dataCompleteness.score}/{scoreComponents.dataCompleteness.max}
              </div>
            </div>
            <div className="space-y-1 mb-2">
              {scoreComponents.dataCompleteness.details.map((detail, index) => (
                <p key={index} className="text-sm text-gray-600">• {detail}</p>
              ))}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getProgressBarColor(
                  (scoreComponents.dataCompleteness.score / scoreComponents.dataCompleteness.max) * 100
                )}`}
                style={{ width: getProgressBar(scoreComponents.dataCompleteness.score, scoreComponents.dataCompleteness.max) }}
              />
            </div>
            <div className="text-right text-sm text-gray-500 mt-1">
              {getProgressBar(scoreComponents.dataCompleteness.score, scoreComponents.dataCompleteness.max)}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <span className="text-lg mt-0.5">💡</span>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">AI Insights:</h4>
              <ul className="space-y-1">
                {aiInsights.map((insight, index) => (
                  <li key={index} className="text-sm text-gray-700">• {insight}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <AdjustScoreModal
      isOpen={showAdjustModal}
      onClose={() => setShowAdjustModal(false)}
      currentScore={aiScore}
      onSave={handleScoreAdjust}
    />
  </>
  );
};

export default AIScoreBreakdown;
