/**
 * Documents service.
 *
 * PHASE 2 REWRITE — this used to talk to SUPABASE, a second backend with no
 * credentials configured. `lib/supabase.ts` falls back to
 * `https://placeholder.supabase.co` when VITE_SUPABASE_URL is unset, and there
 * is no .env in Frontend/, so every call failed at runtime. DocumentsLibrary
 * then swallowed the error and rendered MOCK_DOCUMENTS — with an explicit
 * `setError(null); // Don't show error when using mock data`.
 *
 * Documents now live in Postgres with the rest of the data, behind
 * /api/v1/documents, with the same tenancy rules as every other table.
 *
 * FILE STORAGE
 * Files are stored on local disk, served only through the authenticated
 * /documents/:id/content route — never off the filesystem directly. Uploading
 * and downloading work. See Backend/src/config/fileStorage.ts for the storage
 * decision and the hazards it guards against (path traversal, stored XSS,
 * cross-tenant reads).
 *
 * shareDocument is still unimplemented: it needs a document_shares table and a
 * way to notify people, neither of which exists.
 */

const API_BASE = 'http://localhost:5001/api/v1';

export interface Document {
  id: string;
  document_id: string;
  name: string;
  file_type: string;
  file_size: number;
  file_url?: string;
  category: string;
  description?: string;
  uploaded_by: string;
  owner_name: string;
  is_starred?: boolean;
  starred?: boolean;
  related_entity_type?: string;
  related_entity_id?: string;
  related_entity_name?: string;
  activity_id?: string;
  created_at: string;
  updated_at: string;
  modified_at?: string;
  last_accessed_at?: string;
  version: number;
  access_count: number;
  folder_id?: string;
}

export interface DocumentFilters {
  page?: number;
  limit?: number;
  owner?: string;
  category?: string;
  search?: string;
  starred?: boolean;
  entity_type?: string;
  entity_id?: string;
}

export interface DocumentShareRequest {
  user_ids: string[];
  permission?: 'view' | 'edit' | 'download';
}

/**
 * THE SERVER'S `module` VOCABULARY, as a type rather than a convention.
 *
 * `documents.module` is a single lowercase value and the API rejects anything
 * else with "module must be one of: lead, deal, contact, account, activity".
 * The upload form used to send 'Deal' / 'Account' / 'Contact' — capitalised
 * labels, appended to the request verbatim — so EVERY upload with a related
 * record failed a validation the client could not see.
 *
 * A union rather than a lowercase() call at the boundary, deliberately: a
 * runtime fix would leave the next caller free to send 'Deal' again and find
 * out from a 400. This way a capitalised value does not compile.
 *
 * Keep in step with `VALID_MODULES` in Backend/src/controllers/documentsController.ts.
 * That is a second list that must agree with this one — unavoidable across the
 * HTTP boundary, so it is named here rather than left implicit.
 */
export type DocumentModule = 'lead' | 'deal' | 'contact' | 'account' | 'activity';

export interface UploadDocumentRequest {
  name: string;
  file: File;
  category: string;
  description?: string;
  owner_name: string;
  /** Typed, so 'Deal' is a compile error rather than a 400. */
  related_entity_type?: DocumentModule;
  related_entity_id?: string;
  related_entity_name?: string;
  activity_id?: string;
  tags?: string[];
}

/** Raw row from /documents. */
interface DocumentRow {
  id: string;
  name: string;
  file_url: string | null;
  file_size: number | null;
  file_type: string | null;
  module: string | null;
  record_id: string | null;
  category: string | null;
  description: string | null;
  tags: string[] | null;
  version: number | null;
  uploaded_by: string | null;
  is_starred: boolean;
  created_at: string;
  updated_at: string | null;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: getAuthHeaders(), ...init });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((json as any).message || `${init?.method ?? 'GET'} ${path} failed (HTTP ${res.status})`);
  }
  return json as T;
}

function mapRow(row: DocumentRow): Document {
  return {
    id: row.id,
    // The table has no separate human-readable document number; the id serves.
    document_id: row.id,
    name: row.name,
    file_type: row.file_type ?? '',
    file_size: row.file_size ?? 0,
    file_url: row.file_url ?? undefined,
    category: row.category ?? 'uncategorized',
    description: row.description ?? undefined,
    uploaded_by: row.uploaded_by ?? '',
    owner_name: row.uploaded_by ?? '',
    is_starred: row.is_starred,
    starred: row.is_starred,
    related_entity_type: row.module ?? undefined,
    related_entity_id: row.record_id ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at ?? row.created_at,
    modified_at: row.updated_at ?? row.created_at,
    version: row.version ?? 1,
    // No download tracking table exists, so this is genuinely 0 rather than a
    // plausible-looking number.
    access_count: 0,
    // Absent by design: related_entity_name, activity_id, last_accessed_at,
    // folder_id — no columns behind them.
  };
}

/** Still thrown by shareDocument, which has no backing table. */
export class StorageNotConfiguredError extends Error {
  constructor(action: string) {
    super(`${action} is not available yet.`);
    this.name = 'StorageNotConfiguredError';
  }
}

export const documentsService = {
  async loadDocuments(filters: DocumentFilters = {}) {
    const { page = 1, limit = 25, category, search, starred, entity_type, entity_id } = filters;
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    params.set('offset', String((page - 1) * limit));
    if (category && category !== 'all') params.set('category', category);
    if (search) params.set('search', search);
    if (starred) params.set('starred', 'true');
    if (entity_type) params.set('module', entity_type);
    if (entity_id) params.set('record_id', entity_id);

    const json = await request<{ data: DocumentRow[]; count: number }>(`/documents?${params}`);
    return { data: (json.data ?? []).map(mapRow), count: json.count ?? 0 };
  },

  async getDocumentById(documentId: string): Promise<Document> {
    const json = await request<{ data: DocumentRow }>(`/documents/${encodeURIComponent(documentId)}`);
    return mapRow(json.data);
  },

  /**
   * Creates the document RECORD. It does not move any bytes — see the note at
   * the top of this file.
   */
  async createDocumentRecord(input: {
    name: string;
    category?: string;
    description?: string;
    file_type?: string;
    file_size?: number;
    file_url?: string;
    module?: DocumentModule;
    record_id?: string;
    tags?: string[];
  }): Promise<Document> {
    const json = await request<{ data: DocumentRow }>('/documents', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return mapRow(json.data);
  },

  async updateDocument(documentId: string, updates: Partial<Document>): Promise<Document> {
    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.related_entity_type !== undefined) payload.module = updates.related_entity_type;
    if (updates.related_entity_id !== undefined) payload.record_id = updates.related_entity_id;
    const json = await request<{ data: DocumentRow }>(`/documents/${encodeURIComponent(documentId)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return mapRow(json.data);
  },

  /** One transactional statement; reports how many of the requested ids matched. */
  async deleteDocuments(documentIds: string[]) {
    return request<{ success: boolean; deleted: number; requested: number; message?: string }>(
      '/documents',
      { method: 'DELETE', body: JSON.stringify({ ids: documentIds }) },
    );
  },

  async toggleFavorite(documentId: string): Promise<boolean> {
    const json = await request<{ is_starred: boolean }>(
      `/documents/${encodeURIComponent(documentId)}/favorite`,
      { method: 'POST' },
    );
    return json.is_starred;
  },

  /** Ids of the requesting user's starred documents. */
  async getUserFavorites(): Promise<string[]> {
    const json = await request<{ data: DocumentRow[] }>('/documents?starred=true&limit=500');
    return (json.data ?? []).map(d => d.id);
  },

  async searchDocuments(query: string, category?: string) {
    const { data } = await this.loadDocuments({ search: query, category, limit: 100 });
    return data;
  },

  async addTags(documentId: string, tags: string[]): Promise<Document> {
    const json = await request<{ data: DocumentRow }>(`/documents/${encodeURIComponent(documentId)}`, {
      method: 'PUT',
      body: JSON.stringify({ tags }),
    });
    return mapRow(json.data);
  },

  /**
   * Uploads the file and creates its record in one request.
   *
   * XMLHttpRequest rather than fetch, purely because fetch cannot report upload
   * progress and the modal shows a per-file bar. The 25 MB cap is enforced
   * server-side; it is checked here too so a large file fails instantly instead
   * of after being sent.
   */
  async uploadDocument(
    request: UploadDocumentRequest,
    onProgress?: (progress: number) => void,
  ): Promise<Document> {
    const MAX_BYTES = 25 * 1024 * 1024;
    if (request.file.size > MAX_BYTES) {
      throw new Error(
        `"${request.file.name}" is ${(request.file.size / 1024 / 1024).toFixed(1)} MB. The limit is 25 MB.`,
      );
    }

    const form = new FormData();
    form.append('file', request.file);
    form.append('name', request.name);
    if (request.category) form.append('category', request.category);
    if (request.description) form.append('description', request.description);
    // The server's polymorphic parent pair; both or neither.
    if (request.related_entity_type && request.related_entity_id) {
      form.append('module', request.related_entity_type);
      form.append('record_id', request.related_entity_id);
    }
    if (request.tags?.length) form.append('tags', JSON.stringify(request.tags));

    const token = localStorage.getItem('authToken');

    return new Promise<Document>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}/documents/upload`);
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      // Content-Type is deliberately NOT set: the browser must add the
      // multipart boundary itself.

      xhr.upload.onprogress = e => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        let body: any = {};
        try { body = JSON.parse(xhr.responseText); } catch { /* non-JSON error page */ }
        if (xhr.status >= 200 && xhr.status < 300 && body?.data) resolve(mapRow(body.data));
        else reject(new Error(body?.message || `Upload failed (HTTP ${xhr.status})`));
      };
      xhr.onerror = () => reject(new Error('Upload failed — the server could not be reached.'));
      xhr.onabort = () => reject(new Error('Upload cancelled.'));
      xhr.send(form);
    });
  },

  /**
   * Fetches the bytes and hands them to the browser as a download.
   *
   * Goes through fetch rather than pointing the browser at the URL, because the
   * route requires an Authorization header — a plain link would 401.
   */
  async downloadDocument(documentId: string): Promise<void> {
    const token = localStorage.getItem('authToken');
    const res = await fetch(`${API_BASE}/documents/${encodeURIComponent(documentId)}/content`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      let message = `Download failed (HTTP ${res.status})`;
      try { message = (await res.json()).message ?? message; } catch { /* body may not be JSON */ }
      throw new Error(message);
    }

    // Recover the filename the server set, falling back to the record's name.
    const disposition = res.headers.get('Content-Disposition') ?? '';
    const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
    const ascii = /filename="([^"]+)"/i.exec(disposition);
    const filename = utf8 ? decodeURIComponent(utf8[1]) : ascii?.[1] ?? 'download';

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    // Revoke on the next tick; revoking synchronously can cancel the download
    // in some browsers.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  },

  async shareDocument(_documentId: string, _request: DocumentShareRequest): Promise<never> {
    // Needs a document_shares table and a way to notify people; neither exists.
    throw new StorageNotConfiguredError('Sharing documents');
  },
};
