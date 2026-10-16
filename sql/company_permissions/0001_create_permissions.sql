CREATE TABLE IF NOT EXISTS company_permissions (
  company_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  permission TEXT NOT NULL,
  assigned_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (company_id, account_id, permission)
);
CREATE INDEX IF NOT EXISTS idx_comp_perm_account 
  ON company_permissions(company_id, account_id);
