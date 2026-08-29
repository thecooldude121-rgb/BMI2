/**
 * leadsApi.ts — Express backend client for the leads module.
 *
 * This replaces the Supabase client that LeadContext.tsx previously used.
 * All requests go through the Express backend (port 5001) which connects
 * to PostgreSQL via pg.Pool — the same database you manage in pgAdmin 4.
 *
 * Architecture:
 *   LeadContext  →  leadsApi.ts  →  Express /api/v1/leads  →  PostgreSQL (bmi_crm)
 *
 * The backend leads table schema (from migrate.ts) has a subset of the fields
 * defined in types/lead.ts. mapRowToLead() fills the gaps with safe defaults
 * so the rest of the frontend never sees undefined required fields.
 */

import type {
  Lead, LeadFilters,
  LeadActivity, LeadNote, LeadTask, LeadEmail, LeadCall, LeadMeeting,
  Tag, LeadView, LeadEnrichmentResponse,
} from '../types/lead';

const API_BASE = 'http://localhost:5001/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * One place that turns a rejected response into a message worth showing.
 *
 * Every function in this file used to swallow failures — `catch` -> `return null`
 * / `false` / `[]` — so a 400, an expired token and a genuinely empty list were
 * the same value at the call site. That is the mechanism behind every "feature
 * that never worked behind a success state" found in this project: the account
 * address form, lead conversion, and the seventeen writes below.
 *
 * Reads now throw too. `return []` on a failed fetch renders as "no notes yet",
 * which is a claim about the data rather than about the request.
 */
async function errorMessage(res: Response, scope: string, json?: any): Promise<string> {
  let body = json;
  if (body === undefined) {
    body = await res.json().catch(() => ({}));
  }
  return body?.message || `${scope} failed (HTTP ${res.status})`;
}

// Map a raw PostgreSQL row (backend schema) → frontend Lead type.
// Fields not in the DB get safe defaults so components never see undefined.
export function mapRowToLead(row: any): Lead {
  return {
    id:         row.id         || '',
    first_name: row.first_name || '',
    last_name:  row.last_name  || '',
    full_name:  `${row.first_name || ''} ${row.last_name || ''}`.trim() || undefined,
    email:      row.email      || undefined,
    phone:      row.phone      || undefined,
    company:    row.company    || undefined,
    position:   row.position   || undefined,
    industry:   row.industry   || undefined,
    stage:      row.stage      || 'new',
    score:      row.score      ?? 0,
    source:     row.source     || 'manual',
    owner_id:   row.owner_id   || '',
    tags:       Array.isArray(row.tags) ? row.tags : [],
    custom_fields:   row.custom_fields   || {},
    enrichment_data: row.enrichment_data || {},
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
    created_by: row.created_by || '',
    // status maps from the DB 'stage' column; fall back to 'new' if missing
    status:         (row.stage || 'new') as Lead['status'],
    temperature:    'cold',
    estimated_value: 0,
    probability:    0,
    currency:       'USD',
    email_opt_in:   true,
    sms_opt_in:     false,
    call_opt_in:    true,
    do_not_contact: false,
    gdpr_consent:   false,
    is_qualified:   false,
    is_deleted:     false,
    email_opens_count:  0,
    email_clicks_count: 0,
    page_views_count:   0,
    meeting_count:      0,
    call_count:         0,
    email_sent_count:   0,
    ai_recommendations:  [],
    automation_paused:   false,
  };
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

export async function fetchLeadsFromAPI(filters?: LeadFilters): Promise<Lead[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.search)   params.set('search', filters.search);
    if (filters?.owner_id?.length) params.set('owner_id', filters.owner_id[0]);

    const url = `${API_BASE}/leads${params.toString() ? '?' + params : ''}`;
    const res  = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.success ? json.data : []).map(mapRowToLead);
  } catch {
    return [];
  }
}

export async function fetchLeadByIdFromAPI(id: string): Promise<Lead | null> {
  const res  = await fetch(`${API_BASE}/leads/${id}`, { headers: getAuthHeaders() });
  // 404 is a real answer — this lead does not exist. Anything else is a failed
  // request, and returning null for both made "deleted" and "server is down"
  // the same value at the call site.
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await errorMessage(res, 'fetchLeadById'));
  const json = await res.json();
  return json.success ? mapRowToLead(json.data) : null;
}

export async function createLeadViaAPI(lead: Partial<Lead>): Promise<Lead | null> {
  const res = await fetch(`${API_BASE}/leads`, {
    method:  'POST',
    headers: getAuthHeaders(),
    body:    JSON.stringify(lead),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to create lead');
  return mapRowToLead(json.data);
}

export async function updateLeadViaAPI(id: string, updates: Partial<Lead>): Promise<Lead | null> {
  try {
    // Translate frontend field names → DB column names (status → stage)
    const payload: Record<string, any> = { ...updates };
    if ('status' in payload) {
      payload.stage = payload.status;
      delete payload.status;
    }
    const res = await fetch(`${API_BASE}/leads/${id}`, {
      method:  'PUT',
      headers: getAuthHeaders(),
      body:    JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to update lead');
    return mapRowToLead(json.data);
  } catch (err: any) {
    console.error('[leadsApi] updateLead:', err.message);
    return null;
  }
}

export async function deleteLeadViaAPI(id: string): Promise<boolean> {
  const res  = await fetch(`${API_BASE}/leads/${id}`, {
    method:  'DELETE',
    headers: getAuthHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(await errorMessage(res, 'deleteLeadViaAPI', json));
  return json.success === true;
}

// ── Activities ────────────────────────────────────────────────────────────────

export async function fetchActivitiesFromAPI(leadId: string): Promise<LeadActivity[]> {
  const res = await fetch(`${API_BASE}/leads/${leadId}/activities`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await errorMessage(res, 'fetchActivitiesFromAPI'));
  const json = await res.json();
  return json.success ? json.data : [];
}

export async function createActivityViaAPI(leadId: string, activity: Partial<LeadActivity>): Promise<LeadActivity | null> {
  const res = await fetch(`${API_BASE}/leads/${leadId}/activities`, {
    method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(activity),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(await errorMessage(res, 'createActivityViaAPI', json));
  return json.data;
}

export async function updateActivityViaAPI(leadId: string, activityId: string, updates: Partial<LeadActivity>): Promise<boolean> {
  const res = await fetch(`${API_BASE}/leads/${leadId}/activities/${activityId}`, {
    method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(updates),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(await errorMessage(res, 'updateActivityViaAPI', json));
  return json.success === true;
}

// ── Notes ─────────────────────────────────────────────────────────────────────

export async function fetchNotesFromAPI(leadId: string): Promise<LeadNote[]> {
  const res = await fetch(`${API_BASE}/leads/${leadId}/notes`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await errorMessage(res, 'fetchNotesFromAPI'));
  const json = await res.json();
  return json.success ? json.data : [];
}

export async function createNoteViaAPI(leadId: string, note: Partial<LeadNote>): Promise<LeadNote | null> {
  const res = await fetch(`${API_BASE}/leads/${leadId}/notes`, {
    method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(note),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(await errorMessage(res, 'createNoteViaAPI', json));
  return json.data;
}

export async function updateNoteViaAPI(leadId: string, noteId: string, updates: Partial<LeadNote>): Promise<boolean> {
  const res = await fetch(`${API_BASE}/leads/${leadId}/notes/${noteId}`, {
    method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(updates),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(await errorMessage(res, 'updateNoteViaAPI', json));
  return json.success === true;
}

export async function deleteNoteViaAPI(leadId: string, noteId: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/leads/${leadId}/notes/${noteId}`, {
    method: 'DELETE', headers: getAuthHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(await errorMessage(res, 'deleteNoteViaAPI', json));
  return json.success === true;
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export async function fetchTasksFromAPI(leadId: string): Promise<LeadTask[]> {
  const res = await fetch(`${API_BASE}/leads/${leadId}/tasks`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await errorMessage(res, 'fetchTasksFromAPI'));
  const json = await res.json();
  return json.success ? json.data : [];
}

export async function createTaskViaAPI(leadId: string, task: Partial<LeadTask>): Promise<LeadTask | null> {
  const res = await fetch(`${API_BASE}/leads/${leadId}/tasks`, {
    method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(task),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(await errorMessage(res, 'createTaskViaAPI', json));
  return json.data;
}

export async function updateTaskViaAPI(leadId: string, taskId: string, updates: Partial<LeadTask>): Promise<boolean> {
  const res = await fetch(`${API_BASE}/leads/${leadId}/tasks/${taskId}`, {
    method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(updates),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(await errorMessage(res, 'updateTaskViaAPI', json));
  return json.success === true;
}

// ── Emails ────────────────────────────────────────────────────────────────────

export async function fetchEmailsFromAPI(leadId: string): Promise<LeadEmail[]> {
  const res = await fetch(`${API_BASE}/leads/${leadId}/emails`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await errorMessage(res, 'fetchEmailsFromAPI'));
  const json = await res.json();
  return json.success ? json.data : [];
}

export async function logEmailViaAPI(leadId: string, email: Partial<LeadEmail>): Promise<LeadEmail | null> {
  const res = await fetch(`${API_BASE}/leads/${leadId}/emails`, {
    method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(email),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(await errorMessage(res, 'logEmailViaAPI', json));
  return json.data;
}

// ── Calls ─────────────────────────────────────────────────────────────────────

export async function fetchCallsFromAPI(leadId: string): Promise<LeadCall[]> {
  const res = await fetch(`${API_BASE}/leads/${leadId}/calls`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await errorMessage(res, 'fetchCallsFromAPI'));
  const json = await res.json();
  return json.success ? json.data : [];
}

export async function logCallViaAPI(leadId: string, call: Partial<LeadCall>): Promise<LeadCall | null> {
  const res = await fetch(`${API_BASE}/leads/${leadId}/calls`, {
    method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(call),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(await errorMessage(res, 'logCallViaAPI', json));
  return json.data;
}

// ── Meetings ──────────────────────────────────────────────────────────────────

export async function fetchMeetingsFromAPI(leadId: string): Promise<LeadMeeting[]> {
  const res = await fetch(`${API_BASE}/leads/${leadId}/meetings`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await errorMessage(res, 'fetchMeetingsFromAPI'));
  const json = await res.json();
  return json.success ? json.data : [];
}

export async function scheduleMeetingViaAPI(leadId: string, meeting: Partial<LeadMeeting>): Promise<LeadMeeting | null> {
  const res = await fetch(`${API_BASE}/leads/${leadId}/meetings`, {
    method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(meeting),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(await errorMessage(res, 'scheduleMeetingViaAPI', json));
  return json.data;
}

// ── Tags ──────────────────────────────────────────────────────────────────────

export async function fetchTagsFromAPI(): Promise<Tag[]> {
  const res = await fetch(`${API_BASE}/leads/meta/tags`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await errorMessage(res, 'fetchTagsFromAPI'));
  const json = await res.json();
  return json.success ? json.data : [];
}

export async function createTagViaAPI(tag: Partial<Tag>): Promise<Tag | null> {
  const res = await fetch(`${API_BASE}/leads/meta/tags`, {
    method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(tag),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(await errorMessage(res, 'createTagViaAPI', json));
  return json.data;
}

// ── Views ─────────────────────────────────────────────────────────────────────

function mapRowToLeadView(row: any): LeadView {
  return {
    id:           row.id,
    name:         row.name,
    description:  row.description,
    filters:      typeof row.filters === 'string' ? JSON.parse(row.filters) : (row.filters ?? {}),
    sort_by:      row.sort_by,
    sort_order:   row.sort_order   ?? 'desc',
    columns:      row.columns      ?? [],
    is_default:   row.is_default   ?? false,
    is_public:    row.is_public    ?? true,
    is_system:    row.is_system    ?? false,
    created_by:   row.created_by   ?? '',
    created_at:   row.created_at   ?? '',
    updated_at:   row.updated_at   ?? '',
    is_pinned:    row.is_pinned    ?? false,
    view_order:   row.view_order   ?? 0,
    visibility:   row.visibility   ?? 'private',
    search_query: row.search_query ?? '',
    view_mode:    row.view_mode    ?? 'list',
    icon:         row.icon         ?? 'list',
  };
}

export async function fetchViewsFromAPI(): Promise<LeadView[]> {
  const res = await fetch(`${API_BASE}/leads/meta/views`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await errorMessage(res, 'fetchViewsFromAPI'));
  const json = await res.json();
  return json.success ? (json.data as any[]).map(mapRowToLeadView) : [];
}

export async function createViewViaAPI(view: Partial<LeadView>): Promise<LeadView | null> {
  const res = await fetch(`${API_BASE}/leads/meta/views`, {
    method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(view),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(await errorMessage(res, 'createViewViaAPI', json));
  return mapRowToLeadView(json.data);
}

export async function updateViewViaAPI(viewId: string, updates: Partial<LeadView>): Promise<boolean> {
  const res = await fetch(`${API_BASE}/leads/meta/views/${viewId}`, {
    method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(updates),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(await errorMessage(res, 'updateViewViaAPI', json));
  return json.success === true;
}

export async function deleteViewViaAPI(viewId: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/leads/meta/views/${viewId}`, {
    method: 'DELETE', headers: getAuthHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(await errorMessage(res, 'deleteViewViaAPI', json));
  return json.success === true;
}

// ── Enrichment ────────────────────────────────────────────────────────────────

export async function enrichLeadViaAPI(leadId: string): Promise<LeadEnrichmentResponse | null> {
  const res = await fetch(`${API_BASE}/leads/${leadId}/enrich`, {
    method: 'POST', headers: getAuthHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(await errorMessage(res, 'enrichLeadViaAPI', json));
  return json.data;
}
