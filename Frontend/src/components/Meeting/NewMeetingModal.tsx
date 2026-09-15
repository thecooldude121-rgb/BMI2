import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import {
  createMeeting, MEETING_TYPES, type Meeting, type MeetingType,
} from '../../utils/meetingsApi';

/**
 * Create a meeting note.
 *
 * REPLACES `ScheduleMeetingModal`, which could not be reused: its form carried
 * a hardcoded contact list ("John Smith / Acme Corp", "Sarah Lee / TechStart")
 * and a hardcoded deal list ("Acme Corp - $50K"), so every option it offered
 * was invented, and it collected `recordMeeting`, `enableAI` and
 * `autoGenerateLink` — three settings for capabilities this module explicitly
 * does not have. A form whose dropdowns are fiction cannot be pointed at a real
 * endpoint; it had to be rewritten rather than rewired.
 *
 * LINKING IS NOT DONE HERE. A new note starts unlinked and is pushed to a deal
 * or account from the detail page, through the endpoint that validates the
 * target belongs to your workspace. Offering a record picker here would mean
 * either a second write path for that field or a picker that cannot validate —
 * and the picker needs the deal/account lists, which is its own fetch.
 *
 * The type list comes from `MEETING_TYPES`, which mirrors the deployed CHECK
 * constraint. "Not specified" is a real option and the default: a meeting whose
 * kind the user did not state is stored with NULL rather than classified for
 * them.
 */
const NewMeetingModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCreated: (meeting: Meeting) => void;
}> = ({ isOpen, onClose, onCreated }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<MeetingType | ''>('');
  const [date, setDate] = useState('');
  const [duration, setDuration] = useState('');
  const [attendees, setAttendees] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('A title is required.'); return; }
    setSaving(true);
    setError(null);
    try {
      const created = await createMeeting({
        title: title.trim(),
        type: type || null,
        date: date ? new Date(date).toISOString() : null,
        duration: duration ? Number(duration) : null,
        attendees: attendees.trim() || null,
        notes: notes.trim() || null,
      });
      setTitle(''); setType(''); setDate(''); setDuration(''); setAttendees(''); setNotes('');
      onCreated(created);
    } catch (err) {
      // The server's own message, verbatim — it names the field that failed.
      setError(err instanceof Error ? err.message : 'Could not save the meeting.');
    } finally {
      setSaving(false);
    }
  };

  const field = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold text-gray-900">New meeting note</h2>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <div>
            <label htmlFor="mtg-title" className="block text-[12px] font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input id="mtg-title" className={field} value={title}
              onChange={e => setTitle(e.target.value)} placeholder="Discovery call" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="mtg-type" className="block text-[12px] font-medium text-gray-700 mb-1">Type</label>
              <select id="mtg-type" className={field} value={type}
                onChange={e => setType(e.target.value as MeetingType | '')}>
                <option value="">Not specified</option>
                {MEETING_TYPES.map(t => (
                  <option key={t} value={t}>
                    {t === 'sales-call' ? 'Sales call' : t === 'internal' ? 'Internal' : 'Client meeting'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="mtg-duration" className="block text-[12px] font-medium text-gray-700 mb-1">
                Duration (minutes)
              </label>
              <input id="mtg-duration" type="number" min="0" max="1440" className={field}
                value={duration} onChange={e => setDuration(e.target.value)} placeholder="30" />
            </div>
          </div>

          <div>
            <label htmlFor="mtg-date" className="block text-[12px] font-medium text-gray-700 mb-1">
              When
            </label>
            <input id="mtg-date" type="datetime-local" className={field}
              value={date} onChange={e => setDate(e.target.value)} />
            <p className="text-[11px] text-gray-400 mt-1">Defaults to now if left blank.</p>
          </div>

          <div>
            <label htmlFor="mtg-attendees" className="block text-[12px] font-medium text-gray-700 mb-1">
              Attendees
            </label>
            {/*
              * Free text, deliberately. `meetings.attendees` is a TEXT column
              * with no link to contacts or users, so a picker here would imply
              * a relationship the schema does not record. Making it one is a
              * schema decision, not a form decision.
              */}
            <input id="mtg-attendees" className={field} value={attendees}
              onChange={e => setAttendees(e.target.value)} placeholder="Names, comma separated" />
          </div>

          <div>
            <label htmlFor="mtg-notes" className="block text-[12px] font-medium text-gray-700 mb-1">Notes</label>
            <textarea id="mtg-notes" rows={5} className={field} value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="What was discussed, what was agreed, what happens next." />
          </div>

          {error && (
            <p className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Create note'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewMeetingModal;
