-- 063: lead profile fields — Group A item 1 (Venkat, 2026-10-05).
--
-- The Lead detail page, the Add lead frame and the rule-based score all read
-- fields the deployed `leads` table never had: mobile, website, LinkedIn,
-- city / country, company size. The UI rendered them as a permanent "—", and
-- the score's Fit and Data-completeness factors were unsatisfiable for every
-- lead (computeMultiFactorScore asks for company_size, website, linkedin_url).
-- Confirmed against Figma "BMI CRM V1": Add lead (61:701) and Lead detail
-- (61:408) — source detail, priority, UTM fields, referral contact, department
-- and a currency for the estimated value are on those frames too.
--
-- EVERY COLUMN IS NULLABLE, WITH NO DEFAULT AND NO BACKFILL. A default company
-- size or priority would be a fabricated value wearing a schema (the
-- companies.health_score lesson in CLAUDE.md). Existing leads show these as
-- not recorded until someone enters them.
--
-- `value` already exists (numeric) and is now writable through the API; it has
-- never had a currency, so `currency` is added and left NULL on every existing
-- row: the UI says "currency not recorded" rather than assuming INR or USD.
--
-- company_size uses the SAME bands as companies.size (live values) and the
-- scoring engine, so a lead and its account agree and conversion can copy it.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS mobile           varchar(50),
  ADD COLUMN IF NOT EXISTS website          varchar(255),
  ADD COLUMN IF NOT EXISTS linkedin_url     varchar(255),
  ADD COLUMN IF NOT EXISTS city             varchar(100),
  ADD COLUMN IF NOT EXISTS country          varchar(100),
  ADD COLUMN IF NOT EXISTS company_size     varchar(20),
  ADD COLUMN IF NOT EXISTS department       varchar(100),
  ADD COLUMN IF NOT EXISTS source_detail    varchar(255),
  ADD COLUMN IF NOT EXISTS priority         varchar(10),
  ADD COLUMN IF NOT EXISTS currency         varchar(3),
  ADD COLUMN IF NOT EXISTS utm_source       varchar(255),
  ADD COLUMN IF NOT EXISTS utm_medium       varchar(255),
  ADD COLUMN IF NOT EXISTS utm_campaign     varchar(255),
  ADD COLUMN IF NOT EXISTS referral_contact varchar(255);

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_company_size_check;
ALTER TABLE leads ADD CONSTRAINT leads_company_size_check
  CHECK (company_size IS NULL OR company_size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'));

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_priority_check;
ALTER TABLE leads ADD CONSTRAINT leads_priority_check
  CHECK (priority IS NULL OR priority IN ('low', 'medium', 'high'));

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_currency_check;
ALTER TABLE leads ADD CONSTRAINT leads_currency_check
  CHECK (currency IS NULL OR currency ~ '^[A-Z]{3}$');

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_value_nonnegative;
ALTER TABLE leads ADD CONSTRAINT leads_value_nonnegative
  CHECK (value IS NULL OR value >= 0);
