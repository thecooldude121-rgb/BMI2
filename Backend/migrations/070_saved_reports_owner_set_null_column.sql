-- Migration 070: deleting a user clears a saved report's owner / a schedule's
-- creator, instead of failing.
--
-- 056 (saved_reports.owner_id) and 057 (saved_report_schedules.created_by)
-- declared composite references to users (id, tenant_id) with a bare
-- ON DELETE SET NULL. On a two-column key that nulls BOTH columns, tenant_id
-- included, and tenant_id is NOT NULL, so deleting a user who owned a report or
-- created a schedule failed with 23502 instead of leaving the row ownerless as
-- both migrations' comments intend. Found 2026-10-15 when the first test that
-- deleted such a user (test teardown) could not.
--
-- The fix is the column-listed form 060 and 064 already use:
-- ON DELETE SET NULL (owner_id). 056 is not edited: it is applied on live, and
-- the runner locks an applied file by checksum.
--
-- Both tables were empty on live and in the test database when this was written.

ALTER TABLE saved_reports DROP CONSTRAINT IF EXISTS saved_reports_owner_fkey;
ALTER TABLE saved_reports ADD CONSTRAINT saved_reports_owner_fkey
  FOREIGN KEY (owner_id, tenant_id) REFERENCES users (id, tenant_id) ON DELETE SET NULL (owner_id);

ALTER TABLE saved_report_schedules DROP CONSTRAINT IF EXISTS saved_report_schedules_creator_fkey;
ALTER TABLE saved_report_schedules ADD CONSTRAINT saved_report_schedules_creator_fkey
  FOREIGN KEY (created_by, tenant_id) REFERENCES users (id, tenant_id) ON DELETE SET NULL (created_by);
