-- Migration 022: scope user identity to the workspace, and give workspaces a slug.
--
-- THE LEAK-SHAPED HOLE THIS CLOSES
--
-- `users_email_key` was `UNIQUE (email)` — globally, across every workspace. It
-- was the ONLY unique constraint that was never tenant-scoped: migration 010
-- scoped contacts, leads, tags, quotas and forecast_snapshots and missed this
-- one. The spec requires UNIQUE(workspace_id, email).
--
-- On its own that is a functional limit (one person can never belong to two
-- workspaces). The dangerous part is the pair it forms with login:
-- authController resolved users with `WHERE email = $1` and no tenant filter.
-- There is no live exploit TODAY only because the global constraint guarantees
-- at most one match. Relax the constraint without fixing login and that query
-- starts authenticating people into an arbitrary workspace.
--
-- So the two must change together, and they do: this migration and the
-- password-first resolution in authController.login land in the same commit.
--
-- Verified before applying: zero duplicate (tenant_id, lower(email)) pairs.

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

-- Case-insensitive on purpose. Alice@x.com and alice@x.com are the same person,
-- and login lower()s the input — without this, two rows could both match and the
-- resolution below would have to pick one arbitrarily.
CREATE UNIQUE INDEX IF NOT EXISTS users_workspace_email_key
  ON users (tenant_id, lower(email));

-- ── Workspace slug ──────────────────────────────────────────────────────────
-- Required by the spec's `workspaces` shape and needed as the stable, shareable
-- workspace identifier for the SSO flow: Lead Generation and HRMS will consume
-- this CRM as their identity provider, and a slug is what they can put in a URL.
-- A UUID works but is not something anyone can type or recognise.
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS slug VARCHAR(100);

-- Backfill from the name: lowercase, non-alphanumerics to hyphens, collapsed,
-- trimmed. Deterministic so re-running is a no-op.
UPDATE tenants
   SET slug = trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'))
 WHERE slug IS NULL;

-- Any row whose name produced an empty slug falls back to its id prefix rather
-- than blocking the NOT NULL below.
UPDATE tenants SET slug = 'workspace-' || left(id::text, 8) WHERE slug IS NULL OR slug = '';

ALTER TABLE tenants ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS tenants_slug_key ON tenants (slug);

-- NOTE ON NAMING: the spec calls this column `workspace_id` and this table
-- `workspaces`; the database says `tenant_id` and `tenants`. That rename is
-- tracked separately — it touches 22 columns and is mechanical. From this commit
-- the JWT carries `workspace_id` as its canonical claim regardless, and the auth
-- middleware maps claim -> internal scope in exactly one place, so the rename can
-- land later without breaking any external SSO consumer.
