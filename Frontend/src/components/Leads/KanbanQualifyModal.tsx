import { useEffect, useState } from 'react';
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

/** What the server said when it refused the move (from LeadStageError). */
export interface QualifyRefusal {
  message: string;
  unmetCriteria?: { id: string; label: string }[];
  canOverride?: boolean;
}

interface Props {
  lead:        Lead;
  /**
   * Performs the move on the SERVER. Resolves null on success, or the server's
   * refusal. The modal stays open until this settles — step 5: a success state
   * only after the server confirms, and the gate is the server's, not this list.
   */
  onConfirm:   (opts: { override?: boolean; reason?: string }) => Promise<QualifyRefusal | null>;
  onClose:     () => void;
  /** UI courtesy only — the server decides, and its 409 says so via can_override. */
  canOverride: boolean;
}

export default function KanbanQualifyModal({ lead, onConfirm, onClose, canOverride }: Props) {
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState('');
  const [refusal, setRefusal] = useState<QualifyRefusal | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, busy]);

  const name = lead.full_name
    || [lead.first_name, lead.last_name].filter(Boolean).join(' ')
    || 'this lead';

  // A PREVIEW of the server's three criteria. Advisory items never block — the
  // old `allPassed` counted the score check too, so a low score alone forced an
  // override the server would never have asked for.
  const results = CRITERIA.map(c => ({ ...c, passed: c.check(lead) }));
  const hardFailed = results.some(r => r.hard && !r.passed) || (refusal?.unmetCriteria?.length ?? 0) > 0;
  const mayOverride = refusal?.canOverride ?? canOverride;

  const submit = async (opts: { override?: boolean; reason?: string }) => {
    setBusy(true);
    const result = await onConfirm(opts);
    setBusy(false);
    if (result) setRefusal(result); else onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={() => { if (!busy) onClose(); }} />

      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4" role="dialog" aria-modal="true" aria-labelledby="qualify-title">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="qualify-title" className="text-sm font-bold text-gray-900">Move {name} to Qualifying?</h2>
            <p className="text-xs text-gray-500 mt-0.5">Checking qualification readiness.</p>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
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

        {/* The server's own words when it refused — authoritative over the preview. */}
        {refusal && (
          <div role="alert" className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
            <AlertTriangle size={12} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 leading-snug">{refusal.message}</p>
          </div>
        )}

        {hardFailed && mayOverride && (
          <div className="space-y-1.5">
            <p className="text-xs text-amber-700 leading-snug">
              Required criteria are missing. As a manager or admin you can override — the override and your reason are recorded.
            </p>
            <label htmlFor="override-reason" className="block text-xs font-medium text-gray-700">Reason for override</label>
            <textarea
              id="override-reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={2}
              className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}
        {hardFailed && !mayOverride && (
          <p className="text-xs text-gray-600 leading-snug">
            Required criteria are missing. Only a manager or admin can override them.
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 py-2 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          {!hardFailed ? (
            <button
              onClick={() => void submit({})}
              disabled={busy}
              className="flex-1 py-2 text-xs font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-60"
            >
              {busy ? 'Moving…' : 'Move to Qualifying'}
            </button>
          ) : mayOverride ? (
            <button
              onClick={() => void submit({ override: true, reason: reason.trim() })}
              disabled={busy || !reason.trim()}
              className="flex-1 py-2 text-xs font-semibold rounded-lg border border-amber-400 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy ? 'Moving…' : 'Override and move'}
            </button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
