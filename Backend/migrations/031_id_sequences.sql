-- Migration 031: replace app-side MAX(id)+1 with per-table sequences.
--
-- WHY — this was not a theoretical race. Measured against the running app
-- before this migration, with N concurrent POSTs to the same create endpoint:
--
--   N=2  (one double-click)      5 of 10 trials lost a write
--   N=3  (two or three users)   10 of 10 trials lost a write
--   N=5                         30 of 50 writes lost
--   N=10                        companies/deals/tasks created only 3 of 10
--
-- Every lost write surfaced as an unhandled 23505 on the primary key, which
-- errorHandler masks as "500 Internal Server Error". Node yields to the event
-- loop at every await, so two requests interleave between
--   SELECT MAX(CAST(SUBSTRING(id, n) AS INTEGER))
-- and the INSERT that uses its result; both compute the same id and the second
-- one collides. None of the four form-create paths was even inside a
-- transaction, so there was nothing to serialise them.
--
-- The worst case was CSV import, which CLAUDE.md calls the real migration path
-- from Salesforce/HubSpot: an import racing a single form create reported
-- created=4 failed=1, so a customer was told one row of their file was bad
-- when the actual cause was an id collision.
--
-- WHAT — one sequence per table, seeded past the current maximum, wired as the
-- column DEFAULT so the id is generated inside the INSERT itself. nextval() is
-- atomic and never returns the same value twice, so the read-then-write window
-- disappears entirely rather than being narrowed.
--
-- setval(..., is_called => false) makes the NEXT nextval() return exactly the
-- value given, which is why this is COALESCE(max, 0) + 1 rather than max.
-- Passing max directly with the default is_called => true would work for a
-- populated table but fails on an empty one, where setval(seq, 0) is out of
-- bounds for a sequence whose MINVALUE is 1.
--
-- FORMAT IS PRESERVED, deliberately. Ids stay C001 / CT001 / D001 / T001:
-- they are user-visible and referenced by hand (HANDOFF.md names deal D053),
-- and varchar(10) holds the prefix plus nine digits. LPAD stops padding past
-- 999 and yields C1000, exactly as the old padStart(3, '0') did.
--
-- SCOPE — this closes the RACE only. The id still reveals a global row count
-- (C042 means 42 companies exist across all workspaces), because a sequence is
-- shared and monotonic. That enumeration leak is a separate, lower-severity
-- item and is deliberately NOT addressed here; see CLAUDE.md. Only random or
-- UUID ids would close both, at the cost of every existing human-readable id
-- and a rewrite of 10 FK columns across 6 tables.
--
-- Sequences are not gap-free, and that is accepted: a rolled-back INSERT still
-- consumes its number, so a failed create or a CSV dry run (which ROLLBACKs by
-- design) leaves a hole. nextval() is non-transactional on purpose — that is
-- what makes it safe under concurrency. Ids are identifiers, not a count.
--
-- NOT scoped by tenant, and this remains load-bearing: all four id columns are
-- GLOBAL primary keys, so a per-workspace sequence would regenerate C001 in a
-- second workspace and every insert would collide. One sequence per table,
-- shared across workspaces, is correct.

-- contacts: 'CT' + 3 digits, numeric part starts at character 3.
CREATE SEQUENCE IF NOT EXISTS contacts_id_seq;
SELECT setval(
  'contacts_id_seq',
  COALESCE((SELECT MAX(CAST(SUBSTRING(id, 3) AS INTEGER)) FROM contacts WHERE id ~ '^CT[0-9]+$'), 0) + 1,
  false
);
ALTER TABLE contacts
  ALTER COLUMN id SET DEFAULT 'CT' || LPAD(nextval('contacts_id_seq')::text, 3, '0');

-- companies: 'C' + 3 digits. The regex excludes CT001 because 'T' is not a digit.
CREATE SEQUENCE IF NOT EXISTS companies_id_seq;
SELECT setval(
  'companies_id_seq',
  COALESCE((SELECT MAX(CAST(SUBSTRING(id, 2) AS INTEGER)) FROM companies WHERE id ~ '^C[0-9]+$'), 0) + 1,
  false
);
ALTER TABLE companies
  ALTER COLUMN id SET DEFAULT 'C' || LPAD(nextval('companies_id_seq')::text, 3, '0');

-- deals: 'D' + 3 digits.
CREATE SEQUENCE IF NOT EXISTS deals_id_seq;
SELECT setval(
  'deals_id_seq',
  COALESCE((SELECT MAX(CAST(SUBSTRING(id, 2) AS INTEGER)) FROM deals WHERE id ~ '^D[0-9]+$'), 0) + 1,
  false
);
ALTER TABLE deals
  ALTER COLUMN id SET DEFAULT 'D' || LPAD(nextval('deals_id_seq')::text, 3, '0');

-- tasks: 'T' + 3 digits.
CREATE SEQUENCE IF NOT EXISTS tasks_id_seq;
SELECT setval(
  'tasks_id_seq',
  COALESCE((SELECT MAX(CAST(SUBSTRING(id, 2) AS INTEGER)) FROM tasks WHERE id ~ '^T[0-9]+$'), 0) + 1,
  false
);
ALTER TABLE tasks
  ALTER COLUMN id SET DEFAULT 'T' || LPAD(nextval('tasks_id_seq')::text, 3, '0');
