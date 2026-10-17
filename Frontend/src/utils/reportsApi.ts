/**
 * Saved reports API client — reports replay step e (P3 Phases 4-5, trimmed to
 * what Report Detail needs; the builder's vocabularies arrive with step f).
 *
 *   GET    /reports                 list (the caller's own, shared, and — for an
 *                                   admin — ownerless reports)
 *   GET    /reports/:id             one
 *   DELETE /reports/:id             owner, or an admin on an ownerless report
 *   GET    /reports/:id/run         run a saved one, with provenance
 *   GET    /reports/:id/grants      who it is shared with
 *   PUT    /reports/:id/grants      share (owner only)
 *   DELETE /reports/:id/grants/:u   unshare (owner only)
 *
 * Anything the caller may not see is a 404 from the server, never a 403 — so
 * "doesn't exist" and "isn't shared with you" are one state here too.
 */

const API_BASE = 'http://localhost:5001/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** Carries the HTTP status so a 404, a 409, a 503 and a 504 can be told apart. */
export class ReportsApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ReportsApiError';
  }
}

async function unwrap(res: Response): Promise<Record<string, unknown>> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ReportsApiError(json?.message || `Request failed (${res.status})`, res.status);
  return json;
}

/** A saved report id is a UUID. An old `/crm/reports/<slug>` address is not one. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isReportId = (s: string | undefined): s is string => !!s && UUID.test(s);

export interface ReportDefinition {
  v: number;
  base: string;
  joins?: string[];
  dimensions?: { field: string }[];
  metrics?: { agg: string; field?: string; label?: string }[];
  filters?: { field: string; op: string; value?: unknown }[];
  sort?: { by: string; dir: 'asc' | 'desc' }[];
  limit?: number;
}

/** Served by the server (`abilitiesFor`); the client never re-derives them. */
export interface ReportAbilities {
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_share: boolean;
  can_transfer: boolean;
}

export interface SavedReport {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  definition: ReportDefinition;
  owner_id: number | null;
  owner_name: string | null;
  created_at: string;
  updated_at: string;
  /** No owner, or the owner is deactivated (step c). */
  ownerless: boolean;
  abilities: ReportAbilities;
}

export async function fetchReports(): Promise<SavedReport[]> {
  const json = await unwrap(await fetch(`${API_BASE}/reports`, { headers: getAuthHeaders() }));
  return (json.data ?? []) as SavedReport[];
}

export async function fetchReport(id: string): Promise<SavedReport> {
  const json = await unwrap(await fetch(`${API_BASE}/reports/${encodeURIComponent(id)}`,
    { headers: getAuthHeaders() }));
  return json.data as SavedReport;
}

export async function deleteReport(id: string): Promise<void> {
  await unwrap(await fetch(`${API_BASE}/reports/${encodeURIComponent(id)}`, {
    method: 'DELETE', headers: getAuthHeaders(),
  }));
}

// ── Running, and what a run discloses (step d) ────────────────────────────

export interface CoverageEntry { join: string; label: string; matched: number; of: number }

export interface Provenance {
  rows_returned: number;
  rows_matched: number;
  /** NULL means NOT MEASURED. It does not mean zero, and must not render as 0. */
  rows_seeded: number | null;
  rows_real: number | null;
  seeded_share: number | null;
  mostly_seeded: boolean;
  excluded_test: number;
  coverage: CoverageEntry[];
  truncated: boolean;
  row_limit: number;
  /** Composed server-side. Rendered verbatim. */
  disclosure: string;
}

export interface ReportRun {
  columns: { key: string; label: string; kind: 'dimension' | 'metric' }[];
  rows: Record<string, unknown>[];
  provenance: Provenance;
  ms: number;
  report?: { id: string; name: string };
}

/**
 * Throws `ReportsApiError` — 404 (absent, or not yours), 409 (the stored
 * definition no longer compiles), 503 (reports unavailable, nothing run),
 * 504 (timed out).
 */
export async function runSavedReport(id: string): Promise<ReportRun> {
  const json = await unwrap(await fetch(`${API_BASE}/reports/${encodeURIComponent(id)}/run`,
    { headers: getAuthHeaders() }));
  return json as unknown as ReportRun;
}

// ── Sharing ───────────────────────────────────────────────────────────────
//
// Private is the ABSENCE of grants — there is no visibility column, so
// "private" cannot disagree with who actually has access.

export type GrantLevel = 'view' | 'edit';

export interface ReportGrant {
  user_id: number;
  level: GrantLevel;
  name: string | null;
  email: string;
  created_at: string;
}

export async function fetchGrants(
  reportId: string,
): Promise<{ grants: ReportGrant[]; grantLevels: GrantLevel[] }> {
  const json = await unwrap(await fetch(
    `${API_BASE}/reports/${encodeURIComponent(reportId)}/grants`,
    { headers: getAuthHeaders() },
  ));
  return {
    grants: (json.data ?? []) as ReportGrant[],
    grantLevels: (json.grant_levels ?? []) as GrantLevel[],
  };
}

export async function setGrant(reportId: string, userId: number, level: GrantLevel): Promise<void> {
  await unwrap(await fetch(`${API_BASE}/reports/${encodeURIComponent(reportId)}/grants`, {
    method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ user_id: userId, level }),
  }));
}

export async function revokeGrant(reportId: string, userId: number): Promise<void> {
  await unwrap(await fetch(
    `${API_BASE}/reports/${encodeURIComponent(reportId)}/grants/${userId}`,
    { method: 'DELETE', headers: getAuthHeaders() },
  ));
}

/** "Shared with 1 person" / "Shared with 3 people" / "Not shared". */
export const sharedWithLabel = (n: number): string =>
  n === 0 ? 'Not shared' : `Shared with ${n} ${n === 1 ? 'person' : 'people'}`;

// ── Ownerless reports: admin transfer (step c's endpoints) ────────────────
//
// Only a workspace admin, only on an OWNERLESS report (no owner, or a
// deactivated one). Anyone else, or an admin while the owner is active, gets
// 404. The candidates are active members of this workspace only, and the
// server re-checks the choice (400 otherwise). Every transfer is recorded.

export interface TransferCandidate { id: number; name: string | null; email: string }

export interface TransferRecord {
  from_user_id: number | null;
  from_user_name: string | null;
  to_user_id: number;
  to_user_name: string;
  transferred_by: number;
  transferred_by_name: string;
  transferred_at: string;
}

export async function fetchTransferCandidates(reportId: string): Promise<TransferCandidate[]> {
  const json = await unwrap(await fetch(
    `${API_BASE}/reports/${encodeURIComponent(reportId)}/transfer-candidates`,
    { headers: getAuthHeaders() },
  ));
  return (json.data ?? []) as TransferCandidate[];
}

export async function transferReport(
  reportId: string, toUserId: number,
): Promise<{ report: SavedReport; transfer: TransferRecord }> {
  const json = await unwrap(await fetch(`${API_BASE}/reports/${encodeURIComponent(reportId)}/transfer`, {
    method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ to_user_id: toUserId }),
  }));
  return { report: json.data as SavedReport, transfer: json.transfer as TransferRecord };
}
