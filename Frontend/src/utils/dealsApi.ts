const API_BASE = 'http://localhost:5001/api/v1';

export async function searchCompanies(query: string): Promise<any[]> {
  if (!query || query.length < 2) return [];
  const res = await fetch(`${API_BASE}/companies?search=${encodeURIComponent(query)}&limit=10`, {
    headers: getAuthHeaders(),
  });
  const json = await res.json();
  return json.success ? json.data : [];
}

export async function searchContacts(query: string): Promise<any[]> {
  if (!query || query.length < 2) return [];
  const res = await fetch(`${API_BASE}/contacts?search=${encodeURIComponent(query)}&limit=10`, {
    headers: getAuthHeaders(),
  });
  const json = await res.json();
  return json.success ? json.data : [];
}

export async function getUsers(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/users`, { headers: getAuthHeaders() });
  const json = await res.json();
  return json.success ? json.data : [];
}

export async function getPipelines(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/pipelines`, { headers: getAuthHeaders() });
  if (!res.ok) return [];
  const json = await res.json();
  return json.success ? json.data : [];
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface DealPayload {
  name: string;
  title?: string;
  lead_id?: number | null;
  value: number;
  currency: string;          // ISO 4217 code e.g. 'AED'
  base_amount_usd: number;   // value converted to USD for reporting
  pipeline_id: string;       // e.g. 'new-business'
  pipeline_name: string;     // e.g. 'New Business'
  deal_type: string;         // e.g. 'upsell' — analytics-friendly enum
  stage: string;
  probability: number;
  expected_close_date?: string;
  close_date_is_past?: boolean;
  close_date_override_reason?: string;
  forecast_category?: string;
  assigned_to?: string;
  description?: string;
  next_step?: string;
  notes?: string;
  company_name?: string;
  contact_name?: string;
  contact_email?: string;
  contact_title?: string;
  competitors?: Array<{
    id: string;
    name: string;
    isCustom: boolean;
  }>;
  // Metadata for files that have been uploaded via the attachment service.
  // Pending/failed files are excluded. When backend upload API is live,
  // this becomes document IDs linked via documents.record_id = dealId.
  attachment_metadata?: Array<{
    name: string;
    size: number;
    type: string;
    url: string;
  }>;
  stakeholders?: Array<{
    id: string;
    name: string;
    email?: string;
    title?: string;
    role: string;
    isPrimary: boolean;
  }>;
  source?: string;
  priority?: string;
  tags?: string[];
  product?: string;
  contract_term?: string;
  payment_terms?: string;
  value_change_reason?: string;
  momentum_score?: string;
  sales_drive_folder?: string;
  agreement_url?: string;
  account_module_setup?: string;
  client_discovers?: string;
  discovery_date?: string;
}

export async function createDeal(payload: DealPayload): Promise<{ success: boolean; data: any }> {
  const res = await fetch(`${API_BASE}/deals`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to create deal');
  return json;
}

export async function updateDeal(id: string, payload: Partial<DealPayload>): Promise<{ success: boolean; data: any }> {
  const res = await fetch(`${API_BASE}/deals/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to update deal');
  return json;
}

/**
 * Fetches all deals from the API.
 *
 * Throws on HTTP errors and network failures so callers can surface a visible
 * error state instead of silently rendering an empty pipeline.
 * Backend excludes is_test records by default (no include_test param needed).
 *
 * @param limit - Max records to return (default 50; use 500+ for roll-up views)
 */
export async function fetchDeals(limit = 50): Promise<any[]> {
  const res = await fetch(`${API_BASE}/deals?limit=${limit}`, { headers: getAuthHeaders() });
  if (!res.ok) {
    throw new Error(`Failed to load deals (HTTP ${res.status})`);
  }
  const json = await res.json();
  return json.success ? json.data : [];
}

export async function getDeal(id: string): Promise<{ success: boolean; data: any }> {
  const res = await fetch(`${API_BASE}/deals/${id}`, {
    headers: getAuthHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Deal not found');
  return json;
}