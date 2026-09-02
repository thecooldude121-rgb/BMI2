/**
 * Workspace users, for assignee pickers.
 *
 * GET /users is workspace-scoped server-side and returns only active users, so
 * there is no client-side filtering to get wrong.
 *
 * NOTE ON THE SHAPE TASKS NEED: `tasks.assigned_to` is a VARCHAR(100) holding a
 * DISPLAY NAME, not a user id — see the open decision in HANDOFF about migrating
 * it to a real owner_id. So a task assignee picker stores `displayName` here,
 * not `id`, and that is deliberate rather than an oversight.
 */

const API_BASE = 'http://localhost:5001/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface WorkspaceUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string | null;
  department: string | null;
  /** "First Last" — what tasks.assigned_to stores. */
  displayName: string;
}

export async function fetchUsers(): Promise<WorkspaceUser[]> {
  const res = await fetch(`${API_BASE}/users`, { headers: getAuthHeaders() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || `GET /users failed (HTTP ${res.status})`);
  return (json.data ?? []).map((u: Omit<WorkspaceUser, 'displayName'>) => ({
    ...u,
    // Must match resolveActorName() in tasksController, which writes
    // `${first_name} ${last_name}`.trim() into assigned_to when a task is
    // created. If these two ever disagree, the "Mine" filter silently matches
    // nothing — the failure is invisible, so keep them identical.
    displayName: `${u.first_name} ${u.last_name}`.trim(),
  }));
}
