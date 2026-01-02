import React, { useState } from 'react';
import { X, Phone, Video, MapPin, Calendar, Clock, Link as LinkIcon } from 'lucide-react';

interface ScheduleCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  memberEmail: string;
  memberPhone?: string;
  memberTimezone?: string;
  onSchedule: (callData: {
    date: string;
    time: string;
    duration: number;
    callType: 'phone' | 'video' | 'inperson';
    phoneNumber?: string;
    videoLink?: string;
    subject: string;
    notes: string;
    sendInvite: boolean;
    addToCalendar: boolean;
  }) => void;
}

export const ScheduleCallModal: React.FC<ScheduleCallModalProps> = ({
  isOpen,
  onClose,
  memberName,
  memberEmail,
  memberPhone = '555-0001',
  memberTimezone = 'PST',
  onSchedule
}) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('14:00');
  const [duration, setDuration] = useState<15 | 30 | 60>(30);
  const [callType, setCallType] = useState<'phone' | 'video' | 'inperson'>('video');
  const [phoneNumber, setPhoneNumber] = useState(memberPhone);
  const [videoLink, setVideoLink] = useState('');
  const [subject, setSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [sendInvite, setSendInvite] = useState(true);
  const [addToCalendar, setAddToCalendar] = useState(true);
  const [scheduling, setScheduling] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);

  if (!isOpen) return null;

  const firstName = memberName.split(' ')[0];

  // Set default date to tomorrow
  React.useEffect(() => {
    if (isOpen && !date) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDate(tomorrow.toISOString().split('T')[0]);
    }
  }, [isOpen]);

  const handleGenerateZoomLink = async () => {
    setGeneratingLink(true);
    // Simulate API call to Zoom
    setTimeout(() => {
      const mockZoomLink = `https://zoom.us/j/${Math.floor(Math.random() * 1000000000)}`;
      setVideoLink(mockZoomLink);
      setGeneratingLink(false);
    }, 1000);
  };

  const handleSchedule = async () => {
    if (!date || !time || !subject.trim()) return;

    setScheduling(true);
    await onSchedule({
      date,
      time,
      duration,
      callType,
      phoneNumber: callType === 'phone' ? phoneNumber : undefined,
      videoLink: callType === 'video' ? videoLink : undefined,
      subject,
      notes,
      sendInvite,
      addToCalendar
    });
    setScheduling(false);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setDate('');
    setTime('14:00');
    setDuration(30);
    setCallType('video');
    setPhoneNumber(memberPhone);
    setVideoLink('');
    setSubject('');
    setNotes('');
    setSendInvite(true);
    setAddToCalendar(true);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getCallTypeIcon = () => {
    switch (callType) {
      case 'phone':
        return <Phone className="w-5 h-5" />;
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'inperson':
        return <MapPin className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Schedule Call with {memberName}</h2>
            <p className="text-sm text-slate-600 mt-1">
              <span className="font-medium">Contact:</span> {memberEmail}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
              <Calendar className="w-4 h-4 mr-1.5 text-slate-500" />
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
              <Clock className="w-4 h-4 mr-1.5 text-slate-500" />
              Time
            </label>
            <div className="flex items-center gap-3">
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-600 font-medium">{memberTimezone} timezone</span>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Duration</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="duration"
                  value={15}
                  checked={duration === 15}
                  onChange={() => setDuration(15)}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">15 min</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="duration"
                  value={30}
                  checked={duration === 30}
                  onChange={() => setDuration(30)}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">30 min</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="duration"
                  value={60}
                  checked={duration === 60}
                  onChange={() => setDuration(60)}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">1 hour</span>
              </label>
            </div>
          </div>

          {/* Call Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Call Type</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="callType"
                  value="phone"
                  checked={callType === 'phone'}
                  onChange={() => setCallType('phone')}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-4 h-4" />
                  Phone Call
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="callType"
                  value="video"
                  checked={callType === 'video'}
                  onChange={() => setCallType('video')}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700 flex items-center gap-1.5">
                  <Video className="w-4 h-4" />
                  Video Call
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="callType"
                  value="inperson"
                  checked={callType === 'inperson'}
                  onChange={() => setCallType('inperson')}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  In-Person
                </span>
              </label>
            </div>
          </div>

          {/* Phone Number (for phone calls) */}
          {callType === 'phone' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="555-0001"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Video Link (for video calls) */}
          {callType === 'video' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Video Link</label>
              {videoLink ? (
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={videoLink}
                    onChange={(e) => setVideoLink(e.target.value)}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => setVideoLink('')}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors text-sm"
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGenerateZoomLink}
                  disabled={generatingLink}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:bg-slate-100 disabled:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {generatingLink ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-4 h-4" />
                      Generate Zoom Link
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Example: Q4 Performance Review"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Agenda items to discuss..."
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Add to Calendar */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Add to Calendar</label>
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendInvite}
                  onChange={(e) => setSendInvite(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">
                  Send calendar invite to {firstName}
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={addToCalendar}
                  onChange={(e) => setAddToCalendar(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">
                  Add to my calendar
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            <kbd className="px-2 py-1 bg-white border border-slate-300 rounded text-xs">C</kbd>
            <span className="ml-2">to schedule call</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSchedule}
              disabled={scheduling || !date || !time || !subject.trim()}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {scheduling ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Scheduling...
                </>
              ) : (
                <>
                  {getCallTypeIcon()}
                  <span className="ml-2">Schedule Call</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleCallModal;
