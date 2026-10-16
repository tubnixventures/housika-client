CREATE TABLE IF NOT EXISTS client_audit_events (
  id TEXT PRIMARY KEY,
  account_id TEXT,
  action TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('success', 'failure')),
  reason_code TEXT,
  doc_id TEXT,
  metadata TEXT,
  ip TEXT,
  user_agent TEXT,
  trace_id TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_account ON client_audit_events(account_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON client_audit_events(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON client_audit_events(created_at);
