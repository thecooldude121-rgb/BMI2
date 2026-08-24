import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB, pool } from './config/database';
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
  // Migration 008: multi-tenancy foundation — see
  // Backend/migrations/008_add_tenants_and_tenant_id.sql for the annotated
  // version. Mirrored here so a fresh boot/clone reproduces the schema.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tenants (
      id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      name       TEXT        NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    INSERT INTO tenants (name)
    SELECT 'Default Organization'
    WHERE NOT EXISTS (SELECT 1 FROM tenants);

    ALTER TABLE users               ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
    ALTER TABLE companies           ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
    ALTER TABLE contacts            ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
    ALTER TABLE leads               ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
    ALTER TABLE deals               ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
    ALTER TABLE pipelines           ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
    ALTER TABLE pipeline_stages     ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
    ALTER TABLE activities          ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
    ALTER TABLE tasks               ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
    ALTER TABLE quotas              ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
    ALTER TABLE forecast_snapshots  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
    ALTER TABLE lead_notes          ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
    ALTER TABLE lead_tasks          ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
    ALTER TABLE lead_emails         ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
    ALTER TABLE lead_calls          ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
    ALTER TABLE lead_meetings       ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
    ALTER TABLE lead_views          ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
    ALTER TABLE tags                ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

    DO $$
    DECLARE
      seed_tenant_id UUID := (SELECT id FROM tenants ORDER BY created_at LIMIT 1);
    BEGIN
      UPDATE users              SET tenant_id = seed_tenant_id WHERE tenant_id IS NULL;
      UPDATE companies          SET tenant_id = seed_tenant_id WHERE tenant_id IS NULL;
      UPDATE contacts           SET tenant_id = seed_tenant_id WHERE tenant_id IS NULL;
      UPDATE leads              SET tenant_id = seed_tenant_id WHERE tenant_id IS NULL;
      UPDATE deals              SET tenant_id = seed_tenant_id WHERE tenant_id IS NULL;
      UPDATE pipelines          SET tenant_id = seed_tenant_id WHERE tenant_id IS NULL;
      UPDATE pipeline_stages    SET tenant_id = seed_tenant_id WHERE tenant_id IS NULL;
      UPDATE activities         SET tenant_id = seed_tenant_id WHERE tenant_id IS NULL;
      UPDATE tasks              SET tenant_id = seed_tenant_id WHERE tenant_id IS NULL;
      UPDATE quotas             SET tenant_id = seed_tenant_id WHERE tenant_id IS NULL;
      UPDATE forecast_snapshots SET tenant_id = seed_tenant_id WHERE tenant_id IS NULL;
      UPDATE lead_notes         SET tenant_id = seed_tenant_id WHERE tenant_id IS NULL;
      UPDATE lead_tasks         SET tenant_id = seed_tenant_id WHERE tenant_id IS NULL;
      UPDATE lead_emails        SET tenant_id = seed_tenant_id WHERE tenant_id IS NULL;
      UPDATE lead_calls         SET tenant_id = seed_tenant_id WHERE tenant_id IS NULL;
      UPDATE lead_meetings      SET tenant_id = seed_tenant_id WHERE tenant_id IS NULL;
      UPDATE lead_views         SET tenant_id = seed_tenant_id WHERE tenant_id IS NULL;
      UPDATE tags               SET tenant_id = seed_tenant_id WHERE tenant_id IS NULL;
    END $$;

    ALTER TABLE users               ALTER COLUMN tenant_id SET NOT NULL;
    ALTER TABLE companies           ALTER COLUMN tenant_id SET NOT NULL;
    ALTER TABLE contacts            ALTER COLUMN tenant_id SET NOT NULL;
    ALTER TABLE leads               ALTER COLUMN tenant_id SET NOT NULL;
    ALTER TABLE deals               ALTER COLUMN tenant_id SET NOT NULL;
    ALTER TABLE pipelines           ALTER COLUMN tenant_id SET NOT NULL;
    ALTER TABLE pipeline_stages     ALTER COLUMN tenant_id SET NOT NULL;
    ALTER TABLE activities          ALTER COLUMN tenant_id SET NOT NULL;
    ALTER TABLE tasks               ALTER COLUMN tenant_id SET NOT NULL;
    ALTER TABLE quotas              ALTER COLUMN tenant_id SET NOT NULL;
    ALTER TABLE forecast_snapshots  ALTER COLUMN tenant_id SET NOT NULL;
    ALTER TABLE lead_notes          ALTER COLUMN tenant_id SET NOT NULL;
    ALTER TABLE lead_tasks          ALTER COLUMN tenant_id SET NOT NULL;
    ALTER TABLE lead_emails         ALTER COLUMN tenant_id SET NOT NULL;
    ALTER TABLE lead_calls          ALTER COLUMN tenant_id SET NOT NULL;
    ALTER TABLE lead_meetings       ALTER COLUMN tenant_id SET NOT NULL;
    ALTER TABLE lead_views          ALTER COLUMN tenant_id SET NOT NULL;
    ALTER TABLE tags                ALTER COLUMN tenant_id SET NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_users_tenant_id              ON users(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_companies_tenant_id          ON companies(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_contacts_tenant_id           ON contacts(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_leads_tenant_id               ON leads(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_deals_tenant_id               ON deals(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_pipelines_tenant_id           ON pipelines(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_pipeline_stages_tenant_id     ON pipeline_stages(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_activities_tenant_id          ON activities(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_tenant_id               ON tasks(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_quotas_tenant_id               ON quotas(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_forecast_snapshots_tenant_id  ON forecast_snapshots(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_lead_notes_tenant_id          ON lead_notes(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_lead_tasks_tenant_id          ON lead_tasks(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_lead_emails_tenant_id         ON lead_emails(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_lead_calls_tenant_id          ON lead_calls(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_lead_meetings_tenant_id       ON lead_meetings(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_lead_views_tenant_id          ON lead_views(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_tags_tenant_id                ON tags(tenant_id);
  `);
  // Migration 009: tenant-scope the quotas/forecast_snapshots uniqueness
  // constraints — see Backend/migrations/009_scope_quota_forecast_uniqueness_to_tenant.sql
  await pool.query(`
    ALTER TABLE quotas DROP CONSTRAINT IF EXISTS quotas_rep_name_period_label_key;
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'quotas_tenant_rep_period_key'
      ) THEN
        ALTER TABLE quotas
          ADD CONSTRAINT quotas_tenant_rep_period_key UNIQUE (tenant_id, rep_name, period_label);
      END IF;
    END $$;

    ALTER TABLE forecast_snapshots DROP CONSTRAINT IF EXISTS forecast_snapshots_period_label_rep_name_snapshot_date_key;
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'forecast_snapshots_tenant_period_rep_date_key'
      ) THEN
        ALTER TABLE forecast_snapshots
          ADD CONSTRAINT forecast_snapshots_tenant_period_rep_date_key
            UNIQUE (tenant_id, period_label, rep_name, snapshot_date);
      END IF;
    END $$;
  `);
  // Migration 010: tenant-scope the remaining global UNIQUE constraints — see
  // Backend/migrations/010_scope_remaining_uniques_to_tenant.sql. tags_name_key
  // in particular made createTag a cross-tenant read/write.
  await pool.query(`
    ALTER TABLE tags DROP CONSTRAINT IF EXISTS tags_name_key;
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tags_tenant_name_key') THEN
        ALTER TABLE tags ADD CONSTRAINT tags_tenant_name_key UNIQUE (tenant_id, name);
      END IF;
    END $$;

    ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_email_key;
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contacts_tenant_email_key') THEN
        ALTER TABLE contacts ADD CONSTRAINT contacts_tenant_email_key UNIQUE (tenant_id, email);
      END IF;
    END $$;

    ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_email_key;
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_tenant_email_key') THEN
        ALTER TABLE leads ADD CONSTRAINT leads_tenant_email_key UNIQUE (tenant_id, email);
      END IF;
    END $$;
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
