-- Migration 014: record every deal stage change.
--
-- Reference: CRM_REMEDIATION_PLAN.md Phase 3, CRM spec §2.1 (DealStageHistory)
-- and §3.2 (POST /deals/{id}/stage-transition), user story US-CRM-006.
--
-- WHY
-- Stage is the single most-changed field on a deal and the basis of every
-- forecast. Until now a change was an untracked overwrite: there was no record
-- of who moved a deal, when, from where, or why. Slippage and stage-velocity
-- reporting are impossible without this, and so is answering "who moved this
-- deal to Closed Won".
--
-- WHY TEXT, NOT A STAGE FK
-- deals.stage is a free-text varchar. Its live values are frontend pipeline
-- slugs — prospecting, qualified, proposal, negotiation, closed-won,
-- closed-lost — plus partner-evaluation and renewal-quoted, which have no
-- matching row in pipeline_stages. pipeline_stages meanwhile uses display names
-- ('Closed Won'). Normalising the two vocabularies onto stage_id needs a
-- deliberate mapping decision and a data migration; it is NOT bundled here.
-- This table therefore mirrors the column it observes, and gains a stage_id
-- later without losing history.

CREATE TABLE IF NOT EXISTS deal_stage_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id      VARCHAR      NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  from_stage   VARCHAR(64),                    -- NULL for the first observed stage
  to_stage     VARCHAR(64)  NOT NULL,
  -- Probability actually stored on the deal after the transition, and whether a
  -- human overrode the stage default. Without this you cannot tell a rep's
  -- judgement apart from the pipeline's default when reviewing a forecast.
  probability          INTEGER,
  probability_override BOOLEAN NOT NULL DEFAULT false,
  reason_code  VARCHAR(64),                    -- e.g. 'budget-lost', 'timeline-slip'
  note         TEXT,
  -- Display name, matching deals.assigned_to / leads.assigned_to. Nullable so an
  -- automated transition can be recorded with no user attached.
  -- TODO(Phase 2): normalise to users.id along with the other owner columns.
  changed_by   VARCHAR(255),
  changed_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  tenant_id    UUID         NOT NULL REFERENCES tenants(id)
);

-- Every read is "history for this deal, newest first".
CREATE INDEX IF NOT EXISTS idx_deal_stage_history_deal
  ON deal_stage_history (deal_id, changed_at DESC);
-- Tenant-scoped like every other table.
CREATE INDEX IF NOT EXISTS idx_deal_stage_history_tenant
  ON deal_stage_history (tenant_id);
-- Supports "how long do deals sit in stage X" across the tenant.
CREATE INDEX IF NOT EXISTS idx_deal_stage_history_to_stage
  ON deal_stage_history (tenant_id, to_stage, changed_at DESC);
