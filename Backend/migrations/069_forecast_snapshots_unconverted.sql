-- Migration 069: forecast snapshots record how many deals were NOT in USD.
--
-- Group A item 4, slice 5c (2026-10-13). Snapshots are now computed by the
-- SERVER (POST /forecast/snapshots takes a period, never figures): the browser
-- used to POST per-rep totals it had summed from the 500 newest deals, adding
-- native amounts across currencies, and those capped figures became permanent
-- history.
--
-- Server totals sum only a trustworthy base_amount_usd (the 5a / 5b rule). A
-- snapshot that stored only those sums would silently omit every non-USD deal,
-- so the count of deals left out is stored beside them.
--
-- NULL = not recorded: every row written before this migration (3 live rows,
-- 2026-09-24) was computed by the browser and may mix currencies. They are left
-- exactly as they are — rewriting history would be inventing it — and the page
-- labels them. No data changes here.

ALTER TABLE forecast_snapshots ADD COLUMN unconverted integer;
ALTER TABLE forecast_snapshots ADD CONSTRAINT forecast_snapshots_unconverted_check
  CHECK (unconverted IS NULL OR unconverted >= 0);
