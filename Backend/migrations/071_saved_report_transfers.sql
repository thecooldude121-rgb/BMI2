-- 071 — a record of every transfer of a saved report's ownership.
--
-- Reports replay step c, decided by Venkat 2026-10-16. A report is OWNERLESS when
-- it has no owner (070 clears owner_id when the user is deleted) or its owner is
-- deactivated. A workspace admin may then view it, delete it, or transfer it to an
-- active member of the same workspace, who becomes its owner. Each transfer is
-- recorded here: who did it, from whom, to whom, and when.
--
-- History outlives what it describes: every reference is column-listed
-- ON DELETE SET NULL, so deleting a user or the report clears only that
-- reference. The names (and the report's name) are CAPTURED at transfer time, so
-- a record still reads correctly after a rename or a deletion — identity by
-- reference, display by capture, as forecast_snapshots does (043).
--
-- Every reference is COMPOSITE with tenant_id, so a record can never point into
-- another workspace.

CREATE TABLE IF NOT EXISTS saved_report_transfers (
    id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id            UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    report_id            UUID,
    report_name          VARCHAR(255) NOT NULL,
    from_user_id         INTEGER,
    from_user_name       TEXT,
    to_user_id           INTEGER,
    to_user_name         TEXT         NOT NULL,
    transferred_by       INTEGER,
    transferred_by_name  TEXT         NOT NULL,
    transferred_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT saved_report_transfers_report_fkey
      FOREIGN KEY (report_id, tenant_id) REFERENCES saved_reports (id, tenant_id)
      ON DELETE SET NULL (report_id),
    CONSTRAINT saved_report_transfers_from_fkey
      FOREIGN KEY (from_user_id, tenant_id) REFERENCES users (id, tenant_id)
      ON DELETE SET NULL (from_user_id),
    CONSTRAINT saved_report_transfers_to_fkey
      FOREIGN KEY (to_user_id, tenant_id) REFERENCES users (id, tenant_id)
      ON DELETE SET NULL (to_user_id),
    CONSTRAINT saved_report_transfers_by_fkey
      FOREIGN KEY (transferred_by, tenant_id) REFERENCES users (id, tenant_id)
      ON DELETE SET NULL (transferred_by)
);

CREATE INDEX IF NOT EXISTS idx_saved_report_transfers_report
  ON saved_report_transfers (tenant_id, report_id, transferred_at);

-- The reporting role reads report DATA, never report configuration (as 056).
-- Verify with:
--   SELECT grantee FROM information_schema.table_privileges
--    WHERE table_name = 'saved_report_transfers';   -- must not list bmi_reports_ro
