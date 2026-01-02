import React from 'react';
import { DollarSign, TrendingUp, Calendar, Package, CreditCard, Clock, Sparkles, CheckCircle2, Circle, ArrowRight, Tag } from 'lucide-react';

interface Stage {
  name: string;
  days: number;
  startDate: string;
  endDate: string;
  status: 'completed' | 'current' | 'pending';
}

interface DealDetailsPanelProps {
  deal: {
    dealName: string;
    amount: number;
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
}

export const DealDetailsPanel: React.FC<DealDetailsPanelProps> = ({ deal, stageHistory }) => {
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
            <span className="text-sm font-medium text-gray-900">${deal.amount.toLocaleString()}</span>
          </div>
          <div className="flex items-start">
            <span className="text-sm text-gray-600 w-40">Stage:</span>
            <span className="text-sm font-medium text-gray-900">{deal.stageName} (Stage {deal.stageNumber} of {deal.totalStages})</span>
          </div>
          <div className="flex items-start">
            <span className="text-sm text-gray-600 w-40">Close Date:</span>
            <span className="text-sm font-medium text-gray-900">{deal.closeDate}</span>
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

      {/* Deal Progression */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Deal Progression:</h3>
        <div className="space-y-3">
          {stageHistory.map((stage, idx) => (
            <div key={idx} className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {stage.status === 'completed' && (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
                {stage.status === 'current' && (
                  <ArrowRight className="h-5 w-5 text-blue-500" />
                )}
                {stage.status === 'pending' && (
                  <Circle className="h-5 w-5 text-gray-300" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${
                    stage.status === 'completed' ? 'text-gray-900' :
                    stage.status === 'current' ? 'text-blue-900 font-bold' :
                    'text-gray-500'
                  }`}>
                    {stage.name} ({stage.days} days)
                  </span>
                  {stage.status === 'current' && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded">CURRENT</span>
                  )}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {stage.startDate} {stage.endDate && `to ${stage.endDate}`}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-start space-x-2">
            <Sparkles className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-purple-900">
              <span className="font-semibold">AI Insight:</span> Average time in Proposal stage for similar deals is 12 days. You're on track!
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
    </div>
  );
};
