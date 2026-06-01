import React, { useState } from 'react';
import {
  BarChart, LineChart, PieChart, TrendingUp, Target, Users, DollarSign,
  Activity, Download, Upload, Plus, Settings, Eye, Edit, Trash2, Copy,
  Share2, Filter, Search, Calendar, RefreshCw, Play, Save, X, Zap,
  AlertCircle, CheckCircle, Clock, Globe, MapPin, Smartphone, Code
} from 'lucide-react';

interface Dashboard {
  id: string;
  name: string;
  description: string;
  widgets: number;
  shared: boolean;
  lastUpdated: string;
  views: number;
}

interface Report {
  id: string;
  name: string;
  type: 'tabular' | 'summary' | 'matrix' | 'chart';
  category: string;
  schedule?: string;
  lastRun: string;
  recipients?: number;
}

interface KPI {
  id: string;
  name: string;
  value: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  category: string;
}

const AnalyticsReporting: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboards' | 'reports' | 'insights' | 'kpis'>('dashboards');

  const [dashboards] = useState<Dashboard[]>([
    {
      id: '1',
      name: 'Sales Performance Dashboard',
      description: 'Real-time sales metrics, pipeline analysis, and team performance',
      widgets: 12,
      shared: true,
      lastUpdated: '2024-01-21T15:30:00Z',
      views: 1247
    },
    {
      id: '2',
      name: 'Lead Generation Analytics',
      description: 'Lead sources, conversion rates, and marketing ROI',
      widgets: 8,
      shared: true,
      lastUpdated: '2024-01-21T14:00:00Z',
      views: 856
    },
    {
      id: '3',
      name: 'Executive Summary',
      description: 'High-level KPIs and business health indicators',
      widgets: 6,
      shared: false,
      lastUpdated: '2024-01-21T09:00:00Z',
      views: 423
    },
    {
      id: '4',
      name: 'Customer Success Metrics',
      description: 'Retention rates, NPS scores, and customer satisfaction',
      widgets: 10,
      shared: true,
      lastUpdated: '2024-01-20T16:30:00Z',
      views: 634
    }
  ]);

  const [reports] = useState<Report[]>([
    {
      id: '1',
      name: 'Monthly Sales Report',
      type: 'summary',
      category: 'Sales',
      schedule: 'Monthly on 1st',
      lastRun: '2024-01-01T00:00:00Z',
      recipients: 25
    },
    {
      id: '2',
      name: 'Lead Source Analysis',
      type: 'chart',
      category: 'Marketing',
      schedule: 'Weekly on Monday',
      lastRun: '2024-01-15T00:00:00Z',
      recipients: 12
    },
    {
      id: '3',
      name: 'Pipeline Forecast',
      type: 'tabular',
      category: 'Sales',
      schedule: 'Daily at 9:00 AM',
      lastRun: '2024-01-21T09:00:00Z',
      recipients: 8
    },
    {
      id: '4',
      name: 'Team Activity Report',
      type: 'summary',
      category: 'Management',
      lastRun: '2024-01-20T17:00:00Z'
    }
  ]);

  const [kpis] = useState<KPI[]>([
    {
      id: '1',
      name: 'Monthly Revenue',
      value: 485000,
      target: 500000,
      trend: 'up',
      changePercent: 12.5,
      category: 'Sales'
    },
    {
      id: '2',
      name: 'Lead Conversion Rate',
      value: 23.5,
      target: 25,
      trend: 'up',
      changePercent: 3.2,
      category: 'Marketing'
    },
    {
      id: '3',
      name: 'Average Deal Size',
      value: 32500,
      target: 35000,
      trend: 'stable',
      changePercent: 0.8,
      category: 'Sales'
    },
    {
      id: '4',
      name: 'Customer Satisfaction',
      value: 4.6,
      target: 4.5,
      trend: 'up',
      changePercent: 5.1,
      category: 'Service'
    },
    {
      id: '5',
      name: 'Sales Cycle (days)',
      value: 42,
      target: 35,
      trend: 'down',
      changePercent: -8.3,
      category: 'Sales'
    },
    {
      id: '6',
      name: 'Win Rate',
      value: 32,
      target: 35,
      trend: 'up',
      changePercent: 6.7,
      category: 'Sales'
    }
  ]);

  const tabs = [
    { id: 'dashboards', label: 'Dashboards', icon: BarChart },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'insights', label: 'AI Insights', icon: Zap },
    { id: 'kpis', label: 'KPIs', icon: Target }
  ];

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
    return `$${num}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <BarChart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>
              <p className="text-gray-600 mt-1">Business intelligence and reporting platform</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>Import</span>
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Create Dashboard</span>
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <BarChart className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">{dashboards.length}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Active Dashboards</div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <FileText className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{reports.length}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Scheduled Reports</div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <Zap className="h-5 w-5 text-purple-600" />
              <span className="text-2xl font-bold text-purple-600">24</span>
            </div>
            <div className="text-sm font-medium text-gray-700">AI Insights</div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-orange-600" />
              <span className="text-2xl font-bold text-orange-600">{kpis.length}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Tracked KPIs</div>
          </div>

          <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
            <div className="flex items-center justify-between mb-2">
              <Eye className="h-5 w-5 text-teal-600" />
              <span className="text-2xl font-bold text-teal-600">
                {dashboards.reduce((sum, d) => sum + d.views, 0)}
              </span>
            </div>
            <div className="text-sm font-medium text-gray-700">Total Views</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex space-x-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 border-t-2 border-x border-blue-600 -mb-px'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Dashboards Tab */}
        {activeTab === 'dashboards' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Interactive Dashboards</h2>
              <p className="text-gray-600">Real-time data visualization with customizable widgets</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dashboards.map(dashboard => (
                <div key={dashboard.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{dashboard.name}</h3>
                        {dashboard.shared && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                            Shared
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{dashboard.description}</p>

                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Widgets:</span>
                          <span className="ml-2 font-semibold text-gray-900">{dashboard.widgets}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Views:</span>
                          <span className="ml-2 font-semibold text-blue-600">{dashboard.views}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Updated:</span>
                          <span className="ml-2 text-gray-900">
                            {new Date(dashboard.lastUpdated).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-200">
                    <button className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      Open Dashboard
                    </button>
                    <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                      <Share2 className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Dashboard Builder Preview */}
            <div className="mt-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-8 border-2 border-dashed border-blue-300">
              <div className="text-center">
                <BarChart className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h4 className="text-xl font-bold text-gray-900 mb-2">Drag-and-Drop Dashboard Builder</h4>
                <p className="text-gray-600 mb-6">
                  Create interactive dashboards with real-time charts, KPI cards, and custom widgets
                </p>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <BarChart className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="font-semibold text-gray-900 text-sm">Bar Charts</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <LineChart className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="font-semibold text-gray-900 text-sm">Line Charts</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <PieChart className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="font-semibold text-gray-900 text-sm">Pie Charts</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <Target className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <div className="font-semibold text-gray-900 text-sm">KPI Cards</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Automated Reports</h2>
                  <p className="text-gray-600">Schedule and distribute custom reports</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Create Report</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {reports.map(report => (
                <div key={report.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{report.name}</h3>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold capitalize">
                          {report.type}
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                          {report.category}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        {report.schedule && (
                          <div>
                            <span className="text-gray-600">Schedule:</span>
                            <span className="ml-2 font-semibold text-gray-900">{report.schedule}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-600">Last Run:</span>
                          <span className="ml-2 text-gray-900">
                            {new Date(report.lastRun).toLocaleDateString()}
                          </span>
                        </div>
                        {report.recipients && (
                          <div>
                            <span className="text-gray-600">Recipients:</span>
                            <span className="ml-2 font-semibold text-blue-600">{report.recipients}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Run Now">
                        <Play className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Download">
                        <Download className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors" title="Edit">
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Insights Tab */}
        {activeTab === 'insights' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">AI-Powered Insights</h2>
              <p className="text-gray-600">Machine learning recommendations and predictive analytics</p>
            </div>

            <div className="space-y-4">
              <div className="border border-blue-200 rounded-lg p-6 bg-blue-50">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-gray-900">Revenue Forecast</h3>
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                        95% Confidence
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">
                      Based on current pipeline and historical trends, you're on track to exceed your Q1 target by 12%.
                      Consider accelerating deals in the "Negotiation" stage to maximize revenue.
                    </p>
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      View Detailed Analysis →
                    </button>
                  </div>
                </div>
              </div>

              <div className="border border-orange-200 rounded-lg p-6 bg-orange-50">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-gray-900">Churn Risk Alert</h3>
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
                        Action Required
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">
                      15 customers show early signs of churn based on decreased engagement and support ticket patterns.
                      Proactive outreach recommended within the next 7 days.
                    </p>
                    <button className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                      View At-Risk Customers →
                    </button>
                  </div>
                </div>
              </div>

              <div className="border border-purple-200 rounded-lg p-6 bg-purple-50">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-gray-900">Lead Scoring Optimization</h3>
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                        Insight
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">
                      ML analysis suggests adjusting lead scoring weights: increase company size factor by 15% and
                      decrease job title importance by 10% to improve conversion prediction accuracy.
                    </p>
                    <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                      Apply Recommendations →
                    </button>
                  </div>
                </div>
              </div>

              <div className="border border-green-200 rounded-lg p-6 bg-green-50">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-gray-900">Successful Campaign Pattern</h3>
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                        Opportunity
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">
                      Email campaigns sent on Tuesday mornings show 34% higher open rates and 28% better conversion
                      compared to other time slots. Consider scheduling future campaigns accordingly.
                    </p>
                    <button className="text-sm text-green-600 hover:text-green-700 font-medium">
                      Schedule Campaigns →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* KPIs Tab */}
        {activeTab === 'kpis' && (
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Key Performance Indicators</h2>
                  <p className="text-gray-600">Track and monitor critical business metrics</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Create KPI</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {kpis.map(kpi => {
                const percentage = (kpi.value / kpi.target) * 100;
                const isOnTarget = percentage >= 90;

                return (
                  <div key={kpi.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-xs font-semibold text-gray-600 uppercase mb-1">{kpi.category}</div>
                        <h3 className="font-semibold text-gray-900">{kpi.name}</h3>
                      </div>
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${
                        kpi.trend === 'up' ? 'bg-green-100 text-green-800' :
                        kpi.trend === 'down' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        <TrendingUp className={`h-3 w-3 ${kpi.trend === 'down' ? 'transform rotate-180' : ''}`} />
                        <span className="text-xs font-semibold">{Math.abs(kpi.changePercent)}%</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="text-3xl font-bold text-gray-900 mb-1">
                        {kpi.name.includes('Rate') || kpi.name.includes('Satisfaction')
                          ? `${kpi.value}${kpi.name.includes('Rate') ? '%' : '/5'}`
                          : kpi.name.includes('days')
                          ? `${kpi.value} days`
                          : formatNumber(kpi.value)
                        }
                      </div>
                      <div className="text-sm text-gray-600">
                        Target: {kpi.name.includes('Rate') || kpi.name.includes('Satisfaction')
                          ? `${kpi.target}${kpi.name.includes('Rate') ? '%' : '/5'}`
                          : kpi.name.includes('days')
                          ? `${kpi.target} days`
                          : formatNumber(kpi.target)
                        }
                      </div>
                    </div>

                    <div className="mb-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600">Progress</span>
                        <span className={`font-semibold ${isOnTarget ? 'text-green-600' : 'text-orange-600'}`}>
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${isOnTarget ? 'bg-green-600' : 'bg-orange-600'}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const FileText = LineChart;

export default AnalyticsReporting;
