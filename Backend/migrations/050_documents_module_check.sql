-- Migration 050: constrain documents.module / record_id at the DATABASE.
--
-- THE LAST OF THE POLYMORPHIC REFERENCES. Three tables carried an
-- unconstrained `type` + `id` pair with nothing enforcing either half:
--
--   tasks     related_to_type / related_to_id  — controller-enforced
--                                                (VALID_RELATED_TYPES +
--                                                RELATED_TABLE)
--   meetings  related_to_type / related_to_id  — fixed in 049, both layers
--   documents module / record_id               — THIS ONE
--
-- WHY 050 AND NOT 047. 047 and 048 exist on the unmerged branch
-- `feature/lead-gen-account-intelligence` and are already applied to live
-- `bmi_crm`; 049 is the meetings migration. The ledger keys on FILENAME, so two
-- different migrations sharing a number is the one mistake that cannot be
-- unwound cleanly (lesson 14). A gap is harmless.
--
-- ─── WHAT WAS ALREADY DONE, AND WHAT WAS NOT ──────────────────────────────
--
-- ALREADY DONE, in `documentsController`, and verified before writing this
-- rather than assumed from the backlog note:
--   * `VALID_MODULES` restricts the type on create, update AND upload;
--   * `MODULE_TABLE` maps every module to a workspace-scoped table
--     (account -> companies, activity -> activities), so it is COMPLETE —
--     unlike tasks, which omits 'employee' deliberately;
--   * `parentRefError` calls `foreignIdsInTenant`, so a record_id from another
--     workspace is refused with a message naming only the field;
--   * module-without-record_id and record_id-without-module are both refused.
--   `roundTrip.documents.test.ts` covers all four.
--
-- NOT DONE, and what this migration adds: NONE OF IT WAS ENFORCED BY POSTGRES.
-- A controller guard binds one writer. The CSV importer, a future endpoint, a
-- migration backfill or a hand-typed UPDATE all bypass it, and this pair has
-- already produced one live defect elsewhere in the codebase (DocumentDetailPage
-- resolved related records from a fixture keyed off three hardcoded document
-- ids, because the columns constrain nothing and so guarantee nothing).
--
-- ─── WHAT A CHECK CAN AND CANNOT DO HERE ──────────────────────────────────
--
--   IT CAN constrain the TYPE, and forbid a half-set pair. Both below.
--
--   IT CANNOT constrain the ID. The target table varies per row, so no foreign
--   key is expressible; and every FK in this schema references a GLOBAL primary
--   key, so even a fixed-target FK would accept workspace A's document pointing
--   at workspace B's deal. That half stays in the controller, where it already
--   is. Both halves are needed and neither substitutes for the other.
--
-- ─── SAFE ON EXISTING DATA, CHECKED NOT ASSUMED ───────────────────────────
--
-- Live `bmi_crm` holds 3 documents: 2 with module 'contact', 1 with 'deal'.
-- Both values are in the list below, no row has a half-set pair, and all three
-- record_ids resolve inside their own tenant (CT014, CT013, D043 — verified by
-- query immediately before writing this). `bmi_crm_iso_test` holds 0.
-- So neither CHECK can fail on data that exists.

-- ── The module vocabulary ─────────────────────────────────────────────────
--
-- Mirrors VALID_MODULES in documentsController. 'account' rather than 'company'
-- because that is what the column and the upload modal have always used; the
-- controller maps it to the `companies` table. Renaming it would be a
-- product-visible change for no gain, and a mismatch between this list and the
-- controller's is exactly what the tests below exist to catch.
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_module_check;
ALTER TABLE documents ADD CONSTRAINT documents_module_check
  CHECK (module IS NULL
         OR module IN ('lead', 'deal', 'contact', 'account', 'activity'));

-- ── Both or neither ───────────────────────────────────────────────────────
--
-- A module with no record_id points at nothing; a record_id with no module
-- cannot be resolved to a table at all. The second is precisely how this pair
-- became unresolvable in the first place — an id with no way to know what it
-- identifies is not a reference, it is a string.
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_module_record_pair_check;
ALTER TABLE documents ADD CONSTRAINT documents_module_record_pair_check
  CHECK ((module IS NULL AND record_id IS NULL)
         OR (module IS NOT NULL AND record_id IS NOT NULL));

-- ── Index for the "documents on this record" panel ────────────────────────
--
-- PARTIAL: a document with no parent is never fetched this way, so it does not
-- belong in the index. Same reasoning as idx_meetings_related (049) and
-- idx_contacts_buying_role.
CREATE INDEX IF NOT EXISTS idx_documents_module_record
  ON documents (tenant_id, module, record_id)
  WHERE module IS NOT NULL;

-- Verify with:
--   SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
--    WHERE conrelid = 'documents'::regclass AND contype = 'c';
--   SELECT indexname FROM pg_indexes WHERE tablename = 'documents';
