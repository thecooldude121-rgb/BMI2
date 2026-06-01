import React, { useState } from 'react';
import { X, Mail, Video, FileText, Share2, Calendar, Loader, Send } from 'lucide-react';

interface EmailDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: {
    from: string;
    to: string;
    subject: string;
    date: string;
    body: string;
  };
}

export const EmailDetailModal: React.FC<EmailDetailModalProps> = ({ isOpen, onClose, email }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Mail className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Email Details</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          <div className="space-y-4 mb-6">
            <div>
              <span className="text-sm font-semibold text-gray-700">From:</span>
              <span className="ml-2 text-sm text-gray-900">{email.from}</span>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-700">To:</span>
              <span className="ml-2 text-sm text-gray-900">{email.to}</span>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-700">Date:</span>
              <span className="ml-2 text-sm text-gray-900">{email.date}</span>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-700">Subject:</span>
              <span className="ml-2 text-sm text-gray-900">{email.subject}</span>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{email.body}</p>
          </div>
        </div>
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

interface ShareSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (method: string) => void;
}

export const ShareSummaryModal: React.FC<ShareSummaryModalProps> = ({ isOpen, onClose, onShare }) => {
  if (!isOpen) return null;

  const shareOptions = [
    { id: 'email', name: 'Email', icon: Mail },
    { id: 'slack', name: 'Slack', icon: FileText },
    { id: 'export', name: 'Export PDF', icon: FileText },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Share2 className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Share Summary</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {shareOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  onShare(option.id);
                  onClose();
                }}
                className="w-full flex items-center space-x-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
              >
                <option.icon className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">{option.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface LogActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (activity: { type: string; subject: string; notes: string; date: string }) => void;
}

export const LogActivityModal: React.FC<LogActivityModalProps> = ({ isOpen, onClose, onSave }) => {
  const [activityType, setActivityType] = useState('note');
  const [subject, setSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ type: activityType, subject, notes, date });
    setSubject('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Log Activity</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Activity Type</label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="note">Note</option>
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="meeting">Meeting</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add details..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            ></textarea>
          </div>
        </div>
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Save Activity
          </button>
        </div>
      </div>
    </div>
  );
};

interface PredictedCloseDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  prediction: {
    mostLikely: string;
    range: string;
    confidence: number;
    reasons: string[];
  };
}

export const PredictedCloseDateModal: React.FC<PredictedCloseDateModalProps> = ({ isOpen, onClose, prediction }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Calendar className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">Predicted Close Date</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="text-sm font-semibold text-purple-900 mb-2">Most Likely Date</div>
            <div className="text-2xl font-bold text-purple-600">{prediction.mostLikely}</div>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-1">Predicted Range</div>
            <div className="text-lg font-medium text-gray-900">{prediction.range}</div>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-1">Confidence Level</div>
            <div className="flex items-center space-x-3">
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div
                  className="bg-purple-500 h-3 rounded-full"
                  style={{ width: `${prediction.confidence}%` }}
                ></div>
              </div>
              <span className="text-lg font-bold text-purple-600">{prediction.confidence}%</span>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-4">
            <div className="text-sm font-semibold text-gray-700 mb-2">Based on:</div>
            <ul className="space-y-1">
              {prediction.reasons.map((reason, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start space-x-2">
                  <span className="text-purple-600">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

interface SimilarityBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealName: string;
  breakdown: {
    industry: number;
    dealSize: number;
    companySize: number;
    geography: number;
    stage: number;
    overall: number;
  };
}

export const SimilarityBreakdownModal: React.FC<SimilarityBreakdownModalProps> = ({ isOpen, onClose, dealName, breakdown }) => {
  if (!isOpen) return null;

  const getMatchColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMatchIcon = (score: number) => {
    if (score >= 90) return '✅';
    if (score >= 70) return '⚠️';
    return '❌';
  };

  const items = [
    { label: 'Industry', value: breakdown.industry },
    { label: 'Deal size', value: breakdown.dealSize },
    { label: 'Company size', value: breakdown.companySize },
    { label: 'Geography', value: breakdown.geography },
    { label: 'Stage', value: breakdown.stage },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Similarity Breakdown</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="text-sm text-gray-600 mb-4">Comparison with: {dealName}</div>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getMatchIcon(item.value)}</span>
                  <span className="text-sm font-medium text-gray-700">{item.label}:</span>
                </div>
                <span className={`text-sm font-bold ${getMatchColor(item.value)}`}>
                  {item.value}% match
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900">Overall Similarity:</span>
              <span className="text-2xl font-bold text-blue-600">{breakdown.overall}%</span>
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

interface DataVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: () => void;
  fieldsToVerify: Array<{
    field: string;
    currentValue: string;
    needsVerification: boolean;
  }>;
}

export const DataVerificationModal: React.FC<DataVerificationModalProps> = ({ isOpen, onClose, onVerify, fieldsToVerify }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Verify Data</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
          <div className="space-y-4">
            {fieldsToVerify.map((item, idx) => (
              <div key={idx} className={`p-4 rounded-lg border ${item.needsVerification ? 'bg-yellow-50 border-yellow-300' : 'bg-green-50 border-green-300'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">{item.field}</span>
                  {item.needsVerification ? (
                    <span className="text-xs font-medium text-yellow-700 bg-yellow-200 px-2 py-1 rounded">Needs Verification</span>
                  ) : (
                    <span className="text-xs font-medium text-green-700 bg-green-200 px-2 py-1 rounded">Verified</span>
                  )}
                </div>
                <div className="text-sm text-gray-700 mb-2">{item.currentValue}</div>
                {item.needsVerification && (
                  <input
                    type="text"
                    defaultValue={item.currentValue}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Correct value..."
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium">
            Cancel
          </button>
          <button onClick={() => { onVerify(); onClose(); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
