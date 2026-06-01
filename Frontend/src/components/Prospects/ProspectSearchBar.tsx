import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { useProspectFilters } from '../../contexts/ProspectFilterContext';

interface ProspectSearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
}

const ProspectSearchBar: React.FC<ProspectSearchBarProps> = ({
  onSearch,
  placeholder = 'Search prospects, companies, emails...'
}) => {
  const { filters, updateFilter, searchHistory, addToSearchHistory, clearSearchHistory } = useProspectFilters();
  const [localQuery, setLocalQuery] = useState(filters.searchQuery);
  const [showHistory, setShowHistory] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setLocalQuery(filters.searchQuery);
  }, [filters.searchQuery]);

  useEffect(() => {
    // Debounced search
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      if (localQuery !== filters.searchQuery) {
        updateFilter('searchQuery', localQuery);
        if (localQuery.trim()) {
          addToSearchHistory(localQuery);
        }
        if (onSearch) {
          onSearch(localQuery);
        }
      }
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [localQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClear = () => {
    setLocalQuery('');
    updateFilter('searchQuery', '');
    if (onSearch) {
      onSearch('');
    }
  };

  const handleSelectHistory = (query: string) => {
    setLocalQuery(query);
    updateFilter('searchQuery', query);
    setShowHistory(false);
    if (onSearch) {
      onSearch(query);
    }
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          onFocus={() => searchHistory.length > 0 && setShowHistory(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
        />
        {localQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Search History Dropdown */}
      {showHistory && searchHistory.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <div className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
              <Clock className="h-4 w-4" />
              <span>Recent Searches</span>
            </div>
            <button
              onClick={clearSearchHistory}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>

          <div className="py-2">
            {searchHistory.map((query, index) => (
              <button
                key={index}
                onClick={() => handleSelectHistory(query)}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center space-x-3"
              >
                <TrendingUp className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">{query}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProspectSearchBar;
