import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, Package, CreditCard, Clock, Sparkles, Tag, Shield, ChevronDown, ChevronRight, Copy, Check, AlertTriangle, Target, Trophy, CheckCircle2, XCircle } from 'lucide-react';
import { formatDisplayDate } from '../../utils/dateUtils';
import { formatCurrency, convertToBaseCurrency, BASE_CURRENCY_CODE } from '../../utils/currencyUtils';
import { BATTLE_CARDS } from '../../config/battleCards';
import { RevenueTimeline } from './RevenueTimeline';
import type { RevenueSchedule } from './RevenueTimeline';

interface Stage {
  name: string;
  days: number;
  startDate: string;
  endDate: string;
  status: 'completed' | 'current' | 'pending';
  benchmark?: number;
  benchmarkMin?: number;
  benchmarkMax?: number;
}

interface DealDetailsPanelProps {
  deal: {
    dealName: string;
    amount: number;
    currency?: string;
    base_amount_usd?: number;
    stage: string;
    stageName: string;
    stageNumber: number;
    totalStages: number;
    closeDate: string;
    expectedCloseDate: string;
    probability: number;
    daysInStage: number;
    totalDealAge: number;
    package: string;
    contractTerm: string;
    paymentTerms: string;
    tags: string[];
  };
  stageHistory: Stage[];
  competitors?: string[];
  expandedBattleCard?: string | null;
  isAdmin?: boolean;
  battleCardRef?: React.RefObject<HTMLDivElement>;
  revenueSchedule?: RevenueSchedule | null;
  onSaveRevenueSchedule?: (schedule: RevenueSchedule) => void;
  revenueTimelineRef?: React.RefObject<HTMLDivElement>;
}

function getBarFillPct(stage: Stage): number {
  if (stage.status === 'completed') return 100;
  if (stage.status === 'current') {
    if (stage.benchmark) return Math.min(Math.round((stage.days / stage.benchmark) * 100), 100);
    return 50;
  }
  return 0;
}

export const DealDetailsPanel: React.FC<DealDetailsPanelProps> = ({
  deal,
  stageHistory,
  competitors,
  expandedBattleCard,
  isAdmin,
  battleCardRef,
  revenueSchedule,
  onSaveRevenueSchedule,
  revenueTimelineRef,
}) => {
  // Deal Progression computed values
  const completedAndCurrent = stageHistory.filter(s => s.status !== 'pending');
  const pipelineAvgThrough = completedAndCurrent.reduce((sum, s) => sum + (s.benchmark ?? 0), 0);
  const totalAge = deal.totalDealAge || stageHistory.reduce(
    (sum, s) => s.status !== 'pending' ? sum + s.days : sum, 0
  );
  const summaryDelta = pipelineAvgThrough > 0 ? pipelineAvgThrough - totalAge : 0;
  const summaryBarCx = summaryDelta > 0
    ? 'bg-green-50 text-green-800 border-green-100'
    : summaryDelta >= -(pipelineAvgThrough * 0.2)
      ? 'bg-amber-50 text-amber-800 border-amber-100'
      : 'bg-red-50 text-red-800 border-red-100';

  const currentStage = stageHistory.find(s => s.status === 'current');

  const [openBattleCard, setOpenBattleCard] = useState<string | null>(null);
  const [copiedCompetitor, setCopiedCompetitor] = useState<string | null>(null);

  // Sync external trigger (e.g. "View Battle Card" from AI panel)
  useEffect(() => {
    if (expandedBattleCard != null) setOpenBattleCard(expandedBattleCard);
  }, [expandedBattleCard]);

  const handleCopyTalkingPoints = (key: string, points: string[]) => {
    const text = points.map((p, i) => `${i + 1}. ${p}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopiedCompetitor(key);
      setTimeout(() => setCopiedCompetitor(null), 2000);
    });
  };

  let aiInsightText = 'No active stage data available.';
  if (currentStage) {
    const hasBench = currentStage.benchmark != null;
    const remaining = hasBench ? currentStage.benchmark! - currentStage.days : null;
    const stageClause = hasBench
      ? (remaining! > 0
          ? `${currentStage.name}: ${currentStage.days} days in, avg is ${currentStage.benchmark} days — ${remaining} days remaining at typical pace.`
          : `${currentStage.name}: ${currentStage.days} days in — ${Math.abs(remaining!)} days over the typical ${currentStage.benchmark}-day mark.`)
      : `${currentStage.name}: ${currentStage.days} days in.`;
    const paceClause = pipelineAvgThrough > 0
      ? (summaryDelta > 0
          ? `Overall this deal is ${summaryDelta} days ahead of pipeline average — strong velocity.`
          : summaryDelta < 0
            ? `Overall this deal is ${Math.abs(summaryDelta)} days behind pipeline average — consider accelerating.`
            : 'Overall this deal is exactly on pipeline average pace.')
      : '';
    aiInsightText = [stageClause, paceClause].filter(Boolean).join(' ');
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
      <div className="flex items-center space-x-2 mb-6">
        <DollarSign className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">Deal Details</h2>
      </div>

      {/* Deal Information */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Deal Information:</h3>
        <div className="space-y-3">
          <div className="flex items-start">
            <span className="text-sm text-gray-600 w-40">Deal Name:</span>
            <span className="text-sm font-medium text-gray-900">{deal.dealName}</span>
          </div>
          <div className="flex items-start">
            <span className="text-sm text-gray-600 w-40">Value:</span>
            <div>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(deal.amount, deal.currency || BASE_CURRENCY_CODE)}
              </span>
              {deal.currency && deal.currency !== BASE_CURRENCY_CODE && deal.amount > 0 && (
                <div className="text-xs text-gray-400 mt-0.5">
                  ≈ {formatCurrency(
                      deal.base_amount_usd || convertToBaseCurrency(deal.amount, deal.currency),
                      BASE_CURRENCY_CODE
                    )} USD
                </div>
              )}
            </div>
          </div>
          <div className="flex items-start">
            <span className="text-sm text-gray-600 w-40">Stage:</span>
            <span className="text-sm font-medium text-gray-900">{deal.stageName} (Stage {deal.stageNumber} of {deal.totalStages})</span>
          </div>
          <div className="flex items-start">
            <span className="text-sm text-gray-600 w-40">Close Date:</span>
            <span className="text-sm font-medium text-gray-900">{formatDisplayDate(deal.closeDate)}</span>
          </div>
          <div className="flex items-start">
            <span className="text-sm text-gray-600 w-40">Expected Close:</span>
            <div>
              <span className="text-sm font-medium text-gray-900">{deal.expectedCloseDate}</span>
              <div className="flex items-center space-x-1 mt-1">
                <Sparkles className="h-3 w-3 text-purple-600" />
                <span className="text-xs text-purple-600 font-medium">AI prediction</span>
              </div>
            </div>
          </div>
          <div className="flex items-start">
            <span className="text-sm text-gray-600 w-40">Probability:</span>
            <span className="text-sm font-medium text-gray-900">{deal.probability}%</span>
          </div>
          <div className="flex items-start">
            <span className="text-sm text-gray-600 w-40">Days in Stage:</span>
            <span className="text-sm font-medium text-gray-900">{deal.daysInStage} days</span>
          </div>
          <div className="flex items-start">
            <span className="text-sm text-gray-600 w-40">Total Deal Age:</span>
            <span className="text-sm font-medium text-gray-900">{deal.totalDealAge} days</span>
          </div>
        </div>
      </div>

      {/* Revenue Timeline */}
      <div ref={revenueTimelineRef} className="mb-6 pb-6 border-b border-gray-200">
        <RevenueTimeline
          schedule={revenueSchedule}
          defaultCurrency={deal.currency || 'USD'}
          onSave={onSaveRevenueSchedule ?? (() => {})}
        />
      </div>

      {/* Deal Progression */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Deal Progression:</h3>

        {/* Summary bar */}
        {pipelineAvgThrough > 0 && (
          <div className={`mb-4 px-3 py-2 rounded-lg text-xs flex items-center gap-2 border font-medium ${summaryBarCx}`}>
            <Clock className="h-3.5 w-3.5 flex-shrink-0" />
            <span>
              {'Deal age: '}
              <strong>{totalAge} days</strong>
              {' · Pipeline avg at this stage: '}
              <strong>{pipelineAvgThrough} days</strong>
              {' · '}
              {summaryDelta > 0 && <strong>{summaryDelta} days ahead ↑</strong>}
              {summaryDelta === 0 && <strong>exactly on pace</strong>}
              {summaryDelta < 0 && <strong>{Math.abs(summaryDelta)} days behind ↓</strong>}
            </span>
          </div>
        )}

        {/* Stage rows — Gantt-style horizontal bars */}
        <div className="space-y-2.5">
          {stageHistory.map((stage, idx) => {
            const hasBench = stage.benchmark != null;
            const fillPct = getBarFillPct(stage);
            const delta = (stage.status === 'completed' && hasBench)
              ? stage.days - stage.benchmark!
              : null;

            let barFillCx = 'bg-gray-200';
            let rightCx = 'text-gray-400';

            if (stage.status === 'completed') {
              if (!hasBench || delta === null) {
                barFillCx = 'bg-green-400'; rightCx = 'text-gray-600';
              } else if (delta < 0) {
                barFillCx = 'bg-green-500'; rightCx = 'text-green-700';
              } else if (delta <= stage.benchmark! * 0.2) {
                barFillCx = 'bg-amber-400'; rightCx = 'text-amber-700';
              } else {
                barFillCx = 'bg-red-500'; rightCx = 'text-red-600';
              }
            } else if (stage.status === 'current') {
              barFillCx = 'bg-blue-500'; rightCx = 'text-blue-700';
            }

            let rightLabel: React.ReactNode;
            if (stage.status === 'completed') {
              if (!hasBench) {
                rightLabel = <span className="text-gray-600">{stage.days}d</span>;
              } else {
                const deltaLabel = delta! < 0
                  ? `✓ ${Math.abs(delta!)}d faster`
                  : delta === 0 ? 'on track'
                  : `⚠ ${delta!}d slower`;
                rightLabel = (
                  <span className={rightCx}>
                    {stage.days}d · Avg: {stage.benchmark}d · {deltaLabel}
                  </span>
                );
              }
            } else if (stage.status === 'current') {
              if (!hasBench) {
                rightLabel = <span className={rightCx}>{stage.days}d in</span>;
              } else {
                const remaining = stage.benchmark! - stage.days;
                rightLabel = remaining > 0
                  ? <span className={rightCx}>{stage.days}d in · avg {stage.benchmark}d · {remaining}d remaining</span>
                  : <span className="text-red-600">{stage.days}d in · {Math.abs(remaining)}d over avg</span>;
              }
            } else {
              let estText: string;
              if (stage.benchmarkMin != null && stage.benchmarkMax != null) {
                estText = `Est. ${stage.benchmarkMin}–${stage.benchmarkMax}d`;
              } else if (hasBench) {
                estText = `Est. ${Math.round(stage.benchmark! * 0.8)}–${Math.round(stage.benchmark! * 1.2)}d`;
              } else {
                estText = '—';
              }
              rightLabel = <span className={rightCx}>{estText}</span>;
            }

            return (
              <div key={idx} className="flex items-center gap-3 h-9">
                {/* Stage name */}
                <div className="w-28 flex-shrink-0 flex items-center gap-1 min-w-0">
                  <span className={`text-xs font-medium truncate leading-none ${
                    stage.status === 'current' ? 'text-blue-900' :
                    stage.status === 'pending' ? 'text-gray-400' :
                    'text-gray-700'
                  }`}>
                    {stage.name}
                  </span>
                  {stage.status === 'current' && (
                    <span className="px-1 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold rounded flex-shrink-0">NOW</span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barFillCx}`}
                    style={{ width: `${fillPct}%` }}
                  />
                </div>

                {/* Stats */}
                <div className="w-56 flex-shrink-0 text-right text-[11px] leading-none">
                  {rightLabel}
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic AI Insight */}
        <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-start space-x-2">
            <Sparkles className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-purple-900">
              <span className="font-semibold">AI Insight:</span> {aiInsightText}
            </div>
          </div>
        </div>
      </div>

      {/* Product/Service */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Product/Service:</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Package className="h-5 w-5 text-gray-500" />
            <div>
              <span className="text-sm text-gray-600">Package:</span>
              <span className="text-sm font-medium text-gray-900 ml-2">{deal.package}</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-gray-500" />
            <div>
              <span className="text-sm text-gray-600">Contract Term:</span>
              <span className="text-sm font-medium text-gray-900 ml-2">{deal.contractTerm}</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <CreditCard className="h-5 w-5 text-gray-500" />
            <div>
              <span className="text-sm text-gray-600">Payment Terms:</span>
              <span className="text-sm font-medium text-gray-900 ml-2">{deal.paymentTerms}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div>
        <div className="flex items-center space-x-2 mb-3">
          <Tag className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">Tags:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {deal.tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full"
            >
              {tag}
            </span>
          ))}
          <button className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full hover:bg-gray-200 transition-colors">
            + Add Tag
          </button>
        </div>
      </div>

      {/* Competitive Intelligence */}
      {competitors && competitors.length > 0 && (
        <div ref={battleCardRef} className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <Shield className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">Competitive Intelligence:</span>
          </div>
          <div className="space-y-2">
            {competitors.map(competitor => {
              const key = competitor.toLowerCase();
              const card = BATTLE_CARDS[key];
              const isOpen = openBattleCard === key;

              return (
                <div key={competitor} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Accordion header */}
                  <button
                    type="button"
                    onClick={() => setOpenBattleCard(isOpen ? null : key)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      {isOpen
                        ? <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        : <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      }
                      <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                      <span className="text-sm font-semibold text-gray-900">{competitor}</span>
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded">
                        Competitor
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {isOpen ? 'Hide' : 'View Battle Card'}
                    </span>
                  </button>

                  {/* Battle card body */}
                  {isOpen && (
                    <div className="border-t border-gray-200 bg-white">
                      {card ? (
                        <div className="p-4 space-y-4">
                          {/* We Win When */}
                          <div>
                            <div className="flex items-center gap-1.5 mb-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                              <span className="text-[11px] font-bold text-green-800 uppercase tracking-wide">We Win When</span>
                            </div>
                            <ul className="space-y-1.5 pl-1">
                              {card.weWinWhen.map((point, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                  <span className="text-green-500 font-bold flex-shrink-0 mt-0.5 text-xs">✓</span>
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* They Win When */}
                          <div>
                            <div className="flex items-center gap-1.5 mb-2">
                              <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                              <span className="text-[11px] font-bold text-red-700 uppercase tracking-wide">They Win When</span>
                            </div>
                            <ul className="space-y-1.5 pl-1">
                              {card.theyWinWhen.map((point, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                  <span className="text-red-400 font-bold flex-shrink-0 mt-0.5 text-xs">✕</span>
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Killer Question */}
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Target className="h-4 w-4 text-blue-600 flex-shrink-0" />
                              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wide">Killer Question to Ask</span>
                            </div>
                            <p className="text-sm text-blue-900 italic">"{card.killerQuestion}"</p>
                          </div>

                          {/* Proof Point */}
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Trophy className="h-4 w-4 text-purple-600 flex-shrink-0" />
                              <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wide">Proof Point</span>
                            </div>
                            <p className="text-sm text-purple-900">
                              <span className="font-semibold">{card.proofPoint.company}:</span>{' '}
                              {card.proofPoint.outcome}
                            </p>
                          </div>

                          {/* Footer: copy + admin update */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <button
                              type="button"
                              onClick={() => handleCopyTalkingPoints(key, card.weWinWhen)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              {copiedCompetitor === key ? (
                                <>
                                  <Check className="h-3.5 w-3.5 text-green-500" />
                                  <span className="text-green-700">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" />
                                  Copy talking points
                                </>
                              )}
                            </button>
                            {isAdmin && (
                              <button
                                type="button"
                                className="text-xs text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                              >
                                Update Battle Card
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4">
                          <p className="text-sm text-gray-500">No battle card data available for {competitor}.</p>
                          {isAdmin && (
                            <button type="button" className="mt-2 text-xs text-blue-600 hover:underline">
                              + Create Battle Card
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
