-- Migration 008: Multi-tenancy foundation.
-- Adds a tenants table and a tenant_id column (UUID, NOT NULL, FK to tenants)
-- to every table currently reachable through the backend API. Backfills all
-- existing rows to a single seed tenant so nothing currently in the database
-- breaks.
--
-- Safe to run multiple times:
--   - tenants seed insert is a no-op once a tenant row exists.
--   - ADD COLUMN / CREATE INDEX use IF NOT EXISTS.
--   - backfill only touches rows where tenant_id IS NULL.
--   - SET NOT NULL is a no-op if the column is already NOT NULL.
--
-- Scope note: this covers the 18 tables actually read/written by the
-- current backend controllers (auth, deals, contacts, companies, leads,
-- leadSub, users, quotas, forecast). Tables with no backend code today
-- (roles, employees, gamification_*, workflow_*, approval_*, blueprint_*,
-- invoices, quotes, products, documents, etc.) are intentionally out of
-- scope for this migration — see CRM_REMEDIATION_PLAN.md Phase 1 discussion.

-- ── 1. tenants table ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenants (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. seed exactly one tenant ───────────────────────────────────────────────
INSERT INTO tenants (name)
SELECT 'Default Organization'
WHERE NOT EXISTS (SELECT 1 FROM tenants);

-- ── 3. add nullable tenant_id to every in-scope table ───────────────────────
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

-- ── 4. backfill every existing row to the seed tenant ───────────────────────
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

-- ── 5. enforce NOT NULL now that every row has a tenant_id ──────────────────
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

-- ── 6. index tenant_id on every table — every scoped query will filter on it ─
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
