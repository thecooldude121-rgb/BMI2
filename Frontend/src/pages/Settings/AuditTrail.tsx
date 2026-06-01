import React, { useState, useEffect } from 'react';
import {
  Clock, User, Shield, Filter, Search, Download, RefreshCw,
  ChevronDown, X, Calendar, Activity, FileText, Eye, ArrowRight,
  AlertCircle, CheckCircle, Trash2, Copy, Plus, Edit
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import BreadcrumbNav from '../../components/navigation/BreadcrumbNav';

interface AuditLog {
  id: string;
  timestamp: string;
  user_id: string | null;
  user_name: string;
  action_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'ASSIGN' | 'REVOKE' | 'COPY' | 'APPLY';
  entity_type: 'ROLE' | 'PERMISSION' | 'USER_ROLE' | 'PERMISSION_SET' | 'FIELD_PERMISSION' | 'MODULE_PERMISSION';
  entity_id: string;
  entity_name: string;
  before_state: any;
  after_state: any;
  changes_summary: string;
  ip_address: string | null;
  metadata: any;
  created_at: string;
}

const AuditTrail: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionType, setSelectedActionType] = useState<string>('all');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDiffModal, setShowDiffModal] = useState(false);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [auditLogs, searchQuery, selectedActionType, selectedEntityType, selectedUser, dateFrom, dateTo]);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(500);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...auditLogs];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log =>
        log.entity_name.toLowerCase().includes(query) ||
        log.user_name.toLowerCase().includes(query) ||
        log.changes_summary.toLowerCase().includes(query)
      );
    }

    if (selectedActionType !== 'all') {
      filtered = filtered.filter(log => log.action_type === selectedActionType);
    }

    if (selectedEntityType !== 'all') {
      filtered = filtered.filter(log => log.entity_type === selectedEntityType);
    }

    if (selectedUser !== 'all') {
      filtered = filtered.filter(log => log.user_name === selectedUser);
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter(log => new Date(log.timestamp) >= fromDate);
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(log => new Date(log.timestamp) <= toDate);
    }

    setFilteredLogs(filtered);
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'CREATE': return <Plus className="h-4 w-4" />;
      case 'UPDATE': return <Edit className="h-4 w-4" />;
      case 'DELETE': return <Trash2 className="h-4 w-4" />;
      case 'ASSIGN': return <CheckCircle className="h-4 w-4" />;
      case 'REVOKE': return <X className="h-4 w-4" />;
      case 'COPY': return <Copy className="h-4 w-4" />;
      case 'APPLY': return <CheckCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'CREATE': return 'text-green-600 bg-green-50';
      case 'UPDATE': return 'text-blue-600 bg-blue-50';
      case 'DELETE': return 'text-red-600 bg-red-50';
      case 'ASSIGN': return 'text-purple-600 bg-purple-50';
      case 'REVOKE': return 'text-orange-600 bg-orange-50';
      case 'COPY': return 'text-cyan-600 bg-cyan-50';
      case 'APPLY': return 'text-indigo-600 bg-indigo-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const uniqueUsers = Array.from(new Set(auditLogs.map(log => log.user_name))).sort();

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity Name', 'Summary', 'IP Address'].join(','),
      ...filteredLogs.map(log => [
        log.timestamp,
        log.user_name,
        log.action_type,
        log.entity_type,
        log.entity_name,
        `"${log.changes_summary}"`,
        log.ip_address || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const viewDiff = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDiffModal(true);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedActionType('all');
    setSelectedEntityType('all');
    setSelectedUser('all');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = searchQuery || selectedActionType !== 'all' ||
    selectedEntityType !== 'all' || selectedUser !== 'all' || dateFrom || dateTo;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <BreadcrumbNav items={[
        { label: 'Settings', onClick: () => window.history.back() },
        { label: 'Audit Trail', current: true }
      ]} />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Activity className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Audit Trail</h2>
              <p className="text-sm text-gray-600">
                {filteredLogs.length} of {auditLogs.length} changes
                {hasActiveFilters && ' (filtered)'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={loadAuditLogs}
              className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>

            <button
              onClick={exportLogs}
              className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-2 rounded-lg border ${
                showFilters || hasActiveFilters
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                  {[searchQuery, selectedActionType !== 'all', selectedEntityType !== 'all',
                    selectedUser !== 'all', dateFrom, dateTo].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search entity, user, or summary..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action Type
                </label>
                <select
                  value={selectedActionType}
                  onChange={(e) => setSelectedActionType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Actions</option>
                  <option value="CREATE">Create</option>
                  <option value="UPDATE">Update</option>
                  <option value="DELETE">Delete</option>
                  <option value="ASSIGN">Assign</option>
                  <option value="REVOKE">Revoke</option>
                  <option value="COPY">Copy</option>
                  <option value="APPLY">Apply</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entity Type
                </label>
                <select
                  value={selectedEntityType}
                  onChange={(e) => setSelectedEntityType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="ROLE">Role</option>
                  <option value="PERMISSION">Permission</option>
                  <option value="USER_ROLE">User Role</option>
                  <option value="PERMISSION_SET">Permission Set</option>
                  <option value="FIELD_PERMISSION">Field Permission</option>
                  <option value="MODULE_PERMISSION">Module Permission</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Users</option>
                  {uniqueUsers.map(user => (
                    <option key={user} value={user}>{user}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-300">
                <span className="text-sm text-gray-600">
                  {filteredLogs.length} result{filteredLogs.length !== 1 ? 's' : ''} found
                </span>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Audit Log List */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" />
              <p className="text-gray-600">Loading audit logs...</p>
            </div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-900 font-medium mb-1">No audit logs found</p>
              <p className="text-gray-600 text-sm">
                {hasActiveFilters ? 'Try adjusting your filters' : 'Changes will appear here once made'}
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => viewDiff(log)}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg ${getActionColor(log.action_type)}`}>
                    {getActionIcon(log.action_type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${getActionColor(log.action_type)}`}>
                            {log.action_type}
                          </span>
                          <span className="px-2 py-0.5 text-xs font-medium text-gray-700 bg-gray-100 rounded">
                            {log.entity_type.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900">{log.entity_name}</p>
                        <p className="text-sm text-gray-600 mt-1">{log.changes_summary}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{log.user_name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimestamp(log.timestamp)}</span>
                      </div>
                      {log.ip_address && (
                        <div className="flex items-center space-x-1">
                          <Shield className="h-3 w-3" />
                          <span>{log.ip_address}</span>
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          viewDiff(log);
                        }}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <Eye className="h-3 w-3" />
                        <span>View Details</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Diff Modal */}
      {showDiffModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Change Details</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedLog.entity_name}</p>
              </div>
              <button
                onClick={() => setShowDiffModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <User className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">User</span>
                  </div>
                  <p className="text-gray-900">{selectedLog.user_name}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Clock className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Timestamp</span>
                  </div>
                  <p className="text-gray-900">
                    {new Date(selectedLog.timestamp).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'medium'
                    })}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Activity className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Action</span>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-sm font-medium rounded ${getActionColor(selectedLog.action_type)}`}>
                    {selectedLog.action_type}
                  </span>
                </div>

                {selectedLog.ip_address && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <Shield className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">IP Address</span>
                    </div>
                    <p className="text-gray-900 font-mono text-sm">{selectedLog.ip_address}</p>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <FileText className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-900 mb-1">Summary</p>
                    <p className="text-sm text-blue-800">{selectedLog.changes_summary}</p>
                  </div>
                </div>
              </div>

              {/* State Comparison */}
              {(selectedLog.before_state || selectedLog.after_state) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <span className="text-red-600 mr-2">Before</span>
                      {selectedLog.action_type === 'CREATE' && (
                        <span className="text-xs text-gray-500">(did not exist)</span>
                      )}
                    </h4>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      {selectedLog.before_state ? (
                        <pre className="text-xs text-gray-800 overflow-auto whitespace-pre-wrap">
                          {JSON.stringify(selectedLog.before_state, null, 2)}
                        </pre>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No previous state</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <span className="text-green-600 mr-2">After</span>
                      {selectedLog.action_type === 'DELETE' && (
                        <span className="text-xs text-gray-500">(deleted)</span>
                      )}
                    </h4>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      {selectedLog.after_state ? (
                        <pre className="text-xs text-gray-800 overflow-auto whitespace-pre-wrap">
                          {JSON.stringify(selectedLog.after_state, null, 2)}
                        </pre>
                      ) : (
                        <p className="text-sm text-gray-500 italic">Entity deleted</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowDiffModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditTrail;
