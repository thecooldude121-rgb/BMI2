import React, { useState, useMemo } from 'react';
import { X, Download, Search, Shield, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  userAffected: string;
  performedBy?: string;
  ipAddress?: string;
  device?: string;
  beforeValue?: string;
  afterValue?: string;
  status: 'success' | 'failure';
  details?: string;
}

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (entries: AuditLogEntry[], dateRange: string) => void;
}

const AuditLogModal: React.FC<AuditLogModalProps> = ({
  isOpen,
  onClose,
  onExport
}) => {
  const [actionFilter, setActionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('30');
  const [searchQuery, setSearchQuery] = useState('');
  const [displayLimit, setDisplayLimit] = useState(10);

  if (!isOpen) return null;

  const allAuditEntries: AuditLogEntry[] = [
    {
      id: '1',
      timestamp: '2024-12-13T09:45:00',
      action: 'User Login',
      userAffected: 'Alex Rodriguez',
      ipAddress: '192.168.1.105',
      device: 'Chrome on Windows',
      status: 'success',
      details: 'Successful login from trusted location'
    },
    {
      id: '2',
      timestamp: '2024-12-13T09:30:00',
      action: 'User Login',
      userAffected: 'Sarah Chen',
      ipAddress: '192.168.1.102',
      device: 'Safari on macOS',
      status: 'success',
      details: 'Successful login from office network'
    },
    {
      id: '3',
      timestamp: '2024-12-13T08:15:00',
      action: 'User Login',
      userAffected: 'Mike Johnson',
      ipAddress: '192.168.1.108',
      device: 'Chrome on macOS',
      status: 'success',
      details: 'Successful login via SSO'
    },
    {
      id: '4',
      timestamp: '2024-12-12T14:15:00',
      action: 'Role Changed',
      userAffected: 'Alex Rodriguez',
      performedBy: 'Admin User',
      beforeValue: 'Sales Rep',
      afterValue: 'Sales Manager',
      ipAddress: '192.168.1.100',
      status: 'success',
      details: 'Role updated due to promotion'
    },
    {
      id: '5',
      timestamp: '2024-12-10T16:30:00',
      action: 'User Added',
      userAffected: 'Emily Davis',
      performedBy: 'Admin User',
      ipAddress: '192.168.1.100',
      status: 'success',
      details: 'New user created with Sales Rep role'
    },
    {
      id: '6',
      timestamp: '2024-12-08T11:00:00',
      action: 'Password Reset',
      userAffected: 'Mike Johnson',
      performedBy: 'Admin User',
      ipAddress: '192.168.1.100',
      status: 'success',
      details: 'Password reset initiated by admin'
    },
    {
      id: '7',
      timestamp: '2024-12-07T15:45:00',
      action: 'Failed Login Attempt',
      userAffected: 'Unknown User',
      ipAddress: '203.0.113.45',
      device: 'Chrome on Windows',
      status: 'failure',
      details: 'Invalid credentials - username: test@example.com'
    },
    {
      id: '8',
      timestamp: '2024-12-06T10:20:00',
      action: 'User Edited',
      userAffected: 'Sarah Chen',
      performedBy: 'Admin User',
      beforeValue: 'sarah.chen@company.com',
      afterValue: 'sarah.chen@newcompany.com',
      ipAddress: '192.168.1.100',
      status: 'success',
      details: 'Email address updated'
    },
    {
      id: '9',
      timestamp: '2024-12-05T13:10:00',
      action: 'Permission Changed',
      userAffected: 'Mike Johnson',
      performedBy: 'Admin User',
      beforeValue: 'Basic Access',
      afterValue: 'Advanced Reports Access',
      ipAddress: '192.168.1.100',
      status: 'success',
      details: 'Additional permissions granted'
    },
    {
      id: '10',
      timestamp: '2024-12-04T09:30:00',
      action: 'User Logout',
      userAffected: 'Alex Rodriguez',
      ipAddress: '192.168.1.105',
      status: 'success',
      details: 'Manual logout'
    },
    {
      id: '11',
      timestamp: '2024-12-03T16:50:00',
      action: 'User Deactivated',
      userAffected: 'John Smith',
      performedBy: 'Admin User',
      ipAddress: '192.168.1.100',
      status: 'success',
      details: 'User deactivated - left company'
    },
    {
      id: '12',
      timestamp: '2024-12-02T11:25:00',
      action: 'Failed Login Attempt',
      userAffected: 'Sarah Chen',
      ipAddress: '192.168.1.102',
      device: 'Safari on macOS',
      status: 'failure',
      details: 'Invalid password - attempt 1 of 5'
    }
  ];

  const filteredEntries = useMemo(() => {
    let filtered = [...allAuditEntries];

    // Filter by action type
    if (actionFilter !== 'all') {
      filtered = filtered.filter(entry => entry.action === actionFilter);
    }

    // Filter by user
    if (userFilter !== 'all') {
      filtered = filtered.filter(entry => entry.userAffected === userFilter);
    }

    // Filter by date range
    const now = new Date();
    const daysAgo = parseInt(dateRangeFilter);
    if (dateRangeFilter !== 'all') {
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(entry => new Date(entry.timestamp) >= cutoffDate);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.action.toLowerCase().includes(query) ||
        entry.userAffected.toLowerCase().includes(query) ||
        entry.details?.toLowerCase().includes(query) ||
        entry.performedBy?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [actionFilter, userFilter, dateRangeFilter, searchQuery]);

  const displayedEntries = filteredEntries.slice(0, displayLimit);
  const hasMore = filteredEntries.length > displayLimit;

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failure':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('Login')) return 'text-blue-700';
    if (action.includes('Added')) return 'text-green-700';
    if (action.includes('Deleted') || action.includes('Deactivated')) return 'text-red-700';
    if (action.includes('Changed') || action.includes('Edited')) return 'text-orange-700';
    if (action.includes('Failed')) return 'text-red-700';
    return 'text-gray-700';
  };

  const uniqueUsers = Array.from(new Set(allAuditEntries.map(e => e.userAffected)));
  const actionTypes = Array.from(new Set(allAuditEntries.map(e => e.action)));

  const handleExport = () => {
    const dateRangeLabel = dateRangeFilter === '7' ? 'Last 7 Days' :
                           dateRangeFilter === '30' ? 'Last 30 Days' :
                           dateRangeFilter === '90' ? 'Last 90 Days' : 'All Time';
    onExport(filteredEntries, dateRangeLabel);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold">User Management Audit Log</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="bg-gray-50 border-b border-gray-200 p-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Filter by Action
              </label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm"
              >
                <option value="all">All Actions</option>
                {actionTypes.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Filter by User
              </label>
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm"
              >
                <option value="all">All Users</option>
                {uniqueUsers.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <select
                value={dateRangeFilter}
                onChange={(e) => setDateRangeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm"
              >
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit log..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
            Audit Entries
          </h3>

          <div className="space-y-3">
            {displayedEntries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(entry.status)}
                      <span className="text-xs text-gray-500">
                        {formatDateTime(entry.timestamp)}
                      </span>
                      <span className={`text-sm font-semibold ${getActionColor(entry.action)}`}>
                        {entry.action}
                      </span>
                    </div>

                    <div className="ml-7 space-y-1">
                      <div className="text-sm">
                        <span className="text-gray-600">User:</span>{' '}
                        <span className="font-medium text-gray-900">{entry.userAffected}</span>
                      </div>

                      {entry.performedBy && (
                        <div className="text-sm">
                          <span className="text-gray-600">Performed by:</span>{' '}
                          <span className="font-medium text-gray-900">{entry.performedBy}</span>
                        </div>
                      )}

                      {entry.ipAddress && (
                        <div className="text-sm">
                          <span className="text-gray-600">IP:</span>{' '}
                          <span className="font-mono text-gray-700">{entry.ipAddress}</span>
                        </div>
                      )}

                      {entry.device && (
                        <div className="text-sm">
                          <span className="text-gray-600">Device:</span>{' '}
                          <span className="text-gray-700">{entry.device}</span>
                        </div>
                      )}

                      {(entry.beforeValue || entry.afterValue) && (
                        <div className="text-sm bg-gray-50 rounded p-2 mt-2">
                          <span className="text-gray-600">Change:</span>{' '}
                          <span className="text-red-600 line-through">{entry.beforeValue}</span>
                          {' → '}
                          <span className="text-green-600 font-medium">{entry.afterValue}</span>
                        </div>
                      )}

                      {entry.details && (
                        <div className="text-sm text-gray-600 italic mt-1">
                          {entry.details}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredEntries.length === 0 && (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No audit entries found matching your filters</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold">{displayedEntries.length}</span> of{' '}
              <span className="font-semibold">{filteredEntries.length}</span> entries
            </p>
            {hasMore && (
              <button
                onClick={() => setDisplayLimit(prev => prev + 10)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
              >
                Load More
              </button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium"
            >
              <Download className="w-4 h-4" />
              Export Audit Log
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogModal;
