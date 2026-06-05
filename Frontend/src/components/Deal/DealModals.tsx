import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertCircle, CheckCircle2, Search, Mail, Phone, Video } from 'lucide-react';

interface MoreOptionsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
}

export const MoreOptionsDropdown: React.FC<MoreOptionsDropdownProps> = ({ isOpen, onClose, onAction }) => {
  if (!isOpen) return null;

  const options = [
    { id: 'clone', label: 'Clone Deal', icon: '📋' },
    { id: 'change-owner', label: 'Change Owner', icon: '👤' },
    { id: 'change-stage', label: 'Change Stage', icon: '🔄' },
    { id: 'mark-won', label: 'Mark as Won', icon: '✅', className: 'text-green-700' },
    { id: 'mark-lost', label: 'Mark as Lost', icon: '❌', className: 'text-red-700' },
    { id: 'archive', label: 'Archive Deal', icon: '📦' },
    { id: 'delete', label: 'Delete Deal', icon: '🗑️', className: 'text-red-700' },
    { id: 'export-pdf', label: 'Export as PDF', icon: '📄' },
    { id: 'share', label: 'Share Deal', icon: '🔗' }
  ];

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => {
              onAction(option.id);
              onClose();
            }}
            className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 ${option.className || 'text-gray-700'}`}
          >
            <span>{option.icon}</span>
            <span className="text-sm font-medium">{option.label}</span>
          </button>
        ))}
      </div>
    </>
  );
};

interface StageChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStage: string;
  nextStage: string;
  onConfirm: () => void;
}

export const StageChangeModal: React.FC<StageChangeModalProps> = ({
  isOpen,
  onClose,
  currentStage,
  nextStage,
  onConfirm
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Move Deal to {nextStage}?</h3>

        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Current:</span>
            <span className="text-sm font-medium text-gray-900">{currentStage}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Next:</span>
            <span className="text-sm font-medium text-blue-600">{nextStage}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Move Stage
          </button>
        </div>
      </div>
    </div>
  );
};

interface UpdateAmountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAmount: number;
  onUpdate: (newAmount: number, reason: string) => void;
}

export const UpdateAmountModal: React.FC<UpdateAmountModalProps> = ({
  isOpen,
  onClose,
  currentAmount,
  onUpdate
}) => {
  const [newAmount, setNewAmount] = useState(currentAmount.toString());
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleUpdate = () => {
    const amount = parseFloat(newAmount);
    if (!isNaN(amount) && reason.trim()) {
      onUpdate(amount, reason);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Deal Amount</h3>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Current:</label>
            <div className="text-lg font-semibold text-gray-900">${currentAmount.toLocaleString()}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Amount:</label>
            <input
              type="number"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="50000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason:</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Scope expanded to include..."
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={!reason.trim() || !newAmount}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

interface AIBestTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactName: string;
  onSelectTime: (time: string) => void;
}

export const AIBestTimeModal: React.FC<AIBestTimeModalProps> = ({
  isOpen,
  onClose,
  contactName,
  onSelectTime
}) => {
  const suggestedTimes = [
    { date: 'Tue, Dec 10', time: '2:00 PM', confidence: 95 },
    { date: 'Wed, Dec 11', time: '10:00 AM', confidence: 88 },
    { date: 'Thu, Dec 12', time: '3:00 PM', confidence: 82 }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🤖</span>
          <h3 className="text-lg font-semibold text-gray-900">AI-Suggested Meeting Times</h3>
        </div>

        <p className="text-sm text-gray-600 mb-4">Based on {contactName}'s email patterns:</p>

        <div className="space-y-2 mb-6">
          {suggestedTimes.map((slot, idx) => (
            <button
              key={idx}
              onClick={() => {
                onSelectTime(`${slot.date} at ${slot.time}`);
                onClose();
              }}
              className="w-full p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="font-medium text-gray-900">{slot.date} at {slot.time}</div>
                    <div className="text-xs text-gray-500">{slot.confidence}% confidence</div>
                  </div>
                </div>
                <Clock className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
          >
            Manual Entry
          </button>
        </div>
      </div>
    </div>
  );
};

interface FindCEOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddContact: (contact: any) => void;
}

export const FindCEOModal: React.FC<FindCEOModalProps> = ({ isOpen, onClose, onAddContact }) => {
  const [searching, setSearching] = useState(true);

  React.useEffect(() => {
    if (isOpen) {
      setSearching(true);
      setTimeout(() => setSearching(false), 2000);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const foundCEO = {
    name: 'Sarah Johnson',
    title: 'CEO & Co-Founder',
    linkedin: '/in/sarahjohnson',
    email: 'sarah@acme.com'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
        {searching ? (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-5 h-5 text-blue-600 animate-pulse" />
              <h3 className="text-lg font-semibold text-gray-900">Searching for CEO...</h3>
            </div>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">CEO Found!</h3>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Name:</span>
                <span className="text-sm font-medium text-gray-900">{foundCEO.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Title:</span>
                <span className="text-sm font-medium text-gray-900">{foundCEO.title}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">LinkedIn:</span>
                <span className="text-sm text-blue-600">{foundCEO.linkedin}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Email:</span>
                <span className="text-sm text-green-600">{foundCEO.email} (found)</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onAddContact(foundCEO);
                  onClose();
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Add to Deal
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddContact: (contactId: string, role: string) => void;
  preSelectedRole?: string;
}

export const AddContactModal: React.FC<AddContactModalProps> = ({
  isOpen,
  onClose,
  onAddContact,
  preSelectedRole,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState(preSelectedRole || 'Decision Maker');

  // Sync selected role whenever the modal opens or the pre-selection changes
  useEffect(() => {
    if (isOpen) setSelectedRole(preSelectedRole || 'Decision Maker');
  }, [isOpen, preSelectedRole]);

  if (!isOpen) return null;

  const roles = [
    'Champion',
    'Decision Maker',
    'Economic Buyer',
    'Technical Evaluator',
    'Executive Sponsor',
    'Influencer',
    'User',
  ];

  const isLocked = Boolean(preSelectedRole);
  const title = isLocked ? `Add ${preSelectedRole}` : 'Add Contact to Deal';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search existing contacts:</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="text-center text-sm text-gray-500">OR</div>

          <button className="w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-700 rounded-lg hover:border-blue-500 hover:text-blue-600 font-medium">
            Create New Contact
          </button>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Role:</label>
            {isLocked ? (
              <div className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-800 font-medium flex items-center justify-between">
                <span>{selectedRole}</span>
                <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                  Fixed
                </span>
              </div>
            ) : (
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {roles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onAddContact('new-contact', selectedRole);
              onClose();
            }}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

interface EmailComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  to: string;
  subject?: string;
  body?: string;
}

export const EmailComposerModal: React.FC<EmailComposerModalProps> = ({
  isOpen,
  onClose,
  to,
  subject = '',
  body = ''
}) => {
  const [emailSubject, setEmailSubject] = useState(subject);
  const [emailBody, setEmailBody] = useState(body);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Compose Email</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To:</label>
            <input
              type="text"
              value={to}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject:</label>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Enter subject..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message:</label>
            <textarea
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              placeholder="Type your message..."
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              alert('Email sent!');
              onClose();
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Send Email
          </button>
        </div>
      </div>
    </div>
  );
};

interface CallLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactName: string;
}

export const CallLogModal: React.FC<CallLogModalProps> = ({ isOpen, onClose, contactName }) => {
  const [notes, setNotes] = useState('');
  const [outcome, setOutcome] = useState('Connected');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Log Call</h3>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact:</label>
            <input
              type="text"
              value={contactName}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Outcome:</label>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option>Connected</option>
              <option>Voicemail</option>
              <option>No Answer</option>
              <option>Busy</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes:</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Call notes..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              alert('Call logged!');
              onClose();
            }}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Save Call
          </button>
        </div>
      </div>
    </div>
  );
};

interface MeetingSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendees?: string[];
  onSchedule: (details: any) => void;
}

export const MeetingSchedulerModal: React.FC<MeetingSchedulerModalProps> = ({
  isOpen,
  onClose,
  attendees = [],
  onSchedule
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Meeting</h3>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Meeting title"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date:</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time:</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {attendees.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attendees:</label>
              <div className="text-sm text-gray-600">{attendees.join(', ')}</div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSchedule({ title, date, time });
              onClose();
            }}
            disabled={!title || !date || !time}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
          >
            Schedule
          </button>
        </div>
      </div>
    </div>
  );
};
