-- 044: per-user sales targets. Extends `quotas`; adds `user_sales_profiles`.
--
-- WHY NOT A NEW `user_targets` TABLE
-- `quotas` (042) is already "one target per user per period, inside one
-- workspace": tenant_id, user_id NOT NULL -> users ON DELETE CASCADE,
-- period_label, quota_amount, UNIQUE (tenant_id, user_id, period_label). A
-- parallel `user_targets` keyed the same way would be two rows answering "what
-- is this rep's target for Q3" that could disagree. So the per-PERIOD fields
-- land on `quotas`, and PUT /quotas stays the one write path for them.
--
-- WHY THE PER-PERSON FIELDS ARE A SEPARATE TABLE, not more `quotas` columns
-- Seniority, ramp start, territory and product line describe the person, not a
-- period. Stored on `quotas` they would be copied onto every quarter's row and
-- drift the first time someone edited one quarter and not the next. Stored on
-- `users` they would widen the identity table that Lead Generation and HRMS
-- authenticate against (see CLAUDE.md, Identity & SSO) with sales-only data.
-- A 1:1 table keyed on user_id carries them once.
--
-- WHAT IS DELIBERATELY NOT HERE
--   * A manager column. `users.manager_id` (041) is the reporting line; this
--     reuses it rather than adding a second one to disagree with.
--   * Anything from `territories` or `products`. Both exist, both have 0 rows,
--     and NEITHER has a tenant_id — the same unscopable shape as `employees`.
--     `territories.manager_id` is even a varchar. Referencing either would
--     import that defect, so territory and product line are validated free
--     text until a scoped vocabulary exists.
--   * Role. `users.role` has its own guarded write path (PATCH /users/:id/role,
--     four guards). A second place to change it would be a second place for
--     those guards to be missing.
--   * A stored "pipeline quota". Required pipeline is COMPUTED from the revenue
--     quota and historical win rate (services/targetProjection.ts). A manually
--     typed pipeline target stored beside it would be a second, unreconciled
--     answer to the same question.

-- ── 1. quotas.activity_targets ─────────────────────────────────────────────
-- Weekly activity targets: { calls_per_week, meetings_per_week, emails_per_week }.
-- JSONB because the set is expected to grow and is read as a unit, never
-- filtered on — the same reasoning as tenants.settings (035). Postgres cannot
-- type-check the keys, so quotasController validates them and rejects unknown
-- keys with a 400; the CHECK below only guarantees the document is an object,
-- so a stray array or scalar cannot be stored by a direct write.
--
-- '{}' means "no activity targets set", which is a real state and is reported
-- as absent by the API — not as zeros.
ALTER TABLE quotas
  ADD COLUMN IF NOT EXISTS activity_targets JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE quotas DROP CONSTRAINT IF EXISTS quotas_activity_targets_object_check;
ALTER TABLE quotas ADD CONSTRAINT quotas_activity_targets_object_check
  CHECK (jsonb_typeof(activity_targets) = 'object');

-- ── 2. quotas.currency ─────────────────────────────────────────────────────
-- A quota had no currency, and deals do not share one (live: 22 USD, 3 AED).
-- Comparing a bare number against a mixed-currency pipeline is not a
-- projection, so the quota now says what currency it is in, and the projection
-- counts only deals in that currency and REPORTS what it excluded. No exchange
-- rate is invented anywhere.
--
-- Backfill uses the same rule createDeal uses for a new deal: the workspace's
-- default_currency, else the column default of deals.currency ('USD'). Live
-- `quotas` has 0 rows, so on bmi_crm this backfills nothing; the UPDATE exists
-- so a copy that does hold rows reaches NOT NULL cleanly instead of failing.
ALTER TABLE quotas ADD COLUMN IF NOT EXISTS currency VARCHAR(3);

UPDATE quotas q
   SET currency = COALESCE(NULLIF(t.settings->>'default_currency', ''), 'USD')
  FROM tenants t
 WHERE t.id = q.tenant_id
   AND q.currency IS NULL;

ALTER TABLE quotas ALTER COLUMN currency SET NOT NULL;

ALTER TABLE quotas DROP CONSTRAINT IF EXISTS quotas_currency_shape_check;
ALTER TABLE quotas ADD CONSTRAINT quotas_currency_shape_check
  CHECK (currency ~ '^[A-Z]{3}$');

COMMENT ON COLUMN quotas.activity_targets IS
  'Weekly activity targets for this user and period. Keys validated in quotasController (ACTIVITY_TARGET_KEYS). {} means none set. Migration 044.';
COMMENT ON COLUMN quotas.currency IS
  'ISO 4217 currency of quota_amount. The projection counts only deals in this currency and reports the rest as excluded. Migration 044.';

-- ── 3. users (id, tenant_id) — the target of a composite foreign key ───────
-- users.id is already unique, so this adds no restriction on users at all. It
-- exists so the profile table below can reference (user_id, tenant_id)
-- TOGETHER, which makes a profile row whose tenant differs from its user's
-- tenant impossible AT THE DATABASE, not merely refused by the API.
--
-- That is stronger than the pattern every earlier FK in this schema uses
-- (global-id FK + app-side tenantScope check + tenant-matched join), and it is
-- used here because this table is new and can have it from day one. The
-- app-side check and the tenant-matched join are kept anyway: the constraint
-- is the backstop, the 400 is what a caller sees.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'users'::regclass AND conname = 'users_id_tenant_key'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_id_tenant_key UNIQUE (id, tenant_id);
  END IF;
END $$;

-- ── 4. user_sales_profiles ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_sales_profiles (
  user_id          INTEGER     PRIMARY KEY,
  tenant_id        UUID        NOT NULL REFERENCES tenants(id),
  -- Seniority is NOT role. Role decides permissions and has its own endpoint;
  -- seniority describes experience and decides nothing. Vocabulary mirrored in
  -- SENIORITY_LEVELS (utils/targets.ts), which the API serves to the UI.
  seniority        VARCHAR(20),
  ramp_start_date  DATE,
  territory        VARCHAR(100),
  product_line     VARCHAR(100),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- ON DELETE CASCADE for the same reason as quotas.user_id: a profile without
  -- its person describes nobody.
  CONSTRAINT user_sales_profiles_user_fkey
    FOREIGN KEY (user_id, tenant_id) REFERENCES users (id, tenant_id) ON DELETE CASCADE,

  CONSTRAINT user_sales_profiles_seniority_check
    CHECK (seniority IS NULL OR seniority IN ('junior', 'mid', 'senior', 'lead')),

  -- The D043 lesson (CLAUDE.md): a four-keystroke slip in a date field stored
  -- the year 262026 because nothing bounded it. This one is bounded from the
  -- start, and the API returns a 400 naming the field before this is reached.
  CONSTRAINT user_sales_profiles_ramp_start_range_check
    CHECK (ramp_start_date IS NULL
           OR ramp_start_date BETWEEN DATE '2000-01-01' AND DATE '2100-12-31'),

  -- Blank is not a territory. NULL is "not recorded"; an empty string would be
  -- a value that renders as nothing and groups as a category.
  CONSTRAINT user_sales_profiles_territory_not_blank
    CHECK (territory IS NULL OR btrim(territory) <> ''),
  CONSTRAINT user_sales_profiles_product_line_not_blank
    CHECK (product_line IS NULL OR btrim(product_line) <> '')
);

CREATE INDEX IF NOT EXISTS user_sales_profiles_tenant_idx
  ON user_sales_profiles (tenant_id);

COMMENT ON TABLE user_sales_profiles IS
  'Per-person sales attributes (seniority, ramp start, territory, product line). One row per user; absent row = nothing recorded. Tenant-consistent by composite FK. Migration 044.';
COMMENT ON COLUMN user_sales_profiles.ramp_start_date IS
  'Stored and displayed. NOT applied to the projection: how a ramping rep''s quota is prorated is a policy nobody has decided, so the projection does not guess one.';
