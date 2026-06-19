-- Migration 005: Add commercial documentation links and record information fields to deals.
--
-- New columns:
--   sales_drive_folder   — URL to the Google Drive / SharePoint sales folder
--   agreement_url        — URL to the signed or draft agreement document
--   account_module_setup — URL to the account & module setup document
--   client_discovers     — URL to client discovery / RFP document
--   discovery_date       — Date the sales opportunity was first identified

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS sales_drive_folder   TEXT,
  ADD COLUMN IF NOT EXISTS agreement_url        TEXT,
  ADD COLUMN IF NOT EXISTS account_module_setup TEXT,
  ADD COLUMN IF NOT EXISTS client_discovers     TEXT,
  ADD COLUMN IF NOT EXISTS discovery_date       DATE;

COMMENT ON COLUMN deals.sales_drive_folder   IS 'URL to the shared sales drive folder for this deal';
COMMENT ON COLUMN deals.agreement_url        IS 'URL to the agreement / contract document';
COMMENT ON COLUMN deals.account_module_setup IS 'URL to the account and module setup guide';
COMMENT ON COLUMN deals.client_discovers     IS 'URL to the client discovery or RFP document';
COMMENT ON COLUMN deals.discovery_date       IS 'Date the opportunity was first identified / entered the pipeline';
