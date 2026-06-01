import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, Filter, Download, Settings, Search, Eye, Edit, MoreHorizontal, Star, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { Deal, DealColumn, DealFilters, DEFAULT_DEAL_COLUMNS } from '../../types/dealManagement';

interface DealListViewProps {
  deals: Deal[];
  filters: DealFilters;
  onDealClick: (deal: Deal) => void;
  onFiltersChange: (filters: DealFilters) => void;
}

const DealListView: React.FC<DealListViewProps> = ({
  deals,
  filters,
  onDealClick,
  onFiltersChange
}) => {
  const [columns, setColumns] = useState<DealColumn[]>(DEFAULT_DEAL_COLUMNS);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>(deals);
  const [searchTerm, setSearchTerm] = useState(filters.searchTerm || '');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);

  useEffect(() => {
    let filtered = deals;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(deal =>
        deal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.dealNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply other filters
    if (filters.ownerId) {
      filtered = filtered.filter(deal => deal.ownerId === filters.ownerId);
    }

    if (filters.stageId) {
      filtered = filtered.filter(deal => deal.stageId === filters.stageId);
    }

    if (filters.amountRange) {
      filtered = filtered.filter(deal => 
        deal.amount >= filters.amountRange!.min && 
        deal.amount <= filters.amountRange!.max
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortBy as keyof Deal];
      let bValue = b[sortBy as keyof Deal];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredDeals(filtered);
  }, [deals, filters, searchTerm, sortBy, sortOrder]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStageDisplay = (stageId: string) => {
    const stageNames = {
      'lead': 'Lead',
      'qualified': 'Qualified',
      'proposal': 'Proposal',
      'negotiation': 'Negotiation',
      'closed-won': 'Closed Won',
      'closed-lost': 'Closed Lost'
    };
    return stageNames[stageId as keyof typeof stageNames] || stageId;
  };

  const getStageColor = (stageId: string) => {
    const stageColors = {
      'lead': 'bg-gray-100 text-gray-800 border-gray-200',
      'qualified': 'bg-blue-100 text-blue-800 border-blue-200',
      'proposal': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'negotiation': 'bg-orange-100 text-orange-800 border-orange-200',
      'closed-won': 'bg-green-100 text-green-800 border-green-200',
      'closed-lost': 'bg-red-100 text-red-800 border-red-200'
    };
    return stageColors[stageId as keyof typeof stageColors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityIndicator = (deal: Deal) => {
    const highValue = deal.amount > 100000;
    const urgentClose = deal.closingDate && new Date(deal.closingDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    if (highValue && urgentClose) return <Star className="h-4 w-4 text-amber-500" />;
    if (highValue) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (urgentClose) return <Clock className="h-4 w-4 text-orange-500" />;
    return null;
  };

  const renderCustomFieldsInline = (deal: Deal) => {
    if (!deal.customFields || Object.keys(deal.customFields).length === 0) return null;

    const customFieldEntries = Object.entries(deal.customFields).slice(0, 1);
    
    return (
      <div className="text-xs text-gray-500 mt-1">
        {customFieldEntries.map(([key, value]) => (
          <span key={key} className="mr-2">
            {key}: <span className="font-medium">{String(value)}</span>
          </span>
        ))}
      </div>
    );
  };

  const handleSelectDeal = (dealId: string) => {
    setSelectedDeals(prev => 
      prev.includes(dealId) 
        ? prev.filter(id => id !== dealId)
        : [...prev, dealId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDeals.length === filteredDeals.length) {
      setSelectedDeals([]);
    } else {
      setSelectedDeals(filteredDeals.map(deal => deal.id));
    }
  };

  const visibleColumns = columns.filter(col => col.visible);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Deal Pipeline</h3>
                <p className="text-sm text-gray-600">
                  {filteredDeals.length} of {deals.length} deals
                  {selectedDeals.length > 0 && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {selectedDeals.length} selected
                    </span>
                  )}
                </p>
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
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-2.5 border rounded-xl text-sm transition-colors shadow-sm ${
                showFilters 
                  ? 'bg-blue-50 border-blue-300 text-blue-700' 
                  : 'border-gray-300 hover:bg-gray-50 bg-white'
              }`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
            
            <button className="flex items-center px-4 py-2.5 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm bg-white">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            
            <button className="flex items-center px-4 py-2.5 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm bg-white">
              <Settings className="h-4 w-4 mr-2" />
              Columns
            </button>
          </div>
        </div>

        {/* Enhanced Filters Panel */}
        {showFilters && (
          <div className="mt-6 p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Owner</label>
                <select
                  value={filters.ownerId || ''}
                  onChange={(e) => onFiltersChange({ ...filters, ownerId: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">All Owners</option>
                  <option value="user1">User 1</option>
                  <option value="user2">User 2</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stage</label>
                <select
                  value={filters.stageId || ''}
                  onChange={(e) => onFiltersChange({ ...filters, stageId: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">All Stages</option>
                  <option value="lead">Lead</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal">Proposal</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="closed-won">Closed Won</option>
                  <option value="closed-lost">Closed Lost</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                <select
                  value={filters.country || ''}
                  onChange={(e) => onFiltersChange({ ...filters, country: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">All Countries</option>
                  <option value="US">United States</option>
                  <option value="UK">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deal Type</label>
                <select
                  value={filters.dealType || ''}
                  onChange={(e) => onFiltersChange({ ...filters, dealType: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">All Types</option>
                  <option value="new-business">New Business</option>
                  <option value="existing-business">Existing Business</option>
                  <option value="upsell">Upsell</option>
                  <option value="renewal">Renewal</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Enhanced Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left">
                <input
                  type="checkbox"
                  checked={selectedDeals.length === filteredDeals.length && filteredDeals.length > 0}
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
            {filteredDeals.map((deal, index) => {
              const priorityIcon = getPriorityIndicator(deal);
              const isSelected = selectedDeals.includes(deal.id);
              
              return (
                <tr 
                  key={deal.id} 
                  className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectDeal(deal.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  {visibleColumns.map((column) => (
                    <td key={column.id} className="px-6 py-4">
                      {column.field === 'name' && (
                        <div>
                          <div className="flex items-center space-x-2">
                            {priorityIcon}
                            <button
                              onClick={() => onDealClick(deal)}
                              className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                            >
                              {deal.name}
                            </button>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">#{deal.dealNumber}</div>
                          {renderCustomFieldsInline(deal)}
                        </div>
                      )}
                      {column.field === 'amount' && (
                        <div>
                          <div className="text-sm font-bold text-gray-900">
                            {formatCurrency(deal.amount, deal.currency)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Total: {formatCurrency(deal.totalAmount, deal.currency)}
                          </div>
                        </div>
                      )}
                      {column.field === 'stageId' && (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStageColor(deal.stageId)}`}>
                          {getStageDisplay(deal.stageId)}
                        </span>
                      )}
                      {column.field === 'probability' && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">{deal.probability}%</span>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${deal.probability}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      {column.field === 'ownerId' && (
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-600">
                              {deal.ownerId.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm text-gray-900">{deal.ownerId}</span>
                        </div>
                      )}
                      {column.field === 'accountId' && (
                        <div className="text-sm text-gray-900">{deal.accountId || '-'}</div>
                      )}
                      {column.field === 'contactId' && (
                        <div className="text-sm text-gray-900">{deal.contactId || '-'}</div>
                      )}
                      {column.field === 'closingDate' && (
                        <div className="text-sm text-gray-900">
                          {deal.closingDate ? formatDate(deal.closingDate) : '-'}
                        </div>
                      )}
                      {column.field === 'createdAt' && (
                        <div className="text-sm text-gray-500">
                          {formatDate(deal.createdAt)}
                        </div>
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onDealClick(deal)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Deal"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit Deal"
                      >
                        <Edit className="h-4 w-4" />
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
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Enhanced Empty State */}
      {filteredDeals.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="h-10 w-10 text-gray-400" />
          </div>
          <div className="text-gray-500">
            <p className="text-lg font-medium mb-2">No deals found</p>
            <p className="text-sm">Try adjusting your search or filters to find what you're looking for</p>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedDeals.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-200 px-6 py-3">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">
              {selectedDeals.length} deal{selectedDeals.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              <button className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                Change Stage
              </button>
              <button className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
                Assign Owner
              </button>
              <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                Export Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealListView;