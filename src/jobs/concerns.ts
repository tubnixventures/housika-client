import { Env } from '../types/env';
import { generateId } from '../helpers/ids';

export interface ConcernParams {
  accountId: string;
  docId: string;
  reason: string;
  status?: 'open' | 'acknowledged' | 'resolved' | 'dismissed';
  metadata?: Record<string, unknown>;
}

export async function recordConcern(env: Env, params: ConcernParams): Promise<void> {
  const id = generateId('concern');
  const now = Math.floor(Date.now() / 1000);
  const metaStr = params.metadata ? JSON.stringify(params.metadata) : null;

  if (env.DB_CONCERNS) {
    try {
      await env.DB_CONCERNS.prepare(
        `INSERT INTO concerns (id, account_id, doc_id, reason, status, metadata, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          id,
          params.accountId,
          params.docId,
          params.reason,
          params.status || 'open',
          metaStr,
          now,
          now
        )
        .run();
    } catch (e) {
      console.error('Failed to record concern:', e);
    }
  }
}
