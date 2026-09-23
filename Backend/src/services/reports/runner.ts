import { buildReportQuery, buildProvenanceQuery, ReportDefinitionError } from './queryBuilder';
import { runScopedReportQuery } from '../../config/reportsDatabase';
import {
  MAX_ROWS, STATEMENT_TIMEOUT_MS, MOSTLY_SEEDED_THRESHOLD, type ReportDefinition,
} from './types';

/**
 * RUNNING A REPORT — and saying what it was computed from.
 *
 * P3 Phase 3. Every run produces a `provenance` block, and it is produced HERE
 * rather than by each caller, so no card can render a figure without it and no
 * two cards can describe their input differently.
 *
 * ─── WHY PROVENANCE IS NOT OPTIONAL ──────────────────────────────────────
 *
 * Wave 6 established the number that makes this necessary: of the deals
 * carrying a `company_id`, 13 of 16 are seeded demo data. A coverage figure
 * alone ("89% of deals are linked") is TRUE and still invites the reader to
 * trust the chart; "81% of the rows behind this are demo data" is the fact that
 * changes how they read it. Reporting either number alone misleads, so the
 * block carries both and the sentence is composed once, server-side.
 */

export class ReportTimeout extends Error {
  constructor() {
    super(`This report took longer than ${STATEMENT_TIMEOUT_MS / 1000}s and was stopped. `
      + 'Narrow the date range or add a filter.');
    this.name = 'ReportTimeout';
  }
}

export interface CoverageEntry {
  /**
   * WHAT KIND OF GAP THIS IS, and the two are not interchangeable.
   *
   * `join`      — base rows that found a row in a joined module. A deal with no
   *               `company_id` cannot reach `companies.industry`.
   * `dimension` — base rows that actually have a value for a field being
   *               grouped by. This one was MISSING until Phase 6 and its
   *               absence was concealing the larger of the two gaps: a
   *               dimension reached through a SUPPORT SOURCE (`users`,
   *               `pipeline_stages`) produced no coverage entry at all, because
   *               coverage was built only from `definition.joins`. Grouping live
   *               deals by "Owner (linked user)" put 17 of 18 rows in one
   *               unlabelled bucket and the disclosure said nothing about it.
   */
  kind: 'join' | 'dimension';
  /** The module key for a join, or the field key for a dimension. */
  key: string;
  label: string;
  /** Base rows that matched the join / have a value for the dimension. */
  matched: number;
  /** Base rows considered. */
  of: number;
}

export interface Provenance {
  /** Rows in the returned result set, after grouping and after truncation. */
  rows_returned: number;
  /** Underlying rows the result was computed from, after filters and is_test. */
  rows_matched: number;
  /** NULL when the base module has no `is_seed` column — never 0 in that case. */
  rows_seeded: number | null;
  rows_real: number | null;
  /** 0..1, or null when not measurable. */
  seeded_share: number | null;
  /** True when seeded_share exceeds the 50% threshold. Drives placement, not wording. */
  mostly_seeded: boolean;
  /** Rows excluded for being test data. Reported, not merely applied. */
  excluded_test: number;
  coverage: CoverageEntry[];
  /**
   * The currencies the aggregated amounts were drawn from, when a sum or
   * average was taken over money. More than one means the figure adds unlike
   * units and is NOT a total — there are no exchange rates in this system, so
   * this is reported rather than resolved.
   *
   * Null when no money was aggregated, which is not the same as one currency.
   */
  currencies: string[] | null;
  truncated: boolean;
  row_limit: number;
  /**
   * The sentence the UI renders. Composed ONCE, here.
   *
   * Served rather than assembled client-side for the reason `assignable_roles`
   * is served: a disclosure each consumer phrases for itself is one that can be
   * softened, shortened, or dropped in a redesign. This one travels with the
   * numbers.
   */
  disclosure: string;
}

export interface ReportRun {
  columns: { key: string; label: string; kind: 'dimension' | 'metric' }[];
  rows: Record<string, unknown>[];
  provenance: Provenance;
  /** Milliseconds, for a later caching decision. Not a cache itself. */
  ms: number;
}

/**
 * THE NAME OF THE NULL BUCKET, defined once and served inside the disclosure
 * sentence so the UI cannot label that row differently from the sentence
 * describing it. The frontend imports this rather than spelling its own.
 */
export const UNATTRIBUTED = 'Not recorded';

/**
 * A JOIN GAP AND A DIMENSION GAP CAN BE THE SAME GAP, and saying it twice makes
 * it read as twice as much missing data.
 *
 * Grouping deals by `companies.industry` produced both "2 of 18 have no
 * accounts linked" and "2 of 18 have no industry recorded" — the same two
 * deals, described once by the reason and once by the consequence.
 *
 * Every row that fails the join necessarily has no value for a dimension of
 * that module, so the dimension count ALREADY INCLUDES the join's. When they
 * are equal the join entry adds nothing and is dropped. When they differ it is
 * kept, because then the two are genuinely different facts — a deal linked to
 * an account that simply has no industry recorded is not the same problem as a
 * deal linked to no account at all, and a reader fixing the data needs to know
 * which they have.
 *
 * Done HERE rather than in each consumer so the sentence and the figures beside
 * it cannot disagree about how many gaps there are.
 */
function dropSubsumedJoins(coverage: CoverageEntry[]): CoverageEntry[] {
  return coverage.filter(c => {
    if (c.kind !== 'join') return true;
    return !coverage.some(d =>
      d.kind === 'dimension'
      && d.key.startsWith(`${c.key}.`)
      // EQUAL, not `<=`. A dimension gap LARGER than its join gap means some
      // rows did reach the joined module and still have no value there — a
      // different fact with a different fix, so both survive. `<=` was the
      // first version and it swallowed exactly that case.
      && d.matched === c.matched);
  });
}

function composeDisclosure(p: Omit<Provenance, 'disclosure'>): string {
  const parts: string[] = [];

  if (p.rows_seeded === null) {
    parts.push(`Based on ${p.rows_matched.toLocaleString()} row${p.rows_matched === 1 ? '' : 's'}. `
      + 'How much of this is seeded demo data is not recorded for this module, so it is not stated '
      + 'rather than assumed to be none.');
  } else if (p.rows_seeded === 0) {
    parts.push(`Based on ${p.rows_matched.toLocaleString()} row${p.rows_matched === 1 ? '' : 's'}, `
      + 'none of it seeded demo data.');
  } else {
    // `rows`, not `row`, was hardcoded here — "Based on 1 rows" reached live
    // data. The other two branches pluralised correctly, which is exactly how
    // it survived: the bug was in the branch nobody read aloud.
    parts.push(p.rows_matched === 1
      // A single row reaching this branch is necessarily the seeded one — the
      // all-real case is handled above — so "1 of them seeded, 0 real" is both
      // clumsy and redundant.
      ? 'Based on 1 row, and it is seeded demo data.'
      : `Based on ${p.rows_matched.toLocaleString()} rows — `
        + `${p.rows_seeded.toLocaleString()} of them seeded demo data, `
        + `${(p.rows_real ?? 0).toLocaleString()} real.`);
  }

  /*
   * "AND ARE NOT COUNTED" WAS FALSE, AND IT SHIPPED.
   *
   * Every join here is a LEFT JOIN, so a base row that matches nothing is NOT
   * dropped — it is kept, and its dimension comes out NULL, so it lands in a
   * bucket of its own. Run against live data, grouping deals by industry
   * produced `{industry: null, value: 140000, count: 2}` sitting in the result
   * while the sentence underneath it said those two rows were not counted.
   *
   * A disclosure that misdescribes the data is worse than no disclosure: it is
   * read as the authoritative account of what the reader is looking at. The
   * wording now says where those rows WENT, and names the bucket with the same
   * words the table uses, so the sentence and the row can be matched up by eye.
   */
  for (const c of p.coverage) {
    const missing = c.of - c.matched;
    if (missing <= 0) continue;
    const of = `${missing.toLocaleString()} of ${c.of.toLocaleString()}`;
    parts.push(
      c.kind === 'join'
        ? `${of} have no ${c.label.toLowerCase()} linked, and are grouped under `
          + `"${UNATTRIBUTED}" rather than dropped.`
        : `${of} have no ${c.label.toLowerCase()} recorded, and are grouped under `
          + `"${UNATTRIBUTED}" rather than dropped.`,
    );
  }

  /*
   * MIXED CURRENCIES MAKE THE HEADLINE FIGURE MEANINGLESS, so this goes
   * immediately after the row count rather than at the end with the footnotes:
   * a reader who stops after one sentence must still have been told.
   */
  if (p.currencies && p.currencies.length > 1) {
    parts.push(`These amounts span ${p.currencies.length} currencies `
      + `(${p.currencies.join(', ')}) and are added together WITHOUT conversion, `
      + 'so the totals are not meaningful as money. Filter to one currency to get a real total.');
  }

  if (p.excluded_test > 0) {
    parts.push(`${p.excluded_test.toLocaleString()} test `
      + `record${p.excluded_test === 1 ? '' : 's'} excluded.`);
  }

  if (p.truncated) {
    parts.push(`Cut off at ${p.row_limit.toLocaleString()} rows — there are more.`);
  }

  return parts.join(' ');
}

/**
 * Build, run, and measure. One transaction per query on the restricted pool, so
 * both are tenant-scoped by RLS and neither can write.
 */
export async function runReport(
  definition: ReportDefinition, tenantId: string,
): Promise<ReportRun> {
  // Throws ReportDefinitionError for a bad definition, which the controller
  // turns into a 400. Compiling IS the validation.
  const q = buildReportQuery(definition, tenantId);
  const p = buildProvenanceQuery(definition, tenantId);

  let result;
  let prov;
  try {
    result = await runScopedReportQuery(q.sql, q.params, tenantId, STATEMENT_TIMEOUT_MS);
    prov = await runScopedReportQuery(p.sql, p.params, tenantId, STATEMENT_TIMEOUT_MS);
  } catch (err) {
    // 57014 is query_canceled, which is what statement_timeout produces.
    if ((err as { code?: string }).code === '57014') throw new ReportTimeout();
    throw err;
  }

  /*
   * TRUNCATION IS DETECTED, NOT ASSUMED. The builder asked for MAX_ROWS + 1
   * precisely so that getting one extra row proves the result was cut. A plain
   * LIMIT returning exactly the cap is indistinguishable from a report that
   * genuinely has that many.
   */
  const truncated = result.rows.length > q.rowLimit;
  const rows = truncated ? result.rows.slice(0, q.rowLimit) : result.rows;

  const c = prov.rows[0] ?? {};
  const rowsMatched = Number(c.rows_matched ?? 0);
  const rowsSeeded = p.seedMeasurable ? Number(c.rows_seeded ?? 0) : null;

  const base: Omit<Provenance, 'disclosure'> = {
    rows_returned: rows.length,
    rows_matched: rowsMatched,
    rows_seeded: rowsSeeded,
    rows_real: rowsSeeded === null ? null : rowsMatched - rowsSeeded,
    seeded_share: rowsSeeded === null || rowsMatched === 0 ? null : rowsSeeded / rowsMatched,
    mostly_seeded:
      rowsSeeded !== null && rowsMatched > 0 && rowsSeeded / rowsMatched > MOSTLY_SEEDED_THRESHOLD,
    excluded_test: Number(c.excluded_test ?? 0),
    currencies: p.measuresMoney ? ((c.currencies as string[] | null) ?? []) : null,
    coverage: dropSubsumedJoins(p.coverage.map((j, i) => ({
      kind: j.kind,
      key: j.key,
      label: j.label,
      matched: Number(c[`cov_${i}_matched`] ?? 0),
      of: rowsMatched,
    }))),
    truncated,
    row_limit: q.rowLimit,
  };

  return {
    columns: q.columns,
    rows,
    provenance: { ...base, disclosure: composeDisclosure(base) },
    ms: result.ms + prov.ms,
  };
}

export { ReportDefinitionError, MAX_ROWS };
