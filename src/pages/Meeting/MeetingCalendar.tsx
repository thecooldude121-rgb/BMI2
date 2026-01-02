import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, Users } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const MeetingCalendar: React.FC = () => {
  const { meetings } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());

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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
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

          return (
            <div
              key={index}
              className={`
                min-h-[100px] p-1 border border-gray-200 cursor-pointer hover:bg-gray-50 relative
                ${!day.isCurrentMonth ? 'text-gray-400 bg-gray-50' : ''}
                ${isToday ? 'bg-blue-50 border-blue-200' : ''}
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
  );
};

export default MeetingCalendar;