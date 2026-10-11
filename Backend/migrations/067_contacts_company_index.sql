-- 067: index contacts by account (Group A item 4, slice 3b).
--
-- The Accounts list now carries a server contact_count per row (a scalar
-- subquery per returned account). contacts had no usable index on company_id —
-- only a partial (tenant_id, company_id, buying_role) WHERE buying_role IS NOT
-- NULL — so every count was a sequential scan of the workspace's contacts:
-- measured 500 loops of a seq scan (~470 ms for 2,000 accounts / 10,000
-- contacts), and the 10,000-row list walk timed out at 60 s. deals already has
-- idx_deals_tenant_company for the open-deal roll-ups. Index only; no data change.

CREATE INDEX IF NOT EXISTS idx_contacts_tenant_company
  ON contacts (tenant_id, company_id)
  WHERE company_id IS NOT NULL;
