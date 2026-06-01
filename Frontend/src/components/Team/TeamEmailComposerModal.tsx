import React, { useState } from 'react';
import { X, Send, Paperclip, Sparkles, Save } from 'lucide-react';

interface TeamEmailComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  memberEmail: string;
  currentUserEmail?: string;
  onSend: (emailData: {
    subject: string;
    body: string;
    template: string;
    attachments?: File[];
  }) => void;
  onSaveDraft: (emailData: {
    subject: string;
    body: string;
    template: string;
  }) => void;
}

export const TeamEmailComposerModal: React.FC<TeamEmailComposerModalProps> = ({
  isOpen,
  onClose,
  memberName,
  memberEmail,
  currentUserEmail = 'you@company.com',
  onSend,
  onSaveDraft
}) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('none');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  if (!isOpen) return null;

  const firstName = memberName.split(' ')[0];

  const templates = {
    none: {
      name: 'None (blank email)',
      subject: '',
      body: ''
    },
    followup: {
      name: 'General Follow-up',
      subject: `Follow-up - ${memberName}`,
      body: `Hi ${firstName},\n\nI wanted to follow up with you on our recent discussion. Please let me know if you have any questions or need any support.\n\nBest regards`
    },
    meeting: {
      name: 'Meeting Request',
      subject: `Meeting Request - ${memberName}`,
      body: `Hi ${firstName},\n\nI'd like to schedule some time to meet with you. Would you be available for a brief meeting this week?\n\nPlease let me know what works best for your schedule.\n\nBest regards`
    },
    performance: {
      name: 'Performance Check-in',
      subject: `Performance Check-in - ${memberName}`,
      body: `Hi ${firstName},\n\nI wanted to reach out to discuss your recent performance and progress. You've been doing great work, and I'd like to talk about your goals and any support you might need.\n\nLet me know a good time to connect.\n\nBest regards`
    },
    resource: {
      name: 'Resource Sharing',
      subject: `Resource Sharing - ${memberName}`,
      body: `Hi ${firstName},\n\nI wanted to share some resources that I think will be helpful for you. Please take a look when you have a chance.\n\nLet me know if you have any questions!\n\nBest regards`
    }
  };

  const applyTemplate = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    const template = templates[templateKey as keyof typeof templates];
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) return;

    setSending(true);
    await onSend({
      subject,
      body,
      template: selectedTemplate,
      attachments
    });
    setSending(false);
    resetForm();
    onClose();
  };

  const handleSaveDraft = async () => {
    if (!subject.trim() && !body.trim()) return;

    setSavingDraft(true);
    await onSaveDraft({
      subject,
      body,
      template: selectedTemplate
    });
    setSavingDraft(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setSubject('');
    setBody('');
    setSelectedTemplate('none');
    setCc('');
    setBcc('');
    setAttachments([]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Send Email to {memberName}</h2>
            <p className="text-sm text-slate-600 mt-1">
              <span className="font-medium">To:</span> {memberEmail}
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
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* From */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">From</label>
            <input
              type="text"
              value={currentUserEmail}
              disabled
              className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed"
            />
          </div>

          {/* To (read-only) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">To</label>
            <input
              type="text"
              value={memberEmail}
              disabled
              className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed"
            />
          </div>

          {/* CC */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">CC (optional)</label>
            <input
              type="text"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder="Add CC recipients..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* BCC */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">BCC (optional)</label>
            <input
              type="text"
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
              placeholder="Add BCC recipients..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Sparkles className="w-4 h-4 inline mr-1 text-blue-600" />
              Template
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => applyTemplate(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="none">None (blank email)</option>
              <option value="followup">General Follow-up</option>
              <option value="meeting">Meeting Request</option>
              <option value="performance">Performance Check-in</option>
              <option value="resource">Resource Sharing</option>
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Message Body */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={`Hi ${firstName},\n\n[Compose message]\n\nBest regards`}
              rows={12}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
            />
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Attachments</label>
            <div className="space-y-2">
              {attachments.length > 0 && (
                <div className="space-y-1 mb-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <span className="text-sm text-slate-700 flex items-center">
                        <Paperclip className="w-4 h-4 mr-2 text-slate-400" />
                        {file.name}
                      </span>
                      <button
                        onClick={() => removeAttachment(index)}
                        className="text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <label className="flex items-center px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                <Paperclip className="h-4 w-4 mr-2" />
                Add Files
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            <kbd className="px-2 py-1 bg-white border border-slate-300 rounded text-xs">E</kbd>
            <span className="ml-2">to open email composer</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveDraft}
              disabled={savingDraft || (!subject.trim() && !body.trim())}
              className="flex items-center px-6 py-2 text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {savingDraft ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save as Draft
                </>
              )}
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !subject.trim() || !body.trim()}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
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

export default TeamEmailComposerModal;
