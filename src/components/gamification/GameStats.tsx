import React from 'react';
import { Trophy, Target, TrendingUp, Award, Star, Zap } from 'lucide-react';

interface GameStatsProps {
  userId: string;
  period?: 'week' | 'month' | 'quarter';
}

const GameStats: React.FC<GameStatsProps> = ({ userId, period = 'month' }) => {
  // Mock gamification data - in real app, this would come from API
  const stats = {
    points: 2450,
    level: 8,
    rank: 3,
    totalUsers: 25,
    achievements: 12,
    streak: 7,
    progress: {
      current: 2450,
      nextLevel: 3000,
      percentage: 82
    },
    badges: [
      { id: 'deal-closer', name: 'Deal Closer', icon: Trophy, earned: true },
      { id: 'lead-hunter', name: 'Lead Hunter', icon: Target, earned: true },
      { id: 'team-player', name: 'Team Player', icon: Award, earned: false },
      { id: 'top-performer', name: 'Top Performer', icon: Star, earned: true }
    ]
  };

  const activities = [
    { action: 'Closed deal worth $50K', points: 500, time: '2 hours ago' },
    { action: 'Qualified 3 new leads', points: 150, time: '1 day ago' },
    { action: 'Completed discovery call', points: 100, time: '2 days ago' },
    { action: 'Sent follow-up emails', points: 50, time: '3 days ago' }
  ];

  return (
    <div className="space-y-6">
      {/* Level Progress */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Level {stats.level}</h3>
            <p className="text-gray-600">Sales Professional</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-blue-600">{stats.points.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Total Points</p>
          </div>
        </div>
        
        <div className="mb-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress to Level {stats.level + 1}</span>
            <span>{stats.progress.current} / {stats.progress.nextLevel}</span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${stats.progress.percentage}%` }}
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="p-3 bg-yellow-100 rounded-full w-fit mx-auto mb-3">
            <Trophy className="h-6 w-6 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">#{stats.rank}</p>
          <p className="text-sm text-gray-600">Team Ranking</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-3">
            <Award className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.achievements}</p>
          <p className="text-sm text-gray-600">Achievements</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="p-3 bg-orange-100 rounded-full w-fit mx-auto mb-3">
            <Zap className="h-6 w-6 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.streak}</p>
          <p className="text-sm text-gray-600">Day Streak</p>
        </div>
      </div>

      {/* Badges */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Badges & Achievements</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.badges.map((badge) => {
            const IconComponent = badge.icon;
            return (
              <div
                key={badge.id}
                className={`p-4 rounded-lg border text-center transition-all ${
                  badge.earned
                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
                    : 'bg-gray-50 border-gray-200 opacity-50'
                }`}
              >
                <div className={`p-3 rounded-full w-fit mx-auto mb-2 ${
                  badge.earned ? 'bg-yellow-100' : 'bg-gray-100'
                }`}>
                  <IconComponent className={`h-6 w-6 ${
                    badge.earned ? 'text-yellow-600' : 'text-gray-400'
                  }`} />
                </div>
                <p className={`text-sm font-medium ${
                  badge.earned ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {badge.name}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Point Activity</h3>
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">+{activity.points}</p>
                <p className="text-xs text-gray-500">points</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameStats;