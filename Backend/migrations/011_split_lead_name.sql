-- Migration 011: give `leads` the first_name / last_name / updated_at columns
-- the application has always assumed, without losing the existing `name` data.
--
-- THE PROBLEM
-- leadsController.ts reads and writes first_name, last_name, owner_id,
-- custom_fields and updated_at. The live table has none of them — it has a
-- single `name` and `assigned_to`. Consequences, all verified against the
-- running API:
--   POST /api/v1/leads              -> 500  column "first_name" does not exist
--   PUT  /api/v1/leads/:id          -> 500  (updated_at, set unconditionally)
--   GET  /api/v1/leads?search=...   -> 500  (searches first_name/last_name)
-- The frontend hid all of it behind `catch { return [] }`, so a 500 rendered as
-- an empty list rather than an error.
--
-- APPROACH — additive and reversible, per the remediation plan's ground rules
-- (never silently drop data; keep the old column marked deprecated until a
-- human confirms it is safe to remove in a later cleanup pass).
--   1. Add first_name / last_name / updated_at.
--   2. Backfill first_name / last_name by splitting `name`.
--   3. Keep `name` — now nullable, and kept in sync by a trigger so existing
--      readers (leadSubController.enrichLead reads lead.name) keep working.
--      first_name / last_name are the source of truth from here on.
--
-- Splitting rule: first whitespace-delimited token is the first name, the
-- remainder is the last name. "Ada Lovelace" -> Ada / Lovelace.
-- "Mary Anne Evans" -> Mary / Anne Evans. A single token -> first name only,
-- last_name NULL (mononyms are real and must not be rejected).
-- At the time of writing all 38 rows are clean two-token names, so no row is
-- ambiguous; the rule is defensive for future data.
--
-- Safe to run more than once: ADD COLUMN uses IF NOT EXISTS, the backfill only
-- touches rows where first_name IS NULL, and the trigger is CREATE OR REPLACE.

-- ── 1. add the columns ──────────────────────────────────────────────────────
ALTER TABLE leads ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_name  VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ── 2. backfill from `name` (only rows not already split) ───────────────────
UPDATE leads
SET
  first_name = split_part(trim(regexp_replace(name, '\s+', ' ', 'g')), ' ', 1),
  last_name  = NULLIF(
    substring(
      trim(regexp_replace(name, '\s+', ' ', 'g'))
      FROM position(' ' IN trim(regexp_replace(name, '\s+', ' ', 'g'))) + 1
    ),
    trim(regexp_replace(name, '\s+', ' ', 'g'))   -- no space present -> NULL
  )
WHERE first_name IS NULL
  AND name IS NOT NULL
  AND trim(name) <> '';

-- Any row still without a first_name had a null/blank name. Give it a value so
-- the NOT NULL below cannot fail, rather than aborting the migration.
UPDATE leads SET first_name = 'Unknown' WHERE first_name IS NULL OR trim(first_name) = '';

-- ── 3. constrain the new source of truth ────────────────────────────────────
-- first_name is required (every person has at least one name part).
-- last_name stays nullable on purpose — see the mononym note above.
ALTER TABLE leads ALTER COLUMN first_name SET NOT NULL;

-- ── 4. keep the deprecated `name` column working ────────────────────────────
-- DEPRECATED: leads.name is retained only so existing readers do not break.
-- Write first_name / last_name; `name` is maintained by the trigger below.
-- Drop it in a later cleanup once nothing reads it (grep for `lead.name` and
-- `row.name` first — leadSubController.enrichLead still does).
ALTER TABLE leads ALTER COLUMN name DROP NOT NULL;

CREATE OR REPLACE FUNCTION leads_sync_display_name() RETURNS trigger AS $$
BEGIN
  -- Only recompute when the split fields carry a value, so a legacy writer that
  -- still sets `name` alone does not get it blanked out.
  IF NEW.first_name IS NOT NULL OR NEW.last_name IS NOT NULL THEN
    NEW.name := NULLIF(
      trim(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '')),
      ''
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_leads_sync_display_name ON leads;
CREATE TRIGGER trg_leads_sync_display_name
  BEFORE INSERT OR UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION leads_sync_display_name();

-- ── 5. index the new search columns ─────────────────────────────────────────
-- GET /leads?search= filters on these with ILIKE.
CREATE INDEX IF NOT EXISTS idx_leads_first_name ON leads (lower(first_name));
CREATE INDEX IF NOT EXISTS idx_leads_last_name  ON leads (lower(last_name));
