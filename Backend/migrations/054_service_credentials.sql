-- Migration 054: a real machine credential, so another module calling this API
-- does not have to borrow a person's login.
--
-- WHAT THIS REPLACES, AND WHY IT IS URGENT
-- Lead Gen authenticates to this CRM to create contacts and to read closed-won
-- deals. There was no machine-credential path here, so the integration was
-- wired up with a JWT minted for a human admin account
-- (leadgen-integration@bmicrm.com). That works for exactly as long as the token
-- lives: JWT_EXPIRES_IN is 7 days, after which contact conversion starts
-- failing with 401. It is also fragile in three other ways, all of which follow
-- from the credential being a PERSON:
--   - `protect` re-reads the user row on every request, so deactivating that
--     account (or bumping token_version via a password change) silently kills
--     the integration;
--   - the credential carries that account's full role, so it can do anything an
--     admin can, not just the two things Lead Gen needs;
--   - nothing records that the account is machine-operated, so an admin tidying
--     up the user list has no way to know what it breaks.
--
-- CHECKED FIRST, AND THERE WAS NOTHING TO BUILD ON: no service-account table,
-- no API-key middleware, no `X-API-Key` handling anywhere in Backend/src.
-- RESEND_API_KEY is deployment configuration for an outbound provider, not an
-- inbound credential, and module_links.api_key_encrypted is this CRM storing
-- SOMEONE ELSE'S key for the opposite direction.
--
-- SHAPE BORROWED FROM workspace_invites (024) AND module_link_setup_codes (048)
-- rather than invented: the secret is stored as a SHA-256 hash and never in
-- plaintext, lookup is by hash so the key itself never appears in a query or a
-- log, and revocation is a timestamp rather than a delete so a revoked
-- credential stays auditable.
--
-- NOT A ROW IN `users`, DELIBERATELY. That was the workaround being replaced,
-- and putting it back under a different name would keep every failure mode
-- above. A service credential has no password, cannot sign in, and is invisible
-- to the user list and to role management.
--
-- SCOPES ARE AN ALLOWLIST, NOT A ROLE. The two endpoints Lead Gen actually
-- calls were confirmed by reading its client:
--     POST /api/v1/contacts   -> contacts:write
--     GET  /api/v1/deals      -> deals:read
-- Anything else is refused even with a valid key, so a leaked credential cannot
-- read companies, delete a deal, or invite a user. Widen this list only by
-- adding a scope AND opting the route in explicitly -- see
-- middleware/serviceAuth.ts, which is where the opt-in lives.

CREATE TABLE IF NOT EXISTS service_credentials (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- What this credential is for, in words, so an admin revoking one knows what
  -- they are about to break.
  name        VARCHAR(100) NOT NULL,

  -- The first characters of the key, stored in the clear ONLY so a list screen
  -- can identify which credential is which. Not enough to authenticate with.
  key_prefix  VARCHAR(16)  NOT NULL,

  -- SHA-256 hex of the whole key. Same rule as workspace_invites.token_hash: a
  -- leaked table is a list of digests, not a set of working keys.
  key_hash    VARCHAR(64)  NOT NULL,

  scopes      TEXT[]       NOT NULL DEFAULT '{}',

  -- NULL means no expiry. That is the point of this table -- an integration
  -- should not break on a timer the way the borrowed JWT does -- but the column
  -- exists so a short-lived credential can be issued when that is wanted.
  expires_at  TIMESTAMPTZ,

  -- Set on each successful authentication, so an unused credential can be
  -- spotted and revoked. Deliberately not an audit log: one timestamp, updated
  -- in place, with no write amplification per request beyond it.
  last_used_at TIMESTAMPTZ,

  revoked_at  TIMESTAMPTZ,
  created_by  INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- The lookup index, and the guarantee two credentials can never collide.
CREATE UNIQUE INDEX IF NOT EXISTS service_credentials_key_hash_key
  ON service_credentials (key_hash);

CREATE INDEX IF NOT EXISTS idx_service_credentials_tenant
  ON service_credentials (tenant_id, created_at DESC);

-- A name is how an admin tells two credentials apart on the list screen, so two
-- live ones may not share it. Scoped to the workspace for the reason every
-- unique constraint here is (migration 010).
CREATE UNIQUE INDEX IF NOT EXISTS service_credentials_tenant_name_key
  ON service_credentials (tenant_id, lower(name))
  WHERE revoked_at IS NULL;
