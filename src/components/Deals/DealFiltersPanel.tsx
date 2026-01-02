import React, { useState } from 'react';
import { X, Filter, Calendar, DollarSign, Users, Target, Tag, RefreshCw } from 'lucide-react';
import { DealFilters, Pipeline } from '../../types/deals';

interface DealFiltersPanelProps {
  filters: DealFilters;
  onFiltersChange: (filters: DealFilters) => void;
  pipelines: Pipeline[];
  accounts: any[];
  users: any[];
  onClose: () => void;
}

const DealFiltersPanel: React.FC<DealFiltersPanelProps> = ({
  filters,
  onFiltersChange,
  pipelines,
  accounts,
  users,
  onClose
}) => {
  const [localFilters, setLocalFilters] = useState<DealFilters>(filters);
  const [tagInput, setTagInput] = useState('');

  const handleFilterChange = (key: string, value: any) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const clearFilters = () => {
    setLocalFilters({});
    onFiltersChange({});
  };

  const addTag = () => {
    if (tagInput.trim() && !localFilters.tags?.includes(tagInput.trim())) {
      const newTags = [...(localFilters.tags || []), tagInput.trim()];
      handleFilterChange('tags', newTags);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = localFilters.tags?.filter(tag => tag !== tagToRemove) || [];
    handleFilterChange('tags', newTags.length > 0 ? newTags : undefined);
  };

  const selectedPipeline = pipelines.find(p => p.id === localFilters.pipelineId);

  return (
    <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <Filter className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={localFilters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="open">Open Deals</option>
              <option value="won">Closed Won</option>
              <option value="lost">Closed Lost</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Owner</label>
            <select
              value={localFilters.ownerId || ''}
              onChange={(e) => handleFilterChange('ownerId', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Owners</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pipeline</label>
            <select
              value={localFilters.pipelineId || ''}
              onChange={(e) => {
                handleFilterChange('pipelineId', e.target.value || undefined);
                handleFilterChange('stageId', undefined); // Reset stage when pipeline changes
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Pipelines</option>
              {pipelines.map(pipeline => (
                <option key={pipeline.id} value={pipeline.id}>{pipeline.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Stage</label>
            <select
              value={localFilters.stageId || ''}
              onChange={(e) => handleFilterChange('stageId', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!selectedPipeline}
            >
              <option value="">All Stages</option>
              {selectedPipeline?.stages.map(stage => (
                <option key={stage.id} value={stage.id}>{stage.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Additional Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Deal Type</label>
            <select
              value={localFilters.dealType || ''}
              onChange={(e) => handleFilterChange('dealType', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="new-business">New Business</option>
              <option value="existing-business">Existing Business</option>
              <option value="upsell">Upsell</option>
              <option value="renewal">Renewal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              value={localFilters.priority || ''}
              onChange={(e) => handleFilterChange('priority', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Health</label>
            <select
              value={localFilters.health || ''}
              onChange={(e) => handleFilterChange('health', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Health Status</option>
              <option value="healthy">Healthy</option>
              <option value="at-risk">At Risk</option>
              <option value="stalled">Stalled</option>
            </select>
          </div>
        </div>

        {/* Range Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount Range
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Min amount"
                value={localFilters.amountRange?.min || ''}
                onChange={(e) => {
                  const min = Number(e.target.value) || 0;
                  handleFilterChange('amountRange', {
                    min,
                    max: localFilters.amountRange?.max || 1000000
                  });
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Max amount"
                value={localFilters.amountRange?.max || ''}
                onChange={(e) => {
                  const max = Number(e.target.value) || 1000000;
                  handleFilterChange('amountRange', {
                    min: localFilters.amountRange?.min || 0,
                    max
                  });
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Close Date Range
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={localFilters.dateRange?.start || ''}
                onChange={(e) => {
                  handleFilterChange('dateRange', {
                    start: e.target.value,
                    end: localFilters.dateRange?.end || ''
                  });
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={localFilters.dateRange?.end || ''}
                onChange={(e) => {
                  handleFilterChange('dateRange', {
                    start: localFilters.dateRange?.start || '',
                    end: e.target.value
                  });
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Tags Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {localFilters.tags?.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
              >
                <Tag className="h-3 w-3 mr-1" />
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Filter by tag..."
            />
            <button
              onClick={addTag}
              className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
        <button
          onClick={clearFilters}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Clear All Filters
        </button>
        
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={applyFilters}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default DealFiltersPanel;