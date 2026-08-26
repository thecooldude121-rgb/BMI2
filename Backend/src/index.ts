import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { runMigrations } from './config/runMigrations';
import { createApp } from './app';
import { assertEmailConfigured, getEmailService } from './services/email';

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set in the environment. Refusing to start.');
  process.exit(1);
}

// Refuse to boot on a mail configuration that would silently discard invites and
// password resets — most importantly, the no-op log transport in production.
// Same treatment as JWT_SECRET above: a misconfiguration that fails invisibly is
// worse than one that fails loudly.
try {
  assertEmailConfigured();
} catch (error) {
  console.error(`FATAL: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

// The app itself — middleware, routes, error handling — is assembled in app.ts
// so it can be imported without booting a server. This file keeps only the
// process concerns.
const app = createApp();
const PORT = process.env.PORT || 5000;

// Schema migrations live in Backend/migrations/, applied in order by a single
// runner with a ledger table (see src/config/runMigrations.ts). 137 lines of
// inline ALTER TABLE statements used to sit here, duplicating migrations
// 007/008/009 verbatim from the .sql files with nothing keeping them in sync.
const start = async () => {
  await connectDB();
  await runMigrations();
  app.listen(PORT, () => {
    console.log(`🚀 BMI2 Backend running on http://localhost:${PORT}`);
    console.log(`📋 API base: http://localhost:${PORT}/api/v1`);
    const mail = getEmailService();
    console.log(
      mail.delivers
        ? `✉️  email transport: ${mail.transportName}`
        : `✉️  email transport: ${mail.transportName} — messages are LOGGED, NOT DELIVERED`,
    );
  });
};

start();
