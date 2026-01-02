import React, { useState, useEffect } from 'react';
import {
  Clock, User, Shield, Edit, Trash2, Plus, CheckCircle, XCircle,
  MessageSquare, AtSign, Filter, Download, RefreshCw, Search, ChevronDown
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AuditEntry {
  id: string;
  action_type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity_type: string;
  entity_id: string;
  actor_id: string;
  actor_name?: string;
  before_state: any;
  after_state: any;
  timestamp: string;
  ip_address?: string;
}

interface Comment {
  id: string;
  entity_type: string;
  entity_id: string;
  comment_text: string;
  mentions: string[];
  author_id: string;
  author_name?: string;
  created_at: string;
}

interface ApprovalWorkflow {
  id: string;
  entity_type: string;
  entity_id: string;
  requested_changes: any;
  requester_id: string;
  requester_name?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewer_id?: string;
  reviewer_name?: string;
  review_notes?: string;
  requested_at: string;
  reviewed_at?: string;
}

export const AuditFeed: React.FC = () => {
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [approvals, setApprovals] = useState<ApprovalWorkflow[]>([]);
  const [activeTab, setActiveTab] = useState<'audit' | 'comments' | 'approvals'>('audit');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');

  useEffect(() => {
    loadAuditData();
  }, []);

  const loadAuditData = async () => {
    setLoading(true);
    try {
      const [auditResult, commentsResult, approvalsResult] = await Promise.all([
        supabase.from('permission_audit_log').select('*').order('timestamp', { ascending: false }).limit(50),
        supabase.from('permission_comments').select('*').order('created_at', { ascending: false }),
        supabase.from('permission_approval_workflows').select('*').order('requested_at', { ascending: false })
      ]);

      if (auditResult.data) {
        const enrichedAudit = auditResult.data.map((entry: any) => ({
          ...entry,
          actor_name: `User ${entry.actor_id.slice(0, 8)}`
        }));
        setAuditEntries(enrichedAudit);
      }

      if (commentsResult.data) {
        const enrichedComments = commentsResult.data.map((comment: any) => ({
          ...comment,
          author_name: `User ${comment.author_id.slice(0, 8)}`
        }));
        setComments(enrichedComments);
      }

      if (approvalsResult.data) {
        const enrichedApprovals = approvalsResult.data.map((approval: any) => ({
          ...approval,
          requester_name: `User ${approval.requester_id.slice(0, 8)}`,
          reviewer_name: approval.reviewer_id ? `User ${approval.reviewer_id.slice(0, 8)}` : undefined
        }));
        setApprovals(enrichedApprovals);
      }
    } catch (error) {
      console.error('Error loading audit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;

    try {
      const mentions = newComment.match(/@\w+/g) || [];

      const { data, error } = await supabase
        .from('permission_comments')
        .insert([{
          entity_type: 'role',
          entity_id: selectedEntityId || 'default',
          comment_text: newComment,
          mentions: mentions.map(m => m.slice(1)),
          author_id: 'current-user-id'
        }])
        .select()
        .single();

      if (error) throw error;

      setComments([{ ...data, author_name: 'You' }, ...comments]);
      setNewComment('');
      setShowCommentModal(false);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleApproval = async (approvalId: string, status: 'approved' | 'rejected', notes: string) => {
    try {
      const { error } = await supabase
        .from('permission_approval_workflows')
        .update({
          status,
          reviewer_id: 'current-user-id',
          review_notes: notes,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', approvalId);

      if (error) throw error;

      setApprovals(approvals.map(a =>
        a.id === approvalId
          ? { ...a, status, review_notes: notes, reviewed_at: new Date().toISOString(), reviewer_name: 'You' }
          : a
      ));
    } catch (error) {
      console.error('Error updating approval:', error);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'CREATE': return <Plus className="h-5 w-5 text-green-600" />;
      case 'UPDATE': return <Edit className="h-5 w-5 text-blue-600" />;
      case 'DELETE': return <Trash2 className="h-5 w-5 text-red-600" />;
      default: return <Shield className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-orange-100 text-orange-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return badges[status as keyof typeof badges] || badges.pending;
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
    return date.toLocaleDateString();
  };

  const filteredEntries = auditEntries.filter(entry => {
    const matchesSearch =
      entry.entity_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.action_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || entry.action_type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="h-full flex bg-gray-50">
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Audit & Collaboration</h2>
              <p className="text-sm text-gray-600 mt-1">Track changes and collaborate with your team</p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={loadAuditData}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Refresh"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              <button
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Export audit log"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  activeTab === 'audit' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
                aria-pressed={activeTab === 'audit'}
              >
                <Clock className="h-4 w-4 inline mr-2" />
                Audit Log
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  activeTab === 'comments' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
                aria-pressed={activeTab === 'comments'}
              >
                <MessageSquare className="h-4 w-4 inline mr-2" />
                Comments ({comments.length})
              </button>
              <button
                onClick={() => setActiveTab('approvals')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  activeTab === 'approvals' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
                aria-pressed={activeTab === 'approvals'}
              >
                <Shield className="h-4 w-4 inline mr-2" />
                Approvals ({approvals.filter(a => a.status === 'pending').length})
              </button>
            </div>

            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Search audit log"
              />
            </div>

            {activeTab === 'audit' && (
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Filter by action type"
              >
                <option value="all">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
              </select>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'audit' && (
            <div className="space-y-3">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-gray-600">No audit entries found</p>
                </div>
              ) : (
                filteredEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">{getActionIcon(entry.action_type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {entry.action_type} {entry.entity_type}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              by <span className="font-medium">{entry.actor_name}</span>
                            </p>
                          </div>
                          <span className="text-sm text-gray-500 whitespace-nowrap">
                            {formatTimestamp(entry.timestamp)}
                          </span>
                        </div>

                        {entry.action_type === 'UPDATE' && entry.before_state && entry.after_state && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs font-medium text-gray-700 mb-2">Changes:</p>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <span className="text-red-600 font-medium">Before:</span>
                                <pre className="mt-1 text-gray-600 overflow-x-auto">
                                  {JSON.stringify(entry.before_state, null, 2)}
                                </pre>
                              </div>
                              <div>
                                <span className="text-green-600 font-medium">After:</span>
                                <pre className="mt-1 text-gray-600 overflow-x-auto">
                                  {JSON.stringify(entry.after_state, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </div>
                        )}

                        {entry.ip_address && (
                          <p className="text-xs text-gray-500 mt-2">IP: {entry.ip_address}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-3">
              <button
                onClick={() => setShowCommentModal(true)}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Plus className="h-5 w-5" />
                <span>Add Comment</span>
              </button>

              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {comment.author_name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900">{comment.author_name}</span>
                        <span className="text-sm text-gray-500">{formatTimestamp(comment.created_at)}</span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{comment.comment_text}</p>
                      {comment.mentions.length > 0 && (
                        <div className="mt-2 flex items-center space-x-2">
                          <AtSign className="h-4 w-4 text-gray-400" />
                          <div className="flex flex-wrap gap-2">
                            {comment.mentions.map((mention, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                @{mention}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'approvals' && (
            <div className="space-y-3">
              {approvals.map((approval) => (
                <div
                  key={approval.id}
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(approval.status)}`}>
                          {approval.status.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-600">{approval.entity_type}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Requested by <span className="font-medium">{approval.requester_name}</span>
                      </p>
                    </div>
                    <span className="text-sm text-gray-500">{formatTimestamp(approval.requested_at)}</span>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-xs font-medium text-gray-700 mb-1">Requested Changes:</p>
                    <pre className="text-xs text-gray-600 overflow-x-auto">
                      {JSON.stringify(approval.requested_changes, null, 2)}
                    </pre>
                  </div>

                  {approval.status === 'pending' && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleApproval(approval.id, 'approved', 'Approved')}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleApproval(approval.id, 'rejected', 'Rejected')}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}

                  {approval.status !== 'pending' && approval.review_notes && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-600">
                        Reviewed by <span className="font-medium">{approval.reviewer_name}</span>
                        {' on '}{new Date(approval.reviewed_at!).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">{approval.review_notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCommentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Add Comment</h3>
              <button
                onClick={() => setShowCommentModal(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Write a comment... Use @mention to notify team members"
              />
              <p className="text-xs text-gray-500 mt-2">
                Tip: Use @username to mention team members
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowCommentModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={addComment}
                disabled={!newComment.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Post Comment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
