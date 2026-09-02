/**
 * CSV import API client for contacts and accounts.
 *
 * WHY BOTH LIVE IN ONE MODULE rather than in contactsApi/accountsApi: they
 * share a result contract, and CsvImportPanel consumes them through one
 * signature. Splitting them would duplicate ImportSummary in two files, which
 * is how two copies of a shape drift apart.
 *
 * WHY THE SERVER DOES THE INSERTING rather than the browser looping over POSTs:
 * duplicate detection has to see the whole workspace. fetchContacts caps at 200
 * rows, so a client-side duplicate check would silently miss duplicates for any
 * customer with more contacts than that — reporting a clean import that quietly
 * did not happen. The server checks against every row, inside the same
 * transaction that does the inserting, so "already exists" and "appears twice in
 * your file" cannot disagree.
 */

const API_BASE = 'http://localhost:5001/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export type RowStatus = 'created' | 'skipped' | 'failed';

export interface RowResult {
  /** Index into the rows posted, which is the CSV data row order. */
  index: number;
  status: RowStatus;
  id?: string;
  /** Why it was skipped or failed. Present for everything but 'created'. */
  reason?: string;
  /** Imported, but not exactly as written — e.g. an account name that matched nothing. */
  warnings?: string[];
}

export interface ImportSummary {
  dry_run: boolean;
  total: number;
  created: number;
  skipped: number;
  failed: number;
  rows: RowResult[];
}

/** Rows per request, mirroring MAX_IMPORT_ROWS in the backend. */
export const MAX_IMPORT_ROWS = 500;

async function postImport(
  path: string,
  rows: Record<string, unknown>[],
  dryRun: boolean,
): Promise<ImportSummary> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ rows, dry_run: dryRun }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Throwing rather than returning an empty summary: a request that failed
    // must never be presentable as an import where nothing happened to succeed.
    throw new Error(json.message || `POST ${path} failed (HTTP ${res.status})`);
  }
  return json.data as ImportSummary;
}

export function importContactsViaAPI(
  rows: Record<string, unknown>[],
  dryRun: boolean,
): Promise<ImportSummary> {
  return postImport('/contacts/import', rows, dryRun);
}

export function importAccountsViaAPI(
  rows: Record<string, unknown>[],
  dryRun: boolean,
): Promise<ImportSummary> {
  return postImport('/companies/import', rows, dryRun);
}

/**
 * Merge the summaries of several chunked requests into one.
 *
 * A file larger than MAX_IMPORT_ROWS is sent in batches, and the user must see
 * one report over the whole file, with indexes still pointing at their original
 * rows. Each chunk's indexes are local to that chunk, so they are shifted here.
 */
export function mergeSummaries(parts: ImportSummary[], chunkSize: number): ImportSummary {
  const rows: RowResult[] = [];
  parts.forEach((part, chunk) => {
    for (const r of part.rows) rows.push({ ...r, index: r.index + chunk * chunkSize });
  });
  return {
    dry_run: parts.every(p => p.dry_run),
    total: parts.reduce((n, p) => n + p.total, 0),
    created: parts.reduce((n, p) => n + p.created, 0),
    skipped: parts.reduce((n, p) => n + p.skipped, 0),
    failed: parts.reduce((n, p) => n + p.failed, 0),
    rows,
  };
}
