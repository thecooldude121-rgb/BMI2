import React from 'react';
import { X } from 'lucide-react';
import { useProspectFilters } from '../../contexts/ProspectFilterContext';

const FilterChips: React.FC = () => {
  const { filterChips, clearFilters, activeFilterCount } = useProspectFilters();

  if (filterChips.length === 0) return null;

  return (
    <div className="flex items-center flex-wrap gap-2 py-3">
      <span className="text-sm font-medium text-gray-700">
        Active Filters ({activeFilterCount}):
      </span>

      {filterChips.map((chip) => (
        <div
          key={chip.id}
          className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200"
        >
          <span className="font-semibold">{chip.category}:</span>
          <span>{typeof chip.value === 'string' ? chip.value : (chip.value as string[]).join(', ')}</span>
          <button
            onClick={chip.onRemove}
            className="hover:bg-blue-100 rounded-full p-0.5 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}

      <button
        onClick={clearFilters}
        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 underline"
      >
        Clear All
      </button>
    </div>
  );
};

export default FilterChips;
