-- Migration 049: constrain meetings.related_to_type, and give the table the
-- columns a meeting-notes module actually needs.
--
-- WHY 049 AND NOT 047. `047_module_links.sql` and `048_module_link_setup_codes.sql`
-- exist on the unmerged branch `feature/lead-gen-account-intelligence` and are
-- already applied to live `bmi_crm`. Taking 047 would put two different
-- migrations under one filename — the ledger keys on filename, so the second to
-- be applied anywhere would either be skipped as "already applied" or fail the
-- checksum lock (lesson 14). A GAP in the sequence is harmless; a duplicate
-- number is not.
--
-- ─── THE POLYMORPHIC REFERENCE, FOR THE THIRD TIME ────────────────────────
--
-- `related_to_type` / `related_to_id` is an unconstrained free-text pair. The
-- same shape has now been flagged three times: `tasks` (handled in the
-- controller by VALID_RELATED_TYPES + RELATED_TABLE), `documents.module` /
-- `record_id` (still open), and here.
--
-- WHAT THIS MIGRATION CAN AND CANNOT DO, stated plainly because the halves are
-- easy to confuse:
--
--   IT CAN constrain the TYPE. A CHECK restricts related_to_type to the four
--   types that name a real, tenant-scoped table in this CRM, so a typo or a
--   stale value is refused by the database rather than stored and rendered.
--
--   IT CANNOT constrain the ID with a foreign key. A polymorphic column cannot
--   carry an FK — the target table varies per row — and even if it could, every
--   FK in this schema references a GLOBAL primary key, so Postgres would
--   happily accept a meeting in workspace A pointing at workspace B's deal.
--   That half is enforced in the controller with `foreignIdsInTenant`, exactly
--   as tasksController does, and it is the half that matters for tenant
--   isolation. Both halves are needed: this one stops a nonsense type, that one
--   stops a cross-workspace reference.
--
-- WHY 'employee' IS NOT IN THE LIST, unlike tasks. `employees` has no
-- `tenant_id` at all and belongs to HRMS (see CLAUDE.md). tasksController
-- tolerates the value because rows already exist with it and nothing joins the
-- table; a new module must not inherit that. A meeting about an employee is an
-- HRMS meeting.
--
-- ADDITIVE AND IDEMPOTENT. `meetings` has 0 rows in both databases, verified
-- immediately before writing this, so the CHECK cannot fail on existing data —
-- and it is written to tolerate NULL regardless, because a meeting that has not
-- been pushed to a deal or account yet has no relation at all.

-- ── The type vocabulary ───────────────────────────────────────────────────

ALTER TABLE meetings DROP CONSTRAINT IF EXISTS meetings_related_to_type_check;
ALTER TABLE meetings ADD CONSTRAINT meetings_related_to_type_check
  CHECK (related_to_type IS NULL
         OR related_to_type IN ('deal', 'company', 'contact', 'lead'));

-- Both or neither. A type with no id points at nothing; an id with no type
-- cannot be resolved to a table, which is precisely how `documents.record_id`
-- ended up unresolvable.
ALTER TABLE meetings DROP CONSTRAINT IF EXISTS meetings_related_to_pair_check;
ALTER TABLE meetings ADD CONSTRAINT meetings_related_to_pair_check
  CHECK ((related_to_type IS NULL AND related_to_id IS NULL)
         OR (related_to_type IS NOT NULL AND related_to_id IS NOT NULL));

-- ── Columns the notes module needs ────────────────────────────────────────

-- The note itself. `summary` already exists but is a one-line abstract in every
-- other reader of this table; notes are the body and want their own column so
-- one does not quietly become the other.
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS notes TEXT;

-- Who wrote it, as a REAL user reference — not a display name. `activities`
-- records its actor as free-text `created_by`/`assigned_to` and is therefore
-- unattributable (see the activity-measurement gap in CLAUDE.md); this column
-- exists so meetings do not repeat that mistake. Tenant consistency comes from
-- the COMPOSITE reference, the same shape `user_sales_profiles` uses.
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS owner_id INTEGER;

ALTER TABLE meetings DROP CONSTRAINT IF EXISTS meetings_owner_fkey;
ALTER TABLE meetings ADD CONSTRAINT meetings_owner_fkey
  FOREIGN KEY (owner_id, tenant_id) REFERENCES users (id, tenant_id) ON DELETE SET NULL;

-- ON DELETE SET NULL, not CASCADE: a meeting is a record of something that
-- happened and must outlive the person who logged it — the same call made for
-- `forecast_snapshots.user_id`, and the opposite of `quotas.user_id`, which
-- CASCADEs because a quota without its person is meaningless.

ALTER TABLE meetings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ── meetings.id HAD NO DEFAULT, so a meeting could not be created at all ──
--
-- `id` is varchar(10) NOT NULL with NO column default, so every INSERT had to
-- supply one. Nothing ever did: there is no meetings controller in main, and the
-- only reader was a fabricated frontend fixture, so the gap had never been
-- exercised. Found by the first create test returning a masked 500.
--
-- Fixed the way migration 031 fixed the same problem for companies, contacts,
-- deals and tasks: ONE SEQUENCE PER TABLE, wired as the column DEFAULT, so the
-- id is generated inside the INSERT. That is deliberately not the app-side
-- `SELECT MAX(id) + 1` this project removed — nextval() is atomic, so the
-- read-then-write race does not exist rather than being narrower.
--
-- 'MTG' + 3 digits = 6 characters, comfortably inside varchar(10). Human
-- readable on purpose, like every other id here. Sequences are not gap-free and
-- that is accepted.
CREATE SEQUENCE IF NOT EXISTS meetings_id_seq;
SELECT setval(
  'meetings_id_seq',
  COALESCE((SELECT MAX(CAST(SUBSTRING(id, 4) AS INTEGER)) FROM meetings
             WHERE id ~ '^MTG[0-9]+$'), 0) + 1,
  false);
ALTER TABLE meetings
  ALTER COLUMN id SET DEFAULT 'MTG' || LPAD(nextval('meetings_id_seq')::text, 3, '0');

-- `date` is NOT NULL with no default either. The controller sends NOW() when a
-- caller omits it; a default here means a direct INSERT cannot fail on it.
ALTER TABLE meetings ALTER COLUMN date SET DEFAULT NOW();

-- ── Indexes ───────────────────────────────────────────────────────────────

-- The list query: this workspace's meetings, newest first.
CREATE INDEX IF NOT EXISTS idx_meetings_tenant_date
  ON meetings (tenant_id, date DESC);

-- The deal/account panel: "meetings about this record". PARTIAL, because a
-- meeting with no relation is never fetched this way — same reasoning as
-- idx_contacts_buying_role.
CREATE INDEX IF NOT EXISTS idx_meetings_related
  ON meetings (tenant_id, related_to_type, related_to_id)
  WHERE related_to_type IS NOT NULL;

-- Verify with:
--   SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
--    WHERE conrelid = 'meetings'::regclass AND contype IN ('c','f');
--   SELECT indexname FROM pg_indexes WHERE tablename = 'meetings';
