import type { EnhancedAccount } from '../types/accounts';

/**
 * Accounts API client.
 *
 * Accounts are stored in the `companies` table and served by
 * Backend/src/routes/companies.ts, which has had full CRUD since it was
 * written. Nothing called it: AccountsContext ran on generateSampleAccounts()
 * and every create/edit/delete evaporated on refresh.
 *
 * THE SHAPE GAP — READ THIS BEFORE ADDING FIELDS
 * `EnhancedAccount` describes far more than the table stores. The table has:
 *   id, name, domain, industry, size, revenue, website, phone, description,
 *   street, city, state, country, zip_code, created_at, updated_at, tenant_id
 * Everything else on EnhancedAccount — health/engagement scores, rating,
 * priority, type, source, HRMS connection, consent flags, owner, related
 * contacts/deals/activities — has NO column behind it.
 *
 * Per the Phase 0 rule, those fields are left absent rather than filled with
 * invented values. A few required-by-type scalars get neutral structural
 * defaults (documented inline); none of them are scores, ratings or money.
 * When a real column appears, map it here and delete the default.
 */

const API_BASE = 'http://localhost:5001/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** Raw row shape returned by /companies. */
export interface CompanyRow {
  id: string;
  name: string;
  domain?: string | null;
  industry?: string | null;
  size?: string | null;
  revenue?: string | number | null;
  website?: string | null;
  phone?: string | null;
  description?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  zip_code?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * companies.size and EnhancedAccount['accountSize'] have different vocabularies.
 * The DB CHECK allows '1-10','11-50','51-200','201-500','501-1000','1000+',
 * 'unknown'; the TS union expects '1001-5000' and '5000+' instead of '1000+' and
 * has no 'unknown'. Map the overlap and fall back to the smallest bucket for
 * anything unrecognised — the alternative is an invalid value that breaks the
 * size filter silently.
 */
const SIZE_TO_UI: Record<string, EnhancedAccount['accountSize']> = {
  '1-10': '1-10',
  '11-50': '11-50',
  '51-200': '51-200',
  '201-500': '201-500',
  '501-1000': '501-1000',
  '1000+': '1001-5000',
};
const SIZE_TO_DB: Record<string, string> = {
  '1-10': '1-10',
  '11-50': '11-50',
  '51-200': '51-200',
  '201-500': '201-500',
  '501-1000': '501-1000',
  '1001-5000': '1000+',
  '5000+': '1000+',
};

export function mapRowToAccount(row: CompanyRow): EnhancedAccount {
  const revenue = row.revenue == null ? undefined : Number(row.revenue);

  return {
    id: row.id,
    name: row.name,
    industry: row.industry ?? '',
    website: row.website ?? undefined,
    phone: row.phone ?? undefined,
    description: row.description ?? undefined,
    annualRevenue: Number.isFinite(revenue) ? revenue : undefined,
    accountSize: (row.size && SIZE_TO_UI[row.size]) || '1-10',

    // Real address columns.
    billingAddress: {
      street: row.street ?? undefined,
      city: row.city ?? undefined,
      state: row.state ?? undefined,
      country: row.country ?? undefined,
      postalCode: row.zip_code ?? undefined,
    },
    // Deliberately empty, NOT a copy of billing — copying would assert that a
    // shipping address is on file when none is.
    shippingAddress: {},

    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),

    // ── Structural defaults: required by the type, no column behind them ─────
    // Neutral values only. Nothing here is a score, rating, or amount.
    type: 'prospect',
    revenueCurrency: 'USD',
    status: 'active',
    source: 'manual',
    ownerId: '',
    createdBy: '',
    updatedBy: '',
    customFields: {},
    tags: [],
    dataConsent: false,
    doNotContact: false,
    rating: 'warm',
    priority: 'medium',

    // ── Intentionally absent: no data source ────────────────────────────────
    // healthScore, engagementScore, employeeCount, lastActivityDate,
    // relatedContacts, relatedDeals, recentActivities, stats.
    // Leaving them undefined makes the UI render "no data", which is the truth.
    // Do not default these — see the Phase 0 note at the top of this file.
  };
}

/** EnhancedAccount (or a partial) -> the column names /companies expects. */
export function mapAccountToPayload(a: Partial<EnhancedAccount>): Record<string, unknown> {
  const p: Record<string, unknown> = {};
  if (a.name !== undefined)          p.name = a.name;
  if (a.domain !== undefined)        p.domain = a.domain;
  if (a.industry !== undefined)      p.industry = a.industry;
  if (a.accountSize !== undefined)   p.size = SIZE_TO_DB[a.accountSize] ?? 'unknown';
  if (a.annualRevenue !== undefined) p.revenue = a.annualRevenue;
  if (a.website !== undefined)       p.website = a.website;
  if (a.phone !== undefined)         p.phone = a.phone;
  if (a.description !== undefined)   p.description = a.description;
  if (a.billingAddress) {
    p.street = a.billingAddress.street;
    p.city = a.billingAddress.city;
    p.state = a.billingAddress.state;
    p.country = a.billingAddress.country;
    p.zip_code = a.billingAddress.postalCode;
  }
  return p;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: getAuthHeaders(), ...init });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Throw rather than returning [] — a swallowed error is why the broken lead
    // endpoints went unnoticed for so long.
    throw new Error(json.message || `${init?.method ?? 'GET'} ${path} failed (HTTP ${res.status})`);
  }
  return json as T;
}

export async function fetchAccounts(limit = 200): Promise<EnhancedAccount[]> {
  const json = await request<{ success: boolean; data: CompanyRow[] }>(`/companies?limit=${limit}`);
  return (json.data ?? []).map(mapRowToAccount);
}

export async function fetchAccountById(id: string): Promise<EnhancedAccount & { contacts?: unknown[] }> {
  const json = await request<{ success: boolean; data: CompanyRow & { contacts?: unknown[] } }>(
    `/companies/${encodeURIComponent(id)}`,
  );
  return { ...mapRowToAccount(json.data), contacts: json.data.contacts };
}

// The id is generated server-side (companiesController), not here. A client
// computing `max(id) + 1` from its own loaded list collides whenever that list
// is stale or failed to load.
export async function createAccountViaAPI(
  account: Partial<EnhancedAccount>,
): Promise<EnhancedAccount> {
  const json = await request<{ success: boolean; data: CompanyRow }>('/companies', {
    method: 'POST',
    body: JSON.stringify(mapAccountToPayload(account)),
  });
  return mapRowToAccount(json.data);
}

export async function updateAccountViaAPI(
  id: string,
  updates: Partial<EnhancedAccount>,
): Promise<EnhancedAccount> {
  const json = await request<{ success: boolean; data: CompanyRow }>(
    `/companies/${encodeURIComponent(id)}`,
    { method: 'PUT', body: JSON.stringify(mapAccountToPayload(updates)) },
  );
  return mapRowToAccount(json.data);
}

export async function deleteAccountViaAPI(id: string): Promise<void> {
  await request(`/companies/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
