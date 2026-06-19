-- Migration 007: Extend lead_views with saved-view metadata fields.
-- Safe to run multiple times — ADD COLUMN IF NOT EXISTS is a no-op when
-- the column already exists.

ALTER TABLE lead_views
  ADD COLUMN IF NOT EXISTS is_pinned    BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS view_order   INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS visibility   VARCHAR(20) NOT NULL DEFAULT 'private'
                                        CHECK (visibility IN ('private','team','organization')),
  ADD COLUMN IF NOT EXISTS search_query TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS view_mode    VARCHAR(10) NOT NULL DEFAULT 'list'
                                        CHECK (view_mode IN ('list','grid','kanban')),
  ADD COLUMN IF NOT EXISTS icon         VARCHAR(50) NOT NULL DEFAULT 'list';
