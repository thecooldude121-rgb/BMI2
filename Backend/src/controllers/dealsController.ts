import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireTenantId } from '../middleware/tenant';

export const getDeals = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
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
      WHERE d.tenant_id = $1`;
    const params: any[] = [tenantId];
    let i = 2;

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
    const tenantId = requireTenantId(req);
    const result = await pool.query(
      `SELECT d.*,
              l.name AS lead_name,
              l.email AS lead_email,
              GREATEST(0, EXTRACT(epoch FROM (NOW() - d.updated_at)) / 86400)::int AS days_since_contact
       FROM deals d LEFT JOIN leads l ON d.lead_id = l.id WHERE d.id = $1 AND d.tenant_id = $2`,
      [req.params.id, tenantId]
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Deal not found' }); return; }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

export const createDeal = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
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
          exchange_rate, nr_margin, start_date, contract_end_date, country, account_industry,
          tenant_id)
       VALUES
         ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43,$44,$45,$46,$47,$48,$49,$50,$51,$52,$53,$54,$55,$56)
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
        tenantId,
      ]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

export const updateDeal = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const fields = ['name','title','lead_id','value','currency','base_amount_usd','pipeline_id','pipeline_name','deal_type','stage','probability','expected_close_date','close_date_is_past','close_date_override_reason','forecast_category','assigned_to','description','next_step','next_step_due_date','next_step_owner','next_step_status','notes','company_name','contact_name','contact_email','contact_title','stakeholders','competitors','source','priority','tags','product','contract_term','payment_terms','attachment_metadata','win_prob_override_reason','win_prob_ai','momentum_score','is_test','sales_drive_folder','agreement_url','account_module_setup','client_discovers','discovery_date','platform_fee','custom_fee','license_fee','onboarding_fee','white_labelling_fee','exchange_rate','nr_margin','start_date','contract_end_date','country','account_industry'];
    const updates: string[] = [];
    const params: any[] = [];
    let i = 1;

    // Auto-append to value_history when value changes
    let newValueHistory: any[] | null = null;
    if (req.body.value !== undefined) {
      const current = await pool.query(
        'SELECT value, value_history FROM deals WHERE id = $1 AND tenant_id = $2',
        [req.params.id, tenantId]
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
    params.push(req.params.id, tenantId);
    const result = await pool.query(`UPDATE deals SET ${updates.join(', ')} WHERE id = $${i++} AND tenant_id = $${i} RETURNING *`, params);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Deal not found' }); return; }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

/** Resolve the caller's display name, matching the convention in value_history. */
const resolveActorName = async (req: AuthRequest): Promise<string> => {
  if (req.user?.id) {
    const row = await pool.query('SELECT first_name, last_name FROM users WHERE id = $1', [req.user.id]);
    if (row.rows[0]) return `${row.rows[0].first_name} ${row.rows[0].last_name}`.trim();
  }
  return req.user?.email || 'Unknown';
};

/**
 * POST /api/v1/deals/:id/stage-transition
 * Body: { to_stage, probability?, reason_code?, note? }
 *
 * The dedicated path for stage changes, per CRM_REMEDIATION_PLAN Phase 3 and
 * spec §3.2. A generic PATCH cannot express this: moving a deal has to write an
 * audit row and derive a probability, and doing that inside the catch-all
 * updateDeal would make every unrelated field update carry the same cost.
 *
 * Behaviour:
 *   - Records a deal_stage_history row for every change.
 *   - Sets probability from the matching pipeline stage's default, UNLESS the
 *     caller passes one explicitly — then the override is stored and flagged, so
 *     a rep's judgement stays distinguishable from the pipeline default.
 *   - Stage and history are written in one transaction; a failed history write
 *     must not leave a silently-moved deal.
 *   - A no-op move (to_stage equals current) returns 200 without writing
 *     history, so a dropped-then-replaced kanban card does not pollute the
 *     audit trail.
 */
export const transitionDealStage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const client = await pool.connect();
  try {
    const tenantId = requireTenantId(req);
    const { to_stage, probability, reason_code, note } = req.body;

    if (!to_stage || !String(to_stage).trim()) {
      res.status(400).json({ success: false, message: 'to_stage is required' });
      return;
    }
    if (probability !== undefined) {
      const p = Number(probability);
      if (!Number.isInteger(p) || p < 0 || p > 100) {
        res.status(400).json({ success: false, message: 'probability must be an integer between 0 and 100' });
        return;
      }
    }

    await client.query('BEGIN');

    // Lock the row so two concurrent moves cannot interleave and record a
    // from_stage that was never actually the deal's stage.
    const current = await client.query(
      'SELECT id, stage, probability FROM deals WHERE id = $1 AND tenant_id = $2 FOR UPDATE',
      [req.params.id, tenantId],
    );
    if (!current.rows[0]) {
      await client.query('ROLLBACK');
      res.status(404).json({ success: false, message: 'Deal not found' });
      return;
    }

    const fromStage = current.rows[0].stage as string | null;
    if (fromStage === to_stage) {
      await client.query('ROLLBACK');
      res.json({ success: true, data: current.rows[0], message: 'Deal is already in that stage' });
      return;
    }

    // Probability: explicit override wins; otherwise take the pipeline stage
    // default. deals.stage holds slugs ('closed-won') while pipeline_stages
    // holds display names ('Closed Won'), so match on a normalised form. When
    // there is no match the existing probability is kept rather than guessed.
    const isOverride = probability !== undefined;
    let nextProbability: number | null = isOverride ? Number(probability) : null;
    if (!isOverride) {
      const stageRow = await client.query(
        `SELECT probability FROM pipeline_stages
         WHERE tenant_id = $1
           AND lower(replace(name, ' ', '-')) = lower(replace($2, ' ', '-'))
         LIMIT 1`,
        [tenantId, to_stage],
      );
      nextProbability = stageRow.rows[0]?.probability ?? current.rows[0].probability ?? null;
    }

    const updated = await client.query(
      `UPDATE deals SET stage = $1, probability = $2, updated_at = NOW()
       WHERE id = $3 AND tenant_id = $4 RETURNING *`,
      [to_stage, nextProbability, req.params.id, tenantId],
    );

    const changedBy = await resolveActorName(req);
    await client.query(
      `INSERT INTO deal_stage_history
         (deal_id, from_stage, to_stage, probability, probability_override,
          reason_code, note, changed_by, tenant_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [req.params.id, fromStage, to_stage, nextProbability, isOverride,
       reason_code ?? null, note ?? null, changedBy, tenantId],
    );

    await client.query('COMMIT');
    res.json({ success: true, data: updated.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error);
  } finally {
    client.release();
  }
};

/** GET /api/v1/deals/:id/stage-history */
export const getDealStageHistory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const result = await pool.query(
      `SELECT id, from_stage, to_stage, probability, probability_override,
              reason_code, note, changed_by, changed_at
       FROM deal_stage_history
       WHERE deal_id = $1 AND tenant_id = $2
       ORDER BY changed_at DESC`,
      [req.params.id, tenantId],
    );
    res.json({ success: true, data: result.rows, count: result.rowCount });
  } catch (error) { next(error); }
};

export const deleteDeal = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const result = await pool.query('DELETE FROM deals WHERE id = $1 AND tenant_id = $2 RETURNING id', [req.params.id, tenantId]);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Deal not found' }); return; }
    res.json({ success: true, message: 'Deal deleted' });
  } catch (error) { next(error); }
};
