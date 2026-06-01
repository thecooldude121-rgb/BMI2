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
  assigned_to?: string;
  description?: string;
  next_step?: string;
  notes?: string;
  company_name?: string;
  contact_name?: string;
  contact_email?: string;
  contact_title?: string;
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

export async function getDeal(id: string): Promise<{ success: boolean; data: any }> {
  const res = await fetch(`${API_BASE}/deals/${id}`, {
    headers: getAuthHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Deal not found');
  return json;
}