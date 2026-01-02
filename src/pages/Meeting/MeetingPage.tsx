import React, { useState } from 'react';
import { Calendar, Video, Users, Clock, Plus, Filter, Search } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const MeetingPage: React.FC = () => {
  const { meetings, employees, leads } = useData();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [filterType, setFilterType] = useState('all');

  const getTypeColor = (type: string) => {
    const colors = {
      'sales-call': 'bg-blue-100 text-blue-800',
      'internal': 'bg-gray-100 text-gray-800',
      'client-meeting': 'bg-green-100 text-green-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? employee.name : 'Unknown';
  };

  const filteredMeetings = meetings.filter(meeting => 
    filterType === 'all' || meeting.type === filterType
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meetings</h1>
          <p className="text-gray-600">Schedule and manage your meetings</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 text-sm font-medium ${
                viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'
              } rounded-l-lg`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 text-sm font-medium ${
                viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'
              } rounded-r-lg`}
            >
              Calendar
            </button>
          </div>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Schedule Meeting
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          <option value="sales-call">Sales Calls</option>
          <option value="client-meeting">Client Meetings</option>
          <option value="internal">Internal Meetings</option>
        </select>
      </div>

      {/* Meetings List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">All Meetings</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredMeetings.map((meeting) => (
            <div key={meeting.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-medium text-gray-900">{meeting.title}</h4>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(meeting.type)}`}>
                      {meeting.type.replace('-', ' ')}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{meeting.description}</p>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{new Date(meeting.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{meeting.duration} minutes</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{meeting.attendees.length} attendees</span>
                    </div>
                    {meeting.meetingLink && (
                      <div className="flex items-center">
                        <Video className="h-4 w-4 mr-1" />
                        <span>Video call</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                  <button className="text-gray-600 hover:text-gray-800 text-sm">View</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MeetingPage;