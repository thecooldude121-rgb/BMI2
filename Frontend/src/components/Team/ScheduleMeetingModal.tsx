import React, { useState, useEffect } from 'react';
import { X, Video, MapPin, Building, Calendar, Clock, Users, Link as LinkIcon, RefreshCw } from 'lucide-react';

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  memberEmail: string;
  memberTimezone?: string;
  onSchedule: (meetingData: {
    meetingType: '1-on-1' | 'team' | 'client';
    date: string;
    time: string;
    duration: number;
    locationType: 'office' | 'video' | 'external';
    locationDetails: string;
    subject: string;
    agenda: string;
    agendaTemplate?: string;
    additionalAttendees: string[];
    recurring: 'one-time' | 'weekly' | 'biweekly' | 'monthly';
    reminders: {
      fifteenMin: boolean;
      oneDay: boolean;
    };
  }) => void;
}

const agendaTemplates = {
  none: { name: 'Custom (write your own)', content: '' },
  checkin: {
    name: 'General Check-in',
    content: '1. How are things going?\n2. Recent wins and challenges\n3. Support needed\n4. Next steps'
  },
  performance: {
    name: 'Performance Review',
    content: '1. Review key metrics and achievements\n2. Areas of strength\n3. Growth opportunities\n4. Development plan\n5. Questions and feedback'
  },
  goals: {
    name: 'Goal Setting',
    content: '1. Review previous goals\n2. Set new quarterly objectives\n3. Identify success metrics\n4. Resources needed\n5. Timeline and milestones'
  },
  coaching: {
    name: 'Coaching Session',
    content: '1. Current challenges\n2. Skill development focus\n3. Action items from last session\n4. New coaching topics\n5. Practice and feedback'
  },
  career: {
    name: 'Career Development',
    content: '1. Career aspirations\n2. Skills gap analysis\n3. Development opportunities\n4. Advancement path\n5. Next steps'
  }
};

export const ScheduleMeetingModal: React.FC<ScheduleMeetingModalProps> = ({
  isOpen,
  onClose,
  memberName,
  memberEmail,
  memberTimezone = 'PST',
  onSchedule
}) => {
  const [meetingType, setMeetingType] = useState<'1-on-1' | 'team' | 'client'>('1-on-1');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState<30 | 60 | 120>(30);
  const [locationType, setLocationType] = useState<'office' | 'video' | 'external'>('video');
  const [locationDetails, setLocationDetails] = useState('');
  const [subject, setSubject] = useState('');
  const [agendaTemplate, setAgendaTemplate] = useState<keyof typeof agendaTemplates>('none');
  const [agenda, setAgenda] = useState('');
  const [additionalAttendees, setAdditionalAttendees] = useState<string[]>([]);
  const [newAttendee, setNewAttendee] = useState('');
  const [recurring, setRecurring] = useState<'one-time' | 'weekly' | 'biweekly' | 'monthly'>('one-time');
  const [reminders, setReminders] = useState({ fifteenMin: true, oneDay: true });
  const [scheduling, setScheduling] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);

  useEffect(() => {
    if (isOpen && !date) {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      setDate(nextWeek.toISOString().split('T')[0]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (agendaTemplate !== 'none') {
      setAgenda(agendaTemplates[agendaTemplate].content);
    }
  }, [agendaTemplate]);

  if (!isOpen) return null;

  const firstName = memberName.split(' ')[0];

  const handleGenerateVideoLink = async () => {
    setGeneratingLink(true);
    setTimeout(() => {
      const mockLink = `https://zoom.us/j/${Math.floor(Math.random() * 1000000000)}`;
      setLocationDetails(mockLink);
      setGeneratingLink(false);
    }, 1000);
  };

  const handleAddAttendee = () => {
    if (newAttendee.trim() && !additionalAttendees.includes(newAttendee.trim())) {
      setAdditionalAttendees([...additionalAttendees, newAttendee.trim()]);
      setNewAttendee('');
    }
  };

  const handleRemoveAttendee = (email: string) => {
    setAdditionalAttendees(additionalAttendees.filter(a => a !== email));
  };

  const handleSchedule = async () => {
    if (!date || !time || !subject.trim()) return;

    setScheduling(true);
    await onSchedule({
      meetingType,
      date,
      time,
      duration,
      locationType,
      locationDetails,
      subject,
      agenda,
      agendaTemplate: agendaTemplate !== 'none' ? agendaTemplates[agendaTemplate].name : undefined,
      additionalAttendees,
      recurring,
      reminders
    });
    setScheduling(false);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setMeetingType('1-on-1');
    setDate('');
    setTime('10:00');
    setDuration(30);
    setLocationType('video');
    setLocationDetails('');
    setSubject('');
    setAgendaTemplate('none');
    setAgenda('');
    setAdditionalAttendees([]);
    setRecurring('one-time');
    setReminders({ fifteenMin: true, oneDay: true });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Schedule Meeting with {memberName}</h2>
            <p className="text-sm text-slate-600 mt-1">{memberEmail}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Meeting Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Meeting Type</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="meetingType"
                  checked={meetingType === '1-on-1'}
                  onChange={() => setMeetingType('1-on-1')}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">1-on-1</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="meetingType"
                  checked={meetingType === 'team'}
                  onChange={() => setMeetingType('team')}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">Team Meeting</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="meetingType"
                  checked={meetingType === 'client'}
                  onChange={() => setMeetingType('client')}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">Client Meeting</span>
              </label>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
                <Clock className="w-4 h-4 mr-1.5 text-slate-500" />
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Duration</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  checked={duration === 30}
                  onChange={() => setDuration(30)}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">30 min</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  checked={duration === 60}
                  onChange={() => setDuration(60)}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">1 hour</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  checked={duration === 120}
                  onChange={() => setDuration(120)}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">2 hours</span>
              </label>
            </div>
          </div>

          {/* Location/Link */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Location/Link</label>
            <div className="space-y-3">
              <label className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="location"
                  checked={locationType === 'office'}
                  onChange={() => setLocationType('office')}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500 mt-0.5"
                />
                <div className="ml-2 flex-1">
                  <div className="flex items-center text-sm text-slate-700">
                    <Building className="w-4 h-4 mr-1.5" />
                    Office - Conference Room A
                  </div>
                  {locationType === 'office' && (
                    <input
                      type="text"
                      value={locationDetails}
                      onChange={(e) => setLocationDetails(e.target.value)}
                      placeholder="Enter room name or details"
                      className="mt-2 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  )}
                </div>
              </label>

              <label className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="location"
                  checked={locationType === 'video'}
                  onChange={() => setLocationType('video')}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500 mt-0.5"
                />
                <div className="ml-2 flex-1">
                  <div className="flex items-center text-sm text-slate-700">
                    <Video className="w-4 h-4 mr-1.5" />
                    Video
                  </div>
                  {locationType === 'video' && (
                    <div className="mt-2">
                      {locationDetails ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="url"
                            value={locationDetails}
                            onChange={(e) => setLocationDetails(e.target.value)}
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                          <button
                            onClick={() => setLocationDetails('')}
                            className="px-3 py-2 text-slate-600 hover:text-slate-800 transition-colors text-sm"
                          >
                            Clear
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleGenerateVideoLink}
                          disabled={generatingLink}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:bg-slate-100 disabled:text-slate-400 transition-colors text-sm"
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
                </div>
              </label>

              <label className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="location"
                  checked={locationType === 'external'}
                  onChange={() => setLocationType('external')}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500 mt-0.5"
                />
                <div className="ml-2 flex-1">
                  <div className="flex items-center text-sm text-slate-700">
                    <MapPin className="w-4 h-4 mr-1.5" />
                    External Location
                  </div>
                  {locationType === 'external' && (
                    <input
                      type="text"
                      value={locationDetails}
                      onChange={(e) => setLocationDetails(e.target.value)}
                      placeholder="Enter address or location"
                      className="mt-2 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder='Example: "Performance Review Q4 2024"'
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Agenda Template (for 1-on-1s) */}
          {meetingType === '1-on-1' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Agenda Template (for 1-on-1s)
              </label>
              <select
                value={agendaTemplate}
                onChange={(e) => setAgendaTemplate(e.target.value as keyof typeof agendaTemplates)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(agendaTemplates).map(([key, template]) => (
                  <option key={key} value={key}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Agenda / Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Agenda / Notes</label>
            <textarea
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              placeholder="Meeting agenda and notes..."
              rows={6}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Additional Attendees */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
              <Users className="w-4 h-4 mr-1.5 text-slate-500" />
              Additional Attendees (optional)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="email"
                value={newAttendee}
                onChange={(e) => setNewAttendee(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddAttendee()}
                placeholder="Enter email address"
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddAttendee}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add
              </button>
            </div>
            {additionalAttendees.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {additionalAttendees.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm"
                  >
                    {email}
                    <button
                      onClick={() => handleRemoveAttendee(email)}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Recurring */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3 flex items-center">
              <RefreshCw className="w-4 h-4 mr-1.5 text-slate-500" />
              Recurring
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  checked={recurring === 'one-time'}
                  onChange={() => setRecurring('one-time')}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">One-time</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  checked={recurring === 'weekly'}
                  onChange={() => setRecurring('weekly')}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">Weekly</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  checked={recurring === 'biweekly'}
                  onChange={() => setRecurring('biweekly')}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">Biweekly</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  checked={recurring === 'monthly'}
                  onChange={() => setRecurring('monthly')}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">Monthly</span>
              </label>
            </div>
          </div>

          {/* Reminders */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Reminders</label>
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={reminders.fifteenMin}
                  onChange={(e) => setReminders({ ...reminders, fifteenMin: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">15 minutes before</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={reminders.oneDay}
                  onChange={(e) => setReminders({ ...reminders, oneDay: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">1 day before</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            <kbd className="px-2 py-1 bg-white border border-slate-300 rounded text-xs">M</kbd>
            <span className="ml-2">to schedule meeting</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSchedule}
              disabled={scheduling || !date || !time || !subject.trim()}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              {scheduling ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Meeting
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleMeetingModal;
