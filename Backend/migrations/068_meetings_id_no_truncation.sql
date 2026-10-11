-- Migration 068: meetings.id stops repeating itself past MTG999.
--
-- THE SAME BUG MIGRATION 033 FIXED, REINTRODUCED BY 049. Postgres lpad()
-- TRUNCATES a string longer than its length, so 049's default
--     'MTG' || LPAD(nextval('meetings_id_seq')::text, 3, '0')
-- turns 1000..1009 all into 'MTG100', 1041 into 'MTG104', and so on — from the
-- 1000th meeting every create collides with an id already issued and fails on
-- the primary key as a masked 500. 033 replaced this exact pattern on contacts,
-- companies, deals and tasks with next_prefixed_id(); 049 was written later
-- and copied the pattern 033 had removed.
--
-- HOW IT WAS FOUND (2026-10-11, slice 4a): the test database's sequence crossed
-- 999 and roundTrip.meetings began failing on every create, deterministically.
--
-- NO LIVE DATA IS AFFECTED: live meetings_id_seq is at 1 with 0 meetings, so no
-- truncated id was ever issued there and nothing needs repairing. Only the
-- generator changes. Ids below 1000 are byte-identical (MTG001 .. MTG999);
-- from 1000 they continue as MTG1000, MTG1001 … — varchar(10) holds seven digits.

ALTER TABLE meetings ALTER COLUMN id SET DEFAULT next_prefixed_id('MTG', 'meetings_id_seq');
