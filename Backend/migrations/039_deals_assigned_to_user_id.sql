-- 039: deal ownership becomes a user reference, alongside the existing name string.
--
-- WHY
-- `deals.assigned_to` is a VARCHAR holding a display name ("John Smith"). That
-- makes per-rep reporting impossible to do reliably: three of the five surfaces
-- audited in the fabricated-data pass need per-owner aggregation and all three
-- were blocked on matching people by name. It also means ownership and audit
-- display share one vocabulary (see utils/actorName.ts), so neither can change
-- without disturbing the other.
--
-- ADDITIVE, NOT A REPLACEMENT. `assigned_to` is deliberately LEFT IN PLACE and
-- is still written. This follows the deals.stage -> stage_id precedent exactly
-- (migrations 037/038): add the id, dual-write and dual-read, migrate the call
-- sites, and only then drop the old column in a separate migration. 037 taught
-- that projecting the old field name from the new source one phase BEFORE the
-- drop is what keeps the API response shape stable on cutover day.
--
-- WHAT IS DELIBERATELY NOT BACKFILLED
-- Only 5 of 25 deals resolve to a real user by exact name match. Measured
-- before writing this:
--
--     assigned_to      | deals | resolves to
--     -----------------+-------+---------------------------
--     'John Smith'     |    15 | NO SUCH USER
--     'Alex Rodriguez' |     5 | users.id = 1
--     NULL             |     5 | no owner recorded
--
-- "John Smith" was confirmed to be seed/demo data for the NAME — the deals
-- themselves are real (is_test = false, created Jan-Apr 2026, $1,103,000
-- combined). So those 15 rows, plus the 5 already-NULL rows created in one
-- batch on 2026-06-01, are left with a NULL owner ON PURPOSE. Twenty real
-- deals with an unresolved owner is the truth; inventing an owner to fill a
-- column would be fabricating data to satisfy a constraint, which is the exact
-- failure this codebase has spent several sessions removing.
--
-- No fuzzy matching, for the same reason: the dominant bucket is not a spelling
-- variant of a real user, it is a person who was never in the table. Fuzzy
-- matching would silently assign $1.1M of pipeline to whoever scored closest.
--
-- WHY NULLABLE, WITH NO SENTINEL
-- 80% of rows cannot be resolved without a product decision, so NOT NULL would
-- force exactly the fabrication described above. "Unassigned" is also a
-- legitimate CRM state — a deal created before routing runs has no owner. A
-- sentinel user is worse than NULL: it appears in pickers, receives
-- notifications, and counts in per-rep aggregates as if it were a person.
-- Revisit NOT NULL only once real assignment flows exist and the backlog above
-- is cleared.
--
-- TENANT SCOPING
-- users.id is a GLOBAL primary key with no tenant component, so Postgres will
-- happily accept a deal in workspace A pointing at a user in workspace B —
-- referential integrity satisfied, tenant isolation not. Both halves of the
-- project rule apply and neither is optional:
--   * WRITES validate the id against the caller's workspace via
--     utils/tenantScope.ts (`users` is already a ScopedTable there), rejecting
--     with a 400 that names the field and never discloses that the row exists
--     elsewhere.
--   * READS join with `AND u.tenant_id = d.tenant_id`, so a bad reference that
--     somehow already exists cannot be read back through the join either.
-- The backfill below carries the same predicate.

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS assigned_to_user_id INTEGER
  REFERENCES users(id) ON DELETE SET NULL;

-- ON DELETE SET NULL rather than CASCADE or RESTRICT: deleting a user must not
-- delete their deals (the pipeline outlives the employee) and must not be
-- blocked by them either. The deal reverts to unowned, which is recoverable.

COMMENT ON COLUMN deals.assigned_to_user_id IS
  'Owning user. Nullable: an unresolved or absent owner is a real state. Reads dual-read with the legacy assigned_to name string; see migration 039.';

-- Backfill ONLY exact, case-insensitive, whitespace-trimmed matches inside the
-- same workspace. Anything ambiguous stays NULL.
UPDATE deals d
   SET assigned_to_user_id = u.id
  FROM users u
 WHERE d.assigned_to_user_id IS NULL
   AND d.assigned_to IS NOT NULL
   AND u.tenant_id = d.tenant_id
   AND lower(btrim(u.first_name || ' ' || u.last_name)) = lower(btrim(d.assigned_to))
   -- Guard against a workspace holding two users with the same display name:
   -- resolving to an arbitrary one of them would be a silent mis-assignment.
   AND (
     SELECT count(*) FROM users u2
      WHERE u2.tenant_id = d.tenant_id
        AND lower(btrim(u2.first_name || ' ' || u2.last_name)) = lower(btrim(d.assigned_to))
   ) = 1;

-- Per-owner reporting is the whole point of the column, and every query that
-- uses it filters by workspace first.
CREATE INDEX IF NOT EXISTS deals_tenant_assigned_user_idx
  ON deals (tenant_id, assigned_to_user_id);
