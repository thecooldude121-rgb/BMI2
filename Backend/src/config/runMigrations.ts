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

export const runMigrations = async (): Promise<void> => {
  await ensureLedger();

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.error(`FATAL: migrations directory not found at ${MIGRATIONS_DIR}`);
    process.exit(1);
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
      console.error(
        `FATAL: duplicate migration number ${prefix} — "${prior}" and "${f}". ` +
        `Renumber one of them; ordering is otherwise undefined.`
      );
      process.exit(1);
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
        console.error(
          `FATAL: ${filename} was already applied but its contents have changed ` +
          `(recorded ${previous}, now ${sum}). Never edit an applied migration — ` +
          `add a new one instead. Refusing to start.`
        );
        process.exit(1);
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
      console.error(`FATAL: migration ${filename} failed and was rolled back:`, err);
      process.exit(1);
    } finally {
      client.release();
    }
  }

  console.log(
    ran > 0
      ? `✅ migrations: ${ran} applied, ${files.length - ran} already up to date`
      : `✅ migrations: up to date (${files.length} known)`
  );
};

// Allow `npm run db:migrate` to run this standalone.
if (require.main === module) {
  runMigrations()
    .then(() => pool.end())
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
