import React, { useState } from 'react';
import {
  BarChart3, TrendingUp, Users, Mail, Calendar, Target,
  Download, Filter, RefreshCw, Eye, Settings, Clock,
  DollarSign, Zap, Star, Globe, ArrowUpRight, Activity, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnalyticsMetrics, PerformanceMetrics } from '../../types/leadGeneration';

const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('30');
  const [selectedMetric, setSelectedMetric] = useState('overview');

  // Mock analytics data
  const mockMetrics: AnalyticsMetrics = {
    totalProspects: 15420,
    totalCompanies: 3280,
    totalDeals: 156,
    totalRevenue: 2450000,
    emailsSent: 8940,
    emailsOpened: 3576,
    emailsClicked: 715,
    emailsReplied: 447,
    leadsGenerated: 1240,
    meetingsBooked: 89,
    dealsCreated: 34,
    dealsClosed: 12,
    openRate: 40.0,
    clickRate: 8.0,
    replyRate: 5.0,
    meetingBookedRate: 1.0,
    dealConversionRate: 2.7,
    period: 'Last 30 days',
    startDate: '2024-01-01',
    endDate: '2024-01-30'
  };

  const mockPerformance: PerformanceMetrics[] = [
    {
      userId: 'user-1',
      userName: 'Sarah Johnson',
      emailsSent: 245,
      callsMade: 89,
      meetingsBooked: 12,
      leadsGenerated: 67,
      dealsCreated: 8,
      revenue: 485000,
      responseRate: 12.5,
      meetingShowRate: 85.0,
      dealConversionRate: 11.9,
      avgDealSize: 60625,
      avgSalesCycle: 45,
      rank: 1,
      totalUsers: 8,
      period: 'Last 30 days'
    },
    {
      userId: 'user-2',
      userName: 'Mike Chen',
      emailsSent: 198,
      callsMade: 76,
      meetingsBooked: 9,
      leadsGenerated: 52,
      dealsCreated: 6,
      revenue: 320000,
      responseRate: 10.1,
      meetingShowRate: 77.8,
      dealConversionRate: 11.5,
      avgDealSize: 53333,
      avgSalesCycle: 52,
      rank: 2,
      totalUsers: 8,
      period: 'Last 30 days'
    }
  ];

  const metrics = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'email', name: 'Email Performance', icon: Mail },
    { id: 'pipeline', name: 'Pipeline Analytics', icon: Target },
    { id: 'team', name: 'Team Performance', icon: Users },
    { id: 'conversion', name: 'Conversion Funnel', icon: TrendingUp }
  ];

  const renderMetricCard = (title: string, value: string | number, icon: React.ElementType, change?: string, color = 'blue') => {
    const Icon = icon;
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600 text-blue-100',
      green: 'from-green-500 to-green-600 text-green-100',
      purple: 'from-purple-500 to-purple-600 text-purple-100',
      orange: 'from-orange-500 to-orange-600 text-orange-100',
      red: 'from-red-500 to-red-600 text-red-100'
    };

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
            {change && (
              <p className="text-sm text-green-600 mt-1 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                {change}
              </p>
            )}
          </div>
          <div className={`p-4 rounded-xl bg-gradient-to-r ${colorClasses[color as keyof typeof colorClasses]} shadow-lg`}>
            <Icon className="h-8 w-8" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Go back"
              >
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </button>
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
                <p className="text-gray-600 text-lg">Performance insights and metrics</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
              
              <button className="flex items-center px-4 py-3 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm bg-white">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
              
              <button className="flex items-center px-4 py-3 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm bg-white">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
              
              <button className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm hover:from-blue-700 hover:to-purple-700 transition-all shadow-md">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </button>
            </div>
          </div>

          {/* Metric Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {metrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <button
                    key={metric.id}
                    onClick={() => setSelectedMetric(metric.id)}
                    className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                      selectedMetric === metric.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="mr-2 h-5 w-5" />
                    {metric.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-8">
        {selectedMetric === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {renderMetricCard('Total Prospects', mockMetrics.totalProspects.toLocaleString(), Users, '+12%', 'blue')}
              {renderMetricCard('Companies', mockMetrics.totalCompanies.toLocaleString(), Globe, '+8%', 'green')}
              {renderMetricCard('Pipeline Value', `$${(mockMetrics.totalRevenue / 1000).toFixed(0)}K`, DollarSign, '+15%', 'purple')}
              {renderMetricCard('Reply Rate', `${mockMetrics.replyRate}%`, TrendingUp, '+0.8%', 'orange')}
            </div>

            {/* Performance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Email Performance */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Email Performance</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Emails Sent</span>
                    <span className="text-lg font-bold text-gray-900">{mockMetrics.emailsSent.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Open Rate</span>
                    <span className="text-lg font-bold text-blue-600">{mockMetrics.openRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Click Rate</span>
                    <span className="text-lg font-bold text-green-600">{mockMetrics.clickRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Reply Rate</span>
                    <span className="text-lg font-bold text-purple-600">{mockMetrics.replyRate}%</span>
                  </div>
                </div>
              </div>

              {/* Conversion Funnel */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Conversion Funnel</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Prospects</span>
                    <span className="text-lg font-bold text-gray-900">{mockMetrics.totalProspects.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Leads Generated</span>
                    <span className="text-lg font-bold text-blue-600">{mockMetrics.leadsGenerated.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Meetings Booked</span>
                    <span className="text-lg font-bold text-green-600">{mockMetrics.meetingsBooked}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Deals Closed</span>
                    <span className="text-lg font-bold text-purple-600">{mockMetrics.dealsClosed}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedMetric === 'team' && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Team Performance</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Team Member
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Emails Sent
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Response Rate
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Meetings Booked
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Deals Created
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Rank
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {mockPerformance.map((member) => (
                      <tr key={member.userId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {member.userName.charAt(0)}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{member.userName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{member.emailsSent}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">{member.responseRate}%</span>
                            <div className="w-12 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${member.responseRate}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{member.meetingsBooked}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{member.dealsCreated}</td>
                        <td className="px-6 py-4 text-sm font-medium text-green-600">
                          ${(member.revenue / 1000).toFixed(0)}K
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold text-gray-900">#{member.rank}</span>
                            {member.rank === 1 && <Star className="h-4 w-4 text-yellow-500" />}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {selectedMetric === 'email' && (
          <div className="space-y-8">
            {/* Email Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {renderMetricCard('Emails Sent', mockMetrics.emailsSent.toLocaleString(), Mail, '+15%', 'blue')}
              {renderMetricCard('Open Rate', `${mockMetrics.openRate}%`, Eye, '+2.1%', 'green')}
              {renderMetricCard('Click Rate', `${mockMetrics.clickRate}%`, Target, '+0.5%', 'purple')}
              {renderMetricCard('Reply Rate', `${mockMetrics.replyRate}%`, TrendingUp, '+0.8%', 'orange')}
            </div>

            {/* Email Performance Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Email Performance Trends</h3>
              <div className="text-center py-16 text-gray-500">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>Email performance charts will be implemented here</p>
              </div>
            </div>
          </div>
        )}

        {selectedMetric === 'pipeline' && (
          <div className="space-y-8">
            {/* Pipeline Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {renderMetricCard('Total Deals', mockMetrics.totalDeals.toString(), Target, '+18%', 'blue')}
              {renderMetricCard('Pipeline Value', `$${(mockMetrics.totalRevenue / 1000).toFixed(0)}K`, DollarSign, '+22%', 'green')}
              {renderMetricCard('Avg Deal Size', `$${(mockMetrics.totalRevenue / mockMetrics.totalDeals / 1000).toFixed(0)}K`, Star, '+5%', 'purple')}
              {renderMetricCard('Conversion Rate', `${mockMetrics.dealConversionRate}%`, TrendingUp, '+1.2%', 'orange')}
            </div>

            {/* Pipeline Analysis */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Pipeline Analysis</h3>
              <div className="text-center py-16 text-gray-500">
                <Target className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>Pipeline analysis charts will be implemented here</p>
              </div>
            </div>
          </div>
        )}

        {selectedMetric === 'conversion' && (
          <div className="space-y-8">
            {/* Conversion Funnel */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Conversion Funnel</h3>
              <div className="space-y-4">
                {[
                  { stage: 'Prospects', count: mockMetrics.totalProspects, percentage: 100 },
                  { stage: 'Contacted', count: mockMetrics.emailsSent, percentage: 58 },
                  { stage: 'Responded', count: mockMetrics.emailsReplied, percentage: 5 },
                  { stage: 'Meetings Booked', count: mockMetrics.meetingsBooked, percentage: 1 },
                  { stage: 'Deals Created', count: mockMetrics.dealsCreated, percentage: 0.4 },
                  { stage: 'Deals Closed', count: mockMetrics.dealsClosed, percentage: 0.1 }
                ].map((stage, index) => (
                  <div key={stage.stage} className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{stage.stage}</span>
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-900">{stage.count.toLocaleString()}</span>
                        <span className="text-xs text-gray-500 ml-2">({stage.percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          index === 0 ? 'bg-blue-500' :
                          index === 1 ? 'bg-green-500' :
                          index === 2 ? 'bg-purple-500' :
                          index === 3 ? 'bg-orange-500' :
                          index === 4 ? 'bg-red-500' : 'bg-gray-500'
                        }`}
                        style={{ width: `${stage.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;