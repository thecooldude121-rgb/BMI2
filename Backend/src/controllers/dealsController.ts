import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getDeals = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { stage, assigned_to, search, limit = 50, offset = 0 } = req.query;
    let query = `SELECT d.*, l.email AS lead_email FROM deals d LEFT JOIN leads l ON d.lead_id = l.id WHERE 1=1`;
    const params: any[] = [];
    let i = 1;
    if (stage)       { query += ` AND d.stage = $${i++}`;             params.push(stage); }
    if (assigned_to) { query += ` AND d.assigned_to = $${i++}`;       params.push(assigned_to); }
    if (search)      { query += ` AND (d.name ILIKE $${i} OR d.company_name ILIKE $${i})`; params.push(`%${search}%`); i++; }
    query += ` ORDER BY d.created_at DESC LIMIT $${i++} OFFSET $${i}`;
    params.push(limit, offset);
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows, count: result.rowCount });
  } catch (error) { next(error); }
};

export const getDealById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT d.*, l.name AS lead_name, l.email AS lead_email
       FROM deals d LEFT JOIN leads l ON d.lead_id = l.id WHERE d.id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Deal not found' }); return; }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

export const createDeal = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      name, title, lead_id, value, currency, base_amount_usd,
      pipeline_id, pipeline_name, deal_type,
      stage, probability, expected_close_date,
      close_date_is_past, close_date_override_reason,
      assigned_to, description, next_step, notes, company_name,
      contact_name, contact_email, contact_title, stakeholders, competitors,
      source, priority, tags, product, contract_term, payment_terms
    } = req.body;

    // Auto-generate ID in D001 format
    const maxResult = await pool.query(`SELECT MAX(CAST(SUBSTRING(id, 2) AS INTEGER)) AS max_num FROM deals WHERE id ~ '^D[0-9]+$'`);
    const nextNum = (maxResult.rows[0].max_num || 0) + 1;
    const id = `D${String(nextNum).padStart(3, '0')}`;

    const result = await pool.query(
      `INSERT INTO deals
         (id, name, title, lead_id, value, currency, base_amount_usd,
          pipeline_id, pipeline_name, deal_type,
          stage, probability, expected_close_date,
          close_date_is_past, close_date_override_reason,
          assigned_to, description, next_step, notes, company_name,
          contact_name, contact_email, contact_title, stakeholders, competitors,
          source, priority, tags, product, contract_term, payment_terms)
       VALUES
         ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31)
       RETURNING *`,
      [
        id, name, title, lead_id, value,
        currency || 'USD', base_amount_usd ?? value,
        pipeline_id || 'new-business', pipeline_name || 'New Business',
        deal_type || 'new-business',
        stage || 'prospecting', probability || 0, expected_close_date,
        close_date_is_past ?? false, close_date_override_reason ?? null,
        assigned_to, description, next_step, notes, company_name,
        contact_name, contact_email, contact_title,
        JSON.stringify(stakeholders ?? []),
        JSON.stringify(competitors ?? []),
        source, priority || 'Medium', tags, product, contract_term, payment_terms
      ]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

export const updateDeal = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const fields = ['name','title','lead_id','value','currency','base_amount_usd','pipeline_id','pipeline_name','deal_type','stage','probability','expected_close_date','close_date_is_past','close_date_override_reason','assigned_to','description','next_step','notes','company_name','contact_name','contact_email','contact_title','stakeholders','competitors','source','priority','tags','product','contract_term','payment_terms'];
    const updates: string[] = [];
    const params: any[] = [];
    let i = 1;
    fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = $${i++}`); params.push(req.body[f]); } });
    if (!updates.length) { res.status(400).json({ success: false, message: 'No fields to update' }); return; }
    updates.push(`updated_at = NOW()`);
    params.push(req.params.id);
    const result = await pool.query(`UPDATE deals SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`, params);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Deal not found' }); return; }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

export const deleteDeal = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await pool.query('DELETE FROM deals WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Deal not found' }); return; }
    res.json({ success: true, message: 'Deal deleted' });
  } catch (error) { next(error); }
};
