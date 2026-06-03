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

import type { Lead, LeadFilters } from '../types/lead';

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
    // Fields not yet in the DB schema — safe defaults
    status:         'new',
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
    const res = await fetch(`${API_BASE}/leads/${id}`, {
      method:  'PUT',
      headers: getAuthHeaders(),
      body:    JSON.stringify(updates),
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
