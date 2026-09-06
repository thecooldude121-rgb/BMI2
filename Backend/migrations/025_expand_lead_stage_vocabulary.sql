-- Migration 025: expand leads.stage to the product's actual lead lifecycle, and
-- put the one lifecycle value that leaked into leads.status back where it belongs.
--
-- WHY EXPAND RATHER THAN NARROW
--
-- The six-value constraint was almost certainly never updated as the product grew.
-- The richer vocabulary is load-bearing, not aspirational: utils/leadSla/ keys on
-- eight stage values of which seven were rejected by this constraint, utils/leadNBA/
-- and the Leads page pipeline key on eleven, and utils/conversionReadiness.ts on
-- five. Narrowing the product to fit the constraint would have deleted working SLA
-- and next-best-action behaviour to satisfy a CHECK nobody had revisited.
--
-- All six existing values stay valid — this is a relaxation, so no row can violate
-- it and no stage backfill is needed. Distribution before this migration:
--   qualified 14, proposal 9, new 6, won 4, contacted 3, lost 2  (38 rows)
--
-- ORDERING MATTERS, AND IS WHY THIS IS ONE FILE
--
-- The constraint is widened BEFORE the UPDATE below, because the UPDATE sets
-- stage = 'nurture', which the old constraint forbids. runMigrations.ts wraps each
-- file in BEGIN/COMMIT, so both halves land together or neither does.
--
-- The application-side gate (VALID_STAGES in controllers/leadsController.ts) is
-- widened in the same commit. The two must move together in this direction: if
-- VALID_STAGES were widened without this migration, the API would accept a value
-- Postgres then rejects, surfacing as a 500 carrying a stack trace rather than a
-- clean 400. Migrations run at boot, so deploying the code applies this first.
--
-- WHAT THIS DELIBERATELY DOES NOT DO
--
-- types/lead.ts carried a drafted, never-applied migration that read:
--     UPDATE leads SET status = 'attempting_contact' WHERE status IN ('contacted','working');
--     UPDATE leads SET status = 'nurture'            WHERE status = 'nurturing';
--     UPDATE leads SET status = 'disqualified'       WHERE status = 'unqualified';
-- It operates on `status` where the runtime uses `stage` (leadsApi.mapRowToLead reads
-- row.stage into the frontend's `status` field and never reads row.status at all).
-- Applying it would have written lifecycle values into the record-state column and
-- baked the confusion in. It is not applied here and the comment has been deleted so
-- nobody applies it later.

-- 1. Widen the stage vocabulary to the union the frontend actually uses.
--    Six were already allowed; eight are new.
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_stage_check;

ALTER TABLE leads ADD CONSTRAINT leads_stage_check CHECK (stage IN (
  -- already present before this migration
  'new',
  'contacted',
  'qualified',
  'proposal',
  'won',
  'lost',
  -- added: the lifecycle the SLA, NBA and pipeline code already keys on
  'assigned',
  'enriching',
  'attempting_contact',
  'engaged',
  'sales_accepted',
  'nurture',
  'disqualified',
  'converted'
));

-- 2. `status` is the record-state flag (active | inactive), not a lifecycle field.
--    One row held 'nurturing' there — a lifecycle state in the wrong column, and the
--    reason utils/leadAdapters.ts and utils/leadSorting.ts both carry a "legacy alias
--    for nurture" branch. Move it to the lifecycle column and mark the record active.
--
--    Scoped to the exact value so this is a no-op on a database where it was already
--    corrected, and so it cannot touch a row whose status is legitimately inactive.
UPDATE leads
   SET stage  = 'nurture',
       status = 'active'
 WHERE status = 'nurturing';

-- 3. leads.status keeps its own constraint unchanged (active | inactive | nurturing).
--    'nurturing' is intentionally left in that CHECK for now: dropping a permitted
--    value is a separate, narrowing change, and nothing writes it any more. Remove it
--    once the frontend has a field that maps to this column at all — today
--    mapRowToLead ignores row.status entirely, so `status` is a column the product
--    does not read. Deciding whether it becomes a real archive flag or is dropped is
--    a follow-up, recorded in HANDOFF.
