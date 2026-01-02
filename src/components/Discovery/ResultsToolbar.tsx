import React from 'react';
import { X, Grid3X3, List, Rows, ArrowUpDown, SlidersHorizontal } from 'lucide-react';

interface FilterChip {
  id: string;
  label: string;
  value: string;
}

interface ResultsToolbarProps {
  totalResults: number;
  displayedResults: number;
  appliedFilters: FilterChip[];
  onRemoveFilter: (filterId: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  viewMode: 'cards' | 'table' | 'compact';
  onViewModeChange: (mode: 'cards' | 'table' | 'compact') => void;
  density: 'comfortable' | 'compact' | 'spacious';
  onDensityChange: (density: 'comfortable' | 'compact' | 'spacious') => void;
}

const ResultsToolbar: React.FC<ResultsToolbarProps> = ({
  totalResults,
  displayedResults,
  appliedFilters,
  onRemoveFilter,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  density,
  onDensityChange
}) => {
  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'quality_desc', label: 'Quality Score (High to Low)' },
    { value: 'lead_score_desc', label: 'Lead Score (High to Low)' },
    { value: 'recent', label: 'Recently Added' },
    { value: 'company_size', label: 'Company Size' },
    { value: 'alphabetical', label: 'Alphabetical' }
  ];

  return (
    <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="px-6 py-4">
        {/* Top Row */}
        <div className="flex items-center justify-between mb-3">
          {/* Left: Result Count */}
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-700">
              Showing <span className="font-semibold">{displayedResults}</span> of{' '}
              <span className="font-semibold">{totalResults.toLocaleString()}</span> results
            </div>

            {/* Applied Filters as Chips */}
            {appliedFilters.length > 0 && (
              <div className="flex items-center space-x-2">
                {appliedFilters.map((filter) => (
                  <div
                    key={filter.id}
                    className="flex items-center space-x-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                  >
                    <span className="font-medium">{filter.label}:</span>
                    <span>{filter.value}</span>
                    <button
                      onClick={() => onRemoveFilter(filter.id)}
                      className="hover:bg-blue-100 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Controls */}
          <div className="flex items-center space-x-3">
            {/* Sort Dropdown */}
            <div className="flex items-center space-x-2">
              <ArrowUpDown className="h-4 w-4 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => onViewModeChange('cards')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'cards' ? 'bg-white shadow' : 'hover:bg-gray-200'
                }`}
                title="Card View"
              >
                <Grid3X3 className="h-4 w-4 text-gray-700" />
              </button>
              <button
                onClick={() => onViewModeChange('table')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'table' ? 'bg-white shadow' : 'hover:bg-gray-200'
                }`}
                title="Table View"
              >
                <List className="h-4 w-4 text-gray-700" />
              </button>
              <button
                onClick={() => onViewModeChange('compact')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'compact' ? 'bg-white shadow' : 'hover:bg-gray-200'
                }`}
                title="Compact View"
              >
                <Rows className="h-4 w-4 text-gray-700" />
              </button>
            </div>

            {/* Density Toggle */}
            <div className="relative group">
              <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <SlidersHorizontal className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700 capitalize">{density}</span>
              </button>

              {/* Density Dropdown */}
              <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[160px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                {(['comfortable', 'compact', 'spacious'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => onDensityChange(d)}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors text-sm ${
                      density === d ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'
                    }`}
                  >
                    <span className="capitalize">{d}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Quick Stats */}
        <div className="flex items-center space-x-6 text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>High quality: {Math.round(totalResults * 0.35).toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <span>Medium quality: {Math.round(totalResults * 0.45).toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
            <span>Lower quality: {Math.round(totalResults * 0.2).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsToolbar;
