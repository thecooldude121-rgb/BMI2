import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ProspectFilters, DEFAULT_FILTERS, FilterChip } from '../types/prospectFilters';

interface ProspectFilterContextType {
  filters: ProspectFilters;
  setFilters: (filters: ProspectFilters) => void;
  updateFilter: <K extends keyof ProspectFilters>(key: K, value: ProspectFilters[K]) => void;
  clearFilters: () => void;
  clearFilter: (key: keyof ProspectFilters) => void;
  filterChips: FilterChip[];
  activeFilterCount: number;
  searchHistory: string[];
  addToSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;
}

const ProspectFilterContext = createContext<ProspectFilterContextType | undefined>(undefined);

export const useProspectFilters = () => {
  const context = useContext(ProspectFilterContext);
  if (!context) {
    throw new Error('useProspectFilters must be used within ProspectFilterProvider');
  }
  return context;
};

export const ProspectFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<ProspectFilters>(DEFAULT_FILTERS);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  // Load filters from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlFilters: Partial<ProspectFilters> = {};

    // Parse statuses
    const statuses = params.get('statuses');
    if (statuses) {
      urlFilters.statuses = statuses.split(',') as any[];
    }

    // Parse score ranges
    const leadScoreMin = params.get('leadScoreMin');
    const leadScoreMax = params.get('leadScoreMax');
    if (leadScoreMin || leadScoreMax) {
      urlFilters.leadScore = {
        min: leadScoreMin ? parseInt(leadScoreMin) : 0,
        max: leadScoreMax ? parseInt(leadScoreMax) : 100
      };
    }

    const aiScoreMin = params.get('aiScoreMin');
    const aiScoreMax = params.get('aiScoreMax');
    if (aiScoreMin || aiScoreMax) {
      urlFilters.aiScore = {
        min: aiScoreMin ? parseInt(aiScoreMin) : 0,
        max: aiScoreMax ? parseInt(aiScoreMax) : 100
      };
    }

    const qualityScoreMin = params.get('qualityScoreMin');
    const qualityScoreMax = params.get('qualityScoreMax');
    if (qualityScoreMin || qualityScoreMax) {
      urlFilters.qualityScore = {
        min: qualityScoreMin ? parseInt(qualityScoreMin) : 0,
        max: qualityScoreMax ? parseInt(qualityScoreMax) : 100
      };
    }

    // Parse company sizes
    const companySizes = params.get('companySizes');
    if (companySizes) {
      urlFilters.companySizes = companySizes.split(',') as any[];
    }

    // Parse industries
    const industries = params.get('industries');
    if (industries) {
      urlFilters.industries = industries.split(',');
    }

    // Parse tags
    const tags = params.get('tags');
    if (tags) {
      urlFilters.tags = tags.split(',');
    }

    // Parse engagement levels
    const engagementLevels = params.get('engagement');
    if (engagementLevels) {
      urlFilters.engagementLevels = engagementLevels.split(',') as any[];
    }

    // Parse search query
    const searchQuery = params.get('q');
    if (searchQuery) {
      urlFilters.searchQuery = searchQuery;
    }

    // Parse dates
    const createdFrom = params.get('createdFrom');
    const createdTo = params.get('createdTo');
    if (createdFrom || createdTo) {
      urlFilters.createdDate = { from: createdFrom || undefined, to: createdTo || undefined };
    }

    if (Object.keys(urlFilters).length > 0) {
      setFilters({ ...DEFAULT_FILTERS, ...urlFilters });
    }
  }, []);

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.statuses.length > 0) {
      params.set('statuses', filters.statuses.join(','));
    }

    if (filters.leadScore.min !== 0 || filters.leadScore.max !== 100) {
      params.set('leadScoreMin', filters.leadScore.min.toString());
      params.set('leadScoreMax', filters.leadScore.max.toString());
    }

    if (filters.aiScore.min !== 0 || filters.aiScore.max !== 100) {
      params.set('aiScoreMin', filters.aiScore.min.toString());
      params.set('aiScoreMax', filters.aiScore.max.toString());
    }

    if (filters.qualityScore.min !== 0 || filters.qualityScore.max !== 100) {
      params.set('qualityScoreMin', filters.qualityScore.min.toString());
      params.set('qualityScoreMax', filters.qualityScore.max.toString());
    }

    if (filters.companySizes.length > 0) {
      params.set('companySizes', filters.companySizes.join(','));
    }

    if (filters.industries.length > 0) {
      params.set('industries', filters.industries.join(','));
    }

    if (filters.tags.length > 0) {
      params.set('tags', filters.tags.join(','));
    }

    if (filters.engagementLevels.length > 0) {
      params.set('engagement', filters.engagementLevels.join(','));
    }

    if (filters.searchQuery) {
      params.set('q', filters.searchQuery);
    }

    if (filters.createdDate.from) {
      params.set('createdFrom', filters.createdDate.from);
    }
    if (filters.createdDate.to) {
      params.set('createdTo', filters.createdDate.to);
    }

    const newUrl = params.toString() ? `?${params.toString()}` : location.pathname;
    if (newUrl !== location.search && newUrl !== location.pathname) {
      navigate(newUrl, { replace: true });
    }
  }, [filters]);

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('prospectSearchHistory');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load search history', e);
      }
    }
  }, []);

  const updateFilter = useCallback(<K extends keyof ProspectFilters>(
    key: K,
    value: ProspectFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const clearFilter = useCallback((key: keyof ProspectFilters) => {
    setFilters(prev => ({ ...prev, [key]: (DEFAULT_FILTERS as any)[key] }));
  }, []);

  const addToSearchHistory = useCallback((query: string) => {
    if (!query.trim()) return;

    setSearchHistory(prev => {
      const newHistory = [query, ...prev.filter(q => q !== query)].slice(0, 5);
      localStorage.setItem('prospectSearchHistory', JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem('prospectSearchHistory');
  }, []);

  // Generate filter chips
  const filterChips: FilterChip[] = [];

  if (filters.statuses.length > 0) {
    filterChips.push({
      id: 'statuses',
      category: 'Status',
      label: filters.statuses.join(', '),
      value: filters.statuses,
      onRemove: () => clearFilter('statuses')
    });
  }

  if (filters.leadScore.min !== 0 || filters.leadScore.max !== 100) {
    filterChips.push({
      id: 'leadScore',
      category: 'Lead Score',
      label: `${filters.leadScore.min}-${filters.leadScore.max}`,
      value: `${filters.leadScore.min}-${filters.leadScore.max}`,
      onRemove: () => clearFilter('leadScore')
    });
  }

  if (filters.aiScore.min !== 0 || filters.aiScore.max !== 100) {
    filterChips.push({
      id: 'aiScore',
      category: 'AI Score',
      label: `${filters.aiScore.min}-${filters.aiScore.max}`,
      value: `${filters.aiScore.min}-${filters.aiScore.max}`,
      onRemove: () => clearFilter('aiScore')
    });
  }

  if (filters.qualityScore.min !== 0 || filters.qualityScore.max !== 100) {
    filterChips.push({
      id: 'qualityScore',
      category: 'Quality Score',
      label: `${filters.qualityScore.min}-${filters.qualityScore.max}`,
      value: `${filters.qualityScore.min}-${filters.qualityScore.max}`,
      onRemove: () => clearFilter('qualityScore')
    });
  }

  if (filters.companySizes.length > 0) {
    filterChips.push({
      id: 'companySizes',
      category: 'Company Size',
      label: filters.companySizes.join(', '),
      value: filters.companySizes,
      onRemove: () => clearFilter('companySizes')
    });
  }

  if (filters.industries.length > 0) {
    filterChips.push({
      id: 'industries',
      category: 'Industry',
      label: filters.industries.join(', '),
      value: filters.industries,
      onRemove: () => clearFilter('industries')
    });
  }

  if (filters.tags.length > 0) {
    filterChips.push({
      id: 'tags',
      category: 'Tags',
      label: filters.tags.join(', '),
      value: filters.tags,
      onRemove: () => clearFilter('tags')
    });
  }

  if (filters.engagementLevels.length > 0) {
    filterChips.push({
      id: 'engagement',
      category: 'Engagement',
      label: filters.engagementLevels.join(', '),
      value: filters.engagementLevels,
      onRemove: () => clearFilter('engagementLevels')
    });
  }

  if (filters.searchQuery) {
    filterChips.push({
      id: 'search',
      category: 'Search',
      label: filters.searchQuery,
      value: filters.searchQuery,
      onRemove: () => clearFilter('searchQuery')
    });
  }

  const activeFilterCount = filterChips.length;

  return (
    <ProspectFilterContext.Provider
      value={{
        filters,
        setFilters,
        updateFilter,
        clearFilters,
        clearFilter,
        filterChips,
        activeFilterCount,
        searchHistory,
        addToSearchHistory,
        clearSearchHistory
      }}
    >
      {children}
    </ProspectFilterContext.Provider>
  );
};
