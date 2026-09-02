-- Migration 033: fix a latent id collision introduced by migration 031.
--
-- THE BUG, and it was mine: Postgres `lpad(string, length, fill)` TRUNCATES
-- when the string is longer than `length`. JavaScript's padStart never does.
-- Migration 031 replaced
--     `C${String(n).padStart(3, '0')}`
-- with
--     'C' || LPAD(nextval('companies_id_seq')::text, 3, '0')
-- and asserted in its own comment that the two were equivalent past 999. They
-- are not:
--     lpad('999',  3, '0') = '999'
--     lpad('1000', 3, '0') = '100'   <-- truncated
--     lpad('1007', 3, '0') = '100'   <-- same value again
--     lpad('2500', 3, '0') = '250'
--
-- So from the 1000th row onward every generated id repeats one already issued,
-- and EVERY create fails on the primary key. That is worse than the race
-- migration 031 fixed: the race lost occasional writes under concurrency, this
-- would have made all creates fail permanently once a table passed 999 rows,
-- and it would have arrived as the same masked 500.
--
-- HOW IT WAS CAUGHT: the concurrency suite added alongside creates hundreds of
-- rows per run, so the test database crossed 999 and the CSV import tests began
-- failing intermittently with `duplicate key value violates unique constraint
-- "contacts_pkey"` — rows 2, 3 and 4 of one import colliding with row 0,
-- because all four had been handed the same id.
--
-- NO LIVE DATA WAS AFFECTED. Verified before writing this: the live sequences
-- were at contacts 21, companies 16, deals 54, tasks 16 — all far below 999 —
-- so no row was ever issued a truncated id, and nothing needs repairing. Only
-- the generator was wrong.
--
-- THE FIX: pad without truncating, via a helper that calls nextval exactly once.
-- A CASE inline in each DEFAULT would need nextval twice (once to test, once to
-- emit) and would therefore consume two values per row, so the sequence value
-- is captured in a FROM clause instead.

CREATE OR REPLACE FUNCTION next_prefixed_id(p_prefix text, p_seq text)
RETURNS varchar
LANGUAGE sql
VOLATILE
AS $$
  SELECT p_prefix || CASE
           WHEN n < 1000 THEN lpad(n::text, 3, '0')  -- C001 .. C999, unchanged
           ELSE n::text                              -- C1000, C1001, ... no truncation
         END
  FROM nextval(p_seq::regclass) AS n;
$$;

COMMENT ON FUNCTION next_prefixed_id(text, text) IS
  'Generates a prefixed sequential id (C001 .. C999, then C1000 onward). Pads to '
  '3 digits WITHOUT lpad''s truncation, which silently repeated ids past 999. '
  'Calls nextval once per row.';

ALTER TABLE contacts  ALTER COLUMN id SET DEFAULT next_prefixed_id('CT', 'contacts_id_seq');
ALTER TABLE companies ALTER COLUMN id SET DEFAULT next_prefixed_id('C',  'companies_id_seq');
ALTER TABLE deals     ALTER COLUMN id SET DEFAULT next_prefixed_id('D',  'deals_id_seq');
ALTER TABLE tasks     ALTER COLUMN id SET DEFAULT next_prefixed_id('T',  'tasks_id_seq');
