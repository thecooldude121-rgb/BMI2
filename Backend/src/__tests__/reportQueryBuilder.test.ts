import { describe, it, expect } from 'vitest';
import { buildReportQuery, ReportDefinitionError, assertEverySourceIsScoped } from '../services/reports/queryBuilder';
import { REPORT_MODULES, REPORT_FIELDS, SUPPORT_SOURCES } from '../services/reports/registry';
import { DEFINITION_VERSION, MAX_ROWS, type ReportDefinition } from '../services/reports/types';

/**
 * THE QUERY BUILDER'S SECURITY BOUNDARY.
 *
 * P3 Phase 0. PURE — no database. That is the point: a user-defined query
 * builder is the one place in this codebase where a missed `tenant_id`
 * predicate is a bug in a GENERATOR rather than in one hand-written query, so
 * the boundary is tested exhaustively at the only layer where exhaustive is
 * cheap.
 *
 * The property test at the bottom matters more than any single example: it
 * covers registry entries added LATER, which is where the next mistake will
 * actually be made.
 */

const T = '11111111-1111-1111-1111-111111111111';

const def = (over: Partial<ReportDefinition> = {}): ReportDefinition => ({
  v: DEFINITION_VERSION,
  base: 'deals',
  dimensions: [{ field: 'deals.source' }],
  metrics: [{ agg: 'sum', field: 'deals.value' }],
  ...over,
});

const tenantPredicates = (sql: string) => (sql.match(/WHERE tenant_id = \$\d+/g) ?? []).length;

describe('every source is tenant-scoped — the structural guarantee', () => {
  it('wraps the base table in a scoped inline view, never a bare FROM', () => {
    const { sql } = buildReportQuery(def(), T);
    expect(sql).toContain('FROM (SELECT * FROM deals WHERE tenant_id = $1) d');
    // The bare form must never appear. This is the whole design in one assertion.
    expect(sql).not.toMatch(/FROM deals\b(?! WHERE)/);
  });

  it('scopes a JOINED table too, with its own predicate', () => {
    const { sql, sourceCount } = buildReportQuery(
      def({ joins: ['companies'], dimensions: [{ field: 'companies.industry' }] }), T);
    expect(sql).toContain('LEFT JOIN (SELECT * FROM companies WHERE tenant_id = $2) c');
    expect(sourceCount).toBe(2);
    expect(tenantPredicates(sql)).toBe(2);
  });

  it('adds the parent/child tenant match to every join, not just the scoped view', () => {
    // Both halves are needed: the inline view stops an unscoped read; this stops
    // a row whose FK already crosses workspaces being read THROUGH the join.
    const { sql } = buildReportQuery(
      def({ joins: ['companies'], dimensions: [{ field: 'companies.industry' }] }), T);
    expect(sql).toContain('ON d.company_id = c.id AND d.tenant_id = c.tenant_id');
  });

  it('scopes a SUPPORT source pulled in implicitly by a field', () => {
    // Nothing in the definition names pipeline_stages; deals.stage needs it.
    const { sql, sourceCount } = buildReportQuery(
      def({ dimensions: [{ field: 'deals.stage' }] }), T);
    expect(sql).toContain('LEFT JOIN (SELECT * FROM pipeline_stages WHERE tenant_id = $2) ps');
    expect(sql).toContain('AND d.tenant_id = ps.tenant_id');
    expect(sourceCount).toBe(2);
    expect(tenantPredicates(sql)).toBe(2);
  });

  it('binds the tenant id as a parameter — it is never inlined', () => {
    const { sql, params } = buildReportQuery(def(), T);
    expect(params[0]).toBe(T);
    expect(sql).not.toContain(T);
  });
});

describe('nothing from the client reaches SQL as text', () => {
  it('refuses an unknown field rather than treating it as a column', () => {
    expect(() => buildReportQuery(def({ dimensions: [{ field: 'deals.secret_column' }] }), T))
      .toThrow(/Unknown field/);
  });

  it('refuses an unknown module', () => {
    expect(() => buildReportQuery(def({ base: 'employees' }), T)).toThrow(/Unknown module/);
    // And employees is not merely missing — it is unlistable, having no tenant_id.
    expect(REPORT_MODULES).not.toHaveProperty('employees');
  });

  it('an injection attempt in a FIELD is just an unknown key', () => {
    const attack = "deals.value; DROP TABLE deals; --";
    expect(() => buildReportQuery(def({ dimensions: [{ field: attack }] }), T))
      .toThrow(/Unknown field/);
  });

  it('an injection attempt in a FILTER VALUE is bound, never concatenated', () => {
    const attack = "'; DROP TABLE deals; --";
    const { sql, params } = buildReportQuery(
      def({ filters: [{ field: 'deals.source', op: 'eq', value: attack }] }), T);
    expect(sql).not.toContain('DROP TABLE');
    expect(params).toContain(attack);
    expect(sql).toMatch(/d\.source = \$\d+/);
  });

  it('an injection attempt in a SORT key is an unknown field', () => {
    expect(() => buildReportQuery(def({ sort: [{ by: 'd.value; --', dir: 'desc' }] }), T))
      .toThrow(/Unknown field/);
  });

  it('refuses an unknown aggregation and an unknown operator', () => {
    expect(() => buildReportQuery(def({ metrics: [{ agg: 'exec' as never, field: 'deals.value' }] }), T))
      .toThrow(/Unknown aggregation/);
    expect(() => buildReportQuery(def({ filters: [{ field: 'deals.source', op: 'drop' as never, value: 'x' }] }), T))
      .toThrow(/Unknown operator/);
  });

  it('wraps a `contains` value in % as a PARAMETER, so a literal % is matched not interpreted', () => {
    const { sql, params } = buildReportQuery(
      def({ filters: [{ field: 'deals.name', op: 'contains', value: '100%' }] }), T);
    expect(sql).toMatch(/ILIKE \$\d+/);
    expect(params).toContain('%100%%');
  });
});

describe('the join graph is a whitelist, not a suggestion', () => {
  it('refuses a join the registry does not allow', () => {
    expect(() => buildReportQuery(def({ base: 'companies', joins: ['activities'] }), T))
      .toThrow(/cannot be joined/);
  });

  it('refuses a field whose module is neither base nor joined', () => {
    expect(() => buildReportQuery(def({ dimensions: [{ field: 'companies.industry' }] }), T))
      .toThrow(/is not the base module and is not joined/);
  });

  it('refuses the same module joined twice, and a join to the base itself', () => {
    expect(() => buildReportQuery(def({ joins: ['companies', 'companies'] }), T)).toThrow(/more than once/);
    expect(() => buildReportQuery(def({ joins: ['deals'] }), T)).toThrow(/already the base/);
  });
});

describe('definition versioning', () => {
  it('refuses a definition from an unknown version instead of guessing', () => {
    expect(() => buildReportQuery(def({ v: 99 }), T)).toThrow(/definition format v99/);
  });
});

describe('test rows are always excluded; seeded rows never are', () => {
  it('excludes is_test rows on every module that has the flag', () => {
    const { sql } = buildReportQuery(def(), T);
    expect(sql).toContain('d.is_test = false');
  });

  it('has NO code path that filters is_seed', () => {
    // The product decision is include-and-disclose. A toggle would invite
    // hiding the disclosure and screenshotting the chart, so the capability
    // does not exist rather than being defaulted off.
    const { sql } = buildReportQuery(
      def({ filters: [{ field: 'deals.source', op: 'eq', value: 'x' }] }), T);
    expect(sql).not.toContain('is_seed');
  });
});

describe('row cap and truncation detection', () => {
  it('asks for MAX_ROWS + 1 so truncation can be DETECTED, not assumed', () => {
    const { params, rowLimit } = buildReportQuery(def(), T);
    expect(rowLimit).toBe(MAX_ROWS);
    expect(params[params.length - 1]).toBe(MAX_ROWS + 1);
  });

  it('clamps a larger request rather than refusing it', () => {
    const { params, rowLimit } = buildReportQuery(def({ limit: 999999 }), T);
    expect(rowLimit).toBe(MAX_ROWS);
    expect(params[params.length - 1]).toBe(MAX_ROWS + 1);
  });
});

describe('the layer-3 tripwire', () => {
  it('throws when sources and predicates disagree', () => {
    expect(() => assertEverySourceIsScoped('FROM (SELECT * FROM deals WHERE tenant_id = $1) d', 2))
      .toThrow(/2 source\(s\) but 1 tenant predicate/);
  });

  it('passes when they agree', () => {
    expect(() => assertEverySourceIsScoped('FROM (SELECT * FROM deals WHERE tenant_id = $1) d', 1))
      .not.toThrow();
  });
});

describe('PROPERTY: every module and every legal join is scoped, including ones added later', () => {
  /*
   * This is the test that actually protects the future. The examples above
   * cover the registry as it is today; this one walks whatever the registry
   * contains, so an entry added in six months is covered the day it is added.
   */
  it('for every module, a base-only query scopes exactly one source', () => {
    for (const [key, spec] of Object.entries(REPORT_MODULES)) {
      const anyField = Object.entries(REPORT_FIELDS)
        .find(([, f]) => f.module === key && !f.requiresSource);
      expect(anyField, `module "${key}" has no simple field to test with`).toBeTruthy();
      const { sql, sourceCount } = buildReportQuery(
        { v: DEFINITION_VERSION, base: key, dimensions: [{ field: anyField![0] }], metrics: [{ agg: 'count' }] },
        T,
      );
      expect(tenantPredicates(sql), `module "${key}"`).toBe(sourceCount);
      expect(sql).toContain(`FROM (SELECT * FROM ${spec.table} WHERE tenant_id = $1) ${spec.alias}`);
    }
  });

  it('for every legal join pair, predicates equal sources and the tenant match is present', () => {
    for (const [baseKey, baseSpec] of Object.entries(REPORT_MODULES)) {
      for (const joinKey of Object.keys(baseSpec.joins)) {
        const baseField = Object.entries(REPORT_FIELDS)
          .find(([, f]) => f.module === baseKey && !f.requiresSource)![0];
        const { sql, sourceCount } = buildReportQuery(
          { v: DEFINITION_VERSION, base: baseKey, joins: [joinKey],
            dimensions: [{ field: baseField }], metrics: [{ agg: 'count' }] },
          T,
        );
        const joined = REPORT_MODULES[joinKey];
        expect(tenantPredicates(sql), `${baseKey} -> ${joinKey}`).toBe(sourceCount);
        expect(sql, `${baseKey} -> ${joinKey}`).toContain(
          `AND ${baseSpec.alias}.tenant_id = ${joined.alias}.tenant_id`);
      }
    }
  });

  it('for every field needing a support source, that source is scoped too', () => {
    for (const [key, f] of Object.entries(REPORT_FIELDS)) {
      if (!f.requiresSource) continue;
      const { sql, sourceCount } = buildReportQuery(
        { v: DEFINITION_VERSION, base: f.module, dimensions: [{ field: key }], metrics: [{ agg: 'count' }] },
        T,
      );
      const src = SUPPORT_SOURCES[f.requiresSource];
      const projection = src.columns?.length ? src.columns.join(', ') : '*';
      expect(tenantPredicates(sql), `field "${key}"`).toBe(sourceCount);
      expect(sql, `field "${key}"`).toContain(
        `LEFT JOIN (SELECT ${projection} FROM ${src.table} WHERE tenant_id = $2) ${src.alias}`);
    }
  });

  it('every registry field belongs to a real module and every alias is unique', () => {
    const aliases = new Set<string>();
    for (const [key, f] of Object.entries(REPORT_FIELDS)) {
      expect(REPORT_MODULES[f.module], `field "${key}" names module "${f.module}"`).toBeTruthy();
    }
    for (const spec of Object.values(REPORT_MODULES)) {
      expect(aliases.has(spec.alias), `duplicate alias ${spec.alias}`).toBe(false);
      aliases.add(spec.alias);
    }
    for (const src of Object.values(SUPPORT_SOURCES)) {
      expect(aliases.has(src.alias), `duplicate alias ${src.alias}`).toBe(false);
      aliases.add(src.alias);
    }
  });
});

describe('a source holding secrets is never read with SELECT *', () => {
  /*
   * `users` carries `password_hash` and `token_version`. The read-only
   * reporting role is granted SELECT on four columns only (migration 055), so
   * a `SELECT *` would be REFUSED by Postgres — the right failure, but one
   * that should never arise. This asserts the projection is explicit.
   */
  it('projects only the four safe columns of users, never *', () => {
    const { sql } = buildReportQuery(
      def({ dimensions: [{ field: 'deals.owner_name' }] }), T);
    expect(sql).toContain('(SELECT id, first_name, last_name, tenant_id FROM users WHERE tenant_id = $2) u');
    expect(sql).not.toContain('SELECT * FROM users');
    expect(sql).not.toContain('password_hash');
  });

  it('every registry source that declares columns emits exactly those', () => {
    // Walks the registry, so a source added later with a projection is covered.
    for (const [key, src] of Object.entries(SUPPORT_SOURCES)) {
      if (!src.columns?.length) continue;
      const field = Object.entries(REPORT_FIELDS).find(([, f]) => f.requiresSource === key);
      if (!field) continue;
      const { sql } = buildReportQuery(
        { v: DEFINITION_VERSION, base: REPORT_FIELDS[field[0]].module,
          dimensions: [{ field: field[0] }], metrics: [{ agg: 'count' }] }, T);
      expect(sql, key).toContain(`SELECT ${src.columns.join(', ')} FROM ${src.table}`);
      expect(sql, key).not.toContain(`SELECT * FROM ${src.table}`);
    }
  });
});

describe('errors are ReportDefinitionError, so the controller can answer 400', () => {
  it('uses the typed error for definition problems', () => {
    expect(() => buildReportQuery(def({ base: 'nope' }), T)).toThrow(ReportDefinitionError);
  });
});
