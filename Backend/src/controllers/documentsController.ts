import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireTenantId } from '../middleware/tenant';
import {
  buildStorageKey,
  writeFile,
  readStream,
  deleteFile,
  statFile,
  streamHeaders,
} from '../config/fileStorage';

/**
 * Documents — metadata only.
 *
 * Manages document RECORDS (name, type, size, category, description, the record
 * a document belongs to, tags, per-user favourites) AND their bytes, which are
 * stored on local disk — see config/fileStorage.ts for the storage decision and
 * the hazards it guards against.
 *
 * Bytes never leave through a static file handler; only through
 * GET /:id/content, which checks tenant ownership first and forces an
 * attachment download.
 */

const resolveActorName = async (req: AuthRequest): Promise<string> => {
  if (req.user?.id) {
    const row = await pool.query('SELECT first_name, last_name FROM users WHERE id = $1', [req.user.id]);
    if (row.rows[0]) return `${row.rows[0].first_name} ${row.rows[0].last_name}`.trim();
  }
  return req.user?.email || 'Unknown';
};

/** The polymorphic parent, matching the existing `module` / `record_id` pair. */
const VALID_MODULES = ['lead', 'deal', 'contact', 'account', 'activity'] as const;

/**
 * GET /api/v1/documents
 * Filters: module, record_id, category, search, starred=true, limit, offset
 */
export const getDocuments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const userId = req.user?.id ?? null;
    const { module, record_id, category, search, starred, limit = 50, offset = 0 } = req.query;

    // is_starred is resolved per requesting user, so one person's star is not
    // visible as everyone's.
    let query = `
      SELECT d.*,
             (f.document_id IS NOT NULL) AS is_starred
      FROM documents d
      LEFT JOIN document_favorites f
        ON f.document_id = d.id AND f.user_id = $2
      WHERE d.tenant_id = $1`;
    const params: any[] = [tenantId, userId];
    let i = 3;

    if (module)    { query += ` AND d.module = $${i++}`;    params.push(module); }
    if (record_id) { query += ` AND d.record_id = $${i++}`; params.push(record_id); }
    if (category)  { query += ` AND d.category = $${i++}`;  params.push(category); }
    if (search)    { query += ` AND (d.name ILIKE $${i} OR d.description ILIKE $${i})`; params.push(`%${search}%`); i++; }
    if (starred === 'true') { query += ` AND f.document_id IS NOT NULL`; }

    const safeLimit = Math.min(Math.max(parseInt(String(limit), 10) || 50, 1), 500);
    const safeOffset = Math.max(parseInt(String(offset), 10) || 0, 0);

    query += ` ORDER BY d.created_at DESC LIMIT $${i++} OFFSET $${i}`;
    params.push(safeLimit, safeOffset);

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows, count: result.rowCount });
  } catch (error) { next(error); }
};

export const getDocumentById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const userId = req.user?.id ?? null;
    const result = await pool.query(
      `SELECT d.*, (f.document_id IS NOT NULL) AS is_starred
       FROM documents d
       LEFT JOIN document_favorites f ON f.document_id = d.id AND f.user_id = $3
       WHERE d.id = $1 AND d.tenant_id = $2`,
      [req.params.id, tenantId, userId],
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Document not found' }); return; }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

export const createDocument = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const { name, file_url, file_size, file_type, module, record_id, category, description, tags } = req.body;

    if (!name || !String(name).trim()) {
      res.status(400).json({ success: false, message: 'name is required' });
      return;
    }
    if (module && !VALID_MODULES.includes(module)) {
      res.status(400).json({ success: false, message: `module must be one of: ${VALID_MODULES.join(', ')}` });
      return;
    }
    if ((module && !record_id) || (record_id && !module)) {
      res.status(400).json({ success: false, message: 'module and record_id must be supplied together' });
      return;
    }

    const uploadedBy = await resolveActorName(req);
    const result = await pool.query(
      `INSERT INTO documents
         (name, file_url, file_size, file_type, module, record_id,
          category, description, tags, version, uploaded_by, tenant_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,1,$10,$11)
       RETURNING *`,
      [
        String(name).trim(), file_url || null, file_size ?? null, file_type || null,
        module || null, record_id || null,
        category || null, description || null,
        JSON.stringify(Array.isArray(tags) ? tags : []),
        uploadedBy, tenantId,
      ],
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

const UPDATABLE = ['name', 'category', 'description', 'file_url', 'file_type', 'file_size', 'module', 'record_id'];

export const updateDocument = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);

    if (req.body.module !== undefined && req.body.module !== null && !VALID_MODULES.includes(req.body.module)) {
      res.status(400).json({ success: false, message: `module must be one of: ${VALID_MODULES.join(', ')}` });
      return;
    }

    const updates: string[] = [];
    const params: any[] = [];
    let i = 1;
    UPDATABLE.forEach(f => {
      if (req.body[f] !== undefined) { updates.push(`${f} = $${i++}`); params.push(req.body[f]); }
    });
    if (req.body.tags !== undefined) {
      updates.push(`tags = $${i++}`);
      params.push(JSON.stringify(Array.isArray(req.body.tags) ? req.body.tags : []));
    }

    if (!updates.length) { res.status(400).json({ success: false, message: 'No fields to update' }); return; }
    updates.push('updated_at = NOW()');
    params.push(req.params.id, tenantId);

    const result = await pool.query(
      `UPDATE documents SET ${updates.join(', ')} WHERE id = $${i++} AND tenant_id = $${i} RETURNING *`,
      params,
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Document not found' }); return; }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

/** DELETE /api/v1/documents — body: { ids: string[] } for bulk, or /:id for one. */
export const deleteDocuments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const ids: string[] = req.params.id
      ? [req.params.id]
      : Array.isArray(req.body?.ids) ? req.body.ids : [];

    if (!ids.length) {
      res.status(400).json({ success: false, message: 'Provide a document id, or an ids array' });
      return;
    }

    // One statement, one transaction — a partial bulk delete with no report is
    // exactly the failure mode the deals bulk actions are still waiting on an
    // endpoint to avoid.
    // RETURNING storage_key so the files can be removed after the rows are
    // gone. Order matters: if the delete is rolled back the files are still
    // there, whereas deleting files first would lose bytes for rows that
    // survive.
    const result = await pool.query(
      'DELETE FROM documents WHERE id = ANY($1::uuid[]) AND tenant_id = $2 RETURNING id, storage_key',
      [ids, tenantId],
    );
    for (const row of result.rows) {
      if (row.storage_key) {
        // A failure here leaves an orphaned file, not a broken response — the
        // record is already gone and the user's intent is satisfied.
        await deleteFile(row.storage_key).catch(err =>
          console.error(`[documents] could not delete file ${row.storage_key}:`, err?.message));
      }
    }
    res.json({
      success: true,
      deleted: result.rowCount,
      requested: ids.length,
      // Say so plainly when some ids did not match, rather than reporting
      // blanket success.
      ...(result.rowCount !== ids.length
        ? { message: `${result.rowCount} of ${ids.length} deleted; the rest were not found in this tenant` }
        : {}),
    });
  } catch (error) { next(error); }
};

/** POST /api/v1/documents/:id/favorite — toggles for the requesting user. */
export const toggleFavorite = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const userId = req.user?.id;
    if (!userId) { res.status(401).json({ success: false, message: 'Not authenticated' }); return; }

    const doc = await pool.query(
      'SELECT id FROM documents WHERE id = $1 AND tenant_id = $2',
      [req.params.id, tenantId],
    );
    if (!doc.rows[0]) { res.status(404).json({ success: false, message: 'Document not found' }); return; }

    const removed = await pool.query(
      'DELETE FROM document_favorites WHERE document_id = $1 AND user_id = $2 RETURNING document_id',
      [req.params.id, userId],
    );
    if (removed.rowCount) {
      res.json({ success: true, is_starred: false });
      return;
    }
    await pool.query(
      `INSERT INTO document_favorites (document_id, user_id, tenant_id)
       VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
      [req.params.id, userId, tenantId],
    );
    res.json({ success: true, is_starred: true });
  } catch (error) { next(error); }
};

/**
 * POST /api/v1/documents/upload  (multipart/form-data)
 * Fields: file (required), plus name, category, description, module, record_id,
 *         tags (JSON array string)
 *
 * Writes the bytes to disk, then creates the record. If the record insert fails
 * the file just written is removed, so a failed upload cannot leave an orphan.
 */
export const uploadDocument = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const file = (req as any).file as
    | { originalname: string; mimetype: string; size: number; buffer: Buffer }
    | undefined;

  if (!file) {
    res.status(400).json({ success: false, message: 'A file is required (multipart field "file")' });
    return;
  }

  let storageKey: string | null = null;
  try {
    const tenantId = requireTenantId(req);
    const { name, category, description, module, record_id, tags } = req.body ?? {};

    if (module && !VALID_MODULES.includes(module)) {
      res.status(400).json({ success: false, message: `module must be one of: ${VALID_MODULES.join(', ')}` });
      return;
    }
    if ((module && !record_id) || (record_id && !module)) {
      res.status(400).json({ success: false, message: 'module and record_id must be supplied together' });
      return;
    }

    // The client filename is metadata only. The path comes from the tenant id
    // and a generated uuid — see buildStorageKey.
    storageKey = buildStorageKey(tenantId, file.originalname);
    const { checksum, bytes } = await writeFile(storageKey, file.buffer);

    let parsedTags: string[] = [];
    if (typeof tags === 'string' && tags.trim()) {
      try {
        const t = JSON.parse(tags);
        if (Array.isArray(t)) parsedTags = t.map(String);
      } catch {
        // A malformed tags field should not fail the upload; the file matters.
      }
    } else if (Array.isArray(tags)) {
      parsedTags = tags.map(String);
    }

    const uploadedBy = await resolveActorName(req);
    const displayName = (name && String(name).trim()) || file.originalname;

    const result = await pool.query(
      `INSERT INTO documents
         (name, file_url, file_size, file_type, module, record_id,
          category, description, tags, version, uploaded_by,
          storage_key, checksum_sha256, tenant_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,1,$10,$11,$12,$13)
       RETURNING *`,
      [
        displayName,
        null, // set below, once the id exists
        bytes,
        file.mimetype || null,
        module || null, record_id || null,
        category || null, description || null,
        JSON.stringify(parsedTags),
        uploadedBy,
        storageKey, checksum, tenantId,
      ],
    );

    const doc = result.rows[0];
    // file_url points at the authenticated route, never at the filesystem.
    const withUrl = await pool.query(
      'UPDATE documents SET file_url = $1 WHERE id = $2 AND tenant_id = $3 RETURNING *',
      [`/api/v1/documents/${doc.id}/content`, doc.id, tenantId],
    );

    storageKey = null; // committed — do not clean up
    res.status(201).json({ success: true, data: withUrl.rows[0] });
  } catch (error) {
    // Never leave bytes on disk with no row pointing at them.
    if (storageKey) {
      await deleteFile(storageKey).catch(() => {});
    }
    next(error);
  }
};

/**
 * GET /api/v1/documents/:id/content
 *
 * Tenant ownership is checked in the database BEFORE any path is resolved, so a
 * guessed id from another tenant is a 404 and never touches the filesystem.
 * Always an attachment download — see streamHeaders for why.
 */
export const downloadDocument = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const result = await pool.query(
      'SELECT name, file_type, storage_key FROM documents WHERE id = $1 AND tenant_id = $2',
      [req.params.id, tenantId],
    );
    const doc = result.rows[0];
    if (!doc) { res.status(404).json({ success: false, message: 'Document not found' }); return; }
    if (!doc.storage_key) {
      res.status(409).json({
        success: false,
        message: 'This document record has no file attached — it was created as metadata only.',
      });
      return;
    }

    const stat = await statFile(doc.storage_key);
    if (!stat) {
      // The row says there is a file and there is not. Report it rather than
      // streaming an empty body that looks like a valid download.
      res.status(410).json({
        success: false,
        message: 'The stored file is missing from disk. The record still exists but its contents are gone.',
      });
      return;
    }

    res.set({ ...streamHeaders(doc.name, doc.file_type), 'Content-Length': String(stat.size) });
    const stream = readStream(doc.storage_key);
    stream.on('error', err => {
      // Headers may already be sent, so destroy rather than trying to respond.
      console.error('[documents] stream error:', (err as Error)?.message);
      res.destroy();
    });
    stream.pipe(res);
  } catch (error) { next(error); }
};
