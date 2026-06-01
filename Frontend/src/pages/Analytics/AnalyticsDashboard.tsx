import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Users, Target, DollarSign, Activity, AlertCircle, Sparkles,
  Download, Filter, Calendar, ChevronDown, Mail, Phone, BarChart3, PieChart,
  ArrowUp, ArrowDown, Clock, CheckCircle, XCircle, Zap, RefreshCw, Bell,
  Settings, Eye, MessageSquare, ThumbsUp, Share2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Metric {
  metric_name: string;
  value: number;
  target_value: number;
  period: string;
}

interface AIInsight {
  id: string;
  insight_type: string;
  title: string;
  description: string;
  priority: string;
  action_items: any[];
  confidence_score: number;
  is_actioned: boolean;
}

interface FunnelStage {
  id: string;
  name: string;
  stage_order: number;
  color: string;
  target_conversion_rate: number;
  avg_time_in_stage_days: number;
  is_bottleneck: boolean;
}

interface AlertRule {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

export const AnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [funnelStages, setFunnelStages] = useState<FunnelStage[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedOwner, setSelectedOwner] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod, selectedOwner]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [metricsRes, insightsRes, stagesRes, alertsRes] = await Promise.all([
        supabase.from('analytics_metrics').select('*').order('calculated_at', { ascending: false }).limit(20),
        supabase.from('ai_insights').select('*').eq('is_actioned', false).order('priority', { ascending: false }),
        supabase.from('funnel_stages').select('*').order('stage_order'),
        supabase.from('alert_rules').select('*').eq('is_active', true)
      ]);

      setMetrics(metricsRes.data || []);
      setInsights(insightsRes.data || []);
      setFunnelStages(stagesRes.data || []);
      setAlertRules(alertsRes.data || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const enrichEntity = async (entityType: string, entityId: string) => {
    try {
      await supabase.from('enrichment_logs').insert([{
        entity_type: entityType,
        entity_id: entityId,
        enrichment_type: 'full',
        status: 'processing',
        source: 'clearbit'
      }]);

      setTimeout(async () => {
        await supabase.from('enrichment_logs').update({ status: 'completed' }).eq('entity_id', entityId);
        alert('Enrichment completed!');
      }, 2000);
    } catch (error) {
      console.error('Error enriching:', error);
    }
  };

  const actionInsight = async (insightId: string) => {
    try {
      await supabase.from('ai_insights').update({ is_actioned: true, actioned_at: new Date().toISOString() }).eq('id', insightId);
      setInsights(insights.filter(i => i.id !== insightId));
    } catch (error) {
      console.error('Error actioning insight:', error);
    }
  };

  const exportToCSV = () => {
    const headers = ['Metric', 'Value', 'Target', 'Period'];
    const rows = metrics.map(m => [m.metric_name, m.value, m.target_value, m.period]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getMetricValue = (name: string) => metrics.find(m => m.metric_name === name)?.value || 0;
  const getMetricTarget = (name: string) => metrics.find(m => m.metric_name === name)?.target_value || 0;

  const calculateChange = (value: number, target: number) => {
    if (target === 0) return 0;
    return ((value - target) / target * 100).toFixed(1);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getActionIcon = (icon: string) => {
    const icons: any = {
      mail: Mail, phone: Phone, calendar: Calendar, users: Users,
      'alert-circle': AlertCircle, zap: Zap, copy: Share2, target: Target,
      shield: CheckCircle, 'message-square': MessageSquare, split: BarChart3,
      'user-plus': Users
    };
    return icons[icon] || Sparkles;
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics & AI Insights</h1>
            <p className="text-sm text-gray-600 mt-1">Unified dashboard with AI recommendations and enrichment</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={loadDashboardData}
              className="flex items-center px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>

            <button
              onClick={exportToCSV}
              className="flex items-center px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>

            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Settings className="h-4 w-4 mr-2" />
              Configure Alerts
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Period</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Owner</label>
                <select
                  value={selectedOwner}
                  onChange={(e) => setSelectedOwner(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                >
                  <option value="all">All</option>
                  <option value="john">John Smith</option>
                  <option value="jane">Jane Doe</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date Range</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Campaign</label>
                <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg">
                  <option>All Campaigns</option>
                  <option>Cold Outreach</option>
                  <option>Demo Follow-up</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center space-x-1 mt-4">
          {['overview', 'funnel', 'sequences', 'team'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-600">Total Prospects</span>
                </div>
                <ArrowUp className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-gray-900">{getMetricValue('total_prospects')}</span>
                <span className="text-sm text-green-600">+12%</span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Target: {getMetricTarget('total_prospects')}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-600">Reply Rate</span>
                </div>
                <ArrowDown className="h-4 w-4 text-red-600" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-gray-900">{getMetricValue('reply_rate')}%</span>
                <span className="text-sm text-red-600">-6%</span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Target: {getMetricTarget('reply_rate')}%
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-600">Conversion Rate</span>
                </div>
                <ArrowDown className="h-4 w-4 text-red-600" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-gray-900">{getMetricValue('conversion_rate')}%</span>
                <span className="text-sm text-red-600">-9%</span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Target: {getMetricTarget('conversion_rate')}%
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm font-medium text-gray-600">Deals Closed</span>
                </div>
                <ArrowUp className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-gray-900">{getMetricValue('deals_closed')}</span>
                <span className="text-sm text-green-600">+16%</span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Target: {getMetricTarget('deals_closed')}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* AI Insights Panel */}
            <div className="col-span-2 bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <h2 className="text-lg font-semibold text-gray-900">AI Insights & Recommendations</h2>
                </div>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                  {insights.length} Active
                </span>
              </div>

              <div className="space-y-3">
                {insights.slice(0, 5).map(insight => (
                  <div
                    key={insight.id}
                    className={`border-2 rounded-lg p-4 ${getPriorityColor(insight.priority)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="px-2 py-0.5 bg-white rounded text-xs font-semibold uppercase">
                            {insight.insight_type}
                          </span>
                          <span className="text-xs text-gray-600">
                            {(insight.confidence_score * 100).toFixed(0)}% confidence
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                        <p className="text-sm text-gray-700 mt-1">{insight.description}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {insight.action_items.map((item: any, idx: number) => {
                        const Icon = getActionIcon(item.icon);
                        return (
                          <button
                            key={idx}
                            onClick={() => actionInsight(insight.id)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-white hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors border border-gray-300"
                          >
                            <Icon className="h-3 w-3" />
                            <span>{item.action}</span>
                            {item.count && (
                              <span className="ml-1 px-1.5 py-0.5 bg-gray-200 rounded text-xs">
                                {item.count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {insights.length === 0 && (
                <div className="text-center py-8">
                  <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No active insights</p>
                  <p className="text-sm text-gray-500">AI will generate recommendations based on your activity</p>
                </div>
              )}
            </div>

            {/* Funnel Visualization */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Sales Funnel</h2>
                <button className="text-xs text-blue-600 hover:text-blue-700">View Details</button>
              </div>

              <div className="space-y-3">
                {funnelStages.map((stage, index) => {
                  const prospects = 100 - (index * 15);
                  const width = (prospects / 100) * 100;

                  return (
                    <div key={stage.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-700">{stage.name}</span>
                          {stage.is_bottleneck && (
                            <AlertCircle className="h-4 w-4 text-red-600" title="Bottleneck" />
                          )}
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{prospects}</span>
                      </div>

                      <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="absolute h-full rounded-full transition-all"
                          style={{
                            width: `${width}%`,
                            backgroundColor: stage.color
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                        <span>Avg: {stage.avg_time_in_stage_days} days</span>
                        <span>Conv: {stage.target_conversion_rate}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Active Alerts */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-amber-600" />
                <h2 className="text-lg font-semibold text-gray-900">Active Alert Rules</h2>
              </div>
              <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                {alertRules.length} Rules
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {alertRules.map(rule => (
                <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
                      Active
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{rule.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Enrichment Actions */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="h-5 w-5 text-purple-600" />
                  <h2 className="text-lg font-semibold text-gray-900">One-Click Enrichment</h2>
                </div>
                <p className="text-sm text-gray-600">
                  Enrich prospect data instantly from prospects, sequences, or discovery results
                </p>
              </div>
              <button
                onClick={() => enrichEntity('prospect', 'sample-id')}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                Enrich Selected
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
