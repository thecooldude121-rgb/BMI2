import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw, X, ChevronRight, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SearchHistoryEntry {
  id: string;
  query_text: string;
  filters: Record<string, any>;
  result_count: number;
  created_at: string;
}

interface SearchHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onRerun: (entry: SearchHistoryEntry) => void;
}

const SearchHistorySidebar: React.FC<SearchHistorySidebarProps> = ({
  isOpen,
  onClose,
  onRerun
}) => {
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching search history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (confirm('Are you sure you want to clear your search history?')) {
      await supabase
        .from('search_history')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      setHistory([]);
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  const truncateQuery = (query: string, maxLength: number = 50) => {
    if (query.length <= maxLength) return query;
    return query.substring(0, maxLength) + '...';
  };

  const getFilterCount = (filters: Record<string, any>) => {
    return Object.keys(filters).length;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-40"
        onClick={onClose}
      ></div>

      {/* Sidebar */}
      <div className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Clock className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Recent Searches</h2>
              <p className="text-sm text-gray-600">Last 10 searches</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No search history yet</p>
              <p className="text-gray-400 text-xs mt-1">
                Your recent searches will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all group"
                >
                  {/* Query */}
                  <div className="mb-2">
                    {entry.query_text ? (
                      <p className="text-sm font-semibold text-gray-900 mb-1">
                        {truncateQuery(entry.query_text)}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 mb-1 italic">
                        Filter-based search
                      </p>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span className="flex items-center">
                      {getFilterCount(entry.filters)} filters
                    </span>
                    <span>•</span>
                    <span className="text-blue-600 font-semibold">
                      {entry.result_count.toLocaleString()} results
                    </span>
                    <span>•</span>
                    <span>{getTimeAgo(entry.created_at)}</span>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => onRerun(entry)}
                    className="w-full flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium group-hover:bg-blue-600 group-hover:text-white"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Re-run Search
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleClearHistory}
              className="w-full flex items-center justify-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear History
            </button>
          </div>
        )}
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

export default SearchHistorySidebar;
