import React, { useState } from 'react';
import { X, Activity, LogIn, AlertTriangle, Key, MapPin, Monitor, Clock } from 'lucide-react';

interface ActivityLogEntry {
  id: string;
  type: 'login' | 'logout' | 'failed_login' | 'password_change' | 'profile_update';
  timestamp: string;
  ipAddress: string;
  device: string;
  location: string;
  details?: string;
}

interface ViewActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userId: string;
}

const ViewActivityLogModal: React.FC<ViewActivityLogModalProps> = ({
  isOpen,
  onClose,
  userName,
  userId
}) => {
  const [filter, setFilter] = useState<'all' | 'login' | 'security'>('all');

  if (!isOpen) return null;

  const mockActivityLog: ActivityLogEntry[] = [
    {
      id: '1',
      type: 'login',
      timestamp: 'Dec 28, 2024 at 9:45 AM',
      ipAddress: '192.168.1.100',
      device: 'Chrome on Windows',
      location: 'New York, NY'
    },
    {
      id: '2',
      type: 'login',
      timestamp: 'Dec 27, 2024 at 2:30 PM',
      ipAddress: '192.168.1.100',
      device: 'Chrome on Windows',
      location: 'New York, NY'
    },
    {
      id: '3',
      type: 'failed_login',
      timestamp: 'Dec 26, 2024 at 11:20 AM',
      ipAddress: '203.45.67.89',
      device: 'Safari on iPhone',
      location: 'Brooklyn, NY',
      details: 'Incorrect password (attempt 1 of 5)'
    },
    {
      id: '4',
      type: 'password_change',
      timestamp: 'Dec 25, 2024 at 4:15 PM',
      ipAddress: '192.168.1.100',
      device: 'Chrome on Windows',
      location: 'New York, NY',
      details: 'Password changed successfully'
    },
    {
      id: '5',
      type: 'login',
      timestamp: 'Dec 25, 2024 at 8:00 AM',
      ipAddress: '192.168.1.100',
      device: 'Chrome on Windows',
      location: 'New York, NY'
    },
    {
      id: '6',
      type: 'profile_update',
      timestamp: 'Dec 24, 2024 at 3:45 PM',
      ipAddress: '192.168.1.100',
      device: 'Chrome on Windows',
      location: 'New York, NY',
      details: 'Updated phone number'
    },
    {
      id: '7',
      type: 'login',
      timestamp: 'Dec 24, 2024 at 9:15 AM',
      ipAddress: '192.168.1.100',
      device: 'Chrome on Windows',
      location: 'New York, NY'
    },
    {
      id: '8',
      type: 'logout',
      timestamp: 'Dec 23, 2024 at 6:30 PM',
      ipAddress: '192.168.1.100',
      device: 'Chrome on Windows',
      location: 'New York, NY'
    }
  ];

  const filteredLog = mockActivityLog.filter(entry => {
    if (filter === 'all') return true;
    if (filter === 'login') return entry.type === 'login' || entry.type === 'logout';
    if (filter === 'security') return entry.type === 'failed_login' || entry.type === 'password_change';
    return true;
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login':
        return <LogIn className="h-4 w-4 text-green-600" />;
      case 'logout':
        return <LogIn className="h-4 w-4 text-gray-600 transform rotate-180" />;
      case 'failed_login':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'password_change':
        return <Key className="h-4 w-4 text-orange-600" />;
      case 'profile_update':
        return <Activity className="h-4 w-4 text-blue-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'login':
        return 'Successful Login';
      case 'logout':
        return 'Logged Out';
      case 'failed_login':
        return 'Failed Login Attempt';
      case 'password_change':
        return 'Password Changed';
      case 'profile_update':
        return 'Profile Updated';
      default:
        return 'Activity';
    }
  };

  const getActivityBgColor = (type: string) => {
    switch (type) {
      case 'login':
        return 'bg-green-50 border-green-200';
      case 'logout':
        return 'bg-gray-50 border-gray-200';
      case 'failed_login':
        return 'bg-red-50 border-red-200';
      case 'password_change':
        return 'bg-orange-50 border-orange-200';
      case 'profile_update':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Activity Log: {userName}
              </h2>
              <p className="text-xs text-gray-500">Last 90 days of activity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Filters */}
        <div className="border-b border-gray-200 px-6 py-3 flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All Activity ({mockActivityLog.length})
          </button>
          <button
            onClick={() => setFilter('login')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === 'login'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Login/Logout
          </button>
          <button
            onClick={() => setFilter('security')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === 'security'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Security Events
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {filteredLog.map((entry) => (
              <div
                key={entry.id}
                className={`border rounded-lg p-4 ${getActivityBgColor(entry.type)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getActivityIcon(entry.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">
                          {getActivityLabel(entry.type)}
                        </h4>
                        {entry.details && (
                          <p className="text-xs text-gray-600 mt-0.5">
                            {entry.details}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 flex-shrink-0">
                        <Clock className="h-3 w-3" />
                        {entry.timestamp}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{entry.ipAddress}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Monitor className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{entry.device}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{entry.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredLog.length === 0 && (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No activity found for this filter</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between bg-gray-50">
          <div className="text-sm text-gray-600">
            Showing {filteredLog.length} of {mockActivityLog.length} activities
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewActivityLogModal;
