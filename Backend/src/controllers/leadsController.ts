import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getLeads = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { stage, status, assigned_to, search, limit = 50, offset = 0 } = req.query;
    let query = `SELECT * FROM leads WHERE 1=1`;
    const params: any[] = [];
    let i = 1;
    if (stage)       { query += ` AND stage = $${i++}`;           params.push(stage); }
    if (status)      { query += ` AND status = $${i++}`;          params.push(status); }
    if (assigned_to) { query += ` AND assigned_to = $${i++}`;     params.push(assigned_to); }
    if (search)      { query += ` AND (name ILIKE $${i} OR email ILIKE $${i} OR company ILIKE $${i})`; params.push(`%${search}%`); i++; }
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
    const { id, name, email, phone, company, position, industry, stage, status, score, value, probability, expected_close_date, source, assigned_to, notes, tags } = req.body;
    const result = await pool.query(
      `INSERT INTO leads (id, name, email, phone, company, position, industry, stage, status, score, value, probability, expected_close_date, source, assigned_to, notes, tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
      [id, name, email, phone, company, position, industry, stage || 'new', status || 'active', score || 0, value, probability || 0, expected_close_date, source, assigned_to, notes, tags]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

export const updateLead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const fields = ['name','email','phone','company','position','industry','stage','status','score','value','probability','expected_close_date','source','assigned_to','notes','tags','last_contact'];
    const updates: string[] = [];
    const params: any[] = [];
    let i = 1;
    fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = $${i++}`); params.push(req.body[f]); } });
    if (!updates.length) { res.status(400).json({ success: false, message: 'No fields to update' }); return; }
    params.push(req.params.id);
    const result = await pool.query(`UPDATE leads SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`, params);
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
