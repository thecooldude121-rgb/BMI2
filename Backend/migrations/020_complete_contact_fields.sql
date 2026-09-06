-- Migration 020: give the contact form somewhere to put what it collects.
--
-- The contact form (pages/CRM/AddEditContactPage.tsx) collects 22 fields.
-- `contacts` has columns for 11 of them. The other 11 — postal address,
-- timezone, source, status, tags, notes and owner — were accepted by the form,
-- shown back to the user, and discarded. That is the quiet half of the problem
-- Phase 0 set out to fix: a save that reports success while dropping most of
-- what was typed is still a false confirmation.
--
-- Additive only. Every column is nullable or defaulted, so existing rows and
-- the existing controller keep working untouched.

-- ── Postal address ──────────────────────────────────────────────────────────
-- Kept as discrete columns rather than one text blob: the form already has
-- separate inputs, and city/country are the two fields anything would filter or
-- group by later. Widths match the equivalent columns on `companies`.
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS street      VARCHAR(200);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS city        VARCHAR(100);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS state       VARCHAR(100);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS country     VARCHAR(100);

-- An IANA-style zone name ("America/Los_Angeles") is the only thing worth
-- storing here. The form currently offers display labels ("Pacific Time (PT)");
-- the frontend maps label -> zone so the stored value stays machine-usable.
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS timezone VARCHAR(60);

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS notes TEXT;

-- ── Tags ────────────────────────────────────────────────────────────────────
-- text[], NOT delimited text. `leads.tags` was created as a semicolon-delimited
-- text column while the frontend did Array.isArray(row.tags), so lead tags were
-- never once visible to a user (fixed in migration 012). Same frontend code
-- reads contact tags. Do not repeat it.
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

-- ── Vocabularies ────────────────────────────────────────────────────────────
-- These CHECK constraints are the AUTHORITY for both vocabularies. Phase 2's
-- rule, learned by getting activities and leads.status wrong from prose: read
-- pg_constraint, never a comment or a TypeScript union.
--
-- The values are the hyphenated spellings the frontend has used for source
-- since it was written ('lead-gen', 'hrms', …) — types/contact.ts,
-- types/accounts.ts and types/deals.ts all agree on them across ~170 sites.
-- Storing a second, snake_case spelling of the same concept would mean a
-- mapping layer and two vocabularies to keep in step, so store theirs verbatim.
-- 'converted' and 'event' are new here; the form offered them with nowhere to
-- put them.
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS source VARCHAR(30);
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_source_check;
ALTER TABLE contacts ADD CONSTRAINT contacts_source_check
  CHECK (source IS NULL OR source IN
    ('lead-gen', 'hrms', 'converted', 'manual', 'website', 'referral', 'event'));

-- 'do-not-contact' is a suppression flag, not a synonym for inactive: inactive
-- means "not worth calling", do-not-contact means "must not be called". Any
-- outbound feature added later has to be able to tell them apart.
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active';
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_status_check;
ALTER TABLE contacts ADD CONSTRAINT contacts_status_check
  CHECK (status IN ('active', 'inactive', 'do-not-contact'));

-- ── Owner ───────────────────────────────────────────────────────────────────
-- A real FK to users(id), NOT a display name. leads.assigned_to, deals,
-- tasks and activities all hold display-name text, which means renaming a user
-- orphans their records — a known outstanding defect. A new column has no bad
-- data to migrate, so it starts correct instead of joining the problem.
-- ON DELETE SET NULL: deleting a user must not delete their contacts.
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS owner_id INTEGER
  REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_owner ON contacts (tenant_id, owner_id)
  WHERE owner_id IS NOT NULL;

-- Deliberately NOT added: reports_to. The form renders it as a free-text
-- "Search for manager..." box, and the correct column is a self-referencing FK
-- to contacts(id) driven by a contact picker. Adding the column without the
-- picker would create dead schema; the field is marked unavailable in the UI
-- until the picker exists.
