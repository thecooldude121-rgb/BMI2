/**
 * Activities and Tasks API clients.
 *
 * Both tables existed with no controller until Phase 2. `tasks` even held 15
 * real rows that no screen could reach — TasksPage rendered sample data and its
 * "Add Task" button had no handler at all.
 *
 * Vocabularies below are copied from the live CHECK constraints. Note that
 * activities and tasks do NOT share them: tasks use 'pending' / 'in-progress'
 * and have no 'urgent' priority. Do not unify them without a migration.
 */

const API_BASE = 'http://localhost:5001/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: getAuthHeaders(), ...init });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Always throw. Returning [] on failure is what let the broken lead
    // endpoints look like empty lists for months.
    throw new Error(json.message || `${init?.method ?? 'GET'} ${path} failed (HTTP ${res.status})`);
  }
  return json as T;
}

// ── Activities ───────────────────────────────────────────────────────────────

export const ACTIVITY_TYPES = [
  'call', 'email', 'meeting', 'task', 'note', 'sms', 'whatsapp',
  'linkedin', 'demo', 'proposal', 'document', 'visit',
] as const;
export type ActivityType = typeof ACTIVITY_TYPES[number];

export const ACTIVITY_STATUSES = ['planned', 'completed', 'cancelled', 'no_show', 'rescheduled'] as const;
export type ActivityStatus = typeof ACTIVITY_STATUSES[number];

export interface ActivityRecord {
  id: string;
  subject: string;
  type: ActivityType | null;
  direction: 'inbound' | 'outbound' | null;
  status: ActivityStatus | null;
  priority: 'low' | 'medium' | 'high' | 'urgent' | null;
  description: string | null;
  outcome: string | null;
  duration: number | null;
  scheduled_at: string | null;
  completed_at: string | null;
  created_by: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string | null;
  // Exactly one of these is set.
  lead_id: number | null;
  deal_id: string | null;
  contact_id: string | null;
  company_id: string | null;
  // Resolved by the server's joins, so a timeline needs no extra requests.
  lead_name?: string | null;
  deal_name?: string | null;
  contact_name?: string | null;
  company_name?: string | null;
}

/** The record an activity hangs off. Exactly one, enforced server-side. */
export type ActivityParent =
  | { deal_id: string }
  | { contact_id: string }
  | { company_id: string }
  | { lead_id: number };

export interface ActivityQuery extends Partial<Record<'deal_id' | 'contact_id' | 'company_id', string>> {
  lead_id?: number;
  type?: ActivityType;
  status?: ActivityStatus;
  assigned_to?: string;
  /** Future, still-planned activities, soonest first. */
  upcoming?: boolean;
  limit?: number;
}

export async function fetchActivities(q: ActivityQuery = {}): Promise<ActivityRecord[]> {
  const params = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  });
  const json = await request<{ data: ActivityRecord[] }>(`/activities?${params}`);
  return json.data ?? [];
}

export async function createActivity(
  parent: ActivityParent,
  activity: {
    subject: string;
    type?: ActivityType;
    direction?: 'inbound' | 'outbound';
    status?: ActivityStatus;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    description?: string;
    outcome?: string;
    duration?: number;
    scheduled_at?: string;
    completed_at?: string;
    assigned_to?: string;
  },
): Promise<ActivityRecord> {
  const json = await request<{ data: ActivityRecord }>('/activities', {
    method: 'POST',
    body: JSON.stringify({ ...parent, ...activity }),
  });
  return json.data;
}

export async function updateActivity(id: string, updates: Partial<ActivityRecord>): Promise<ActivityRecord> {
  const json = await request<{ data: ActivityRecord }>(`/activities/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  return json.data;
}

export async function deleteActivity(id: string): Promise<void> {
  await request(`/activities/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ── Tasks ────────────────────────────────────────────────────────────────────

export const TASK_TYPES = ['call', 'email', 'meeting', 'follow-up', 'other'] as const;
export const TASK_STATUSES = ['pending', 'in-progress', 'completed'] as const;
export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;
export const TASK_RELATED_TYPES = ['lead', 'deal', 'employee'] as const;

export type TaskStatus = typeof TASK_STATUSES[number];

export interface TaskRecord {
  id: string;
  title: string;
  description: string | null;
  type: typeof TASK_TYPES[number] | null;
  priority: typeof TASK_PRIORITIES[number] | null;
  status: TaskStatus | null;
  assigned_to: string | null;
  related_to_type: typeof TASK_RELATED_TYPES[number] | null;
  related_to_id: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface TaskQuery {
  status?: TaskStatus;
  priority?: string;
  type?: string;
  assigned_to?: string;
  related_to_type?: string;
  related_to_id?: string;
  /** Past due and not completed. */
  overdue?: boolean;
  due_before?: string;
  limit?: number;
}

export async function fetchTasks(q: TaskQuery = {}): Promise<TaskRecord[]> {
  const params = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  });
  const json = await request<{ data: TaskRecord[] }>(`/tasks?${params}`);
  return json.data ?? [];
}

export async function createTask(task: {
  title: string;
  description?: string;
  type?: typeof TASK_TYPES[number];
  priority?: typeof TASK_PRIORITIES[number];
  status?: TaskStatus;
  assigned_to?: string;
  /** Supply both or neither — the server rejects a half-pair. */
  related_to_type?: typeof TASK_RELATED_TYPES[number];
  related_to_id?: string;
  due_date?: string;
}): Promise<TaskRecord> {
  const json = await request<{ data: TaskRecord }>('/tasks', {
    method: 'POST',
    body: JSON.stringify(task),
  });
  return json.data;
}

export async function updateTask(id: string, updates: Partial<TaskRecord>): Promise<TaskRecord> {
  const json = await request<{ data: TaskRecord }>(`/tasks/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  return json.data;
}

/** Completing stamps completed_at server-side; reopening clears it. */
export async function setTaskStatus(id: string, status: TaskStatus): Promise<TaskRecord> {
  return updateTask(id, { status });
}

export async function deleteTask(id: string): Promise<void> {
  await request(`/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
