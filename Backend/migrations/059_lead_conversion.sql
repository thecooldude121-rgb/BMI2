-- Migration 059: what a lead was converted INTO, and by whom.
--
-- Step 5, slice B. Real lead conversion: POST /leads/:id/convert creates (or
-- links) a contact, optionally a company and a deal, in ONE transaction, and
-- records the result here. Until now the conversion wizard minted client-side
-- ids (cnt_/acc_/deal_) and nothing was ever created; these columns did not
-- exist, so a "converted" lead could not say what it became.
--
-- Decisions ratified 2026-10-03 (Venkat): a deal created at conversion must
-- carry a real value (no default 0); a contact email that already exists is a
-- 409, never an automatic link; the converting user owns the created records
-- (interim, until the owner model is settled).
--
-- References are ON DELETE SET NULL: the conversion is history and outlives
-- the records it produced. converted_by_user_id is a composite reference, so
-- the converter must belong to the lead's workspace; SET NULL is column-listed
-- so tenant_id is never nulled with it (PG15+, as migration 058).
--
-- Every reference here points at a GLOBAL primary key, so Postgres would accept
-- a contact/company/deal from another workspace. The controller proves each id
-- belongs to the caller's workspace before writing (utils/tenantScope); the
-- database cannot, because none of those tables is keyed by (id, tenant_id).

ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_at         TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_by_user_id INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_contact_id VARCHAR(10);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_company_id VARCHAR(10);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_deal_id    VARCHAR(10);

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_converted_by_fkey;
ALTER TABLE leads ADD CONSTRAINT leads_converted_by_fkey
  FOREIGN KEY (converted_by_user_id, tenant_id) REFERENCES users (id, tenant_id)
  ON DELETE SET NULL (converted_by_user_id);

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_converted_contact_fkey;
ALTER TABLE leads ADD CONSTRAINT leads_converted_contact_fkey
  FOREIGN KEY (converted_contact_id) REFERENCES contacts (id) ON DELETE SET NULL;

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_converted_company_fkey;
ALTER TABLE leads ADD CONSTRAINT leads_converted_company_fkey
  FOREIGN KEY (converted_company_id) REFERENCES companies (id) ON DELETE SET NULL;

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_converted_deal_fkey;
ALTER TABLE leads ADD CONSTRAINT leads_converted_deal_fkey
  FOREIGN KEY (converted_deal_id) REFERENCES deals (id) ON DELETE SET NULL;

-- A converted lead must say WHEN. (Not "must name a contact": that reference is
-- SET NULL when the contact is deleted, and the conversion still happened.)
-- Safe on live data: no lead is in 'converted' today (checked 2026-10-03).
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_converted_has_timestamp;
ALTER TABLE leads ADD CONSTRAINT leads_converted_has_timestamp
  CHECK (stage IS DISTINCT FROM 'converted' OR converted_at IS NOT NULL);
