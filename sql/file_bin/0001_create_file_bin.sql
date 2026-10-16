CREATE TABLE IF NOT EXISTS file_bin (
  id TEXT PRIMARY KEY,
  storage_key TEXT NOT NULL,
  source_field TEXT,
  source_doc_type TEXT,
  source_doc_id TEXT,
  account_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'deleted', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_file_bin_status ON file_bin(status);
CREATE INDEX IF NOT EXISTS idx_file_bin_created ON file_bin(created_at);
