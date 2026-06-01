import React from 'react';
import { Users, Mail, Phone, Linkedin, Star, Building2, TrendingUp, MessageSquare, Calendar, ExternalLink } from 'lucide-react';

export interface Contact {
  id: string;
  name: string;
  title: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  role: 'decision-maker' | 'influencer' | 'champion' | 'user' | 'other';
  isHRMSConnection?: boolean;
  engagementScore?: number;
  lastContactDate?: string;
  totalInteractions?: number;
  photoUrl?: string;
}

interface EnhancedContactsSectionProps {
  contacts: Contact[];
  onContactClick?: (contactId: string) => void;
  onAddContact?: () => void;
  onSearchLinkedIn?: () => void;
  onAskForIntro?: () => void;
  onExpandOrgChart?: () => void;
  onFindMissingContacts?: () => void;
  onViewAllActivities?: () => void;
}

const EnhancedContactsSection: React.FC<EnhancedContactsSectionProps> = ({
  contacts,
  onContactClick,
  onAddContact,
  onSearchLinkedIn,
  onAskForIntro,
  onExpandOrgChart,
  onFindMissingContacts,
  onViewAllActivities
}) => {
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'decision-maker':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'champion':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'influencer':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'user':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRoleLabel = (role: string) => {
    return role
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getEngagementColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const decisionMakers = contacts.filter((c) => c.role === 'decision-maker');
  const champions = contacts.filter((c) => c.role === 'champion');
  const influencers = contacts.filter((c) => c.role === 'influencer');
  const hrmsConnections = contacts.filter((c) => c.isHRMSConnection);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">KEY CONTACTS</h3>
              <p className="text-xs text-gray-500">
                {contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'} • {hrmsConnections.length} HRMS
              </p>
            </div>
          </div>
          <button
            onClick={onAddContact}
            className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200"
          >
            + Add Contact
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="bg-red-50 rounded-lg p-3 border border-red-100 text-center">
            <p className="text-2xl font-bold text-red-700">{decisionMakers.length}</p>
            <p className="text-xs text-red-600">Decision Makers</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 border border-purple-100 text-center">
            <p className="text-2xl font-bold text-purple-700">{champions.length}</p>
            <p className="text-xs text-purple-600">Champions</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 text-center">
            <p className="text-2xl font-bold text-blue-700">{influencers.length}</p>
            <p className="text-xs text-blue-600">Influencers</p>
          </div>
        </div>

        {/* HRMS Connections Highlight */}
        {hrmsConnections.length > 0 && (
          <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center space-x-2 mb-2">
              <Building2 className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-bold text-orange-900">HRMS CONNECTIONS</span>
              <span className="px-2 py-0.5 bg-orange-200 text-orange-800 rounded text-xs font-bold">
                {hrmsConnections.length}
              </span>
            </div>
            <p className="text-xs text-orange-800">
              These contacts are verified through your HRMS integration
            </p>
          </div>
        )}

        {/* Contacts List */}
        <div className="space-y-3">
          {contacts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm">No contacts available</p>
            </div>
          ) : (
            contacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => onContactClick?.(contact.id)}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
              >
                {/* Contact Header */}
                <div className="flex items-start space-x-3 mb-3">
                  {/* Avatar */}
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {contact.photoUrl ? (
                      <img
                        src={contact.photoUrl}
                        alt={contact.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      contact.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-bold text-gray-900 truncate">{contact.name}</h4>
                      {contact.isHRMSConnection && (
                        <Building2 className="h-4 w-4 text-orange-600 flex-shrink-0" title="HRMS Connection" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-2 truncate">{contact.title}</p>

                    {/* Role Badge */}
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getRoleBadgeColor(contact.role)}`}>
                        {getRoleLabel(contact.role)}
                      </span>
                      {contact.engagementScore !== undefined && (
                        <div className="flex items-center space-x-1">
                          <Star className={`h-3 w-3 ${getEngagementColor(contact.engagementScore)}`} />
                          <span className={`text-xs font-semibold ${getEngagementColor(contact.engagementScore)}`}>
                            {contact.engagementScore}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Details */}
                <div className="space-y-2 mb-3">
                  {contact.email && (
                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                      <Mail className="h-3 w-3" />
                      <a
                        href={`mailto:${contact.email}`}
                        className="hover:text-blue-600"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {contact.email}
                      </a>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                      <Phone className="h-3 w-3" />
                      <a
                        href={`tel:${contact.phone}`}
                        className="hover:text-blue-600"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {contact.phone}
                      </a>
                    </div>
                  )}
                  {contact.linkedinUrl && (
                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                      <Linkedin className="h-3 w-3" />
                      <a
                        href={contact.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 flex items-center space-x-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span>View LinkedIn</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Engagement Stats */}
                {(contact.lastContactDate || contact.totalInteractions) && (
                  <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
                    {contact.lastContactDate && (
                      <div className="flex items-center space-x-1 text-gray-600">
                        <Calendar className="h-3 w-3" />
                        <span>Last: {contact.lastContactDate}</span>
                      </div>
                    )}
                    {contact.totalInteractions !== undefined && (
                      <div className="flex items-center space-x-1 text-gray-600">
                        <MessageSquare className="h-3 w-3" />
                        <span>{contact.totalInteractions} interactions</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Coverage Analysis */}
        {contacts.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Coverage Analysis</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Decision Maker Coverage</span>
                <span className={`font-semibold ${decisionMakers.length > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {decisionMakers.length > 0 ? '✓ Covered' : '✗ Missing'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Champion Coverage</span>
                <span className={`font-semibold ${champions.length > 0 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {champions.length > 0 ? '✓ Covered' : '⚠ Recommended'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Multi-threading Score</span>
                <span className={`font-semibold ${contacts.length >= 3 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {contacts.length >= 3 ? 'Strong' : 'Weak'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedContactsSection;
