import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  createTask, updateTask,
  TASK_TYPES, TASK_STATUSES, TASK_PRIORITIES,
  type TaskRecord,
} from '../../utils/activitiesApi';
import { fetchUsers, type WorkspaceUser } from '../../utils/usersApi';

/**
 * Create or edit a task.
 *
 * REPLACES `window.prompt('Task title')`. That prompt could set exactly one
 * field: it hardcoded type 'follow-up' and priority 'medium' and had no way to
 * set a due date at all — so no task created in the product could ever land in
 * the Overdue, Today or Upcoming buckets. The filters were unbuildable until
 * this existed, which is why it is part of the same change.
 *
 * Every vocabulary below is imported from activitiesApi, which mirrors the live
 * CHECK constraints on `tasks`. Do not add an option here without adding it
 * there and in a migration first — the constraint is the authority and a value
 * this form invents is a 400 the user cannot act on.
 */

/**
 * What a task may be related to, as offered in this form.
 *
 * 'employee' is a permitted value in the CHECK and is deliberately NOT offered.
 * The `employees` table has no tenant_id, so tasksController cannot verify that
 * a related employee belongs to the caller's workspace — it is the one
 * related_to_type left unvalidated, on the standing condition that nothing joins
 * that table. Offering it in the UI would invite exactly the reference that
 * makes it a cross-workspace read.
 */
const RELATED_OPTIONS = [
  { value: '', label: 'Not related to a record' },
  { value: 'contact', label: 'Contact' },
  { value: 'company', label: 'Account' },
  { value: 'deal', label: 'Deal' },
  { value: 'lead', label: 'Lead' },
] as const;

type RelatedType = 'contact' | 'company' | 'deal' | 'lead';

/** One selectable record for the related-to picker. */
export interface RelatedOption {
  id: string;
  label: string;
}

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Absent = create. Present = edit that task. */
  task?: TaskRecord | null;
  /** Records the related-to picker can choose from, by type. */
  relatedRecords: Record<RelatedType, RelatedOption[]>;
  onSaved: (task: TaskRecord, mode: 'created' | 'updated') => void;
}

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600';

const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen, onClose, task, relatedRecords, onSaved,
}) => {
  const editing = Boolean(task);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<string>('follow-up');
  const [priority, setPriority] = useState<string>('medium');
  const [status, setStatus] = useState<string>('pending');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [relatedType, setRelatedType] = useState<string>('');
  const [relatedId, setRelatedId] = useState('');

  const [users, setUsers] = useState<WorkspaceUser[]>([]);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset from the task being edited every time the modal opens, so a previous
  // edit's values cannot leak into the next one.
  useEffect(() => {
    if (!isOpen) return;
    setTitle(task?.title ?? '');
    setDescription(task?.description ?? '');
    setType(task?.type ?? 'follow-up');
    setPriority(task?.priority ?? 'medium');
    setStatus(task?.status ?? 'pending');
    // due_date is a DATE column; the API returns it as an ISO timestamp, and
    // <input type="date"> wants exactly YYYY-MM-DD.
    setDueDate(task?.due_date ? String(task.due_date).slice(0, 10) : '');
    setAssignedTo(task?.assigned_to ?? '');
    setRelatedType(task?.related_to_type ?? '');
    setRelatedId(task?.related_to_id ?? '');
    setError(null);
  }, [isOpen, task]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    fetchUsers()
      .then(rows => { if (!cancelled) { setUsers(rows); setUsersError(null); } })
      .catch(e => { if (!cancelled) setUsersError(e?.message ?? 'Could not load users'); });
    return () => { cancelled = true; };
  }, [isOpen]);

  const optionsForType = useMemo(
    () => (relatedType ? relatedRecords[relatedType as RelatedType] ?? [] : []),
    [relatedType, relatedRecords],
  );

  /**
   * The task's existing assignee may not be one of the workspace users — the 15
   * seeded rows are all assigned to "John Smith", who is not a user. Keeping the
   * stored value as an option means editing such a task does not silently
   * reassign it just because the name is unrecognised.
   */
  const assigneeOptions = useMemo(() => {
    const names = users.map(u => u.displayName);
    return assignedTo && !names.includes(assignedTo) ? [assignedTo, ...names] : names;
  }, [users, assignedTo]);

  const handleRelatedTypeChange = (next: string) => {
    setRelatedType(next);
    // The id belongs to the old type; keeping it would post a mismatched pair.
    setRelatedId('');
  };

  const submit = async () => {
    if (!title.trim()) { setError('A title is required.'); return; }
    // The server rejects a half-supplied pair with a 400; catching it here says
    // so next to the field instead.
    if (relatedType && !relatedId) {
      setError('Choose which record this task relates to, or set it to “Not related to a record”.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        type: type as typeof TASK_TYPES[number],
        priority: priority as typeof TASK_PRIORITIES[number],
        status: status as typeof TASK_STATUSES[number],
        due_date: dueDate || undefined,
        assigned_to: assignedTo || undefined,
        related_to_type: (relatedType || undefined) as RelatedType | undefined,
        related_to_id: relatedId || undefined,
      };

      if (editing && task) {
        // Explicit nulls on update: an emptied field must CLEAR the stored
        // value, and omitting the key would leave the old one in place.
        const saved = await updateTask(task.id, {
          ...payload,
          description: description.trim() || null,
          due_date: dueDate || null,
          assigned_to: assignedTo || null,
          related_to_type: (relatedType || null) as TaskRecord['related_to_type'],
          related_to_id: relatedId || null,
        } as Partial<TaskRecord>);
        onSaved(saved, 'updated');
      } else {
        onSaved(await createTask(payload), 'created');
      }
      onClose();
    } catch (e: any) {
      setError(e?.message ?? 'The task could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? 'Edit task' : 'New task'}
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={() => { void submit(); }} loading={saving}>
            {editing ? 'Save changes' : 'Create task'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2">
            <p className="text-sm text-danger-800">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="task-title" className="mb-1 block text-sm font-medium text-gray-700">
            Title <span className="text-danger-600">*</span>
          </label>
          <input id="task-title" className={inputClass} value={title} autoFocus
            onChange={e => setTitle(e.target.value)} placeholder="Follow up on the proposal" />
        </div>

        <div>
          <label htmlFor="task-desc" className="mb-1 block text-sm font-medium text-gray-700">Description</label>
          <textarea id="task-desc" rows={3} className={inputClass} value={description}
            onChange={e => setDescription(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="task-type" className="mb-1 block text-sm font-medium text-gray-700">Type</label>
            <select id="task-type" className={inputClass} value={type} onChange={e => setType(e.target.value)}>
              {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="task-priority" className="mb-1 block text-sm font-medium text-gray-700">Priority</label>
            <select id="task-priority" className={inputClass} value={priority} onChange={e => setPriority(e.target.value)}>
              {TASK_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="task-status" className="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <select id="task-status" className={inputClass} value={status} onChange={e => setStatus(e.target.value)}>
              {TASK_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="task-due" className="mb-1 block text-sm font-medium text-gray-700">Due date</label>
            <input id="task-due" type="date" className={inputClass} value={dueDate}
              onChange={e => setDueDate(e.target.value)} />
          </div>
        </div>

        <div>
          <label htmlFor="task-assignee" className="mb-1 block text-sm font-medium text-gray-700">Assigned to</label>
          <select id="task-assignee" className={inputClass} value={assignedTo}
            onChange={e => setAssignedTo(e.target.value)}>
            <option value="">Unassigned</option>
            {assigneeOptions.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          {usersError && <p className="mt-1 text-xs text-danger-700">{usersError}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="task-related-type" className="mb-1 block text-sm font-medium text-gray-700">Related to</label>
            <select id="task-related-type" className={inputClass} value={relatedType}
              onChange={e => handleRelatedTypeChange(e.target.value)}>
              {RELATED_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div hidden={!relatedType}>
            <label htmlFor="task-related-id" className="mb-1 block text-sm font-medium text-gray-700">Record</label>
            <select id="task-related-id" className={inputClass} value={relatedId}
              onChange={e => setRelatedId(e.target.value)}>
              <option value="">Choose…</option>
              {/* An id stored on the task whose record is not in the loaded list
                  is still shown, so editing cannot silently drop the link. */}
              {relatedId && !optionsForType.some(o => o.id === relatedId) && (
                <option value={relatedId}>{relatedId} (not in the loaded list)</option>
              )}
              {optionsForType.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TaskFormModal;
