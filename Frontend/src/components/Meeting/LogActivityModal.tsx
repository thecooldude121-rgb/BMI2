import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import {
  logActivityFromMeeting, RELATED_TYPE_LABEL, type MeetingDetail,
} from '../../utils/meetingsApi';

/**
 * LOG AN ACTIVITY FROM THIS NOTE — the manual action, and manual is the point.
 *
 * ─── THE SUBJECT FIELD STARTS EMPTY, DELIBERATELY ──────────────────────────
 *
 * The obvious "helpful" version of this modal pre-fills the subject from the
 * note — the first line, the sentence after "ACTION:", the bullet nearest the
 * bottom. Every one of those is a guess about what the user meant, and a
 * pre-filled field is accepted far more often than it is read. That is the
 * Phase-2 extraction feature arriving through the side door, and it is
 * explicitly not being built: the backend has no parser and neither does this.
 *
 * So the user reads their own note (it is on the page behind this dialog) and
 * types what the follow-up actually is. What gets stored is a sentence a person
 * wrote, not one a heuristic proposed.
 *
 * The note is NOT copied into the description either. The activity records the
 * meeting it came from — the server appends "From meeting MTG001: <title>" —
 * which is provenance, not content.
 */

/** The subset of activity types that make sense as a meeting follow-up. */
const TYPES = [
  { id: 'note', label: 'Note' },
  { id: 'task', label: 'Task' },
  { id: 'call', label: 'Call' },
  { id: 'email', label: 'Email' },
  { id: 'meeting', label: 'Meeting' },
] as const;

const LogActivityModal: React.FC<{
  isOpen: boolean;
  meeting: MeetingDetail;
  onClose: () => void;
  onLogged: () => void;
}> = ({ isOpen, meeting, onClose, onLogged }) => {
  const [subject, setSubject] = useState('');
  const [type, setType] = useState<string>('note');
  const [status, setStatus] = useState<'planned' | 'completed'>('planned');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) { setError('Say what the follow-up is.'); return; }
    setSaving(true);
    setError(null);
    try {
      await logActivityFromMeeting(meeting.id, {
        subject: subject.trim(),
        type,
        status,
        description: description.trim() || undefined,
      });
      setSubject(''); setDescription(''); setType('note'); setStatus('planned');
      onLogged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not log the activity.');
    } finally {
      setSaving(false);
    }
  };

  const field = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold text-gray-900 flex items-center gap-2">
            <Plus className="h-4 w-4 text-gray-400" aria-hidden="true" />
            Log an activity
          </h2>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <p className="text-[12px] text-gray-500">
            This will appear on{' '}
            <strong className="text-gray-700">
              {meeting.related_to_type ? RELATED_TYPE_LABEL[meeting.related_to_type] : 'the linked record'}
              {' '}{meeting.related_to_id}
            </strong>
            &rsquo;s activity feed.
          </p>

          <div>
            <label htmlFor="act-subject" className="block text-[12px] font-medium text-gray-700 mb-1">
              What is the follow-up? <span className="text-red-500">*</span>
            </label>
            <input
              id="act-subject" className={field} value={subject} autoFocus
              onChange={e => { setSubject(e.target.value); setError(null); }}
              placeholder="e.g. Send the revised quote"
            />
            {/*
              * No "suggested from your note" list under this input. See the
              * note at the top of this file — that is the one affordance this
              * module is not allowed to grow.
              */}
            <p className="text-[11px] text-gray-400 mt-1">
              Your words, not ours &mdash; nothing is read out of the note automatically.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="act-type" className="block text-[12px] font-medium text-gray-700 mb-1">Type</label>
              <select id="act-type" className={field} value={type} onChange={e => setType(e.target.value)}>
                {TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="act-status" className="block text-[12px] font-medium text-gray-700 mb-1">Status</label>
              <select
                id="act-status" className={field} value={status}
                onChange={e => setStatus(e.target.value as 'planned' | 'completed')}
              >
                <option value="planned">Planned</option>
                <option value="completed">Already done</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="act-desc" className="block text-[12px] font-medium text-gray-700 mb-1">
              Detail (optional)
            </label>
            <textarea id="act-desc" rows={3} className={field} value={description}
              onChange={e => setDescription(e.target.value)} />
            <p className="text-[11px] text-gray-400 mt-1">
              The meeting this came from is recorded automatically.
            </p>
          </div>

          {error && (
            <p className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Logging…' : 'Log activity'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogActivityModal;
