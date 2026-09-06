import dotenv from 'dotenv';

dotenv.config();

/**
 * Runs BEFORE any test module is imported, which is the whole point.
 *
 * `src/config/database.ts` creates the connection pool at module load, so the
 * "is this a test database?" check has to happen before that import is
 * evaluated. Inside the test file it cannot: static imports are hoisted above
 * any statement, and `require` does not resolve extensionless relative paths
 * under Vitest's ESM transform. A setupFile is the one place that reliably runs
 * first.
 *
 * The suite creates, mutates and DELETES rows. Against `bmi_crm` that would
 * destroy live data, so anything not named *_test is refused.
 */
const DB_NAME = process.env.DB_NAME;
if (!DB_NAME || !/_test$/.test(DB_NAME)) {
  throw new Error(
    `Refusing to run tests: DB_NAME is "${DB_NAME ?? '(unset)'}". This suite ` +
    `writes and deletes rows, so it only runs against a database whose name ` +
    `ends in "_test". Use: npm run test:isolation`,
  );
}

// A JWT secret is required to mint and verify session tokens. Fall back to a
// throwaway value so the suite does not depend on a developer's .env, and so a
// CI run cannot accidentally sign tokens with the production secret.
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'test-only-jwt-secret';
