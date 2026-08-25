import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { runMigrations, getMigrationStatus } from './config/runMigrations';
import routes from './routes';
import { errorHandler, notFound } from './middleware/errorHandler';

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set in the environment. Refusing to start.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({
  origin: (origin, cb) => {
    const allowed = [
      process.env.CLIENT_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3001',
    ];
    if (!origin || allowed.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  // Report the schema state too. In development the server boots even when a
  // migration failed (see runMigrations), so "the API is up" is not by itself
  // enough to know the database is what the code expects.
  const migrations = getMigrationStatus();
  res.status(migrations.ok ? 200 : 503).json({
    status: migrations.ok ? 'ok' : 'degraded',
    migrations,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/v1', routes);

app.use(notFound);
app.use(errorHandler);

// Schema migrations now live in Backend/migrations/, applied in order by a
// single runner with a ledger table (see src/config/runMigrations.ts).
// 137 lines of inline ALTER TABLE statements used to sit here, duplicating
// migrations 007/008/009 verbatim from the .sql files with nothing keeping the
// two copies in sync.

const start = async () => {
  await connectDB();
  await runMigrations();
  app.listen(PORT, () => {
    console.log(`🚀 BMI2 Backend running on http://localhost:${PORT}`);
    console.log(`📋 API base: http://localhost:${PORT}/api/v1`);
  });
};

start();
