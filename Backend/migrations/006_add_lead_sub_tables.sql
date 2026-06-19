-- Migration 006: Add lead sub-tables and adapt existing generic tables.
-- Safe to run multiple times — uses IF NOT EXISTS and IF EXISTS guards.

-- ── 1. Auto-generate IDs for existing generic tables that need it ─────────────
ALTER TABLE activities
  ALTER COLUMN id SET DEFAULT substring(replace(gen_random_uuid()::text, '-', ''), 1, 9);

-- ── 2. Widen activities constraints to cover all LeadActivity types ────────────
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_type_check;
ALTER TABLE activities ADD CONSTRAINT activities_type_check
  CHECK (type IN ('call','email','meeting','task','note','sms','whatsapp',
                  'linkedin','demo','proposal','document','visit'));

ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_status_check;
ALTER TABLE activities ADD CONSTRAINT activities_status_check
  CHECK (status IN ('planned','completed','cancelled','no_show','rescheduled'));

-- ── 3. New lead-specific sub-tables (INTEGER lead_id to match leads.id) ────────

CREATE TABLE IF NOT EXISTS lead_notes (
  id         BIGSERIAL    PRIMARY KEY,
  lead_id    INTEGER      NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  content    TEXT         NOT NULL,
  is_pinned  BOOLEAN      NOT NULL DEFAULT FALSE,
  is_private BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_by TEXT         NOT NULL DEFAULT '',
  is_deleted BOOLEAN      NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON lead_notes(lead_id);

CREATE TABLE IF NOT EXISTS lead_tasks (
  id           BIGSERIAL    PRIMARY KEY,
  lead_id      INTEGER      NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  title        TEXT         NOT NULL,
  description  TEXT,
  task_type    TEXT,
  priority     TEXT         NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low','medium','high','urgent')),
  status       TEXT         NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','in_progress','completed','cancelled','deferred')),
  due_date     TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  assigned_to  TEXT         NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_by   TEXT         NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_lead_id ON lead_tasks(lead_id);

CREATE TABLE IF NOT EXISTS lead_emails (
  id          BIGSERIAL    PRIMARY KEY,
  lead_id     INTEGER      NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  direction   TEXT         NOT NULL DEFAULT 'outbound'
    CHECK (direction IN ('inbound','outbound')),
  from_email  TEXT         NOT NULL,
  to_emails   TEXT[]       NOT NULL DEFAULT '{}',
  cc_emails   TEXT[]       NOT NULL DEFAULT '{}',
  subject     TEXT         NOT NULL,
  body_text   TEXT,
  body_html   TEXT,
  template_id TEXT,
  sent_at     TIMESTAMPTZ,
  status      TEXT         NOT NULL DEFAULT 'sent',
  open_count  INTEGER      NOT NULL DEFAULT 0,
  click_count INTEGER      NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_by  TEXT         NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_lead_emails_lead_id ON lead_emails(lead_id);

CREATE TABLE IF NOT EXISTS lead_calls (
  id               BIGSERIAL    PRIMARY KEY,
  lead_id          INTEGER      NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  direction        TEXT         NOT NULL DEFAULT 'outbound'
    CHECK (direction IN ('inbound','outbound')),
  duration_seconds INTEGER,
  outcome          TEXT,
  disposition      TEXT,
  notes            TEXT,
  started_at       TIMESTAMPTZ,
  ended_at         TIMESTAMPTZ,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_by       TEXT         NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_lead_calls_lead_id ON lead_calls(lead_id);

CREATE TABLE IF NOT EXISTS lead_meetings (
  id               BIGSERIAL    PRIMARY KEY,
  lead_id          INTEGER      NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  title            TEXT         NOT NULL,
  description      TEXT,
  meeting_type     TEXT,
  scheduled_at     TIMESTAMPTZ  NOT NULL,
  duration_minutes INTEGER      NOT NULL DEFAULT 30,
  location         TEXT,
  meeting_url      TEXT,
  attendees        TEXT[]       NOT NULL DEFAULT '{}',
  status           TEXT         NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned','completed','cancelled','no_show','rescheduled')),
  notes            TEXT,
  outcome          TEXT,
  next_steps       TEXT,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_by       TEXT         NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_lead_meetings_lead_id ON lead_meetings(lead_id);

-- ── 4. tags and lead_views already exist from prior run ───────────────────────
-- (IF NOT EXISTS makes these no-ops if already present)
CREATE TABLE IF NOT EXISTS tags (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL UNIQUE,
  color       TEXT,
  description TEXT,
  category    TEXT,
  usage_count INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lead_views (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  description TEXT,
  filters     JSONB       NOT NULL DEFAULT '{}',
  sort_by     TEXT,
  sort_order  TEXT        NOT NULL DEFAULT 'desc',
  columns     TEXT[]      NOT NULL DEFAULT '{}',
  is_default  BOOLEAN     NOT NULL DEFAULT FALSE,
  is_public   BOOLEAN     NOT NULL DEFAULT TRUE,
  is_system   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_by  TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
