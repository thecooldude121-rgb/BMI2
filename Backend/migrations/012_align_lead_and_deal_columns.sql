-- Migration 012: close the remaining gaps between what the controllers write
-- and what the tables actually have.
--
-- Each item below was verified against information_schema and the live rows.

-- ── 1. leads.custom_fields ──────────────────────────────────────────────────
-- leadsController lists custom_fields in UPDATABLE_FIELDS and JSON.stringify's
-- it on insert; leadsApi.ts:50 reads row.custom_fields. The column never
-- existed, so every write referencing it failed.
--
-- NOTE ON REDUNDANCY: custom_field_definitions and custom_field_values tables
-- also exist, with no API and no code touching them. A JSONB blob on the row is
-- what the application already assumes, so that is what this adds. If the EAV
-- tables are ever wired up, reconcile the two — do not run both.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';

-- ── 2. leads.tags: text (semicolon-delimited) -> text[] ─────────────────────
-- The live column is `text` holding values like 'enterprise;inbound'. The
-- frontend does `Array.isArray(row.tags) ? row.tags : []` (leadsApi.ts:49), so a
-- string always failed that check and EVERY lead rendered with no tags — the
-- existing tag data has never been visible in the UI.
--
-- Meanwhile the controller wrote JSON.stringify(tags), i.e. '["a","b"]', into
-- that same text column, so writes and existing rows disagreed on format too.
--
-- Converting to text[] fixes both and matches deals.tags, which is already
-- text[]. The USING clause splits on ';' so the 38 existing rows keep their
-- tags — and start displaying for the first time.
-- NOTE: ALTER COLUMN ... USING cannot contain a sub-SELECT (Postgres rejects it
-- in transformSubLink), so the conversion is done with a plain string_to_array
-- and the elements are trimmed/de-blanked by a follow-up UPDATE.
DO $$
BEGIN
  IF (
    SELECT data_type FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'tags'
  ) = 'text' THEN
    ALTER TABLE leads
      ALTER COLUMN tags TYPE text[]
      USING CASE
        WHEN tags IS NULL OR btrim(tags) = '' THEN '{}'::text[]
        ELSE string_to_array(btrim(tags), ';')
      END;
    ALTER TABLE leads ALTER COLUMN tags SET DEFAULT '{}';
  END IF;
END $$;

-- Trim whitespace and drop empty elements left by trailing/double separators.
UPDATE leads
SET tags = COALESCE(
  (SELECT array_agg(btrim(t)) FROM unnest(tags) AS t WHERE btrim(t) <> ''),
  '{}'::text[]
)
WHERE tags IS NOT NULL
  AND EXISTS (SELECT 1 FROM unnest(tags) AS t WHERE t <> btrim(t) OR btrim(t) = '');

-- ── 3. deals.value_history ──────────────────────────────────────────────────
-- dealsController.updateDeal SELECTs value_history before every update that
-- includes `value`, then writes an appended history entry. The column does not
-- exist, so changing a deal's amount — the single most common edit in a CRM —
-- returned 500 every time.
ALTER TABLE deals ADD COLUMN IF NOT EXISTS value_history JSONB DEFAULT '[]';

-- ── 4. deals.momentum_score ─────────────────────────────────────────────────
-- Listed in dealsController's updatable fields, so any PUT carrying it 500'd.
-- NOTE: nothing writes this yet. Phase 0 removed the only writer, which fed it
-- from a hardcoded demo fixture and persisted the result on every page view.
-- utils/dealMomentum.ts is a sound engine with no real inputs; wire it to actual
-- activity data before populating this.
ALTER TABLE deals ADD COLUMN IF NOT EXISTS momentum_score VARCHAR(20);
