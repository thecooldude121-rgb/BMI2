import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Users, Video, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const Calendar: React.FC = () => {
  const { meetings, leads, employees } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Previous month's days
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonth.getDate() - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonth.getDate() - i)
      });
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        date: new Date(year, month, day)
      });
    }

    // Next month's days
    const remainingCells = 42 - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        date: new Date(year, month + 1, day)
      });
    }

    return days;
  };

  const getMeetingsForDate = (date: Date) => {
    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.date);
      return meetingDate.toDateString() === date.toDateString();
    });
  };

  const getLeadName = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    return lead ? lead.name : 'Unknown';
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? employee.name : 'Unknown';
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const days = getDaysInMonth(currentDate);
  const today = new Date();

  // Upcoming meetings (next 7 days)
  const upcomingMeetings = meetings
    .filter(meeting => {
      const meetingDate = new Date(meeting.date);
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return meetingDate >= today && meetingDate <= nextWeek;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600">Manage your meetings and schedule</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex border border-gray-300 rounded-md">
            {(['month', 'week', 'day'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setViewType(type)}
                className={`px-3 py-2 text-sm font-medium capitalize ${
                  viewType === type
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                } ${type === 'month' ? 'rounded-l-md' : type === 'day' ? 'rounded-r-md' : ''}`}
              >
                {type}
              </button>
            ))}
          </div>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Meeting
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg border border-gray-200">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-gray-100 rounded-md"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Today
                </button>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-gray-100 rounded-md"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-6">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                  const dayMeetings = getMeetingsForDate(day.date);
                  const isToday = day.date.toDateString() === today.toDateString();
                  const isSelected = selectedDate && day.date.toDateString() === selectedDate.toDateString();

                  return (
                    <div
                      key={index}
                      onClick={() => setSelectedDate(day.date)}
                      className={`
                        min-h-[100px] p-1 border border-gray-200 cursor-pointer hover:bg-gray-50 relative
                        ${!day.isCurrentMonth ? 'text-gray-400 bg-gray-50' : ''}
                        ${isToday ? 'bg-blue-50 border-blue-200' : ''}
                        ${isSelected ? 'bg-blue-100 border-blue-300' : ''}
                      `}
                    >
                      <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                        {day.day}
                      </div>
                      
                      {/* Meeting indicators */}
                      <div className="space-y-1">
                        {dayMeetings.slice(0, 3).map((meeting, idx) => (
                          <div
                            key={meeting.id}
                            className={`text-xs p-1 rounded truncate ${
                              meeting.type === 'sales-call' 
                                ? 'bg-green-100 text-green-800'
                                : meeting.type === 'client-meeting'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {meeting.title}
                          </div>
                        ))}
                        {dayMeetings.length > 3 && (
                          <div className="text-xs text-gray-500 font-medium">
                            +{dayMeetings.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Meetings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Upcoming Meetings
            </h3>
            
            {upcomingMeetings.length === 0 ? (
              <p className="text-gray-500 text-sm">No upcoming meetings</p>
            ) : (
              <div className="space-y-3">
                {upcomingMeetings.map(meeting => (
                  <div key={meeting.id} className="border border-gray-200 rounded-lg p-3">
                    <h4 className="font-medium text-gray-900 text-sm">{meeting.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(meeting.date).toLocaleDateString()} at{' '}
                      {new Date(meeting.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {meeting.attendees.length} attendee{meeting.attendees.length !== 1 ? 's' : ''}
                    </p>
                    {meeting.relatedTo && (
                      <p className="text-xs text-blue-600 mt-1">
                        Related to: {getLeadName(meeting.relatedTo.id)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">This Month</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm text-gray-600">Total Meetings</span>
                </div>
                <span className="font-medium text-gray-900">{meetings.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-sm text-gray-600">Sales Calls</span>
                </div>
                <span className="font-medium text-gray-900">
                  {meetings.filter(m => m.type === 'sales-call').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Video className="h-4 w-4 text-purple-600 mr-2" />
                  <span className="text-sm text-gray-600">Client Meetings</span>
                </div>
                <span className="font-medium text-gray-900">
                  {meetings.filter(m => m.type === 'client-meeting').length}
                </span>
              </div>
            </div>
          </div>

          {/* Meeting Actions */}
          {selectedDate && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {selectedDate.toLocaleDateString()}
              </h3>
              <div className="space-y-2">
                <button className="w-full flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Meeting
                </button>
                <button className="w-full flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                  <Clock className="h-4 w-4 mr-2" />
                  Block Time
                </button>
              </div>
              
              {/* Selected Date Meetings */}
              {selectedDate && (() => {
                const dayMeetings = getMeetingsForDate(selectedDate);
                return dayMeetings.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Meetings ({dayMeetings.length})
                    </h4>
                    <div className="space-y-2">
                      {dayMeetings.map(meeting => (
                        <div key={meeting.id} className="text-sm p-2 bg-gray-50 rounded">
                          <p className="font-medium">{meeting.title}</p>
                          <p className="text-gray-600">
                            {new Date(meeting.date).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })} • {meeting.duration}min
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calendar;