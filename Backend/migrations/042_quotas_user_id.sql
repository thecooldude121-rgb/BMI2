-- 042: quotas key on a user, not a display name.
--
-- SEPARATE FROM 041 ON PURPOSE. 041 added `users.manager_id` and broke nothing:
-- it had no consumer. This one CHANGES AN API CONTRACT — `GET /quotas` and
-- `PUT /quotas` both spoke `rep_name`, and ForecastPage both reads and writes
-- through them — so it ships as one unit with the frontend and must be
-- revertible on its own. Same reasoning that kept 039 and 040 apart.
--
-- WHY NOT THE ADDITIVE DUAL-WRITE DANCE THAT 039 USED
-- Because there is nothing to protect. Measured immediately before writing this,
-- in both databases:
--
--     quotas rows                    0
--     distinct rep_name values       0
--     resolving to a real user       0
--     unresolvable                   0
--     forecast_quotas rows           0
--
-- 039 was additive and left `deals.assigned_to` in place because 20 of 25 real
-- deals carried a name that could not be resolved, and $1.39M of live pipeline
-- hung off them. NONE of that applies here: the table is empty, so there is no
-- backfill, no resolution backlog, and no unmigrated row to keep readable.
--
-- Carrying `rep_name` forward "to be safe" would deliberately reintroduce the
-- exact defect 039 exists to remove — a name-keyed owner, which is what made
-- per-rep reporting impossible in the first place. So `user_id` goes in NOT
-- NULL and `rep_name` is dropped in the same statement block. The cost is the
-- API contract, and that cost is paid in the same commit rather than deferred.
--
-- TENANT SCOPING, BOTH HALVES, as every FK in this codebase requires:
--   * users.id is a GLOBAL primary key, so this FK is satisfied by a user in
--     another workspace — referential integrity holds, tenant isolation does
--     not. WRITES validate through utils/tenantScope.ts (`users` is already a
--     ScopedTable), rejecting with a 400 that names the field and never
--     discloses that the row exists elsewhere.
--   * READS join with `AND u.tenant_id = q.tenant_id`, so a bad reference that
--     somehow already exists cannot be read back through the join either.
--
-- ON DELETE CASCADE, and this is the one place it is right rather than
-- SET NULL. `user_id` is NOT NULL, so SET NULL is not available; RESTRICT would
-- block deleting a user until someone hunted down their quota rows. A quota is
-- meaningless without the person it was set for — unlike a deal, which outlives
-- its owner and reverts to unowned in 039. So the quota goes with the user.

-- ── 1. The new key ──────────────────────────────────────────────────────────
-- Added nullable first, then set NOT NULL. On an empty table the two-step is
-- equivalent to declaring it NOT NULL outright, and it stays correct if this
-- migration is ever applied to a copy that somehow has rows: the ALTER would
-- fail loudly at step 3 rather than silently rejecting the ADD COLUMN.
ALTER TABLE quotas ADD COLUMN IF NOT EXISTS user_id INTEGER;

ALTER TABLE quotas
  DROP CONSTRAINT IF EXISTS quotas_user_id_fkey;
ALTER TABLE quotas
  ADD CONSTRAINT quotas_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ── 2. Nothing to backfill ──────────────────────────────────────────────────
-- Deliberately no UPDATE here. If a copy of this database DOES hold rows, the
-- NOT NULL below fails and that is the correct outcome: resolving names to ids
-- is a decision (see the "John Smith" case in 039, where 15 rows named someone
-- who was never a user), not something a migration should guess at silently.

-- ── 3. Enforce it ───────────────────────────────────────────────────────────
ALTER TABLE quotas ALTER COLUMN user_id SET NOT NULL;

-- ── 4. Re-key the uniqueness ────────────────────────────────────────────────
-- One quota per person per period. The old key was
-- UNIQUE (tenant_id, rep_name, period_label), which meant two users sharing a
-- display name shared a quota row — the same class of collision that made
-- name-keyed ownership unworkable.
ALTER TABLE quotas DROP CONSTRAINT IF EXISTS quotas_tenant_rep_period_key;
ALTER TABLE quotas DROP CONSTRAINT IF EXISTS quotas_tenant_user_period_key;
ALTER TABLE quotas
  ADD CONSTRAINT quotas_tenant_user_period_key
  UNIQUE (tenant_id, user_id, period_label);

-- ── 5. Drop the name ────────────────────────────────────────────────────────
ALTER TABLE quotas DROP COLUMN IF EXISTS rep_name;

COMMENT ON COLUMN quotas.user_id IS
  'The person this quota belongs to. NOT NULL: a quota without an owner is meaningless. Replaced a free-text rep_name in migration 042; the API still returns a rep_name field, projected from the joined user.';

-- Per-period lookups are what GET /quotas does, always tenant-first.
CREATE INDEX IF NOT EXISTS quotas_tenant_period_idx
  ON quotas (tenant_id, period_label);

-- ── WHAT THE API STILL RETURNS ──────────────────────────────────────────────
-- `GET /quotas` continues to send a `rep_name` field, projected from the joined
-- user rather than stored — the same play as `ps.slug AS stage` (037/038) and
-- `assigned_to` (039). The response shape a client sees does not change even
-- though the column is gone.
--
-- `PUT /quotas` DOES change: it now takes `user_id` instead of `rep_name`, and
-- that is a real breaking change rather than one papered over. Accepting a name
-- and resolving it server-side was considered and rejected here, unlike in 039:
-- there, several forms could only submit a name and resolving centrally
-- unblocked all of them at once. Here there is exactly ONE writer
-- (ForecastPage's quota input), it has the user id in hand, and the whole point
-- of this migration is to stop names being identity. Accepting one would keep
-- the door open for the next caller to reintroduce the problem.
--
-- forecast_snapshots.rep_name is deliberately UNTOUCHED and is now inconsistent
-- with this table. That is migration 043's job, bundled with dropping the dead
-- forecast_quotas table — a different rationale, so a different migration.
