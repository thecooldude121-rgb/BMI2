import React, { useState } from 'react';
import {
  Bell, X, Check, Trash2, Settings, Filter, Search, Clock,
  AlertTriangle, Info, CheckCircle, Mail, Users, DollarSign, Calendar
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  category: 'lead' | 'deal' | 'task' | 'system' | 'team';
  actionUrl?: string;
  actionLabel?: string;
}

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'success',
      title: 'Deal Won!',
      message: 'Acme Corp deal closed for $50,000',
      timestamp: '2 minutes ago',
      read: false,
      category: 'deal',
      actionUrl: '/deals/123',
      actionLabel: 'View Deal'
    },
    {
      id: '2',
      type: 'warning',
      title: 'Task Overdue',
      message: 'Follow-up call with TechStart Inc is overdue',
      timestamp: '15 minutes ago',
      read: false,
      category: 'task',
      actionUrl: '/tasks/456',
      actionLabel: 'View Task'
    },
    {
      id: '3',
      type: 'info',
      title: 'New Lead Assigned',
      message: 'Sarah Johnson assigned you a new lead: Global Systems',
      timestamp: '1 hour ago',
      read: false,
      category: 'lead',
      actionUrl: '/leads/789',
      actionLabel: 'View Lead'
    },
    {
      id: '4',
      type: 'success',
      title: 'Meeting Scheduled',
      message: 'Video call with ABC Company confirmed for tomorrow at 2 PM',
      timestamp: '2 hours ago',
      read: true,
      category: 'system',
      actionUrl: '/calendar',
      actionLabel: 'View Calendar'
    },
    {
      id: '5',
      type: 'info',
      title: 'Team Update',
      message: 'Michael Chen added you to the Q1 Sales Campaign group',
      timestamp: '3 hours ago',
      read: true,
      category: 'team',
      actionUrl: '/groups/q1-campaign',
      actionLabel: 'View Group'
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'error': return AlertTriangle;
      case 'info': return Info;
      default: return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-orange-600 bg-orange-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'lead': return Users;
      case 'deal': return DollarSign;
      case 'task': return CheckCircle;
      case 'team': return Users;
      case 'system': return Bell;
      default: return Bell;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterCategory === 'all' || notification.category === filterCategory;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="relative">
      {/* Bell Icon with Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full transform translate-x-1 -translate-y-1">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Category Filters */}
              <div className="flex space-x-2 overflow-x-auto">
                {['all', 'lead', 'deal', 'task', 'team', 'system'].map(category => (
                  <button
                    key={category}
                    onClick={() => setFilterCategory(category)}
                    className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                      filterCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <Bell className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-gray-500 text-sm">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredNotifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.type);
                    const CategoryIcon = getCategoryIcon(notification.category);
                    const colorClass = getNotificationColor(notification.type);

                    return (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 transition-colors ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          {/* Icon */}
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                            <Icon className="h-5 w-5" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                              <h4 className={`text-sm font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <span className="w-2 h-2 bg-blue-600 rounded-full ml-2 flex-shrink-0 mt-1"></span>
                              )}
                            </div>

                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {notification.message}
                            </p>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <CategoryIcon className="h-3 w-3" />
                                <span>{notification.timestamp}</span>
                              </div>

                              <div className="flex items-center space-x-1">
                                {notification.actionUrl && (
                                  <a
                                    href={notification.actionUrl}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                    onClick={() => setIsOpen(false)}
                                  >
                                    {notification.actionLabel}
                                  </a>
                                )}
                                {!notification.read && (
                                  <button
                                    onClick={() => markAsRead(notification.id)}
                                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                    title="Mark as read"
                                  >
                                    <Check className="h-3 w-3" />
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteNotification(notification.id)}
                                  className="p-1 text-gray-400 hover:text-red-600 rounded"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <a
                href="/settings/notifications"
                className="flex items-center justify-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="h-4 w-4" />
                <span>Notification Settings</span>
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
