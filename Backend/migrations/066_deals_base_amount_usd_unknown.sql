-- 066: deals.base_amount_usd may be UNKNOWN (NULL) — decided by Venkat 2026-10-11.
--
-- base_amount_usd is the deal's value in USD for cross-currency totals. This
-- server holds NO exchange rates (the static table lives in the browser's
-- currencyUtils), so when a non-USD deal arrives without a converted amount the
-- honest value is "unknown". Two write paths stored the NATIVE amount instead
-- (createDeal fell back to `value`; lead conversion copied `value`), so INR
-- 125,000 became USD 125,000 — and the column's NOT NULL DEFAULT 0 would make
-- any omitted amount a fabricated USD 0.
--
-- Decision (2026-10-11): store unknown rather than the raw non-USD number;
-- do NOT reject the deal; do NOT build server-side conversion.
--
-- Readers already treat NULL as "not in USD": the board's stage summary counts
-- it as unconverted instead of summing it, list sorting puts it last, and the
-- browser's "≈ $" estimates fall back to their labelled client-side rates.

ALTER TABLE deals ALTER COLUMN base_amount_usd DROP DEFAULT;
ALTER TABLE deals ALTER COLUMN base_amount_usd DROP NOT NULL;

-- Rows already carrying a native amount as USD become unknown. A non-USD value
-- whose "USD" equals the native number is that defect (no real rate is 1.0 for
-- the currencies in use). 0 rows on bmi_crm and bmi_crm_iso_test when written;
-- kept so another environment is corrected the same way.
UPDATE deals
   SET base_amount_usd = NULL
 WHERE upper(coalesce(currency, 'USD')) <> 'USD'
   AND base_amount_usd = value;
