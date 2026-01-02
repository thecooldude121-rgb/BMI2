import React, { useState } from 'react';
import { Trophy, Target, Star, Award, Zap, Users, TrendingUp, Calendar, Lock } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: 'sales' | 'activity' | 'collaboration' | 'milestone';
  points: number;
  requirement: string;
  progress: number;
  maxProgress: number;
  earned: boolean;
  earnedAt?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const Achievements: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const achievements: Achievement[] = [
    {
      id: 'first-deal',
      name: 'First Deal',
      description: 'Close your first deal',
      icon: Trophy,
      category: 'milestone',
      points: 100,
      requirement: 'Close 1 deal',
      progress: 1,
      maxProgress: 1,
      earned: true,
      earnedAt: '2024-01-15',
      rarity: 'common'
    },
    {
      id: 'deal-closer',
      name: 'Deal Closer',
      description: 'Close 10 deals in a month',
      icon: Target,
      category: 'sales',
      points: 500,
      requirement: 'Close 10 deals in one month',
      progress: 7,
      maxProgress: 10,
      earned: false,
      rarity: 'rare'
    },
    {
      id: 'revenue-king',
      name: 'Revenue King',
      description: 'Generate $1M in revenue',
      icon: Star,
      category: 'sales',
      points: 1000,
      requirement: 'Generate $1,000,000 in revenue',
      progress: 750000,
      maxProgress: 1000000,
      earned: false,
      rarity: 'epic'
    },
    {
      id: 'team-player',
      name: 'Team Player',
      description: 'Help 5 colleagues close deals',
      icon: Users,
      category: 'collaboration',
      points: 300,
      requirement: 'Assist in 5 team deals',
      progress: 3,
      maxProgress: 5,
      earned: false,
      rarity: 'rare'
    },
    {
      id: 'activity-master',
      name: 'Activity Master',
      description: 'Log 100 activities in a month',
      icon: Zap,
      category: 'activity',
      points: 200,
      requirement: 'Log 100 activities',
      progress: 85,
      maxProgress: 100,
      earned: false,
      rarity: 'common'
    },
    {
      id: 'legend',
      name: 'Sales Legend',
      description: 'Achieve top performer status for 6 months',
      icon: Award,
      category: 'milestone',
      points: 2000,
      requirement: 'Top performer for 6 consecutive months',
      progress: 2,
      maxProgress: 6,
      earned: false,
      rarity: 'legendary'
    }
  ];

  const categories = [
    { value: 'all', label: 'All Categories', icon: Trophy },
    { value: 'sales', label: 'Sales', icon: TrendingUp },
    { value: 'activity', label: 'Activity', icon: Zap },
    { value: 'collaboration', label: 'Collaboration', icon: Users },
    { value: 'milestone', label: 'Milestones', icon: Star }
  ];

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  const getRarityColor = (rarity: Achievement['rarity']) => {
    const colors = {
      common: 'border-gray-300 bg-gray-50',
      rare: 'border-blue-300 bg-blue-50',
      epic: 'border-purple-300 bg-purple-50',
      legendary: 'border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50'
    };
    return colors[rarity];
  };

  const getRarityBadge = (rarity: Achievement['rarity']) => {
    const badges = {
      common: 'bg-gray-100 text-gray-700',
      rare: 'bg-blue-100 text-blue-700',
      epic: 'bg-purple-100 text-purple-700',
      legendary: 'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700'
    };
    return badges[rarity];
  };

  const earnedCount = achievements.filter(a => a.earned).length;
  const totalPoints = achievements.filter(a => a.earned).reduce((sum, a) => sum + a.points, 0);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="p-3 bg-yellow-100 rounded-full w-fit mx-auto mb-3">
            <Trophy className="h-6 w-6 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{earnedCount}</p>
          <p className="text-sm text-gray-600">Achievements Earned</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-3">
            <Star className="h-6 w-6 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalPoints.toLocaleString()}</p>
          <p className="text-sm text-gray-600">Points from Achievements</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-3">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {Math.round((earnedCount / achievements.length) * 100)}%
          </p>
          <p className="text-sm text-gray-600">Completion Rate</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <IconComponent className="h-4 w-4 mr-2" />
                {category.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAchievements.map((achievement) => {
          const IconComponent = achievement.icon;
          const progressPercentage = (achievement.progress / achievement.maxProgress) * 100;
          
          return (
            <div
              key={achievement.id}
              className={`rounded-xl border-2 p-6 transition-all hover:shadow-lg ${
                achievement.earned 
                  ? getRarityColor(achievement.rarity)
                  : 'border-gray-200 bg-white opacity-75'
              }`}
            >
              {/* Achievement Header */}
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${
                  achievement.earned 
                    ? 'bg-white shadow-sm' 
                    : 'bg-gray-100'
                }`}>
                  {achievement.earned ? (
                    <IconComponent className="h-8 w-8 text-yellow-500" />
                  ) : (
                    <Lock className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRarityBadge(achievement.rarity)}`}>
                    {achievement.rarity}
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    +{achievement.points}
                  </span>
                </div>
              </div>

              {/* Achievement Info */}
              <div className="mb-4">
                <h4 className={`text-lg font-bold mb-2 ${
                  achievement.earned ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {achievement.name}
                </h4>
                <p className={`text-sm ${
                  achievement.earned ? 'text-gray-700' : 'text-gray-500'
                }`}>
                  {achievement.description}
                </p>
              </div>

              {/* Progress */}
              {!achievement.earned && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>
                      {selectedMetric === 'revenue' 
                        ? `$${(achievement.progress / 1000).toFixed(0)}K / $${(achievement.maxProgress / 1000).toFixed(0)}K`
                        : `${achievement.progress} / ${achievement.maxProgress}`
                      }
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Earned Date */}
              {achievement.earned && achievement.earnedAt && (
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Earned {new Date(achievement.earnedAt).toLocaleDateString()}</span>
                </div>
              )}

              {/* Requirement */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  <strong>Requirement:</strong> {achievement.requirement}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No achievements in this category</p>
        </div>
      )}
    </div>
  );
};

export default Achievements;