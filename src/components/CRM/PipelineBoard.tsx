import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, MoreHorizontal, Filter, Search, Calendar, DollarSign, User, Clock, Target } from 'lucide-react';
import { Deal, Pipeline, PipelineStage } from '../../types/crm';
import { useData } from '../../contexts/DataContext';

interface PipelineBoardProps {
  pipeline: Pipeline;
  deals: Deal[];
  onDealMove: (dealId: string, newStageId: string) => void;
  onDealClick: (deal: Deal) => void;
  onAddDeal: (stageId: string) => void;
}

const PipelineBoard: React.FC<PipelineBoardProps> = ({
  pipeline,
  deals,
  onDealMove,
  onDealClick,
  onAddDeal
}) => {
  const { employees } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOwner, setFilterOwner] = useState('all');
  const [filteredDeals, setFilteredDeals] = useState(deals);

  useEffect(() => {
    let filtered = deals;

    if (searchTerm) {
      filtered = filtered.filter(deal =>
        deal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterOwner !== 'all') {
      filtered = filtered.filter(deal => deal.ownerId === filterOwner);
    }

    setFilteredDeals(filtered);
  }, [deals, searchTerm, filterOwner]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const dealId = result.draggableId;
    const newStageId = result.destination.droppableId;

    onDealMove(dealId, newStageId);
  };

  const getStageDeals = (stageId: string) => {
    return filteredDeals.filter(deal => deal.stageId === stageId);
  };

  const getStageValue = (stageId: string) => {
    return getStageDeals(stageId).reduce((sum, deal) => sum + deal.value, 0);
  };

  const getOwnerName = (ownerId: string) => {
    const owner = employees.find(emp => emp.id === ownerId);
    return owner ? owner.name : 'Unassigned';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getDaysInStage = (deal: Deal) => {
    const currentStageEntry = deal.stageHistory.find(entry => 
      entry.stageId === deal.stageId && !entry.exitedAt
    );
    if (!currentStageEntry) return 0;
    
    const daysDiff = Math.floor(
      (new Date().getTime() - new Date(currentStageEntry.enteredAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysDiff;
  };

  const getTemperatureColor = (days: number) => {
    if (days > 30) return 'text-red-500';
    if (days > 14) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900">{pipeline.name}</h2>
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {filteredDeals.length} deals • {formatCurrency(filteredDeals.reduce((sum, deal) => sum + deal.value, 0))}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search deals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={filterOwner}
            onChange={(e) => setFilterOwner(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Owners</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
          
          <button className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </button>
        </div>
      </div>

      {/* Pipeline Board */}
      <div className="flex-1 overflow-x-auto bg-gray-50">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex h-full min-w-max">
            {pipeline.stages.map((stage) => {
              const stageDeals = getStageDeals(stage.id);
              const stageValue = getStageValue(stage.id);
              
              return (
                <div key={stage.id} className="flex-shrink-0 w-80 bg-gray-100 border-r border-gray-200">
                  {/* Stage Header */}
                  <div className="p-4 bg-white border-b border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: stage.color }}
                        />
                        <h3 className="font-medium text-gray-900">{stage.name}</h3>
                        <span className="text-sm text-gray-500">({stageDeals.length})</span>
                      </div>
                      <button
                        onClick={() => onAddDeal(stage.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                      >
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

                  {/* Stage Content */}
                  <Droppable droppableId={stage.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`p-2 h-full overflow-y-auto ${
                          snapshot.isDraggingOver ? 'bg-blue-50' : ''
                        }`}
                      >
                        {stageDeals.map((deal, index) => {
                          const daysInStage = getDaysInStage(deal);
                          
                          return (
                            <Draggable key={deal.id} draggableId={deal.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => onDealClick(deal)}
                                  className={`mb-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
                                    snapshot.isDragging ? 'rotate-2 shadow-lg' : ''
                                  }`}
                                >
                                  {/* Deal Header */}
                                  <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                                      {deal.name}
                                    </h4>
                                    <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                                      <MoreHorizontal className="h-3 w-3" />
                                    </button>
                                  </div>

                                  {/* Deal Value */}
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center">
                                      <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                                      <span className="font-semibold text-green-600">
                                        {formatCurrency(deal.value)}
                                      </span>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                      {deal.probability}%
                                    </span>
                                  </div>

                                  {/* Deal Owner */}
                                  <div className="flex items-center mb-2">
                                    <User className="h-3 w-3 text-gray-400 mr-1" />
                                    <span className="text-xs text-gray-600">
                                      {getOwnerName(deal.ownerId)}
                                    </span>
                                  </div>

                                  {/* Expected Close Date */}
                                  {deal.expectedCloseDate && (
                                    <div className="flex items-center mb-2">
                                      <Calendar className="h-3 w-3 text-gray-400 mr-1" />
                                      <span className="text-xs text-gray-600">
                                        {new Date(deal.expectedCloseDate).toLocaleDateString()}
                                      </span>
                                    </div>
                                  )}

                                  {/* Days in Stage */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                      <Clock className="h-3 w-3 text-gray-400 mr-1" />
                                      <span className={`text-xs ${getTemperatureColor(daysInStage)}`}>
                                        {daysInStage} days in stage
                                      </span>
                                    </div>
                                    
                                    {/* Tags */}
                                    {deal.tags.length > 0 && (
                                      <div className="flex space-x-1">
                                        {deal.tags.slice(0, 2).map((tag, idx) => (
                                          <span
                                            key={idx}
                                            className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                                          >
                                            {tag}
                                          </span>
                                        ))}
                                        {deal.tags.length > 2 && (
                                          <span className="text-xs text-gray-500">
                                            +{deal.tags.length - 2}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                        
                        {/* Empty State */}
                        {stageDeals.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <div className="text-sm">No deals in this stage</div>
                            <button
                              onClick={() => onAddDeal(stage.id)}
                              className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Add first deal
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
    </div>
  );
};

export default PipelineBoard;