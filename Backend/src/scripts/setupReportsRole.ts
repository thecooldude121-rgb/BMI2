import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { pool } from '../config/database';

/**
 * Give `bmi_reports_ro` a password and write it to the gitignored `.env`.
 *
 * Migration 055 creates the role NOLOGIN and grants it SELECT on the reportable
 * tables. It deliberately sets no password: A CREDENTIAL IN A MIGRATION IS A
 * CREDENTIAL IN GIT, and migrations are committed. So the role exists and can do
 * nothing until this runs, which is the safe order — an unusable role is a
 * better default than a guessable one.
 *
 * Modelled on `db:seed:users`, which is this project's existing pattern for the
 * same problem: generate, apply, print once, never commit.
 *
 * Idempotent: re-running rotates the password and rewrites the `.env` entry.
 * Safe to run whenever, and necessary after cloning, because `.env` does not
 * travel with the repository.
 */
const ENV_USER = 'REPORTS_DB_USER';
const ENV_PASS = 'REPORTS_DB_PASSWORD';
const ROLE = 'bmi_reports_ro';

function upsertEnv(file: string, key: string, value: string): void {
  const line = `${key}=${value}`;
  let body = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const re = new RegExp(`^${key}=.*$`, 'm');
  body = re.test(body) ? body.replace(re, line) : `${body.replace(/\s*$/, '')}\n${line}\n`;
  fs.writeFileSync(file, body, { mode: 0o600 });
}

async function main(): Promise<void> {
  // 32 random bytes, base64url. Not derived from anything guessable, and never
  // printed in full — see below.
  const password = crypto.randomBytes(32).toString('base64url');

  const exists = await pool.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [ROLE]);
  if (!exists.rows.length) {
    throw new Error(`Role ${ROLE} does not exist. Run the migrations first (npm run db:migrate).`);
  }

  // Quoted identifier, parameterised value is not possible for ALTER ROLE, so
  // the password is escaped as a literal by Postgres' own quoting function
  // rather than concatenated by hand.
  const quoted = await pool.query('SELECT quote_literal($1) AS q', [password]);
  await pool.query(`ALTER ROLE ${ROLE} LOGIN PASSWORD ${quoted.rows[0].q}`);

  const envFile = path.resolve(__dirname, '../../.env');
  upsertEnv(envFile, ENV_USER, ROLE);
  upsertEnv(envFile, ENV_PASS, password);

  // Deliberately NOT printed. It is already in .env, which is where the app
  // reads it from; echoing a live credential to a terminal puts it in scrollback
  // and in any transcript of this session.
  console.log(`✅ ${ROLE} can now log in. ${ENV_USER}/${ENV_PASS} written to Backend/.env (mode 600).`);
  console.log(`   The password was not printed. Re-run this script to rotate it.`);
  await pool.end();
}

main().catch(err => {
  console.error('❌ could not set up the reports role:', err.message);
  process.exit(1);
});
