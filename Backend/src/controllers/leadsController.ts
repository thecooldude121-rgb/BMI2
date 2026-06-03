import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Columns that exist in the leads table (matches migrate.ts schema).
// The old controller used 'name', 'assigned_to', 'status', 'value' which
// don't exist — this caused silent INSERT failures.
const UPDATABLE_FIELDS = [
  'first_name', 'last_name', 'email', 'phone', 'company',
  'position', 'industry', 'stage', 'score', 'source',
  'owner_id', 'notes', 'tags', 'custom_fields',
];

export const getLeads = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { stage, owner_id, search, limit = 50, offset = 0 } = req.query;

    let query = `SELECT * FROM leads WHERE 1=1`;
    const params: any[] = [];
    let i = 1;

    if (stage)    { query += ` AND stage = $${i++}`;    params.push(stage); }
    if (owner_id) { query += ` AND owner_id = $${i++}`; params.push(owner_id); }
    if (search) {
      query += ` AND (first_name ILIKE $${i} OR last_name ILIKE $${i} OR email ILIKE $${i} OR company ILIKE $${i})`;
      params.push(`%${search}%`);
      i++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows, count: result.rowCount });
  } catch (error) { next(error); }
};

export const getLeadById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM leads WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Lead not found' }); return; }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

export const createLead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      first_name, last_name, email, phone, company, position,
      industry, stage, score, source, owner_id, notes, tags, custom_fields,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO leads
         (first_name, last_name, email, phone, company, position,
          industry, stage, score, source, owner_id, notes, tags, custom_fields)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        first_name, last_name,
        email   || null, phone    || null,
        company || null, position || null,
        industry || null,
        stage    || 'new',
        score    ?? 0,
        source   || null,
        owner_id || null,
        notes    || null,
        tags         ? JSON.stringify(tags)         : '[]',
        custom_fields ? JSON.stringify(custom_fields) : '{}',
      ]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

export const updateLead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updates: string[] = [];
    const params: any[] = [];
    let i = 1;

    UPDATABLE_FIELDS.forEach(f => {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = $${i++}`);
        params.push(req.body[f]);
      }
    });

    if (!updates.length) {
      res.status(400).json({ success: false, message: 'No valid fields to update' });
      return;
    }

    // Always bump updated_at
    updates.push(`updated_at = NOW()`);
    params.push(req.params.id);

    const result = await pool.query(
      `UPDATE leads SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
      params
    );

    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Lead not found' }); return; }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

export const deleteLead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await pool.query('DELETE FROM leads WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Lead not found' }); return; }
    res.json({ success: true, message: 'Lead deleted' });
  } catch (error) { next(error); }
};
