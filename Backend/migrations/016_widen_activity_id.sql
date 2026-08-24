-- Migration 016: widen activities.id to fit the id that migration 015 generates.
--
-- Migration 015 replaced the id default with a full 32-character uuid hex to
-- avoid birthday collisions on what was a 9-character key. It did not check the
-- column width: activities.id is VARCHAR(10). The old default fit; the new one
-- does not, so every insert failed with
--   value too long for type character varying(10)
--
-- 015 is already applied and its checksum is locked by the runner, so this is a
-- new migration rather than an edit — which is the point of the lock.
--
-- 32 hex characters is a full uuid with the dashes stripped, matching the
-- default set in 015. The table is empty, so widening is free.

ALTER TABLE activities ALTER COLUMN id TYPE VARCHAR(32);
