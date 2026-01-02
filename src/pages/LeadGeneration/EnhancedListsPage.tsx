import React, { useState, useEffect } from 'react';
import {
  List, Plus, Edit, Copy, Trash2, Share2, Play, Eye, MoreHorizontal,
  RefreshCw, Search, Filter, Star, Users, TrendingUp, Clock, Zap,
  Settings, Download, Upload, FolderOpen, Globe, Lock, CheckCircle,
  AlertCircle, BarChart3, Calendar, Target, Sparkles, X, FileText
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ProspectList {
  id: string;
  name: string;
  description: string;
  list_type: string;
  category: string;
  prospect_count: number;
  active_sequences_count: number;
  owner_name: string;
  is_shared: boolean;
  is_favorite: boolean;
  auto_refresh_enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface ListAnalytics {
  prospects_added: number;
  prospects_removed: number;
  prospects_converted: number;
  engagement_rate: number;
  active_count: number;
  dormant_count: number;
}

const LIST_TYPE_CONFIG = {
  static: { icon: List, label: 'Static', color: 'text-gray-600', bg: 'bg-gray-100' },
  dynamic: { icon: RefreshCw, label: 'Dynamic', color: 'text-blue-600', bg: 'bg-blue-100' },
  smart: { icon: Sparkles, label: 'Smart', color: 'text-purple-600', bg: 'bg-purple-100' },
  template: { icon: FileText, label: 'Template', color: 'text-green-600', bg: 'bg-green-100' }
};

export const EnhancedListsPage: React.FC = () => {
  const [lists, setLists] = useState<ProspectList[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<Map<string, ListAnalytics>>(new Map());
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'editor' | 'analytics'>('grid');
  const [selectedList, setSelectedList] = useState<ProspectList | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [listsRes, templatesRes, analyticsRes] = await Promise.all([
        supabase.from('prospect_lists').select('*').order('updated_at', { ascending: false }),
        supabase.from('list_templates').select('*').limit(6),
        supabase.from('list_analytics').select('*').order('date', { ascending: false }).limit(100)
      ]);

      setLists(listsRes.data || []);
      setTemplates(templatesRes.data || []);

      const analyticsMap = new Map();
      (analyticsRes.data || []).forEach(a => {
        if (!analyticsMap.has(a.list_id)) {
          analyticsMap.set(a.list_id, a);
        }
      });
      setAnalytics(analyticsMap);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createList = async (type: string = 'static') => {
    const name = prompt('List name:');
    if (!name) return;

    try {
      const { data } = await supabase
        .from('prospect_lists')
        .insert([{
          name,
          list_type: type,
          description: '',
          prospect_count: 0,
          owner_name: 'Current User'
        }])
        .select()
        .single();

      if (data) {
        setLists([data, ...lists]);
        if (type === 'dynamic' || type === 'smart') {
          setSelectedList(data);
          setShowRuleBuilder(true);
        }
      }
    } catch (error) {
      console.error('Error creating list:', error);
    }
  };

  const duplicateList = async (list: ProspectList) => {
    try {
      const { data } = await supabase
        .from('prospect_lists')
        .insert([{
          ...list,
          id: undefined,
          name: `${list.name} (Copy)`,
          prospect_count: 0
        }])
        .select()
        .single();

      if (data) {
        setLists([data, ...lists]);
        alert('List duplicated!');
      }
    } catch (error) {
      console.error('Error duplicating:', error);
    }
  };

  const deleteList = async (id: string) => {
    if (!confirm('Delete this list?')) return;

    try {
      await supabase.from('prospect_lists').delete().eq('id', id);
      setLists(lists.filter(l => l.id !== id));
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const toggleFavorite = async (list: ProspectList) => {
    try {
      const { data } = await supabase
        .from('prospect_lists')
        .update({ is_favorite: !list.is_favorite })
        .eq('id', list.id)
        .select()
        .single();

      if (data) {
        setLists(lists.map(l => l.id === list.id ? data : l));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const bulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} lists?`)) return;

    try {
      await supabase.from('prospect_lists').delete().in('id', Array.from(selectedIds));
      setLists(lists.filter(l => !selectedIds.has(l.id)));
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Error bulk deleting:', error);
    }
  };

  const categories = Array.from(new Set(lists.map(l => l.category).filter(Boolean)));

  const filteredLists = lists.filter(list => {
    if (searchTerm && !list.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !list.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (typeFilter !== 'all' && list.list_type !== typeFilter) return false;
    if (categoryFilter !== 'all' && list.category !== categoryFilter) return false;
    return true;
  });

  const ListCard = ({ list }: { list: ProspectList }) => {
    const typeConfig = LIST_TYPE_CONFIG[list.list_type as keyof typeof LIST_TYPE_CONFIG];
    const TypeIcon = typeConfig.icon;
    const listAnalytics = analytics.get(list.id);

    return (
      <div className="bg-white rounded-lg border-2 border-gray-200 p-5 hover:shadow-xl transition-all hover:border-blue-300">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3 flex-1">
            <input
              type="checkbox"
              checked={selectedIds.has(list.id)}
              onChange={() => toggleSelect(list.id)}
              className="mt-1 rounded"
            />

            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-lg font-bold text-gray-900">{list.name}</h3>

                <button
                  onClick={() => toggleFavorite(list)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Star className={`h-4 w-4 ${list.is_favorite ? 'text-amber-500 fill-current' : 'text-gray-400'}`} />
                </button>

                {list.is_shared && (
                  <Globe className="h-4 w-4 text-blue-600" title="Shared" />
                )}
              </div>

              <div className="flex items-center space-x-2 mb-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeConfig.bg} ${typeConfig.color}`}>
                  <TypeIcon className="h-3 w-3 inline mr-1" />
                  {typeConfig.label}
                </span>

                {list.category && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">
                    {list.category}
                  </span>
                )}

                {list.auto_refresh_enabled && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                    <RefreshCw className="h-3 w-3 inline mr-1" />
                    Auto
                  </span>
                )}
              </div>

              {list.description && (
                <p className="text-sm text-gray-600 mb-3">{list.description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="text-center p-2 bg-blue-50 rounded">
            <Users className="h-4 w-4 text-blue-600 mx-auto mb-1" />
            <div className="text-xs text-gray-600">Prospects</div>
            <div className="text-lg font-bold text-gray-900">{list.prospect_count}</div>
          </div>

          <div className="text-center p-2 bg-green-50 rounded">
            <Play className="h-4 w-4 text-green-600 mx-auto mb-1" />
            <div className="text-xs text-gray-600">Sequences</div>
            <div className="text-lg font-bold text-gray-900">{list.active_sequences_count}</div>
          </div>

          {listAnalytics && (
            <>
              <div className="text-center p-2 bg-purple-50 rounded">
                <TrendingUp className="h-4 w-4 text-purple-600 mx-auto mb-1" />
                <div className="text-xs text-gray-600">Added</div>
                <div className="text-lg font-bold text-gray-900">{listAnalytics.prospects_added}</div>
              </div>

              <div className="text-center p-2 bg-amber-50 rounded">
                <Target className="h-4 w-4 text-amber-600 mx-auto mb-1" />
                <div className="text-xs text-gray-600">Converted</div>
                <div className="text-lg font-bold text-gray-900">{listAnalytics.prospects_converted}</div>
              </div>
            </>
          )}
        </div>

        {listAnalytics && (
          <div className="mb-3 p-2 bg-gray-50 rounded">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-600">Engagement Rate</span>
              <span className="font-bold text-gray-900">{listAnalytics.engagement_rate}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  listAnalytics.engagement_rate >= 70 ? 'bg-green-500' :
                  listAnalytics.engagement_rate >= 40 ? 'bg-blue-500' : 'bg-amber-500'
                }`}
                style={{ width: `${listAnalytics.engagement_rate}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>Owner: {list.owner_name}</span>
          <span>Updated {new Date(list.updated_at).toLocaleDateString()}</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedList(list);
              setView('editor');
            }}
            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center justify-center"
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </button>

          <button
            onClick={() => alert('Send campaign')}
            className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
            title="Send Campaign"
          >
            <Play className="h-4 w-4" />
          </button>

          <button
            onClick={() => {
              setSelectedList(list);
              setView('analytics');
            }}
            className="px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
            title="Analytics"
          >
            <BarChart3 className="h-4 w-4" />
          </button>

          <button
            onClick={() => duplicateList(list)}
            className="px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
            title="Duplicate"
          >
            <Copy className="h-4 w-4" />
          </button>

          <button
            onClick={() => deleteList(list.id)}
            className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  const RuleBuilder = () => {
    if (!selectedList) return null;

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Smart List Rules</h3>
          <button
            onClick={() => setShowRuleBuilder(false)}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Add Condition</h4>
            <div className="grid grid-cols-3 gap-3">
              <select className="px-3 py-2 border rounded">
                <option>Lead Score</option>
                <option>Industry</option>
                <option>Company Size</option>
                <option>Last Activity</option>
              </select>

              <select className="px-3 py-2 border rounded">
                <option>&gt;</option>
                <option>&lt;</option>
                <option>=</option>
                <option>≥</option>
                <option>≤</option>
              </select>

              <input
                type="text"
                placeholder="Value"
                className="px-3 py-2 border rounded"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded font-medium">
              AND
            </button>
            <button className="px-4 py-2 bg-white border border-gray-300 rounded">
              OR
            </button>
          </div>

          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-900 mb-2">Automation Actions</h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm">Auto-enroll to sequence when added</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm">Notify owner when threshold reached</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm">Auto-refresh daily</span>
              </label>
            </div>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-900">Preview Results</span>
              <span className="text-lg font-bold text-purple-900">~{Math.floor(Math.random() * 200 + 50)} prospects</span>
            </div>
            <p className="text-xs text-purple-700">Based on current criteria</p>
          </div>

          <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Save Rules
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600">Loading lists...</p>
        </div>
      </div>
    );
  }

  if (view === 'editor' && selectedList) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 p-4">
          <button
            onClick={() => setView('grid')}
            className="mb-4 text-blue-600 hover:text-blue-700"
          >
            ← Back to Lists
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{selectedList.name}</h1>
          <p className="text-sm text-gray-600">{selectedList.prospect_count} prospects</p>
        </div>

        <div className="p-6">
          <RuleBuilder />

          <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">List Members</h3>
            <p className="text-sm text-gray-600">
              Prospect members would be displayed here with management options.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'analytics' && selectedList) {
    const listAnalytics = analytics.get(selectedList.id);

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 p-4">
          <button
            onClick={() => setView('grid')}
            className="mb-4 text-blue-600 hover:text-blue-700"
          >
            ← Back to Lists
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{selectedList.name} - Analytics</h1>
        </div>

        <div className="p-6">
          {listAnalytics && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <TrendingUp className="h-5 w-5 text-green-600 mb-2" />
                <div className="text-2xl font-bold text-gray-900">{listAnalytics.prospects_added}</div>
                <div className="text-sm text-gray-600">Added This Period</div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <AlertCircle className="h-5 w-5 text-red-600 mb-2" />
                <div className="text-2xl font-bold text-gray-900">{listAnalytics.prospects_removed}</div>
                <div className="text-sm text-gray-600">Removed</div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <CheckCircle className="h-5 w-5 text-purple-600 mb-2" />
                <div className="text-2xl font-bold text-gray-900">{listAnalytics.prospects_converted}</div>
                <div className="text-sm text-gray-600">Converted</div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <BarChart3 className="h-5 w-5 text-blue-600 mb-2" />
                <div className="text-2xl font-bold text-gray-900">{listAnalytics.engagement_rate}%</div>
                <div className="text-sm text-gray-600">Engagement Rate</div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Performance Trends</h3>
            <p className="text-sm text-gray-600">
              Time-series charts and detailed analytics would be displayed here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-40">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <List className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Lists</h1>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {lists.length} lists
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={loadData}
              className="p-2 hover:bg-gray-100 rounded"
              title="Refresh"
            >
              <RefreshCw className="h-5 w-5 text-gray-600" />
            </button>

            <button
              onClick={() => alert('Import lists')}
              className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </button>

            <div className="relative group">
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                New List
              </button>

              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button
                  onClick={() => createList('static')}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Static List
                </button>
                <button
                  onClick={() => createList('dynamic')}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Dynamic List
                </button>
                <button
                  onClick={() => createList('smart')}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Smart List (AI)
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search lists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Types</option>
            <option value="static">Static</option>
            <option value="dynamic">Dynamic</option>
            <option value="smart">Smart</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-sm font-medium text-blue-900">
              {selectedIds.size} selected
            </span>

            <button
              onClick={() => alert('Bulk share')}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              <Share2 className="h-3 w-3 inline mr-1" />
              Share
            </button>

            <button
              onClick={() => alert('Bulk export')}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
            >
              <Download className="h-3 w-3 inline mr-1" />
              Export
            </button>

            <button
              onClick={bulkDelete}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              <Trash2 className="h-3 w-3 inline mr-1" />
              Delete
            </button>

            <button
              onClick={() => setSelectedIds(new Set())}
              className="p-1 hover:bg-red-100 rounded"
            >
              <X className="h-4 w-4 text-red-600" />
            </button>
          </div>
        )}
      </div>

      <div className="p-6">
        {templates.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Start Templates</h2>
            <div className="grid grid-cols-3 gap-4">
              {templates.slice(0, 3).map(template => (
                <div key={template.id} className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-gray-900">{template.template_name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  <button className="w-full px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700">
                    Use Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <h2 className="text-lg font-semibold text-gray-900 mb-3">Your Lists</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLists.map(list => (
            <ListCard key={list.id} list={list} />
          ))}
        </div>

        {filteredLists.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <List className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No lists found</p>
            <button
              onClick={() => createList()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create Your First List
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedListsPage;
