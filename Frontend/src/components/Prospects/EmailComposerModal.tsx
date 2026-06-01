import React, { useState } from 'react';
import { X, Send, Paperclip, Sparkles } from 'lucide-react';

interface EmailComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  prospectName: string;
  prospectEmail: string;
  onSend: (subject: string, body: string) => void;
}

export const EmailComposerModal: React.FC<EmailComposerModalProps> = ({
  isOpen,
  onClose,
  prospectName,
  prospectEmail,
  onSend
}) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) return;

    setSending(true);
    await onSend(subject, body);
    setSending(false);
    setSubject('');
    setBody('');
    onClose();
  };

  const useTemplate = (template: 'intro' | 'followup' | 'demo') => {
    const templates = {
      intro: {
        subject: `Introduction - ${prospectName}`,
        body: `Hi ${prospectName.split(' ')[0]},\n\nI hope this email finds you well. I wanted to reach out to introduce our solution that can help you...\n\nWould you be available for a brief call next week?\n\nBest regards`
      },
      followup: {
        subject: `Following up - ${prospectName}`,
        body: `Hi ${prospectName.split(' ')[0]},\n\nI wanted to follow up on our previous conversation. I've prepared some additional information that I think you'll find valuable.\n\nLet me know if you have any questions!\n\nBest regards`
      },
      demo: {
        subject: `Product Demo - ${prospectName}`,
        body: `Hi ${prospectName.split(' ')[0]},\n\nThank you for your interest! I'd love to schedule a personalized demo to show you how our solution can address your specific needs.\n\nAre you available this week?\n\nBest regards`
      }
    };

    const selected = templates[template];
    setSubject(selected.subject);
    setBody(selected.body);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Compose Email</h2>
            <p className="text-sm text-gray-600 mt-1">To: {prospectEmail}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <button
              onClick={() => useTemplate('intro')}
              className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Sparkles className="h-3 w-3 inline mr-1" />
              Intro Template
            </button>
            <button
              onClick={() => useTemplate('followup')}
              className="px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Sparkles className="h-3 w-3 inline mr-1" />
              Follow-up
            </button>
            <button
              onClick={() => useTemplate('demo')}
              className="px-3 py-1.5 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <Sparkles className="h-3 w-3 inline mr-1" />
              Demo Request
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <button
            className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            <Paperclip className="h-4 w-4 mr-2" />
            Attach
          </button>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !subject.trim() || !body.trim()}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailComposerModal;
