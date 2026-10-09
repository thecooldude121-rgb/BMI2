-- 064: contacts.company_id becomes a COMPOSITE, workspace-consistent reference.
--
-- contacts_company_id_fkey referenced companies(id) — a GLOBAL primary key — so
-- Postgres accepted a contact in workspace A pointing at an account in
-- workspace B. contactsController already refuses that on write
-- (foreignIdsInTenant) and every read joins with the tenant match, but a
-- controller binds one writer: a CSV importer, a backfill or a hand-typed UPDATE
-- bypasses it. Found 2026-10-05 while building global search (whose join is
-- tenant-matched, and a test proves it); fixed the way migration 060 fixed
-- deals.company_id, as Venkat asked (2026-10-06).
--
-- Verified before writing, on bmi_crm and bmi_crm_iso_test: 0 cross-workspace
-- links, 0 orphaned company_id values, 0 contacts without a tenant. The guard
-- below re-checks at apply time and REFUSES rather than silently clearing data,
-- so applying this elsewhere later cannot destroy a link without a decision.
--
-- companies_id_tenant_key UNIQUE (id, tenant_id) already exists (migration 060).
-- SET NULL is column-listed (PG15+): deleting an account clears only the
-- contact's company_id, never its tenant_id.

DO $$
DECLARE bad int;
BEGIN
  SELECT count(*) INTO bad
    FROM contacts c JOIN companies co ON co.id = c.company_id
   WHERE co.tenant_id IS DISTINCT FROM c.tenant_id;
  IF bad > 0 THEN
    RAISE EXCEPTION '064: % contact(s) point at an account in another workspace — resolve them before applying', bad;
  END IF;
END $$;

ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_company_id_fkey;
ALTER TABLE contacts ADD CONSTRAINT contacts_company_id_fkey
  FOREIGN KEY (company_id, tenant_id) REFERENCES companies (id, tenant_id)
  ON DELETE SET NULL (company_id);
