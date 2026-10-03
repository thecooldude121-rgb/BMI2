-- Migration 060: two references the database can now keep tenant-consistent.
-- Step 4 (data integrity), approved 2026-10-03 (Venkat).
--
-- 1. deals.company_id becomes a COMPOSITE reference.
--    deals_company_id_fkey (027) referenced companies(id) — a GLOBAL primary key
--    — so Postgres accepted a deal in workspace A pointing at a company in
--    workspace B. Only createDeal/updateDeal's foreignIdsInTenant stopped it; the
--    CSV importer, a backfill or a hand-typed UPDATE would not have been. The
--    reference is now (company_id, tenant_id) -> companies(id, tenant_id), so the
--    database itself refuses a cross-workspace company. The controller check
--    stays: it is what turns the refusal into a clean 400 naming the field.
--    Verified before writing: 0 orphaned and 0 cross-tenant company_id values.
--
-- 2. leads gains assigned_to_user_id — a real owner reference, the shape
--    migration 039 gave deals. leads.assigned_to stays as the display name
--    (dual-written), because forms still send names; an unresolvable name stores
--    NULL here — an unresolved owner, never a guessed one.
--
-- SET NULL is column-listed (PG15+) so deleting a company or a user clears only
-- the reference, never tenant_id with it (the 058/059 pattern).

-- companies(id, tenant_id) must be unique to be a composite FK target. id is
-- already the primary key, so this cannot fail on existing data.
ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_id_tenant_key;
ALTER TABLE companies ADD CONSTRAINT companies_id_tenant_key UNIQUE (id, tenant_id);

ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_company_id_fkey;
ALTER TABLE deals ADD CONSTRAINT deals_company_id_fkey
  FOREIGN KEY (company_id, tenant_id) REFERENCES companies (id, tenant_id)
  ON DELETE SET NULL (company_id);

ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to_user_id INTEGER;
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_assigned_to_user_fkey;
ALTER TABLE leads ADD CONSTRAINT leads_assigned_to_user_fkey
  FOREIGN KEY (assigned_to_user_id, tenant_id) REFERENCES users (id, tenant_id)
  ON DELETE SET NULL (assigned_to_user_id);

-- Exact-name backfill, tenant-scoped, the 039 rule: a name that matches exactly
-- one user in the lead's workspace resolves; anything else stays NULL. (Live
-- match count on 2026-10-03: 0 — every live lead owner is a seeded name with no
-- user. Those names are cleared separately by 061.)
UPDATE leads l
   SET assigned_to_user_id = u.id
  FROM users u
 WHERE l.assigned_to_user_id IS NULL
   AND u.tenant_id = l.tenant_id
   AND (u.first_name || ' ' || u.last_name) = l.assigned_to
   AND (SELECT COUNT(*) FROM users u2
         WHERE u2.tenant_id = l.tenant_id
           AND (u2.first_name || ' ' || u2.last_name) = l.assigned_to) = 1;

CREATE INDEX IF NOT EXISTS idx_leads_tenant_owner ON leads (tenant_id, assigned_to_user_id);
