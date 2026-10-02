-- Migration 055: record every lead stage change, including qualification overrides.
--
-- Step 5, slice A. Ratified 2026-10-03 (Venkat): every lead stage change goes
-- through POST /leads/:id/stage-transition, and PUT /leads/:id no longer accepts
-- `stage`. This table is what that endpoint writes.
--
-- WHY
-- A lead's stage was an untracked overwrite on PUT /leads/:id: any stage to any
-- stage, no history, and the one rule the product has — only a manager or admin
-- may move a lead to Qualified when it fails the qualification criteria — lived
-- only in the browser. The override was not even recorded server-side; the only
-- trace was a localStorage audit entry on the machine that made it.
--
-- SHAPE — modelled on deal_stage_history (014), with two deliberate differences:
--   * changed_by_user_id is a real reference, not a display name. 014 stored a
--     name and left a TODO; a name is the defect migrations 039-043 removed.
--     The display name is ALSO captured (changed_by_name), the forecast_snapshots
--     decision: identity by reference, display by capture.
--   * qualification_override + unmet_criteria record WHAT was overridden, not
--     just that something was. An override with no record of the failed
--     criteria cannot be reviewed.

CREATE TABLE IF NOT EXISTS lead_stage_history (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id                 INTEGER      NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  from_stage              VARCHAR(32),            -- NULL only if a lead ever had none
  to_stage                VARCHAR(32)  NOT NULL,
  qualification_override  BOOLEAN      NOT NULL DEFAULT false,
  -- Criteria ids that failed and were overridden, e.g. {contact_method,last_contact}.
  unmet_criteria          TEXT[]       NOT NULL DEFAULT '{}',
  reason                  TEXT,
  -- ON DELETE SET NULL (column list, PG15+): history outlives the person, and
  -- tenant_id must stay — a plain SET NULL on a composite key would null it too.
  changed_by_user_id      INTEGER,
  changed_by_name         VARCHAR(255),
  changed_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  tenant_id               UUID         NOT NULL REFERENCES tenants(id),

  -- Tenant-consistent actor: the user must belong to the history row's workspace.
  CONSTRAINT lead_stage_history_actor_fkey
    FOREIGN KEY (changed_by_user_id, tenant_id) REFERENCES users (id, tenant_id)
    ON DELETE SET NULL (changed_by_user_id),

  -- An override is only meaningful on a move to Qualified, must say what it
  -- overrode, and must carry a reason. Enforced here as well as in the
  -- controller: a controller guard binds one writer.
  CONSTRAINT lead_stage_history_override_shape CHECK (
    NOT qualification_override
    OR (to_stage = 'qualified'
        AND cardinality(unmet_criteria) > 0
        AND reason IS NOT NULL AND length(btrim(reason)) > 0)
  )
);

-- Every read is "history for this lead, newest first".
CREATE INDEX IF NOT EXISTS idx_lead_stage_history_lead
  ON lead_stage_history (lead_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_stage_history_tenant
  ON lead_stage_history (tenant_id);
