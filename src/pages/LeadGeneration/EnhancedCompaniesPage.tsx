import React, { useState, useEffect } from 'react';
import {
  Building, Search, Filter, Download, Eye, MoreHorizontal, TrendingUp,
  Target, Zap, Users, DollarSign, AlertCircle, CheckCircle, Clock,
  Star, Mail, Play, Tag, UserPlus, ExternalLink, X, RefreshCw,
  BarChart3, Activity, Briefcase, Award, TrendingDown, Network
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Company {
  id: string;
  name: string;
  industry: string;
  size: string;
  location: string;
  website: string;
  icp_match_percentage: number;
  account_tier: string;
  account_health_score: number;
  engagement_score: number;
  deal_propensity: number;
  buying_cycle_stage: string;
  expansion_potential: string;
  growth_rate: string;
  recent_signals: string[];
}

interface CompanyMetrics {
  win_rate: number;
  avg_deal_size: number;
  time_to_close_days: number;
  total_deals: number;
}

interface Executive {
  name: string;
  title: string;
  is_decision_maker: boolean;
  influence_score: number;
}

const SIGNAL_ICONS: any = {
  funding: { icon: '💰', label: 'Funding', color: 'text-green-600' },
  news: { icon: '📰', label: 'Recent News', color: 'text-blue-600' },
  executive_change: { icon: '👔', label: 'Executive Change', color: 'text-purple-600' },
  earnings: { icon: '📊', label: 'Earnings', color: 'text-emerald-600' },
  product_launch: { icon: '🚀', label: 'Product Launch', color: 'text-red-600' }
};

const TIER_BADGES = {
  enterprise: { label: 'Enterprise', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  mid_market: { label: 'Mid-Market', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  smb: { label: 'SMB', color: 'bg-green-100 text-green-800 border-green-300' }
};

export const EnhancedCompaniesPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [metricsMap, setMetricsMap] = useState<Map<string, CompanyMetrics>>(new Map());
  const [executivesMap, setExecutivesMap] = useState<Map<string, Executive[]>>(new Map());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [detailModalId, setDetailModalId] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    account_tier: [] as string[],
    icp_match_min: 0,
    health_score_min: 0,
    has_signals: false,
    growth_rate: [] as string[]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [companiesRes, metricsRes, executivesRes] = await Promise.all([
        supabase.from('companies').select('*').order('icp_match_percentage', { ascending: false }),
        supabase.from('company_metrics').select('*'),
        supabase.from('company_executives').select('*')
      ]);

      setCompanies(companiesRes.data || []);

      const metricsData = new Map();
      (metricsRes.data || []).forEach(m => {
        metricsData.set(m.company_id, m);
      });
      setMetricsMap(metricsData);

      const executivesData = new Map();
      (executivesRes.data || []).forEach(exec => {
        if (!executivesData.has(exec.company_id)) {
          executivesData.set(exec.company_id, []);
        }
        executivesData.get(exec.company_id).push(exec);
      });
      setExecutivesMap(executivesData);

    } catch (error) {
      console.error('Error loading companies:', error);
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

  const bulkEnrich = () => {
    alert(`Enriching ${selectedIds.size} companies...`);
    setSelectedIds(new Set());
  };

  const getHealthStatus = (score: number) => {
    if (score >= 80) return { icon: '🟢', label: 'Healthy', color: 'text-green-600' };
    if (score >= 50) return { icon: '🟡', label: 'At Risk', color: 'text-amber-600' };
    return { icon: '🔴', label: 'Critical', color: 'text-red-600' };
  };

  const filteredCompanies = companies.filter(company => {
    if (searchTerm && !company.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !company.industry?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    if (filters.account_tier.length > 0 && !filters.account_tier.includes(company.account_tier)) {
      return false;
    }

    if (company.icp_match_percentage < filters.icp_match_min) return false;
    if (company.account_health_score < filters.health_score_min) return false;

    if (filters.has_signals && (!company.recent_signals || company.recent_signals.length === 0)) {
      return false;
    }

    if (filters.growth_rate.length > 0 && !filters.growth_rate.includes(company.growth_rate)) {
      return false;
    }

    return true;
  });

  const CompanyCard = ({ company }: { company: Company }) => {
    const metrics = metricsMap.get(company.id);
    const executives = executivesMap.get(company.id) || [];
    const decisionMakers = executives.filter(e => e.is_decision_maker);
    const healthStatus = getHealthStatus(company.account_health_score);
    const tierBadge = TIER_BADGES[company.account_tier as keyof typeof TIER_BADGES];

    return (
      <div
        className={`bg-white rounded-lg border-2 p-5 hover:shadow-xl transition-all ${
          selectedIds.has(company.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3 flex-1">
            <input
              type="checkbox"
              checked={selectedIds.has(company.id)}
              onChange={() => toggleSelect(company.id)}
              className="mt-1 rounded"
            />

            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-lg font-bold text-gray-900">{company.name}</h3>
                <button
                  onClick={() => window.open(`https://${company.website}`, '_blank')}
                  className="text-gray-400 hover:text-blue-600"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center space-x-2 flex-wrap gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${tierBadge.color}`}>
                  {tierBadge.label}
                </span>

                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {company.icp_match_percentage}% ICP Match
                </span>

                <span className={`text-sm font-medium ${healthStatus.color}`}>
                  {healthStatus.icon} {healthStatus.label}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-2">
                {company.industry} • {company.size} • {company.location}
              </p>
            </div>
          </div>
        </div>

        {/* Signals */}
        {company.recent_signals && company.recent_signals.length > 0 && (
          <div className="flex items-center space-x-2 mb-3 p-2 bg-amber-50 rounded-lg border border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <div className="flex items-center space-x-3 flex-wrap">
              {company.recent_signals.map(signal => {
                const signalConfig = SIGNAL_ICONS[signal];
                return signalConfig ? (
                  <span key={signal} className={`text-xs ${signalConfig.color}`} title={signalConfig.label}>
                    {signalConfig.icon} {signalConfig.label}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-gray-50 rounded p-3">
            <div className="text-xs text-gray-500 mb-1">Engagement Score</div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    company.engagement_score >= 70 ? 'bg-green-500' :
                    company.engagement_score >= 40 ? 'bg-blue-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${company.engagement_score}%` }}
                />
              </div>
              <span className="text-sm font-bold">{company.engagement_score}</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded p-3">
            <div className="text-xs text-gray-500 mb-1">Deal Propensity</div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    company.deal_propensity >= 70 ? 'bg-green-500' :
                    company.deal_propensity >= 40 ? 'bg-blue-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${company.deal_propensity}%` }}
                />
              </div>
              <span className="text-sm font-bold">{company.deal_propensity}</span>
            </div>
          </div>
        </div>

        {/* Key Info */}
        <div className="grid grid-cols-3 gap-3 mb-3 text-center">
          <div className="bg-blue-50 rounded p-2">
            <Users className="h-4 w-4 text-blue-600 mx-auto mb-1" />
            <div className="text-xs text-gray-600">Decision Makers</div>
            <div className="text-lg font-bold text-gray-900">{decisionMakers.length}</div>
          </div>

          <div className="bg-green-50 rounded p-2">
            <TrendingUp className="h-4 w-4 text-green-600 mx-auto mb-1" />
            <div className="text-xs text-gray-600">Growth</div>
            <div className="text-xs font-semibold text-gray-900">{company.growth_rate}</div>
          </div>

          <div className="bg-purple-50 rounded p-2">
            <Award className="h-4 w-4 text-purple-600 mx-auto mb-1" />
            <div className="text-xs text-gray-600">Expansion</div>
            <div className="text-xs font-semibold text-gray-900">{company.expansion_potential}</div>
          </div>
        </div>

        {/* Metrics */}
        {metrics && (
          <div className="grid grid-cols-3 gap-2 mb-3 p-2 bg-gray-50 rounded">
            <div>
              <div className="text-xs text-gray-500">Win Rate</div>
              <div className="text-sm font-bold text-gray-900">{metrics.win_rate}%</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Avg Deal</div>
              <div className="text-sm font-bold text-gray-900">${(metrics.avg_deal_size / 1000).toFixed(0)}k</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Time to Close</div>
              <div className="text-sm font-bold text-gray-900">{metrics.time_to_close_days}d</div>
            </div>
          </div>
        )}

        {/* Buying Cycle Stage */}
        {company.buying_cycle_stage && (
          <div className="mb-3 p-2 bg-indigo-50 rounded border border-indigo-200">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-medium text-indigo-900">
                Stage: {company.buying_cycle_stage}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setDetailModalId(company.id)}
            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center justify-center"
          >
            <Eye className="h-3 w-3 mr-1" />
            View Details
          </button>

          <button
            onClick={() => alert(`Enrich ${company.name}`)}
            className="px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
            title="Enrich"
          >
            <Zap className="h-4 w-4" />
          </button>

          <button
            onClick={() => alert(`Email ${company.name}`)}
            className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
            title="Email"
          >
            <Mail className="h-4 w-4" />
          </button>

          <button
            onClick={() => alert('View org chart')}
            className="px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
            title="Org Chart"
          >
            <Network className="h-4 w-4" />
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
          <p className="text-gray-600">Loading companies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Building className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {filteredCompanies.length} companies
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={loadData}
                className="p-2 hover:bg-gray-100 rounded-lg"
                title="Refresh"
              >
                <RefreshCw className="h-5 w-5 text-gray-600" />
              </button>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>

              <button
                onClick={() => alert('Export companies')}
                className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Account Tier</label>
                  <div className="space-y-1">
                    {['enterprise', 'mid_market', 'smb'].map(tier => (
                      <label key={tier} className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={filters.account_tier.includes(tier)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters({...filters, account_tier: [...filters.account_tier, tier]});
                            } else {
                              setFilters({...filters, account_tier: filters.account_tier.filter(t => t !== tier)});
                            }
                          }}
                          className="mr-2"
                        />
                        {tier.replace('_', ' ')}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Min ICP Match %</label>
                  <input
                    type="number"
                    value={filters.icp_match_min}
                    onChange={(e) => setFilters({...filters, icp_match_min: +e.target.value})}
                    className="w-full px-2 py-1 border rounded text-sm"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Min Health Score</label>
                  <input
                    type="number"
                    value={filters.health_score_min}
                    onChange={(e) => setFilters({...filters, health_score_min: +e.target.value})}
                    className="w-full px-2 py-1 border rounded text-sm"
                    min="0"
                    max="100"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => setFilters({ account_tier: [], icp_match_min: 0, health_score_min: 0, has_signals: false, growth_rate: [] })}
                    className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <div className="mt-3 flex items-center space-x-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm font-medium text-blue-900">
                {selectedIds.size} selected
              </span>

              <button
                onClick={bulkEnrich}
                className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
              >
                <Zap className="h-3 w-3 inline mr-1" />
                Bulk Enrich
              </button>

              <button
                onClick={() => alert('Add to list')}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                <UserPlus className="h-3 w-3 inline mr-1" />
                Add to List
              </button>

              <button
                onClick={() => alert('Add to sequence')}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                <Play className="h-3 w-3 inline mr-1" />
                Add to Sequence
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
      </div>

      {/* Companies Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map(company => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>

        {filteredCompanies.length === 0 && (
          <div className="text-center py-12">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No companies found</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailModalId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Company Details</h2>
                <button
                  onClick={() => setDetailModalId(null)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-gray-600">
                  Detailed company profile, org chart, tech stack, and competitive intelligence would be displayed here.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded">
                    <h3 className="font-semibold mb-2">Executives</h3>
                    <p className="text-sm text-gray-600">Executive team list</p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded">
                    <h3 className="font-semibold mb-2">News Feed</h3>
                    <p className="text-sm text-gray-600">Recent articles and mentions</p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded">
                    <h3 className="font-semibold mb-2">Tech Stack</h3>
                    <p className="text-sm text-gray-600">Technologies used</p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded">
                    <h3 className="font-semibold mb-2">Competitive Set</h3>
                    <p className="text-sm text-gray-600">Similar companies</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedCompaniesPage;
