import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireTenantId } from '../middleware/tenant';

/**
 * Documents — metadata only.
 *
 * SCOPE, DELIBERATELY LIMITED
 * This controller manages document RECORDS: name, type, size, category,
 * description, the record a document belongs to, tags, and per-user favourites.
 * It does NOT store or serve file bytes.
 *
 * Uploading and downloading need a decision about where files live — object
 * storage, local disk, or a bytea column — which has not been made. Each has
 * real consequences for backups, memory and deployment. Guessing would produce
 * a second half-built subsystem, which is the pattern this remediation exists
 * to undo. `file_url` is stored and returned as-is so that whatever is chosen
 * can populate it without another migration.
 *
 * Until then a document row is a reference to a file held elsewhere, and the
 * UI says so rather than offering a download that cannot work.
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
    const result = await pool.query(
      'DELETE FROM documents WHERE id = ANY($1::uuid[]) AND tenant_id = $2 RETURNING id',
      [ids, tenantId],
    );
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
