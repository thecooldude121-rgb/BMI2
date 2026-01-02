import React, { useState } from 'react';
import { Plus, Phone, Mail, Calendar, FileText, MessageSquare, Video, Clock, User, MoreHorizontal } from 'lucide-react';
import { Activity, ActivityRelation } from '../../types/crm';
import { useData } from '../../contexts/DataContext';

interface ActivityTimelineProps {
  entityType: 'lead' | 'contact' | 'deal' | 'account';
  entityId: string;
  activities: Activity[];
  onAddActivity: (activity: Partial<Activity>) => void;
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  entityType,
  entityId,
  activities,
  onAddActivity
}) => {
  const { employees } = useData();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newActivity, setNewActivity] = useState({
    type: 'note' as Activity['type'],
    subject: '',
    description: '',
    scheduledAt: ''
  });

  const getActivityIcon = (type: Activity['type']) => {
    const icons = {
      call: Phone,
      email: Mail,
      meeting: Calendar,
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
      call: 'text-blue-600 bg-blue-100',
      email: 'text-green-600 bg-green-100',
      meeting: 'text-purple-600 bg-purple-100',
      task: 'text-orange-600 bg-orange-100',
      note: 'text-gray-600 bg-gray-100',
      sms: 'text-indigo-600 bg-indigo-100',
      whatsapp: 'text-green-600 bg-green-100',
      linkedin: 'text-blue-600 bg-blue-100',
      demo: 'text-purple-600 bg-purple-100',
      proposal: 'text-red-600 bg-red-100',
      document: 'text-yellow-600 bg-yellow-100'
    };
    return colors[type] || 'text-gray-600 bg-gray-100';
  };

  const getStatusColor = (status: Activity['status']) => {
    const colors = {
      planned: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-gray-100 text-gray-800'
    };
    return colors[status];
  };

  const getEmployeeName = (userId: string) => {
    const employee = employees.find(emp => emp.id === userId);
    return employee ? employee.name : 'Unknown User';
  };

  const handleAddActivity = () => {
    const activityData: Partial<Activity> = {
      ...newActivity,
      relatedTo: [{
        entityType,
        entityId,
        isPrimary: true
      }],
      status: newActivity.scheduledAt ? 'planned' : 'completed',
      createdBy: '1', // Current user
      ownerId: '1'
    };

    onAddActivity(activityData);
    setNewActivity({
      type: 'note',
      subject: '',
      description: '',
      scheduledAt: ''
    });
    setShowAddForm(false);
  };

  const filteredActivities = activities
    .filter(activity => 
      activity.relatedTo.some(relation => 
        relation.entityType === entityType && relation.entityId === entityId
      )
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Activity Timeline</h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Log Activity
          </button>
        </div>
      </div>

      {/* Add Activity Form */}
      {showAddForm && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Activity Type
                </label>
                <select
                  value={newActivity.type}
                  onChange={(e) => setNewActivity(prev => ({ ...prev, type: e.target.value as Activity['type'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="note">Note</option>
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                  <option value="meeting">Meeting</option>
                  <option value="task">Task</option>
                  <option value="demo">Demo</option>
                  <option value="proposal">Proposal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled At (optional)
                </label>
                <input
                  type="datetime-local"
                  value={newActivity.scheduledAt}
                  onChange={(e) => setNewActivity(prev => ({ ...prev, scheduledAt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={newActivity.subject}
                onChange={(e) => setNewActivity(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Activity subject..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={newActivity.description}
                onChange={(e) => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Activity details..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddActivity}
                disabled={!newActivity.subject}
                className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                Log Activity
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activities List */}
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {filteredActivities.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No activities logged yet</p>
            <p className="text-sm">Click "Log Activity" to add the first activity</p>
          </div>
        ) : (
          filteredActivities.map((activity) => {
            const IconComponent = getActivityIcon(activity.type);
            const colorClasses = getActivityColor(activity.type);
            
            return (
              <div key={activity.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 p-2 rounded-full ${colorClasses}`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-gray-900">{activity.subject}</h4>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                          {activity.status}
                        </span>
                        <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                          <MoreHorizontal className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    
                    {activity.description && (
                      <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          <span>{getEmployeeName(activity.createdBy)}</span>
                        </div>
                        {activity.duration && (
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{activity.duration}min</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{new Date(activity.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    {activity.outcome && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
                        <strong>Outcome:</strong> {activity.outcome}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ActivityTimeline;