import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { pool } from '../config/database';

/**
 * Give the seeded users real, usable passwords.
 *
 * WHY THIS EXISTS
 * The five seeded accounts (alex@ … david@) were inserted with password hashes
 * nobody has the plaintext for. That was invisible while `AuthContext.login` was
 * mocked and accepted anything; the moment login became real, the application
 * had no working way in for anyone — including whoever needs to verify it.
 *
 * RULES THIS FOLLOWS
 * - Hashed through the SAME path registration uses: bcrypt at cost 12. Not an
 *   INSERT of a pre-computed digest, so if the hashing policy changes in
 *   authController this script does not silently drift from it.
 * - Passwords are GENERATED at run time and printed once. Nothing is committed:
 *   there is no password in this file, in the repo, or in the database in
 *   recoverable form. Re-running issues fresh ones.
 * - Existing users are updated, never duplicated, and no user is created here —
 *   this script hands out credentials for accounts that already exist rather
 *   than inventing people.
 *
 * Run: cd Backend && npm run db:seed:users
 */

/** Same cost factor as authController.register. Keep them in step. */
const BCRYPT_COST = 12;

/**
 * Readable but strong: 4 words plus digits beats a random string nobody can
 * type from a terminal into a browser, which is exactly what this is for.
 */
const WORDS = [
  'harbor', 'lantern', 'meadow', 'copper', 'thistle', 'quartz', 'willow', 'ember',
  'cobalt', 'juniper', 'saffron', 'marble', 'cedar', 'onyx', 'pebble', 'ridge',
];

function generatePassword(): string {
  const pick = () => WORDS[crypto.randomInt(0, WORDS.length)];
  const digits = String(crypto.randomInt(1000, 10000));
  return `${pick()}-${pick()}-${pick()}-${digits}`;
}

async function main(): Promise<void> {
  const { rows: users } = await pool.query<{
    id: number; email: string; first_name: string | null; role: string; tenant_id: string;
  }>(
    `SELECT u.id, u.email, u.first_name, u.role, u.tenant_id
       FROM users u
      ORDER BY u.id`,
  );

  if (users.length === 0) {
    console.log('No users found. Nothing to do — this script sets passwords, it does not create accounts.');
    return;
  }

  const { rows: workspaces } = await pool.query<{ id: string; name: string; slug: string }>(
    'SELECT id, name, slug FROM tenants ORDER BY created_at',
  );
  const wsBySlug = new Map(workspaces.map(w => [w.id, w]));

  const issued: { email: string; password: string; role: string; workspace: string }[] = [];

  for (const user of users) {
    const password = generatePassword();
    const hash = await bcrypt.hash(password, BCRYPT_COST);
    await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, user.id]);
    issued.push({
      email: user.email,
      password,
      role: user.role,
      workspace: wsBySlug.get(user.tenant_id)?.slug ?? user.tenant_id,
    });
  }

  const width = Math.max(...issued.map(i => i.email.length));
  console.log(`\n  Set passwords for ${issued.length} user(s). Shown once — not stored anywhere in plaintext.\n`);
  for (const i of issued) {
    console.log(`    ${i.email.padEnd(width)}  ${i.password}   (${i.role} · ${i.workspace})`);
  }
  console.log(`\n  Sign in at http://localhost:5173/login`);
  console.log(`  Re-run this script to rotate them.\n`);
}

main()
  .then(() => pool.end())
  .catch(async err => {
    console.error(err);
    await pool.end().catch(() => {});
    process.exit(1);
  });
