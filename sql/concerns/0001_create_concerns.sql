CREATE TABLE IF NOT EXISTS concerns (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  doc_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'acknowledged', 'resolved', 'dismissed')),
  metadata TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_concerns_account ON concerns(account_id);
CREATE INDEX IF NOT EXISTS idx_concerns_doc ON concerns(doc_id);
CREATE INDEX IF NOT EXISTS idx_concerns_reason ON concerns(reason);
CREATE INDEX IF NOT EXISTS idx_concerns_status ON concerns(status);
CREATE INDEX IF NOT EXISTS idx_concerns_created ON concerns(created_at);
