-- Migration 018: let deals be archived.
--
-- The deals list has offered an "Archive" bulk action since it was written, and
-- there is no column behind it — `deals` has neither `status` nor `is_archived`.
-- Archiving is a real need (get dead or long-closed deals out of the working
-- pipeline without destroying the record and its history), so this adds the
-- column rather than leaving one more control that cannot work.
--
-- Follows the existing `is_test` pattern on the same table: a NOT NULL boolean
-- defaulting to false, excluded from list queries unless explicitly asked for.

ALTER TABLE deals ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

-- Every pipeline query filters this out, alongside is_test.
CREATE INDEX IF NOT EXISTS idx_deals_tenant_active
  ON deals (tenant_id, stage)
  WHERE is_archived = false AND is_test = false;
