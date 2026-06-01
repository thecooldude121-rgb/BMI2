import React, { useState } from 'react';
import {
  BarChart3, TrendingUp, TrendingDown, Users, Mail, Phone, Calendar,
  Target, DollarSign, Clock, Award, Zap, Download, RefreshCw, Filter,
  Settings, Share2, Eye, Plus, Maximize2, Activity, PieChart
} from 'lucide-react';

interface MetricCard {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down';
  target?: number;
  icon: React.ElementType;
  color: string;
}

interface FunnelStage {
  name: string;
  count: number;
  percentage: number;
  conversion: number;
}

interface TeamMember {
  name: string;
  deals: number;
  revenue: number;
  replyRate: number;
  meetings: number;
  winRate: number;
}

export const EnhancedAnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [segment, setSegment] = useState('all');
  const [darkMode, setDarkMode] = useState(false);

  const emailMetrics: MetricCard[] = [
    { label: 'Open Rate', value: '42.5%', change: 5.2, trend: 'up', target: 50, icon: Mail, color: 'blue' },
    { label: 'Click Rate', value: '12.3%', change: 2.1, trend: 'up', target: 15, icon: Target, color: 'green' },
    { label: 'Reply Rate', value: '8.7%', change: -1.3, trend: 'down', target: 10, icon: TrendingUp, color: 'purple' },
    { label: 'Bounce Rate', value: '2.1%', change: -0.5, trend: 'up', target: 2, icon: TrendingDown, color: 'red' }
  ];

  const sequenceMetrics: MetricCard[] = [
    { label: 'Enrollment', value: '1,247', change: 12.5, trend: 'up', icon: Users, color: 'blue' },
    { label: 'Completion', value: '65.4%', change: 3.2, trend: 'up', target: 70, icon: Award, color: 'green' },
    { label: 'Conv to Meeting', value: '18.2%', change: 1.8, trend: 'up', target: 20, icon: Calendar, color: 'purple' },
    { label: 'Conv to Deal', value: '8.5%', change: 0.9, trend: 'up', target: 10, icon: DollarSign, color: 'amber' }
  ];

  const salesMetrics: MetricCard[] = [
    { label: 'Deals Closed', value: '95', change: 8.3, trend: 'up', icon: Award, color: 'green' },
    { label: 'Win Rate', value: '28.5%', change: -1.2, trend: 'down', target: 30, icon: Target, color: 'blue' },
    { label: 'Avg Deal Size', value: '$45K', change: 5.7, trend: 'up', target: 50000, icon: DollarSign, color: 'purple' },
    { label: 'Sales Cycle', value: '42d', change: -3.5, trend: 'up', target: 35, icon: Clock, color: 'amber' }
  ];

  const funnelStages: FunnelStage[] = [
    { name: 'Prospects', count: 1000, percentage: 100, conversion: 100 },
    { name: 'Contacted', count: 850, percentage: 85, conversion: 85 },
    { name: 'Replied', count: 425, percentage: 42.5, conversion: 50 },
    { name: 'Meetings', count: 212, percentage: 21.2, conversion: 49.9 },
    { name: 'Deals', count: 85, percentage: 8.5, conversion: 40.1 }
  ];

  const topPerformers: TeamMember[] = [
    { name: 'Michael Chen', deals: 15, revenue: 675000, replyRate: 38.2, meetings: 52, winRate: 31.2 },
    { name: 'Sarah Johnson', deals: 12, revenue: 540000, replyRate: 32.5, meetings: 45, winRate: 28.5 },
    { name: 'Emily Davis', deals: 28, revenue: 280000, replyRate: 42.1, meetings: 78, winRate: 35.0 },
    { name: 'Lisa Wong', deals: 18, revenue: 450000, replyRate: 36.5, meetings: 58, winRate: 29.8 },
    { name: 'David Kim', deals: 22, revenue: 220000, replyRate: 35.8, meetings: 65, winRate: 30.5 }
  ];

  const MetricCardComponent = ({ metric }: { metric: MetricCard }) => {
    const Icon = metric.icon;
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      purple: 'bg-purple-50 text-purple-600',
      amber: 'bg-amber-50 text-amber-600',
      red: 'bg-red-50 text-red-600'
    };

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-lg transition-all">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-3 rounded-lg ${colorClasses[metric.color as keyof typeof colorClasses]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className={`flex items-center text-sm ${metric.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {metric.trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {Math.abs(metric.change)}%
          </div>
        </div>

        <div className="text-xs text-gray-600 mb-1">{metric.label}</div>
        <div className="text-2xl font-bold text-gray-900 mb-2">{metric.value}</div>

        {metric.target && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-600">Target</span>
              <span className="font-medium text-gray-900">{metric.target}{typeof metric.target === 'number' && metric.target > 100 ? '' : '%'}</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  parseFloat(String(metric.value)) >= metric.target ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min((parseFloat(String(metric.value)) / metric.target) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b p-4 sticky top-0 z-40`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <BarChart3 className={`h-6 w-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Analytics</h1>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              title="Toggle dark mode"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>

            <button className={`p-2 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
              <RefreshCw className={`h-5 w-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            </button>

            <button className={`flex items-center px-3 py-2 border rounded ${darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300'}`}>
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>

            <button className={`flex items-center px-3 py-2 border rounded ${darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300'}`}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>

            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Dashboard
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className={`px-3 py-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>

          <select
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
            className={`px-3 py-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
          >
            <option value="all">All Segments</option>
            <option value="enterprise">Enterprise</option>
            <option value="smb">SMB</option>
            <option value="tech">Technology</option>
          </select>

          <div className={`flex items-center space-x-2 px-3 py-2 border rounded ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
            <Activity className={`h-4 w-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Live</span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <Mail className="h-5 w-5 inline mr-2" />
              Email Performance
            </h2>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {emailMetrics.map((metric, idx) => (
              <MetricCardComponent key={idx} metric={metric} />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <Zap className="h-5 w-5 inline mr-2" />
              Sequence Performance
            </h2>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {sequenceMetrics.map((metric, idx) => (
              <MetricCardComponent key={idx} metric={metric} />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <DollarSign className="h-5 w-5 inline mr-2" />
              Sales Metrics
            </h2>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {salesMetrics.map((metric, idx) => (
              <MetricCardComponent key={idx} metric={metric} />
            ))}
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-6`}>
          <h2 className={`text-lg font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <Target className="h-5 w-5 inline mr-2" />
            Conversion Funnel
          </h2>

          <div className="space-y-3">
            {funnelStages.map((stage, idx) => (
              <div key={idx} className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {stage.name}
                    </span>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {stage.count.toLocaleString()} prospects
                    </span>
                  </div>
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                    {stage.percentage}%
                  </span>
                </div>

                <div className={`h-12 rounded-lg overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div
                    className={`h-full flex items-center px-4 text-white font-medium ${
                      idx === 0 ? 'bg-blue-600' :
                      idx === 1 ? 'bg-blue-500' :
                      idx === 2 ? 'bg-purple-500' :
                      idx === 3 ? 'bg-purple-600' : 'bg-green-600'
                    }`}
                    style={{ width: `${stage.percentage}%` }}
                  >
                    {stage.percentage > 20 && `${stage.count.toLocaleString()}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-6`}>
          <h2 className={`text-lg font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <Award className="h-5 w-5 inline mr-2" />
            Team Leaderboard
          </h2>

          <table className="w-full">
            <thead>
              <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <th className={`text-left py-3 px-4 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Rank</th>
                <th className={`text-left py-3 px-4 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Rep</th>
                <th className={`text-right py-3 px-4 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Deals</th>
                <th className={`text-right py-3 px-4 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Revenue</th>
                <th className={`text-right py-3 px-4 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Reply Rate</th>
                <th className={`text-right py-3 px-4 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Meetings</th>
                <th className={`text-right py-3 px-4 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Win Rate</th>
              </tr>
            </thead>
            <tbody>
              {topPerformers.map((member, idx) => (
                <tr key={idx} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <td className="py-3 px-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      idx === 0 ? 'bg-amber-100 text-amber-700' :
                      idx === 1 ? 'bg-gray-200 text-gray-700' :
                      idx === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {idx + 1}
                    </div>
                  </td>
                  <td className={`py-3 px-4 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{member.name}</td>
                  <td className={`py-3 px-4 text-right ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{member.deals}</td>
                  <td className={`py-3 px-4 text-right font-medium ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                    ${(member.revenue / 1000).toFixed(0)}K
                  </td>
                  <td className={`py-3 px-4 text-right ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{member.replyRate}%</td>
                  <td className={`py-3 px-4 text-right ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{member.meetings}</td>
                  <td className={`py-3 px-4 text-right ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{member.winRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAnalyticsPage;
