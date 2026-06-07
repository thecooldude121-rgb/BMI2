import React, { useState } from 'react';
import { Building2, TrendingUp, MapPin, Globe, Sparkles, AlertTriangle, Users, Mail, Phone, Eye, Award, Briefcase, Trophy, DollarSign, Settings, Star, Plus, X, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dotColor, computeEngagementDirection, isSilenceAlert } from '../../utils/contactEngagement';
import type { DirectionResult } from '../../utils/contactEngagement';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EngagementBreakdown {
  emailsSent: number;
  emailsOpened: number;
  emailsReplied: number;
  callsMade: number;
  callsAnswered: number;
  meetingsScheduled: number;
  meetingsAttended: number;
}

interface Contact {
  id: string;
  name: string;
  title: string;
  role: 'Champion' | 'Decision Maker' | 'Economic Buyer' | 'Technical Evaluator' | 'Executive Sponsor' | 'Influencer' | 'User';
  email?: string;
  phone?: string;
  lastContact?: string;
  daysAgo?: number;
  engagement?: string;
  status?: 'active' | 'pending';
  engagementDots?: (number | null)[];
  engagementBreakdown?: EngagementBreakdown;
}

interface DealAccountContactsProps {
  account: {
    name: string;
    industry: string;
    size: string;
    revenue: string;
    location: string;
    website: string;
    fundingRound?: string;
    fundingAmount?: string;
    fundingDate?: string;
    growthRate?: string;
    hiringTrend?: string;
    techStack?: string[];
    competitors?: string[];
  };
  contacts: Contact[];
  hrmsConnection: {
    hasHistory: boolean;
    opportunity?: string;
  };
  onViewAccount?: () => void;
  onAddToHRMS?: () => void;
  onFindCEO?: () => void;
  onRequestIntro?: () => void;
  onAddContact?: (role?: string) => void;
  onEmail?: (to: string, subject: string, body: string) => void;
  onCall?: () => void;
  dataQuality?: { accuracy: number; lastEnriched: string };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const DOT_BG: Record<string, string> = {
  green: 'bg-green-500',
  amber: 'bg-amber-400',
  grey:  'bg-gray-300',
};

function EngagementSparkline({ dots }: { dots: (number | null)[] }) {
  // display oldest → newest (left to right); dots are stored newest-first
  const ordered = [...dots].reverse();
  return (
    <div className="flex items-center gap-1">
      {ordered.map((hours, i) => (
        <div
          key={i}
          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${DOT_BG[dotColor(hours)]}`}
          title={hours !== null ? `${hours}h response time` : 'No response'}
        />
      ))}
    </div>
  );
}

function DirectionBadge({ dir }: { dir: DirectionResult }) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold rounded border ${dir.colorClass} ${dir.bgClass} ${dir.borderClass}`}>
      {dir.label}
    </span>
  );
}

function FunnelRow({ label, value, total, colorClass }: { label: string; value: number; total: number; colorClass: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-20 text-xs text-gray-500 flex-shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className={`h-2 rounded-full transition-all ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-5 text-right text-xs font-semibold text-gray-800 flex-shrink-0">{value}</span>
      <span className="w-8 text-right text-xs text-gray-400 flex-shrink-0">{pct}%</span>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isPlaceholder = (name: string): boolean =>
  !name || /\bTBD\b|\bUnknown\b/i.test(name.trim());

const getRoleActionIcon = (role: string): React.ElementType => {
  switch (role) {
    case 'Decision Maker':       return Briefcase;
    case 'Champion':             return Trophy;
    case 'Economic Buyer':       return DollarSign;
    case 'Technical Evaluator':  return Settings;
    case 'Executive Sponsor':    return Star;
    default:                     return Plus;
  }
};

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'Champion':       return '🏆';
    case 'Decision Maker': return '👔';
    case 'Influencer':     return '💡';
    default:               return '👤';
  }
};

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case 'Champion':       return 'bg-yellow-100 text-yellow-800';
    case 'Decision Maker': return 'bg-purple-100 text-purple-800';
    case 'Influencer':     return 'bg-blue-100 text-blue-800';
    default:               return 'bg-gray-100 text-gray-800';
  }
};

// ─── Main component ───────────────────────────────────────────────────────────

export const DealAccountContacts: React.FC<DealAccountContactsProps> = ({
  account,
  contacts,
  hrmsConnection,
  onViewAccount,
  onAddToHRMS,
  onFindCEO,
  onRequestIntro,
  onAddContact,
  onEmail,
  onCall,
  dataQuality,
}) => {
  const navigate = useNavigate();
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [breakdownContact, setBreakdownContact] = useState<Contact | null>(null);

  const openBreakdown = (contact: Contact) => {
    setBreakdownContact(contact);
    setShowBreakdownModal(true);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Building2 className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Account & Contacts</h2>
        </div>
        <button
          onClick={onViewAccount}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          View Account
        </button>
      </div>

      {/* Account Information */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-bold text-gray-900">{account.name}</h3>
          {dataQuality && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-medium rounded-full border border-green-200 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
              {dataQuality.accuracy}% accurate · enriched {dataQuality.lastEnriched}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <span className="text-sm text-gray-600">Industry:</span>
            <div className="text-sm font-medium text-gray-900">{account.industry}</div>
          </div>
          <div>
            <span className="text-sm text-gray-600">Size:</span>
            <div className="text-sm font-medium text-gray-900">{account.size}</div>
          </div>
          <div>
            <span className="text-sm text-gray-600">Revenue:</span>
            <div className="text-sm font-medium text-gray-900">{account.revenue}</div>
          </div>
          <div>
            <span className="text-sm text-gray-600">Location:</span>
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-900">{account.location}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Globe className="h-4 w-4" />
          <a href={`https://${account.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {account.website}
          </a>
        </div>
      </div>

      {/* Company Intelligence */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <div className="flex items-center space-x-2 mb-4">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <h3 className="text-sm font-semibold text-gray-900">Company Intelligence:</h3>
        </div>
        <div className="space-y-3">
          {account.fundingRound && (
            <div className="flex items-start space-x-2">
              <TrendingUp className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-900">
                Recent funding: <span className="font-medium">{account.fundingAmount} {account.fundingRound}</span> ({account.fundingDate})
              </div>
            </div>
          )}
          {account.growthRate && (
            <div className="flex items-start space-x-2">
              <TrendingUp className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-900">
                Growth rate: <span className="font-medium">{account.growthRate}</span>
              </div>
            </div>
          )}
          {account.hiringTrend && (
            <div className="flex items-start space-x-2">
              <Users className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-900">
                Hiring trend: <span className="font-medium">{account.hiringTrend}</span>
              </div>
            </div>
          )}
          {account.techStack && (
            <div className="flex items-start space-x-2">
              <Globe className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-900">
                Tech stack: <span className="font-medium">{account.techStack.join(', ')}</span>
                {account.competitors && account.competitors.length > 0 && (
                  <div className="mt-1 flex items-center space-x-1">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-yellow-700 font-medium">
                      Currently using {account.competitors.join(', ')} (competitor{account.competitors.length > 1 ? 's' : ''}!)
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* HRMS Connection */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <div className="flex items-center space-x-2 mb-3">
          <Briefcase className="h-5 w-5 text-orange-600" />
          <h3 className="text-sm font-semibold text-gray-900">🏢 HRMS Connection Status</h3>
          <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs font-bold rounded">INTEGRATION</span>
        </div>
        {hrmsConnection.hasHistory ? (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200">
            <div className="flex items-center space-x-2 mb-3">
              <Award className="h-5 w-5 text-green-600" />
              <span className="text-sm font-bold text-green-900">✨ Recruited from this company!</span>
            </div>
            <div className="bg-white rounded-lg p-3 mb-3 border border-green-200">
              <div className="text-sm font-semibold text-gray-900 mb-1">Sarah Lee (CFO)</div>
              <div className="text-xs text-gray-600">Hired: Nov 2024 • Currently employed</div>
            </div>
            <div className="bg-green-100 rounded-lg p-3 border border-green-300">
              <div className="text-xs font-bold text-green-900 mb-1">💡 Warm Intro Advantage:</div>
              <div className="text-xs text-green-800">
                Deals with HRMS connections have <span className="font-bold">33% higher close rate</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/hrms')}
              className="mt-3 w-full px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              View HRMS History
            </button>
          </div>
        ) : (
          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
            <div className="flex items-start space-x-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-900">⚠️ No recruitment history</div>
                {hrmsConnection.opportunity && (
                  <div className="text-xs text-gray-700 mt-1">
                    <span className="font-semibold">💡 Opportunity:</span> {hrmsConnection.opportunity}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onAddToHRMS}
              className="mt-2 px-3 py-1.5 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
            >
              Add to HRMS Target List
            </button>
          </div>
        )}
      </div>

      {/* Deal Contacts */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Deal Contacts ({contacts.filter(c => !isPlaceholder(c.name)).length}):
        </h3>
        <div className="space-y-4">
          {contacts.map((contact) => {
            if (isPlaceholder(contact.name)) {
              const ActionIcon = getRoleActionIcon(contact.role);
              return (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => onAddContact?.(contact.role)}
                  className="w-full flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all group text-left"
                >
                  <div className="w-10 h-10 rounded-lg border-2 border-dashed border-gray-300 group-hover:border-blue-400 flex items-center justify-center flex-shrink-0 transition-colors">
                    <ActionIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">+ Add {contact.role}</div>
                    <div className="text-xs mt-0.5">Click to assign a contact to this role</div>
                  </div>
                </button>
              );
            }

            const dots = contact.engagementDots;
            const dir = dots && dots.length >= 4 ? computeEngagementDirection(dots) : null;
            const silenced = isSilenceAlert(contact.daysAgo, dots);

            return (
              <div
                key={contact.id}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors"
              >
                {/* Header row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                      {contact.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{contact.name}</div>
                      <div className="text-sm text-gray-600">{contact.title}</div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-lg">{getRoleIcon(contact.role)}</span>
                        <span className={`px-2 py-0.5 ${getRoleBadgeColor(contact.role)} text-xs font-bold rounded`}>
                          {contact.role}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {contact.status === 'active' ? (
                  <>
                    {contact.email && (
                      <div className="flex items-center space-x-2 text-sm text-gray-700 mb-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span>{contact.email}</span>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center space-x-2 text-sm text-gray-700 mb-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{contact.phone}</span>
                      </div>
                    )}
                    {contact.lastContact && (
                      <div className="text-sm text-gray-600 mb-2">
                        Last Contact: <span className="font-medium">{contact.lastContact} ({contact.daysAgo} days ago)</span>
                      </div>
                    )}

                    {/* ── Engagement sparkline + direction badge ── */}
                    {dots && dots.length > 0 && (
                      <div className="flex items-center gap-2 mb-2">
                        <EngagementSparkline dots={dots} />
                        {dir && <DirectionBadge dir={dir} />}
                        {contact.engagementBreakdown && (
                          <button
                            onClick={() => openBreakdown(contact)}
                            className="ml-auto flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <BarChart2 className="h-3 w-3" />
                            Response Rate
                          </button>
                        )}
                      </div>
                    )}

                    {/* ── Silence alert banner ── */}
                    {silenced && (
                      <div className="mb-3 flex items-start gap-2 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-amber-900">Gone quiet — {contact.daysAgo} days silent</p>
                          <p className="text-xs text-amber-700">Was responding in &lt;{(() => {
                            const nonNull = (dots ?? []).filter((d): d is number => d !== null);
                            return nonNull.length ? Math.round(nonNull.reduce((a, b) => a + b, 0) / nonNull.length) : 48;
                          })()}h avg. Act now.</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => onEmail?.(contact.email || '', 'Following up', '')}
                            className="px-2 py-1 bg-amber-600 text-white rounded text-[10px] font-bold hover:bg-amber-700 transition-colors"
                          >
                            Email
                          </button>
                          <button
                            onClick={() => onCall?.()}
                            className="px-2 py-1 bg-gray-700 text-white rounded text-[10px] font-bold hover:bg-gray-800 transition-colors"
                          >
                            Call
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Legacy engagement text (hidden when sparkline present) */}
                    {!dots && contact.engagement && (
                      <div className="text-sm text-gray-600 mb-3">
                        Engagement: <span className="font-medium text-green-600">{contact.engagement}</span>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center space-x-2 mt-2">
                      <button
                        onClick={() => onEmail?.(contact.email || '', 'Following up', '')}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        <Mail className="h-4 w-4 inline mr-1" />
                        Email
                      </button>
                      <button
                        onClick={() => onCall?.()}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        <Phone className="h-4 w-4 inline mr-1" />
                        Call
                      </button>
                      <button
                        onClick={() => navigate(`/crm/contacts/${contact.id}`)}
                        className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                      >
                        <Eye className="h-4 w-4 inline mr-1" />
                        View Contact
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm text-gray-600 mb-3">
                      Status: <span className="font-medium text-yellow-600">Not yet engaged</span>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-2 border border-purple-200 mb-3">
                      <div className="flex items-center space-x-2 text-sm text-purple-900">
                        <Sparkles className="h-4 w-4" />
                        <span className="font-semibold">Recommendation:</span>
                        <span>Get introduction</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={onFindCEO}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Find {contact.role === 'Decision Maker' ? 'CEO' : 'Contact'}
                      </button>
                      <button
                        onClick={onRequestIntro}
                        className="px-3 py-1.5 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                      >
                        Request Intro
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={() => onAddContact?.()}
          className="mt-4 w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          <Plus className="h-5 w-5" />
          <span>Add Contact to Deal</span>
        </button>
      </div>

      {/* ── Response Rate Modal ───────────────────────────────────────────── */}
      {showBreakdownModal && breakdownContact?.engagementBreakdown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowBreakdownModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-base font-bold text-gray-900">{breakdownContact.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">Response Rate Breakdown</div>
              </div>
              <button
                onClick={() => setShowBreakdownModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Emails funnel */}
            <div className="mb-5">
              <div className="flex items-center gap-1.5 mb-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Emails</span>
              </div>
              <FunnelRow
                label="Sent"
                value={breakdownContact.engagementBreakdown.emailsSent}
                total={breakdownContact.engagementBreakdown.emailsSent}
                colorClass="bg-blue-400"
              />
              <FunnelRow
                label="Opened"
                value={breakdownContact.engagementBreakdown.emailsOpened}
                total={breakdownContact.engagementBreakdown.emailsSent}
                colorClass="bg-blue-500"
              />
              <FunnelRow
                label="Replied"
                value={breakdownContact.engagementBreakdown.emailsReplied}
                total={breakdownContact.engagementBreakdown.emailsSent}
                colorClass="bg-blue-600"
              />
            </div>

            {/* Calls funnel */}
            <div className="mb-5">
              <div className="flex items-center gap-1.5 mb-2">
                <Phone className="h-4 w-4 text-green-600" />
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Calls</span>
              </div>
              <FunnelRow
                label="Made"
                value={breakdownContact.engagementBreakdown.callsMade}
                total={breakdownContact.engagementBreakdown.callsMade}
                colorClass="bg-green-400"
              />
              <FunnelRow
                label="Answered"
                value={breakdownContact.engagementBreakdown.callsAnswered}
                total={breakdownContact.engagementBreakdown.callsMade}
                colorClass="bg-green-600"
              />
            </div>

            {/* Meetings funnel */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <BarChart2 className="h-4 w-4 text-purple-600" />
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Meetings</span>
              </div>
              <FunnelRow
                label="Scheduled"
                value={breakdownContact.engagementBreakdown.meetingsScheduled}
                total={breakdownContact.engagementBreakdown.meetingsScheduled}
                colorClass="bg-purple-400"
              />
              <FunnelRow
                label="Attended"
                value={breakdownContact.engagementBreakdown.meetingsAttended}
                total={breakdownContact.engagementBreakdown.meetingsScheduled}
                colorClass="bg-purple-600"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
