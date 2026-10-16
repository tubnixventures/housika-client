import { Env } from '../types/env';
import { generateId } from '../helpers/ids';
import { deleteStorageBlob } from '../connectors/storage';

export async function enqueueToFileBin(
  env: Env,
  key: string,
  field: string,
  docType: string,
  docId: string,
  accountId?: string
): Promise<void> {
  if (!key) return;
  const id = generateId('fb');
  const now = Math.floor(Date.now() / 1000);

  if (env.DB_FILE_BIN) {
    try {
      await env.DB_FILE_BIN.prepare(
        `INSERT INTO file_bin (id, storage_key, source_field, source_doc_type, source_doc_id, account_id, status, attempts, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, ?, ?)`
      ).bind(id, key, field, docType, docId, accountId || null, now, now).run();
    } catch (e) {
      console.error('Failed to enqueue file_bin:', e);
    }
  }
}

export async function processFileBinPurge(env: Env): Promise<{ purged: number; failed: number }> {
  let purged = 0;
  let failed = 0;
  if (!env.DB_FILE_BIN) return { purged, failed };

  const res = await env.DB_FILE_BIN.prepare(
    "SELECT id, storage_key, attempts FROM file_bin WHERE status = 'pending' LIMIT 50"
  ).all<any>();

  const rows = res.results || [];
  const now = Math.floor(Date.now() / 1000);

  for (const row of rows) {
    const success = await deleteStorageBlob(env, row.storage_key);
    if (success) {
      await env.DB_FILE_BIN.prepare(
        "UPDATE file_bin SET status = 'deleted', deleted_at = ?, updated_at = ? WHERE id = ?"
      ).bind(now, now, row.id).run();
      purged++;
    } else {
      await env.DB_FILE_BIN.prepare(
        'UPDATE file_bin SET attempts = attempts + 1, updated_at = ? WHERE id = ?'
      ).bind(now, row.id).run();
      failed++;
    }
  }

  return { purged, failed };
}
