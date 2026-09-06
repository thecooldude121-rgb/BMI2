/**
 * Workspace settings API client.
 *
 * Backs the workspace half of Settings against
 * `Backend/src/routes/workspace.ts`. Two endpoints, no `:id` on either — the
 * server derives scope from the token and there is no shape in which a client
 * can name another workspace, so nothing here takes a workspace id.
 *
 * KEY ON `id`, NOT `slug`. The slug is editable here and appears in the login
 * workspace picker; the id never changes. Anything that caches or routes by
 * workspace must use the id.
 *
 * WHAT THE SERVER ACTUALLY STORES: `tenants.name`, `tenants.slug`, and
 * `timezone` / `default_currency` inside `tenants.settings` (migration 035).
 * That is all. The date/time/week/fiscal-year preferences in the Settings UI
 * have no column and are NOT sent from here — `updateWorkspace` ignores
 * unrecognised body fields, so posting them would report success and save
 * nothing. They are labelled in the UI instead.
 */

const API_BASE = 'http://localhost:5001/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** Exactly what GET /workspace returns. Unset settings come back as null. */
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  /** null when the workspace has not chosen one — not defaulted to UTC. */
  timezone: string | null;
  /** null when unset. Drives the currency of newly created deals when set. */
  default_currency: string | null;
  created_at: string;
  updated_at: string | null;
}

/** Only these four are writable. Omit a field to leave it unchanged. */
export interface WorkspaceUpdate {
  name?: string;
  slug?: string;
  /** null clears it. */
  timezone?: string | null;
  /** null clears it. */
  default_currency?: string | null;
}

/**
 * The server's message is thrown verbatim so the user sees the real reason —
 * "slug must be lowercase letters, numbers and single hyphens", "That slug is
 * already taken by another workspace" — rather than a generic failure. That is
 * the whole point of the backend returning clean 400s and 409s instead of
 * masked 500s.
 */
async function unwrap<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.message || `Request failed (${res.status})`);
  }
  return json.data as T;
}

export async function fetchWorkspace(): Promise<Workspace> {
  const res = await fetch(`${API_BASE}/workspace`, { headers: getAuthHeaders() });
  return unwrap<Workspace>(res);
}

/** Requires an admin or manager. A sales user gets 403 with a real message. */
export async function updateWorkspace(updates: WorkspaceUpdate): Promise<Workspace> {
  const res = await fetch(`${API_BASE}/workspace`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  return unwrap<Workspace>(res);
}

/**
 * Currencies offered in the UI.
 *
 * The server accepts any three-letter ISO 4217 code, so this list is a
 * convenience, not a constraint. It leads with the currencies of this product's
 * stated markets — India, the Middle East and Africa per CLAUDE.md — because a
 * list that starts at USD/EUR/GBP makes the common case the awkward one.
 */
export const CURRENCY_OPTIONS: Array<{ code: string; label: string }> = [
  { code: 'INR', label: 'INR — Indian Rupee (₹)' },
  { code: 'AED', label: 'AED — UAE Dirham (د.إ)' },
  { code: 'SAR', label: 'SAR — Saudi Riyal (﷼)' },
  { code: 'ZAR', label: 'ZAR — South African Rand (R)' },
  { code: 'KES', label: 'KES — Kenyan Shilling (KSh)' },
  { code: 'NGN', label: 'NGN — Nigerian Naira (₦)' },
  { code: 'USD', label: 'USD — US Dollar ($)' },
  { code: 'EUR', label: 'EUR — Euro (€)' },
  { code: 'GBP', label: 'GBP — Pound Sterling (£)' },
  { code: 'JPY', label: 'JPY — Japanese Yen (¥)' },
];

/**
 * Timezones offered in the UI.
 *
 * Asked of the platform rather than hardcoded, so the list cannot drift from
 * what the server accepts — the server validates by constructing an
 * Intl.DateTimeFormat, which is the same source of truth. Falls back to a small
 * curated set on a runtime without `supportedValuesOf` (Safari < 15.4), which
 * is a reduced list rather than a wrong one.
 */
export function timezoneOptions(current?: string | null): string[] {
  const withValues = Intl as unknown as { supportedValuesOf?: (k: string) => string[] };
  let zones: string[] = [];
  if (typeof withValues.supportedValuesOf === 'function') {
    try {
      zones = withValues.supportedValuesOf('timeZone');
    } catch {
      /* fall through to the curated list */
    }
  }
  if (!zones.length) {
    zones = [
      'UTC', 'Asia/Kolkata', 'Asia/Dubai', 'Asia/Riyadh', 'Africa/Lagos',
      'Africa/Nairobi', 'Africa/Johannesburg', 'Europe/London', 'Europe/Berlin',
      'America/New_York', 'America/Los_Angeles',
    ];
  }

  // THE STORED VALUE IS ALWAYS AN OPTION, and this is not defensive padding —
  // it fixes a real mismatch. `supportedValuesOf` returns CANONICAL zone names
  // only: it lists `Asia/Calcutta` and omits `Asia/Kolkata`, even though
  // `Intl.DateTimeFormat` accepts both and the server validates with exactly
  // that. So a workspace whose timezone is the alias — the spelling people
  // actually write, and one the API accepts — would find no matching <option>
  // and the select would render as "Not set" for a value that IS set. Merging
  // the current value in means the UI always shows what the server stores.
  if (current && !zones.includes(current)) {
    return [current, ...zones];
  }
  return zones;
}

/** The browser's own zone, offered as the default when none is set. */
export function detectedTimezone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}
