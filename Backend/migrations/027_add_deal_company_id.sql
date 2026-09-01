-- Migration 027: link a deal to its account.
--
-- Reference: CLAUDE.md Phase-1 page list, item 4 ("deal detail ... related
-- deals") and item 3 ("account detail, related deals"), plus the core data
-- model in CLAUDE.md, which already specifies
-- `company_id UUID REFERENCES companies(id)` on deals. The deployed table never
-- had it — this is recorded schema drift being closed, not a new idea.
--
-- WHY
-- deals carries a free-text company_name and nothing else. There is therefore
-- no way to answer "which deals belong to this account", which is a named
-- Phase-1 deliverable on both detail pages. The workarounds this replaces:
--   - AccountsContext matched deals to accounts on lower(trim(name)) equality
--     and documented that it is a match, not a relationship.
--   - EnhancedAccountDetailView's getAccountDeals() read a sample-seeded array
--     that is now permanently empty, so every account reported
--     "Active Deals 0 / Total Pipeline $0" while 25 real deals existed. An
--     honest-looking zero is still a wrong number.
--
-- TYPE NOTE
-- VARCHAR(10), not UUID, matching companies.id ('C001'). CLAUDE.md's spec says
-- UUID because the spec assumes gen_random_uuid() primary keys throughout; the
-- deployed tables use the C001/D001 scheme. Matching the deployed column is
-- required for the foreign key to be creatable at all. The migration away from
-- MAX(id)+1 string ids is a separate, already-recorded piece of work
-- (see CLAUDE.md, "Known defect — MAX(id) + 1 is a race") and will move this
-- column with the rest.
--
-- TENANT ISOLATION — READ BEFORE USING THIS COLUMN
-- deals_company_id_fkey references companies(id), a GLOBAL primary key with no
-- tenant component, so Postgres will happily accept a deal in workspace A
-- pointing at a company in workspace B. Referential integrity is satisfied and
-- tenant isolation is not. Per CLAUDE.md both halves are required:
--   - WRITE: dealsController must prove the company belongs to the caller's
--     workspace before insert/update, via utils/tenantScope.ts, rejecting with
--     400 naming the field ("company_id does not name a company in this
--     workspace").
--   - READ: every join must carry AND companies.tenant_id = deals.tenant_id,
--     so a bad row that already exists cannot be read through.
--
-- company_name is KEPT, not dropped. Seven deals name a company that has no row
-- in companies at all; company_name is the only record of what they refer to,
-- and dropping it would destroy that. It stops being the linkage mechanism and
-- becomes what it always was: a label.

ALTER TABLE deals ADD COLUMN IF NOT EXISTS company_id VARCHAR(10);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'deals_company_id_fkey'
  ) THEN
    ALTER TABLE deals ADD CONSTRAINT deals_company_id_fkey
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
  END IF;
END $$;

-- "Deals for this account", the only read pattern this column exists to serve.
CREATE INDEX IF NOT EXISTS idx_deals_tenant_company
  ON deals (tenant_id, company_id)
  WHERE company_id IS NOT NULL;

-- ── Backfill ────────────────────────────────────────────────────────────────
-- Of 25 deals: 15 have an EMPTY company_name and can never be linked
-- automatically; 7 name a company with no row in `companies`; 3 are linkable.
-- After this migration 22 rows remain NULL. That is the honest outcome — this
-- migration makes the relationship POSSIBLE, it does not make it POPULATED.
-- The remaining links are a user's to make through the UI.

-- (a) Exact match, tenant-scoped. One row: D052 'TechCorp Inc' -> C001.
UPDATE deals d
SET    company_id = c.id
FROM   companies c
WHERE  d.company_id IS NULL
  AND  d.company_name IS NOT NULL
  AND  btrim(d.company_name) <> ''
  AND  c.tenant_id = d.tenant_id
  AND  lower(btrim(c.name)) = lower(btrim(d.company_name));

-- (b) Two INFERRED links, approved explicitly by the repo owner on 2026-09-02
--     and written by id so the judgement is visible, auditable and reversible.
--     These are NOT exact matches and were not derived by a fuzzy rule — a
--     prefix or trigram match run across the whole table would also link
--     'Moving Walls' and 'Acme Corp' to nothing, or worse, to the wrong row.
--
--       D019 'TechCorp'  -> C001 'TechCorp Inc'
--       D020 'FinSolve'  -> C002 'FinSolve Ltd'
--
--     To undo just these two:
--       UPDATE deals SET company_id = NULL WHERE id IN ('D019','D020');
--
--     Guarded on tenant_id so this cannot link across workspaces, and on
--     company_name so it is a no-op if the deal has since been renamed or
--     relinked.
UPDATE deals d
SET    company_id = c.id
FROM   companies c
WHERE  d.company_id IS NULL
  AND  c.tenant_id = d.tenant_id
  AND  (   (d.id = 'D019' AND btrim(d.company_name) = 'TechCorp' AND c.id = 'C001')
        OR (d.id = 'D020' AND btrim(d.company_name) = 'FinSolve' AND c.id = 'C002'));

COMMENT ON COLUMN deals.company_id IS
  'Account this deal belongs to. NULL means unlinked — 22 of 25 rows at the '
  'time of migration 027. Reads must join with a matching tenant_id; writes '
  'must validate ownership via utils/tenantScope.ts.';
