-- Migration 010: Tenant-scope the remaining global UNIQUE constraints.
--
-- Migration 009 covered quotas and forecast_snapshots. Three constraints were
-- left global, and all three leak across tenants:
--
--   tags_name_key      UNIQUE (name)
--     Worst of the three. createTag upserts ON CONFLICT (name) DO UPDATE SET
--     color, so tenant B creating a tag that tenant A already has does not
--     create anything — it UPDATES tenant A's row and the RETURNING * hands
--     tenant A's record (including its tenant_id) back to tenant B.
--
--   contacts_email_key UNIQUE (email)
--   leads_email_key    UNIQUE (email)
--     Tenant B cannot create a contact/lead with an address tenant A already
--     holds, and the constraint-violation error discloses that it exists.
--     Two companies sharing a prospect is completely normal, so this also
--     breaks a legitimate case.
--
-- Safe to run multiple times: DROP uses IF EXISTS, ADD is guarded on pg_catalog.
--
-- NOTE ON EXISTING DATA: adding UNIQUE(tenant_id, name) is strictly weaker than
-- UNIQUE(name), so any data that satisfied the old constraint satisfies the new
-- one. No backfill and no possibility of failure on existing rows.

-- ── tags ────────────────────────────────────────────────────────────────────
ALTER TABLE tags DROP CONSTRAINT IF EXISTS tags_name_key;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tags_tenant_name_key') THEN
    ALTER TABLE tags ADD CONSTRAINT tags_tenant_name_key UNIQUE (tenant_id, name);
  END IF;
END $$;

-- ── contacts ────────────────────────────────────────────────────────────────
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_email_key;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contacts_tenant_email_key') THEN
    ALTER TABLE contacts ADD CONSTRAINT contacts_tenant_email_key UNIQUE (tenant_id, email);
  END IF;
END $$;

-- ── leads ───────────────────────────────────────────────────────────────────
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_email_key;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_tenant_email_key') THEN
    ALTER TABLE leads ADD CONSTRAINT leads_tenant_email_key UNIQUE (tenant_id, email);
  END IF;
END $$;
