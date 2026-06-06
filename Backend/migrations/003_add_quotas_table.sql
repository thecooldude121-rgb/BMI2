-- Migration 003: Per-rep per-quarter quota targets.
-- Stores the revenue quota for each rep for a given forecast period.
-- period_label matches the quarter label used in the Forecast page: "Q2 2026".
-- rep_name matches deals.assigned_to so joins are possible without a users FK.
--
-- Upsert pattern (INSERT … ON CONFLICT DO UPDATE) is the standard write path.

CREATE TABLE IF NOT EXISTS quotas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_name      VARCHAR(255) NOT NULL,
  period_label  VARCHAR(20)  NOT NULL,   -- e.g. "Q2 2026"
  quota_amount  NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rep_name, period_label)
);

COMMENT ON TABLE  quotas              IS 'Per-rep per-quarter sales quota targets.';
COMMENT ON COLUMN quotas.rep_name     IS 'Matches deals.assigned_to — no FK so unassigned deals still work.';
COMMENT ON COLUMN quotas.period_label IS 'Quarter label identical to ForecastPage getQuarterBounds().label, e.g. "Q2 2026".';
