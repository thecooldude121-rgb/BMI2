import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Target, Mail, DollarSign, TrendingUp, TrendingDown, ArrowUp, ArrowDown,
  Clock, CheckCircle, Activity, BarChart3, Calendar, Phone, MessageSquare,
  Settings, Download, Moon, Sun, RefreshCw, Info, Pin, PinOff, Save, Eye,
  AlertCircle, Sparkles, Filter, ChevronRight, ExternalLink, Bot, Zap
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Goal {
  id: string;
  goal_name: string;
  target_value: number;
  current_value: number;
  progress_percentage: number;
  status: string;
  unit: string;
}

interface TeamPerf {
  team_name: string;
  metrics: any;
  rank: number;
}

export const EnhancedDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [teams, setTeams] = useState<TeamPerf[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [showTour, setShowTour] = useState(false);

  // Sample KPI data (would come from analytics_metrics)
  const [kpis, setKpis] = useState({
    total_prospects: { value: 1247, target: 1500, change: 12.3, trend: 'up' },
    conversion_rate: { value: 18.5, target: 20, change: -8.1, trend: 'down' },
    reply_rate: { value: 23.8, target: 25, change: -4.8, trend: 'down' },
    deals_closed: { value: 42, target: 50, change: 16.7, trend: 'up' },
    revenue: { value: 72500, target: 100000, change: 8.5, trend: 'up' },
    avg_response_time: { value: 4.2, target: 2, change: -12, trend: 'down' }
  });

  const [activities] = useState([
    { id: 1, type: 'email', lead: 'Sarah Johnson', company: 'TechCorp', action: 'Opened email', time: '5 minutes ago', icon: Mail, color: 'blue' },
    { id: 2, type: 'call', lead: 'Michael Chen', company: 'DataFlow', action: 'Completed call', time: '12 minutes ago', icon: Phone, color: 'green' },
    { id: 3, type: 'meeting', lead: 'Emily Rodriguez', company: 'Growth Partners', action: 'Scheduled meeting', time: '1 hour ago', icon: Calendar, color: 'purple' },
    { id: 4, type: 'reply', lead: 'David Kim', company: 'StartupXYZ', action: 'Replied to email', time: '2 hours ago', icon: MessageSquare, color: 'emerald' }
  ]);

  useEffect(() => {
    loadDashboard();
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, [timeRange]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [goalsRes, teamsRes] = await Promise.all([
        supabase.from('goals').select('*').order('progress_percentage', { ascending: false }),
        supabase.from('team_performance').select('*').order('rank')
      ]);

      setGoals(goalsRes.data || []);
      setTeams(teamsRes.data || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const exportPDF = () => {
    alert('PDF export would be implemented with jsPDF or similar library');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track': return 'text-green-700 bg-green-100';
      case 'at_risk': return 'text-amber-700 bg-amber-100';
      case 'behind': return 'text-red-700 bg-red-100';
      case 'achieved': return 'text-blue-700 bg-blue-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === 'dollars') return `$${value.toLocaleString()}`;
    if (unit === 'percentage') return `${value}%`;
    return value.toLocaleString();
  };

  const KPICard = ({
    title,
    value,
    target,
    change,
    trend,
    icon: Icon,
    color,
    onClick
  }: any) => {
    const isDark = darkMode;

    return (
      <div
        onClick={onClick}
        className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
          rounded-lg p-6 border-2 cursor-pointer hover:shadow-xl transition-all transform hover:scale-105
          group relative overflow-hidden`}
        role="button"
        tabIndex={0}
        aria-label={`${title}: ${value}`}
        onKeyPress={(e) => e.key === 'Enter' && onClick?.()}
      >
        {/* Hover tooltip */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            Click to view details
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className={`${color} rounded-lg p-3`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className={`flex items-center space-x-1 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            <span className="text-sm font-semibold">{Math.abs(change)}%</span>
          </div>
        </div>

        <h3 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-1`}>
          {title}
        </h3>

        <div className="flex items-baseline space-x-2 mb-2">
          <span className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {typeof value === 'number' && value > 1000 ? value.toLocaleString() : value}
          </span>
          {target && (
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              / {target.toLocaleString()}
            </span>
          )}
        </div>

        {/* Progress bar */}
        {target && (
          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`absolute h-full ${color} transition-all`}
              style={{ width: `${Math.min((value / target) * 100, 100)}%` }}
            />
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4" />
          <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const bgClass = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';

  return (
    <div className={`min-h-screen ${bgClass} transition-colors`}>
      {/* Header */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b p-4 sticky top-0 z-50 transition-colors`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className={`text-2xl font-bold ${textClass}`}>Lead Generation Dashboard</h1>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Time Range Selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className={`px-3 py-2 ${cardBg} border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
              aria-label="Select time range"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>

            <button
              onClick={loadDashboard}
              className={`p-2 ${cardBg} border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700`}
              aria-label="Refresh dashboard"
            >
              <RefreshCw className="h-5 w-5" />
            </button>

            <button
              onClick={exportPDF}
              className={`p-2 ${cardBg} border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700`}
              aria-label="Export as PDF"
            >
              <Download className="h-5 w-5" />
            </button>

            <button
              onClick={toggleDarkMode}
              className={`p-2 ${cardBg} border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700`}
              aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <button
              onClick={() => setShowTour(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Info className="h-4 w-4" />
              <span>Take Tour</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6 max-w-[1800px] mx-auto">
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KPICard
            title="Total Prospects"
            value={kpis.total_prospects.value}
            target={kpis.total_prospects.target}
            change={kpis.total_prospects.change}
            trend={kpis.total_prospects.trend}
            icon={Users}
            color="bg-blue-500"
            onClick={() => alert('Navigate to Prospects filtered view')}
          />

          <KPICard
            title="Conversion Rate"
            value={`${kpis.conversion_rate.value}%`}
            target={kpis.conversion_rate.target}
            change={kpis.conversion_rate.change}
            trend={kpis.conversion_rate.trend}
            icon={Target}
            color="bg-purple-500"
            onClick={() => alert('Navigate to Conversions')}
          />

          <KPICard
            title="Reply Rate"
            value={`${kpis.reply_rate.value}%`}
            target={kpis.reply_rate.target}
            change={kpis.reply_rate.change}
            trend={kpis.reply_rate.trend}
            icon={Mail}
            color="bg-green-500"
            onClick={() => alert('Navigate to Email Analytics')}
          />

          <KPICard
            title="Deals Closed"
            value={kpis.deals_closed.value}
            target={kpis.deals_closed.target}
            change={kpis.deals_closed.change}
            trend={kpis.deals_closed.trend}
            icon={CheckCircle}
            color="bg-emerald-500"
            onClick={() => alert('Navigate to Closed Deals')}
          />

          <KPICard
            title="Revenue"
            value={`$${(kpis.revenue.value / 1000).toFixed(0)}k`}
            target={kpis.revenue.target}
            change={kpis.revenue.change}
            trend={kpis.revenue.trend}
            icon={DollarSign}
            color="bg-amber-500"
            onClick={() => alert('Navigate to Revenue Report')}
          />

          <KPICard
            title="Avg Response Time"
            value={`${kpis.avg_response_time.value}h`}
            target={kpis.avg_response_time.target}
            change={kpis.avg_response_time.change}
            trend={kpis.avg_response_time.trend}
            icon={Clock}
            color="bg-red-500"
            onClick={() => alert('Navigate to Performance')}
          />
        </div>

        {/* AI Insights Widget */}
        <div className={`${cardBg} rounded-lg p-6 border border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className={`text-lg font-semibold ${textClass}`}>AI Insights</h2>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Powered by AI</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className={`p-3 ${darkMode ? 'bg-gray-800/50' : 'bg-white'} rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className={`text-sm font-medium ${textClass}`}>Focus on high-value deals</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        3 deals worth $180K are at risk. TechStart Enterprise ($85K) needs immediate attention.
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`p-3 ${darkMode ? 'bg-gray-800/50' : 'bg-white'} rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-start gap-2">
                    <Target className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className={`text-sm font-medium ${textClass}`}>12 warm leads ready to contact</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Based on engagement signals, 12 leads show high intent. Average lead score: 87/100.
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`p-3 ${darkMode ? 'bg-gray-800/50' : 'bg-white'} rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className={`text-sm font-medium ${textClass}`}>On track for $250K target</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        55% probability to hit monthly target. Close 2 more deals to reach 80% confidence.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/crm/ai-copilot')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium transition-colors"
                >
                  <Bot className="h-4 w-4" />
                  Ask AI
                </button>
                <button
                  onClick={() => navigate('/crm/ai-copilot')}
                  className="px-4 py-2 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 text-sm font-medium transition-colors"
                >
                  Get AI recommendation
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Goal Progress Cards */}
          <div className={`${cardBg} rounded-lg p-6 border`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-600" />
                <h2 className={`text-lg font-semibold ${textClass}`}>Goal Progress</h2>
              </div>
              <button className="text-blue-600 text-sm hover:text-blue-700">View All</button>
            </div>

            <div className="space-y-4">
              {goals.slice(0, 5).map(goal => (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className={`text-sm font-medium ${textClass}`}>{goal.goal_name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(goal.status)}`}>
                          {goal.status.replace('_', ' ').toUpperCase()}
                        </span>
                        {goal.progress_percentage < 100 && goal.status === 'behind' && (
                          <div className="flex items-center space-x-1 text-red-600">
                            <AlertCircle className="h-3 w-3" />
                            <span className="text-xs">AI: Boost outreach by 20%</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${textClass}`}>
                        {formatValue(goal.current_value, goal.unit)}
                      </div>
                      <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        of {formatValue(goal.target_value, goal.unit)}
                      </div>
                    </div>
                  </div>

                  <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`absolute h-full transition-all ${
                        goal.progress_percentage >= 90 ? 'bg-green-500' :
                        goal.progress_percentage >= 70 ? 'bg-blue-500' :
                        goal.progress_percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(goal.progress_percentage, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                      {goal.progress_percentage.toFixed(1)}% complete
                    </span>
                    {goal.progress_percentage < 100 && (
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                        {(goal.target_value - goal.current_value).toFixed(0)} to go
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Performance Widget */}
          <div className={`${cardBg} rounded-lg p-6 border`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-purple-600" />
                <h2 className={`text-lg font-semibold ${textClass}`}>Team Performance</h2>
              </div>
              <button className="text-blue-600 text-sm hover:text-blue-700">View Details</button>
            </div>

            <div className="space-y-3">
              {teams.map(team => (
                <div key={team.team_name} className={`p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className={`w-8 h-8 rounded-full ${
                        team.rank === 1 ? 'bg-yellow-400' :
                        team.rank === 2 ? 'bg-gray-400' :
                        'bg-amber-600'
                      } flex items-center justify-center text-white font-bold text-sm`}>
                        {team.rank}
                      </div>
                      <span className={`font-semibold ${textClass}`}>{team.team_name}</span>
                    </div>
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {team.metrics.win_rate}% win rate
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Deals</div>
                      <div className={`text-lg font-bold ${textClass}`}>{team.metrics.deals_closed}</div>
                    </div>
                    <div>
                      <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Revenue</div>
                      <div className={`text-lg font-bold ${textClass}`}>${(team.metrics.revenue / 1000).toFixed(0)}k</div>
                    </div>
                    <div>
                      <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Conv %</div>
                      <div className={`text-lg font-bold ${textClass}`}>{team.metrics.conversion_rate}%</div>
                    </div>
                    <div>
                      <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Avg Deal</div>
                      <div className={`text-lg font-bold ${textClass}`}>${(team.metrics.avg_deal_size / 1000).toFixed(1)}k</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Engagement Funnel & Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Engagement Funnel */}
          <div className={`${cardBg} rounded-lg p-6 border`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-blue-600" />
                <h2 className={`text-lg font-semibold ${textClass}`}>Engagement Funnel</h2>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { stage: 'Prospects', count: 1247, conversion: 100, color: 'bg-blue-500' },
                { stage: 'Contacted', count: 998, conversion: 80, color: 'bg-purple-500' },
                { stage: 'Replied', count: 598, conversion: 60, color: 'bg-green-500' },
                { stage: 'Qualified', count: 299, conversion: 50, color: 'bg-amber-500' },
                { stage: 'Demo', count: 149, conversion: 50, color: 'bg-red-500' },
                { stage: 'Closed', count: 42, conversion: 28, color: 'bg-emerald-500' }
              ].map(stage => (
                <div key={stage.stage}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${textClass}`}>{stage.stage}</span>
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {stage.count} ({stage.conversion}%)
                    </span>
                  </div>
                  <div className="relative h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`absolute h-full ${stage.color}`}
                      style={{ width: `${stage.conversion}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className={`${cardBg} rounded-lg p-6 border`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-green-600" />
                <h2 className={`text-lg font-semibold ${textClass}`}>Recent Activity</h2>
              </div>
            </div>

            <div className="space-y-3">
              {activities.map(activity => {
                const Icon = activity.icon;
                return (
                  <div
                    key={activity.id}
                    className={`flex items-start space-x-3 p-3 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} rounded-lg cursor-pointer transition-colors group`}
                    onClick={() => alert(`View ${activity.lead} details`)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className={`bg-${activity.color}-100 dark:bg-${activity.color}-900 rounded-full p-2`}>
                      <Icon className={`h-4 w-4 text-${activity.color}-600 dark:text-${activity.color}-400`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className={`font-semibold ${textClass}`}>{activity.lead}</span>
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          @ {activity.company}
                        </span>
                      </div>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {activity.action}
                      </p>
                      <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {activity.time}
                      </span>
                    </div>
                    <ChevronRight className={`h-4 w-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;
