-- Migration 024: invite-only registration.
--
-- THE HOLE THIS CLOSES
--
-- POST /auth/register was unauthenticated, accepted any email domain, and
-- resolved "exactly one workspace exists -> join it". So one unauthenticated
-- request from any address created a `sales` account inside the tenant, and that
-- account could immediately read all 20 contacts, 15 companies, 24 deals and 15
-- tasks. Demonstrated with a single curl from a gmail.com address.
--
-- That defeated the query-layer isolation proven in the previous commit at the
-- front door rather than in the queries: `UNIQUE(tenant_id, email)` and
-- token-only scoping are both intact and both irrelevant if workspace membership
-- is available from a public form.
--
-- Registration now requires an invite. The invite names the workspace, so
-- "which workspace does a signup join" stops being a defaulting question
-- altogether — it is answered by whoever issued the invite.

CREATE TABLE IF NOT EXISTS workspace_invites (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- The invite is bound to ONE address. register() checks the submitted email
    -- against this, so a leaked link cannot be redeemed by someone else.
    email        VARCHAR(255) NOT NULL,

    -- SHA-256 of the token, never the token. A leaked table is then a list of
    -- hashes rather than a set of working invite links — the same reasoning that
    -- will apply to password-reset tokens.
    token_hash   VARCHAR(64) NOT NULL,

    -- Role granted on acceptance. Chosen by the inviter, never by the invitee,
    -- so self-signup can no longer decide its own privileges.
    role         VARCHAR(50) NOT NULL DEFAULT 'sales',

    invited_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Single-use and time-boxed. Both are enforced in the controller; these
    -- columns are what make that enforceable rather than advisory.
    expires_at   TIMESTAMPTZ NOT NULL,
    accepted_at  TIMESTAMPTZ,

    revoked_at   TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lookup is BY HASH: register() hashes the presented token and finds the row,
-- so the token itself is never compared in SQL or logged in a query.
CREATE UNIQUE INDEX IF NOT EXISTS workspace_invites_token_hash_key
  ON workspace_invites (token_hash);

-- One live invite per address per workspace. Re-inviting is expected, so this
-- only covers invites that are still open — accepted and revoked rows accumulate
-- as an audit trail rather than blocking a re-send.
CREATE UNIQUE INDEX IF NOT EXISTS workspace_invites_open_email_key
  ON workspace_invites (workspace_id, lower(email))
  WHERE accepted_at IS NULL AND revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_workspace_invites_workspace
  ON workspace_invites (workspace_id, created_at DESC);
