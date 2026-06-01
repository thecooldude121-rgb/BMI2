import React from 'react';
import { X, Mail, Phone, Calendar, FileText, TrendingUp, Tag, UserPlus } from 'lucide-react';

interface Activity {
  id: string;
  activity_type: string;
  subject: string;
  description: string;
  performed_at: string;
  performed_by: string;
}

interface ActivityTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  prospectName: string;
  activities: Activity[];
}

export const ActivityTimelineModal: React.FC<ActivityTimelineModalProps> = ({
  isOpen,
  onClose,
  prospectName,
  activities
}) => {
  if (!isOpen) return null;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-5 w-5 text-blue-600" />;
      case 'call': return <Phone className="h-5 w-5 text-green-600" />;
      case 'meeting': return <Calendar className="h-5 w-5 text-purple-600" />;
      case 'note': return <FileText className="h-5 w-5 text-gray-600" />;
      case 'status_change': return <TrendingUp className="h-5 w-5 text-amber-600" />;
      case 'tag_added': return <Tag className="h-5 w-5 text-indigo-600" />;
      case 'assignment': return <UserPlus className="h-5 w-5 text-cyan-600" />;
      default: return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Activity Timeline</h2>
            <p className="text-sm text-gray-600 mt-1">{prospectName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activities.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No activities yet</p>
              <p className="text-sm text-gray-500 mt-1">Activities will appear here as you interact with this prospect</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div key={activity.id} className="flex space-x-4">
                  <div className="flex flex-col items-center">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      {getActivityIcon(activity.activity_type)}
                    </div>
                    {index < activities.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 mt-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-8">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{activity.subject}</h4>
                        <span className="text-xs text-gray-500">{formatDate(activity.performed_at)}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{activity.description}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>by {activity.performed_by || 'System'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityTimelineModal;
