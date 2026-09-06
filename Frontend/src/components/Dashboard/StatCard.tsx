import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  /**
   * Period-over-period change. OPTIONAL, and omitted by every current caller.
   *
   * The dashboard used to pass literals — "+12%", "+8%", "+15%", "+5%" — under
   * a fixed "from last month" caption. Nothing computed them and nothing could:
   * a comparison needs a second query against the previous period, which no
   * endpoint offers. The whole row is now dropped when this is absent, rather
   * than showing a reassuring number that means nothing.
   */
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
  /** Shown under the value — for stating what the number counts. */
  caption?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  change,
  changeType = 'neutral',
  color,
  caption,
}) => {
  const colorClasses = {
    blue: 'bg-blue-500 text-blue-100',
    green: 'bg-green-500 text-green-100',
    yellow: 'bg-yellow-500 text-yellow-100',
    purple: 'bg-purple-500 text-purple-100',
    red: 'bg-red-500 text-red-100'
  };

  const changeClasses = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
      {change ? (
        <div className="mt-4">
          <span className={`text-sm font-medium ${changeClasses[changeType]}`}>{change}</span>
          <span className="text-sm text-gray-500 ml-1">from last month</span>
        </div>
      ) : (
        caption && <p className="mt-4 text-sm text-gray-500">{caption}</p>
      )}
    </div>
  );
};

export default StatCard;