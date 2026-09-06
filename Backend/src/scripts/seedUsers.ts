import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
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
 *
 * DEV-LOGIN AUTOFILL
 * Also writes `Frontend/.env.development.local` with ONE account's credentials,
 * so the login page can offer a dev-only autofill button instead of anyone
 * memorising a password that this script rotates.
 *
 * That file is the reason the autofill is safe to have at all:
 *   - It is gitignored (`*.local`) — the passwords never enter the repo.
 *   - Vite only exposes `VITE_`-prefixed vars, and only in a build that reads
 *     this file. A production build has no such file, so the vars are
 *     `undefined` and the button does not render — see Login.tsx, which also
 *     gates on `import.meta.env.DEV`.
 *   - It is rewritten on every run, so the autofill cannot drift from the real
 *     password. A hardcoded credential panel on the login page (which this
 *     project shipped once) goes stale immediately and is readable by anyone
 *     who can reach the page. See CLAUDE.md.
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
  console.log(`  Re-run this script to rotate them.`);

  writeDevLoginEnv(issued);
}

/**
 * Write the dev-only autofill credentials for the login page.
 *
 * Picks the manager account when there is one — it has the widest read access,
 * so it is the most useful account to land in for verification. Falls back to
 * the first issued account.
 *
 * Failure here must never fail the seed: the printed passwords above are the
 * real output, and this file is a convenience on top of them.
 */
function writeDevLoginEnv(
  issued: { email: string; password: string; role: string; workspace: string }[],
): void {
  const pick = issued.find(i => i.role === 'manager') ?? issued[0];
  if (!pick) return;

  const target = path.resolve(__dirname, '../../../Frontend/.env.development.local');
  const body = [
    '# Written by `cd Backend && npm run db:seed:users`. DO NOT COMMIT — gitignored',
    '# via `*.local`. Rewritten on every run, so it always matches the live password.',
    '#',
    '# Consumed only by the dev-only autofill button on the login page, which is',
    '# additionally gated on `import.meta.env.DEV`. A production build has no such',
    '# file, so these are undefined and the button does not render.',
    `VITE_DEV_LOGIN_EMAIL=${pick.email}`,
    `VITE_DEV_LOGIN_PASSWORD=${pick.password}`,
    '',
  ].join('\n');

  try {
    fs.writeFileSync(target, body, { mode: 0o600 });
    console.log(`\n  Dev-login autofill written for ${pick.email} (${pick.role}).`);
    console.log(`  ${path.relative(process.cwd(), target)} — gitignored, dev builds only.`);
    console.log(`  Restart Vite to pick it up; the button appears on /login.\n`);
  } catch (err) {
    console.warn(`\n  Could not write the dev-login autofill file (${(err as Error).message}).`);
    console.warn(`  Not fatal — the passwords above are still valid.\n`);
  }
}

main()
  .then(() => pool.end())
  .catch(async err => {
    console.error(err);
    await pool.end().catch(() => {});
    process.exit(1);
  });
