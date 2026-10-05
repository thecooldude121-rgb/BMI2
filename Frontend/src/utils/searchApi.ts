/**
 * GET /api/v1/search — the top bar's global search (Group B item 10).
 * THROWS with the server's message on a non-2xx, so the search box can say the
 * search failed instead of showing "No matches" for a request that never ran.
 */
const API_BASE = 'http://localhost:5001/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface SearchGroup<T> { rows: T[]; has_more: boolean }
export interface SearchResults {
  q: string;
  leads: SearchGroup<{ id: number | string; first_name: string | null; last_name: string | null; email: string | null; company: string | null; stage: string | null }>;
  contacts: SearchGroup<{ id: string; first_name: string | null; last_name: string | null; email: string | null; company: string | null }>;
  accounts: SearchGroup<{ id: string; name: string; domain: string | null; industry: string | null }>;
  deals: SearchGroup<{ id: string; name: string | null; company_name: string | null; value: string | number | null; currency: string | null; stage: string | null }>;
}

export const SEARCH_MIN_LENGTH = 2;

export async function searchWorkspace(q: string, signal?: AbortSignal): Promise<SearchResults> {
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}`, { headers: getAuthHeaders(), signal });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || `Search failed (HTTP ${res.status})`);
  return json.data as SearchResults;
}
