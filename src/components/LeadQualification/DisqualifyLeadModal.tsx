import React, { useState } from 'react';
import { X, XCircle, AlertCircle, AlertTriangle, User } from 'lucide-react';

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
    const now = new Date();
    const monthMap: { [key: string]: number } = {
      '3_months': 3,
      '6_months': 6,
      '12_months': 12
    };

    if (period === 'never') return 'Never';

    const months = monthMap[period] || 3;
    const futureDate = new Date(now);
    futureDate.setMonth(futureDate.getMonth() + months);

    return futureDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const disqualificationReasons = {
    'BUDGET ISSUES': [
      'No budget available',
      'Budget too small for our solution',
      'Budget allocated to competitor',
      'Budget frozen/on hold'
    ],
    'AUTHORITY ISSUES': [
      'Not the decision maker',
      'Cannot reach decision maker',
      'Stakeholder turnover'
    ],
    'NEED/FIT ISSUES': [
      'No immediate business need',
      'Poor fit for our product/service',
      'Outside our target market',
      'Already using competitor (satisfied)'
    ],
    'TIMELINE ISSUES': [
      'Timeline is too long (>6 months)',
      'No defined timeline',
      'Project postponed indefinitely'
    ],
    'COMPETITION': [
      'Lost deal to competitor',
      'Competitor already selected',
      'Cannot compete on price'
    ],
    'LEAD UNRESPONSIVE': [
      'No response to outreach (3+ attempts)',
      'Contact left the company',
      'Contact bounced/invalid'
    ],
    'COMPANY ISSUES': [
      'Company went out of business',
      'Company acquired/merged',
      'Hiring freeze'
    ],
    'OTHER': [
      'Other (specify below)'
    ]
  };

  const competitors = [
    'Workday',
    'Oracle Financials',
    'SAP',
    'NetSuite',
    'Other (specify)'
  ];

  const handleConfirm = () => {
    if (!reason) {
      setShowError(true);
      return;
    }

    const data: DisqualificationData = {
      reason,
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

    onConfirm(data);
    handleReset();
  };

  const handleCancel = () => {
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setReason('');
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
  };

  const needsCompetitorInfo = reason.toLowerCase().includes('competitor') ||
                              reason.toLowerCase().includes('competition');

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Disqualification Reason: <span className="text-red-500">*Required</span>
            </label>
            <select
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setShowError(false);
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                showError && !reason ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select reason ▼</option>
              {Object.entries(disqualificationReasons).map(([category, reasons]) => (
                <optgroup key={category} label={category}>
                  {reasons.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            {showError && !reason && (
              <div className="flex items-center gap-2 mt-2 text-sm text-red-500">
                <AlertCircle className="h-4 w-4" />
                <span>Please select a disqualification reason</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Details: <span className="text-gray-500">Optional</span>
            </label>
            <textarea
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Provide more context about why this lead is being disqualified. This helps improve future lead scoring."
            />
          </div>

          {needsCompetitorInfo && (
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
                {competitors.map((comp) => (
                  <option key={comp} value={comp}>{comp}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Future Re-engagement: <span className="text-red-500">*Required</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="3_months"
                  checked={reEngagementPeriod === '3_months'}
                  onChange={(e) => setReEngagementPeriod(e.target.value)}
                  className="h-4 w-4 text-red-500"
                />
                <span className="text-sm text-gray-700">
                  Re-engage in 3 months ({getReEngagementDate('3_months')})
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="6_months"
                  checked={reEngagementPeriod === '6_months'}
                  onChange={(e) => setReEngagementPeriod(e.target.value)}
                  className="h-4 w-4 text-red-500"
                />
                <span className="text-sm text-gray-700">
                  Re-engage in 6 months ({getReEngagementDate('6_months')})
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="12_months"
                  checked={reEngagementPeriod === '12_months'}
                  onChange={(e) => setReEngagementPeriod(e.target.value)}
                  className="h-4 w-4 text-red-500"
                />
                <span className="text-sm text-gray-700">
                  Re-engage in 12 months ({getReEngagementDate('12_months')})
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="never"
                  checked={reEngagementPeriod === 'never'}
                  onChange={(e) => setReEngagementPeriod(e.target.value)}
                  className="h-4 w-4 text-red-500"
                />
                <span className="text-sm text-gray-700">
                  Do not contact again
                </span>
              </label>
            </div>
          </div>

          {reEngagementPeriod !== 'never' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-3">If re-engagement selected:</p>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createCalendarReminder}
                    onChange={(e) => setCreateCalendarReminder(e.target.checked)}
                    className="h-4 w-4 text-blue-500 rounded"
                  />
                  <span className="text-sm text-gray-700">Create calendar reminder</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addToReEngagementCampaign}
                    onChange={(e) => setAddToReEngagementCampaign(e.target.checked)}
                    className="h-4 w-4 text-blue-500 rounded"
                  />
                  <span className="text-sm text-gray-700">Add to re-engagement campaign</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={monitorTriggerEvents}
                    onChange={(e) => setMonitorTriggerEvents(e.target.checked)}
                    className="h-4 w-4 text-blue-500 rounded"
                  />
                  <span className="text-sm text-gray-700">Monitor for trigger events (funding, hiring, etc.)</span>
                </label>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Notify Team:
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyOwner}
                  onChange={(e) => setNotifyOwner(e.target.checked)}
                  className="h-4 w-4 text-red-500 rounded"
                />
                <span className="text-sm text-gray-700">
                  Send disqualification notification to {owner}
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ccSalesManager}
                  onChange={(e) => setCcSalesManager(e.target.checked)}
                  className="h-4 w-4 text-red-500 rounded"
                />
                <span className="text-sm text-gray-700">CC: Sales Manager</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifySlack}
                  onChange={(e) => setNotifySlack(e.target.checked)}
                  className="h-4 w-4 text-red-500 rounded"
                />
                <span className="text-sm text-gray-700">Add note to Slack #sales channel</span>
              </label>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">IMPORTANT</h4>
                <p className="text-sm text-gray-700 mb-2">This action will:</p>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>Move lead to "Disqualified" status</li>
                  <li>Remove from active pipeline</li>
                  <li>Add to disqualified leads list</li>
                  <li>Pause all automated sequences</li>
                  <li>Update lead history with reason</li>
                </ul>
                <p className="text-sm text-gray-700 mt-2">
                  You can re-qualify this lead later if needed.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={handleConfirm}
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
    </div>
  );
};

export default DisqualifyLeadModal;
