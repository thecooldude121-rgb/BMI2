import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Guards the target database and the JWT secret before any test module —
    // and therefore before config/database.ts's pool — is imported.
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.test.ts'],
    // These tests share one Postgres database and create rows with fixed ids.
    // Run them in a single process so two files cannot interleave setup and
    // teardown against the same rows.
    fileParallelism: false,
    hookTimeout: 30000,
    testTimeout: 30000,
  },
});
