import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy, TrendingUp, TrendingDown, Minus, Award, Target, Gift,
  Users, BarChart3, ArrowRight, Flame, ChevronRight, Medal,
  DollarSign, Activity, Percent, Building2, Crown, Star,
  Zap, Eye, Calendar, Phone, Mail, FileText
} from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  role: string;
  avatar: string;
  level: number;
  levelName: string;
  levelIcon: string;
  points: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  dealsCount: number;
  revenue: string;
  isCurrentUser?: boolean;
}

interface Celebration {
  id: string;
  type: 'deal' | 'badge' | 'levelup' | 'challenge' | 'streak';
  icon: string;
  userName: string;
  message: string;
  points?: number;
  timeAgo: string;
  actionLabel: string;
  actionLink: string;
}

type CategoryTab = 'overall' | 'activity' | 'revenue' | 'winrate' | 'hrms';
type TimeFilter = 'week' | 'month' | 'quarter' | 'alltime';

const GamificationLeaderboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<CategoryTab>('overall');
  const [activeTimeFilter, setActiveTimeFilter] = useState<TimeFilter>('quarter');

  const leaderboardData: LeaderboardEntry[] = [
    {
      rank: 1,
      id: '1',
      name: 'Sarah Chen',
      role: 'Sales Manager',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
      level: 5,
      levelName: 'Diamond',
      levelIcon: '💎',
      points: 45230,
      trend: 'up',
      trendPercentage: 3,
      dealsCount: 12,
      revenue: '$1.2M'
    },
    {
      rank: 2,
      id: '2',
      name: 'Alex Rodriguez',
      role: 'Sales Rep',
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
      level: 4,
      levelName: 'Platinum',
      levelIcon: '💎',
      points: 38450,
      trend: 'up',
      trendPercentage: 1,
      dealsCount: 10,
      revenue: '$950K',
      isCurrentUser: true
    },
    {
      rank: 3,
      id: '3',
      name: 'Mike Johnson',
      role: 'Account Executive',
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
      level: 4,
      levelName: 'Platinum',
      levelIcon: '💎',
      points: 32100,
      trend: 'stable',
      trendPercentage: 0,
      dealsCount: 8,
      revenue: '$780K'
    },
    {
      rank: 4,
      id: '4',
      name: 'Emily Davis',
      role: 'Sales Rep',
      avatar: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
      level: 3,
      levelName: 'Gold',
      levelIcon: '🥇',
      points: 28750,
      trend: 'down',
      trendPercentage: -2,
      dealsCount: 7,
      revenue: '$680K'
    },
    {
      rank: 5,
      id: '5',
      name: 'John Smith',
      role: 'Sales Director',
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
      level: 5,
      levelName: 'Diamond',
      levelIcon: '💎',
      points: 52890,
      trend: 'up',
      trendPercentage: 5,
      dealsCount: 15,
      revenue: '$1.5M'
    },
    {
      rank: 6,
      id: '6',
      name: 'Lisa Wong',
      role: 'Senior Sales Rep',
      avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
      level: 3,
      levelName: 'Gold',
      levelIcon: '🥇',
      points: 24890,
      trend: 'up',
      trendPercentage: 2,
      dealsCount: 6,
      revenue: '$590K'
    },
    {
      rank: 7,
      id: '7',
      name: 'David Brown',
      role: 'Sales Rep',
      avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
      level: 2,
      levelName: 'Silver',
      levelIcon: '🥈',
      points: 19230,
      trend: 'stable',
      trendPercentage: 0,
      dealsCount: 5,
      revenue: '$450K'
    }
  ];

  const celebrations: Celebration[] = [
    {
      id: '1',
      type: 'deal',
      icon: '💰',
      userName: 'Sarah Chen',
      message: 'closed a $120K deal!',
      points: 1200,
      timeAgo: '2 hours ago',
      actionLabel: 'View Deal',
      actionLink: '/crm/deals/1'
    },
    {
      id: '2',
      type: 'badge',
      icon: '🏅',
      userName: 'Mike Johnson',
      message: "earned 'HRMS Master' badge!",
      timeAgo: '4 hours ago',
      actionLabel: 'View Badge',
      actionLink: '/crm/gamification/badges'
    },
    {
      id: '3',
      type: 'levelup',
      icon: '⬆️',
      userName: 'Emily Davis',
      message: 'leveled up to Gold!',
      timeAgo: '5 hours ago',
      actionLabel: 'View Profile',
      actionLink: '/crm/gamification/profile/4'
    },
    {
      id: '4',
      type: 'challenge',
      icon: '🎯',
      userName: 'Alex Rodriguez',
      message: "completed 'Daily Dialer'",
      points: 200,
      timeAgo: '6 hours ago',
      actionLabel: 'View Challenge',
      actionLink: '/crm/gamification/challenges'
    },
    {
      id: '5',
      type: 'streak',
      icon: '🔥',
      userName: 'Sarah Chen',
      message: 'reached 45-day streak!',
      timeAgo: '1 day ago',
      actionLabel: '',
      actionLink: ''
    }
  ];

  const currentUser = leaderboardData.find(entry => entry.isCurrentUser);

  const getRankMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  const formatPoints = (points: number) => {
    return points.toLocaleString();
  };

  const categories = [
    { id: 'overall', label: 'Overall Points', icon: Trophy },
    { id: 'activity', label: 'Activity', icon: BarChart3 },
    { id: 'revenue', label: 'Revenue', icon: DollarSign },
    { id: 'winrate', label: 'Win Rate', icon: Percent },
    { id: 'hrms', label: 'HRMS Specialist', icon: Building2 }
  ];

  const timeFilters = [
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'quarter', label: 'This Quarter' },
    { id: 'alltime', label: 'All Time' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center text-sm text-gray-600">
            <button
              onClick={() => navigate('/crm/gamification')}
              className="hover:text-blue-600 transition-colors"
            >
              Gamification
            </button>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="text-gray-900 font-medium">Leaderboard</span>
          </div>
        </div>

        {/* Hero Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-3">
                <Trophy className="h-10 w-10 text-white" />
                <h1 className="text-4xl font-bold text-white">Leaderboard</h1>
              </div>
              <p className="text-blue-100 text-lg mb-6">
                Compete with your team and track your progress
              </p>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate('/crm/gamification/achievements')}
                  className="flex items-center space-x-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-all"
                >
                  <Medal className="h-4 w-4" />
                  <span>My Achievements</span>
                </button>
                <button
                  onClick={() => navigate('/crm/gamification/challenges')}
                  className="flex items-center space-x-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-all"
                >
                  <Target className="h-4 w-4" />
                  <span>Challenges</span>
                </button>
                <button
                  onClick={() => navigate('/crm/gamification/rewards')}
                  className="flex items-center space-x-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-all"
                >
                  <Gift className="h-4 w-4" />
                  <span>Rewards</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id as CategoryTab)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    activeCategory === category.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{category.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Filters */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            {timeFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveTimeFilter(filter.id as TimeFilter)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTimeFilter === filter.id
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (65% - 2 columns) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Leaderboard Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                      <BarChart3 className="h-6 w-6 mr-3 text-blue-600" />
                      Leaderboard Rankings
                    </h2>
                    <p className="text-xs text-gray-500 mt-1 ml-9">Last updated: Dec 31, 2024 3:45 PM</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-600 font-medium">Live</span>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {leaderboardData.map((entry) => (
                  <div
                    key={entry.id}
                    className={`p-6 hover:bg-gray-50 transition-colors ${
                      entry.isCurrentUser ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Rank Badge */}
                      <div className="flex-shrink-0">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                            entry.rank === 1
                              ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white'
                              : entry.rank === 2
                              ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white'
                              : entry.rank === 3
                              ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {getRankMedal(entry.rank)}
                        </div>
                      </div>

                      {/* User Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <img
                              src={entry.avatar}
                              alt={entry.name}
                              className="h-12 w-12 rounded-full border-2 border-white shadow-md"
                            />
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="text-lg font-bold text-gray-900">{entry.name}</h3>
                                {entry.isCurrentUser && (
                                  <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{entry.role}</p>
                            </div>
                          </div>

                          {/* Level Badge */}
                          <div className="text-right">
                            <div className="flex items-center justify-end space-x-2 mb-1">
                              <span className="text-2xl">{entry.levelIcon}</span>
                              <span className="font-bold text-gray-900">L{entry.level}</span>
                            </div>
                            <p className="text-sm text-gray-600">{entry.levelName}</p>
                          </div>
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-6 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Trophy className="h-4 w-4 text-yellow-600" />
                              <span>{entry.dealsCount} deals</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <span>{entry.revenue} revenue</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            {/* Points */}
                            <div className="text-right">
                              <div className="text-2xl font-bold text-blue-600">
                                {formatPoints(entry.points)}
                              </div>
                              <div className="text-xs text-gray-500">points</div>
                            </div>

                            {/* Trend */}
                            <div className="flex items-center space-x-1">
                              {getTrendIcon(entry.trend)}
                              <span className={`text-sm font-medium ${getTrendColor(entry.trend)}`}>
                                {entry.trendPercentage > 0 ? '+' : ''}
                                {entry.trendPercentage}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* View Profile Button */}
                        <div className="mt-3">
                          <button
                            onClick={() =>
                              navigate(
                                entry.isCurrentUser
                                  ? '/crm/gamification/profile'
                                  : `/crm/gamification/profile/${entry.id}`
                              )
                            }
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                          >
                            <span>{entry.isCurrentUser ? 'View My Profile' : 'View Profile'}</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Celebrations */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Star className="h-6 w-6 mr-3 text-yellow-500" />
                  Recent Celebrations
                </h2>
              </div>

              <div className="space-y-4">
                {celebrations.map((celebration) => (
                  <div
                    key={celebration.id}
                    className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="text-2xl">{celebration.icon}</div>
                        <div className="flex-1">
                          <p className="text-gray-900">
                            <span className="font-bold">{celebration.userName}</span>{' '}
                            {celebration.message}
                          </p>
                          {celebration.points && (
                            <p className="text-sm text-yellow-700 font-medium mt-1">
                              +{celebration.points} points
                            </p>
                          )}
                          <p className="text-xs text-gray-600 mt-1">{celebration.timeAgo}</p>
                        </div>
                      </div>
                      {celebration.actionLabel && (
                        <button
                          onClick={() => navigate(celebration.actionLink)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1 ml-4"
                        >
                          <span>{celebration.actionLabel}</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => navigate('/crm/gamification/celebrations')}
                  className="w-full py-3 text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center space-x-2 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-300 transition-all"
                >
                  <span>View All Celebrations</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column (35% - 1 column, Sticky) */}
          <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            {/* Your Stats Card */}
            {currentUser && (
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
                <div className="flex items-center space-x-3 mb-4">
                  <Star className="h-6 w-6" />
                  <h3 className="text-xl font-bold">Your Stats</h3>
                </div>

                <div className="mb-6">
                  <div className="text-sm opacity-90 mb-1">Current Rank</div>
                  <div className="text-4xl font-bold">#{currentUser.rank}</div>
                  <div className="w-full h-1 bg-white bg-opacity-20 rounded-full mt-2"></div>
                </div>

                <div className="bg-white bg-opacity-10 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{currentUser.levelIcon}</span>
                      <span className="font-bold">Level {currentUser.level}: {currentUser.levelName}</span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold mb-2">{formatPoints(currentUser.points)} points</div>

                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="w-full bg-white bg-opacity-20 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-300 to-orange-400 rounded-full"
                        style={{ width: '87%' }}
                      >
                        <div className="h-full bg-white bg-opacity-20 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm opacity-90">87% to Diamond</div>
                  <div className="text-xs opacity-75 mt-1">11,550 points to next level</div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Flame className="h-5 w-5 text-orange-300" />
                      <span>Day Streak</span>
                    </div>
                    <span className="font-bold">23 days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Medal className="h-5 w-5 text-yellow-300" />
                      <span>Badges Earned</span>
                    </div>
                    <span className="font-bold">5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5 text-green-300" />
                      <span>Deals Won</span>
                    </div>
                    <span className="font-bold">{currentUser.dealsCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5 text-blue-300" />
                      <span>Win Rate</span>
                    </div>
                    <span className="font-bold">67%</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/crm/gamification/profile')}
                  className="w-full bg-white text-blue-600 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all flex items-center justify-center space-x-2"
                >
                  <span>View My Full Profile</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Top 3 This Quarter */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Trophy className="h-6 w-6 text-yellow-500" />
                <h3 className="text-xl font-bold text-gray-900">Top 3 This Quarter</h3>
              </div>

              <div className="space-y-3">
                {leaderboardData.slice(0, 3).map((entry) => (
                  <div
                    key={entry.id}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      entry.rank === 1
                        ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300'
                        : entry.rank === 2
                        ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300'
                        : 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{getRankMedal(entry.rank)}</div>
                        <div>
                          <h4 className="font-bold text-gray-900">{entry.name}</h4>
                          <p className="text-xs text-gray-600">{formatPoints(entry.points)} points</p>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          navigate(
                            entry.isCurrentUser
                              ? '/crm/gamification/profile'
                              : `/crm/gamification/profile/${entry.id}`
                          )
                        }
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Zap className="h-6 w-6 text-yellow-500" />
                <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => navigate('/crm/gamification/achievements')}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <Medal className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium text-gray-900">View Achievements</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                </button>

                <button
                  onClick={() => navigate('/crm/gamification/challenges')}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <Target className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-gray-900">Active Challenges</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                </button>

                <button
                  onClick={() => navigate('/crm/gamification/rewards')}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <Gift className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-gray-900">Rewards Store</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                </button>

                <button
                  onClick={() => navigate('/crm/team')}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-gray-900">Team Performance</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                </button>

                <button
                  onClick={() => navigate('/crm/gamification/analytics')}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="h-5 w-5 text-orange-600" />
                    <span className="font-medium text-gray-900">My Analytics</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamificationLeaderboard;
