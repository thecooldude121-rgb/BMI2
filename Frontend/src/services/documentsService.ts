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
 * WHAT IS NOT IMPLEMENTED, AND WHY
 * uploadDocument / downloadDocument / shareDocument all need somewhere for the
 * file BYTES to live. That is an infrastructure decision — object storage,
 * local disk, or a bytea column — with real consequences for backups, memory
 * and deployment, and it has not been made. Rather than fake it, those three
 * throw a clear error that the UI surfaces. `file_url` is stored and returned
 * so whatever gets chosen can populate it without another migration.
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

export interface UploadDocumentRequest {
  name: string;
  file: File;
  category: string;
  description?: string;
  owner_name: string;
  related_entity_type?: string;
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

/** Thrown by the operations that need file storage, so callers can special-case them. */
export class StorageNotConfiguredError extends Error {
  constructor(action: string) {
    super(
      `${action} is not available yet: the CRM has no file storage configured, ` +
      `so there is nowhere to put or read the file. Document records can still be ` +
      `created and organised.`,
    );
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
    module?: string;
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

  // ── Blocked on a file-storage decision ────────────────────────────────────

  async uploadDocument(_request: UploadDocumentRequest, _onProgress?: (progress: number) => void): Promise<Document> {
    throw new StorageNotConfiguredError('Uploading files');
  },

  async downloadDocument(_documentId: string): Promise<never> {
    throw new StorageNotConfiguredError('Downloading files');
  },

  async shareDocument(_documentId: string, _request: DocumentShareRequest): Promise<never> {
    // Needs a document_shares table and a way to notify people; neither exists.
    throw new StorageNotConfiguredError('Sharing documents');
  },
};
