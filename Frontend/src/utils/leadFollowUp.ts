/**
 * Lead follow-ups (Group B item 11, v1 approved 2026-10-05): a follow-up is a
 * row in `tasks` — type 'follow-up', linked to the lead, with a DATE due (no
 * time of day, no notification delivery in v1). The lead's "next follow-up" is
 * served by GET /leads (the earliest open one), so it can never disagree with
 * the task list. Writes go through the tasks API, which proves the lead belongs
 * to the caller's workspace. Every function THROWS the server's message.
 */
import { localDay } from './dates';

const API_BASE = 'http://localhost:5001/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function send(path: string, method: string, body: unknown): Promise<{ id: string }> {
  const res = await fetch(`${API_BASE}${path}`, { method, headers: getAuthHeaders(), body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || `The follow-up was not saved (HTTP ${res.status})`);
  return json.data;
}

/** Create a follow-up task due on `dueDate` ('YYYY-MM-DD'). */
export const createLeadFollowUp = (leadId: string, dueDate: string, title: string, assignedTo?: string) =>
  send('/tasks', 'POST', {
    title, type: 'follow-up', status: 'pending', related_to_type: 'lead', related_to_id: String(leadId),
    due_date: dueDate, ...(assignedTo ? { assigned_to: assignedTo } : {}),
  });

export const rescheduleFollowUp = (taskId: string, dueDate: string) => send(`/tasks/${taskId}`, 'PUT', { due_date: dueDate });

export const completeFollowUp = (taskId: string) => send(`/tasks/${taskId}`, 'PUT', { status: 'completed' });

/** Today in the browser's own calendar — the one shared helper, re-exported so callers keep their import. */
export const localToday = localDay;

/** '2026-10-12' -> '12 Oct' without passing through a Date (no time-zone shift). */
export function formatDueDate(due: string): string {
  const [y, m, d] = due.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d} ${months[m - 1]}${y !== new Date().getFullYear() ? ` ${y}` : ''}`;
}

export type FollowUpTone = 'danger' | 'warning' | 'neutral';

/** The badge for a lead's next follow-up, or null when there is none. String comparison on ISO dates is exact. */
export function followUpStatus(due: string | undefined, today = localToday()): { tone: FollowUpTone; label: string } | null {
  if (!due) return null;
  if (due < today) return { tone: 'danger', label: `Follow-up overdue · ${formatDueDate(due)}` };
  if (due === today) return { tone: 'warning', label: 'Follow-up due today' };
  return { tone: 'neutral', label: `Follow-up ${formatDueDate(due)}` };
}
