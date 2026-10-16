CREATE TABLE IF NOT EXISTS vouchers (
  code TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  voucher_type TEXT NOT NULL,
  value REAL NOT NULL,
  remaining_value REAL,
  currency TEXT NOT NULL,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  max_uses_per_user INTEGER,
  applicable_to TEXT NOT NULL,
  country_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  starts_at INTEGER NOT NULL,
  ends_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_vouchers_status ON vouchers(status);
