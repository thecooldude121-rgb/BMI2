import React, { useState, useEffect } from 'react';
import { X, XCircle, AlertCircle, AlertTriangle, User, Search } from 'lucide-react';
import { disqualificationConfig } from '../../utils/disqualificationMockData';

interface DisqualifyLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: DisqualificationData) => void;
  lead: {
    name: string;
    title?: string;
    company: string;
    email: string;
    aiScore?: number;
    bantScore?: number;
  };
  owner?: string;
}

export interface DisqualificationData {
  reason: string;
  reasonCategory: string;
  additionalDetails?: string;
  competitor?: string;
  reEngagementPeriod: string;
  createCalendarReminder: boolean;
  addToReEngagementCampaign: boolean;
  monitorTriggerEvents: boolean;
  notifyOwner: boolean;
  ccSalesManager: boolean;
  notifySlack: boolean;
}

const DisqualifyLeadModal: React.FC<DisqualifyLeadModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  lead,
  owner = 'John Smith'
}) => {
  const [reason, setReason] = useState('');
  const [reasonCategory, setReasonCategory] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [competitor, setCompetitor] = useState('');
  const [reEngagementPeriod, setReEngagementPeriod] = useState('3_months');
  const [createCalendarReminder, setCreateCalendarReminder] = useState(true);
  const [addToReEngagementCampaign, setAddToReEngagementCampaign] = useState(true);
  const [monitorTriggerEvents, setMonitorTriggerEvents] = useState(true);
  const [notifyOwner, setNotifyOwner] = useState(true);
  const [ccSalesManager, setCcSalesManager] = useState(false);
  const [notifySlack, setNotifySlack] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const MAX_CHARS = 500;

  useEffect(() => {
    if (reEngagementPeriod === 'never') {
      setCreateCalendarReminder(false);
      setAddToReEngagementCampaign(false);
      setMonitorTriggerEvents(false);
    } else {
      setCreateCalendarReminder(true);
      setAddToReEngagementCampaign(true);
      setMonitorTriggerEvents(true);
    }
  }, [reEngagementPeriod]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isDropdownOpen && !target.closest('.reason-dropdown')) {
        setIsDropdownOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  if (!isOpen) return null;

  const aiScore = lead.aiScore || 92;
  const bantScore = lead.bantScore || 20;
  const isHighQuality = aiScore >= 80 || bantScore >= 16;

  const getScoreLabel = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 80) return 'Very Good';
    if (percentage >= 70) return 'Good';
    if (percentage >= 60) return 'Fair';
    return 'Poor';
  };

  const getReEngagementDate = (period: string) => {
    const option = disqualificationConfig.reEngagementOptions.find(opt => opt.id === period);
    if (option && option.date) {
      const date = new Date(option.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return 'Never';
  };

  const hasFormData = () => {
    return reason !== '' ||
           additionalDetails !== '' ||
           competitor !== '' ||
           reEngagementPeriod !== '3_months';
  };

  const handleInitialConfirm = () => {
    if (!reason) {
      setShowError(true);
      return;
    }
    setShowError(false);
    setShowConfirmDialog(true);
  };

  const handleFinalConfirm = () => {
    const data: DisqualificationData = {
      reason,
      reasonCategory,
      additionalDetails,
      competitor: competitor || undefined,
      reEngagementPeriod,
      createCalendarReminder: reEngagementPeriod !== 'never' && createCalendarReminder,
      addToReEngagementCampaign: reEngagementPeriod !== 'never' && addToReEngagementCampaign,
      monitorTriggerEvents: reEngagementPeriod !== 'never' && monitorTriggerEvents,
      notifyOwner,
      ccSalesManager,
      notifySlack
    };

    setShowConfirmDialog(false);
    onConfirm(data);
    handleReset();
  };

  const handleCancel = () => {
    if (hasFormData()) {
      setShowDiscardDialog(true);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setReason('');
    setReasonCategory('');
    setAdditionalDetails('');
    setCompetitor('');
    setReEngagementPeriod('3_months');
    setCreateCalendarReminder(true);
    setAddToReEngagementCampaign(true);
    setMonitorTriggerEvents(true);
    setNotifyOwner(true);
    setCcSalesManager(false);
    setNotifySlack(false);
    setShowError(false);
    setShowConfirmDialog(false);
    setShowDiscardDialog(false);
    setSearchTerm('');
    setIsDropdownOpen(false);
  };

  const handleReasonSelect = (reasonId: string, category: string, label: string) => {
    setReason(label);
    setReasonCategory(category);
    setShowError(false);
    setIsDropdownOpen(false);
    setSearchTerm('');
  };

  const needsCompetitorInfo = () => {
    const competitionReasons = disqualificationConfig.disqualificationReasons.competition;
    return competitionReasons.some(r => r.label === reason);
  };

  const filteredReasons = () => {
    if (!searchTerm) {
      return disqualificationConfig.disqualificationReasons;
    }

    const search = searchTerm.toLowerCase();
    const filtered: any = {};

    Object.entries(disqualificationConfig.disqualificationReasons).forEach(([category, reasons]) => {
      const matchingReasons = reasons.filter(r =>
        r.label.toLowerCase().includes(search)
      );
      if (matchingReasons.length > 0) {
        filtered[category] = matchingReasons;
      }
    });

    return filtered;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              DISQUALIFY LEAD
            </h3>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                  {lead.name.split(' ').map(n => n[0]).join('')}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{lead.name}</h4>
                <p className="text-sm text-gray-600">{lead.title || 'Chief Financial Officer'} @ {lead.company}</p>
                <p className="text-sm text-gray-600">Email: {lead.email}</p>
              </div>
            </div>
          </div>

          {isHighQuality && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Current Scores</h4>
                  <div className="space-y-1 mb-3">
                    <p className="text-sm text-gray-700">
                      AI Score: <span className="font-semibold text-emerald-600">{aiScore}/100 ({getScoreLabel(aiScore, 100)})</span>
                    </p>
                    <p className="text-sm text-gray-700">
                      BANT Score: <span className="font-semibold text-emerald-600">{bantScore}/20 ({getScoreLabel(bantScore, 20)})</span>
                    </p>
                  </div>
                  <p className="text-sm text-amber-800 font-medium">
                    ⚠️ This is a high-quality lead. Are you sure you want to disqualify?
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="relative reason-dropdown">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Disqualification Reason: <span className="text-red-500">*Required</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-left flex items-center justify-between ${
                  showError && !reason ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <span className={reason ? 'text-gray-900' : 'text-gray-400'}>
                  {reason || 'Select reason ▼'}
                </span>
                <Search className="h-4 w-4 text-gray-400" />
              </button>

              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden flex flex-col">
                  <div className="p-2 border-b border-gray-200">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Type to search..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                      autoFocus
                    />
                  </div>
                  <div className="overflow-y-auto max-h-80">
                    {Object.entries(filteredReasons()).map(([category, reasons]) => (
                      <div key={category}>
                        <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          {category.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        {(reasons as any[]).map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => handleReasonSelect(r.id, category, r.label)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    ))}
                    {Object.keys(filteredReasons()).length === 0 && (
                      <div className="px-3 py-8 text-center text-sm text-gray-500">
                        No reasons found matching "{searchTerm}"
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {showError && !reason && (
              <div className="flex items-center gap-2 mt-2 text-sm text-red-500">
                <AlertCircle className="h-4 w-4" />
                <span>Please select a disqualification reason</span>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Additional Details: <span className="text-gray-500">Optional</span>
              </label>
              <span className={`text-xs ${
                additionalDetails.length >= MAX_CHARS ? 'text-red-500 font-semibold' : 'text-gray-500'
              }`}>
                {additionalDetails.length}/{MAX_CHARS}
              </span>
            </div>
            <textarea
              value={additionalDetails}
              onChange={(e) => {
                if (e.target.value.length <= MAX_CHARS) {
                  setAdditionalDetails(e.target.value);
                }
              }}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              placeholder="Provide more context about why this lead is being disqualified. This helps improve future lead scoring."
            />
          </div>

          {needsCompetitorInfo() && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Competitor (if applicable):
              </label>
              <select
                value={competitor}
                onChange={(e) => setCompetitor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">Select competitor ▼</option>
                {disqualificationConfig.competitors.map((comp) => (
                  <option key={comp.id} value={comp.id}>{comp.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Future Re-engagement: <span className="text-red-500">*Required</span>
            </label>
            <div className="space-y-2">
              {disqualificationConfig.reEngagementOptions.map((option) => (
                <label key={option.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value={option.id}
                    checked={reEngagementPeriod === option.id}
                    onChange={(e) => setReEngagementPeriod(e.target.value)}
                    className="h-4 w-4 text-red-500"
                  />
                  <span className="text-sm text-gray-700">
                    {option.label} {option.date && `(${getReEngagementDate(option.id)})`}
                  </span>
                </label>
              ))}
            </div>

            {reEngagementPeriod === 'never' && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 font-medium">
                    Lead will be permanently marked as do-not-contact
                  </p>
                </div>
              </div>
            )}
          </div>

          {reEngagementPeriod !== 'never' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-3">If re-engagement selected:</p>
              <div className="space-y-2">
                {disqualificationConfig.reEngagementActions.map((action) => {
                  const checked = action.id === 'calendar_reminder' ? createCalendarReminder :
                                  action.id === 'add_to_campaign' ? addToReEngagementCampaign :
                                  monitorTriggerEvents;
                  const onChange = action.id === 'calendar_reminder' ? setCreateCalendarReminder :
                                   action.id === 'add_to_campaign' ? setAddToReEngagementCampaign :
                                   setMonitorTriggerEvents;

                  return (
                    <label key={action.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => onChange(e.target.checked)}
                        disabled={reEngagementPeriod === 'never'}
                        className="h-4 w-4 text-blue-500 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <span className="text-sm text-gray-700">{action.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Notify Team:
            </label>
            <div className="space-y-2">
              {disqualificationConfig.notificationOptions.map((option) => {
                const checked = option.id === 'notify_owner' ? notifyOwner :
                                option.id === 'cc_manager' ? ccSalesManager :
                                notifySlack;
                const onChange = option.id === 'notify_owner' ? setNotifyOwner :
                                 option.id === 'cc_manager' ? setCcSalesManager :
                                 setNotifySlack;

                return (
                  <label key={option.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => onChange(e.target.checked)}
                      className="h-4 w-4 text-red-500 rounded"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">IMPORTANT</h4>
                <p className="text-sm text-gray-700 mb-2">This action will:</p>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  {disqualificationConfig.consequences.map((consequence, index) => (
                    <li key={index}>{consequence}</li>
                  ))}
                </ul>
                {disqualificationConfig.canRequalify && (
                  <p className="text-sm text-gray-700 mt-2">
                    You can re-qualify this lead later if needed.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={handleInitialConfirm}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            <XCircle className="h-5 w-5" />
            Confirm Disqualification
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>

      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">CONFIRM DISQUALIFICATION</h3>
            </div>
            <div className="px-6 py-4 space-y-3">
              <p className="text-sm text-gray-700">
                Are you sure you want to disqualify <span className="font-semibold">{lead.name}</span>?
              </p>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Reason:</span> {reason}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Re-engage:</span>{' '}
                  {reEngagementPeriod === 'never'
                    ? 'Never'
                    : `${reEngagementPeriod.replace('_', ' ')} (${getReEngagementDate(reEngagementPeriod)})`}
                </p>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                onClick={handleFinalConfirm}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                Yes, Disqualify
              </button>
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showDiscardDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Discard Changes?</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-700">
                You have unsaved changes. Are you sure you want to close this modal without saving?
              </p>
            </div>
            <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                Discard Changes
              </button>
              <button
                onClick={() => setShowDiscardDialog(false)}
                className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Keep Editing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisqualifyLeadModal;
