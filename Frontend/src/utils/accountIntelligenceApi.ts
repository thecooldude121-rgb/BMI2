/**
 * Account intelligence client — Capability 5.
 *
 * ─── THIS PATH EXISTS TWICE, ON PURPOSE ────────────────────────────────────
 *
 * A file with this same name and a REAL Lead Gen implementation behind it lives
 * on `feature/lead-gen-account-intelligence`. The collision is deliberate: when
 * the two branches meet, git will conflict here and force somebody to choose,
 * which is the outcome we want. Two account-intelligence clients coexisting
 * quietly — one real, one sample — is the failure mode worth a merge conflict
 * to prevent. See the "Account intelligence" entry in CLAUDE.md.
 *
 * WHAT THIS CALLS: the CRM's own backend, never a provider directly. The
 * browser has no business holding a partner API key, and resolving the company
 * server-side is what confines the lookup to domains the caller's own workspace
 * already holds.
 */

const API_BASE = 'http://localhost:5001/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const SIGNAL_CATEGORIES = ['hiring', 'funding', 'tech_change', 'exec_move', 'news'] as const;
export type SignalCategory = (typeof SIGNAL_CATEGORIES)[number];

export interface AccountSignal {
  category: SignalCategory;
  headline: string;
  summary: string;
  /** Null from the mock provider — see its header for why that is the point. */
  source: string | null;
  url: string | null;
  published_at: string | null;
}

/**
 * The server's four outcomes, preserved as four. Collapsing them into
 * `signals: []` is how "we could not ask" becomes "there is nothing to find".
 */
export interface AccountIntelligence {
  status: 'ok' | 'error' | 'no_domain';
  company_domain: string | null;
  provider: string;
  /**
   * Whether these rows are sample content. Read from the payload, NEVER
   * inferred from `provider === 'mock'`: a future provider must declare it, and
   * a client that guesses would render the next placeholder as real.
   */
  preview: boolean;
  preview_note: string | null;
  signals: AccountSignal[];
  detail?: string;
}

/**
 * Failures are RETURNED as a value, not thrown — matching the backend provider
 * contract and the other branch. The account page must render even when this
 * panel cannot.
 */
export async function fetchAccountIntelligence(
  companyId: string,
): Promise<{ ok: true; data: AccountIntelligence } | { ok: false; detail: string }> {
  try {
    const res = await fetch(
      `${API_BASE}/companies/${encodeURIComponent(companyId)}/intelligence`,
      { headers: getAuthHeaders() },
    );
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, detail: json?.message || `Request failed (${res.status})` };
    }
    return { ok: true, data: json.data as AccountIntelligence };
  } catch {
    return { ok: false, detail: 'Could not reach the server.' };
  }
}
