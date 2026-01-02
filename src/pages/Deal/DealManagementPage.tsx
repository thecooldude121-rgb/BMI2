import React, { useState } from 'react';
import { LayoutGrid, List, Plus, Settings, BarChart3, Filter, Users, TrendingUp, DollarSign, Target } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

// Simplified types for initial implementation
interface SimpleDeal {
  id: string;
  name: string;
  amount: number;
  stage: string;
  probability: number;
  ownerId: string;
  createdAt: string;
  customFields?: Record<string, any>;
}

interface SimpleStage {
  id: string;
  name: string;
  color: string;
  probability: number;
}

const DealManagementPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedDeal, setSelectedDeal] = useState<SimpleDeal | null>(null);
  const [showDealDetail, setShowDealDetail] = useState(false);
  const { deals } = useData();

  // Simple pipeline stages
  const stages: SimpleStage[] = [
    { id: 'lead', name: 'Lead', color: '#6B7280', probability: 10 },
    { id: 'qualified', name: 'Qualified', color: '#3B82F6', probability: 25 },
    { id: 'proposal', name: 'Proposal', color: '#F59E0B', probability: 50 },
    { id: 'negotiation', name: 'Negotiation', color: '#EF4444', probability: 75 },
    { id: 'closed-won', name: 'Closed Won', color: '#10B981', probability: 100 },
    { id: 'closed-lost', name: 'Closed Lost', color: '#6B7280', probability: 0 }
  ];

  // Convert existing deals to simplified format
  const simpleDeals: SimpleDeal[] = deals.map(deal => ({
    id: deal.id,
    name: deal.title || deal.name || `Deal ${deal.id}`,
    amount: deal.value,
    stage: deal.stage === 'closed-won' ? 'closed-won' : 
           deal.stage === 'closed-lost' ? 'closed-lost' :
           deal.stage === 'negotiation' ? 'negotiation' :
           deal.stage === 'proposal' ? 'proposal' : 'qualified',
    probability: deal.probability,
    ownerId: deal.assignedTo,
    createdAt: deal.createdAt,
    customFields: {}
  }));

  const handleDealMove = (dealId: string, newStage: string) => {
    console.log(`Moving deal ${dealId} to stage ${newStage}`);
  };

  const handleDealClick = (deal: SimpleDeal) => {
    setSelectedDeal(deal);
    setShowDealDetail(true);
  };

  const getStageDeals = (stageId: string) => {
    return simpleDeals.filter(deal => deal.stage === stageId);
  };

  const getStageValue = (stageId: string) => {
    return getStageDeals(stageId).reduce((sum, deal) => sum + deal.amount, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate dashboard metrics
  const totalPipelineValue = simpleDeals.reduce((sum, deal) => sum + deal.amount, 0);
  const weightedPipelineValue = simpleDeals.reduce((sum, deal) => sum + (deal.amount * deal.probability / 100), 0);
  const avgDealSize = simpleDeals.length > 0 ? totalPipelineValue / simpleDeals.length : 0;
  const avgProbability = simpleDeals.length > 0 ? simpleDeals.reduce((sum, deal) => sum + deal.probability, 0) / simpleDeals.length : 0;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <Target className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Deal Management</h1>
                <p className="text-gray-600 text-lg">Manage your sales pipeline and drive revenue growth</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* View Toggle */}
              <div className="flex border border-gray-300 rounded-xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`flex items-center px-4 py-3 text-sm font-medium transition-all ${
                    viewMode === 'kanban'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 bg-white'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Kanban
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center px-4 py-3 text-sm font-medium border-l transition-all ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 bg-white'
                  }`}
                >
                  <List className="h-4 w-4 mr-2" />
                  List
                </button>
              </div>

              <button className="flex items-center px-4 py-3 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm bg-white">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </button>
              
              <button className="flex items-center px-4 py-3 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm bg-white">
                <Settings className="h-4 w-4 mr-2" />
                Pipeline Settings
              </button>
              
              <button className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                New Deal
              </button>
            </div>
          </div>

          {/* Enhanced Dashboard Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Pipeline</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {formatCurrency(totalPipelineValue)}
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    {simpleDeals.length} active deals
                  </p>
                </div>
                <div className="p-3 bg-blue-200 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-700" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Weighted Pipeline</p>
                  <p className="text-2xl font-bold text-green-700">
                    {formatCurrency(weightedPipelineValue)}
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    Probability adjusted
                  </p>
                </div>
                <div className="p-3 bg-green-200 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-700" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Avg Deal Size</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {formatCurrency(avgDealSize)}
                  </p>
                  <p className="text-sm text-purple-600 mt-1">
                    Per opportunity
                  </p>
                </div>
                <div className="p-3 bg-purple-200 rounded-lg">
                  <Target className="h-6 w-6 text-purple-700" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Avg Probability</p>
                  <p className="text-2xl font-bold text-orange-700">
                    {avgProbability.toFixed(1)}%
                  </p>
                  <p className="text-sm text-orange-600 mt-1">
                    Win likelihood
                  </p>
                </div>
                <div className="p-3 bg-orange-200 rounded-lg">
                  <Users className="h-6 w-6 text-orange-700" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'kanban' ? (
          <div className="flex-1 overflow-x-auto p-6">
            <div className="flex h-full space-x-6 min-w-max">
              {stages.map((stage) => {
                const stageDeals = getStageDeals(stage.id);
                const stageValue = getStageValue(stage.id);
                
                return (
                  <div key={stage.id} className="flex-shrink-0 w-80">
                    {/* Stage Header */}
                    <div className="bg-white rounded-t-xl border border-gray-200 shadow-sm mb-3">
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: stage.color }}
                            />
                            <h3 className="font-medium text-gray-900">{stage.name}</h3>
                            <span className="text-sm text-gray-500">({stageDeals.length})</span>
                          </div>
                          <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            {formatCurrency(stageValue)}
                          </span>
                          <span className="text-gray-500">
                            {stage.probability}% avg
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stage Content */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 min-h-[500px]">
                      <div className="space-y-3">
                        {stageDeals.map((deal) => (
                          <div
                            key={deal.id}
                            onClick={() => handleDealClick(deal)}
                            className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-gray-300 group shadow-sm"
                          >
                            {/* Deal Header */}
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="font-medium text-gray-900 text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
                                {deal.name}
                              </h4>
                            </div>

                            {/* Deal Value */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center">
                                <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                                <span className="font-semibold text-green-600">
                                  {formatCurrency(deal.amount)}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {deal.probability}%
                              </span>
                            </div>

                            {/* Deal Owner */}
                            <div className="flex items-center mb-2">
                              <Users className="h-3 w-3 text-gray-400 mr-1" />
                              <span className="text-xs text-gray-600">
                                {deal.ownerId}
                              </span>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                              <span className="text-xs text-gray-500">
                                {new Date(deal.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                        
                        {/* Empty State */}
                        {stageDeals.length === 0 && (
                          <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Plus className="h-8 w-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 mb-2">No deals in this stage</p>
                            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline">
                              Add your first deal
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-8">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-5 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Deal Pipeline</h3>
                    <p className="text-sm text-gray-600">{simpleDeals.length} deals</p>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Deal Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Stage
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Probability
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Owner
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {simpleDeals.map((deal) => (
                      <tr key={deal.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDealClick(deal)}
                            className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                          >
                            {deal.name}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-900">
                            {formatCurrency(deal.amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                            {stages.find(s => s.id === deal.stage)?.name || deal.stage}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">{deal.probability}%</span>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${deal.probability}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900">{deal.ownerId}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-500">
                            {new Date(deal.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Deal Detail Modal */}
      {showDealDetail && selectedDeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 backdrop-blur-sm">
          <div className="relative top-4 mx-auto p-5 border w-full max-w-6xl shadow-2xl rounded-2xl bg-white">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedDeal.name}</h2>
                  <p className="text-gray-600">Deal Details</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDealDetail(false);
                  setSelectedDeal(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Deal Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Amount</label>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedDeal.amount)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Stage</label>
                    <p className="text-lg font-medium text-gray-900">
                      {stages.find(s => s.id === selectedDeal.stage)?.name || selectedDeal.stage}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Probability</label>
                    <p className="text-lg font-medium text-gray-900">{selectedDeal.probability}%</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Owner</label>
                    <p className="text-lg font-medium text-gray-900">{selectedDeal.ownerId}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Deal created on {new Date(selectedDeal.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealManagementPage;