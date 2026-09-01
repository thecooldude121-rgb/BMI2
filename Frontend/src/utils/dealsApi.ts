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
  // Was `return []`, the only swallow left in this file: a failed request and a
  // workspace with no pipelines produced the same value, and "no pipelines" is a
  // claim about the data, not about the request.
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.message || `Failed to load pipelines (HTTP ${res.status})`);
  }
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
  platform_fee?: number | null;
  custom_fee?: number | null;
  license_fee?: number | null;
  onboarding_fee?: number | null;
  white_labelling_fee?: number | null;
  exchange_rate?: number | null;
  nr_margin?: number | null;
  start_date?: string | null;
  contract_end_date?: string | null;
  country?: string | null;
  account_industry?: string | null;
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

/**
 * Move a deal to a new stage.
 *
 * Stage changes go through their own endpoint, not updateDeal: every move writes
 * a deal_stage_history row, and the server derives the probability from the
 * pipeline stage's default unless `probability` is passed explicitly (in which
 * case the override is recorded as such). Sending `stage` via updateDeal would
 * change the column without any of that, so don't.
 */
export async function transitionDealStage(
  id: string,
  toStage: string,
  opts: { probability?: number; reasonCode?: string; note?: string } = {},
): Promise<{ success: boolean; data: any; message?: string }> {
  const res = await fetch(`${API_BASE}/deals/${id}/stage-transition`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      to_stage: toStage,
      probability: opts.probability,
      reason_code: opts.reasonCode,
      note: opts.note,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to move deal');
  return json;
}

export type BulkDealAction = 'stage' | 'owner' | 'tag' | 'archive' | 'unarchive' | 'delete';

export interface BulkDealResult {
  success: boolean;
  action: BulkDealAction;
  /** How many deals actually changed. */
  affected: number;
  requested: number;
  /** Ids that are not in this tenant — reported, not treated as a failure. */
  not_found: string[];
  /** Present only when affected !== requested; already phrased for the user. */
  message?: string;
}

/**
 * Apply one action to many deals in a single server-side transaction.
 *
 * Not N requests from the browser: 40 independent calls can half-succeed with
 * no way to report which ones did. The server either applies the batch or rolls
 * it back, and reports exactly what changed.
 *
 * A 'stage' action writes deal_stage_history per deal, so a bulk move is as
 * auditable as an individual one.
 */
export async function bulkUpdateDeals(
  action: BulkDealAction,
  dealIds: string[],
  payload?: { stage?: string; owner?: string; tag?: string },
): Promise<BulkDealResult> {
  const res = await fetch(`${API_BASE}/deals/bulk`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ action, deal_ids: dealIds, payload }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || `Bulk ${action} failed`);
  return json;
}

export interface DealStageHistoryEntry {
  id: string;
  from_stage: string | null;
  to_stage: string;
  probability: number | null;
  probability_override: boolean;
  reason_code: string | null;
  note: string | null;
  changed_by: string | null;
  changed_at: string;
}

export async function fetchDealStageHistory(id: string): Promise<DealStageHistoryEntry[]> {
  const res = await fetch(`${API_BASE}/deals/${id}/stage-history`, { headers: getAuthHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to load stage history');
  return json.data ?? [];
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

/** The subset of a deal row the contact and account pages render. */
export interface RelatedDeal {
  id: string;
  name: string;
  value: number | string | null;
  stage: string | null;
  probability: number | null;
  expected_close_date: string | null;
  assigned_to: string | null;
  contact_email: string | null;
  company_name: string | null;
  /** The real account link (migration 027). Null on 22 of 25 deals today. */
  company_id: string | null;
}

/**
 * Deals belonging to a contact, matched on `deals.contact_email`.
 *
 * That text column is the ONLY link deals carry to a contact — the table has no
 * contact_id (see the note in getDeals). So this is a genuine read of a weak
 * link, not a guess, and the caller must SAY it is matched by email rather than
 * implying a hard relationship.
 *
 * Throws on failure. Returning [] would render "no deals" for a contact who has
 * them, which is the same class of untruth as inventing one.
 */
export async function fetchDealsForContact(email: string): Promise<RelatedDeal[]> {
  if (!email) return [];
  const res = await fetch(
    `${API_BASE}/deals?contact_email=${encodeURIComponent(email)}&limit=50`,
    { headers: getAuthHeaders() },
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || `Failed to load deals (HTTP ${res.status})`);
  return (json.data ?? []) as RelatedDeal[];
}

/**
 * Deals belonging to an account, by the REAL foreign key (migration 027).
 *
 * Contrast fetchDealsForContact above, which matches a free-text email because
 * deals has no contact_id. This one is an id comparison against
 * deals_company_id_fkey, so it cannot match the wrong account or miss one
 * through a spelling difference.
 *
 * IT WILL LEGITIMATELY RETURN []. 22 of 25 deals carry no company_id, because
 * the column is new and the link is a user's to make: 15 deals have no company
 * name at all and 7 name a company that has no row. An empty result here means
 * "no deals are linked to this account", which the caller must say plainly —
 * not "this account has no deals".
 *
 * Throws on failure rather than returning [], so a broken request cannot be
 * displayed as an account with no pipeline.
 */
export async function fetchDealsForAccount(companyId: string): Promise<RelatedDeal[]> {
  if (!companyId) return [];
  const res = await fetch(
    `${API_BASE}/deals?company_id=${encodeURIComponent(companyId)}&limit=200`,
    { headers: getAuthHeaders() },
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || `Failed to load deals (HTTP ${res.status})`);
  return (json.data ?? []) as RelatedDeal[];
}

export async function getDeal(id: string): Promise<{ success: boolean; data: any }> {
  const res = await fetch(`${API_BASE}/deals/${id}`, {
    headers: getAuthHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Deal not found');
  return json;
}