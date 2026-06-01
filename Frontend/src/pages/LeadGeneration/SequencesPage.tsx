import React, { useState } from 'react';
import {
  Zap, Plus, Play, Pause, Edit, Trash2, Copy, BarChart3,
  Users, Mail, Clock, TrendingUp, Eye, Settings, Filter,
  Search, Download, Upload, Star, Target, ArrowRight,
  CheckCircle, AlertCircle, Calendar, MessageSquare, Phone, CheckSquare, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EmailSequence } from '../../types/leadGeneration';

const SequencesPage: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSequences, setSelectedSequences] = useState<string[]>([]);

  // Mock sequences data
  const mockSequences: EmailSequence[] = [
    {
      id: '1',
      name: 'Enterprise Outreach',
      description: 'Multi-touch sequence for enterprise prospects',
      steps: [
        {
          id: 'step1',
          stepNumber: 1,
          type: 'email',
          delayDays: 0,
          delayHours: 0,
          sendTime: '10:00',
          timezone: 'America/New_York',
          templateId: 'template1',
          subject: 'Quick question about {{company_name}}',
          conditions: [],
          isActive: true,
          skipWeekends: true,
          respectTimezone: true
        },
        {
          id: 'step2',
          stepNumber: 2,
          type: 'email',
          delayDays: 3,
          delayHours: 0,
          sendTime: '14:00',
          timezone: 'America/New_York',
          templateId: 'template2',
          subject: 'Following up on {{company_name}}',
          conditions: [],
          isActive: true,
          skipWeekends: true,
          respectTimezone: true
        },
        {
          id: 'step3',
          stepNumber: 3,
          type: 'linkedin',
          delayDays: 7,
          delayHours: 0,
          sendTime: '11:00',
          timezone: 'America/New_York',
          conditions: [],
          isActive: true,
          skipWeekends: true,
          respectTimezone: true
        }
      ],
      settings: {
        stopOnReply: true,
        stopOnAutoReply: true,
        stopOnOutOfOffice: false,
        trackOpens: true,
        trackClicks: true,
        respectUnsubscribes: true,
        maxEmailsPerDay: 50,
        sendingSchedule: {
          monday: [{ start: '09:00', end: '17:00' }],
          tuesday: [{ start: '09:00', end: '17:00' }],
          wednesday: [{ start: '09:00', end: '17:00' }],
          thursday: [{ start: '09:00', end: '17:00' }],
          friday: [{ start: '09:00', end: '17:00' }],
          saturday: [],
          sunday: [],
          timezone: 'America/New_York'
        }
      },
      audienceFilters: [],
      excludeFilters: [],
      status: 'active',
      enrolledCount: 245,
      activeCount: 189,
      completedCount: 56,
      repliedCount: 23,
      bouncedCount: 8,
      unsubscribedCount: 3,
      openRate: 42.5,
      clickRate: 8.3,
      replyRate: 9.4,
      bounceRate: 3.3,
      unsubscribeRate: 1.2,
      ownerId: 'user1',
      teamIds: ['team1'],
      tags: ['enterprise', 'outreach'],
      createdAt: '2024-01-10T09:00:00Z',
      updatedAt: '2024-01-20T14:30:00Z',
      lastRunAt: '2024-01-20T09:00:00Z'
    },
    {
      id: '2',
      name: 'Healthcare Decision Makers',
      description: 'Targeted sequence for healthcare industry leaders',
      steps: [
        {
          id: 'step1',
          stepNumber: 1,
          type: 'email',
          delayDays: 0,
          delayHours: 0,
          sendTime: '09:00',
          timezone: 'America/New_York',
          templateId: 'template3',
          subject: 'Healthcare innovation at {{company_name}}',
          conditions: [],
          isActive: true,
          skipWeekends: true,
          respectTimezone: true
        }
      ],
      settings: {
        stopOnReply: true,
        stopOnAutoReply: true,
        stopOnOutOfOffice: false,
        trackOpens: true,
        trackClicks: true,
        respectUnsubscribes: true,
        maxEmailsPerDay: 30,
        sendingSchedule: {
          monday: [{ start: '09:00', end: '17:00' }],
          tuesday: [{ start: '09:00', end: '17:00' }],
          wednesday: [{ start: '09:00', end: '17:00' }],
          thursday: [{ start: '09:00', end: '17:00' }],
          friday: [{ start: '09:00', end: '17:00' }],
          saturday: [],
          sunday: [],
          timezone: 'America/New_York'
        }
      },
      audienceFilters: [],
      excludeFilters: [],
      status: 'active',
      enrolledCount: 156,
      activeCount: 134,
      completedCount: 22,
      repliedCount: 18,
      bouncedCount: 4,
      unsubscribedCount: 2,
      openRate: 38.2,
      clickRate: 6.7,
      replyRate: 11.5,
      bounceRate: 2.6,
      unsubscribeRate: 1.3,
      ownerId: 'user2',
      teamIds: ['team1'],
      tags: ['healthcare', 'decision-makers'],
      createdAt: '2024-01-08T11:00:00Z',
      updatedAt: '2024-01-19T16:20:00Z',
      lastRunAt: '2024-01-19T09:00:00Z'
    },
    {
      id: '3',
      name: 'Tech Startup Founders',
      description: 'Sequence targeting startup founders and CTOs',
      steps: [],
      settings: {
        stopOnReply: true,
        stopOnAutoReply: true,
        stopOnOutOfOffice: false,
        trackOpens: true,
        trackClicks: true,
        respectUnsubscribes: true,
        maxEmailsPerDay: 25,
        sendingSchedule: {
          monday: [{ start: '09:00', end: '17:00' }],
          tuesday: [{ start: '09:00', end: '17:00' }],
          wednesday: [{ start: '09:00', end: '17:00' }],
          thursday: [{ start: '09:00', end: '17:00' }],
          friday: [{ start: '09:00', end: '17:00' }],
          saturday: [],
          sunday: [],
          timezone: 'America/New_York'
        }
      },
      audienceFilters: [],
      excludeFilters: [],
      status: 'draft',
      enrolledCount: 0,
      activeCount: 0,
      completedCount: 0,
      repliedCount: 0,
      bouncedCount: 0,
      unsubscribedCount: 0,
      openRate: 0,
      clickRate: 0,
      replyRate: 0,
      bounceRate: 0,
      unsubscribeRate: 0,
      ownerId: 'user1',
      teamIds: ['team1'],
      tags: ['startup', 'founders'],
      createdAt: '2024-01-15T14:00:00Z',
      updatedAt: '2024-01-15T14:00:00Z'
    }
  ];

  const [sequences] = useState<EmailSequence[]>(mockSequences);

  const filteredSequences = sequences.filter(sequence => {
    const matchesSearch = sequence.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sequence.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sequence.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800 border-green-200',
      paused: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      draft: 'bg-gray-100 text-gray-800 border-gray-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="h-4 w-4 text-green-600" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-600" />;
      case 'draft':
        return <Edit className="h-4 w-4 text-gray-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleSelectSequence = (sequenceId: string) => {
    setSelectedSequences(prev =>
      prev.includes(sequenceId)
        ? prev.filter(id => id !== sequenceId)
        : [...prev, sequenceId]
    );
  };

  const handleSelectAll = () => {
    if (selectedSequences.length === filteredSequences.length) {
      setSelectedSequences([]);
    } else {
      setSelectedSequences(filteredSequences.map(s => s.id));
    }
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredSequences.map((sequence) => (
        <div key={sequence.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={selectedSequences.includes(sequence.id)}
                onChange={() => handleSelectSequence(sequence.id)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="p-2 bg-orange-100 rounded-lg">
                <Zap className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(sequence.status)}
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(sequence.status)}`}>
                {sequence.status}
              </span>
            </div>
          </div>

          {/* Sequence Info */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{sequence.name}</h3>
            <p className="text-sm text-gray-600">{sequence.description}</p>
          </div>

          {/* Steps */}
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <ArrowRight className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">{sequence.steps.length} steps</span>
            </div>
            <div className="flex items-center space-x-1">
              {sequence.steps.slice(0, 5).map((step, index) => {
                const stepIcons = {
                  email: Mail,
                  linkedin: MessageSquare,
                  call: Phone,
                  manual_task: CheckSquare,
                  wait: Clock
                };
                const StepIcon = stepIcons[step.type] || Mail;
                
                return (
                  <div key={step.id} className="flex items-center">
                    <div className="p-1 bg-gray-100 rounded">
                      <StepIcon className="h-3 w-3 text-gray-600" />
                    </div>
                    {index < Math.min(4, sequence.steps.length - 1) && (
                      <ArrowRight className="h-3 w-3 text-gray-400 mx-1" />
                    )}
                  </div>
                );
              })}
              {sequence.steps.length > 5 && (
                <span className="text-xs text-gray-500 ml-2">+{sequence.steps.length - 5} more</span>
              )}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-lg font-bold text-blue-600">{sequence.enrolledCount}</p>
              <p className="text-xs text-gray-600">Enrolled</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-lg font-bold text-green-600">{sequence.openRate}%</p>
              <p className="text-xs text-gray-600">Open Rate</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-lg font-bold text-purple-600">{sequence.replyRate}%</p>
              <p className="text-xs text-gray-600">Reply Rate</p>
            </div>
          </div>

          {/* Tags */}
          {sequence.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {sequence.tags.map(tag => (
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
              {sequence.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
            <span>Created {new Date(sequence.createdAt).toLocaleDateString()}</span>
            <span>Owner: {sequence.ownerId}</span>
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left">
                <input
                  type="checkbox"
                  checked={selectedSequences.length === filteredSequences.length && filteredSequences.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Sequence
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Enrolled
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Open Rate
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Reply Rate
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Last Run
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSequences.map((sequence) => (
              <tr key={sequence.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedSequences.includes(sequence.id)}
                    onChange={() => handleSelectSequence(sequence.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Zap className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{sequence.name}</p>
                      <p className="text-sm text-gray-600">{sequence.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">{sequence.steps.length} steps</span>
                        {sequence.tags.length > 0 && (
                          <div className="flex space-x-1">
                            {sequence.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(sequence.status)}
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(sequence.status)}`}>
                      {sequence.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{sequence.enrolledCount}</p>
                    <p className="text-xs text-gray-500">{sequence.activeCount} active</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">{sequence.openRate}%</span>
                    <div className="w-12 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${sequence.openRate}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">{sequence.replyRate}%</span>
                    <div className="w-12 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${sequence.replyRate}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-900">
                    {sequence.lastRunAt ? new Date(sequence.lastRunAt).toLocaleDateString() : 'Never'}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors">
                      <Copy className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors">
                      <BarChart3 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

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
              <div className="p-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Email Sequences</h1>
                <p className="text-gray-600 text-lg">Automate your outreach with intelligent email sequences</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* View Toggle */}
              <div className="flex border border-gray-300 rounded-xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center px-4 py-3 text-sm font-medium transition-all ${
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 bg-white'
                  }`}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center px-4 py-3 text-sm font-medium border-l transition-all ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 bg-white'
                  }`}
                >
                  <Users className="h-4 w-4 mr-2" />
                  List
                </button>
              </div>

              <button className="flex items-center px-4 py-3 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm bg-white">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </button>
              
              <button className="flex items-center px-4 py-3 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm bg-white">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              
              <button className="flex items-center px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl text-sm hover:from-orange-700 hover:to-red-700 transition-all shadow-md">
                <Plus className="h-4 w-4 mr-2" />
                Create Sequence
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
                  placeholder="Search sequences..."
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
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="draft">Draft</option>
                <option value="completed">Completed</option>
              </select>
              
              <button className="flex items-center px-4 py-2.5 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm bg-white">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </button>
            </div>

            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <span>{filteredSequences.length} of {sequences.length} sequences</span>
              {selectedSequences.length > 0 && (
                <>
                  <span>•</span>
                  <span>{selectedSequences.length} selected</span>
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
                <p className="text-sm font-medium text-gray-600">Total Sequences</p>
                <p className="text-3xl font-bold text-gray-900">{sequences.length}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Zap className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Sequences</p>
                <p className="text-3xl font-bold text-gray-900">
                  {sequences.filter(s => s.status === 'active').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Play className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Enrolled</p>
                <p className="text-3xl font-bold text-gray-900">
                  {sequences.reduce((sum, s) => sum + s.enrolledCount, 0)}
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
                <p className="text-sm font-medium text-gray-600">Avg Reply Rate</p>
                <p className="text-3xl font-bold text-gray-900">
                  {(sequences.reduce((sum, s) => sum + s.replyRate, 0) / sequences.length).toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {viewMode === 'grid' ? renderGridView() : renderListView()}

        {/* Bulk Actions Bar */}
        {selectedSequences.length > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-200 px-6 py-4 z-50">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">
                {selectedSequences.length} sequence{selectedSequences.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex space-x-2">
                <button className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
                  <Play className="h-4 w-4 mr-1" />
                  Start
                </button>
                <button className="px-3 py-2 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700 transition-colors">
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </button>
                <button className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                  <Copy className="h-4 w-4 mr-1" />
                  Duplicate
                </button>
                <button className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </button>
              </div>
              <button
                onClick={() => setSelectedSequences([])}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredSequences.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Zap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sequences found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first email sequence to start automating outreach'
              }
            </p>
            <button className="bg-orange-600 text-white px-6 py-3 rounded-xl hover:bg-orange-700 transition-colors">
              <Plus className="h-4 w-4 mr-2 inline" />
              Create Your First Sequence
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SequencesPage;