/**
 * Meetings API client — Meeting Agent, migration 049.
 *
 *   GET    /meetings?related_to_type=&related_to_id=   list, optionally by record
 *   GET    /meetings/:id                              meeting + its tasks + activities
 *   POST   /meetings                                  create
 *   PATCH  /meetings/:id                              edit (NOT the relation)
 *   PUT    /meetings/:id/relation                     the "push to deal / account" action
 *   POST   /meetings/:id/activities                   turn a chosen line into a real activity
 *
 * THE VOCABULARIES HERE ARE MIRRORS OF DEPLOYED CHECK CONSTRAINTS, and that is
 * a known weakness: the project's rule is that a rule the server enforces
 * should be SERVED, not copied (see `assignable_roles`, whose client-side mirror
 * had already drifted before anyone noticed). These two lists are small, are
 * pinned by the round-trip tests, and are copied only so a form can render a
 * picker before the first request. If a third consumer appears, serve them.
 *
 * `MEETING_TYPES` was verified against `meetings_type_check` in Postgres, not
 * assumed — the first draft of the controller invented a different list and
 * every create returned a masked 500.
 */

const API_BASE = 'http://localhost:5001/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export class MeetingsApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'MeetingsApiError';
  }
}

async function unwrap<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new MeetingsApiError(json?.message || `Request failed (${res.status})`, res.status);
  return json.data as T;
}

/** Mirrors meetings_type_check. NULL is legitimate: an unclassified meeting. */
export const MEETING_TYPES = ['sales-call', 'internal', 'client-meeting'] as const;
export type MeetingType = (typeof MEETING_TYPES)[number];

/** Mirrors meetings_related_to_type_check (049). No 'employee' — HRMS owns that. */
export const RELATED_TYPES = ['deal', 'company', 'contact', 'lead'] as const;
export type RelatedType = (typeof RELATED_TYPES)[number];

export const RELATED_TYPE_LABEL: Record<RelatedType, string> = {
  deal: 'Deal',
  company: 'Account',
  contact: 'Contact',
  lead: 'Lead',
};

export interface MeetingTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  assigned_to: string | null;
}

export interface MeetingActivity {
  id: string;
  subject: string;
  type: string;
  status: string | null;
  completed_at: string | null;
  created_at: string;
  created_by: string | null;
}

export interface Meeting {
  id: string;
  title: string;
  date: string | null;
  duration: number | null;
  attendees: string | null;
  type: MeetingType | null;
  related_to_type: RelatedType | null;
  related_to_id: string | null;
  summary: string | null;
  notes: string | null;
  action_items: string | null;
  owner_id: number | null;
  owner_name: string | null;
  created_at: string;
  updated_at: string | null;
}

/** The detail response. `tasks` and `activities` are EMPTY when the meeting has
 *  no related record — there is nothing to look them up by, which is a
 *  different fact from "this meeting produced nothing". */
export interface MeetingDetail extends Meeting {
  tasks: MeetingTask[];
  activities: MeetingActivity[];
}

export async function fetchMeetings(filter?: {
  related_to_type?: RelatedType;
  related_to_id?: string;
}): Promise<Meeting[]> {
  const qs = new URLSearchParams();
  if (filter?.related_to_type) qs.set('related_to_type', filter.related_to_type);
  if (filter?.related_to_id) qs.set('related_to_id', filter.related_to_id);
  const suffix = qs.toString() ? `?${qs}` : '';
  return unwrap<Meeting[]>(await fetch(`${API_BASE}/meetings${suffix}`, { headers: getAuthHeaders() }));
}

export async function fetchMeeting(id: string): Promise<MeetingDetail> {
  return unwrap<MeetingDetail>(
    await fetch(`${API_BASE}/meetings/${encodeURIComponent(id)}`, { headers: getAuthHeaders() }),
  );
}

export interface MeetingWrite {
  title: string;
  date?: string | null;
  duration?: number | null;
  attendees?: string | null;
  type?: MeetingType | null;
  notes?: string | null;
  summary?: string | null;
  action_items?: string | null;
  related_to_type?: RelatedType | null;
  related_to_id?: string | null;
}

export async function createMeeting(body: MeetingWrite): Promise<Meeting> {
  return unwrap<Meeting>(await fetch(`${API_BASE}/meetings`, {
    method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(body),
  }));
}

/** Edits the note and its fields. CANNOT move the relation — see pushToRecord. */
export async function updateMeeting(id: string, body: Partial<MeetingWrite>): Promise<Meeting> {
  return unwrap<Meeting>(await fetch(`${API_BASE}/meetings/${encodeURIComponent(id)}`, {
    method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify(body),
  }));
}

/**
 * The "push to deal or account" action. Its own endpoint because this is the
 * one field the server validates ownership on — pass null to unlink.
 */
export async function pushToRecord(
  id: string, related_to_type: RelatedType | null, related_to_id?: string | null,
): Promise<Meeting> {
  return unwrap<Meeting>(await fetch(`${API_BASE}/meetings/${encodeURIComponent(id)}/relation`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ related_to_type, related_to_id: related_to_type ? related_to_id : null }),
  }));
}

/**
 * Turn a line the USER selected out of the note into a real activity on the
 * related record. The subject is whatever they chose; nothing reads the note
 * and decides for them. Fails with a clear message when the meeting is not yet
 * linked to anything.
 */
export async function logActivityFromMeeting(
  id: string, body: { subject: string; type?: string; description?: string; status?: string },
): Promise<MeetingActivity> {
  return unwrap<MeetingActivity>(
    await fetch(`${API_BASE}/meetings/${encodeURIComponent(id)}/activities`, {
      method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(body),
    }),
  );
}
