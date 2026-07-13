import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, TrendingUp, UserX, ArrowDownRight } from 'lucide-react';
import type { Lead } from '../../types/lead';

interface Props {
  lead:     Lead;
  onSelect: (outcome: 'converted' | 'disqualified' | 'lost') => void;
  onClose:  () => void;
}

export default function KanbanOutcomeModal({ lead, onSelect, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const name = lead.full_name
    || [lead.first_name, lead.last_name].filter(Boolean).join(' ')
    || 'this lead';

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900">What happened with {name}?</h2>
            <p className="text-xs text-gray-500 mt-0.5">Select an outcome to log the right action.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Outcome options */}
        <div className="space-y-2">
          <button
            onClick={() => onSelect('converted')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-teal-200 bg-teal-50 hover:bg-teal-100 transition-colors text-left"
          >
            <TrendingUp className="h-4 w-4 text-teal-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-teal-800">Converted</p>
              <p className="text-xs text-teal-600">Lead became a contact or account — run conversion wizard</p>
            </div>
          </button>

          <button
            onClick={() => onSelect('disqualified')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
          >
            <UserX className="h-4 w-4 text-gray-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-700">Disqualified</p>
              <p className="text-xs text-gray-500">Lead doesn't fit ICP criteria — capture reason</p>
            </div>
          </button>

          <button
            onClick={() => onSelect('lost')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-red-100 bg-red-50 hover:bg-red-100 transition-colors text-left"
          >
            <ArrowDownRight className="h-4 w-4 text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-700">Lost</p>
              <p className="text-xs text-red-500">Lead went cold or chose a competitor — capture reason</p>
            </div>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
