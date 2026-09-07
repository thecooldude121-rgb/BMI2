import type { Contact, ContactSource, ContactStatus } from '../types/contact';

/**
 * Contacts API client.
 *
 * Backend/src/routes/contacts.ts has had GET/POST/PUT/DELETE since it was
 * written and nothing called it — the whole contacts surface ran on
 * `sampleContacts` (6 hardcoded records) under a KPI tile reading "147 Total".
 *
 * SHAPE GAP (mostly closed by migration 020)
 * The table now stores: id, company_id, first_name, last_name, email, phone,
 * mobile, position, department, linkedin_url, is_primary, street, city, state,
 * postal_code, country, timezone, notes, tags, source, status, owner_id,
 * created_at, updated_at. GET also returns `company_name` and `owner_name` from
 * LEFT JOINs on companies and users.
 *
 * STILL WITHOUT A COLUMN, and therefore left absent rather than invented (the
 * Phase 0 rule): lastContact, aiEnriched, enrichedDataPoints, aiScore,
 * conversionProbability, enrichmentData, activeDeal, nextAction,
 * warningMessage, and reportsTo. There is no activity, enrichment or deal-link
 * data for contacts. Do not default any of them.
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
  buying_role?: string | null;
  department?: string | null;
  linkedin_url?: string | null;
  is_primary?: boolean | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  timezone?: string | null;
  notes?: string | null;
  tags?: string[] | null;
  source?: string | null;
  status?: string | null;
  owner_id?: number | null;
  owner_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * These two mirror the CHECK constraints in migration 020, as widened by 029
 * ('import', written by the CSV importer). A row whose value is
 * outside the constraint can only mean the constraint was widened without this
 * file being updated, so fall back to the neutral member rather than casting —
 * a bad cast puts a value the UI has no branch for into a union.
 */
const SOURCES: ContactSource[] =
  ['lead-gen', 'hrms', 'converted', 'manual', 'website', 'referral', 'event', 'import'];
const STATUSES: ContactStatus[] = ['active', 'inactive', 'do-not-contact'];

/** Absent stays absent — see the note on Contact.source. */
function toSource(v: string | null | undefined): ContactSource | undefined {
  if (v == null || v === '') return undefined;
  return SOURCES.includes(v as ContactSource) ? (v as ContactSource) : undefined;
}
function toStatus(v: string | null | undefined): ContactStatus {
  return STATUSES.includes(v as ContactStatus) ? (v as ContactStatus) : 'active';
}

export function mapRowToContact(row: ContactRow): Contact {
  const fullName = [row.first_name, row.last_name].filter(Boolean).join(' ').trim();
  return {
    id: row.id,
    name: fullName || row.email,
    company: row.company_name ?? '',
    companyId: row.company_id ?? undefined,
    position: row.position ?? '',
    // undefined, not '', when unset: an empty string is a value the role chip
    // would have to decide how to render. Absent is the truth.
    buyingRole: row.buying_role ?? undefined,
    email: row.email,
    phone: row.phone ?? undefined,
    mobile: row.mobile ?? undefined,
    department: row.department ?? undefined,
    linkedinUrl: row.linkedin_url ?? undefined,
    isPrimary: row.is_primary ?? false,

    street: row.street ?? undefined,
    city: row.city ?? undefined,
    state: row.state ?? undefined,
    postalCode: row.postal_code ?? undefined,
    country: row.country ?? undefined,
    timezone: row.timezone ?? undefined,
    notes: row.notes ?? undefined,
    ownerId: row.owner_id ?? undefined,
    ownerName: row.owner_name ?? undefined,

    // tags is text[] NOT NULL DEFAULT '{}' — but guard the type anyway, since a
    // client that sent a string would otherwise turn into a char-indexed array.
    tags: Array.isArray(row.tags) ? row.tags : [],

    source: toSource(row.source),
    status: toStatus(row.status),

    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? '',

    // Intentionally absent: lastContact, aiEnriched, enrichedDataPoints,
    // aiScore, conversionProbability, enrichmentData, activeDeal,
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
  if (c.mobile !== undefined)       p.mobile = c.mobile;
  if (c.position !== undefined)     p.position = c.position;
  // Passed through even when null: an explicit null CLEARS the role back to
  // unassigned, which is a different operation from omitting the field.
  if (c.buyingRole !== undefined)   p.buying_role = c.buyingRole === '' ? null : c.buyingRole;
  if (c.department !== undefined)   p.department = c.department;
  if (c.linkedinUrl !== undefined)  p.linkedin_url = c.linkedinUrl;
  if (c.isPrimary !== undefined)    p.is_primary = c.isPrimary;
  if (c.companyId !== undefined)    p.company_id = c.companyId;
  if (c.street !== undefined)       p.street = c.street;
  if (c.city !== undefined)         p.city = c.city;
  if (c.state !== undefined)        p.state = c.state;
  if (c.postalCode !== undefined)   p.postal_code = c.postalCode;
  if (c.country !== undefined)      p.country = c.country;
  if (c.timezone !== undefined)     p.timezone = c.timezone;
  if (c.notes !== undefined)        p.notes = c.notes;
  if (c.tags !== undefined)         p.tags = c.tags;
  if (c.source !== undefined)       p.source = c.source;
  if (c.status !== undefined)       p.status = c.status;
  if (c.ownerId !== undefined)      p.owner_id = c.ownerId;
  // ownerName and company are read-only join results — sending them would be
  // rejected as unknown columns, or worse, silently ignored.
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

/**
 * Returns null for a contact that does not exist (or belongs to another
 * tenant), and throws for anything else. A caller must be able to tell "no such
 * contact" from "the request failed" — collapsing both to null is what made a
 * failed load render as an empty pipeline on the dashboard.
 */
export async function fetchContactById(id: string): Promise<Contact | null> {
  const res = await fetch(`${API_BASE}/contacts/${encodeURIComponent(id)}`, { headers: getAuthHeaders() });
  if (res.status === 404) return null;
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || `GET /contacts/${id} failed (HTTP ${res.status})`);
  return mapRowToContact(json.data);
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

// ── Bulk actions ────────────────────────────────────────────────────────────

export type ContactBulkAction = 'delete' | 'status' | 'owner' | 'tag';

export interface ContactBulkResult {
  action:    ContactBulkAction;
  /** How many rows actually changed. */
  affected:  number;
  /** How many ids the caller asked about. */
  requested: number;
  /** Ids that are not in this tenant. Reported, not treated as failure. */
  not_found: string[];
}

/**
 * One transactional request, NOT one request per contact — see
 * bulkUpdateContacts in the backend for why. `affected` can legitimately be
 * lower than `requested` when the selection held stale ids; the caller must
 * report the real number rather than the number the user selected.
 */
export async function bulkUpdateContactsViaAPI(
  action: ContactBulkAction,
  contactIds: string[],
  payload?: { status?: ContactStatus; owner_id?: number | null; tag?: string },
): Promise<ContactBulkResult> {
  return request<ContactBulkResult>('/contacts/bulk', {
    method: 'POST',
    body: JSON.stringify({ action, contact_ids: contactIds, payload }),
  });
}
