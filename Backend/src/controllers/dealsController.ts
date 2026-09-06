import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireTenantId } from '../middleware/tenant';
import { foreignIdsInTenant } from '../utils/tenantScope';
import { resolveStageForWrite, findStage, STAGE_NOT_IN_WORKSPACE } from '../utils/pipelineStages';
import { resolveActorName } from '../utils/actorName';
import { workspaceDefaultCurrency } from './workspaceController';

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
             -- The stage field comes from pipeline_stages. There is no
             -- deals.stage column any more: migration 038 dropped it, and this
             -- alias is now the only source of the field.
             --
             -- IT WAS ADDED ONE PHASE BEFORE THE DROP, DELIBERATELY (C0). While
             -- both existed, d.* also carried a stage key and node-pg's row
             -- object took the LAST field of a duplicated name, so this alias
             -- won and the two were provably identical across every live deal.
             -- Landing the projection first meant the response shape did not
             -- change on the day the column went — which the before/after
             -- payload diff confirmed: 24 deals, zero differing fields or
             -- values. Dropping the column without it would have turned 167
             -- frontend reads of deal.stage into undefined: no type error, no
             -- failing test, exactly the silent-failure class this project
             -- keeps paying for.
             --
             -- (No backticks in this comment on purpose: it lives inside a JS
             -- template literal, and one would close the string. CLAUDE.md
             -- lesson 7 — and I did it here anyway before catching it.)
             ps.slug AS stage,
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
      -- Tenant-matched like every other join here: pipeline_stages.id is a
      -- global primary key, so without it a bad stage_id could project another
      -- workspace's stage name. LEFT so a deal is never dropped from the list
      -- by a stage that cannot be resolved.
      LEFT JOIN pipeline_stages ps ON ps.id = d.stage_id AND ps.tenant_id = d.tenant_id
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

    // Filters on the DERIVED slug now that deals.stage is gone (migration 038).
    // The join is already in the FROM clause for the projection.
    if (stage)       { query += ` AND ps.slug = $${i++}`;            params.push(stage); }
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
              GREATEST(0, EXTRACT(epoch FROM (NOW() - d.updated_at)) / 86400)::int AS days_since_contact,
              -- PHASE C0, same reasoning as getDeals: see the long note there.
              ps.slug AS stage
       FROM deals d
       LEFT JOIN pipeline_stages ps ON ps.id = d.stage_id AND ps.tenant_id = d.tenant_id
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

    // The id comes from the column DEFAULT (migration 031:
    // 'D' || LPAD(nextval('deals_id_seq'), 3, '0')), so it is neither computed
    // nor sent here. The old MAX(id)+1 raced across concurrent requests —
    // measured at 6 to 7 of 10 lost writes at ten concurrent creates, each
    // arriving as a masked 500 — because the maximum was read in one statement
    // and used in another with an await between. nextval() is atomic.

    // The workspace's default currency actually DRIVES new deals rather than
    // only being displayed in Settings — a preference that changes nothing is a
    // decorative one. Looked up only when the caller did not name a currency, so
    // the common path costs no extra round trip, and it falls back to the
    // column's own 'USD' default when the workspace has not chosen one.
    const resolvedCurrency = currency || (await workspaceDefaultCurrency(tenantId)) || 'USD';

    // STAGE. deals.stage_id is NOT NULL as of migration 037, so this cannot be
    // skipped: an unresolved stage would reach Postgres as a raw 23502 and be
    // masked as a bare 500, which is the failure this file already unmasked once
    // for deals.value. Resolved here, as a clean 400 naming the field.
    //
    // The fallback is the deal's OWN pipeline's first open stage. That fixes a
    // real latent bug rather than merely satisfying the constraint: this path
    // used to default `pipeline_id || 'new-business'` and `stage || 'prospecting'`
    // INDEPENDENTLY, so a deal created with pipeline_id 'renewals' and no stage
    // was written into 'prospecting' — a stage that does not exist in the
    // renewals pipeline. The form always sends a stage so it was never reached
    // through the UI, but the API is not the form.
    const resolvedPipeline = pipeline_id || 'new-business';
    const resolved = await resolveStageForWrite(tenantId, resolvedPipeline, stage);
    if (resolved.error || !resolved.stage) {
      res.status(400).json({ success: false, message: resolved.error ?? STAGE_NOT_IN_WORKSPACE });
      return;
    }
    const stageRow = resolved.stage;

    const result = await pool.query(
      `INSERT INTO deals
         (name, title, lead_id, value, currency, base_amount_usd,
          pipeline_id, pipeline_name, deal_type,
          probability, expected_close_date,
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
          stage_id, tenant_id)
       VALUES
         ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43,$44,$45,$46,$47,$48,$49,$50,$51,$52,$53,$54,$55,$56)
       RETURNING *`,
      [
        dealName, title || dealName, lead_id, value,
        resolvedCurrency, base_amount_usd ?? value,
        resolvedPipeline, pipeline_name || 'New Business',
        deal_type || 'new-business',
        // The dual-write is over: deals.stage is dropped (migration 038) and
        // stage_id below is the only stored stage. The response still carries a
        // `stage` field — see the projection in getDeals and the spread on the
        // response — so nothing downstream changed shape.
        probability || 0, expected_close_date,
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
        stageRow.id,
        tenantId,
      ]
    );
    // RETURNING * cannot join, but the resolved stage row is already in scope,
    // so the response carries the same `stage` the read paths project rather
    // than the raw column. Keeps every response shape identical through C2.
    res.status(201).json({ success: true, data: { ...result.rows[0], stage: stageRow.slug } });
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

    // STAGE, kept in step with stage_id. This generic update loop writes any
    // field named in `fields`, so before 037 a caller could set `stage` to any
    // string at all and nothing validated it — which is how deals ended up in
    // stages no configuration listed. Now an explicitly supplied stage is
    // resolved against the deal's own pipeline (the one it is being moved to, if
    // that is changing in the same request) and both columns are written
    // together. An omitted stage leaves both untouched, so partial updates are
    // unaffected.
    let resolvedStageId: string | null = null;
    if (req.body.stage !== undefined) {
      const currentRow = await pool.query(
        'SELECT pipeline_id FROM deals WHERE id = $1 AND tenant_id = $2',
        [req.params.id, tenantId],
      );
      if (!currentRow.rows[0]) {
        res.status(404).json({ success: false, message: 'Deal not found' });
        return;
      }
      const targetPipeline = req.body.pipeline_id ?? currentRow.rows[0].pipeline_id;
      const found = await findStage(tenantId, targetPipeline, String(req.body.stage ?? '').trim());
      if (!found) {
        res.status(400).json({ success: false, message: STAGE_NOT_IN_WORKSPACE });
        return;
      }
      resolvedStageId = found.id;
      // Nothing to keep in step any more — deals.stage is gone (migration 038)
      // and `stage` is no longer in the `fields` list below, so a caller cannot
      // write it directly either. stage_id is appended after the loop.
    }

    const fields = ['name','title','lead_id','value','currency','base_amount_usd','pipeline_id','pipeline_name','deal_type','probability','expected_close_date','close_date_is_past','close_date_override_reason','forecast_category','assigned_to','description','next_step','next_step_due_date','next_step_owner','next_step_status','notes','company_name','company_id','contact_name','contact_email','contact_title','stakeholders','competitors','source','priority','tags','product','contract_term','payment_terms','attachment_metadata','win_prob_override_reason','win_prob_ai','momentum_score','is_test','sales_drive_folder','agreement_url','account_module_setup','client_discovers','discovery_date','platform_fee','custom_fee','license_fee','onboarding_fee','white_labelling_fee','exchange_rate','nr_margin','start_date','contract_end_date','country','account_industry'];
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
    // The other half of the dual-write. `stage` went in through the generic loop
    // above (already normalised to the resolved slug); stage_id is not in
    // `fields` because it is never accepted from a request body — a caller names
    // a stage, the server decides which row that is.
    if (resolvedStageId !== null) {
      updates.push(`stage_id = $${i++}`);
      params.push(resolvedStageId);
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
/**
 * The caller's display name, for attribution on a record they create.
 *
 * NO QUERY. `protect` already read this account to check is_active and
 * token_version, and attaches first_name/last_name to req.user — so this reads
 * what is already in hand. Before that read existed, each of the four
 * controllers needing a name issued its own `SELECT ... FROM users`, which is
 * why protect's new lookup is net zero here rather than an extra round trip.
 *
 * One of those four copies (dealsController) was missing its `tenant_id`
 * predicate and matched on id alone — a cross-workspace read waiting for two
 * workspaces to share an id. Consolidating removes that as well as the queries.
 */
// Moved to utils/actorName.ts when the stage-configuration controller needed it
// too — see that file for why a fifth copy was not the answer.


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
    //
    // LOCK FIRST, RESOLVE THE SLUG SECOND — DELIBERATELY TWO STATEMENTS.
    //
    // The obvious version of this joins pipeline_stages and projects ps.slug in
    // the same locking SELECT. It is wrong under exactly the contention it
    // exists to handle, and it is wrong SILENTLY. When this statement blocks on
    // another transaction's lock, Postgres re-runs the plan through EvalPlanQual
    // after that transaction commits: the locked relation is re-fetched, but the
    // other side of the join is NOT — it keeps the tuple read before the wait.
    // So if the winning transaction moved the deal, d.stage_id now points at a
    // different stage than the stale ps tuple, the LEFT JOIN finds nothing, and
    // ps.slug comes back NULL. The audit trail then records from_stage = null
    // for a deal that plainly had a stage, breaking the history chain.
    //
    // Measured, not reasoned: a probe holding a stage move in one connection
    // while this SELECT waited in another returned {stage: null} with the join
    // and the correct slug with these two statements. It is also what the
    // concurrency round-trip caught first.
    const current = await client.query(
      `SELECT id, probability, pipeline_id, stage_id
         FROM deals WHERE id = $1 AND tenant_id = $2 FOR UPDATE`,
      [req.params.id, tenantId],
    );
    if (!current.rows[0]) {
      await client.query('ROLLBACK');
      res.status(404).json({ success: false, message: 'Deal not found' });
      return;
    }
    // deal_stage_history.from_stage is a TEXT SNAPSHOT with no FK (design §2.4),
    // so it still needs a string — it just no longer has a column on deals to
    // read it from. This runs after the lock is held, so it sees the committed
    // stage_id rather than a pre-wait snapshot of it.
    const fromRow = await client.query(
      `SELECT slug FROM pipeline_stages WHERE id = $1 AND tenant_id = $2`,
      [current.rows[0].stage_id, tenantId],
    );
    current.rows[0].stage = fromRow.rows[0]?.slug ?? null;

    const fromStage = current.rows[0].stage as string | null;
    if (fromStage === to_stage) {
      await client.query('ROLLBACK');
      res.json({ success: true, data: current.rows[0], message: 'Deal is already in that stage' });
      return;
    }

    // THE TARGET STAGE IS NOW A REAL ROW, RESOLVED ONCE.
    //
    // This used to match pipeline_stages by `lower(replace(name,' ','-'))`
    // against the requested slug — a normalising join that worked by luck of the
    // current values, silently found nothing for the two stages that had no row
    // at all, and validated the destination not one bit: any string whatsoever
    // was an acceptable to_stage, which is how deals reached stages no
    // configuration listed. Resolution now happens against the deal's own
    // pipeline and an unknown stage is a clean 400.
    const target = await findStage(tenantId, current.rows[0].pipeline_id, to_stage, client);
    if (!target) {
      await client.query('ROLLBACK');
      res.status(400).json({ success: false, message: STAGE_NOT_IN_WORKSPACE });
      return;
    }
    // A retired stage still holds the deals already in it, but nothing may move
    // INTO it — that is what retirement means, and it is why this check is here
    // rather than only in the stage picker.
    if (target.archived_at) {
      await client.query('ROLLBACK');
      res.status(409).json({
        success: false,
        message: `"${target.name}" has been retired, so deals can no longer be moved into it`,
      });
      return;
    }

    // Probability: an explicit override wins; otherwise the stage's own default,
    // read off the row we just resolved rather than looked up a second time.
    // A stage with no probability keeps the deal's existing one rather than
    // guessing — NULL means "not set", and 0 would be a claim.
    const isOverride = probability !== undefined;
    const nextProbability: number | null = isOverride
      ? Number(probability)
      : (target.probability ?? current.rows[0].probability ?? null);

    const updated = await client.query(
      `UPDATE deals SET probability = $1, stage_id = $2, updated_at = NOW()
       WHERE id = $3 AND tenant_id = $4 RETURNING *`,
      [nextProbability, target.id, req.params.id, tenantId],
    );

    const changedBy = resolveActorName(req);
    await client.query(
      `INSERT INTO deal_stage_history
         (deal_id, from_stage, to_stage, probability, probability_override,
          reason_code, note, changed_by, tenant_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      // target.slug, not the raw to_stage: the audit row must say what the deal
      // actually became, or history and the deal disagree about the same move.
      [req.params.id, fromStage, target.slug, nextProbability, isOverride,
       reason_code ?? null, note ?? null, changedBy, tenantId],
    );

    await client.query('COMMIT');
    res.json({ success: true, data: { ...updated.rows[0], stage: target.slug } });
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

    // Deals a stage move could not touch, and why. Reported in the response
    // rather than folded into `skipped`, which cannot say the reason.
    let stageSkips: { noSuchStage: string[]; retired: string[] } | null = null;

    await client.query('BEGIN');

    // Resolve which ids actually belong to this tenant, and lock them.
    const existing = await client.query(
      // Lock only, no join — see the EvalPlanQual note on the single-deal move
      // above. A blocked locking SELECT re-fetches the locked rows but reuses
      // the stale joined ones, so a projected ps.slug can come back NULL for a
      // deal that has a stage.
      `SELECT id, probability, pipeline_id, stage_id
         FROM deals WHERE id = ANY($1::varchar[]) AND tenant_id = $2 FOR UPDATE`,
      [deal_ids, tenantId],
    );
    // Slugs for the audit snapshot, resolved once for the whole batch after the
    // locks are held. Tenant-scoped: pipeline_stages.id is a global primary key,
    // so id alone would read across the workspace boundary.
    const slugRows = await client.query(
      `SELECT id, slug FROM pipeline_stages WHERE id = ANY($1::uuid[]) AND tenant_id = $2`,
      [existing.rows.map(r => r.stage_id).filter(Boolean), tenantId],
    );
    const slugById = new Map<string, string>(slugRows.rows.map(r => [r.id, r.slug]));
    for (const row of existing.rows) row.stage = slugById.get(row.stage_id) ?? null;

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
        const changedBy = resolveActorName(req);

        // A BULK SELECTION CAN SPAN PIPELINES, so one slug cannot be resolved
        // once for the whole batch. "qualified" exists in new-business and not
        // in renewals; resolving globally would either move a renewals deal into
        // another pipeline's stage or fail the whole batch over one deal.
        //
        // So each deal is resolved against ITS OWN pipeline, and the ones whose
        // pipeline has no such stage are reported rather than silently skipped —
        // the same stance as `not_found` above. The previous code validated
        // nothing at all: any string was written to every selected deal.
        const stageCache = new Map<string, Awaited<ReturnType<typeof findStage>>>();
        const noSuchStage: string[] = [];
        const retired: string[] = [];
        let moved = 0;

        for (const deal of found) {
          const pipelineSlug = deal.pipeline_id as string;
          if (!stageCache.has(pipelineSlug)) {
            stageCache.set(pipelineSlug, await findStage(tenantId, pipelineSlug, toStage, client));
          }
          const target = stageCache.get(pipelineSlug);

          if (!target) { noSuchStage.push(deal.id); continue; }
          if (target.archived_at) { retired.push(deal.id); continue; }
          // Already there: left alone, so a bulk move writes no no-op history.
          if (deal.stage === target.slug) continue;

          const nextProbability = target.probability ?? deal.probability ?? null;
          await client.query(
            `UPDATE deals SET probability = $1, stage_id = $2, updated_at = NOW()
             WHERE id = $3 AND tenant_id = $4`,
            [nextProbability, target.id, deal.id, tenantId],
          );
          await client.query(
            `INSERT INTO deal_stage_history
               (deal_id, from_stage, to_stage, probability, probability_override,
                reason_code, changed_by, tenant_id)
             VALUES ($1,$2,$3,$4,false,'bulk-update',$5,$6)`,
            [deal.id, deal.stage, target.slug, nextProbability, changedBy, tenantId],
          );
          moved++;
        }

        // Every selected deal failing for the same reason is a mistake in the
        // request, not a partial success — answer it as one rather than
        // reporting "0 deals updated" and calling that a 200.
        if (moved === 0 && noSuchStage.length === found.length && found.length > 0) {
          await client.query('ROLLBACK');
          res.status(400).json({ success: false, message: STAGE_NOT_IN_WORKSPACE });
          return;
        }

        affected = moved;
        stageSkips = { noSuchStage, retired };
        break;
      }
    }

    await client.query('COMMIT');

    // "already in that state" was the only explanation `skipped` could offer, so
    // deals the stage move could not touch have to be subtracted out of it —
    // otherwise a deal whose pipeline lacks the stage is reported as one that
    // was already in it, which is the wrong reason dressed as a right one.
    const unmovable = (stageSkips?.noSuchStage.length ?? 0) + (stageSkips?.retired.length ?? 0);
    const skipped = foundIds.length - affected - unmovable;

    res.json({
      success: true,
      action,
      affected,
      requested: deal_ids.length,
      not_found: notFound,
      ...(stageSkips && unmovable
        ? {
            stage_not_in_pipeline: stageSkips.noSuchStage,
            stage_retired: stageSkips.retired,
          }
        : {}),
      // Say plainly when the number touched is not the number asked for, rather
      // than letting the UI report a round "N deals updated".
      ...(notFound.length || skipped || unmovable
        ? {
            message:
              `${affected} of ${deal_ids.length} updated` +
              (notFound.length ? `; ${notFound.length} not found in your account` : '') +
              (skipped ? `; ${skipped} already in that state` : '') +
              (stageSkips?.noSuchStage.length
                ? `; ${stageSkips.noSuchStage.length} in a pipeline that has no such stage` : '') +
              (stageSkips?.retired.length
                ? `; ${stageSkips.retired.length} could not move into a retired stage` : ''),
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
