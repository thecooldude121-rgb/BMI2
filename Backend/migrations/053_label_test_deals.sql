-- Migration 053: label three hand-created test deals, and remove D053.
--
-- ─── WHAT THESE ROWS ARE ──────────────────────────────────────────────────
--
-- Ten deals were created by hand between 2026-05-25 and 2026-06-03, with real
-- sub-second timestamps, in a window where NO company and NO contact was
-- created — which is why none of them could be linked to an account. Four carry
-- names that are the codebase's own placeholder fixtures:
--
--   D017  "TechStart Inc"   AED 50,000
--   D026  "Acme Corp"       USD 75,000
--   D030  "Acme Corp"       USD 60,000
--   D053  "Demo Company"    USD 300,000   (already is_test = true)
--
-- "Acme" appears in 44 files of the current source tree and "TechStart" in 16;
-- both were in the deleted ScheduleMeetingModal's hardcoded contact and deal
-- lists. They are not customer names.
--
-- ─── WHY LABEL RATHER THAN DELETE ─────────────────────────────────────────
--
-- `is_test` already means "hide this row" and is already enforced:
-- `getDeals` appends `AND d.is_test = false` unless `include_test=true`, and
-- `loadProjectionDeals` excludes it unconditionally. So setting the existing
-- flag gets these three out of every deal list, dashboard tile, pipeline board
-- and projection WITHOUT destroying rows that carry real currency values
-- somebody may still want to look at. Reversible by flipping one boolean.
--
-- ─── WHY D053 IS DELETED AND THE OTHER THREE ARE NOT ──────────────────────
--
-- D053 was ALREADY flagged `is_test = true` by whoever created it, so it has
-- been invisible to every production view since the day it was made. Removing
-- it changes nothing anyone can see; keeping it only preserves clutter. Deleted
-- on explicit instruction (2026-09-16).
--
-- THE ROW IS BACKED UP FIRST, as a restorable INSERT, at
-- `Backend/migrations/_backups/D053_demo_company_row.sql`. A deletion with a
-- backup beside it is recoverable; one without is not, and $300,000 of nominal
-- value is not something to make unrecoverable to save a file.
--
-- It has NO dependents — verified across every table that references
-- `deals.id`: activities, deal_stage_history, quotes, sales_orders (real FKs),
-- plus the polymorphic references in documents, tasks and meetings. All zero.

DO $$
DECLARE
  v_tenant CONSTANT uuid := '2f5b4330-6101-4aee-bd4f-8917a83cce6b';
  v_labelled int;
  v_deps int;
  v_deleted int;
BEGIN
  -- ── Label the three ─────────────────────────────────────────────────────
  UPDATE deals SET is_test = TRUE, updated_at = NOW()
   WHERE tenant_id = v_tenant
     AND id IN ('D017', 'D026', 'D030')
     AND is_test = FALSE;          -- idempotent; a re-run writes nothing
  GET DIAGNOSTICS v_labelled = ROW_COUNT;

  -- ── Remove D053, but ONLY if it is still dependency-free ────────────────
  -- Re-checked here rather than trusted from the earlier query: this migration
  -- may be applied to another database, or later, and a row that has acquired
  -- a dependent since must not be silently deleted out from under it.
  SELECT (SELECT COUNT(*) FROM activities         WHERE deal_id = 'D053')
       + (SELECT COUNT(*) FROM deal_stage_history WHERE deal_id = 'D053')
       + (SELECT COUNT(*) FROM quotes             WHERE deal_id = 'D053')
       + (SELECT COUNT(*) FROM sales_orders       WHERE deal_id = 'D053')
       + (SELECT COUNT(*) FROM documents WHERE module='deal'          AND record_id     = 'D053')
       + (SELECT COUNT(*) FROM tasks     WHERE related_to_type='deal' AND related_to_id = 'D053')
       + (SELECT COUNT(*) FROM meetings  WHERE related_to_type='deal' AND related_to_id = 'D053')
    INTO v_deps;

  IF v_deps > 0 THEN
    RAISE EXCEPTION 'D053 has % dependent row(s); refusing to delete. Resolve them first.', v_deps;
  END IF;

  DELETE FROM deals
   WHERE tenant_id = v_tenant
     AND id = 'D053'
     -- Belt and braces: only ever deletes a row that is still flagged as test
     -- data. If somebody un-flagged it because it turned out to matter, this
     -- becomes a no-op instead of a loss.
     AND is_test = TRUE;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RAISE NOTICE '053: % deals labelled is_test, % deleted (D053)', v_labelled, v_deleted;
END $$;

-- Verify with:
--   SELECT id, company_name, value, currency, is_test FROM deals
--    WHERE id IN ('D017','D026','D030','D053') ORDER BY id;
