-- Migration 055: a read-only reporting role, and row-level security behind it.
--
-- P3 Phase 1. Design: REPORTS_QUERY_BUILDER_DESIGN.md §2.4, approved 2026-09-19.
--
-- ─── WHAT THIS IS FOR ─────────────────────────────────────────────────────
--
-- Phase 0's query builder makes an unscoped query inexpressible: a table can
-- only be named through `scopedSource()`, which always emits
-- `WHERE tenant_id = $n`. That is a guarantee about the CODE. This migration
-- adds one about the DATABASE: even if the builder were sabotaged, a report
-- query cannot read another workspace's rows, because the connection it runs on
-- is not permitted to see them.
--
-- The two are independent on purpose. The mutation suite proves it by breaking
-- the builder and asserting RLS still blocks the read.
--
-- ─── WHY THE EXISTING APP IS UNAFFECTED ───────────────────────────────────
--
-- Verified before writing this, not assumed: the application connects as
-- `venkatraj`, which OWNS every table here and is additionally a SUPERUSER.
--
--   * A table owner bypasses RLS unless the table is set FORCE ROW LEVEL
--     SECURITY. This migration deliberately does NOT force it.
--   * A superuser bypasses RLS unconditionally, FORCE or not.
--
-- So every existing query path — every controller, the test suite, the CSV
-- importer, psql by hand — behaves exactly as before. The policies below
-- constrain exactly one role: the new `bmi_reports_ro`.
--
-- THE FLIP SIDE, and it is the dangerous one: because the app role bypasses
-- RLS, a reports pool misconfigured to connect as `venkatraj` would have RLS
-- silently INERT while appearing to be protected. An inert security layer is
-- worse than an absent one, because it produces false confidence. The
-- application therefore proves RLS is live on its reporting connection before
-- serving a single report — see `assertRowSecurityActive()` in
-- config/reportsDatabase.ts, which checks BEHAVIOURALLY (a query with no tenant
-- set must return zero rows) rather than by inspecting configuration.
--
-- ─── WHY current_setting(..., true) ───────────────────────────────────────
--
-- The policies read `current_setting('app.tenant_id', true)`. The `true` is
-- missing_ok: with the setting absent it returns NULL rather than raising, and
-- `tenant_id = NULL` is NULL, so the row is filtered out. Unset therefore means
-- NO ROWS, not all rows. Fail-closed, and tested.
--
-- ─── THE ROLE HAS NO PASSWORD HERE, DELIBERATELY ──────────────────────────
--
-- Created NOLOGIN. A credential in a migration is a credential in git. The
-- password is set out of band — `npm run db:reports-role` generates one, applies
-- it with ALTER ROLE, and writes it to the gitignored `.env`. Until that runs,
-- the role exists and can do nothing, which is the safe order.

-- ── The role ──────────────────────────────────────────────────────────────

DO $$
BEGIN
  -- Roles are CLUSTER-wide, not per-database, so this is guarded rather than
  -- IF NOT EXISTS (which CREATE ROLE does not support).
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'bmi_reports_ro') THEN
    CREATE ROLE bmi_reports_ro NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
    RAISE NOTICE 'created role bmi_reports_ro (NOLOGIN until a password is set)';
  ELSE
    RAISE NOTICE 'role bmi_reports_ro already exists';
  END IF;
END $$;

-- Explicitly re-asserted even when the role pre-existed: these must never drift.
ALTER ROLE bmi_reports_ro NOSUPERUSER NOCREATEDB NOCREATEROLE;

-- ── Grants: SELECT only, on the reportable tables only ────────────────────

GRANT USAGE ON SCHEMA public TO bmi_reports_ro;

GRANT SELECT ON deals, companies, contacts, leads, activities, pipeline_stages
  TO bmi_reports_ro;

-- users is COLUMN-level. It carries password_hash and token_version, which a
-- reporting role must never be able to read — and a column grant is the only
-- thing that actually prevents it. The report builder projects exactly these
-- four columns for its `users` source, so a SELECT * never arises.
GRANT SELECT (id, first_name, last_name, tenant_id) ON users TO bmi_reports_ro;

-- No INSERT, UPDATE, DELETE or TRUNCATE anywhere, and no grants on any other
-- table. A report cannot write, and cannot read quotas, documents, meetings,
-- module_links, service credentials or anything else not listed above.

-- ── Row-level security ────────────────────────────────────────────────────

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['deals','companies','contacts','leads','activities','pipeline_stages','users']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    -- NOT "FORCE": the owner must keep bypassing, so the application is
    -- untouched. See the header.
    EXECUTE format('DROP POLICY IF EXISTS reports_ro_tenant_isolation ON %I', t);
    EXECUTE format($f$
      CREATE POLICY reports_ro_tenant_isolation ON %I
        FOR SELECT
        TO bmi_reports_ro
        USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
    $f$, t);
  END LOOP;
END $$;

-- Verify with:
--   SELECT tablename, rowsecurity, forcerowsecurity FROM pg_tables
--    WHERE tablename IN ('deals','companies','contacts','leads','activities','pipeline_stages','users');
--   SELECT tablename, policyname, roles, cmd, qual FROM pg_policies
--    WHERE policyname = 'reports_ro_tenant_isolation' ORDER BY tablename;
--   SELECT grantee, table_name, privilege_type FROM information_schema.table_privileges
--    WHERE grantee = 'bmi_reports_ro' ORDER BY table_name;
