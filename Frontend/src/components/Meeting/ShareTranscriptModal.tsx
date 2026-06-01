import React, { useState } from 'react';
import { X, Share2, Copy, Check, Users } from 'lucide-react';

interface ShareTranscriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (options: ShareOptions) => void;
  transcriptUrl: string;
  meetingTitle: string;
}

export interface ShareOptions {
  teamMembers: string[];
  includeFullTranscript: boolean;
  includeAIHighlights: boolean;
  includeRecordingLink: boolean;
}

const ShareTranscriptModal: React.FC<ShareTranscriptModalProps> = ({
  isOpen,
  onClose,
  onShare,
  transcriptUrl,
  meetingTitle
}) => {
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [options, setOptions] = useState({
    includeFullTranscript: true,
    includeAIHighlights: true,
    includeRecordingLink: false
  });
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const teamMembers = [
    { id: '1', name: 'Sarah Chen', email: 'sarah.chen@company.com', avatar: 'SC' },
    { id: '2', name: 'Mike Johnson', email: 'mike.johnson@company.com', avatar: 'MJ' },
    { id: '3', name: 'Emily Davis', email: 'emily.davis@company.com', avatar: 'ED' },
    { id: '4', name: 'Robert Kim', email: 'robert.kim@company.com', avatar: 'RK' }
  ];

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(transcriptUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const toggleMember = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleShare = () => {
    onShare({
      teamMembers: selectedMembers,
      ...options
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Share2 className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Share Transcript</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Share with
            </label>
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm text-gray-700">
                  {selectedMembers.length === 0
                    ? 'Select team members...'
                    : `${selectedMembers.length} member(s) selected`}
                </span>
                <Users className="w-4 h-4 text-gray-400" />
              </button>

              {showDropdown && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {teamMembers.map((member) => (
                    <label
                      key={member.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(member.id)}
                        onChange={() => toggleMember(member.id)}
                        className="rounded"
                      />
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600">
                        {member.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        <div className="text-xs text-gray-500 truncate">{member.email}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {selectedMembers.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedMembers.map((memberId) => {
                  const member = teamMembers.find(m => m.id === memberId);
                  if (!member) return null;
                  return (
                    <div
                      key={memberId}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm"
                    >
                      <span>{member.name}</span>
                      <button
                        onClick={() => toggleMember(memberId)}
                        className="hover:text-blue-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What to share
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={options.includeFullTranscript}
                  onChange={(e) => setOptions({ ...options, includeFullTranscript: e.target.checked })}
                  className="rounded"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">Full transcript</div>
                  <div className="text-xs text-gray-500">Complete conversation with timestamps</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={options.includeAIHighlights}
                  onChange={(e) => setOptions({ ...options, includeAIHighlights: e.target.checked })}
                  className="rounded"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">AI highlights</div>
                  <div className="text-xs text-gray-500">Key moments and action items</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={options.includeRecordingLink}
                  onChange={(e) => setOptions({ ...options, includeRecordingLink: e.target.checked })}
                  className="rounded"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">Recording link</div>
                  <div className="text-xs text-gray-500">Link to video/audio recording</div>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Copy link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={transcriptUrl}
                readOnly
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-600">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={selectedMembers.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareTranscriptModal;
