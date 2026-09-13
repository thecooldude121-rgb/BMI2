/**
 * The industry vocabulary, as SERVED by GET /companies/industries (migration 045).
 *
 * There is deliberately no hardcoded fallback list here. The client used to
 * keep its own lists — AccountFormPage had 16 values, CompanyForm a different
 * 10 — and they drifted from each other and from the data. If the request
 * fails, callers show that the list could not be loaded; they do not
 * substitute a guess the server might refuse.
 */

const API_BASE = 'http://localhost:5001/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchIndustries(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/companies/industries`, { headers: getAuthHeaders() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !Array.isArray(json?.data)) {
    throw new Error(json?.message || `Could not load the industry list (HTTP ${res.status})`);
  }
  return json.data as string[];
}
