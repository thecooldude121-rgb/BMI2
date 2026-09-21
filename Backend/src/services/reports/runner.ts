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
  /** The joined module, e.g. "companies". */
  join: string;
  label: string;
  /** Base rows that actually matched the join. */
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
    parts.push(`Based on ${p.rows_matched.toLocaleString()} rows — `
      + `${p.rows_seeded.toLocaleString()} of them seeded demo data, `
      + `${(p.rows_real ?? 0).toLocaleString()} real.`);
  }

  for (const c of p.coverage) {
    const missing = c.of - c.matched;
    if (missing > 0) {
      parts.push(`${missing.toLocaleString()} of ${c.of.toLocaleString()} `
        + `have no ${c.label.toLowerCase()} linked and are not counted.`);
    }
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
    coverage: p.coverageJoins.map((j, i) => ({
      join: j.module,
      label: j.label,
      matched: Number(c[`join_${i}_matched`] ?? 0),
      of: rowsMatched,
    })),
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
