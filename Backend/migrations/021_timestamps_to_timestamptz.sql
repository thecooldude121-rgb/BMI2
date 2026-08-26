-- Migration 021: every timestamp column becomes timestamptz.
--
-- THE BUG THIS CLOSES
--
-- 50 columns were `timestamp WITHOUT time zone` while 29 others were already
-- `timestamptz` — often in the SAME TABLE. leads.created_at was naive and
-- leads.updated_at was aware; tasks.created_at naive, tasks.completed_at and
-- tasks.updated_at aware. One row, two conventions.
--
-- A naive column cannot represent an instant, only a wall-clock reading. The
-- server writes those columns with NOW(), which for that type yields local wall
-- clock. So when a client sent a proper ISO instant ("2026-12-01T09:00:00.000Z")
-- the driver SILENTLY DROPPED the offset and stored the UTC hour as though it
-- were local.
--
-- The damage was visible inside a single row. An activity logged at 14:32 local
-- was stored with created_at 14:32 (NOW()) and completed_at 09:02 (an ISO
-- string) — completed five and a half hours before it was created. A meeting a
-- user scheduled for 14:30 was stored, and shown back, as 09:00. Phase 3 (14/n)
-- patched the two activities write paths in SQL; this removes the cause instead,
-- for every table, so no future writer has to know which convention a column
-- follows.
--
-- WHY THIS IS SAFE FOR READS
--
-- node-postgres parses a naive timestamp in the Node process's local zone, so
-- with the API and the database in the same zone a naive and an aware column
-- already serialise to the SAME JSON:
--
--   '2026-12-01 14:30'::timestamp    -> "2026-12-01T09:00:00.000Z"
--   '2026-12-01 14:30'::timestamptz  -> "2026-12-01T09:00:00.000Z"
--
-- Verified against the driver before writing this. So the frontend sees no
-- change today, and stops depending on the API server and Postgres sharing a
-- timezone — which is the other half of the same bug, latent until deployment.
--
-- WHY THE CONVERSION IS CORRECT FOR EXISTING DATA
--
-- `x AT TIME ZONE current_setting('TimeZone')` reads each naive value as a wall
-- clock in the database's own zone, which is exactly how it was written:
--   - values from NOW() are local wall clock
--   - seeded values are midnight dates ('2026-01-10 00:00:00') and stay midnight
-- Checked for the corruption signature first (a naive column sitting exactly one
-- UTC offset away from an aware sibling) and found none outside the activities
-- rows already discarded in 14/n.
--
-- Defaults survive untouched: 46 of the 50 default to now(), which is valid for
-- both types. There are no views (which would block ALTER TYPE), no generated
-- columns, and no CHECK constraints on any of them.

DO $$
DECLARE
  col RECORD;
  converted INT := 0;
BEGIN
  -- A loop rather than 50 hand-written ALTERs: the point of this migration is
  -- that NO column is left on the old convention, and a hand-written list is
  -- one omission away from recreating the mixed state it exists to remove.
  -- Re-running converts whatever is still naive, so it is idempotent.
  FOR col IN
    SELECT c.table_name, c.column_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema AND t.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND c.data_type = 'timestamp without time zone'
      -- Only real tables; a view cannot be altered this way and there are none,
      -- but the join keeps that true if one is added later.
      AND t.table_type = 'BASE TABLE'
    ORDER BY c.table_name, c.column_name
  LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ALTER COLUMN %I TYPE timestamptz USING %I AT TIME ZONE current_setting(''TimeZone'')',
      col.table_name, col.column_name, col.column_name
    );
    converted := converted + 1;
  END LOOP;

  RAISE NOTICE 'migration 021: converted % timestamp columns to timestamptz', converted;
END $$;
