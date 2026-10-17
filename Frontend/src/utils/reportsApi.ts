/**
 * Saved reports API client — reports replay step e (P3 Phases 4-5, trimmed to
 * what Report Detail needs; the builder's vocabularies arrive with step f).
 *
 *   GET    /reports                 list (the caller's own, shared, and — for an
 *                                   admin — ownerless reports) + THE SERVED REGISTRY
 *   POST   /reports                 create (status 'draft' or 'saved')
 *   PATCH  /reports/:id             update (owner or an edit grant); draft -> saved only
 *   POST   /reports/run             run a definition WITHOUT saving it (builder preview)
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

import { API_BASE } from '../config/backend';

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

export type Aggregation = 'count' | 'count_distinct' | 'sum' | 'avg' | 'min' | 'max';
export type Operator =
  | 'eq' | 'ne' | 'in' | 'not_in' | 'gt' | 'gte' | 'lt' | 'lte'
  | 'between' | 'is_null' | 'is_not_null' | 'contains';

export interface ReportDefinition {
  v: number;
  base: string;
  joins?: string[];
  dimensions?: { field: string }[];
  metrics?: { agg: Aggregation | string; field?: string; label?: string }[];
  filters?: { field: string; op: Operator | string; value?: unknown }[];
  /** `by` is a breakdown's field key, or `metric:N` for the Nth measure. */
  sort?: { by: string; dir: 'asc' | 'desc' }[];
  limit?: number;
}

/** Must match DEFINITION_VERSION on the server; a mismatch is refused there. */
export const DEFINITION_VERSION = 1;

/** The server caps every result at this many rows (MAX_ROWS). */
export const MAX_ROWS = 5000;

/** The columns' own limits; the server answers 400 past them. */
export const NAME_MAX = 255;
export const CATEGORY_MAX = 100;

export type ReportStatus = 'draft' | 'saved';

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
  /** A draft is private to its owner and cannot be shared until saved (072). */
  status: ReportStatus;
  abilities: ReportAbilities;
}

export async function fetchReports(): Promise<SavedReport[]> {
  const json = await unwrap(await fetch(`${API_BASE}/reports`, { headers: getAuthHeaders() }));
  return (json.data ?? []) as SavedReport[];
}

// ── The served registry (what the builder may offer) ──────────────────────
//
// Modules, fields, aggregations and operators all come from GET /reports. The
// builder keeps NO vocabulary of its own: the old page offered "Revenue" (not a
// module), "Deal Health" (no such column) and an "HRMS Connection" grouping (a
// separate product). Absent means EMPTY, never a local fallback.

export interface RegistryModule { key: string; label: string; joins: string[] }
export interface RegistryField {
  key: string; label: string; type: string; module: string; aggregatable: boolean;
}
export type OperatorArity = 0 | 1 | 2 | 'many';
export interface AggregationSpec { id: Aggregation; needs_field: boolean }
export interface OperatorSpec {
  id: Operator;
  arity: OperatorArity;
  /** Field types this operator applies to; `null` means any type. */
  applies_to: string[] | null;
}

export interface ReportRegistry {
  reports: SavedReport[];
  modules: RegistryModule[];
  fields: RegistryField[];
  aggregations: AggregationSpec[];
  operators: OperatorSpec[];
}

export async function fetchRegistry(): Promise<ReportRegistry> {
  const json = await unwrap(await fetch(`${API_BASE}/reports`, { headers: getAuthHeaders() }));
  return {
    reports: (json.data ?? []) as SavedReport[],
    modules: (json.modules ?? []) as RegistryModule[],
    fields: (json.fields ?? []) as RegistryField[],
    aggregations: (json.aggregations ?? []) as AggregationSpec[],
    operators: (json.operators ?? []) as OperatorSpec[],
  };
}

/** An operator with no declared restriction applies to every field type. */
export const operatorAppliesTo = (op: OperatorSpec, fieldType: string): boolean =>
  op.applies_to === null || op.applies_to.includes(fieldType);

/**
 * ONLY THE DISPLAY TEXT IS LOCAL. Which aggregations and operators exist, and
 * how many values each takes, is served. An id with no label still renders,
 * labelled with the id, rather than being dropped or mislabelled.
 */
const AGGREGATION_LABELS: Record<string, string> = {
  count: 'Count of rows', count_distinct: 'Count distinct', sum: 'Sum', avg: 'Average', min: 'Minimum', max: 'Maximum',
};
const OPERATOR_LABELS: Record<string, string> = {
  eq: 'is', ne: 'is not', contains: 'contains', gt: 'is more than', gte: 'is at least',
  lt: 'is less than', lte: 'is at most', between: 'is between', in: 'is any of', not_in: 'is none of',
  is_null: 'is empty', is_not_null: 'is not empty',
};
export const aggregationLabel = (id: string): string => AGGREGATION_LABELS[id] ?? id;
export const operatorLabel = (id: string): string => OPERATOR_LABELS[id] ?? id;

export interface SaveReportBody {
  name: string;
  description?: string | null;
  category?: string | null;
  definition: ReportDefinition;
  status?: ReportStatus;
}

export async function createReport(body: SaveReportBody): Promise<SavedReport> {
  const json = await unwrap(await fetch(`${API_BASE}/reports`, {
    method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(body),
  }));
  return json.data as SavedReport;
}

export async function updateReport(id: string, body: Partial<SaveReportBody>): Promise<SavedReport> {
  const json = await unwrap(await fetch(`${API_BASE}/reports/${encodeURIComponent(id)}`, {
    method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify(body),
  }));
  return json.data as SavedReport;
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

/** Run a definition without saving it — the builder's preview. 400 for a bad definition. */
export async function runDefinition(definition: ReportDefinition): Promise<ReportRun> {
  const json = await unwrap(await fetch(`${API_BASE}/reports/run`, {
    method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ definition }),
  }));
  return json as unknown as ReportRun;
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
