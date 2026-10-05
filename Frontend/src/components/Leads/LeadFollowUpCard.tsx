import React, { useState } from 'react';
import Card, { SectionHeading } from '../ui/Card';
import Badge from '../ui/Badge';
import Alert from '../ui/Alert';
import { Button } from '../ui/Button';
import { inputClass } from '../ui/Field';
import {
  completeFollowUp, createLeadFollowUp, followUpStatus, localToday, rescheduleFollowUp, formatDueDate,
} from '../../utils/leadFollowUp';
import type { Lead } from '../../types/lead';

/**
 * Follow-up on the Lead detail rail (Group B item 11, v1 scope: a DATE, no time
 * of day, no notification delivery). Backed by a `tasks` row of type
 * 'follow-up'; the lead's next one comes from GET /leads/:id. Every action waits
 * for the server and reports a refusal; `onChanged` refetches the lead.
 */
export interface LeadFollowUpCardProps {
  lead: Lead;
  assignedTo?: string;
  onChanged: (message: string) => void;
}

const LeadFollowUpCard: React.FC<LeadFollowUpCardProps> = ({ lead, assignedTo, onChanged }) => {
  const today = localToday();
  const [date, setDate] = useState(lead.next_follow_up_date ?? '');
  const [busy, setBusy] = useState<'save' | 'done' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const status = followUpStatus(lead.next_follow_up_date, today);
  const hasOpen = !!lead.next_follow_up_task_id;
  const name = lead.full_name || [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'lead';

  const run = async (kind: 'save' | 'done', work: () => Promise<unknown>, message: string) => {
    setBusy(kind); setError(null);
    try { await work(); onChanged(message); }
    catch (e) { setError(e instanceof Error ? e.message : 'The follow-up was not saved.'); }
    finally { setBusy(null); }
  };

  const save = () => {
    if (!date) return;
    if (hasOpen) void run('save', () => rescheduleFollowUp(lead.next_follow_up_task_id!, date), `Follow-up moved to ${formatDueDate(date)}`);
    else void run('save', () => createLeadFollowUp(lead.id, date, `Follow up with ${name}`, assignedTo), `Follow-up set for ${formatDueDate(date)}`);
  };

  return (
    <Card padding="md" className="flex flex-col gap-2" data-testid="follow-up-card">
      <div className="flex items-start justify-between gap-2">
        <SectionHeading title="Follow-up" />
        {status ? <Badge tone={status.tone}>{status.label}</Badge> : <Badge tone="neutral">None set</Badge>}
      </div>
      <p className="text-xs leading-[18px] text-ink-muted">
        A dated reminder kept as a task. No time of day or notification yet.
      </p>
      {error && <Alert tone="danger" title="Not saved">{error}</Alert>}
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink">
          {hasOpen ? 'Move to' : 'Due on'}
          <input type="date" min={today} value={date} onChange={e => setDate(e.target.value)} className={`${inputClass()} w-auto`} />
        </label>
        <Button size="sm" onClick={save} loading={busy === 'save'} disabled={!date || date === lead.next_follow_up_date || busy !== null}>
          {hasOpen ? 'Reschedule' : 'Set follow-up'}
        </Button>
        {hasOpen && (
          <Button size="sm" variant="secondary" loading={busy === 'done'} disabled={busy !== null}
            onClick={() => void run('done', () => completeFollowUp(lead.next_follow_up_task_id!), 'Follow-up marked done')}>
            Mark done
          </Button>
        )}
      </div>
    </Card>
  );
};

export default LeadFollowUpCard;
