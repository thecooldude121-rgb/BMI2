/**
 * THE REPORT REGISTRY — the only place a table or column name may appear.
 *
 * Design: REPORTS_QUERY_BUILDER_DESIGN.md §2.1 and §3.
 *
 * A report definition names modules and fields by KEY. This file is what those
 * keys mean. Nothing else in the report path knows a table name, and no code
 * path takes an identifier from a request and puts it into SQL.
 *
 * ─── WHY `employees` CANNOT BE HERE, STRUCTURALLY ─────────────────────────
 *
 * Every module below declares a table that HAS a `tenant_id` column, because
 * `scopedSource()` in queryBuilder.ts emits `WHERE tenant_id = $n` for whatever
 * it is given. `employees` has NO `tenant_id` at all (verified against
 * information_schema, 2026-09-16), so a `ModuleSpec` for it cannot be written
 * that the builder would accept — the HRMS boundary is enforced by the same
 * mechanism as tenant isolation rather than by a comment asking people not to.
 * That matches the call already made in migration 049, which deliberately omits
 * 'employee' from `meetings.related_to_type` unlike `tasks`.
 *
 * ─── EVERY COLUMN BELOW WAS READ FROM THE LIVE SCHEMA ─────────────────────
 *
 * Not from CLAUDE.md's model, which drifts from what is deployed in at least
 * four documented places (`close_date` vs `expected_close_date`,
 * `companies.health_score`, `deals.value` precision, `activities.user_id`).
 * Checked against `information_schema.columns` on 2026-09-19.
 */

export type FieldType = 'string' | 'number' | 'date' | 'datetime' | 'boolean' | 'enum';

export interface FieldSpec {
  /** The SQL expression, written against the module's alias. Never client input. */
  sql: string;
  type: FieldType;
  label: string;
  /** May this field be aggregated with sum/avg/min/max? */
  aggregatable?: boolean;
  /**
   * The module key this field belongs to. A field is only usable when its
   * module is the base or is joined — checked by the builder.
   */
  module: string;
  /**
   * Some fields live on a table the user never names directly (a deal's stage
   * lives on pipeline_stages). Naming that dependency here lets the builder add
   * the source without the definition having to know about it.
   */
  requiresSource?: string;
}

export interface ModuleSpec {
  /** The real table. It MUST have a tenant_id column — see the note above. */
  table: string;
  /** Stable SQL alias. Distinct across all modules so joins never collide. */
  alias: string;
  label: string;
  /**
   * Which other modules this one can join to, and the ON predicate.
   *
   * The predicate is the BUSINESS key only. The builder appends the tenant
   * match itself, so a join written here cannot forget it — see the note on
   * `joinOn` in queryBuilder.ts.
   */
  joins: Record<string, string>;
  /**
   * True when the table carries `is_seed`, so provenance can be reported for
   * rows drawn from it. Absence is reported as "not measured", never as zero.
   */
  hasSeedFlag: boolean;
  /** True when the table carries `is_test`; such rows are always excluded. */
  hasTestFlag: boolean;
}

/**
 * Sources that are never named by a definition but may be pulled in to resolve a
 * field (a deal's stage). They are scoped exactly like any other source.
 */
export const SUPPORT_SOURCES: Record<string, { table: string; alias: string; joinFrom: string; on: string }> = {
  pipeline_stages: {
    table: 'pipeline_stages',
    alias: 'ps',
    joinFrom: 'deals',
    on: 'ps.id = d.stage_id',
  },
  // `users` resolves an owner's display name from deals.assigned_to_user_id.
  // NOTE: that column is populated on 1 of 21 live deals, so a report grouped
  // on it describes almost nothing. The honest owner dimension today is
  // `deals.assigned_to`, a free-text name — see the field's own note.
  users: {
    table: 'users',
    alias: 'u',
    joinFrom: 'deals',
    on: 'u.id = d.assigned_to_user_id',
  },
};

export const REPORT_MODULES: Record<string, ModuleSpec> = {
  deals: {
    table: 'deals', alias: 'd', label: 'Deals',
    joins: {
      companies: 'd.company_id = c.id',
      leads:     'd.lead_id = l.id',
    },
    hasSeedFlag: true, hasTestFlag: true,
  },
  companies: {
    table: 'companies', alias: 'c', label: 'Accounts',
    joins: {},
    hasSeedFlag: true, hasTestFlag: false,
  },
  contacts: {
    table: 'contacts', alias: 'ct', label: 'Contacts',
    joins: { companies: 'ct.company_id = c.id' },
    hasSeedFlag: true, hasTestFlag: false,
  },
  leads: {
    table: 'leads', alias: 'l', label: 'Leads',
    joins: {},
    hasSeedFlag: true, hasTestFlag: false,
  },
  activities: {
    table: 'activities', alias: 'a', label: 'Activities',
    joins: {
      deals:     'a.deal_id = d.id',
      companies: 'a.company_id = c.id',
      contacts:  'a.contact_id = ct.id',
      leads:     'a.lead_id = l.id',
    },
    hasSeedFlag: false, hasTestFlag: false,
  },
};

export const REPORT_FIELDS: Record<string, FieldSpec> = {
  // ── Deals ───────────────────────────────────────────────────────────────
  'deals.id':                  { module: 'deals', sql: 'd.id',                  type: 'string',   label: 'Deal ID' },
  'deals.name':                { module: 'deals', sql: 'd.name',                type: 'string',   label: 'Deal name' },
  'deals.value':               { module: 'deals', sql: 'd.value',               type: 'number',   label: 'Value', aggregatable: true },
  'deals.currency':            { module: 'deals', sql: 'd.currency',            type: 'enum',     label: 'Currency' },
  'deals.expected_close_date': { module: 'deals', sql: 'd.expected_close_date', type: 'date',     label: 'Expected close date' },
  'deals.created_at':          { module: 'deals', sql: 'd.created_at',          type: 'datetime', label: 'Created' },
  'deals.source':              { module: 'deals', sql: 'd.source',              type: 'enum',     label: 'Source' },
  'deals.priority':            { module: 'deals', sql: 'd.priority',            type: 'enum',     label: 'Priority' },
  'deals.forecast_category':   { module: 'deals', sql: 'd.forecast_category',   type: 'enum',     label: 'Forecast category' },
  /*
   * OWNER, AS A DISPLAY NAME, AND LABELLED AS ONE.
   *
   * `deals.assigned_to_user_id` is a real FK but is populated on 1 of 21 live
   * deals; `assigned_to` is free text and carries ownership on the rest. Both
   * are exposed, and the labels say which is which, because a "by owner" report
   * grouped on the FK would silently describe one deal. Neither is backfillable
   * without the fuzzy name-matching this project has refused elsewhere
   * (migrations 039-043), so the honest move is to expose both and disclose the
   * weakness at report time rather than to pick one and hope.
   */
  'deals.assigned_to':         { module: 'deals', sql: 'd.assigned_to',         type: 'string', label: 'Owner (name as entered)' },
  'deals.owner_name':          { module: 'deals', sql: "NULLIF(btrim(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')), '')",
                                 type: 'string', label: 'Owner (linked user)', requiresSource: 'users' },
  'deals.stage':               { module: 'deals', sql: 'ps.slug',               type: 'enum', label: 'Stage', requiresSource: 'pipeline_stages' },
  'deals.stage_name':          { module: 'deals', sql: 'ps.name',               type: 'string', label: 'Stage name', requiresSource: 'pipeline_stages' },
  'deals.stage_type':          { module: 'deals', sql: 'ps.stage_type',         type: 'enum', label: 'Won / lost / open', requiresSource: 'pipeline_stages' },

  // ── Companies ───────────────────────────────────────────────────────────
  'companies.id':       { module: 'companies', sql: 'c.id',       type: 'string', label: 'Account ID' },
  'companies.name':     { module: 'companies', sql: 'c.name',     type: 'string', label: 'Account' },
  'companies.industry': { module: 'companies', sql: 'c.industry', type: 'enum',   label: 'Industry' },
  'companies.size':     { module: 'companies', sql: 'c.size',     type: 'enum',   label: 'Size' },
  'companies.country':  { module: 'companies', sql: 'c.country',  type: 'string', label: 'Country' },
  'companies.revenue':  { module: 'companies', sql: 'c.revenue',  type: 'number', label: 'Revenue', aggregatable: true },

  // ── Contacts ────────────────────────────────────────────────────────────
  'contacts.id':          { module: 'contacts', sql: 'ct.id',          type: 'string', label: 'Contact ID' },
  'contacts.full_name':   { module: 'contacts', sql: "NULLIF(btrim(COALESCE(ct.first_name,'') || ' ' || COALESCE(ct.last_name,'')), '')",
                            type: 'string', label: 'Contact' },
  'contacts.buying_role': { module: 'contacts', sql: 'ct.buying_role', type: 'enum', label: 'Buying role' },
  'contacts.status':      { module: 'contacts', sql: 'ct.status',      type: 'enum', label: 'Status' },
  'contacts.source':      { module: 'contacts', sql: 'ct.source',      type: 'enum', label: 'Source' },
  'contacts.created_at':  { module: 'contacts', sql: 'ct.created_at',  type: 'datetime', label: 'Created' },

  // ── Leads ───────────────────────────────────────────────────────────────
  'leads.id':         { module: 'leads', sql: 'l.id',       type: 'number', label: 'Lead ID' },
  'leads.company':    { module: 'leads', sql: 'l.company',  type: 'string', label: 'Company (as entered)' },
  'leads.industry':   { module: 'leads', sql: 'l.industry', type: 'enum',   label: 'Industry' },
  'leads.status':     { module: 'leads', sql: 'l.status',   type: 'enum',   label: 'Status' },
  'leads.stage':      { module: 'leads', sql: 'l.stage',    type: 'enum',   label: 'Stage' },
  'leads.score':      { module: 'leads', sql: 'l.score',    type: 'number', label: 'Score', aggregatable: true },
  'leads.value':      { module: 'leads', sql: 'l.value',    type: 'number', label: 'Value', aggregatable: true },
  'leads.source':     { module: 'leads', sql: 'l.source',   type: 'enum',   label: 'Source' },
  'leads.created_at': { module: 'leads', sql: 'l.created_at', type: 'datetime', label: 'Created' },

  // ── Activities ──────────────────────────────────────────────────────────
  // The table holds 0 rows live, so every activity report is honestly empty
  // today. Exposed anyway: an empty report that says so beats a missing one.
  'activities.id':           { module: 'activities', sql: 'a.id',           type: 'string',   label: 'Activity ID' },
  'activities.type':         { module: 'activities', sql: 'a.type',         type: 'enum',     label: 'Type' },
  'activities.status':       { module: 'activities', sql: 'a.status',       type: 'enum',     label: 'Status' },
  'activities.direction':    { module: 'activities', sql: 'a.direction',    type: 'enum',     label: 'Direction' },
  'activities.duration':     { module: 'activities', sql: 'a.duration',     type: 'number',   label: 'Duration (min)', aggregatable: true },
  'activities.created_at':   { module: 'activities', sql: 'a.created_at',   type: 'datetime', label: 'Created' },
  'activities.completed_at': { module: 'activities', sql: 'a.completed_at', type: 'datetime', label: 'Completed' },
};

/** Every alias in use, so the builder can assert they never collide. */
export const ALL_ALIASES: string[] = [
  ...Object.values(REPORT_MODULES).map(m => m.alias),
  ...Object.values(SUPPORT_SOURCES).map(s => s.alias),
];
