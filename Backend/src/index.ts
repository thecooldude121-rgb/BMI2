import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB, pool } from './config/database';
import routes from './routes';
import { errorHandler, notFound } from './middleware/errorHandler';

dotenv.config();

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
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1', routes);

app.use(notFound);
app.use(errorHandler);

const runMigrations = async () => {
  // Idempotent column additions — safe to run on every startup
  await pool.query(`
    ALTER TABLE deals
      ADD COLUMN IF NOT EXISTS attachment_metadata JSONB DEFAULT '[]'
  `);
  // Migration 007: extend lead_views with saved-view metadata fields
  await pool.query(`
    ALTER TABLE lead_views
      ADD COLUMN IF NOT EXISTS is_pinned    BOOLEAN     NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS view_order   INTEGER     NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS visibility   VARCHAR(20) NOT NULL DEFAULT 'private',
      ADD COLUMN IF NOT EXISTS search_query TEXT        NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS view_mode    VARCHAR(10) NOT NULL DEFAULT 'list',
      ADD COLUMN IF NOT EXISTS icon         VARCHAR(50) NOT NULL DEFAULT 'list'
  `);
};

const start = async () => {
  await connectDB();
  await runMigrations();
  app.listen(PORT, () => {
    console.log(`🚀 BMI2 Backend running on http://localhost:${PORT}`);
    console.log(`📋 API base: http://localhost:${PORT}/api/v1`);
  });
};

start();
