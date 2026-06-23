-- Migration 006: Add fee breakdown, scope, and geography fields to deals

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS platform_fee        NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS custom_fee          NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS license_fee         NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS onboarding_fee      NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS white_labelling_fee NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS exchange_rate       NUMERIC(15,6) DEFAULT 1,
  ADD COLUMN IF NOT EXISTS nr_margin           NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS start_date          DATE,
  ADD COLUMN IF NOT EXISTS contract_end_date   DATE,
  ADD COLUMN IF NOT EXISTS country             TEXT,
  ADD COLUMN IF NOT EXISTS account_industry    TEXT;
