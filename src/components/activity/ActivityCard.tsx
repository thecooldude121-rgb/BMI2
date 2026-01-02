import React from 'react';
import { Phone, Mail, Video, FileText, MessageSquare, Clock, User, Calendar, MoreHorizontal } from 'lucide-react';
import { Activity } from '../../types/crm';

interface ActivityCardProps {
  activity: Activity;
  showRelatedEntity?: boolean;
  onEdit?: (activity: Activity) => void;
  onDelete?: (activityId: string) => void;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  showRelatedEntity = true,
  onEdit,
  onDelete
}) => {
  const getActivityIcon = (type: Activity['type']) => {
    const icons = {
      call: Phone,
      email: Mail,
      meeting: Video,
      task: FileText,
      note: FileText,
      sms: MessageSquare,
      whatsapp: MessageSquare,
      linkedin: MessageSquare,
      demo: Video,
      proposal: FileText,
      document: FileText
    };
    return icons[type] || FileText;
  };

  const getActivityColor = (type: Activity['type']) => {
    const colors = {
      call: 'text-blue-600 bg-blue-100 border-blue-200',
      email: 'text-green-600 bg-green-100 border-green-200',
      meeting: 'text-purple-600 bg-purple-100 border-purple-200',
      task: 'text-orange-600 bg-orange-100 border-orange-200',
      note: 'text-gray-600 bg-gray-100 border-gray-200',
      sms: 'text-indigo-600 bg-indigo-100 border-indigo-200',
      whatsapp: 'text-green-600 bg-green-100 border-green-200',
      linkedin: 'text-blue-600 bg-blue-100 border-blue-200',
      demo: 'text-purple-600 bg-purple-100 border-purple-200',
      proposal: 'text-red-600 bg-red-100 border-red-200',
      document: 'text-yellow-600 bg-yellow-100 border-yellow-200'
    };
    return colors[type] || 'text-gray-600 bg-gray-100 border-gray-200';
  };

  const getStatusColor = (status: Activity['status']) => {
    const colors = {
      planned: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      no_show: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status];
  };

  const getPriorityColor = (priority: Activity['priority']) => {
    const colors = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700'
    };
    return colors[priority];
  };

  const IconComponent = getActivityIcon(activity.type);
  const colorClasses = getActivityColor(activity.type);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getRelatedEntityDisplay = () => {
    const primaryRelation = activity.relatedTo.find(r => r.isPrimary) || activity.relatedTo[0];
    if (!primaryRelation) return null;

    return `${primaryRelation.entityType.charAt(0).toUpperCase() + primaryRelation.entityType.slice(1)}: ${primaryRelation.entityId}`;
  };

  return (
    <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start space-x-4">
        {/* Activity Icon */}
        <div className={`flex-shrink-0 p-3 rounded-lg border ${colorClasses}`}>
          <IconComponent className="h-5 w-5" />
        </div>

        {/* Activity Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-lg font-medium text-gray-900">{activity.subject}</h4>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(activity.status)}`}>
                {activity.status}
              </span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(activity.priority)}`}>
                {activity.priority}
              </span>
              {(onEdit || onDelete) && (
                <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {activity.description && (
            <p className="text-gray-600 mb-3 leading-relaxed">{activity.description}</p>
          )}

          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                <span>{activity.createdBy}</span>
              </div>
              {activity.duration && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{activity.duration} minutes</span>
                </div>
              )}
              {showRelatedEntity && getRelatedEntityDisplay() && (
                <span className="text-blue-600">{getRelatedEntityDisplay()}</span>
              )}
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{formatDateTime(activity.createdAt)}</span>
            </div>
          </div>

          {activity.outcome && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Outcome:</strong> {activity.outcome}
              </p>
            </div>
          )}

          {activity.attachments.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-2">Attachments:</p>
              <div className="flex flex-wrap gap-2">
                {activity.attachments.map((attachment) => (
                  <span
                    key={attachment.id}
                    className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    {attachment.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityCard;