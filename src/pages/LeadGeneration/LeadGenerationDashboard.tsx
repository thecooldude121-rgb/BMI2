import React, { useState } from 'react';
import {
  Search, Target, Users, Building, DollarSign, Mail, Calendar,
  CheckSquare, TrendingUp, Zap, Filter, Plus, BarChart3,
  Activity, Clock, Star, Globe, ArrowUpRight, Eye, Play,
  Pause, Settings, Download, RefreshCw, Bell, Sparkles,
  ChevronLeft, ChevronRight, Menu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LeadGenerationDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('30');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Mock metrics - in real app, these would come from API
  const metrics = {
    totalProspects: 15420,
    totalCompanies: 3280,
    activeSequences: 12,
    emailsSent: 2840,
    emailsOpened: 1136,
    emailsReplied: 142,
    meetingsBooked: 28,
    dealsCreated: 15,
    revenue: 485000,
    openRate: 40.0,
    replyRate: 5.0,
    meetingBookedRate: 1.0
  };

  const recentActivity = [
    { type: 'prospect', action: 'New prospect added', details: 'John Smith from TechCorp', time: '2 min ago', icon: Users },
    { type: 'email', action: 'Email opened', details: 'Sarah Johnson opened "Partnership Opportunity"', time: '5 min ago', icon: Mail },
    { type: 'meeting', action: 'Meeting booked', details: 'Demo call with FinanceFirst', time: '12 min ago', icon: Calendar },
    { type: 'deal', action: 'Deal created', details: '$75K deal from Healthcare Plus', time: '1 hour ago', icon: DollarSign },
    { type: 'sequence', action: 'Sequence completed', details: 'Mike Chen completed "Enterprise Outreach"', time: '2 hours ago', icon: Zap }
  ];

  const topPerformers = [
    { name: 'Sarah Johnson', role: 'Senior SDR', emails: 145, replies: 12, meetings: 8, deals: 3, avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1' },
    { name: 'Mike Chen', role: 'Account Executive', emails: 98, replies: 15, meetings: 12, deals: 5, avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1' },
    { name: 'Emily Rodriguez', role: 'SDR', emails: 167, replies: 8, meetings: 6, deals: 2, avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1' }
  ];

  const activeSequences = [
    { id: '1', name: 'Enterprise Outreach', enrolled: 245, active: 189, replied: 23, openRate: 42.5, replyRate: 9.4 },
    { id: '2', name: 'Healthcare Decision Makers', enrolled: 156, active: 134, replied: 18, openRate: 38.2, replyRate: 11.5 },
    { id: '3', name: 'Tech Startup Founders', enrolled: 89, active: 67, replied: 12, openRate: 45.1, replyRate: 13.5 }
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar Navigation */}
      <div className={`bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Lead Gen</h2>
                  <p className="text-xs text-gray-600">Modules</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-2">
          {[
            { name: 'Discovery', path: '/lead-generation/discovery', icon: Search, color: 'text-blue-600', bg: 'bg-blue-100' },
            { name: 'Prospects', path: '/lead-generation/prospects', icon: Users, color: 'text-green-600', bg: 'bg-green-100' },
            { name: 'Companies', path: '/lead-generation/companies', icon: Building, color: 'text-purple-600', bg: 'bg-purple-100' },
            { name: 'Sequences', path: '/lead-generation/sequences', icon: Zap, color: 'text-orange-600', bg: 'bg-orange-100' },
            { name: 'Lists', path: '/lead-generation/lists', icon: CheckSquare, color: 'text-indigo-600', bg: 'bg-indigo-100' },
            { name: 'Emails', path: '/lead-generation/emails', icon: Mail, color: 'text-red-600', bg: 'bg-red-100' },
            { name: 'Meetings', path: '/lead-generation/meetings', icon: Calendar, color: 'text-pink-600', bg: 'bg-pink-100' },
            { name: 'Tasks', path: '/lead-generation/tasks', icon: CheckSquare, color: 'text-yellow-600', bg: 'bg-yellow-100' },
            { name: 'Analytics', path: '/lead-generation/analytics', icon: BarChart3, color: 'text-cyan-600', bg: 'bg-cyan-100' },
            { name: 'Enrichment', path: '/lead-generation/enrichment', icon: Sparkles, color: 'text-violet-600', bg: 'bg-violet-100' },
            { name: 'Settings', path: '/lead-generation/settings', icon: Settings, color: 'text-gray-600', bg: 'bg-gray-100' }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = window.location.pathname === item.path;
            
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? `${item.bg} ${item.color} shadow-sm border border-opacity-20`
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                } ${sidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <Icon className={`${sidebarCollapsed ? 'h-6 w-6' : 'h-5 w-5'} ${sidebarCollapsed ? '' : 'mr-3'} ${isActive ? item.color : ''}`} />
                {!sidebarCollapsed && <span>{item.name}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Lead Generation</h1>
                  <p className="text-gray-600 text-lg">AI-powered prospecting and outreach platform</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
                
                <button
                  onClick={() => navigate('/lead-generation/discovery')}
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
                >
                 <Plus className="h-5 w-5 mr-3" />
                  Find Prospects
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-8 py-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {renderMetricCard('Total Prospects', metrics.totalProspects.toLocaleString(), Users, '+12%', 'blue')}
            {renderMetricCard('Companies', metrics.totalCompanies.toLocaleString(), Building, '+8%', 'green')}
            {renderMetricCard('Pipeline Value', `$${(metrics.revenue / 1000).toFixed(0)}K`, DollarSign, '+15%', 'purple')}
            {renderMetricCard('Reply Rate', `${metrics.replyRate}%`, TrendingUp, '+0.8%', 'orange')}
          </div>

          {/* Performance Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Email Performance */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Email Performance</h3>
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Emails Sent</span>
                  <span className="text-lg font-bold text-gray-900">{metrics.emailsSent.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Open Rate</span>
                  <span className="text-lg font-bold text-blue-600">{metrics.openRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Reply Rate</span>
                  <span className="text-lg font-bold text-green-600">{metrics.replyRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Meeting Booked</span>
                  <span className="text-lg font-bold text-purple-600">{metrics.meetingBookedRate}%</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{metrics.emailsOpened}</p>
                    <p className="text-xs text-gray-500">Opens</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{metrics.emailsReplied}</p>
                    <p className="text-xs text-gray-500">Replies</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">{metrics.meetingsBooked}</p>
                    <p className="text-xs text-gray-500">Meetings</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Sequences */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Active Sequences</h3>
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-orange-600" />
                  <span className="text-sm text-gray-600">{metrics.activeSequences} running</span>
                </div>
              </div>
              
              <div className="space-y-4">
                {activeSequences.map((sequence) => (
                  <div key={sequence.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{sequence.name}</h4>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600">Active</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-gray-500">Enrolled</p>
                        <p className="font-medium text-gray-900">{sequence.enrolled}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Open Rate</p>
                        <p className="font-medium text-blue-600">{sequence.openRate}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Reply Rate</p>
                        <p className="font-medium text-green-600">{sequence.replyRate}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                onClick={() => navigate('/lead-generation/sequences')}
                className="w-full mt-4 text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All Sequences
              </button>
            </div>

            {/* Top Performers */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Top Performers</h3>
                <Star className="h-5 w-5 text-yellow-500" />
              </div>
              
              <div className="space-y-4">
                {topPerformers.map((performer, index) => (
                  <div key={performer.name} className="flex items-center space-x-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-gray-100 text-gray-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {index + 1}
                      </div>
                      <img
                        src={performer.avatar}
                        alt={performer.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{performer.name}</p>
                      <p className="text-xs text-gray-500">{performer.role}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">{performer.deals} deals</p>
                      <p className="text-xs text-gray-500">{performer.replies} replies</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <button
              onClick={() => navigate('/lead-generation/discovery')}
              className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl text-left hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-200 rounded-lg group-hover:bg-blue-300 transition-colors">
                  <Search className="h-6 w-6 text-blue-700" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Find Prospects</h3>
              <p className="text-sm text-gray-600">Search and discover new prospects with AI-powered filters</p>
            </button>

            <button
              onClick={() => navigate('/lead-generation/sequences')}
              className="p-6 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl text-left hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-200 rounded-lg group-hover:bg-orange-300 transition-colors">
                  <Zap className="h-6 w-6 text-orange-700" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Sequence</h3>
              <p className="text-sm text-gray-600">Build automated outreach campaigns with email sequences</p>
            </button>

            <button
              onClick={() => navigate('/lead-generation/enrichment')}
              className="p-6 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl text-left hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-200 rounded-lg group-hover:bg-purple-300 transition-colors">
                  <Sparkles className="h-6 w-6 text-purple-700" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Enrich Data</h3>
              <p className="text-sm text-gray-600">Enhance prospect data with AI-powered enrichment</p>
            </button>

            <button
              onClick={() => navigate('/lead-generation/analytics')}
              className="p-6 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl text-left hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-200 rounded-lg group-hover:bg-green-300 transition-colors">
                  <BarChart3 className="h-6 w-6 text-green-700" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">View Analytics</h3>
              <p className="text-sm text-gray-600">Analyze performance and optimize your outreach</p>
            </button>
          </div>

          {/* Recent Activity & AI Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <Activity className="h-5 w-5 text-gray-400" />
              </div>
              
              <div className="space-y-4">
                {recentActivity.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Icon className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                        <p className="text-sm text-gray-600">{activity.details}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <button className="w-full mt-4 text-center text-sm text-blue-600 hover:text-blue-800 font-medium">
                View All Activity
              </button>
            </div>

            {/* AI Insights */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-white rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900">High-Intent Prospects</span>
                  </div>
                  <p className="text-sm text-gray-600">47 prospects showing high engagement signals. Consider prioritizing outreach.</p>
                </div>
                
                <div className="p-4 bg-white rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900">Sequence Optimization</span>
                  </div>
                  <p className="text-sm text-gray-600">Your "Enterprise Outreach" sequence could improve with A/B testing the subject line.</p>
                </div>
                
                <div className="p-4 bg-white rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900">Best Time to Send</span>
                  </div>
                  <p className="text-sm text-gray-600">Tuesday 10 AM shows 23% higher open rates for your target audience.</p>
                </div>
              </div>
              
              <button className="w-full mt-4 flex items-center justify-center p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                <Sparkles className="h-4 w-4 mr-2" />
                View All Insights
              </button>
            </div>
          </div>

          {/* Today's Tasks */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Today's Tasks</h3>
              <div className="flex items-center space-x-2">
                <CheckSquare className="h-5 w-5 text-green-600" />
                <span className="text-sm text-gray-600">8 of 12 completed</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">24</p>
                <p className="text-sm text-gray-600">Calls to Make</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">156</p>
                <p className="text-sm text-gray-600">Emails to Send</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">8</p>
                <p className="text-sm text-gray-600">Follow-ups Due</p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => navigate('/lead-generation/tasks')}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                View All Tasks
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadGenerationDashboard;