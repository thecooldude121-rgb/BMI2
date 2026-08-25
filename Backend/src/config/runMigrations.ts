import fs from 'fs';
import path from 'path';
import { pool } from './database';

/**
 * The single migration runner.
 *
 * BEFORE THIS EXISTED, schema changes lived in three unsynchronised places:
 *   1. src/config/migrate.ts   — the documented `npm run db:migrate` path, which
 *      built a DIFFERENT database than the live one and has been removed.
 *   2. migrations/*.sql        — numbered files executed by nothing at all.
 *   3. runMigrations() inline in index.ts — 137 lines of SQL run on every boot,
 *      with 007/008/009 duplicated verbatim from the .sql files.
 * A fresh clone could not boot, and there was no record of what had been
 * applied. Now: one directory, applied in filename order, recorded in a ledger.
 *
 * Rules for adding a migration:
 *   - Create migrations/NNN_description.sql with the next free number. Numbers
 *     must be unique (006 was used twice, which is why ordering was ambiguous).
 *   - Write it to be safe if re-run (IF NOT EXISTS, guarded DO blocks). The
 *     ledger prevents re-runs, but idempotence makes recovery painless.
 *   - Each file runs inside a transaction: it either fully applies or not at all.
 *   - Never edit a file that has already been applied — its checksum will no
 *     longer match and the runner will refuse to start. Add a new migration.
 *
 * 000_baseline_schema.sql is a pg_dump of the live database and is skipped on an
 * existing database (detected by looking for a known table). On a genuinely
 * empty database it runs first to create everything.
 */

const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations');
const BASELINE = '000_baseline_schema.sql';

/** Migrations already folded into the baseline. Recorded, never executed. */
const FOLDED_INTO_BASELINE = new Set([
  '001_add_next_step_structure.sql',
  '002_add_is_test_flag.sql',
  '003_add_quotas_table.sql',
  '004_add_forecast_snapshots.sql',
  '005_add_commercial_docs_and_record_info.sql',
  '006_add_fee_and_scope_fields.sql',
  '006_add_lead_sub_tables.sql',
  '007_extend_lead_views.sql',
  '008_add_tenants_and_tenant_id.sql',
  '009_scope_quota_forecast_uniqueness_to_tenant.sql',
  '010_scope_remaining_uniques_to_tenant.sql',
]);

const checksum = (s: string): string => {
  // Small non-cryptographic digest — enough to notice an applied file changing.
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, '0');
};

const ensureLedger = async (): Promise<void> => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.schema_migrations (
      filename    TEXT        PRIMARY KEY,
      checksum    TEXT        NOT NULL,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
};

/** True when this looks like an already-provisioned database. */
const databaseIsPopulated = async (): Promise<boolean> => {
  const { rows } = await pool.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'leads' LIMIT 1`
  );
  return rows.length > 0;
};

/**
 * WHAT HAPPENS WHEN A MIGRATION FAILS
 *
 * In production a bad schema is not something to run on: the process refuses to
 * start, loudly, so a deploy fails instead of serving requests against a
 * half-expected database.
 *
 * In development that same hard exit kills the dev server every time someone
 * writes a migration with a typo — which happened twice while building this
 * remediation, each time taking the running API down and making the failure
 * look like a server crash rather than a bad SQL file. Since every migration
 * runs in its own transaction and rolls back atomically, a failure leaves the
 * database consistent and simply missing that migration. So in development the
 * runner reports the failure prominently, stops applying anything further, and
 * lets the server boot so the file can be fixed and saved again.
 *
 * Override with MIGRATIONS_FAIL_FAST=true|false when the default is wrong —
 * for example to get production behaviour locally before a deploy.
 */
const failFast = (): boolean => {
  const override = process.env.MIGRATIONS_FAIL_FAST;
  if (override === 'true') return true;
  if (override === 'false') return false;
  return process.env.NODE_ENV === 'production';
};

export interface MigrationStatus {
  ok: boolean;
  applied: number;
  /** The migration that failed, if any. Everything after it was skipped. */
  failed?: { filename: string; error: string };
  /** Migrations that exist but were not applied because an earlier one failed. */
  skipped: string[];
}

/** Last run's outcome, so /health can report a degraded schema. */
let lastStatus: MigrationStatus = { ok: true, applied: 0, skipped: [] };
export const getMigrationStatus = (): MigrationStatus => lastStatus;

const banner = (lines: string[]): void => {
  const width = Math.max(...lines.map(l => l.length)) + 4;
  const rule = '!'.repeat(width);
  console.error(`\n${rule}`);
  lines.forEach(l => console.error(`! ${l.padEnd(width - 4)} !`));
  console.error(`${rule}\n`);
};

/** Abort in production; in development report and keep going. */
const abort = (message: string, detail?: string): void => {
  if (failFast()) {
    console.error(`FATAL: ${message}`);
    if (detail) console.error(detail);
    process.exit(1);
  }
  banner([
    'MIGRATION PROBLEM — the server is starting anyway (development).',
    '',
    ...message.split('\n'),
    ...(detail ? ['', ...detail.split('\n').slice(0, 4)] : []),
    '',
    'The database was NOT left half-migrated: each migration runs in its own',
    'transaction. Fix the .sql file and restart, or run `npm run db:migrate`.',
    'Set MIGRATIONS_FAIL_FAST=true to get production behaviour here.',
  ]);
};

export const runMigrations = async (): Promise<void> => {
  await ensureLedger();

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    abort(`migrations directory not found at ${MIGRATIONS_DIR}`);
    lastStatus = { ok: false, applied: 0, skipped: [], failed: { filename: '(directory)', error: 'not found' } };
    return;
  }

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  // Reject duplicate numeric prefixes — ordering must be unambiguous.
  const seen = new Map<string, string>();
  for (const f of files) {
    const prefix = f.slice(0, 3);
    const prior = seen.get(prefix);
    if (prior && !FOLDED_INTO_BASELINE.has(f)) {
      abort(
        `duplicate migration number ${prefix} — "${prior}" and "${f}".\n` +
        `Renumber one of them; ordering is otherwise undefined.`
      );
      lastStatus = { ok: false, applied: 0, skipped: [], failed: { filename: f, error: `duplicate number ${prefix}` } };
      return;
    }
    if (!prior) seen.set(prefix, f);
  }

  const { rows: appliedRows } = await pool.query<{ filename: string; checksum: string }>(
    'SELECT filename, checksum FROM public.schema_migrations'
  );
  const applied = new Map(appliedRows.map(r => [r.filename, r.checksum]));

  const populated = await databaseIsPopulated();
  let ran = 0;

  for (const filename of files) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, filename), 'utf8');
    const sum = checksum(sql);

    const previous = applied.get(filename);
    if (previous) {
      // The baseline is exempt from the checksum lock: it is a regenerable
      // pg_dump of current state, not a step in a sequence. Re-dumping it after
      // later migrations legitimately changes its contents, and on an existing
      // database it is never executed anyway. Keep the ledger row current.
      if (filename === BASELINE) {
        if (previous !== sum) {
          await pool.query('UPDATE public.schema_migrations SET checksum = $2 WHERE filename = $1', [filename, sum]);
        }
        continue;
      }
      if (previous !== sum) {
        abort(
          `${filename} was already applied but its contents have changed\n` +
          `(recorded ${previous}, now ${sum}). Never edit an applied migration —\n` +
          `add a new one instead.`
        );
        lastStatus = { ok: false, applied: ran, skipped: [], failed: { filename, error: 'checksum mismatch' } };
        return;
      }
      continue;
    }

    // Record-only cases: nothing is executed, but the ledger is brought up to
    // date so these never get considered again.
    const recordOnly =
      FOLDED_INTO_BASELINE.has(filename) ||
      (filename === BASELINE && populated);

    if (recordOnly) {
      await pool.query(
        'INSERT INTO public.schema_migrations (filename, checksum) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [filename, sum]
      );
      continue;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      // A migration may have changed search_path (pg_dump output sets it to
      // empty). Restore it before touching the ledger.
      await client.query('SET search_path TO public');
      await client.query(
        'INSERT INTO public.schema_migrations (filename, checksum) VALUES ($1, $2)',
        [filename, sum]
      );
      await client.query('COMMIT');
      console.log(`  ✔ applied ${filename}`);
      ran++;
    } catch (err) {
      await client.query('ROLLBACK');
      const detail = err instanceof Error ? err.message : String(err);
      abort(`migration ${filename} failed and was rolled back.`, detail);
      // Everything after a failure is skipped: applying later migrations over a
      // missing one is how schemas drift apart.
      const remaining = files.slice(files.indexOf(filename) + 1);
      lastStatus = { ok: false, applied: ran, skipped: remaining, failed: { filename, error: detail } };
      return;
    } finally {
      client.release();
    }
  }

  lastStatus = { ok: true, applied: ran, skipped: [] };
  console.log(
    ran > 0
      ? `✅ migrations: ${ran} applied, ${files.length - ran} already up to date`
      : `✅ migrations: up to date (${files.length} known)`
  );
};

// Allow `npm run db:migrate` to run this standalone.
//
// Run as an explicit command, a failed migration must exit non-zero regardless
// of NODE_ENV — the dev-server leniency above exists so a typo does not take the
// running API down, not so a migration command can fail quietly. CI and deploy
// scripts read this exit code.
if (require.main === module) {
  runMigrations()
    .then(async () => {
      const status = getMigrationStatus();
      await pool.end();
      if (!status.ok) {
        console.error(
          `\nMigration failed: ${status.failed?.filename}` +
          (status.skipped.length ? ` (${status.skipped.length} later migration(s) not attempted)` : '')
        );
        process.exit(1);
      }
    })
    .catch(async err => {
      console.error(err);
      await pool.end().catch(() => {});
      process.exit(1);
    });
}
