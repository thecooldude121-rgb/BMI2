import { Pool, type PoolClient } from 'pg';

/**
 * THE RESTRICTED CONNECTION REPORTS RUN ON.
 *
 * A second pool, connecting as `bmi_reports_ro` — a role with SELECT on the
 * reportable tables and nothing else, constrained by the row-level security
 * policies of migration 055. The application's own pool is untouched and keeps
 * its full access.
 *
 * ─── WHY A SEPARATE POOL AND NOT `SET ROLE` ON THE MAIN ONE ───────────────
 *
 * `SET ROLE` is reversible by whatever runs next on that connection, and the
 * main pool's role is a superuser, for whom RLS is unconditionally inert. A
 * separate pool means the report path CANNOT be running as a privileged role,
 * because it has no credentials for one.
 *
 * ─── THE CHECK THAT MATTERS: PROVING RLS IS LIVE ──────────────────────────
 *
 * This is the real hazard of the whole design. The app role owns these tables
 * and is a superuser, so it bypasses RLS entirely. If this pool were ever
 * misconfigured to use those credentials — a copy-pasted `.env`, a fallback to
 * `DB_USER`, a well-meant "just use the main pool for now" — then every policy
 * would be silently INERT while the architecture diagram still said "protected".
 *
 * An inert security layer is worse than an absent one, because it produces
 * confidence that is not earned.
 *
 * So the pool proves RLS is active BEHAVIOURALLY before serving anything: with
 * no tenant set, a SELECT against a reportable table must return zero rows. A
 * privileged connection returns rows and fails the check. This tests the
 * property we actually care about rather than inspecting configuration that
 * might not mean what it appears to.
 */

let pool: Pool | null = null;
let verified: Promise<void> | null = null;

export class ReportsPoolUnavailable extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReportsPoolUnavailable';
  }
}

function getPool(): Pool {
  if (pool) return pool;

  const user = process.env.REPORTS_DB_USER;
  const password = process.env.REPORTS_DB_PASSWORD;
  if (!user || !password) {
    throw new ReportsPoolUnavailable(
      'REPORTS_DB_USER / REPORTS_DB_PASSWORD are not set. Run `npm run db:reports-role`. '
      + 'Reports deliberately do NOT fall back to the application connection: that role '
      + 'bypasses row-level security, so a fallback would silently disable the isolation '
      + 'this pool exists to enforce.',
    );
  }
  if (user === process.env.DB_USER) {
    // Refused up front rather than caught later by the behavioural check, so
    // the error names the actual mistake.
    throw new ReportsPoolUnavailable(
      `REPORTS_DB_USER is the same as DB_USER ("${user}"). The application role owns these `
      + 'tables and bypasses row-level security, so reports must not run as it.',
    );
  }

  pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    user,
    password,
    max: 4,                      // reports are bounded; they must not starve the app
    idleTimeoutMillis: 30_000,
  });
  return pool;
}

/**
 * Behavioural proof that this connection is subject to RLS. Runs once per
 * process and is cached; a failure is fatal for reports and harmless for
 * everything else.
 */
export function assertRowSecurityActive(): Promise<void> {
  if (verified) return verified;
  verified = (async () => {
    const client = await getPool().connect();
    try {
      await client.query('BEGIN');
      // Deliberately do NOT set app.tenant_id. The policy compares tenant_id to
      // current_setting('app.tenant_id', true), which is NULL when unset, so
      // every row must be filtered out.
      const r = await client.query('SELECT count(*)::int AS n FROM deals');
      await client.query('ROLLBACK');
      if (r.rows[0].n !== 0) {
        throw new ReportsPoolUnavailable(
          `Row-level security is NOT in effect on the reports connection: a query with no `
          + `tenant set returned ${r.rows[0].n} rows, and it must return 0. The connection is `
          + 'probably running as a table owner or a superuser, for whom policies are bypassed.',
        );
      }
    } finally {
      client.release();
    }
  })();
  return verified;
}

export interface ScopedRun {
  rows: Record<string, unknown>[];
  /** Milliseconds the query itself took. */
  ms: number;
}

/**
 * Run one report query on the restricted connection, inside a transaction that
 * carries the tenant and a statement timeout.
 *
 * All three settings are `SET LOCAL`, so they are scoped to this transaction and
 * cannot leak to the next user of a pooled connection — the classic pooling bug,
 * and here it would mean one workspace's tenant id applying to another's query.
 */
export async function runScopedReportQuery(
  sql: string, params: unknown[], tenantId: string, timeoutMs: number,
): Promise<ScopedRun> {
  await assertRowSecurityActive();

  const client: PoolClient = await getPool().connect();
  const started = Date.now();
  try {
    await client.query('BEGIN READ ONLY');
    // Parameterised: a tenant id is client-adjacent data and must not be
    // concatenated into a SET, even though it has already been validated.
    await client.query('SELECT set_config($1, $2, true)', ['app.tenant_id', tenantId]);
    await client.query('SELECT set_config($1, $2, true)', ['statement_timeout', String(timeoutMs)]);
    const result = await client.query(sql, params);
    await client.query('COMMIT');
    return { rows: result.rows, ms: Date.now() - started };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => { /* the original error is what matters */ });
    throw err;
  } finally {
    client.release();
  }
}

/** Test seam: drop the cached pool and verification so env changes take effect. */
export async function resetReportsPool(): Promise<void> {
  const p = pool;
  pool = null;
  verified = null;
  if (p) await p.end();
}
