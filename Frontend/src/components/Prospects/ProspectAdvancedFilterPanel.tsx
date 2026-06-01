import React, { useState, useEffect } from 'react';
import {
  X, ChevronDown, ChevronRight, Check, Save, RotateCcw, Search,
  Calendar, MapPin, Tag, TrendingUp, Building, Users, Zap
} from 'lucide-react';
import { useProspectFilters } from '../../contexts/ProspectFilterContext';
import {
  ProspectFilters,
  STATUS_OPTIONS,
  COMPANY_SIZE_OPTIONS,
  INDUSTRIES,
  ENGAGEMENT_OPTIONS,
  ProspectStatus,
  CompanySize,
  EngagementLevel
} from '../../types/prospectFilters';
import { supabase } from '../../lib/supabase';

interface ProspectAdvancedFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveFilterSet?: (name: string, filters: ProspectFilters) => void;
  resultCount?: number;
}

const ProspectAdvancedFilterPanel: React.FC<ProspectAdvancedFilterPanelProps> = ({
  isOpen,
  onClose,
  onSaveFilterSet,
  resultCount = 0
}) => {
  const { filters, updateFilter, clearFilters } = useProspectFilters();
  const [localFilters, setLocalFilters] = useState<ProspectFilters>(filters);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['status', 'scores', 'company'])
  );
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [filterSetName, setFilterSetName] = useState('');

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableTags();
    }
  }, [isOpen]);

  const fetchAvailableTags = async () => {
    // In production, fetch from Supabase
    // For now, use mock data
    setAvailableTags([
      'enterprise',
      'decision-maker',
      'high-priority',
      'technical',
      'budget-holder',
      'champion',
      'influencer'
    ]);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const toggleArrayFilter = <T extends any>(
    key: keyof ProspectFilters,
    value: T
  ) => {
    const currentValues = (localFilters[key] as T[]) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];

    setLocalFilters({ ...localFilters, [key]: newValues });
  };

  const handleApply = () => {
    Object.keys(localFilters).forEach(key => {
      updateFilter(key as keyof ProspectFilters, (localFilters as any)[key]);
    });
    onClose();
  };

  const handleClear = () => {
    setLocalFilters(filters);
    clearFilters();
  };

  const handleSaveFilterSet = () => {
    if (filterSetName.trim() && onSaveFilterSet) {
      onSaveFilterSet(filterSetName, localFilters);
      setShowSaveModal(false);
      setFilterSetName('');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Panel */}
      <div className="fixed left-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-50 flex flex-col animate-slide-in-left">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Advanced Filters</h2>
            <p className="text-sm text-gray-600 mt-1">
              {resultCount > 0 && `${resultCount.toLocaleString()} results`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Status Section */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('status')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-gray-500" />
                <span className="font-semibold text-gray-900">Status</span>
                {localFilters.statuses.length > 0 && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                    {localFilters.statuses.length}
                  </span>
                )}
              </div>
              {expandedSections.has('status') ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>

            {expandedSections.has('status') && (
              <div className="p-4 pt-0 space-y-2">
                {STATUS_OPTIONS.map(option => (
                  <label
                    key={option.value}
                    className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={localFilters.statuses.includes(option.value as ProspectStatus)}
                      onChange={() => toggleArrayFilter('statuses', option.value as ProspectStatus)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Score Ranges Section */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('scores')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-gray-500" />
                <span className="font-semibold text-gray-900">Scores</span>
              </div>
              {expandedSections.has('scores') ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>

            {expandedSections.has('scores') && (
              <div className="p-4 pt-0 space-y-4">
                {/* Lead Score */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lead Score: {localFilters.leadScore.min} - {localFilters.leadScore.max}
                  </label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={localFilters.leadScore.min}
                      onChange={(e) =>
                        setLocalFilters({
                          ...localFilters,
                          leadScore: { ...localFilters.leadScore, min: Number(e.target.value) }
                        })
                      }
                      className="w-full accent-blue-600"
                    />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={localFilters.leadScore.max}
                      onChange={(e) =>
                        setLocalFilters({
                          ...localFilters,
                          leadScore: { ...localFilters.leadScore, max: Number(e.target.value) }
                        })
                      }
                      className="w-full accent-blue-600"
                    />
                  </div>
                </div>

                {/* AI Score */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AI Score: {localFilters.aiScore.min} - {localFilters.aiScore.max}
                  </label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={localFilters.aiScore.min}
                      onChange={(e) =>
                        setLocalFilters({
                          ...localFilters,
                          aiScore: { ...localFilters.aiScore, min: Number(e.target.value) }
                        })
                      }
                      className="w-full accent-blue-600"
                    />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={localFilters.aiScore.max}
                      onChange={(e) =>
                        setLocalFilters({
                          ...localFilters,
                          aiScore: { ...localFilters.aiScore, max: Number(e.target.value) }
                        })
                      }
                      className="w-full accent-blue-600"
                    />
                  </div>
                </div>

                {/* Quality Score */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quality Score: {localFilters.qualityScore.min} - {localFilters.qualityScore.max}
                  </label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={localFilters.qualityScore.min}
                      onChange={(e) =>
                        setLocalFilters({
                          ...localFilters,
                          qualityScore: { ...localFilters.qualityScore, min: Number(e.target.value) }
                        })
                      }
                      className="w-full accent-blue-600"
                    />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={localFilters.qualityScore.max}
                      onChange={(e) =>
                        setLocalFilters({
                          ...localFilters,
                          qualityScore: { ...localFilters.qualityScore, max: Number(e.target.value) }
                        })
                      }
                      className="w-full accent-blue-600"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Company Section */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('company')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-gray-500" />
                <span className="font-semibold text-gray-900">Company</span>
                {(localFilters.companySizes.length + localFilters.industries.length) > 0 && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                    {localFilters.companySizes.length + localFilters.industries.length}
                  </span>
                )}
              </div>
              {expandedSections.has('company') ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>

            {expandedSections.has('company') && (
              <div className="p-4 pt-0 space-y-4">
                {/* Company Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Size
                  </label>
                  <div className="space-y-2">
                    {COMPANY_SIZE_OPTIONS.map(option => (
                      <label
                        key={option.value}
                        className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={localFilters.companySizes.includes(option.value as CompanySize)}
                          onChange={() => toggleArrayFilter('companySizes', option.value as CompanySize)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Industry */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {INDUSTRIES.map(option => (
                      <label
                        key={option.value}
                        className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={localFilters.industries.includes(option.value)}
                          onChange={() => toggleArrayFilter('industries', option.value)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Engagement Section */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('engagement')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="font-semibold text-gray-900">Engagement</span>
                {localFilters.engagementLevels.length > 0 && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                    {localFilters.engagementLevels.length}
                  </span>
                )}
              </div>
              {expandedSections.has('engagement') ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>

            {expandedSections.has('engagement') && (
              <div className="p-4 pt-0 space-y-2">
                {ENGAGEMENT_OPTIONS.map(option => (
                  <label
                    key={option.value}
                    className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={localFilters.engagementLevels.includes(option.value as EngagementLevel)}
                      onChange={() => toggleArrayFilter('engagementLevels', option.value as EngagementLevel)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Tags Section */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('tags')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Tag className="h-4 w-4 text-gray-500" />
                <span className="font-semibold text-gray-900">Tags</span>
                {localFilters.tags.length > 0 && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                    {localFilters.tags.length}
                  </span>
                )}
              </div>
              {expandedSections.has('tags') ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>

            {expandedSections.has('tags') && (
              <div className="p-4 pt-0 space-y-2">
                {availableTags.map(tag => (
                  <label
                    key={tag}
                    className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={localFilters.tags.includes(tag)}
                      onChange={() => toggleArrayFilter('tags', tag)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">{tag}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Date Ranges Section */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('dates')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="font-semibold text-gray-900">Date Ranges</span>
              </div>
              {expandedSections.has('dates') ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>

            {expandedSections.has('dates') && (
              <div className="p-4 pt-0 space-y-4">
                {/* Created Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Created Date
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">From</label>
                      <input
                        type="date"
                        value={localFilters.createdDate.from || ''}
                        onChange={(e) =>
                          setLocalFilters({
                            ...localFilters,
                            createdDate: { ...localFilters.createdDate, from: e.target.value }
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">To</label>
                      <input
                        type="date"
                        value={localFilters.createdDate.to || ''}
                        onChange={(e) =>
                          setLocalFilters({
                            ...localFilters,
                            createdDate: { ...localFilters.createdDate, to: e.target.value }
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Last Contacted Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Contacted
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">From</label>
                      <input
                        type="date"
                        value={localFilters.lastContactedDate.from || ''}
                        onChange={(e) =>
                          setLocalFilters({
                            ...localFilters,
                            lastContactedDate: { ...localFilters.lastContactedDate, from: e.target.value }
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">To</label>
                      <input
                        type="date"
                        value={localFilters.lastContactedDate.to || ''}
                        onChange={(e) =>
                          setLocalFilters({
                            ...localFilters,
                            lastContactedDate: { ...localFilters.lastContactedDate, to: e.target.value }
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 space-y-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleApply}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
            >
              <Check className="h-4 w-4 mr-2" />
              Apply Filters
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-3 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </button>
          </div>
          <button
            onClick={() => setShowSaveModal(true)}
            className="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Filter Set
          </button>
        </div>
      </div>

      {/* Save Filter Set Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Save Filter Set</h3>
            <input
              type="text"
              value={filterSetName}
              onChange={(e) => setFilterSetName(e.target.value)}
              placeholder="Enter filter set name..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
              autoFocus
            />
            <div className="flex space-x-3">
              <button
                onClick={handleSaveFilterSet}
                disabled={!filterSetName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-in-left {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default ProspectAdvancedFilterPanel;
