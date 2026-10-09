import React, { useCallback, useEffect, useState } from 'react';
import { Inbox } from 'lucide-react';
import PageHeader from '../../components/Layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { DueSection, NotificationItem } from '../../components/Notifications/NotificationItems';
import {
  fetchNotifications, fetchDueFollowUps, markNotificationRead, markAllNotificationsRead,
  type NotificationPage, type NotificationRow, type DueFollowUps,
} from '../../utils/notificationsApi';

const PAGE = 25;

/**
 * /crm/inbox — the internal activity feed (Group A item 5). Not email. Your own
 * stored events, paged on the server with its total, plus the live "Due"
 * follow-ups. A failed load says so; it never renders as an empty inbox.
 */
const InboxPage: React.FC = () => {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [offset, setOffset] = useState(0);
  const [page, setPage] = useState<NotificationPage | null>(null);
  const [due, setDue] = useState<DueFollowUps | null>(null);
  const [failed, setFailed] = useState({ feed: false, due: false });
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [feed, d] = await Promise.allSettled([fetchNotifications({ limit: PAGE, offset, unread: unreadOnly }), fetchDueFollowUps()]);
    setFailed({ feed: feed.status === 'rejected', due: d.status === 'rejected' });
    setPage(feed.status === 'fulfilled' ? feed.value : null);
    setDue(d.status === 'fulfilled' ? d.value : null);
  }, [offset, unreadOnly]);
  useEffect(() => { load(); }, [load]);

  const openOne = async (n: NotificationRow) => {
    if (n.read_at) return;
    try { await markNotificationRead(n.id); } catch { /* left unread */ }
  };
  const readAll = async () => {
    setError(null);
    try { await markAllNotificationsRead(); await load(); } catch (e) { setError((e as Error).message); }
  };
  const setFilter = (u: boolean) => { setUnreadOnly(u); setOffset(0); };

  const total = page?.total ?? 0;
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
      <PageHeader title="Inbox" description="Assignments, stage changes and conversions on your leads and deals, and follow-ups that are due." />
      <Card padding="none" className="overflow-hidden">
        <DueSection due={due} failed={failed.due} limit={20} />
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
          <div role="group" aria-label="Show" className="flex gap-1">
            <Button size="sm" variant={unreadOnly ? 'ghost' : 'secondary'} aria-pressed={!unreadOnly} onClick={() => setFilter(false)}>All</Button>
            <Button size="sm" variant={unreadOnly ? 'secondary' : 'ghost'} aria-pressed={unreadOnly} onClick={() => setFilter(true)}>
              Unread{page ? ` (${page.unread_count})` : ''}
            </Button>
          </div>
          {!!page?.unread_count && <Button size="sm" variant="link" onClick={readAll}>Mark all read</Button>}
        </div>
        {error && <p className="px-4 py-2 text-xs text-danger-700" role="alert">{error}</p>}
        {failed.feed && <div className="p-4"><EmptyState tone="error" title="The inbox could not load" reason="Nothing is shown rather than an empty inbox that might not be true." action={<Button size="sm" variant="secondary" onClick={load}>Try again</Button>} /></div>}
        {!failed.feed && !page && <p className="px-4 py-6 text-sm text-ink-muted" role="status">Loading…</p>}
        {page && page.data.length === 0 && (
          <div className="p-4">
            <EmptyState icon={<Inbox className="h-5 w-5" />} title={unreadOnly ? 'No unread notifications' : 'Nothing here yet'}
              reason="You hear here when someone else assigns you a lead or deal, moves a deal you own to another stage, or converts a lead you own. Your own actions never notify you." />
          </div>
        )}
        {page && page.data.length > 0 && <ul className="divide-y divide-line">{page.data.map(n => <NotificationItem key={n.id} n={n} onOpen={openOne} />)}</ul>}
        {page && total > PAGE && (
          <div className="flex items-center justify-between border-t border-line px-4 py-2.5 text-xs text-ink-muted">
            <span>Showing {offset + 1}–{Math.min(offset + PAGE, total)} of {total}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={offset === 0} onClick={() => setOffset(o => Math.max(0, o - PAGE))}>Previous</Button>
              <Button size="sm" variant="secondary" disabled={offset + PAGE >= total} onClick={() => setOffset(o => o + PAGE)}>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default InboxPage;
