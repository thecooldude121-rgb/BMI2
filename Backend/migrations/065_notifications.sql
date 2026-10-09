-- 065: notifications — the internal feed behind the bell and the Inbox
-- (Group A item 5; event list approved by Venkat 2026-10-10).
--
-- One row per RECIPIENT per event, written by the controller in the SAME
-- transaction as the change it reports, so a notification can never describe a
-- write that rolled back. Four stored types, each about a record the
-- recipient owns, never about their own action:
--   lead_assigned        a lead's owner became you
--   deal_assigned        a deal's owner became you
--   deal_stage_changed   a deal you own changed stage
--   lead_converted       a lead you own was converted
-- Follow-ups due today / overdue are NOT stored: they are read live from tasks
-- (they would otherwise go stale the moment the follow-up moves).
--
-- Tenant consistency is enforced in the database, not only the controller:
-- recipient and actor are COMPOSITE references to users (id, tenant_id), the
-- arrangement 044 uses for user_sales_profiles. entity_id is a loose reference
-- (leads.id is an integer, deals.id a varchar), validated by the writer, and
-- a pair CHECK keeps entity_type to the two tables the types can name.

CREATE TABLE notifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL,
  user_id       integer NOT NULL,
  type          varchar(32) NOT NULL
                CHECK (type IN ('lead_assigned', 'deal_assigned', 'deal_stage_changed', 'lead_converted')),
  entity_type   varchar(16) NOT NULL CHECK (entity_type IN ('lead', 'deal')),
  entity_id     varchar(64) NOT NULL,
  -- The record's name AT THE TIME of the event (a deleted record keeps a readable row).
  entity_name   text,
  actor_user_id integer,
  -- Type-specific facts, e.g. {"from_stage": "...", "to_stage": "..."}.
  detail        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  read_at       timestamptz,
  CONSTRAINT notifications_type_entity_check CHECK (
    (type IN ('lead_assigned', 'lead_converted') AND entity_type = 'lead') OR
    (type IN ('deal_assigned', 'deal_stage_changed') AND entity_type = 'deal')
  ),
  CONSTRAINT notifications_not_self CHECK (actor_user_id IS DISTINCT FROM user_id),
  CONSTRAINT notifications_user_fkey FOREIGN KEY (user_id, tenant_id)
    REFERENCES users (id, tenant_id) ON DELETE CASCADE,
  CONSTRAINT notifications_actor_fkey FOREIGN KEY (actor_user_id, tenant_id)
    REFERENCES users (id, tenant_id) ON DELETE SET NULL (actor_user_id)
);

CREATE INDEX notifications_feed_idx   ON notifications (tenant_id, user_id, created_at DESC);
CREATE INDEX notifications_unread_idx ON notifications (tenant_id, user_id) WHERE read_at IS NULL;
