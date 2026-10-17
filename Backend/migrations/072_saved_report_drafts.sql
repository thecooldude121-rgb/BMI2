-- 072 — saved reports can be DRAFTS. Reports replay step f, decided by Venkat
-- 2026-10-17 ("Real draft state").
--
-- A draft is private to its owner: hidden from grantees and from admins (even
-- when the report is ownerless), and it cannot be shared until it is saved. The
-- visibility rule lives in the access predicates (services/reports/access.ts):
-- a grant counts only on a SAVED report, so even a grant row that somehow
-- exists on a draft gives nobody access to it.
--
-- One direction only: draft -> saved. A saved report never goes back to draft
-- (it may already be shared, and "unsharing by drafting" would hide it from
-- people without telling them) — enforced by the controller.
--
-- Existing rows become 'saved', which is what they are. The default stays
-- 'saved' so a caller that does not mention status keeps today's behaviour.

ALTER TABLE saved_reports
  ADD COLUMN IF NOT EXISTS status VARCHAR(10) NOT NULL DEFAULT 'saved';

ALTER TABLE saved_reports
  ADD CONSTRAINT saved_reports_status_check CHECK (status IN ('draft', 'saved'));
