import React from 'react';
import { X, Mail, Phone, Linkedin, MapPin, ChevronLeft, ChevronRight, ExternalLink, Plus, MessageSquare } from 'lucide-react';

interface Prospect {
  id: string;
  fullName: string;
  title: string;
  companyName: string;
  email: string;
  phone?: string;
  linkedinUrl?: string;
  companyLocation?: string;
  leadScore: number;
  aiScore: number;
  dataQuality: number;
  tags: string[];
}

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

interface ProspectQuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  prospect: Prospect | null;
  onPrevious?: () => void;
  onNext?: () => void;
  onViewFull: (id: string) => void;
}

const ProspectQuickViewModal: React.FC<ProspectQuickViewModalProps> = ({
  isOpen,
  onClose,
  prospect,
  onPrevious,
  onNext,
  onViewFull
}) => {
  if (!isOpen || !prospect) return null;

  const mockActivities: Activity[] = [
    {
      id: '1',
      type: 'email_sent',
      description: 'Sent introduction email',
      timestamp: '2024-01-20T10:00:00Z'
    },
    {
      id: '2',
      type: 'email_opened',
      description: 'Opened email: Introduction to our platform',
      timestamp: '2024-01-20T11:30:00Z'
    },
    {
      id: '3',
      type: 'status_changed',
      description: 'Status changed to Qualified',
      timestamp: '2024-01-21T09:15:00Z'
    }
  ];

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            {onPrevious && (
              <button
                onClick={onPrevious}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{prospect.fullName}</h2>
              <p className="text-gray-600">{prospect.title} at {prospect.companyName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {onNext && (
              <button
                onClick={onNext}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h3>
            <div className="space-y-2">
              <a
                href={`mailto:${prospect.email}`}
                className="flex items-center space-x-3 text-sm text-gray-700 hover:text-blue-600 transition-colors"
              >
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{prospect.email}</span>
              </a>
              {prospect.phone && (
                <div className="flex items-center space-x-3 text-sm text-gray-700">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{prospect.phone}</span>
                </div>
              )}
              {prospect.linkedinUrl && (
                <a
                  href={prospect.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Linkedin className="h-4 w-4" />
                  <span>LinkedIn Profile</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {prospect.companyLocation && (
                <div className="flex items-center space-x-3 text-sm text-gray-700">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{prospect.companyLocation}</span>
                </div>
              )}
            </div>
          </div>

          {/* Lead Scores */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Lead Scores</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-600 mb-1">Lead Score</div>
                <div className="flex items-center space-x-2">
                  <div className="text-2xl font-bold text-gray-900">{prospect.leadScore}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${getScoreColor(prospect.leadScore)}`}
                      style={{ width: `${prospect.leadScore}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-600 mb-1">AI Score</div>
                <div className="flex items-center space-x-2">
                  <div className="text-2xl font-bold text-gray-900">{prospect.aiScore}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${getScoreColor(prospect.aiScore)}`}
                      style={{ width: `${prospect.aiScore}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-600 mb-1">Quality</div>
                <div className="flex items-center space-x-2">
                  <div className="text-2xl font-bold text-gray-900">{prospect.dataQuality}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${getScoreColor(prospect.dataQuality)}`}
                      style={{ width: `${prospect.dataQuality}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          {prospect.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {prospect.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Activity</h3>
            <div className="space-y-3">
              {mockActivities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                  <div className="flex-1">
                    <p className="text-gray-900">{activity.description}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{getTimeAgo(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center space-x-2">
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </button>
            <button className="flex items-center px-4 py-2 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </button>
          </div>
          <button
            onClick={() => onViewFull(prospect.id)}
            className="flex items-center px-4 py-2 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            View Full Profile
            <ExternalLink className="h-4 w-4 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProspectQuickViewModal;
