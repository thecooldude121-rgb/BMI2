import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Info } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import PageHeader from '../../components/Layout/PageHeader';
import {
  fetchTasksByDay,
  fetchTasksPage,
  fetchTaskSummary,
  type TaskDay,
  type TaskRecord,
  type TaskSummary,
} from '../../utils/activitiesApi';
import { fetchMeetingsInWindow, type Meeting } from '../../utils/meetingsApi';
import { localDay, parseLocalDay } from '../../utils/dates';

/**
 * Calendar — Group A item 4, slice 4a (2026-10-11).
 *
 * It fetched 500 tasks once, whatever month was on screen, so at scale a month
 * could show none of its tasks while looking complete; and it rendered
 * `meetings` from DataContext, a permanent empty stub ("no /meetings route
 * yet") long after the Meeting Agent shipped a real API. Now:
 *   - TASKS: GET /tasks/by-day for exactly the six visible weeks — each day's
 *     real count and its first three tasks, so "+N more" is the server's
 *     number, never the length of what loaded;
 *   - MEETINGS: GET /meetings for the same window, as INSTANTS (the viewer's
 *     local midnights), bucketed into days in the browser — a meeting's day
 *     depends on the viewer's zone, unlike a task's DATE;
 *   - "today" is the viewer's local day everywhere (decided 2026-10-11).
 * Week / Day views do not exist and are disabled, labelled "Coming soon"; they
 * used to restyle a button and leave the month grid on screen.
 *
 * Not a context, deliberately (see hooks/useDashboardData.ts): the calendar is
 * the only consumer of tasks arranged by day.
 */

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
// Weeks start on MONDAY across the app (decided 2026-10-13).
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MEETING_PAGE = 200;

/** The 42 local days of the month grid, Monday first. */
function gridDays(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  return Array.from({ length: 42 }, (_, i) => new Date(first.getFullYear(), first.getMonth(), 1 - ((first.getDay() + 6) % 7) + i));
}

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const fmtDay = (day: string) => parseLocalDay(day)?.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) ?? day;
/** "Saturday, 3 October" — the selected-day card's title in the frame. */
const fmtLongDay = (day: string) => parseLocalDay(day)?.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }) ?? day;
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

const Calendar: React.FC = () => {
  const navigate = useNavigate();
  const [month, setMonth] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
  // The frame opens with today selected, so the day card is never empty on arrival.
  const [selected, setSelected] = useState<string | null>(() => localDay(new Date()));
  const today = localDay(new Date());

  const days = useMemo(() => gridDays(month), [month]);
  const from = localDay(days[0]);
  const to = localDay(days[41]);

  // ── Tasks for the visible weeks ───────────────────────────────────────────
  const [taskDays, setTaskDays] = useState<Map<string, TaskDay> | null>(null);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [tasksRetry, setTasksRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setTaskDays(null);
    fetchTasksByDay(from, to)
      .then(r => { if (!cancelled) { setTaskDays(new Map(r.days.map(d => [d.day, d]))); setTasksError(null); } })
      .catch(e => { if (!cancelled) setTasksError(e?.message ?? 'Could not load tasks'); });
    return () => { cancelled = true; };
  }, [from, to, tasksRetry]);

  // ── Meetings for the same window ──────────────────────────────────────────
  const [meetings, setMeetings] = useState<{ list: Meeting[]; total: number } | null>(null);
  const [meetingsError, setMeetingsError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setMeetings(null);
    fetchMeetingsInWindow(days[0], addDays(days[41], 1), MEETING_PAGE)
      .then(r => { if (!cancelled) { setMeetings({ list: r.meetings, total: r.total }); setMeetingsError(null); } })
      .catch(e => { if (!cancelled) setMeetingsError(e?.message ?? 'Could not load meetings'); });
    return () => { cancelled = true; };
  }, [days]);
  const meetingsByDay = useMemo(() => {
    const map = new Map<string, Meeting[]>();
    for (const m of meetings?.list ?? []) {
      if (!m.date) continue;
      const key = localDay(new Date(m.date));
      map.set(key, [...(map.get(key) ?? []), m]);
    }
    return map;
  }, [meetings]);

  // ── The rail: due soon, overdue + undated counts, upcoming meetings ───────
  const [dueSoon, setDueSoon] = useState<{ tasks: TaskRecord[]; total: number } | null>(null);
  const [summary, setSummary] = useState<TaskSummary | null>(null);
  const [railError, setRailError] = useState<string | null>(null);
  const [upcoming, setUpcoming] = useState<Meeting[] | null>(null);
  const [upcomingError, setUpcomingError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    const horizon = localDay(addDays(new Date(), 6));
    Promise.all([
      fetchTasksPage({ bucket: 'open', due_after: today, due_before: horizon, sort: 'due_date', dir: 'asc', limit: 4, offset: 0 }),
      fetchTaskSummary(today),
    ])
      .then(([soon, sum]) => { if (!cancelled) { setDueSoon(soon); setSummary(sum); setRailError(null); } })
      .catch(e => { if (!cancelled) setRailError(e?.message ?? 'Could not load tasks'); });
    const now = new Date();
    fetchMeetingsInWindow(now, addDays(now, 7), 5)
      .then(r => { if (!cancelled) { setUpcoming(r.meetings); setUpcomingError(null); } })
      .catch(e => { if (!cancelled) setUpcomingError(e?.message ?? 'Could not load meetings'); });
    return () => { cancelled = true; };
  }, [today]);

  // ── The selected day: its tasks from the server, not the cell's three ────
  const [dayTasks, setDayTasks] = useState<{ tasks: TaskRecord[]; total: number } | null>(null);
  const [dayError, setDayError] = useState<string | null>(null);
  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    setDayTasks(null);
    fetchTasksPage({ due_after: selected, due_before: selected, limit: 10, offset: 0 })
      .then(r => { if (!cancelled) { setDayTasks(r); setDayError(null); } })
      .catch(e => { if (!cancelled) setDayError(e?.message ?? 'Could not load tasks'); });
    return () => { cancelled = true; };
  }, [selected]);

  const monthMeetings = useMemo(
    () => (meetings?.list ?? []).filter(m => m.date && new Date(m.date).getMonth() === month.getMonth() && new Date(m.date).getFullYear() === month.getFullYear()),
    [meetings, month],
  );
  const meetingsCapped = !!meetings && meetings.total > meetings.list.length;
  /** Dated tasks due in the month on screen — the by-day totals, summed over its own days. */
  const monthDatedTasks = useMemo(() => {
    if (!taskDays) return null;
    let n = 0;
    for (const [day, td] of taskDays) {
      const d = parseLocalDay(day);
      if (d && d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear()) n += td.total;
    }
    return n;
  }, [taskDays, month]);

  const step = (n: number) => setMonth(m => new Date(m.getFullYear(), m.getMonth() + n, 1));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Task calendar"
        title="Calendar"
        description="Task-first view, with meetings at their start time in your time zone. Undated tasks do not appear on the grid."
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate('/crm/meetings')}>Go to Meetings</Button>
            <Button onClick={() => navigate('/crm/tasks?new=1')}>
              <Plus className="h-4 w-4" aria-hidden="true" /> New task
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => step(-1)} aria-label="Previous month"><ChevronLeft className="h-4 w-4" aria-hidden="true" /></Button>
          <Button variant="secondary" onClick={() => { const n = new Date(); setMonth(new Date(n.getFullYear(), n.getMonth(), 1)); }}>Today</Button>
          <Button variant="secondary" onClick={() => step(1)} aria-label="Next month"><ChevronRight className="h-4 w-4" aria-hidden="true" /></Button>
          <h2 className="text-2xl font-semibold leading-8 text-ink" data-testid="calendar-month">
            {MONTHS[month.getMonth()]} {month.getFullYear()}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex h-7 w-[220px] items-stretch overflow-hidden rounded-ctrl border border-line bg-white text-xs" role="group" aria-label="Calendar view">
            <button type="button" aria-pressed="true" className="flex-1 bg-brand-100 font-semibold text-brand-700">Month</button>
            <button type="button" disabled title="Week view is coming soon" className="flex-1 cursor-not-allowed border-l border-line text-ink-secondary">Week · Soon</button>
            <button type="button" disabled title="Day view is coming soon" className="flex-1 cursor-not-allowed border-l border-line text-ink-secondary">Day · Soon</button>
          </div>
          <p className="text-xs text-ink-secondary">Week and day views are coming soon.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {tasksError && (
            <EmptyState tone="error" title="Tasks could not load for these weeks" reason={tasksError}
              action={<Button variant="secondary" onClick={() => setTasksRetry(k => k + 1)}>Try again</Button>} />
          )}
          <Card padding="none" className="overflow-hidden">
            <div className="grid grid-cols-7 border-b border-line bg-surface-sunken">
              {WEEKDAYS.map(d => <div key={d} className="flex h-9 items-center justify-center text-xs font-semibold text-ink-secondary">{d}</div>)}
            </div>
            <div className="grid grid-cols-7" aria-busy={taskDays === null && !tasksError}>
              {days.map(date => {
                const key = localDay(date);
                const inMonth = date.getMonth() === month.getMonth();
                const td = taskDays?.get(key);
                const dm = meetingsByDay.get(key) ?? [];
                const moreTasks = td ? td.total - td.tasks.length : 0;
                const isToday = key === today;
                // The frame highlights the WHOLE cell for today and for the selection.
                const marked = isToday || selected === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelected(key)}
                    aria-pressed={selected === key}
                    aria-label={`${fmtDay(key)}: ${td?.total ?? 0} tasks, ${dm.length} meetings`}
                    data-testid={`day-${key}`}
                    className={`flex min-h-[116px] flex-col gap-[7px] border-b border-r border-line p-2 text-left align-top focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600 ${
                      marked ? 'bg-brand-100 shadow-[inset_0_0_0_1px_theme(colors.brand.600)]' : 'bg-surface-panel hover:bg-surface-subtle'
                    }`}
                  >
                    <span className={`self-start text-xs font-medium ${marked ? 'text-brand-600' : inMonth ? 'text-ink' : 'text-ink-secondary'}`}>
                      {date.getDate()}
                    </span>
                    {dm.slice(0, 2).map(m => (
                      <span key={m.id} className="line-clamp-2 w-full rounded-[5px] border border-line border-l-[3px] border-l-sky-accent bg-surface-panel px-1.5 py-1 text-xs leading-4 text-ink" title={m.title}>
                        {m.date ? `${fmtTime(m.date)} ` : ''}{m.title}
                      </span>
                    ))}
                    {dm.length > 2 && <span className="text-xs text-ink-secondary">+{dm.length - 2} more meetings</span>}
                    {td?.tasks.map(t => {
                      const done = t.status === 'completed';
                      const overdue = !done && key < today;
                      return (
                        <span
                          key={t.id}
                          title={`${t.title}${t.assigned_to ? ` · ${t.assigned_to}` : ''}`}
                          className={`line-clamp-2 w-full rounded-[5px] px-1.5 py-1 text-xs leading-4 ${
                            done ? 'bg-surface-sunken text-ink-secondary line-through' : overdue ? 'bg-danger-100 text-danger-700' : 'bg-brand-100 text-brand-700'
                          }`}
                        >
                          {t.title}
                        </span>
                      );
                    })}
                    {moreTasks > 0 && <span className="text-xs text-ink-secondary" data-testid={`more-${key}`}>+{moreTasks} more tasks</span>}
                  </button>
                );
              })}
            </div>
            {/* Legend: inside the grid card as its footer, as the frame draws it. */}
            <div className="flex flex-wrap items-center gap-x-[18px] gap-y-1 border-t border-line p-3 text-xs text-ink-muted">
              <span><span className="text-brand-700" aria-hidden="true">● </span>Open task</span>
              <span><span className="text-danger-700" aria-hidden="true">● </span>Overdue task</span>
              <span><span className="text-ink-muted" aria-hidden="true">● </span>Completed task</span>
              <span><span className="text-sky-accent" aria-hidden="true">● </span>Meeting</span>
              <span className="ml-auto">
              {meetingsError
                ? `Meetings could not load — ${meetingsError}`
                : meetingsCapped
                  ? `Showing the first ${meetings!.list.length} of ${meetings!.total.toLocaleString()} meetings in these weeks.`
                  : 'Meetings come from the Meetings module, at their start time in your time zone.'}
              </span>
            </div>
          </Card>
        </div>

        <aside className="space-y-3">
          <Card padding="none" className="p-3.5">
            <h3 className="text-xl font-semibold leading-7 text-ink-heading">Tasks Due Soon</h3>
            {railError && <p className="mt-2 text-sm text-danger-700" role="alert">{railError}</p>}
            {!railError && (!dueSoon || !summary) && <p className="mt-2 text-sm text-ink-muted">Loading tasks…</p>}
            {dueSoon && summary && (
              <>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  {summary.overdue > 0 && (
                    <Link to="/crm/tasks?bucket=overdue" className="rounded-full hover:underline">
                      <Badge tone="danger">{summary.overdue.toLocaleString()} overdue</Badge>
                    </Link>
                  )}
                  <span className="text-xs text-ink-muted" title={`${fmtDay(today)} – ${fmtDay(localDay(addDays(new Date(), 6)))}`}>
                    Next 7 days · {dueSoon.total.toLocaleString()} open
                  </span>
                </div>
                {dueSoon.tasks.length === 0
                  ? <p className="mt-3 text-sm text-ink-muted">No open task is due in the next 7 days.</p>
                  : (
                    <ul className="mt-3 divide-y divide-line">
                      {dueSoon.tasks.map(t => (
                        <li key={t.id} className="py-2">
                          <p className="text-xs font-semibold text-ink">{t.title}</p>
                          <p className="text-xs text-ink-muted">{t.due_date ? fmtDay(t.due_date) : ''}{t.assigned_to ? ` · ${t.assigned_to}` : ''}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                {dueSoon.total > dueSoon.tasks.length && (
                  <Link to="/crm/tasks?bucket=upcoming" className="mt-1 inline-block text-sm text-brand-600 hover:underline">All upcoming tasks</Link>
                )}
              </>
            )}
          </Card>

          <Card padding="none" className="p-3.5">
            <h3 className="text-xl font-semibold leading-7 text-ink-heading">Upcoming Meetings</h3>
            {upcomingError && <p className="mt-2 text-sm text-danger-700" role="alert">{upcomingError}</p>}
            {!upcomingError && upcoming === null && <p className="mt-2 text-sm text-ink-muted">Loading meetings…</p>}
            {upcoming && upcoming.length === 0 && (
              <EmptyState className="mt-3" title="No meetings in the next 7 days"
                reason="Meetings scheduled in the Meetings module appear here and on the calendar." />
            )}
            {upcoming && upcoming.length > 0 && (
              <ul className="mt-3 divide-y divide-line">
                {upcoming.map(m => (
                  <li key={m.id} className="py-2">
                    <Link to={`/crm/meetings/${encodeURIComponent(m.id)}`} className="text-sm font-medium text-ink hover:underline">{m.title}</Link>
                    {m.date && <p className="text-xs text-ink-muted">{fmtDay(localDay(new Date(m.date)))} · {fmtTime(m.date)}</p>}
                  </li>
                ))}
              </ul>
            )}
            <Button variant="secondary" className="mt-3" onClick={() => navigate('/crm/meetings')}>Open Meetings</Button>
          </Card>

          <Card padding="none" className="p-3.5">
            <h3 className="text-xl font-semibold leading-7 text-ink-heading">This Month</h3>
            {meetings === null && !meetingsError && <p className="mt-2 text-sm text-ink-muted">Loading meetings…</p>}
            {meetings && (
              <>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-2xl font-bold text-brand-600" data-testid="month-meetings">{monthMeetings.length}</p>
                    <p className="text-xs text-ink-muted">Actual meetings</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-brand-600" data-testid="month-dated-tasks">{monthDatedTasks === null ? '—' : monthDatedTasks.toLocaleString()}</p>
                    <p className="text-xs text-ink-muted">Dated tasks</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-ink-muted">
                  {meetingsCapped
                    ? `Counted from the first ${meetings.list.length} meetings loaded for these weeks — not every meeting.`
                    : `${MONTHS[month.getMonth()]}, in your time zone. Undated tasks are not counted.`}
                </p>
              </>
            )}
          </Card>

          <Card padding="none" className="p-3.5">
            <h3 className="text-xl font-semibold leading-7 text-ink-heading">{selected ? fmtLongDay(selected) : 'Select a day'}</h3>
            {!selected && <p className="mt-2 text-sm text-ink-muted">Choose a day on the calendar to see everything due then.</p>}
            {selected && (
              <>
                {dayError && <p className="mt-2 text-sm text-danger-700" role="alert">{dayError}</p>}
                {!dayError && dayTasks === null && <p className="mt-2 text-sm text-ink-muted">Loading…</p>}
                {dayTasks && (
                  <>
                    <p className="mt-2 text-xs text-ink-muted" data-testid="selected-summary">
                      {dayTasks.total} {dayTasks.total === 1 ? 'task' : 'tasks'} · {(meetingsByDay.get(selected) ?? []).length} meetings
                    </p>
                    <ul className="mt-2 space-y-2">
                      {dayTasks.tasks.map(t => (
                        <li key={t.id} className="rounded-ctrl bg-brand-100 p-2.5">
                          <p className={`text-sm font-semibold ${t.status === 'completed' ? 'text-ink-muted line-through' : 'text-brand-700'}`}>{t.title}</p>
                          <p className="text-xs text-ink-secondary">{[t.status, t.priority, t.assigned_to].filter(Boolean).join(' · ')}</p>
                        </li>
                      ))}
                    </ul>
                    {dayTasks.total > dayTasks.tasks.length && (
                      <p className="text-xs text-ink-muted">Showing {dayTasks.tasks.length} of {dayTasks.total}.</p>
                    )}
                  </>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button onClick={() => navigate(`/crm/tasks?new=1&due=${selected}`)}>New task</Button>
                  <Button variant="secondary" disabled title="Creating a meeting from the calendar is coming soon">New Meeting · Soon</Button>
                  <Button variant="secondary" disabled title="Blocking time is coming soon">Block Time · Soon</Button>
                </div>
                <p className="mt-2 text-xs text-ink-muted">A new task opens with this day as its due date.</p>
              </>
            )}
          </Card>
        </aside>
      </div>

      {summary && summary.no_date > 0 && (
        <div className="flex items-center gap-2.5 rounded-card bg-warning-100 p-3 text-xs leading-[18px] text-warning-800" data-testid="undated-note">
          <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
          {summary.no_date.toLocaleString()} open {summary.no_date === 1 ? 'task has' : 'tasks have'} no due date. {summary.no_date === 1 ? 'It is' : 'They are'} not assigned to a day and {summary.no_date === 1 ? 'does' : 'do'} not appear in the month grid.
          <Link to="/crm/tasks" className="ml-auto font-semibold underline">Open Tasks</Link>
        </div>
      )}
    </div>
  );
};

export default Calendar;
