-- Migration 017: make the documents table fit to have an API.
--
-- `documents` exists with 0 rows and no controller. The frontend's
-- documentsService talks to SUPABASE instead — a second backend that has no
-- credentials configured (lib/supabase.ts falls back to placeholder.supabase.co
-- when VITE_SUPABASE_URL is unset, and there is no .env in Frontend/). So every
-- document call fails at runtime and DocumentsLibrary quietly falls back to
-- MOCK_DOCUMENTS, on error AND on empty.
--
-- This migration prepares the Postgres table so documents can live with the
-- rest of the data, on the same backend, with the same tenancy rules.

-- ── 1. tenant_id — REQUIRED before this table is exposed ────────────────────
-- Same rule as meetings in migration 015: a table with no tenancy must not get
-- an API. Documents are the most sensitive content in a CRM — contracts,
-- proposals, signed agreements.
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

UPDATE documents
SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1)
WHERE tenant_id IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'tenant_id' AND is_nullable = 'YES'
  ) AND NOT EXISTS (SELECT 1 FROM documents WHERE tenant_id IS NULL) THEN
    ALTER TABLE documents ALTER COLUMN tenant_id SET NOT NULL;
  END IF;
END $$;

-- ── 2. columns the document library actually displays ──────────────────────
-- The service's Document type carries category, description and an updated
-- timestamp; the table had none of them.
ALTER TABLE documents ADD COLUMN IF NOT EXISTS category    VARCHAR(64);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ DEFAULT NOW();

-- `module` / `record_id` is the existing polymorphic pair (same shape as tasks).
-- Kept as-is; the 0 rows do not justify restructuring it now.
CREATE INDEX IF NOT EXISTS idx_documents_tenant   ON documents (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_related  ON documents (module, record_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents (tenant_id, category);

-- ── 3. favourites, per user ────────────────────────────────────────────────
-- documentsService exposes toggleFavorite/getUserFavorites, which the library
-- calls. A favourite is per-user, so it cannot be a boolean on the document —
-- that would make one person's star visible to everyone.
-- NOTE ON TYPES: users.id is INTEGER, not UUID. Most id columns in this schema
-- are UUID (documents, tenants) or a prefixed varchar (deals D001, contacts
-- CT001, companies C001, tasks T001) — users is the odd one out. Getting this
-- wrong is a hard failure at CREATE TABLE ("foreign key constraint cannot be
-- implemented"), which is how it was caught.
CREATE TABLE IF NOT EXISTS document_favorites (
  document_id UUID        NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id     INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id   UUID        NOT NULL REFERENCES tenants(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (document_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_document_favorites_user ON document_favorites (user_id, tenant_id);

-- NOT ADDED, deliberately: no storage columns beyond the existing file_url, and
-- no shares or download-tracking tables. Uploading and downloading need a
-- decision about where the bytes live (object storage, local disk, or a bytea
-- column) that has not been made. Inventing one here would produce a second
-- half-built subsystem — which is the pattern this whole remediation is undoing.
