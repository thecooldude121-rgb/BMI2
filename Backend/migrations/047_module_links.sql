-- Migration 047: where this CRM keeps the credentials it needs to CALL another
-- module, starting with Lead Gen.
--
-- WHY THIS IS NEW RATHER THAN AN EXTENSION OF SOMETHING
-- Searched before writing: there is no existing place for this. No link table,
-- no api key column, no encryption helper anywhere in Backend/src, and nothing
-- in tenants.settings (which is '{}' in every row today). The workspace-linking
-- mechanism in docs/crm-leadgen-integration-contract.md section 2 was only ever
-- built on Lead Gen's side, in its `workspace_links` table -- which is
-- consistent, because until now every call between the two modules ran INBOUND
-- to this CRM (Lead Gen creating contacts), and answering a call requires
-- storing nothing about the caller.
--
-- This is the first OUTBOUND call: the CRM reading Lead Gen's account
-- intelligence feed. That needs a base URL and a key, per workspace.
--
-- WHY NOT tenants.settings
-- It holds an API key. tenants.settings is a general-purpose JSONB blob read
-- by getWorkspace, whose route comment says reading it "is not privileged --
-- the app shell needs them to render for everyone". A secret must not live one
-- careless `SELECT settings` away from every authenticated user. A separate
-- table can be excluded from those reads by construction.
--
-- WHY NOT AN ENV VAR, WHICH IS HOW RESEND_API_KEY WORKS
-- RESEND_API_KEY is the only comparable credential in the codebase and it is
-- process-wide, set once per deployment. That works because every workspace
-- sends mail through the same Resend account. It cannot work here: each
-- workspace links to its OWN Lead Gen workspace with its own key, so the
-- credential is per-tenant data, not deployment configuration.
--
-- WHY A `module` COLUMN RATHER THAN A lead_gen_links TABLE
-- contacts_source_check has accepted 'hrms' alongside 'lead-gen' since
-- migration 020, and the companion docs treat HRMS as the next module to
-- integrate. One column now is cheaper than a second near-identical table
-- later. The CHECK keeps the vocabulary honest in the meantime -- widen it in a
-- new migration when a second module actually arrives, the way 029 widened
-- contacts_source_check.
--
-- 'lead-gen' is spelled with a hyphen to match contacts_source_check, which is
-- the spelling the rest of this schema already uses for this module.
--
-- NOT NULL is deliberate on base_url but NOT on api_key_encrypted: an admin can
-- record which Lead Gen instance a workspace points at before the key has been
-- issued and pasted. A link without a key simply cannot authenticate yet, which
-- the client reports as "not configured" rather than as an error.

CREATE TABLE IF NOT EXISTS module_links (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  module              VARCHAR(30) NOT NULL,

  -- Fetched server-side, so it is an SSRF surface. The application layer
  -- validates the scheme and refuses anything but http(s) (plain http only for
  -- localhost), mirroring normalizeBaseUrl on Lead Gen's side of this link.
  base_url            TEXT        NOT NULL,

  -- AES-256-GCM ciphertext, never the raw key. See utils/secretBox.ts.
  api_key_encrypted   TEXT,

  -- The module's OWN id for this workspace. Optional: Lead Gen resolves the
  -- workspace from the API key alone, and only cross-checks this value when it
  -- is sent. Stored so the check can be exercised, not because it is required.
  remote_workspace_id TEXT,

  is_active           BOOLEAN     NOT NULL DEFAULT TRUE,
  linked_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  linked_by           INTEGER     REFERENCES users(id) ON DELETE SET NULL,

  -- Populated by a reachability probe, so an admin can see the link is broken
  -- without reading server logs.
  last_verified_at    TIMESTAMPTZ,
  last_verify_error   TEXT,

  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One link per module per workspace. Scoped to tenant_id for the reason every
-- unique constraint in this schema is (migration 010): two workspaces linking
-- to their own Lead Gen instances must never collide, and a violation must
-- never disclose that another workspace holds a value.
CREATE UNIQUE INDEX IF NOT EXISTS module_links_tenant_module_key
  ON module_links (tenant_id, module);

ALTER TABLE module_links DROP CONSTRAINT IF EXISTS module_links_module_check;
ALTER TABLE module_links ADD CONSTRAINT module_links_module_check
  CHECK (module IN ('lead-gen'));
