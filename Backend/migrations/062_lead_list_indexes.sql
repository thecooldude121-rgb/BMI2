-- Migration 062: indexes for server-side lead pagination (step 5 slice A).
--
-- GET /leads now pages over every lead in SQL (utils/leadListQuery) instead of
-- loading 50 rows and paging them in the browser. Every list query is
-- "tenant_id = $1 … ORDER BY <col>, id", so these serve the default order
-- (newest), the stage-filtered Kanban lanes, and the score sort without a
-- sort over the whole workspace. Additive; safe on live data.

CREATE INDEX IF NOT EXISTS idx_leads_tenant_created ON leads (tenant_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_stage_created ON leads (tenant_id, stage, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_score ON leads (tenant_id, score DESC NULLS LAST, id DESC);
