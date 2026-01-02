import React, { useState } from 'react';
import { X, Check, Save, RotateCcw } from 'lucide-react';

interface FilterValues {
  statuses: string[];
  leadScoreMin: number;
  leadScoreMax: number;
  aiScoreMin: number;
  aiScoreMax: number;
  qualityScoreMin: number;
  qualityScoreMax: number;
  tags: string[];
  companySizes: string[];
  dateAddedFrom?: string;
  dateAddedTo?: string;
  lastContactedFrom?: string;
  lastContactedTo?: string;
}

interface AdvancedFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterValues;
  onApply: (filters: FilterValues) => void;
  onClear: () => void;
  onSavePreset: (filters: FilterValues) => void;
}

const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({
  isOpen,
  onClose,
  filters,
  onApply,
  onClear,
  onSavePreset
}) => {
  const [localFilters, setLocalFilters] = useState<FilterValues>(filters);

  const statuses = ['new', 'contacted', 'qualified', 'unqualified'];
  const companySizes = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];
  const availableTags = ['enterprise', 'smb', 'decision-maker', 'technical', 'budget-holder', 'high-priority'];

  const toggleStatus = (status: string) => {
    setLocalFilters({
      ...localFilters,
      statuses: localFilters.statuses.includes(status)
        ? localFilters.statuses.filter(s => s !== status)
        : [...localFilters.statuses, status]
    });
  };

  const toggleCompanySize = (size: string) => {
    setLocalFilters({
      ...localFilters,
      companySizes: localFilters.companySizes.includes(size)
        ? localFilters.companySizes.filter(s => s !== size)
        : [...localFilters.companySizes, size]
    });
  };

  const toggleTag = (tag: string) => {
    setLocalFilters({
      ...localFilters,
      tags: localFilters.tags.includes(tag)
        ? localFilters.tags.filter(t => t !== tag)
        : [...localFilters.tags, tag]
    });
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleClear = () => {
    const clearedFilters: FilterValues = {
      statuses: [],
      leadScoreMin: 0,
      leadScoreMax: 100,
      aiScoreMin: 0,
      aiScoreMax: 100,
      qualityScoreMin: 0,
      qualityScoreMax: 100,
      tags: [],
      companySizes: []
    };
    setLocalFilters(clearedFilters);
    onClear();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-40"
        onClick={onClose}
      ></div>

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Advanced Filters</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Status
            </label>
            <div className="space-y-2">
              {statuses.map((status) => (
                <label key={status} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localFilters.statuses.includes(status)}
                    onChange={() => toggleStatus(status)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 capitalize">{status}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Lead Score */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Lead Score: {localFilters.leadScoreMin} - {localFilters.leadScoreMax}
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="100"
                value={localFilters.leadScoreMin}
                onChange={(e) => setLocalFilters({ ...localFilters, leadScoreMin: Number(e.target.value) })}
                className="w-full"
              />
              <input
                type="range"
                min="0"
                max="100"
                value={localFilters.leadScoreMax}
                onChange={(e) => setLocalFilters({ ...localFilters, leadScoreMax: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>

          {/* AI Score */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              AI Score: {localFilters.aiScoreMin} - {localFilters.aiScoreMax}
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="100"
                value={localFilters.aiScoreMin}
                onChange={(e) => setLocalFilters({ ...localFilters, aiScoreMin: Number(e.target.value) })}
                className="w-full"
              />
              <input
                type="range"
                min="0"
                max="100"
                value={localFilters.aiScoreMax}
                onChange={(e) => setLocalFilters({ ...localFilters, aiScoreMax: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>

          {/* Quality Score */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Quality Score: {localFilters.qualityScoreMin} - {localFilters.qualityScoreMax}
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="100"
                value={localFilters.qualityScoreMin}
                onChange={(e) => setLocalFilters({ ...localFilters, qualityScoreMin: Number(e.target.value) })}
                className="w-full"
              />
              <input
                type="range"
                min="0"
                max="100"
                value={localFilters.qualityScoreMax}
                onChange={(e) => setLocalFilters({ ...localFilters, qualityScoreMax: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Tags
            </label>
            <div className="space-y-2">
              {availableTags.map((tag) => (
                <label key={tag} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localFilters.tags.includes(tag)}
                    onChange={() => toggleTag(tag)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{tag}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Company Size */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Company Size
            </label>
            <div className="space-y-2">
              {companySizes.map((size) => (
                <label key={size} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localFilters.companySizes.includes(size)}
                    onChange={() => toggleCompanySize(size)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{size} employees</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date Added */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Date Added
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">From</label>
                <input
                  type="date"
                  value={localFilters.dateAddedFrom || ''}
                  onChange={(e) => setLocalFilters({ ...localFilters, dateAddedFrom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">To</label>
                <input
                  type="date"
                  value={localFilters.dateAddedTo || ''}
                  onChange={(e) => setLocalFilters({ ...localFilters, dateAddedTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Last Contacted */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Last Contacted
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">From</label>
                <input
                  type="date"
                  value={localFilters.lastContactedFrom || ''}
                  onChange={(e) => setLocalFilters({ ...localFilters, lastContactedFrom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">To</label>
                <input
                  type="date"
                  value={localFilters.lastContactedTo || ''}
                  onChange={(e) => setLocalFilters({ ...localFilters, lastContactedTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 space-y-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleApply}
              className="flex-1 flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Check className="h-4 w-4 mr-2" />
              Apply Filters
            </button>
            <button
              onClick={handleClear}
              className="flex items-center px-4 py-3 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </button>
          </div>
          <button
            onClick={() => onSavePreset(localFilters)}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <Save className="h-4 w-4 mr-2" />
            Save as Preset
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default AdvancedFilterPanel;
