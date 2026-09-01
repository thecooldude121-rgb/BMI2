-- Migration 028: align contacts.buying_role with the frontend role vocabulary.
--
-- WHY THIS EXISTS SEPARATELY FROM 026
-- 026 has been applied, and the runner refuses to start when an applied file's
-- checksum changes (see src/config/runMigrations.ts). Correcting a mistake in
-- an applied migration is done by adding another one, not by editing it.
--
-- WHAT WAS WRONG
-- 026 wrote the CHECK from memory as 'end-user' and 'blocker'. The actual ids
-- in Frontend/src/config/contactRoles.ts — the vocabulary the deal form has
-- been writing into deals.stakeholders for as long as that column has existed
-- — are 'user' and 'blocker-detractor'. Two spellings for one concept is how
-- leads ended up with a `stage` and a `status` holding overlapping lifecycle
-- values, and that cost a migration and a data fix to unpick (025). Fixing it
-- while the column holds ZERO rows costs nothing.
--
-- SAFE BECAUSE THE COLUMN IS EMPTY
-- 026 deliberately performed no backfill, so no row can violate the new
-- constraint. Verified before writing this:
--   SELECT count(*) FROM contacts WHERE buying_role IS NOT NULL;  -- 0
-- The constraint is replaced rather than widened: leaving 'end-user' and
-- 'blocker' permitted would allow a second spelling to be written later.

ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_buying_role_check;

ALTER TABLE contacts ADD CONSTRAINT contacts_buying_role_check
  CHECK (buying_role IS NULL OR buying_role IN (
    'champion',
    'decision-maker',
    'economic-buyer',
    'influencer',
    'technical-evaluator',
    'user',
    'legal-procurement',
    'blocker-detractor'
  ));
