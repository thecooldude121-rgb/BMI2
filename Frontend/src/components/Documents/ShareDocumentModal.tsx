import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { X } from 'lucide-react';

interface TeamMember {
  user_id: string;
  user_name: string;
  user_avatar: string;
  user_email: string;
  /** The server's own role string, shown as-is. Optional for older callers. */
  user_role?: string;
}

interface ShareDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (userId: string, visibility: string, message: string) => void;
  documentName: string;
  teamMembers?: TeamMember[];
  /** Distinguishes "still loading" from "nobody to share with". */
  membersLoading?: boolean;
  /** Distinguishes "the roster failed" from "you work alone". */
  membersError?: string | null;
}

const ShareDocumentModal: React.FC<ShareDocumentModalProps> = ({
  isOpen,
  onClose,
  onShare,
  documentName,
  teamMembers = [],
  membersLoading = false,
  membersError = null,
}) => {
  const [selectedUser, setSelectedUser] = useState('');
  const [visibility, setVisibility] = useState('team');
  const [message, setMessage] = useState('');

  /*
   * A THIRD hardcoded colleague list used to live here — the same invented
   * Emily Davis / David Wilson / Lisa Brown on @bmi.com — behind
   *
   *     teamMembers.length > 0 ? teamMembers : defaultTeamMembers
   *
   * which made it the worst of the three: a caller passing a REAL but empty
   * roster silently got the fabricated people instead. A fallback that
   * activates precisely when the true answer is "nobody" cannot be noticed by
   * the caller, and both callers were themselves passing hardcoded lists, so
   * nothing ever exercised this branch honestly.
   *
   * The list now comes from the caller or it is empty, and empty says so.
   */
  const members = teamMembers;

  const visibilityOptions = [
    { value: 'private', label: 'Private (Only me)' },
    { value: 'team', label: 'Team (Sales team)' },
    { value: 'company', label: 'Company (Everyone)' }
  ];

  const handleShare = () => {
    if (!selectedUser) {
      return;
    }
    onShare(selectedUser, visibility, message);
    setSelectedUser('');
    setVisibility('team');
    setMessage('');
    onClose();
  };

  const handleCancel = () => {
    setSelectedUser('');
    setVisibility('team');
    setMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Share Document</h2>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Share with Team Member
            </label>
            <select aria-label="Share with Team Member"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">
                {membersLoading ? 'Loading members…'
                  : membersError ? 'Members unavailable'
                  : members.length === 0 ? 'No other members in this workspace'
                  : 'Select user...'}
              </option>
              {members.map((member) => (
                <option key={member.user_id} value={member.user_id}>
                  {member.user_name}
                  {member.user_role ? ` — ${member.user_role}` : ''} ({member.user_email})
                </option>
              ))}
            </select>
            {/*
              Three different empty pickers, said apart. Previously all three
              looked the same — and one of them showed invented people.
            */}
            {membersError && (
              <p role="alert" className="mt-1 text-xs text-red-600">{membersError}</p>
            )}
            {!membersLoading && !membersError && members.length === 0 && (
              <p className="mt-1 text-xs text-gray-500">
                Invite colleagues from Settings → Team to share documents with them.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Visibility
            </label>
            <select aria-label="Visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              {visibilityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Message (Optional)
            </label>
            <textarea aria-label="Message (Optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
            />
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <Button
            onClick={handleShare}
            disabled={!selectedUser}
          >
            Share Doc
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ShareDocumentModal;
