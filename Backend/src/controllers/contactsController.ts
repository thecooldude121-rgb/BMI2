import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getContacts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { account_id, search, limit = 50, offset = 0 } = req.query;
    let query = `SELECT c.*, co.name AS company_name FROM contacts c LEFT JOIN companies co ON c.company_id = co.id WHERE 1=1`;
    const params: any[] = [];
    let i = 1;
    if (account_id) { query += ` AND c.company_id = $${i++}`; params.push(account_id); }
    if (search) { query += ` AND (c.first_name ILIKE $${i} OR c.last_name ILIKE $${i} OR c.email ILIKE $${i} OR co.name ILIKE $${i})`; params.push(`%${search}%`); i++; }
    query += ` ORDER BY c.is_primary DESC, c.created_at DESC LIMIT $${i++} OFFSET $${i}`;
    params.push(limit, offset);
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows, count: result.rowCount });
  } catch (error) { next(error); }
};

export const createContact = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { account_id, first_name, last_name, email, phone, mobile, position, department, linkedin_url, is_primary } = req.body;
    const result = await pool.query(
      `INSERT INTO contacts (account_id, first_name, last_name, email, phone, mobile, position, department, linkedin_url, is_primary)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [account_id, first_name, last_name, email, phone, mobile, position, department, linkedin_url, is_primary || false]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

export const updateContact = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const fields = ['first_name','last_name','email','phone','mobile','position','department','linkedin_url','is_primary'];
    const updates: string[] = [];
    const params: any[] = [];
    let i = 1;
    fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = $${i++}`); params.push(req.body[f]); } });
    if (!updates.length) { res.status(400).json({ success: false, message: 'No fields to update' }); return; }
    updates.push(`updated_at = NOW()`);
    params.push(req.params.id);
    const result = await pool.query(`UPDATE contacts SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`, params);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Contact not found' }); return; }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

export const deleteContact = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await pool.query('DELETE FROM contacts WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Contact not found' }); return; }
    res.json({ success: true, message: 'Contact deleted' });
  } catch (error) { next(error); }
};
