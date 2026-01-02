import React, { useState, useEffect } from 'react';
import { DollarSign, AlertTriangle, CheckCircle, TrendingUp, Users, Calendar } from 'lucide-react';
import { fundingTriggerService } from '../../services/dataIntelligenceService';
import type { CompanyFundingTrigger, FundingTriggerSummary, AlertPriority } from '../../types/dataIntelligence';

interface CompanyTriggersWidgetProps {
  accountId?: string;
  showUnprocessedOnly?: boolean;
  maxItems?: number;
  onTriggerClick?: (trigger: CompanyFundingTrigger) => void;
}

const CompanyTriggersWidget: React.FC<CompanyTriggersWidgetProps> = ({
  accountId,
  showUnprocessedOnly = false,
  maxItems = 10,
  onTriggerClick
}) => {
  const [triggers, setTriggers] = useState<CompanyFundingTrigger[]>([]);
  const [summary, setSummary] = useState<FundingTriggerSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTriggers();
  }, [accountId, showUnprocessedOnly]);

  const loadTriggers = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (accountId) filters.account_id = accountId;
      if (showUnprocessedOnly) filters.is_processed = false;

      const { data } = await fundingTriggerService.getFundingTriggers(filters);
      setTriggers(data?.slice(0, maxItems) || []);

      const summaryData = await fundingTriggerService.getFundingSummary(accountId);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading funding triggers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkProcessed = async (triggerId: string) => {
    try {
      await fundingTriggerService.markAsProcessed(triggerId);
      loadTriggers();
    } catch (error) {
      console.error('Error marking trigger as processed:', error);
    }
  };

  const getPriorityBadge = (priority: AlertPriority) => {
    const badges = {
      urgent: { color: 'bg-red-100 text-red-700 border-red-300', icon: '🚨', label: 'Urgent' },
      high: { color: 'bg-orange-100 text-orange-700 border-orange-300', icon: '⚡', label: 'High' },
      medium: { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: '⚠️', label: 'Medium' },
      low: { color: 'bg-blue-100 text-blue-700 border-blue-300', icon: 'ℹ️', label: 'Low' }
    };
    return badges[priority] || badges.medium;
  };

  const getTriggerIcon = (type: string): string => {
    const icons: Record<string, string> = {
      funding: '💰',
      acquisition: '🤝',
      merger: '🔗',
      ipo: '📈',
      expansion: '🌍',
      leadership_change: '👔'
    };
    return icons[type] || '📢';
  };

  const formatCurrency = (amount?: number, currency: string = 'USD'): string => {
    if (!amount) return 'Undisclosed';
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1
    });
    return formatter.format(amount);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-24 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Company Triggers</h3>
              <p className="text-sm text-gray-600">Funding & M&A activity</p>
            </div>
          </div>
          {summary && summary.unprocessed_count > 0 && (
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-red-100 rounded-full">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-semibold text-red-700">
                {summary.unprocessed_count} new
              </span>
            </div>
          )}
        </div>

        {summary && (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-900">{summary.total_triggers}</div>
              <div className="text-xs text-green-700">Total Triggers</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-900">
                {formatCurrency(summary.total_amount)}
              </div>
              <div className="text-xs text-blue-700">Total Funding</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-900">{summary.unprocessed_count}</div>
              <div className="text-xs text-orange-700">To Process</div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6">
        {triggers.length === 0 ? (
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No company triggers</p>
            <p className="text-sm text-gray-500 mt-1">
              We'll notify you of funding rounds and M&A activity
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {triggers.map((trigger) => {
              const priorityBadge = getPriorityBadge(trigger.priority_level);

              return (
                <div
                  key={trigger.id}
                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    !trigger.is_processed
                      ? 'border-green-200 bg-green-50 hover:border-green-300'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                  onClick={() => onTriggerClick?.(trigger)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{getTriggerIcon(trigger.trigger_type)}</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-base font-semibold text-gray-900 capitalize">
                            {trigger.trigger_type.replace(/_/g, ' ')}
                          </h4>
                          {!trigger.is_processed && (
                            <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-semibold rounded">
                              NEW
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1 text-xs text-gray-600">
                          <Calendar className="h-3 w-3" />
                          <span>Announced {formatDate(trigger.announced_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`flex items-center px-2 py-1 rounded border ${priorityBadge.color}`}>
                      <span className="mr-1">{priorityBadge.icon}</span>
                      <span className="text-xs font-semibold">{priorityBadge.label}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {trigger.funding_amount && (
                      <div className="flex items-center space-x-2 p-2 bg-white rounded border border-gray-200">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <div>
                          <div className="text-xs text-gray-500">Amount</div>
                          <div className="text-sm font-bold text-gray-900">
                            {formatCurrency(trigger.funding_amount, trigger.currency)}
                          </div>
                        </div>
                      </div>
                    )}
                    {trigger.funding_stage && (
                      <div className="flex items-center space-x-2 p-2 bg-white rounded border border-gray-200">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        <div>
                          <div className="text-xs text-gray-500">Stage</div>
                          <div className="text-sm font-semibold text-gray-900 capitalize">
                            {trigger.funding_stage.replace(/_/g, ' ')}
                          </div>
                        </div>
                      </div>
                    )}
                    {trigger.lead_investor && (
                      <div className="flex items-center space-x-2 p-2 bg-white rounded border border-gray-200">
                        <Users className="h-4 w-4 text-purple-600" />
                        <div>
                          <div className="text-xs text-gray-500">Lead Investor</div>
                          <div className="text-sm font-medium text-gray-900">
                            {trigger.lead_investor}
                          </div>
                        </div>
                      </div>
                    )}
                    {trigger.valuation && (
                      <div className="flex items-center space-x-2 p-2 bg-white rounded border border-gray-200">
                        <TrendingUp className="h-4 w-4 text-orange-600" />
                        <div>
                          <div className="text-xs text-gray-500">Valuation</div>
                          <div className="text-sm font-bold text-gray-900">
                            {formatCurrency(trigger.valuation, trigger.currency)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {trigger.action_items.length > 0 && (
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h5 className="text-xs font-semibold text-blue-900 mb-2">
                        Recommended Actions:
                      </h5>
                      <ul className="space-y-1">
                        {trigger.action_items.slice(0, 3).map((item, idx) => (
                          <li key={idx} className="text-xs text-blue-700 flex items-start">
                            <span className="mr-1.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {trigger.investors.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-700 mb-1">Investors:</div>
                      <div className="flex flex-wrap gap-1">
                        {trigger.investors.slice(0, 5).map((investor, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded"
                          >
                            {investor}
                          </span>
                        ))}
                        {trigger.investors.length > 5 && (
                          <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                            +{trigger.investors.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      {trigger.is_processed ? (
                        <span className="flex items-center text-xs text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Processed
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkProcessed(trigger.id);
                          }}
                          className="flex items-center px-3 py-1.5 text-xs font-semibold text-green-700 bg-white border border-green-300 rounded-lg hover:bg-green-50 transition-colors"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Mark as Processed
                        </button>
                      )}
                    </div>
                    {trigger.deal_stage && (
                      <span className="text-xs text-gray-500">
                        Deal Stage: {trigger.deal_stage}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {summary && Object.keys(summary.by_stage).length > 0 && (
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Funding Breakdown</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(summary.by_stage).map(([stage, count]) => (
              <div
                key={stage}
                className="flex items-center px-3 py-2 bg-white border border-gray-200 rounded-lg"
              >
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {stage.replace(/_/g, ' ')}
                </span>
                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyTriggersWidget;
