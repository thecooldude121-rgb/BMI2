import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, Search, LayoutDashboard, UserPlus, Briefcase, Building2, Users, ListChecks } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { EmptyState } from '../../components/ui/EmptyState';
import { Card, SectionHeading } from '../../components/ui/Card';
import { selectClass, inputClass } from '../../components/ui/Field';
import PageHeader from '../../components/Layout/PageHeader';
import LeadsPager from '../../components/Leads/LeadsPager';
import {
  fetchTasksPage,
  fetchTaskSummary,
  setTaskStatus,
  deleteTask,
  TASK_TYPES,
  TASK_PRIORITIES,
  type TaskRecord,
  type TaskStatus,
  type TaskBucket,
  type TaskSummary,
  type TaskFilters,
} from '../../utils/activitiesApi';
import { useAuth } from '../../contexts/AuthContext';
import { localDay, parseLocalDay } from '../../utils/dates';
import TaskFormModal, { type RelatedOption } from '../../components/CRM/TaskFormModal';
import { fetchContacts } from '../../utils/contactsApi';
import { fetchAccounts } from '../../utils/accountsApi';
import { fetchDeals } from '../../utils/dealsApi';

/**
 * Tasks — Group A item 4, slice 4a (2026-10-11).
 *
 * This page used to load 500 tasks ONCE and derive every tab, every tile and
 * every row from them, so task #501 existed nowhere in the product and every
 * count was a count of whatever happened to load. Now:
 *   - the list is ONE server page (25) of the selected tab (?bucket=), under
 *     the search / priority / type / related-record filters;
 *   - every tab and tile number is GET /tasks/summary under the SAME filters,
 *     so the count on a tab is exactly the total its list answers with;
 *   - "today" is the VIEWER'S local calendar day, sent to the server
 *     (decided 2026-10-11) — the row highlighting, the tabs and the tiles all
 *     use that one value, so they cannot disagree about what is overdue.
 *
 * Writes are not optimistic: a status change shows "Saving…", then "Saved"
 * only after the server's 2xx, then the page and counts reload (the task may
 * have left the tab it was in). A refusal stays on the row.
 */

const PAGE_SIZE = 25;

/** The tabs, each with the sentence its empty state shows. */
const TABS: { id: TaskBucket; label: string; emptyTitle: string; emptyBody: (me: string) => string }[] = [
  { id: 'all', label: 'All', emptyTitle: 'No tasks yet', emptyBody: () => 'Use “New task” to create the first one.' },
  {
    id: 'mine', label: 'Mine', emptyTitle: 'No tasks assigned to you yet',
    // tasks.assigned_to still holds a DISPLAY NAME (the owner-FK migration is
    // Group A item 8), so "Mine" is the server matching your name.
    emptyBody: me => `Nothing here is assigned to ${me || 'you'}. Tasks you create are assigned to you by default, and you can reassign one from Edit.`,
  },
  { id: 'overdue', label: 'Overdue', emptyTitle: 'Nothing overdue', emptyBody: () => 'No open task has a due date before today.' },
  { id: 'today', label: 'Today', emptyTitle: 'Nothing due today', emptyBody: () => 'No open task is due today.' },
  { id: 'upcoming', label: 'Upcoming', emptyTitle: 'Nothing upcoming', emptyBody: () => 'No open task has a due date after today.' },
];

/** The related-record filter. 'none' = tasks linked to no record. */
const RELATED: { id: string; label: string; Icon: LucideIcon }[] = [
  { id: '', label: 'All records', Icon: LayoutDashboard },
  { id: 'lead', label: 'Leads', Icon: UserPlus },
  { id: 'deal', label: 'Deals', Icon: Briefcase },
  { id: 'company', label: 'Accounts', Icon: Building2 },
  { id: 'contact', label: 'Contacts', Icon: Users },
  { id: 'none', label: 'Not linked', Icon: ListChecks },
];

/** Sort choice -> the server's allowlisted sort. '' = the server's default order. */
const SORTS: { id: string; label: string; sort?: string; dir?: 'asc' | 'desc' }[] = [
  { id: '', label: 'Sort: Open first, soonest due' },
  { id: 'due', label: 'Sort: Due date', sort: 'due_date', dir: 'asc' },
  { id: 'priority', label: 'Sort: Priority', sort: 'priority', dir: 'desc' },
  { id: 'newest', label: 'Sort: Newest', sort: 'created_at', dir: 'desc' },
  { id: 'title', label: 'Sort: Title', sort: 'title', dir: 'asc' },
];

const RELATED_LABEL: Record<string, string> = { lead: 'Lead', deal: 'Deal', company: 'Account', contact: 'Contact', employee: 'Employee' };

type RowState = { state: 'saving' } | { state: 'saved' } | { state: 'error'; message: string };

const fmtDay = (d: string) => parseLocalDay(d)?.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) ?? d;

const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const me = user?.name ?? '';

  const [searchParams, setSearchParams] = useSearchParams();
  // `?bucket=overdue` (the calendar's overdue link) opens on that tab.
  const [bucket, setBucket] = useState<TaskBucket>(() => {
    const b = searchParams.get('bucket');
    return TABS.some(t => t.id === b) ? (b as TaskBucket) : 'all';
  });
  const [related, setRelated] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('');
  const [type, setType] = useState('');
  const [sortId, setSortId] = useState('');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [summary, setSummary] = useState<TaskSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  /** The viewer's day the current page and counts were computed for. */
  const [asOf, setAsOf] = useState(() => localDay(new Date()));

  const [rowState, setRowState] = useState<Record<string, RowState>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<TaskRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TaskRecord | null>(null);
  const [defaultDue, setDefaultDue] = useState<string | undefined>(undefined);

  /** Records the task form's "Related to" picker can choose from. */
  const [relatedRecords, setRelatedRecords] = useState<Record<'contact' | 'company' | 'deal' | 'lead', RelatedOption[]>>({
    contact: [], company: [], deal: [], lead: [],
  });

  /**
   * `?new=1` opens the create form — the global "+ New → New Task" item and the
   * calendar's "New task" on a selected day (`&due=YYYY-MM-DD` pre-fills the
   * date). Stripped once consumed, with `replace`, so Back and refresh do not
   * reopen a form the user dismissed.
   */
  useEffect(() => {
    if (searchParams.get('new') === null) return;
    const due = searchParams.get('due');
    setEditing(null);
    setDefaultDue(due && /^\d{4}-\d{2}-\d{2}$/.test(due) ? due : undefined);
    setFormOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete('new');
    next.delete('due');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const filters = useMemo<TaskFilters>(() => ({
    search: search || undefined, priority: priority || undefined, type: type || undefined,
    related_to_type: related || undefined,
  }), [search, priority, type, related]);

  // A narrower query starts again at page 1.
  useEffect(() => { setPage(1); }, [filters, bucket, sortId]);

  const reload = useCallback(() => setReloadKey(k => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    const today = localDay(new Date());
    const s = SORTS.find(x => x.id === sortId);
    setLoading(true);
    fetchTasksPage({
      ...filters, bucket, today, sort: s?.sort, dir: s?.dir,
      limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE,
    })
      .then(r => {
        if (cancelled) return;
        // A write emptied the last page: step back rather than show nothing.
        if (r.tasks.length === 0 && r.total > 0 && page > 1) { setPage(Math.ceil(r.total / PAGE_SIZE)); return; }
        setTasks(r.tasks); setTotal(r.total); setLoadError(null); setAsOf(today);
      })
      .catch(e => { if (!cancelled) setLoadError(e?.message ?? 'Could not load tasks'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    fetchTaskSummary(today, filters)
      .then(r => { if (!cancelled) { setSummary(r); setSummaryError(null); } })
      .catch(e => { if (!cancelled) setSummaryError(e?.message ?? 'Could not load the task counts'); });
    return () => { cancelled = true; };
  }, [filters, bucket, sortId, page, reloadKey]);

  // Loaded once for the form's picker. A failure must not block the page: a
  // task is still usable without a related record. (Server-side search for
  // these pickers is slice 6.)
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [contacts, accounts, deals] = await Promise.all([
        fetchContacts({ limit: 200 }).catch(() => []),
        fetchAccounts(200).catch(() => []),
        fetchDeals(200).catch(() => []),
      ]);
      if (cancelled) return;
      setRelatedRecords({
        contact: contacts.map(c => ({ id: c.id, label: c.name || c.email || c.id })),
        company: accounts.map(a => ({ id: a.id, label: a.name || a.id })),
        deal: deals.map((d: any) => ({ id: d.id, label: d.name || d.title || d.id })),
        lead: [],
      });
    })();
    return () => { cancelled = true; };
  }, []);

  const handleStatusChange = async (task: TaskRecord, next: TaskStatus) => {
    setRowState(s => ({ ...s, [task.id]: { state: 'saving' } }));
    setNotice(null);
    try {
      const saved = await setTaskStatus(task.id, next);
      setTasks(prev => prev.map(t => (t.id === task.id ? saved : t)));
      setRowState(s => ({ ...s, [task.id]: { state: 'saved' } }));
      reload();
    } catch (e: any) {
      setRowState(s => ({ ...s, [task.id]: { state: 'error', message: e?.message ?? 'Not saved' } }));
    }
  };

  const confirmDelete = async () => {
    const task = confirming;
    if (!task) return;
    setDeleting(true);
    try {
      await deleteTask(task.id);
      setConfirming(null);
      setNotice(`Deleted “${task.title}”.`);
      setActionError(null);
      reload();
    } catch (e: any) {
      setActionError(`“${task.title}” was not deleted — ${e?.message ?? 'the server refused'}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleSaved = (saved: TaskRecord, mode: 'created' | 'updated') => {
    setNotice(mode === 'created' ? `Created “${saved.title}”.` : `Updated “${saved.title}”.`);
    setActionError(null);
    reload();
  };

  const filtered = !!(search || priority || type || related);
  const clearFilters = () => { setSearchInput(''); setSearch(''); setPriority(''); setType(''); setRelated(''); };
  const count = (b: TaskBucket) => (summary ? summary[b].toLocaleString() : '—');
  const activeTab = TABS.find(t => t.id === bucket)!;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const kpis: { label: string; bucket: TaskBucket; detail: string }[] = [
    { label: 'Open', bucket: 'open', detail: summary ? `${summary.no_date.toLocaleString()} without a due date` : '' },
    { label: 'Due today', bucket: 'today', detail: `Open tasks due ${fmtDay(asOf)}` },
    { label: 'Overdue', bucket: 'overdue', detail: 'Open tasks due before today' },
    { label: 'Completed', bucket: 'completed', detail: 'All time' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Engage"
        title="Tasks"
        description="Follow-ups, calls and to-dos across your leads, deals, accounts and contacts."
        actions={
          <Button onClick={() => { setEditing(null); setDefaultDue(undefined); setFormOpen(true); }}>
            <Plus className="h-4 w-4" aria-hidden="true" /> New task
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4" data-testid="task-kpis">
        {kpis.map(k => (
          <Card key={k.label} padding="none" className="p-3.5">
            <p className="text-xs leading-[18px] text-ink-muted">{k.label}</p>
            <p className="mt-1 text-2xl font-bold leading-8 text-ink" data-testid={`kpi-${k.bucket}`}>{count(k.bucket)}</p>
            <p className="mt-1 text-xs leading-[18px] text-ink-muted">{k.detail}</p>
          </Card>
        ))}
      </div>
      {summaryError && (
        <Alert tone="danger" title="The task counts could not load">{summaryError}</Alert>
      )}

      <Card padding="none" className="space-y-3 p-4">
        <SectionHeading
          title="Tasks"
          description={`Overdue, today and upcoming follow your calendar day (${fmtDay(asOf)}).`}
          actions={<Button variant="secondary" disabled={!filtered} onClick={clearFilters}>Clear filters</Button>}
        />

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Related record">
          {RELATED.map(r => (
            <Button
              key={r.id || 'all'}
              variant={related === r.id ? 'primary' : 'secondary'}
              aria-pressed={related === r.id}
              onClick={() => setRelated(r.id)}
              className="h-8"
            >
              <r.Icon className="h-3.5 w-3.5" aria-hidden="true" /> {r.label}
            </Button>
          ))}
          <div className="ml-auto inline-flex rounded-ctrl border border-line p-0.5 text-xs" role="group" aria-label="View">
            <button type="button" aria-pressed="true" className="rounded px-2 py-1 font-semibold bg-brand-50 text-brand-700">List</button>
            <button type="button" disabled title="Kanban view is coming soon" className="cursor-not-allowed rounded px-2 py-1 text-ink-secondary">
              Kanban · Soon
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <label className="relative min-w-[220px] flex-1">
            <span className="sr-only">Search tasks</span>
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-ink-muted" aria-hidden="true" />
            <input
              className={`${inputClass()} pl-8`} placeholder="Search task titles…"
              value={searchInput} onChange={e => setSearchInput(e.target.value)}
            />
          </label>
          <div className="w-40"><select aria-label="Priority" className={selectClass()} value={priority} onChange={e => setPriority(e.target.value)}>
            <option value="">Any priority</option>
            {TASK_PRIORITIES.map(p => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}
          </select></div>
          <div className="w-40"><select aria-label="Type" className={selectClass()} value={type} onChange={e => setType(e.target.value)}>
            <option value="">Any type</option>
            {TASK_TYPES.map(t => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}
          </select></div>
          <div className="w-64"><select aria-label="Sort" className={selectClass()} value={sortId} onChange={e => setSortId(e.target.value)}>
            {SORTS.map(s => <option key={s.id || 'default'} value={s.id}>{s.label}</option>)}
          </select></div>
        </div>

        <div className="flex flex-wrap gap-1 border-b border-line" role="tablist" aria-label="Task filters">
          {TABS.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={bucket === t.id}
              onClick={() => setBucket(t.id)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${
                bucket === t.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              {t.label}
              <span className="ml-1.5 tabular-nums" data-testid={`tab-count-${t.id}`}>{count(t.id)}</span>
            </button>
          ))}
        </div>

        {notice && (
          <Alert tone="success" title={notice} action={<Button variant="link" onClick={() => setNotice(null)}>Dismiss</Button>} />
        )}
        {actionError && <Alert tone="danger" title={actionError} />}

        {confirming && (
          <div className="flex flex-wrap items-center gap-3 rounded-card border border-danger-200 bg-danger-50 p-3" role="alertdialog" aria-label="Delete task">
            <Trash2 className="h-5 w-5 text-danger-700" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">Delete “{confirming.title}”?</p>
              <p className="text-xs text-ink-muted">This cannot be undone.</p>
            </div>
            <Button variant="secondary" onClick={() => setConfirming(null)} disabled={deleting}>Cancel</Button>
            <Button variant="danger" onClick={() => void confirmDelete()} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete task'}
            </Button>
          </div>
        )}

        {loadError && (
          <EmptyState tone="error" title="The tasks could not load" reason={loadError}
            action={<Button variant="secondary" onClick={reload}>Try again</Button>} />
        )}
        {!loadError && loading && tasks.length === 0 && <p className="py-8 text-center text-sm text-ink-muted">Loading tasks…</p>}
        {!loadError && !loading && total === 0 && (
          <EmptyState
            title={filtered ? 'No tasks match these filters' : activeTab?.emptyTitle ?? 'No tasks'}
            reason={filtered ? 'Clear the filters to see every task in this tab.' : activeTab?.emptyBody(me) ?? ''}
          />
        )}

        {!loadError && total > 0 && (
          <div className="overflow-x-auto" aria-busy={loading}>
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs font-semibold text-ink-muted">
                  {['Task', 'Type', 'Priority', 'Status', 'Assigned to', 'Due date', 'Actions'].map(h => (
                    <th key={h} scope="col" className="px-2 py-2.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => {
                  const due = task.due_date;
                  const open = task.status !== 'completed';
                  const overdue = !!due && due < asOf && open;
                  const rs = rowState[task.id];
                  return (
                    <tr key={task.id} className="border-b border-line align-top last:border-0">
                      <td className="px-2 py-3">
                        <p className="font-semibold text-ink">{task.title}</p>
                        {task.description && <p className="text-xs text-ink-muted">{task.description}</p>}
                        {task.related_to_type && task.related_to_id && (
                          <p className="mt-0.5 text-xs text-ink-muted">
                            {RELATED_LABEL[task.related_to_type] ?? task.related_to_type} · {task.related_to_id}
                          </p>
                        )}
                      </td>
                      <td className="px-2 py-3 capitalize text-ink">{task.type ?? '—'}</td>
                      <td className="px-2 py-3">
                        {task.priority
                          ? <Badge tone={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'neutral'}>{task.priority}</Badge>
                          : '—'}
                      </td>
                      <td className="px-2 py-3">
                        <select
                          value={task.status ?? 'pending'}
                          aria-label={`Status of ${task.title}`}
                          onChange={e => { void handleStatusChange(task, e.target.value as TaskStatus); }}
                          disabled={rs?.state === 'saving'}
                          className={`${selectClass()} h-8 w-[116px] py-1 text-xs`}
                        >
                          <option value="pending">Pending</option>
                          <option value="in-progress">In progress</option>
                          <option value="completed">Completed</option>
                        </select>
                        {rs && (
                          <p className={`mt-1 w-[116px] text-xs ${rs.state === 'error' ? 'text-danger-700' : 'text-ink-muted'}`}
                             role={rs.state === 'error' ? 'alert' : 'status'}>
                            {rs.state === 'saving' ? 'Saving…' : rs.state === 'saved' ? 'Saved' : `Not saved — ${rs.message}`}
                          </p>
                        )}
                      </td>
                      <td className="px-2 py-3 text-ink">{task.assigned_to || 'Unassigned'}</td>
                      <td className="px-2 py-3">
                        <span className={overdue ? 'font-semibold text-danger-700' : 'text-ink'}>{due ? fmtDay(due) : 'No due date'}</span>
                        {overdue && <p className="text-xs text-danger-700">Overdue</p>}
                      </td>
                      <td className="whitespace-nowrap px-2 py-3">
                        <button
                          onClick={() => { setEditing(task); setFormOpen(true); }}
                          className="mr-3 inline-flex items-center gap-1 text-brand-600 hover:underline"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                        </button>
                        <button
                          onClick={() => { setConfirming(task); setActionError(null); }}
                          className="inline-flex items-center gap-1 text-danger-700 hover:underline"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <LeadsPager
              page={page} pageCount={pageCount} total={total} pageSize={PAGE_SIZE}
              shown={tasks.length} loading={loading} onPage={setPage} noun="tasks"
            />
          </div>
        )}
      </Card>

      <TaskFormModal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); setDefaultDue(undefined); }}
        task={editing}
        defaultDueDate={defaultDue}
        relatedRecords={relatedRecords}
        onSaved={handleSaved}
      />
    </div>
  );
};

export default TasksPage;
