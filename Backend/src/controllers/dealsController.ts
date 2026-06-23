import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getDeals = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { stage, assigned_to, search, limit = 50, offset = 0, include_test } = req.query;
    // The LEFT JOIN on leads is one-to-one (d.lead_id FK → leads PK) and cannot
    // produce duplicate rows for the same deal.  Duplicate cards on the board
    // are caused by genuine duplicate rows in the deals table (different ids,
    // same name/company/stage) — typically from double-submitting the form.
    // The frontend's Pass 3 content-dedup filters these before rendering.
    // If a one-to-many JOIN is ever added here, wrap the query in a subquery
    // with DISTINCT ON (d.id) + ORDER BY d.id to avoid row inflation.
    //
    // days_since_contact: integer days since the deal was last updated.
    // Drives all stalled/activity signals on the frontend. Floors at 0.
    //
    // is_test guard: excludes dev/debug records from all production-facing views
    // unless the caller explicitly passes include_test=true (dev tooling only).
    let query = `
      SELECT d.*,
             l.email AS lead_email,
             GREATEST(0, EXTRACT(epoch FROM (NOW() - d.updated_at)) / 86400)::int AS days_since_contact
      FROM deals d
      LEFT JOIN leads l ON d.lead_id = l.id
      WHERE 1=1`;
    const params: any[] = [];
    let i = 1;

    if (include_test !== 'true') {
      query += ` AND d.is_test = false`;
    }

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
      `SELECT d.*,
              l.name AS lead_name,
              l.email AS lead_email,
              GREATEST(0, EXTRACT(epoch FROM (NOW() - d.updated_at)) / 86400)::int AS days_since_contact
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
      close_date_is_past, close_date_override_reason, forecast_category,
      assigned_to, description, next_step, next_step_due_date, next_step_owner,
      next_step_status, notes, company_name,
      contact_name, contact_email, contact_title, stakeholders, competitors,
      source, priority, tags, product, contract_term, payment_terms,
      attachment_metadata, win_prob_override_reason, win_prob_ai,
      is_test,
      sales_drive_folder, agreement_url, account_module_setup, client_discovers,
      discovery_date,
      platform_fee, custom_fee, license_fee, onboarding_fee, white_labelling_fee,
      exchange_rate, nr_margin, start_date, contract_end_date, country, account_industry,
    } = req.body;

    const dealName = (name || title || '').trim();
    if (!dealName) {
      res.status(400).json({ success: false, message: 'Deal name is required.' });
      return;
    }

    // Auto-generate ID in D001 format
    const maxResult = await pool.query(`SELECT MAX(CAST(SUBSTRING(id, 2) AS INTEGER)) AS max_num FROM deals WHERE id ~ '^D[0-9]+$'`);
    const nextNum = (maxResult.rows[0].max_num || 0) + 1;
    const id = `D${String(nextNum).padStart(3, '0')}`;

    const result = await pool.query(
      `INSERT INTO deals
         (id, name, title, lead_id, value, currency, base_amount_usd,
          pipeline_id, pipeline_name, deal_type,
          stage, probability, expected_close_date,
          close_date_is_past, close_date_override_reason, forecast_category,
          assigned_to, description, next_step, next_step_due_date, next_step_owner,
          next_step_status, notes, company_name,
          contact_name, contact_email, contact_title, stakeholders, competitors,
          source, priority, tags, product, contract_term, payment_terms,
          attachment_metadata, win_prob_override_reason, win_prob_ai, is_test,
          sales_drive_folder, agreement_url, account_module_setup, client_discovers,
          discovery_date,
          platform_fee, custom_fee, license_fee, onboarding_fee, white_labelling_fee,
          exchange_rate, nr_margin, start_date, contract_end_date, country, account_industry)
       VALUES
         ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43,$44,$45,$46,$47,$48,$49,$50,$51,$52,$53,$54,$55)
       RETURNING *`,
      [
        id, dealName, title || dealName, lead_id, value,
        currency || 'USD', base_amount_usd ?? value,
        pipeline_id || 'new-business', pipeline_name || 'New Business',
        deal_type || 'new-business',
        stage || 'prospecting', probability || 0, expected_close_date,
        close_date_is_past ?? false, close_date_override_reason ?? null,
        forecast_category ?? null,
        assigned_to, description, next_step ?? null,
        next_step_due_date ?? null, next_step_owner ?? null,
        next_step_status ?? 'pending', notes, company_name,
        contact_name, contact_email, contact_title,
        JSON.stringify(stakeholders ?? []),
        JSON.stringify(competitors ?? []),
        source, priority || 'Medium', tags, product, contract_term, payment_terms,
        JSON.stringify(attachment_metadata ?? []),
        win_prob_override_reason ?? null,
        win_prob_ai ?? null,
        is_test === true || is_test === 'true' ? true : false,
        sales_drive_folder ?? null, agreement_url ?? null,
        account_module_setup ?? null, client_discovers ?? null,
        discovery_date ?? null,
        platform_fee ?? null, custom_fee ?? null, license_fee ?? null,
        onboarding_fee ?? null, white_labelling_fee ?? null,
        exchange_rate ?? 1, nr_margin ?? null,
        start_date ?? null, contract_end_date ?? null,
        country ?? null, account_industry ?? null,
      ]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

export const updateDeal = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const fields = ['name','title','lead_id','value','currency','base_amount_usd','pipeline_id','pipeline_name','deal_type','stage','probability','expected_close_date','close_date_is_past','close_date_override_reason','forecast_category','assigned_to','description','next_step','next_step_due_date','next_step_owner','next_step_status','notes','company_name','contact_name','contact_email','contact_title','stakeholders','competitors','source','priority','tags','product','contract_term','payment_terms','attachment_metadata','win_prob_override_reason','win_prob_ai','momentum_score','is_test','sales_drive_folder','agreement_url','account_module_setup','client_discovers','discovery_date','platform_fee','custom_fee','license_fee','onboarding_fee','white_labelling_fee','exchange_rate','nr_margin','start_date','contract_end_date','country','account_industry'];
    const updates: string[] = [];
    const params: any[] = [];
    let i = 1;

    // Auto-append to value_history when value changes
    let newValueHistory: any[] | null = null;
    if (req.body.value !== undefined) {
      const current = await pool.query(
        'SELECT value, value_history FROM deals WHERE id = $1',
        [req.params.id]
      );
      if (current.rows[0]) {
        const currentValue = Number(current.rows[0].value);
        const newValue = Number(req.body.value);
        if (currentValue !== newValue) {
          let changedBy = req.user?.email || 'Unknown';
          if (req.user?.id) {
            const userRow = await pool.query(
              'SELECT first_name, last_name FROM users WHERE id = $1',
              [req.user.id]
            );
            if (userRow.rows[0]) {
              changedBy = `${userRow.rows[0].first_name} ${userRow.rows[0].last_name}`;
            }
          }
          const existing = Array.isArray(current.rows[0].value_history)
            ? current.rows[0].value_history
            : [];
          newValueHistory = [
            {
              previousValue: currentValue,
              newValue: newValue,
              changedAt: new Date().toISOString(),
              changedBy,
              reason: req.body.value_change_reason ?? undefined,
            },
            ...existing,
          ];
        }
      }
    }

    fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = $${i++}`); params.push(req.body[f]); } });
    if (newValueHistory !== null) {
      updates.push(`value_history = $${i++}`);
      params.push(JSON.stringify(newValueHistory));
    }
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
