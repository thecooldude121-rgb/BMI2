import { useState } from 'react';
import { X, Mail, Send, Clock, Save, Paperclip } from 'lucide-react';

interface EmailComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (email: EmailData) => void;
  prefilledTo?: string;
  prefilledSubject?: string;
  prefilledBody?: string;
}

interface EmailData {
  to: string;
  subject: string;
  body: string;
  scheduled?: string;
}

export default function EmailComposerModal({
  isOpen,
  onClose,
  onSend,
  prefilledTo = '',
  prefilledSubject = '',
  prefilledBody = ''
}: EmailComposerModalProps) {
  const [formData, setFormData] = useState<EmailData>({
    to: prefilledTo,
    subject: prefilledSubject,
    body: prefilledBody
  });
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState('');

  if (!isOpen) return null;

  const handleSendNow = () => {
    onSend(formData);
    onClose();
  };

  const handleScheduleSend = () => {
    onSend({ ...formData, scheduled: scheduleDateTime });
    onClose();
  };

  const handleSaveDraft = () => {
    console.log('Saving draft:', formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Mail className="w-5 h-5 text-purple-600" />
            Compose Email
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
            <input
              type="email"
              value={formData.to}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="recipient@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Email subject"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={12}
              placeholder="Write your message..."
              required
            />
          </div>

          {showSchedule && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Schedule for
              </label>
              <input
                type="datetime-local"
                value={scheduleDateTime}
                onChange={(e) => setScheduleDateTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={() => setShowSchedule(false)}
                className="mt-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel scheduling
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Paperclip className="w-4 h-4" />
            <span>Attachments not yet supported</span>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleSaveDraft}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>
          {!showSchedule && (
            <button
              onClick={() => setShowSchedule(true)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Schedule Send
            </button>
          )}
          {showSchedule ? (
            <button
              onClick={handleScheduleSend}
              disabled={!scheduleDateTime}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Schedule for {scheduleDateTime && new Date(scheduleDateTime).toLocaleString()}
            </button>
          ) : (
            <button
              onClick={handleSendNow}
              disabled={!formData.to || !formData.subject || !formData.body}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
