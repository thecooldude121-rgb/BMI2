import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, ChevronDown, ChevronRight, User, Building2, Target, DollarSign, Calendar, TrendingUp, Mail, Phone, Linkedin, MapPin } from 'lucide-react';

interface QualifyLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  lead: {
    name: string;
    company: string;
    title?: string;
    email?: string;
    phone?: string;
    linkedin?: string;
  };
  aiScore: number;
  bantScore: number;
  assignedTo: string;
  hasIncompleteBANT?: boolean;
  opportunityAmount?: number;
  closeDate?: string;
  stage?: string;
  probability?: number;
}

const QualifyLeadModal: React.FC<QualifyLeadModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  lead,
  aiScore,
  bantScore,
  assignedTo,
  hasIncompleteBANT = false,
  opportunityAmount = 75000,
  closeDate = 'Feb 15, 2025',
  stage = 'Discovery',
  probability = 40
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    contact: true,
    company: false,
    bant: false,
    professional: false,
    notes: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getScoreRating = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 75) return 'Good';
    if (percentage >= 60) return 'Fair';
    return 'Needs Improvement';
  };

  const getScoreColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 90) return 'text-emerald-600';
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const renderProgressBar = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    const filledDots = Math.round((percentage / 100) * 10);

    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full ${
              i < filledDots ? 'bg-emerald-600' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold text-gray-900">
            CONFIRM QUALIFICATION & CRM SYNC
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-gray-700">
            You're about to qualify and sync this lead to CRM:
          </p>

          {/* Lead Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold text-gray-900">Lead Information</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="text-sm font-medium text-gray-900">{lead.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Company</p>
                <p className="text-sm font-medium text-gray-900">{lead.company}</p>
              </div>
              {lead.title && (
                <div>
                  <p className="text-sm text-gray-600">Title</p>
                  <p className="text-sm font-medium text-gray-900">{lead.title}</p>
                </div>
              )}
              {lead.email && (
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {lead.email}
                  </p>
                </div>
              )}
              {lead.phone && (
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {lead.phone}
                  </p>
                </div>
              )}
              {lead.linkedin && (
                <div>
                  <p className="text-sm text-gray-600">LinkedIn</p>
                  <p className="text-sm font-medium text-blue-600 flex items-center gap-1">
                    <Linkedin className="h-3 w-3" />
                    Profile
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Qualification Scores */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5 text-emerald-600" />
              <h4 className="font-semibold text-gray-900">Qualification Scores</h4>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">AI Score: {aiScore}/100</span>
                  <span className={`text-sm font-semibold ${getScoreColor(aiScore, 100)}`}>
                    ({getScoreRating(aiScore, 100)})
                  </span>
                </div>
                {renderProgressBar(aiScore, 100)}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">BANT Score: {bantScore}/20</span>
                  <span className={`text-sm font-semibold ${getScoreColor(bantScore, 20)}`}>
                    {bantScore === 20 ? '(Perfect)' : `(${getScoreRating(bantScore, 20)})`}
                  </span>
                </div>
                {renderProgressBar(bantScore, 20)}
              </div>
              <div className="pt-2 border-t border-emerald-200">
                <p className="text-sm text-gray-700">
                  Status Change: <span className="text-orange-600 font-medium">Contacted</span> → <span className="text-emerald-600 font-medium">Qualified</span> <CheckCircle className="inline h-4 w-4 text-emerald-600" />
                </p>
              </div>
            </div>
          </div>

          {/* CRM Opportunity Preview */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">CRM Opportunity Preview</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-gray-600">Opportunity Name</p>
                <p className="text-sm font-medium text-gray-900">{lead.company} - {lead.title?.split(' ')[0] || 'Contact'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Amount</p>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {opportunityAmount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Close Date</p>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {closeDate}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Stage</p>
                <p className="text-sm font-medium text-gray-900">{stage}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Probability</p>
                <p className="text-sm font-medium text-gray-900">{probability}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Type</p>
                <p className="text-sm font-medium text-gray-900">New Business</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-600">Owner</p>
                <p className="text-sm font-medium text-gray-900">{assignedTo}</p>
              </div>
            </div>
          </div>

          {/* This action will */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <h4 className="font-semibold text-gray-900">This action will:</h4>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>Update lead status to "Qualified"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>Create CRM opportunity (ID: auto-generated)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>Sync contact information (5 fields)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>Sync company information (8 fields)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>Sync BANT assessment (4 components)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>Sync enrichment data (20 fields)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>Add qualification notes to CRM activity</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>Send email notification to {assignedTo}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>Create calendar reminder for Jan 15 demo</span>
              </li>
            </ul>
          </div>

          {/* Important warnings */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="font-semibold text-gray-900">Important:</p>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    <span>This action cannot be undone</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    <span>Lead will be removed from Lead Gen tool active list</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    <span>All future updates must be made in CRM</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    <span>Estimated sync time: 5-10 seconds</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Fields to Sync - Expandable */}
          <div className="border border-gray-200 rounded-lg">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-gray-600" />
                <h4 className="font-semibold text-gray-900">Fields to Sync</h4>
                <span className="text-sm text-gray-500">(Expand to see details)</span>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {/* Contact Information */}
              <button
                onClick={() => toggleSection('contact')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  {expandedSections.contact ? (
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  )}
                  <span className="text-sm font-medium text-gray-900">Contact Information</span>
                  <span className="text-sm text-gray-500">(5 fields)</span>
                </div>
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              </button>
              {expandedSections.contact && (
                <div className="px-4 py-3 bg-gray-50 text-sm text-gray-700">
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-white border border-gray-200 rounded">Email</span>
                    <span className="px-2 py-1 bg-white border border-gray-200 rounded">Phone</span>
                    <span className="px-2 py-1 bg-white border border-gray-200 rounded">LinkedIn</span>
                    <span className="px-2 py-1 bg-white border border-gray-200 rounded">Mobile</span>
                    <span className="px-2 py-1 bg-white border border-gray-200 rounded">Office Location</span>
                  </div>
                </div>
              )}

              {/* Company Information */}
              <button
                onClick={() => toggleSection('company')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  {expandedSections.company ? (
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  )}
                  <span className="text-sm font-medium text-gray-900">Company Information</span>
                  <span className="text-sm text-gray-500">(8 fields)</span>
                </div>
              </button>
              {expandedSections.company && (
                <div className="px-4 py-3 bg-gray-50 text-sm text-gray-700">
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-white border border-gray-200 rounded">Company Name</span>
                    <span className="px-2 py-1 bg-white border border-gray-200 rounded">Industry</span>
                    <span className="px-2 py-1 bg-white border border-gray-200 rounded">Company Size</span>
                    <span className="px-2 py-1 bg-white border border-gray-200 rounded">Revenue</span>
                    <span className="px-2 py-1 bg-white border border-gray-200 rounded">Location</span>
                    <span className="px-2 py-1 bg-white border border-gray-200 rounded">Website</span>
                    <span className="px-2 py-1 bg-white border border-gray-200 rounded">Founded Year</span>
                    <span className="px-2 py-1 bg-white border border-gray-200 rounded">Funding</span>
                  </div>
                </div>
              )}

              {/* BANT Assessment */}
              <button
                onClick={() => toggleSection('bant')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  {expandedSections.bant ? (
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  )}
                  <span className="text-sm font-medium text-gray-900">BANT Assessment</span>
                  <span className="text-sm text-gray-500">(4 components)</span>
                </div>
              </button>
              {expandedSections.bant && (
                <div className="px-4 py-3 bg-gray-50 text-sm text-gray-700">
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-white border border-gray-200 rounded">Budget</span>
                    <span className="px-2 py-1 bg-white border border-gray-200 rounded">Authority</span>
                    <span className="px-2 py-1 bg-white border border-gray-200 rounded">Need</span>
                    <span className="px-2 py-1 bg-white border border-gray-200 rounded">Timeline</span>
                  </div>
                </div>
              )}

              {/* Professional Details */}
              <button
                onClick={() => toggleSection('professional')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  {expandedSections.professional ? (
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  )}
                  <span className="text-sm font-medium text-gray-900">Professional Details</span>
                  <span className="text-sm text-gray-500">(7 fields)</span>
                </div>
              </button>
              {expandedSections.professional && (
                <div className="px-4 py-3 bg-gray-50 text-sm text-gray-700">
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-white border border-gray-200 rounded">Title</span>
                    <span className="px-2 py-1 bg-white border border-gray-200 rounded">Department</span>
                    <span className="px-2 py-1 bg-white border border-gray-200 rounded">Seniority</span>
                    <span className="px-2 py-1 bg-white border border-gray-200 rounded">Years of Experience</span>
                    <span className="px-2 py-1 bg-white border border-gray-200 rounded">Skills</span>
                    <span className="px-2 py-1 bg-white border border-gray-200 rounded">Education</span>
                    <span className="px-2 py-1 bg-white border border-gray-200 rounded">Certifications</span>
                  </div>
                </div>
              )}

              {/* Qualification Notes */}
              <button
                onClick={() => toggleSection('notes')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  {expandedSections.notes ? (
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  )}
                  <span className="text-sm font-medium text-gray-900">Qualification Notes & History</span>
                </div>
              </button>
              {expandedSections.notes && (
                <div className="px-4 py-3 bg-gray-50 text-sm text-gray-700">
                  All qualification notes, activity history, and engagement data will be synced to CRM timeline.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200 sticky bottom-0">
          <button
            onClick={onConfirm}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            <CheckCircle className="h-5 w-5" />
            Confirm & Sync to CRM
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default QualifyLeadModal;
