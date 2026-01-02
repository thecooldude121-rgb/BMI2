import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Save, Star, Download, RefreshCw, Zap, Mail, Play,
  MapPin, Grid, List, Eye, Check, X, AlertCircle, TrendingUp, Users,
  Building, Briefcase, DollarSign, UserPlus, Settings, ExternalLink,
  Calendar, Target, Sparkles, ChevronDown, ChevronRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import IntentSignalsWidget from '../../components/Discovery/IntentSignalsWidget';
import JobChangeAlertsWidget from '../../components/Discovery/JobChangeAlertsWidget';
import TechnographicFilterWidget from '../../components/Discovery/TechnographicFilterWidget';
import BuyerIntentScoringWidget from '../../components/Discovery/BuyerIntentScoringWidget';
import CompanyTriggersWidget from '../../components/Discovery/CompanyTriggersWidget';

interface IntentSignal {
  id: string;
  signal_type: string;
  intent_level: string;
  title: string;
  description: string;
  detected_at: string;
}

interface SavedSearch {
  id: string;
  search_name: string;
  description: string;
  filters: any;
  results_count: number;
  is_favorite: boolean;
}

const INTENT_BADGES = {
  high: { icon: '=%', label: 'High Intent', color: 'bg-red-100 text-red-800' },
  medium: { icon: '�', label: 'Medium Intent', color: 'bg-amber-100 text-amber-800' },
  low: { icon: '=�', label: 'Low Intent', color: 'bg-gray-100 text-gray-800' }
};

const SIGNAL_ICONS: any = {
  funding: { icon: '=�', label: 'Funding', color: 'text-green-600' },
  news: { icon: '=�', label: 'News', color: 'text-blue-600' },
  executive_change: { icon: '=T', label: 'Executive Change', color: 'text-purple-600' },
  job_posting: { icon: '=�', label: 'Job Posting', color: 'text-amber-600' },
  website_visit: { icon: '=A', label: 'Website Visit', color: 'text-emerald-600' },
  ipo_rumor: { icon: '=�', label: 'IPO Rumor', color: 'text-pink-600' },
  ma_activity: { icon: '>', label: 'M&A Activity', color: 'text-indigo-600' },
  board_change: { icon: '<�', label: 'Board Change', color: 'text-cyan-600' }
};

export const EnhancedDiscoveryPage: React.FC = () => {
  const [intentSignals, setIntentSignals] = useState<IntentSignal[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'card' | 'map'>('list');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'prospects' | 'intelligence'>('prospects');

  const [filters, setFilters] = useState({
    intent_level: [] as string[],
    signal_types: [] as string[],
    company_size: [] as string[],
    industry: [] as string[],
    date_range: '30d'
  });

  const [results] = useState([
    {
      id: '1',
      name: 'Sarah Johnson',
      title: 'VP of Sales',
      company: 'TechCorp Inc',
      email: 'sarah.j@techcorp.com',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      intent_level: 'high',
      data_completeness: 95,
      signals: ['funding', 'website_visit'],
      last_visit: '2 hours ago',
      confidence_score: 92
    },
    {
      id: '2',
      name: 'Michael Chen',
      title: 'CTO',
      company: 'DataFlow Systems',
      email: 'm.chen@dataflow.io',
      phone: '+1 (555) 234-5678',
      location: 'Austin, TX',
      intent_level: 'high',
      data_completeness: 88,
      signals: ['executive_change', 'job_posting'],
      last_visit: '1 day ago',
      confidence_score: 87
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      title: 'Head of Marketing',
      company: 'Growth Partners',
      email: 'emily.r@growthpartners.com',
      phone: '+1 (555) 345-6789',
      location: 'New York, NY',
      intent_level: 'medium',
      data_completeness: 76,
      signals: ['news'],
      last_visit: '3 days ago',
      confidence_score: 78
    }
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [signalsRes, searchesRes] = await Promise.all([
        supabase.from('intent_signals').select('*').order('detected_at', { ascending: false }).limit(20),
        supabase.from('saved_searches').select('*').order('is_favorite', { ascending: false })
      ]);

      setIntentSignals(signalsRes.data || []);
      setSavedSearches(searchesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
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

  const bulkEnrich = async () => {
    const cost = selectedIds.size * 0.5;
    if (confirm(`Enrich ${selectedIds.size} prospects for $${cost.toFixed(2)}?`)) {
      alert('Enriching prospects...');
      setSelectedIds(new Set());
    }
  };

  const saveSearch = async () => {
    const name = prompt('Enter search name:');
    if (!name) return;

    try {
      await supabase.from('saved_searches').insert([{
        user_id: '00000000-0000-0000-0000-000000000000',
        search_name: name,
        filters,
        results_count: results.length
      }]);

      alert('Search saved!');
      loadData();
    } catch (error) {
      console.error('Error saving search:', error);
    }
  };

  const exportResults = async (format: string) => {
    try {
      await supabase.from('export_jobs').insert([{
        user_id: '00000000-0000-0000-0000-000000000000',
        export_type: 'discovery',
        format,
        filters,
        status: 'processing',
        record_count: results.length
      }]);

      alert(`Exporting ${results.length} results as ${format.toUpperCase()}...`);
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  const IntentBadge = ({ level }: { level: string }) => {
    const config = INTENT_BADGES[level as keyof typeof INTENT_BADGES];
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const SignalBadge = ({ type }: { type: string }) => {
    const signal = SIGNAL_ICONS[type];
    if (!signal) return null;

    return (
      <span className={`inline-flex items-center text-xs ${signal.color}`} title={signal.label}>
        <span className="mr-1">{signal.icon}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600">Loading discovery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar - Filters & Saved Searches */}
      <div className={`${showFilters ? 'w-80' : 'w-0'} transition-all overflow-hidden bg-white border-r border-gray-200`}>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Filters</h2>

          {/* Intent Level Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Buying Intent</label>
            <div className="space-y-1">
              {['high', 'medium', 'low'].map(level => (
                <label key={level} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.intent_level.includes(level)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFilters({...filters, intent_level: [...filters.intent_level, level]});
                      } else {
                        setFilters({...filters, intent_level: filters.intent_level.filter(x => x !== level)});
                      }
                    }}
                    className="mr-2 rounded"
                  />
                  <IntentBadge level={level} />
                </label>
              ))}
            </div>
          </div>

          {/* Signal Types Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Intent Signals</label>
            <div className="space-y-1">
              {Object.keys(SIGNAL_ICONS).slice(0, 4).map(type => {
                const signal = SIGNAL_ICONS[type];
                return (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.signal_types.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters({...filters, signal_types: [...filters.signal_types, type]});
                        } else {
                          setFilters({...filters, signal_types: filters.signal_types.filter(x => x !== type)});
                        }
                      }}
                      className="mr-2 rounded"
                    />
                    <span className="text-sm">{signal.icon} {signal.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Date Range */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Activity</label>
            <select
              value={filters.date_range}
              onChange={(e) => setFilters({...filters, date_range: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>

          {/* AI Suggestions */}
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-semibold text-purple-900">AI Suggests:</span>
            </div>
            <div className="space-y-1">
              <button className="w-full text-left text-xs text-purple-700 hover:text-purple-900 py-1">
                + Add "Enterprise" companies (2,345 matches)
              </button>
              <button className="w-full text-left text-xs text-purple-700 hover:text-purple-900 py-1">
                + Add "Technology" industry (1,876 matches)
              </button>
              <button className="w-full text-left text-xs text-purple-700 hover:text-purple-900 py-1">
                + Add "Recent Funding" (567 matches)
              </button>
            </div>
          </div>

          <button
            onClick={() => setFilters({ intent_level: [], signal_types: [], company_size: [], industry: [], date_range: '30d' })}
            className="w-full px-3 py-2 text-sm text-blue-600 hover:text-blue-700"
          >
            Clear All Filters
          </button>
        </div>

        {/* Saved Searches */}
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Saved Searches</h3>
          <div className="space-y-2">
            {savedSearches.map(search => (
              <button
                key={search.id}
                className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                onClick={() => setFilters(search.filters)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">{search.search_name}</span>
                  {search.is_favorite && <Star className="h-3 w-3 text-amber-500 fill-current" />}
                </div>
                {search.description && (
                  <p className="text-xs text-gray-600 mb-1">{search.description}</p>
                )}
                <span className="text-xs text-gray-500">{search.results_count} results</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <Filter className="h-5 w-5 text-gray-600" />
              </button>

              <Search className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Prospect Discovery</h1>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {results.length} results
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('prospects')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'prospects'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Prospects
                </button>
                <button
                  onClick={() => setActiveTab('intelligence')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'intelligence'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Data Intelligence
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex-1"></div>

            <div className="flex items-center space-x-2">
              {/* View Mode Toggle */}
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('card')}
                  className={`p-2 ${viewMode === 'card' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`p-2 ${viewMode === 'map' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                >
                  <MapPin className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={loadData}
                className="p-2 hover:bg-gray-100 rounded-lg"
                title="Refresh"
              >
                <RefreshCw className="h-5 w-5 text-gray-600" />
              </button>

              <button
                onClick={saveSearch}
                className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Search
              </button>

              <div className="relative group">
                <button className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                  <ChevronDown className="h-4 w-4 ml-1" />
                </button>

                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <button
                    onClick={() => exportResults('csv')}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={() => exportResults('excel')}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    Export as Excel
                  </button>
                  <button
                    onClick={() => exportResults('salesforce')}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    Push to Salesforce
                  </button>
                  <button
                    onClick={() => exportResults('hubspot')}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    Push to HubSpot
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search prospects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Bulk Actions Bar */}
          {selectedIds.size > 0 && (
            <div className="mt-3 flex items-center space-x-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm font-medium text-blue-900">
                {selectedIds.size} selected
              </span>

              <button
                onClick={bulkEnrich}
                className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
              >
                <Zap className="h-3 w-3 inline mr-1" />
                Enrich ${(selectedIds.size * 0.5).toFixed(2)}
              </button>

              <button
                onClick={() => alert('Add to list')}
                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                <UserPlus className="h-3 w-3 inline mr-1" />
                Add to List
              </button>

              <button
                onClick={() => alert('Bulk email')}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                <Mail className="h-3 w-3 inline mr-1" />
                Email
              </button>

              <button
                onClick={() => alert('Add to sequence')}
                className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
              >
                <Play className="h-3 w-3 inline mr-1" />
                Add to Sequence
              </button>

              <button
                onClick={() => setSelectedIds(new Set())}
                className="p-1.5 hover:bg-red-100 rounded"
              >
                <X className="h-4 w-4 text-red-600" />
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'intelligence' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <IntentSignalsWidget showFilters={true} maxItems={5} />
                <JobChangeAlertsWidget maxItems={5} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BuyerIntentScoringWidget prospectId={results[0]?.id || ''} />
                <CompanyTriggersWidget maxItems={5} />
              </div>
              <div>
                <TechnographicFilterWidget />
              </div>
            </div>
          ) : (
            <>
            {viewMode === 'list' && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === results.length}
                        onChange={() => {
                          if (selectedIds.size === results.length) {
                            setSelectedIds(new Set());
                          } else {
                            setSelectedIds(new Set(results.map(r => r.id)));
                          }
                        }}
                        className="rounded"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Intent</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Signals</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Data Quality</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Last Visit</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(result => (
                    <tr
                      key={result.id}
                      className={`border-b border-gray-200 hover:bg-gray-50 ${selectedIds.has(result.id) ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(result.id)}
                          onChange={() => toggleSelect(result.id)}
                          className="rounded"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <IntentBadge level={result.intent_level} />
                      </td>

                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900">{result.name}</div>
                          <div className="text-sm text-gray-500">{result.title}</div>
                          <div className="text-xs text-gray-400">{result.email}</div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900">{result.company}</div>
                          <div className="text-xs text-gray-500">{result.location}</div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-1">
                          {result.signals.map(signal => (
                            <SignalBadge key={signal} type={signal} />
                          ))}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden w-16">
                            <div
                              className={`h-full ${
                                result.data_completeness >= 90 ? 'bg-green-500' :
                                result.data_completeness >= 70 ? 'bg-blue-500' :
                                'bg-amber-500'
                              }`}
                              style={{ width: `${result.data_completeness}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-700">{result.data_completeness}%</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {result.confidence_score}% confidence
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">{result.last_visit}</span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => alert(`Enrich ${result.name}`)}
                            className="p-1.5 hover:bg-purple-50 rounded"
                            title="Quick Enrich"
                          >
                            <Zap className="h-4 w-4 text-purple-600" />
                          </button>

                          <button
                            onClick={() => alert(`Email ${result.name}`)}
                            className="p-1.5 hover:bg-blue-50 rounded"
                            title="Send Email"
                          >
                            <Mail className="h-4 w-4 text-blue-600" />
                          </button>

                          <button
                            onClick={() => alert(`View ${result.name}`)}
                            className="p-1.5 hover:bg-gray-100 rounded"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4 text-gray-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {viewMode === 'card' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map(result => (
                <div
                  key={result.id}
                  className={`bg-white rounded-lg border-2 p-4 hover:shadow-lg transition-shadow ${
                    selectedIds.has(result.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(result.id)}
                      onChange={() => toggleSelect(result.id)}
                      className="rounded mt-1"
                    />
                    <IntentBadge level={result.intent_level} />
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-1">{result.name}</h3>
                  <p className="text-sm text-gray-600 mb-1">{result.title}</p>
                  <p className="text-sm font-medium text-gray-900 mb-2">{result.company}</p>

                  <div className="flex items-center space-x-1 mb-3">
                    {result.signals.map(signal => (
                      <SignalBadge key={signal} type={signal} />
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>{result.location}</span>
                    <span>{result.last_visit}</span>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600">Data Completeness</span>
                      <span className="font-medium">{result.data_completeness}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          result.data_completeness >= 90 ? 'bg-green-500' :
                          result.data_completeness >= 70 ? 'bg-blue-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${result.data_completeness}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => alert(`Enrich ${result.name}`)}
                      className="flex-1 px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                    >
                      <Zap className="h-3 w-3 inline mr-1" />
                      Enrich
                    </button>

                    <button
                      onClick={() => alert(`Email ${result.name}`)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      <Mail className="h-3 w-3 inline mr-1" />
                      Email
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'map' && (
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <div className="text-center">
                <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Map View</h3>
                <p className="text-gray-600">Geographic visualization would integrate with mapping service</p>
              </div>
            </div>
          )}
          </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedDiscoveryPage;
