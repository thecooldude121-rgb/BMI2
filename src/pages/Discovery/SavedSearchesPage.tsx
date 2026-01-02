import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Star, Play, Edit, Copy, Trash2, Share2, FolderOpen,
  ArrowLeft, Grid3X3, List, MoreVertical, CheckSquare, X,
  Download, Move, Users, Calendar, Filter, Plus, Sparkles
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  criteria: {
    filters: Record<string, any>;
    query?: string;
  };
  result_count: number;
  tags: string[];
  folder: string;
  is_favorite: boolean;
  created_at: string;
  last_run_at?: string;
  user_id: string;
  run_count: number;
}

type ViewMode = 'grid' | 'list';
type FilterTab = 'all' | 'favorites' | 'mine' | 'shared';
type SortOption = 'recent' | 'results' | 'name' | 'created';

const SavedSearchesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [filteredSearches, setFilteredSearches] = useState<SavedSearch[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchSavedSearches();
  }, []);

  useEffect(() => {
    filterAndSortSearches();
  }, [searches, searchQuery, filterTab, sortBy]);

  const fetchSavedSearches = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSearches(data || []);
    } catch (error) {
      console.error('Error fetching saved searches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortSearches = () => {
    let filtered = [...searches];

    // Apply search query filter
    if (searchQuery) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply tab filter
    switch (filterTab) {
      case 'favorites':
        filtered = filtered.filter(s => s.is_favorite);
        break;
      case 'mine':
        // Filter by current user - implement with auth
        break;
      case 'shared':
        // Filter shared searches
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.last_run_at || b.created_at).getTime() -
                 new Date(a.last_run_at || a.created_at).getTime();
        case 'results':
          return b.result_count - a.result_count;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

    setFilteredSearches(filtered);
  };

  const handleRunSearch = async (search: SavedSearch) => {
    // Update last_run_at and run_count
    await supabase
      .from('saved_searches')
      .update({
        last_run_at: new Date().toISOString(),
        run_count: search.run_count + 1
      })
      .eq('id', search.id);

    // Navigate to discovery with search criteria
    navigate('/lead-generation/discovery', {
      state: { savedSearch: search }
    });
  };

  const handleToggleFavorite = async (id: string, currentValue: boolean) => {
    await supabase
      .from('saved_searches')
      .update({ is_favorite: !currentValue })
      .eq('id', id);

    fetchSavedSearches();
  };

  const handleDelete = async (id: string) => {
    await supabase
      .from('saved_searches')
      .delete()
      .eq('id', id);

    fetchSavedSearches();
    setShowDeleteConfirm(null);
  };

  const handleDuplicate = async (search: SavedSearch) => {
    const newSearch = {
      ...search,
      id: undefined,
      name: `${search.name} (Copy)`,
      created_at: new Date().toISOString(),
      last_run_at: null,
      run_count: 0
    };

    await supabase
      .from('saved_searches')
      .insert([newSearch]);

    fetchSavedSearches();
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    await supabase
      .from('saved_searches')
      .delete()
      .in('id', ids);

    setSelectedIds(new Set());
    fetchSavedSearches();
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffDays = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const getCriteriaCount = (criteria: any) => {
    const filters = criteria.filters || {};
    return Object.keys(filters).length;
  };

  const getFolderColor = (folder: string) => {
    const colors: Record<string, string> = {
      personal: 'bg-blue-100 text-blue-700',
      team: 'bg-purple-100 text-purple-700',
      client: 'bg-green-100 text-green-700'
    };
    return colors[folder] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/lead-generation/discovery')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </button>
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-3xl font-bold text-gray-900">Saved Searches</h1>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                    {filteredSearches.length}
                  </span>
                </div>
                <p className="text-gray-600 mt-1">Manage and run your saved prospect searches</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/lead-generation/discovery')}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Search
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center justify-between space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search saved searches..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="recent">Recently Used</option>
                <option value="results">Most Results</option>
                <option value="name">A-Z</option>
                <option value="created">Created Date</option>
              </select>

              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow' : ''}`}
                >
                  <Grid3X3 className="h-4 w-4 text-gray-600" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow' : ''}`}
                >
                  <List className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center space-x-6 mt-6">
            {[
              { id: 'all', label: 'All Searches' },
              { id: 'favorites', label: 'Favorites' },
              { id: 'mine', label: 'My Searches' },
              { id: 'shared', label: 'Shared with Me' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id as FilterTab)}
                className={`pb-2 border-b-2 transition-colors font-medium ${
                  filterTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="font-semibold text-gray-900">
                {selectedIds.size} selected
              </span>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Clear
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBulkDelete}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </button>
              <button className="flex items-center px-4 py-2 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              <button className="flex items-center px-4 py-2 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors">
                <Move className="h-4 w-4 mr-2" />
                Move to Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredSearches.length === 0 ? (
          <div className="text-center py-20">
            <Sparkles className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {searchQuery ? 'No searches found' : 'No saved searches yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Save your first search to quickly access your favorite prospect filters'}
            </p>
            <button
              onClick={() => navigate('/lead-generation/discovery')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Create Your First Search
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-3 gap-6">
            {filteredSearches.map((search) => (
              <div
                key={search.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(search.id)}
                      onChange={() => toggleSelection(search.id)}
                      className="mt-1 w-4 h-4 rounded border-gray-300"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {search.name}
                      </h3>
                      {search.description && (
                        <p className="text-sm text-gray-600 mb-3">{search.description}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleFavorite(search.id, search.is_favorite)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Star
                      className={`h-5 w-5 ${
                        search.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
                      }`}
                    />
                  </button>
                </div>

                {/* Tags */}
                {search.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {search.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                    {search.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                        +{search.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Filters Applied</div>
                    <div className="text-lg font-bold text-gray-900">
                      {getCriteriaCount(search.criteria)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Results</div>
                    <div className="text-lg font-bold text-blue-600">
                      ~{search.result_count.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center justify-between mb-4 text-xs text-gray-500">
                  <span className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {search.last_run_at ? getTimeAgo(search.last_run_at) : 'Never run'}
                  </span>
                  <span className={`px-2 py-1 rounded ${getFolderColor(search.folder)}`}>
                    {search.folder}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleRunSearch(search)}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Run Search
                  </button>
                  <button
                    onClick={() => handleDuplicate(search)}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="h-4 w-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(search.id)}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200">
            {filteredSearches.map((search, idx) => (
              <div
                key={search.id}
                className={`flex items-center p-6 hover:bg-gray-50 transition-colors ${
                  idx !== filteredSearches.length - 1 ? 'border-b border-gray-200' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(search.id)}
                  onChange={() => toggleSelection(search.id)}
                  className="w-4 h-4 rounded border-gray-300 mr-4"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{search.name}</h3>
                    {search.is_favorite && (
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    )}
                    <span className={`px-2 py-1 rounded text-xs ${getFolderColor(search.folder)}`}>
                      {search.folder}
                    </span>
                  </div>
                  {search.description && (
                    <p className="text-sm text-gray-600 mb-2">{search.description}</p>
                  )}
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{getCriteriaCount(search.criteria)} filters</span>
                    <span>•</span>
                    <span className="text-blue-600 font-semibold">
                      ~{search.result_count.toLocaleString()} results
                    </span>
                    <span>•</span>
                    <span>{search.last_run_at ? getTimeAgo(search.last_run_at) : 'Never run'}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleRunSearch(search)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Run
                  </button>
                  <button
                    onClick={() => handleDuplicate(search)}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Copy className="h-4 w-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(search.id)}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Trash2 className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Saved Search?</h3>
            <p className="text-gray-600 mb-6">
              This action cannot be undone. The search will be permanently deleted.
            </p>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedSearchesPage;
