import React, { useState } from 'react';
import { Trophy, Medal, Award, TrendingUp, Users, Calendar } from 'lucide-react';

interface LeaderboardProps {
  period?: 'week' | 'month' | 'quarter' | 'year';
  metric?: 'points' | 'deals' | 'revenue';
}

const Leaderboard: React.FC<LeaderboardProps> = ({ 
  period = 'month', 
  metric = 'points' 
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState(period);
  const [selectedMetric, setSelectedMetric] = useState(metric);

  // Mock leaderboard data - in real app, this would come from API
  const leaderboardData = [
    {
      id: '1',
      name: 'Sarah Johnson',
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
      department: 'Sales',
      points: 3250,
      deals: 12,
      revenue: 485000,
      change: '+15%',
      badges: ['top-performer', 'deal-closer']
    },
    {
      id: '2',
      name: 'Mike Chen',
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
      department: 'Sales',
      points: 2890,
      deals: 10,
      revenue: 420000,
      change: '+8%',
      badges: ['lead-hunter']
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
      department: 'Sales',
      points: 2650,
      deals: 9,
      revenue: 380000,
      change: '+12%',
      badges: ['team-player']
    },
    {
      id: '4',
      name: 'John Smith',
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
      department: 'Sales',
      points: 2420,
      deals: 8,
      revenue: 350000,
      change: '+5%',
      badges: []
    },
    {
      id: '5',
      name: 'Lisa Wang',
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
      department: 'Sales',
      points: 2180,
      deals: 7,
      revenue: 290000,
      change: '+3%',
      badges: ['consistent-performer']
    }
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-orange-500" />;
      default:
        return <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">{rank}</div>;
    }
  };

  const getMetricValue = (user: any) => {
    switch (selectedMetric) {
      case 'deals':
        return user.deals;
      case 'revenue':
        return `$${(user.revenue / 1000).toFixed(0)}K`;
      default:
        return user.points.toLocaleString();
    }
  };

  const getMetricLabel = () => {
    switch (selectedMetric) {
      case 'deals':
        return 'Deals Closed';
      case 'revenue':
        return 'Revenue Generated';
      default:
        return 'Points Earned';
    }
  };

  const periods = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' }
  ];

  const metrics = [
    { value: 'points', label: 'Points', icon: Star },
    { value: 'deals', label: 'Deals', icon: TrendingUp },
    { value: 'revenue', label: 'Revenue', icon: TrendingUp }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900">Leaderboard</h3>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {periods.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {metrics.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="divide-y divide-gray-200">
        {leaderboardData.map((user, index) => {
          const rank = index + 1;
          const isTopThree = rank <= 3;
          
          return (
            <div
              key={user.id}
              className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
                isTopThree ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''
              }`}
            >
              <div className="flex items-center space-x-4">
                {/* Rank */}
                <div className="flex-shrink-0">
                  {getRankIcon(rank)}
                </div>

                {/* User Info */}
                <div className="flex items-center space-x-3 flex-1">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">{user.name}</h4>
                    <p className="text-sm text-gray-600">{user.department}</p>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex space-x-1">
                  {user.badges.slice(0, 2).map((badge, idx) => (
                    <div
                      key={idx}
                      className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center"
                      title={badge}
                    >
                      <Star className="h-3 w-3 text-blue-600" />
                    </div>
                  ))}
                  {user.badges.length > 2 && (
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs text-gray-600">
                      +{user.badges.length - 2}
                    </div>
                  )}
                </div>

                {/* Metric Value */}
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {getMetricValue(user)}
                  </p>
                  <p className="text-sm text-green-600">{user.change}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Showing top performers for {getMetricLabel().toLowerCase()}</span>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Updated daily</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;