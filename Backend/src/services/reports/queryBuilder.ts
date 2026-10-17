import {
  REPORT_MODULES, REPORT_FIELDS, SUPPORT_SOURCES, ALL_ALIASES,
  type FieldSpec,
} from './registry';
import {
  AGGREGATIONS, OPERATORS, DEFINITION_VERSION, MAX_ROWS,
  type ReportDefinition, type ReportFilter,
} from './types';

/**
 * THE TENANT-SCOPED QUERY BUILDER.
 *
 * Design: REPORTS_QUERY_BUILDER_DESIGN.md §2. PURE — no database, no clock, no
 * request. It turns a validated definition into `{ sql, params }` and nothing
 * else, so every branch is testable without a connection.
 *
 * ─── THE STRUCTURAL GUARANTEE ─────────────────────────────────────────────
 *
 * This file NEVER emits `FROM deals d`. There is exactly one function that can
 * produce a FROM or JOIN source — `scopedSource()` — and it always wraps the
 * table in a tenant-scoped inline view:
 *
 *     FROM (SELECT * FROM deals WHERE tenant_id = $1) d
 *
 * A table that has not been scoped therefore cannot appear in the query,
 * because the only way to name one is through a function that scopes it.
 * FORGETTING IS NOT AN AVAILABLE MISTAKE.
 *
 * That is deliberately stronger than "remember the WHERE clause", and the
 * reason is this project's own history: the workspace-scoping leak was NOT a
 * missing `WHERE` — it was an unscoped JOIN and an unvalidated foreign id.
 * A single predicate on the base table would leave every join needing its own,
 * which is exactly the omission that happened. Here there is no base/join
 * distinction to get wrong: every source goes through the same function.
 *
 * ─── AND A SECOND PREDICATE ON EVERY JOIN ─────────────────────────────────
 *
 * Each join additionally carries `AND parent.tenant_id = child.tenant_id`. Both
 * halves are needed and neither substitutes for the other: the inline view stops
 * a table being read unscoped, while the tenant match stops a row whose FK
 * already points across workspaces from being read THROUGH the join. Every FK in
 * this schema references a global primary key, so such a row is storable.
 *
 * ─── AND NOTHING FROM THE CLIENT REACHES SQL AS TEXT ──────────────────────
 *
 * Modules, fields, aggregations and operators are all KEYS looked up in the
 * registry. Filter values are bound parameters. There is no interpolation of
 * request data anywhere in this file; the only strings concatenated into SQL
 * come from `registry.ts`.
 */

export class ReportDefinitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReportDefinitionError';
  }
}

const fail = (msg: string): never => { throw new ReportDefinitionError(msg); };

export interface BuiltQuery {
  sql: string;
  params: unknown[];
  /** Output column names, in order, so the caller can label rows. */
  columns: { key: string; label: string; kind: 'dimension' | 'metric' }[];
  /** How many sources were scoped. The executor asserts one predicate each. */
  sourceCount: number;
  /** MAX_ROWS + 1 was requested; more than MAX_ROWS rows back means truncation. */
  rowLimit: number;
}

/**
 * The companion query that measures the ROWS BEHIND a result, so a report can
 * disclose what it was computed from.
 *
 * It shares every scoped source and every filter with the result query — see
 * `mode` on `buildReportQuery`. That sharing is not a convenience: assembling
 * the sources a second time would be a second place to get tenant scoping
 * wrong, which is exactly what Phase 0 exists to prevent.
 */
export interface BuiltProvenanceQuery {
  sql: string;
  params: unknown[];
  sourceCount: number;
  /**
   * False when the base module has no `is_seed` column, so the seeded share
   * CANNOT be measured. The runner reports null in that case, never 0 — a 0
   * that means "not measured" is the defect this project keeps removing.
   */
  seedMeasurable: boolean;
  /** One entry per join, so coverage can be reported per relationship. */
  coverageJoins: { module: string; label: string; alias: string }[];
}

/**
 * THE ONLY WAY TO NAME A TABLE. Emits a tenant-scoped inline view and pushes the
 * tenant parameter. There is no variant of this that omits the predicate, and
 * nothing else in this file concatenates a table name.
 */
function scopedSource(
  table: string, alias: string, tenantId: string, params: unknown[], columns?: string[],
): string {
  params.push(tenantId);
  /*
   * The projection defaults to `*`, and is explicit only where the reports role
   * holds column-level SELECT rather than table-level — `users`, which carries
   * `password_hash`. The column names come from the REGISTRY, never from a
   * request, so this is not an interpolation point.
   */
  const projection = columns?.length ? columns.join(', ') : '*';
  return `(SELECT ${projection} FROM ${table} WHERE tenant_id = $${params.length}) ${alias}`;
}

/**
 * Join predicate = the registry's business key AND the tenant match.
 *
 * The registry deliberately stores ONLY the business key, so that a person
 * adding a join to `registry.ts` cannot forget the tenant half — it is not
 * theirs to write. This is the same reasoning as scopedSource: make the unsafe
 * form unexpressible rather than discouraged.
 */
function joinOn(businessKey: string, leftAlias: string, rightAlias: string): string {
  return `${businessKey} AND ${leftAlias}.tenant_id = ${rightAlias}.tenant_id`;
}

/** Look up a field key, or fail by name. Never falls through to the raw key. */
function fieldOf(key: unknown): FieldSpec & { key: string } {
  if (typeof key !== 'string') fail('A field must be named as a string key');
  const spec = REPORT_FIELDS[key as string];
  if (!spec) fail(`Unknown field "${key}". It is not in the report registry.`);
  return { ...spec, key: key as string };
}

function moduleOf(key: unknown): string {
  if (typeof key !== 'string') fail('A module must be named as a string key');
  if (!REPORT_MODULES[key as string]) {
    fail(`Unknown module "${key}". Reportable modules are: ${Object.keys(REPORT_MODULES).join(', ')}.`);
  }
  return key as string;
}

const AGG_SQL: Record<string, (sql: string) => string> = {
  count:          ()    => 'COUNT(*)',
  count_distinct: (s)   => `COUNT(DISTINCT ${s})`,
  sum:            (s)   => `SUM(${s})`,
  avg:            (s)   => `AVG(${s})`,
  min:            (s)   => `MIN(${s})`,
  max:            (s)   => `MAX(${s})`,
};

/** Operator -> SQL. Every branch binds its value; none interpolates. */
function filterSql(f: ReportFilter, spec: FieldSpec, params: unknown[]): string {
  const col = spec.sql;
  switch (f.op) {
    case 'is_null':     return `${col} IS NULL`;
    case 'is_not_null': return `${col} IS NOT NULL`;
    case 'in':
    case 'not_in': {
      if (!Array.isArray(f.value) || f.value.length === 0) {
        fail(`Filter on "${f.field}" with "${f.op}" needs a non-empty list of values`);
      }
      params.push(f.value);
      return `${col} = ${f.op === 'not_in' ? 'NOT ' : ''}ANY($${params.length})`;
    }
    case 'between': {
      if (!Array.isArray(f.value) || f.value.length !== 2) {
        fail(`Filter on "${f.field}" with "between" needs exactly two values`);
      }
      params.push((f.value as unknown[])[0]);
      const lo = params.length;
      params.push((f.value as unknown[])[1]);
      return `${col} BETWEEN $${lo} AND $${params.length}`;
    }
    case 'contains': {
      if (spec.type !== 'string') fail(`"contains" only applies to text fields; "${f.field}" is ${spec.type}`);
      // The % wrapping happens in the PARAMETER, not in the SQL, so the value
      // is still bound and a value containing % is matched, not interpreted.
      params.push(`%${String(f.value ?? '')}%`);
      return `${col} ILIKE $${params.length}`;
    }
    default: {
      const ops: Record<string, string> = { eq: '=', ne: '<>', gt: '>', gte: '>=', lt: '<', lte: '<=' };
      const op = ops[f.op];
      if (!op) fail(`Unknown operator "${f.op}". Allowed: ${OPERATORS.join(', ')}.`);
      if (f.value === undefined || f.value === null) {
        fail(`Filter on "${f.field}" with "${f.op}" needs a value (use is_null to test for absence)`);
      }
      params.push(f.value);
      return `${col} ${op} $${params.length}`;
    }
  }
}

type BuildMode = 'rows' | 'provenance';

export function buildReportQuery(definition: ReportDefinition, tenantId: string): BuiltQuery {
  return assemble(definition, tenantId, 'rows') as BuiltQuery;
}

/**
 * The provenance companion. Same sources, same filters, different SELECT.
 *
 * The `is_test` exclusion moves from WHERE to a FILTER here, which is what lets
 * the excluded count be REPORTED rather than merely applied: a row hidden by a
 * policy the user cannot see is worth a number.
 */
export function buildProvenanceQuery(
  definition: ReportDefinition, tenantId: string,
): BuiltProvenanceQuery {
  return assemble(definition, tenantId, 'provenance') as BuiltProvenanceQuery;
}

function assemble(
  definition: ReportDefinition, tenantId: string, mode: BuildMode,
): BuiltQuery | BuiltProvenanceQuery {
  if (!definition || typeof definition !== 'object') fail('A report definition is required');
  if (definition.v !== DEFINITION_VERSION) {
    // Never a best-effort parse: a half-understood definition reports a wrong
    // number, which is worse than reporting nothing.
    fail(`This report was saved in definition format v${definition.v}; this server understands v${DEFINITION_VERSION}.`);
  }
  if (!tenantId) fail('A tenant is required to build a report query');

  const params: unknown[] = [];
  const base = moduleOf(definition.base);
  const baseSpec = REPORT_MODULES[base];

  // ── Sources ─────────────────────────────────────────────────────────────
  const active = new Set<string>([base]);
  let from = `FROM ${scopedSource(baseSpec.table, baseSpec.alias, tenantId, params, baseSpec.columns)}`;
  let sourceCount = 1;

  const joinKeys = Array.isArray(definition.joins) ? definition.joins : [];
  for (const j of joinKeys) {
    const mod = moduleOf(j);
    if (mod === base) fail(`"${mod}" is already the base module; it cannot also be joined`);
    if (active.has(mod)) fail(`"${mod}" is joined more than once`);
    const businessKey = baseSpec.joins[mod];
    if (!businessKey) {
      fail(`"${base}" cannot be joined to "${mod}". Allowed: ${Object.keys(baseSpec.joins).join(', ') || 'none'}.`);
    }
    const spec = REPORT_MODULES[mod];
    from += `\n  LEFT JOIN ${scopedSource(spec.table, spec.alias, tenantId, params, spec.columns)}`
          + `\n    ON ${joinOn(businessKey, baseSpec.alias, spec.alias)}`;
    sourceCount += 1;
    active.add(mod);
  }

  // ── Support sources, pulled in only when a chosen field needs one ────────
  const needed = new Set<string>();
  const noteField = (spec: FieldSpec) => {
    if (!active.has(spec.module)) {
      fail(`Field "${spec.label}" belongs to "${spec.module}", which is not the base module and is not joined.`);
    }
    if (spec.requiresSource) needed.add(spec.requiresSource);
  };

  const dimensions = (definition.dimensions ?? []).map(d => fieldOf(d.field));
  const metrics = definition.metrics ?? [];
  const filters = definition.filters ?? [];

  dimensions.forEach(noteField);
  const metricSpecs = metrics.map(m => {
    if (!(AGGREGATIONS as readonly string[]).includes(m.agg)) {
      fail(`Unknown aggregation "${m.agg}". Allowed: ${AGGREGATIONS.join(', ')}.`);
    }
    if (m.agg === 'count') return null;              // COUNT(*) needs no field
    const spec = fieldOf(m.field);
    noteField(spec);
    if (['sum', 'avg'].includes(m.agg) && !spec.aggregatable) {
      fail(`"${spec.label}" cannot be summed or averaged.`);
    }
    return spec;
  });
  const filterSpecs = filters.map(f => { const s = fieldOf(f.field); noteField(s); return s; });

  for (const key of needed) {
    const src = SUPPORT_SOURCES[key];
    if (!src) fail(`Unknown support source "${key}"`);
    if (!active.has(src.joinFrom)) {
      fail(`A chosen field needs "${key}", which attaches to "${src.joinFrom}".`);
    }
    const parent = REPORT_MODULES[src.joinFrom];
    from += `\n  LEFT JOIN ${scopedSource(src.table, src.alias, tenantId, params, src.columns)}`
          + `\n    ON ${joinOn(src.on, parent.alias, src.alias)}`;
    sourceCount += 1;
  }

  if (!dimensions.length && !metrics.length) {
    fail('A report needs at least one dimension or metric');
  }

  // ── SELECT ──────────────────────────────────────────────────────────────
  const columns: BuiltQuery['columns'] = [];
  const selects: string[] = [];

  dimensions.forEach((d, i) => {
    selects.push(`${d.sql} AS dim_${i}`);
    columns.push({ key: d.key, label: d.label, kind: 'dimension' });
  });
  metrics.forEach((m, i) => {
    const spec = metricSpecs[i];
    selects.push(`${AGG_SQL[m.agg](spec ? spec.sql : '*')} AS metric_${i}`);
    columns.push({
      key: `metric:${i}`,
      label: m.label || (spec ? `${m.agg} of ${spec.label}` : 'Count'),
      kind: 'metric',
    });
  });

  // ── WHERE ───────────────────────────────────────────────────────────────
  const where: string[] = [];

  /*
   * TEST ROWS ARE ALWAYS EXCLUDED, and this is not a filter the caller can
   * turn off — `is_test` means "debris, do not show it" everywhere else in this
   * API (`getDeals`, `loadProjectionDeals`), and a report is not the place to
   * make an exception.
   *
   * SEEDED ROWS ARE NEVER EXCLUDED. Product decision, 2026-09-19: they are
   * included and DISCLOSED. There is deliberately no code path here that can
   * filter them out — a toggle would invite hiding the disclosure and
   * screenshotting the chart.
   */
  const testFlagged = [...active].filter(m => REPORT_MODULES[m].hasTestFlag);
  if (mode === 'rows') {
    for (const mod of testFlagged) where.push(`${REPORT_MODULES[mod].alias}.is_test = false`);
  }
  // In provenance mode the exclusion becomes a FILTER instead (below), so the
  // number of rows it removed can be REPORTED rather than merely applied.

  filters.forEach((f, i) => where.push(filterSql(f, filterSpecs[i], params)));

  if (mode === 'provenance') {
    const baseAlias = baseSpec.alias;
    const notTest = testFlagged.length
      ? testFlagged.map(m => `NOT ${REPORT_MODULES[m].alias}.is_test`).join(' AND ')
      : 'TRUE';
    const isTest = testFlagged.length
      ? testFlagged.map(m => `${REPORT_MODULES[m].alias}.is_test`).join(' OR ')
      : 'FALSE';

    const counts = [
      `COUNT(*) FILTER (WHERE ${notTest}) AS rows_matched`,
      `COUNT(*) FILTER (WHERE ${isTest}) AS excluded_test`,
    ];

    // Seeded share, only where the base table can actually answer it.
    const seedMeasurable = baseSpec.hasSeedFlag;
    counts.push(seedMeasurable
      ? `COUNT(*) FILTER (WHERE ${notTest} AND ${baseAlias}.is_seed) AS rows_seeded`
      : `NULL::bigint AS rows_seeded`);

    // Coverage per join: how many surviving base rows actually matched.
    const coverageJoins = joinKeys.map(k => ({
      module: k, label: REPORT_MODULES[k].label, alias: REPORT_MODULES[k].alias,
    }));
    coverageJoins.forEach((j, i) => {
      counts.push(`COUNT(*) FILTER (WHERE ${notTest} AND ${j.alias}.id IS NOT NULL) AS join_${i}_matched`);
    });

    const provSql = `SELECT ${counts.join(',\n       ')}\n${from}`
      + (where.length ? `\nWHERE ${where.join('\n  AND ')}` : '');

    assertEverySourceIsScoped(provSql, sourceCount);
    return { sql: provSql, params, sourceCount, seedMeasurable, coverageJoins };
  }

  // ── GROUP BY / ORDER BY / LIMIT ─────────────────────────────────────────
  const groupBy = dimensions.length && metrics.length
    ? `\nGROUP BY ${dimensions.map((_, i) => i + 1).join(', ')}`
    : '';

  let orderBy = '';
  if (definition.sort?.length) {
    const parts = definition.sort.map(s => {
      const dir = s.dir === 'asc' ? 'ASC' : 'DESC';
      const m = /^metric:(\d+)$/.exec(s.by);
      if (m) {
        const idx = Number(m[1]);
        if (idx < 0 || idx >= metrics.length) fail(`Sort refers to metric ${idx}, which this report does not have`);
        return `metric_${idx} ${dir} NULLS LAST`;
      }
      const spec = fieldOf(s.by);
      noteField(spec);
      const at = dimensions.findIndex(d => d.key === spec.key);
      if (at === -1) fail(`Sort field "${spec.label}" must also be a dimension`);
      return `dim_${at} ${dir} NULLS LAST`;
    });
    orderBy = `\nORDER BY ${parts.join(', ')}`;
  }

  // MAX_ROWS + 1 on purpose: see the note on MAX_ROWS in types.ts. Fetching one
  // more row than anyone sees is how truncation is DETECTED rather than assumed.
  const requested = Math.min(Math.max(1, definition.limit ?? MAX_ROWS), MAX_ROWS);
  params.push(requested + 1);
  const limit = `\nLIMIT $${params.length}`;

  const sql = `SELECT ${selects.join(', ')}\n${from}`
    + (where.length ? `\nWHERE ${where.join('\n  AND ')}` : '')
    + groupBy + orderBy + limit;

  assertEverySourceIsScoped(sql, sourceCount);

  return { sql, params, columns, sourceCount, rowLimit: requested };
}

/**
 * LAYER 3 — a tripwire, explicitly NOT the guarantee.
 *
 * Counts the tenant predicates in the emitted SQL and compares them to the
 * number of sources created. If this ever fires, `scopedSource` has been broken
 * and THAT is the bug; this only makes the breakage loud instead of silent.
 *
 * The mutation suite asserts that disabling this function fails NOTHING — if
 * removing the tripwire is the only thing that catches a dropped predicate,
 * then defence in depth is absent and the suite is testing the wrong layer.
 */
export function assertEverySourceIsScoped(sql: string, sourceCount: number): void {
  const predicates = (sql.match(/WHERE tenant_id = \$\d+/g) ?? []).length;
  if (predicates !== sourceCount) {
    throw new Error(
      `Report query refused: ${sourceCount} source(s) but ${predicates} tenant predicate(s). `
      + 'Every source must be tenant-scoped.',
    );
  }
  const seen = new Set<string>();
  for (const alias of ALL_ALIASES) {
    if (seen.has(alias)) throw new Error(`Report registry has a duplicate alias "${alias}"`);
    seen.add(alias);
  }
}
