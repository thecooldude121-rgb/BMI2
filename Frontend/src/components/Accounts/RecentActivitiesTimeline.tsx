import React from 'react';
import { Activity, Mail, Phone, Calendar, MessageSquare, FileText, Video, TrendingUp, Clock, User, Sparkles } from 'lucide-react';

export interface ActivityItem {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'note' | 'task' | 'proposal' | 'video-call' | 'other';
  title: string;
  description?: string;
  contactName?: string;
  timestamp: string;
  aiSummary?: string;
  outcome?: string;
  nextSteps?: string[];
}

interface RecentActivitiesTimelineProps {
  activities: ActivityItem[];
  onActivityClick?: (activityId: string) => void;
  onViewAll?: () => void;
  onLogActivity?: () => void;
  maxItems?: number;
}

const RecentActivitiesTimeline: React.FC<RecentActivitiesTimelineProps> = ({
  activities,
  onActivityClick,
  onViewAll,
  onLogActivity,
  maxItems = 10
}) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-5 w-5" />;
      case 'call':
        return <Phone className="h-5 w-5" />;
      case 'meeting':
        return <Calendar className="h-5 w-5" />;
      case 'note':
        return <FileText className="h-5 w-5" />;
      case 'task':
        return <TrendingUp className="h-5 w-5" />;
      case 'proposal':
        return <FileText className="h-5 w-5" />;
      case 'video-call':
        return <Video className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'email':
        return 'bg-blue-100 text-blue-600';
      case 'call':
        return 'bg-green-100 text-green-600';
      case 'meeting':
        return 'bg-purple-100 text-purple-600';
      case 'note':
        return 'bg-yellow-100 text-yellow-600';
      case 'task':
        return 'bg-orange-100 text-orange-600';
      case 'proposal':
        return 'bg-red-100 text-red-600';
      case 'video-call':
        return 'bg-indigo-100 text-indigo-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getActivityLabel = (type: string) => {
    return type
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const displayedActivities = activities.slice(0, maxItems);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Activity className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">RECENT ACTIVITIES</h3>
              <p className="text-xs text-gray-500">
                {activities.length} {activities.length === 1 ? 'activity' : 'activities'} • AI-Summarized
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onLogActivity}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200"
            >
              + Log Activity
            </button>
            <button
              onClick={onViewAll}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200"
            >
              View All
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          {displayedActivities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm">No recent activities</p>
            </div>
          ) : (
            displayedActivities.map((activity, index) => (
              <div
                key={activity.id}
                className="relative pl-8 pb-6 last:pb-0"
              >
                {/* Timeline Line */}
                {index < displayedActivities.length - 1 && (
                  <div className="absolute left-4 top-10 bottom-0 w-px bg-gray-200" />
                )}

                {/* Activity Icon */}
                <div
                  className={`absolute left-0 top-1 h-8 w-8 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}
                >
                  {getActivityIcon(activity.type)}
                </div>

                {/* Activity Card */}
                <div
                  onClick={() => onActivityClick?.(activity.id)}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                >
                  {/* Activity Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getActivityColor(activity.type)}`}>
                          {getActivityLabel(activity.type)}
                        </span>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{activity.timestamp}</span>
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900">{activity.title}</h4>
                      {activity.contactName && (
                        <div className="flex items-center space-x-1 text-xs text-gray-600 mt-1">
                          <User className="h-3 w-3" />
                          <span>{activity.contactName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {activity.description && (
                    <p className="text-sm text-gray-700 mb-3">{activity.description}</p>
                  )}

                  {/* AI Summary */}
                  {activity.aiSummary && (
                    <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start space-x-2">
                        <Sparkles className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-blue-900 mb-1">AI Summary</p>
                          <p className="text-xs text-blue-800">{activity.aiSummary}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Outcome */}
                  {activity.outcome && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-gray-900 mb-1">Outcome:</p>
                      <p className="text-xs text-gray-700">{activity.outcome}</p>
                    </div>
                  )}

                  {/* Next Steps */}
                  {activity.nextSteps && activity.nextSteps.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-900 mb-2">Next Steps:</p>
                      <ul className="space-y-1">
                        {activity.nextSteps.map((step, idx) => (
                          <li key={idx} className="flex items-start space-x-2 text-xs text-gray-700">
                            <span className="text-blue-600 font-bold">•</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Activity Summary */}
        {activities.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Activity Breakdown (Last 30 Days)</h4>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-2 bg-blue-50 rounded border border-blue-100">
                <p className="text-lg font-bold text-blue-700">
                  {activities.filter((a) => a.type === 'email').length}
                </p>
                <p className="text-xs text-blue-600">Emails</p>
              </div>
              <div className="text-center p-2 bg-green-50 rounded border border-green-100">
                <p className="text-lg font-bold text-green-700">
                  {activities.filter((a) => a.type === 'call' || a.type === 'video-call').length}
                </p>
                <p className="text-xs text-green-600">Calls</p>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded border border-purple-100">
                <p className="text-lg font-bold text-purple-700">
                  {activities.filter((a) => a.type === 'meeting').length}
                </p>
                <p className="text-xs text-purple-600">Meetings</p>
              </div>
              <div className="text-center p-2 bg-orange-50 rounded border border-orange-100">
                <p className="text-lg font-bold text-orange-700">
                  {activities.filter((a) => a.type === 'proposal' || a.type === 'note').length}
                </p>
                <p className="text-xs text-orange-600">Documents</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivitiesTimeline;
