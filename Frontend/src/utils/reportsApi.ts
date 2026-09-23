/**
 * Saved reports API client — P3 Phase 4.
 *
 *   GET    /reports              list + THE SERVED REGISTRY (modules, fields)
 *   POST   /reports              create
 *   GET    /reports/:id          one
 *   PATCH  /reports/:id          update (owner or an `edit` grant)
 *   DELETE /reports/:id          owner only
 *   POST   /reports/run          run a definition WITHOUT saving it
 *   GET    /reports/:id/run      run a saved one
 *
 * ─── THE CLIENT KEEPS NO VOCABULARY OF ITS OWN ────────────────────────────
 *
 * `GET /reports` returns `modules` and `fields` from the server-side registry,
 * and the builder renders those. It does NOT ship its own list of data sources
 * or groupable columns — the page previously did, and the list had drifted into
 * fiction: it offered "Revenue" (not a module), "HRMS Connection" (a separate
 * product this CRM must never join to) and "Deal Health" (no such column). A
 * picker offering a field the server will refuse is the `hr` drift, and a picker
 * offering a field that does not exist anywhere is worse.
 */

const API_BASE = 'http://localhost:5001/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** Carries the HTTP status so a 409 can be told from a 400. */
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

// ── The definition, mirroring the server's types ──────────────────────────

export type Aggregation = 'count' | 'count_distinct' | 'sum' | 'avg' | 'min' | 'max';
export type Operator =
  | 'eq' | 'ne' | 'in' | 'not_in' | 'gt' | 'gte' | 'lt' | 'lte'
  | 'between' | 'is_null' | 'is_not_null' | 'contains';

export interface ReportDefinition {
  v: number;
  base: string;
  joins?: string[];
  dimensions?: { field: string }[];
  metrics?: { agg: Aggregation; field?: string; label?: string }[];
  filters?: { field: string; op: Operator; value?: unknown }[];
  sort?: { by: string; dir: 'asc' | 'desc' }[];
  limit?: number;
}

/** Must match DEFINITION_VERSION on the server; a mismatch is refused there. */
export const DEFINITION_VERSION = 1;

// ── The served registry ───────────────────────────────────────────────────

export interface RegistryModule { key: string; label: string; joins: string[] }
export interface RegistryField {
  key: string; label: string; type: string; module: string; aggregatable: boolean;
}

export interface ReportAbilities {
  can_view: boolean; can_edit: boolean; can_delete: boolean; can_share: boolean;
}

export interface SavedReport {
  id: string;
  /** True for a report the product ships. Absent on a user's own. */
  is_canned?: boolean;
  /**
   * A structural limitation of the workspace's data that every run will share
   * — distinct from `provenance.disclosure`, which describes one run.
   */
  caveat?: string | null;
  name: string;
  description: string | null;
  category: string | null;
  definition: ReportDefinition;
  owner_id: number | null;
  owner_name: string | null;
  created_at: string;
  updated_at: string;
  abilities: ReportAbilities;
}

export interface ReportsList {
  reports: SavedReport[];
  modules: RegistryModule[];
  fields: RegistryField[];
  grantLevels: string[];
  aggregations: AggregationSpec[];
  operators: OperatorSpec[];
  /** Reports the product ships. Runnable by anyone, editable by nobody. */
  canned: SavedReport[];
}

export async function fetchReports(): Promise<ReportsList> {
  const json = await unwrap(await fetch(`${API_BASE}/reports`, { headers: getAuthHeaders() }));
  return {
    reports: (json.data ?? []) as SavedReport[],
    // Absent means EMPTY, never a local fallback: a picker must offer only what
    // the server will accept, and inventing options is how this page came to
    // offer "HRMS Connection".
    modules: (json.modules ?? []) as RegistryModule[],
    fields: (json.fields ?? []) as RegistryField[],
    grantLevels: (json.grant_levels ?? []) as string[],
    aggregations: (json.aggregations ?? []) as AggregationSpec[],
    operators: (json.operators ?? []) as OperatorSpec[],
    canned: (json.canned ?? []) as SavedReport[],
  };
}

export async function fetchReport(id: string): Promise<SavedReport> {
  const json = await unwrap(await fetch(`${API_BASE}/reports/${encodeURIComponent(id)}`,
    { headers: getAuthHeaders() }));
  return json.data as SavedReport;
}

export interface SaveReportBody {
  name: string;
  description?: string | null;
  category?: string | null;
  definition: ReportDefinition;
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

export async function deleteReport(id: string): Promise<void> {
  await unwrap(await fetch(`${API_BASE}/reports/${encodeURIComponent(id)}`, {
    method: 'DELETE', headers: getAuthHeaders(),
  }));
}

// ── Running, and what a run discloses ─────────────────────────────────────

export interface CoverageEntry {
  /**
   * `join` — base rows that reached a joined module at all.
   * `dimension` — base rows that actually have a value for a grouped field.
   * The second was added in Phase 6; without it a dimension resolved through a
   * support source (`users`) reported no gap while putting 17 of 18 live deals
   * into one unlabelled bucket.
   */
  kind: 'join' | 'dimension';
  key: string;
  label: string;
  matched: number;
  of: number;
}

/**
 * THE NAME OF THE NULL BUCKET. Mirrors `UNATTRIBUTED` in the runner, and it is
 * mirrored ON PURPOSE rather than served: the server already puts this exact
 * string inside the disclosure sentence, so if the two ever disagree the
 * sentence will name a bucket the table does not show — which a test asserts
 * against, rather than leaving it to be noticed.
 */
export const UNATTRIBUTED = 'Not recorded';

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
  /**
   * Currencies the aggregated amounts were drawn from, when a sum or average
   * was taken over money. More than one means the figure adds unlike units and
   * is not a total — this CRM stores no exchange rates, so the server reports
   * the spread rather than resolving it.
   *
   * Null when no money was aggregated, which is NOT the same as one currency.
   */
  currencies: string[] | null;
  truncated: boolean;
  row_limit: number;
  /** Composed server-side. Rendered verbatim — see ProvenanceNote. */
  disclosure: string;
}

export interface ReportRun {
  columns: { key: string; label: string; kind: 'dimension' | 'metric' }[];
  rows: Record<string, unknown>[];
  provenance: Provenance;
  ms: number;
  report?: { id: string; name: string };
}

/** Run a definition without saving it — what the builder's preview calls. */
export async function runDefinition(definition: ReportDefinition): Promise<ReportRun> {
  const json = await unwrap(await fetch(`${API_BASE}/reports/run`, {
    method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ definition }),
  }));
  return json as unknown as ReportRun;
}

/**
 * Run a saved report.
 *
 * Throws `ReportsApiError` with status 409 when the stored definition no longer
 * compiles — the caller did nothing wrong and the report has outlived a registry
 * change. Distinct from 400 (bad input) and 504 (timed out) on purpose.
 */
export async function runSavedReport(id: string): Promise<ReportRun> {
  const json = await unwrap(await fetch(`${API_BASE}/reports/${encodeURIComponent(id)}/run`,
    { headers: getAuthHeaders() }));
  return json as unknown as ReportRun;
}

/**
 * ONLY THE DISPLAY TEXT IS LOCAL. The vocabularies themselves — which
 * aggregations and operators exist, how many values each takes — are SERVED
 * (`GET /reports` returns `aggregations` and `operators`), because this client
 * keeping its own copy of a rule the server enforces is the documented
 * `invitableRolesFor` drift, which in this repo had already silently cost a
 * feature by the time anyone noticed.
 *
 * An id with no label here still renders, labelled with the id — the same
 * choice AccountIntelligencePanel makes for an unrecognised category. The
 * server may add an operator before this file ships again, and showing an
 * unfamiliar word beats dropping the option or mislabelling it as another one.
 */
const AGGREGATION_LABELS: Record<string, string> = {
  count: 'Count of rows',
  count_distinct: 'Count distinct',
  sum: 'Sum',
  avg: 'Average',
  min: 'Minimum',
  max: 'Maximum',
};

const OPERATOR_LABELS: Record<string, string> = {
  eq: 'is',
  ne: 'is not',
  contains: 'contains',
  gt: 'is more than',
  gte: 'is at least',
  lt: 'is less than',
  lte: 'is at most',
  between: 'is between',
  in: 'is any of',
  not_in: 'is none of',
  is_null: 'is empty',
  is_not_null: 'is not empty',
};

export const aggregationLabel = (id: string): string => AGGREGATION_LABELS[id] ?? id;
export const operatorLabel = (id: string): string => OPERATOR_LABELS[id] ?? id;

export type OperatorArity = 0 | 1 | 2 | 'many';
export interface AggregationSpec { id: Aggregation; needs_field: boolean }
export interface OperatorSpec {
  id: Operator;
  arity: OperatorArity;
  /** Field types this operator applies to; `null` means any type. */
  applies_to: string[] | null;
}

/** An operator with no declared restriction applies to every field type. */
export const operatorAppliesTo = (op: OperatorSpec, fieldType: string): boolean =>
  op.applies_to === null || op.applies_to.includes(fieldType);

// ── Sharing ───────────────────────────────────────────────────────────────
//
// Private is the ABSENCE of grants, not a `visibility` column — there is no
// such column, deliberately, so "private" cannot disagree with who actually
// has access. One row per (report, user) holding one level, which is what makes
// edit-without-view unrepresentable rather than merely discouraged.

export interface ReportGrant {
  user_id: number;
  level: GrantLevel;
  name: string | null;
  email: string;
  created_at: string;
}

export type GrantLevel = 'view' | 'edit';

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

export async function setGrant(
  reportId: string, userId: number, level: GrantLevel,
): Promise<void> {
  await unwrap(await fetch(`${API_BASE}/reports/${encodeURIComponent(reportId)}/grants`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ user_id: userId, level }),
  }));
}

export async function revokeGrant(reportId: string, userId: number): Promise<void> {
  await unwrap(await fetch(
    `${API_BASE}/reports/${encodeURIComponent(reportId)}/grants/${userId}`,
    { method: 'DELETE', headers: getAuthHeaders() },
  ));
}

// ── CSV export ────────────────────────────────────────────────────────────
//
// A plain <a href> cannot be used: these endpoints require the Authorization
// header, and a link sends none. So the file is fetched, turned into a blob,
// and handed to a synthetic anchor — which also lets a failure surface as an
// error the page can render instead of a browser tab showing raw JSON.

/**
 * The server names the file (`Content-Disposition`), and this reads that name
 * rather than inventing one, so the CSV a user saves is called what the server
 * says it is. RFC 6266 sends both a plain `filename` and a percent-encoded
 * `filename*`; the starred form wins when present because it survives non-ASCII.
 */
function filenameFrom(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const starred = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (starred) {
    try { return decodeURIComponent(starred[1]); } catch { /* fall through */ }
  }
  const plain = /filename="([^"]+)"/i.exec(header);
  return plain ? plain[1] : fallback;
}

/** Hands a fetched blob to the browser as a download. */
function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoking immediately can cancel the download in some browsers; a tick is
  // enough and the object is released either way.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function downloadCsv(res: Response, fallbackName: string): Promise<void> {
  if (!res.ok) {
    // The error body is JSON even though the success body is a file, so a
    // failed export reports WHY (409 stale, 504 timed out) rather than saving
    // a file containing an error message.
    const json = await res.json().catch(() => ({} as { message?: string }));
    throw new ReportsApiError(json?.message || `Export failed (${res.status})`, res.status);
  }
  saveBlob(
    await res.blob(),
    filenameFrom(res.headers.get('Content-Disposition'), fallbackName),
  );
}

/**
 * The formats a report can be downloaded as.
 *
 * PDF is deliberately absent rather than disabled: it needs a rendering
 * dependency this project has not agreed to add, and an option that cannot
 * work is worse than one that is not offered.
 */
export type ExportFormat = 'csv' | 'xlsx';

export async function exportReport(reportId: string, format: ExportFormat): Promise<void> {
  await downloadCsv(
    await fetch(
      `${API_BASE}/reports/${encodeURIComponent(reportId)}/export.${format}`,
      { headers: getAuthHeaders() },
    ),
    `report.${format}`,
  );
}

export async function exportDefinition(
  definition: ReportDefinition, name: string, format: ExportFormat,
): Promise<void> {
  await downloadCsv(
    await fetch(`${API_BASE}/reports/export.${format}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ definition, name }),
    }),
    `report.${format}`,
  );
}
