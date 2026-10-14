-- Migration 056: saved reports, and per-person grants at two levels.
--
-- P3 Phase 2. Design: REPORTS_QUERY_BUILDER_DESIGN.md §1, with the sharing
-- model as decided 2026-09-19 and refined 2026-09-21.
--
-- ─── THERE IS NO `visibility` COLUMN, AND THAT IS THE DESIGN ───────────────
--
-- The design sketched `visibility IN ('private','workspace')`. That is
-- SUPERSEDED: sharing is per-person, so "private" is simply the absence of
-- grants. A `visibility` column alongside a grants table would be two sources
-- of truth for one question, and the pattern this project keeps removing is
-- exactly that — a second place for the answer to disagree with itself.
--
-- ─── TWO GRANT LEVELS, WITH view AS THE FLOOR ─────────────────────────────
--
--   view — can open and run the report
--   edit — can also change its definition
--
-- `edit` IMPLIES `view`; there is deliberately no edit-without-view. That is
-- not just a convention in the permission helper: a single row per (report,
-- user) holding one level makes "edit but not view" UNREPRESENTABLE, rather
-- than merely discouraged. The same move as scopedSource in Phase 0.
--
-- The OWNER is not a grant row. Ownership is `saved_reports.owner_id` and
-- carries view + edit + delete + the right to grant. Only the owner may grant
-- or revoke.
--
-- ─── WHY EVERY KEY HERE IS COMPOSITE ──────────────────────────────────────
--
-- `users.id` and `saved_reports.id` are global; a plain FK would let workspace
-- A's report be granted to workspace B's user. So a grant carries `tenant_id`
-- and BOTH of its foreign keys are composite:
--
--   (report_id, tenant_id) -> saved_reports (id, tenant_id)
--   (user_id,   tenant_id) -> users         (id, tenant_id)
--
-- A cross-workspace grant is therefore not a bug to be caught in a controller —
-- it cannot be stored. `users_id_tenant_key` already exists; this migration adds
-- the matching unique on saved_reports so the first FK is expressible.
--
-- ─── THE REPORTS ROLE IS DELIBERATELY NOT GRANTED THESE TABLES ────────────
--
-- `bmi_reports_ro` (migration 055) gets nothing here. A report DEFINITION is
-- configuration read by the application on its own pool; only the generated
-- aggregate query runs on the restricted connection. Granting the reporting
-- role access to definitions and grants would widen its surface for no reason.

-- ── saved_reports ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS saved_reports (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name         VARCHAR(255) NOT NULL,
    description  TEXT,
    category     VARCHAR(100),
    definition   JSONB NOT NULL,
    owner_id     INTEGER,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Needed so a grant's composite FK can reference it. Also makes the pair the
-- canonical way to address a report.
ALTER TABLE saved_reports DROP CONSTRAINT IF EXISTS saved_reports_id_tenant_key;
ALTER TABLE saved_reports ADD CONSTRAINT saved_reports_id_tenant_key UNIQUE (id, tenant_id);

-- ON DELETE SET NULL, not CASCADE: a saved report is workspace configuration
-- that outlives the person who wrote it. Same call as forecast_snapshots.user_id;
-- the opposite of quotas.user_id, which CASCADEs because a quota without its
-- person is meaningless. An ownerless report is still runnable by its grantees.
ALTER TABLE saved_reports DROP CONSTRAINT IF EXISTS saved_reports_owner_fkey;
ALTER TABLE saved_reports ADD CONSTRAINT saved_reports_owner_fkey
  FOREIGN KEY (owner_id, tenant_id) REFERENCES users (id, tenant_id) ON DELETE SET NULL;

ALTER TABLE saved_reports DROP CONSTRAINT IF EXISTS saved_reports_name_unique;
ALTER TABLE saved_reports ADD CONSTRAINT saved_reports_name_unique UNIQUE (tenant_id, name);

-- THE DATABASE HALF OF DEFINITION VALIDATION — mutation M6 from the design.
--
-- The controller validates the whole definition by compiling it with the Phase 0
-- builder, which is far stricter than this. But a controller guard binds one
-- writer: this refuses a definition naming a table outside the registry however
-- it arrives, including a hand-typed INSERT or a future endpoint. Same
-- both-layers reasoning as migrations 049 and 050.
--
-- Only `base` is constrained here, not every field. A CHECK cannot reasonably
-- express the registry, and pretending otherwise would give a false sense of
-- what this enforces: it stops the one field that decides which table is read.
ALTER TABLE saved_reports DROP CONSTRAINT IF EXISTS saved_reports_definition_shape_check;
ALTER TABLE saved_reports ADD CONSTRAINT saved_reports_definition_shape_check
  CHECK (
    definition ? 'v'
    AND definition ? 'base'
    AND definition->>'base' IN ('deals','companies','contacts','leads','activities')
  );

CREATE INDEX IF NOT EXISTS idx_saved_reports_tenant ON saved_reports (tenant_id, name);
CREATE INDEX IF NOT EXISTS idx_saved_reports_owner  ON saved_reports (tenant_id, owner_id);

-- ── saved_report_grants ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS saved_report_grants (
    report_id  UUID        NOT NULL,
    user_id    INTEGER     NOT NULL,
    tenant_id  UUID        NOT NULL,
    -- One row per (report, user) holding ONE level. This is what makes
    -- "edit but not view" unrepresentable rather than merely discouraged.
    level      VARCHAR(10) NOT NULL,
    granted_by INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (report_id, user_id),
    CONSTRAINT saved_report_grants_level_check CHECK (level IN ('view', 'edit')),
    CONSTRAINT saved_report_grants_report_fkey
      FOREIGN KEY (report_id, tenant_id) REFERENCES saved_reports (id, tenant_id) ON DELETE CASCADE,
    CONSTRAINT saved_report_grants_user_fkey
      FOREIGN KEY (user_id, tenant_id) REFERENCES users (id, tenant_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_saved_report_grants_user ON saved_report_grants (tenant_id, user_id);

-- Verify with:
--   SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
--    WHERE conrelid IN ('saved_reports'::regclass,'saved_report_grants'::regclass) ORDER BY 1;
--   SELECT grantee FROM information_schema.table_privileges
--    WHERE table_name IN ('saved_reports','saved_report_grants');   -- must not list bmi_reports_ro
