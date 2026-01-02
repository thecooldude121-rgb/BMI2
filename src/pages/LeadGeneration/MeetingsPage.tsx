import React, { useState } from 'react';
import {
  Calendar, Plus, Search, Filter, Download, Upload, Eye, Edit,
  Trash2, Video, Phone, MapPin, Clock, Users, TrendingUp,
  Tag, MoreHorizontal, X, Settings, RefreshCw, CheckCircle,
  AlertCircle, Play, Pause, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Meeting } from '../../types/leadGeneration';

const MeetingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedMeetings, setSelectedMeetings] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Mock meetings data
  const mockMeetings: Meeting[] = [
    {
      id: '1',
      title: 'Discovery Call - TechCorp Solutions',
      description: 'Initial discovery call to understand requirements and pain points',
      startTime: '2024-01-25T10:00:00Z',
      endTime: '2024-01-25T11:00:00Z',
      timezone: 'America/New_York',
      organizer: 'user-1',
      attendees: [
        {
          id: 'att-1',
          type: 'prospect',
          email: 'sarah.chen@techcorp.com',
          name: 'Sarah Chen',
          response: 'accepted',
          attended: true
        },
        {
          id: 'att-2',
          type: 'user',
          email: 'john@company.com',
          name: 'John Smith',
          response: 'accepted',
          attended: true
        }
      ],
      type: 'discovery',
      location: 'Video Call',
      meetingUrl: 'https://zoom.us/j/123456789',
      status: 'completed',
      prospectIds: ['prospect-1'],
      companyId: 'comp-1',
      agenda: 'Discuss current CRM challenges and requirements',
      notes: 'Great call! Sarah is very interested in our enterprise solution. Next step: send proposal.',
      actionItems: [
        {
          id: 'action-1',
          description: 'Send detailed proposal with pricing',
          assigneeId: 'user-1',
          dueDate: '2024-01-27',
          priority: 'high',
          status: 'open'
        }
      ],
      nextSteps: 'Send proposal and schedule follow-up demo',
      createdAt: '2024-01-20T09:00:00Z',
      updatedAt: '2024-01-25T11:30:00Z'
    },
    {
      id: '2',
      title: 'Product Demo - HealthPlus Medical',
      description: 'Product demonstration focusing on healthcare compliance features',
      startTime: '2024-01-26T14:00:00Z',
      endTime: '2024-01-26T15:30:00Z',
      timezone: 'America/New_York',
      organizer: 'user-2',
      attendees: [
        {
          id: 'att-3',
          type: 'prospect',
          email: 'michael.rodriguez@healthplus.com',
          name: 'Michael Rodriguez',
          response: 'accepted'
        }
      ],
      type: 'demo',
      meetingUrl: 'https://teams.microsoft.com/l/meetup-join/...',
      status: 'scheduled',
      prospectIds: ['prospect-2'],
      companyId: 'comp-2',
      agenda: 'Demo healthcare-specific features and compliance tools',
      actionItems: [],
      createdAt: '2024-01-22T11:00:00Z',
      updatedAt: '2024-01-22T11:00:00Z'
    }
  ];

  const [meetings] = useState<Meeting[]>(mockMeetings);

  const filteredMeetings = meetings.filter(meeting => {
    const matchesSearch = meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         meeting.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || meeting.status === statusFilter;
    const matchesType = typeFilter === 'all' || meeting.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleSelectMeeting = (meetingId: string) => {
    setSelectedMeetings(prev =>
      prev.includes(meetingId)
        ? prev.filter(id => id !== meetingId)
        : [...prev, meetingId]
    );
  };

  const handleSelectAll = () => {
    if (selectedMeetings.length === filteredMeetings.length) {
      setSelectedMeetings([]);
    } else {
      setSelectedMeetings(filteredMeetings.map(m => m.id));
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
      in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      no_show: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Calendar className="h-4 w-4 text-blue-600" />;
      case 'in_progress':
        return <Play className="h-4 w-4 text-yellow-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled':
      case 'no_show':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'discovery':
        return <Search className="h-4 w-4" />;
      case 'demo':
        return <Video className="h-4 w-4" />;
      case 'proposal':
        return <FileText className="h-4 w-4" />;
      case 'closing':
        return <CheckCircle className="h-4 w-4" />;
      case 'follow_up':
        return <RefreshCw className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
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
              <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Meetings</h1>
                <p className="text-gray-600 text-lg">Schedule and manage prospect meetings</p>
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
                onClick={() => setShowScheduleModal(true)}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-sm hover:from-purple-700 hover:to-blue-700 transition-all shadow-md"
              >
                <Plus className="h-4 w-4 mr-2" />
                Schedule Meeting
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
                  placeholder="Search meetings..."
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
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>
              
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
              >
                <option value="all">All Types</option>
                <option value="discovery">Discovery</option>
                <option value="demo">Demo</option>
                <option value="proposal">Proposal</option>
                <option value="closing">Closing</option>
                <option value="follow_up">Follow-up</option>
              </select>
              
              <button className="flex items-center px-4 py-2.5 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm bg-white">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </button>
            </div>

            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <span>{filteredMeetings.length} of {meetings.length} meetings</span>
              {selectedMeetings.length > 0 && (
                <>
                  <span>•</span>
                  <span>{selectedMeetings.length} selected</span>
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
                <p className="text-sm font-medium text-gray-600">Total Meetings</p>
                <p className="text-3xl font-bold text-gray-900">{meetings.length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-gray-900">
                  {meetings.filter(m => m.status === 'completed').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-3xl font-bold text-gray-900">
                  {meetings.filter(m => m.status === 'scheduled').length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Show Rate</p>
                <p className="text-3xl font-bold text-gray-900">
                  {meetings.length > 0 ? Math.round((meetings.filter(m => m.status === 'completed').length / meetings.length) * 100) : 0}%
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Meetings List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">All Meetings</h3>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedMeetings.length === filteredMeetings.length && filteredMeetings.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-600">{filteredMeetings.length} meetings</span>
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredMeetings.map((meeting) => (
              <div key={meeting.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedMeetings.includes(meeting.id)}
                    onChange={() => handleSelectMeeting(meeting.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(meeting.status)}
                        <h4 className="text-lg font-semibold text-gray-900">{meeting.title}</h4>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(meeting.status)}`}>
                          {meeting.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">
                          {new Date(meeting.startTime).toLocaleString()}
                        </span>
                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {meeting.description && (
                      <p className="text-gray-600 mb-3">{meeting.description}</p>
                    )}
                    
                    <div className="flex items-center space-x-6 mb-3 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        {getTypeIcon(meeting.type)}
                        <span className="capitalize">{meeting.type.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {Math.round((new Date(meeting.endTime).getTime() - new Date(meeting.startTime).getTime()) / (1000 * 60))} min
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{meeting.attendees.length} attendees</span>
                      </div>
                      {meeting.meetingUrl && (
                        <div className="flex items-center space-x-1">
                          <Video className="h-4 w-4" />
                          <span>Video call</span>
                        </div>
                      )}
                    </div>
                    
                    {meeting.actionItems.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Action Items:</p>
                        <div className="space-y-1">
                          {meeting.actionItems.map(item => (
                            <div key={item.id} className="flex items-center space-x-2 text-sm">
                              <CheckCircle className={`h-3 w-3 ${item.status === 'completed' ? 'text-green-600' : 'text-gray-400'}`} />
                              <span className={item.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-700'}>
                                {item.description}
                              </span>
                              <span className="text-xs text-gray-500">({item.assigneeId})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {meeting.notes && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                          <strong>Notes:</strong> {meeting.notes}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors">
                      <Edit className="h-4 w-4" />
                    </button>
                    {meeting.meetingUrl && (
                      <button className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors">
                        <Video className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedMeetings.length > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-200 px-6 py-4 z-50">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">
                {selectedMeetings.length} meeting{selectedMeetings.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex space-x-2">
                <button className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                  Reschedule
                </button>
                <button className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
                  Mark Complete
                </button>
                <button className="px-3 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 transition-colors">
                  Add Notes
                </button>
                <button className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Cancel
                </button>
              </div>
              <button
                onClick={() => setSelectedMeetings([])}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredMeetings.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start by scheduling your first meeting'
              }
            </p>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2 inline" />
              Schedule Meeting
            </button>
          </div>
        )}
      </div>

      {/* Schedule Meeting Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Schedule Meeting</h2>
              <button onClick={() => setShowScheduleModal(false)}>
                <X className="h-6 w-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Title</label>
                <input
                  type="text"
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter meeting title..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                  <input
                    type="datetime-local"
                    className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                  <select className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="90">1.5 hours</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Type</label>
                <select className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="discovery">Discovery Call</option>
                  <option value="demo">Product Demo</option>
                  <option value="proposal">Proposal Review</option>
                  <option value="closing">Closing Call</option>
                  <option value="follow_up">Follow-up</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button className="px-6 py-3 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors">
                Schedule Meeting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingsPage;