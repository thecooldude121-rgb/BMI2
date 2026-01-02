import React from 'react';
import { DollarSign, TrendingUp, Calendar, User, ExternalLink, AlertCircle } from 'lucide-react';

interface ActiveDealsSectionProps {
  deal: any;
  onViewDeal: () => void;
  onUpdateStage: () => void;
}

const ActiveDealsSection: React.FC<ActiveDealsSectionProps> = ({ deal, onViewDeal, onUpdateStage }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
          <DollarSign className="h-6 w-6 text-green-600" />
          <span>Active Deals (1)</span>
        </h2>
      </div>

      <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">{deal.title}</h3>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Value</p>
            <p className="text-2xl font-bold text-green-700">${deal.value.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Stage</p>
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
              {deal.stage}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Close Date</p>
            <p className="text-sm font-semibold text-gray-900 flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{deal.closeDate}</span>
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Owner</p>
            <p className="text-sm font-semibold text-gray-900 flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span>{deal.owner}</span>
            </p>
          </div>
        </div>

        {/* AI Deal Health */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
              <span>🤖</span>
              <span>AI Deal Health: {deal.aiHealth}/100</span>
            </h4>
            <span className="text-sm font-semibold text-green-700">Good</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-600 h-2.5 rounded-full"
              style={{ width: `${deal.aiHealth}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600 mb-1">Win Probability</p>
            <p className="text-lg font-bold text-green-700">{deal.winProbability}%</p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600 mb-1">Days in Stage</p>
            <p className="text-lg font-bold text-gray-900">{deal.daysInStage} days</p>
          </div>
        </div>

        <div className="p-3 bg-white rounded-lg border border-gray-200 mb-6">
          <p className="text-sm text-gray-600 mb-1">Last Activity</p>
          <p className="text-sm font-semibold text-gray-900">{deal.lastActivity}</p>
        </div>

        {/* Key Decision Makers */}
        <div className="mb-6">
          <h4 className="text-sm font-bold text-gray-900 mb-3">Key Decision Makers:</h4>
          <div className="space-y-2">
            <div className="p-3 bg-white rounded-lg border border-gray-200 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">John Smith (VP Sales)</p>
                <span className="inline-block px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full font-semibold mt-1">
                  Champion
                </span>
              </div>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">[Unknown CEO] - Final approver</p>
                  <p className="text-xs text-orange-700 mt-1 flex items-center space-x-1">
                    <span>🤖</span>
                    <span>Suggestion: Identify CEO contact</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onViewDeal}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
          >
            <ExternalLink className="h-4 w-4" />
            <span>View Full Deal</span>
          </button>
          <button
            onClick={onUpdateStage}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Update Stage
          </button>
        </div>
      </div>

      <button className="w-full mt-4 px-4 py-3 border-2 border-dashed border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors font-medium flex items-center justify-center space-x-2">
        <DollarSign className="h-5 w-5" />
        <span>Create New Deal</span>
      </button>
    </div>
  );
};

export default ActiveDealsSection;
