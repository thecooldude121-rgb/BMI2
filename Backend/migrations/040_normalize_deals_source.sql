-- 040: normalize deals.source, and constrain it so the drift cannot recur.
--
-- SEPARATE FROM 039 ON PURPOSE. 039 made deal ownership a user reference: a
-- STRUCTURAL change with a resolution backlog attached (20 of 25 deals still
-- have no owner id). This is a VOCABULARY change with its own decision about
-- constraining future writes. Bundling them would mean one migration that
-- cannot be reverted independently and a recorded checksum tied to two
-- unrelated debates — the same reasoning migration 038 used for keeping a
-- column drop away from a differently-motivated schema change.
--
-- WHAT WAS ACTUALLY DRIFTING. Measured before writing this; 25 rows:
--
--     raw value       | deals | value        | normalized
--     ----------------+-------+--------------+---------------
--     'Cold Outreach' |     1 |    $72,000   | 'cold-outreach'
--     'cold-outreach' |     1 |   $300,000   | unchanged
--     'manual'        |     3 |   $159,000   | unchanged
--     'partner'       |     2 |   $150,000   | unchanged
--     'referral'      |     2 |   $110,000   | unchanged
--     'hrms'          |     1 |    $50,000   | unchanged
--     NULL            |    15 | $1,103,000   | stays NULL
--
-- Exactly ONE row changes value. Everything else was already
-- lowercase-hyphenated. The scale is worth stating plainly so nobody reads a
-- CHECK constraint as evidence of a large cleanup.
--
-- THE 15 NULLS STAY NULL, not backfilled to 'unknown'. contacts_source_check
-- already permits NULL, so that is the established shape here. The stronger
-- reason: 'unknown' is a VALUE. It would appear in a source breakdown as a
-- category indistinguishable from a real classification, where NULL reads as
-- absent. Same call as leaving 20 deals without an owner in 039 — an honest
-- absence beats an invented category.
--
-- THE CHECK COVERS WHAT THE FORM CAN SEND, NOT WHAT THE TABLE HOLDS.
-- ComprehensiveDealFormPage's owner/source step offers ELEVEN values and only
-- four are in use. Constraining to the four would have broken seven of the
-- form's own options on the next create. The list below is therefore the union
-- of (normalized existing values) and (every option that form can submit).
--
-- PAIRED WITH APPLICATION-LEVEL VALIDATION, AND THAT IS NOT OPTIONAL.
-- middleware/errorHandler.ts maps no Postgres constraint codes — there is no
-- 23505, 23502 or 23514 handling in it — so a CHECK violation would reach the
-- caller as a masked 500 Internal Server Error telling them nothing. That is
-- exactly the deals.value NOT NULL failure recorded in CLAUDE.md. So
-- dealsController now rejects an unknown source with a clean 400 naming the
-- allowed values, mirroring contactsController.validate(). The constraint is
-- the backstop; the validator is what the caller sees.
--
-- KNOWN COST, STATED RATHER THAN DISCOVERED LATER. This constraint and the
-- form's option list are two lists that must agree, which is the pattern this
-- repo has already paid for with invitableRolesFor(). The four places to keep
-- in step are named at the bottom of this file, the way migration 029 does for
-- contacts. The proper fix is to SERVE the vocabulary from the server the way
-- assignable_roles is served; that is a follow-up, not this migration.
--
-- NOT APPLIED TO leads.source. That column holds a completely different
-- vocabulary — 14 Title-Case values including 'Cold Email', 'Trade Show' and
-- 'Lead Gen (ZoomInfo)'. Constraining it is a separate decision with a
-- separate mapping, and assuming the deals vocabulary fits it would be wrong.

-- ── 1. Normalize ────────────────────────────────────────────────────────────
-- Lowercase, trim, and collapse internal whitespace to a single hyphen. Written
-- as a general transform rather than a literal 'Cold Outreach' -> 'cold-outreach'
-- swap so that any same-shaped variant already in a copy of this database
-- (a developer's local, a restored dump) normalizes too rather than tripping
-- the constraint below.
UPDATE deals
   SET source = regexp_replace(lower(btrim(source)), '\s+', '-', 'g')
 WHERE source IS NOT NULL
   AND source <> regexp_replace(lower(btrim(source)), '\s+', '-', 'g');

-- ── 2. Anything still outside the vocabulary becomes NULL ───────────────────
-- Deliberately NULL rather than 'other': 'other' is a real, selectable option
-- in the form, so mapping unrecognised junk onto it would make a deliberate
-- user choice and a failed cleanup indistinguishable. On this database the
-- statement affects zero rows; it exists so applying 040 to a copy carrying
-- unexpected values cannot fail at step 3.
UPDATE deals
   SET source = NULL
 WHERE source IS NOT NULL
   AND source NOT IN (
     'lead-gen-apollo', 'lead-gen-zoominfo', 'hrms', 'website', 'manual',
     'referral', 'event', 'partner', 'inbound', 'cold-outreach', 'other'
   );

-- ── 3. Constrain ────────────────────────────────────────────────────────────
ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_source_check;

ALTER TABLE deals ADD CONSTRAINT deals_source_check
  CHECK (source IS NULL OR source IN (
    -- Provenance from the Lead Generation platform. Kept, and kept vendor-split,
    -- because that is what the form offers today. HRMS and Lead Gen are separate
    -- platforms over SSO (see CLAUDE.md, Identity & SSO) — a deal whose ORIGIN
    -- is another product is a value this CRM stores, not a row it joins to.
    'lead-gen-apollo',
    'lead-gen-zoominfo',
    'hrms',
    'website',
    'manual',
    'referral',
    'event',
    'partner',
    'inbound',
    'cold-outreach',
    'other'
  ));

COMMENT ON COLUMN deals.source IS
  'Deal provenance. NULL means unrecorded, which is a real state (15 of 25 rows). Constrained by deals_source_check; validated with a clean 400 in dealsController. See migration 040.';

-- ── FOUR PLACES THAT MUST BE CHANGED TOGETHER ───────────────────────────────
-- Adding or removing a source means all four, or the vocabulary drifts again:
--   1. deals_source_check, above.
--   2. DEAL_SOURCES in Backend/src/controllers/dealsController.ts (the 400).
--   3. `sources` in Frontend/src/components/Deal/DealForm/DealFormOwnership.tsx
--      (the option list a user picks from).
--   4. The source filters in Frontend/src/pages/CRM/DealsKanbanPage.tsx and
--      DealsGridView.tsx.
--
-- Verify the constraint with:
--   SELECT pg_get_constraintdef(oid) FROM pg_constraint
--    WHERE conrelid = 'deals'::regclass AND conname = 'deals_source_check';
