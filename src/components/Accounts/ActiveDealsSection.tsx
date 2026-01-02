import React from 'react';
import { Briefcase, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Clock, DollarSign, Calendar } from 'lucide-react';

export interface Deal {
  id: string;
  name: string;
  stage: string;
  value: number;
  closeDate: string;
  probability: number;
  health?: 'excellent' | 'good' | 'at-risk' | 'critical';
  lastActivity?: string;
  daysInStage?: number;
  nextStep?: string;
}

interface ActiveDealsSectionProps {
  deals: Deal[];
  onDealClick?: (dealId: string) => void;
  onAddDeal?: () => void;
}

const ActiveDealsSection: React.FC<ActiveDealsSectionProps> = ({ deals, onDealClick, onAddDeal }) => {
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  const getHealthColor = (health?: string) => {
    switch (health) {
      case 'excellent':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'good':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'at-risk':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getHealthIcon = (health?: string) => {
    switch (health) {
      case 'excellent':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'good':
        return <TrendingUp className="h-4 w-4" />;
      case 'at-risk':
        return <AlertTriangle className="h-4 w-4" />;
      case 'critical':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Briefcase className="h-4 w-4" />;
    }
  };

  const getHealthLabel = (health?: string) => {
    switch (health) {
      case 'excellent':
        return 'Excellent';
      case 'good':
        return 'Good';
      case 'at-risk':
        return 'At Risk';
      case 'critical':
        return 'Critical';
      default:
        return 'Unknown';
    }
  };

  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
  const weightedProbability =
    deals.length > 0
      ? Math.round(deals.reduce((sum, deal) => sum + deal.probability, 0) / deals.length)
      : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Briefcase className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">ACTIVE DEALS</h3>
              <p className="text-xs text-gray-500">
                {deals.length} {deals.length === 1 ? 'deal' : 'deals'} • {formatCurrency(totalValue)} pipeline
              </p>
            </div>
          </div>
          <button
            onClick={onAddDeal}
            className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200"
          >
            + New Deal
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <div className="flex items-center space-x-2 mb-1">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-blue-700 font-medium">Total Pipeline</span>
            </div>
            <p className="text-xl font-bold text-blue-900">{formatCurrency(totalValue)}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 border border-green-100">
            <div className="flex items-center space-x-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-xs text-green-700 font-medium">Avg Probability</span>
            </div>
            <p className="text-xl font-bold text-green-900">{weightedProbability}%</p>
          </div>
        </div>

        {/* Deals List */}
        <div className="space-y-3">
          {deals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm">No active deals</p>
            </div>
          ) : (
            deals.map((deal) => (
              <div
                key={deal.id}
                onClick={() => onDealClick?.(deal.id)}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
              >
                {/* Deal Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-gray-900 mb-1">{deal.name}</h4>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                        {deal.stage}
                      </span>
                      {deal.health && (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium border flex items-center space-x-1 ${getHealthColor(deal.health)}`}>
                          {getHealthIcon(deal.health)}
                          <span>{getHealthLabel(deal.health)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(deal.value)}</p>
                    <p className="text-xs text-gray-500">{deal.probability}% prob</p>
                  </div>
                </div>

                {/* Deal Details */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center space-x-1 text-gray-600">
                    <Calendar className="h-3 w-3" />
                    <span>Close: {deal.closeDate}</span>
                  </div>
                  {deal.daysInStage !== undefined && (
                    <div className="flex items-center space-x-1 text-gray-600">
                      <Clock className="h-3 w-3" />
                      <span>{deal.daysInStage} days in stage</span>
                    </div>
                  )}
                </div>

                {/* Next Step */}
                {deal.nextStep && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-600">
                      <span className="font-semibold">Next:</span> {deal.nextStep}
                    </p>
                  </div>
                )}

                {/* Last Activity */}
                {deal.lastActivity && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">
                      Last activity: {deal.lastActivity}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Health Summary */}
        {deals.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Deal Health Summary</h4>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-green-50 rounded p-2 border border-green-200">
                <p className="text-lg font-bold text-green-700">
                  {deals.filter((d) => d.health === 'excellent').length}
                </p>
                <p className="text-xs text-green-600">Excellent</p>
              </div>
              <div className="bg-blue-50 rounded p-2 border border-blue-200">
                <p className="text-lg font-bold text-blue-700">
                  {deals.filter((d) => d.health === 'good').length}
                </p>
                <p className="text-xs text-blue-600">Good</p>
              </div>
              <div className="bg-yellow-50 rounded p-2 border border-yellow-200">
                <p className="text-lg font-bold text-yellow-700">
                  {deals.filter((d) => d.health === 'at-risk').length}
                </p>
                <p className="text-xs text-yellow-600">At Risk</p>
              </div>
              <div className="bg-red-50 rounded p-2 border border-red-200">
                <p className="text-lg font-bold text-red-700">
                  {deals.filter((d) => d.health === 'critical').length}
                </p>
                <p className="text-xs text-red-600">Critical</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveDealsSection;
