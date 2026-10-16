import { Env } from '../types/env';
import { generateId } from './ids';

export interface AuditParams {
  accountId?: string | null;
  action: string;
  result: 'success' | 'failure';
  reasonCode?: string;
  docId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  traceId?: string;
}

export async function recordAuditEvent(env: Env, params: AuditParams): Promise<void> {
  const id = generateId('audit');
  const now = Math.floor(Date.now() / 1000);
  const metaStr = params.metadata ? JSON.stringify(params.metadata) : null;

  if (env.DB_CLIENT_AUDIT) {
    try {
      await env.DB_CLIENT_AUDIT.prepare(
        `INSERT INTO client_audit_events 
          (id, account_id, action, result, reason_code, doc_id, metadata, ip, user_agent, trace_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          id,
          params.accountId ?? null,
          params.action,
          params.result,
          params.reasonCode ?? null,
          params.docId ?? null,
          metaStr,
          params.ip ?? null,
          params.userAgent ?? null,
          params.traceId ?? null,
          now
        )
        .run();
    } catch (e) {
      console.error('Audit write failed:', e);
    }
  }
}
