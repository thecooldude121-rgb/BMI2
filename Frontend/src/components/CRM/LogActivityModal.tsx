import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { createActivity, buildActivityPayload } from '../../utils/activitiesApi';
import type { ActivityRecord, ActivityType, ActivityParent } from '../../utils/activitiesApi';

/**
 * Log an activity against a contact, deal, company or lead.
 *
 * REPLACES four handlers that did nothing. The contact page had Email, Call,
 * Schedule Meeting and Add Note buttons whose entire bodies were
 * `setShowX(true); console.log('Open email composer')` — the modals they set
 * state for were never rendered. Nothing was ever recorded, which is also why
 * the activity timeline on that page was hardcoded JSX: there was no activity
 * data, because no activity could be created.
 *
 * `activities` has had full CRUD and a contact_id column all along.
 *
 * The type list, statuses and directions come from activitiesApi, which mirrors
 * the CHECK constraints on the table. Do not add an option here without adding
 * it there and in a migration first.
 */

/** The subset of activity types worth offering from a contact record. */
const OFFERED_TYPES: ActivityType[] = ['call', 'email', 'meeting', 'note', 'linkedin', 'demo', 'visit'];

const TYPE_LABELS: Partial<Record<ActivityType, string>> = {
  call: 'Call', email: 'Email', meeting: 'Meeting', note: 'Note',
  linkedin: 'LinkedIn message', demo: 'Demo', visit: 'Visit',
};

interface LogActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Exactly one parent — enforced server-side too. */
  parent: ActivityParent;
  /** Shown in the title so it is clear what the activity attaches to. */
  parentLabel: string;
  /** Preselected type, e.g. 'call' when opened from a Call button. */
  initialType?: ActivityType;
  onLogged: (activity: ActivityRecord) => void;
}

const LogActivityModal: React.FC<LogActivityModalProps> = ({
  isOpen, onClose, parent, parentLabel, initialType = 'call', onLogged,
}) => {
  const [type, setType] = useState<ActivityType>(initialType);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [outcome, setOutcome] = useState('');
  const [duration, setDuration] = useState('');
  const [direction, setDirection] = useState<'outbound' | 'inbound'>('outbound');
  /** Already happened, or planned for later. Drives which timestamp is set. */
  const [when, setWhen] = useState<'now' | 'later'>('now');
  const [scheduledAt, setScheduledAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset on open so a previous entry is not still sitting in the form, and so
  // the type matches whichever button was pressed this time.
  useEffect(() => {
    if (!isOpen) return;
    setType(initialType);
    setSubject('');
    setDescription('');
    setOutcome('');
    setDuration('');
    setDirection('outbound');
    setWhen('now');
    setScheduledAt('');
    setError(null);
  }, [isOpen, initialType]);

  const needsDuration = type === 'call' || type === 'meeting' || type === 'demo' || type === 'visit';
  const needsDirection = type === 'call' || type === 'email' || type === 'linkedin';

  const submit = async () => {
    if (!subject.trim()) { setError('Give this activity a subject.'); return; }
    if (when === 'later' && !scheduledAt) { setError('Pick a date and time, or log it as already happened.'); return; }
    setSaving(true);
    setError(null);
    try {
      // Payload rules live in buildActivityPayload so they are testable — the
      // exclusivity of completed_at/scheduled_at, and the fact that a blank
      // duration must be omitted rather than sent as Number('') === 0.
      const saved = await createActivity(parent, buildActivityPayload({
        subject,
        type,
        when,
        scheduledAt,
        ...(needsDirection ? { direction } : {}),
        ...(needsDuration ? { duration } : {}),
        description,
        outcome,
      }, new Date()) as Parameters<typeof createActivity>[1]);
      onLogged(saved);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save this activity');
    } finally {
      setSaving(false);
    }
  };

  const field = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Log activity for ${parentLabel}`}
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={submit} loading={saving}>
            {when === 'now' ? 'Log activity' : 'Schedule activity'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="activity-type" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select id="activity-type" value={type} onChange={e => setType(e.target.value as ActivityType)} className={field}>
              {OFFERED_TYPES.map(t => (
                <option key={t} value={t}>{TYPE_LABELS[t] ?? t}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="activity-when" className="block text-sm font-medium text-gray-700 mb-1">When</label>
            <select id="activity-when" value={when} onChange={e => setWhen(e.target.value as 'now' | 'later')} className={field}>
              <option value="now">Already happened</option>
              <option value="later">Planned for later</option>
            </select>
          </div>
        </div>

        {when === 'later' && (
          <div>
            <label htmlFor="activity-scheduled" className="block text-sm font-medium text-gray-700 mb-1">
              Date and time
            </label>
            <input
              id="activity-scheduled" type="datetime-local" value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)} className={field}
            />
          </div>
        )}

        <div>
          <label htmlFor="activity-subject" className="block text-sm font-medium text-gray-700 mb-1">
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            id="activity-subject" type="text" value={subject}
            onChange={e => setSubject(e.target.value)} className={field}
            placeholder="Discovery call, Sent pricing, Left voicemail…"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {needsDirection && (
            <div>
              <label htmlFor="activity-direction" className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
              <select
                id="activity-direction" value={direction}
                onChange={e => setDirection(e.target.value as 'outbound' | 'inbound')} className={field}
              >
                <option value="outbound">We contacted them</option>
                <option value="inbound">They contacted us</option>
              </select>
            </div>
          )}
          {needsDuration && (
            <div>
              <label htmlFor="activity-duration" className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes)
              </label>
              <input
                id="activity-duration" type="number" min="0" value={duration}
                onChange={e => setDuration(e.target.value)} className={field}
              />
            </div>
          )}
        </div>

        <div>
          <label htmlFor="activity-description" className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            id="activity-description" rows={4} value={description}
            onChange={e => setDescription(e.target.value)} className={field}
            placeholder="What was discussed?"
          />
        </div>

        <div>
          <label htmlFor="activity-outcome" className="block text-sm font-medium text-gray-700 mb-1">
            Outcome
          </label>
          <input
            id="activity-outcome" type="text" value={outcome}
            onChange={e => setOutcome(e.target.value)} className={field}
            placeholder="Agreed next step, no answer, asked for a proposal…"
          />
        </div>

        <p className="text-xs text-gray-500">
          {/* An email logged here is a record that it was sent, not a sent email.
              Nothing in this app delivers mail, and the button used to imply it
              did. */}
          This records what happened. It does not send an email or place a call.
        </p>
      </div>
    </Modal>
  );
};

export default LogActivityModal;
