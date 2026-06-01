import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getCompanies = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { industry, search, limit = 50, offset = 0 } = req.query;
    let query = `SELECT * FROM companies WHERE 1=1`;
    const params: any[] = [];
    let i = 1;
    if (industry) { query += ` AND industry = $${i++}`; params.push(industry); }
    if (search)   { query += ` AND name ILIKE $${i}`; params.push(`%${search}%`); i++; }
    query += ` ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i}`;
    params.push(limit, offset);
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows, count: result.rowCount });
  } catch (error) { next(error); }
};

export const getCompanyById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [company, contacts] = await Promise.all([
      pool.query('SELECT * FROM companies WHERE id = $1', [req.params.id]),
      pool.query('SELECT * FROM contacts WHERE company_id = $1 ORDER BY is_primary DESC, created_at', [req.params.id]),
    ]);
    if (!company.rows[0]) { res.status(404).json({ success: false, message: 'Company not found' }); return; }
    res.json({ success: true, data: { ...company.rows[0], contacts: contacts.rows } });
  } catch (error) { next(error); }
};

export const createCompany = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, name, domain, industry, size, revenue, website, phone, description, street, city, state, country, zip_code } = req.body;
    const result = await pool.query(
      `INSERT INTO companies (id, name, domain, industry, size, revenue, website, phone, description, street, city, state, country, zip_code)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [id, name, domain, industry, size, revenue, website, phone, description, street, city, state, country, zip_code]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

export const updateCompany = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const fields = ['name','domain','industry','size','revenue','website','phone','description','street','city','state','country','zip_code'];
    const updates: string[] = [];
    const params: any[] = [];
    let i = 1;
    fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = $${i++}`); params.push(req.body[f]); } });
    if (!updates.length) { res.status(400).json({ success: false, message: 'No fields to update' }); return; }
    updates.push(`updated_at = NOW()`);
    params.push(req.params.id);
    const result = await pool.query(`UPDATE companies SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`, params);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Company not found' }); return; }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

export const deleteCompany = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await pool.query('DELETE FROM companies WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Company not found' }); return; }
    res.json({ success: true, message: 'Company deleted' });
  } catch (error) { next(error); }
};
