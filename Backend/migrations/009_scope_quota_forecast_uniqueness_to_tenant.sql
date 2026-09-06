-- Migration 009: Tenant-scope the quotas/forecast_snapshots uniqueness
-- constraints.
--
-- Migration 008 added tenant_id to quotas and forecast_snapshots but left
-- their pre-existing UNIQUE constraints as-is:
--   quotas:             UNIQUE(rep_name, period_label)
--   forecast_snapshots: UNIQUE(period_label, rep_name, snapshot_date)
-- Both controllers upsert with ON CONFLICT targeting those constraints, so
-- two different tenants using the same rep_name/period_label collide on the
-- same row and one tenant's upsert silently overwrites the other's data.
--
-- Safe to run multiple times: DROP/ADD CONSTRAINT use IF EXISTS / guard
-- against duplicates via a catalog check.

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
