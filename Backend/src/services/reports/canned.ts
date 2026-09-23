import { DEFINITION_VERSION, type ReportDefinition } from './types';

/**
 * CANNED REPORTS — definitions the product ships, P3 Phase 6.
 *
 * ─── WHY THESE ARE NOT ROWS IN `saved_reports` ────────────────────────────
 *
 * The obvious alternative is a migration inserting one row per workspace. It
 * was rejected for three reasons, in increasing order of seriousness:
 *
 *   1. A workspace created AFTER the migration would not have them, so the
 *      catalogue would silently differ between tenants by age.
 *   2. They would be editable and deletable, so "the Revenue by Industry
 *      report" would mean something different in each workspace.
 *   3. Improving one would mean a data migration across every tenant rather
 *      than a code change.
 *
 * So they live here, and a workspace gets whatever this file currently says.
 *
 * ─── THE ID PREFIX IS LOAD-BEARING ────────────────────────────────────────
 *
 * `saved_reports.id` is a UUID. `canned:revenue-by-industry` is not a valid
 * UUID and can therefore never collide with a saved report's id, nor be stored
 * as one — Postgres would reject it. That is what lets one route,
 * `/crm/reports/:reportId`, serve both without a second namespace to keep
 * straight.
 */

export const CANNED_PREFIX = 'canned:';

export interface CannedReport {
  id: string;
  name: string;
  description: string;
  category: string;
  definition: ReportDefinition;
  /**
   * What a reader should know BEFORE the numbers, when the shape of the data
   * limits the report in a way the per-run disclosure cannot express.
   *
   * The run's `provenance.disclosure` states what THIS run measured. This
   * states something structural about the workspace's data model that will be
   * true of every run until someone changes the data. Both are shown; they
   * answer different questions.
   */
  caveat?: string;
}

export const CANNED_REPORTS: CannedReport[] = [
  {
    id: `${CANNED_PREFIX}revenue-by-industry`,
    name: 'Revenue by Industry',
    description: 'Closed-won value, grouped by the industry recorded on the account.',
    category: 'Revenue Reports',
    definition: {
      v: DEFINITION_VERSION,
      base: 'deals',
      joins: ['companies'],
      /*
       * CURRENCY IS A DIMENSION, not a footnote, and that is a correctness fix
       * rather than a presentation choice. `deals` live holds 17 USD rows and
       * one AED row, so a single "revenue by industry" column would add
       * 1,157,000 USD to 80,000 AED and print 1,237,000 of nothing. There are
       * no exchange rates in this system and inventing one would be a
       * fabricated number with a decimal point in it.
       *
       * Grouping by currency makes every total a real total. The report gets an
       * extra column; it stops being wrong.
       */
      dimensions: [{ field: 'companies.industry' }, { field: 'deals.currency' }],
      metrics: [
        { agg: 'sum', field: 'deals.value' },
        { agg: 'count' },
      ],
      // Won only — this is a revenue report, not a pipeline one. `stage_type`
      // rather than a slug comparison, because a workspace names its own
      // stages (see utils/pipelinesApi and migration 038).
      filters: [{ field: 'deals.stage_type', op: 'eq', value: 'won' }],
      sort: [{ by: 'metric:0', dir: 'desc' }],
    },
    caveat:
      'Industry lives on the account, not the deal, so only deals linked to an '
      + 'account can be placed in a band. Deals with no account are grouped under '
      + '"Not recorded" rather than dropped — the run note below gives the exact split. '
      + 'Totals are shown per currency because this CRM stores no exchange rates, so '
      + 'adding across currencies would produce a number in no currency at all.',
  },
  {
    id: `${CANNED_PREFIX}pipeline-by-owner`,
    name: 'Pipeline by Owner',
    description: 'Open pipeline value and deal count, grouped by the owning user.',
    category: 'Sales Performance',
    definition: {
      v: DEFINITION_VERSION,
      base: 'deals',
      // `deals.owner_name` resolves the LINKED USER, not the typed-in name.
      dimensions: [{ field: 'deals.owner_name' }, { field: 'deals.currency' }],
      metrics: [
        { agg: 'sum', field: 'deals.value' },
        { agg: 'count' },
      ],
      filters: [{ field: 'deals.stage_type', op: 'eq', value: 'open' }],
      sort: [{ by: 'metric:0', dir: 'desc' }],
    },
    /*
     * THE DELIBERATE CHOICE, AND IT COSTS THIS REPORT MOST OF ITS ROWS.
     *
     * `deals` carries two owner fields: `assigned_to`, a free-text name someone
     * typed, and `assigned_to_user_id`, a real reference. Live, 16 of 18 deals
     * have a typed name and ONE has a linked user.
     *
     * Grouping on the typed name would look far better — 16 of 18 attributed —
     * and would be the same defect this project has removed three times
     * (`forecast_snapshots.rep_name`, `deals.company_name`, the report slug):
     * two people sharing a display name merge into one row, one person typed
     * two ways splits into two, and a rename silently detaches someone from
     * their own history.
     *
     * So it groups on the reference, and the disclosure says plainly how much
     * is unattributed. The fix is the `assigned_to_user_id` backfill, which is
     * a data task and is recorded as not being a P3 prerequisite.
     */
    caveat:
      'Grouped by the user a deal is LINKED to, not the owner name typed on the '
      + 'deal. Most deals currently have only a typed name, so they appear under '
      + '"Not recorded" — the run note below gives the exact count. Grouping by the '
      + 'typed name instead would attribute more deals but would merge two people '
      + 'who share a name, so it is not done.',
  },
];

export const isCannedId = (id: string): boolean => id.startsWith(CANNED_PREFIX);

export const findCanned = (id: string): CannedReport | undefined =>
  CANNED_REPORTS.find(r => r.id === id);
