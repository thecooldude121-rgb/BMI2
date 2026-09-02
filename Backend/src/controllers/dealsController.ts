import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireTenantId } from '../middleware/tenant';
import { foreignIdsInTenant } from '../utils/tenantScope';

/**
 * The JSONB columns a client may write through updateDeal's generic field loop.
 *
 * node-pg serialises a raw JS array as a Postgres ARRAY literal, which jsonb
 * rejects outright with "invalid input syntax for type json" — a masked 500,
 * and nothing saved. Each of these must therefore be JSON.stringify'd, exactly
 * as createDeal does (`?? []` at :259/:260/:262 — all three default to
 * '[]'::jsonb in the schema, none to '{}').
 *
 * `tags` is deliberately NOT here: it is text[], not jsonb, so the raw array is
 * precisely what that column wants and stringifying it would break it.
 * `value_history` is also absent because it never passes through this loop —
 * it is written separately, already stringified.
 */
const JSONB_ARRAY_COLUMNS = new Set(['stakeholders', 'competitors', 'attachment_metadata']);

export const getDeals = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const { stage, assigned_to, search, contact_email, company_name, company_id, limit = 50, offset = 0, include_test } = req.query;
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
             -- DATE columns re-projected as text. A DATE is a calendar day with
             -- no time and no timezone, but the pg driver builds a JS Date at
             -- LOCAL midnight and res.json() serialises that with toISOString():
             -- in IST, 2026-09-03 left here as "2026-09-02T18:30:00.000Z". Any
             -- consumer that slices or reformats that string got the previous
             -- day, and DealSlideoutPanel did exactly that into an editable
             -- field, so a no-op save wrote the date back one day earlier.
             --
             -- These come AFTER d.* deliberately: Postgres returns two fields of
             -- the same name and node-pg keeps the LAST, so these override the
             -- raw columns. Verified against this database rather than assumed —
             -- the query returns two expected_close_date fields and the row
             -- object holds "2026-09-03". Keeping d.* means a column added later
             -- still reaches the client; an explicit 62-column list would
             -- silently drop it.
             to_char(d.expected_close_date, 'YYYY-MM-DD') AS expected_close_date,
             to_char(d.next_step_due_date,  'YYYY-MM-DD') AS next_step_due_date,
             to_char(d.discovery_date,      'YYYY-MM-DD') AS discovery_date,
             to_char(d.start_date,          'YYYY-MM-DD') AS start_date,
             to_char(d.contract_end_date,   'YYYY-MM-DD') AS contract_end_date,
             l.email AS lead_email,
             GREATEST(0, EXTRACT(epoch FROM (NOW() - d.updated_at)) / 86400)::int AS days_since_contact
      FROM deals d
      -- The tenant predicate on the JOIN is load-bearing, not redundant with
      -- the WHERE below. deals_lead_id_fkey references leads(id) globally, so a
      -- deal in this workspace CAN carry a lead_id from another one; without
      -- the AND l.tenant_id = d.tenant_id below, this projected that other
      -- workspace's lead email. Filtering the base table is not enough:
      -- a join is a read.
      LEFT JOIN leads l ON d.lead_id = l.id AND l.tenant_id = d.tenant_id
      WHERE d.tenant_id = $1`;
    const params: any[] = [tenantId];
    let i = 2;

    if (include_test !== 'true') {
      query += ` AND d.is_test = false`;
    }

    // Archived deals are out of the working pipeline by default, same treatment
    // as is_test. Pass include_archived=true for an archive view.
    if (req.query.include_archived !== 'true') {
      query += ` AND d.is_archived = false`;
    }

    if (stage)       { query += ` AND d.stage = $${i++}`;             params.push(stage); }
    if (assigned_to) { query += ` AND d.assigned_to = $${i++}`;       params.push(assigned_to); }
    if (search)      { query += ` AND (d.name ILIKE $${i} OR d.company_name ILIKE $${i})`; params.push(`%${search}%`); i++; }

    // contact_email / company_name: the ONLY link deals carry to a contact or an
    // account. `deals` has no contact_id and no account_id — just the free-text
    // columns company_name, contact_name, contact_email, contact_title. So the
    // contact detail page finds a contact's deals by matching the email it
    // stored, case-insensitively because nothing normalises either side.
    //
    // This is a weak link and should become a real FK. Deliberately NOT done as
    // part of this: of 25 deals exactly one carries a contact_email and it
    // matches no contact, so a backfill would set zero rows, and the deal form
    // still writes free text — the column would be dead schema. Add
    // deals.contact_id together with a contact picker in the deal form, and
    // backfill then.
    if (contact_email) { query += ` AND lower(d.contact_email) = lower($${i++})`; params.push(contact_email); }
    if (company_name)  { query += ` AND lower(d.company_name)  = lower($${i++})`; params.push(company_name); }

    // company_id is the REAL account link, added in migration 027, and it is
    // what the account detail page uses for "related deals". Unlike the
    // company_name filter above it is an id comparison against a foreign key,
    // so it cannot match the wrong account or miss one because of spelling.
    // Note it needs no tenant predicate of its own: d.tenant_id is already
    // pinned in the WHERE, so a caller passing another workspace's company_id
    // simply matches zero rows rather than reading across the boundary.
    if (company_id)    { query += ` AND d.company_id = $${i++}`;      params.push(company_id); }

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
              -- See the note on the list query: DATE columns re-projected as
              -- text so a calendar day never becomes an instant. Must stay in
              -- sync with that projection — the detail panel binds these to
              -- <input type="date">, which only accepts YYYY-MM-DD.
              to_char(d.expected_close_date, 'YYYY-MM-DD') AS expected_close_date,
              to_char(d.next_step_due_date,  'YYYY-MM-DD') AS next_step_due_date,
              to_char(d.discovery_date,      'YYYY-MM-DD') AS discovery_date,
              to_char(d.start_date,          'YYYY-MM-DD') AS start_date,
              to_char(d.contract_end_date,   'YYYY-MM-DD') AS contract_end_date,
              l.name AS lead_name,
              l.email AS lead_email,
              co.name     AS company_name_resolved,
              co.industry AS company_industry,
              co.website  AS company_website,
              co.domain   AS company_domain,
              co.size     AS company_size,
              co.city     AS company_city,
              co.state    AS company_state,
              co.country  AS company_country,
              GREATEST(0, EXTRACT(epoch FROM (NOW() - d.updated_at)) / 86400)::int AS days_since_contact
       FROM deals d
       -- Scoped for the same reason as getDeals: see the comment there.
       LEFT JOIN leads l ON d.lead_id = l.id AND l.tenant_id = d.tenant_id
       -- deals_company_id_fkey (migration 027) references companies(id)
       -- GLOBALLY, so this predicate is what stops a deal carrying another
       -- workspace's company_id from projecting that company's name and website
       -- into this response. Same reasoning as the leads join above: a join is
       -- a read. The write side is validated in createDeal/updateDeal.
       LEFT JOIN companies co ON d.company_id = co.id AND co.tenant_id = d.tenant_id
       WHERE d.id = $1 AND d.tenant_id = $2`,
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
      next_step_status, notes, company_name, company_id,
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

    // deals.value is NUMERIC(12,2) NOT NULL with no default, and this path
    // validated only the name and the FK references. A missing value therefore
    // reached Postgres as a raw 23502 not-null violation, which errorHandler
    // masks as a 500 "Internal Server Error" outside development — so the
    // caller was told nothing about what was actually wrong. Validate it here,
    // in the same shape as the name check above.
    //
    // The column is left exactly as it is: NOT NULL, no default, no migration.
    // Whether a deal may have no value at all is a data-model question, and the
    // real Add Deal form always sends one (parseFloat(d.value) || 0), so it is
    // not decided here as a side effect of turning a 500 into a 400.
    if (value === undefined || value === null || value === '') {
      res.status(400).json({ success: false, message: 'value is required.' });
      return;
    }
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue < 0) {
      res.status(400).json({ success: false, message: 'value must be a non-negative number.' });
      return;
    }

    // lead_id comes straight from the request body into an FK that references
    // leads(id) globally, so without this a caller could attach ANY lead in the
    // database to their own deal — and leads.id is a serial, so the ids are
    // trivially enumerable. getDeals then read that lead's email back out.
    //
    // company_id (migration 027) is checked here for exactly the same reason,
    // and the check is the write half of the pair described in that migration:
    // the join in getDealById is what stops a bad row being READ across
    // workspaces, this is what stops one being CREATED. 400 rather than 403,
    // per the settled contract in src/__tests__/tenantIsolation.test.ts — from
    // the caller's workspace that id simply is not a valid reference — and the
    // message names the field without disclosing that the row exists elsewhere.
    const badRef = await foreignIdsInTenant(
      [
        { field: 'lead_id',    table: 'leads',     value: lead_id },
        { field: 'company_id', table: 'companies', value: company_id },
      ], tenantId);
    if (badRef) { res.status(400).json({ success: false, message: badRef }); return; }

    // Auto-generate ID in D001 format
    // DELIBERATELY NOT SCOPED BY TENANT, and this is load-bearing.
    // deals.id is a GLOBAL primary key (deals_pkey PRIMARY KEY (id)), so ids must be
    // unique across every workspace. Adding `AND tenant_id = $n` here would make
    // the second workspace generate D001 again and every insert would fail with
    // a duplicate-key error. The scan for missing tenant filters flags this line;
    // it is a false positive.
    //
    // It IS a small information leak: the id a caller receives reveals the global
    // row count. The fix for that is a per-workspace sequence or a uuid, NOT a
    // tenant predicate.
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
          next_step_status, notes, company_name, company_id,
          contact_name, contact_email, contact_title, stakeholders, competitors,
          source, priority, tags, product, contract_term, payment_terms,
          attachment_metadata, win_prob_override_reason, win_prob_ai, is_test,
          sales_drive_folder, agreement_url, account_module_setup, client_discovers,
          discovery_date,
          platform_fee, custom_fee, license_fee, onboarding_fee, white_labelling_fee,
          exchange_rate, nr_margin, start_date, contract_end_date, country, account_industry,
          tenant_id)
       VALUES
         ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43,$44,$45,$46,$47,$48,$49,$50,$51,$52,$53,$54,$55,$56,$57)
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
        next_step_status ?? 'pending', notes, company_name, company_id ?? null,
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

    // Same check as createDeal: an update must not be able to re-point an
    // existing deal at another workspace's lead — or, since migration 027, at
    // another workspace's company. Re-pointing is the easier attack of the two:
    // it needs no create permission, just an id in a PUT body.
    const badRef = await foreignIdsInTenant(
      [
        { field: 'lead_id',    table: 'leads',     value: req.body.lead_id },
        { field: 'company_id', table: 'companies', value: req.body.company_id },
      ], tenantId);
    if (badRef) { res.status(400).json({ success: false, message: badRef }); return; }

    // createDeal requires a non-blank name and a present, non-negative,
    // finite value. This path enforced neither, so the same inputs createDeal
    // rejects with a clean 400 were writable here: an explicit null on either
    // NOT NULL column surfaced as a masked 500, an empty name stored a deal
    // with no name, and a NEGATIVE value was accepted outright — a real
    // pipeline-total corruption, not just an unhelpful error.
    //
    // Only an explicitly supplied bad value is rejected; omitting a field
    // still leaves it untouched, so partial updates are unaffected. Messages
    // match createDeal's for the value cases so the two paths read alike.
    if (req.body.name !== undefined && !String(req.body.name ?? '').trim()) {
      res.status(400).json({ success: false, message: 'Deal name cannot be blank.' });
      return;
    }
    if (req.body.value !== undefined) {
      if (req.body.value === null || req.body.value === '') {
        res.status(400).json({ success: false, message: 'value is required.' });
        return;
      }
      const v = Number(req.body.value);
      if (!Number.isFinite(v) || v < 0) {
        res.status(400).json({ success: false, message: 'value must be a non-negative number.' });
        return;
      }
    }

    const fields = ['name','title','lead_id','value','currency','base_amount_usd','pipeline_id','pipeline_name','deal_type','stage','probability','expected_close_date','close_date_is_past','close_date_override_reason','forecast_category','assigned_to','description','next_step','next_step_due_date','next_step_owner','next_step_status','notes','company_name','company_id','contact_name','contact_email','contact_title','stakeholders','competitors','source','priority','tags','product','contract_term','payment_terms','attachment_metadata','win_prob_override_reason','win_prob_ai','momentum_score','is_test','sales_drive_folder','agreement_url','account_module_setup','client_discovers','discovery_date','platform_fee','custom_fee','license_fee','onboarding_fee','white_labelling_fee','exchange_rate','nr_margin','start_date','contract_end_date','country','account_industry'];
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

    fields.forEach(f => {
      if (req.body[f] === undefined) return;
      updates.push(`${f} = $${i++}`);
      // JSONB columns must be stringified to match the create path; everything
      // else — including text[] `tags` — passes through untouched. See
      // JSONB_ARRAY_COLUMNS above for why the distinction matters. Same shape
      // as leadsController.updateLead's own tags/custom_fields split.
      if (JSONB_ARRAY_COLUMNS.has(f)) params.push(JSON.stringify(req.body[f] ?? []));
      else params.push(req.body[f]);
    });
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

/**
 * POST /api/v1/deals/bulk
 * Body: { action: 'stage'|'owner'|'tag'|'archive'|'unarchive'|'delete',
 *         deal_ids: string[], payload?: { stage?, owner?, tag? } }
 *
 * Why this exists as one endpoint rather than N requests from the browser:
 * selecting 40 deals and changing their owner should either happen or not. Done
 * client-side it is 40 independent requests that can half-succeed, with no way
 * to report which ones did — and the UI would have to guess what to show. The
 * deals board reported these as done while calling console.log; Phase 0 made it
 * admit nothing was saved; this makes it true.
 *
 * Semantics:
 *   - Everything runs in ONE transaction. Any error rolls the whole batch back.
 *   - Ids that do not exist in the caller's tenant do NOT abort the batch. They
 *     are reported in `not_found`, because one stale id in a selection should
 *     not discard 39 legitimate changes.
 *   - 'stage' writes a deal_stage_history row per deal, exactly like the single
 *     transition endpoint, so a bulk move is as auditable as an individual one.
 */
const BULK_ACTIONS = ['stage', 'owner', 'tag', 'archive', 'unarchive', 'delete'] as const;
type BulkAction = typeof BULK_ACTIONS[number];

export const bulkUpdateDeals = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const client = await pool.connect();
  try {
    const tenantId = requireTenantId(req);
    const { action, deal_ids, payload } = req.body as {
      action: BulkAction;
      deal_ids: string[];
      payload?: { stage?: string; owner?: string; tag?: string };
    };

    if (!BULK_ACTIONS.includes(action)) {
      res.status(400).json({ success: false, message: `action must be one of: ${BULK_ACTIONS.join(', ')}` });
      return;
    }
    if (!Array.isArray(deal_ids) || deal_ids.length === 0) {
      res.status(400).json({ success: false, message: 'deal_ids must be a non-empty array' });
      return;
    }
    // A selection large enough to time out should be rejected, not attempted.
    if (deal_ids.length > 500) {
      res.status(400).json({ success: false, message: 'A bulk action is limited to 500 deals at a time' });
      return;
    }
    if (action === 'stage' && !payload?.stage) {
      res.status(400).json({ success: false, message: 'payload.stage is required for the stage action' });
      return;
    }
    if (action === 'owner' && !payload?.owner) {
      res.status(400).json({ success: false, message: 'payload.owner is required for the owner action' });
      return;
    }
    if (action === 'tag' && !payload?.tag?.trim()) {
      res.status(400).json({ success: false, message: 'payload.tag is required for the tag action' });
      return;
    }

    await client.query('BEGIN');

    // Resolve which ids actually belong to this tenant, and lock them.
    const existing = await client.query(
      'SELECT id, stage, probability FROM deals WHERE id = ANY($1::varchar[]) AND tenant_id = $2 FOR UPDATE',
      [deal_ids, tenantId],
    );
    const found = existing.rows;
    const foundIds = found.map(r => r.id);
    const notFound = deal_ids.filter(id => !foundIds.includes(id));

    if (foundIds.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({
        success: false,
        message: 'None of those deals exist in your account',
        affected: 0, requested: deal_ids.length, not_found: notFound,
      });
      return;
    }

    let affected = 0;

    switch (action) {
      case 'delete': {
        const r = await client.query(
          'DELETE FROM deals WHERE id = ANY($1::varchar[]) AND tenant_id = $2 RETURNING id',
          [foundIds, tenantId],
        );
        affected = r.rowCount ?? 0;
        break;
      }

      case 'archive':
      case 'unarchive': {
        const r = await client.query(
          `UPDATE deals SET is_archived = $1, updated_at = NOW()
           WHERE id = ANY($2::varchar[]) AND tenant_id = $3 RETURNING id`,
          [action === 'archive', foundIds, tenantId],
        );
        affected = r.rowCount ?? 0;
        break;
      }

      case 'owner': {
        const r = await client.query(
          `UPDATE deals SET assigned_to = $1, updated_at = NOW()
           WHERE id = ANY($2::varchar[]) AND tenant_id = $3 RETURNING id`,
          [payload!.owner, foundIds, tenantId],
        );
        affected = r.rowCount ?? 0;
        break;
      }

      case 'tag': {
        // Append without duplicating. deals.tags is text[].
        const r = await client.query(
          `UPDATE deals
           SET tags = CASE WHEN $1 = ANY(COALESCE(tags, '{}')) THEN tags
                           ELSE array_append(COALESCE(tags, '{}'), $1) END,
               updated_at = NOW()
           WHERE id = ANY($2::varchar[]) AND tenant_id = $3 RETURNING id`,
          [payload!.tag!.trim(), foundIds, tenantId],
        );
        affected = r.rowCount ?? 0;
        break;
      }

      case 'stage': {
        const toStage = payload!.stage!;
        // Same probability rule as the single-deal transition: the pipeline
        // stage default, or the deal's existing value when there is no match.
        const stageRow = await client.query(
          `SELECT probability FROM pipeline_stages
           WHERE tenant_id = $1
             AND lower(replace(name, ' ', '-')) = lower(replace($2, ' ', '-'))
           LIMIT 1`,
          [tenantId, toStage],
        );
        const stageDefault: number | null = stageRow.rows[0]?.probability ?? null;
        const changedBy = await resolveActorName(req);

        // Deals already in the target stage are left alone, so a bulk move does
        // not write no-op history rows.
        const moving = found.filter(d => d.stage !== toStage);
        for (const deal of moving) {
          const nextProbability = stageDefault ?? deal.probability ?? null;
          await client.query(
            `UPDATE deals SET stage = $1, probability = $2, updated_at = NOW()
             WHERE id = $3 AND tenant_id = $4`,
            [toStage, nextProbability, deal.id, tenantId],
          );
          await client.query(
            `INSERT INTO deal_stage_history
               (deal_id, from_stage, to_stage, probability, probability_override,
                reason_code, changed_by, tenant_id)
             VALUES ($1,$2,$3,$4,false,'bulk-update',$5,$6)`,
            [deal.id, deal.stage, toStage, nextProbability, changedBy, tenantId],
          );
        }
        affected = moving.length;
        break;
      }
    }

    await client.query('COMMIT');

    const skipped = foundIds.length - affected;
    res.json({
      success: true,
      action,
      affected,
      requested: deal_ids.length,
      not_found: notFound,
      // Say plainly when the number touched is not the number asked for, rather
      // than letting the UI report a round "N deals updated".
      ...(notFound.length || skipped
        ? {
            message:
              `${affected} of ${deal_ids.length} updated` +
              (notFound.length ? `; ${notFound.length} not found in your account` : '') +
              (skipped ? `; ${skipped} already in that state` : ''),
          }
        : {}),
    });
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
