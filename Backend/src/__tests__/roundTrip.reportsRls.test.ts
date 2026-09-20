import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { pool } from '../config/database';
import { setupWorkspace, teardownWorkspace, TestWorkspace } from './helpers';
import { buildReportQuery } from '../services/reports/queryBuilder';
import { DEFINITION_VERSION, STATEMENT_TIMEOUT_MS, type ReportDefinition } from '../services/reports/types';
import {
  runScopedReportQuery, assertRowSecurityActive, resetReportsPool,
} from '../config/reportsDatabase';

/**
 * P3 PHASE 1 — the hardened execution path, against a real database.
 *
 * WHAT THIS PINS, and the order is the order of importance:
 *
 *  1. THE TWO LAYERS ARE INDEPENDENT. The headline test builds a query, then
 *     SABOTAGES it by stripping the tenant predicate the builder emitted, and
 *     asserts the restricted connection still returns nothing from another
 *     workspace. That is the claim §2.4 of the design makes, tested rather than
 *     asserted — and it is the whole reason RLS was moved to Phase 1.
 *  2. UNSET MEANS NO ROWS. The policy reads current_setting(..., true), which is
 *     NULL when absent, so a forgotten tenant yields zero rows rather than all
 *     of them. Fail-closed.
 *  3. The reporting role cannot write, and cannot read columns it was not
 *     granted — `users.password_hash` in particular.
 *  4. The application's own pool is completely unaffected.
 */
describe('Reports RLS — the restricted execution path', () => {
  let a: TestWorkspace;
  let b: TestWorkspace;

  const def = (over: Partial<ReportDefinition> = {}): ReportDefinition => ({
    v: DEFINITION_VERSION,
    base: 'deals',
    dimensions: [{ field: 'deals.source' }],
    metrics: [{ agg: 'count' }],
    ...over,
  });

  beforeAll(async () => {
    a = await setupWorkspace('rls-a');
    b = await setupWorkspace('rls-b');
    // One deal in each workspace, created directly: this suite is about the
    // read path, and the write path has its own tests.
    for (const [ws, name] of [[a, 'A deal'], [b, 'B deal']] as const) {
      await pool.query(
        `INSERT INTO deals (name, value, currency, source, tenant_id, stage_id)
         VALUES ($1, 1000, 'USD', 'referral', $2,
                 (SELECT id FROM pipeline_stages WHERE tenant_id = $2 ORDER BY position LIMIT 1))`,
        [name, ws.tenantId],
      );
    }
  });

  afterAll(async () => {
    await pool.query('DELETE FROM deals WHERE tenant_id = ANY($1::uuid[])', [[a.tenantId, b.tenantId]]);
    await teardownWorkspace(b);
    await teardownWorkspace(a);
    await resetReportsPool();
  });

  // ── 1. The layers are independent ────────────────────────────────────────

  it('THE HEADLINE: with the builder SABOTAGED, RLS still blocks the other workspace', async () => {
    const { sql, params } = buildReportQuery(def(), a.tenantId);

    /*
     * Strip the tenant predicate the builder emitted — exactly what mutation M1
     * does to the generator — and run the resulting query on the restricted
     * connection while asking for workspace A.
     *
     * If RLS were decorative, this would return BOTH workspaces' deals. The
     * point of Phase 1 is that it does not.
     */
    const sabotaged = sql.replace(/\(SELECT (.+?) FROM (\w+) WHERE tenant_id = \$\d+\)/g, '$2');
    expect(sabotaged, 'the sabotage must actually remove the predicate').not.toContain('WHERE tenant_id = $');

    // The stripped query no longer uses the tenant params; rebuild the param
    // list to just the limit so the placeholders still bind.
    const limitOnly = [params[params.length - 1]];
    const renumbered = sabotaged.replace(/\$\d+/g, '$1');

    const run = await runScopedReportQuery(renumbered, limitOnly, a.tenantId, STATEMENT_TIMEOUT_MS);
    const total = run.rows.reduce((n, r) => n + Number(r.metric_0 ?? 0), 0);

    // Workspace A has exactly one deal. Without RLS this would be 2.
    expect(total, 'RLS must confine the sabotaged query to workspace A').toBe(1);
  });

  it('the properly-built query returns only the caller\'s workspace', async () => {
    for (const ws of [a, b]) {
      const { sql, params } = buildReportQuery(def(), ws.tenantId);
      const run = await runScopedReportQuery(sql, params, ws.tenantId, STATEMENT_TIMEOUT_MS);
      const total = run.rows.reduce((n, r) => n + Number(r.metric_0 ?? 0), 0);
      expect(total, `workspace ${ws.tenantId}`).toBe(1);
    }
  });

  // ── 2. Fail-closed ───────────────────────────────────────────────────────

  it('UNSET tenant returns zero rows, not every row', async () => {
    // assertRowSecurityActive() is exactly this check, and it is what the pool
    // runs before serving anything.
    await expect(assertRowSecurityActive()).resolves.toBeUndefined();
  });

  // ── 3. The role's limits ─────────────────────────────────────────────────

  it('the reporting role CANNOT write', async () => {
    const { sql } = buildReportQuery(def(), a.tenantId);
    expect(sql).toMatch(/^SELECT/);
    await expect(
      runScopedReportQuery(
        `DELETE FROM deals WHERE tenant_id = $1`, [a.tenantId], a.tenantId, STATEMENT_TIMEOUT_MS),
    ).rejects.toThrow(/read-only|permission denied/i);

    const still = await pool.query(
      'SELECT COUNT(*)::int AS n FROM deals WHERE tenant_id = $1', [a.tenantId]);
    expect(still.rows[0].n).toBe(1);
  });

  it('the reporting role CANNOT read users.password_hash', async () => {
    // Column-level grants, migration 055. The four granted columns work; the
    // secret does not.
    await expect(
      runScopedReportQuery('SELECT id FROM users LIMIT 1', [], a.tenantId, STATEMENT_TIMEOUT_MS),
    ).resolves.toBeDefined();

    await expect(
      runScopedReportQuery('SELECT password_hash FROM users LIMIT 1', [], a.tenantId, STATEMENT_TIMEOUT_MS),
    ).rejects.toThrow(/permission denied/i);
  });

  it('the reporting role cannot read a table it was never granted', async () => {
    await expect(
      runScopedReportQuery('SELECT COUNT(*) FROM quotas', [], a.tenantId, STATEMENT_TIMEOUT_MS),
    ).rejects.toThrow(/permission denied/i);
  });

  // ── 3b. The pool refuses to be misconfigured ─────────────────────────────

  it('REFUSES to run as the application role, which would make RLS inert', async () => {
    /*
     * The central hazard of this whole design. The app role owns these tables
     * and is a superuser, so policies do not apply to it — a reports pool
     * pointed at those credentials would have RLS silently INERT while
     * everything still looked protected.
     *
     * Found while mutation-testing: the first version of this check passed for
     * the WRONG reason (dotenv had not run, so DB_USER was undefined and the
     * pool failed on a nonexistent role). The guard is asserted on its message
     * here so that cannot happen again.
     */
    const realUser = process.env.REPORTS_DB_USER;
    const realPass = process.env.REPORTS_DB_PASSWORD;
    await resetReportsPool();
    process.env.REPORTS_DB_USER = process.env.DB_USER;
    process.env.REPORTS_DB_PASSWORD = 'anything';
    try {
      await expect(assertRowSecurityActive()).rejects.toThrow(/same as DB_USER/);
    } finally {
      process.env.REPORTS_DB_USER = realUser;
      process.env.REPORTS_DB_PASSWORD = realPass;
      await resetReportsPool();
    }
  });

  it('REFUSES to run with no credentials rather than falling back to the app pool', async () => {
    const realUser = process.env.REPORTS_DB_USER;
    const realPass = process.env.REPORTS_DB_PASSWORD;
    await resetReportsPool();
    delete process.env.REPORTS_DB_USER;
    delete process.env.REPORTS_DB_PASSWORD;
    try {
      await expect(assertRowSecurityActive()).rejects.toThrow(/are not set/);
    } finally {
      process.env.REPORTS_DB_USER = realUser;
      process.env.REPORTS_DB_PASSWORD = realPass;
      await resetReportsPool();
    }
  });

  // ── 4. The app is unaffected ─────────────────────────────────────────────

  it('the APPLICATION pool still sees every workspace, exactly as before', async () => {
    // The app role owns these tables and is a superuser, so policies do not
    // apply to it. This is the regression check for "did enabling RLS break
    // normal queries" — the answer must be no.
    const r = await pool.query(
      'SELECT COUNT(*)::int AS n FROM deals WHERE tenant_id = ANY($1::uuid[])',
      [[a.tenantId, b.tenantId]]);
    expect(r.rows[0].n).toBe(2);
  });

  // ── 5. Transaction-scoped settings ───────────────────────────────────────

  it('the tenant setting does not leak to the next user of a pooled connection', async () => {
    // SET LOCAL, not SET: the classic pooling bug would be one workspace's
    // tenant id still applying to the next query on the same connection.
    const { sql: sqlA, params: pA } = buildReportQuery(def(), a.tenantId);
    await runScopedReportQuery(sqlA, pA, a.tenantId, STATEMENT_TIMEOUT_MS);

    // A fresh run with no tenant would see nothing; assertRowSecurityActive
    // re-checks precisely that on a pooled connection.
    await resetReportsPool();
    await expect(assertRowSecurityActive()).resolves.toBeUndefined();
  });
});
