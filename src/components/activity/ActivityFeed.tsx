import React, { useState } from 'react';
import { Filter, Search, Calendar, Phone, Mail, Video, FileText, Users, Clock } from 'lucide-react';
import { Activity } from '../../types/crm';
import ActivityCard from './ActivityCard';

interface ActivityFeedProps {
  activities: Activity[];
  entityType?: 'lead' | 'contact' | 'deal' | 'account';
  entityId?: string;
  showFilters?: boolean;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  entityType,
  entityId,
  showFilters = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const filteredActivities = activities
    .filter(activity => {
      // Entity filter
      if (entityType && entityId) {
        const hasRelation = activity.relatedTo.some(
          relation => relation.entityType === entityType && relation.entityId === entityId
        );
        if (!hasRelation) return false;
      }

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!activity.subject.toLowerCase().includes(searchLower) &&
            !activity.description?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Type filter
      if (typeFilter !== 'all' && activity.type !== typeFilter) return false;

      // Status filter
      if (statusFilter !== 'all' && activity.status !== statusFilter) return false;

      // Date filter
      if (dateFilter !== 'all') {
        const activityDate = new Date(activity.createdAt);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (dateFilter) {
          case 'today':
            if (daysDiff !== 0) return false;
            break;
          case 'week':
            if (daysDiff > 7) return false;
            break;
          case 'month':
            if (daysDiff > 30) return false;
            break;
        }
      }

      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const activityTypes = [
    { value: 'call', label: 'Calls', icon: Phone },
    { value: 'email', label: 'Emails', icon: Mail },
    { value: 'meeting', label: 'Meetings', icon: Video },
    { value: 'task', label: 'Tasks', icon: FileText },
    { value: 'note', label: 'Notes', icon: FileText }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Activity Feed</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>{filteredActivities.length} activities</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              {activityTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="planned">Planned</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
      )}

      {/* Activity List */}
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {filteredActivities.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No activities found</p>
            <p className="text-sm">Activities will appear here as they are logged</p>
          </div>
        ) : (
          filteredActivities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;