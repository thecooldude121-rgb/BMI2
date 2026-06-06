-- Migration 004: Forecast snapshot history.
-- Captures point-in-time per-rep pipeline state for a given period.
-- Enables slippage tracking (opening commit vs current commit) and
-- commit accuracy (snapshot commit vs actual closed-won).
--
-- Snapshots are written via POST /api/v1/forecast/snapshots.
-- The unique constraint allows one snapshot per rep per day per period;
-- re-running the snapshot on the same day overwrites rather than duplicates.

CREATE TABLE IF NOT EXISTS forecast_snapshots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_label  VARCHAR(20)   NOT NULL,             -- "Q2 2026"
  snapshot_date DATE          NOT NULL DEFAULT CURRENT_DATE,
  rep_name      VARCHAR(255)  NOT NULL,
  pipeline      NUMERIC(15,2) NOT NULL DEFAULT 0,
  best_case     NUMERIC(15,2) NOT NULL DEFAULT 0,
  commit        NUMERIC(15,2) NOT NULL DEFAULT 0,
  closed        NUMERIC(15,2) NOT NULL DEFAULT 0,
  deal_count    INTEGER       NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ   DEFAULT NOW(),
  UNIQUE(period_label, rep_name, snapshot_date)
);

COMMENT ON TABLE  forecast_snapshots              IS 'Point-in-time per-rep forecast captures for slippage and accuracy tracking.';
COMMENT ON COLUMN forecast_snapshots.period_label IS 'Quarter label matching ForecastPage, e.g. "Q2 2026".';
COMMENT ON COLUMN forecast_snapshots.snapshot_date IS 'Calendar date the snapshot was taken. One snapshot per rep per day per period.';
