import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { runMigrations } from './config/runMigrations';
import { createApp } from './app';

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set in the environment. Refusing to start.');
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
  });
};

start();
