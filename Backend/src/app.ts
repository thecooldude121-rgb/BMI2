import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import { getMigrationStatus } from './config/runMigrations';
import { checkDatabase } from './config/dbHealth';
import { errorHandler, notFound } from './middleware/errorHandler';

/**
 * The configured Express app, with NO side effects on import.
 *
 * This was extracted from index.ts so the app can be exercised by a test.
 * index.ts called start() — connectDB, runMigrations, listen — at module load,
 * so importing it from a test booted a real server against the real database
 * and there was no way to make assertions against the actual router stack.
 * Everything a request passes through in production is assembled here; index.ts
 * keeps only the process concerns (secret check, DB connect, migrations, listen).
 *
 * The tenant-isolation suite drives THIS object, so it exercises the real
 * routes, the real `protect` middleware and the real controllers — not a
 * hand-built stub that could diverge from what actually serves traffic.
 */
export function createApp() {
  const app = express();

  // See index.ts: without this the per-IP rate-limit budget collapses into one
  // shared global budget behind a proxy.
  app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 0));

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
  // Request logging is noise in a test run; production behaviour is unchanged.
  if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', async (_req, res) => {
    // Report the schema state too. In development the server boots even when a
    // migration failed (see runMigrations), so "the API is up" is not by itself
    // enough to know the database is what the code expects.
    const migrations = getMigrationStatus();
    // And whether the database answers NOW (Group A item 2): migrations are
    // captured at boot, so without this /health said "ok" with Postgres down.
    // The sidebar's "Workspace connected" is shown only on this being true.
    const database = await checkDatabase();
    const ok = migrations.ok && database.ok;
    res.status(ok ? 200 : 503).json({
      status: ok ? 'ok' : 'degraded',
      migrations,
      database,
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/v1', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
