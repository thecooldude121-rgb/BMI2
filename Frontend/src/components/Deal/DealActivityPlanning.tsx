import React, { useState } from 'react';
import { Plus, Phone, Mail, Video, CheckSquare, Calendar, Clock, User, Target, Zap } from 'lucide-react';
import { DealFormData, PlannedActivity } from '../../types/deal';

interface DealActivityPlanningProps {
  formData: DealFormData;
  setFormData: React.Dispatch<React.SetStateAction<DealFormData>>;
}

const DealActivityPlanning: React.FC<DealActivityPlanningProps> = ({ formData, setFormData }) => {
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [newActivity, setNewActivity] = useState<Partial<PlannedActivity>>({
    type: 'task',
    priority: 'medium',
    status: 'planned'
  });

  const activityTypes = [
    { value: 'task', label: 'Task', icon: CheckSquare, color: 'blue' },
    { value: 'call', label: 'Phone Call', icon: Phone, color: 'green' },
    { value: 'meeting', label: 'Meeting', icon: Video, color: 'purple' },
    { value: 'email', label: 'Email', icon: Mail, color: 'orange' }
  ];

  const priorityLevels = [
    { value: 'low', label: 'Low', color: 'gray' },
    { value: 'medium', label: 'Medium', color: 'blue' },
    { value: 'high', label: 'High', color: 'red' }
  ];

  const suggestedActivities = [
    { type: 'call', title: 'Discovery Call', description: 'Understand customer needs and pain points' },
    { type: 'email', title: 'Send Proposal', description: 'Share detailed proposal and pricing' },
    { type: 'meeting', title: 'Demo Session', description: 'Product demonstration for stakeholders' },
    { type: 'task', title: 'Follow Up', description: 'Check in on decision timeline' }
  ];

  const addActivity = () => {
    if (!newActivity.title || !newActivity.assignedTo) return;

    const activity: PlannedActivity = {
      id: Date.now().toString(),
      type: newActivity.type as PlannedActivity['type'],
      title: newActivity.title,
      description: newActivity.description,
      scheduledAt: newActivity.scheduledAt,
      assignedTo: newActivity.assignedTo,
      priority: newActivity.priority as PlannedActivity['priority'],
      status: 'planned'
    };

    setFormData(prev => ({
      ...prev,
      plannedActivities: [...prev.plannedActivities, activity]
    }));

    setNewActivity({
      type: 'task',
      priority: 'medium',
      status: 'planned'
    });
    setShowActivityForm(false);
  };

  const addSuggestedActivity = (suggested: any) => {
    const activity: PlannedActivity = {
      id: Date.now().toString(),
      type: suggested.type,
      title: suggested.title,
      description: suggested.description,
      assignedTo: formData.ownerId,
      priority: 'medium',
      status: 'planned'
    };

    setFormData(prev => ({
      ...prev,
      plannedActivities: [...prev.plannedActivities, activity]
    }));
  };

  const removeActivity = (activityId: string) => {
    setFormData(prev => ({
      ...prev,
      plannedActivities: prev.plannedActivities.filter(a => a.id !== activityId)
    }));
  };

  const getActivityIcon = (type: string) => {
    const activityType = activityTypes.find(at => at.value === type);
    return activityType?.icon || CheckSquare;
  };

  const getActivityColor = (type: string) => {
    const activityType = activityTypes.find(at => at.value === type);
    const colors = {
      blue: 'text-blue-600 bg-blue-100 border-blue-200',
      green: 'text-green-600 bg-green-100 border-green-200',
      purple: 'text-purple-600 bg-purple-100 border-purple-200',
      orange: 'text-orange-600 bg-orange-100 border-orange-200'
    };
    return colors[activityType?.color as keyof typeof colors] || colors.blue;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-blue-100 text-blue-700',
      high: 'bg-red-100 text-red-700'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-purple-100 rounded-lg">
          <Target className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Activity Planning</h2>
          <p className="text-gray-600">Plan your next steps and keep the deal moving forward</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Current Activities */}
        <div className="space-y-6">
          {/* Next Steps */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              Next Steps
            </label>
            <textarea
              rows={3}
              value={formData.nextSteps}
              onChange={(e) => setFormData(prev => ({ ...prev, nextSteps: e.target.value }))}
              className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              placeholder="What needs to happen next to move this deal forward?"
            />
          </div>

          {/* Planned Activities */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Planned Activities</h3>
              <button
                onClick={() => setShowActivityForm(true)}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Activity
              </button>
            </div>

            {formData.plannedActivities.length > 0 ? (
              <div className="space-y-4">
                {formData.plannedActivities.map((activity) => {
                  const Icon = getActivityIcon(activity.type);
                  const colorClasses = getActivityColor(activity.type);
                  
                  return (
                    <div key={activity.id} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className={`p-2 rounded-lg border ${colorClasses}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{activity.title}</h4>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(activity.priority)}`}>
                              {activity.priority}
                            </span>
                            <button
                              onClick={() => removeActivity(activity.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        
                        {activity.description && (
                          <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {activity.assignedTo}
                          </span>
                          {activity.scheduledAt && (
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(activity.scheduledAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Target className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No activities planned yet</p>
                <p className="text-sm">Add activities to keep your deal on track</p>
              </div>
            )}

            {/* Add Activity Form */}
            {showActivityForm && (
              <div className="mt-6 p-6 bg-purple-50 border border-purple-200 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-4">Add New Activity</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Activity Type</label>
                      <select
                        value={newActivity.type || 'task'}
                        onChange={(e) => setNewActivity(prev => ({ ...prev, type: e.target.value as PlannedActivity['type'] }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        {activityTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                      <select
                        value={newActivity.priority || 'medium'}
                        onChange={(e) => setNewActivity(prev => ({ ...prev, priority: e.target.value as PlannedActivity['priority'] }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        {priorityLevels.map(level => (
                          <option key={level.value} value={level.value}>{level.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                    <input
                      type="text"
                      value={newActivity.title || ''}
                      onChange={(e) => setNewActivity(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Activity title"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      rows={2}
                      value={newActivity.description || ''}
                      onChange={(e) => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                      placeholder="Activity description"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To *</label>
                      <select
                        value={newActivity.assignedTo || ''}
                        onChange={(e) => setNewActivity(prev => ({ ...prev, assignedTo: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select assignee</option>
                        <option value="user1">John Smith</option>
                        <option value="user2">Sarah Johnson</option>
                        <option value="user3">Mike Chen</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date</label>
                      <input
                        type="datetime-local"
                        value={newActivity.scheduledAt || ''}
                        onChange={(e) => setNewActivity(prev => ({ ...prev, scheduledAt: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={() => setShowActivityForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addActivity}
                    disabled={!newActivity.title || !newActivity.assignedTo}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    Add Activity
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Suggestions */}
        <div className="space-y-6">
          {/* Smart Suggestions */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Zap className="h-5 w-5 mr-2 text-amber-600" />
              Smart Suggestions
            </h3>
            
            <div className="space-y-3">
              {suggestedActivities.map((suggested, index) => {
                const Icon = getActivityIcon(suggested.type);
                const isAlreadyAdded = formData.plannedActivities.some(a => a.title === suggested.title);
                
                return (
                  <div key={index} className={`p-4 border rounded-lg transition-colors ${
                    isAlreadyAdded ? 'bg-green-50 border-green-200' : 'bg-white border-amber-200 hover:bg-amber-50'
                  }`}>
                    <div className="flex items-start space-x-3">
                      <Icon className="h-4 w-4 text-amber-600 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{suggested.title}</h4>
                        <p className="text-sm text-gray-600">{suggested.description}</p>
                      </div>
                      {!isAlreadyAdded ? (
                        <button
                          onClick={() => addSuggestedActivity(suggested)}
                          className="text-amber-600 hover:text-amber-800 text-sm font-medium"
                        >
                          Add
                        </button>
                      ) : (
                        <span className="text-green-600 text-sm">✓ Added</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 p-3 bg-white border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                💡 <strong>Pro tip:</strong> Plan your first 3 activities to maintain deal momentum
              </p>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              Activity Timeline
            </h3>
            
            {formData.plannedActivities.filter(a => a.scheduledAt).length > 0 ? (
              <div className="space-y-3">
                {formData.plannedActivities
                  .filter(a => a.scheduledAt)
                  .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
                  .map(activity => (
                    <div key={activity.id} className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(activity.scheduledAt!).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Calendar className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No scheduled activities</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                <Phone className="h-4 w-4 mr-2 text-green-600" />
                Schedule Call
              </button>
              <button className="flex items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                <Mail className="h-4 w-4 mr-2 text-blue-600" />
                Send Email
              </button>
              <button className="flex items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                <Video className="h-4 w-4 mr-2 text-purple-600" />
                Book Meeting
              </button>
              <button className="flex items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                <CheckSquare className="h-4 w-4 mr-2 text-orange-600" />
                Create Task
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealActivityPlanning;