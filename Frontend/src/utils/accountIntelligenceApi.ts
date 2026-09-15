const API_BASE = 'http://localhost:5001/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** One signal Lead Gen has recorded against a company domain. */
export interface AccountSignal {
  id: string;
  source: string | null;
  /** hiring | funding | tech_change | exec_move | news, per Lead Gen's vocabulary. */
  category: string | null;
  headline: string;
  url: string | null;
  published_at: string | null;
}

/**
 * The four states are deliberately distinct, and the panel renders each
 * differently.
 *
 *   ok          — asked and answered. `signals` may legitimately be empty.
 *   not_linked  — no Lead Gen connection for this workspace. NOT "no signals".
 *   no_domain   — this account has no domain, so there is nothing to ask about.
 *   error       — the call failed. NOT "no signals" either.
 *
 * Collapsing any of these into an empty list is the exact failure this page has
 * a long comment about: an absence that looks like a fact.
 */
export type AccountIntelligence =
  | { status: 'ok'; signals: AccountSignal[]; company_domain?: string }
  | { status: 'not_linked'; signals: [] }
  | { status: 'no_domain'; signals: [] }
  | { status: 'error'; signals: []; message?: string };

/**
 * Throws on transport failure rather than returning an empty result, so the
 * caller's error state is what renders. Returning [] here would make a broken
 * request indistinguishable from an account nobody has published news about.
 */
export async function fetchAccountIntelligence(companyId: string): Promise<AccountIntelligence> {
  const res = await fetch(
    `${API_BASE}/companies/${encodeURIComponent(companyId)}/account-intelligence`,
    { headers: getAuthHeaders() },
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.message || `Failed to load account intelligence (HTTP ${res.status})`);
  }
  return json.data as AccountIntelligence;
}
