import React, { useState } from 'react';
import { Target, TrendingUp, Calendar, AlertTriangle, TrendingDown, Eye, BarChart3, Database, CheckCircle2, Mail, Phone, Video, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PredictedCloseDateModal, SimilarityBreakdownModal, DataVerificationModal } from './DealActivityModals';
import { useToast } from '../../contexts/ToastContext';

interface ScoreBreakdown {
  category: string;
  score: number;
  stars: number;
}

interface SimilarDeal {
  id: string;
  name: string;
  similarity: number;
  status: string;
  amount?: number;
  winProbability?: number;
  timeline?: string;
  challenge?: string;
}

interface DealRightSidebarProps {
  dealScore: {
    overall: number;
    breakdown: ScoreBreakdown[];
    factors: Array<{ text: string; impact: number }>;
  };
  predictive: {
    winProbability: number;
    expectedCloseDate: string;
    closeDateConfidence: number;
    daysEarlier?: number;
    dealSizeConfidence: number;
    predictedRange: string;
    currentAmount: number;
    riskLevel: 'low' | 'medium' | 'high';
    primaryRisk: string;
    mitigation: string;
    churnRisk: number;
    churnReason: string;
    upsellOpportunity: 'low' | 'medium' | 'high';
    upsellPotential: string;
    upsellTiming: string;
    recommendation: string;
  };
  similarDeals: SimilarDeal[];
  similarInsights: {
    avgCloseTime: number;
    currentDays: number;
    avgDealSize: string;
    currentDealSize: string;
    commonObjection: string;
    successFactor: string;
    winStrategy: string;
  };
  metrics: {
    dealAge: number;
    timeInStage: number;
    avgStageDuration: number;
    daysToClose: number;
    meetings: number;
    emailsSent: number;
    emailsOpened: number;
    calls: number;
    lastActivityDays: number;
    responseRate: number;
    avgResponseTime: string;
    quarterlyForecast: number;
    weightedValue: number;
    quotaContribution: number;
  };
  dataSources: {
    createdFrom: string[];
    enrichedFrom: string[];
    lastEnriched: string;
    accuracy: number;
  };
}

export const DealRightSidebar: React.FC<DealRightSidebarProps> = ({
  dealScore,
  predictive,
  similarDeals,
  similarInsights,
  metrics,
  dataSources
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [showCloseDateModal, setShowCloseDateModal] = useState(false);
  const [showSimilarityModal, setShowSimilarityModal] = useState(false);
  const [showVerifyDataModal, setShowVerifyDataModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<SimilarDeal | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStars = (count: number) => {
    return '⭐'.repeat(count) + '☆'.repeat(5 - count);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getRiskEmoji = (level: string) => {
    switch (level) {
      case 'low':
        return '🟢';
      case 'medium':
        return '🟡';
      case 'high':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const handleReEnrich = () => {
    setIsEnriching(true);
    showToast('info', 'Refreshing deal data from all sources...');
    setTimeout(() => {
      setIsEnriching(false);
      showToast('success', 'Deal data refreshed successfully!');
    }, 2000);
  };

  const handleVerifyData = () => {
    setShowVerifyDataModal(true);
  };

  const handleVerifyComplete = () => {
    showToast('success', 'Data verified and updated!');
  };

  const handleSimilarityClick = (deal: SimilarDeal) => {
    setSelectedDeal(deal);
    setShowSimilarityModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Deal Score & Insights */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-6">
          <Target className="h-6 w-6 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">Deal Score & Insights</h2>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">Overall Score:</span>
            <span className={`text-3xl font-bold ${getScoreColor(dealScore.overall)}`}>
              {dealScore.overall}/100
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${getScoreBarColor(dealScore.overall)}`}
              style={{ width: `${dealScore.overall}%` }}
            ></div>
          </div>
          <div className="text-sm font-medium text-gray-700">
            {dealScore.overall >= 80 ? 'Excellent' : dealScore.overall >= 60 ? 'Good' : dealScore.overall >= 40 ? 'Fair' : 'Poor'}
          </div>
        </div>

        <div className="mb-6 pb-6 border-b border-gray-200">
          <div className="text-sm font-semibold text-gray-700 mb-3">Score Breakdown:</div>
          <div className="space-y-3">
            {dealScore.breakdown.map((item, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-900">{item.category}:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-gray-900">{item.score}/100</span>
                    <span className="text-xs">{getStars(item.stars)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="text-sm font-semibold text-purple-900 mb-2">🤖 Why This Score?</div>
          <div className="space-y-1">
            {dealScore.factors.map((factor, idx) => (
              <div key={idx} className="text-sm text-purple-800">
                • {factor.text} ({factor.impact > 0 ? '+' : ''}{factor.impact})
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Predictive Insights */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-6">
          <TrendingUp className="h-6 w-6 text-purple-600" />
          <h2 className="text-lg font-bold text-gray-900">Predictive Insights</h2>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-2">Win Probability:</div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-bold text-blue-600">{predictive.winProbability}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${predictive.winProbability}%` }}
              ></div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="text-sm font-semibold text-gray-700 mb-2">Expected Close Date:</div>
            <div
              onClick={() => setShowCloseDateModal(true)}
              className="flex items-center space-x-2 mb-1 cursor-pointer hover:bg-purple-50 p-2 rounded-lg transition-colors"
              title="Click to see prediction details"
            >
              <Calendar className="h-5 w-5 text-gray-500" />
              <span className="text-lg font-bold text-gray-900 hover:text-purple-600">{predictive.expectedCloseDate}</span>
            </div>
            {predictive.daysEarlier && (
              <div className="text-sm text-green-600">({predictive.daysEarlier} days earlier than target)</div>
            )}
            <div className="text-xs text-gray-600 mt-1">Confidence: {predictive.closeDateConfidence}%</div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="text-sm font-semibold text-gray-700 mb-2">Deal Size Confidence:</div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-600">High ({predictive.dealSizeConfidence}%)</span>
            </div>
            <div className="text-sm text-gray-700 mb-1">
              Predicted: <span className="font-medium">{predictive.predictedRange}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-600">Current: ${(predictive.currentAmount / 1000).toFixed(0)}K</span>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-green-600 font-medium">Within range</span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="text-sm font-semibold text-gray-700 mb-2">Risk Level:</div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">{getRiskEmoji(predictive.riskLevel)}</span>
              <span className={`text-lg font-bold capitalize ${getRiskColor(predictive.riskLevel)}`}>
                {predictive.riskLevel}
              </span>
            </div>
            <div className="text-sm text-gray-700 mb-1">
              <span className="font-semibold">Primary Risk:</span> {predictive.primaryRisk}
            </div>
            <div className="text-sm text-gray-700">
              <span className="font-semibold">Mitigation:</span> {predictive.mitigation}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="text-sm font-semibold text-gray-700 mb-2">Churn Risk (if won):</div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-2xl">🟢</span>
              <span className="text-lg font-bold text-green-600">Low ({predictive.churnRisk}%)</span>
            </div>
            <div className="text-sm text-gray-600">Why: {predictive.churnReason}</div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="text-sm font-semibold text-gray-700 mb-2">Upsell Opportunity:</div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-2xl">🟡</span>
              <span className="text-lg font-bold text-yellow-600 capitalize">{predictive.upsellOpportunity}</span>
            </div>
            <div className="text-sm text-gray-700 mb-1">
              Potential: <span className="font-medium">{predictive.upsellPotential}</span>
            </div>
            <div className="text-sm text-gray-600">Best timing: {predictive.upsellTiming}</div>
          </div>

          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
            <div className="text-sm font-semibold text-purple-900 mb-1">🤖 AI Recommendation:</div>
            <div className="text-sm text-purple-800">{predictive.recommendation}</div>
          </div>
        </div>
      </div>

      {/* Similar Deals */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="h-6 w-6 text-orange-600" />
          <h2 className="text-lg font-bold text-gray-900">Similar Deals</h2>
        </div>
        <div className="text-xs text-gray-600 mb-4">(Learn from Past Wins)</div>

        <div className="text-xs text-gray-600 mb-4">
          Based on: Industry, size, deal value, stage
        </div>

        <div className="space-y-3 mb-4">
          {similarDeals.map((deal) => (
            <div key={deal.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-blue-300 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm font-bold text-gray-900">{deal.name}</div>
                  <div
                    onClick={() => handleSimilarityClick(deal)}
                    className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer underline"
                    title="Click to see similarity breakdown"
                  >
                    Similarity: {deal.similarity}% match
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-700 mb-1">
                <span className="font-semibold">Status:</span> {deal.status}
                {deal.amount && ` ($${(deal.amount / 1000).toFixed(0)}K)`}
              </div>
              {deal.winProbability && (
                <div className="text-xs text-gray-700 mb-1">
                  Win Probability: <span className="font-semibold text-green-600">{deal.winProbability}%</span>
                </div>
              )}
              {deal.timeline && (
                <div className="text-xs text-gray-700 mb-2">
                  Timeline: <span className="font-semibold">{deal.timeline}</span>
                </div>
              )}
              {deal.challenge && (
                <div className="text-xs text-gray-700 mb-2">
                  Same challenge: <span className="font-semibold">{deal.challenge}</span>
                </div>
              )}
              <button
                onClick={() => window.open(`/crm/deals/${deal.id}`, '_blank')}
                className="mt-2 px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
              >
                <Eye className="h-3 w-3 inline mr-1" />
                View Deal
              </button>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="text-sm font-semibold text-blue-900 mb-2">💡 Insights from Similar Won Deals:</div>
          <div className="space-y-1 text-xs text-blue-800">
            <div>• Avg close time: {similarInsights.avgCloseTime} days (you're at {similarInsights.currentDays})</div>
            <div>• Avg deal size: {similarInsights.avgDealSize} (yours: {similarInsights.currentDealSize})</div>
            <div>• Common objection: {similarInsights.commonObjection}</div>
            <div>• Success factor: {similarInsights.successFactor}</div>
            <div>• Win strategy: {similarInsights.winStrategy}</div>
          </div>
        </div>
      </div>

      {/* Deal Metrics */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="h-6 w-6 text-green-600" />
          <h2 className="text-lg font-bold text-gray-900">Deal Metrics</h2>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-2">Timeline:</div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Deal Age:</span>
                <span className="font-medium text-gray-900">{metrics.dealAge} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time in Current Stage:</span>
                <span className="font-medium text-gray-900">{metrics.timeInStage} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Stage Duration:</span>
                <span className="font-medium text-gray-900">{metrics.avgStageDuration} days (on track)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Days to Close:</span>
                <span className="font-medium text-gray-900">{metrics.daysToClose} days</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="text-sm font-semibold text-gray-700 mb-2">Engagement:</div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Meetings:</span>
                <span className="font-medium text-gray-900">{metrics.meetings}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Emails:</span>
                <span className="font-medium text-gray-900">{metrics.emailsSent} sent, {metrics.emailsOpened} opened ({Math.round((metrics.emailsOpened / metrics.emailsSent) * 100)}%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Calls:</span>
                <span className="font-medium text-gray-900">{metrics.calls}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Activity:</span>
                <span className={`font-medium ${metrics.lastActivityDays >= 5 ? 'text-red-600' : 'text-gray-900'}`}>
                  {metrics.lastActivityDays} days ago {metrics.lastActivityDays >= 5 ? '⚠️' : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Response Rate:</span>
                <span className="font-medium text-green-600">{metrics.responseRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Response Time:</span>
                <span className="font-medium text-gray-900">{metrics.avgResponseTime}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="text-sm font-semibold text-gray-700 mb-2">Forecast Impact:</div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">This Quarter:</span>
                <span className="font-medium text-gray-900">${(metrics.quarterlyForecast / 1000).toFixed(0)}K</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Weighted Value:</span>
                <span className="font-medium text-gray-900">${(metrics.weightedValue / 1000).toFixed(1)}K ({Math.round((metrics.weightedValue / metrics.quarterlyForecast) * 100)}% probability)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Contribution to Quota:</span>
                <span className="font-medium text-gray-900">{metrics.quotaContribution}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Sources */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Database className="h-6 w-6 text-gray-600" />
            <h2 className="text-lg font-bold text-gray-900">Data Sources</h2>
          </div>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded">ATTRIBUTION</span>
        </div>

        <div className="space-y-4">
          {/* Source Journey Highlight */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border-2 border-blue-200 mb-3">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-bold text-blue-900">🎯 Source Journey</span>
            </div>
            <div className="text-sm text-blue-800 font-medium">
              Lead Gen (Apollo.io) → Lead → Deal
            </div>
            <div className="text-xs text-blue-700 mt-1">
              Full attribution tracking from discovery to close
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-700 mb-2">Deal created from:</div>
            <div className="space-y-1">
              {dataSources.createdFrom.map((source, idx) => (
                <div key={idx} className="flex items-center space-x-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-gray-900">{source}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="text-sm font-semibold text-gray-700 mb-2">Enriched from:</div>
            <div className="space-y-1">
              {dataSources.enrichedFrom.map((source, idx) => (
                <div key={idx} className="flex items-center space-x-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  <span className="text-gray-900">{source}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600 mb-1">
              Last enriched: <span className="font-medium text-gray-900">{dataSources.lastEnriched}</span>
            </div>
            <div className="text-sm text-gray-600 mb-3">
              Accuracy: <span className="font-medium text-green-600">{dataSources.accuracy}%</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleReEnrich}
                disabled={isEnriching}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
              >
                <RefreshCw className={`h-4 w-4 ${isEnriching ? 'animate-spin' : ''}`} />
                <span>{isEnriching ? 'Enriching...' : 'Re-enrich Now'}</span>
              </button>
              <button
                onClick={handleVerifyData}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
              >
                Verify Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PredictedCloseDateModal
        isOpen={showCloseDateModal}
        onClose={() => setShowCloseDateModal(false)}
        prediction={{
          mostLikely: predictive.expectedCloseDate,
          range: 'March 10-15, 2026',
          confidence: predictive.closeDateConfidence,
          reasons: [
            'Similar deal patterns (avg 45 days in current stage)',
            'Current velocity and progression rate',
            'Historical close data from past wins',
            'Engagement patterns with key stakeholders'
          ]
        }}
      />

      {selectedDeal && (
        <SimilarityBreakdownModal
          isOpen={showSimilarityModal}
          onClose={() => setShowSimilarityModal(false)}
          dealName={selectedDeal.name}
          breakdown={{
            industry: 100,
            dealSize: 95,
            companySize: 90,
            geography: 70,
            stage: 65,
            overall: selectedDeal.similarity
          }}
        />
      )}

      <DataVerificationModal
        isOpen={showVerifyDataModal}
        onClose={() => setShowVerifyDataModal(false)}
        onVerify={handleVerifyComplete}
        fieldsToVerify={[
          { field: 'Company Name', currentValue: 'Acme Corp', needsVerification: false },
          { field: 'Deal Amount', currentValue: '$50,000', needsVerification: false },
          { field: 'Close Date', currentValue: 'March 15, 2026', needsVerification: true },
          { field: 'Contact Email', currentValue: 'john@acme.com', needsVerification: false },
          { field: 'Company Size', currentValue: '75 employees', needsVerification: true },
          { field: 'Industry', currentValue: 'SaaS', needsVerification: false }
        ]}
      />
    </div>
  );
};
