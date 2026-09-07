/**
 * Documents, against `Backend/src/routes/documents.ts`.
 *
 * WHAT THE SERVER ACTUALLY STORES on `documents`, in full — there are
 * seventeen columns and this is all of them:
 *
 *   id, name, file_url, file_size, file_type, module, record_id, version,
 *   tags, uploaded_by, created_at, tenant_id, category, description,
 *   updated_at, storage_key, checksum_sha256
 *
 * `GET /documents/:id` returns `d.*` plus a computed `is_starred` from the
 * `document_favorites` table. Nothing else exists.
 *
 * WHAT DOES NOT EXIST, and is therefore not in the type below and not rendered:
 * `access_count`, `download_count`, `last_accessed_at`, `visibility`, `status`,
 * `owner_name`, `subcategory`, `folder_id`, `related_entity_type`,
 * `related_entity_id`, `ai_generated`, `source`, `source_detail`. The detail
 * page invented a value for every one of them — including per-document access
 * and download counts, which read as an audit trail of who opened a file.
 *
 * Two of those absences are naming mismatches rather than missing data, and
 * they are the kind that fail silently: the page read `uploaded_at` (the column
 * is `created_at`) and `format` (the column is `file_type`). Same shape as the
 * `address` / `billingAddress` and `close_date` / `expected_close_date` drift
 * already recorded in CLAUDE.md.
 *
 * `file_size` and `version` ARE real columns and ARE kept, despite appearing on
 * a list of fields to delete — dropping them would have removed real data.
 */

const API_BASE = 'http://localhost:5001/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** Exactly what GET /documents/:id returns. Nullable columns come back as null. */
export interface DocumentRecord {
  id: string;
  /** NOT NULL on the table. */
  name: string;
  file_url: string | null;
  /** Bytes. Null when unrecorded — render nothing rather than "0 B". */
  file_size: number | string | null;
  file_type: string | null;
  /** Which module the document hangs off ('deals', 'contacts', …). */
  module: string | null;
  /** The id within that module. Free-text, with no foreign key behind it. */
  record_id: string | null;
  version: number | null;
  /** jsonb on the table, so an array or null — never a comma-joined string. */
  tags: string[] | null;
  /** A NAME string, not a user id. Null when unrecorded. */
  uploaded_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  category: string | null;
  description: string | null;
  storage_key: string | null;
  checksum_sha256: string | null;
  /** Computed by the server from document_favorites for the calling user. */
  is_starred?: boolean;
}

export type DocumentFetch =
  | { ok: true; document: DocumentRecord }
  | { ok: false; notFound: boolean; message: string };

/**
 * One document, or a typed failure.
 *
 * NOT-FOUND IS DISTINGUISHED FROM FAILED, deliberately. The table holds zero
 * rows today, so 404 is the expected answer for every id — and "this document
 * does not exist" needs to render differently from "we could not reach the
 * server". Collapsing them is how an outage gets shown as an empty state.
 */
export async function fetchDocument(id: string): Promise<DocumentFetch> {
  try {
    const res = await fetch(`${API_BASE}/documents/${encodeURIComponent(id)}`, {
      headers: getAuthHeaders(),
    });
    if (res.status === 404) {
      return { ok: false, notFound: true, message: 'Document not found' };
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return {
        ok: false,
        notFound: false,
        message: body.message || `Could not load this document (${res.status}).`,
      };
    }
    const json = await res.json();
    const data = json?.data;
    if (!data) {
      return { ok: false, notFound: false, message: 'The server returned no document.' };
    }
    return { ok: true, document: data as DocumentRecord };
  } catch {
    // A network failure is not a missing document, and must not be shown as one.
    return {
      ok: false,
      notFound: false,
      message: 'Could not reach the server. Check your connection and try again.',
    };
  }
}

/** PUT /documents/:id. Only fields the table actually has are accepted. */
export async function updateDocument(
  id: string,
  patch: Partial<Pick<DocumentRecord, 'name' | 'description' | 'category' | 'tags'>>,
): Promise<{ ok: boolean; message?: string }> {
  try {
    const res = await fetch(`${API_BASE}/documents/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, message: body.message || `Could not save (${res.status}).` };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: 'Could not reach the server.' };
  }
}

/**
 * The URL that serves the file itself (`GET /documents/:id/content`).
 *
 * Returned as a URL rather than fetched here because the endpoint streams the
 * file — the caller navigates to it or hands it to a download. Note it needs
 * the Authorization header, so a bare <a href> will 401; callers fetch it as a
 * blob. `downloadDocument` below does that.
 */
export function documentContentUrl(id: string): string {
  return `${API_BASE}/documents/${encodeURIComponent(id)}/content`;
}

/**
 * Download the file for real.
 *
 * The previous implementation was `console.log('Downloading document...')`
 * followed by a success toast — a fake confirmation for a download that never
 * happened, which is the failure class this codebase has spent several sessions
 * removing. This either downloads or reports why it could not.
 */
export async function downloadDocument(
  id: string,
  filename: string,
): Promise<{ ok: boolean; message?: string }> {
  try {
    const res = await fetch(documentContentUrl(id), { headers: getAuthHeaders() });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, message: body.message || `Download failed (${res.status}).` };
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = filename || 'document';
    window.document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return { ok: true };
  } catch {
    return { ok: false, message: 'Could not reach the server.' };
  }
}
