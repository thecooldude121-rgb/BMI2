-- 045: constrain companies.industry to one vocabulary, served to the UI.
--
-- WHY. `companies.industry` was VARCHAR(50) free text with no CHECK, fed by two
-- frontend lists that had already drifted apart:
--
--     AccountFormPage.INDUSTRY_OPTIONS   16 values   routed (/crm/accounts/...)
--     CompanyForm.industries             10 values   imported only by
--                                                    CompaniesPage, which no
--                                                    route renders — dead code
--
-- AccountFormPage's own comment records what the drift cost before: nine of
-- fifteen accounts held an industry that was not an option, the select fell
-- back to "", and because Industry is required those accounts COULD NOT BE
-- SAVED. A picklist that lives only in the client is a picklist the data
-- disagrees with.
--
-- THE VOCABULARY. The union of both lists, plus three values the agreed plan
-- added: 'IT Services' and 'EdTech' — the target market's own industries per
-- CLAUDE.md, missing from both lists — and 'Other', so a real industry that is
-- not listed has an honest home rather than being forced into a wrong one.
-- 21 values. The same list drives the workspace's "what industry is OUR business
-- in" setting (tenants.settings.business_industry), which is a different field
-- about a different company but the same question.
--
-- MEASURED BEFORE WRITING THIS (bmi_crm, 15 companies): 13 distinct values,
-- every one already an exact member of the list. This migration changes ZERO
-- live rows. The scale is stated so nobody reads a CHECK as evidence of a cleanup.
--
-- UNMATCHED VALUES FAIL THE MIGRATION — deliberately NOT the NULLing that 040
-- did for deals.source. There, the only unrecognised input was hypothetical
-- junk. Here, a copy of this database could hold a real, deliberate industry a
-- user typed ("Pharma", say); NULLing it would silently discard their data, and
-- mapping it to 'Other' would silently reclassify it. Neither is a migration's
-- call. So step 3 raises and names the values, and a human decides.
--
-- NOT APPLIED TO leads.industry. Leads carry a different, wider vocabulary
-- (live: Enterprise, Cloud, Media, Construction, Startup, Pharma are all in use
-- and none is on this list). Lead conversion does not create companies, so
-- nothing carries a lead's industry into this column. Constraining leads is a
-- separate decision with its own mapping.
--
-- TWO PLACES MUST AGREE, BOTH ON THE SERVER, AND A TEST HOLDS THEM TOGETHER:
--   1. companies_industry_check, below.
--   2. INDUSTRIES in Backend/src/utils/industries.ts — what the API validates
--      against and SERVES at GET /companies/industries.
-- The frontend keeps no copy; it renders the served list. roundTrip.industries
-- compares this constraint's definition to INDUSTRIES and fails if they differ.

-- ── 1. Canonicalise case and whitespace ─────────────────────────────────────
-- ' technology ' and 'TECHNOLOGY' are the same industry typed carelessly, not a
-- different one, so they are corrected rather than refused.
UPDATE companies c
   SET industry = v.canon
  FROM (VALUES
    ('Automotive'), ('Consulting'), ('E-Commerce'), ('EdTech'), ('Education'),
    ('Energy'), ('Entertainment'), ('Finance'), ('FinTech'), ('Food & Beverage'),
    ('Healthcare'), ('IT Services'), ('Logistics'), ('Manufacturing'),
    ('Real Estate'), ('Retail'), ('SaaS'), ('Technology'), ('Transportation'),
    ('Travel'), ('Other')
  ) AS v(canon)
 WHERE c.industry IS NOT NULL
   AND lower(btrim(c.industry)) = lower(v.canon)
   AND c.industry <> v.canon;

-- ── 2. Blank is absence ─────────────────────────────────────────────────────
UPDATE companies SET industry = NULL
 WHERE industry IS NOT NULL AND btrim(industry) = '';

-- ── 3. Refuse to guess about anything else ──────────────────────────────────
DO $$
DECLARE
  unmatched TEXT;
BEGIN
  SELECT string_agg(DISTINCT quote_literal(industry), ', ')
    INTO unmatched
    FROM companies
   WHERE industry IS NOT NULL
     AND industry NOT IN (
       'Automotive', 'Consulting', 'E-Commerce', 'EdTech', 'Education',
       'Energy', 'Entertainment', 'Finance', 'FinTech', 'Food & Beverage',
       'Healthcare', 'IT Services', 'Logistics', 'Manufacturing',
       'Real Estate', 'Retail', 'SaaS', 'Technology', 'Transportation',
       'Travel', 'Other'
     );
  IF unmatched IS NOT NULL THEN
    RAISE EXCEPTION
      '045: companies.industry holds values outside the vocabulary: %. Map each to a listed industry (or ''Other'') by hand, then re-run. Not guessed here: NULLing would lose the data and ''Other'' would reclassify it.',
      unmatched;
  END IF;
END $$;

-- ── 4. Constrain ────────────────────────────────────────────────────────────
ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_industry_check;
ALTER TABLE companies ADD CONSTRAINT companies_industry_check
  CHECK (industry IS NULL OR industry IN (
    'Automotive', 'Consulting', 'E-Commerce', 'EdTech', 'Education',
    'Energy', 'Entertainment', 'Finance', 'FinTech', 'Food & Beverage',
    'Healthcare', 'IT Services', 'Logistics', 'Manufacturing',
    'Real Estate', 'Retail', 'SaaS', 'Technology', 'Transportation',
    'Travel', 'Other'
  ));

COMMENT ON COLUMN companies.industry IS
  'The CLIENT account''s industry. NULL = not recorded. Constrained by companies_industry_check; validated and served by utils/industries.ts (GET /companies/industries). Distinct from tenants.settings.business_industry, which is the workspace''s OWN industry. Migration 045.';
