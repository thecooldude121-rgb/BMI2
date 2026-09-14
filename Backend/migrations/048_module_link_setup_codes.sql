-- Migration 048: single-use setup codes, so Lead Gen can DELIVER its API key
-- instead of an admin pasting it in.
--
-- THE BOOTSTRAP PROBLEM
-- module_links (047) holds a credential this CRM uses to call Lead Gen. Getting
-- that credential here is a chicken-and-egg: Lead Gen has to authenticate to us
-- to hand it over, and the thing that would authenticate it is the very secret
-- being handed over. Something has to go first.
--
-- THIS CODEBASE ALREADY SOLVES EXACTLY THIS, so nothing new is invented here.
-- Registration is invite-only: an admin mints a token, only its SHA-256 hash is
-- stored, the token travels out of band, and redeeming it is the one
-- unauthenticated write in the API. workspace_invites (migration 024) is that
-- table and this one is deliberately its twin -- same hashed-token column, same
-- expires_at / consumed / revoked triple, same "claim it with a conditional
-- UPDATE" single-use rule. A setup code is an invite for a machine.
--
-- WHY A SEPARATE TABLE RATHER THAN REUSING workspace_invites
-- That table's rows mean "a person may create a user account with this role",
-- enforced by a NOT NULL email and a role column. A code redeemed by another
-- module creates no user and has no role, and overloading it would mean making
-- both columns nullable -- after which a bug could let a machine code mint a
-- human account. Two tables, two meanings.
--
-- WHY ONLY THE HASH IS STORED
-- Same rule as the invite: a leaked table is then a list of digests rather than
-- a set of working codes, and lookup is by hash so the code itself never
-- appears in a query or a log.
--
-- EXPIRY IS SHORT ON PURPOSE. An invite lives 7 days because a person has to
-- read an email and find time. A setup code is pasted into another admin
-- console within minutes, so it expires in 20 -- the window in which it is
-- useful to an attacker is the window in which it is useful at all.

CREATE TABLE IF NOT EXISTS module_link_setup_codes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Which module this code installs a link for. The REDEEM path reads the
  -- module from this row and never from the request body: a code minted for
  -- Lead Gen must not be redeemable into some other module's slot.
  module      VARCHAR(30) NOT NULL,

  -- SHA-256 hex, exactly as workspace_invites.token_hash.
  code_hash   VARCHAR(64) NOT NULL,

  expires_at  TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  revoked_at  TIMESTAMPTZ,
  created_by  INTEGER     REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The lookup index, and the guarantee that two codes can never collide.
CREATE UNIQUE INDEX IF NOT EXISTS module_link_setup_codes_code_hash_key
  ON module_link_setup_codes (code_hash);

-- At most ONE open code per workspace per module, mirroring
-- workspace_invites_open_email_key. Regenerating therefore has to revoke the
-- previous code rather than leave two valid ones outstanding -- an admin who
-- regenerates because they think the first leaked would otherwise be leaving
-- the leaked one live.
CREATE UNIQUE INDEX IF NOT EXISTS module_link_setup_codes_open_key
  ON module_link_setup_codes (tenant_id, module)
  WHERE consumed_at IS NULL AND revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_module_link_setup_codes_tenant
  ON module_link_setup_codes (tenant_id, created_at DESC);

ALTER TABLE module_link_setup_codes DROP CONSTRAINT IF EXISTS module_link_setup_codes_module_check;
ALTER TABLE module_link_setup_codes ADD CONSTRAINT module_link_setup_codes_module_check
  CHECK (module IN ('lead-gen'));
