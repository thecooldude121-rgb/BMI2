import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, ChevronDown, ChevronRight, User, Briefcase, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { crmSyncConfig } from '../../utils/crmSyncMockData';

interface LeadInfo {
  name: string;
  company: string;
  title: string;
  email: string;
  phone: string;
}

interface OpportunityPreview {
  opportunityName: string;
  amount: number;
  closeDate: string;
  stage: string;
  probability: number;
  type: string;
  owner: string;
}

interface CRMSyncConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  leadInfo: LeadInfo;
  aiScore: number;
  bantScore: number;
  maxBantScore: number;
  opportunityPreview: OpportunityPreview;
  hasIncompleteBANT?: boolean;
}

const CRMSyncConfirmationModal: React.FC<CRMSyncConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  leadInfo,
  aiScore,
  bantScore,
  maxBantScore,
  opportunityPreview,
  hasIncompleteBANT = false
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    contact: true,
    company: false,
    bant: false,
    professional: false,
    notes: false
  });

  const [selectedFields, setSelectedFields] = useState<Record<string, Record<string, boolean>>>({
    contact: Object.fromEntries(crmSyncConfig.fieldsToSync.contactInfo.fields.map(f => [f.name, f.selected])),
    company: Object.fromEntries(crmSyncConfig.fieldsToSync.companyInfo.fields.map(f => [f.name, f.selected])),
    bant: Object.fromEntries(crmSyncConfig.fieldsToSync.bantAssessment.fields.map(f => [f.name, f.selected])),
    professional: Object.fromEntries(crmSyncConfig.fieldsToSync.professionalDetails.fields.map(f => [f.name, f.selected])),
    notes: Object.fromEntries(crmSyncConfig.fieldsToSync.qualificationNotes.fields.map(f => [f.name, f.selected]))
  });

  if (!isOpen) return null;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleFieldSelection = (section: string, fieldName: string) => {
    setSelectedFields(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [fieldName]: !prev[section][fieldName]
      }
    }));
  };

  const getSelectedFieldCount = (section: string) => {
    return Object.values(selectedFields[section] || {}).filter(Boolean).length;
  };

  const getTotalFieldCount = (section: string) => {
    return Object.keys(selectedFields[section] || {}).length;
  };

  const criticalFields = ['Email', 'Budget', 'Authority', 'AI Score'];

  const handleConfirm = () => {
    const deselectedCritical = criticalFields.filter(field => {
      return Object.entries(selectedFields).some(([section, fields]) => {
        return fields[field] === false;
      });
    });

    if (deselectedCritical.length > 0) {
      const proceed = window.confirm(
        `Warning: You have deselected critical fields (${deselectedCritical.join(', ')}). This may affect lead quality in CRM. Continue anyway?`
      );
      if (!proceed) return;
    }

    onConfirm();
  };

  const getAIScoreLabel = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Poor';
  };

  const getAIScoreDots = (score: number) => {
    const filledDots = Math.floor(score / 10);
    return (
      <span className="flex items-center gap-0.5">
        {[...Array(10)].map((_, i) => (
          <span key={i} className={i < filledDots ? 'text-emerald-600' : 'text-gray-300'}>
            ●
          </span>
        ))}
      </span>
    );
  };

  const getBantScoreStatus = (score: number, max: number): string => {
    if (score === max) return 'Perfect';
    if (score >= 15) return 'Good';
    if (score >= 10) return 'Fair';
    return 'Low';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
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

          {hasIncompleteBANT && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900 mb-1">
                    Warning: Incomplete BANT Assessment
                  </p>
                  <p className="text-sm text-gray-700">
                    BANT score is {bantScore}/{maxBantScore}. This lead will be flagged as "Partial BANT" in CRM for follow-up.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold text-gray-900">Lead Information</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-sm text-gray-600">Name:</span>
                <p className="text-sm font-medium text-gray-900">{leadInfo.name}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Company:</span>
                <p className="text-sm font-medium text-gray-900">{leadInfo.company}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Title:</span>
                <p className="text-sm font-medium text-gray-900">{leadInfo.title}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Email:</span>
                <p className="text-sm font-medium text-gray-900">{leadInfo.email}</p>
              </div>
              <div className="col-span-2">
                <span className="text-sm text-gray-600">Phone:</span>
                <p className="text-sm font-medium text-gray-900">{leadInfo.phone}</p>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <h4 className="font-semibold text-gray-900">Qualification Scores</h4>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">AI Score:</span>
                  <span className="text-sm font-semibold text-emerald-600">
                    {aiScore}/100 ({getAIScoreLabel(aiScore)})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getAIScoreDots(aiScore)}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">BANT Score:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {bantScore}/{maxBantScore} ({getBantScoreStatus(bantScore, maxBantScore)})
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status Change:</span>
                  <span className="text-sm font-medium text-gray-900">
                    Contacted → <span className="text-emerald-600 font-semibold">Qualified ✅</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold text-gray-900">CRM Opportunity Preview</h4>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Opportunity Name:</span>
                <span className="text-sm font-medium text-gray-900">{opportunityPreview.opportunityName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Amount:</span>
                <span className="text-sm font-semibold text-emerald-600">
                  ${opportunityPreview.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Close Date:</span>
                <span className="text-sm font-medium text-gray-900">{opportunityPreview.closeDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Stage:</span>
                <span className="text-sm font-medium text-blue-600">{opportunityPreview.stage}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Probability:</span>
                <span className="text-sm font-medium text-gray-900">{opportunityPreview.probability}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Type:</span>
                <span className="text-sm font-medium text-gray-900">{opportunityPreview.type}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Owner:</span>
                <span className="text-sm font-medium text-gray-900">{opportunityPreview.owner}</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-900 mb-2">✅ This action will:</p>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Update lead status to "Qualified"</li>
              <li>• Create CRM opportunity (ID: auto-generated)</li>
              <li>• Sync contact information (5 fields)</li>
              <li>• Sync company information (8 fields)</li>
              <li>• Sync BANT assessment (4 components)</li>
              <li>• Sync enrichment data (20 fields)</li>
              <li>• Add qualification notes to CRM activity</li>
              <li>• Send email notification to {opportunityPreview.owner}</li>
              <li>• Create calendar reminder for demo</li>
            </ul>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">Important:</p>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• This action cannot be undone</li>
                  <li>• Lead will be removed from Lead Gen tool active list</li>
                  <li>• All future updates must be made in CRM</li>
                  <li>• Estimated sync time: 5-10 seconds</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-600" />
                <h4 className="font-semibold text-gray-900">Fields to Sync (Expand to see details)</h4>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              <button
                onClick={() => toggleSection('contact')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {expandedSections.contact ? (
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  )}
                  <span className="text-sm font-medium text-gray-900">
                    Contact Information ({getSelectedFieldCount('contact')}/{getTotalFieldCount('contact')} selected)
                  </span>
                </div>
              </button>
              {expandedSections.contact && (
                <div className="px-4 py-3 bg-gray-50">
                  <div className="space-y-2">
                    {crmSyncConfig.fieldsToSync.contactInfo.fields.map((field, idx) => {
                      const isSelected = selectedFields.contact[field.name];
                      const isCritical = criticalFields.includes(field.name);
                      return (
                        <div key={idx} className="flex items-start justify-between gap-4 text-xs group">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleFieldSelection('contact', field.name)}
                              className="h-3.5 w-3.5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer flex-shrink-0"
                            />
                            <CheckCircle className={`h-3.5 w-3.5 flex-shrink-0 ${isSelected ? 'text-emerald-600' : 'text-gray-300'}`} />
                            <span className={`font-medium flex-shrink-0 ${isSelected ? 'text-gray-900' : 'text-gray-400'}`}>
                              {field.name}:{isCritical && <span className="ml-1 text-red-500">*</span>}
                            </span>
                            <span className={`truncate ${isSelected ? 'text-gray-700' : 'text-gray-400'}`}>{field.value}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={() => toggleSection('company')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {expandedSections.company ? (
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  )}
                  <span className="text-sm font-medium text-gray-900">
                    Company Information ({getSelectedFieldCount('company')}/{getTotalFieldCount('company')} selected)
                  </span>
                </div>
              </button>
              {expandedSections.company && (
                <div className="px-4 py-3 bg-gray-50">
                  <div className="space-y-2">
                    {crmSyncConfig.fieldsToSync.companyInfo.fields.map((field, idx) => {
                      const isSelected = selectedFields.company[field.name];
                      const isCritical = criticalFields.includes(field.name);
                      return (
                        <div key={idx} className="flex items-start justify-between gap-4 text-xs group">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleFieldSelection('company', field.name)}
                              className="h-3.5 w-3.5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer flex-shrink-0"
                            />
                            <CheckCircle className={`h-3.5 w-3.5 flex-shrink-0 ${isSelected ? 'text-emerald-600' : 'text-gray-300'}`} />
                            <span className={`font-medium flex-shrink-0 ${isSelected ? 'text-gray-900' : 'text-gray-400'}`}>
                              {field.name}:{isCritical && <span className="ml-1 text-red-500">*</span>}
                            </span>
                            <span className={`truncate ${isSelected ? 'text-gray-700' : 'text-gray-400'}`}>{field.value}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={() => toggleSection('bant')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {expandedSections.bant ? (
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  )}
                  <span className="text-sm font-medium text-gray-900">
                    BANT Assessment ({getSelectedFieldCount('bant')}/{getTotalFieldCount('bant')} selected)
                  </span>
                </div>
              </button>
              {expandedSections.bant && (
                <div className="px-4 py-3 bg-gray-50">
                  <div className="space-y-2">
                    {crmSyncConfig.fieldsToSync.bantAssessment.fields.map((field, idx) => {
                      const isSelected = selectedFields.bant[field.name];
                      const isCritical = criticalFields.includes(field.name);
                      return (
                        <div key={idx} className="flex items-start justify-between gap-4 text-xs group">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleFieldSelection('bant', field.name)}
                              className="h-3.5 w-3.5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer flex-shrink-0"
                            />
                            <CheckCircle className={`h-3.5 w-3.5 flex-shrink-0 ${isSelected ? 'text-emerald-600' : 'text-gray-300'}`} />
                            <span className={`font-medium flex-shrink-0 ${isSelected ? 'text-gray-900' : 'text-gray-400'}`}>
                              {field.name}:{isCritical && <span className="ml-1 text-red-500">*</span>}
                            </span>
                            <span className={`truncate ${isSelected ? 'text-gray-700' : 'text-gray-400'}`}>{field.value}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={() => toggleSection('professional')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {expandedSections.professional ? (
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  )}
                  <span className="text-sm font-medium text-gray-900">
                    Professional Details ({getSelectedFieldCount('professional')}/{getTotalFieldCount('professional')} selected)
                  </span>
                </div>
              </button>
              {expandedSections.professional && (
                <div className="px-4 py-3 bg-gray-50">
                  <div className="space-y-2">
                    {crmSyncConfig.fieldsToSync.professionalDetails.fields.map((field, idx) => {
                      const isSelected = selectedFields.professional[field.name];
                      const isCritical = criticalFields.includes(field.name);
                      return (
                        <div key={idx} className="flex items-start justify-between gap-4 text-xs group">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleFieldSelection('professional', field.name)}
                              className="h-3.5 w-3.5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer flex-shrink-0"
                            />
                            <CheckCircle className={`h-3.5 w-3.5 flex-shrink-0 ${isSelected ? 'text-emerald-600' : 'text-gray-300'}`} />
                            <span className={`font-medium flex-shrink-0 ${isSelected ? 'text-gray-900' : 'text-gray-400'}`}>
                              {field.name}:{isCritical && <span className="ml-1 text-red-500">*</span>}
                            </span>
                            <span className={`truncate ${isSelected ? 'text-gray-700' : 'text-gray-400'}`}>{field.value}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={() => toggleSection('notes')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {expandedSections.notes ? (
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  )}
                  <span className="text-sm font-medium text-gray-900">
                    Qualification Notes & History ({getSelectedFieldCount('notes')}/{getTotalFieldCount('notes')} selected)
                  </span>
                </div>
              </button>
              {expandedSections.notes && (
                <div className="px-4 py-3 bg-gray-50">
                  <div className="space-y-2">
                    {crmSyncConfig.fieldsToSync.qualificationNotes.fields.map((field, idx) => {
                      const isSelected = selectedFields.notes[field.name];
                      const isCritical = criticalFields.includes(field.name);
                      return (
                        <div key={idx} className="flex items-start justify-between gap-4 text-xs group">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleFieldSelection('notes', field.name)}
                              className="h-3.5 w-3.5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer flex-shrink-0"
                            />
                            <CheckCircle className={`h-3.5 w-3.5 flex-shrink-0 ${isSelected ? 'text-emerald-600' : 'text-gray-300'}`} />
                            <span className={`font-medium flex-shrink-0 ${isSelected ? 'text-gray-900' : 'text-gray-400'}`}>
                              {field.name}:{isCritical && <span className="ml-1 text-red-500">*</span>}
                            </span>
                            <span className={`truncate ${isSelected ? 'text-gray-700' : 'text-gray-400'}`}>{field.value}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3">
          <button
            onClick={handleConfirm}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            <CheckCircle className="h-5 w-5" />
            Confirm & Sync to CRM
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CRMSyncConfirmationModal;
