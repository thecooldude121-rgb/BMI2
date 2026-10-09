import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import { useUnreadNotifications } from '../../hooks/useUnreadNotifications';
import {
  fetchNotifications, fetchDueFollowUps, markNotificationRead, markAllNotificationsRead,
  type NotificationRow, type DueFollowUps,
} from '../../utils/notificationsApi';
import { DueSection, NotificationItem } from './NotificationItems';

/**
 * The top bar's bell (Group A item 5). The badge is the SERVER's unread count of
 * stored events; due follow-ups appear in their own section and never count.
 * Every read state change waits for the server's 2xx before it shows.
 */
const NotificationsBell: React.FC<{ buttonClass: string }> = ({ buttonClass }) => {
  const { count, refresh, setCount } = useUnreadNotifications();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<NotificationRow[] | null>(null);
  const [due, setDue] = useState<DueFollowUps | null>(null);
  const [failed, setFailed] = useState({ feed: false, due: false });
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setError(null);
    setFailed({ feed: false, due: false });
    const [feed, d] = await Promise.allSettled([fetchNotifications({ limit: 8 }), fetchDueFollowUps()]);
    if (feed.status === 'fulfilled') { setRows(feed.value.data); setCount(feed.value.unread_count); }
    else { setRows(null); setFailed(f => ({ ...f, feed: true })); }
    if (d.status === 'fulfilled') setDue(d.value);
    else { setDue(null); setFailed(f => ({ ...f, due: true })); }
  }, [setCount]);

  useEffect(() => { if (open) load(); }, [open, load]);
  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const openOne = async (n: NotificationRow) => {
    setOpen(false);
    if (n.read_at) return;
    try { await markNotificationRead(n.id); refresh(); } catch { /* stays unread; the count is re-read on the next poll */ }
  };

  const readAll = async () => {
    try {
      await markAllNotificationsRead();
      await load();
    } catch (e) { setError((e as Error).message); }
  };

  const label = count ? `Notifications, ${count} unread` : 'Notifications';
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(v => !v)} aria-label={label} aria-expanded={open}
        className={`${buttonClass} relative hover:bg-black/5`}>
        <Bell className="h-[18px] w-[18px]" />
        {!!count && (
          <span data-testid="unread-badge"
            className="absolute -right-1.5 -top-1.5 min-w-[18px] rounded-full bg-brand-600 px-1 text-center text-[11px] font-semibold leading-[18px] text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-card border border-line bg-surface-panel shadow-xl"
          role="dialog" aria-label="Notifications">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="text-sm font-semibold text-ink">Notifications</span>
            <div className="flex items-center gap-2">
              {!!rows?.some(r => !r.read_at) && (
                <button onClick={readAll} className="text-xs font-medium text-brand-700 hover:underline">Mark all read</button>
              )}
              <button onClick={() => setOpen(false)} aria-label="Close notifications" className="rounded p-1 text-ink-muted hover:text-ink">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          {error && <p className="px-4 py-2 text-xs text-danger-700" role="alert">{error}</p>}
          <DueSection due={due} failed={failed.due} onNavigate={() => setOpen(false)} />
          <div className="max-h-[360px] overflow-y-auto">
            {failed.feed && <p className="px-4 py-3 text-xs text-danger-700" role="alert">Notifications could not load.</p>}
            {!failed.feed && !rows && <p className="px-4 py-3 text-xs text-ink-muted" role="status">Loading…</p>}
            {rows && rows.length === 0 && (
              <p className="px-4 py-6 text-center text-xs text-ink-muted">
                Nothing yet. You will hear here when a lead or deal is assigned to you, a deal you own changes stage, or a lead you own is converted.
              </p>
            )}
            {rows && rows.length > 0 && <ul className="py-1">{rows.map(n => <NotificationItem key={n.id} n={n} onOpen={openOne} />)}</ul>}
          </div>
          <Link to="/crm/inbox" onClick={() => setOpen(false)}
            className="block border-t border-line px-4 py-2.5 text-center text-xs font-medium text-brand-700 hover:bg-brand-50">
            Open inbox
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationsBell;
