import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutGrid, List, Plus, Settings, Filter, Search, Download, 
  Upload, RefreshCw, Eye, Edit, Trash2, MoreHorizontal, 
  ChevronDown, ChevronUp, X, Check, AlertCircle, Users,
  DollarSign, TrendingUp, Target, Calendar, Star, Zap,
  ArrowUpDown, Columns, Save, Share, Copy, FileText,
  Mail, Phone, Video, CheckSquare, Clock, Building
} from 'lucide-react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Deal, Pipeline, DealFilters, DealColumn, CustomView, BulkAction, DEFAULT_DEAL_COLUMNS, SAMPLE_PIPELINES } from '../../types/deals';
import { generateSampleDeals, SAMPLE_ACCOUNTS, SAMPLE_CONTACTS, SAMPLE_USERS } from '../../utils/sampleDealsData';
import DealKanban from './DealKanban';
import CreateDealForm from './CreateDealForm';
import DealDetailPage from './DealDetailPage';
import BulkActionsBar from './BulkActionsBar';
import DealFiltersPanel from './DealFiltersPanel';
import CustomViewManager from './CustomViewManager';

const DealsModule: React.FC = () => {
  // State management
  const [deals, setDeals] = useState<Deal[]>([]);
  const [pipelines] = useState<Pipeline[]>(SAMPLE_PIPELINES);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDealDetail, setShowDealDetail] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showColumnChooser, setShowColumnChooser] = useState(false);
  const [showCustomViews, setShowCustomViews] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters and sorting
  const [filters, setFilters] = useState<DealFilters>({});
  const [columns, setColumns] = useState<DealColumn[]>(DEFAULT_DEAL_COLUMNS);
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');

  // Custom views
  const [customViews, setCustomViews] = useState<CustomView[]>([]);
  const [activeView, setActiveView] = useState<string>('default');

  // Initialize sample data
  useEffect(() => {
    setIsLoading(true);
    try {
      const sampleDeals = generateSampleDeals();
      setDeals(sampleDeals);
    } catch (err) {
      setError('Failed to load deals data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filtered and sorted deals
  const filteredDeals = useMemo(() => {
    let filtered = deals;

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(deal =>
        deal.name.toLowerCase().includes(search) ||
        deal.dealNumber.toLowerCase().includes(search) ||
        deal.description?.toLowerCase().includes(search) ||
        deal.notes?.toLowerCase().includes(search) ||
        deal.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }

    // Apply filters
    if (filters.status) {
      if (filters.status === 'open') {
        filtered = filtered.filter(deal => !deal.stageId.includes('closed'));
      } else if (filters.status === 'won') {
        filtered = filtered.filter(deal => deal.stageId === 'closed-won');
      } else if (filters.status === 'lost') {
        filtered = filtered.filter(deal => deal.stageId === 'closed-lost');
      }
    }

    if (filters.ownerId) {
      filtered = filtered.filter(deal => deal.ownerId === filters.ownerId);
    }

    if (filters.pipelineId) {
      filtered = filtered.filter(deal => deal.pipelineId === filters.pipelineId);
    }

    if (filters.stageId) {
      filtered = filtered.filter(deal => deal.stageId === filters.stageId);
    }

    if (filters.dealType) {
      filtered = filtered.filter(deal => deal.dealType === filters.dealType);
    }

    if (filters.priority) {
      filtered = filtered.filter(deal => deal.priority === filters.priority);
    }

    if (filters.health) {
      filtered = filtered.filter(deal => deal.health === filters.health);
    }

    if (filters.amountRange) {
      filtered = filtered.filter(deal => 
        deal.amount >= filters.amountRange!.min && 
        deal.amount <= filters.amountRange!.max
      );
    }

    if (filters.dateRange) {
      filtered = filtered.filter(deal => {
        if (!deal.expectedCloseDate) return false;
        const closeDate = new Date(deal.expectedCloseDate);
        const startDate = new Date(filters.dateRange!.start);
        const endDate = new Date(filters.dateRange!.end);
        return closeDate >= startDate && closeDate <= endDate;
      });
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(deal =>
        filters.tags!.some(tag => deal.tags.includes(tag))
      );
    }

    // Sort deals
    filtered.sort((a, b) => {
      let aValue = a[sortBy as keyof Deal];
      let bValue = b[sortBy as keyof Deal];

      if (aValue == null) aValue = '';
      if (bValue == null) bValue = '';

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [deals, searchTerm, filters, sortBy, sortOrder]);

  // Paginated deals
  const paginatedDeals = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredDeals.slice(startIndex, startIndex + pageSize);
  }, [filteredDeals, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredDeals.length / pageSize);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalValue = filteredDeals.reduce((sum, deal) => sum + deal.amount, 0);
    const weightedValue = filteredDeals.reduce((sum, deal) => sum + (deal.amount * deal.probability / 100), 0);
    const wonDeals = filteredDeals.filter(deal => deal.stageId === 'closed-won');
    const lostDeals = filteredDeals.filter(deal => deal.stageId === 'closed-lost');
    const openDeals = filteredDeals.filter(deal => !deal.stageId.includes('closed'));
    
    return {
      totalDeals: filteredDeals.length,
      totalValue,
      weightedValue,
      avgDealSize: filteredDeals.length > 0 ? totalValue / filteredDeals.length : 0,
      wonCount: wonDeals.length,
      wonValue: wonDeals.reduce((sum, deal) => sum + deal.amount, 0),
      lostCount: lostDeals.length,
      openCount: openDeals.length,
      winRate: (wonDeals.length + lostDeals.length) > 0 ? (wonDeals.length / (wonDeals.length + lostDeals.length)) * 100 : 0
    };
  }, [filteredDeals]);

  // Event handlers
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleSelectDeal = (dealId: string) => {
    setSelectedDeals(prev =>
      prev.includes(dealId)
        ? prev.filter(id => id !== dealId)
        : [...prev, dealId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDeals.length === paginatedDeals.length) {
      setSelectedDeals([]);
    } else {
      setSelectedDeals(paginatedDeals.map(deal => deal.id));
    }
  };

  const handleDealClick = (deal: Deal) => {
    console.log('DealsModule: Deal clicked:', deal);
    setSelectedDeal(deal);
    setShowDealDetail(true);
  };

  const handleCreateDeal = (dealData: Partial<Deal>) => {
    const newDeal: Deal = {
      id: `deal-${Date.now()}`,
      dealNumber: `DEAL-2024-${String(deals.length + 1).padStart(3, '0')}`,
      name: dealData.name || 'Untitled Deal',
      accountId: dealData.accountId,
      contactId: dealData.contactId,
      ownerId: dealData.ownerId || 'user-alice',
      pipelineId: dealData.pipelineId || 'sales-pipeline',
      stageId: dealData.stageId || 'lead',
      amount: dealData.amount || 0,
      currency: dealData.currency || 'USD',
      probability: dealData.probability || 10,
      expectedCloseDate: dealData.expectedCloseDate,
      dealType: dealData.dealType || 'new-business',
      leadSource: dealData.leadSource,
      description: dealData.description,
      nextSteps: dealData.nextSteps,
      notes: dealData.notes,
      tags: dealData.tags || [],
      customFields: dealData.customFields || {},
      priority: dealData.priority || 'medium',
      health: dealData.health || 'healthy',
      activities: [],
      emails: [],
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current-user',
      stageHistory: [{
        id: `hist-${Date.now()}`,
        toStageId: dealData.stageId || 'lead',
        enteredAt: new Date().toISOString(),
        changedBy: 'current-user'
      }]
    };

    setDeals(prev => [...prev, newDeal]);
    setShowCreateForm(false);
  };

  const handleUpdateDeal = (dealId: string, updates: Partial<Deal>) => {
    setDeals(prev => prev.map(deal =>
      deal.id === dealId
        ? { ...deal, ...updates, updatedAt: new Date().toISOString() }
        : deal
    ));
  };

  const handleDeleteDeal = (dealId: string) => {
    setDeals(prev => prev.filter(deal => deal.id !== dealId));
    setSelectedDeals(prev => prev.filter(id => id !== dealId));
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const dealId = result.draggableId;
    const newStageId = result.destination.droppableId;
    const deal = deals.find(d => d.id === dealId);
    
    if (!deal || deal.stageId === newStageId) return;

    const pipeline = pipelines.find(p => p.id === deal.pipelineId);
    const newStage = pipeline?.stages.find(s => s.id === newStageId);
    
    if (!newStage) return;

    // Update deal stage and probability
    const updates: Partial<Deal> = {
      stageId: newStageId,
      probability: newStage.probability,
      updatedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      stageHistory: [
        ...deal.stageHistory,
        {
          id: `hist-${Date.now()}`,
          fromStageId: deal.stageId,
          toStageId: newStageId,
          enteredAt: new Date().toISOString(),
          changedBy: 'current-user'
        }
      ]
    };

    // Set actual close date for closed deals
    if (newStage.isClosedWon || newStage.isClosedLost) {
      updates.actualCloseDate = new Date().toISOString();
    }

    handleUpdateDeal(dealId, updates);
  };

  const handleBulkAction = async (action: string, dealIds: string[], params?: any) => {
    setIsLoading(true);
    try {
      switch (action) {
        case 'delete':
          dealIds.forEach(id => handleDeleteDeal(id));
          break;
        case 'transfer':
          dealIds.forEach(id => handleUpdateDeal(id, { ownerId: params.newOwnerId }));
          break;
        case 'update-stage':
          dealIds.forEach(id => handleUpdateDeal(id, { stageId: params.newStageId }));
          break;
        case 'add-tags':
          dealIds.forEach(id => {
            const deal = deals.find(d => d.id === id);
            if (deal) {
              const newTags = [...new Set([...deal.tags, ...params.tags])];
              handleUpdateDeal(id, { tags: newTags });
            }
          });
          break;
      }
      setSelectedDeals([]);
    } catch (err) {
      setError('Bulk action failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    // Mock export functionality
    const exportData = filteredDeals.map(deal => ({
      'Deal Number': deal.dealNumber,
      'Deal Name': deal.name,
      'Account': SAMPLE_ACCOUNTS.find(a => a.id === deal.accountId)?.name || '',
      'Contact': SAMPLE_CONTACTS.find(c => c.id === deal.contactId)?.name || '',
      'Owner': SAMPLE_USERS.find(u => u.id === deal.ownerId)?.name || '',
      'Pipeline': pipelines.find(p => p.id === deal.pipelineId)?.name || '',
      'Stage': pipelines.find(p => p.id === deal.pipelineId)?.stages.find(s => s.id === deal.stageId)?.name || '',
      'Amount': deal.amount,
      'Currency': deal.currency,
      'Probability': deal.probability,
      'Expected Close Date': deal.expectedCloseDate || '',
      'Deal Type': deal.dealType,
      'Priority': deal.priority,
      'Health': deal.health,
      'Created Date': deal.createdAt,
      'Last Activity': deal.lastActivityAt || ''
    }));

    // Convert to CSV
    if (format === 'csv') {
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => `"${row[header as keyof typeof row] || ''}"`).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `deals-export-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getAccountName = (accountId?: string) => {
    return SAMPLE_ACCOUNTS.find(a => a.id === accountId)?.name || 'No Account';
  };

  const getContactName = (contactId?: string) => {
    return SAMPLE_CONTACTS.find(c => c.id === contactId)?.name || 'No Contact';
  };

  const getUserName = (userId: string) => {
    return SAMPLE_USERS.find(u => u.id === userId)?.name || 'Unknown User';
  };

  const getPipelineName = (pipelineId: string) => {
    return pipelines.find(p => p.id === pipelineId)?.name || 'Unknown Pipeline';
  };

  const getStageName = (pipelineId: string, stageId: string) => {
    const pipeline = pipelines.find(p => p.id === pipelineId);
    return pipeline?.stages.find(s => s.id === stageId)?.name || 'Unknown Stage';
  };

  const getStageColor = (pipelineId: string, stageId: string) => {
    const pipeline = pipelines.find(p => p.id === pipelineId);
    return pipeline?.stages.find(s => s.id === stageId)?.color || '#6B7280';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getHealthColor = (health: string) => {
    const colors = {
      healthy: 'bg-green-100 text-green-700',
      'at-risk': 'bg-yellow-100 text-yellow-700',
      stalled: 'bg-red-100 text-red-700'
    };
    return colors[health as keyof typeof colors] || colors.healthy;
  };

  const renderMetricsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Total Pipeline</p>
            <p className="text-3xl font-bold text-blue-700">{formatCurrency(metrics.totalValue)}</p>
            <p className="text-sm text-blue-600 mt-1">{metrics.totalDeals} deals</p>
          </div>
          <div className="p-3 bg-blue-200 rounded-lg">
            <DollarSign className="h-8 w-8 text-blue-700" />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-600">Weighted Pipeline</p>
            <p className="text-3xl font-bold text-green-700">{formatCurrency(metrics.weightedValue)}</p>
            <p className="text-sm text-green-600 mt-1">Probability adjusted</p>
          </div>
          <div className="p-3 bg-green-200 rounded-lg">
            <TrendingUp className="h-8 w-8 text-green-700" />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-purple-600">Win Rate</p>
            <p className="text-3xl font-bold text-purple-700">{metrics.winRate.toFixed(1)}%</p>
            <p className="text-sm text-purple-600 mt-1">{metrics.wonCount} won deals</p>
          </div>
          <div className="p-3 bg-purple-200 rounded-lg">
            <Target className="h-8 w-8 text-purple-700" />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-orange-600">Avg Deal Size</p>
            <p className="text-3xl font-bold text-orange-700">{formatCurrency(metrics.avgDealSize)}</p>
            <p className="text-sm text-orange-600 mt-1">Per opportunity</p>
          </div>
          <div className="p-3 bg-orange-200 rounded-lg">
            <Star className="h-8 w-8 text-orange-700" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderTableView = () => {
    const visibleColumns = columns.filter(col => col.visible);

    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedDeals.length === paginatedDeals.length && paginatedDeals.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                {visibleColumns.map((column) => (
                  <th
                    key={column.id}
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => column.sortable && handleSort(column.field)}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{column.name}</span>
                      {column.sortable && (
                        <div className="flex flex-col">
                          <ChevronUp className={`h-3 w-3 ${sortBy === column.field && sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} />
                          <ChevronDown className={`h-3 w-3 -mt-1 ${sortBy === column.field && sortOrder === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} />
                        </div>
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedDeals.map((deal) => (
                <tr 
                  key={deal.id} 
                  className={`hover:bg-gray-50 transition-colors ${
                    selectedDeals.includes(deal.id) ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedDeals.includes(deal.id)}
                      onChange={() => handleSelectDeal(deal.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  {visibleColumns.map((column) => (
                    <td key={column.id} className="px-6 py-4">
                      {column.field === 'name' && (
                        <div>
                          <button
                            onClick={() => handleDealClick(deal)}
                            className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                          >
                            {deal.name}
                          </button>
                          <div className="text-xs text-gray-500 mt-1">{deal.dealNumber}</div>
                        </div>
                      )}
                      {column.field === 'pipelineId' && (
                        <span className="text-sm text-gray-900">{getPipelineName(deal.pipelineId)}</span>
                      )}
                      {column.field === 'accountId' && (
                        <span className="text-sm text-gray-900">{getAccountName(deal.accountId)}</span>
                      )}
                      {column.field === 'amount' && (
                        <div>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(deal.amount, deal.currency)}
                          </span>
                          <div className="text-xs text-gray-500">
                            Weighted: {formatCurrency(deal.amount * deal.probability / 100, deal.currency)}
                          </div>
                        </div>
                      )}
                      {column.field === 'stageId' && (
                        <span 
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: getStageColor(deal.pipelineId, deal.stageId) }}
                        >
                          {getStageName(deal.pipelineId, deal.stageId)}
                        </span>
                      )}
                      {column.field === 'ownerId' && (
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-600">
                              {getUserName(deal.ownerId).charAt(0)}
                            </span>
                          </div>
                          <span className="text-sm text-gray-900">{getUserName(deal.ownerId)}</span>
                        </div>
                      )}
                      {column.field === 'probability' && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">{deal.probability}%</span>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${deal.probability}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {column.field === 'expectedCloseDate' && (
                        <span className="text-sm text-gray-900">
                          {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : '-'}
                        </span>
                      )}
                      {column.field === 'createdAt' && (
                        <span className="text-sm text-gray-500">
                          {new Date(deal.createdAt).toLocaleDateString()}
                        </span>
                      )}
                      {column.field === 'lastActivityAt' && (
                        <span className="text-sm text-gray-500">
                          {deal.lastActivityAt ? new Date(deal.lastActivityAt).toLocaleDateString() : 'No activity'}
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDealClick(deal)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Deal"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDeal(deal);
                          setShowCreateForm(true);
                        }}
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit Deal"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this deal?')) {
                            handleDeleteDeal(deal.id);
                          }
                        }}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Deal"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                        title="More Actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>per page</span>
              <span className="ml-4">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredDeals.length)} of {filteredDeals.length} deals
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                {totalPages > 5 && (
                  <>
                    <span className="px-2 py-2 text-gray-500">...</span>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        currentPage === totalPages
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading deals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Deals</h1>
                <p className="text-gray-600 text-lg">Manage your sales pipeline and drive revenue growth</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* View Toggle */}
              <div className="flex border border-gray-300 rounded-xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center px-4 py-3 text-sm font-medium transition-all ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 bg-white'
                  }`}
                >
                  <List className="h-4 w-4 mr-2" />
                  Table
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`flex items-center px-4 py-3 text-sm font-medium border-l transition-all ${
                    viewMode === 'kanban'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 bg-white'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Pipeline
                </button>
              </div>

              <button
                onClick={() => setShowCustomViews(true)}
                className="flex items-center px-4 py-3 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm bg-white"
              >
                <Eye className="h-4 w-4 mr-2" />
                Views
              </button>

              <button
                onClick={() => setShowColumnChooser(true)}
                className="flex items-center px-4 py-3 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm bg-white"
              >
                <Columns className="h-4 w-4 mr-2" />
                Columns
              </button>
              
              <button
                onClick={() => handleExport('csv')}
                className="flex items-center px-4 py-3 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm bg-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Deal
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search deals, accounts, contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-96 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                />
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-4 py-2.5 border rounded-xl text-sm transition-colors shadow-sm ${
                  showFilters || Object.keys(filters).length > 0
                    ? 'bg-blue-50 border-blue-300 text-blue-700' 
                    : 'border-gray-300 hover:bg-gray-50 bg-white'
                }`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {Object.keys(filters).length > 0 && (
                  <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                    {Object.keys(filters).length}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="flex items-center px-4 py-2.5 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm bg-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>

            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <span>{filteredDeals.length} of {deals.length} deals</span>
              <span>•</span>
              <span>Pipeline Value: {formatCurrency(metrics.totalValue)}</span>
              <span>•</span>
              <span>Weighted: {formatCurrency(metrics.weightedValue)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-6">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-700">{error}</span>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Metrics Cards */}
        {renderMetricsCards()}

        {/* Filters Panel */}
        {showFilters && (
          <DealFiltersPanel
            filters={filters}
            onFiltersChange={setFilters}
            pipelines={pipelines}
            accounts={SAMPLE_ACCOUNTS}
            users={SAMPLE_USERS}
            onClose={() => setShowFilters(false)}
          />
        )}

        {/* Content */}
        <DragDropContext onDragEnd={handleDragEnd}>
          {viewMode === 'list' ? renderTableView() : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <DealKanban
                deals={filteredDeals}
                pipelines={pipelines}
                onDealClick={handleDealClick}
                formatCurrency={formatCurrency}
                getAccountName={getAccountName}
                getUserName={getUserName}
              />
            </div>
          )}
        </DragDropContext>

        {/* Empty State */}
        {filteredDeals.length === 0 && !isLoading && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No deals found</h3>
            <p className="text-gray-600 mb-6">
              {Object.keys(filters).length > 0 || searchTerm
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first deal'
              }
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2 inline" />
              Create Your First Deal
            </button>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedDeals.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedDeals.length}
          onAction={handleBulkAction}
          onClear={() => setSelectedDeals([])}
          users={SAMPLE_USERS}
          pipelines={pipelines}
        />
      )}

      {/* Modals */}
      {showCreateForm && (
        <CreateDealForm
          deal={selectedDeal}
          pipelines={pipelines}
          accounts={SAMPLE_ACCOUNTS}
          contacts={SAMPLE_CONTACTS}
          users={SAMPLE_USERS}
          onSave={handleCreateDeal}
          onClose={() => {
            setShowCreateForm(false);
            setSelectedDeal(null);
          }}
        />
      )}

      {showDealDetail && selectedDeal && (
        <DealDetailPage
          deal={selectedDeal}
          pipelines={pipelines}
          accounts={SAMPLE_ACCOUNTS}
          contacts={SAMPLE_CONTACTS}
          users={SAMPLE_USERS}
          onUpdate={handleUpdateDeal}
          onDelete={handleDeleteDeal}
          onClose={() => {
            setShowDealDetail(false);
            setSelectedDeal(null);
          }}
        />
      )}

      {showCustomViews && (
        <CustomViewManager
          views={customViews}
          activeView={activeView}
          onViewChange={setActiveView}
          onViewSave={(view) => setCustomViews(prev => [...prev, view])}
          onClose={() => setShowCustomViews(false)}
        />
      )}

      {/* Column Chooser Modal */}
      {showColumnChooser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Choose Columns</h3>
              <button onClick={() => setShowColumnChooser(false)}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {columns.map((column) => (
                <label key={column.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={column.visible}
                    onChange={(e) => {
                      setColumns(prev => prev.map(col =>
                        col.id === column.id ? { ...col, visible: e.target.checked } : col
                      ));
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{column.name}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowColumnChooser(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealsModule;