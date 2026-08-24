import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireTenantId } from '../middleware/tenant';

export const getCompanies = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const { industry, search, limit = 50, offset = 0 } = req.query;
    let query = `SELECT * FROM companies WHERE tenant_id = $1`;
    const params: any[] = [tenantId];
    let i = 2;
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
    const tenantId = requireTenantId(req);
    const [company, contacts] = await Promise.all([
      pool.query('SELECT * FROM companies WHERE id = $1 AND tenant_id = $2', [req.params.id, tenantId]),
      pool.query('SELECT * FROM contacts WHERE company_id = $1 AND tenant_id = $2 ORDER BY is_primary DESC, created_at', [req.params.id, tenantId]),
    ]);
    if (!company.rows[0]) { res.status(404).json({ success: false, message: 'Company not found' }); return; }
    res.json({ success: true, data: { ...company.rows[0], contacts: contacts.rows } });
  } catch (error) { next(error); }
};

export const createCompany = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const { id, name, domain, industry, size, revenue, website, phone, description, street, city, state, country, zip_code } = req.body;

    if (!name || !String(name).trim()) {
      res.status(400).json({ success: false, message: 'name is required' });
      return;
    }
    // companies.size has a CHECK constraint; validate rather than emit a raw 500.
    const VALID_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+', 'unknown'];
    if (size && !VALID_SIZES.includes(size)) {
      res.status(400).json({ success: false, message: `size must be one of: ${VALID_SIZES.join(', ')}` });
      return;
    }

    // companies.id is a NOT NULL varchar with no default. It used to be taken
    // straight from the request body, so any POST without an id was a raw 23502
    // — and a client generating its own id can collide. Generate it here when
    // absent, matching the existing C001 style and the D001/CT001 schemes in
    // dealsController/contactsController.
    let companyId = id;
    if (!companyId) {
      const maxResult = await pool.query(
        `SELECT MAX(CAST(SUBSTRING(id, 2) AS INTEGER)) AS max_num FROM companies WHERE id ~ '^C[0-9]+$'`
      );
      companyId = `C${String((maxResult.rows[0].max_num || 0) + 1).padStart(3, '0')}`;
    }

    const result = await pool.query(
      `INSERT INTO companies (id, name, domain, industry, size, revenue, website, phone, description, street, city, state, country, zip_code, tenant_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [companyId, name, domain, industry, size, revenue, website, phone, description, street, city, state, country, zip_code, tenantId]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

export const updateCompany = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const fields = ['name','domain','industry','size','revenue','website','phone','description','street','city','state','country','zip_code'];
    const updates: string[] = [];
    const params: any[] = [];
    let i = 1;
    fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = $${i++}`); params.push(req.body[f]); } });
    if (!updates.length) { res.status(400).json({ success: false, message: 'No fields to update' }); return; }
    updates.push(`updated_at = NOW()`);
    params.push(req.params.id, tenantId);
    const result = await pool.query(`UPDATE companies SET ${updates.join(', ')} WHERE id = $${i++} AND tenant_id = $${i} RETURNING *`, params);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Company not found' }); return; }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

export const deleteCompany = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const result = await pool.query('DELETE FROM companies WHERE id = $1 AND tenant_id = $2 RETURNING id', [req.params.id, tenantId]);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Company not found' }); return; }
    res.json({ success: true, message: 'Company deleted' });
  } catch (error) { next(error); }
};
