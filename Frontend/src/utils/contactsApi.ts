import type { Contact } from '../types/contact';

/**
 * Contacts API client.
 *
 * Backend/src/routes/contacts.ts has had GET/POST/PUT/DELETE since it was
 * written and nothing called it — the whole contacts surface ran on
 * `sampleContacts` (6 hardcoded records) under a KPI tile reading "147 Total".
 *
 * SHAPE GAP
 * The table stores: id, company_id, first_name, last_name, email, phone, mobile,
 * position, department, linkedin_url, is_primary, created_at, updated_at.
 * GET /contacts also returns `company_name` from a LEFT JOIN on companies.
 *
 * The `Contact` type additionally wants source, status, tags, lastContact,
 * aiEnriched/aiScore/enrichmentData and activeDeal. None of those have a column.
 * They are left absent rather than invented — see the Phase 0 rule. `source`
 * and `status` get neutral defaults because the type requires them.
 *
 * NOTE: there is no GET /contacts/:id route (only list/create/update/delete),
 * so fetchContactById filters the list. Add the route when a contact detail
 * page needs fields the list does not return.
 */

const API_BASE = 'http://localhost:5001/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface ContactRow {
  id: string;
  company_id?: string | null;
  company_name?: string | null;
  first_name: string;
  last_name?: string | null;
  email: string;
  phone?: string | null;
  mobile?: string | null;
  position?: string | null;
  department?: string | null;
  linkedin_url?: string | null;
  is_primary?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export function mapRowToContact(row: ContactRow): Contact {
  const fullName = [row.first_name, row.last_name].filter(Boolean).join(' ').trim();
  return {
    id: row.id,
    name: fullName || row.email,
    company: row.company_name ?? '',
    companyId: row.company_id ?? undefined,
    position: row.position ?? '',
    email: row.email,
    phone: row.phone ?? row.mobile ?? undefined,
    department: row.department ?? undefined,
    linkedinUrl: row.linkedin_url ?? undefined,
    isPrimary: row.is_primary ?? false,
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? '',

    // Required by the type, no column behind them. Neutral values only.
    source: 'manual',
    status: 'active',
    tags: [],

    // Intentionally absent: lastContact, aiEnriched, enrichedDataPoints,
    // aiScore, conversionProbability, hrmsBonus, enrichmentData, activeDeal,
    // nextAction, warningMessage. There is no activity, enrichment or deal-link
    // data for contacts yet. Do not default these.
  };
}

/** Split a display name into the columns the API expects. */
export function splitName(name: string): { first_name: string; last_name?: string } {
  const parts = name.trim().split(/\s+/);
  return parts.length <= 1
    ? { first_name: parts[0] ?? '' }
    : { first_name: parts[0], last_name: parts.slice(1).join(' ') };
}

export function mapContactToPayload(c: Partial<Contact>): Record<string, unknown> {
  const p: Record<string, unknown> = {};
  if (c.name !== undefined) Object.assign(p, splitName(c.name));
  if (c.email !== undefined)        p.email = c.email;
  if (c.phone !== undefined)        p.phone = c.phone;
  if (c.position !== undefined)     p.position = c.position;
  if (c.department !== undefined)   p.department = c.department;
  if (c.linkedinUrl !== undefined)  p.linkedin_url = c.linkedinUrl;
  if (c.isPrimary !== undefined)    p.is_primary = c.isPrimary;
  if (c.companyId !== undefined)    p.company_id = c.companyId;
  return p;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: getAuthHeaders(), ...init });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.message || `${init?.method ?? 'GET'} ${path} failed (HTTP ${res.status})`);
  }
  return json as T;
}

export async function fetchContacts(opts: { search?: string; companyId?: string; limit?: number } = {}): Promise<Contact[]> {
  const params = new URLSearchParams();
  params.set('limit', String(opts.limit ?? 200));
  if (opts.search) params.set('search', opts.search);
  if (opts.companyId) params.set('account_id', opts.companyId); // API's param name for company_id
  const json = await request<{ success: boolean; data: ContactRow[] }>(`/contacts?${params}`);
  return (json.data ?? []).map(mapRowToContact);
}

export async function fetchContactById(id: string): Promise<Contact | null> {
  // No GET /contacts/:id route exists — see the note at the top of this file.
  const all = await fetchContacts({ limit: 500 });
  return all.find(c => c.id === id) ?? null;
}

export async function createContactViaAPI(contact: Partial<Contact>): Promise<Contact> {
  const json = await request<{ success: boolean; data: ContactRow }>('/contacts', {
    method: 'POST',
    body: JSON.stringify(mapContactToPayload(contact)),
  });
  return mapRowToContact(json.data);
}

export async function updateContactViaAPI(id: string, updates: Partial<Contact>): Promise<Contact> {
  const json = await request<{ success: boolean; data: ContactRow }>(
    `/contacts/${encodeURIComponent(id)}`,
    { method: 'PUT', body: JSON.stringify(mapContactToPayload(updates)) },
  );
  return mapRowToContact(json.data);
}

export async function deleteContactViaAPI(id: string): Promise<void> {
  await request(`/contacts/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
