import { useCallback, useState } from 'react';
import { createActivityViaAPI, createNoteViaAPI } from '../utils/leadsApi';
import type { LeadActivity } from '../types/lead';

/**
 * THE way an outreach composer's entry is saved, for every page that opens one
 * (Lead detail, the Leads list). One path on purpose: both pages used to toast
 * "Call logged" over React state and send nothing, and two copies of the fix
 * would be two places for that to come back.
 *
 *   - a note -> POST /leads/:id/notes (lead_notes)
 *   - everything else -> POST /leads/:id/activities, which also records the
 *     lead's last contact for a COMPLETED call / email / meeting
 *
 * `save` resolves true only after a 2xx. On a refusal it resolves false and
 * `error` holds the server's message, so the caller keeps the composer open
 * with the user's input. Callers show success only on `true`.
 */
export function useLogLeadActivity() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(async (leadId: string, activity: LeadActivity): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      if (activity.type === 'note') {
        await createNoteViaAPI(leadId, { content: activity.description ?? '' });
      } else {
        await createActivityViaAPI(leadId, {
          type: activity.type, direction: activity.direction, status: activity.status,
          subject: activity.subject, description: activity.description, outcome: activity.outcome,
          duration_minutes: activity.duration_minutes, scheduled_at: activity.scheduled_at,
          completed_at: activity.completed_at,
        });
      }
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The server did not save this.');
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const reset = useCallback(() => setError(null), []);

  return { save, saving, error, reset };
}

export const LOGGED_LABEL: Record<string, string> = {
  email: 'Email logged', call: 'Call logged', whatsapp: 'WhatsApp logged',
  meeting: 'Meeting saved', note: 'Note saved', task: 'Task saved',
};
