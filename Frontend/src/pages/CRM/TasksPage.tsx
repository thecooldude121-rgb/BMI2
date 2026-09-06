import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { CheckSquare, Clock, AlertTriangle, Plus, CalendarDays, Trash2, Pencil } from 'lucide-react';
import {
  fetchTasks,
  setTaskStatus,
  deleteTask,
  type TaskRecord,
  type TaskStatus,
} from '../../utils/activitiesApi';
import { useAuth } from '../../contexts/AuthContext';
import { localDay, dateOnly } from '../../utils/dates';
import TaskFormModal, { type RelatedOption } from '../../components/CRM/TaskFormModal';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { fetchContacts } from '../../utils/contactsApi';
import { fetchAccounts } from '../../utils/accountsApi';
import { fetchDeals } from '../../utils/dealsApi';

/**
 * PHASE 2: this page read `useData()` sample tasks — pure in-memory state — while
 * 15 real rows sat in the tasks table with no API at all. Its "Add Task" button
 * had no onClick, so a task could not be created from anywhere in the product.
 * Both are now real.
 *
 * PHASE-1 ITEM 5 adds the four filter buckets and a real create/edit form.
 * Before this, "Add Task" was a window.prompt that could set only a title —
 * type and priority were hardcoded and there was NO WAY TO SET A DUE DATE, so
 * nothing created in the product could ever appear in Overdue, Today or
 * Upcoming. The form and the filters had to land together for either to mean
 * anything.
 */

/** One fetch, buckets derived from it — see BUCKETS. */
const FETCH_LIMIT = 500; // the server's own cap on /tasks

type BucketId = 'all' | 'mine' | 'overdue' | 'today' | 'upcoming';

/** Shared with the calendar so the two cannot disagree about what day it is. */
function dueDay(t: TaskRecord): string | null {
  return dateOnly(t.due_date);
}

const isOpen = (t: TaskRecord) => t.status !== 'completed';

/**
 * The buckets, each with the predicate AND the sentence its empty state shows.
 *
 * The empty text is part of the definition on purpose. An empty list that does
 * not say why reads as a bug, and one of these buckets is EXPECTED to be empty:
 * all 15 seeded tasks are assigned to "John Smith", who is not one of the five
 * workspace users, so "Mine" legitimately returns nothing for everybody until
 * someone creates or reassigns a task. Saying so is the difference between an
 * honest empty state and a broken-looking page.
 */
const BUCKETS: {
  id: BucketId;
  label: string;
  match: (t: TaskRecord, ctx: { today: string; me: string }) => boolean;
  emptyTitle: string;
  emptyBody: (ctx: { me: string }) => string;
}[] = [
  {
    id: 'all', label: 'All',
    match: () => true,
    emptyTitle: 'No tasks yet',
    emptyBody: () => 'Use “New task” to create the first one.',
  },
  {
    id: 'mine', label: 'Mine',
    // tasks.assigned_to holds a DISPLAY NAME, not a user id (see the open
    // decision in HANDOFF about migrating it to owner_id). Matching on the name
    // is the only join available, and it is why the seeded rows match nobody.
    match: (t, { me }) => !!t.assigned_to && t.assigned_to === me,
    emptyTitle: 'No tasks assigned to you yet',
    emptyBody: ({ me }) =>
      `Nothing in this workspace is assigned to ${me}. Tasks you create are assigned to you by default, ` +
      'and you can reassign an existing one from Edit.',
  },
  {
    id: 'overdue', label: 'Overdue',
    match: (t, { today }) => { const d = dueDay(t); return !!d && d < today && isOpen(t); },
    emptyTitle: 'Nothing overdue',
    emptyBody: () => 'No task with a due date in the past is still open.',
  },
  {
    id: 'today', label: 'Today',
    match: (t, { today }) => dueDay(t) === today && isOpen(t),
    emptyTitle: 'Nothing due today',
    emptyBody: () => 'No open task is due today.',
  },
  {
    id: 'upcoming', label: 'Upcoming',
    match: (t, { today }) => { const d = dueDay(t); return !!d && d > today && isOpen(t); },
    emptyTitle: 'Nothing upcoming',
    emptyBody: () => 'No open task has a due date after today.',
  },
];

const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const me = user?.name ?? '';

  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bucket, setBucket] = useState<BucketId>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TaskRecord | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  /** The task awaiting delete confirmation. */
  const [confirming, setConfirming] = useState<TaskRecord | null>(null);

  /** Records the task form's "Related to" picker can choose from. */
  const [related, setRelated] = useState<Record<'contact' | 'company' | 'deal' | 'lead', RelatedOption[]>>({
    contact: [], company: [], deal: [], lead: [],
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTasks(await fetchTasks({ limit: FETCH_LIMIT }));
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? 'Could not load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Loaded once for the picker. A failure here must not block the page: tasks
  // are still usable without a related record, so the lists stay empty and the
  // form says so rather than the whole page erroring.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [contacts, accounts, deals] = await Promise.all([
        fetchContacts({ limit: 200 }).catch(() => []),
        fetchAccounts(200).catch(() => []),
        fetchDeals(200).catch(() => []),
      ]);
      if (cancelled) return;
      setRelated({
        contact: contacts.map(c => ({ id: c.id, label: c.name || c.email || c.id })),
        company: accounts.map(a => ({ id: a.id, label: a.name || a.id })),
        deal: deals.map((d: any) => ({ id: d.id, label: d.name || d.title || d.id })),
        // Leads are a permitted related type and 8 tasks already use it, but the
        // leads list is not loaded here — see the note by the Lead option.
        lead: [],
      });
    })();
    return () => { cancelled = true; };
  }, []);

  const today = localDay(new Date());
  const ctx = useMemo(() => ({ today, me }), [today, me]);

  const counts = useMemo(() => {
    const out = {} as Record<BucketId, number>;
    for (const b of BUCKETS) out[b.id] = tasks.filter(t => b.match(t, ctx)).length;
    return out;
  }, [tasks, ctx]);

  const active = BUCKETS.find(b => b.id === bucket)!;
  const visible = useMemo(() => tasks.filter(t => active.match(t, ctx)), [tasks, active, ctx]);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    const previous = tasks;
    // Optimistic, then reconcile — and roll back on failure so the list never
    // shows a status the server rejected.
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, status: newStatus as TaskStatus } : t)));
    setBusyId(taskId);
    try {
      const saved = await setTaskStatus(taskId, newStatus as TaskStatus);
      setTasks(prev => prev.map(t => (t.id === taskId ? saved : t)));
    } catch (e: any) {
      setTasks(previous);
      setError(e?.message ?? 'Could not update the task');
    } finally {
      setBusyId(null);
    }
  };

  /**
   * Confirmed via ConfirmationModal rather than window.confirm. A native
   * confirm() is inconsistent with every other destructive action in this app,
   * cannot be styled or made accessible, and blocks the page's event loop —
   * which also makes the delete path impossible to exercise in an automated
   * check, so it would have shipped unverified.
   */
  const handleDelete = async (task: TaskRecord) => {
    const previous = tasks;
    setTasks(prev => prev.filter(t => t.id !== task.id));
    setBusyId(task.id);
    try {
      await deleteTask(task.id);
      setNotice(`Deleted “${task.title}”.`);
      setError(null);
    } catch (e: any) {
      setTasks(previous);
      setError(e?.message ?? 'Could not delete the task');
    } finally {
      setBusyId(null);
    }
  };

  const handleSaved = (saved: TaskRecord, mode: 'created' | 'updated') => {
    setTasks(prev => (mode === 'created' ? [saved, ...prev] : prev.map(t => (t.id === saved.id ? saved : t))));
    setNotice(mode === 'created' ? `Created “${saved.title}”.` : `Updated “${saved.title}”.`);
    setError(null);
  };

  const stat = (id: BucketId) => counts[id] ?? 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {([
          { label: 'Open', icon: Clock, tone: 'text-blue-600', value: tasks.filter(isOpen).length },
          { label: 'Due today', icon: CalendarDays, tone: 'text-yellow-600', value: stat('today') },
          { label: 'Overdue', icon: AlertTriangle, tone: 'text-red-600', value: stat('overdue') },
          { label: 'Completed', icon: CheckSquare, tone: 'text-green-600', value: tasks.filter(t => t.status === 'completed').length },
        ]).map(s => (
          <div key={s.label} className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center">
              <s.icon className={`h-8 w-8 ${s.tone}`} aria-hidden="true" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Tasks</h3>
          <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="rounded-md">
            <Plus className="h-4 w-4" aria-hidden="true" />
            New task
          </Button>
        </div>

        {/* Filter buckets */}
        <div className="flex flex-wrap gap-1 border-b border-gray-200 px-4 py-2" role="tablist" aria-label="Task filters">
          {BUCKETS.map(b => (
            <button
              key={b.id}
              role="tab"
              aria-selected={bucket === b.id}
              onClick={() => setBucket(b.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${
                bucket === b.id ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {b.label}
              <span className={`ml-1.5 tabular-nums ${bucket === b.id ? 'text-brand-600' : 'text-gray-400'}`}>
                {counts[b.id] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {notice && (
          <div className="flex items-center justify-between border-b border-success-200 bg-success-50 px-6 py-2">
            <p className="text-sm text-success-800">{notice}</p>
            <button onClick={() => setNotice(null)} className="text-xs text-success-700 hover:underline">Dismiss</button>
          </div>
        )}
        {error && (
          <div className="border-b border-danger-200 bg-danger-50 px-6 py-3">
            <p className="text-sm text-danger-800">{error}</p>
          </div>
        )}
        {loading && <div className="px-6 py-10 text-center text-sm text-gray-500">Loading tasks…</div>}

        {!loading && !error && visible.length === 0 && (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-medium text-gray-900">{active.emptyTitle}</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-gray-600">{active.emptyBody({ me })}</p>
          </div>
        )}

        <div className="overflow-x-auto" hidden={loading || visible.length === 0}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Task', 'Type', 'Priority', 'Status', 'Assigned To', 'Due Date', 'Actions'].map(h => (
                  <th key={h} scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {visible.map(task => {
                const d = dueDay(task);
                const overdue = !!d && d < today && isOpen(task);
                return (
                  <tr key={task.id} className={`hover:bg-gray-50 ${overdue ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{task.title}</div>
                      {task.description && <div className="text-sm text-gray-500">{task.description}</div>}
                      {task.related_to_type && task.related_to_id && (
                        <div className="mt-0.5 text-xs text-gray-400">
                          {task.related_to_type} · {task.related_to_id}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm capitalize text-gray-900">{task.type ?? '—'}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        task.priority === 'high' ? 'bg-red-100 text-red-800'
                          : task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'}`}>
                        {task.priority ?? '—'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <select
                        value={task.status ?? 'pending'}
                        aria-label={`Status of ${task.title}`}
                        onChange={e => { void handleStatusChange(task.id, e.target.value); }}
                        disabled={busyId === task.id}
                        className={`rounded-full border-0 px-2 py-1 text-xs font-medium focus:ring-2 focus:ring-brand-600 ${
                          task.status === 'completed' ? 'bg-green-100 text-green-800'
                            : task.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                    {/* assigned_to holds a display name already, not a user id. */}
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{task.assigned_to || 'Unassigned'}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className={`text-sm ${overdue ? 'font-medium text-red-600' : 'text-gray-900'}`}>
                        {d ? new Date(`${d}T00:00:00`).toLocaleDateString() : 'No due date'}
                        {overdue && <div className="text-xs text-red-500">Overdue</div>}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <button
                        onClick={() => { setEditing(task); setFormOpen(true); }}
                        className="mr-3 inline-flex items-center gap-1 text-brand-600 hover:underline"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                      </button>
                      <button
                        onClick={() => setConfirming(task)}
                        disabled={busyId === task.id}
                        className="inline-flex items-center gap-1 text-danger-600 hover:underline disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirming !== null}
        type="danger"
        title="Delete task"
        message={confirming ? `Delete “${confirming.title}”? This cannot be undone.` : ''}
        confirmLabel="Delete"
        onCancel={() => setConfirming(null)}
        onConfirm={() => { const t = confirming; setConfirming(null); if (t) void handleDelete(t); }}
      />

      <TaskFormModal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        task={editing}
        relatedRecords={related}
        onSaved={handleSaved}
      />
    </div>
  );
};

export default TasksPage;
