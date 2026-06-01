import React, { useState } from 'react';
import {
  List, Plus, Search, Filter, Download, Upload, Eye, Edit,
  Trash2, Copy, Users, Target, Clock, TrendingUp, Star,
  Zap, Tag, Calendar, MoreHorizontal, X, Settings, Play,
  Pause, CheckCircle, AlertCircle, Globe, Building, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LeadList } from '../../types/leadGeneration';

const ListsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedLists, setSelectedLists] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Mock lists data
  const mockLists: LeadList[] = [
    {
      id: '1',
      name: 'Enterprise CTOs',
      description: 'Chief Technology Officers at enterprise companies (500+ employees)',
      type: 'dynamic',
      filters: [
        { field: 'title', operator: 'contains', value: 'CTO' },
        { field: 'companySize', operator: 'in', values: ['500-1000', '1000+'] }
      ],
      prospectIds: [],
      prospectCount: 1247,
      lastUpdated: '2024-01-20T09:00:00Z',
      ownerId: 'user1',
      isShared: true,
      sharedWith: ['team1'],
      activeSequences: ['Enterprise Outreach'],
      tags: ['enterprise', 'technology'],
      folder: 'Target Accounts',
      createdAt: '2024-01-10T09:00:00Z',
      updatedAt: '2024-01-20T09:00:00Z'
    },
    {
      id: '2',
      name: 'Healthcare Decision Makers',
      description: 'VPs and Directors in healthcare organizations',
      type: 'dynamic',
      filters: [
        { field: 'industry', operator: 'equals', value: 'Healthcare' },
        { field: 'seniority', operator: 'in', values: ['VP', 'Director'] }
      ],
      prospectIds: [],
      prospectCount: 892,
      lastUpdated: '2024-01-19T14:30:00Z',
      ownerId: 'user2',
      isShared: false,
      sharedWith: [],
      activeSequences: ['Healthcare Decision Makers'],
      tags: ['healthcare', 'decision-makers'],
      folder: 'Industry Specific',
      createdAt: '2024-01-08T11:00:00Z',
      updatedAt: '2024-01-19T14:30:00Z'
    },
    {
      id: '3',
      name: 'Demo Attendees - Q1',
      description: 'Prospects who attended product demos in Q1',
      type: 'static',
      filters: [],
      prospectIds: ['1', '2', '3', '4', '5'],
      prospectCount: 45,
      lastUpdated: '2024-01-18T16:20:00Z',
      ownerId: 'user1',
      isShared: true,
      sharedWith: ['user2', 'user3'],
      activeSequences: [],
      tags: ['demo', 'qualified'],
      folder: 'Events',
      createdAt: '2024-01-05T10:00:00Z',
      updatedAt: '2024-01-18T16:20:00Z'
    },
    {
      id: '4',
      name: 'High-Intent Prospects',
      description: 'AI-identified prospects with high purchase intent',
      type: 'smart',
      filters: [
        { field: 'aiScore', operator: 'greater_than', value: 85 },
        { field: 'engagementLevel', operator: 'equals', value: 'high' }
      ],
      prospectIds: [],
      prospectCount: 156,
      lastUpdated: '2024-01-20T12:00:00Z',
      ownerId: 'user1',
      isShared: false,
      sharedWith: [],
      activeSequences: ['High-Intent Follow-up'],
      tags: ['ai', 'high-intent'],
      folder: 'AI Generated',
      createdAt: '2024-01-15T14:00:00Z',
      updatedAt: '2024-01-20T12:00:00Z'
    }
  ];

  const [lists] = useState<LeadList[]>(mockLists);

  const filteredLists = lists.filter(list => {
    const matchesSearch = list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         list.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || list.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleSelectList = (listId: string) => {
    setSelectedLists(prev =>
      prev.includes(listId)
        ? prev.filter(id => id !== listId)
        : [...prev, listId]
    );
  };

  const handleSelectAll = () => {
    if (selectedLists.length === filteredLists.length) {
      setSelectedLists([]);
    } else {
      setSelectedLists(filteredLists.map(l => l.id));
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      static: 'bg-blue-100 text-blue-800 border-blue-200',
      dynamic: 'bg-green-100 text-green-800 border-green-200',
      smart: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'static':
        return <List className="h-4 w-4" />;
      case 'dynamic':
        return <Target className="h-4 w-4" />;
      case 'smart':
        return <Zap className="h-4 w-4" />;
      default:
        return <List className="h-4 w-4" />;
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
                <List className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Lists</h1>
                <p className="text-gray-600 text-lg">Organize and manage your prospect lists</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="flex items-center px-4 py-3 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm bg-white">
                <Upload className="h-4 w-4 mr-2" />
                Import List
              </button>
              
              <button className="flex items-center px-4 py-3 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm bg-white">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl text-sm hover:from-green-700 hover:to-blue-700 transition-all shadow-md"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create List
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
                  placeholder="Search lists..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-96 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                />
              </div>
              
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
              >
                <option value="all">All Types</option>
                <option value="static">Static Lists</option>
                <option value="dynamic">Dynamic Lists</option>
                <option value="smart">Smart Lists</option>
              </select>
              
              <button className="flex items-center px-4 py-2.5 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm bg-white">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </button>
            </div>

            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <span>{filteredLists.length} of {lists.length} lists</span>
              {selectedLists.length > 0 && (
                <>
                  <span>•</span>
                  <span>{selectedLists.length} selected</span>
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
                <p className="text-sm font-medium text-gray-600">Total Lists</p>
                <p className="text-3xl font-bold text-gray-900">{lists.length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <List className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Prospects</p>
                <p className="text-3xl font-bold text-gray-900">
                  {lists.reduce((sum, l) => sum + l.prospectCount, 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Sequences</p>
                <p className="text-3xl font-bold text-gray-900">
                  {lists.filter(l => l.activeSequences.length > 0).length}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Zap className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Shared Lists</p>
                <p className="text-3xl font-bold text-gray-900">
                  {lists.filter(l => l.isShared).length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Globe className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Lists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLists.map((list) => (
            <div key={list.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedLists.includes(list.id)}
                    onChange={() => handleSelectList(list.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="p-2 bg-green-100 rounded-lg">
                    {getTypeIcon(list.type)}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(list.type)}`}>
                    {list.type}
                  </span>
                  {list.isShared && (
                    <Globe className="h-4 w-4 text-blue-600" title="Shared list" />
                  )}
                </div>
              </div>

              {/* List Info */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{list.name}</h3>
                <p className="text-sm text-gray-600">{list.description}</p>
                {list.folder && (
                  <p className="text-xs text-gray-500 mt-1">📁 {list.folder}</p>
                )}
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-lg font-bold text-blue-600">{list.prospectCount.toLocaleString()}</p>
                  <p className="text-xs text-gray-600">Prospects</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-lg font-bold text-green-600">{list.activeSequences.length}</p>
                  <p className="text-xs text-gray-600">Sequences</p>
                </div>
              </div>

              {/* Active Sequences */}
              {list.activeSequences.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">Active Sequences:</p>
                  <div className="space-y-1">
                    {list.activeSequences.map(sequence => (
                      <div key={sequence} className="flex items-center space-x-2 p-2 bg-orange-50 border border-orange-200 rounded">
                        <Zap className="h-3 w-3 text-orange-600" />
                        <span className="text-xs font-medium text-gray-900">{sequence}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {list.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {list.tags.map(tag => (
                    <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2">
                <button className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </button>
                <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                  <Edit className="h-4 w-4" />
                </button>
                <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                  <Copy className="h-4 w-4" />
                </button>
                <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                <span>Updated {new Date(list.lastUpdated).toLocaleDateString()}</span>
                <span>Owner: {list.ownerId}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Bulk Actions Bar */}
        {selectedLists.length > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-200 px-6 py-4 z-50">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">
                {selectedLists.length} list{selectedLists.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex space-x-2">
                <button className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                  Add to Sequence
                </button>
                <button className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
                  Merge Lists
                </button>
                <button className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors">
                  Share
                </button>
                <button className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </button>
              </div>
              <button
                onClick={() => setSelectedLists([])}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredLists.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <List className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No lists found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || typeFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first list to organize prospects'
              }
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2 inline" />
              Create Your First List
            </button>
          </div>
        )}
      </div>

      {/* Create List Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create New List</h2>
              <button onClick={() => setShowCreateModal(false)}>
                <X className="h-6 w-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">List Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter list name..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Describe this list..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">List Type</label>
                <div className="grid grid-cols-3 gap-3">
                  <button className="p-4 border border-gray-200 rounded-xl text-center hover:bg-gray-50 transition-colors">
                    <List className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm font-medium">Static</p>
                    <p className="text-xs text-gray-500">Manual list</p>
                  </button>
                  <button className="p-4 border border-blue-500 bg-blue-50 rounded-xl text-center">
                    <Target className="h-6 w-6 mx-auto mb-2 text-green-600" />
                    <p className="text-sm font-medium">Dynamic</p>
                    <p className="text-xs text-gray-500">Filter-based</p>
                  </button>
                  <button className="p-4 border border-gray-200 rounded-xl text-center hover:bg-gray-50 transition-colors">
                    <Zap className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                    <p className="text-sm font-medium">Smart</p>
                    <p className="text-xs text-gray-500">AI-powered</p>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button className="px-6 py-3 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors">
                Create List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListsPage;