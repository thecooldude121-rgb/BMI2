-- Migration 057: scheduled delivery of saved reports.
--
-- SCHEMA AND ACCESS MODEL ONLY. There is no send path, and deliberately so:
-- this CRM has no job runner, and `EMAIL_TRANSPORT=log` does not deliver. Both
-- are tracked as separate infrastructure work. Shipping a schedule UI over
-- machinery that cannot fire would be a dead button promising delivery — the
-- failure this project keeps removing — so the tables exist and nothing writes
-- to them yet.
--
-- ─── THE DECISION THIS SCHEMA ENCODES ────────────────────────────────────
--
-- Venkat's call: a scheduled send RE-CHECKS EACH RECIPIENT'S ACCESS AT SEND
-- TIME. It does not send as its creator, and it does not cache who could see
-- the report when the schedule was made.
--
-- That decision is why there is no `can_view_snapshot` column, no
-- `send_as_user_id`, and no stored copy of the grant list. A cached answer is a
-- second source of truth for visibility, and the whole of P3 has kept exactly
-- one: the predicates in services/reports/access.ts, welded into the queries.
--
-- ─── RECIPIENTS ARE USERS, NOT EMAIL ADDRESSES ───────────────────────────
--
-- This is the same decision made structural, and it is the single most
-- important column choice here.
--
-- A `recipient_email TEXT` column would make the agreed model UNENFORCEABLE:
-- there is no user to re-check, so an address typed into a form becomes a
-- standing export of workspace data to someone who may have no account at all,
-- may have left the company, or may never have been a member. Storing a
-- `user_id` means "does this person still have access" is a question the
-- database can answer, every time, against the same predicate the API uses.
--
-- The cost is real and accepted: you cannot schedule a report to a customer, an
-- auditor, or a personal address. That is a feature boundary, not an oversight
-- — sending tenant data outside the tenant is a different decision and needs
-- its own one.

CREATE TABLE IF NOT EXISTS saved_report_schedules (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    report_id    UUID NOT NULL,

    -- Who set it up. SET NULL rather than CASCADE, and the reasoning differs
    -- from saved_reports.owner_id: because each recipient is re-checked
    -- individually, the creator is NOT the authority for anyone's access, so
    -- their departure does not invalidate the schedule. It is recorded for
    -- audit, not for permission.
    created_by   INTEGER,

    cadence      TEXT NOT NULL,
    -- UTC, because a tenant-local time needs a tenant timezone and no column
    -- records one. Storing a local hour with no zone would be a number that
    -- means something different depending on who reads it.
    hour_utc     SMALLINT NOT NULL DEFAULT 6,
    day_of_week  SMALLINT,
    day_of_month SMALLINT,

    format       TEXT NOT NULL DEFAULT 'pdf',

    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    last_run_at  TIMESTAMPTZ,

    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Needed so recipients can carry a COMPOSITE foreign key back to the schedule.
ALTER TABLE saved_report_schedules DROP CONSTRAINT IF EXISTS saved_report_schedules_id_tenant_key;
ALTER TABLE saved_report_schedules ADD CONSTRAINT saved_report_schedules_id_tenant_key
  UNIQUE (id, tenant_id);

-- COMPOSITE FK to the report. A plain `REFERENCES saved_reports(id)` would let
-- a schedule in workspace A point at workspace B's report and satisfy
-- referential integrity while breaking tenant isolation — the exact hazard
-- CLAUDE.md records for every other FK here. CASCADE: a schedule for a deleted
-- report has nothing to send.
ALTER TABLE saved_report_schedules DROP CONSTRAINT IF EXISTS saved_report_schedules_report_fkey;
ALTER TABLE saved_report_schedules ADD CONSTRAINT saved_report_schedules_report_fkey
  FOREIGN KEY (report_id, tenant_id) REFERENCES saved_reports (id, tenant_id) ON DELETE CASCADE;

ALTER TABLE saved_report_schedules DROP CONSTRAINT IF EXISTS saved_report_schedules_creator_fkey;
ALTER TABLE saved_report_schedules ADD CONSTRAINT saved_report_schedules_creator_fkey
  FOREIGN KEY (created_by, tenant_id) REFERENCES users (id, tenant_id) ON DELETE SET NULL;

ALTER TABLE saved_report_schedules DROP CONSTRAINT IF EXISTS saved_report_schedules_cadence_check;
ALTER TABLE saved_report_schedules ADD CONSTRAINT saved_report_schedules_cadence_check
  CHECK (cadence IN ('daily', 'weekly', 'monthly'));

-- The export formats that actually exist. A schedule naming a format nothing
-- can produce is a row that fails only when it fires, months later.
ALTER TABLE saved_report_schedules DROP CONSTRAINT IF EXISTS saved_report_schedules_format_check;
ALTER TABLE saved_report_schedules ADD CONSTRAINT saved_report_schedules_format_check
  CHECK (format IN ('csv', 'xlsx', 'pdf'));

ALTER TABLE saved_report_schedules DROP CONSTRAINT IF EXISTS saved_report_schedules_hour_check;
ALTER TABLE saved_report_schedules ADD CONSTRAINT saved_report_schedules_hour_check
  CHECK (hour_utc BETWEEN 0 AND 23);

-- The cadence fields must match the cadence, so an unsatisfiable row cannot be
-- stored: a weekly schedule with no weekday has no answer to "when", and a
-- daily one carrying a weekday is two instructions that disagree.
--
-- day_of_month is capped at 28 ON PURPOSE. 29, 30 and 31 do not exist in every
-- month, and "the 31st means the last day" is a product decision nobody has
-- made. A cap refuses the ambiguous case instead of silently resolving it —
-- the same call made for expected_close_date's missing CHECK, in the direction
-- that one should have gone.
ALTER TABLE saved_report_schedules DROP CONSTRAINT IF EXISTS saved_report_schedules_cadence_fields_check;
--
-- NOTE THE EXPLICIT `IS NOT NULL` ON EACH BRANCH. Without it this constraint
-- silently does nothing for the case it most needs to catch, and the first
-- version shipped here had exactly that bug — found by probing it rather than
-- reading it.
--
-- `day_of_week BETWEEN 0 AND 6` is NULL, not FALSE, when the column is NULL. So
-- for a weekly row with no weekday the branch evaluated to
-- TRUE AND NULL AND TRUE = NULL, the whole OR chain became
-- FALSE OR NULL OR FALSE = NULL, and **a CHECK constraint ACCEPTS a NULL
-- result**. The unsatisfiable row the constraint exists to refuse was the one
-- row it let through.
ALTER TABLE saved_report_schedules ADD CONSTRAINT saved_report_schedules_cadence_fields_check
  CHECK (
    (cadence = 'daily'
       AND day_of_week IS NULL AND day_of_month IS NULL)
    OR (cadence = 'weekly'
       AND day_of_week IS NOT NULL AND day_of_week BETWEEN 0 AND 6
       AND day_of_month IS NULL)
    OR (cadence = 'monthly'
       AND day_of_month IS NOT NULL AND day_of_month BETWEEN 1 AND 28
       AND day_of_week IS NULL)
  );

CREATE INDEX IF NOT EXISTS idx_saved_report_schedules_report
  ON saved_report_schedules (tenant_id, report_id);

-- The query a job runner will make: active schedules, by when they fire.
-- PARTIAL, because an inactive schedule is never a candidate.
CREATE INDEX IF NOT EXISTS idx_saved_report_schedules_due
  ON saved_report_schedules (cadence, hour_utc)
  WHERE is_active;

-- ── Recipients ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS saved_report_schedule_recipients (
    schedule_id UUID    NOT NULL,
    user_id     INTEGER NOT NULL,
    tenant_id   UUID    NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One row per person per schedule. Being listed twice cannot mean anything
    -- useful, and would mean two copies of the same mail.
    PRIMARY KEY (schedule_id, user_id)
);

ALTER TABLE saved_report_schedule_recipients
  DROP CONSTRAINT IF EXISTS saved_report_schedule_recipients_schedule_fkey;
ALTER TABLE saved_report_schedule_recipients
  ADD CONSTRAINT saved_report_schedule_recipients_schedule_fkey
  FOREIGN KEY (schedule_id, tenant_id)
  REFERENCES saved_report_schedules (id, tenant_id) ON DELETE CASCADE;

-- The composite that makes a cross-workspace recipient UNSTORABLE rather than
-- merely refused by application code.
ALTER TABLE saved_report_schedule_recipients
  DROP CONSTRAINT IF EXISTS saved_report_schedule_recipients_user_fkey;
ALTER TABLE saved_report_schedule_recipients
  ADD CONSTRAINT saved_report_schedule_recipients_user_fkey
  FOREIGN KEY (user_id, tenant_id) REFERENCES users (id, tenant_id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_saved_report_schedule_recipients_user
  ON saved_report_schedule_recipients (tenant_id, user_id);

-- Verify with:
--   SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
--    WHERE conrelid IN ('saved_report_schedules'::regclass,
--                       'saved_report_schedule_recipients'::regclass)
--      AND contype IN ('c','f','u','p') ORDER BY conname;
