-- Migration 001: Add structured next step fields to deals table.
-- Complements the existing `next_step` (TEXT) with a due date, responsible
-- owner, and completion status so next steps are actionable rather than just
-- descriptive text.
--
-- Safe to run multiple times (uses ADD COLUMN IF NOT EXISTS).

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS next_step_due_date DATE,
  ADD COLUMN IF NOT EXISTS next_step_owner    TEXT,
  ADD COLUMN IF NOT EXISTS next_step_status   TEXT DEFAULT 'pending'
    CONSTRAINT next_step_status_check
      CHECK (next_step_status IN ('pending', 'done', 'overdue'));

COMMENT ON COLUMN deals.next_step          IS 'Free-text description of the next action';
COMMENT ON COLUMN deals.next_step_due_date IS 'Date by which the next step must be completed';
COMMENT ON COLUMN deals.next_step_owner    IS 'Person responsible for executing the next step';
COMMENT ON COLUMN deals.next_step_status   IS 'Completion state: pending | done | overdue';
