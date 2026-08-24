-- Migration 013: guarantee a tenant exists, so a fresh install can be used.
--
-- THE BUG THIS FIXES
-- authController.register looks up `SELECT id FROM tenants ORDER BY created_at
-- LIMIT 1` and returns 500 "No tenant configured" when there is none. On a
-- brand-new database there is none, so **registration is impossible and the
-- application cannot be bootstrapped at all** — the first user can never be
-- created.
--
-- Migration 008 seeded a default tenant, but 008 is now folded into
-- 000_baseline_schema.sql, which is `pg_dump --schema-only` — structure without
-- rows. So the seed silently disappeared for new installs while continuing to
-- work on the existing database, which already had the row. Only provisioning a
-- genuinely empty database surfaces it.
--
-- Idempotent: inserts only when the table is empty, so existing databases
-- (which already have their tenant, and in this case a second one) are
-- untouched and no duplicate is created.

INSERT INTO tenants (name)
SELECT 'Default Organization'
WHERE NOT EXISTS (SELECT 1 FROM tenants);
