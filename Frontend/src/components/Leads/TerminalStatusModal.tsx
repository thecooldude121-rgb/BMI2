import React, { useState, useEffect } from 'react';
import { X, XCircle, AlertTriangle } from 'lucide-react';
import type { TerminalAction } from '../../utils/leadReasons';
import { getReasonsForAction } from '../../utils/leadReasons';

interface TerminalStatusModalProps {
  open: boolean;
  action: TerminalAction;
  count: number;
  leadName?: string;
  onConfirm: (reason: string, notes: string) => void;
  onClose: () => void;
}

export default function TerminalStatusModal({
  open,
  action,
  count,
  leadName,
  onConfirm,
  onClose,
}: TerminalStatusModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      setSelectedReason(null);
      setNotes('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const reasons = getReasonsForAction(action);
  const isDisqualify = action === 'disqualified';
  const otherSelected = selectedReason === 'other';
  const notesRequired = otherSelected;
  const canSubmit = selectedReason !== null && (!notesRequired || notes.trim() !== '');

  const chipSelectedCls = isDisqualify
    ? 'bg-gray-700 text-white border-gray-700'
    : 'bg-amber-600 text-white border-amber-600';
  const confirmCls = isDisqualify
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-amber-600 hover:bg-amber-700 text-white';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            {isDisqualify
              ? <XCircle className="h-5 w-5 text-gray-500" />
              : <AlertTriangle className="h-5 w-5 text-amber-500" />
            }
            <h2 className="text-base font-semibold text-gray-900">
              {isDisqualify ? 'Mark as Disqualified' : 'Mark as Lost'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">

          {/* Context line */}
          {count > 1 ? (
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2.5">
              This reason will be applied to all <strong>{count} selected leads</strong>.
            </p>
          ) : leadName ? (
            <p className="text-sm text-gray-500">
              Lead: <strong className="text-gray-800">{leadName}</strong>
            </p>
          ) : null}

          {/* Reason chips */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {reasons.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setSelectedReason(r.value)}
                  className={[
                    'px-3 py-2 rounded-lg border text-sm font-medium text-left transition-all',
                    selectedReason === r.value
                      ? chipSelectedCls
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50',
                  ].join(' ')}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {notesRequired
                ? <>Notes <span className="text-red-500">*</span></>
                : <span>Notes <span className="text-gray-400 font-normal">(optional)</span></span>
              }
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Add context (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {notesRequired && notes.trim() === '' && (
              <p className="text-xs text-red-500 mt-1">Notes required when selecting "Other"</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => canSubmit && onConfirm(selectedReason!, notes.trim())}
            disabled={!canSubmit}
            className={[
              'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              canSubmit ? confirmCls : 'bg-gray-100 text-gray-400 cursor-not-allowed',
            ].join(' ')}
          >
            {isDisqualify ? 'Mark as Disqualified' : 'Mark as Lost'}
          </button>
        </div>
      </div>
    </div>
  );
}
