-- Migration 051: backfill deals.company_id for the 13 deals where two
-- independent keys agree on the account.
--
-- WHY 051. 050 is `050_documents_module_check.sql` on the unmerged branch
-- `feature/documents-polymorphic-ref`. Taking 050 here would put two different
-- migrations under one filename, which is the one migration mistake that does
-- not unwind cleanly — the ledger keys on filename (lesson 14). A gap is
-- harmless; a duplicate is not. (The sequence is already non-unique: two
-- different `006_*` files exist from 2024 commits. Numbers here cannot be
-- derived by counting.)
--
-- ─── WHY THESE 13, AND HOW THEY WERE CHOSEN ───────────────────────────────
--
-- 25 deals; 3 already carried a company_id; 22 did not. For each of those 22,
-- two INDEPENDENT keys were resolved through `deals.lead_id`:
--
--   A. the lead's email DOMAIN matched against `companies.domain`
--   B. the lead's company NAME matched against `companies.name`
--
-- The 13 below are every deal where A and B resolve to the SAME company. There
-- were ZERO ambiguous matches (no domain or name matched more than one company)
-- and ZERO disagreements. Key A is the load-bearing one — a domain is a real
-- key; key B is a display name, which this project has repeatedly found
-- unreliable (migrations 039-043 exist to remove name-keying, and exact name
-- matching alone resolved 0 of these 22, because the live names are variants:
-- "TechCorp" against the company row "TechCorp Inc").
--
-- ─── WHAT IS DELIBERATELY NOT HERE ────────────────────────────────────────
--
--   D006 (ManufactPro) and D010 (AutomEdge) — the name matches a company but
--   the lead's domain does NOT: `manufact.com` against the company's
--   `manufactpro.com`, and `automatedge.com` against `automedge.com`. Either a
--   second legitimate domain or a typo; picking one would be a guess.
--
--   D017, dlj22yl, D026, D030, D042, D043, D053 — the account does not exist
--   in `companies` at all, under any name. Nothing to link them to.
--
-- ─── THE CAVEAT, RECORDED BECAUSE IT DOES NOT GO AWAY ─────────────────────
--
-- THIS METHOD COULD NOT BE VALIDATED AGAINST KNOWN-GOOD DATA. The 3 deals that
-- already carry a company_id have NO lead_id, so the inferable set and the
-- ground-truth set are disjoint: there is no row where the inference can be
-- checked against a human-confirmed answer. Two independent keys agreeing on
-- all 13, with zero ambiguity, is strong corroboration — it is not validation.
-- Applied on Venkat's explicit approval (2026-09-16) without a separate review
-- gate, with the mappings spelled out below precisely so the decision is
-- auditable rather than buried in a dynamic UPDATE.
--
-- ─── SAFETY PROPERTIES ────────────────────────────────────────────────────
--
--   * The 13 pairs are LITERAL. No join decides which company a deal gets, so
--     re-running this on changed data cannot silently link something else.
--   * `WHERE company_id IS NULL` — idempotent, and it will never overwrite a
--     link somebody set by hand in the meantime.
--   * Tenant-scoped on both sides, and the company must exist in the SAME
--     tenant. `deals.id` and `companies.id` are global primary keys, so without
--     that predicate a literal pair could cross a workspace boundary.
--   * Every deal value is untouched. This writes one column.

DO $$
DECLARE
  v_tenant CONSTANT uuid := '2f5b4330-6101-4aee-bd4f-8917a83cce6b';
  v_updated int;
  v_skipped int;
BEGIN
  WITH mapping(deal_id, company_id) AS (
    VALUES
      ('D001', 'C001'),   -- TechCorp Inc   techcorp.com
      ('D002', 'C002'),   -- FinSolve Ltd   finsolve.com
      ('D003', 'C003'),   -- HealthPlus     healthplus.com
      ('D004', 'C004'),   -- RetailMax      retailmax.com
      ('D005', 'C005'),   -- EduNext        edunext.org
      ('D007', 'C007'),   -- Logistico      logistico.com
      ('D008', 'C008'),   -- SaasWorld      saasworld.com
      ('D009', 'C009'),   -- RealEstateX    realestatex.com
      ('D011', 'C011'),   -- CyberSecure    cybersecure.io
      ('D012', 'C012'),   -- FoodChain Co   foodchain.com
      ('D013', 'C013'),   -- eCommerz       ecommerz.com
      ('D014', 'C014'),   -- TravelWise     travelwise.com
      ('D015', 'C015')    -- GreenTech      greentech.com
  ),
  updated AS (
    UPDATE deals d
       SET company_id = m.company_id,
           updated_at = NOW()
      FROM mapping m
     WHERE d.id = m.deal_id
       AND d.tenant_id = v_tenant
       AND d.company_id IS NULL
       -- The company must exist in the SAME workspace. Without this a literal
       -- pair would be accepted by the FK (global primary keys) even across a
       -- tenant boundary.
       AND EXISTS (
         SELECT 1 FROM companies c
          WHERE c.id = m.company_id AND c.tenant_id = v_tenant
       )
     RETURNING d.id
  )
  SELECT COUNT(*) INTO v_updated FROM updated;

  SELECT 13 - v_updated INTO v_skipped;

  RAISE NOTICE 'deals.company_id backfill: % updated, % skipped (already linked, absent, or company missing)',
    v_updated, v_skipped;
END $$;

-- Verify with:
--   SELECT id, company_id FROM deals
--    WHERE id IN ('D001','D002','D003','D004','D005','D007','D008','D009',
--                 'D011','D012','D013','D014','D015')
--    ORDER BY id;
--   SELECT COUNT(*) FILTER (WHERE company_id IS NOT NULL) AS linked, COUNT(*) AS total
--     FROM deals WHERE tenant_id = '2f5b4330-6101-4aee-bd4f-8917a83cce6b';
