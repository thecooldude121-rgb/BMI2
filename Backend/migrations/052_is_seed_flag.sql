-- Migration 052: mark the synthetic seed data as seed data.
--
-- ─── WHY A NEW `is_seed` COLUMN AND NOT `is_test` ─────────────────────────
--
-- `is_test` already exists on `deals` and MEANS "hide this row": `getDeals`
-- appends `AND d.is_test = false` unless `include_test=true`, and
-- `loadProjectionDeals` excludes it unconditionally. That is right for a debug
-- record somebody made while testing an endpoint.
--
-- IT WOULD BE WRONG HERE, and not marginally. The synthetic rows are 15 of the
-- 25 deals, ALL 15 companies, all 38 leads and all 20 contacts — i.e. most of
-- what the application has to show. Setting `is_test` on them would empty the
-- deals list, the dashboard and the pipeline board, which is the opposite of
-- what marking provenance is for.
--
-- So the two flags mean different things and are deliberately not merged:
--
--   is_test  — "this row is debris; do not show it"
--   is_seed  — "this row is demo data; SHOW it, but say so when you summarise
--              it"
--
-- NOTHING IS EXCLUDED BY THIS MIGRATION. No query is changed. The column exists
-- so a report can DISCLOSE its input — which is what the fabricated-data rule in
-- CLAUDE.md actually requires of a figure derived from invented rows. A
-- "Revenue by Industry" card computed over 16 linked deals, 13 of them seeded,
-- must say so; hiding the 13 would leave it describing three deals, which is
-- the failure the UNBACKED_REPORTS note already documents.
--
-- ─── THE EVIDENCE FOR WHICH ROWS ARE SEED ─────────────────────────────────
--
-- Established 2026-09-16 by querying creation timestamps, not by guessing:
--
--   * 15 companies created at EXACTLY 00:00:00.000 on a 14-day cadence,
--     2025-06-01 -> 2026-01-01.
--   * 15 deals (D001-D015) and 15 leads at EXACTLY 00:00:00.000 on a 5-day
--     cadence, 2026-01-10 -> 2026-04-05. Deal N maps to company N.
--   * 20 contacts, likewise midnight, 2026-01-10 -> 2026-04-10.
--   * 23 further leads created on ONE day, 2026-05-25, carrying
--     `john.smith2@acmecorp.com`, `sarah.lee2@techstart.com`,
--     `mike.chen@bigco.com` and `rachel.green@startco.com` — four of the five
--     hardcoded contacts from the deleted ScheduleMeetingModal fixture, with
--     `2` suffixes to dodge UNIQUE(tenant_id, email) against the first load.
--
-- Nobody creates fifteen deals at midnight on a tidy cadence. No seeder for any
-- of this exists in this repository (no migration inserts rows, `seedUsers.ts`
-- only rotates passwords, git history has no deleted seeder), so it cannot be
-- re-run or reversed from anything in the tree — which is exactly why the
-- provenance has to be recorded in the data itself.
--
-- ADDITIVE AND IDEMPOTENT: a new nullable-with-default column and UPDATEs that
-- set a boolean. Re-running changes nothing. No row is deleted, no value but
-- this flag is written.

ALTER TABLE deals     ADD COLUMN IF NOT EXISTS is_seed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_seed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE leads     ADD COLUMN IF NOT EXISTS is_seed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE contacts  ADD COLUMN IF NOT EXISTS is_seed BOOLEAN NOT NULL DEFAULT FALSE;

DO $$
DECLARE
  v_tenant CONSTANT uuid := '2f5b4330-6101-4aee-bd4f-8917a83cce6b';
  d int; c int; l int; ct int;
BEGIN
  -- Deals and companies are named explicitly: the sets are small, and a literal
  -- list is auditable in a way a timestamp predicate is not.
  UPDATE deals SET is_seed = TRUE
   WHERE tenant_id = v_tenant
     AND id IN ('D001','D002','D003','D004','D005','D006','D007','D008',
                'D009','D010','D011','D012','D013','D014','D015');
  GET DIAGNOSTICS d = ROW_COUNT;

  UPDATE companies SET is_seed = TRUE
   WHERE tenant_id = v_tenant
     AND id IN ('C001','C002','C003','C004','C005','C006','C007','C008',
                'C009','C010','C011','C012','C013','C014','C015');
  GET DIAGNOSTICS c = ROW_COUNT;

  -- Leads and contacts are identified by the EVIDENCE rather than by a list,
  -- because the sets are larger and the timestamp is the finding. Midnight to
  -- the millisecond is the tell; a human-entered row has a real time on it.
  UPDATE leads SET is_seed = TRUE
   WHERE tenant_id = v_tenant
     AND (created_at = date_trunc('day', created_at)     -- the 15 midnight leads
          OR created_at::date = DATE '2026-05-25');      -- the 23 fixture-name leads
  GET DIAGNOSTICS l = ROW_COUNT;

  UPDATE contacts SET is_seed = TRUE
   WHERE tenant_id = v_tenant
     AND created_at = date_trunc('day', created_at);
  GET DIAGNOSTICS ct = ROW_COUNT;

  RAISE NOTICE 'is_seed set: % deals, % companies, % leads, % contacts', d, c, l, ct;
END $$;

-- Verify with:
--   SELECT COUNT(*) FILTER (WHERE is_seed) AS seeded, COUNT(*) AS total FROM deals
--    WHERE tenant_id = '2f5b4330-6101-4aee-bd4f-8917a83cce6b';
--   (repeat for companies, leads, contacts)
