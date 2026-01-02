import React, { useState } from 'react';
import { X, Video, Phone, MapPin, Link2, Calendar, Clock } from 'lucide-react';

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (meetingData: any) => void;
}

export default function ScheduleMeetingModal({ isOpen, onClose, onSchedule }: ScheduleMeetingModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    type: 'video',
    date: '',
    time: '',
    duration: '30',
    attendees: ['Alex Rodriguez (You)'],
    dealId: '',
    location: '',
    meetingLink: '',
    notes: '',
    autoGenerateLink: true,
    recordMeeting: true,
    enableAI: true
  });

  const contacts = [
    { id: '1', name: 'John Smith', company: 'Acme Corp' },
    { id: '2', name: 'Sarah Lee', company: 'TechStart' },
    { id: '3', name: 'Mike Chen', company: 'BigCo' },
    { id: '4', name: 'Emma Wilson', company: 'DataFlow' },
    { id: '5', name: 'Lisa Wong', company: 'StartCo' }
  ];

  const deals = [
    { id: 'deal-acme', name: 'Acme Corp - $50K', stage: 'Proposal' },
    { id: 'deal-techstart', name: 'TechStart - $42K', stage: 'Negotiation' },
    { id: 'deal-bigco', name: 'BigCo - $75K', stage: 'Qualified' },
    { id: 'deal-dataflow', name: 'DataFlow - $95K', stage: 'Negotiation' }
  ];

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSchedule(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Schedule New Meeting</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Product Demo with Acme Corp"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Meeting Type</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="video"
                  checked={formData.type === 'video'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="text-blue-600"
                />
                <Video className="h-5 w-5 text-gray-600" />
                <span className="text-gray-900">Video Call</span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="call"
                  checked={formData.type === 'call'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="text-blue-600"
                />
                <Phone className="h-5 w-5 text-gray-600" />
                <span className="text-gray-900">Phone Call</span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="in-person"
                  checked={formData.type === 'in-person'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="text-blue-600"
                />
                <MapPin className="h-5 w-5 text-gray-600" />
                <span className="text-gray-900">In-Person</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="time"
                  required
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
              <option value="90">90 minutes</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attendees <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Search contacts..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
            />
            <div className="border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked disabled className="rounded text-blue-600" />
                <span className="text-sm text-gray-900">Alex Rodriguez (You)</span>
              </label>
              {contacts.map((contact) => (
                <label key={contact.id} className="flex items-center gap-2">
                  <input type="checkbox" className="rounded text-blue-600" />
                  <span className="text-sm text-gray-700">
                    {contact.name} ({contact.company})
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Link to Deal (optional)</label>
            <select
              value={formData.dealId}
              onChange={(e) => setFormData({ ...formData, dealId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select deal...</option>
              {deals.map((deal) => (
                <option key={deal.id} value={deal.id}>
                  {deal.name} - {deal.stage}
                </option>
              ))}
            </select>
          </div>

          {formData.type === 'in-person' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 123 Main St, San Francisco, CA"
                />
              </div>
            </div>
          )}

          {formData.type === 'video' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Link</label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={formData.autoGenerateLink}
                  onChange={(e) => setFormData({ ...formData, autoGenerateLink: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span className="text-sm text-gray-700">Auto-generate Zoom link</span>
              </div>
              {!formData.autoGenerateLink && (
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="url"
                    value={formData.meetingLink}
                    onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://zoom.us/j/..."
                  />
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any additional notes or agenda items..."
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-200">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.recordMeeting}
                onChange={(e) => setFormData({ ...formData, recordMeeting: e.target.checked })}
                className="rounded text-blue-600"
              />
              <span className="text-sm text-gray-700">Record this meeting</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.enableAI}
                onChange={(e) => setFormData({ ...formData, enableAI: e.target.checked })}
                className="rounded text-blue-600"
              />
              <span className="text-sm text-gray-700">Enable AI transcription</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Schedule Meeting
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
