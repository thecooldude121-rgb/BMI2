-- Migration 002: Add is_test flag to deals table.
-- Marks development/debugging records so they can be excluded from
-- production-facing views without deleting them permanently.
--
-- Default is false — all existing legitimate records are unaffected.
-- To create a test record, POST to /api/v1/deals with { "is_test": true }.
-- To see test records in GET /api/v1/deals, pass ?include_test=true
-- (restrict this param to admin/dev roles in a real multi-tenant env).
--
-- Safe to run multiple times (uses ADD COLUMN IF NOT EXISTS).

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN deals.is_test IS
  'True for dev/test records excluded from production views by default.';
