import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, MoreHorizontal, Filter, Search, Calendar, DollarSign, User, Clock, Target, ArrowUp, ArrowDown, Zap, Star, Briefcase, Globe, TrendingUp } from 'lucide-react';
import { Deal, DealPipeline, DealStage, DealFilters } from '../../types/dealManagement';

interface DealKanbanViewProps {
  pipeline: DealPipeline;
  deals: Deal[];
  filters: DealFilters;
  onDealMove: (dealId: string, newStageId: string) => void;
  onDealClick: (deal: Deal) => void;
  onAddDeal: (stageId: string) => void;
  onFiltersChange: (filters: DealFilters) => void;
}

const DealKanbanView: React.FC<DealKanbanViewProps> = ({
  pipeline,
  deals,
  filters,
  onDealMove,
  onDealClick,
  onAddDeal,
  onFiltersChange
}) => {
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>(deals);
  const [searchTerm, setSearchTerm] = useState(filters.searchTerm || '');
  const [draggedDeal, setDraggedDeal] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    let filtered = deals;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(deal =>
        deal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.dealNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Owner filter
    if (filters.ownerId) {
      filtered = filtered.filter(deal => deal.ownerId === filters.ownerId);
    }

    // Stage filter
    if (filters.stageId) {
      filtered = filtered.filter(deal => deal.stageId === filters.stageId);
    }

    // Amount range filter
    if (filters.amountRange) {
      filtered = filtered.filter(deal => 
        deal.amount >= filters.amountRange!.min && 
        deal.amount <= filters.amountRange!.max
      );
    }

    // Country filter
    if (filters.country) {
      filtered = filtered.filter(deal => deal.country === filters.country);
    }

    // Deal type filter
    if (filters.dealType) {
      filtered = filtered.filter(deal => deal.dealType === filters.dealType);
    }

    setFilteredDeals(filtered);
  }, [deals, filters, searchTerm]);

  const handleDragStart = (start: any) => {
    setDraggedDeal(start.draggableId);
    setIsDragging(true);
    document.body.style.cursor = 'grabbing';
  };

  const handleDragEnd = (result: DropResult) => {
    setDraggedDeal(null);
    setIsDragging(false);
    document.body.style.cursor = 'default';

    if (!result.destination) return;

    const dealId = result.draggableId;
    const newStageId = result.destination.droppableId;

    onDealMove(dealId, newStageId);
  };

  const getStageDeals = (stageId: string) => {
    return filteredDeals.filter(deal => deal.stageId === stageId);
  };

  const getStageValue = (stageId: string) => {
    return getStageDeals(stageId).reduce((sum, deal) => sum + deal.amount, 0);
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getDaysInStage = (deal: Deal) => {
    const currentStageEntry = deal.stageHistory.find(entry => 
      entry.toStageId === deal.stageId && !entry.exitedAt
    );
    if (!currentStageEntry) return 0;
    
    const daysDiff = Math.floor(
      (new Date().getTime() - new Date(currentStageEntry.enteredAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysDiff;
  };

  const getTemperatureColor = (days: number) => {
    if (days > 30) return 'bg-red-50 text-red-600 border-red-200';
    if (days > 14) return 'bg-yellow-50 text-yellow-600 border-yellow-200';
    return 'bg-green-50 text-green-600 border-green-200';
  };

  const getPriorityIcon = (deal: Deal) => {
    const highValue = deal.amount > 100000;
    const urgentClose = deal.closingDate && new Date(deal.closingDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    if (highValue && urgentClose) return <Star className="h-3 w-3 text-amber-500" />;
    if (highValue) return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (urgentClose) return <Zap className="h-3 w-3 text-orange-500" />;
    return null;
  };

  const renderCustomFields = (deal: Deal) => {
    if (!deal.customFields || Object.keys(deal.customFields).length === 0) return null;

    return (
      <div className="mt-2 pt-2 border-t border-gray-100">
        {Object.entries(deal.customFields).slice(0, 2).map(([key, value]) => (
          <div key={key} className="flex justify-between items-center text-xs">
            <span className="text-gray-500 truncate">{key}:</span>
            <span className="text-gray-700 font-medium truncate ml-1">{String(value)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Enhanced Header with Modern Design */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{pipeline.name}</h2>
                  <p className="text-sm text-gray-600">Sales Pipeline Management</p>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg">
                  <Briefcase className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-700 font-medium">
                    {filteredDeals.length} deals
                  </span>
                </div>
                <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 rounded-lg">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-green-700 font-medium">
                    {formatCurrency(filteredDeals.reduce((sum, deal) => sum + deal.amount, 0))}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search deals..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    onFiltersChange({ ...filters, searchTerm: e.target.value });
                  }}
                  className="pl-10 pr-4 py-2.5 w-80 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                />
              </div>
              
              <button className="flex items-center px-4 py-2.5 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm bg-white">
                <Filter className="h-4 w-4 mr-2" />
                Advanced Filters
              </button>
            </div>
          </div>

          {/* Pipeline Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {pipeline.stages.slice(0, 4).map((stage) => {
              const stageDeals = getStageDeals(stage.id);
              const stageValue = getStageValue(stage.id);
              const percentage = filteredDeals.length > 0 ? (stageDeals.length / filteredDeals.length) * 100 : 0;
              
              return (
                <div key={stage.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      <span className="font-medium text-gray-900 text-sm">{stage.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{stageDeals.length}</span>
                  </div>
                  <div className="mb-2">
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(stageValue)}
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
              );
            })}
          </div>
        </div>
      </div>

      {/* Enhanced Kanban Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <DragDropContext 
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex h-full space-x-6 min-w-max">
            {pipeline.stages.map((stage) => {
              const stageDeals = getStageDeals(stage.id);
              const stageValue = getStageValue(stage.id);
              const isDragTarget = isDragging && stageDeals.some(deal => deal.id === draggedDeal);
              
              return (
                <div key={stage.id} className="flex-shrink-0 w-80">
                  {/* Modern Stage Header */}
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
                            <p className="text-xs text-gray-500">{stageDeals.length} deals</p>
                          </div>
                        </div>
                        <button
                          onClick={() => onAddDeal(stage.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700">
                          {formatCurrency(stageValue)}
                        </span>
                        <div className="flex items-center space-x-1">
                          <span className="text-gray-500">{stage.probability}%</span>
                          <span className="text-xs text-gray-400">avg</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Droppable Area */}
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
                            const priorityIcon = getPriorityIcon(deal);
                            const isBeingDragged = draggedDeal === deal.id;
                            
                            return (
                              <Draggable key={deal.id} draggableId={deal.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() => onDealClick(deal)}
                                    className={`bg-white rounded-xl border border-gray-200 p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-gray-300 group ${
                                      snapshot.isDragging 
                                        ? 'shadow-2xl rotate-3 scale-105 border-blue-300' 
                                        : isBeingDragged
                                        ? 'opacity-50'
                                        : 'shadow-sm'
                                    }`}
                                  >
                                    {/* Deal Header */}
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-1">
                                          {priorityIcon}
                                          <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
                                            {deal.name}
                                          </h4>
                                        </div>
                                        <p className="text-xs text-gray-500 font-mono">
                                          #{deal.dealNumber}
                                        </p>
                                      </div>
                                      <button className="p-1 text-gray-400 hover:text-gray-600 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </button>
                                    </div>

                                    {/* Deal Value with Enhanced Styling */}
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center space-x-1">
                                        <div className="p-1 bg-green-100 rounded">
                                          <DollarSign className="h-3 w-3 text-green-600" />
                                        </div>
                                        <span className="font-bold text-green-700">
                                          {formatCurrency(deal.amount, deal.currency)}
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
                                          <User className="h-3 w-3" />
                                          <span className="truncate">{deal.ownerId}</span>
                                        </div>
                                        <div className="flex items-center space-x-1 text-gray-600">
                                          <Globe className="h-3 w-3" />
                                          <span>{deal.country}</span>
                                        </div>
                                      </div>

                                      {deal.closingDate && (
                                        <div className="flex items-center space-x-1 text-xs text-gray-600">
                                          <Calendar className="h-3 w-3" />
                                          <span>{new Date(deal.closingDate).toLocaleDateString()}</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Days in Stage with Modern Styling */}
                                    <div className="flex items-center justify-between mb-3">
                                      <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getTemperatureColor(daysInStage)}`}>
                                        <Clock className="h-3 w-3 inline mr-1" />
                                        {daysInStage} days
                                      </span>
                                      
                                      {/* Activity Indicators */}
                                      <div className="flex items-center space-x-1">
                                        {deal.tasks?.filter(t => t.status === 'open').length > 0 && (
                                          <span className="bg-orange-100 text-orange-700 text-xs px-1.5 py-0.5 rounded font-medium">
                                            {deal.tasks.filter(t => t.status === 'open').length}T
                                          </span>
                                        )}
                                        {deal.emails?.filter(e => e.status === 'draft').length > 0 && (
                                          <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded font-medium">
                                            {deal.emails.filter(e => e.status === 'draft').length}E
                                          </span>
                                        )}
                                      </div>
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

                                    {/* Custom Fields */}
                                    {renderCustomFields(deal)}

                                    {/* Hover Actions */}
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pt-2 border-t border-gray-100">
                                      <div className="flex items-center justify-between">
                                        <div className="flex space-x-1">
                                          <button className="p-1 text-gray-400 hover:text-blue-600 rounded">
                                            <Calendar className="h-3 w-3" />
                                          </button>
                                          <button className="p-1 text-gray-400 hover:text-green-600 rounded">
                                            <Phone className="h-3 w-3" />
                                          </button>
                                        </div>
                                        <span className="text-xs text-gray-400">
                                          Click to view details
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                        </div>
                        {provided.placeholder}
                        
                        {/* Enhanced Empty State */}
                        {stageDeals.length === 0 && (
                          <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Plus className="h-8 w-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 mb-2">No deals in this stage</p>
                            <button
                              onClick={() => onAddDeal(stage.id)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                            >
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
        </DragDropContext>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={() => onAddDeal(pipeline.stages[0]?.id)}
          className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};

export default DealKanbanView;