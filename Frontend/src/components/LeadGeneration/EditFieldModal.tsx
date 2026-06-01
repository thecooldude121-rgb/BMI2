import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react';
import type { EnrichedFieldData } from '../../types/enrichmentProgress';

interface EditFieldModalProps {
  field: EnrichedFieldData;
  isOpen: boolean;
  onClose: () => void;
  onSave: (fieldId: string, newValue: string, reason: string, notes: string, markAsVerified: boolean) => void;
  onRevert: (fieldId: string) => void;
}

const CHANGE_REASONS = [
  'Incorrect data from API',
  'Verified directly with contact',
  'Updated information received',
  'Data quality issue',
  'Other (specify below)'
];

const FIELD_FORMATS: Record<string, string> = {
  email: 'user@example.com',
  direct_phone: '+1 (XXX) XXX-XXXX',
  mobile_phone: '+1 (XXX) XXX-XXXX',
  linkedin: 'https://linkedin.com/in/username',
  twitter: '@username',
  github: 'https://github.com/username',
  personal_website: 'https://example.com'
};

export function EditFieldModal({
  field,
  isOpen,
  onClose,
  onSave,
  onRevert
}: EditFieldModalProps) {
  const [editedValue, setEditedValue] = useState(field.afterValue || '');
  const [selectedReason, setSelectedReason] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [markAsVerified, setMarkAsVerified] = useState(false);
  const [showReasonDropdown, setShowReasonDropdown] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEditedValue(field.afterValue || '');
      setSelectedReason('');
      setAdditionalNotes('');
      setMarkAsVerified(false);
      setShowReasonDropdown(false);
    }
  }, [isOpen, field.afterValue]);

  if (!isOpen) return null;

  const hasChanges = editedValue !== (field.afterValue || '');
  const canSave = editedValue.trim() !== '';
  const formatHint = FIELD_FORMATS[field.fieldId] || '';

  const handleSave = () => {
    if (canSave) {
      onSave(field.fieldId, editedValue, selectedReason, additionalNotes, markAsVerified);
      onClose();
    }
  };

  const handleRevert = () => {
    onRevert(field.fieldId);
    onClose();
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'Unknown';
    if (timestamp === 'Just now') return timestamp;
    return timestamp;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-2xl">✏️</span>
              EDIT FIELD MANUALLY
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field: {field.fieldName}
            </label>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📋</span>
              <h3 className="font-semibold text-gray-900">ENRICHMENT DATA</h3>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Current Value:</span>
                <div className="font-medium text-gray-900 mt-1">
                  {field.afterValue || field.beforeValue || '(Empty)'}
                </div>
              </div>

              {field.source && (
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-blue-200">
                  <div>
                    <span className="text-gray-600">Source: </span>
                    <span className="font-medium text-gray-900">{field.source}</span>
                  </div>
                  {field.confidence && (
                    <div>
                      <span className="text-gray-600">Confidence: </span>
                      <span className="font-medium text-gray-900">{field.confidence}%</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Enriched: </span>
                    <span className="font-medium text-gray-900">
                      {formatTimestamp(field.timestamp)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Edit Value:
            </label>
            <input
              type="text"
              value={editedValue}
              onChange={(e) => setEditedValue(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={`Enter ${field.fieldName.toLowerCase()}...`}
            />
            {formatHint && (
              <p className="mt-1 text-xs text-gray-500">
                Format: {formatHint}
              </p>
            )}
            {hasChanges && (
              <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
                <AlertCircle className="w-3 h-3" />
                <span>Value has been modified</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Change: <span className="text-gray-400 text-xs">*Optional</span>
            </label>
            <div className="relative">
              <button
                onClick={() => setShowReasonDropdown(!showReasonDropdown)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-gray-400 transition-colors"
              >
                <span className={selectedReason ? 'text-gray-900' : 'text-gray-400'}>
                  {selectedReason || 'Select reason'}
                </span>
                <span className="text-gray-400">▼</span>
              </button>

              {showReasonDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                  {CHANGE_REASONS.map((reason) => (
                    <button
                      key={reason}
                      onClick={() => {
                        setSelectedReason(reason);
                        setShowReasonDropdown(false);
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-sm text-gray-700 first:rounded-t-lg last:rounded-b-lg"
                    >
                      • {reason}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes:
            </label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Add any additional context or notes..."
            />
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={markAsVerified}
                onChange={(e) => setMarkAsVerified(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Mark as verified
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Future enrichments won't override this value
                </p>
              </div>
            </label>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📊</span>
              <h3 className="font-semibold text-gray-900">CHANGE IMPACT</h3>
            </div>

            <div className="space-y-2 text-sm text-gray-700">
              <p className="font-medium mb-2">This change will:</p>
              <ul className="space-y-1.5">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                  Update lead record
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                  Add entry to field history
                </li>
                {markAsVerified && (
                  <>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                      Mark field as manually verified
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                      Prevent automatic overrides
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>

          {field.afterValue && (
            <button
              onClick={handleRevert}
              className="px-4 py-2 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-300 rounded-lg hover:bg-orange-100 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Revert to API Value
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={!canSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
