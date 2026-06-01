import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, DollarSign, Users, Calendar, Clock, MoreHorizontal, Star, TrendingUp, AlertTriangle } from 'lucide-react';
import { Deal, Pipeline } from '../../types/deals';

interface DealKanbanProps {
  deals: Deal[];
  pipelines: Pipeline[];
  onDealClick: (deal: Deal) => void;
  formatCurrency: (amount: number, currency?: string) => string;
  getAccountName: (accountId?: string) => string;
  getUserName: (userId: string) => string;
}

const DealKanban: React.FC<DealKanbanProps> = ({
  deals,
  pipelines,
  onDealClick,
  formatCurrency,
  getAccountName,
  getUserName
}) => {
  // Use the first pipeline for now (in a real app, this would be selectable)
  const activePipeline = pipelines[0];

  if (!activePipeline || !activePipeline.stages) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <p className="text-lg font-medium">No pipeline configured</p>
          <p className="text-sm">Please configure a pipeline to view deals</p>
        </div>
      </div>
    );
  }

  const getStageDeals = (stageId: string) => {
    return deals.filter(deal => deal.stageId === stageId && deal.pipelineId === activePipeline.id);
  };

  const getStageValue = (stageId: string) => {
    return getStageDeals(stageId).reduce((sum, deal) => sum + deal.amount, 0);
  };

  const getDaysInStage = (deal: Deal) => {
    const currentStageEntry = deal.stageHistory
      .filter(entry => entry.toStageId === deal.stageId)
      .sort((a, b) => new Date(b.enteredAt).getTime() - new Date(a.enteredAt).getTime())[0];
    
    if (!currentStageEntry) return 0;
    
    const daysDiff = Math.floor(
      (new Date().getTime() - new Date(currentStageEntry.enteredAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysDiff;
  };

  const getHealthIndicator = (deal: Deal) => {
    const daysInStage = getDaysInStage(deal);
    
    if (deal.health === 'stalled' || daysInStage > 30) {
      return <AlertTriangle className="h-3 w-3 text-red-500" />;
    }
    if (deal.priority === 'urgent' || deal.amount > 100000) {
      return <Star className="h-3 w-3 text-amber-500" />;
    }
    if (deal.probability > 75) {
      return <TrendingUp className="h-3 w-3 text-green-500" />;
    }
    return null;
  };

  const getTemperatureColor = (days: number) => {
    if (days > 30) return 'bg-red-50 text-red-600 border-red-200';
    if (days > 14) return 'bg-yellow-50 text-yellow-600 border-yellow-200';
    return 'bg-green-50 text-green-600 border-green-200';
  };

  return (
    <div className="flex h-full space-x-6 overflow-x-auto pb-6">
      {activePipeline.stages.map((stage) => {
        const stageDeals = getStageDeals(stage.id);
        const stageValue = getStageValue(stage.id);
        const percentage = deals.length > 0 ? (stageDeals.length / deals.length) * 100 : 0;
        
        return (
          <div key={stage.id} className="flex-shrink-0 w-80">
            {/* Stage Header */}
            <div className="bg-white rounded-t-xl border border-gray-200 shadow-sm mb-3">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full shadow-sm"
                      style={{ backgroundColor: stage.color }}
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                      <p className="text-xs text-gray-500">{stageDeals.length} deals • {percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">
                      {formatCurrency(stageValue)}
                    </span>
                    <span className="text-gray-500">
                      {stage.probability}% avg
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: stage.color 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Droppable Stage Content */}
            <Droppable droppableId={stage.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`min-h-[500px] rounded-xl p-3 transition-all duration-200 ${
                    snapshot.isDraggingOver 
                      ? 'bg-blue-50 border-2 border-dashed border-blue-300 shadow-lg' 
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="space-y-3">
                    {stageDeals.map((deal, index) => {
                      const daysInStage = getDaysInStage(deal);
                      const healthIndicator = getHealthIndicator(deal);
                      
                      return (
                        <Draggable key={deal.id} draggableId={deal.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white rounded-xl border border-gray-200 p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-gray-300 group ${
                                snapshot.isDragging 
                                  ? 'shadow-2xl rotate-3 scale-105 border-blue-300' 
                                  : 'shadow-sm'
                              }`}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('DealKanban: Deal card clicked:', deal);
                                onDealClick(deal);
                              }}
                            >
                              {/* Deal Header */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-1">
                                    {healthIndicator}
                                    <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
                                      {deal.name}
                                    </h4>
                                  </div>
                                  <p className="text-xs text-gray-500 font-mono">
                                    {deal.dealNumber}
                                  </p>
                                </div>
                                <button 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                  className="p-1 text-gray-400 hover:text-gray-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>
                              </div>

                              {/* Deal Value */}
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-1">
                                  <div className="p-1 bg-green-100 rounded">
                                    <DollarSign className="h-3 w-3 text-green-600" />
                                  </div>
                                  <span className="font-bold text-green-700">
                                    {formatCurrency(deal.amount)}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 bg-gray-200 rounded-full h-1">
                                    <div
                                      className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                                      style={{ width: `${deal.probability}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-600 font-medium">
                                    {deal.probability}%
                                  </span>
                                </div>
                              </div>

                              {/* Deal Metadata */}
                              <div className="space-y-2 mb-3">
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center space-x-1 text-gray-600">
                                    <Users className="h-3 w-3" />
                                    <span className="truncate">{getUserName(deal.ownerId)}</span>
                                  </div>
                                  <div className="flex items-center space-x-1 text-gray-600">
                                    <span className="truncate">{getAccountName(deal.accountId)}</span>
                                  </div>
                                </div>

                                {deal.expectedCloseDate && (
                                  <div className="flex items-center space-x-1 text-xs text-gray-600">
                                    <Calendar className="h-3 w-3" />
                                    <span>{new Date(deal.expectedCloseDate).toLocaleDateString()}</span>
                                  </div>
                                )}
                              </div>

                              {/* Days in Stage */}
                              <div className="flex items-center justify-between mb-3">
                                <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getTemperatureColor(daysInStage)}`}>
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  {daysInStage} days
                                </span>
                                
                                {/* Priority Badge */}
                                {deal.priority !== 'medium' && (
                                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                    deal.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                    deal.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {deal.priority}
                                  </span>
                                )}
                              </div>

                              {/* Tags */}
                              {deal.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {deal.tags.slice(0, 2).map((tag, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md font-medium"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                  {deal.tags.length > 2 && (
                                    <span className="text-xs text-gray-500 px-1">
                                      +{deal.tags.length - 2}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Activity Indicators */}
                              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <div className="flex space-x-1">
                                  {deal.activities.length > 0 && (
                                    <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded font-medium">
                                      {deal.activities.length}A
                                    </span>
                                  )}
                                  {deal.emails.length > 0 && (
                                    <span className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded font-medium">
                                      {deal.emails.length}E
                                    </span>
                                  )}
                                  {deal.attachments.length > 0 && (
                                    <span className="bg-purple-100 text-purple-700 text-xs px-1.5 py-0.5 rounded font-medium">
                                      {deal.attachments.length}F
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-gray-400">
                                  {new Date(deal.updatedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                  </div>
                  {provided.placeholder}
                  
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
              )}
            </Droppable>
          </div>
        );
      })}
    </div>
  );
};

export default DealKanban;