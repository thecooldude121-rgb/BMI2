-- 041: users gain a manager, so the CRM has a reporting line of its own.
--
-- WHY THIS COLUMN HAS TO BE NEW
-- Two `manager_id` columns already exist and NEITHER can be used:
--
--     table        | manager_id | tenant_id | rows | why not
--     -------------+------------+-----------+------+---------------------------
--     employees    | varchar    | ABSENT    |  15  | HRMS-owned; CLAUDE.md says
--                  |            |           |      | do not JOIN this table
--     territories  | varchar    | ABSENT    |   0  | no tenant column, no data,
--                  |            |           |      | different concept entirely
--
-- Both lack `tenant_id` outright, so neither can be workspace-scoped — the same
-- structural defect CLAUDE.md already records against `employees`. Borrowing
-- either would import that defect into the CRM rather than fixing anything, and
-- HRMS is a separate platform reached over SSO (see "Identity & SSO"), so an
-- employee reference is not a CRM reporting line in the first place.
--
-- `users` itself had NO manager-ish column at all — verified against
-- information_schema, all 14 columns: id, email, password_hash, first_name,
-- last_name, role, department, avatar_url, is_active, created_at, updated_at,
-- tenant_id, last_login_at, token_version.
--
-- WHY SELF-REFERENCING RATHER THAN A JOIN TABLE
-- A rep has exactly one manager, so a `reporting_lines` table would buy nothing
-- but a second place to forget the tenant predicate. If dotted-line reporting is
-- ever wanted that is a genuinely different shape and a separate decision — not
-- something to pre-build for.
--
-- NULLABLE, AND EVERY ROW STARTS NULL
-- There is no manager data anywhere that is both tenant-scoped and about CRM
-- users, so there is NOTHING TO BACKFILL. All five users begin with a NULL
-- manager and a UI has to set it. "No manager recorded" is also a real state
-- permanently: the top of the reporting line has no one above them.
--
-- ON DELETE SET NULL, not CASCADE or RESTRICT: deleting a manager must not
-- delete the people who reported to them, and must not be blocked by them
-- either. Their reports become unmanaged, which is recoverable.
--
-- TWO INVARIANTS POSTGRES CANNOT EXPRESS HERE, both enforced in the application
-- and both stated so the next reader does not assume the constraint covers them:
--
--   1. SAME WORKSPACE. users.id is a GLOBAL primary key with no tenant
--      component, so this FK is satisfied by a manager in another workspace —
--      referential integrity holds, tenant isolation does not. A CHECK cannot
--      express it (it needs a subquery). Writes validate through
--      utils/tenantScope.ts, and every read joins with
--      `AND m.tenant_id = u.tenant_id`. Both halves are required, exactly as
--      migration 039 records: the write creates the bad row, the join leaks it.
--
--   2. NO CYCLES. A -> B -> A would hang any recursive rollup over the
--      reporting line. Also not expressible declaratively. `wouldCreateCycle`
--      in utils/reportingLine.ts walks upward before the write and refuses.
--      The self-reference case (A -> A) IS expressible, so it is a CHECK below
--      — cheap, and it catches the most likely mistake.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS manager_id INTEGER
  REFERENCES users(id) ON DELETE SET NULL;

-- The one part of invariant 2 a constraint can carry. A manager who is their
-- own manager is a zero-length cycle and the easiest one to create by accident
-- from a picker that lists every colleague.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_manager_not_self_check;
ALTER TABLE users ADD CONSTRAINT users_manager_not_self_check
  CHECK (manager_id IS NULL OR manager_id <> id);

COMMENT ON COLUMN users.manager_id IS
  'Reporting line within this CRM. Nullable: the top of the line has no manager, and an unset manager is a real state. Same-workspace and no-cycle are enforced in the application (utils/reportingLine.ts) because neither is expressible as a CHECK. See migration 041.';

-- "Who reports to this person" is the query the Direct Reports section runs, and
-- it always filters by workspace first.
CREATE INDEX IF NOT EXISTS users_tenant_manager_idx
  ON users (tenant_id, manager_id);
