import React, { useState } from 'react';
import {
  Mail, Plus, Search, Filter, Download, Upload, Eye, Edit,
  Trash2, Send, Archive, Star, Clock, Users, TrendingUp,
  Tag, Calendar, MoreHorizontal, X, Settings, RefreshCw,
  Paperclip, Reply, Forward, CheckCircle, AlertCircle, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Email } from '../../types/leadGeneration';

const EmailsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCompose, setShowCompose] = useState(false);

  // Mock emails data
  const mockEmails: Email[] = [
    {
      id: '1',
      fromEmail: 'john@company.com',
      toEmails: ['sarah.chen@techcorp.com'],
      ccEmails: [],
      bccEmails: [],
      subject: 'Partnership Opportunity with TechCorp',
      body: 'Hi Sarah,\n\nI hope this email finds you well. I wanted to reach out regarding a potential partnership opportunity...',
      htmlBody: '<p>Hi Sarah,</p><p>I hope this email finds you well. I wanted to reach out regarding a potential partnership opportunity...</p>',
      threadId: 'thread-1',
      messageId: 'msg-1',
      status: 'sent',
      direction: 'outbound',
      sentAt: '2024-01-20T10:00:00Z',
      deliveredAt: '2024-01-20T10:01:00Z',
      openedAt: '2024-01-20T10:15:00Z',
      opens: [
        { timestamp: '2024-01-20T10:15:00Z', ipAddress: '192.168.1.1', location: 'San Francisco, CA' }
      ],
      clicks: [],
      prospectIds: ['prospect-1'],
      companyId: 'comp-1',
      attachments: [],
      tags: ['outreach', 'partnership'],
      ownerId: 'user-1',
      createdAt: '2024-01-20T09:55:00Z',
      updatedAt: '2024-01-20T10:15:00Z'
    },
    {
      id: '2',
      fromEmail: 'sarah.chen@techcorp.com',
      toEmails: ['john@company.com'],
      ccEmails: [],
      bccEmails: [],
      subject: 'Re: Partnership Opportunity with TechCorp',
      body: 'Hi John,\n\nThank you for reaching out. I\'m interested in learning more about this opportunity...',
      threadId: 'thread-1',
      messageId: 'msg-2',
      inReplyTo: 'msg-1',
      status: 'delivered',
      direction: 'inbound',
      sentAt: '2024-01-20T14:30:00Z',
      deliveredAt: '2024-01-20T14:31:00Z',
      opens: [],
      clicks: [],
      prospectIds: ['prospect-1'],
      companyId: 'comp-1',
      attachments: [],
      tags: ['reply', 'interested'],
      ownerId: 'user-1',
      createdAt: '2024-01-20T14:30:00Z',
      updatedAt: '2024-01-20T14:31:00Z'
    }
  ];

  const [emails] = useState<Email[]>(mockEmails);

  const filteredEmails = emails.filter(email => {
    const matchesSearch = email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.fromEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.toEmails.some(to => to.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || email.status === statusFilter;
    const matchesType = typeFilter === 'all' || email.direction === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleSelectEmail = (emailId: string) => {
    setSelectedEmails(prev =>
      prev.includes(emailId)
        ? prev.filter(id => id !== emailId)
        : [...prev, emailId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmails.length === filteredEmails.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(filteredEmails.map(e => e.id));
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800 border-gray-200',
      scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
      sent: 'bg-green-100 text-green-800 border-green-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      opened: 'bg-purple-100 text-purple-800 border-purple-200',
      clicked: 'bg-orange-100 text-orange-800 border-orange-200',
      replied: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      bounced: 'bg-red-100 text-red-800 border-red-200',
      spam: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <Send className="h-4 w-4 text-green-600" />;
      case 'opened':
        return <Eye className="h-4 w-4 text-purple-600" />;
      case 'replied':
        return <Reply className="h-4 w-4 text-emerald-600" />;
      case 'bounced':
      case 'spam':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'draft':
        return <Edit className="h-4 w-4 text-gray-600" />;
      default:
        return <Mail className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Go back"
              >
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </button>
              <div className="p-3 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl">
                <Mail className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Emails</h1>
                <p className="text-gray-600 text-lg">Manage email communications and campaigns</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="flex items-center px-4 py-3 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm bg-white">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </button>
              
              <button className="flex items-center px-4 py-3 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm bg-white">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              
              <button
                onClick={() => setShowCompose(true)}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl text-sm hover:from-green-700 hover:to-blue-700 transition-all shadow-md"
              >
                <Plus className="h-4 w-4 mr-2" />
                Compose Email
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-96 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="delivered">Delivered</option>
                <option value="opened">Opened</option>
                <option value="replied">Replied</option>
                <option value="bounced">Bounced</option>
              </select>
              
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
              >
                <option value="all">All Types</option>
                <option value="outbound">Outbound</option>
                <option value="inbound">Inbound</option>
              </select>
              
              <button className="flex items-center px-4 py-2.5 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm bg-white">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </button>
            </div>

            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <span>{filteredEmails.length} of {emails.length} emails</span>
              {selectedEmails.length > 0 && (
                <>
                  <span>•</span>
                  <span>{selectedEmails.length} selected</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Emails</p>
                <p className="text-3xl font-bold text-gray-900">{emails.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sent Today</p>
                <p className="text-3xl font-bold text-gray-900">
                  {emails.filter(e => e.status === 'sent' || e.status === 'delivered').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Send className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open Rate</p>
                <p className="text-3xl font-bold text-gray-900">
                  {emails.length > 0 ? Math.round((emails.filter(e => e.openedAt).length / emails.length) * 100) : 0}%
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Eye className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Reply Rate</p>
                <p className="text-3xl font-bold text-gray-900">
                  {emails.length > 0 ? Math.round((emails.filter(e => e.status === 'replied').length / emails.length) * 100) : 0}%
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Reply className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Emails List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Email Communications</h3>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedEmails.length === filteredEmails.length && filteredEmails.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-600">{filteredEmails.length} emails</span>
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredEmails.map((email) => (
              <div key={email.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedEmails.includes(email.id)}
                    onChange={() => handleSelectEmail(email.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(email.status)}
                        <h4 className="text-lg font-semibold text-gray-900">{email.subject}</h4>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(email.status)}`}>
                          {email.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">
                          {email.sentAt ? new Date(email.sentAt).toLocaleString() : 'Not sent'}
                        </span>
                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 mb-3 text-sm text-gray-600">
                      <span>
                        <strong>From:</strong> {email.fromEmail}
                      </span>
                      <span>
                        <strong>To:</strong> {email.toEmails.join(', ')}
                      </span>
                      {email.direction === 'outbound' && email.opens.length > 0 && (
                        <span className="text-purple-600">
                          Opened {email.opens.length} time{email.opens.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-gray-700 mb-3">
                      {email.body.length > 200 ? (
                        <>
                          {email.body.substring(0, 200)}...
                          <button className="text-blue-600 hover:text-blue-800 ml-2">Read more</button>
                        </>
                      ) : (
                        email.body
                      )}
                    </div>
                    
                    {email.attachments.length > 0 && (
                      <div className="flex items-center space-x-2 mb-3">
                        <Paperclip className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {email.attachments.length} attachment{email.attachments.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                    
                    {email.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {email.tags.map(tag => (
                          <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors">
                      <Reply className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors">
                      <Forward className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                      <Archive className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedEmails.length > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-200 px-6 py-4 z-50">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">
                {selectedEmails.length} email{selectedEmails.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex space-x-2">
                <button className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                  Mark as Read
                </button>
                <button className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
                  Archive
                </button>
                <button className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors">
                  Add Tags
                </button>
                <button className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </button>
              </div>
              <button
                onClick={() => setSelectedEmails([])}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredEmails.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No emails found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start by composing your first email'
              }
            </p>
            <button
              onClick={() => setShowCompose(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2 inline" />
              Compose Email
            </button>
          </div>
        )}
      </div>

      {/* Compose Email Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Compose Email</h2>
              <button onClick={() => setShowCompose(false)}>
                <X className="h-6 w-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                  <input
                    type="email"
                    className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="recipient@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <input
                    type="text"
                    className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Email subject..."
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  rows={12}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Compose your email..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => setShowCompose(false)}
                className="px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailsPage;