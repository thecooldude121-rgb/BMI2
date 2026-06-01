import React, { useState } from 'react';
import { Calendar, Clock, Users, Video, MapPin, Plus, X } from 'lucide-react';

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

interface MeetingSchedulerProps {
  onSchedule: (meetingData: any) => void;
  onClose: () => void;
  preselectedContact?: string;
  preselectedDeal?: string;
}

const MeetingScheduler: React.FC<MeetingSchedulerProps> = ({
  onSchedule,
  onClose,
  preselectedContact,
  preselectedDeal
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [meetingType, setMeetingType] = useState<'discovery' | 'demo' | 'proposal' | 'closing'>('discovery');
  const [duration, setDuration] = useState<number>(30);
  const [attendees, setAttendees] = useState<string[]>([]);
  const [location, setLocation] = useState<'in-person' | 'video' | 'phone'>('video');
  const [notes, setNotes] = useState<string>('');

  // Mock available time slots - in real app, this would come from calendar API
  const availableSlots: TimeSlot[] = [
    { id: '1', startTime: '09:00', endTime: '09:30', available: true },
    { id: '2', startTime: '10:00', endTime: '10:30', available: true },
    { id: '3', startTime: '11:00', endTime: '11:30', available: false },
    { id: '4', startTime: '14:00', endTime: '14:30', available: true },
    { id: '5', startTime: '15:00', endTime: '15:30', available: true },
    { id: '6', startTime: '16:00', endTime: '16:30', available: true }
  ];

  const meetingTypes = [
    { value: 'discovery', label: 'Discovery Call', duration: 30 },
    { value: 'demo', label: 'Product Demo', duration: 45 },
    { value: 'proposal', label: 'Proposal Review', duration: 60 },
    { value: 'closing', label: 'Closing Call', duration: 30 }
  ];

  const handleSchedule = () => {
    const meetingData = {
      type: meetingType,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      duration,
      attendees,
      location,
      notes,
      contactId: preselectedContact,
      dealId: preselectedDeal
    };
    
    onSchedule(meetingData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Schedule Meeting</h2>
            <p className="text-gray-600">Book a meeting with your prospect</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Meeting Details */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Meeting Type</label>
              <div className="grid grid-cols-2 gap-3">
                {meetingTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => {
                      setMeetingType(type.value as any);
                      setDuration(type.duration);
                    }}
                    className={`p-4 border rounded-xl text-left transition-colors ${
                      meetingType === type.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <p className="font-medium">{type.label}</p>
                    <p className="text-sm text-gray-500">{type.duration} minutes</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Meeting Format</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setLocation('video')}
                  className={`p-4 border rounded-xl text-center transition-colors ${
                    location === 'video'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Video className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm font-medium">Video Call</p>
                </button>
                <button
                  onClick={() => setLocation('phone')}
                  className={`p-4 border rounded-xl text-center transition-colors ${
                    location === 'phone'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Clock className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm font-medium">Phone Call</p>
                </button>
                <button
                  onClick={() => setLocation('in-person')}
                  className={`p-4 border rounded-xl text-center transition-colors ${
                    location === 'in-person'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <MapPin className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm font-medium">In Person</p>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Meeting Notes</label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Add agenda items, preparation notes, or meeting objectives..."
              />
            </div>
          </div>

          {/* Right Column - Date & Time Selection */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {selectedDate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Available Time Slots</label>
                <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => slot.available && setSelectedTimeSlot(slot.id)}
                      disabled={!slot.available}
                      className={`p-3 border rounded-lg text-sm transition-colors ${
                        selectedTimeSlot === slot.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : slot.available
                          ? 'border-gray-200 hover:bg-gray-50'
                          : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>{slot.startTime} - {slot.endTime}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Meeting Summary */}
            {selectedDate && selectedTimeSlot && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Meeting Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium text-gray-900">
                      {meetingTypes.find(t => t.value === meetingType)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(selectedDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium text-gray-900">
                      {availableSlots.find(s => s.id === selectedTimeSlot)?.startTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium text-gray-900">{duration} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Format:</span>
                    <span className="font-medium text-gray-900 capitalize">{location.replace('-', ' ')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSchedule}
            disabled={!selectedDate || !selectedTimeSlot}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Schedule Meeting
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingScheduler;

/*
CRM Meeting Scheduler Component

Purpose: Advanced meeting scheduling interface for CRM sales activities

Features:
- Multiple meeting types (discovery, demo, proposal, closing)
- Calendar integration with available time slots
- Video/phone/in-person meeting options
- Automatic CRM record linking
- Meeting preparation and agenda planning
- Attendee management and notifications

API Integration Points:
1. GET /api/calendar/availability - Fetch available time slots
2. POST /api/meetings - Create new meeting
3. GET /api/contacts/{id}/availability - Check contact availability
4. POST /api/calendar/book - Book calendar slot
5. POST /api/notifications/meeting-invite - Send meeting invitations

TODO: 
- Integrate with Google Calendar/Outlook
- Add timezone handling
- Implement recurring meeting options
- Add meeting templates
- Include automatic follow-up task creation
*/