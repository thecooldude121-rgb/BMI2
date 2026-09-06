-- Migration 029: allow 'import' as a contacts.source value.
--
-- WHY
-- CSV import needs to record how a contact entered the CRM, and the vocabulary
-- from 020 has no value meaning "loaded in bulk from a file". The two
-- alternatives were both worse:
--   - Coercing an imported row to 'manual' asserts a provenance that is false.
--     'manual' means a person typed this contact into the form.
--   - Leaving source NULL discards the information permanently. A manager
--     migrating off Salesforce cannot afterwards ask which contacts arrived in
--     the migration; the answer is not recoverable from any other column.
--
-- WIDENING, NOT REPLACING
-- Unlike 028, this ADDS a value and removes none, so no existing row can be
-- invalidated. Verified before writing:
--   SELECT source, count(*) FROM contacts GROUP BY source;  -- 20 rows, all NULL
-- The column is entirely unused today, so this is as cheap as it will ever be.
--
-- 'import' IS PROVENANCE THE SYSTEM WRITES, NOT A VALUE A USER PICKS.
-- The Add Contact form's source dropdown deliberately omits it
-- (SELECTABLE_SOURCES in AddEditContactPage.tsx), for the same reason this
-- migration exists at all: a hand-keyed contact must not be able to claim it
-- arrived via bulk import. SOURCE_LABELS still carries a label for it, because
-- an imported contact has to render correctly in the list and detail views.
--
-- THE VOCABULARY LIVES IN FOUR PLACES AND THEY MOVE TOGETHER:
--   1. this constraint                                       (the authority)
--   2. SOURCES  in Backend/src/controllers/contactsController.ts
--   3. ContactSource in Frontend/src/types/contact.ts
--   4. SOURCES  in Frontend/src/utils/contactsApi.ts
-- A fifth is enforced by the compiler rather than by grep: SOURCE_LABELS in
-- AddEditContactPage.tsx is a Record<ContactSource, string>, so widening the
-- union fails the build until a label exists.
--
-- Verify with:
--   SELECT pg_get_constraintdef(oid) FROM pg_constraint
--    WHERE conrelid = 'contacts'::regclass AND conname = 'contacts_source_check';

ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_source_check;

ALTER TABLE contacts ADD CONSTRAINT contacts_source_check
  CHECK (source IS NULL OR source IN (
    'lead-gen',
    'hrms',
    'converted',
    'manual',
    'website',
    'referral',
    'event',
    'import'
  ));
