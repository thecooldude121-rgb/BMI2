import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { formatDueDate } from '../../utils/leadFollowUp';
import { formatRelativeTime } from '../../utils/dateUtils';
import {
  describeNotification, notificationHref,
  type DueFollowUps, type NotificationRow,
} from '../../utils/notificationsApi';

/**
 * Follow-ups due today / overdue on leads the viewer owns. Read live from the
 * server on every open, and deliberately NOT part of the unread badge (approved
 * 2026-10-10): they clear when the follow-up is done, not when it is seen.
 */
export const DueSection: React.FC<{ due: DueFollowUps | null; failed: boolean; limit?: number; onNavigate?: () => void }> = ({
  due, failed, limit = 5, onNavigate,
}) => {
  if (failed) return <p className="px-4 py-3 text-xs text-danger-700" role="alert">Due follow-ups could not load.</p>;
  if (!due) return <p className="px-4 py-3 text-xs text-ink-muted" role="status">Checking follow-ups…</p>;
  const total = due.overdue_count + due.today_count;
  if (!total) return null;
  return (
    <section aria-label="Due" className="border-b border-line" data-testid="due-section">
      <h3 className="flex items-center gap-2 px-4 pt-3 text-xs font-semibold uppercase text-ink-secondary">
        <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" /> Due
        {due.overdue_count > 0 && <Badge tone="danger">{due.overdue_count} overdue</Badge>}
        {due.today_count > 0 && <Badge tone="warning">{due.today_count} today</Badge>}
      </h3>
      <ul className="py-1">
        {due.items.slice(0, limit).map(i => (
          <li key={i.task_id}>
            <Link to={`/crm/leads/${i.lead_id}`} onClick={onNavigate}
              className="flex items-center justify-between gap-3 px-4 py-2 text-sm text-ink hover:bg-brand-50 focus:bg-brand-50 focus:outline-none">
              <span className="truncate">Follow up with {i.lead_name || `lead ${i.lead_id}`}{i.company ? ` · ${i.company}` : ''}</span>
              <span className={`shrink-0 text-xs ${i.overdue ? 'text-danger-700' : 'text-warning-700'}`}>
                {i.overdue ? `Overdue · ${formatDueDate(i.due)}` : 'Today'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {total > limit && <p className="px-4 pb-2 text-xs text-ink-muted">{total - limit} more due</p>}
    </section>
  );
};

/** One stored event. Opening it marks it read (after the server confirms). */
export const NotificationItem: React.FC<{ n: NotificationRow; onOpen: (n: NotificationRow) => void }> = ({ n, onOpen }) => (
  <li>
    <Link to={notificationHref(n)} onClick={() => onOpen(n)} data-unread={!n.read_at}
      className={`flex gap-3 px-4 py-2.5 text-sm hover:bg-brand-50 focus:bg-brand-50 focus:outline-none ${n.read_at ? 'text-ink-muted' : 'text-ink'}`}>
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read_at ? 'bg-transparent' : 'bg-brand-600'}`} aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className={`block ${n.read_at ? '' : 'font-medium'}`}>
          {describeNotification(n)}
          {!n.read_at && <span className="sr-only"> (unread)</span>}
        </span>
        <span className="block text-xs text-ink-muted">{formatRelativeTime(n.created_at, '')}</span>
      </span>
    </Link>
  </li>
);
