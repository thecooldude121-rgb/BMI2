import { useState, useMemo, useEffect } from 'react';
import { X, AlertTriangle, ChevronLeft, ChevronRight, Merge } from 'lucide-react';
import type { Lead } from '../../types/lead';
import type { DuplicateCandidate } from '../../utils/leadDuplicates';
import { TEAM_MEMBERS } from '../../utils/leadOwnerRouting';

// TODO: replace stub merge with real API call that records audit log + enables rollback

type FieldChoice = 'left' | 'right';

interface MergeField {
  key:   keyof Lead;
  label: string;
}

const MERGE_FIELDS: MergeField[] = [
  { key: 'first_name',        label: 'First Name' },
  { key: 'last_name',         label: 'Last Name' },
  { key: 'email',             label: 'Email' },
  { key: 'phone',             label: 'Phone' },
  { key: 'company',           label: 'Company' },
  { key: 'position',          label: 'Position' },
  { key: 'status',            label: 'Status' },
  { key: 'score',             label: 'Score' },
  { key: 'owner_id',          label: 'Owner' },
  { key: 'last_contact_date', label: 'Last Contact' },
  { key: 'created_at',        label: 'Created' },
];

function displayValue(lead: Lead, key: keyof Lead): string {
  const v = lead[key];
  if (v == null || v === '') return '—';
  if (key === 'owner_id') {
    return TEAM_MEMBERS.find(m => m.id === String(v))?.label ?? String(v);
  }
  if (key === 'created_at' || key === 'last_contact_date') {
    const d = new Date(v as string);
    return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
  return String(v);
}

function riskColor(risk: DuplicateCandidate['risk']) {
  return risk === 'high' ? 'text-red-600 bg-red-50 border-red-200'
       : risk === 'medium' ? 'text-amber-600 bg-amber-50 border-amber-200'
       : 'text-gray-500 bg-gray-50 border-gray-200';
}

interface Props {
  lead:        Lead;
  candidateId: string;
  allLeads:    Lead[];
  candidates:  DuplicateCandidate[];
  isOpen:      boolean;
  onClose:     () => void;
}
// onUpdateLead / onShowToast / onMergeComplete props were removed with the
// merge action itself — see the note at the footer.

export default function MergeReviewModal({
  lead,
  candidateId,
  allLeads,
  candidates,
  isOpen,
  onClose,
}: Props) {
  const [activeCandidateId, setActiveCandidateId] = useState(candidateId);
  const [choices, setChoices] = useState<Partial<Record<keyof Lead, FieldChoice>>>({});

  const candidate = useMemo(
    () => allLeads.find(l => l.id === activeCandidateId),
    [allLeads, activeCandidateId],
  );

  const candidateInfo = useMemo(
    () => candidates.find(c => c.leadId === activeCandidateId),
    [candidates, activeCandidateId],
  );

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen || !candidate) return null;

  function getChoice(key: keyof Lead): FieldChoice {
    return choices[key] ?? 'left';
  }

  function toggle(key: keyof Lead) {
    setChoices(prev => ({ ...prev, [key]: prev[key] === 'right' ? 'left' : 'right' }));
  }

  function differ(key: keyof Lead): boolean {
    return displayValue(lead, key) !== displayValue(candidate!, key);
  }

  const leftName  = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || lead.email || lead.id;
  const rightName = [candidate.first_name, candidate.last_name].filter(Boolean).join(' ') || candidate.email || candidate.id;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Merge className="h-5 w-5 text-gray-700" />
            <div>
              <h2 className="text-base font-semibold text-gray-900">Merge Duplicate Leads</h2>
              <p className="text-xs text-gray-500 mt-0.5">Choose which values to keep for the master record</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Candidate selector (multiple candidates) */}
        {candidates.length > 1 && (
          <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-500">Comparing with:</span>
            <div className="flex gap-1.5 flex-wrap">
              {candidates.map(c => {
                const cl = allLeads.find(l => l.id === c.leadId);
                if (!cl) return null;
                const name = [cl.first_name, cl.last_name].filter(Boolean).join(' ') || cl.email || cl.id;
                return (
                  <button
                    key={c.leadId}
                    onClick={() => { setActiveCandidateId(c.leadId); setChoices({}); }}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      activeCandidateId === c.leadId
                        ? 'bg-gray-800 text-white border-gray-800'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {name}
                    <span className={`ml-1 text-[10px] px-1 rounded-sm border ${riskColor(c.risk)}`}>
                      {c.risk}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Risk + signals summary */}
        {candidateInfo && (
          <div className={`mx-6 mt-3 px-3 py-2 rounded-lg border text-xs flex items-start gap-2 flex-shrink-0 ${riskColor(candidateInfo.risk)}`}>
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium capitalize">{candidateInfo.risk} confidence match</span>
              <span className="mx-1">·</span>
              {candidateInfo.signals.map((s, i) => (
                <span key={i}>{i > 0 && ' · '}{s.reason}</span>
              ))}
            </div>
          </div>
        )}

        {/* Column headers */}
        <div className="grid grid-cols-[1fr_48px_1fr] gap-0 px-6 pt-4 pb-1 flex-shrink-0">
          <div className="text-xs font-semibold text-gray-700 bg-blue-50 border border-blue-200 rounded-t-lg px-3 py-2">
            Current lead (master) — <span className="font-normal">{leftName}</span>
          </div>
          <div />
          <div className="text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200 rounded-t-lg px-3 py-2">
            Duplicate — <span className="font-normal">{rightName}</span>
            <span className="ml-1 text-[10px] text-red-500">(will be disqualified)</span>
          </div>
        </div>

        {/* Field rows */}
        <div className="overflow-y-auto flex-1 px-6 pb-2">
          {MERGE_FIELDS.map(f => {
            const lv = displayValue(lead, f.key);
            const rv = displayValue(candidate, f.key);
            const isDiff = differ(f.key);
            const choice = getChoice(f.key);
            return (
              <div
                key={f.key as string}
                className={`grid grid-cols-[1fr_48px_1fr] gap-0 border-b border-gray-100 ${isDiff ? '' : 'opacity-60'}`}
              >
                {/* Left cell */}
                <div
                  className={`px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                    choice === 'left' ? 'bg-blue-50 font-medium text-blue-900' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => isDiff && setChoices(prev => ({ ...prev, [f.key]: 'left' }))}
                >
                  <div className="text-[10px] text-gray-400 mb-0.5">{f.label}</div>
                  {lv}
                </div>

                {/* Toggle control */}
                <div className="flex items-center justify-center">
                  {isDiff ? (
                    <button
                      onClick={() => toggle(f.key)}
                      className="w-8 h-8 rounded-full border border-gray-300 bg-white hover:border-gray-500 flex items-center justify-center transition-colors"
                      title="Toggle selection"
                    >
                      {choice === 'left'
                        ? <ChevronLeft className="h-3.5 w-3.5 text-gray-500" />
                        : <ChevronRight className="h-3.5 w-3.5 text-gray-500" />}
                    </button>
                  ) : (
                    <div className="w-px h-full bg-gray-100" />
                  )}
                </div>

                {/* Right cell */}
                <div
                  className={`px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                    choice === 'right' ? 'bg-amber-50 font-medium text-amber-900' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => isDiff && setChoices(prev => ({ ...prev, [f.key]: 'right' }))}
                >
                  <div className="text-[10px] text-gray-400 mb-0.5">&nbsp;</div>
                  {rv}
                </div>
              </div>
            );
          })}
        </div>

        {/* Options + footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0 space-y-3">
          {/* MERGING IS NOT AVAILABLE YET ("Coming soon", step 1 convention;
              disabled 2026-10-03, real merge scheduled for step 8).
              This footer used to fire two lead writes — update the kept lead,
              disqualify the other — WITHOUT checking either result, then toast
              "Leads merged" regardless; its "carry over notes / activities"
              options did nothing at all, and LeadContext.mergeLeads returned
              true having written nothing. A success with no merge behind it.
              The comparison above stays: it is read-only and still useful for
              deciding which lead to keep. */}
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-gray-500">
              Merging leads is coming soon. Nothing on this screen changes either lead.
            </p>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                disabled
                aria-disabled="true"
                title="Coming soon"
                className="px-4 py-2 text-sm font-medium bg-gray-300 text-white rounded-lg cursor-not-allowed flex items-center gap-1.5"
              >
                <Merge className="h-3.5 w-3.5" />
                Merge Leads — coming soon
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
