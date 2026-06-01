import React, { useState } from 'react';
import { X } from 'lucide-react';

interface TeamMember {
  user_id: string;
  user_name: string;
  user_avatar: string;
  user_email: string;
}

interface ShareDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (userId: string, visibility: string, message: string) => void;
  documentName: string;
  teamMembers?: TeamMember[];
}

const ShareDocumentModal: React.FC<ShareDocumentModalProps> = ({
  isOpen,
  onClose,
  onShare,
  documentName,
  teamMembers = []
}) => {
  const [selectedUser, setSelectedUser] = useState('');
  const [visibility, setVisibility] = useState('team');
  const [message, setMessage] = useState('');

  const defaultTeamMembers = [
    { user_id: 'user_4', user_name: 'Emily Davis', user_avatar: 'ED', user_email: 'emily.davis@bmi.com' },
    { user_id: 'user_5', user_name: 'David Wilson', user_avatar: 'DW', user_email: 'david.wilson@bmi.com' },
    { user_id: 'user_6', user_name: 'Lisa Brown', user_avatar: 'LB', user_email: 'lisa.brown@bmi.com' }
  ];

  const members = teamMembers.length > 0 ? teamMembers : defaultTeamMembers;

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
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">Select user...</option>
              {members.map((member) => (
                <option key={member.user_id} value={member.user_id}>
                  {member.user_name} ({member.user_email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Visibility
            </label>
            <select
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
            <textarea
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
          <button
            onClick={handleShare}
            disabled={!selectedUser}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Share Doc
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareDocumentModal;
