/**
 * The saved-report query definition. Structured, versioned, and NEVER SQL.
 *
 * Design: REPORTS_QUERY_BUILDER_DESIGN.md §1.1.
 *
 * ─── THE ONE PROPERTY EVERYTHING ELSE RESTS ON ────────────────────────────
 *
 * Every `module` and `field` here is a KEY INTO A SERVER-SIDE REGISTRY, never a
 * table name, a column name or a fragment. `"deals.value"` is looked up;
 * `"deals.value; DROP TABLE deals"` is not a dangerous string, it is a key that
 * does not exist, and the request is a 400 before any SQL is assembled.
 *
 * Filter VALUES are the only client-supplied data that reaches Postgres, and
 * they are always bound parameters. Nothing in this file is ever interpolated.
 */

/**
 * Bumped when the shape below changes incompatibly.
 *
 * A saved report is stored configuration that outlives the code that wrote it:
 * a v1 definition must still run — or say clearly that it cannot — after the
 * registry grows. A definition whose version this server does not know is an
 * error with a message, never a best-effort parse, because a silently
 * half-understood report is one that reports the wrong number.
 */
export const DEFINITION_VERSION = 1;

/** Aggregations a metric may use. Keys, mapped to fixed SQL by the builder. */
export const AGGREGATIONS = ['count', 'count_distinct', 'sum', 'avg', 'min', 'max'] as const;
export type Aggregation = (typeof AGGREGATIONS)[number];

/** Filter operators. Keys, mapped to fixed SQL. No operator is ever taken verbatim. */
export const OPERATORS = [
  'eq', 'ne', 'in', 'not_in', 'gt', 'gte', 'lt', 'lte',
  'between', 'is_null', 'is_not_null', 'contains',
] as const;
export type Operator = (typeof OPERATORS)[number];

export type SortDirection = 'asc' | 'desc';

export interface ReportDimension {
  /** A field key, e.g. "companies.industry". */
  field: string;
}

export interface ReportMetric {
  agg: Aggregation;
  /** A field key. Required for every aggregation except `count`. */
  field?: string;
  /** Optional label for the output column; display only, never used in SQL. */
  label?: string;
}

export interface ReportFilter {
  field: string;
  op: Operator;
  /**
   * Bound, never interpolated. `between` takes a two-element array, `in` and
   * `not_in` take an array, `is_null` / `is_not_null` take nothing.
   */
  value?: unknown;
}

export interface ReportSort {
  /** Either a field key, or `metric:N` naming the Nth metric by position. */
  by: string;
  dir: SortDirection;
}

export interface ReportDefinition {
  v: number;
  /** Module key for the base table. */
  base: string;
  /** Module keys joined to the base. Validated against the registry's join graph. */
  joins?: string[];
  dimensions?: ReportDimension[];
  metrics?: ReportMetric[];
  filters?: ReportFilter[];
  sort?: ReportSort[];
  /** Capped by MAX_ROWS in the builder; a larger request is clamped, not refused. */
  limit?: number;
}

/**
 * 5,000 rows, per the product decision of 2026-09-19.
 *
 * The builder always asks Postgres for MAX_ROWS + 1. Fetching one more row than
 * anyone will see is how truncation is DETECTED rather than assumed: if the
 * extra row comes back, the result was cut and the response says so. A plain
 * `LIMIT 5000` returning exactly 5,000 rows is indistinguishable from a report
 * that genuinely has 5,000 — and a silently truncated chart is a wrong chart.
 */
export const MAX_ROWS = 5000;

/** Per the same decision. Applied as a transaction-scoped statement_timeout. */
export const STATEMENT_TIMEOUT_MS = 10_000;

/**
 * Above this share of seeded input, disclosure moves ABOVE the chart rather than
 * sitting beside it. Product decision, 2026-09-19.
 */
export const MOSTLY_SEEDED_THRESHOLD = 0.5;
