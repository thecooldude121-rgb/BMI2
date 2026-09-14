-- Migration 046: give a calling module a stable handle on the contact it created,
-- so a retried create is recognised instead of refused.
--
-- WHY
-- Lead Gen converts a qualified prospect by POSTing /api/v1/contacts with
-- source 'lead-gen'. If that call succeeds here but the response never reaches
-- Lead Gen (timeout, network blip, restart), Lead Gen retries the same
-- conversion. Today nothing on this side can tell "the same prospect, again"
-- from "a second prospect": there is no identifier in the request that belongs
-- to the CALLER's world, only ones this database generates.
--
-- WHAT ACTUALLY HAPPENS ON A RETRY TODAY — worth recording, because the obvious
-- guess is wrong. It does NOT create a duplicate. contacts_tenant_email_key is
-- UNIQUE (tenant_id, email) (migration 010) and contacts.email is NOT NULL, so
-- an identical retry violates it and createContact returns a clean 409
-- ('A contact with that email already exists in this workspace'). The duplicate
-- is already prevented. What is missing is RECOVERY: the 409 carries no contact
-- id, so Lead Gen cannot learn which contact its first attempt created, and the
-- conversion stays stuck as failed forever while the contact exists here. The
-- retry is unrecoverable rather than destructive.
--
-- A duplicate IS reachable, just not by the identical-payload path: if the
-- prospect's email is corrected between the first attempt and the retry, the
-- email constraint no longer matches and a second contact for one prospect is
-- created. external_ref closes that hole too, because it does not depend on any
-- field a user can edit.
--
-- WHY (tenant_id, source, external_ref) AND NOT (tenant_id, external_ref)
-- external_ref is only ever unique WITHIN the system that issued it. Lead Gen's
-- prospect 4821 and some future module's record 4821 are unrelated things that
-- happen to share an integer. Keying on (tenant_id, external_ref) would make the
-- second module's first import collide with Lead Gen's contacts and hand back
-- the wrong contact — the same shape of bug as createTag's ON CONFLICT (name)
-- in migration 010, where the conflict target was one column too narrow and a
-- lookup returned another tenant's row. source is what names the issuing system,
-- so source belongs in the key. tenant_id is there for the reason every unique
-- constraint in this schema carries it: two workspaces must never be able to
-- collide, and a violation must never disclose that another workspace holds a
-- value.
--
-- WHY source IS NOT NULL IS ENFORCED
-- In a unique index NULLs are distinct, so a row with source NULL and
-- external_ref set would be indexed but could never conflict with anything —
-- an external_ref that silently does not dedup, which is worse than none at all
-- because the caller believes it is protected. The CHECK makes that row
-- unrepresentable, at the layer that is the authority rather than in the
-- controller that can be bypassed by the importer or by hand-written SQL.
--
-- ADDITIVE ONLY. The column is nullable and every existing row gets NULL:
-- contacts created in the UI, by the CSV importer, or before this migration
-- have no external identity and are not supposed to acquire one. No backfill,
-- no row rewritten, and both new constraints are satisfied by every existing
-- row (external_ref IS NULL passes each).
--
-- Verify with:
--   SELECT pg_get_constraintdef(oid) FROM pg_constraint
--    WHERE conrelid = 'contacts'::regclass AND conname = 'contacts_external_ref_source_check';
--   SELECT indexdef FROM pg_indexes
--    WHERE tablename = 'contacts' AND indexname = 'contacts_tenant_source_external_ref_key';

-- The issuing system's own id for this record, stored verbatim as text. NOT
-- parsed, NOT cast to an integer: it is opaque here, and a module that numbers
-- its records 'PR-0042' or with a UUID must round-trip unchanged. 100 chars
-- comfortably holds a UUID (36) or a prefixed key without inviting a blob.
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS external_ref VARCHAR(100);

ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_external_ref_source_check;
ALTER TABLE contacts ADD CONSTRAINT contacts_external_ref_source_check
  CHECK (external_ref IS NULL OR source IS NOT NULL);

-- PARTIAL, on external_ref IS NOT NULL. A plain unique index would also be
-- correct — NULLs do not conflict — but it would carry an entry for every
-- contact in the CRM to constrain the small minority that arrive from another
-- module. The predicate keeps the index to rows that actually claim an external
-- identity. Matches idx_contacts_owner and idx_contacts_buying_role, which are
-- partial for the same reason.
--
-- NOTE for the ON CONFLICT in createContact: inferring a PARTIAL index requires
-- repeating this predicate in the statement
-- (ON CONFLICT (tenant_id, source, external_ref) WHERE external_ref IS NOT NULL).
-- Without it Postgres cannot match the index and raises 42P10.
CREATE UNIQUE INDEX IF NOT EXISTS contacts_tenant_source_external_ref_key
  ON contacts (tenant_id, source, external_ref)
  WHERE external_ref IS NOT NULL;
