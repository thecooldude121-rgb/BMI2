-- Migration 015: make activities, tasks and meetings fit to have an API.
--
-- All three tables already exist and are better shaped than expected —
-- `activities` is already polymorphic over lead/deal/contact, and `tasks`
-- carries 15 rows of real data. None of them has ever been reachable: there is
-- no controller for any of them, and the CRM's activity timeline and task list
-- run entirely on inline fixtures.
--
-- This migration only closes the gaps that block a safe API. It does not
-- restructure anything.

-- ── 1. meetings.tenant_id — REQUIRED before exposing this table ─────────────
-- Migration 008 added tenant_id to the 18 tables the controllers touched.
-- `meetings` was not one of them, so it has no tenancy at all. Exposing it
-- unscoped would let any tenant read every tenant's meetings — the same class of
-- bug as the tags leak fixed in migration 010, but for meeting content.
--
-- The table is empty, so there is nothing to backfill and NOT NULL is safe. If
-- rows ever appear before this runs, the backfill below assigns them to the
-- first tenant rather than failing.
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

UPDATE meetings
SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1)
WHERE tenant_id IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meetings' AND column_name = 'tenant_id' AND is_nullable = 'YES'
  ) AND NOT EXISTS (SELECT 1 FROM meetings WHERE tenant_id IS NULL) THEN
    ALTER TABLE meetings ALTER COLUMN tenant_id SET NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_meetings_tenant_id ON meetings (tenant_id);

-- ── 2. activities: link to accounts, and a safer id ─────────────────────────
-- activities can already hang off a lead, deal or contact but not a company, so
-- an account timeline cannot be assembled.
ALTER TABLE activities ADD COLUMN IF NOT EXISTS company_id VARCHAR REFERENCES companies(id) ON DELETE CASCADE;

-- The id default is
--   substring(replace(gen_random_uuid()::text, '-', ''), 1, 9)
-- i.e. 9 hex characters (~68 billion values) on a primary key with no retry on
-- conflict. Birthday collisions become non-negligible in the hundreds of
-- thousands of rows, and a collision here is a failed insert the user sees as a
-- lost activity. The table is empty, so widening the default costs nothing now
-- and cannot be done cheaply later.
ALTER TABLE activities ALTER COLUMN id SET DEFAULT replace(gen_random_uuid()::text, '-', '');

-- Timeline reads are always "this record's activities, newest first".
CREATE INDEX IF NOT EXISTS idx_activities_deal    ON activities (deal_id, created_at DESC)    WHERE deal_id    IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activities_contact ON activities (contact_id, created_at DESC) WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activities_company ON activities (company_id, created_at DESC) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activities_lead    ON activities (lead_id, created_at DESC)    WHERE lead_id    IS NOT NULL;
-- Supports "my open activities across the tenant".
CREATE INDEX IF NOT EXISTS idx_activities_tenant_assigned ON activities (tenant_id, assigned_to, scheduled_at);

-- ── 3. tasks: the columns an editable task list needs ──────────────────────
-- `tasks` has created_at but no updated_at, so a controller that stamps it on
-- update — the pattern every other controller here uses — would 500. And there
-- is no completed_at, so "when was this finished" is unanswerable.
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Backfill completed_at for tasks already marked done, so the column is not
-- misleadingly empty for them. created_at is the best available approximation
-- and is explicitly an approximation, not a recorded completion time.
UPDATE tasks SET completed_at = created_at WHERE status = 'completed' AND completed_at IS NULL;

-- The task list is filtered by owner and by the record a task hangs off.
CREATE INDEX IF NOT EXISTS idx_tasks_tenant_status  ON tasks (tenant_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_related        ON tasks (related_to_type, related_to_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned       ON tasks (tenant_id, assigned_to, due_date);
