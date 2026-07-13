import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, Circle, AlertTriangle } from 'lucide-react';
import type { Lead } from '../../types/lead';

// ── Criteria ──────────────────────────────────────────────────────────────────

interface Criterion {
  id:    string;
  label: string;
  check: (l: Lead) => boolean;
  hard:  boolean; // false = advisory only, never blocks
}

const CRITERIA: Criterion[] = [
  {
    id:    'contact',
    label: 'Email or phone present',
    check: l => !!(l.email?.trim() || l.phone?.trim()),
    hard:  true,
  },
  {
    id:    'company',
    label: 'Company name present',
    check: l => !!l.company?.trim(),
    hard:  true,
  },
  {
    id:    'contacted',
    label: 'Has been contacted at least once',
    check: l => !!l.last_contact_date,
    hard:  true,
  },
  {
    id:    'score',
    label: 'Lead score ≥ 40',
    check: l => (l.ai_score ?? l.score) >= 40,
    hard:  false,
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  lead:        Lead;
  onConfirm:   () => void;
  onClose:     () => void;
  canOverride: boolean;
}

export default function KanbanQualifyModal({ lead, onConfirm, onClose, canOverride }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const name = lead.full_name
    || [lead.first_name, lead.last_name].filter(Boolean).join(' ')
    || 'this lead';

  const results = CRITERIA.map(c => ({ ...c, passed: c.check(lead) }));
  const allPassed    = results.every(r => r.passed);
  const anyHardFail  = results.some(r => r.hard && !r.passed);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Move {name} to Qualifying?</h2>
            <p className="text-xs text-gray-500 mt-0.5">Checking qualification readiness.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Checklist */}
        <div className="space-y-2">
          {results.map(r => (
            <div key={r.id} className="flex items-center gap-2.5">
              {r.passed
                ? <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                : <Circle       size={14} className={`shrink-0 ${r.hard ? 'text-red-400' : 'text-amber-400'}`} />
              }
              <span className={`text-xs leading-snug ${
                r.passed ? 'text-gray-700' : r.hard ? 'text-red-600' : 'text-amber-600'
              }`}>
                {r.label}
                {!r.passed && !r.hard && (
                  <span className="text-gray-400 font-normal"> (advisory)</span>
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Warning banner when hard criteria fail */}
        {anyHardFail && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
            <AlertTriangle size={12} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-snug">
              Some required criteria are missing. You can still move this lead, but qualification may be premature.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          {allPassed ? (
            <button
              onClick={() => { onConfirm(); onClose(); }}
              className="flex-1 py-2 text-xs font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              Move to Qualifying
            </button>
          ) : canOverride ? (
            <button
              onClick={() => { onConfirm(); onClose(); }}
              className="flex-1 py-2 text-xs font-semibold rounded-lg border border-amber-400 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
            >
              Override and move
            </button>
          ) : (
            <div
              className="flex-1 py-2 text-xs font-semibold rounded-lg border border-gray-200 text-gray-300 bg-gray-50 text-center cursor-not-allowed select-none"
              title="Not available for your role — contact your manager"
            >
              Override and move
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
