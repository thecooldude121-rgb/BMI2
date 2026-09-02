-- Migration 030: let a task be related to a contact or a company.
--
-- WHY
-- Phase-1 item 5 asks for tasks with "optional links to a contact/company/deal".
-- Two of those three were impossible: tasks_related_to_type_check permitted only
-- 'lead', 'deal' and 'employee'. A task could name the deal but not the person
-- it is about, which is the more common case for a follow-up.
--
-- WIDENING, NOT REPLACING. No existing row can be invalidated — verified before
-- writing:
--   SELECT related_to_type, count(*) FROM tasks GROUP BY 1;  -- lead 8, deal 7
-- Nothing is removed, including 'employee' (see below).
--
-- 'employee' IS DELIBERATELY KEPT AND STILL NOT VALIDATED.
-- The `employees` table has no tenant_id column at all, so a related_to_id of
-- that type cannot be workspace-checked. RELATED_TABLE in tasksController omits
-- it on purpose and this migration does not change that. Dropping the value
-- instead would be a narrowing change affecting a vocabulary this migration has
-- no mandate over, and the HRMS boundary question in CLAUDE.md has to be settled
-- first. It remains safe only while nothing JOINs employees.
--
-- WHAT THE NEW VALUES DO GET, which is the point of adding them here rather than
-- only in the UI: 'contact' and 'company' are added to RELATED_TABLE in
-- tasksController, so a related_to_id of either type is proven to belong to the
-- caller's workspace before insert or update — the same check leads and deals
-- already get through utils/tenantScope.ts. Both reference GLOBAL primary keys
-- (contacts.id, companies.id), so without that check a task in workspace A could
-- name a contact in workspace B.
--
-- NOTE tasks has no FK on related_to_id in either direction: the pair is
-- polymorphic, so deleting a contact leaves its tasks pointing at nothing. That
-- pre-existing gap is unchanged by this migration and is recorded in
-- tasksController's header.
--
-- Verify with:
--   SELECT pg_get_constraintdef(oid) FROM pg_constraint
--    WHERE conrelid = 'tasks'::regclass AND conname = 'tasks_related_to_type_check';

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_related_to_type_check;

ALTER TABLE tasks ADD CONSTRAINT tasks_related_to_type_check
  CHECK (related_to_type IS NULL OR related_to_type IN (
    'lead',
    'deal',
    'contact',
    'company',
    'employee'
  ));
