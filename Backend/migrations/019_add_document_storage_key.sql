-- Migration 019: record where a document's bytes actually live on disk.
--
-- Documents got metadata CRUD in 017 with file storage explicitly deferred —
-- upload/download need somewhere for the bytes, and that was a decision to make
-- deliberately rather than guess. Local disk was chosen.
--
-- `storage_key` is the path RELATIVE to the storage root, never an absolute
-- path: the root is configurable (FILE_STORAGE_PATH) and moving it must not
-- invalidate every row. It is also never derived from the uploaded filename —
-- see documentsController for why that matters.
--
-- `file_url` keeps its existing meaning: the URL a client fetches. For locally
-- stored files that is the authenticated /documents/:id/content route, so the
-- bytes are never served straight off disk.

ALTER TABLE documents ADD COLUMN IF NOT EXISTS storage_key VARCHAR(512);

-- Checksum of the stored bytes, so a corrupted or truncated file can be
-- detected rather than silently served.
ALTER TABLE documents ADD COLUMN IF NOT EXISTS checksum_sha256 VARCHAR(64);

-- Only one row may claim a given path. Without this a bug that reused a key
-- would let one document's bytes be served under another's name.
CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_storage_key
  ON documents (storage_key)
  WHERE storage_key IS NOT NULL;
