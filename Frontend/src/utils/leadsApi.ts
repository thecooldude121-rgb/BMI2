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
  try {
    const res  = await fetch(`${API_BASE}/leads/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? mapRowToLead(json.data) : null;
  } catch {
    return null;
  }
}

export async function createLeadViaAPI(lead: Partial<Lead>): Promise<Lead | null> {
  try {
    const res = await fetch(`${API_BASE}/leads`, {
      method:  'POST',
      headers: getAuthHeaders(),
      body:    JSON.stringify(lead),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to create lead');
    return mapRowToLead(json.data);
  } catch (err: any) {
    console.error('[leadsApi] createLead:', err.message);
    return null;
  }
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
  try {
    const res  = await fetch(`${API_BASE}/leads/${id}`, {
      method:  'DELETE',
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    return json.success === true;
  } catch {
    return false;
  }
}

// ── Activities ────────────────────────────────────────────────────────────────

export async function fetchActivitiesFromAPI(leadId: string): Promise<LeadActivity[]> {
  try {
    const res = await fetch(`${API_BASE}/leads/${leadId}/activities`, { headers: getAuthHeaders() });
    if (!res.ok) return [];
    const json = await res.json();
    return json.success ? json.data : [];
  } catch { return []; }
}

export async function createActivityViaAPI(leadId: string, activity: Partial<LeadActivity>): Promise<LeadActivity | null> {
  try {
    const res = await fetch(`${API_BASE}/leads/${leadId}/activities`, {
      method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(activity),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    return json.data;
  } catch (err: any) {
    console.error('[leadsApi] createActivity:', err.message);
    return null;
  }
}

export async function updateActivityViaAPI(leadId: string, activityId: string, updates: Partial<LeadActivity>): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/leads/${leadId}/activities/${activityId}`, {
      method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(updates),
    });
    const json = await res.json();
    return json.success === true;
  } catch { return false; }
}

// ── Notes ─────────────────────────────────────────────────────────────────────

export async function fetchNotesFromAPI(leadId: string): Promise<LeadNote[]> {
  try {
    const res = await fetch(`${API_BASE}/leads/${leadId}/notes`, { headers: getAuthHeaders() });
    if (!res.ok) return [];
    const json = await res.json();
    return json.success ? json.data : [];
  } catch { return []; }
}

export async function createNoteViaAPI(leadId: string, note: Partial<LeadNote>): Promise<LeadNote | null> {
  try {
    const res = await fetch(`${API_BASE}/leads/${leadId}/notes`, {
      method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(note),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    return json.data;
  } catch (err: any) {
    console.error('[leadsApi] createNote:', err.message);
    return null;
  }
}

export async function updateNoteViaAPI(leadId: string, noteId: string, updates: Partial<LeadNote>): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/leads/${leadId}/notes/${noteId}`, {
      method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(updates),
    });
    const json = await res.json();
    return json.success === true;
  } catch { return false; }
}

export async function deleteNoteViaAPI(leadId: string, noteId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/leads/${leadId}/notes/${noteId}`, {
      method: 'DELETE', headers: getAuthHeaders(),
    });
    const json = await res.json();
    return json.success === true;
  } catch { return false; }
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export async function fetchTasksFromAPI(leadId: string): Promise<LeadTask[]> {
  try {
    const res = await fetch(`${API_BASE}/leads/${leadId}/tasks`, { headers: getAuthHeaders() });
    if (!res.ok) return [];
    const json = await res.json();
    return json.success ? json.data : [];
  } catch { return []; }
}

export async function createTaskViaAPI(leadId: string, task: Partial<LeadTask>): Promise<LeadTask | null> {
  try {
    const res = await fetch(`${API_BASE}/leads/${leadId}/tasks`, {
      method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(task),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    return json.data;
  } catch (err: any) {
    console.error('[leadsApi] createTask:', err.message);
    return null;
  }
}

export async function updateTaskViaAPI(leadId: string, taskId: string, updates: Partial<LeadTask>): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/leads/${leadId}/tasks/${taskId}`, {
      method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(updates),
    });
    const json = await res.json();
    return json.success === true;
  } catch { return false; }
}

// ── Emails ────────────────────────────────────────────────────────────────────

export async function fetchEmailsFromAPI(leadId: string): Promise<LeadEmail[]> {
  try {
    const res = await fetch(`${API_BASE}/leads/${leadId}/emails`, { headers: getAuthHeaders() });
    if (!res.ok) return [];
    const json = await res.json();
    return json.success ? json.data : [];
  } catch { return []; }
}

export async function logEmailViaAPI(leadId: string, email: Partial<LeadEmail>): Promise<LeadEmail | null> {
  try {
    const res = await fetch(`${API_BASE}/leads/${leadId}/emails`, {
      method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(email),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    return json.data;
  } catch (err: any) {
    console.error('[leadsApi] logEmail:', err.message);
    return null;
  }
}

// ── Calls ─────────────────────────────────────────────────────────────────────

export async function fetchCallsFromAPI(leadId: string): Promise<LeadCall[]> {
  try {
    const res = await fetch(`${API_BASE}/leads/${leadId}/calls`, { headers: getAuthHeaders() });
    if (!res.ok) return [];
    const json = await res.json();
    return json.success ? json.data : [];
  } catch { return []; }
}

export async function logCallViaAPI(leadId: string, call: Partial<LeadCall>): Promise<LeadCall | null> {
  try {
    const res = await fetch(`${API_BASE}/leads/${leadId}/calls`, {
      method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(call),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    return json.data;
  } catch (err: any) {
    console.error('[leadsApi] logCall:', err.message);
    return null;
  }
}

// ── Meetings ──────────────────────────────────────────────────────────────────

export async function fetchMeetingsFromAPI(leadId: string): Promise<LeadMeeting[]> {
  try {
    const res = await fetch(`${API_BASE}/leads/${leadId}/meetings`, { headers: getAuthHeaders() });
    if (!res.ok) return [];
    const json = await res.json();
    return json.success ? json.data : [];
  } catch { return []; }
}

export async function scheduleMeetingViaAPI(leadId: string, meeting: Partial<LeadMeeting>): Promise<LeadMeeting | null> {
  try {
    const res = await fetch(`${API_BASE}/leads/${leadId}/meetings`, {
      method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(meeting),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    return json.data;
  } catch (err: any) {
    console.error('[leadsApi] scheduleMeeting:', err.message);
    return null;
  }
}

// ── Tags ──────────────────────────────────────────────────────────────────────

export async function fetchTagsFromAPI(): Promise<Tag[]> {
  try {
    const res = await fetch(`${API_BASE}/leads/meta/tags`, { headers: getAuthHeaders() });
    if (!res.ok) return [];
    const json = await res.json();
    return json.success ? json.data : [];
  } catch { return []; }
}

export async function createTagViaAPI(tag: Partial<Tag>): Promise<Tag | null> {
  try {
    const res = await fetch(`${API_BASE}/leads/meta/tags`, {
      method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(tag),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    return json.data;
  } catch (err: any) {
    console.error('[leadsApi] createTag:', err.message);
    return null;
  }
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
  try {
    const res = await fetch(`${API_BASE}/leads/meta/views`, { headers: getAuthHeaders() });
    if (!res.ok) return [];
    const json = await res.json();
    return json.success ? (json.data as any[]).map(mapRowToLeadView) : [];
  } catch { return []; }
}

export async function createViewViaAPI(view: Partial<LeadView>): Promise<LeadView | null> {
  try {
    const res = await fetch(`${API_BASE}/leads/meta/views`, {
      method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(view),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    return mapRowToLeadView(json.data);
  } catch (err: any) {
    console.error('[leadsApi] createView:', err.message);
    return null;
  }
}

export async function updateViewViaAPI(viewId: string, updates: Partial<LeadView>): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/leads/meta/views/${viewId}`, {
      method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(updates),
    });
    const json = await res.json();
    return json.success === true;
  } catch { return false; }
}

export async function deleteViewViaAPI(viewId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/leads/meta/views/${viewId}`, {
      method: 'DELETE', headers: getAuthHeaders(),
    });
    const json = await res.json();
    return json.success === true;
  } catch { return false; }
}

// ── Enrichment ────────────────────────────────────────────────────────────────

export async function enrichLeadViaAPI(leadId: string): Promise<LeadEnrichmentResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/leads/${leadId}/enrich`, {
      method: 'POST', headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    return json.data;
  } catch (err: any) {
    console.error('[leadsApi] enrichLead:', err.message);
    return null;
  }
}
