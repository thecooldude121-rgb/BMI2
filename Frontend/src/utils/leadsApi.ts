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

import type { AdvancedFilter } from '../types/leadFilter';
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
    // `stage` deliberately not set. The DB column IS called stage, but the
    // frontend Lead type calls it `status` — mapped a few lines below — and
    // nothing reads `lead.stage`. Setting both put an off-type property on every
    // lead and was the only type error in this file. (Lead.state, which does
    // exist, is the geographic state; unrelated despite the near-miss name.)
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
    // leads.value has always existed and was hardcoded to 0 here; currency was
    // a hardcoded 'USD'. Both are the stored values now (null = not recorded).
    estimated_value: row.value == null ? null : Number(row.value),
    probability:    0,
    currency:       row.currency ?? null,
    email_opt_in:   true,
    sms_opt_in:     false,
    call_opt_in:    true,
    do_not_contact: false,
    gdpr_consent:   false,
    is_qualified:   false,
    // leads.last_contact was never mapped, so the qualification modal's
    // "contacted" criterion failed for every API-loaded lead and only a manager
    // override could qualify anything. Set by logged calls / emails / completed
    // activities since step 5.
    ...(row.last_contact ? { last_contact_date: String(row.last_contact).slice(0, 10) } : {}),
    assigned_to_user_id: row.assigned_to_user_id ?? null,
    ...(row.assigned_to ? { owner_name: String(row.assigned_to) } : {}),
    // Group B item 11: the earliest OPEN follow-up task — served as plain
    // 'YYYY-MM-DD' text (never a shifted timestamp), absent when there is none.
    ...(row.next_follow_up_date ? { next_follow_up_date: String(row.next_follow_up_date) } : {}),
    ...(row.next_follow_up_task_id ? { next_follow_up_task_id: String(row.next_follow_up_task_id) } : {}),
    // Migration 063 profile fields — absent when not recorded.
    ...Object.fromEntries(
      (['mobile', 'website', 'linkedin_url', 'city', 'country', 'company_size', 'department', 'source_detail',
        'priority', 'utm_source', 'utm_medium', 'utm_campaign', 'referral_contact', 'notes'] as const)
        .filter(k => row[k] != null && row[k] !== '')
        .map(k => [k, String(row[k])]),
    ),
    // Migration 059 — what a converted lead became. Server-written only.
    ...(row.converted_at ? { converted_at: String(row.converted_at) } : {}),
    ...(row.converted_contact_id ? { converted_to_contact_id: String(row.converted_contact_id) } : {}),
    ...(row.converted_company_id ? { converted_to_company_id: String(row.converted_company_id) } : {}),
    ...(row.converted_deal_id ? { converted_to_deal_id: String(row.converted_deal_id) } : {}),
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

/**
 * THROWS on failure, deliberately. It used to `return []` for both a non-ok
 * response and a thrown fetch, which meant an expired token or a 500 rendered
 * as "0 leads" — indistinguishable from an empty pipeline, and the more
 * alarming of the two readings is the one the user does not get shown.
 *
 * Both call sites were already written for a throw: LeadContext.fetchLeads has
 * a catch that sets its error state (dead code until now), and
 * useDashboardData treats a rejection as "leads unavailable" rather than zero.
 */
export async function fetchLeadsFromAPI(filters?: LeadFilters): Promise<Lead[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.set('search', filters.search);
  if (filters?.owner_id?.length) params.set('owner_id', filters.owner_id[0]);
  if (filters?.limit) params.set('limit', String(filters.limit));

  const url = `${API_BASE}/leads${params.toString() ? '?' + params : ''}`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Failed to load leads (HTTP ${res.status})`);
  const json = await res.json();
  return (json.success ? json.data : []).map(mapRowToLead);
}

// ── Server-side pagination (step 5 slice A) ──────────────────────────────────

/**
 * One page of the lead list, filtered / sorted / counted by the SERVER.
 * Every field maps to a GET /leads query param handled by
 * Backend/src/utils/leadListQuery.ts; anything it does not support comes back
 * as a 400 with the reason (never silently ignored).
 */
export interface LeadListQuery {
  status?: string;               // UI status or chip group key
  source?: string;
  score_band?: string;
  search?: string;
  assigned_to_user_id?: string;  // the "own leads" display filter
  insight?: 'untouched' | 'ready_to_convert' | 'new_unworked' | 'overdue';
  filter?: AdvancedFilter;
  sort?: string;
  stages?: string[];             // Kanban lane statuses
  limit: number;
  offset: number;
}

export interface LeadPage { leads: Lead[]; total: number }

export async function fetchLeadsPage(q: LeadListQuery): Promise<LeadPage> {
  const params = new URLSearchParams();
  const set = (k: string, v: string | undefined) => { if (v !== undefined && v !== '' && v !== 'all') params.set(k, v); };
  set('status', q.status); set('source', q.source); set('score_band', q.score_band);
  set('search', q.search?.trim()); set('assigned_to_user_id', q.assigned_to_user_id);
  set('insight', q.insight); set('sort', q.sort);
  if (q.stages?.length) params.set('stages', q.stages.join(','));
  if (q.filter && q.filter.groups.some(g => g.conditions.length > 0)) params.set('filter', JSON.stringify(q.filter));
  params.set('limit', String(q.limit));
  params.set('offset', String(q.offset));
  const res = await fetch(`${API_BASE}/leads?${params}`, { headers: getAuthHeaders() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || `Failed to load leads (HTTP ${res.status})`);
  return { leads: (json.data ?? []).map(mapRowToLead), total: Number(json.total ?? 0) };
}

/** KPI figures over ALL matching leads (GET /leads/summary). */
export interface LeadSummary {
  total: number;
  new_today: number;
  hot: number;
  imported_this_week: number;
  new_unworked: number;
  new_unworked_this_week: number;
  new_unworked_last_week: number;
  untouched: number;
  ready_to_convert: number;
  /** Leads with an open follow-up task due before today (Group B item 11). */
  overdue_follow_ups: number;
  source_quality_week: { top_source: string | null; top_source_avg_score: number; top_source_count: number; weekly_leads: number };
}

export async function fetchLeadSummary(assignedToUserId?: string): Promise<LeadSummary> {
  const qs = assignedToUserId ? `?assigned_to_user_id=${encodeURIComponent(assignedToUserId)}` : '';
  const res = await fetch(`${API_BASE}/leads/summary${qs}`, { headers: getAuthHeaders() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || `Failed to load lead summary (HTTP ${res.status})`);
  return json.data as LeadSummary;
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

/**
 * Mirrors updateLeadViaAPI's status -> stage translation. Without it, creating a
 * lead from the Add Lead form could never succeed: the page sends `status: 'new'`
 * (the frontend Lead.status field carries the STAGE vocabulary), the DB column
 * `leads.status` is the separate lifecycle flag `active|inactive|nurturing`, and
 * the controller validated the former against the latter — HTTP 400,
 * "status must be one of: active, inactive, nurturing", on every attempt.
 *
 * The asymmetry was the whole bug: updateLeadViaAPI has always done this mapping
 * and createLeadViaAPI never did, so editing a lead worked and creating one did
 * not. Invisible until the error-swallowing sweep, because the 400 was caught and
 * returned as null.
 */
export async function createLeadViaAPI(lead: Partial<Lead>): Promise<Lead | null> {
  const payload: Record<string, any> = { ...lead };
  if ('status' in payload) {
    payload.stage = payload.status;
    delete payload.status;
  }
  const res = await fetch(`${API_BASE}/leads`, {
    method:  'POST',
    headers: getAuthHeaders(),
    body:    JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to create lead');
  return mapRowToLead(json.data);
}

/**
 * Throws on a rejected write. It used to catch, console.error and return null,
 * which is how the lead-conversion wizard came to show a success screen for a
 * write that never happened: the server returned 400, the message went to the
 * console, the caller saw a falsy value it was not checking, and the UI advanced.
 * A silent null is indistinguishable from "nothing to update" at the call site.
 *
 * Callers that only need success/failure keep using LeadContext.updateLead, which
 * still returns a boolean; it catches this and also records the message on
 * `lastWriteError` so a caller can show what actually went wrong.
 */
export async function updateLeadViaAPI(id: string, updates: Partial<Lead>): Promise<Lead> {
  // STAGE CHANGES DO NOT GO THROUGH PUT (step 5, ratified 2026-10-03). The
  // frontend's `status` IS the stage; when it is present it is sent to
  // POST /leads/:id/stage-transition, which enforces the qualification gate and
  // records history, and only the remaining fields are PUT. A disqualify / lost
  // reason rides along as the transition's reason — before this it was sent
  // as disqualified_reason / lost_reason, which no column holds, and silently
  // dropped.
  const payload: Record<string, any> = { ...updates };
  let last: Lead | null = null;

  if ('status' in payload) {
    const toStage = payload.status as string;
    const reasonParts = [
      payload.disqualified_reason ?? payload.lost_reason,
      payload.disqualified_reason_notes ?? payload.lost_reason_notes,
    ].filter(v => typeof v === 'string' && v.trim());
    for (const k of ['status', 'disqualified_reason', 'disqualified_reason_notes', 'lost_reason', 'lost_reason_notes']) {
      delete payload[k];
    }
    last = await transitionLeadStageViaAPI(id, toStage, {
      ...(reasonParts.length ? { reason: reasonParts.join(' — ') } : {}),
    });
  }

  if (Object.keys(payload).length === 0 && last) return last;

  const res = await fetch(`${API_BASE}/leads/${id}`, {
    method:  'PUT',
    headers: getAuthHeaders(),
    body:    JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.message || `Failed to update lead (HTTP ${res.status})`);
  }
  return mapRowToLead(json.data);
}

/** One criterion of the server's qualification gate. */
export interface QualificationCriterion { id: string; label: string; met: boolean }

/**
 * A refused stage move, carrying the server's reasons. `unmetCriteria` and
 * `canOverride` come from the 409 body — the client renders the server's rule
 * rather than recomputing it.
 */
export class LeadStageError extends Error {
  status: number;
  code?: string;
  unmetCriteria: QualificationCriterion[];
  canOverride: boolean;
  constructor(status: number, body: any) {
    super(body?.message || `Could not move the lead (HTTP ${status})`);
    this.name = 'LeadStageError';
    this.status = status;
    this.code = body?.code;
    this.unmetCriteria = Array.isArray(body?.unmet_criteria) ? body.unmet_criteria : [];
    this.canOverride = body?.can_override === true;
  }
}

/** POST /leads/:id/stage-transition. Throws LeadStageError on any refusal. */
/** What the lead editor may send — the API's own field names (PUT /leads/:id). */
export interface LeadEditPayload {
  first_name?: string; last_name?: string | null; email?: string; phone?: string | null;
  company?: string | null; position?: string | null; industry?: string | null; source?: string | null;
  notes?: string | null; tags?: string[];
  mobile?: string | null; website?: string | null; linkedin_url?: string | null; city?: string | null;
  country?: string | null; company_size?: string | null; department?: string | null; source_detail?: string | null;
  priority?: string | null; value?: number | null; currency?: string | null;
  utm_source?: string | null; utm_medium?: string | null; utm_campaign?: string | null; referral_contact?: string | null;
}

/**
 * The lead editor's save. THROWS with the server's message on any non-2xx, so
 * the editor shows it and keeps the user's input; resolves with the saved row
 * only after the server confirms. Never sends `stage` (stage changes go through
 * the transition endpoint).
 */
export async function saveLeadViaAPI(id: string, body: LeadEditPayload): Promise<Lead> {
  const res = await fetch(`${API_BASE}/leads/${id}`, {
    method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || `The lead was not saved (HTTP ${res.status})`);
  return mapRowToLead(json.data);
}

export async function transitionLeadStageViaAPI(
  id: string,
  toStage: string,
  opts: { override?: boolean; reason?: string } = {},
): Promise<Lead> {
  const res = await fetch(`${API_BASE}/leads/${id}/stage-transition`, {
    method:  'POST',
    headers: getAuthHeaders(),
    body:    JSON.stringify({ to_stage: toStage, ...opts }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new LeadStageError(res.status, json);
  return mapRowToLead(json.data);
}

// ── Conversion (step 5 slice B) ───────────────────────────────────────────────

export type ConversionContact = { mode: 'create'; first_name?: string; last_name?: string } | { mode: 'link'; contact_id: string };
export type ConversionCompany = { mode: 'none' } | { mode: 'create'; name?: string } | { mode: 'link'; company_id: string };
export interface ConversionDeal { name: string; value: number; currency?: string; expected_close_date?: string; pipeline_id?: string }
export interface ConversionRequest { contact: ConversionContact; company: ConversionCompany; deal: ConversionDeal | null }

export interface LeadConversionResult {
  lead: Lead;
  contact: { id: string; name: string; created: boolean };
  company: { id: string; name: string; created: boolean } | null;
  deal: { id: string; name: string } | null;
}

/**
 * A refused conversion with the server's reason. On CONTACT_EMAIL_EXISTS,
 * `existingContact` names the contact so the UI can offer an EXPLICIT link —
 * never an automatic one (ratified 2026-10-03).
 */
export class LeadConversionError extends Error {
  status: number;
  code?: string;
  existingContact?: { id: string; name: string };
  constructor(status: number, body: any) {
    super(body?.message || `Could not convert the lead (HTTP ${status})`);
    this.name = 'LeadConversionError';
    this.status = status;
    this.code = body?.code;
    if (body?.existing_contact?.id) this.existingContact = body.existing_contact;
  }
}

/** POST /leads/:id/convert — creates/links everything in one server transaction. */
export async function convertLeadViaAPI(id: string, request: ConversionRequest): Promise<LeadConversionResult> {
  const res = await fetch(`${API_BASE}/leads/${id}/convert`, {
    method:  'POST',
    headers: getAuthHeaders(),
    body:    JSON.stringify(request),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new LeadConversionError(res.status, json);
  return { ...json.data, lead: mapRowToLead(json.data.lead) };
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

/** One row of GET /leads/:id/stage-history (migration 058) — server-recorded moves. */
export interface LeadStageHistoryRow {
  id: string;
  lead_id: number | string;
  from_stage: string | null;   // NULL on the creation row
  to_stage: string;
  qualification_override: boolean;
  unmet_criteria: string[] | null;
  reason: string | null;
  changed_by_user_id: number | null;
  changed_by_name: string | null;
  changed_at: string;
}

export async function fetchLeadStageHistory(leadId: string): Promise<LeadStageHistoryRow[]> {
  const res = await fetch(`${API_BASE}/leads/${leadId}/stage-history`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await errorMessage(res, 'fetchLeadStageHistory'));
  const json = await res.json();
  return json.success ? json.data : [];
}

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
